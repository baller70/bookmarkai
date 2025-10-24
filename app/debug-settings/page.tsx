
'use client'
export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { Button } from '@/src/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Switch } from '@/src/components/ui/switch'
import { Label } from '@/src/components/ui/label'
import { toast } from 'sonner'
// Sentry removed
import { supabase } from '@/src/lib/supabase'

export default function DebugSettings() {
  const [debugInfo, setDebugInfo] = useState<Record<string, any>>({})
  const [notificationSettings, setNotificationSettings] = useState({
    channels: {
      email: true,
      inApp: true,
      push: false
    }
  })

  useEffect(() => {
    // Collect debug information
    const collectDebugInfo = async () => {
             const info: Record<string, any> = {
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        notificationSupport: 'Notification' in window,
        notificationPermission: 'Notification' in window ? Notification.permission : 'not_supported',
        localStorage: {
          available: typeof localStorage !== 'undefined',
          userSettings: localStorage.getItem('userSettings') ? 'exists' : 'not_found'
        },
        supabase: {
          url: process.env.NEXT_PUBLIC_SUPABASE_URL || 'not_set',
          anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'set' : 'not_set'
        },
        errors: []
      }

      // Test Supabase connection
      try {
        const { data: { session } } = await supabase.auth.getSession()
        info.supabase = {
          ...info.supabase,
          session: session ? 'exists' : 'no_session',
          user: session?.user?.id || 'no_user'
        }
      } catch (error) {
        (info.errors as any[]).push({ type: 'supabase_session', error: (error as Error).message })
      }

      // Test API endpoints
      try {
        const response = await fetch('/api/notifications/test-simple', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ channel: 'inApp' })
        })
        info.api = {
          status: response.status,
          ok: response.ok
        }
        if (response.ok) {
          const data = await response.json()
          info.api = {
            ...info.api,
            data: data
          }
        }
      } catch (error) {
        (info.errors as any[]).push({ type: 'api_test', error: (error as Error).message })
      }

      setDebugInfo(info)
      
      // Send debug info to Sentry
      console.log({
        category: 'debug',
        message: 'Debug settings page loaded',
        data: info,
        level: 'info'
      })
    }

    collectDebugInfo()
  }, [])

  const sendTestNotification = async (channel: string) => {
        try {
          // Sentry tracing removed
          console.log('🔔 DEBUG: Starting test notification for channel:', channel)
          
          if (channel === 'push') {
            // Test browser notifications
            if ('Notification' in window) {
              let permission = Notification.permission
              console.log('🔔 DEBUG: Current permission:', permission)
              
              if (permission === 'default') {
                console.log('🔔 DEBUG: Requesting permission...')
                permission = await Notification.requestPermission()
                console.log('🔔 DEBUG: Permission after request:', permission)
              }
              
              if (permission === 'granted') {
                console.log('🔔 DEBUG: Creating browser notification...')
                const notification = new Notification('Debug Test Notification', {
                  body: 'This is a debug test push notification.',
                  icon: '/favicon.ico',
                  tag: 'debug-test'
                })
                
                notification.onclick = () => {
                  console.log('🔔 DEBUG: Notification clicked')
                  notification.close()
                }
                
                toast.success('Push notification sent successfully!')
                // Sentry attribute removed
              } else {
                console.log('🔔 DEBUG: Permission denied')
                toast.error('Push notification permission denied')
                // Sentry attribute removed
              }
            } else {
              console.log('🔔 DEBUG: Notifications not supported')
              toast.error('Push notifications not supported in this browser')
              // Sentry attribute removed
            }
          } else {
            // Test API notifications
            console.log('🔔 DEBUG: Making API request...')
            
            const response = await fetch('/api/notifications/test-simple', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ channel })
            })
            
            console.log('🔔 DEBUG: API response status:', response.status)
            // Sentry attribute removed
            
            const result = await response.json()
            console.log('🔔 DEBUG: API response data:', result)
            // Sentry attribute removed
            
            if (result.success) {
              if (channel === 'email') {
                toast.success('Test email notification queued!')
              } else if (channel === 'inApp') {
                toast.info(result.data.message, {
                  duration: result.data.metadata.duration || 5000,
                })
              }
            } else {
              toast.error(result.message || 'Test failed')
            }
          }
          
          console.log('🔔 DEBUG: Test notification completed for channel:', channel)
          
        } catch (error) {
          console.error('🔔 DEBUG: Test notification error:', error)
          console.error(error, {
            tags: {
              component: 'debug_settings',
              action: 'test_notification',
              channel
            },
            extra: {
              channel,
              debugInfo
            }
          })
          toast.error(`Failed to send test ${channel} notification`)
        }
  }

  return (
    <div className="container max-w-4xl mx-auto py-8 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Debug Settings Page</CardTitle>
          <CardDescription>
            Enhanced debugging version of the settings page with detailed logging
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Debug Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Debug Information</h3>
            <div className="bg-gray-100 p-4 rounded-lg text-sm">
              <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
            </div>
          </div>

          {/* Notification Channels */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Notification Channels</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Label>Email Notifications</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={notificationSettings.channels.email}
                    onCheckedChange={(checked) => {
                      console.log('🔔 DEBUG: Email toggle changed to:', checked)
                      setNotificationSettings(prev => ({
                        ...prev,
                        channels: { ...prev.channels, email: checked }
                      }))
                    }}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => sendTestNotification('email')}
                    disabled={!notificationSettings.channels.email}
                  >
                    Test Email
                  </Button>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Label>In-App Notifications</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={notificationSettings.channels.inApp}
                    onCheckedChange={(checked) => {
                      console.log('🔔 DEBUG: In-app toggle changed to:', checked)
                      setNotificationSettings(prev => ({
                        ...prev,
                        channels: { ...prev.channels, inApp: checked }
                      }))
                    }}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => sendTestNotification('inApp')}
                    disabled={!notificationSettings.channels.inApp}
                  >
                    Test In-App
                  </Button>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Label>Push Notifications</Label>
                  <span className="text-sm text-gray-500">
                    {debugInfo.notificationSupport 
                      ? `Permission: ${debugInfo.notificationPermission}`
                      : 'Not supported'
                    }
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={notificationSettings.channels.push}
                    onCheckedChange={(checked) => {
                      console.log('🔔 DEBUG: Push toggle changed to:', checked)
                      setNotificationSettings(prev => ({
                        ...prev,
                        channels: { ...prev.channels, push: checked }
                      }))
                    }}
                    disabled={!debugInfo.notificationSupport}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => sendTestNotification('push')}
                    disabled={!notificationSettings.channels.push || !debugInfo.notificationSupport}
                  >
                    Test Push
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Console Instructions */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-900">Debug Instructions</h4>
            <ul className="text-sm text-blue-800 mt-2 space-y-1">
              <li>• Open browser console (F12) to see detailed logs</li>
              <li>• Look for messages starting with "🔔 DEBUG:"</li>
              <li>• Check Network tab for API requests</li>
              <li>• All errors are automatically sent to Sentry</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}  