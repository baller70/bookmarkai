'use client'

import { useState, useEffect } from 'react'
import { createDemoSupabaseClient, DEMO_USER_ID } from '../../../../lib/supabase-demo'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { SlidersHorizontal, Save, TrendingUp, Target, Star, AlertCircle } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface ImportanceData {
  id?: string
  user_id?: string
  
  // Content Quality Factors
  content_accuracy: number
  content_depth: number
  content_freshness: number
  author_credibility: number
  practical_applicability: number
  
  // Relevance Factors
  topic_relevance: number
  skill_level_match: number
  career_relevance: number
  personal_interest: number
  time_investment: number
  
  // Source Factors
  source_reputation: number
  peer_recommendations: number
  expert_endorsements: number
  community_engagement: number
  
  // Personalization Preferences
  prioritize_trending: boolean
  prioritize_bookmarked_authors: boolean
  prioritize_similar_interests: boolean
  avoid_duplicate_topics: boolean
  weight_reading_history: boolean
  
  // Custom Criteria
  custom_criteria: Array<{
    name: string
    weight: number
    description: string
  }>
  
  // Notes
  additional_notes: string
  
  last_updated: string
}

const defaultImportance: ImportanceData = {
  content_accuracy: 85,
  content_depth: 70,
  content_freshness: 60,
  author_credibility: 80,
  practical_applicability: 90,
  
  topic_relevance: 95,
  skill_level_match: 75,
  career_relevance: 85,
  personal_interest: 70,
  time_investment: 65,
  
  source_reputation: 75,
  peer_recommendations: 80,
  expert_endorsements: 70,
  community_engagement: 50,
  
  prioritize_trending: false,
  prioritize_bookmarked_authors: true,
  prioritize_similar_interests: true,
  avoid_duplicate_topics: true,
  weight_reading_history: true,
  
  custom_criteria: [],
  additional_notes: '',
  last_updated: new Date().toISOString()
}

const importanceCategories = [
  {
    title: 'Content Quality',
    description: 'How important are these content quality factors?',
    icon: <Star className="h-5 w-5" />,
    factors: [
      { key: 'content_accuracy', label: 'Content Accuracy', description: 'Factual correctness and reliability' },
      { key: 'content_depth', label: 'Content Depth', description: 'Thoroughness and comprehensiveness' },
      { key: 'content_freshness', label: 'Content Freshness', description: 'How recent the content is' },
      { key: 'author_credibility', label: 'Author Credibility', description: 'Author expertise and reputation' },
      { key: 'practical_applicability', label: 'Practical Applicability', description: 'How actionable the content is' }
    ]
  },
  {
    title: 'Personal Relevance',
    description: 'How important is personal relevance to your interests and goals?',
    icon: <Target className="h-5 w-5" />,
    factors: [
      { key: 'topic_relevance', label: 'Topic Relevance', description: 'Matches your interests and needs' },
      { key: 'skill_level_match', label: 'Skill Level Match', description: 'Appropriate for your current level' },
      { key: 'career_relevance', label: 'Career Relevance', description: 'Useful for your professional goals' },
      { key: 'personal_interest', label: 'Personal Interest', description: 'Aligns with your curiosity' },
      { key: 'time_investment', label: 'Time Investment', description: 'Reasonable time commitment required' }
    ]
  },
  {
    title: 'Social Signals',
    description: 'How much do social factors influence your content preferences?',
    icon: <TrendingUp className="h-5 w-5" />,
    factors: [
      { key: 'source_reputation', label: 'Source Reputation', description: 'Reputation of the publishing source' },
      { key: 'peer_recommendations', label: 'Peer Recommendations', description: 'Recommended by colleagues' },
      { key: 'expert_endorsements', label: 'Expert Endorsements', description: 'Endorsed by industry experts' },
      { key: 'community_engagement', label: 'Community Engagement', description: 'High engagement and discussion' }
    ]
  }
]

