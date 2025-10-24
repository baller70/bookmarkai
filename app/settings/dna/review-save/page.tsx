'use client'

import { useState, useEffect } from 'react'
import { createDemoSupabaseClient, DEMO_USER_ID } from '../../../../lib/supabase-demo'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'
import { Download, Save, CheckCircle, AlertCircle, User, HelpCircle, SlidersHorizontal, LayoutList, Tag, Globe, ListChecks, RefreshCw } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import Link from 'next/link'

interface ProfileSummary {
  aboutYou: {
    completed: boolean
    completionPercentage: number
    keyData: {
      name?: string
      email?: string
      professional_interests?: string[]
      goals?: string[]
    }
  }
  insights: {
    completed: boolean
    completionPercentage: number
    answeredQuestions: number
    totalQuestions: number
  }
  importance: {
    completed: boolean
    completionPercentage: number
    topFactors: string[]
  }
  contentChannels: {
    completed: boolean
    completionPercentage: number
    enabledChannels: number
    customChannels: number
  }
  tagsFilters: {
    completed: boolean
    completionPercentage: number
    preferredTags: number
    blockedTags: number
    smartFilters: number
  }
  sitePreferences: {
    completed: boolean
    completionPercentage: number
    theme: string
    customizations: number
  }
  recommendations: {
    completed: boolean
    completionPercentage: number
    algorithmType: string
    enabledFeatures: number
  }
}

const sectionIcons = {
  aboutYou: <User className="h-4 w-4" />,
  insights: <HelpCircle className="h-4 w-4" />,
  importance: <SlidersHorizontal className="h-4 w-4" />,
  contentChannels: <LayoutList className="h-4 w-4" />,
  tagsFilters: <Tag className="h-4 w-4" />,
  sitePreferences: <Globe className="h-4 w-4" />,
  recommendations: <ListChecks className="h-4 w-4" />
}

const sectionNames = {
  aboutYou: 'About You',
  insights: 'Insights',
  importance: 'Importance',
  contentChannels: 'Content & Channels',
  tagsFilters: 'Tags & Filters',
  sitePreferences: 'Site Preferences',
  recommendations: 'Recommendations'
}

