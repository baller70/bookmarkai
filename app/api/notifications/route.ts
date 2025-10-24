import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser, createUnauthorizedResponse } from '@/lib/auth-utils';
import { createClient } from '@supabase/supabase-js';

// Supabase client (anon) for server routes
let supabaseClient: any = null
const getSupabase = () => {
  if (!supabaseClient && process.env.NEXT_PUBLIC_SUPABASE_URL) {
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      serviceKey as string
    )
  }
  return supabaseClient
}

const DEV_USER_ID = '00000000-0000-0000-0000-000000000001'

interface NotificationSettings {
  id: string;
  bookmarkId: string;
  userId: string;
  title: string;
  message: string;
  type: 'reminder' | 'alert' | 'digest' | 'custom';
  frequency: 'once' | 'daily' | 'weekly' | 'monthly' | 'custom';
  deliveryMethods: ('in-app' | 'email' | 'sms' | 'push')[];
  scheduledTime: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  nextSend?: Date;
  customSchedule?: {
    days: string[];
    time: string;
    timezone: string;
  };
}

interface NotificationHistory {
  id: string;
  notificationId: string;
  userId: string;
  bookmarkId: string;
  title: string;
  message: string;
  deliveryMethod: string;
  status: 'sent' | 'delivered' | 'failed' | 'pending';
  sentAt: Date;
  deliveredAt?: Date;
  error?: string;
}

interface UserNotificationPreferences {
  userId: string;
  enableInApp: boolean;
  enableEmail: boolean;
  enableSMS: boolean;
  enablePush: boolean;
  quietHours: {
    start: string;
    end: string;
    timezone: string;
  };
  emailDigest: 'never' | 'daily' | 'weekly' | 'monthly';
  updatedAt: Date;
}

