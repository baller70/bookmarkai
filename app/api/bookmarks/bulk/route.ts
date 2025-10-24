import { NextRequest, NextResponse } from 'next/server';
import { writeFile, readFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { authenticateUser, createUnauthorizedResponse } from '@/lib/auth-utils';
import { createClient } from '@/lib/supabase';
// import { performAIAnalysis } from '../../../../lib/ai/content-analysis';

// File-based storage for persistent bookmarks
export const dynamic = 'force-dynamic';

const BOOKMARKS_FILE = join(process.cwd(), 'data', 'bookmarks.json');

// Initialize Supabase client with proper fallback
const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim()
const anonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim()
const serviceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim()

// Check if we should use Supabase
const USE_SUPABASE = Boolean(
  supabaseUrl && (anonKey || serviceRoleKey) &&
  !anonKey.includes('dev-placeholder') &&
  !serviceRoleKey.includes('dev-placeholder-service-key')
)

let supabase: any = null
let adminSupabase: any = null
if (USE_SUPABASE) {
  supabase = createClient(supabaseUrl, serviceRoleKey || anonKey)
  if (serviceRoleKey) {
    adminSupabase = createClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } })
  }
}

console.log('🔧 Bulk API Storage Configuration:')
console.log('📊 USE_SUPABASE:', USE_SUPABASE)
console.log('📁 USE_FILES_FALLBACK:', !USE_SUPABASE)


// Bulk upload history (file-based) for import action
const BULK_HISTORY_FILE = join(process.cwd(), 'data', 'bulk_upload_history.json')

interface BulkHistoryLinkEntry { url: string; title?: string; status: 'saved' | 'failed' | 'duplicate' }
interface BulkHistoryRecord { id: string; user_id: string; created_at: string; total: number; success: number; failed: number; links: BulkHistoryLinkEntry[] }

const genId = () => Math.random().toString(36).slice(2, 11)

async function loadBulkHistory(): Promise<BulkHistoryRecord[]> {
  try {
    const data = await readFile(BULK_HISTORY_FILE, 'utf8')
    return JSON.parse(data) as BulkHistoryRecord[]
  } catch {
    return []
  }
}

async function saveBulkHistory(records: BulkHistoryRecord[]): Promise<void> {
  await mkdir(join(process.cwd(), 'data'), { recursive: true })
  await writeFile(BULK_HISTORY_FILE, JSON.stringify(records, null, 2))
}

async function appendBulkHistory(record: BulkHistoryRecord): Promise<void> {
  const all = await loadBulkHistory()
  all.push(record)
  await saveBulkHistory(all)
}

interface Bookmark {
  id: number;
  user_id: string;
  title: string;
  url: string;
  description: string;
  category: string;
  tags?: string[];
  ai_summary?: string;
  ai_tags?: string[];
  ai_category?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  site_health?: 'excellent' | 'working' | 'fair' | 'poor' | 'broken';
  last_health_check?: string;
  healthCheckCount?: number;
  customBackground?: string;
  visits?: number;
  time_spent?: number;
  relatedBookmarks?: number[];
}

interface ImportBookmark {
  title: string;
  url: string;
  description?: string;
  category?: string;
  tags?: string[];
  notes?: string;
}

interface BulkOperationResult {
}

// ----- Bulk Import Title Normalization Helpers -----
const MAX_TITLE_LEN = 24

function toTitleCase(input: string): string {
  try {
    const cleaned = input.replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim()
    return cleaned
      .split(' ')
      .filter(Boolean)
      .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ')
  } catch { return input }
}

function extractSiteNameFromUrl(url: string): string {
  try {
    const u = new URL(url)
    let host = u.hostname.toLowerCase()
    if (host.startsWith('www.')) host = host.slice(4)
    const parts = host.split('.')
    // Heuristic: pick the registrable part (second-level), handle common ccTLD patterns
    const secondLast = parts[parts.length - 2] || parts[0]
    const thirdLast = parts[parts.length - 3]
    const commonSecondLevel = new Set(['co', 'com', 'net', 'org', 'gov', 'edu'])
    let base = secondLast
    if (commonSecondLevel.has(secondLast) && thirdLast) base = thirdLast
    return toTitleCase(base)
  } catch {
    return 'Website'
  }
}

