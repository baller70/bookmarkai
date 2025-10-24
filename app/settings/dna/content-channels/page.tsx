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
import { Checkbox } from '@/components/ui/checkbox'
import { LayoutList, Save, Plus, X, BookOpen, Video, Headphones, FileText, Globe, Rss, Youtube, Twitter, Linkedin } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface ContentChannel {
  id: string
  name: string
  url: string
  type: 'blog' | 'news' | 'youtube' | 'podcast' | 'newsletter' | 'social' | 'forum' | 'other'
  priority: 'high' | 'medium' | 'low'
  tags: string[]
  active: boolean
  last_checked?: string
}

interface ContentPreferences {
  id?: string
  user_id?: string
  
  // Content Types
  preferred_formats: string[]
  content_length_preference: 'short' | 'medium' | 'long' | 'mixed'
  reading_time_preference: number // in minutes
  
  // Channels
  channels: ContentChannel[]
  auto_discover_channels: boolean
  
  // Content Sources
  source_types: {
    blogs: boolean
    news_sites: boolean
    academic_papers: boolean
    video_content: boolean
    podcasts: boolean
    newsletters: boolean
    social_media: boolean
    forums: boolean
    documentation: boolean
    books: boolean
  }
  
  // Language & Region
  preferred_languages: string[]
  preferred_regions: string[]
  
  // Filtering
  exclude_paywalled: boolean
  exclude_ai_generated: boolean
  minimum_quality_score: number
  
  // Notifications
  notify_new_channels: boolean
  notify_trending_content: boolean
  
  // Notes
  additional_notes: string
  
  last_updated: string
}

const defaultPreferences: ContentPreferences = {
  preferred_formats: ['articles', 'tutorials'],
  content_length_preference: 'medium',
  reading_time_preference: 10,
  
  channels: [],
  auto_discover_channels: true,
  
  source_types: {
    blogs: true,
    news_sites: true,
    academic_papers: false,
    video_content: true,
    podcasts: false,
    newsletters: true,
    social_media: false,
    forums: false,
    documentation: true,
    books: false
  },
  
  preferred_languages: ['English'],
  preferred_regions: ['Global'],
  
  exclude_paywalled: false,
  exclude_ai_generated: false,
  minimum_quality_score: 7,
  
  notify_new_channels: true,
  notify_trending_content: false,
  
  additional_notes: '',
  last_updated: new Date().toISOString()
}

const contentFormats = [
  { id: 'articles', label: 'Articles', icon: <FileText className="h-4 w-4" /> },
  { id: 'tutorials', label: 'Tutorials', icon: <BookOpen className="h-4 w-4" /> },
  { id: 'videos', label: 'Videos', icon: <Video className="h-4 w-4" /> },
  { id: 'podcasts', label: 'Podcasts', icon: <Headphones className="h-4 w-4" /> },
  { id: 'newsletters', label: 'Newsletters', icon: <Rss className="h-4 w-4" /> },
  { id: 'case_studies', label: 'Case Studies', icon: <FileText className="h-4 w-4" /> },
  { id: 'whitepapers', label: 'Whitepapers', icon: <FileText className="h-4 w-4" /> },
  { id: 'documentation', label: 'Documentation', icon: <BookOpen className="h-4 w-4" /> }
]

const channelTypes = [
  { value: 'blog', label: 'Blog', icon: <Globe className="h-4 w-4" /> },
  { value: 'news', label: 'News Site', icon: <FileText className="h-4 w-4" /> },
  { value: 'youtube', label: 'YouTube Channel', icon: <Youtube className="h-4 w-4" /> },
  { value: 'podcast', label: 'Podcast', icon: <Headphones className="h-4 w-4" /> },
  { value: 'newsletter', label: 'Newsletter', icon: <Rss className="h-4 w-4" /> },
  { value: 'social', label: 'Social Media', icon: <Twitter className="h-4 w-4" /> },
  { value: 'forum', label: 'Forum', icon: <Linkedin className="h-4 w-4" /> },
  { value: 'other', label: 'Other', icon: <Globe className="h-4 w-4" /> }
]

const languages = [
  'English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese', 
  'Chinese', 'Japanese', 'Korean', 'Russian', 'Arabic', 'Hindi'
]

