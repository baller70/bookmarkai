'use client'

import { useState, useEffect } from 'react'
import { createDemoSupabaseClient, DEMO_USER_ID } from '../../../../lib/supabase-demo'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Globe, Save, Plus, X, Monitor, Smartphone, Tablet, Eye, Palette, Settings } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface SitePreferences {
  id?: string
  user_id?: string
  
  // Display Settings
  theme: 'light' | 'dark' | 'auto'
  color_scheme: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'custom'
  custom_accent_color?: string
  font_size: 'small' | 'medium' | 'large' | 'extra-large'
  font_family: 'system' | 'serif' | 'sans-serif' | 'mono'
  
  // Layout Preferences
  sidebar_position: 'left' | 'right' | 'hidden'
  content_width: 'narrow' | 'medium' | 'wide' | 'full'
  card_style: 'minimal' | 'bordered' | 'elevated' | 'compact'
  list_density: 'comfortable' | 'compact' | 'cozy'
  
  // Reading Experience
  reading_mode_enabled: boolean
  focus_mode_enabled: boolean
  auto_scroll_enabled: boolean
  scroll_speed: number
  highlight_links: boolean
  show_reading_progress: boolean
  
  // Navigation & Interaction
  quick_actions_enabled: boolean
  keyboard_shortcuts_enabled: boolean
  gesture_navigation: boolean
  auto_save_enabled: boolean
  confirmation_dialogs: boolean
  
  // Content Display
  show_thumbnails: boolean
  show_excerpts: boolean
  show_metadata: boolean
  show_tags: boolean
  show_reading_time: boolean
  group_by_date: boolean
  
  // Performance & Data
  lazy_loading: boolean
  image_optimization: boolean
  offline_mode: boolean
  sync_frequency: 'real-time' | 'hourly' | 'daily' | 'manual'
  data_saver_mode: boolean
  
  // Privacy & Security
  analytics_enabled: boolean
  crash_reporting: boolean
  usage_tracking: boolean
  share_anonymous_data: boolean
  
  // Notifications
  browser_notifications: boolean
  email_notifications: boolean
  push_notifications: boolean
  notification_frequency: 'instant' | 'hourly' | 'daily' | 'weekly'
  
  // Advanced
  experimental_features: boolean
  beta_testing: boolean
  developer_mode: boolean
  
  // Custom CSS
  custom_css: string
  
  // Notes
  additional_notes: string
  
  last_updated: string
}

const defaultPreferences: SitePreferences = {
  theme: 'auto',
  color_scheme: 'blue',
  font_size: 'medium',
  font_family: 'system',
  
  sidebar_position: 'left',
  content_width: 'medium',
  card_style: 'bordered',
  list_density: 'comfortable',
  
  reading_mode_enabled: true,
  focus_mode_enabled: false,
  auto_scroll_enabled: false,
  scroll_speed: 50,
  highlight_links: true,
  show_reading_progress: true,
  
  quick_actions_enabled: true,
  keyboard_shortcuts_enabled: true,
  gesture_navigation: false,
  auto_save_enabled: true,
  confirmation_dialogs: true,
  
  show_thumbnails: true,
  show_excerpts: true,
  show_metadata: true,
  show_tags: true,
  show_reading_time: true,
  group_by_date: false,
  
  lazy_loading: true,
  image_optimization: true,
  offline_mode: false,
  sync_frequency: 'real-time',
  data_saver_mode: false,
  
  analytics_enabled: true,
  crash_reporting: true,
  usage_tracking: false,
  share_anonymous_data: false,
  
  browser_notifications: true,
  email_notifications: false,
  push_notifications: false,
  notification_frequency: 'daily',
  
  experimental_features: false,
  beta_testing: false,
  developer_mode: false,
  
  custom_css: '',
  additional_notes: '',
  last_updated: new Date().toISOString()
}

const colorSchemes = [
  { value: 'blue', label: 'Blue', color: 'bg-blue-500' },
  { value: 'green', label: 'Green', color: 'bg-green-500' },
  { value: 'purple', label: 'Purple', color: 'bg-purple-500' },
  { value: 'orange', label: 'Orange', color: 'bg-orange-500' },
  { value: 'red', label: 'Red', color: 'bg-red-500' },
  { value: 'custom', label: 'Custom', color: 'bg-gray-500' }
]

