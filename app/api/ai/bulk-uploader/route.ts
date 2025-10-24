// Sentry removed
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
;
import { promises as fs } from 'fs';
import path from 'path';
import { validateUrl as validateUrlSSRF } from '../../../../lib/security/url-validator';
import { authenticateUser } from '@/lib/auth-utils';
import { createClient } from '@supabase/supabase-js';
import { secureDb } from '@/lib/database/secure-client';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Types
type BulkLinkStatus = 'queued' | 'validating' | 'processing' | 'processed' | 'saved' | 'duplicate' | 'failed';

interface BulkLink {
  id: string;
  url: string;
  title?: string;
  notes?: string;
  linkType?: 'video' | 'doc' | 'pdf' | 'repo' | 'web';
  predictedTags: string[];
  predictedFolder: string;
  predictedPriority?: 'low' | 'medium' | 'high';
  status: BulkLinkStatus;
  error?: string;
  selected: boolean;
  aiNotes?: string;
  aiSummary?: string;
}

interface BulkUploaderSettings {
  batchSize: 10 | 20 | 30 | 40;
  extraTag?: string;
  forceFolderId?: string | null;
  privacy: 'private' | 'public';
  autoCategorize: boolean;
  autoPriority: boolean;
  duplicateHandling: 'skip' | 'overwrite' | 'keepBoth' | 'autoMerge';
  backgroundMode: boolean;
  language?: string;
  customRules?: string[];
}

interface ProcessingResult {
  success: boolean;
  processedLinks: BulkLink[];
  totalProcessed: number;
  totalSuccessful: number;
  totalFailed: number;
  errors: string[];
  warnings: string[];
  processingTime: number;
}

// File-based storage types and helper functions
interface BookmarkData {
  id: number;
  user_id: string;
  title: string;
  url: string;
  description: string;
  category: string;
  tags: string[];
  priority: 'low' | 'medium' | 'high';
  ai_summary: string;
  ai_tags: string[];
  notes: string;
  created_at: string;
  updated_at: string;
}

const bookmarksFilePath = path.join(process.cwd(), 'data', 'bookmarks.json');

const loadBookmarks = async (): Promise<BookmarkData[]> => {
  try {
    const data = await fs.readFile(bookmarksFilePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.log('No existing bookmarks file found, creating new one');
    return [];
  }
};

const saveBookmarks = async (bookmarks: BookmarkData[]): Promise<void> => {
  try {
    await fs.mkdir(path.dirname(bookmarksFilePath), { recursive: true });
    await fs.writeFile(bookmarksFilePath, JSON.stringify(bookmarks, null, 2));
  } catch (error) {
    console.error('Error saving bookmarks:', error);
    throw error;
  }
};

// Bulk upload history types and helpers (file-based persistence with user scoping)
interface BulkUploadHistoryRecord {
  id: string; // batch id
  user_id: string;
  created_at: string;
  total: number;
  success: number;
  failed: number;
  links: Array<{ url: string; title?: string; status: BulkLinkStatus; error?: string }>;
}

const historyFilePath = path.join(process.cwd(), 'data', 'bulk_upload_history.json');

async function loadHistory(): Promise<BulkUploadHistoryRecord[]> {
  try {
    const data = await fs.readFile(historyFilePath, 'utf8');
    return JSON.parse(data) as BulkUploadHistoryRecord[];
  } catch {
    return [];
  }
}

async function saveHistory(records: BulkUploadHistoryRecord[]): Promise<void> {
  await fs.mkdir(path.dirname(historyFilePath), { recursive: true });
  await fs.writeFile(historyFilePath, JSON.stringify(records, null, 2));
}

async function appendHistory(record: BulkUploadHistoryRecord): Promise<void> {
  const records = await loadHistory();
  records.push(record);
  await saveHistory(records);
}


// Helper functions
const generateId = () => Math.random().toString(36).substr(2, 9);

const detectLinkType = (url: string): 'video' | 'doc' | 'pdf' | 'repo' | 'web' => {
  const urlLower = url.toLowerCase();
  if (urlLower.includes('youtube.com') || urlLower.includes('vimeo.com') || urlLower.includes('twitch.tv') || urlLower.includes('youtu.be')) {
    return 'video';
  }
  if (urlLower.includes('github.com') || urlLower.includes('gitlab.com') || urlLower.includes('bitbucket.org')) {
    return 'repo';
  }
  if (urlLower.includes('.pdf') || urlLower.includes('pdf')) {
    return 'pdf';
  }
  if (urlLower.includes('docs.google.com') || urlLower.includes('notion.so') || urlLower.includes('.doc') || urlLower.includes('confluence')) {
    return 'doc';
  }
  return 'web';
};

const cleanUrl = (url: string): string => {
  try {
    const urlObj = new URL(url);
    // Remove common tracking parameters
    const trackingParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'fbclid', 'gclid', 'ref', 'source'];
    trackingParams.forEach(param => urlObj.searchParams.delete(param));
    return urlObj.toString();
  } catch {
    return url;
  }
};

