import { NextRequest, NextResponse } from 'next/server'
import { writeFile, readFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { authenticateUser } from '@/lib/auth-utils';

// File-based storage for persistent bookmarks (until Supabase credentials are fixed)
const BOOKMARKS_FILE = join(process.cwd(), 'data', 'bookmarks.json');

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
    console.error('❌ Error loading bookmarks:', error);
    return [];
  }
}

// Save bookmarks to file
async function saveBookmarks(bookmarks: Bookmark[]): Promise<void> {
  try {
    await ensureDataDirectory();
    await writeFile(BOOKMARKS_FILE, JSON.stringify(bookmarks, null, 2));
  } catch (error) {
    console.error('❌ Error saving bookmarks:', error);
    throw error;
  }
}

interface BookmarkToCreate {
  url: string
  title: string
  description: string
  category: string
  tags: string[]
  ai_summary: string
  ai_tags: string[]
  ai_category: string
  confidence_score: number
  recommendation_id: string
  recommendation_context: {
    readTime: string
    confidence: number
    reasons: string[]
    favicon: string
    generatedAt: string
    settings: Record<string, unknown>
  }
  notes: string
}

interface RequestBody {
  bookmarks: BookmarkToCreate[]
  settings: {
    autoBundle: boolean
    bundleName?: string
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('📚 Creating bookmarks from AI recommendations...')
    
    const body: RequestBody = await request.json()
    const { bookmarks, settings } = body
    
    if (!bookmarks || !Array.isArray(bookmarks) || bookmarks.length === 0) {
      return NextResponse.json(
        { error: 'No bookmarks provided' },
        { status: 400 }
      )
    }
    
    const authResult = await authenticateUser(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status || 401 }
      );
    }
    const userId = authResult.userId!;
    console.log('🔓 TO-BOOKMARKS: Using authenticated user ID:', userId)
    
    // Load existing bookmarks
    const allBookmarks = await loadBookmarks()
    
    // Generate starting ID
    let currentId = Math.max(0, ...allBookmarks.map(b => b.id)) + 1
    
    const results: Array<{
      url: string
      title: string
      success: boolean
      error?: string
      id?: number
    }> = []
    
    let successCount = 0
    let failureCount = 0
    
    for (const bookmark of bookmarks) {
      try {
        console.log(`📖 Creating bookmark: ${bookmark.title}`)
        console.log(`🔗 URL: ${bookmark.url}`)
        console.log(`📊 Category: ${bookmark.category}`)
        console.log(`🏷️ Tags: ${bookmark.tags.join(', ')}`)

        // Create new bookmark object
        const newBookmark: Bookmark = {
          id: currentId,
          user_id: userId,
          title: bookmark.title,
          url: bookmark.url,
          description: bookmark.description,
          category: bookmark.category,
          tags: bookmark.tags,
          ai_summary: bookmark.ai_summary,
          ai_tags: bookmark.ai_tags,
          ai_category: bookmark.ai_category,
          notes: bookmark.notes,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }

        // Add to bookmarks array
        allBookmarks.push(newBookmark)
        
        console.log(`✅ Successfully created bookmark: ${bookmark.title}`)
        
        results.push({
          url: bookmark.url,
          title: bookmark.title,
          success: true,
          id: currentId
        })
        
        successCount++
        currentId++
        
      } catch (error) {
        console.error(`❌ Failed to create bookmark "${bookmark.title}":`, error)
        results.push({
          url: bookmark.url,
          title: bookmark.title,
          error: (error as Error).message,
          success: false
        })
        failureCount++
      }
    }
    
    // Save all bookmarks to file
    await saveBookmarks(allBookmarks)
    
    // Create bundle if requested
    if (settings?.autoBundle && settings?.bundleName) {
      console.log(`📦 Auto-bundling feature requested: ${settings.bundleName}`)
      // Bundle feature can be implemented later
    }
    
    console.log(`📊 Bookmark creation complete: ${successCount} successful, ${failureCount} failed`)
    
    return NextResponse.json({
      success: true,
      message: `Successfully created ${successCount} bookmarks from AI recommendations`,
      results,
      stats: {
        total: bookmarks.length,
        successful: successCount,
        failed: failureCount
      }
    })
    
  } catch (error) {
    console.error('❌ Unexpected error in to-bookmarks:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    )
  }
}

 