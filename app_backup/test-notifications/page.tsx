
'use client'
export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { Button } from '@/src/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Input } from '@/src/components/ui/input'
import { toast } from 'sonner'

export default function TestNotifications() {
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')

  const testAPI = async (channel: string) => {
    setLoading(true)
    try {
      console.log('Testing notification channel:', channel)
      
      const response = await fetch('/api/notifications/test-simple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ channel, ...(channel === 'email' && email ? { to: email } : {}) })
      })
      
      console.log('Response status:', response.status)
      
      const result = await response.json()
      console.log('Response data:', result)
      
      if (result.success) {
        if (channel === 'email') {
          toast.success('Test email notification queued!')
        } else if (channel === 'inApp') {
          toast.info(result.data.message, {
            duration: result.data.metadata.duration || 5000,
          })
        } else if (channel === 'push') {
          // Test browser notification
          if ('Notification' in window) {
            let permission = Notification.permission
            
            if (permission === 'default') {
              permission = await Notification.requestPermission()
            }
            
            if (permission === 'granted') {
              new Notification(result.data.title, {
                body: result.data.message,
                icon: result.data.metadata.icon,
                tag: result.data.metadata.tag
              })
              toast.success('Push notification sent!')
            } else {
              toast.error('Push notification permission denied')
            }
          } else {
            toast.error('Push notifications not supported')
          }
        }
      } else {
        toast.error(result.message || 'Test failed')
      }
    } catch (error) {
      console.error('Test error:', error)
      toast.error('Test failed: ' + (error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container max-w-2xl mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Notification Test Page</CardTitle>
          <CardDescription>
            Test notification functionality directly
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Email input for Resend tests */}
          <div className="space-y-2">
            <label className="text-sm text-gray-600">Email recipient (optional)</label>
            <Input
              placeholder="you@domain.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <p className="text-xs text-gray-500">Used only for the Email test. If empty, server will use TEST_EMAIL if configured.</p>
          </div>

          <Button 
            onClick={() => testAPI('email')} 
            disabled={loading}
            className="w-full"
          >
            Test Email Notification
          </Button>
          
          <Button 
            onClick={() => testAPI('inApp')} 
            disabled={loading}
            className="w-full"
          >
            Test In-App Notification
          </Button>
          
          <Button 
            onClick={() => testAPI('push')} 
            disabled={loading}
            className="w-full"
          >
            Test Push Notification
          </Button>
          
          <div className="text-sm text-gray-500 mt-4">
            <p>Open browser console (F12) to see detailed logs</p>
            <p>Check Network tab to see API requests</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 