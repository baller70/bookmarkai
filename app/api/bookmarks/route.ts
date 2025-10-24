import { NextRequest, NextResponse } from 'next/server';
import { contentAnalysisService } from '@/lib/ai/content-analysis';
import { FaviconExtractor } from '@/lib/favicon-extractor';
import { getGoogleFaviconUrl } from '@/lib/favicon-utils';
import { embeddingService, VectorUtils } from '@/lib/ai/embeddings';
import { contentExtractor } from '@/lib/content-processing/content-extractor';
import { storageHelpers } from '@/lib/api-helpers/storage-helpers';
import { apiLogger as logger } from '@/lib/logger';
import { handleApiError } from '@/lib/api-helpers/error-handlers';

export const dynamic = 'force-dynamic';

// Initialize storage
const { supabase, writeClient, adminSupabase, USE_SUPABASE, USE_FILES_FALLBACK, isUuid, loadPriorityMap, setPriorityForId } = storageHelpers;

// Development user ID for testing
const DEV_USER_ID = '48e1b5b9-3b0f-4ccb-8b34-831b1337fc3f';

// --- Category similarity helpers ---
const normalize = (s?: string) => String(s || '').trim().toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ')

function diceCoefficient(a: string, b: string): number {
  a = normalize(a); b = normalize(b);
  if (!a || !b) return 0;
  if (a === b) return 1;
  const bigrams = (str: string) => {
    const res: string[] = [];
    for (let i = 0; i < str.length - 1; i++) res.push(str.slice(i, i + 2));
    return res;
  };
  const aB = bigrams(a), bB = bigrams(b);
  const counts = new Map<string, number>();
  for (const g of aB) counts.set(g, (counts.get(g) || 0) + 1);
  let inter = 0;
  for (const g of bB) {
    const c = counts.get(g) || 0;
    if (c > 0) { inter++; counts.set(g, c - 1); }
  }
  return (2 * inter) / (aB.length + bB.length);
}

async function chooseExistingCategoryOr(
  params: { userId?: string, aiCategory?: string | null, contextText: string }
): Promise<{ name: string; score: number } | null> {
  try {
    if (!USE_SUPABASE || !supabase) return null;

    const clauses = isUuid(params.userId) ? `user_id.eq.${params.userId},user_id.is.null` : 'user_id.is.null';
    const { data: cats, error } = await supabase
      .from('categories')
      .select('id,name,description,user_id')
      .or(clauses);
    if (error) return null;

    const categories = (cats || []) as Array<{ name: string; description?: string }>;
    if (categories.length === 0) return null;

    const aiCat = normalize(params.aiCategory || '');
    if (aiCat) {
      const exact = categories.find(c => normalize(c.name) === aiCat);
      if (exact) return { name: exact.name, score: 1 };
      const partial = categories
        .map(c => ({ c, s: diceCoefficient(c.name, params.aiCategory!) }))
        .sort((a, b) => b.s - a.s)[0];
      if (partial && partial.s >= 0.9) return { name: partial.c.name, score: partial.s };
    }

    try {
      const q = await embeddingService.createEmbedding({ text: params.contextText });
      let best: { name: string; score: number } | null = null;
      for (const c of categories) {
        const catText = `${c.name} ${c.description || ''}`.trim();
        const ce = await embeddingService.createEmbedding({ text: catText });
        const sim = VectorUtils.cosineSimilarity(q.embedding, ce.embedding);
        if (!best || sim > best.score) best = { name: c.name, score: sim };
      }
      if (best && best.score >= 0.78) return best;
    } catch (_e) {
      const best = categories
        .map(c => ({ name: c.name, score: diceCoefficient(params.contextText, c.name) }))
        .sort((a, b) => b.score - a.score)[0];
      if (best && best.score >= 0.82) return best;
    }
  } catch (_err) {
    // swallow and fall back
  }
  return null;
}