function clampTitle(s: string): string {
  if (!s) return s
  const trimmed = s.trim().replace(/\s+/g, ' ')
  return trimmed.length > MAX_TITLE_LEN ? trimmed.slice(0, MAX_TITLE_LEN).trim() : trimmed
}

function generateCleanBulkTitle(rawTitle: string | undefined, url: string): string {
  const site = extractSiteNameFromUrl(url)
  if (!rawTitle || rawTitle.trim().length === 0) {
    return clampTitle(site)
  }
  // Prefer site name over verbose titles with separators (" - ", " | ", etc.)
  const firstSegment = rawTitle.split(/\s*[\-|–—|:·•]+\s*/)[0].trim()
  const useRaw = firstSegment.length <= MAX_TITLE_LEN &&
    (firstSegment.toLowerCase() === site.toLowerCase() || firstSegment.split(' ').length <= 2)
  const candidate = useRaw ? firstSegment : site
  return clampTitle(candidate)
}
// ----- End Helpers -----

// ----- Category Matching Helpers (conservative semantic-ish matching) -----
function normalizeCategoryName(s: string): string {
  return (s || '').toString().trim().toLowerCase()
}

function tokenize(text: string): string[] {
  return (text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 1)
}

function jaccardSimilarity(aText: string, bText: string): number {
  const a = new Set(tokenize(aText))
  const b = new Set(tokenize(bText))
  if (a.size === 0 || b.size === 0) return 0
  let inter = 0
  a.forEach(t => { if (b.has(t)) inter++ })
  const union = a.size + b.size - inter
  return union === 0 ? 0 : inter / union
}

async function loadExistingCategoryNames(userId: string): Promise<string[]> {
  try {
    if (USE_SUPABASE && supabase) {
      let names: string[] = []
      // Prefer user categories when available
      const { data: userCats, error: e1 } = await supabase
        .from('categories')
        .select('name,user_id')
        .eq('user_id', userId)
      if (!e1 && Array.isArray(userCats)) names.push(...userCats.map((c: any) => c.name || ''))
      const { data: globalCats, error: e2 } = await supabase
        .from('categories')
        .select('name,user_id')
        .is('user_id', null)
      if (!e2 && Array.isArray(globalCats)) names.push(...globalCats.map((c: any) => c.name || ''))
      // Deduplicate and drop empties
      return Array.from(new Set(names.map((n) => n?.toString().trim()).filter(Boolean)))
    }
  } catch {}

  // File fallback (if categories.json exists)
  try {
    const CATEGORIES_FILE = join(process.cwd(), 'data', 'categories.json')
    if (existsSync(CATEGORIES_FILE)) {
      const raw = await readFile(CATEGORIES_FILE, 'utf-8')
      const arr = JSON.parse(raw)
      return Array.from(new Set((arr || []).map((c: any) => (c?.name || '').toString().trim()).filter(Boolean)))
    }
  } catch {}
  return []
}

function pickBestCategoryFor(candidates: string[], existingNames: string[]): { name?: string, score: number } {
  let bestName: string | undefined
  let bestScore = 0
  const existing = existingNames.filter(Boolean)
  for (const cand of candidates) {
    if (!cand) continue
    for (const name of existing) {
      const score = jaccardSimilarity(cand, name)
      if (score > bestScore) {
        bestScore = score
        bestName = name
      }
    }
  }
  return { name: bestName, score: bestScore }
}
// ----- End Category Matching Helpers -----


interface BulkOperationResult {

  success: boolean;
  total: number;
  processed: number;
  failed: number;
  errors: string[];
  data?: any;
  message: string;
  processing_time_ms: number;
}

// Ensure data directory exists
async function ensureDataDirectory() {
  const dataDir = join(process.cwd(), 'data');
  if (!existsSync(dataDir)) {
    await mkdir(dataDir, { recursive: true });
  }
}

// Load bookmarks from file
async function loadBookmarks(): Promise<Bookmark[]> {
  try {
    await ensureDataDirectory();
    if (!existsSync(BOOKMARKS_FILE)) {
      return [];
    }
    const data = await readFile(BOOKMARKS_FILE, 'utf-8');
    return JSON.parse(data) as Bookmark[];
  } catch (error) {
    console.error('Error loading bookmarks:', error);
    return [];
  }
}

