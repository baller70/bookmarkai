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

// POST /api/playbooks/[id]/likes - Like a playbook
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json()
    const { user_id } = body
    const resolvedParams = await params
    const playbookId = resolvedParams.id

    if (!user_id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    const tablesExist = await checkTablesExist()
    
    if (!tablesExist) {
      console.log('⚠️  Database tables not found, simulating like action')
      
      return NextResponse.json({
        success: true,
        message: 'Playbook liked',
        mock: true
      })
    }

    // Check if playbook exists and is accessible
    const { data: playbook, error: playbookError } = await supabase
      .from('user_playbooks')
      .select('id, is_public, user_id')
      .eq('id', playbookId)
      .single()

    if (playbookError || !playbook) {
      return NextResponse.json({ error: 'Playbook not found' }, { status: 404 })
    }

    if (!playbook.is_public && playbook.user_id !== user_id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Check if user already liked this playbook
    const { data: existingLike } = await supabase
      .from('playbook_likes')
      .select('id')
      .eq('playbook_id', playbookId)
      .eq('user_id', user_id)
      .single()

    if (existingLike) {
      return NextResponse.json({ error: 'Already liked' }, { status: 400 })
    }

    // Add like
    const { error: likeError } = await supabase
      .from('playbook_likes')
      .insert({
        playbook_id: playbookId,
        user_id
      })

    if (likeError) {
      console.error('Error adding like:', likeError)
      return NextResponse.json({ error: 'Failed to like playbook' }, { status: 500 })
    }

    // Update likes count
    const { data: currentPlaybook } = await supabase
      .from('user_playbooks')
      .select('likes_count')
      .eq('id', playbookId)
      .single()

    const { error: updateError } = await supabase
      .from('user_playbooks')
      .update({ likes_count: (currentPlaybook?.likes_count || 0) + 1 })
      .eq('id', playbookId)

    if (updateError) {
      console.error('Error updating likes count:', updateError)
    }

    return NextResponse.json({
      success: true,
      message: 'Playbook liked'
    })

  } catch (error) {
    console.error('Error in POST /api/playbooks/[id]/likes:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/playbooks/[id]/likes - Unlike a playbook
export async function DELETE(
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
      console.log('⚠️  Database tables not found, simulating unlike action')
      
      return NextResponse.json({
        success: true,
        message: 'Playbook unliked',
        mock: true
      })
    }

    // Remove like
    const { error } = await supabase
      .from('playbook_likes')
      .delete()
      .eq('playbook_id', playbookId)
      .eq('user_id', userId)

    if (error) {
      console.error('Error removing like:', error)
      return NextResponse.json({ error: 'Failed to unlike playbook' }, { status: 500 })
    }

    // Update likes count
    const { data: currentPlaybook } = await supabase
      .from('user_playbooks')
      .select('likes_count')
      .eq('id', playbookId)
      .single()

    const { error: updateError } = await supabase
      .from('user_playbooks')
      .update({ likes_count: Math.max((currentPlaybook?.likes_count || 0) - 1, 0) })
      .eq('id', playbookId)

    if (updateError) {
      console.error('Error updating likes count:', updateError)
    }

    return NextResponse.json({
      success: true,
      message: 'Playbook unliked'
    })

  } catch (error) {
    console.error('Error in DELETE /api/playbooks/[id]/likes:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 