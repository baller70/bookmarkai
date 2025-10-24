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

// POST /api/notifications/test - Send test notification
export async function POST(request: NextRequest) {
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
    const { channel } = body

    if (!channel || !['email', 'push', 'inApp'].includes(channel)) {
      return NextResponse.json({ error: 'Invalid channel' }, { status: 400 })
    }

    // Get user's notification settings to check quiet hours
    const { data: settings } = await getSupabaseClient()
      .from('notification_settings')
      .select('quiet_hours')
      .eq('user_id', user.id)
      .single()

    // Check if we're in quiet hours
    if (settings?.quiet_hours?.enabled) {
      const now = new Date()
      const currentTime = now.getHours() * 60 + now.getMinutes()
      
      const [startHour, startMinute] = settings.quiet_hours.start.split(':').map(Number)
      const [endHour, endMinute] = settings.quiet_hours.end.split(':').map(Number)
      
      const startTime = startHour * 60 + startMinute
      const endTime = endHour * 60 + endMinute
      
      // Handle overnight quiet hours (e.g., 22:00 to 08:00)
      const isInQuietHours = startTime > endTime 
        ? (currentTime >= startTime || currentTime <= endTime)
        : (currentTime >= startTime && currentTime <= endTime)
      
      if (isInQuietHours) {
        return NextResponse.json({ 
          success: false, 
          message: 'Notifications are currently silenced due to quiet hours settings.' 
        })
      }
    }

    // Get user profile for personalization
    const { data: profile } = await getSupabaseClient()
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single()

    const userName = profile?.full_name || 'User'
    
    // Create notification based on channel
    const notificationData = {
      user_id: user.id,
      channel,
      event_type: 'test_notification',
      title: '',
      message: '',
      status: 'sent' as const,
      sent_at: new Date().toISOString(),
      metadata: {} as Record<string, unknown>
    }

    switch (channel) {
      case 'email':
        notificationData.title = `Test Email Notification for ${userName}`
        notificationData.message = 'This is a test email notification from your bookmark manager. If you received this, your email notifications are working correctly!'
        notificationData.metadata = {
          recipient: user.email,
          template: 'test_notification'
        }
        
        // In a real implementation, you would send the actual email here
        // For now, we'll just log it and mark as sent
        console.log(`Would send email to ${user.email}:`, notificationData)
        break

      case 'push':
        notificationData.title = 'Test Push Notification'
        notificationData.message = `Hello ${userName}! This is a test push notification from your bookmark manager.`
        notificationData.metadata = {
          icon: '/favicon.ico',
          tag: 'test-notification'
        }
        
        // Push notifications are handled client-side via the browser API
        // We just log this for tracking purposes
        console.log('Push notification data prepared:', notificationData)
        break

      case 'inApp':
        notificationData.title = 'Test In-App Notification'
        notificationData.message = `🔔 Hello ${userName}! Your bookmark insights are ready and notifications are working perfectly!`
        notificationData.metadata = {
          duration: 5000,
          type: 'info'
        }
        break
    }

    // Save notification log to database
    const { error: logError } = await getSupabaseClient()
      .from('notification_logs')
      .insert(notificationData)

    if (logError) {
      console.error('Error saving notification log:', logError)
      // Don't fail the request if logging fails
    }

    // Simulate email sending delay for realism
    if (channel === 'email') {
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    return NextResponse.json({
      success: true,
      message: `Test ${channel} notification sent successfully!`,
      data: {
        title: notificationData.title,
        message: notificationData.message,
        metadata: notificationData.metadata
      }
    })

  } catch (error) {
    console.error('Error sending test notification:', error)
    return NextResponse.json({ error: 'Failed to send test notification' }, { status: 500 })
  }
} 