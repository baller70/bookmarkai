'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Slider } from '@/components/ui/slider'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { 
  User, 
  Edit, 
  Save, 
  X, 
  Plus, 
  Lock, 
  Sparkles, 
  Crown, 
  Shield, 
  Target,
  Star,
  Upload,
  HelpCircle,
  Briefcase,
  Code,
  Palette,
  Dumbbell,
  Utensils,
  Camera,
  Plane,
  Music2,
  Gamepad2,
  Microscope,
  Calculator,
  Stethoscope,
  Trees,
  Building,
  GraduationCap,
  Film,
  Atom
} from 'lucide-react'
import { toast } from 'sonner'
import SyncService from '@/lib/sync-service'

interface ProfileData {
  name: string
  business: string
  bio: string
  avatar: string
  tier: 'Free' | 'Pro' | 'Elite'
}

interface Topic {
  id: string
  name: string
  icon: React.ReactNode
  category: string
  strength: number
  subTopics?: string[]
  bookmarkCount?: number
  isCustom?: boolean
}

interface DNAProfileOverviewProps {
  profileData: ProfileData
  onProfileUpdate?: (updatedProfile: ProfileData) => void
}

const commonTopics: Topic[] = [
  { id: '1', name: 'Web Development', icon: <Code className="h-4 w-4" />, category: 'Technology', strength: 3, bookmarkCount: 234 },
  { id: '2', name: 'AI/ML', icon: <Atom className="h-4 w-4" />, category: 'Technology', strength: 4, bookmarkCount: 156 },
  { id: '3', name: 'Design', icon: <Palette className="h-4 w-4" />, category: 'Creative', strength: 3, bookmarkCount: 89 },
  { id: '4', name: 'Basketball', icon: <Dumbbell className="h-4 w-4" />, category: 'Sports', strength: 5, bookmarkCount: 45 },
  { id: '5', name: 'Cooking', icon: <Utensils className="h-4 w-4" />, category: 'Lifestyle', strength: 2, bookmarkCount: 67 },
  { id: '6', name: 'Photography', icon: <Camera className="h-4 w-4" />, category: 'Creative', strength: 4, bookmarkCount: 123 },
  { id: '7', name: 'Travel', icon: <Plane className="h-4 w-4" />, category: 'Lifestyle', strength: 5, bookmarkCount: 178 },
  { id: '8', name: 'Music', icon: <Music2 className="h-4 w-4" />, category: 'Entertainment', strength: 3, bookmarkCount: 92 },
  { id: '9', name: 'Fitness', icon: <Dumbbell className="h-4 w-4" />, category: 'Health', strength: 4, bookmarkCount: 134 },
  { id: '10', name: 'Business', icon: <Briefcase className="h-4 w-4" />, category: 'Professional', strength: 5, bookmarkCount: 267 },
  { id: '11', name: 'Gaming', icon: <Gamepad2 className="h-4 w-4" />, category: 'Entertainment', strength: 3, bookmarkCount: 156 },
  { id: '12', name: 'Science', icon: <Microscope className="h-4 w-4" />, category: 'Education', strength: 4, bookmarkCount: 89 }
]

