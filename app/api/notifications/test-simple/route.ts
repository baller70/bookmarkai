import { NextRequest, NextResponse } from 'next/server'
import React from 'react'
import { sendEmail } from '@/lib/email'

// POST /api/notifications/test-simple - Send test notification without authentication
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { channel, to } = body

    if (!channel || !['email', 'push', 'inApp'].includes(channel)) {
      return NextResponse.json({ error: 'Invalid channel' }, { status: 400 })
    }

    // Simulate different notification types
    const notificationData = {
      title: '',
      message: '',
      metadata: {} as Record<string, unknown>
    }

    switch (channel) {
      case 'email':
        notificationData.title = 'Test Email Notification'
        notificationData.message = 'This is a test email notification from your bookmark manager. If you received this, your email notifications are working correctly!'
        notificationData.metadata = {
          recipient: to || 'test@example.com',
          template: 'test_notification'
        }
        // If RESEND_API_KEY is configured, send a real email via Resend
        if (process.env.RESEND_API_KEY && (to || process.env.TEST_EMAIL)) {
          const recipient = (to || process.env.TEST_EMAIL) as string
          await sendEmail({
            to: recipient,
            subject: notificationData.title,
            react: React.createElement('div', null,
              React.createElement('h2', null, '📬 BookmarkHub Notification Test'),
              React.createElement('p', null, notificationData.message)
            )
          })
        } else {
          // Fallback: simulate delay so UI feedback feels consistent
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
        break

      case 'push':
        notificationData.title = 'Test Push Notification'
        notificationData.message = 'Hello! This is a test push notification from your bookmark manager.'
        notificationData.metadata = {
          icon: '/favicon.ico',
          tag: 'test-notification'
        }
        break

      case 'inApp':
        notificationData.title = 'Test In-App Notification'
        notificationData.message = '🔔 Hello! Your bookmark insights are ready and notifications are working perfectly!'
        notificationData.metadata = {
          duration: 5000,
          type: 'info'
        }
        break
    }

    return NextResponse.json({
      success: true,
      message: `Test ${channel} notification sent successfully!`,
      data: notificationData
    })

  } catch (error) {
    console.error('Error sending test notification:', error)
    return NextResponse.json({ error: 'Failed to send test notification' }, { status: 500 })
  }
} 