'use client'

import { useState, useEffect } from 'react'
import { createDemoSupabaseClient, DEMO_USER_ID } from '../../../lib/supabase-demo'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { X, Plus, Upload, Save, User, Briefcase, Globe, Heart, Target, TrendingUp } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface ProfileData {
  id?: string
  user_id?: string
  // Basic Information
  full_name: string
  favorite_industry: string
  custom_industry: string
  organization: string
  bio: string
  avatar_url: string

  // Content Preferences
  favorite_industry_2: string
  custom_industry_2: string
  link_source_preference: string
  custom_link_source_preference: string
  language_preference: string
  custom_language_preference: string
  media_format_priority: string
  custom_media_format_priority: string
  content_freshness: string
  custom_content_freshness: string
  source_credibility: string
  custom_source_credibility: string
  primary_use_case: string
  custom_primary_use_case: string

  // Links & Social
  website: string
  linkedin: string
  twitter: string
  tiktok: string
  instagram: string
  facebook: string

  // Interests & Skills
  industries: string[]
  skills: string[]
  interests: string[]

  // Learning Preferences
  learning_style: string
  content_depth: string
  time_commitment: string
  preferred_formats: string[]

  // Goals & Objectives
  primary_goals: string[]
  career_stage: string
  focus_areas: string[]

  // Privacy & Visibility
  profile_visibility: string
  show_activity: boolean
  allow_recommendations: boolean

  // Personalization
  goal_setting_style: string
  language: string
  notification_frequency: string

  created_at?: string
  updated_at?: string
}

const defaultProfile: ProfileData = {
  full_name: '',
  favorite_industry: '',
  custom_industry: '',
  organization: '',
  bio: '',
  avatar_url: '',
  favorite_industry_2: '',
  custom_industry_2: '',
  link_source_preference: '',
  custom_link_source_preference: '',
  language_preference: '',
  custom_language_preference: '',
  media_format_priority: '',
  custom_media_format_priority: '',
  content_freshness: '',
  custom_content_freshness: '',
  source_credibility: '',
  custom_source_credibility: '',
  primary_use_case: '',
  custom_primary_use_case: '',
  website: '',
  linkedin: '',
  twitter: '',
  tiktok: '',
  instagram: '',
  facebook: '',
  industries: [],
  skills: [],
  interests: [],
  learning_style: '',
  content_depth: '',
  time_commitment: '',
  preferred_formats: [],
  primary_goals: [],
  career_stage: '',
  focus_areas: [],
  profile_visibility: 'private',
  show_activity: true,
  allow_recommendations: true,
      goal_setting_style: '',
  language: 'en',
  notification_frequency: 'daily'
}

interface AboutYouComponentProps {
  profileData?: Record<string, unknown>
  onProfileUpdate?: (data: Record<string, unknown>) => void
}

