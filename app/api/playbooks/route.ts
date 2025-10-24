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

// GET /api/playbooks - Get user's playbooks with filtering and search
export async function GET(request: NextRequest) {
  console.log('📥 GET /api/playbooks called')
  
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const sortBy = searchParams.get('sort_by') || 'created_at'
    const sortOrder = searchParams.get('sort_order') || 'desc'
    const isPublic = searchParams.get('is_public')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    console.log('📋 Request params:', { userId, category, search, sortBy, sortOrder, isPublic, limit, offset })

    if (!userId) {
      console.log('❌ Missing user_id parameter')
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    const tablesExist = await checkTablesExist()
    console.log('🗄️  Tables exist:', tablesExist)
    
    if (!tablesExist) {
      console.log('⚠️  Database tables not found, using mock data')
      
      // Mock playbooks data
      const mockPlaybooks = [
        {
          id: '1',
          user_id: userId,
          title: 'My First Playbook',
          description: 'A collection of my favorite bookmarks',
          category: 'Technology',
          is_public: false,
          is_collaborative: false,
          allow_comments: true,
          tags: ['tech', 'learning'],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          likes_count: 5,
          plays_count: 12,
          bookmark_count: 8,
          cover_image: null,
          is_featured: false,
          is_marketplace: false,
          price: null,
          currency: null,
          collaborator_count: 0,
          user_avatar: '/avatars/default.png',
          user_name: 'Demo User',
          is_liked: false
        },
        {
          id: '2',
          user_id: userId,
          title: 'Web Development Resources',
          description: 'Essential resources for web developers',
          category: 'Development',
          is_public: true,
          is_collaborative: true,
          allow_comments: true,
          tags: ['webdev', 'resources'],
          created_at: new Date(Date.now() - 86400000).toISOString(),
          updated_at: new Date(Date.now() - 86400000).toISOString(),
          likes_count: 23,
          plays_count: 45,
          bookmark_count: 15,
          cover_image: null,
          is_featured: false,
          is_marketplace: false,
          price: null,
          currency: null,
          collaborator_count: 3,
          user_avatar: '/avatars/default.png',
          user_name: 'Demo User',
          is_liked: true
        }
      ]

      console.log('✅ Returning mock data:', mockPlaybooks.length, 'playbooks')
      return NextResponse.json({
        success: true,
        data: mockPlaybooks,
        total: mockPlaybooks.length,
        mock: true
      })
    }

    // Build query
    let query = supabase
      .from('user_playbooks')
      .select(`
        *,
        likes:playbook_likes(count),
        plays:playbook_plays(count),
        bookmarks:playbook_bookmarks(count),
        user_liked:playbook_likes!inner(user_id)
      `)

    // Apply filters
    if (isPublic !== null) {
      query = query.eq('is_public', isPublic === 'true')
    } else {
      // Show user's own playbooks + public playbooks
      query = query.or(`user_id.eq.${userId},is_public.eq.true`)
    }

    if (category) {
      query = query.eq('category', category)
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' })

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: playbooks, error, count } = await query

    if (error) {
      console.error('Error fetching playbooks:', error)
      return NextResponse.json({ error: 'Failed to fetch playbooks' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: playbooks || [],
      total: count || 0
    })

  } catch (error) {
    console.error('Error in GET /api/playbooks:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/playbooks - Create a new playbook
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      user_id,
      title,
      description,
      category,
      is_public = false,
      is_collaborative = false,
      allow_comments = true,
      tags = [],
      cover_image = null
    } = body

    if (!user_id || !title) {
      return NextResponse.json({ error: 'User ID and title are required' }, { status: 400 })
    }

    const tablesExist = await checkTablesExist()
    
    if (!tablesExist) {
      console.log('⚠️  Database tables not found, simulating playbook creation')
      
      const mockPlaybook = {
        id: Date.now().toString(),
        user_id,
        title,
        description,
        category,
        is_public,
        is_collaborative,
        allow_comments,
        tags,
        cover_image,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        likes_count: 0,
        plays_count: 0,
        bookmark_count: 0,
        is_featured: false,
        is_marketplace: false,
        price: null,
        currency: null,
        collaborator_count: 0
      }

      return NextResponse.json({
        success: true,
        data: mockPlaybook,
        mock: true
      })
    }

    // Create playbook
    const { data: newPlaybook, error } = await supabase
      .from('user_playbooks')
      .insert({
        user_id,
        title,
        description,
        category,
        is_public,
        is_collaborative,
        allow_comments,
        tags,
        cover_image
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating playbook:', error)
      return NextResponse.json({ error: 'Failed to create playbook' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: newPlaybook
    })

  } catch (error) {
    console.error('Error in POST /api/playbooks:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/playbooks - Update an existing playbook
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      id,
      user_id,
      title,
      description,
      category,
      is_public,
      is_collaborative,
      allow_comments,
      tags,
      cover_image
    } = body

    if (!id || !user_id) {
      return NextResponse.json({ error: 'Playbook ID and user ID are required' }, { status: 400 })
    }

    const tablesExist = await checkTablesExist()
    
    if (!tablesExist) {
      console.log('⚠️  Database tables not found, simulating playbook update')
      
      return NextResponse.json({
        success: true,
        data: { id, ...body, updated_at: new Date().toISOString() },
        mock: true
      })
    }

    // Check if user owns the playbook
    const { data: playbook, error: checkError } = await supabase
      .from('user_playbooks')
      .select('user_id')
      .eq('id', id)
      .single()

    if (checkError || !playbook) {
      return NextResponse.json({ error: 'Playbook not found' }, { status: 404 })
    }

    if (playbook.user_id !== user_id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

         // Update playbook
     const updateData: Record<string, any> = { updated_at: new Date().toISOString() }
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (category !== undefined) updateData.category = category
    if (is_public !== undefined) updateData.is_public = is_public
    if (is_collaborative !== undefined) updateData.is_collaborative = is_collaborative
    if (allow_comments !== undefined) updateData.allow_comments = allow_comments
    if (tags !== undefined) updateData.tags = tags
    if (cover_image !== undefined) updateData.cover_image = cover_image

    const { data: updatedPlaybook, error } = await supabase
      .from('user_playbooks')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating playbook:', error)
      return NextResponse.json({ error: 'Failed to update playbook' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: updatedPlaybook
    })

  } catch (error) {
    console.error('Error in PUT /api/playbooks:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/playbooks - Delete a playbook
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const playbookId = searchParams.get('id')
    const userId = searchParams.get('user_id')

    if (!playbookId || !userId) {
      return NextResponse.json({ error: 'Playbook ID and user ID are required' }, { status: 400 })
    }

    const tablesExist = await checkTablesExist()
    
    if (!tablesExist) {
      console.log('⚠️  Database tables not found, simulating playbook deletion')
      
      return NextResponse.json({
        success: true,
        message: 'Playbook deleted',
        mock: true
      })
    }

    // Check if user owns the playbook
    const { data: playbook, error: checkError } = await supabase
      .from('user_playbooks')
      .select('user_id')
      .eq('id', playbookId)
      .single()

    if (checkError || !playbook) {
      return NextResponse.json({ error: 'Playbook not found' }, { status: 404 })
    }

    if (playbook.user_id !== userId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Delete playbook (cascade will handle related records)
    const { error } = await supabase
      .from('user_playbooks')
      .delete()
      .eq('id', playbookId)

    if (error) {
      console.error('Error deleting playbook:', error)
      return NextResponse.json({ error: 'Failed to delete playbook' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Playbook deleted'
    })

  } catch (error) {
    console.error('Error in DELETE /api/playbooks:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 