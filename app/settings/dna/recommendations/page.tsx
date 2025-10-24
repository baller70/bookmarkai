'use client'

import { useState, useEffect } from 'react'
import { createDemoSupabaseClient, DEMO_USER_ID } from '../../../../lib/supabase-demo'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { ListChecks, Save, TrendingUp, Clock, Star, Brain, Target, Zap, Filter } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface RecommendationSettings {
  id?: string
  user_id?: string
  
  // Algorithm Settings
  algorithm_type: 'collaborative' | 'content_based' | 'hybrid' | 'ai_powered'
  personalization_level: number // 0-100
  diversity_factor: number // 0-100
  novelty_preference: number // 0-100
  serendipity_factor: number // 0-100
  
  // Content Preferences
  content_freshness_weight: number
  trending_content_weight: number
  quality_score_weight: number
  user_feedback_weight: number
  reading_history_weight: number
  social_signals_weight: number
  
  // Recommendation Types
  enable_similar_content: boolean
  enable_trending_recommendations: boolean
  enable_expert_picks: boolean
  enable_collaborative_filtering: boolean
  enable_topic_discovery: boolean
  enable_cross_category: boolean
  
  // Timing & Frequency
  recommendation_frequency: 'real_time' | 'hourly' | 'daily' | 'weekly'
  max_recommendations_per_session: number
  recommendation_refresh_interval: number // hours
  
  // Advanced Settings
  enable_machine_learning: boolean
  enable_deep_learning: boolean
  enable_natural_language_processing: boolean
  enable_sentiment_analysis: boolean
  enable_context_awareness: boolean
  
  // Filtering & Exclusions
  exclude_read_content: boolean
  exclude_bookmarked_content: boolean
  exclude_similar_sources: boolean
  minimum_quality_threshold: number
  maximum_content_age_days: number
  
  // Explanation & Transparency
  show_recommendation_reasons: boolean
  enable_feedback_collection: boolean
  allow_recommendation_tuning: boolean
  show_confidence_scores: boolean
  
  // Experimental Features
  enable_ai_summaries: boolean
  enable_mood_based_recommendations: boolean
  enable_time_based_recommendations: boolean
  enable_location_based_recommendations: boolean
  
  // Notes
  additional_preferences: string
  
  last_updated: string
}

const defaultSettings: RecommendationSettings = {
  algorithm_type: 'hybrid',
  personalization_level: 75,
  diversity_factor: 60,
  novelty_preference: 40,
  serendipity_factor: 30,
  
  content_freshness_weight: 20,
  trending_content_weight: 15,
  quality_score_weight: 30,
  user_feedback_weight: 25,
  reading_history_weight: 35,
  social_signals_weight: 10,
  
  enable_similar_content: true,
  enable_trending_recommendations: true,
  enable_expert_picks: true,
  enable_collaborative_filtering: true,
  enable_topic_discovery: true,
  enable_cross_category: false,
  
  recommendation_frequency: 'daily',
  max_recommendations_per_session: 20,
  recommendation_refresh_interval: 6,
  
  enable_machine_learning: true,
  enable_deep_learning: false,
  enable_natural_language_processing: true,
  enable_sentiment_analysis: false,
  enable_context_awareness: true,
  
  exclude_read_content: true,
  exclude_bookmarked_content: false,
  exclude_similar_sources: false,
  minimum_quality_threshold: 6,
  maximum_content_age_days: 30,
  
  show_recommendation_reasons: true,
  enable_feedback_collection: true,
  allow_recommendation_tuning: true,
  show_confidence_scores: false,
  
  enable_ai_summaries: false,
  enable_mood_based_recommendations: false,
  enable_time_based_recommendations: true,
  enable_location_based_recommendations: false,
  
  additional_preferences: '',
  last_updated: new Date().toISOString()
}

