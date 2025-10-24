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

// POST /api/playbooks/[id]/plays - Record a playbook play
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json()
    const { user_id, session_id, duration_seconds, completed, bookmark_count } = body
    const resolvedParams = await params
    const playbookId = resolvedParams.id

    if (!user_id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    if (!USE_SUPABASE || !supabase) {
      console.log('⚠️  Supabase not available, simulating play recording')
      return NextResponse.json({
        success: true,
        message: 'Play recorded',
        mock: true
      })
    }

    // Check if playbook exists
    const { data: playbook } = await supabase
      .from('user_playbooks')
      .select('id')
      .eq('id', playbookId)
      .single()

    if (!playbook) {
      return NextResponse.json({ error: 'Playbook not found' }, { status: 404 })
    }

    // Record the play
    const { error } = await supabase
      .from('playbook_plays')
      .insert({
        playbook_id: playbookId,
        user_id,
        session_id,
        duration_seconds,
        completed,
        bookmark_count
      })

    if (error) {
      console.error('Error recording playbook play:', error)
      return NextResponse.json({ 
        error: 'Failed to record play' 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Play recorded successfully'
    })

  } catch (error) {
    console.error('Error in POST /api/playbooks/[id]/plays:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET /api/playbooks/[id]/plays - Get play analytics for a playbook
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

    // Check if user owns the playbook
    const { data: playbook } = await supabase
      .from('user_playbooks')
      .select('user_id')
      .eq('id', playbookId)
      .single()

    if (!playbook) {
      return NextResponse.json({ error: 'Playbook not found' }, { status: 404 })
    }

    if (playbook.user_id !== userId) {
      return NextResponse.json({ 
        error: 'Only the owner can view play analytics' 
      }, { status: 403 })
    }

    // Get play analytics
    const { data: plays, error } = await supabase
      .from('playbook_plays')
      .select('*')
      .eq('playbook_id', playbookId)
      .order('played_at', { ascending: false })

    if (error) {
      console.error('Error fetching play analytics:', error)
      return NextResponse.json({ 
        error: 'Failed to fetch analytics' 
      }, { status: 500 })
    }

    // Calculate analytics
    const totalPlays = plays?.length || 0
    const uniquePlayers = new Set(plays?.map(p => p.user_id)).size
    const totalDuration = plays?.reduce((sum, p) => sum + (p.duration_seconds || 0), 0) || 0
    const averageDuration = totalPlays > 0 ? totalDuration / totalPlays : 0
    const completionRate = totalPlays > 0 ? 
      (plays?.filter(p => p.completed).length || 0) / totalPlays : 0

    // Get recent plays (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const recentPlays = plays?.filter(p => 
      new Date(p.played_at) >= thirtyDaysAgo
    ) || []

    return NextResponse.json({
      success: true,
      data: {
        totalPlays,
        uniquePlayers,
        totalDuration,
        averageDuration,
        completionRate,
        recentPlays: recentPlays.length,
        plays: plays?.slice(0, 50) // Return last 50 plays
      }
    })

  } catch (error) {
    console.error('Error in GET /api/playbooks/[id]/plays:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 