export function DNAProfileOverview({ profileData, onProfileUpdate }: DNAProfileOverviewProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedProfile, setEditedProfile] = useState({
    name: profileData.name || '',
    business: profileData.business || '',
    bio: profileData.bio || '',
    avatar: profileData.avatar || '',
    tier: profileData.tier || 'Free'
  })
  const [selectedTopics, setSelectedTopics] = useState<Topic[]>([
    commonTopics[0], commonTopics[1], commonTopics[2] // Default selected topics
  ])
  const [customTopic, setCustomTopic] = useState('')
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [onboardingStep, setOnboardingStep] = useState(1)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [expandedTopics, setExpandedTopics] = useState<{[key: string]: string[]}>({})
  const [uploading, setUploading] = useState(false)

  const maxTopics = profileData.tier === 'Free' ? 1 : profileData.tier === 'Pro' ? 3 : 5
  const availableSlots = maxTopics - selectedTopics.length

  const handleSaveProfile = async () => {
    // Save to localStorage for persistence
    try {
      const userSettings = JSON.parse(localStorage.getItem('userSettings') || '{}')
      userSettings.profile = {
        ...userSettings.profile,
        name: editedProfile.name,
        business: editedProfile.business,
        bio: editedProfile.bio,
        avatar: editedProfile.avatar
      }
      localStorage.setItem('userSettings', JSON.stringify(userSettings))
      
      // Also save avatar separately for backward compatibility
      if (editedProfile.avatar) {
        localStorage.setItem('profilePicture', editedProfile.avatar)
      }
      
      // Sync to Supabase and other services
      const syncResult = await SyncService.syncProfileData(editedProfile)
      
      setIsEditing(false)
      
      if (syncResult.success) {
        toast.success('Profile updated and synced successfully!')
      } else {
        toast.warning('Profile updated locally, but sync failed')
      }
      
      // Notify parent component of the update
      if (onProfileUpdate) {
        onProfileUpdate(editedProfile)
      }
    } catch (error) {
      console.error('Error saving profile:', error)
      toast.error('Failed to save profile changes')
    }
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB')
      return
    }

    setUploading(true)
    const uploadToast = toast.loading('Uploading profile picture...')

    try {
      // Create FormData for the upload
      const formData = new FormData()
      formData.append('file', file)
      formData.append('public_id', `profile_${Date.now()}`)
      formData.append('resource_type', 'image')

      // Upload to Cloudinary via our MCP service
      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error('Upload failed')
      }

      const result = await response.json()
      
      if (result.success && result.url) {
        // Update the avatar URL
        setEditedProfile({
          ...editedProfile,
          avatar: result.url
        })
        
        toast.dismiss(uploadToast)
        toast.success('Profile picture updated successfully!')
      } else {
        throw new Error(result.error || 'Upload failed')
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast.dismiss(uploadToast)
      toast.error('Failed to upload image. Please try again.')
    } finally {
      setUploading(false)
      // Clear the input
      event.target.value = ''
    }
  }

  const handleTopicSelect = (topic: Topic) => {
    if (selectedTopics.length >= maxTopics) {
      setShowUpgradeModal(true)
      return
    }
    
    if (!selectedTopics.find(t => t.id === topic.id)) {
      setSelectedTopics([...selectedTopics, topic])
    }
  }

  const handleTopicRemove = (topicId: string) => {
    setSelectedTopics(selectedTopics.filter(t => t.id !== topicId))
  }

  const handleCustomTopicAdd = () => {
    if (!customTopic.trim()) return
    
    if (selectedTopics.length >= maxTopics) {
      setShowUpgradeModal(true)
      return
    }

    const newTopic: Topic = {
      id: Date.now().toString(),
      name: customTopic,
      icon: <Target className="h-4 w-4" />,
      category: 'Custom',
      strength: 3,
      isCustom: true,
      bookmarkCount: 0
    }
    
    setSelectedTopics([...selectedTopics, newTopic])
    setCustomTopic('')
    toast.success('Custom topic added!')
  }

  const handleStrengthChange = (topicId: string, strength: number[]) => {
    setSelectedTopics(selectedTopics.map(topic => 
      topic.id === topicId ? { ...topic, strength: strength[0] } : topic
    ))
  }

  const handleAIExpansion = async (topic: Topic) => {
    toast.loading('AI is expanding your topic...')
    
    setTimeout(() => {
      const mockSubTopics = {
        'Basketball': ['NBA News', 'Training Drills', 'Analytics Sites', 'Player Stats', 'Team Updates'],
        'Web Development': ['React Tutorials', 'JavaScript Frameworks', 'CSS Techniques', 'Backend APIs', 'DevOps Tools'],
        'AI/ML': ['Machine Learning Models', 'Deep Learning', 'Natural Language Processing', 'Computer Vision', 'AI Ethics'],
        'Design': ['UI/UX Principles', 'Color Theory', 'Typography', 'Design Systems', 'Prototyping Tools'],
        'Cooking': ['Recipe Collections', 'Cooking Techniques', 'Kitchen Equipment', 'Nutrition Info', 'Food Photography']
      }
      
      const subTopics = mockSubTopics[topic.name as keyof typeof mockSubTopics] || [
        `${topic.name} Basics`,
        `Advanced ${topic.name}`,
        `${topic.name} Tools`,
        `${topic.name} Community`,
        `${topic.name} News`
      ]
      
      setExpandedTopics({
        ...expandedTopics,
        [topic.id]: subTopics
      })
      
      toast.success(`AI expanded ${topic.name} into ${subTopics.length} sub-topics!`)
    }, 2000)
  }

  return (
    <div className="space-y-6">
      {/* Personal Info Panel */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center">
            <User className="h-5 w-5 mr-2 text-blue-500" />
            Personal Information
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(!isEditing)}
          >
            {isEditing ? (
              <>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </>
            ) : (
              <>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </>
            )}
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex justify-center lg:justify-start">
                <div className="relative">
                  <Avatar className="h-32 w-32 ring-4 ring-white shadow-lg">
                    <AvatarImage src={editedProfile.avatar} />
                    <AvatarFallback className="text-2xl bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                      {editedProfile.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  {isEditing && (
                    <div className="absolute -bottom-2 -right-2">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        id="avatar-upload"
                        disabled={uploading}
                      />
                      <label 
                        htmlFor="avatar-upload"
                        className={`inline-flex items-center justify-center rounded-full h-8 w-8 bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer transition-colors ${
                          uploading ? 'pointer-events-none opacity-50' : ''
                        }`}
                        title="Upload profile picture"
                      >
                        {uploading ? (
                          <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                        ) : (
                          <Upload className="h-4 w-4" />
                        )}
                      </label>
                    </div>
                  )}
                </div>
              </div>
              {isEditing && (
                <p className="text-sm text-gray-600 text-center lg:text-left">
                  Click the upload button to change your profile picture
                  <br />
                  <span className="text-xs text-gray-500">Supports JPG, PNG, GIF up to 5MB</span>
                </p>
              )}
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Name</label>
                {isEditing ? (
                  <Input
                    value={editedProfile.name || ''}
                    onChange={(e) => setEditedProfile({...editedProfile, name: e.target.value})}
                    placeholder="Your full name"
                  />
                ) : (
                  <p className="text-gray-900 font-medium">{editedProfile.name}</p>
                )}
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Business/Organization</label>
                {isEditing ? (
                  <Input
                    value={editedProfile.business || ''}
                    onChange={(e) => setEditedProfile({...editedProfile, business: e.target.value})}
                    placeholder="Your business or organization"
                  />
                ) : (
                  <p className="text-gray-900">{editedProfile.business}</p>
                )}
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Short Bio</label>
                {isEditing ? (
                  <Textarea
                    value={editedProfile.bio || ''}
                    onChange={(e) => setEditedProfile({...editedProfile, bio: e.target.value})}
                    placeholder="Tell us about yourself..."
                    rows={3}
                  />
                ) : (
                  <p className="text-gray-900">{editedProfile.bio}</p>
                )}
              </div>
              
              {isEditing && (
                <div className="flex space-x-2">
                  <Button onClick={handleSaveProfile} size="sm">
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                  <Button variant="outline" onClick={() => setIsEditing(false)} size="sm">
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Topic Slots & Tier Gating */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              <Target className="h-5 w-5 mr-2 text-green-500" />
              Interests & Topics
              <Badge className="ml-2" variant="secondary">
                {selectedTopics.length} / {maxTopics}
              </Badge>
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              Choose topics that interest you for personalized AI recommendations
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowOnboarding(true)}
            >
              <HelpCircle className="h-4 w-4 mr-2" />
              Help
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowUpgradeModal(true)}
            >
              {profileData.tier === 'Free' ? (
                <>
                  <Crown className="h-4 w-4 mr-2" />
                  Upgrade
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4 mr-2" />
                  {profileData.tier}
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Selected Topics */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Your Selected Topics</h4>
            <div className="grid gap-4">
              {selectedTopics.map((topic) => (
                <Card key={topic.id} className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      {topic.icon}
                      <div>
                        <h5 className="font-medium">{topic.name}</h5>
                        <p className="text-sm text-gray-600">{topic.category}</p>
                        {topic.bookmarkCount && (
                          <Badge variant="secondary" className="text-xs mt-1">
                            {topic.bookmarkCount} bookmarks
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAIExpansion(topic)}
                      >
                        <Sparkles className="h-4 w-4 mr-1" />
                        AI Expand
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleTopicRemove(topic.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {/* Preference Strength Slider */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Preference Strength</label>
                      <span className="text-sm text-gray-600">
                        {topic.strength === 1 ? 'Very Low' : 
                         topic.strength === 2 ? 'Low' : 
                         topic.strength === 3 ? 'Medium' : 
                         topic.strength === 4 ? 'High' : 'Very High'}
                      </span>
                    </div>
                    <Slider
                      value={[topic.strength]}
                      onValueChange={(value) => handleStrengthChange(topic.id, value)}
                      max={5}
                      min={1}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Low</span>
                      <span>High</span>
                    </div>
                  </div>
                  
                  {/* AI Expanded Sub-topics */}
                  {expandedTopics[topic.id] && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <h6 className="text-sm font-medium mb-2 flex items-center">
                        <Sparkles className="h-4 w-4 mr-1 text-purple-500" />
                        AI Suggested Sub-topics
                      </h6>
                      <div className="flex flex-wrap gap-2">
                        {expandedTopics[topic.id].map((subTopic, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {subTopic}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              ))}
              
              {/* Empty Slots */}
              {Array.from({ length: availableSlots }).map((_, index) => (
                <Card key={`empty-${index}`} className="p-4 border-dashed border-2 border-gray-300">
                  <div className="flex items-center justify-center h-16 text-gray-400">
                    {availableSlots > 0 ? (
                      <div className="text-center">
                        <Plus className="h-6 w-6 mx-auto mb-1" />
                        <p className="text-sm">Add Topic</p>
                      </div>
                    ) : (
                      <div className="text-center">
                        <Lock className="h-6 w-6 mx-auto mb-1" />
                        <p className="text-sm">Upgrade to unlock</p>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
          
          {/* Add Topics Section */}
          {availableSlots > 0 && (
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Add New Topics</h4>
              
              {/* Custom Topic Entry */}
              <div className="flex space-x-2">
                <Input
                  placeholder="Enter custom topic..."
                  value={customTopic || ''}
                  onChange={(e) => setCustomTopic(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleCustomTopicAdd()}
                />
                <Button onClick={handleCustomTopicAdd} disabled={!customTopic.trim()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add
                </Button>
              </div>
              
              {/* Common Topics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {commonTopics
                  .filter(topic => !selectedTopics.find(t => t.id === topic.id))
                  .slice(0, 12)
                  .map((topic) => (
                  <Button
                    key={topic.id}
                    variant="outline"
                    className="h-auto p-3 flex flex-col items-center space-y-2"
                    onClick={() => handleTopicSelect(topic)}
                  >
                    {topic.icon}
                    <span className="text-sm">{topic.name}</span>
                    <Badge variant="secondary" className="text-xs">
                      {topic.bookmarkCount} bookmarks
                    </Badge>
                  </Button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upgrade Modal */}
      <Dialog open={showUpgradeModal} onOpenChange={setShowUpgradeModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Crown className="h-5 w-5 mr-2 text-yellow-500" />
              Upgrade Your DNA Profile
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Free Tier */}
              <Card className={`p-4 ${profileData.tier === 'Free' ? 'ring-2 ring-blue-500' : ''}`}>
                <div className="text-center space-y-3">
                  <h3 className="font-semibold">Free</h3>
                  <div className="text-2xl font-bold">$0</div>
                  <ul className="text-sm space-y-1 text-gray-600">
                    <li>1 topic slot</li>
                    <li>Basic AI suggestions</li>
                    <li>Standard support</li>
                  </ul>
                  {profileData.tier === 'Free' && (
                    <Badge>Current Plan</Badge>
                  )}
                </div>
              </Card>
              
              {/* Pro Tier */}
              <Card className={`p-4 ${profileData.tier === 'Pro' ? 'ring-2 ring-purple-500' : ''}`}>
                <div className="text-center space-y-3">
                  <h3 className="font-semibold flex items-center justify-center">
                    <Crown className="h-4 w-4 mr-1 text-purple-500" />
                    Pro
                  </h3>
                  <div className="text-2xl font-bold">$9.99</div>
                  <ul className="text-sm space-y-1 text-gray-600">
                    <li>3 topic slots</li>
                    <li>Advanced AI expansion</li>
                    <li>Priority support</li>
                    <li>Custom topics</li>
                  </ul>
                  {profileData.tier === 'Pro' ? (
                    <Badge>Current Plan</Badge>
                  ) : (
                    <Button size="sm" className="w-full">Upgrade</Button>
                  )}
                </div>
              </Card>
              
              {/* Elite Tier */}
              <Card className={`p-4 ${profileData.tier === 'Elite' ? 'ring-2 ring-pink-500' : ''}`}>
                <div className="text-center space-y-3">
                  <h3 className="font-semibold flex items-center justify-center">
                    <Shield className="h-4 w-4 mr-1 text-pink-500" />
                    Elite
                  </h3>
                  <div className="text-2xl font-bold">$19.99</div>
                  <ul className="text-sm space-y-1 text-gray-600">
                    <li>5 topic slots</li>
                    <li>Premium AI features</li>
                    <li>VIP support</li>
                    <li>Unlimited custom topics</li>
                    <li>Advanced analytics</li>
                  </ul>
                  {profileData.tier === 'Elite' ? (
                    <Badge>Current Plan</Badge>
                  ) : (
                    <Button size="sm" className="w-full">Upgrade</Button>
                  )}
                </div>
              </Card>
            </div>
            
            <div className="text-center">
              <p className="text-sm text-gray-600">
                Upgrade to unlock more topic slots and advanced AI features for better personalization.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}