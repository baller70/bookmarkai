'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Switch } from '@/src/components/ui/switch';
import { Label } from '@/src/components/ui/label';
import { toast } from 'sonner';

export default function EnhancedBookmarkSettings() {
  const [settings, setSettings] = useState({
    notifications: {
      enabled: true,
      channels: {
        email: true,
        inApp: true,
        push: false
      }
    },
    privacy: {
      shareAnalytics: false
    }
  });

  const updateSetting = (path: string, value: any) => {
    const keys = path.split('.');
    setSettings(prev => {
      const newSettings = { ...prev };
      let current: any = newSettings;
      for (let i = 0; i < keys.length - 1; i++) {
        current[keys[i]] = { ...current[keys[i]] };
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
      return newSettings;
    });
    toast.success('Setting updated');
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your application preferences</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>Configure how you receive notifications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="notif-enabled">Enable Notifications</Label>
            <Switch
              id="notif-enabled"
              checked={settings.notifications.enabled}
              onCheckedChange={(checked) => updateSetting('notifications.enabled', checked)}
            />
          </div>
          
          {settings.notifications.enabled && (
            <>
              <div className="flex items-center justify-between">
                <Label htmlFor="notif-email">Email Notifications</Label>
                <Switch
                  id="notif-email"
                  checked={settings.notifications.channels.email}
                  onCheckedChange={(checked) => updateSetting('notifications.channels.email', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="notif-inapp">In-App Notifications</Label>
                <Switch
                  id="notif-inapp"
                  checked={settings.notifications.channels.inApp}
                  onCheckedChange={(checked) => updateSetting('notifications.channels.inApp', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="notif-push">Push Notifications</Label>
                <Switch
                  id="notif-push"
                  checked={settings.notifications.channels.push}
                  onCheckedChange={(checked) => updateSetting('notifications.channels.push', checked)}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Privacy</CardTitle>
          <CardDescription>Manage your privacy preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="share-analytics">Share Anonymous Analytics</Label>
            <Switch
              id="share-analytics"
              checked={settings.privacy.shareAnalytics}
              onCheckedChange={(checked) => updateSetting('privacy.shareAnalytics', checked)}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={() => toast.success('Settings saved successfully!')}>
          Save Changes
        </Button>
      </div>
    </div>
  );
}