// Helper: Extract favicon with fallback
async function extractFavicon(url: string): Promise<string> {
  try {
    const result = await FaviconExtractor.extractFavicon(url);
    if (result.success && result.faviconUrl) {
      logger.info('Favicon extracted', { source: result.source, url: result.faviconUrl });
      return result.faviconUrl;
    }
    logger.warn('Favicon extraction failed', new Error(result.error || 'Unknown error'));
    return FaviconExtractor.generateFallbackFavicon(url);
  } catch (error) {
    logger.error('Favicon extraction error', error as Error);
    return FaviconExtractor.generateFallbackFavicon(url);
  }
}

// Helper: Run AI analysis for bookmark
async function analyzeBookmarkContent(
  url: string,
  title: string,
  description: string | undefined,
  userId: string,
  enableAI: boolean,
  provided: { summary?: string; tags?: string[]; category?: string }
): Promise<{ summary?: string; tags?: string[]; category?: string }> {
  if (!enableAI || (provided.summary && provided.tags)) {
    return provided;
  }

  try {
    const result = await contentAnalysisService.analyzeContent({ url, title, description, userId });
    logger.info('AI analysis successful', { category: result.aiCategory });
    return { 
      summary: result.aiSummary, 
      tags: result.aiTags, 
      category: result.aiCategory 
    };
  } catch (error) {
    logger.warn('AI analysis failed, using fallbacks', error as Error);
    return { 
      summary: description || '', 
      tags: provided.tags || [], 
      category: provided.category || 'General' 
    };
  }
}

// Helper: Transform bookmark for frontend
function transformBookmark(bookmark: any, priorityMap: Record<string, any>): any {
  return {
    id: bookmark.id,
    title: bookmark.title?.toUpperCase() || 'UNTITLED',
    url: bookmark.url,
    description: bookmark.description || bookmark.ai_summary || 'No description available',
    category: bookmark.category || bookmark.ai_category || 'General',
    folder_id: bookmark.folder_id ?? null,
    tags: bookmark.tags || bookmark.ai_tags || [],
    priority: priorityMap[String(bookmark.id)] ?? bookmark.priority ?? 'medium',
    isFavorite: Boolean(bookmark.is_favorite ?? bookmark.isFavorite),
    visits: bookmark.visits || 0,
    lastVisited: bookmark.visits > 0 ? new Date(bookmark.created_at).toLocaleDateString() : 'Never',
    dateAdded: new Date(bookmark.created_at).toLocaleDateString(),
    favicon: bookmark.custom_logo || bookmark.extracted_favicons?.[0]?.favicon_url || bookmark.favicon || getGoogleFaviconUrl(bookmark.url, 32),
    screenshot: "/placeholder.svg",
    circularImage: bookmark.custom_logo || getGoogleFaviconUrl(bookmark.url, 32),
    custom_logo: bookmark.custom_logo,
    logo: "",
    notes: bookmark.notes || 'No notes',
    timeSpent: bookmark.time_spent ? `${bookmark.time_spent}m` : '0m',
    weeklyVisits: 0,
    siteHealth: bookmark.site_health || 'unknown',
    site_health: bookmark.site_health || 'unknown',
    healthCheckCount: bookmark.healthCheckCount || 0,
    last_health_check: bookmark.last_health_check,
    customBackground: bookmark.custom_background ?? bookmark.customBackground ?? null,
    project: { 
      name: bookmark.ai_category || bookmark.category || "GENERAL", 
      progress: 0, 
      status: "Active" 
    },
    relatedBookmarks: bookmark.related_bookmarks || bookmark.relatedBookmarks || [],
    ai_summary: bookmark.ai_summary || null,
    ai_tags: bookmark.ai_tags || [],
    ai_category: bookmark.ai_category || null,
  };
}