const regions = [
  'Global', 'North America', 'Europe', 'Asia Pacific', 'Latin America', 
  'Middle East', 'Africa', 'United States', 'United Kingdom', 'Canada'
]

export default function ContentChannelsPage() {
  const [preferences, setPreferences] = useState<ContentPreferences>(defaultPreferences)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showAddChannel, setShowAddChannel] = useState(false)
  const [newChannel, setNewChannel] = useState<Partial<ContentChannel>>({
    name: '',
    url: '',
    type: 'blog',
    priority: 'medium',
    tags: [],
    active: true
  })
  const [newTag, setNewTag] = useState('')
  
  const supabase = createDemoSupabaseClient()

  useEffect(() => {
    loadPreferences()
  }, [])

  const loadPreferences = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('dna_content_channels')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (data) {
        setPreferences({ ...defaultPreferences, ...data })
      }
    } catch (error) {
      console.error('Error loading content preferences:', error)
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
        .from('dna_content_channels')
        .upsert(preferencesData)

      if (error) throw error

      toast({
        title: "Content preferences saved!",
        description: "Your content and channel preferences have been updated.",
      })
    } catch (error) {
      console.error('Error saving content preferences:', error)
      toast({
        title: "Error saving preferences",
        description: "Please try again later.",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  const handleFormatToggle = (formatId: string) => {
    setPreferences(prev => ({
      ...prev,
      preferred_formats: prev.preferred_formats.includes(formatId)
        ? prev.preferred_formats.filter(f => f !== formatId)
        : [...prev.preferred_formats, formatId]
    }))
  }

  const handleSourceTypeToggle = (sourceType: keyof ContentPreferences['source_types']) => {
    setPreferences(prev => ({
      ...prev,
      source_types: {
        ...prev.source_types,
        [sourceType]: !prev.source_types[sourceType]
      }
    }))
  }

  const addChannel = () => {
    if (!newChannel.name || !newChannel.url) return
    
    const channel: ContentChannel = {
      id: Date.now().toString(),
      name: newChannel.name,
      url: newChannel.url,
      type: newChannel.type as ContentChannel['type'],
      priority: newChannel.priority as ContentChannel['priority'],
      tags: newChannel.tags || [],
      active: true
    }
    
    setPreferences(prev => ({
      ...prev,
      channels: [...prev.channels, channel]
    }))
    
    setNewChannel({
      name: '',
      url: '',
      type: 'blog',
      priority: 'medium',
      tags: [],
      active: true
    })
    setShowAddChannel(false)
  }

  const removeChannel = (channelId: string) => {
    setPreferences(prev => ({
      ...prev,
      channels: prev.channels.filter(c => c.id !== channelId)
    }))
  }

  const toggleChannelActive = (channelId: string) => {
    setPreferences(prev => ({
      ...prev,
      channels: prev.channels.map(c => 
        c.id === channelId ? { ...c, active: !c.active } : c
      )
    }))
  }

  const addTagToNewChannel = () => {
    if (!newTag.trim() || newChannel.tags?.includes(newTag.trim())) return
    
    setNewChannel(prev => ({
      ...prev,
      tags: [...(prev.tags || []), newTag.trim()]
    }))
    setNewTag('')
  }

  const removeTagFromNewChannel = (tag: string) => {
    setNewChannel(prev => ({
      ...prev,
      tags: prev.tags?.filter(t => t !== tag) || []
    }))
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
          <h2 className="text-3xl font-bold text-gray-900">Content & Channels</h2>
          <p className="text-gray-600 mt-2">Configure your preferred content types and sources</p>
        </div>
        <Button onClick={savePreferences} disabled={saving} className="flex items-center gap-2">
          {saving ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          ) : (
            <Save className="h-4 w-4" />
          )}
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>

      {/* Content Formats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LayoutList className="h-5 w-5" />
            Preferred Content Formats
          </CardTitle>
          <CardDescription>
            Select the types of content you find most valuable
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {contentFormats.map((format) => (
              <div
                key={format.id}
                onClick={() => handleFormatToggle(format.id)}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                  preferences.preferred_formats.includes(format.id)
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  {format.icon}
                  <span className="font-medium">{format.label}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Content Length & Reading Time */}
      <Card>
        <CardHeader>
          <CardTitle>Content Length Preferences</CardTitle>
          <CardDescription>
            Specify your preferred content length and reading time
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label>Preferred Content Length</Label>
            <Select
              value={preferences.content_length_preference}
              onValueChange={(value: 'short' | 'medium' | 'long' | 'mixed') => 
                setPreferences(prev => ({ ...prev, content_length_preference: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="short">Short (1-5 minutes)</SelectItem>
                <SelectItem value="medium">Medium (5-15 minutes)</SelectItem>
                <SelectItem value="long">Long (15+ minutes)</SelectItem>
                <SelectItem value="mixed">Mixed lengths</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label>Preferred Reading Time (minutes)</Label>
            <Input
              type="number"
              value={preferences.reading_time_preference}
              onChange={(e) => setPreferences(prev => ({ 
                ...prev, 
                reading_time_preference: parseInt(e.target.value) || 10 
              }))}
              min="1"
              max="120"
            />
          </div>
        </CardContent>
      </Card>

      {/* Source Types */}
      <Card>
        <CardHeader>
          <CardTitle>Content Source Types</CardTitle>
          <CardDescription>
            Choose which types of sources you want to include
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Object.entries(preferences.source_types).map(([key, enabled]) => (
              <div key={key} className="flex items-center justify-between p-3 border rounded-lg">
                <Label className="capitalize cursor-pointer">
                  {key.replace('_', ' ')}
                </Label>
                <Switch
                  checked={enabled}
                  onCheckedChange={() => handleSourceTypeToggle(key as keyof ContentPreferences['source_types'])}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Custom Channels */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Custom Channels</CardTitle>
              <CardDescription>
                Add specific channels and sources you want to follow
              </CardDescription>
            </div>
            <Button onClick={() => setShowAddChannel(true)} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Channel
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {preferences.channels.length > 0 ? (
            <div className="space-y-3">
              {preferences.channels.map((channel) => (
                <div key={channel.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h4 className="font-medium">{channel.name}</h4>
                      <Badge variant={channel.priority === 'high' ? 'default' : 'secondary'}>
                        {channel.priority}
                      </Badge>
                      <Badge variant="outline">{channel.type}</Badge>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{channel.url}</p>
                    {channel.tags.length > 0 && (
                      <div className="flex gap-1 mt-2">
                        {channel.tags.map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={channel.active}
                      onCheckedChange={() => toggleChannelActive(channel.id)}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeChannel(channel.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
                         <p className="text-gray-500 text-center py-8">
               No custom channels added yet. Click &quot;Add Channel&quot; to get started.
             </p>
          )}

          {/* Add Channel Form */}
          {showAddChannel && (
            <div className="p-4 border rounded-lg space-y-4 bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Channel Name</Label>
                  <Input
                    value={newChannel.name}
                    onChange={(e) => setNewChannel(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., TechCrunch"
                  />
                </div>
                <div className="space-y-2">
                  <Label>URL</Label>
                  <Input
                    value={newChannel.url}
                    onChange={(e) => setNewChannel(prev => ({ ...prev, url: e.target.value }))}
                    placeholder="e.g., https://techcrunch.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select
                    value={newChannel.type}
                    onValueChange={(value: ContentChannel['type']) => 
                      setNewChannel(prev => ({ ...prev, type: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {channelTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            {type.icon}
                            {type.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select
                    value={newChannel.priority}
                    onValueChange={(value: ContentChannel['priority']) => 
                      setNewChannel(prev => ({ ...prev, priority: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <Label>Tags</Label>
                <div className="flex gap-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Add a tag"
                    onKeyPress={(e) => e.key === 'Enter' && addTagToNewChannel()}
                  />
                  <Button onClick={addTagToNewChannel} size="sm">
                    Add
                  </Button>
                </div>
                {newChannel.tags && newChannel.tags.length > 0 && (
                  <div className="flex gap-1 flex-wrap">
                    {newChannel.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="flex items-center gap-1">
                        {tag}
                        <X
                          className="h-3 w-3 cursor-pointer"
                          onClick={() => removeTagFromNewChannel(tag)}
                        />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button onClick={addChannel}>Add Channel</Button>
                <Button variant="outline" onClick={() => setShowAddChannel(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Language & Region */}
      <Card>
        <CardHeader>
          <CardTitle>Language & Region Preferences</CardTitle>
          <CardDescription>
            Specify your language and regional content preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label>Preferred Languages</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {languages.map((language) => (
                <div key={language} className="flex items-center space-x-2">
                  <Checkbox
                    id={language}
                    checked={preferences.preferred_languages.includes(language)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setPreferences(prev => ({
                          ...prev,
                          preferred_languages: [...prev.preferred_languages, language]
                        }))
                      } else {
                        setPreferences(prev => ({
                          ...prev,
                          preferred_languages: prev.preferred_languages.filter(l => l !== language)
                        }))
                      }
                    }}
                  />
                  <Label htmlFor={language} className="text-sm cursor-pointer">
                    {language}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <Label>Preferred Regions</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {regions.map((region) => (
                <div key={region} className="flex items-center space-x-2">
                  <Checkbox
                    id={region}
                    checked={preferences.preferred_regions.includes(region)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setPreferences(prev => ({
                          ...prev,
                          preferred_regions: [...prev.preferred_regions, region]
                        }))
                      } else {
                        setPreferences(prev => ({
                          ...prev,
                          preferred_regions: prev.preferred_regions.filter(r => r !== region)
                        }))
                      }
                    }}
                  />
                  <Label htmlFor={region} className="text-sm cursor-pointer">
                    {region}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content Filtering */}
      <Card>
        <CardHeader>
          <CardTitle>Content Filtering</CardTitle>
          <CardDescription>
            Set filters to improve content quality and relevance
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Exclude Paywalled Content</Label>
                <p className="text-xs text-gray-500">Filter out content behind paywalls</p>
              </div>
              <Switch
                checked={preferences.exclude_paywalled}
                onCheckedChange={(checked) => 
                  setPreferences(prev => ({ ...prev, exclude_paywalled: checked }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Exclude AI-Generated Content</Label>
                <p className="text-xs text-gray-500">Filter out AI-generated articles</p>
              </div>
              <Switch
                checked={preferences.exclude_ai_generated}
                onCheckedChange={(checked) => 
                  setPreferences(prev => ({ ...prev, exclude_ai_generated: checked }))
                }
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label>Minimum Quality Score (1-10)</Label>
            <Input
              type="number"
              value={preferences.minimum_quality_score}
              onChange={(e) => setPreferences(prev => ({ 
                ...prev, 
                minimum_quality_score: parseInt(e.target.value) || 7 
              }))}
              min="1"
              max="10"
            />
            <p className="text-xs text-gray-500">
              Content below this quality score will be filtered out
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Additional Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Auto-discover New Channels</Label>
                <p className="text-xs text-gray-500">Automatically suggest new relevant channels</p>
              </div>
              <Switch
                checked={preferences.auto_discover_channels}
                onCheckedChange={(checked) => 
                  setPreferences(prev => ({ ...prev, auto_discover_channels: checked }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Notify About New Channels</Label>
                <p className="text-xs text-gray-500">Get notified when new channels are suggested</p>
              </div>
              <Switch
                checked={preferences.notify_new_channels}
                onCheckedChange={(checked) => 
                  setPreferences(prev => ({ ...prev, notify_new_channels: checked }))
                }
              />
            </div>

            <div className="flex items-center justify-between md:col-span-2">
              <div className="space-y-1">
                <Label>Notify About Trending Content</Label>
                <p className="text-xs text-gray-500">Get notified about trending content from your channels</p>
              </div>
              <Switch
                checked={preferences.notify_trending_content}
                onCheckedChange={(checked) => 
                  setPreferences(prev => ({ ...prev, notify_trending_content: checked }))
                }
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label>Additional Notes</Label>
            <Textarea
              value={preferences.additional_notes}
              onChange={(e) => setPreferences(prev => ({ ...prev, additional_notes: e.target.value }))}
              placeholder="Any additional preferences about content and channels..."
              rows={3}
            />
          </div>
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
