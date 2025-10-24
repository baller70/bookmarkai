import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client with proper fallback
const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim()
const supabaseKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim()

// Check if we should use Supabase
const USE_SUPABASE = supabaseUrl && supabaseKey && 
  !supabaseKey.includes('dev-placeholder') && 
  !supabaseKey.includes('dev-placeholder-service-key')

let supabase: any = null
if (USE_SUPABASE) {
  supabase = createClient(supabaseUrl, supabaseKey)
}

// Check if tables exist
async function checkTablesExist() {
  if (!USE_SUPABASE || !supabase) {
    return false
  }
  
  try {
    const { error } = await supabase
      .from('user_playbooks')
      .select('id')
      .limit(1)
    return !error
  } catch {
    return false
  }
}

// GET /api/playbooks/[id]/bookmarks - Get bookmarks for a playbook
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')
    const resolvedParams = await params
    const playbookId = resolvedParams.id

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    const tablesExist = await checkTablesExist()
    
    if (!tablesExist) {
      console.log('⚠️  Database tables not found, using mock data')
      
      // Mock bookmarks for the playbook
      const mockBookmarks = [
        {
          id: '1',
          playbook_id: playbookId,
          bookmark_id: 'bookmark_1',
          position: 1,
          added_at: new Date().toISOString(),
          added_by: userId,
          title: 'Example Bookmark 1',
          url: 'https://example.com/1',
          description: 'First example bookmark',
          tags: ['example', 'demo']
        },
        {
          id: '2',
          playbook_id: playbookId,
          bookmark_id: 'bookmark_2',
          position: 2,
          added_at: new Date().toISOString(),
          added_by: userId,
          title: 'Example Bookmark 2',
          url: 'https://example.com/2',
          description: 'Second example bookmark',
          tags: ['sample', 'test']
        }
      ]

      return NextResponse.json({
        success: true,
        data: mockBookmarks,
        mock: true
      })
    }

    // Real database query when tables exist
    const { data: bookmarks, error } = await supabase
      .from('playbook_bookmarks')
      .select(`
        *,
        playbook:user_playbooks!inner(user_id, is_public, is_collaborative)
      `)
      .eq('playbook_id', playbookId)
      .order('position')

    if (error) {
      console.error('Error fetching playbook bookmarks:', error)
      return NextResponse.json({ error: 'Failed to fetch bookmarks' }, { status: 500 })
    }

    // Check if user has access to this playbook
    const playbook = bookmarks[0]?.playbook
    if (playbook && playbook.user_id !== userId && !playbook.is_public && !playbook.is_collaborative) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    return NextResponse.json({
      success: true,
      data: bookmarks || []
    })

  } catch (error) {
    console.error('Error in GET /api/playbooks/[id]/bookmarks:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/playbooks/[id]/bookmarks - Add bookmark to playbook
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json()
    const { bookmark_id, position, user_id } = body
    const resolvedParams = await params
    const playbookId = resolvedParams.id

    if (!user_id || !bookmark_id) {
      return NextResponse.json({ error: 'User ID and bookmark ID are required' }, { status: 400 })
    }

    const tablesExist = await checkTablesExist()
    
    if (!tablesExist) {
      console.log('⚠️  Database tables not found, simulating bookmark addition')
      
      const mockBookmark = {
        id: Date.now().toString(),
        playbook_id: playbookId,
        bookmark_id,
        position: position || 1,
        added_at: new Date().toISOString(),
        added_by: user_id
      }

      return NextResponse.json({
        success: true,
        data: mockBookmark,
        mock: true
      })
    }

    // Check if user owns the playbook or has edit access
    const { data: playbook, error: playbookError } = await supabase
      .from('user_playbooks')
      .select('user_id, is_collaborative')
      .eq('id', playbookId)
      .single()

    if (playbookError || !playbook) {
      return NextResponse.json({ error: 'Playbook not found' }, { status: 404 })
    }

    if (playbook.user_id !== user_id && !playbook.is_collaborative) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Add bookmark to playbook
    const { data: newBookmark, error } = await supabase
      .from('playbook_bookmarks')
      .insert({
        playbook_id: playbookId,
        bookmark_id,
        position: position || 1,
        added_by: user_id
      })
      .select()
      .single()

    if (error) {
      console.error('Error adding bookmark to playbook:', error)
      return NextResponse.json({ error: 'Failed to add bookmark' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: newBookmark
    })

  } catch (error) {
    console.error('Error in POST /api/playbooks/[id]/bookmarks:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/playbooks/[id]/bookmarks - Update bookmark order/metadata
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json()
    const { bookmarks, user_id } = body
    const resolvedParams = await params
    const playbookId = resolvedParams.id

    if (!user_id || !bookmarks) {
      return NextResponse.json({ error: 'User ID and bookmarks data are required' }, { status: 400 })
    }

    const tablesExist = await checkTablesExist()
    
    if (!tablesExist) {
      console.log('⚠️  Database tables not found, simulating bookmark update')
      
      return NextResponse.json({
        success: true,
        data: bookmarks,
        mock: true
      })
    }

    // Check if user owns the playbook or has edit access
    const { data: playbook, error: playbookError } = await supabase
      .from('user_playbooks')
      .select('user_id, is_collaborative')
      .eq('id', playbookId)
      .single()

    if (playbookError || !playbook) {
      return NextResponse.json({ error: 'Playbook not found' }, { status: 404 })
    }

    if (playbook.user_id !== user_id && !playbook.is_collaborative) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Update bookmark positions
    const updates = bookmarks.map((bookmark: { id: string }, index: number) => 
      supabase
        .from('playbook_bookmarks')
        .update({ position: index + 1 })
        .eq('id', bookmark.id)
        .eq('playbook_id', playbookId)
    )

    const results = await Promise.all(updates)
    const hasError = results.some(result => result.error)

    if (hasError) {
      console.error('Error updating bookmark positions')
      return NextResponse.json({ error: 'Failed to update bookmark positions' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: bookmarks
    })

  } catch (error) {
    console.error('Error in PUT /api/playbooks/[id]/bookmarks:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/playbooks/[id]/bookmarks - Remove bookmark from playbook
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { searchParams } = new URL(request.url)
    const bookmarkId = searchParams.get('bookmark_id')
    const userId = searchParams.get('user_id')
    const resolvedParams = await params
    const playbookId = resolvedParams.id

    if (!userId || !bookmarkId) {
      return NextResponse.json({ error: 'User ID and bookmark ID are required' }, { status: 400 })
    }

    const tablesExist = await checkTablesExist()
    
    if (!tablesExist) {
      console.log('⚠️  Database tables not found, simulating bookmark removal')
      
      return NextResponse.json({
        success: true,
        message: 'Bookmark removed from playbook',
        mock: true
      })
    }

    // Check if user owns the playbook or has edit access
    const { data: playbook, error: playbookError } = await supabase
      .from('user_playbooks')
      .select('user_id, is_collaborative')
      .eq('id', playbookId)
      .single()

    if (playbookError || !playbook) {
      return NextResponse.json({ error: 'Playbook not found' }, { status: 404 })
    }

    if (playbook.user_id !== userId && !playbook.is_collaborative) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Remove bookmark from playbook
    const { error } = await supabase
      .from('playbook_bookmarks')
      .delete()
      .eq('playbook_id', playbookId)
      .eq('bookmark_id', bookmarkId)

    if (error) {
      console.error('Error removing bookmark from playbook:', error)
      return NextResponse.json({ error: 'Failed to remove bookmark' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Bookmark removed from playbook'
    })

  } catch (error) {
    console.error('Error in DELETE /api/playbooks/[id]/bookmarks:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 