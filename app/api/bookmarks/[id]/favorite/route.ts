 // TODO: Migrate to PostgreSQL/Prisma - Supabase imports removed
import { NextRequest, NextResponse } from 'next/server'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'

// Supabase removed - using file storage only
const USE_SUPABASE = false
const supabase = null

// File storage configuration
const DATA_BASE_DIR = process.env.DATA_DIR || (process.env.VERCEL ? '/tmp/data' : join(process.cwd(), 'data'))

// Helper function to check if a string is a valid UUID
function isUuid(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(str)
}

// Helper function to load bookmarks from file
async function loadBookmarks() {
  const bookmarksPath = join(DATA_BASE_DIR, 'bookmarks.json')
  if (!existsSync(bookmarksPath)) {
    return []
  }
  try {
    const data = readFileSync(bookmarksPath, 'utf-8')
    return JSON.parse(data)
  } catch (error) {
    console.error('Error loading bookmarks:', error)
    return []
  }
}

// Helper function to save bookmarks to file
async function saveBookmarks(bookmarks: any[]) {
  const bookmarksPath = join(DATA_BASE_DIR, 'bookmarks.json')
  try {
    writeFileSync(bookmarksPath, JSON.stringify(bookmarks, null, 2))
  } catch (error) {
    console.error('Error saving bookmarks:', error)
    throw error
  }
}

// PATCH /api/bookmarks/[id]/favorite - Toggle favorite status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const bookmarkId = resolvedParams.id
    const body = await request.json()
    const { isFavorite, user_id } = body

    // Validate required fields
    if (typeof isFavorite !== 'boolean') {
      return NextResponse.json(
        { error: 'isFavorite must be a boolean value' },
        { status: 400 }
      )
    }

    // Determine userId
    const userId = user_id || process.env.DEFAULT_SUPABASE_USER_ID || process.env.DEV_USER_ID || 'dev-user-123'

    console.log(`🔄 Updating favorite status for bookmark ${bookmarkId} to ${isFavorite} for user ${userId}`)

    if (USE_SUPABASE && supabase) {
      console.log('✅ Using Supabase for favorite update')
      
      // Update favorite status in Supabase
      const { data, error } = await supabase
        .from('bookmarks')
        .update({ 
          is_favorite: isFavorite,
          updated_at: new Date().toISOString()
        })
        .eq('id', bookmarkId)
        .eq('user_id', userId)
        .select('*')
        .single()

      if (error) {
        console.error('❌ Supabase favorite update error:', error)
        return NextResponse.json(
          { error: 'Failed to update favorite status' },
          { status: 500 }
        )
      }

      if (!data) {
        return NextResponse.json(
          { error: 'Bookmark not found' },
          { status: 404 }
        )
      }

      console.log('✅ Successfully updated favorite status in Supabase')
      return NextResponse.json({
        success: true,
        bookmark: {
          id: data.id,
          isFavorite: data.is_favorite,
          updated_at: data.updated_at
        }
      })

    } else {
      console.log('📁 Using file storage for favorite update')
      
      // Load bookmarks from file
      const allBookmarks = await loadBookmarks()
      
      // Find the bookmark to update
      const bookmarkIndex = allBookmarks.findIndex(
        (b: any) => b.id.toString() === bookmarkId.toString() && b.user_id === userId
      )

      if (bookmarkIndex === -1) {
        return NextResponse.json(
          { error: 'Bookmark not found' },
          { status: 404 }
        )
      }

      // Update the favorite status
      allBookmarks[bookmarkIndex] = {
        ...allBookmarks[bookmarkIndex],
        is_favorite: isFavorite,
        updated_at: new Date().toISOString()
      }

      // Save back to file
      await saveBookmarks(allBookmarks)

      console.log('✅ Successfully updated favorite status in file storage')
      return NextResponse.json({
        success: true,
        bookmark: {
          id: allBookmarks[bookmarkIndex].id,
          isFavorite: allBookmarks[bookmarkIndex].is_favorite,
          updated_at: allBookmarks[bookmarkIndex].updated_at
        }
      })
    }

  } catch (error) {
    console.error('❌ Error updating favorite status:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    )
  }
}