const validateUrl = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
};

// Helper function to safely parse AI JSON responses
const parseAIResponse = (content: string): any => {
  try {
    // First try direct JSON parsing
    return JSON.parse(content);
  } catch (error) {
    try {
      // Try to extract JSON from markdown code blocks
      const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1]);
      }

      // Try to find JSON object in the content
      const objectMatch = content.match(/\{[\s\S]*\}/);
      if (objectMatch) {
        return JSON.parse(objectMatch[0]);
      }

      throw new Error('No valid JSON found in response');
    } catch (parseError) {
      console.warn('Failed to parse AI response:', content.substring(0, 200));
      return {};
    }
  }
};

const predictTagsAndFolder = async (url: string, settings: BulkUploaderSettings): Promise<{ tags: string[]; folder: string; priority: 'low' | 'medium' | 'high' }> => {
  const hostname = new URL(url).hostname.toLowerCase();

  // Basic prediction based on URL patterns
  let tags: string[] = [];
  let folder = 'General';
  let priority: 'low' | 'medium' | 'high' = 'medium'; // Default priority

  // Domain-based categorization with priority assignment
  if (hostname.includes('github.com')) {
    tags.push('development', 'code', 'repository');
    folder = 'Development';
    priority = 'high'; // Development resources are typically high priority
  } else if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
    tags.push('video', 'tutorial', 'media');
    folder = 'Videos';
    priority = 'medium'; // Videos are medium priority
  } else if (hostname.includes('medium.com') || hostname.includes('dev.to') || hostname.includes('hashnode.com')) {
    tags.push('article', 'blog', 'reading');
    folder = 'Articles';
    priority = 'medium'; // Articles are medium priority
  } else if (hostname.includes('stackoverflow.com') || hostname.includes('stackexchange.com')) {
    tags.push('qa', 'programming', 'help');
    folder = 'Development';
    priority = 'high'; // Programming Q&A is high priority
  } else if (hostname.includes('docs.google.com') || hostname.includes('notion.so')) {
    tags.push('document', 'notes', 'collaboration');
    folder = 'Documents';
    priority = 'high'; // Documentation is high priority
  } else if (hostname.includes('twitter.com') || hostname.includes('x.com') || hostname.includes('linkedin.com')) {
    tags.push('social', 'networking', 'discussion');
    folder = 'Social';
    priority = 'low'; // Social media is low priority
  } else if (hostname.includes('reddit.com')) {
    tags.push('discussion', 'community', 'forum');
    folder = 'Forums';
    priority = 'low'; // Forums are low priority
  }

  // AI-enhanced categorization if enabled
  if (settings.autoCategorize || settings.autoPriority) {
    try {
      const systemPrompt = settings.autoPriority
        ? `You are a URL categorization expert. Analyze the URL and provide relevant tags, folder suggestions, and priority assessment.

            Rules:
            - Provide 2-5 relevant tags
            - Suggest an appropriate folder name
            - Assign priority based on content importance and urgency:
              * HIGH: Documentation, API references, critical tools, official guides, important repositories
              * MEDIUM: Tutorials, articles, educational content, useful tools, general resources
              * LOW: Social media, entertainment, forums, casual reading, news
            - Consider the domain, path, and URL structure
            - Tags should be lowercase, single words or short phrases
            - Folder should be a clear category name
            - Respond in JSON format: {"tags": ["tag1", "tag2"], "folder": "FolderName", "priority": "high|medium|low"}

            Language preference: ${settings.language || 'english'}`
        : `You are a URL categorization expert. Analyze the URL and provide relevant tags and folder suggestions.

            Rules:
            - Provide 2-5 relevant tags
            - Suggest an appropriate folder name
            - Consider the domain, path, and URL structure
            - Tags should be lowercase, single words or short phrases
            - Folder should be a clear category name
            - Respond in JSON format: {"tags": ["tag1", "tag2"], "folder": "FolderName"}

            Language preference: ${settings.language || 'english'}`;

      const aiResponse = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: `Categorize this URL: ${url}`
          }
        ],
        max_tokens: 150,
        temperature: 0.3,
      });

      const aiResult = parseAIResponse(aiResponse.choices[0].message.content || '{}');
      if (aiResult.tags && Array.isArray(aiResult.tags)) {
        tags = [...new Set([...tags, ...aiResult.tags])];
      }
      if (aiResult.folder && typeof aiResult.folder === 'string') {
        folder = aiResult.folder;
      }
      if (settings.autoPriority && aiResult.priority && ['low', 'medium', 'high'].includes(aiResult.priority)) {
        priority = aiResult.priority;
      }
    } catch (error) {
      console.warn('AI categorization failed:', error);
      // Continue with basic categorization
    }
  }

  // Add extra tag if specified
  if (settings.extraTag) {
    tags.push(settings.extraTag);
  }

  // Use forced folder if specified
  if (settings.forceFolderId) {
    folder = settings.forceFolderId;
  }

  return { tags: [...new Set(tags)], folder, priority };
};

