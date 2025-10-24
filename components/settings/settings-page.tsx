
'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import { 
  ArrowLeftIcon, 
  UserIcon, 
  BellIcon, 
  PaletteIcon, 
  ShieldIcon,
  DatabaseIcon,
  BrainIcon 
} from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'

export default function SettingsPage() {
  const { data: session } = useSession()
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: false,
    aiProcessing: true,
    smartTags: true,
    autoCategory: true,
    theme: 'system',
    defaultView: 'grid'
  })

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }))
    toast.success('Setting updated successfully!')
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-8">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard">
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Settings</h1>
            <p className="text-slate-600 dark:text-slate-400">
              Customize your BookmarkAI experience
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Profile Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <UserIcon className="h-5 w-5" />
                  <span>Profile</span>
                </CardTitle>
                <CardDescription>
                  Manage your account information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      defaultValue={session?.user?.name || ''}
                      placeholder="Your full name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      defaultValue={session?.user?.email || ''}
                      disabled
                      className="bg-slate-100 dark:bg-slate-800"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Appearance Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <PaletteIcon className="h-5 w-5" />
                  <span>Appearance</span>
                </CardTitle>
                <CardDescription>
                  Customize the look and feel of your dashboard
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="theme">Theme</Label>
                    <Select 
                      value={settings.theme} 
                      onValueChange={(value) => handleSettingChange('theme', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                        <SelectItem value="system">System</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="defaultView">Default View</Label>
                    <Select 
                      value={settings.defaultView} 
                      onValueChange={(value) => handleSettingChange('defaultView', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="grid">Grid View</SelectItem>
                        <SelectItem value="kanban">Kanban View</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Notifications */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BellIcon className="h-5 w-5" />
                  <span>Notifications</span>
                </CardTitle>
                <CardDescription>
                  Control how you receive notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="emailNotifications">Email Notifications</Label>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Receive notifications via email
                    </p>
                  </div>
                  <Switch
                    id="emailNotifications"
                    checked={settings.emailNotifications}
                    onCheckedChange={(checked) => handleSettingChange('emailNotifications', checked)}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="pushNotifications">Push Notifications</Label>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Receive push notifications in your browser
                    </p>
                  </div>
                  <Switch
                    id="pushNotifications"
                    checked={settings.pushNotifications}
                    onCheckedChange={(checked) => handleSettingChange('pushNotifications', checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* AI Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BrainIcon className="h-5 w-5" />
                  <span>AI Features</span>
                </CardTitle>
                <CardDescription>
                  Configure AI-powered bookmark processing
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="aiProcessing">Auto AI Processing</Label>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Automatically process new bookmarks with AI
                    </p>
                  </div>
                  <Switch
                    id="aiProcessing"
                    checked={settings.aiProcessing}
                    onCheckedChange={(checked) => handleSettingChange('aiProcessing', checked)}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="smartTags">Smart Tags</Label>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Generate intelligent tags for bookmarks
                    </p>
                  </div>
                  <Switch
                    id="smartTags"
                    checked={settings.smartTags}
                    onCheckedChange={(checked) => handleSettingChange('smartTags', checked)}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="autoCategory">Auto Categorization</Label>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Automatically categorize bookmarks
                    </p>
                  </div>
                  <Switch
                    id="autoCategory"
                    checked={settings.autoCategory}
                    onCheckedChange={(checked) => handleSettingChange('autoCategory', checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Data & Privacy */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.4 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <ShieldIcon className="h-5 w-5" />
                  <span>Data & Privacy</span>
                </CardTitle>
                <CardDescription>
                  Control your data and privacy settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Analytics</Label>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Help us improve BookmarkAI with usage analytics
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Save Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.5 }}
            className="flex justify-end"
          >
            <Button onClick={() => toast.success('Settings saved successfully!')}>
              Save Changes
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