export function AboutYouComponent({ onProfileUpdate }: AboutYouComponentProps) {
  const [profile, setProfile] = useState<ProfileData>(defaultProfile)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [newIndustry, setNewIndustry] = useState('')
  const [newSkill, setNewSkill] = useState('')
  const [newInterest, setNewInterest] = useState('')

  const supabase = createDemoSupabaseClient()

  useEffect(() => {
    loadProfile()

    // Show demo mode message
    const showDemoMessage = () => {
      toast({
        title: "Demo mode active",
        description: "Testing features without authentication. Data will be saved to Supabase with demo user ID.",
      })
    }

    // Delay the demo message to avoid interfering with page load
    setTimeout(showDemoMessage, 2000)
  }, [])

  const loadProfile = async () => {
    try {
      // Try to load from Supabase first using demo user ID
      console.log('Loading profile from Supabase with demo user ID:', DEMO_USER_ID)

      const { data: supabaseProfile, error } = await supabase
        .from('dna_profiles')
        .select('*')
        .eq('user_id', DEMO_USER_ID)
        .single()

      if (supabaseProfile && !error) {
        setProfile({ ...defaultProfile, ...supabaseProfile })
        console.log('Loaded profile from Supabase:', supabaseProfile)
        return
      }

      // Fallback to local storage if Supabase doesn't have data
      const localProfile = localStorage.getItem('dna_profile_draft')
      if (localProfile) {
        try {
          const parsedProfile = JSON.parse(localProfile)
          setProfile({ ...defaultProfile, ...parsedProfile })
          console.log('Loaded profile from local storage')
          return
        } catch (parseError) {
          console.warn('Error parsing local profile:', parseError)
        }
      }

      // Use default profile if no data found anywhere
      console.log('No existing profile found, using default data')
      setProfile(defaultProfile)
    } catch (error) {
      console.warn('Error loading profile from Supabase:', error)
      // Fallback to localStorage or default
      const localProfile = localStorage.getItem('dna_profile_draft')
      if (localProfile) {
        try {
          const parsedProfile = JSON.parse(localProfile)
          setProfile({ ...defaultProfile, ...parsedProfile })
          console.log('Loaded profile from local storage as fallback')
        } catch (parseError) {
          setProfile(defaultProfile)
        }
      } else {
        setProfile(defaultProfile)
      }
    } finally {
      setLoading(false)
    }
  }

  const saveProfile = async () => {
    setSaving(true)
    try {
      // Always use demo user ID (bypassing authentication)
      const userId = DEMO_USER_ID
      console.log('Saving profile with demo user ID:', userId)

      const profileData = {
        ...profile,
        user_id: userId,
        updated_at: new Date().toISOString()
      }

      const { error } = await supabase
        .from('dna_profiles')
        .upsert(profileData)

      if (error) {
        // Fallback to localStorage if database save fails
        localStorage.setItem('dna_profile_draft', JSON.stringify(profileData))
      toast({
          title: "Profile saved locally",
          description: "Could not save to cloud. Profile saved locally instead.",
      })

        if (onProfileUpdate) {
          onProfileUpdate(profileData)
        }
      return
    }

      // Also save basic profile info to the profiles table for dashboard integration
      try {
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: userId,
            full_name: profile.full_name || null,
            avatar_url: profile.avatar_url || null,
            updated_at: new Date().toISOString()
          })

        if (profileError) {
          console.warn('Could not save to profiles table:', profileError)
        } else {
          console.log('Profile synced to profiles table for dashboard integration')
        }
      } catch (profileSaveError) {
        console.warn('Error saving to profiles table:', profileSaveError)
      }

      // Clear any local draft since we saved to cloud successfully
      localStorage.removeItem('dna_profile_draft')

      toast({
        title: "Profile saved successfully!",
        description: "Your DNA profile has been saved to Supabase in demo mode.",
      })

      if (onProfileUpdate) {
        onProfileUpdate(profileData)
      }
    } catch (error) {
      console.error('Error saving profile:', error)

      // Final fallback to localStorage
      try {
        const profileData = {
          ...profile,
          updated_at: new Date().toISOString()
        }
        localStorage.setItem('dna_profile_draft', JSON.stringify(profileData))

      toast({
          title: "Profile saved locally",
          description: "Saved to this device. Sign in to save to the cloud.",
        })

        if (onProfileUpdate) {
          onProfileUpdate(profileData)
        }
      } catch (fallbackError) {
      toast({
          title: "Error saving profile",
          description: "Please try again later.",
        variant: "destructive"
      })
      }
    } finally {
      setSaving(false)
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)

    try {
      // First try to upload to Supabase storage
      const supabaseUrl = await trySupabaseUpload(file)

      let avatarUrl = supabaseUrl

      // If Supabase upload fails, fallback to local file URL
      if (!supabaseUrl) {
        console.log('Supabase upload failed, using local file URL')
        const reader = new FileReader()
        await new Promise((resolve) => {
          reader.onload = (event) => {
            if (event.target?.result) {
              avatarUrl = event.target.result as string
            }
            resolve(null)
          }
          reader.readAsDataURL(file)
        })
      }

      if (avatarUrl) {
        setProfile(prev => ({ ...prev, avatar_url: avatarUrl || '' }))

        // Save to localStorage for bookmark cards integration
        try {
          // Save in multiple formats for compatibility
          localStorage.setItem('dna_profile_avatar', avatarUrl)
          localStorage.setItem('profilePicture', avatarUrl)

          // Save to userSettings format for dashboard
          const userSettings = JSON.parse(localStorage.getItem('userSettings') || '{}')
          userSettings.profile = {
            ...userSettings.profile,
            avatar: avatarUrl,
            avatarUrl: avatarUrl,
            profile_picture: avatarUrl
          }
          localStorage.setItem('userSettings', JSON.stringify(userSettings))

          console.log('Profile avatar saved to localStorage for dashboard integration')

          toast({
            title: "Avatar updated successfully!",
            description: supabaseUrl
              ? "Your profile picture has been uploaded to Supabase and saved locally."
              : "Your profile picture has been saved locally.",
          })
        } catch (storageError) {
          console.warn('Could not save to localStorage:', storageError)
          toast({
            title: "Avatar updated",
            description: "Profile picture updated but may not persist across sessions.",
          })
        }
      }
    } catch (error) {
      console.error('Error handling file upload:', error)
      toast({
        title: "Upload failed",
        description: "Could not upload profile picture. Please try again.",
        variant: "destructive"
      })
    } finally {
      setUploading(false)
    }
  }

  // Optional Supabase upload that runs in background without blocking the UI
  const trySupabaseUpload = async (file: File) => {
    try {
      console.log('Uploading file to Supabase storage with demo user ID:', DEMO_USER_ID)
      console.log('File size:', file.size, 'File type:', file.type)

      // Create a unique filename with demo user ID
      const fileExt = file.name.split('.').pop()
      const fileName = `${DEMO_USER_ID}/avatar-${Date.now()}.${fileExt}`

      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        })

      if (error) {
        console.warn('Supabase storage upload failed:', error)
        return null
      }

      // Get the public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName)

      if (urlData?.publicUrl) {
        console.log('File uploaded successfully to:', urlData.publicUrl)
        return urlData.publicUrl
      }

      return null
    } catch (error) {
      console.warn('Supabase upload error:', error)
      return null
    }
  }


  const resetAvatar = async () => {
    try {
      // Clear localStorage sources used by global override
      localStorage.removeItem('dna_profile_avatar')
      localStorage.removeItem('profilePicture')
      try {
        const userSettingsRaw = localStorage.getItem('userSettings')
        if (userSettingsRaw) {
          const s = JSON.parse(userSettingsRaw)
          if (s && s.profile) {
            delete s.profile.avatar
            delete s.profile.avatarUrl
            delete s.profile.profile_picture
          }
          localStorage.setItem('userSettings', JSON.stringify(s))
        }
      } catch {}

      // Clear Supabase avatar for demo user
      const userId = DEMO_USER_ID
      await supabase
        .from('dna_profiles')
        .update({ avatar_url: null, updated_at: new Date().toISOString() })
        .eq('user_id', userId)

      // Also sync to profiles table (used by dashboard)
      await supabase
        .from('profiles')
        .upsert({ id: userId, avatar_url: null, updated_at: new Date().toISOString() })

      // Update local UI state
      setProfile(prev => ({ ...prev, avatar_url: '' }))

      toast({
        title: 'Global logo removed',
        description: 'Your profile logo override was cleared. Bookmark visuals will now follow per-bookmark/logo extraction priority.',
      })
    } catch (error) {
      console.warn('Error resetting avatar', error)
      toast({ title: 'Could not remove logo', description: 'Please try again.', variant: 'destructive' })
    }
  }

  const addTag = (field: 'industries' | 'skills' | 'interests', value: string) => {
    if (value.trim() && !profile[field].includes(value.trim())) {
      setProfile(prev => ({
        ...prev,
        [field]: [...prev[field], value.trim()]
      }))
    }
  }

  const removeTag = (field: 'industries' | 'skills' | 'interests', value: string) => {
    setProfile(prev => ({
      ...prev,
      [field]: prev[field].filter(item => item !== value)
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">About You</h2>
          <p className="text-gray-600 mt-2">Tell us about yourself to get personalized bookmark recommendations</p>
        </div>
        <Button onClick={saveProfile} disabled={saving} className="flex items-center gap-2">
          {saving ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          ) : (
            <Save className="h-4 w-4" />
          )}
          {saving ? 'Saving...' : 'Save Profile'}
        </Button>
      </div>

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Basic Information
          </CardTitle>
          <CardDescription>
            Your basic profile information and avatar
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar Upload */}
          <div className="flex items-start gap-6">
            <div className="flex flex-col items-center gap-4">
            <Avatar className="h-24 w-24">
                <AvatarImage src={profile.avatar_url} alt={profile.full_name} />
                <AvatarFallback className="text-lg">
                  {profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>

              {/* Upload Custom Photo */}
              <div className="w-full">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  disabled={uploading}
                  className="hidden"
                  id="avatar-upload"
                />
                <Button
                  variant="outline"
                  disabled={uploading}
                  className="w-full cursor-pointer"
                  onClick={() => document.getElementById('avatar-upload')?.click()}
                >
                  {uploading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                  ) : (
                    <Upload className="h-4 w-4 mr-2" />
                  )}
                  {uploading ? 'Uploading...' : 'Upload Custom Photo'}
                </Button>
                <Button
                  variant="outline"
                  disabled={saving || uploading || !profile.avatar_url}
                  className="w-full mt-2"
                  onClick={resetAvatar}
                >
                  <X className="h-4 w-4 mr-2" /> Remove Logo (Reset to Default)
                </Button>

              </div>
            </div>

            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label htmlFor="full_name">Full Name</Label>
              <Input
                  id="full_name"
                  value={profile.full_name}
                  onChange={(e) => setProfile(prev => ({ ...prev, full_name: e.target.value }))}
                placeholder="Enter your full name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="favorite_industry">Favorite Industry</Label>
              <Select value={profile.favorite_industry} onValueChange={(value) => {
                setProfile(prev => ({ ...prev, favorite_industry: value }))
                if (value !== 'custom') {
                  setProfile(prev => ({ ...prev, custom_industry: '' }))
                }
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your favorite industry" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="technology">Technology</SelectItem>
                  <SelectItem value="finance">Finance & Banking</SelectItem>
                  <SelectItem value="healthcare">Healthcare & Medicine</SelectItem>
                  <SelectItem value="education">Education & Training</SelectItem>
                  <SelectItem value="retail">Retail & E-commerce</SelectItem>
                  <SelectItem value="manufacturing">Manufacturing</SelectItem>
                  <SelectItem value="consulting">Consulting</SelectItem>
                  <SelectItem value="media">Media & Entertainment</SelectItem>
                  <SelectItem value="nonprofit">Non-profit & Social Impact</SelectItem>
                  <SelectItem value="government">Government & Public Sector</SelectItem>
                  <SelectItem value="real_estate">Real Estate</SelectItem>
                  <SelectItem value="automotive">Automotive</SelectItem>
                  <SelectItem value="energy">Energy & Utilities</SelectItem>
                  <SelectItem value="food_beverage">Food & Beverage</SelectItem>
                  <SelectItem value="travel_hospitality">Travel & Hospitality</SelectItem>
                  <SelectItem value="sports_fitness">Sports & Fitness</SelectItem>
                  <SelectItem value="agriculture">Agriculture</SelectItem>
                  <SelectItem value="aerospace">Aerospace & Defense</SelectItem>
                  <SelectItem value="custom">Other (Custom)</SelectItem>
                </SelectContent>
              </Select>

              {profile.favorite_industry === 'custom' && (
                <div className="mt-2">
              <Input
                    id="custom_industry"
                    value={profile.custom_industry}
                    onChange={(e) => setProfile(prev => ({ ...prev, custom_industry: e.target.value }))}
                    placeholder="Enter your custom industry"
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="organization">Organization</Label>
              <Input
                id="organization"
                  value={profile.organization}
                  onChange={(e) => setProfile(prev => ({ ...prev, organization: e.target.value }))}
                  placeholder="Company or organization name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="favorite_industry_2">Favorite Industry #2</Label>
              <Select value={profile.favorite_industry_2} onValueChange={(value) => {
                setProfile(prev => ({ ...prev, favorite_industry_2: value }))
                if (value !== 'custom') {
                  setProfile(prev => ({ ...prev, custom_industry_2: '' }))
                }
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select second favorite industry" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="technology">Technology</SelectItem>
                  <SelectItem value="finance">Finance & Banking</SelectItem>
                  <SelectItem value="healthcare">Healthcare & Medicine</SelectItem>
                  <SelectItem value="education">Education & Training</SelectItem>
                  <SelectItem value="retail">Retail & E-commerce</SelectItem>
                  <SelectItem value="manufacturing">Manufacturing</SelectItem>
                  <SelectItem value="consulting">Consulting</SelectItem>
                  <SelectItem value="media">Media & Entertainment</SelectItem>
                  <SelectItem value="nonprofit">Non-profit & Social Impact</SelectItem>
                  <SelectItem value="government">Government & Public Sector</SelectItem>
                  <SelectItem value="realestate">Real Estate</SelectItem>
                  <SelectItem value="automotive">Automotive</SelectItem>
                  <SelectItem value="energy">Energy & Utilities</SelectItem>
                  <SelectItem value="food">Food & Beverage</SelectItem>
                  <SelectItem value="travel">Travel & Hospitality</SelectItem>
                  <SelectItem value="sports">Sports & Fitness</SelectItem>
                  <SelectItem value="agriculture">Agriculture</SelectItem>
                  <SelectItem value="aerospace">Aerospace & Defense</SelectItem>
                  <SelectItem value="custom">Other (Custom)</SelectItem>
                </SelectContent>
              </Select>

              {profile.favorite_industry_2 === 'custom' && (
              <Input
                  placeholder="Enter your custom industry"
                  value={profile.custom_industry_2}
                  onChange={(e) => setProfile(prev => ({ ...prev, custom_industry_2: e.target.value }))}
                  className="mt-2"
                />
              )}
            </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={profile.bio}
              onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
              placeholder="Tell us about yourself, your interests, and what you're looking to learn..."
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      {/* Content Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Content Preferences
          </CardTitle>
          <CardDescription>
            Help us understand your content and source preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="link_source_preference">Link Source Preference</Label>
            <Select value={profile.link_source_preference} onValueChange={(value) => setProfile(prev => ({ ...prev, link_source_preference: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select your preferred sources" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mainstream_media">Mainstream Media</SelectItem>
                <SelectItem value="academic_journals">Academic Journals</SelectItem>
                <SelectItem value="industry_blogs">Industry Blogs</SelectItem>
                <SelectItem value="social_media">Social Media</SelectItem>
                <SelectItem value="newsletters">Newsletters</SelectItem>
                <SelectItem value="podcasts">Podcasts</SelectItem>
                <SelectItem value="video_content">Video Content</SelectItem>
                <SelectItem value="official_docs">Official Documentation</SelectItem>
                <SelectItem value="community_forums">Community Forums</SelectItem>
                <SelectItem value="custom">Custom (Enter Below)</SelectItem>
              </SelectContent>
            </Select>
            {profile.link_source_preference === 'custom' && (
              <Input
                value={profile.custom_link_source_preference}
                onChange={(e) => setProfile(prev => ({ ...prev, custom_link_source_preference: e.target.value }))}
                placeholder="Enter your custom link source preference..."
                className="mt-2"
              />
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="language_preference">Language Preference</Label>
            <Select value={profile.language_preference} onValueChange={(value) => setProfile(prev => ({ ...prev, language_preference: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select your language preference" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="english">English</SelectItem>
                <SelectItem value="spanish">Spanish</SelectItem>
                <SelectItem value="french">French</SelectItem>
                <SelectItem value="german">German</SelectItem>
                <SelectItem value="chinese">Chinese</SelectItem>
                <SelectItem value="japanese">Japanese</SelectItem>
                <SelectItem value="korean">Korean</SelectItem>
                <SelectItem value="portuguese">Portuguese</SelectItem>
                <SelectItem value="russian">Russian</SelectItem>
                <SelectItem value="arabic">Arabic</SelectItem>
                <SelectItem value="multilingual">Multilingual</SelectItem>
                <SelectItem value="custom">Custom (Enter Below)</SelectItem>
              </SelectContent>
            </Select>
            {profile.language_preference === 'custom' && (
              <Input
                value={profile.custom_language_preference}
                onChange={(e) => setProfile(prev => ({ ...prev, custom_language_preference: e.target.value }))}
                placeholder="Enter your custom language preference..."
                className="mt-2"
              />
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="media_format_priority">Media Format Priority</Label>
            <Select value={profile.media_format_priority} onValueChange={(value) => setProfile(prev => ({ ...prev, media_format_priority: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select preferred format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text_articles">Text Articles</SelectItem>
                <SelectItem value="video_content">Video Content</SelectItem>
                <SelectItem value="audio_podcasts">Audio/Podcasts</SelectItem>
                <SelectItem value="infographics">Infographics</SelectItem>
                <SelectItem value="interactive_content">Interactive Content</SelectItem>
                <SelectItem value="presentations">Presentations</SelectItem>
                <SelectItem value="research_papers">Research Papers</SelectItem>
                <SelectItem value="case_studies">Case Studies</SelectItem>
                <SelectItem value="custom">Custom (Enter Below)</SelectItem>
              </SelectContent>
            </Select>
            {profile.media_format_priority === 'custom' && (
              <Input
                value={profile.custom_media_format_priority}
                onChange={(e) => setProfile(prev => ({ ...prev, custom_media_format_priority: e.target.value }))}
                placeholder="Enter your custom media format preference..."
                className="mt-2"
              />
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="content_freshness">Content Freshness</Label>
            <Select value={profile.content_freshness} onValueChange={(value) => setProfile(prev => ({ ...prev, content_freshness: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select freshness preference" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="breaking_news">Breaking News (Real-time)</SelectItem>
                <SelectItem value="daily_updates">Daily Updates</SelectItem>
                <SelectItem value="weekly_summaries">Weekly Summaries</SelectItem>
                <SelectItem value="monthly_analysis">Monthly Analysis</SelectItem>
                <SelectItem value="evergreen_content">Evergreen Content</SelectItem>
                <SelectItem value="historical_perspective">Historical Perspective</SelectItem>
                <SelectItem value="mixed_timeline">Mixed Timeline</SelectItem>
                <SelectItem value="custom">Custom (Enter Below)</SelectItem>
              </SelectContent>
            </Select>
            {profile.content_freshness === 'custom' && (
              <Input
                value={profile.custom_content_freshness}
                onChange={(e) => setProfile(prev => ({ ...prev, custom_content_freshness: e.target.value }))}
                placeholder="Enter your custom content freshness preference..."
                className="mt-2"
              />
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="source_credibility">Source Credibility</Label>
            <Select value={profile.source_credibility} onValueChange={(value) => setProfile(prev => ({ ...prev, source_credibility: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select credibility preference" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="peer_reviewed">Peer-Reviewed Only</SelectItem>
                <SelectItem value="established_media">Established Media</SelectItem>
                <SelectItem value="expert_authors">Expert Authors</SelectItem>
                <SelectItem value="verified_sources">Verified Sources</SelectItem>
                <SelectItem value="diverse_perspectives">Diverse Perspectives</SelectItem>
                <SelectItem value="primary_sources">Primary Sources</SelectItem>
                <SelectItem value="fact_checked">Fact-Checked Content</SelectItem>
                <SelectItem value="open_to_all">Open to All Sources</SelectItem>
                <SelectItem value="custom">Custom (Enter Below)</SelectItem>
              </SelectContent>
            </Select>
            {profile.source_credibility === 'custom' && (
              <Input
                value={profile.custom_source_credibility}
                onChange={(e) => setProfile(prev => ({ ...prev, custom_source_credibility: e.target.value }))}
                placeholder="Enter your custom source credibility preference..."
                className="mt-2"
              />
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="primary_use_case">Primary Use Case</Label>
            <Select value={profile.primary_use_case} onValueChange={(value) => setProfile(prev => ({ ...prev, primary_use_case: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select or enter custom use case" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="research">Research</SelectItem>
                <SelectItem value="staying_informed">Staying Informed</SelectItem>
                <SelectItem value="professional_development">Professional Development</SelectItem>
                <SelectItem value="competitive_analysis">Competitive Analysis</SelectItem>
                <SelectItem value="trend_monitoring">Trend Monitoring</SelectItem>
                <SelectItem value="content_creation">Content Creation</SelectItem>
                <SelectItem value="academic_study">Academic Study</SelectItem>
                <SelectItem value="investment_decisions">Investment Decisions</SelectItem>
                <SelectItem value="custom">Custom (Enter Below)</SelectItem>
              </SelectContent>
            </Select>
            {profile.primary_use_case === 'custom' && (
              <Input
                value={profile.custom_primary_use_case}
                onChange={(e) => setProfile(prev => ({ ...prev, custom_primary_use_case: e.target.value }))}
                placeholder="Enter your custom use case..."
                className="mt-2"
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Links & Social */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Links & Social Profiles
          </CardTitle>
          <CardDescription>
            Connect your professional profiles and websites
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
              type="url"
              value={profile.website}
              onChange={(e) => setProfile(prev => ({ ...prev, website: e.target.value }))}
                placeholder="https://yourwebsite.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="linkedin">LinkedIn</Label>
              <Input
                id="linkedin"
              type="url"
              value={profile.linkedin}
              onChange={(e) => setProfile(prev => ({ ...prev, linkedin: e.target.value }))}
                placeholder="https://linkedin.com/in/yourprofile"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="twitter">Twitter/X</Label>
            <Input
              id="twitter"
              type="url"
              value={profile.twitter}
              onChange={(e) => setProfile(prev => ({ ...prev, twitter: e.target.value }))}
              placeholder="https://twitter.com/yourusername"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tiktok">TikTok</Label>
            <Input
              id="tiktok"
              type="url"
              value={profile.tiktok}
              onChange={(e) => setProfile(prev => ({ ...prev, tiktok: e.target.value }))}
              placeholder="https://tiktok.com/@yourusername"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="instagram">Instagram</Label>
            <Input
              id="instagram"
              type="url"
              value={profile.instagram}
              onChange={(e) => setProfile(prev => ({ ...prev, instagram: e.target.value }))}
              placeholder="https://instagram.com/yourusername"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="facebook">Facebook</Label>
            <Input
              id="facebook"
              type="url"
              value={profile.facebook}
              onChange={(e) => setProfile(prev => ({ ...prev, facebook: e.target.value }))}
              placeholder="https://facebook.com/yourusername"
            />
          </div>
        </CardContent>
      </Card>

      {/* Interests & Skills */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5" />
            Interests & Skills
          </CardTitle>
          <CardDescription>
            Add your areas of interest and professional skills
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Industries */}
          <div className="space-y-3">
            <Label>Sub-Industry & Skills</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {profile.industries.map((industry) => (
                <Badge key={industry} variant="secondary" className="flex items-center gap-1">
                  {industry}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => removeTag('industries', industry)}
                  />
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newIndustry}
                onChange={(e) => setNewIndustry(e.target.value)}
                placeholder="Add an industry..."
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    addTag('industries', newIndustry)
                    setNewIndustry('')
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  addTag('industries', newIndustry)
                  setNewIndustry('')
                }}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Skills */}
          <div className="space-y-3">
            <Label>Skills & Expertise</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {profile.skills.map((skill) => (
                <Badge key={skill} variant="secondary" className="flex items-center gap-1">
                  {skill}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => removeTag('skills', skill)}
                  />
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                placeholder="Add a skill..."
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    addTag('skills', newSkill)
                    setNewSkill('')
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  addTag('skills', newSkill)
                  setNewSkill('')
                }}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Personal Interests */}
          <div className="space-y-3">
            <Label>Personal Interests</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {profile.interests.map((interest) => (
                <Badge key={interest} variant="secondary" className="flex items-center gap-1">
                  {interest}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => removeTag('interests', interest)}
                  />
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newInterest}
                onChange={(e) => setNewInterest(e.target.value)}
                placeholder="Add an interest..."
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    addTag('interests', newInterest)
                    setNewInterest('')
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  addTag('interests', newInterest)
                  setNewInterest('')
                }}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Learning Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Learning Preferences
          </CardTitle>
          <CardDescription>
            Help us understand how you like to learn and consume content
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="learning_style">Learning Style</Label>
              <Select value={profile.learning_style} onValueChange={(value) => setProfile(prev => ({ ...prev, learning_style: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select learning style" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="visual">Visual (diagrams, charts, images)</SelectItem>
                  <SelectItem value="auditory">Auditory (podcasts, videos, discussions)</SelectItem>
                  <SelectItem value="reading">Reading/Writing (articles, books, notes)</SelectItem>
                  <SelectItem value="kinesthetic">Hands-on (tutorials, practice, experimentation)</SelectItem>
                  <SelectItem value="mixed">Mixed approach</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="content_depth">Content Depth Preference</Label>
              <Select value={profile.content_depth} onValueChange={(value) => setProfile(prev => ({ ...prev, content_depth: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select content depth" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="overview">Quick overviews and summaries</SelectItem>
                  <SelectItem value="balanced">Balanced mix of overview and detail</SelectItem>
                  <SelectItem value="detailed">In-depth, detailed content</SelectItem>
                  <SelectItem value="technical">Technical deep-dives</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="time_commitment">Time Commitment</Label>
              <Select value={profile.time_commitment} onValueChange={(value) => setProfile(prev => ({ ...prev, time_commitment: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select time commitment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="minimal">Minimal (5-10 min/day)</SelectItem>
                  <SelectItem value="light">Light (15-30 min/day)</SelectItem>
                  <SelectItem value="moderate">Moderate (30-60 min/day)</SelectItem>
                  <SelectItem value="heavy">Heavy (1-2 hours/day)</SelectItem>
                  <SelectItem value="intensive">Intensive (2+ hours/day)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="goal_setting_style">Goal-Setting Style</Label>
              <Select value={profile.goal_setting_style} onValueChange={(value) => setProfile(prev => ({ ...prev, goal_setting_style: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select goal-setting style" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="smart">SMART Goals (Specific, Measurable, Achievable, Relevant, Time-bound)</SelectItem>
                  <SelectItem value="okr">OKRs (Objectives and Key Results)</SelectItem>
                  <SelectItem value="milestone">Milestone-based approach</SelectItem>
                  <SelectItem value="agile">Agile/Sprint methodology</SelectItem>
                  <SelectItem value="habit">Habit-based goal setting</SelectItem>
                  <SelectItem value="vision">Vision board and visualization</SelectItem>
                  <SelectItem value="flexible">Flexible, adaptive approach</SelectItem>
                  <SelectItem value="none">No formal goal-setting method</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Privacy & Visibility */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Privacy & Preferences
          </CardTitle>
          <CardDescription>
            Control your privacy settings and notification preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="profile_visibility">Profile Visibility</Label>
              <Select value={profile.profile_visibility} onValueChange={(value) => setProfile(prev => ({ ...prev, profile_visibility: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select visibility" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="private">Private (only you)</SelectItem>
                  <SelectItem value="team">Team members only</SelectItem>
                  <SelectItem value="organization">Organization only</SelectItem>
                  <SelectItem value="public">Public profile</SelectItem>
                </SelectContent>
              </Select>
            </div>

          <div className="space-y-2">
              <Label htmlFor="notification_frequency">Notification Frequency</Label>
              <Select value={profile.notification_frequency} onValueChange={(value) => setProfile(prev => ({ ...prev, notification_frequency: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="realtime">Real-time</SelectItem>
                  <SelectItem value="hourly">Hourly digest</SelectItem>
                  <SelectItem value="daily">Daily digest</SelectItem>
                  <SelectItem value="weekly">Weekly digest</SelectItem>
                  <SelectItem value="never">Never</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Show Activity</Label>
                <p className="text-sm text-gray-600">Allow others to see your reading activity and bookmarks</p>
              </div>
              <Switch
                checked={profile.show_activity}
                onCheckedChange={(checked) => setProfile(prev => ({ ...prev, show_activity: checked }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Allow Recommendations</Label>
                <p className="text-sm text-gray-600">Receive personalized content recommendations based on your profile</p>
              </div>
              <Switch
                checked={profile.allow_recommendations}
                onCheckedChange={(checked) => setProfile(prev => ({ ...prev, allow_recommendations: checked }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={saveProfile} disabled={saving} size="lg" className="flex items-center gap-2">
          {saving ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          ) : (
            <Save className="h-4 w-4" />
          )}
          {saving ? 'Saving Profile...' : 'Save & Continue'}
        </Button>
      </div>
    </div>
  )
}