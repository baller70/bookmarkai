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
import { Tag, Save, Plus, X, Filter, Search, TrendingUp, Star } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface TagFilter {
  id: string
  name: string
  type: 'include' | 'exclude' | 'boost' | 'reduce'
  weight: number
  active: boolean
  category?: string
}

interface SmartFilter {
  id: string
  name: string
  description: string
  criteria: {
    min_reading_time?: number
    max_reading_time?: number
    min_quality_score?: number
    content_types?: string[]
    publication_date_range?: number // days
    author_reputation_min?: number
    engagement_threshold?: number
  }
  active: boolean
}

interface TagsFiltersData {
  id?: string
  user_id?: string
  
  // Tag Management
  preferred_tags: TagFilter[]
  blocked_tags: TagFilter[]
  tag_suggestions_enabled: boolean
  auto_tag_content: boolean
  
  // Smart Filters
  smart_filters: SmartFilter[]
  
  // Content Filtering Rules
  filter_rules: {
    duplicate_detection: boolean
    similarity_threshold: number
    recency_boost: number
    trending_boost: number
    quality_threshold: number
    engagement_weight: number
  }
  
  // Advanced Filtering
  keyword_filters: {
    must_include: string[]
    must_exclude: string[]
    boost_keywords: string[]
    reduce_keywords: string[]
  }
  
  // Personalization
  learning_enabled: boolean
  feedback_weight: number
  reading_history_influence: number
  
  // Notes
  additional_notes: string
  
  last_updated: string
}

const defaultData: TagsFiltersData = {
  preferred_tags: [],
  blocked_tags: [],
  tag_suggestions_enabled: true,
  auto_tag_content: true,
  
  smart_filters: [],
  
  filter_rules: {
    duplicate_detection: true,
    similarity_threshold: 80,
    recency_boost: 20,
    trending_boost: 15,
    quality_threshold: 6,
    engagement_weight: 25
  },
  
  keyword_filters: {
    must_include: [],
    must_exclude: [],
    boost_keywords: [],
    reduce_keywords: []
  },
  
  learning_enabled: true,
  feedback_weight: 30,
  reading_history_influence: 40,
  
  additional_notes: '',
  last_updated: new Date().toISOString()
}

const predefinedTags = [
  // Technology
  { name: 'JavaScript', category: 'Technology' },
  { name: 'React', category: 'Technology' },
  { name: 'Python', category: 'Technology' },
  { name: 'AI/ML', category: 'Technology' },
  { name: 'Cloud Computing', category: 'Technology' },
  { name: 'DevOps', category: 'Technology' },
  { name: 'Cybersecurity', category: 'Technology' },
  
  // Business
  { name: 'Startups', category: 'Business' },
  { name: 'Marketing', category: 'Business' },
  { name: 'Leadership', category: 'Business' },
  { name: 'Product Management', category: 'Business' },
  { name: 'Finance', category: 'Business' },
  { name: 'Strategy', category: 'Business' },
  
  // Design
  { name: 'UI/UX', category: 'Design' },
  { name: 'Web Design', category: 'Design' },
  { name: 'Typography', category: 'Design' },
  { name: 'Branding', category: 'Design' },
  
  // Personal Development
  { name: 'Productivity', category: 'Personal Development' },
  { name: 'Career Growth', category: 'Personal Development' },
  { name: 'Learning', category: 'Personal Development' },
  { name: 'Communication', category: 'Personal Development' }
]

const defaultSmartFilters: SmartFilter[] = [
  {
    id: 'quick-reads',
    name: 'Quick Reads',
    description: 'Articles that can be read in 5 minutes or less',
    criteria: {
      max_reading_time: 5,
      min_quality_score: 7
    },
    active: false
  },
  {
    id: 'deep-dives',
    name: 'Deep Dives',
    description: 'Comprehensive, long-form content',
    criteria: {
      min_reading_time: 15,
      min_quality_score: 8
    },
    active: false
  },
  {
    id: 'trending-now',
    name: 'Trending Now',
    description: 'Popular content from the last 24 hours',
    criteria: {
      publication_date_range: 1,
      engagement_threshold: 100
    },
    active: false
  },
  {
    id: 'expert-content',
    name: 'Expert Content',
    description: 'Content from highly reputable authors',
    criteria: {
      author_reputation_min: 8,
      min_quality_score: 8
    },
    active: false
  }
]