// GET /api/notifications - Get notifications for user/bookmark
export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateUser(request)
    const userId = authResult.success && authResult.userId ? authResult.userId : DEV_USER_ID

    const { searchParams } = new URL(request.url);
    const bookmarkId = searchParams.get('bookmark_id');
    const type = searchParams.get('type'); // notifications, history, preferences

    const sb = getSupabase()
    let result: any = {}

    if (type === 'notifications' || !type) {
      let q = sb
        .from('user_notifications')
        .select('id, user_id, title, message, type, is_read, data, created_at, updated_at')
        .or(`user_id.eq.${userId},user_id.is.null`)
        .order('created_at', { ascending: false })
      if (bookmarkId) {
        q = q.contains('data', { bookmarkId }) as any
      }
      const { data, error } = await q
      if (error) {
        console.error('Error fetching notifications:', error)
        return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 })
      }
      result.notifications = (data || []).map((row: any) => {
        const d = row.data || {}
        return {
          id: row.id,
          bookmarkId: d.bookmarkId || '',
          userId: row.user_id,
          title: row.title,
          message: row.message,
          type: (row.type || 'reminder') as NotificationSettings['type'],
          frequency: (d.frequency || 'once') as NotificationSettings['frequency'],
          deliveryMethods: (d.deliveryMethods || ['in-app']) as NotificationSettings['deliveryMethods'],
          scheduledTime: d.scheduledTime ? new Date(d.scheduledTime) : new Date(),
          isActive: d.isActive ?? true,
          createdAt: row.created_at ? new Date(row.created_at) : new Date(),
          updatedAt: row.updated_at ? new Date(row.updated_at) : new Date(),
          nextSend: d.nextSend ? new Date(d.nextSend) : undefined,
          customSchedule: d.recurringPattern ? {
            days: d.recurringPattern.days || [],
            time: d.recurringPattern.time || '09:00',
            timezone: d.recurringPattern.timezone || 'UTC'
          } : undefined
        } as NotificationSettings
      })
    }

    if (type === 'history' || !type) {
      const { data, error } = await sb
        .from('notification_logs')
        .select('*')
        .eq('user_id', userId)
        .order('sent_at', { ascending: false })
      if (error) {
        console.error('Error fetching notification history:', error)
        return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 })
      }
      result.history = data || []
    }

    if (type === 'preferences' || !type) {
      const { data, error } = await sb
        .from('notification_settings')
        .select('*')
        .eq('user_id', userId)
        .single()
      if (error && (error as any).code !== 'PGRST116') {
        console.error('Error fetching notification settings:', error)
        return NextResponse.json({ error: 'Failed to fetch preferences' }, { status: 500 })
      }
      result.preferences = data || {
        userId,
        enableInApp: true,
        enableEmail: true,
        enableSMS: false,
        enablePush: true,
        quietHours: { start: '22:00', end: '08:00', timezone: 'America/New_York' },
        emailDigest: 'daily',
        updatedAt: new Date()
      }
    }

    if (type && (result as any)[type] !== undefined) {
      return NextResponse.json({ success: true, data: (result as any)[type] })
    }

    return NextResponse.json({ success: true, data: result })

  } catch (error) {
    console.error('❌ Error fetching notification data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/notifications - Create or update notification data
export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateUser(request)
    const userId = authResult.success && authResult.userId ? authResult.userId : DEV_USER_ID
    
    const body = await request.json();
    const { type, action, data: itemData } = body;
    const sb = getSupabase()

    switch (type) {
      case 'notification': {
        if (action === 'create') {
          const payload = {
            user_id: userId,
            type: itemData.type || 'reminder',
            title: itemData.title,
            message: itemData.message,
            is_read: false,
            data: {
              bookmarkId: itemData.bookmarkId,
              frequency: itemData.frequency || 'once',
              deliveryMethods: itemData.deliveryMethods || ['in-app'],
              scheduledTime: itemData.scheduledTime,
              duration: itemData.duration, // Duration in minutes for tasks
              recurringPattern: itemData.recurringPattern,
              teamMembers: itemData.teamMembers || [],
              isActive: itemData.isActive ?? true,
              nextSend: itemData.nextSend
            }
          }
          console.log('Creating notification with payload:', JSON.stringify(payload, null, 2))
          
          // First, let's check if the table exists by trying a simple select
          const { data: testData, error: testError } = await sb.from('user_notifications').select('*').limit(1)
          console.log('Table test result:', { testData, testError })
          
          let { error } = await sb.from('user_notifications').insert(payload)
          if (error) {
            // If FK violation, seed a dev profile and retry with user-owned row
            const code = (error as any).code
            if (code === '23503') {
              console.warn('FK violation creating notification. Seeding profile for user and retrying...', { userId })
              await sb.from('profiles').upsert({ id: userId, email: `${userId.slice(0,8)}@example.dev`, full_name: 'Dev User' }, { onConflict: 'id' })
              const retryOwn = await sb.from('user_notifications').insert(payload)
              error = retryOwn.error
            }
            // If still failing, retry as global (null user_id) only if column allows null
            if (error) {
              console.warn('Primary insert still failing, retrying as global (null user_id):', error)
              const retry = { ...payload, user_id: null }
              const retryRes = await sb.from('user_notifications').insert(retry)
              error = retryRes.error
            }
          }
          if (error) {
            console.error('Error creating notification:', error)
            const errorDetails = {
              message: (error as any).message || 'Unknown error',
              hint: (error as any).hint,
              details: (error as any).details,
              code: (error as any).code,
              fullError: JSON.stringify(error, null, 2)
            }
            return NextResponse.json({ error: 'Failed to create notification', details: errorDetails }, { status: 500 })
          }
          
          // Success case - notification created successfully
          return NextResponse.json({ success: true, message: 'Notification created successfully' })
          
        } else if (action === 'update') {
          const id = itemData.id as string
          const updates: any = {
            title: itemData.title,
            message: itemData.message,
          }
          if (itemData.type) updates.type = itemData.type
          if (itemData.isActive !== undefined || itemData.frequency || itemData.deliveryMethods || itemData.scheduledTime || itemData.recurringPattern || itemData.teamMembers) {
            updates.data = {
              bookmarkId: itemData.bookmarkId,
              frequency: itemData.frequency,
              deliveryMethods: itemData.deliveryMethods,
              scheduledTime: itemData.scheduledTime,
              recurringPattern: itemData.recurringPattern,
              teamMembers: itemData.teamMembers,
              isActive: itemData.isActive,
              nextSend: itemData.nextSend
            }
          }
          const { error } = await sb.from('user_notifications').update(updates).eq('id', id).or(`user_id.eq.${userId},user_id.is.null`)
          if (error) {
            console.error('Error updating notification:', error)
            return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 })
          }
        } else if (action === 'delete') {
          const id = itemData.id as string
          const { error } = await sb.from('user_notifications').delete().eq('id', id).or(`user_id.eq.${userId},user_id.is.null`)
          if (error) {
            console.error('Error deleting notification:', error)
            return NextResponse.json({ error: 'Failed to delete notification' }, { status: 500 })
          }
        } else if (action === 'toggle') {
          const id = itemData.id as string
          // Fetch existing to flip isActive inside data
          const { data: rows, error: fErr } = await sb
            .from('user_notifications')
            .select('data, user_id')
            .eq('id', id)
            .or(`user_id.eq.${userId},user_id.is.null`)
            .single()
          if (fErr) {
            console.error('Error loading notification to toggle:', fErr)
            return NextResponse.json({ error: 'Failed to toggle notification' }, { status: 500 })
          }
          const data = rows?.data || {}
          const newData = { ...data, isActive: !(data.isActive ?? true) }
          const { error } = await sb
            .from('user_notifications')
            .update({ data: newData })
            .eq('id', id)
            .or(`user_id.eq.${userId},user_id.is.null`)
          if (error) {
            console.error('Error toggling notification:', error)
            return NextResponse.json({ error: 'Failed to toggle notification' }, { status: 500 })
          }
        }
        break
      }

      case 'history': {
        if (action === 'create') {
          const payload = {
            user_id: userId,
            channel: itemData.channel || 'inApp',
            event_type: itemData.event_type || 'custom',
            title: itemData.title,
            message: itemData.message,
            status: itemData.status || 'sent',
            sent_at: itemData.sentAt || new Date().toISOString(),
            metadata: itemData.metadata || {}
          }
          const { error } = await sb.from('notification_logs').insert(payload)
          if (error) {
            console.error('Error creating notification history:', error)
            return NextResponse.json({ error: 'Failed to create history' }, { status: 500 })
          }
        }
        break
      }

      case 'preferences': {
        if (action === 'update') {
          const { error } = await sb
            .from('notification_settings')
            .upsert({
              user_id: userId,
              channels: itemData.channels || { email: true, inApp: true, push: false },
              events: itemData.events || {},
              quiet_hours: itemData.quiet_hours || { enabled: false, start: '22:00', end: '08:00' },
              digest: itemData.digest || { frequency: 'weekly', day: 'monday', time: '09:00' },
              updated_at: new Date().toISOString()
            }, { onConflict: 'user_id' })
          if (error) {
            console.error('Error updating preferences:', error)
            return NextResponse.json({ error: 'Failed to update preferences' }, { status: 500 })
          }
        }
        break
      }

      default:
        return NextResponse.json(
          { error: 'Invalid type specified' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      message: `${type} ${action}d successfully`
    });

  } catch (error) {
    console.error('❌ Error updating notification data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/notifications - Delete notification
export async function DELETE(request: NextRequest) {
  try {
    const authResult = await authenticateUser(request)
    const userId = authResult.success && authResult.userId ? authResult.userId : DEV_USER_ID

    const { searchParams } = new URL(request.url);
    const notificationId = searchParams.get('id');

    if (!notificationId) {
      return NextResponse.json(
        { error: 'Notification ID is required' },
        { status: 400 }
      );
    }

    const sb = getSupabase()
    const { error } = await sb
      .from('user_notifications')
      .delete()
      .eq('id', notificationId)
      .or(`user_id.eq.${userId},user_id.is.null`)
    if (error) {
      console.error('Error deleting notification:', error)
      return NextResponse.json({ error: 'Failed to delete notification' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Notification deleted successfully'
    });

  } catch (error) {
    console.error('❌ Error deleting notification:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}    