export default function SitePreferencePage() {
  const [preferences, setPreferences] = useState<SitePreferences>(defaultPreferences)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)
  
  const supabase = createDemoSupabaseClient()

  useEffect(() => {
    loadPreferences()
  }, [])

  const loadPreferences = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('dna_site_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (data) {
        setPreferences({ ...defaultPreferences, ...data })
      }
    } catch (error) {
      console.error('Error loading site preferences:', error)
    } finally {
      setLoading(false)
    }
  }

  const savePreferences = async () => {
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const preferencesData = {
        ...preferences,
        user_id: user.id,
        last_updated: new Date().toISOString()
      }

      const { error } = await supabase
        .from('dna_site_preferences')
        .upsert(preferencesData)

      if (error) throw error

      toast({
        title: "Site preferences saved!",
        description: "Your interface and display preferences have been updated.",
      })
    } catch (error) {
      console.error('Error saving site preferences:', error)
      toast({
        title: "Error saving preferences",
        description: "Please try again later.",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Site Preferences</h2>
          <p className="text-gray-600 mt-2">Customize your interface and browsing experience</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => setPreviewMode(!previewMode)}
            className="flex items-center gap-2"
          >
            <Eye className="h-4 w-4" />
            {previewMode ? 'Exit Preview' : 'Preview'}
          </Button>
          <Button onClick={savePreferences} disabled={saving} className="flex items-center gap-2">
            {saving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Save className="h-4 w-4" />
            )}
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </div>

      {/* Theme & Appearance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Theme & Appearance
          </CardTitle>
          <CardDescription>
            Customize the visual appearance of the interface
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label>Theme</Label>
              <Select
                value={preferences.theme}
                onValueChange={(value: SitePreferences['theme']) => 
                  setPreferences(prev => ({ ...prev, theme: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="auto">Auto (System)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label>Color Scheme</Label>
              <div className="grid grid-cols-3 gap-2">
                {colorSchemes.map((scheme) => (
                  <button
                    key={scheme.value}
                    onClick={() => setPreferences(prev => ({ ...prev, color_scheme: scheme.value as SitePreferences['color_scheme'] }))}
                    className={`p-3 rounded-lg border-2 transition-colors ${
                      preferences.color_scheme === scheme.value
                        ? 'border-primary'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded-full ${scheme.color}`}></div>
                      <span className="text-sm">{scheme.label}</span>
                    </div>
                  </button>
                ))}
              </div>
              {preferences.color_scheme === 'custom' && (
                <div className="mt-3">
                  <Label>Custom Accent Color</Label>
                  <Input
                    type="color"
                    value={preferences.custom_accent_color || '#3b82f6'}
                    onChange={(e) => setPreferences(prev => ({ ...prev, custom_accent_color: e.target.value }))}
                    className="h-10 w-20"
                  />
                </div>
              )}
            </div>

            <div className="space-y-3">
              <Label>Font Size</Label>
              <Select
                value={preferences.font_size}
                onValueChange={(value: SitePreferences['font_size']) => 
                  setPreferences(prev => ({ ...prev, font_size: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Small</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="large">Large</SelectItem>
                  <SelectItem value="extra-large">Extra Large</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label>Font Family</Label>
              <Select
                value={preferences.font_family}
                onValueChange={(value: SitePreferences['font_family']) => 
                  setPreferences(prev => ({ ...prev, font_family: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="system">System Default</SelectItem>
                  <SelectItem value="sans-serif">Sans Serif</SelectItem>
                  <SelectItem value="serif">Serif</SelectItem>
                  <SelectItem value="mono">Monospace</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Layout Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            Layout Preferences
          </CardTitle>
          <CardDescription>
            Configure the layout and structure of the interface
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label>Sidebar Position</Label>
              <Select
                value={preferences.sidebar_position}
                onValueChange={(value: SitePreferences['sidebar_position']) => 
                  setPreferences(prev => ({ ...prev, sidebar_position: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Left</SelectItem>
                  <SelectItem value="right">Right</SelectItem>
                  <SelectItem value="hidden">Hidden</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label>Content Width</Label>
              <Select
                value={preferences.content_width}
                onValueChange={(value: SitePreferences['content_width']) => 
                  setPreferences(prev => ({ ...prev, content_width: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="narrow">Narrow</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="wide">Wide</SelectItem>
                  <SelectItem value="full">Full Width</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label>Card Style</Label>
              <Select
                value={preferences.card_style}
                onValueChange={(value: SitePreferences['card_style']) => 
                  setPreferences(prev => ({ ...prev, card_style: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="minimal">Minimal</SelectItem>
                  <SelectItem value="bordered">Bordered</SelectItem>
                  <SelectItem value="elevated">Elevated</SelectItem>
                  <SelectItem value="compact">Compact</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label>List Density</Label>
              <Select
                value={preferences.list_density}
                onValueChange={(value: SitePreferences['list_density']) => 
                  setPreferences(prev => ({ ...prev, list_density: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="comfortable">Comfortable</SelectItem>
                  <SelectItem value="compact">Compact</SelectItem>
                  <SelectItem value="cozy">Cozy</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reading Experience */}
      <Card>
        <CardHeader>
          <CardTitle>Reading Experience</CardTitle>
          <CardDescription>
            Optimize your reading and content consumption experience
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Reading Mode</Label>
                <p className="text-xs text-gray-500">Distraction-free reading experience</p>
              </div>
              <Switch
                checked={preferences.reading_mode_enabled}
                onCheckedChange={(checked) => 
                  setPreferences(prev => ({ ...prev, reading_mode_enabled: checked }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Focus Mode</Label>
                <p className="text-xs text-gray-500">Hide non-essential UI elements</p>
              </div>
              <Switch
                checked={preferences.focus_mode_enabled}
                onCheckedChange={(checked) => 
                  setPreferences(prev => ({ ...prev, focus_mode_enabled: checked }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Auto Scroll</Label>
                <p className="text-xs text-gray-500">Automatically scroll through content</p>
              </div>
              <Switch
                checked={preferences.auto_scroll_enabled}
                onCheckedChange={(checked) => 
                  setPreferences(prev => ({ ...prev, auto_scroll_enabled: checked }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Highlight Links</Label>
                <p className="text-xs text-gray-500">Make links more visible</p>
              </div>
              <Switch
                checked={preferences.highlight_links}
                onCheckedChange={(checked) => 
                  setPreferences(prev => ({ ...prev, highlight_links: checked }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Reading Progress</Label>
                <p className="text-xs text-gray-500">Show reading progress indicators</p>
              </div>
              <Switch
                checked={preferences.show_reading_progress}
                onCheckedChange={(checked) => 
                  setPreferences(prev => ({ ...prev, show_reading_progress: checked }))
                }
              />
            </div>

            {preferences.auto_scroll_enabled && (
              <div className="space-y-3 md:col-span-2">
                <Label>Auto Scroll Speed: {preferences.scroll_speed}%</Label>
                <Slider
                  value={[preferences.scroll_speed]}
                  onValueChange={(value) => 
                    setPreferences(prev => ({ ...prev, scroll_speed: value[0] }))
                  }
                  max={100}
                  step={10}
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Navigation & Interaction */}
      <Card>
        <CardHeader>
          <CardTitle>Navigation & Interaction</CardTitle>
          <CardDescription>
            Configure how you interact with the interface
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Quick Actions</Label>
                <p className="text-xs text-gray-500">Enable quick action buttons</p>
              </div>
              <Switch
                checked={preferences.quick_actions_enabled}
                onCheckedChange={(checked) => 
                  setPreferences(prev => ({ ...prev, quick_actions_enabled: checked }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Keyboard Shortcuts</Label>
                <p className="text-xs text-gray-500">Enable keyboard navigation</p>
              </div>
              <Switch
                checked={preferences.keyboard_shortcuts_enabled}
                onCheckedChange={(checked) => 
                  setPreferences(prev => ({ ...prev, keyboard_shortcuts_enabled: checked }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Gesture Navigation</Label>
                <p className="text-xs text-gray-500">Swipe gestures on mobile</p>
              </div>
              <Switch
                checked={preferences.gesture_navigation}
                onCheckedChange={(checked) => 
                  setPreferences(prev => ({ ...prev, gesture_navigation: checked }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Auto Save</Label>
                <p className="text-xs text-gray-500">Automatically save changes</p>
              </div>
              <Switch
                checked={preferences.auto_save_enabled}
                onCheckedChange={(checked) => 
                  setPreferences(prev => ({ ...prev, auto_save_enabled: checked }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Confirmation Dialogs</Label>
                <p className="text-xs text-gray-500">Show confirmation for destructive actions</p>
              </div>
              <Switch
                checked={preferences.confirmation_dialogs}
                onCheckedChange={(checked) => 
                  setPreferences(prev => ({ ...prev, confirmation_dialogs: checked }))
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content Display */}
      <Card>
        <CardHeader>
          <CardTitle>Content Display</CardTitle>
          <CardDescription>
            Control what information is shown for each item
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Show Thumbnails</Label>
                <p className="text-xs text-gray-500">Display preview images</p>
              </div>
              <Switch
                checked={preferences.show_thumbnails}
                onCheckedChange={(checked) => 
                  setPreferences(prev => ({ ...prev, show_thumbnails: checked }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Show Excerpts</Label>
                <p className="text-xs text-gray-500">Display content previews</p>
              </div>
              <Switch
                checked={preferences.show_excerpts}
                onCheckedChange={(checked) => 
                  setPreferences(prev => ({ ...prev, show_excerpts: checked }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Show Metadata</Label>
                <p className="text-xs text-gray-500">Display author, date, source</p>
              </div>
              <Switch
                checked={preferences.show_metadata}
                onCheckedChange={(checked) => 
                  setPreferences(prev => ({ ...prev, show_metadata: checked }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Show Tags</Label>
                <p className="text-xs text-gray-500">Display content tags</p>
              </div>
              <Switch
                checked={preferences.show_tags}
                onCheckedChange={(checked) => 
                  setPreferences(prev => ({ ...prev, show_tags: checked }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Show Reading Time</Label>
                <p className="text-xs text-gray-500">Display estimated reading time</p>
              </div>
              <Switch
                checked={preferences.show_reading_time}
                onCheckedChange={(checked) => 
                  setPreferences(prev => ({ ...prev, show_reading_time: checked }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Group by Date</Label>
                <p className="text-xs text-gray-500">Group content by publication date</p>
              </div>
              <Switch
                checked={preferences.group_by_date}
                onCheckedChange={(checked) => 
                  setPreferences(prev => ({ ...prev, group_by_date: checked }))
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance & Data */}
      <Card>
        <CardHeader>
          <CardTitle>Performance & Data</CardTitle>
          <CardDescription>
            Optimize performance and manage data usage
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Lazy Loading</Label>
                <p className="text-xs text-gray-500">Load content as needed</p>
              </div>
              <Switch
                checked={preferences.lazy_loading}
                onCheckedChange={(checked) => 
                  setPreferences(prev => ({ ...prev, lazy_loading: checked }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Image Optimization</Label>
                <p className="text-xs text-gray-500">Compress and optimize images</p>
              </div>
              <Switch
                checked={preferences.image_optimization}
                onCheckedChange={(checked) => 
                  setPreferences(prev => ({ ...prev, image_optimization: checked }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Offline Mode</Label>
                <p className="text-xs text-gray-500">Cache content for offline access</p>
              </div>
              <Switch
                checked={preferences.offline_mode}
                onCheckedChange={(checked) => 
                  setPreferences(prev => ({ ...prev, offline_mode: checked }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Data Saver Mode</Label>
                <p className="text-xs text-gray-500">Reduce data usage</p>
              </div>
              <Switch
                checked={preferences.data_saver_mode}
                onCheckedChange={(checked) => 
                  setPreferences(prev => ({ ...prev, data_saver_mode: checked }))
                }
              />
            </div>

            <div className="space-y-3 md:col-span-2">
              <Label>Sync Frequency</Label>
              <Select
                value={preferences.sync_frequency}
                onValueChange={(value: SitePreferences['sync_frequency']) => 
                  setPreferences(prev => ({ ...prev, sync_frequency: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="real-time">Real-time</SelectItem>
                  <SelectItem value="hourly">Hourly</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>
            Configure how and when you receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Browser Notifications</Label>
                <p className="text-xs text-gray-500">Show notifications in browser</p>
              </div>
              <Switch
                checked={preferences.browser_notifications}
                onCheckedChange={(checked) => 
                  setPreferences(prev => ({ ...prev, browser_notifications: checked }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Email Notifications</Label>
                <p className="text-xs text-gray-500">Receive notifications via email</p>
              </div>
              <Switch
                checked={preferences.email_notifications}
                onCheckedChange={(checked) => 
                  setPreferences(prev => ({ ...prev, email_notifications: checked }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Push Notifications</Label>
                <p className="text-xs text-gray-500">Mobile push notifications</p>
              </div>
              <Switch
                checked={preferences.push_notifications}
                onCheckedChange={(checked) => 
                  setPreferences(prev => ({ ...prev, push_notifications: checked }))
                }
              />
            </div>

            <div className="space-y-3">
              <Label>Notification Frequency</Label>
              <Select
                value={preferences.notification_frequency}
                onValueChange={(value: SitePreferences['notification_frequency']) => 
                  setPreferences(prev => ({ ...prev, notification_frequency: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="instant">Instant</SelectItem>
                  <SelectItem value="hourly">Hourly</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Privacy & Security */}
      <Card>
        <CardHeader>
          <CardTitle>Privacy & Security</CardTitle>
          <CardDescription>
            Control data collection and privacy settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Analytics</Label>
                <p className="text-xs text-gray-500">Allow usage analytics collection</p>
              </div>
              <Switch
                checked={preferences.analytics_enabled}
                onCheckedChange={(checked) => 
                  setPreferences(prev => ({ ...prev, analytics_enabled: checked }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Crash Reporting</Label>
                <p className="text-xs text-gray-500">Send crash reports to help improve the app</p>
              </div>
              <Switch
                checked={preferences.crash_reporting}
                onCheckedChange={(checked) => 
                  setPreferences(prev => ({ ...prev, crash_reporting: checked }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Usage Tracking</Label>
                <p className="text-xs text-gray-500">Track feature usage patterns</p>
              </div>
              <Switch
                checked={preferences.usage_tracking}
                onCheckedChange={(checked) => 
                  setPreferences(prev => ({ ...prev, usage_tracking: checked }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Share Anonymous Data</Label>
                <p className="text-xs text-gray-500">Share anonymized usage data</p>
              </div>
              <Switch
                checked={preferences.share_anonymous_data}
                onCheckedChange={(checked) => 
                  setPreferences(prev => ({ ...prev, share_anonymous_data: checked }))
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Advanced Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Advanced Settings
          </CardTitle>
          <CardDescription>
            Experimental features and developer options
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Experimental Features</Label>
                <p className="text-xs text-gray-500">Enable beta features (may be unstable)</p>
              </div>
              <Switch
                checked={preferences.experimental_features}
                onCheckedChange={(checked) => 
                  setPreferences(prev => ({ ...prev, experimental_features: checked }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Beta Testing</Label>
                <p className="text-xs text-gray-500">Participate in beta testing program</p>
              </div>
              <Switch
                checked={preferences.beta_testing}
                onCheckedChange={(checked) => 
                  setPreferences(prev => ({ ...prev, beta_testing: checked }))
                }
              />
            </div>

            <div className="flex items-center justify-between md:col-span-2">
              <div className="space-y-1">
                <Label>Developer Mode</Label>
                <p className="text-xs text-gray-500">Enable developer tools and debugging</p>
              </div>
              <Switch
                checked={preferences.developer_mode}
                onCheckedChange={(checked) => 
                  setPreferences(prev => ({ ...prev, developer_mode: checked }))
                }
              />
            </div>
          </div>

          {/* Custom CSS */}
          <div className="space-y-3">
            <Label>Custom CSS</Label>
            <Textarea
              value={preferences.custom_css}
              onChange={(e) => setPreferences(prev => ({ ...prev, custom_css: e.target.value }))}
              placeholder="/* Add your custom CSS here */
.custom-style {
  /* Your styles */
}"
              rows={6}
              className="font-mono text-sm"
            />
            <p className="text-xs text-gray-500">
              Add custom CSS to personalize the interface. Use with caution as this may affect functionality.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Additional Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Notes</CardTitle>
          <CardDescription>
            Any additional preferences or feedback about the interface
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={preferences.additional_notes}
            onChange={(e) => setPreferences(prev => ({ ...prev, additional_notes: e.target.value }))}
            placeholder="Share any additional thoughts about the interface and user experience..."
            rows={4}
          />
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={savePreferences} disabled={saving} size="lg" className="flex items-center gap-2">
          {saving ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          ) : (
            <Save className="h-4 w-4" />
          )}
          {saving ? 'Saving Preferences...' : 'Save & Continue'}
        </Button>
      </div>
    </div>
  )
} 