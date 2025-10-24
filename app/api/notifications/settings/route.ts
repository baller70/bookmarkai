import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Use the same client configuration as the frontend
// Lazy initialization to avoid build-time environment variable issues
let supabaseClient: any = null

const getSupabaseClient = () => {
  if (!supabaseClient && process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )
  }
  return supabaseClient
}

// GET /api/notifications/settings - Get user's notification settings
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const { data: { user }, error: authError } = await getSupabaseClient().auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Get user's notification settings
    const { data: settings, error } = await getSupabaseClient()
      .from('notification_settings')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching notification settings:', error)
      return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
    }

    // Return default settings if none exist
    if (!settings) {
      const defaultSettings = {
        channels: { email: true, inApp: true, push: false },
        events: {
          aiRecommendations: true,
          weeklyDigest: true,
          timeCapsuleReminders: true,
          collaborativeInvites: true,
          analyticsAlerts: false
        },
        quiet_hours: { enabled: false, start: '22:00', end: '08:00' },
        digest: { frequency: 'weekly', day: 'monday', time: '09:00' }
      }
      return NextResponse.json(defaultSettings)
    }

    return NextResponse.json({
      channels: settings.channels,
      events: settings.events,
      quiet_hours: settings.quiet_hours,
      digest: settings.digest
    })

  } catch (error) {
    console.error('Error in notification settings GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/notifications/settings - Update user's notification settings
export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const { data: { user }, error: authError } = await getSupabaseClient().auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const body = await request.json()
    const { channels, events, quiet_hours, digest } = body

    // Upsert notification settings
    const { data, error } = await getSupabaseClient()
      .from('notification_settings')
      .upsert({
        user_id: user.id,
        channels: channels || { email: true, inApp: true, push: false },
        events: events || {
          aiRecommendations: true,
          weeklyDigest: true,
          timeCapsuleReminders: true,
          collaborativeInvites: true,
          analyticsAlerts: false
        },
        quiet_hours: quiet_hours || { enabled: false, start: '22:00', end: '08:00' },
        digest: digest || { frequency: 'weekly', day: 'monday', time: '09:00' },
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })
      .select()
      .single()

    if (error) {
      console.error('Error updating notification settings:', error)
      return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
    }

    return NextResponse.json({
      channels: data.channels,
      events: data.events,
      quiet_hours: data.quiet_hours,
      digest: data.digest
    })

  } catch (error) {
    console.error('Error in notification settings PUT:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 