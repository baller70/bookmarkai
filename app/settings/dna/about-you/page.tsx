'use client'

import { useState, useEffect } from 'react'
import { createDemoSupabaseClient, DEMO_USER_ID } from '../../../../lib/supabase-demo'
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
  profession: string
  organization: string
  bio: string
  avatar_url: string

  // Professional Details
  experience_level: string
  industry: string
  role_type: string
  company_size: string

  // Links & Social
  website: string
  linkedin: string
  twitter: string
  github: string

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
  timezone: string
  language: string
  notification_frequency: string

  created_at?: string
  updated_at?: string
}

const defaultProfile: ProfileData = {
  full_name: '',
  profession: '',
  organization: '',
  bio: '',
  avatar_url: '',
  experience_level: '',
  industry: '',
  role_type: '',
  company_size: '',
  website: '',
  linkedin: '',
  twitter: '',
  github: '',
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
  timezone: '',
  language: 'en',
  notification_frequency: 'daily'
}

export default function AboutYouPage() {
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
  }, [])

  const loadProfile = async () => {
    try {
      // First try to load from localStorage (always available)
      try {
        const userSettings = JSON.parse(localStorage.getItem('userSettings') || '{}')
        if (userSettings.profile) {
          const localProfile = {
            ...defaultProfile,
            ...userSettings.profile,
            avatar_url: userSettings.profile.avatar || userSettings.profile.avatarUrl || userSettings.profile.profile_picture
          }
          setProfile(localProfile)
          console.log('Profile loaded from localStorage')
        }

        // Also check specific avatar keys
        const dnaAvatar = localStorage.getItem('dna_profile_avatar')
        const profilePicture = localStorage.getItem('profilePicture')
        if (dnaAvatar || profilePicture) {
          setProfile(prev => ({
            ...prev,
            avatar_url: dnaAvatar || profilePicture || prev.avatar_url
          }))
        }
      } catch (storageError) {
        console.warn('Could not load profile from localStorage:', storageError)
      }

      // Then try to load from Supabase if user is authenticated
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          console.log('No authenticated user, using localStorage profile only')
          return
        }

        const { data } = await supabase
          .from('dna_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single()

        if (data) {
          // Merge Supabase data with local data, preferring Supabase for most fields
          // but keeping local avatar if Supabase doesn't have one
          const mergedProfile = {
            ...data,
            avatar_url: data.avatar_url || profile.avatar_url
          }
          setProfile(mergedProfile)
          console.log('Profile loaded from Supabase and merged with local data')
        }
      } catch (error) {
        console.log('Supabase profile load error:', error)
      }
    } catch (error) {
      console.error('Error loading profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveProfile = async () => {
    setSaving(true)
    try {
      // Always save to localStorage first (works without authentication)
      try {
        const userSettings = JSON.parse(localStorage.getItem('userSettings') || '{}')
        userSettings.profile = {
          ...userSettings.profile,
          ...profile,
          avatar: profile.avatar_url,
          avatarUrl: profile.avatar_url,
          profile_picture: profile.avatar_url
        }
        localStorage.setItem('userSettings', JSON.stringify(userSettings))

        // Also save in the specific keys the dashboard looks for
        if (profile.avatar_url) {
          localStorage.setItem('dna_profile_avatar', profile.avatar_url)
          localStorage.setItem('profilePicture', profile.avatar_url)
        }

        console.log('Profile saved to localStorage')
      } catch (storageError) {
        console.warn('Could not save profile to localStorage:', storageError)
      }

      // Try to save to Supabase if user is authenticated
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          console.log('No authenticated user, profile saved to localStorage only')
          toast({
            title: "Profile saved successfully!",
            description: "Your DNA profile has been saved locally and will appear on bookmark cards.",
          })
          return
        }

        const profileData = {
          ...profile,
          user_id: user.id,
          updated_at: new Date().toISOString()
        }

        const { error } = await supabase
          .from('dna_profiles')
          .upsert(profileData)

        if (error) {
          console.log('Supabase save failed:', error)
          toast({
            title: "Profile saved locally!",
            description: "Your profile has been saved and will appear on bookmark cards.",
          })
          return
        }

        toast({
          title: "Profile saved successfully!",
          description: "Your DNA profile has been updated and synced to the cloud.",
        })
      } catch (error) {
        console.log('Supabase save error:', error)
        toast({
          title: "Profile saved locally!",
          description: "Your profile has been saved and will appear on bookmark cards.",
        })
      }
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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)

    try {
      // Always use FileReader for local preview and save to localStorage
      // This ensures the avatar is always saved and works without authentication
      const reader = new FileReader()
      reader.onload = (event) => {
        if (event.target?.result) {
          const avatarUrl = event.target.result as string
          setProfile(prev => ({ ...prev, avatar_url: avatarUrl }))

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
              title: "Avatar uploaded successfully!",
              description: "Your profile picture has been saved and will appear on all bookmark cards.",
            })
          } catch (storageError) {
            console.warn('Could not save to localStorage:', storageError)
            toast({
              title: "Avatar uploaded",
              description: "Profile picture updated but may not persist across sessions.",
            })
          }

          // Try to upload to Supabase if user is authenticated (optional background task)
          trySupabaseUpload(file)
        }
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error('Error processing avatar:', error)
      toast({
        title: "Error uploading avatar",
        description: "Please try again later.",
        variant: "destructive"
      })
    } finally {
      setUploading(false)
    }
  }

  // Optional Supabase upload that runs in background without blocking the UI
  const trySupabaseUpload = async (file: File) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        console.log('No authenticated user, skipping Supabase upload')
        return
      }

      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}-${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file)

      if (uploadError) {
        console.log('Supabase upload failed:', uploadError)
        return
      }

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName)

      console.log('Successfully uploaded to Supabase:', publicUrl)

      // Optionally update profile with Supabase URL as well
      setProfile(prev => ({ ...prev, supabase_avatar_url: publicUrl }))

    } catch (error) {
      console.log('Supabase upload error (non-blocking):', error)
    }
  }

  const resetAvatar = async () => {
    setSaving(true)
    try {
      // Clear localStorage sources used by global override
      try {
        localStorage.removeItem('dna_profile_avatar')
        localStorage.removeItem('profilePicture')
        const userSettings = JSON.parse(localStorage.getItem('userSettings') || '{}')
        if (userSettings.profile) {
          delete userSettings.profile.avatar
          delete userSettings.profile.avatarUrl
          delete userSettings.profile.profile_picture
          localStorage.setItem('userSettings', JSON.stringify(userSettings))
        }
        console.log('Cleared local profile avatar overrides')
      } catch (storageError) {
        console.warn('Could not clear localStorage avatar overrides:', storageError)
      }

      // Clear Supabase avatar if authenticated
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          await supabase
            .from('dna_profiles')
            .update({ avatar_url: null, updated_at: new Date().toISOString() })
            .eq('user_id', user.id)
        }
      } catch (err) {
        console.log('Supabase clear avatar error (non-blocking):', err)
      }

      // Update local state last
      setProfile(prev => ({ ...prev, avatar_url: '' }))

      toast({
        title: 'Global logo removed',
        description: 'Your profile logo override was cleared. Bookmark visuals will now follow per-bookmark/logo extraction priority.',
      })
    } catch (error) {
      console.error('Error resetting avatar:', error)
      toast({
        title: 'Could not reset logo',
        description: 'Please try again later.',
        variant: 'destructive'
      })
    } finally {
      setSaving(false)
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
                  {uploading ? 'Uploading...' : 'Upload Photo'}
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
                <Label htmlFor="profession">Profession</Label>
                <Input
                  id="profession"
                  value={profile.profession}
                  onChange={(e) => setProfile(prev => ({ ...prev, profession: e.target.value }))}
                  placeholder="e.g., Software Engineer, Product Manager"
                />
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
                <Label htmlFor="experience_level">Experience Level</Label>
                <Select value={profile.experience_level} onValueChange={(value) => setProfile(prev => ({ ...prev, experience_level: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select experience level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entry">Entry Level (0-2 years)</SelectItem>
                    <SelectItem value="mid">Mid Level (3-5 years)</SelectItem>
                    <SelectItem value="senior">Senior Level (6-10 years)</SelectItem>
                    <SelectItem value="lead">Lead/Principal (10+ years)</SelectItem>
                    <SelectItem value="executive">Executive</SelectItem>
                  </SelectContent>
                </Select>
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

      {/* Professional Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Professional Details
          </CardTitle>
          <CardDescription>
            Help us understand your professional background
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="industry">Industry</Label>
            <Select value={profile.industry} onValueChange={(value) => setProfile(prev => ({ ...prev, industry: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select your industry" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="technology">Technology</SelectItem>
                <SelectItem value="finance">Finance</SelectItem>
                <SelectItem value="healthcare">Healthcare</SelectItem>
                <SelectItem value="education">Education</SelectItem>
                <SelectItem value="retail">Retail</SelectItem>
                <SelectItem value="manufacturing">Manufacturing</SelectItem>
                <SelectItem value="consulting">Consulting</SelectItem>
                <SelectItem value="media">Media & Entertainment</SelectItem>
                <SelectItem value="nonprofit">Non-profit</SelectItem>
                <SelectItem value="government">Government</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role_type">Role Type</Label>
            <Select value={profile.role_type} onValueChange={(value) => setProfile(prev => ({ ...prev, role_type: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select your role type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="individual_contributor">Individual Contributor</SelectItem>
                <SelectItem value="team_lead">Team Lead</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="director">Director</SelectItem>
                <SelectItem value="vp">VP/SVP</SelectItem>
                <SelectItem value="c_level">C-Level Executive</SelectItem>
                <SelectItem value="founder">Founder/Entrepreneur</SelectItem>
                <SelectItem value="consultant">Consultant</SelectItem>
                <SelectItem value="freelancer">Freelancer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="company_size">Company Size</Label>
            <Select value={profile.company_size} onValueChange={(value) => setProfile(prev => ({ ...prev, company_size: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select company size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="startup">Startup (1-10 employees)</SelectItem>
                <SelectItem value="small">Small (11-50 employees)</SelectItem>
                <SelectItem value="medium">Medium (51-200 employees)</SelectItem>
                <SelectItem value="large">Large (201-1000 employees)</SelectItem>
                <SelectItem value="enterprise">Enterprise (1000+ employees)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="career_stage">Career Stage</Label>
            <Select value={profile.career_stage} onValueChange={(value) => setProfile(prev => ({ ...prev, career_stage: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select career stage" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="exploring">Exploring Options</SelectItem>
                <SelectItem value="building">Building Skills</SelectItem>
                <SelectItem value="advancing">Advancing Career</SelectItem>
                <SelectItem value="leading">Leading Teams</SelectItem>
                <SelectItem value="transitioning">Career Transition</SelectItem>
                <SelectItem value="entrepreneurship">Entrepreneurship</SelectItem>
              </SelectContent>
            </Select>
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
            <Label htmlFor="github">GitHub</Label>
            <Input
              id="github"
              type="url"
              value={profile.github}
              onChange={(e) => setProfile(prev => ({ ...prev, github: e.target.value }))}
              placeholder="https://github.com/yourusername"
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
            <Label>Industries of Interest</Label>
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
              <Label htmlFor="timezone">Timezone</Label>
              <Select value={profile.timezone} onValueChange={(value) => setProfile(prev => ({ ...prev, timezone: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UTC-12">UTC-12 (Baker Island)</SelectItem>
                  <SelectItem value="UTC-11">UTC-11 (American Samoa)</SelectItem>
                  <SelectItem value="UTC-10">UTC-10 (Hawaii)</SelectItem>
                  <SelectItem value="UTC-9">UTC-9 (Alaska)</SelectItem>
                  <SelectItem value="UTC-8">UTC-8 (Pacific Time)</SelectItem>
                  <SelectItem value="UTC-7">UTC-7 (Mountain Time)</SelectItem>
                  <SelectItem value="UTC-6">UTC-6 (Central Time)</SelectItem>
                  <SelectItem value="UTC-5">UTC-5 (Eastern Time)</SelectItem>
                  <SelectItem value="UTC-4">UTC-4 (Atlantic Time)</SelectItem>
                  <SelectItem value="UTC-3">UTC-3 (Argentina)</SelectItem>
                  <SelectItem value="UTC-2">UTC-2 (South Georgia)</SelectItem>
                  <SelectItem value="UTC-1">UTC-1 (Azores)</SelectItem>
                  <SelectItem value="UTC+0">UTC+0 (London, Dublin)</SelectItem>
                  <SelectItem value="UTC+1">UTC+1 (Central Europe)</SelectItem>
                  <SelectItem value="UTC+2">UTC+2 (Eastern Europe)</SelectItem>
                  <SelectItem value="UTC+3">UTC+3 (Moscow, Turkey)</SelectItem>
                  <SelectItem value="UTC+4">UTC+4 (Dubai, Baku)</SelectItem>
                  <SelectItem value="UTC+5">UTC+5 (Pakistan, Uzbekistan)</SelectItem>
                  <SelectItem value="UTC+6">UTC+6 (Bangladesh, Kazakhstan)</SelectItem>
                  <SelectItem value="UTC+7">UTC+7 (Thailand, Vietnam)</SelectItem>
                  <SelectItem value="UTC+8">UTC+8 (China, Singapore)</SelectItem>
                  <SelectItem value="UTC+9">UTC+9 (Japan, South Korea)</SelectItem>
                  <SelectItem value="UTC+10">UTC+10 (Australia East)</SelectItem>
                  <SelectItem value="UTC+11">UTC+11 (Solomon Islands)</SelectItem>
                  <SelectItem value="UTC+12">UTC+12 (New Zealand)</SelectItem>
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