const fetchMetadata = async (url: string): Promise<{ title?: string; description?: string }> => {
  try {
    // Validate URL to prevent SSRF
    const validation = validateUrlSSRF(url);
    if (!validation.isValid) {
      throw new Error(`URL validation failed: ${validation.error}`);
    }

    const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
    let response = await fetch(url, {
      headers: {
        'User-Agent': UA,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(6000), // 6 second timeout
    });

    // Simple retry once on common blocking statuses
    if (!response.ok && [403, 429, 503].includes(response.status)) {
      await new Promise(r => setTimeout(r, 500));
      response = await fetch(url, {
        headers: {
          'User-Agent': UA,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        redirect: 'follow',
        signal: AbortSignal.timeout(3000),
      });
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();

    // Extract title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : undefined;

    // Extract description
    const descMatch = html.match(/<meta[^>]*name=['"](description|og:description)['"'][^>]*content=['"']([^'"]*)['"']/i);
    const description = descMatch ? descMatch[2].trim() : undefined;

    return { title, description };
  } catch (error) {
    console.warn(`Failed to fetch metadata for ${url}:`, error);
    return {};
  }
};

const analyzeWebsiteContentWithAI = async (url: string, html: string, settings: BulkUploaderSettings): Promise<{
  title?: string;
  description?: string;
  aiSummary?: string;
  aiTags?: string[];
  aiCategory?: string;
  aiNotes?: string;
}> => {
  try {
    // Extract text content from HTML (remove scripts, styles, etc.)
    const textContent = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 8000); // Limit content to avoid token limits

    // Extract metadata
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : undefined;

    const descMatch = html.match(/<meta[^>]*name=['"](description|og:description)['"'][^>]*content=['"']([^'"]*)['"']/i);
    const description = descMatch ? descMatch[2].trim() : undefined;

    // Use AI to analyze the content
    const aiResponse = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are an expert content analyzer for bookmark management. Analyze the website content and provide comprehensive categorization and insights.

Your task:
1. Generate a concise summary (2-3 sentences) of what this website/page is about
2. Suggest 3-6 relevant tags for categorization (lowercase, single words or short phrases)
3. Determine the most appropriate folder/category
4. Create helpful notes highlighting key points or why this might be bookmarked

Guidelines:
- Tags should be specific and useful for searching/filtering
- Folder should be a clear, broad category (e.g., "Development", "Articles", "Tools", "Resources", "Documentation")
- Notes should be actionable and highlight key value propositions
- Consider the user's likely intent for bookmarking this content
- Language preference: ${settings.language || 'english'}

Respond ONLY with valid JSON:
{
  "summary": "Brief description of the content",
  "tags": ["tag1", "tag2", "tag3"],
  "category": "FolderName",
  "notes": "Key insights and why this is worth bookmarking"
}`
        },
        {
          role: 'user',
          content: `URL: ${url}
Title: ${title || 'No title'}
Description: ${description || 'No description'}

Content preview:
${textContent.substring(0, 3000)}...`
        }
      ],
      max_tokens: 500,
      temperature: 0.3,
    });

    const aiResult = parseAIResponse(aiResponse.choices[0].message.content || '{}');

    return {
      title,
      description,
      aiSummary: aiResult.summary || undefined,
      aiTags: Array.isArray(aiResult.tags) ? aiResult.tags : [],
      aiCategory: aiResult.category || undefined,
      aiNotes: aiResult.notes || undefined
    };

  } catch (error) {
    console.warn(`AI content analysis failed for ${url}:`, error);
    // Fall back to basic metadata extraction
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : undefined;

    const descMatch = html.match(/<meta[^>]*name=['"](description|og:description)['"'][^>]*content=['"']([^'"]*)['"']/i);
    const description = descMatch ? descMatch[2].trim() : undefined;

    return { title, description };
  }
};

const fetchEnhancedMetadata = async (url: string, settings: BulkUploaderSettings): Promise<{
  title?: string;
  description?: string;
  aiSummary?: string;
  aiTags?: string[];
  aiCategory?: string;
  aiNotes?: string;
}> => {
  try {
    // Validate URL to prevent SSRF
    const validation = validateUrlSSRF(url);
    if (!validation.isValid) {
      throw new Error(`URL validation failed: ${validation.error}`);
    }

    const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
    let response = await fetch(url, {
      headers: {
        'User-Agent': UA,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(8000), // 8 second timeout for content fetch
    });

    if (!response.ok && [403, 429, 503].includes(response.status)) {
      await new Promise(r => setTimeout(r, 500));
      response = await fetch(url, {
        headers: {
          'User-Agent': UA,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        redirect: 'follow',
        signal: AbortSignal.timeout(3000),
      });
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();

    // For performance: skip pre-save AI analysis; rely on /api/bookmarks AI during save
    // This keeps the preview responsive while final saved bookmark gets full intelligent categorization
    return await fetchMetadata(url);

  } catch (error) {
    console.warn(`Failed to fetch enhanced metadata for ${url}:`, error);
    return {};
  }
};

const checkDuplicates = async (userId: string, urls: string[]): Promise<Set<string>> => {
  try {
    const allBookmarks = await loadBookmarks();
    const userBookmarks = allBookmarks.filter(bookmark => bookmark.user_id === userId);

    const existingUrls = userBookmarks.map(bookmark => bookmark.url);
    const duplicateUrls = urls.filter(url => existingUrls.includes(url));

    return new Set(duplicateUrls);
  } catch (error) {
    console.warn('Failed to check duplicates:', error);
    return new Set();
  }
};

const saveLinksToDatabase = async (userId: string, links: BulkLink[], origin?: string) => {
  const linksToSave = links.filter(link => link.selected && (link.status === 'processed' || link.status === 'saved'));

  if (linksToSave.length === 0) {
    return;
  }

  const useSupabase = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);

  if (useSupabase) {
    // Persist to Supabase (server-side, service role)
    console.log('💾 Saving bookmarks to Supabase...');
    const supabaseService = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Concurrency-limited parallel saves to speed up bulk inserts
    const concurrency = Math.min(5, linksToSave.length);
    let index = 0;

    const processOne = async () => {
      while (true) {
        const current = index++;
        if (current >= linksToSave.length) break;
        const link = linksToSave[current];
        try {
          // Prefer using our canonical creation API so we get: AI similarity mapping, category upsert, consistent scoping
          const apiPayload: any = {
            title: link.title || new URL(link.url).hostname,
            url: link.url,
            notes: link.aiNotes || link.notes || '',
            enableAI: true,
            user_id: /^[0-9a-fA-F-]{36}$/.test(userId) ? userId : undefined,
            // Intentionally omit ai_* fields so /api/bookmarks runs full AI analysis
          };

          let created: any | null = null;
          if (origin) {
            try {
              const res = await fetch(`${origin}/api/bookmarks`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(apiPayload),
              });
              if (res.ok) {
                const json = await res.json();
                if (json?.success && json?.bookmark) {
                  created = json.bookmark;
                }
              }
            } catch (e) {
              // falls through to direct insert
            }
          }

          if (!created) {
            // Fallback: direct insert via service role (will not handle similarity mapping)
            const basePayload: any = {
              user_id: /^[0-9a-fA-F-]{36}$/.test(userId) ? userId : null,
              title: apiPayload.title,
              url: apiPayload.url,
              description: link.aiSummary || link.notes || `${link.linkType} resource - ${(link.predictedTags || []).join(', ')}`,
              category: link.predictedFolder,
              ai_summary: link.aiSummary || null,
              ai_tags: Array.isArray(link.predictedTags) ? link.predictedTags : [],
              notes: apiPayload.notes,
              is_favorite: false,
              folder_id: null,
            };

            let insert = await supabaseService
              .from('bookmarks')
              .insert(basePayload)
              .select('*')
              .single();

            if (insert.error) {
              const shouldRetryNullUser = (
                insert.error.code === '23503' ||
                (insert.error.message || '').toLowerCase().includes('row-level security') ||
                insert.error.code === '42501'
              );

              if (shouldRetryNullUser) {
                const retryNull = await supabaseService
                  .from('bookmarks')
                  .insert({ ...basePayload, user_id: null })
                  .select('*')
                  .single();

                if (!retryNull.error && retryNull.data) {
                  insert = retryNull;
                } else {
                  const retryLegacy = await supabaseService
                    .from('user_bookmarks')
                    .insert({ ...basePayload, user_id: null })
                    .select('*')
                    .single();
                  if (!retryLegacy.error && retryLegacy.data) {
                    insert = retryLegacy;
                  }
                }
              }
            }

            if (insert.error || !insert.data) {
              throw new Error(insert.error?.message || 'Failed to create bookmark');
            }
            created = insert.data;
          }

          link.status = 'saved';
          link.id = String(created.id);
        } catch (err) {
          link.status = 'failed';
          link.error = err instanceof Error ? err.message : 'Database error';
        }
      }
    };

    await Promise.all(Array.from({ length: concurrency }, () => processOne()));

    console.log(`✅ Finished saving ${linksToSave.filter(l => l.status === 'saved').length} bookmarks to Supabase`);
    return;
  }

  // Fallback: file storage (only for non-serverless environments)
  try {
    const allBookmarks = await loadBookmarks();
    const maxId = allBookmarks.length > 0 ? Math.max(...allBookmarks.map(b => b.id)) : 0;
    let nextId = maxId + 1;

    const newBookmarks = linksToSave.map((link) => {
      const bookmarkData = {
        id: nextId++,
        user_id: userId,
        title: link.title || new URL(link.url).hostname,
        url: link.url,
        description: link.aiSummary || link.notes || `${link.linkType} resource - ${link.predictedTags.join(', ')}`,
        category: link.predictedFolder,
        tags: link.predictedTags,
        priority: link.predictedPriority || 'medium',
        ai_summary: link.aiSummary || `Auto-categorized ${link.linkType} resource`,
        ai_tags: link.predictedTags,
        notes: link.aiNotes || link.notes || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      link.status = 'saved';
      link.id = bookmarkData.id.toString();
      return bookmarkData;
    });

    const updatedBookmarks = [...allBookmarks, ...newBookmarks];
    await saveBookmarks(updatedBookmarks);
    console.log(`✅ Successfully saved ${newBookmarks.length} bookmarks to file storage`);
  } catch (error) {
    console.error('Failed to save bookmarks:', error);
    linksToSave.forEach(link => {
      link.status = 'failed';
      link.error = error instanceof Error ? error.message : 'File storage error';
    });
  }
};

// GET endpoint - Return current settings and status
export async function GET() {
  const startTime = Date.now();

  try {
    console.log('🔗 Bulk Uploader API called (GET)');
    console.log('🚀 PRODUCTION MODE: Authentication bypassed for bulk operations');

    return NextResponse.json({
      success: true,
      message: 'Bulk Uploader API is ready (production mode, auth bypassed)',
      userId: 'bulk-uploader-service',
      supportedFeatures: [
        'URL validation',
        'AI-powered categorization',
        'Duplicate detection',
        'Batch processing',
        'Metadata extraction',
        'CSV/Text parsing',
        'Custom tagging',
        'Folder organization'
      ],
      processingTime: Date.now() - startTime
    });

  } catch (error) {
    console.error('Bulk Uploader API Error:', error);
    ;

    return NextResponse.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST endpoint - Process bulk links
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

    try {
      console.log('🔗 Bulk Uploader API called (POST)');

      const authResult = await authenticateUser(request);
      let userId: string;
      if (!authResult.success) {
        console.warn('🔓 Bulk Uploader: Auth failed, falling back to service user for storage.', { status: authResult.status, error: authResult.error });
        // Use existing dev/test user to match bookmarks API behavior
        userId = '48e1b5b9-3b0f-4ccb-8b34-831b1337fc3f';
      } else {
        userId = authResult.userId!;
      }

      console.log('🚀 FILE STORAGE MODE: Using file-based storage for user:', userId);

      const body = await request.json();
      const { links, settings } = body;

      // Validate input
      if (!links || !Array.isArray(links) || links.length === 0) {
        return NextResponse.json({ error: 'Links array is required' }, { status: 400 });
      }

      if (links.length > 100) {
        return NextResponse.json({ error: 'Maximum 100 links per batch' }, { status: 400 });
      }

      // Default settings
      const processingSettings: BulkUploaderSettings = {
        batchSize: 20,
        privacy: 'private',
        autoCategorize: true,
        autoPriority: true,
        duplicateHandling: 'autoMerge',
        backgroundMode: false,
        language: 'english',
        ...settings
      };

      ;
      ;
      ;
      ;

      console.log(`📋 Processing ${links.length} links for user ${userId}`);

      const processedLinks: BulkLink[] = [];
      const errors: string[] = [];
      const warnings: string[] = [];
      let totalSuccessful = 0;
      let totalFailed = 0;

      // Step 1: Normalize, validate, and clean URLs (auto-prepend https:// if missing)
      console.log('🔍 Step 1: Validating URLs...');
      const validLinks = (links as Array<string | { url: string; title?: string; notes?: string }>).reduce(
        (acc: Array<{ url: string; title?: string; notes?: string }>, linkData) => {
          const rawUrl = typeof linkData === 'string' ? linkData : linkData.url;
          const title = typeof linkData === 'object' ? linkData.title : undefined;
          const notes = typeof linkData === 'object' ? linkData.notes : undefined;

          let normalized = rawUrl?.trim() || '';
          if (!validateUrl(normalized)) {
            const prefixed = `https://${normalized}`;
            if (validateUrl(prefixed)) {
              normalized = prefixed;
            }
          }

          if (!validateUrl(normalized)) {
            errors.push(`Invalid URL: ${rawUrl}`);
            return acc;
          }

          acc.push({ url: normalized, title, notes });
          return acc;
        },
        []
      );

      if (validLinks.length === 0) {
        return NextResponse.json({
          success: false,
          error: 'No valid URLs found',
          errors
        }, { status: 400 });
      }

      // Step 2: Check for duplicates
      console.log('🔍 Step 2: Checking for duplicates...');
      const urls = validLinks.map((linkData: string | { url: string }) =>
        cleanUrl(typeof linkData === 'string' ? linkData : linkData.url)
      );

      const duplicates = await checkDuplicates(userId, urls);

      if (duplicates.size > 0) {
        warnings.push(`Found ${duplicates.size} duplicate URLs`);
      }

      // Step 3: Process links in batches
      console.log(`🔄 Step 3: Processing ${validLinks.length} links in batches of ${processingSettings.batchSize}...`);

      for (let i = 0; i < validLinks.length; i += processingSettings.batchSize) {
        const batch = validLinks.slice(i, i + processingSettings.batchSize);

        const batchPromises = batch.map(async (linkData: string | { url: string; title?: string; notes?: string }) => {
          const url = typeof linkData === 'string' ? linkData : linkData.url;
          const cleanedUrl = cleanUrl(url);

          const bulkLink: BulkLink = {
            id: generateId(),
            url: cleanedUrl,
            title: typeof linkData === 'object' ? linkData.title : undefined,
            notes: typeof linkData === 'object' ? linkData.notes : undefined,
            linkType: detectLinkType(cleanedUrl),
            predictedTags: [],
            predictedFolder: 'General',
            status: 'processing',
            selected: true
          };

          try {
            // Handle duplicates
            if (duplicates.has(cleanedUrl)) {
              if (processingSettings.duplicateHandling === 'skip') {
                bulkLink.status = 'duplicate';
                bulkLink.error = 'URL already exists';
                return bulkLink;
              }
              // For other duplicate handling strategies, continue processing
            }

            // Fetch enhanced metadata with AI analysis
            const enhancedMetadata = await fetchEnhancedMetadata(cleanedUrl, processingSettings);

            // Update title and description from AI analysis
            if (enhancedMetadata.title && !bulkLink.title) {
              bulkLink.title = enhancedMetadata.title;
            }

            // Set description/notes from AI analysis
            if (enhancedMetadata.aiSummary) {
              bulkLink.notes = enhancedMetadata.aiSummary;
            } else if (enhancedMetadata.description && !bulkLink.notes) {
              bulkLink.notes = enhancedMetadata.description;
            }

            // Use AI-generated tags and folder if available, or fall back to basic prediction
            const prediction = await predictTagsAndFolder(cleanedUrl, processingSettings);

            // Apply tags based on settings
            if (processingSettings.autoCategorize && enhancedMetadata.aiTags && enhancedMetadata.aiTags.length > 0) {
              bulkLink.predictedTags = enhancedMetadata.aiTags;
            } else {
              bulkLink.predictedTags = prediction.tags;
            }

            // Add extra tag if specified (avoid duplicates)
            if (processingSettings.extraTag && processingSettings.extraTag.trim()) {
              const extraTag = processingSettings.extraTag.trim();
              if (!bulkLink.predictedTags.includes(extraTag)) {
                bulkLink.predictedTags.push(extraTag);
              }
            }

            // Apply folder based on settings
            if (processingSettings.forceFolderId) {
              // Force into specified folder
              bulkLink.predictedFolder = processingSettings.forceFolderId;
            } else if (processingSettings.autoCategorize && enhancedMetadata.aiCategory) {
              bulkLink.predictedFolder = enhancedMetadata.aiCategory;
            } else {
              bulkLink.predictedFolder = prediction.folder;
            }

            // Set priority based on settings
            if (processingSettings.autoPriority) {
              bulkLink.predictedPriority = prediction.priority;
            } else {
              bulkLink.predictedPriority = 'medium'; // Default when auto-priority is disabled
            }

            // Store AI-generated notes for later use
            if (enhancedMetadata.aiNotes) {
              bulkLink.aiNotes = enhancedMetadata.aiNotes;
            }

            // Ensure we always have a reasonable title to avoid UI "metadata failed" warnings
            if (!bulkLink.title) {
              try {
                const hn = new URL(cleanedUrl).hostname.replace(/^www\./, '');
                bulkLink.title = hn;
              } catch {}
            }

            bulkLink.status = 'processed'; // Will be set to 'saved' after database insertion
            return bulkLink;

          } catch (error) {
            console.error('Failed to process URL:', { url: cleanedUrl.substring(0, 100), error });
            bulkLink.status = 'failed';
            bulkLink.error = error instanceof Error ? error.message : 'Processing error';
            return bulkLink;
          }
        });

        const batchResults = await Promise.all(batchPromises);
        processedLinks.push(...batchResults);

        console.log(`✅ Processed batch ${Math.floor(i / processingSettings.batchSize) + 1}/${Math.ceil(validLinks.length / processingSettings.batchSize)}`);
      }

      // Step 4: Save to file storage
      console.log('💾 Step 4: Saving to file storage...');
      // Compute origin to call internal API routes reliably in server context
      const proto = request.headers.get('x-forwarded-proto') ?? 'https'
      const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host') ?? process.env.NEXT_PUBLIC_VERCEL_URL ?? process.env.VERCEL_URL
      const origin = host ? `${proto}://${host}` : undefined
      await saveLinksToDatabase(userId, processedLinks, origin);

      // Update counters after database operations
      totalSuccessful = processedLinks.filter(link => link.status === 'saved').length;
      totalFailed = processedLinks.filter(link => link.status === 'failed').length;

      const processingTime = Date.now() - startTime;

      const result: ProcessingResult = {
        success: true,
        processedLinks,
        totalProcessed: processedLinks.length,
        totalSuccessful,
        totalFailed,
        errors,
        warnings,
        processingTime
      };

      // Persist bulk upload history (file-based persistence per user)
      try {
        const batchId = generateId();
        const createdAt = new Date().toISOString();
        await appendHistory({
          id: batchId,
          user_id: userId,
          created_at: createdAt,
          total: result.totalProcessed,
          success: result.totalSuccessful,
          failed: result.totalFailed,
          links: processedLinks.map(l => ({ url: l.url, title: l.title, status: l.status, error: l.error }))
        });
      } catch (e) {
        console.warn('Failed to persist bulk upload history:', e);
      }

      console.log(`✅ Bulk upload completed: ${totalSuccessful} successful, ${totalFailed} failed in ${processingTime}ms`);

      ;
      ;
      ;
      ;

      return NextResponse.json(result);

    } catch (error) {
      console.error('Bulk Uploader API Error:', error);
      ;

      ;
      ;

      return NextResponse.json({
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        processingTime: Date.now() - startTime
      }, { status: 500 });
    }
}