export default function ReviewSavePage() {
  const [summary, setSummary] = useState<ProfileSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [finalNotes, setFinalNotes] = useState('')
  
  const supabase = createDemoSupabaseClient()

  useEffect(() => {
    loadProfileSummary()
  }, [])

  const loadProfileSummary = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Load data from all sections
      const [
        aboutYouData,
        insightsData,
        importanceData,
        contentChannelsData,
        tagsFiltersData,
        sitePreferencesData,
        recommendationsData
      ] = await Promise.all([
        supabase.from('dna_profiles').select('*').eq('user_id', user.id).single(),
        supabase.from('dna_insights').select('*').eq('user_id', user.id).single(),
        supabase.from('dna_importance').select('*').eq('user_id', user.id).single(),
        supabase.from('dna_content_channels').select('*').eq('user_id', user.id).single(),
        supabase.from('dna_tags_filters').select('*').eq('user_id', user.id).single(),
        supabase.from('dna_site_preferences').select('*').eq('user_id', user.id).single(),
        supabase.from('dna_recommendations').select('*').eq('user_id', user.id).single()
      ])

      // Calculate completion status for each section
      const profileSummary: ProfileSummary = {
        aboutYou: {
          completed: !!aboutYouData.data,
          completionPercentage: aboutYouData.data ? calculateAboutYouCompletion(aboutYouData.data) : 0,
          keyData: {
            name: aboutYouData.data?.name,
            email: aboutYouData.data?.email,
            professional_interests: aboutYouData.data?.professional_interests || [],
            goals: aboutYouData.data?.goals || []
          }
        },
        insights: {
          completed: !!insightsData.data,
          completionPercentage: insightsData.data ? 85 : 0, // Simplified calculation
          answeredQuestions: insightsData.data ? Object.keys(insightsData.data.responses || {}).length : 0,
          totalQuestions: 20 // Total number of insight questions
        },
        importance: {
          completed: !!importanceData.data,
          completionPercentage: importanceData.data ? 90 : 0,
          topFactors: importanceData.data ? getTopImportanceFactors(importanceData.data) : []
        },
        contentChannels: {
          completed: !!contentChannelsData.data,
          completionPercentage: contentChannelsData.data ? 80 : 0,
          enabledChannels: contentChannelsData.data ? (contentChannelsData.data.enabled_channels || []).length : 0,
          customChannels: contentChannelsData.data ? (contentChannelsData.data.custom_channels || []).length : 0
        },
        tagsFilters: {
          completed: !!tagsFiltersData.data,
          completionPercentage: tagsFiltersData.data ? 75 : 0,
          preferredTags: tagsFiltersData.data ? (tagsFiltersData.data.preferred_tags || []).length : 0,
          blockedTags: tagsFiltersData.data ? (tagsFiltersData.data.blocked_tags || []).length : 0,
          smartFilters: tagsFiltersData.data ? (tagsFiltersData.data.smart_filters || []).filter((f: Record<string, unknown>) => f.active).length : 0
        },
        sitePreferences: {
          completed: !!sitePreferencesData.data,
          completionPercentage: sitePreferencesData.data ? 70 : 0,
          theme: sitePreferencesData.data?.theme || 'auto',
          customizations: sitePreferencesData.data ? countCustomizations(sitePreferencesData.data) : 0
        },
        recommendations: {
          completed: !!recommendationsData.data,
          completionPercentage: recommendationsData.data ? 85 : 0,
          algorithmType: recommendationsData.data?.algorithm_type || 'hybrid',
          enabledFeatures: recommendationsData.data ? countEnabledRecommendationFeatures(recommendationsData.data) : 0
        }
      }

      setSummary(profileSummary)
    } catch (error) {
      console.error('Error loading profile summary:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateAboutYouCompletion = (data: Record<string, unknown>): number => {
    const fields = ['name', 'email', 'professional_interests', 'goals', 'expertise_level', 'time_availability']
    const completed = fields.filter(field => data[field] && data[field] !== '').length
    return Math.round((completed / fields.length) * 100)
  }

  const getTopImportanceFactors = (data: Record<string, unknown>): string[] => {
    const factors = [
      { name: 'Content Accuracy', value: Number(data.content_accuracy) || 0 },
      { name: 'Content Depth', value: Number(data.content_depth) || 0 },
      { name: 'Content Freshness', value: Number(data.content_freshness) || 0 },
      { name: 'Source Credibility', value: Number(data.source_credibility) || 0 },
      { name: 'Reading Time', value: Number(data.reading_time_preference) || 0 }
    ]
    return factors
      .sort((a, b) => b.value - a.value)
      .slice(0, 3)
      .map(f => f.name)
  }

  const countCustomizations = (data: Record<string, unknown>): number => {
    let count = 0
    if (data.theme !== 'auto') count++
    if (data.color_scheme !== 'blue') count++
    if (data.font_size !== 'medium') count++
    if (typeof data.custom_css === 'string' && data.custom_css.trim()) count++
    return count
  }

  const countEnabledRecommendationFeatures = (data: Record<string, unknown>): number => {
    const features = [
      'enable_similar_content',
      'enable_trending_recommendations',
      'enable_expert_picks',
      'enable_collaborative_filtering',
      'enable_topic_discovery',
      'enable_machine_learning',
      'enable_natural_language_processing'
    ]
    return features.filter(feature => data[feature]).length
  }

  const calculateOverallCompletion = (): number => {
    if (!summary) return 0
    const sections = Object.values(summary)
    const totalCompletion = sections.reduce((sum, section) => sum + section.completionPercentage, 0)
    return Math.round(totalCompletion / sections.length)
  }

  const getCompletedSections = (): number => {
    if (!summary) return 0
    return Object.values(summary).filter(section => section.completed).length
  }

  const saveProfile = async () => {
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Save final notes and completion status
      const { error } = await supabase
        .from('dna_profile_completion')
        .upsert({
          user_id: user.id,
          completed_at: new Date().toISOString(),
          overall_completion: calculateOverallCompletion(),
          completed_sections: getCompletedSections(),
          total_sections: 7,
          final_notes: finalNotes,
          last_updated: new Date().toISOString()
        })

      if (error) throw error

      toast({
        title: "DNA Profile saved successfully!",
        description: "Your bookmark DNA profile has been saved and is now active.",
      })
    } catch (error) {
      console.error('Error saving profile:', error)
      toast({
        title: "Error saving profile",
        description: "Please try again later.",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  const exportProfile = async () => {
    setExporting(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Gather all profile data
      const [
        aboutYouData,
        insightsData,
        importanceData,
        contentChannelsData,
        tagsFiltersData,
        sitePreferencesData,
        recommendationsData
      ] = await Promise.all([
        supabase.from('dna_profiles').select('*').eq('user_id', user.id).single(),
        supabase.from('dna_insights').select('*').eq('user_id', user.id).single(),
        supabase.from('dna_importance').select('*').eq('user_id', user.id).single(),
        supabase.from('dna_content_channels').select('*').eq('user_id', user.id).single(),
        supabase.from('dna_tags_filters').select('*').eq('user_id', user.id).single(),
        supabase.from('dna_site_preferences').select('*').eq('user_id', user.id).single(),
        supabase.from('dna_recommendations').select('*').eq('user_id', user.id).single()
      ])

      const exportData = {
        export_date: new Date().toISOString(),
        user_id: user.id,
        profile_completion: calculateOverallCompletion(),
        sections: {
          about_you: aboutYouData.data,
          insights: insightsData.data,
          importance: importanceData.data,
          content_channels: contentChannelsData.data,
          tags_filters: tagsFiltersData.data,
          site_preferences: sitePreferencesData.data,
          recommendations: recommendationsData.data
        },
        final_notes: finalNotes
      }

      // Create and download JSON file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `bookmark-dna-profile-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast({
        title: "Profile exported successfully!",
        description: "Your DNA profile has been downloaded as a JSON file.",
      })
    } catch (error) {
      console.error('Error exporting profile:', error)
      toast({
        title: "Error exporting profile",
        description: "Please try again later.",
        variant: "destructive"
      })
    } finally {
      setExporting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  const overallCompletion = calculateOverallCompletion()
  const completedSections = getCompletedSections()

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold text-gray-900">Review & Save</h2>
        <p className="text-gray-600">Review your bookmark DNA profile and save your preferences</p>
        
        {/* Overall Progress */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-lg font-medium">Overall Completion</span>
                <span className="text-2xl font-bold text-primary">{overallCompletion}%</span>
              </div>
              <Progress value={overallCompletion} className="h-3" />
              <p className="text-sm text-gray-600">
                {completedSections} of 7 sections completed
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Section Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {summary && Object.entries(summary).map(([key, section]) => (
          <Card key={key} className={`relative ${section.completed ? 'border-green-200 bg-green-50' : 'border-orange-200 bg-orange-50'}`}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  {sectionIcons[key as keyof typeof sectionIcons]}
                  {sectionNames[key as keyof typeof sectionNames]}
                </CardTitle>
                {section.completed ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-orange-600" />
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Completion</span>
                <span className="font-medium">{section.completionPercentage}%</span>
              </div>
              <Progress value={section.completionPercentage} className="h-2" />
              
              {/* Section-specific details */}
              <div className="space-y-2 text-sm">
                {key === 'aboutYou' && (
                  <>
                    {section.keyData.name && <p><strong>Name:</strong> {section.keyData.name}</p>}
                    {section.keyData.professional_interests && section.keyData.professional_interests.length > 0 && (
                      <p><strong>Interests:</strong> {section.keyData.professional_interests.slice(0, 2).join(', ')}</p>
                    )}
                  </>
                )}
                
                {key === 'insights' && (
                  <p><strong>Questions Answered:</strong> {section.answeredQuestions}/{section.totalQuestions}</p>
                )}
                
                {key === 'importance' && section.topFactors.length > 0 && (
                  <div>
                    <p><strong>Top Factors:</strong></p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {section.topFactors.map((factor) => (
                        <Badge key={factor} variant="outline" className="text-xs">
                          {factor}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {key === 'contentChannels' && (
                  <>
                    <p><strong>Enabled Channels:</strong> {section.enabledChannels}</p>
                    <p><strong>Custom Channels:</strong> {section.customChannels}</p>
                  </>
                )}
                
                {key === 'tagsFilters' && (
                  <>
                    <p><strong>Preferred Tags:</strong> {section.preferredTags}</p>
                    <p><strong>Smart Filters:</strong> {section.smartFilters}</p>
                  </>
                )}
                
                {key === 'sitePreferences' && (
                  <>
                    <p><strong>Theme:</strong> {section.theme}</p>
                    <p><strong>Customizations:</strong> {section.customizations}</p>
                  </>
                )}
                
                {key === 'recommendations' && (
                  <>
                    <p><strong>Algorithm:</strong> {section.algorithmType}</p>
                    <p><strong>Enabled Features:</strong> {section.enabledFeatures}</p>
                  </>
                )}
              </div>

              {!section.completed && (
                <Link href={`/settings/dna/${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`}>
                  <Button variant="outline" size="sm" className="w-full mt-2">
                    Complete Section
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recommendations */}
      {overallCompletion < 80 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <AlertCircle className="h-5 w-5" />
              Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-blue-800">
              <p>To get the most out of your bookmark DNA profile, consider completing these sections:</p>
              <ul className="list-disc list-inside space-y-1">
                {summary && Object.entries(summary).map(([key, section]) => (
                  !section.completed && (
                    <li key={key}>
                      <Link href={`/settings/dna/${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`} className="underline hover:no-underline">
                        {sectionNames[key as keyof typeof sectionNames]}
                      </Link>
                      {' - '}
                      {section.completionPercentage < 50 ? 'Needs attention' : 'Almost complete'}
                    </li>
                  )
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Final Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Final Notes</CardTitle>
          <CardDescription>
            Add any final thoughts or specific requirements for your bookmark DNA profile
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={finalNotes}
            onChange={(e) => setFinalNotes(e.target.value)}
            placeholder="Share any additional thoughts, specific requirements, or feedback about your bookmark DNA profile setup..."
            rows={4}
          />
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button 
          onClick={exportProfile} 
          disabled={exporting}
          variant="outline"
          size="lg"
          className="flex items-center gap-2"
        >
          {exporting ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
          ) : (
            <Download className="h-4 w-4" />
          )}
          {exporting ? 'Exporting...' : 'Export Profile'}
        </Button>

        <Button 
          onClick={saveProfile} 
          disabled={saving || overallCompletion < 50}
          size="lg"
          className="flex items-center gap-2"
        >
          {saving ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          ) : (
            <Save className="h-4 w-4" />
          )}
          {saving ? 'Saving Profile...' : 'Save & Activate Profile'}
        </Button>

        <Button 
          onClick={loadProfileSummary} 
          variant="outline"
          size="lg"
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh Status
        </Button>
      </div>

      {overallCompletion < 50 && (
        <div className="text-center p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-800">
            <strong>Note:</strong> Complete at least 50% of your profile to save and activate it. 
            Current completion: {overallCompletion}%
          </p>
        </div>
      )}

      {/* Success Message */}
      {overallCompletion >= 80 && (
        <div className="text-center p-6 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-green-900 mb-2">
            Excellent! Your DNA Profile is Nearly Complete
          </h3>
          <p className="text-green-800">
            With {overallCompletion}% completion, your bookmark DNA profile will provide highly personalized 
            content recommendations and an optimized browsing experience.
          </p>
        </div>
      )}
    </div>
  )
}