export default function ImportancePage() {
  const [importance, setImportance] = useState<ImportanceData>(defaultImportance)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [newCriterion, setNewCriterion] = useState({ name: '', weight: 50, description: '' })
  const [showAddCriterion, setShowAddCriterion] = useState(false)
  
  const supabase = createDemoSupabaseClient()

  useEffect(() => {
    loadImportance()
  }, [])

  const loadImportance = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('dna_importance')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (data) {
        setImportance({ ...defaultImportance, ...data })
      }
    } catch (error) {
      console.error('Error loading importance settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveImportance = async () => {
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const importanceData = {
        ...importance,
        user_id: user.id,
        last_updated: new Date().toISOString()
      }

      const { error } = await supabase
        .from('dna_importance')
        .upsert(importanceData)

      if (error) throw error

      toast({
        title: "Importance settings saved!",
        description: "Your content prioritization preferences have been updated.",
      })
    } catch (error) {
      console.error('Error saving importance settings:', error)
      toast({
        title: "Error saving settings",
        description: "Please try again later.",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  const handleSliderChange = (key: string, value: number[]) => {
    setImportance(prev => ({ ...prev, [key]: value[0] }))
  }

  const handleSwitchChange = (key: string, checked: boolean) => {
    setImportance(prev => ({ ...prev, [key]: checked }))
  }

  const addCustomCriterion = () => {
    if (!newCriterion.name.trim()) return
    
    setImportance(prev => ({
      ...prev,
      custom_criteria: [...prev.custom_criteria, { ...newCriterion }]
    }))
    
    setNewCriterion({ name: '', weight: 50, description: '' })
    setShowAddCriterion(false)
  }

  const removeCustomCriterion = (index: number) => {
    setImportance(prev => ({
      ...prev,
      custom_criteria: prev.custom_criteria.filter((_, i) => i !== index)
    }))
  }

  const updateCustomCriterion = (index: number, field: string, value: string | number) => {
    setImportance(prev => ({
      ...prev,
      custom_criteria: prev.custom_criteria.map((criterion, i) => 
        i === index ? { ...criterion, [field]: value } : criterion
      )
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
          <h2 className="text-3xl font-bold text-gray-900">Importance Settings</h2>
          <p className="text-gray-600 mt-2">Define what matters most when prioritizing content for you</p>
        </div>
        <Button onClick={saveImportance} disabled={saving} className="flex items-center gap-2">
          {saving ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          ) : (
            <Save className="h-4 w-4" />
          )}
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>

      {/* Importance Categories */}
      {importanceCategories.map((category) => (
        <Card key={category.title}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {category.icon}
              {category.title}
            </CardTitle>
            <CardDescription>{category.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {category.factors.map((factor) => (
              <div key={factor.key} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">{factor.label}</Label>
                    <p className="text-xs text-gray-500 mt-1">{factor.description}</p>
                  </div>
                  <Badge variant="outline">
                    {importance[factor.key as keyof ImportanceData] as number}%
                  </Badge>
                </div>
                <Slider
                  value={[importance[factor.key as keyof ImportanceData] as number]}
                  onValueChange={(value) => handleSliderChange(factor.key, value)}
                  max={100}
                  step={5}
                  className="w-full"
                />
              </div>
            ))}
          </CardContent>
        </Card>
      ))}

      {/* Personalization Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SlidersHorizontal className="h-5 w-5" />
            Personalization Preferences
          </CardTitle>
          <CardDescription>
            Additional preferences for how content should be prioritized
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Prioritize Trending Content</Label>
                <p className="text-xs text-gray-500">Boost popular and trending topics</p>
              </div>
              <Switch
                checked={importance.prioritize_trending}
                onCheckedChange={(checked) => handleSwitchChange('prioritize_trending', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Prioritize Bookmarked Authors</Label>
                <p className="text-xs text-gray-500">Boost content from your favorite authors</p>
              </div>
              <Switch
                checked={importance.prioritize_bookmarked_authors}
                onCheckedChange={(checked) => handleSwitchChange('prioritize_bookmarked_authors', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Prioritize Similar Interests</Label>
                <p className="text-xs text-gray-500">Boost content similar to your interests</p>
              </div>
              <Switch
                checked={importance.prioritize_similar_interests}
                onCheckedChange={(checked) => handleSwitchChange('prioritize_similar_interests', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Avoid Duplicate Topics</Label>
                <p className="text-xs text-gray-500">Reduce similar content recommendations</p>
              </div>
              <Switch
                checked={importance.avoid_duplicate_topics}
                onCheckedChange={(checked) => handleSwitchChange('avoid_duplicate_topics', checked)}
              />
            </div>

            <div className="flex items-center justify-between md:col-span-2">
              <div className="space-y-1">
                <Label>Weight Reading History</Label>
                <p className="text-xs text-gray-500">Use your past reading patterns to improve recommendations</p>
              </div>
              <Switch
                checked={importance.weight_reading_history}
                onCheckedChange={(checked) => handleSwitchChange('weight_reading_history', checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Custom Criteria */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Custom Criteria
          </CardTitle>
          <CardDescription>
            Add your own custom criteria for content importance
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {importance.custom_criteria.map((criterion, index) => (
            <div key={index} className="p-4 border rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">{criterion.name}</h4>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{criterion.weight}%</Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeCustomCriterion(index)}
                  >
                    Remove
                  </Button>
                </div>
              </div>
              <p className="text-sm text-gray-600">{criterion.description}</p>
              <Slider
                value={[criterion.weight]}
                onValueChange={(value) => updateCustomCriterion(index, 'weight', value[0])}
                max={100}
                step={5}
                className="w-full"
              />
            </div>
          ))}

          {showAddCriterion ? (
            <div className="p-4 border rounded-lg space-y-3">
              <div className="space-y-2">
                <Label>Criterion Name</Label>
                <input
                  type="text"
                  value={newCriterion.name}
                  onChange={(e) => setNewCriterion(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="e.g., Video Content Priority"
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={newCriterion.description}
                  onChange={(e) => setNewCriterion(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe what this criterion measures..."
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label>Weight: {newCriterion.weight}%</Label>
                <Slider
                  value={[newCriterion.weight]}
                  onValueChange={(value) => setNewCriterion(prev => ({ ...prev, weight: value[0] }))}
                  max={100}
                  step={5}
                  className="w-full"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={addCustomCriterion} size="sm">
                  Add Criterion
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowAddCriterion(false)}
                  size="sm"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="outline"
              onClick={() => setShowAddCriterion(true)}
              className="w-full"
            >
              Add Custom Criterion
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Additional Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Notes</CardTitle>
          <CardDescription>
            Any additional preferences or context about content importance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={importance.additional_notes}
            onChange={(e) => setImportance(prev => ({ ...prev, additional_notes: e.target.value }))}
            placeholder="Share any additional thoughts about what makes content important to you..."
            rows={4}
          />
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={saveImportance} disabled={saving} size="lg" className="flex items-center gap-2">
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