// Helper: Upsert category if needed
async function ensureCategoryExists(categoryName: string, userId: string) {
  if (!USE_SUPABASE || !writeClient) return;

  try {
    const isUserOwned = isUuid(userId);
    
    // Check if category already exists
    let existingCategory: any = null;
    if (isUserOwned) {
      const { data } = await writeClient
        .from('categories')
        .select('id, name, user_id')
        .eq('user_id', userId)
        .eq('name', categoryName)
        .limit(1)
        .maybeSingle();
      existingCategory = data;
    }
    
    if (!existingCategory) {
      const { data } = await writeClient
        .from('categories')
        .select('id, name, user_id')
        .is('user_id', null)
        .eq('name', categoryName)
        .limit(1)
        .maybeSingle();
      existingCategory = data;
    }

    if (existingCategory) {
      logger.info('Category already exists', { category: categoryName });
      return;
    }

    // Create new category
    const payload = {
      user_id: isUserOwned ? userId : null,
      name: categoryName,
      description: '',
      color: '#3B82F6'
    };

    let result = await writeClient
      .from('categories')
      .upsert(payload, { onConflict: 'user_id,name' });

    // Fallback to null user_id if FK constraint fails
    if (result.error && (result.error.code === '23503' || result.error.code === '42501')) {
      logger.info('Category upsert failed, retrying with null user_id');
      result = await writeClient
        .from('categories')
        .upsert({ ...payload, user_id: null }, { onConflict: 'user_id,name' });
    }

    if (result.error) {
      logger.warn('Category upsert failed', { error: result.error.message });
    } else {
      logger.info('Category created successfully', { category: categoryName });
    }
  } catch (error) {
    logger.warn('Category upsert exception', error as Error);
  }
}

logger.info('Bookmarks API initialized', { USE_SUPABASE, USE_FILES_FALLBACK });

export async function GET(request: NextRequest) {
  try {
    logger.info('Fetching bookmarks');

    const { searchParams } = new URL(request.url);
    const allCategories = searchParams.get('all_categories') === 'true';
    const userId = DEV_USER_ID;

    if (USE_SUPABASE && supabase) {
      // Fetch from both user_bookmarks and bookmarks tables
      const [{ data: userBookmarks, error: userErr }, { data: legacyBookmarks, error: legacyErr }] = await Promise.all([
        supabase
          .from('user_bookmarks')
          .select('*')
          .or(`user_id.eq.${userId},user_id.is.null`)
          .order('created_at', { ascending: false }),
        supabase
          .from('bookmarks')
          .select('*')
          .or(`user_id.eq.${userId},user_id.is.null`)
          .order('created_at', { ascending: false })
      ]);

      if (userErr) logger.warn('User bookmarks fetch warning', { error: userErr.message });
      if (legacyErr) logger.warn('Legacy bookmarks fetch warning', { error: legacyErr.message });

      // Merge bookmarks, preferring newer timestamps
      const byId: Record<string, any> = {};
      for (const b of (legacyBookmarks || [])) {
        byId[String(b.id)] = b;
      }
      for (const b of (userBookmarks || [])) {
        const key = String(b.id);
        const existing = byId[key];
        if (!existing) {
          byId[key] = b;
          continue;
        }
        const tA = new Date(existing.updated_at || existing.created_at || 0).getTime();
        const tB = new Date(b.updated_at || b.created_at || 0).getTime();
        if (isFinite(tB) && (tB >= tA || !isFinite(tA))) {
          byId[key] = b;
        }
      }
      
      const unified = Object.values(byId).sort((a: any, b: any) => 
        new Date(b.updated_at || b.created_at || 0).getTime() - new Date(a.updated_at || a.created_at || 0).getTime()
      );

      logger.info('Unified bookmarks loaded', { count: unified.length });

      if (allCategories) {
        const uniqueCategories = [...new Set(unified.map(b => b.category).filter(Boolean))].sort();
        return NextResponse.json(
          { success: true, categories: uniqueCategories, total: uniqueCategories.length },
          { headers: { 'Cache-Control': 'no-store' } }
        );
      }

      const priorityMap = await loadPriorityMap().catch(() => ({}));
      const transformedBookmarks = unified.map((b: any) => transformBookmark(b, priorityMap));

      return NextResponse.json(
        { success: true, bookmarks: transformedBookmarks, total: transformedBookmarks.length },
        { headers: { 'Cache-Control': 'no-store' } }
      );

    } else if (USE_FILES_FALLBACK) {
      const allBookmarks = await storageHelpers.loadFromFile('bookmarks');
      const userBookmarks = allBookmarks.filter((bookmark: any) => bookmark.user_id === userId);

      if (allCategories) {
        const uniqueCategories = [...new Set(allBookmarks.map((b: any) => b.category).filter(Boolean))].sort();
        return NextResponse.json(
          { success: true, categories: uniqueCategories, total: uniqueCategories.length },
          { headers: { 'Cache-Control': 'no-store' } }
        );
      }

      const priorityMap = await loadPriorityMap().catch(() => ({}));
      const transformedBookmarks = userBookmarks.map((b: any) => transformBookmark(b, priorityMap));

      return NextResponse.json(
        { success: true, bookmarks: transformedBookmarks, total: transformedBookmarks.length },
        { headers: { 'Cache-Control': 'no-store' } }
      );
    }

    return NextResponse.json({ error: 'No storage method configured' }, { status: 500 });

  } catch (error) {
    return handleApiError(error, 'GET /api/bookmarks');
  }
}