export default function TagsFiltersPage() {
  const [data, setData] = useState<TagsFiltersData>(defaultData)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [newTag, setNewTag] = useState('')
  const [newTagType, setNewTagType] = useState<TagFilter['type']>('include')
  const [newKeyword, setNewKeyword] = useState('')
  const [keywordType, setKeywordType] = useState<keyof TagsFiltersData['keyword_filters']>('must_include')
  const [showCustomFilter, setShowCustomFilter] = useState(false)
  const [newFilter, setNewFilter] = useState<Partial<SmartFilter>>({
    name: '',
    description: '',
    criteria: {},
    active: true
  })
  
  const supabase = createDemoSupabaseClient()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: savedData } = await supabase
        .from('dna_tags_filters')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (savedData) {
        setData({ 
          ...defaultData, 
          ...savedData,
          smart_filters: [...defaultSmartFilters, ...(savedData.smart_filters || [])]
        })
      } else {
        setData(prev => ({ ...prev, smart_filters: defaultSmartFilters }))
      }
    } catch (error) {
      console.error('Error loading tags and filters:', error)
      setData(prev => ({ ...prev, smart_filters: defaultSmartFilters }))
    } finally {
      setLoading(false)
    }
  }

  const saveData = async () => {
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const saveData = {
        ...data,
        user_id: user.id,
        last_updated: new Date().toISOString()
      }

      const { error } = await supabase
        .from('dna_tags_filters')
        .upsert(saveData)

      if (error) throw error

      toast({
        title: "Tags and filters saved!",
        description: "Your content filtering preferences have been updated.",
      })
    } catch (error) {
      console.error('Error saving tags and filters:', error)
      toast({
        title: "Error saving preferences",
        description: "Please try again later.",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  const addTag = (tagName: string, type: TagFilter['type'], category?: string) => {
    const tag: TagFilter = {
      id: Date.now().toString(),
      name: tagName,
      type,
      weight: type === 'boost' ? 20 : type === 'reduce' ? -10 : 0,
      active: true,
      category
    }

    const listKey = type === 'exclude' ? 'blocked_tags' : 'preferred_tags'
    setData(prev => ({
      ...prev,
      [listKey]: [...prev[listKey], tag]
    }))
  }

  const removeTag = (tagId: string, listType: 'preferred_tags' | 'blocked_tags') => {
    setData(prev => ({
      ...prev,
      [listType]: prev[listType].filter(tag => tag.id !== tagId)
    }))
  }

  const toggleTagActive = (tagId: string, listType: 'preferred_tags' | 'blocked_tags') => {
    setData(prev => ({
      ...prev,
      [listType]: prev[listType].map(tag =>
        tag.id === tagId ? { ...tag, active: !tag.active } : tag
      )
    }))
  }

  const updateTagWeight = (tagId: string, listType: 'preferred_tags' | 'blocked_tags', weight: number) => {
    setData(prev => ({
      ...prev,
      [listType]: prev[listType].map(tag =>
        tag.id === tagId ? { ...tag, weight } : tag
      )
    }))
  }

  const addKeyword = () => {
    if (!newKeyword.trim()) return
    
    setData(prev => ({
      ...prev,
      keyword_filters: {
        ...prev.keyword_filters,
        [keywordType]: [...prev.keyword_filters[keywordType], newKeyword.trim()]
      }
    }))
    setNewKeyword('')
  }

  const removeKeyword = (keyword: string, type: keyof TagsFiltersData['keyword_filters']) => {
    setData(prev => ({
      ...prev,
      keyword_filters: {
        ...prev.keyword_filters,
        [type]: prev.keyword_filters[type].filter(k => k !== keyword)
      }
    }))
  }

  const toggleSmartFilter = (filterId: string) => {
    setData(prev => ({
      ...prev,
      smart_filters: prev.smart_filters.map(filter =>
        filter.id === filterId ? { ...filter, active: !filter.active } : filter
      )
    }))
  }

  const addCustomFilter = () => {
    if (!newFilter.name || !newFilter.description) return

    const filter: SmartFilter = {
      id: `custom-${Date.now()}`,
      name: newFilter.name,
      description: newFilter.description,
      criteria: newFilter.criteria || {},
      active: true
    }

    setData(prev => ({
      ...prev,
      smart_filters: [...prev.smart_filters, filter]
    }))

    setNewFilter({
      name: '',
      description: '',
      criteria: {},
      active: true
    })
    setShowCustomFilter(false)
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
        <h2 className="text-3xl font-bold text-gray-900">Tags & Filters</h2>
          <p className="text-gray-600 mt-2">Fine-tune your content discovery with tags and smart filters</p>
        </div>
        <Button onClick={saveData} disabled={saving} className="flex items-center gap-2">
          {saving ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          ) : (
            <Save className="h-4 w-4" />
          )}
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>

      {/* Preferred Tags */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Preferred Tags
          </CardTitle>
          <CardDescription>
            Tags that boost content relevance and discovery
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Add New Tag */}
          <div className="flex gap-2">
            <Input
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="Add a tag..."
              onKeyPress={(e) => e.key === 'Enter' && newTag.trim() && (addTag(newTag, newTagType), setNewTag(''))}
            />
            <Select value={newTagType} onValueChange={(value: TagFilter['type']) => setNewTagType(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="include">Include</SelectItem>
                <SelectItem value="boost">Boost</SelectItem>
                <SelectItem value="reduce">Reduce</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              onClick={() => newTag.trim() && (addTag(newTag, newTagType), setNewTag(''))}
              disabled={!newTag.trim()}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Predefined Tags */}
          <div className="space-y-4">
            <Label>Quick Add (Popular Tags)</Label>
            <div className="space-y-3">
              {Object.entries(
                predefinedTags.reduce((acc, tag) => {
                  if (!acc[tag.category]) acc[tag.category] = []
                  acc[tag.category].push(tag)
                  return acc
                }, {} as Record<string, typeof predefinedTags>)
              ).map(([category, tags]) => (
                <div key={category}>
                  <Label className="text-sm text-gray-600">{category}</Label>
                  <div className="flex gap-2 flex-wrap mt-1">
                    {tags.map((tag) => (
                      <Button
                        key={tag.name}
                        variant="outline"
                        size="sm"
                        onClick={() => addTag(tag.name, 'include', tag.category)}
                        disabled={data.preferred_tags.some(t => t.name === tag.name)}
                      >
                        {tag.name}
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Current Tags */}
          {data.preferred_tags.length > 0 && (
            <div className="space-y-3">
              <Label>Your Tags</Label>
              <div className="space-y-2">
                {data.preferred_tags.map((tag) => (
                  <div key={tag.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge variant={tag.type === 'boost' ? 'default' : tag.type === 'reduce' ? 'destructive' : 'secondary'}>
                        {tag.name}
                      </Badge>
                      <span className="text-sm text-gray-600">{tag.type}</span>
                      {tag.category && (
                        <Badge variant="outline" className="text-xs">
                          {tag.category}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      {(tag.type === 'boost' || tag.type === 'reduce') && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs">Weight:</span>
                          <div className="w-20">
                            <Slider
                              value={[Math.abs(tag.weight)]}
                              onValueChange={(value) => updateTagWeight(tag.id, 'preferred_tags', tag.type === 'reduce' ? -value[0] : value[0])}
                              max={50}
                              step={5}
                            />
                          </div>
                          <span className="text-xs w-8">{tag.weight}%</span>
                        </div>
                      )}
                      <Switch
                        checked={tag.active}
                        onCheckedChange={() => toggleTagActive(tag.id, 'preferred_tags')}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeTag(tag.id, 'preferred_tags')}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Blocked Tags */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <X className="h-5 w-5" />
            Blocked Tags
          </CardTitle>
          <CardDescription>
            Tags that will filter out unwanted content
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="Add a tag to block..."
              onKeyPress={(e) => e.key === 'Enter' && newTag.trim() && (addTag(newTag, 'exclude'), setNewTag(''))}
            />
            <Button 
              onClick={() => newTag.trim() && (addTag(newTag, 'exclude'), setNewTag(''))}
              disabled={!newTag.trim()}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {data.blocked_tags.length > 0 && (
            <div className="space-y-2">
              {data.blocked_tags.map((tag) => (
                <div key={tag.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge variant="destructive">{tag.name}</Badge>
                    <span className="text-sm text-gray-600">blocked</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={tag.active}
                      onCheckedChange={() => toggleTagActive(tag.id, 'blocked_tags')}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeTag(tag.id, 'blocked_tags')}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Smart Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Smart Filters
              </CardTitle>
              <CardDescription>
                Intelligent filters based on content characteristics
              </CardDescription>
            </div>
            <Button onClick={() => setShowCustomFilter(true)} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Custom Filter
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.smart_filters.map((filter) => (
            <div key={filter.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h4 className="font-medium">{filter.name}</h4>
                  {filter.id.startsWith('custom-') && (
                    <Badge variant="outline">Custom</Badge>
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-1">{filter.description}</p>
                <div className="flex gap-2 mt-2 text-xs text-gray-500">
                  {Object.entries(filter.criteria).map(([key, value]) => (
                    <span key={key} className="bg-gray-100 px-2 py-1 rounded">
                      {key.replace('_', ' ')}: {value}
                    </span>
                  ))}
                </div>
              </div>
              <Switch
                checked={filter.active}
                onCheckedChange={() => toggleSmartFilter(filter.id)}
              />
            </div>
          ))}

          {/* Custom Filter Form */}
          {showCustomFilter && (
            <div className="p-4 border rounded-lg space-y-4 bg-gray-50">
              <div className="space-y-3">
                <div>
                  <Label>Filter Name</Label>
                  <Input
                    value={newFilter.name}
                    onChange={(e) => setNewFilter(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Weekend Reads"
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={newFilter.description}
                    onChange={(e) => setNewFilter(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe what this filter does..."
                    rows={2}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Min Reading Time (minutes)</Label>
                    <Input
                      type="number"
                      value={newFilter.criteria?.min_reading_time || ''}
                      onChange={(e) => setNewFilter(prev => ({
                        ...prev,
                        criteria: { ...prev.criteria, min_reading_time: parseInt(e.target.value) || undefined }
                      }))}
                    />
                  </div>
                  <div>
                    <Label>Max Reading Time (minutes)</Label>
                    <Input
                      type="number"
                      value={newFilter.criteria?.max_reading_time || ''}
                      onChange={(e) => setNewFilter(prev => ({
                        ...prev,
                        criteria: { ...prev.criteria, max_reading_time: parseInt(e.target.value) || undefined }
                      }))}
                    />
                  </div>
                  <div>
                    <Label>Min Quality Score (1-10)</Label>
                    <Input
                      type="number"
                      value={newFilter.criteria?.min_quality_score || ''}
                      onChange={(e) => setNewFilter(prev => ({
                        ...prev,
                        criteria: { ...prev.criteria, min_quality_score: parseInt(e.target.value) || undefined }
                      }))}
                      min="1"
                      max="10"
                    />
                  </div>
                  <div>
                    <Label>Publication Date Range (days)</Label>
                    <Input
                      type="number"
                      value={newFilter.criteria?.publication_date_range || ''}
                      onChange={(e) => setNewFilter(prev => ({
                        ...prev,
                        criteria: { ...prev.criteria, publication_date_range: parseInt(e.target.value) || undefined }
                      }))}
                    />
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={addCustomFilter}>Add Filter</Button>
                <Button variant="outline" onClick={() => setShowCustomFilter(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Keyword Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Keyword Filters
          </CardTitle>
          <CardDescription>
            Fine-tune content filtering with specific keywords
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex gap-2">
            <Input
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              placeholder="Add a keyword..."
              onKeyPress={(e) => e.key === 'Enter' && addKeyword()}
            />
            <Select value={keywordType} onValueChange={(value: keyof TagsFiltersData['keyword_filters']) => setKeywordType(value)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="must_include">Must Include</SelectItem>
                <SelectItem value="must_exclude">Must Exclude</SelectItem>
                <SelectItem value="boost_keywords">Boost</SelectItem>
                <SelectItem value="reduce_keywords">Reduce</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={addKeyword} disabled={!newKeyword.trim()}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {Object.entries(data.keyword_filters).map(([type, keywords]) => (
            keywords.length > 0 && (
              <div key={type} className="space-y-2">
                <Label className="capitalize">{type.replace('_', ' ')}</Label>
                <div className="flex gap-2 flex-wrap">
                  {keywords.map((keyword) => (
                    <Badge key={keyword} variant="outline" className="flex items-center gap-1">
                      {keyword}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => removeKeyword(keyword, type as keyof TagsFiltersData['keyword_filters'])}
                      />
                    </Badge>
                  ))}
                </div>
              </div>
            )
          ))}
        </CardContent>
      </Card>

      {/* Filter Rules */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Content Filtering Rules
          </CardTitle>
          <CardDescription>
            Configure how content is scored and filtered
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Duplicate Detection</Label>
                <p className="text-xs text-gray-500">Filter out duplicate or very similar content</p>
              </div>
              <Switch
                checked={data.filter_rules.duplicate_detection}
                onCheckedChange={(checked) => 
                  setData(prev => ({ 
                    ...prev, 
                    filter_rules: { ...prev.filter_rules, duplicate_detection: checked }
                  }))
                }
              />
            </div>

            <div className="space-y-3">
              <Label>Similarity Threshold: {data.filter_rules.similarity_threshold}%</Label>
              <Slider
                value={[data.filter_rules.similarity_threshold]}
                onValueChange={(value) => 
                  setData(prev => ({ 
                    ...prev, 
                    filter_rules: { ...prev.filter_rules, similarity_threshold: value[0] }
                  }))
                }
                max={100}
                step={5}
              />
            </div>

            <div className="space-y-3">
              <Label>Recency Boost: {data.filter_rules.recency_boost}%</Label>
              <Slider
                value={[data.filter_rules.recency_boost]}
                onValueChange={(value) => 
                  setData(prev => ({ 
                    ...prev, 
                    filter_rules: { ...prev.filter_rules, recency_boost: value[0] }
                  }))
                }
                max={50}
                step={5}
              />
            </div>

            <div className="space-y-3">
              <Label>Trending Boost: {data.filter_rules.trending_boost}%</Label>
              <Slider
                value={[data.filter_rules.trending_boost]}
                onValueChange={(value) => 
                  setData(prev => ({ 
                    ...prev, 
                    filter_rules: { ...prev.filter_rules, trending_boost: value[0] }
                  }))
                }
                max={50}
                step={5}
              />
            </div>

            <div className="space-y-3">
              <Label>Quality Threshold: {data.filter_rules.quality_threshold}/10</Label>
              <Slider
                value={[data.filter_rules.quality_threshold]}
                onValueChange={(value) => 
                  setData(prev => ({ 
                    ...prev, 
                    filter_rules: { ...prev.filter_rules, quality_threshold: value[0] }
                  }))
                }
                max={10}
                step={1}
              />
            </div>

            <div className="space-y-3">
              <Label>Engagement Weight: {data.filter_rules.engagement_weight}%</Label>
              <Slider
                value={[data.filter_rules.engagement_weight]}
                onValueChange={(value) => 
                  setData(prev => ({ 
                    ...prev, 
                    filter_rules: { ...prev.filter_rules, engagement_weight: value[0] }
                  }))
                }
                max={50}
                step={5}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Personalization Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Personalization Settings
          </CardTitle>
          <CardDescription>
            Configure how the system learns from your behavior
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Enable Learning</Label>
                <p className="text-xs text-gray-500">Allow system to learn from your reading patterns</p>
              </div>
              <Switch
                checked={data.learning_enabled}
                onCheckedChange={(checked) => 
                  setData(prev => ({ ...prev, learning_enabled: checked }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Auto-tag Content</Label>
                <p className="text-xs text-gray-500">Automatically tag content based on your preferences</p>
              </div>
              <Switch
                checked={data.auto_tag_content}
                onCheckedChange={(checked) => 
                  setData(prev => ({ ...prev, auto_tag_content: checked }))
                }
              />
            </div>

            <div className="space-y-3">
              <Label>Feedback Weight: {data.feedback_weight}%</Label>
              <p className="text-xs text-gray-500">How much your likes/dislikes influence recommendations</p>
              <Slider
                value={[data.feedback_weight]}
                onValueChange={(value) => 
                  setData(prev => ({ ...prev, feedback_weight: value[0] }))
                }
                max={100}
                step={5}
              />
            </div>

            <div className="space-y-3">
              <Label>Reading History Influence: {data.reading_history_influence}%</Label>
              <p className="text-xs text-gray-500">How much your reading history affects future recommendations</p>
              <Slider
                value={[data.reading_history_influence]}
                onValueChange={(value) => 
                  setData(prev => ({ ...prev, reading_history_influence: value[0] }))
                }
                max={100}
                step={5}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additional Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Notes</CardTitle>
          <CardDescription>
            Any additional preferences about tags and filtering
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={data.additional_notes}
            onChange={(e) => setData(prev => ({ ...prev, additional_notes: e.target.value }))}
            placeholder="Share any additional thoughts about content filtering and tagging..."
            rows={4}
          />
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={saveData} disabled={saving} size="lg" className="flex items-center gap-2">
          {saving ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          ) : (
            <Save className="h-4 w-4" />
          )}
          {saving ? 'Saving Settings...' : 'Save & Continue'}
        </Button>
      </div>
    </div>
  )
}
