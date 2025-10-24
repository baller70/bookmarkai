'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { 
  Settings,
  Bell,
  Mail,
  MessageSquare,
  Smartphone,
  Moon,
  Clock
} from 'lucide-react'
import { UserNotificationPreferences } from '../types'
import { useNotifications } from '../hooks/useNotifications'

export const NotificationPreferences: React.FC = () => {
  const { preferences, loading } = useNotifications()
  const [localPreferences, setLocalPreferences] = useState<UserNotificationPreferences>({
    userId: 'user-1',
    enableInApp: true,
    enableEmail: true,
    enableSMS: false,
    enablePush: true,
    quietHours: {
      start: '22:00',
      end: '08:00',
      timezone: 'America/New_York'
    },
    emailDigest: 'daily'
  })

  const handleSave = async () => {
    // TODO: Save preferences to backend
    console.log('Saving preferences:', localPreferences)
  }

  const updatePreference = (key: keyof UserNotificationPreferences, value: any) => {
    setLocalPreferences(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const updateQuietHours = (key: 'start' | 'end' | 'timezone', value: string) => {
    setLocalPreferences(prev => ({
      ...prev,
      quietHours: {
        ...prev.quietHours,
        [key]: value
      }
    }))
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Settings className="h-5 w-5" />
          NOTIFICATION PREFERENCES
        </h3>
        <p className="text-sm text-gray-600">Manage how and when you receive notifications</p>
      </div>

      {/* Delivery Method Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">DELIVERY METHODS</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-blue-600" />
              <div>
                <Label className="font-medium">In-App Notifications</Label>
                <p className="text-xs text-gray-500">Show notifications within the application</p>
              </div>
            </div>
            <Switch
              checked={localPreferences.enableInApp}
              onCheckedChange={(checked) => updatePreference('enableInApp', checked)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-green-600" />
              <div>
                <Label className="font-medium">Email Notifications</Label>
                <p className="text-xs text-gray-500">Send notifications to your email address</p>
              </div>
            </div>
            <Switch
              checked={localPreferences.enableEmail}
              onCheckedChange={(checked) => updatePreference('enableEmail', checked)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MessageSquare className="h-5 w-5 text-purple-600" />
              <div>
                <Label className="font-medium">SMS Notifications</Label>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-gray-500">Send text messages to your phone</p>
                  <Badge variant="secondary">Premium</Badge>
                </div>
              </div>
            </div>
            <Switch
              checked={localPreferences.enableSMS}
              onCheckedChange={(checked) => updatePreference('enableSMS', checked)}
              disabled={true} // TODO: Enable for premium users
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Smartphone className="h-5 w-5 text-orange-600" />
              <div>
                <Label className="font-medium">Push Notifications</Label>
                <p className="text-xs text-gray-500">Browser push notifications</p>
              </div>
            </div>
            <Switch
              checked={localPreferences.enablePush}
              onCheckedChange={(checked) => updatePreference('enablePush', checked)}
            />
          </div>
        </CardContent>
      </Card>      {/* Quiet Hours */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Moon className="h-4 w-4" />
            QUIET HOURS
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">Set times when you don't want to receive notifications</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="quietStart">Start Time</Label>
              <Input
                id="quietStart"
                type="time"
                value={localPreferences.quietHours.start}
                onChange={(e) => updateQuietHours('start', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="quietEnd">End Time</Label>
              <Input
                id="quietEnd"
                type="time"
                value={localPreferences.quietHours.end}
                onChange={(e) => updateQuietHours('end', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="timezone">Timezone</Label>
              <Select 
                value={localPreferences.quietHours.timezone} 
                onValueChange={(value) => updateQuietHours('timezone', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="America/New_York">Eastern Time</SelectItem>
                  <SelectItem value="America/Chicago">Central Time</SelectItem>
                  <SelectItem value="America/Denver">Mountain Time</SelectItem>
                  <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                  <SelectItem value="Europe/London">GMT</SelectItem>
                  <SelectItem value="Europe/Paris">CET</SelectItem>
                  <SelectItem value="Asia/Tokyo">JST</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Email Digest */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4" />
            EMAIL DIGEST
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">Choose how often to receive email summaries</p>
          <Select 
            value={localPreferences.emailDigest} 
            onValueChange={(value: any) => updatePreference('emailDigest', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="immediate">Immediate</SelectItem>
              <SelectItem value="hourly">Hourly</SelectItem>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="never">Never</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={loading}>
          SAVE PREFERENCES
        </Button>
      </div>
    </div>
  )
}