export async function POST(request: NextRequest) {
  try {
    logger.info('Creating/updating bookmark');

    const body = await request.json();
    let { 
      id, 
      title, 
      url, 
      description, 
      category, 
      tags, 
      priority, 
      ai_summary, 
      ai_tags, 
      ai_category, 
      notes, 
      customBackground, 
      relatedBookmarks, 
      isFavorite, 
      enableAI = true, 
      custom_favicon, 
      custom_logo, 
      custom_background, 
      user_id 
    } = body;

    const userId = user_id || DEV_USER_ID;
    const hasCustomFavicon = Object.prototype.hasOwnProperty.call(body, 'custom_favicon');
    const hasCustomLogo = Object.prototype.hasOwnProperty.call(body, 'custom_logo');
    const hasCustomBackground = Object.prototype.hasOwnProperty.call(body, 'custom_background');

    // AI Workaround: Generate title from URL if missing
    if (enableAI && url && !title) {
      logger.info('Title missing, generating from URL');
      try {
        const summary = await contentExtractor.extractSummary(url);
        title = summary.title || summary.siteName || new URL(url).hostname.replace('www.', '');
        
        try {
          const result = await contentAnalysisService.analyzeContent({ url, title, description, userId });
          ai_summary = result.aiSummary;
          ai_tags = result.aiTags;
          ai_category = result.aiCategory;
        } catch (inner) {
          logger.warn('AI analysis for tags/category failed', { error: inner });
        }
      } catch (e) {
        logger.warn('Title extraction failed', { error: e });
        try {
          title = new URL(url).hostname.replace('www.', '');
        } catch {
          title = 'Untitled Bookmark';
        }
      }
    }

    // Validate required fields for creation
    if (!id && (!title || !url)) {
      return NextResponse.json(
        { error: 'Title and URL are required for creation' },
        { status: 400 }
      );
    }

    if (USE_SUPABASE && supabase) {
      if (id) {
        // UPDATE existing bookmark
        logger.info('Updating bookmark', { id, userId });

        const updates: Record<string, any> = { updated_at: new Date().toISOString() };

        if (typeof title !== 'undefined') updates.title = title;
        if (typeof url !== 'undefined') {
          updates.url = url;
          updates.favicon = await extractFavicon(url);
        }
        if (typeof description !== 'undefined') updates.description = description || ai_summary || '';
        if (typeof category !== 'undefined' || typeof ai_category !== 'undefined') updates.category = ai_category || category || 'General';
        if (typeof tags !== 'undefined' || typeof ai_tags !== 'undefined') updates.tags = tags || ai_tags || [];
        if (typeof ai_summary !== 'undefined') updates.ai_summary = ai_summary;
        if (typeof ai_tags !== 'undefined') updates.ai_tags = ai_tags || [];
        if (typeof ai_category !== 'undefined') updates.ai_category = ai_category;
        if (typeof notes !== 'undefined') updates.notes = notes || '';
        if (typeof isFavorite !== 'undefined') updates.is_favorite = Boolean(isFavorite);
        if (typeof priority !== 'undefined') updates.priority = priority;
        if (relatedBookmarks && Array.isArray(relatedBookmarks)) updates.related_bookmarks = relatedBookmarks;
        if (hasCustomFavicon) updates.custom_favicon = custom_favicon ?? null;
        if (hasCustomLogo) updates.custom_logo = custom_logo ?? null;
        if (hasCustomBackground) updates.custom_background = custom_background ?? null;

        // Update in appropriate table
        const [{ data: ubRow }, { data: legacyRow }] = await Promise.all([
          supabase.from('user_bookmarks').select('id').eq('id', id).limit(1).maybeSingle(),
          supabase.from('bookmarks').select('id').eq('id', id).limit(1).maybeSingle(),
        ]);

        const db = adminSupabase || supabase;
        const table = ubRow ? 'user_bookmarks' : 'bookmarks';
        
        const { data, error } = await db
          .from(table)
          .update(updates)
          .eq('id', id)
          .select('*')
          .maybeSingle();

        // Handle missing columns gracefully
        if (error && (error.message?.includes('related_bookmarks') || error.message?.includes('priority'))) {
          const updatesWithoutMissing = { ...updates };
          delete updatesWithoutMissing.related_bookmarks;
          if (error.message?.includes('priority')) {
            const requestedPriority = updatesWithoutMissing.priority;
            delete updatesWithoutMissing.priority;
            if (requestedPriority) await setPriorityForId(id, requestedPriority);
          }

          const { data: retryData, error: retryError } = await db
            .from(table)
            .update(updatesWithoutMissing)
            .eq('id', id)
            .select('*')
            .maybeSingle();

          if (retryError) {
            logger.error('Bookmark update failed', retryError as Error);
            return NextResponse.json({ error: 'Failed to update bookmark' }, { status: 500 });
          }

          logger.info('Bookmark updated successfully', { id });
          return NextResponse.json({ success: true, bookmark: retryData, message: 'Bookmark updated successfully' });
        }

        if (error) {
          logger.error('Bookmark update failed', error as Error);
          return NextResponse.json({ error: 'Failed to update bookmark' }, { status: 500 });
        }

        logger.info('Bookmark updated successfully', { id });
        return NextResponse.json({ success: true, bookmark: data, message: 'Bookmark updated successfully' });

      } else {
        // CREATE new bookmark
        logger.info('Creating new bookmark', { title, url });

        // Run AI analysis
        const ai = await analyzeBookmarkContent(
          url,
          title,
          description,
          userId,
          enableAI,
          { summary: ai_summary, tags: ai_tags, category: ai_category }
        );

        // Determine final category with similarity check
        const contextParts = [title, description, ai.summary, (ai.tags || []).join(' '), url].filter(Boolean);
        const contextText = contextParts.join(' \n ');
        
        let finalCategory = category;
        try {
          const match = await chooseExistingCategoryOr({ userId, aiCategory: ai.category || category, contextText });
          if (match?.name) {
            finalCategory = match.name;
          } else if (!finalCategory && ai.category) {
            finalCategory = ai.category;
          }
        } catch {
          if (!finalCategory && ai.category) finalCategory = ai.category;
        }

        // Extract favicon
        const faviconUrl = await extractFavicon(url);

        // Build insert payload
        const insertPayload: any = {
          user_id: isUuid(userId) ? userId : null,
          title,
          url,
          description: description || ai.summary || '',
          category: finalCategory || 'General',
          is_favorite: isFavorite || false,
          priority: priority || 'medium',
          favicon: faviconUrl,
          custom_logo: custom_logo || null,
          tags: Array.isArray(tags) && tags.length > 0 ? tags : (Array.isArray(ai.tags) ? ai.tags : []),
        };

        if (relatedBookmarks && Array.isArray(relatedBookmarks)) {
          insertPayload.related_bookmarks = relatedBookmarks;
        }

        const db = adminSupabase || supabase;
        let { data, error } = await db
          .from('bookmarks')
          .insert(insertPayload)
          .select('*')
          .single();

        // Handle missing columns or FK constraints
        if (error) {
          logger.warn('Initial insert failed, trying fallbacks', { error: error.message });
          
          if (error.message?.includes('related_bookmarks') || error.message?.includes('priority')) {
            const payloadWithoutMissing = { ...insertPayload };
            const requestedPriority = payloadWithoutMissing.priority;
            delete payloadWithoutMissing.related_bookmarks;
            delete payloadWithoutMissing.priority;

            const { data: retryData, error: retryError } = await db
              .from('bookmarks')
              .insert(payloadWithoutMissing)
              .select('*')
              .single();

            if (!retryError && retryData && requestedPriority) {
              await setPriorityForId(retryData.id, requestedPriority);
              data = retryData;
              error = null;
            } else {
              error = retryError;
            }
          }

          // Handle FK constraint by seeding profile
          if (error && error.code === '23503' && isUuid(userId)) {
            logger.info('Seeding dev profile for FK constraint');
            try {
              await db.from('profiles').insert({ id: userId }).select('id').single();
            } catch (e) {
              // Ignore if profile already exists
            }
            
            const { data: retryData, error: retryError } = await db
              .from('bookmarks')
              .insert(insertPayload)
              .select('*')
              .single();
            
            if (!retryError) {
              data = retryData;
              error = null;
            }
          }

          // Fallback to null user_id
          if (error && (error.code === '23503' || error.code === '42501')) {
            logger.info('Falling back to null user_id');
            const { data: retryData, error: retryError } = await db
              .from('bookmarks')
              .insert({ ...insertPayload, user_id: null })
              .select('*')
              .single();
            
            if (!retryError) {
              await ensureCategoryExists(insertPayload.category || 'General', userId);
              logger.info('Bookmark created successfully with null user_id', { id: retryData.id });
              return NextResponse.json({ success: true, bookmark: retryData, message: 'Bookmark created successfully' });
            }
          }

          if (error) {
            logger.error('Bookmark creation failed', error as Error);
            return NextResponse.json({ error: 'Failed to create bookmark', details: error.message }, { status: 500 });
          }
        }

        // Upsert category
        await ensureCategoryExists(insertPayload.category || 'General', userId);

        // Store favicon in extracted_favicons table
        if (faviconUrl && data?.id) {
          try {
            await db
              .from('extracted_favicons')
              .insert({ bookmark_id: data.id, favicon_url: faviconUrl, extraction_date: new Date().toISOString() });
            logger.info('Favicon stored successfully');
          } catch (err) {
            logger.warn('Favicon storage failed', err as Error);
          }
        }

        // Persist priority to file fallback
        if (typeof priority !== 'undefined' && data?.id) {
          try {
            await setPriorityForId(data.id, priority);
          } catch (e) {
            // Ignore priority storage errors
          }
        }

        logger.info('Bookmark created successfully', { id: data.id });
        return NextResponse.json({ success: true, bookmark: data, message: 'Bookmark created successfully' });
      }

    } else if (USE_FILES_FALLBACK) {
      const allBookmarks = await storageHelpers.loadFromFile('bookmarks');

      if (id) {
        // UPDATE
        const existing = allBookmarks.find((b: any) => b.id === id && b.user_id === userId);
        if (!existing) {
          return NextResponse.json({ error: 'Bookmark not found' }, { status: 404 });
        }

        const updated = {
          ...existing,
          title: title ?? existing.title,
          url: url ?? existing.url,
          description: description ?? existing.description,
          category: category ?? existing.category,
          tags: tags ?? existing.tags,
          priority: priority ?? existing.priority,
          updated_at: new Date().toISOString()
        };

        if (url) updated.favicon = await extractFavicon(url);
        if (hasCustomFavicon) updated.custom_favicon = custom_favicon ?? null;
        if (hasCustomLogo) updated.custom_logo = custom_logo ?? null;
        if (hasCustomBackground) updated.custom_background = custom_background ?? null;

        const index = allBookmarks.findIndex((b: any) => b.id === id);
        if (index > -1) allBookmarks[index] = updated;
        
        await storageHelpers.saveToFile('bookmarks', allBookmarks);
        return NextResponse.json({ success: true, bookmark: updated, message: 'Bookmark updated successfully' });

      } else {
        // CREATE
        const ai = await analyzeBookmarkContent(url, title, description, userId, enableAI, 
          { summary: ai_summary, tags: ai_tags, category: ai_category });

        const faviconUrl = await extractFavicon(url);
        const newId = Math.max(0, ...allBookmarks.map((b: any) => b.id)) + 1;

        const newBookmark = {
          id: newId,
          user_id: userId,
          title,
          url,
          description: description || ai.summary || '',
          category: category || ai.category || 'General',
          tags: tags || ai.tags || [],
          priority: priority || 'medium',
          favicon: faviconUrl,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        allBookmarks.push(newBookmark);
        await storageHelpers.saveToFile('bookmarks', allBookmarks);
        return NextResponse.json({ success: true, bookmark: newBookmark, message: 'Bookmark created successfully' });
      }
    }

    return NextResponse.json({ error: 'No storage method available' }, { status: 500 });

  } catch (error) {
    return handleApiError(error, 'POST /api/bookmarks');
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const bookmarkId = searchParams.get('id');

    if (!bookmarkId) {
      return NextResponse.json({ error: 'Bookmark ID is required' }, { status: 400 });
    }

    const userId = DEV_USER_ID;
    logger.info('Deleting bookmark', { id: bookmarkId, userId });

    if (USE_SUPABASE && supabase) {
      const db = adminSupabase || supabase;
      let totalDeleted = 0;

      // Delete from both tables
      for (const table of ['user_bookmarks', 'bookmarks']) {
        try {
          const { data, error } = await db
            .from(table as any)
            .delete()
            .eq('id', bookmarkId)
            .or(`user_id.eq.${userId},user_id.is.null`)
            .select('*');

          if (!error && data) {
            totalDeleted += data.length;
          } else if (error) {
            logger.warn(`Delete from ${table} failed`, { error: error.message });
          }
        } catch (e) {
          logger.warn(`Exception deleting from ${table}`, { error: e });
        }
      }

      if (totalDeleted > 0) {
        logger.info('Bookmark deleted successfully', { id: bookmarkId, count: totalDeleted });
        return NextResponse.json({ success: true, message: 'Bookmark deleted successfully' });
      }

      logger.warn('No rows deleted', { id: bookmarkId });
      return NextResponse.json({ error: 'Bookmark not found or access denied' }, { status: 404 });

    } else if (USE_FILES_FALLBACK) {
      const allBookmarks = await storageHelpers.loadFromFile('bookmarks');
      const updated = allBookmarks.filter((b: any) => 
        !(String(b.id) === String(bookmarkId) && (b.user_id === userId || b.user_id === null))
      );

      if (updated.length === allBookmarks.length) {
        return NextResponse.json({ error: 'Bookmark not found' }, { status: 404 });
      }

      await storageHelpers.saveToFile('bookmarks', updated);
      logger.info('Bookmark deleted successfully (file)', { id: bookmarkId });
      return NextResponse.json({ success: true, message: 'Bookmark deleted successfully' });
    }

    return NextResponse.json({ error: 'No storage method available' }, { status: 500 });

  } catch (error) {
    return handleApiError(error, 'DELETE /api/bookmarks');
  }
}