export default function RecommendationsPage() {
  const [settings, setSettings] = useState<RecommendationSettings>(defaultSettings)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  const supabase = createDemoSupabaseClient()

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('dna_recommendations')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (data) {
        setSettings({ ...defaultSettings, ...data })
      }
    } catch (error) {
      console.error('Error loading recommendation settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async () => {
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const settingsData = {
        ...settings,
        user_id: user.id,
        last_updated: new Date().toISOString()
      }

      const { error } = await supabase
        .from('dna_recommendations')
        .upsert(settingsData)

      if (error) throw error

      toast({
        title: "Recommendation settings saved!",
        description: "Your personalized recommendation preferences have been updated.",
      })
    } catch (error) {
      console.error('Error saving recommendation settings:', error)
      toast({
        title: "Error saving settings",
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
          <h2 className="text-3xl font-bold text-gray-900">Recommendations</h2>
          <p className="text-gray-600 mt-2">Configure your personalized content recommendation engine</p>
        </div>
        <Button onClick={saveSettings} disabled={saving} className="flex items-center gap-2">
          {saving ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          ) : (
            <Save className="h-4 w-4" />
          )}
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>

      {/* Algorithm Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Algorithm Configuration
          </CardTitle>
          <CardDescription>
            Configure the core recommendation algorithm and personalization settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label>Recommendation Algorithm</Label>
            <Select
              value={settings.algorithm_type}
              onValueChange={(value: RecommendationSettings['algorithm_type']) => 
                setSettings(prev => ({ ...prev, algorithm_type: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="collaborative">Collaborative Filtering</SelectItem>
                <SelectItem value="content_based">Content-Based</SelectItem>
                <SelectItem value="hybrid">Hybrid (Recommended)</SelectItem>
                <SelectItem value="ai_powered">AI-Powered</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500">
              {settings.algorithm_type === 'collaborative' && 'Recommends content based on similar users\' preferences'}
              {settings.algorithm_type === 'content_based' && 'Recommends content similar to what you\'ve liked before'}
              {settings.algorithm_type === 'hybrid' && 'Combines multiple approaches for best results'}
              {settings.algorithm_type === 'ai_powered' && 'Uses advanced AI to understand your preferences'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label>Personalization Level: {settings.personalization_level}%</Label>
              <p className="text-xs text-gray-500">How much to tailor recommendations to your specific interests</p>
              <Slider
                value={[settings.personalization_level]}
                onValueChange={(value) => 
                  setSettings(prev => ({ ...prev, personalization_level: value[0] }))
                }
                max={100}
                step={5}
              />
            </div>

            <div className="space-y-3">
              <Label>Content Diversity: {settings.diversity_factor}%</Label>
              <p className="text-xs text-gray-500">How varied the recommended content should be</p>
              <Slider
                value={[settings.diversity_factor]}
                onValueChange={(value) => 
                  setSettings(prev => ({ ...prev, diversity_factor: value[0] }))
                }
                max={100}
                step={5}
              />
            </div>

            <div className="space-y-3">
              <Label>Novelty Preference: {settings.novelty_preference}%</Label>
              <p className="text-xs text-gray-500">Preference for new and unfamiliar content</p>
              <Slider
                value={[settings.novelty_preference]}
                onValueChange={(value) => 
                  setSettings(prev => ({ ...prev, novelty_preference: value[0] }))
                }
                max={100}
                step={5}
              />
            </div>

            <div className="space-y-3">
              <Label>Serendipity Factor: {settings.serendipity_factor}%</Label>
              <p className="text-xs text-gray-500">Chance of surprising, unexpected recommendations</p>
              <Slider
                value={[settings.serendipity_factor]}
                onValueChange={(value) => 
                  setSettings(prev => ({ ...prev, serendipity_factor: value[0] }))
                }
                max={100}
                step={5}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content Weighting */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Content Weighting
          </CardTitle>
          <CardDescription>
            Adjust the importance of different factors in content recommendations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label>Content Freshness: {settings.content_freshness_weight}%</Label>
              <p className="text-xs text-gray-500">Importance of recent content</p>
              <Slider
                value={[settings.content_freshness_weight]}
                onValueChange={(value) => 
                  setSettings(prev => ({ ...prev, content_freshness_weight: value[0] }))
                }
                max={50}
                step={5}
              />
            </div>

            <div className="space-y-3">
              <Label>Trending Content: {settings.trending_content_weight}%</Label>
              <p className="text-xs text-gray-500">Weight of currently popular content</p>
              <Slider
                value={[settings.trending_content_weight]}
                onValueChange={(value) => 
                  setSettings(prev => ({ ...prev, trending_content_weight: value[0] }))
                }
                max={50}
                step={5}
              />
            </div>

            <div className="space-y-3">
              <Label>Quality Score: {settings.quality_score_weight}%</Label>
              <p className="text-xs text-gray-500">Importance of content quality ratings</p>
              <Slider
                value={[settings.quality_score_weight]}
                onValueChange={(value) => 
                  setSettings(prev => ({ ...prev, quality_score_weight: value[0] }))
                }
                max={50}
                step={5}
              />
            </div>

            <div className="space-y-3">
              <Label>User Feedback: {settings.user_feedback_weight}%</Label>
              <p className="text-xs text-gray-500">Weight of your likes/dislikes</p>
              <Slider
                value={[settings.user_feedback_weight]}
                onValueChange={(value) => 
                  setSettings(prev => ({ ...prev, user_feedback_weight: value[0] }))
                }
                max={50}
                step={5}
              />
            </div>

            <div className="space-y-3">
              <Label>Reading History: {settings.reading_history_weight}%</Label>
              <p className="text-xs text-gray-500">Influence of your reading patterns</p>
              <Slider
                value={[settings.reading_history_weight]}
                onValueChange={(value) => 
                  setSettings(prev => ({ ...prev, reading_history_weight: value[0] }))
                }
                max={50}
                step={5}
              />
            </div>

            <div className="space-y-3">
              <Label>Social Signals: {settings.social_signals_weight}%</Label>
              <p className="text-xs text-gray-500">Weight of social engagement metrics</p>
              <Slider
                value={[settings.social_signals_weight]}
                onValueChange={(value) => 
                  setSettings(prev => ({ ...prev, social_signals_weight: value[0] }))
                }
                max={50}
                step={5}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recommendation Types */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ListChecks className="h-5 w-5" />
            Recommendation Types
          </CardTitle>
          <CardDescription>
            Choose which types of recommendations you want to receive
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Similar Content</Label>
                <p className="text-xs text-gray-500">Content similar to what you've read</p>
              </div>
              <Switch
                checked={settings.enable_similar_content}
                onCheckedChange={(checked) => 
                  setSettings(prev => ({ ...prev, enable_similar_content: checked }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Trending Recommendations</Label>
                <p className="text-xs text-gray-500">Currently popular content</p>
              </div>
              <Switch
                checked={settings.enable_trending_recommendations}
                onCheckedChange={(checked) => 
                  setSettings(prev => ({ ...prev, enable_trending_recommendations: checked }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Expert Picks</Label>
                <p className="text-xs text-gray-500">Curated content from experts</p>
              </div>
              <Switch
                checked={settings.enable_expert_picks}
                onCheckedChange={(checked) => 
                  setSettings(prev => ({ ...prev, enable_expert_picks: checked }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Collaborative Filtering</Label>
                <p className="text-xs text-gray-500">Based on similar users</p>
              </div>
              <Switch
                checked={settings.enable_collaborative_filtering}
                onCheckedChange={(checked) => 
                  setSettings(prev => ({ ...prev, enable_collaborative_filtering: checked }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Topic Discovery</Label>
                <p className="text-xs text-gray-500">Explore new topics and interests</p>
              </div>
              <Switch
                checked={settings.enable_topic_discovery}
                onCheckedChange={(checked) => 
                  setSettings(prev => ({ ...prev, enable_topic_discovery: checked }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Cross-Category</Label>
                <p className="text-xs text-gray-500">Content from different categories</p>
              </div>
              <Switch
                checked={settings.enable_cross_category}
                onCheckedChange={(checked) => 
                  setSettings(prev => ({ ...prev, enable_cross_category: checked }))
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timing & Frequency */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Timing & Frequency
          </CardTitle>
          <CardDescription>
            Control when and how often you receive recommendations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label>Recommendation Frequency</Label>
              <Select
                value={settings.recommendation_frequency}
                onValueChange={(value: RecommendationSettings['recommendation_frequency']) => 
                  setSettings(prev => ({ ...prev, recommendation_frequency: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="real_time">Real-time</SelectItem>
                  <SelectItem value="hourly">Hourly</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label>Max Recommendations per Session: {settings.max_recommendations_per_session}</Label>
              <Slider
                value={[settings.max_recommendations_per_session]}
                onValueChange={(value) => 
                  setSettings(prev => ({ ...prev, max_recommendations_per_session: value[0] }))
                }
                min={5}
                max={50}
                step={5}
              />
            </div>

            <div className="space-y-3 md:col-span-2">
              <Label>Refresh Interval: {settings.recommendation_refresh_interval} hours</Label>
              <p className="text-xs text-gray-500">How often to update recommendations</p>
              <Slider
                value={[settings.recommendation_refresh_interval]}
                onValueChange={(value) => 
                  setSettings(prev => ({ ...prev, recommendation_refresh_interval: value[0] }))
                }
                min={1}
                max={24}
                step={1}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Advanced AI Features */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Advanced AI Features
          </CardTitle>
          <CardDescription>
            Enable cutting-edge AI capabilities for better recommendations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Machine Learning</Label>
                <p className="text-xs text-gray-500">Basic ML algorithms for pattern recognition</p>
              </div>
              <Switch
                checked={settings.enable_machine_learning}
                onCheckedChange={(checked) => 
                  setSettings(prev => ({ ...prev, enable_machine_learning: checked }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Deep Learning</Label>
                <p className="text-xs text-gray-500">Advanced neural networks (experimental)</p>
              </div>
              <Switch
                checked={settings.enable_deep_learning}
                onCheckedChange={(checked) => 
                  setSettings(prev => ({ ...prev, enable_deep_learning: checked }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Natural Language Processing</Label>
                <p className="text-xs text-gray-500">Understand content meaning and context</p>
              </div>
              <Switch
                checked={settings.enable_natural_language_processing}
                onCheckedChange={(checked) => 
                  setSettings(prev => ({ ...prev, enable_natural_language_processing: checked }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Sentiment Analysis</Label>
                <p className="text-xs text-gray-500">Analyze emotional tone of content</p>
              </div>
              <Switch
                checked={settings.enable_sentiment_analysis}
                onCheckedChange={(checked) => 
                  setSettings(prev => ({ ...prev, enable_sentiment_analysis: checked }))
                }
              />
            </div>

            <div className="flex items-center justify-between md:col-span-2">
              <div className="space-y-1">
                <Label>Context Awareness</Label>
                <p className="text-xs text-gray-500">Consider time, location, and activity context</p>
              </div>
              <Switch
                checked={settings.enable_context_awareness}
                onCheckedChange={(checked) => 
                  setSettings(prev => ({ ...prev, enable_context_awareness: checked }))
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filtering & Exclusions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtering & Exclusions
          </CardTitle>
          <CardDescription>
            Control what content to exclude from recommendations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Exclude Read Content</Label>
                <p className="text-xs text-gray-500">Don't recommend content you've already read</p>
              </div>
              <Switch
                checked={settings.exclude_read_content}
                onCheckedChange={(checked) => 
                  setSettings(prev => ({ ...prev, exclude_read_content: checked }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Exclude Bookmarked Content</Label>
                <p className="text-xs text-gray-500">Don't recommend already bookmarked items</p>
              </div>
              <Switch
                checked={settings.exclude_bookmarked_content}
                onCheckedChange={(checked) => 
                  setSettings(prev => ({ ...prev, exclude_bookmarked_content: checked }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Exclude Similar Sources</Label>
                <p className="text-xs text-gray-500">Limit recommendations from same sources</p>
              </div>
              <Switch
                checked={settings.exclude_similar_sources}
                onCheckedChange={(checked) => 
                  setSettings(prev => ({ ...prev, exclude_similar_sources: checked }))
                }
              />
            </div>

            <div className="space-y-3">
              <Label>Minimum Quality Threshold: {settings.minimum_quality_threshold}/10</Label>
              <p className="text-xs text-gray-500">Only recommend content above this quality score</p>
              <Slider
                value={[settings.minimum_quality_threshold]}
                onValueChange={(value) => 
                  setSettings(prev => ({ ...prev, minimum_quality_threshold: value[0] }))
                }
                min={1}
                max={10}
                step={1}
              />
            </div>

            <div className="space-y-3 md:col-span-2">
              <Label>Maximum Content Age: {settings.maximum_content_age_days} days</Label>
              <p className="text-xs text-gray-500">Don't recommend content older than this</p>
              <Slider
                value={[settings.maximum_content_age_days]}
                onValueChange={(value) => 
                  setSettings(prev => ({ ...prev, maximum_content_age_days: value[0] }))
                }
                min={1}
                max={365}
                step={7}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transparency & Feedback */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Transparency & Feedback
          </CardTitle>
          <CardDescription>
            Control explanation and feedback features
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Show Recommendation Reasons</Label>
                <p className="text-xs text-gray-500">Explain why content was recommended</p>
              </div>
              <Switch
                checked={settings.show_recommendation_reasons}
                onCheckedChange={(checked) => 
                  setSettings(prev => ({ ...prev, show_recommendation_reasons: checked }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Enable Feedback Collection</Label>
                <p className="text-xs text-gray-500">Allow rating and feedback on recommendations</p>
              </div>
              <Switch
                checked={settings.enable_feedback_collection}
                onCheckedChange={(checked) => 
                  setSettings(prev => ({ ...prev, enable_feedback_collection: checked }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Allow Recommendation Tuning</Label>
                <p className="text-xs text-gray-500">Let users adjust recommendations in real-time</p>
              </div>
              <Switch
                checked={settings.allow_recommendation_tuning}
                onCheckedChange={(checked) => 
                  setSettings(prev => ({ ...prev, allow_recommendation_tuning: checked }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Show Confidence Scores</Label>
                <p className="text-xs text-gray-500">Display how confident the system is</p>
              </div>
              <Switch
                checked={settings.show_confidence_scores}
                onCheckedChange={(checked) => 
                  setSettings(prev => ({ ...prev, show_confidence_scores: checked }))
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Experimental Features */}
      <Card>
        <CardHeader>
          <CardTitle>Experimental Features</CardTitle>
          <CardDescription>
            Try cutting-edge recommendation features (may be unstable)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>AI Summaries</Label>
                <p className="text-xs text-gray-500">Generate AI summaries for recommended content</p>
              </div>
              <Switch
                checked={settings.enable_ai_summaries}
                onCheckedChange={(checked) => 
                  setSettings(prev => ({ ...prev, enable_ai_summaries: checked }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Mood-Based Recommendations</Label>
                <p className="text-xs text-gray-500">Recommend content based on detected mood</p>
              </div>
              <Switch
                checked={settings.enable_mood_based_recommendations}
                onCheckedChange={(checked) => 
                  setSettings(prev => ({ ...prev, enable_mood_based_recommendations: checked }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Time-Based Recommendations</Label>
                <p className="text-xs text-gray-500">Adapt recommendations to time of day</p>
              </div>
              <Switch
                checked={settings.enable_time_based_recommendations}
                onCheckedChange={(checked) => 
                  setSettings(prev => ({ ...prev, enable_time_based_recommendations: checked }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Location-Based Recommendations</Label>
                <p className="text-xs text-gray-500">Consider your location for recommendations</p>
              </div>
              <Switch
                checked={settings.enable_location_based_recommendations}
                onCheckedChange={(checked) => 
                  setSettings(prev => ({ ...prev, enable_location_based_recommendations: checked }))
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additional Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Preferences</CardTitle>
          <CardDescription>
            Share any specific preferences about recommendations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={settings.additional_preferences}
            onChange={(e) => setSettings(prev => ({ ...prev, additional_preferences: e.target.value }))}
            placeholder="Describe any specific preferences, topics you'd like to see more of, or feedback about the recommendation system..."
            rows={4}
          />
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={saveSettings} disabled={saving} size="lg" className="flex items-center gap-2">
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