// Save bookmarks to file
async function saveBookmarks(bookmarks: Bookmark[]): Promise<void> {
  try {
    await ensureDataDirectory();
    await writeFile(BOOKMARKS_FILE, JSON.stringify(bookmarks, null, 2));
  } catch (error) {
    console.error('Error saving bookmarks:', error);
    throw error;
  }
}

// Validate bookmark data
function validateBookmark(bookmark: ImportBookmark): { valid: boolean; error?: string } {
  if (!bookmark.title || bookmark.title.trim().length === 0) {
    return { valid: false, error: 'Title is required' };
  }

  if (!bookmark.url || bookmark.url.trim().length === 0) {
    return { valid: false, error: 'URL is required' };
  }

  // Basic URL validation
  try {
    new URL(bookmark.url);
  } catch {
    return { valid: false, error: 'Invalid URL format' };
  }

  return { valid: true };
}

// Generate unique ID for new bookmark
function generateBookmarkId(existingBookmarks: Bookmark[]): number {
  return Math.max(0, ...existingBookmarks.map(b => b.id)) + 1;
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    const authResult = await authenticateUser(request);
    if (!authResult.success) {
      return createUnauthorizedResponse(authResult.error);
    }
    const userId = authResult.userId!;

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const format = searchParams.get('format') || 'json';

    if (action === 'export') {
      console.log(`📤 Exporting bookmarks for user: ${userId} in format: ${format}`);

      const allBookmarks = await loadBookmarks();
      const userBookmarks = allBookmarks.filter(bookmark => bookmark.user_id === userId);

      if (format === 'json') {
        const exportData = {
          version: '1.0',
          exported_at: new Date().toISOString(),
          user_id: userId,
          total_bookmarks: userBookmarks.length,
          bookmarks: userBookmarks.map(bookmark => ({
            title: bookmark.title,
            url: bookmark.url,
            description: bookmark.description,
            category: bookmark.category,
            tags: bookmark.tags || [],
            notes: bookmark.notes,
            created_at: bookmark.created_at,
            updated_at: bookmark.updated_at,
            ai_summary: bookmark.ai_summary,
            ai_tags: bookmark.ai_tags,
            ai_category: bookmark.ai_category
          }))
        };

        const result: BulkOperationResult = {
          success: true,
          total: userBookmarks.length,
          processed: userBookmarks.length,
          failed: 0,
          errors: [],
          data: exportData,
          message: `Successfully exported ${userBookmarks.length} bookmarks`,
          processing_time_ms: Date.now() - startTime
        };

        return NextResponse.json(result);
      }

      if (format === 'html') {
        // Export as Netscape Bookmark File Format (compatible with browsers)
        const htmlContent = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<!-- This is an automatically generated file. -->
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Bookmarks</TITLE>
<H1>Bookmarks</H1>
<DL><p>
${userBookmarks.map(bookmark =>
  `    <DT><A HREF="${bookmark.url}" ADD_DATE="${Math.floor(new Date(bookmark.created_at).getTime() / 1000)}"${bookmark.tags?.length ? ` TAGS="${bookmark.tags.join(',')}"` : ''}>${bookmark.title}</A>${bookmark.description ? `\n    <DD>${bookmark.description}` : ''}`
).join('\n')}
</DL><p>`;

        const result: BulkOperationResult = {
          success: true,
          total: userBookmarks.length,
          processed: userBookmarks.length,
          failed: 0,
          errors: [],
          data: { html: htmlContent },
          message: `Successfully exported ${userBookmarks.length} bookmarks as HTML`,
          processing_time_ms: Date.now() - startTime
        };

        return NextResponse.json(result);
      }

      return NextResponse.json(
        { error: 'Unsupported export format. Use json or html.' },
        { status: 400 }
      );
    }

    if (action === 'stats') {
      console.log(`📊 Getting bulk operation stats for user: ${userId}`);

      const allBookmarks = await loadBookmarks();
      const userBookmarks = allBookmarks.filter(bookmark => bookmark.user_id === userId);

      const stats = {
        total_bookmarks: userBookmarks.length,
        categories: [...new Set(userBookmarks.map(b => b.category).filter(Boolean))],
        tags: [...new Set(userBookmarks.flatMap(b => b.tags || []))],
        date_range: {
          oldest: userBookmarks.length > 0 ? Math.min(...userBookmarks.map(b => new Date(b.created_at).getTime())) : null,
          newest: userBookmarks.length > 0 ? Math.max(...userBookmarks.map(b => new Date(b.created_at).getTime())) : null
        },
        site_health_distribution: userBookmarks.reduce((acc, b) => {
          const health = b.site_health || 'unknown';
          acc[health] = (acc[health] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      };

      const result: BulkOperationResult = {
        success: true,
        total: userBookmarks.length,
        processed: userBookmarks.length,
        failed: 0,
        errors: [],
        data: stats,
        message: `Successfully retrieved stats for ${userBookmarks.length} bookmarks`,
        processing_time_ms: Date.now() - startTime
      };

      return NextResponse.json(result);
    }

    return NextResponse.json(
      {
        error: 'Invalid action. Use action=export&format=json|html or action=stats',
        available_actions: ['export', 'stats'],
        available_formats: ['json', 'html']
      },
      { status: 400 }
    );

  } catch (error) {
    console.error('Bulk operation error:', error);

    const result: BulkOperationResult = {
      success: false,
      total: 0,
      processed: 0,
      failed: 1,
      errors: [(error as Error).message],
      message: 'Bulk operation failed',
      processing_time_ms: Date.now() - startTime
    };

    return NextResponse.json(result, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const authResult = await authenticateUser(request);
    let userId: string;
    if (!authResult.success) {
      // Unconditional fallback to the same dev/test user as /api/bookmarks so the UI works unauthenticated
      userId = '48e1b5b9-3b0f-4ccb-8b34-831b1337fc3f';
      console.log('🔓 AUTH FALLBACK (bulk): using dev userId', userId);
    } else {
      userId = authResult.userId!;
    }

    const body = await request.json();
    const { action, bookmarks: importBookmarks, bookmark_ids } = body;

    if (action === 'import') {
      console.log(`📥 Importing ${importBookmarks?.length || 0} bookmarks for user: ${userId}`);

      if (!importBookmarks || !Array.isArray(importBookmarks)) {
        return NextResponse.json(
          { error: 'bookmarks array is required for import action' },
          { status: 400 }
        );
      }

      const allBookmarks = await loadBookmarks();

              // Preload existing categories and prepare decision log
              const existingCategoryNames = await loadExistingCategoryNames(userId)
              const categoryDecisions: Array<{ url: string; chosen: string; strategy: 'matched_existing' | 'fallback_new'; matched?: string; sim?: number }> = []

      const errors: string[] = [];
      const processedBookmarks: Bookmark[] = [];
      let failed = 0;

      for (let i = 0; i < importBookmarks.length; i++) {
        const importBookmark = importBookmarks[i];
        const validation = validateBookmark(importBookmark);

        if (!validation.valid) {
          errors.push(`Bookmark ${i + 1}: ${validation.error}`);
          failed++;
          continue;
        }

        // Check for duplicates (same URL for same user)
        const existingBookmark = allBookmarks.find(b =>
          b.user_id === userId && b.url === importBookmark.url
        );

        if (existingBookmark) {
          errors.push(`Bookmark ${i + 1}: URL already exists - ${importBookmark.url}`);
          failed++;
          continue;
        }

        // Category decision: prefer existing similar category names to reduce proliferation
        const siteName = extractSiteNameFromUrl(importBookmark.url)
        const rawCandidate = typeof importBookmark.category === 'string' ? importBookmark.category.trim() : ''
        const titleText = typeof importBookmark.title === 'string' ? importBookmark.title : ''
        const best = pickBestCategoryFor([rawCandidate, siteName, titleText].filter(Boolean) as string[], existingCategoryNames)
        const threshold = 0.78 // conservative
        const matchedName = best.name ? String(best.name) : undefined
        const chosenCategory = (matchedName && best.score >= threshold && normalizeCategoryName(matchedName) !== 'general')
          ? matchedName
          : (rawCandidate || 'General')

        // Log decision for UI feedback
        categoryDecisions.push({
          url: String(importBookmark.url),
          chosen: chosenCategory,
          strategy: (matchedName && best.score >= threshold) ? 'matched_existing' : 'fallback_new',
          matched: matchedName,
          sim: Number(best.score.toFixed(2))
        })

        const aiAnalysis = {
          description: importBookmark.description?.trim() || '',
          ai_category: chosenCategory,
          ai_tags: importBookmark.tags || [],
          ai_summary: undefined,
          ai_notes: ''
        } as const;

        // Create new bookmark with strictly-normalized short title derived from domain
        const cleanedTitle = generateCleanBulkTitle(importBookmark.title, importBookmark.url)
        const newBookmark: Bookmark = {
          id: generateBookmarkId([...allBookmarks, ...processedBookmarks]),
          user_id: userId,
          title: cleanedTitle,
          url: importBookmark.url.trim(),
          description: aiAnalysis.description,
          category: aiAnalysis.ai_category,
          tags: aiAnalysis.ai_tags,
          ai_summary: aiAnalysis.ai_summary,
          ai_tags: aiAnalysis.ai_tags,
          ai_category: aiAnalysis.ai_category,
          notes: aiAnalysis.ai_notes,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          visits: 0,
          time_spent: 0,
          site_health: 'working',
          healthCheckCount: 0,
          last_health_check: null,
          relatedBookmarks: []
        };

        processedBookmarks.push(newBookmark);
      }

      // Add all successful bookmarks to the database
      const updatedBookmarks = [...allBookmarks, ...processedBookmarks];
      await saveBookmarks(updatedBookmarks);

      const result: BulkOperationResult = {
        success: failed < importBookmarks.length,
        total: importBookmarks.length,
        processed: processedBookmarks.length,
        failed,
        errors,
        data: {
          imported_bookmarks: processedBookmarks.map(b => ({
            id: b.id,
            title: b.title,
            url: b.url,
            category: b.category
          })),
          category_decisions: categoryDecisions
        },
        message: `Import completed: ${processedBookmarks.length} successful, ${failed} failed`,
        processing_time_ms: Date.now() - startTime
      };

      // Append bulk import history for this batch (file-based persistence)
      try {
        const now = new Date().toISOString()
        const savedUrls = new Set(processedBookmarks.map(b => b.url))
        const links: BulkHistoryLinkEntry[] = importBookmarks.map((ib: any) => ({
          url: String(ib.url).trim(),
          title: typeof ib.title === 'string' ? ib.title.trim() : undefined,
          status: savedUrls.has(String(ib.url).trim()) ? 'saved' : 'failed'
        }))
        await appendBulkHistory({
          id: genId(),
          user_id: userId,
          created_at: now,
          total: importBookmarks.length,
          success: processedBookmarks.length,
          failed,
          links
        })
      } catch (e) {
        console.warn('Failed to append bulk import history:', e)
      }

      return NextResponse.json(result);
    }

    if (action === 'delete') {
      console.log(`🗑️ Bulk deleting bookmarks for user: ${userId}`);

      if (!bookmark_ids || !Array.isArray(bookmark_ids)) {
        return NextResponse.json(
          { error: 'bookmark_ids array is required for delete action' },
          { status: 400 }
        );
      }

      // Normalize incoming IDs to support both UUIDs (Supabase) and numeric IDs (file storage)
      const rawIds: Array<string | number> = Array.isArray(bookmark_ids) ? bookmark_ids : []
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      const uuidIds = rawIds.map(String).filter((v) => uuidRegex.test(v))
      const numericIds = rawIds
        .map((v) => {
          const n = Number(v)
          return Number.isFinite(n) ? n : NaN
        })
        .filter((n) => !Number.isNaN(n)) as number[]

      let bookmarksToDelete: any[] = []
      let deletedCount = 0

      if (USE_SUPABASE && supabase) {
        console.log('🔄 Using Supabase for bulk delete (UUIDs only)', { uuidCount: uuidIds.length })

        if (uuidIds.length === 0) {
          // Nothing to delete on Supabase if we don't have UUIDs
          const result: BulkOperationResult = {
            success: true,
            total: rawIds.length,
            processed: 0,
            failed: rawIds.length,
            errors: ['No valid UUID bookmark IDs provided for Supabase deletion'],
            data: { deleted_bookmarks: [] },
            message: 'No valid UUIDs to delete',
            processing_time_ms: Date.now() - startTime
          }
          return NextResponse.json(result)
        }

        // Delete from both user_bookmarks and bookmarks, and compute accurate deleted count
        // Pre-check which records exist in each table for accurate counts (id-only)
        const { data: ubPre, error: ubPreErr } = await supabase
          .from('user_bookmarks')
          .select('id')
          .in('id', uuidIds)
        if (ubPreErr) {
          console.error('Error prefetching user_bookmarks for delete:', ubPreErr)
        }
        const { data: bPre, error: bPreErr } = await supabase
          .from('bookmarks')
          .select('id')
          .in('id', uuidIds)
        if (bPreErr) {
          console.error('Error prefetching bookmarks for delete:', bPreErr)
        }

        // Perform deletes on both tables using service role if available
        const db = adminSupabase || supabase

        // user_bookmarks delete
        let ubDelData: any[] | null = null
        let ubDelErrMsg: string | null = null
        {
          const { data, error } = await db
            .from('user_bookmarks')
            .delete()
            .in('id', uuidIds)
            .select('id')
          if (error) {
            ubDelErrMsg = error.message
            // If we didn't use admin client and it's available, retry with admin id-only
            if (adminSupabase && db !== adminSupabase) {
              const retry = await adminSupabase
                .from('user_bookmarks')
                .delete()
                .in('id', uuidIds)
                .select('id')
              if (!retry.error) ubDelData = retry.data as any[]
            }
          } else {
            ubDelData = data as any[]
          }
        }

        // bookmarks (legacy) delete
        let bDelData: any[] | null = null
        let bDelErrMsg: string | null = null
        {
          const { data, error } = await db
            .from('bookmarks')
            .delete()
            .in('id', uuidIds)
            .select('id')
          if (error) {
            bDelErrMsg = error.message
            if (adminSupabase && db !== adminSupabase) {
              const retry = await adminSupabase
                .from('bookmarks')
                .delete()
                .in('id', uuidIds)
                .select('id')
              if (!retry.error) bDelData = retry.data as any[]
            }
          } else {
            bDelData = data as any[]
          }
        }

        // Build deleted IDs set from actual deletes, falling back to pre-checks
        const deletedIdsSet = new Set<string>()
        ;(ubDelData || ubPre || []).forEach((r: any) => deletedIdsSet.add(String(r.id)))
        ;(bDelData || bPre || []).forEach((r: any) => deletedIdsSet.add(String(r.id)))
        deletedCount = deletedIdsSet.size

        // For response, include just IDs to avoid extra queries
        bookmarksToDelete = Array.from(deletedIdsSet).map(id => ({ id })) as any[]
      } else {
        console.log('🔄 Using file storage for bulk delete (numeric IDs)', { numericCount: numericIds.length })

        const allBookmarks = await loadBookmarks()

        // Find bookmarks to delete (must belong to the user)
        bookmarksToDelete = allBookmarks.filter((b) => b.user_id === userId && numericIds.includes(b.id))

        // Remove bookmarks
        const updatedBookmarks = allBookmarks.filter((b) => !(b.user_id === userId && numericIds.includes(b.id)))

        await saveBookmarks(updatedBookmarks)
        deletedCount = bookmarksToDelete.length
      }

      const result: BulkOperationResult = {
        success: true,
        total: bookmark_ids.length,
        processed: deletedCount,
        failed: bookmark_ids.length - deletedCount,
        errors: bookmark_ids.length > deletedCount ?
          [`${bookmark_ids.length - deletedCount} bookmarks not found or don't belong to user`] : [],
        data: {
          deleted_bookmarks: bookmarksToDelete.map(b => ({ id: b.id }))
        },
        message: `Bulk delete completed: ${deletedCount} bookmarks deleted`,
        processing_time_ms: Date.now() - startTime
      };

      return NextResponse.json(result);
    }
    if (action === 'move') {
      const { category } = body;
      const newCategory = typeof category === 'string' ? category.trim() : '';

      // Accept both bookmark_ids (snake) and bookmarkIds (camel) for compatibility
      const incomingIds = Array.isArray(body.bookmarkIds)
        ? body.bookmarkIds
        : (Array.isArray(body.bookmark_ids) ? body.bookmark_ids : []);

      if (!newCategory) {
        return NextResponse.json(
          { error: 'Category is required for move action' },
          { status: 400 }
        );
      }
      if (!incomingIds || incomingIds.length === 0) {
        return NextResponse.json(
          { error: 'bookmarkIds array is required for move action' },
          { status: 400 }
        );
      }

      // Normalize IDs similar to delete case
      const rawIds: Array<string | number> = Array.isArray(incomingIds) ? incomingIds : [];
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      const uuidIds = rawIds.map(String).filter((v) => uuidRegex.test(v));
      const numericIds = rawIds
        .map((v) => { const n = Number(v); return Number.isFinite(n) ? n : NaN; })
        .filter((n) => !Number.isNaN(n)) as number[];

      let updatedCount = 0;

      if (USE_SUPABASE && supabase) {
        console.log('🔄 Using Supabase for bulk move (UUIDs only)', { uuidCount: uuidIds.length, newCategory });
        if (uuidIds.length === 0) {
          return NextResponse.json({
            success: true,
            total: rawIds.length,
            processed: 0,
            failed: rawIds.length,
            errors: ['No valid UUID bookmark IDs provided for Supabase bulk move'],
            data: { updated_bookmarks: [] },
            message: 'No valid UUIDs to move',
            processing_time_ms: Date.now() - startTime
          });
        }

        const db = adminSupabase || supabase;

        // Update user_bookmarks
        let ubUpdData: any[] | null = null;
        try {
          const { data, error } = await db
            .from('user_bookmarks')
            .update({ category: newCategory, ai_category: null, updated_at: new Date().toISOString() })
            .in('id', uuidIds)
            .select('id');
          if (!error) ubUpdData = data as any[];
        } catch (e) {
          console.warn('user_bookmarks bulk move failed', e);
        }

        // Update bookmarks (legacy)
        let bUpdData: any[] | null = null;
        try {
          const { data, error } = await db
            .from('bookmarks')
            .update({ category: newCategory, ai_category: null, updated_at: new Date().toISOString() })
            .in('id', uuidIds)
            .select('id');
          if (!error) bUpdData = data as any[];
        } catch (e) {
          console.warn('bookmarks bulk move failed', e);
        }

        const updatedIdsSet = new Set<string>();
        (ubUpdData || []).forEach((r: any) => updatedIdsSet.add(String(r.id)));
        (bUpdData || []).forEach((r: any) => updatedIdsSet.add(String(r.id)));
        updatedCount = updatedIdsSet.size;

        const result: BulkOperationResult = {
          success: true,
          total: rawIds.length,
          processed: updatedCount,
          failed: rawIds.length - updatedCount,
          errors: rawIds.length > updatedCount ? [`${rawIds.length - updatedCount} bookmarks not found or not updated`] : [],
          data: { updated_bookmarks: Array.from(updatedIdsSet).map(id => ({ id, category: newCategory })) },
          message: `Bulk move completed: ${updatedCount} bookmark(s) moved to "${newCategory}"`,
          processing_time_ms: Date.now() - startTime
        };
        return NextResponse.json(result);
      } else {
        console.log('🔄 Using file storage for bulk move (numeric IDs)', { numericCount: numericIds.length, newCategory });
        const allBookmarks = await loadBookmarks();
        const updatedBookmarks = allBookmarks.map(b => {
          if (b.user_id === userId && numericIds.includes(b.id)) {
            updatedCount++;
            return { ...b, category: newCategory, ai_category: null, updated_at: new Date().toISOString() };
          }
          return b;
        });
        await saveBookmarks(updatedBookmarks);

        const result: BulkOperationResult = {
          success: true,
          total: rawIds.length,
          processed: updatedCount,
          failed: rawIds.length - updatedCount,
          errors: rawIds.length > updatedCount ? [`${rawIds.length - updatedCount} bookmarks not found or don't belong to user`] : [],
          data: { updated_bookmarks: updatedBookmarks.filter(b => numericIds.includes(b.id)).map(b => ({ id: b.id, category: b.category })) },
          message: `Bulk move completed: ${updatedCount} bookmark(s) moved to "${newCategory}"`,
          processing_time_ms: Date.now() - startTime
        };
        return NextResponse.json(result);
      }
    }


    return NextResponse.json(
      {
        error: 'Invalid action. Use action=import or action=delete',
        available_actions: ['import', 'delete']
      },
      { status: 400 }
    );

  } catch (error) {
    console.error('Bulk operation error:', error);

    const result: BulkOperationResult = {
      success: false,
      total: 0,
      processed: 0,
      failed: 1,
      errors: [(error as Error).message],
      message: 'Bulk operation failed',
      processing_time_ms: Date.now() - startTime
    };

    return NextResponse.json(result, { status: 500 });
  }
}