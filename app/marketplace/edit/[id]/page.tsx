'use client'

import React, { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft,
  Save,
  Eye,
  Plus,
  X,
  AlertCircle,
  Check
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'

// Mock data for editing
const mockEditData = {
  '1': {
    id: '1',
    title: 'Ultimate Web Development Resources',
    description: 'Comprehensive collection of tools, tutorials, and frameworks for modern web development',
    overview: 'This is a sample overview for the Ultimate Web Development Resources collection. It provides a summary of what the collection offers and why it is valuable.',
    keyFeatures: [
      '127 hand-picked bookmarks',
      'Beginner to advanced resources',
      'Regular updates',
      'Community support'
    ],
    faqs: [
      { question: 'How often is this collection updated?', answer: 'Monthly.' },
      { question: 'Is this suitable for beginners?', answer: 'Yes, all levels.' }
    ],
    category: 'Development',
    price: 29.99,
    tags: ['React', 'JavaScript', 'CSS', 'Tools', 'Tutorials', 'Frameworks'],
    bookmarks: [
      'React Official Documentation',
      'CSS Grid Complete Guide', 
      'JavaScript ES6 Features',
      'Webpack Configuration Guide',
      'VS Code Extensions for Developers',
      'Node.js Best Practices',
      'Express.js Tutorial',
      'MongoDB Documentation'
    ],
    isPublic: true,
    avatarImage: ''
  }
}

const categories = ['Development', 'Design', 'Marketing', 'AI/ML', 'Business', 'Education']

interface EditPageProps {
  params: Promise<{ id: string }>
}

export default function EditPlaybookPage({ params }: EditPageProps) {
  const router = useRouter()
  const resolvedParams = use(params)
  const [isLoading, setIsLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    overview: '',
    keyFeatures: [''],
    faqs: [{ question: '', answer: '' }],
    category: '',
    price: 0,
    tags: [] as string[],
    bookmarks: [] as string[],
    isPublic: false,
    avatarImage: ''
  })
  
  const [newTag, setNewTag] = useState('')
  const [newBookmark, setNewBookmark] = useState('')
  const [newFeature, setNewFeature] = useState('')
  const [newFaq, setNewFaq] = useState({ question: '', answer: '' })
  
  useEffect(() => {
    // Load existing data
    const existingData = mockEditData[resolvedParams.id as keyof typeof mockEditData]
    if (existingData) {
      setFormData({
        title: existingData.title,
        description: existingData.description,
        overview: existingData.overview,
        keyFeatures: existingData.keyFeatures,
        faqs: existingData.faqs,
        category: existingData.category,
        price: existingData.price,
        tags: existingData.tags,
        bookmarks: existingData.bookmarks,
        isPublic: existingData.isPublic,
        avatarImage: existingData.avatarImage || ''
      })
    }
  }, [resolvedParams.id])
  
  // Helper functions for limits
  const limitDescription = (text: string, maxWords: number = 25) => {
    const words = text.split(' ').filter(word => word.trim() !== '')
    if (words.length <= maxWords) return text
    return words.slice(0, maxWords).join(' ')
  }
  
  const getWordCount = (text: string) => {
    return text.split(' ').filter(word => word.trim() !== '').length
  }
  
  const handleInputChange = (field: string, value: string | number | boolean) => {
    if (field === 'description' && typeof value === 'string') {
      const limitedValue = limitDescription(value, 25)
      setFormData(prev => ({ ...prev, [field]: limitedValue }))
    } else {
      setFormData(prev => ({ ...prev, [field]: value }))
    }
  }
  
  const addTag = () => {
    if (newTag.trim() && formData.tags.length < 3 && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }))
      setNewTag('')
    }
  }
  
  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }
  
  const addBookmark = () => {
    if (newBookmark.trim() && formData.bookmarks.length < 5 && !formData.bookmarks.includes(newBookmark.trim())) {
      setFormData(prev => ({
        ...prev,
        bookmarks: [...prev.bookmarks, newBookmark.trim()]
      }))
      setNewBookmark('')
    }
  }
  
  const removeBookmark = (bookmarkToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      bookmarks: prev.bookmarks.filter(bookmark => bookmark !== bookmarkToRemove)
    }))
  }
  
  const addFeature = () => {
    if (newFeature.trim() && formData.keyFeatures.length < 4) {
      setFormData(prev => ({ ...prev, keyFeatures: [...prev.keyFeatures, newFeature.trim()] }))
      setNewFeature('')
    }
  }
  
  const removeFeature = (idx: number) => {
    setFormData(prev => ({ ...prev, keyFeatures: prev.keyFeatures.filter((_, i) => i !== idx) }))
  }
  
  const addFaq = () => {
    if (
      newFaq.question.trim() &&
      newFaq.answer.trim() &&
      formData.faqs.length < 5
    ) {
      setFormData(prev => ({ ...prev, faqs: [...prev.faqs, { ...newFaq }] }))
      setNewFaq({ question: '', answer: '' })
    }
  }
  
  const removeFaq = (idx: number) => {
    setFormData(prev => ({ ...prev, faqs: prev.faqs.filter((_, i) => i !== idx) }))
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      toast.success('Playbook updated successfully!')
      router.push('/marketplace')
    } catch (error) {
      toast.error('Failed to update playbook. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }
  
  const handlePreview = () => {
    router.push(`/marketplace/${resolvedParams.id}`)
  }
  
  const wordCount = getWordCount(formData.description)
  const isDescriptionValid = wordCount <= 25
  
  // Helper for overview word limit
  const OVERVIEW_WORD_LIMIT = 100
  const getOverviewWordCount = (text: string) => text.split(' ').filter(word => word.trim() !== '').length
  const isOverviewValid = getOverviewWordCount(formData.overview) <= OVERVIEW_WORD_LIMIT
  
  // Image upload handler
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, avatarImage: reader.result as string }))
      }
      reader.readAsDataURL(file)
    }
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/marketplace" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm font-medium">
                <ArrowLeft className="h-5 w-5" />
                Back to Marketplace
              </Link>
              <span className="h-6 border-l border-gray-200" />
              <span className="text-xl font-bold">Edit Playbook</span>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={handlePreview}>
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
              <Button 
                onClick={handleSubmit}
                disabled={isLoading || !isDescriptionValid || !isOverviewValid}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Saving...
                  </div>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Enter playbook title"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="description">
                  Description 
                  <span className={`ml-2 text-sm ${isDescriptionValid ? 'text-gray-500' : 'text-red-500'}`}>
                    ({wordCount}/25 words)
                  </span>
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Describe your playbook (max 25 words)"
                  rows={3}
                  className={!isDescriptionValid ? 'border-red-300 focus:border-red-500' : ''}
                />
                {!isDescriptionValid && (
                  <div className="flex items-center gap-2 mt-1 text-red-600 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    Description must be 25 words or less
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select onValueChange={(value) => handleInputChange('category', value)} value={formData.category}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category} value={category}>{category}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="price">Price ($)</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                  />
                </div>
              </div>
              
              {/* Avatar Upload */}
              <div>
                <Label>Card Image</Label>
                <div className="flex items-center gap-4 mt-2">
                  <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-2xl overflow-hidden">
                    {formData.avatarImage ? (
                      <img src={formData.avatarImage} alt="Avatar Preview" className="object-cover w-full h-full" />
                    ) : (
                      formData.title.slice(0, 2).toUpperCase() || 'PI'
                    )}
                  </div>
                  <Input type="file" accept="image/*" onChange={handleImageChange} />
                </div>
                <p className="text-xs text-gray-500 mt-1">Upload a square image for best results. Max 2MB.</p>
              </div>
            </CardContent>
          </Card>
          
          {/* Tags */}
          <Card>
            <CardHeader>
              <CardTitle>
                Tags 
                <span className="ml-2 text-sm text-gray-500">({formData.tags.length}/3 max)</span>
              </CardTitle>
              <p className="text-sm text-gray-600">Add up to 3 tags to help users find your playbook</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {formData.tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-1 hover:text-red-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              
              {formData.tags.length < 3 && (
                <div className="flex gap-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Enter tag"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  />
                  <Button type="button" onClick={addTag} disabled={!newTag.trim()}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Bookmarks */}
          <Card>
            <CardHeader>
              <CardTitle>
                Preview Bookmarks 
                <span className="ml-2 text-sm text-gray-500">({formData.bookmarks.length}/5 max)</span>
              </CardTitle>
              <p className="text-sm text-gray-600">Add up to 5 bookmarks to show as preview on your card</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                {formData.bookmarks.map((bookmark, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-600">
                      {index + 1}
                    </div>
                    <span className="flex-1">{bookmark}</span>
                    <button
                      type="button"
                      onClick={() => removeBookmark(bookmark)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
              
              {formData.bookmarks.length < 5 && (
                <div className="flex gap-2">
                  <Input
                    value={newBookmark}
                    onChange={(e) => setNewBookmark(e.target.value)}
                    placeholder="Enter bookmark title"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addBookmark())}
                  />
                  <Button type="button" onClick={addBookmark} disabled={!newBookmark.trim()}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Overview */}
          <Card>
            <CardHeader>
              <CardTitle>
                Overview (About This Collection)
                <span className={`ml-2 text-sm ${isOverviewValid ? 'text-gray-500' : 'text-red-500'}`}>({getOverviewWordCount(formData.overview)}/{OVERVIEW_WORD_LIMIT} words)</span>
              </CardTitle>
              <p className="text-sm text-gray-600">Describe your collection. Max {OVERVIEW_WORD_LIMIT} words.</p>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.overview}
                onChange={e => setFormData(prev => ({ ...prev, overview: e.target.value }))}
                placeholder="Write a compelling overview..."
                rows={4}
                className={!isOverviewValid ? 'border-red-300 focus:border-red-500' : ''}
              />
              {!isOverviewValid && (
                <div className="flex items-center gap-2 mt-1 text-red-600 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  Overview must be {OVERVIEW_WORD_LIMIT} words or less
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Key Features */}
          <Card>
            <CardHeader>
              <CardTitle>Key Features <span className="ml-2 text-sm text-gray-500">({formData.keyFeatures.length}/4 max)</span></CardTitle>
              <p className="text-sm text-gray-600">Highlight up to 4 key features</p>
            </CardHeader>
            <CardContent className="space-y-2">
              {formData.keyFeatures.map((feature, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Input
                    value={feature}
                    onChange={e => setFormData(prev => ({ ...prev, keyFeatures: prev.keyFeatures.map((f, i) => i === idx ? e.target.value : f) }))}
                    placeholder={`Feature ${idx + 1}`}
                  />
                  <Button type="button" variant="ghost" onClick={() => removeFeature(idx)} disabled={formData.keyFeatures.length === 1}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {formData.keyFeatures.length < 4 && (
                <div className="flex gap-2">
                  <Input
                    value={newFeature}
                    onChange={e => setNewFeature(e.target.value)}
                    placeholder="Add feature"
                    onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addFeature())}
                  />
                  <Button type="button" onClick={addFeature} disabled={!newFeature.trim()}>Add</Button>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* FAQs */}
          <Card>
            <CardHeader>
              <CardTitle>Frequently Asked Questions <span className="ml-2 text-sm text-gray-500">({formData.faqs.length}/5 max)</span></CardTitle>
              <p className="text-sm text-gray-600">Add up to 5 FAQs</p>
            </CardHeader>
            <CardContent className="space-y-2">
              {formData.faqs.map((faq, idx) => (
                <div key={idx} className="flex flex-col gap-1 mb-2 border-b pb-2">
                  <Input
                    value={faq.question}
                    onChange={e => setFormData(prev => ({ ...prev, faqs: prev.faqs.map((f, i) => i === idx ? { ...f, question: e.target.value } : f) }))}
                    placeholder={`Question ${idx + 1}`}
                    className="mb-1"
                  />
                  <Textarea
                    value={faq.answer}
                    onChange={e => setFormData(prev => ({ ...prev, faqs: prev.faqs.map((f, i) => i === idx ? { ...f, answer: e.target.value } : f) }))}
                    placeholder="Answer"
                    rows={2}
                  />
                  <Button type="button" variant="ghost" onClick={() => removeFaq(idx)} disabled={formData.faqs.length === 1}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {formData.faqs.length < 5 && (
                <div className="flex flex-col gap-1">
                  <Input
                    value={newFaq.question}
                    onChange={e => setNewFaq(faq => ({ ...faq, question: e.target.value }))}
                    placeholder="Add question"
                    className="mb-1"
                  />
                  <Textarea
                    value={newFaq.answer}
                    onChange={e => setNewFaq(faq => ({ ...faq, answer: e.target.value }))}
                    placeholder="Add answer"
                    rows={2}
                  />
                  <Button type="button" onClick={addFaq} disabled={!newFaq.question.trim() || !newFaq.answer.trim()}>Add FAQ</Button>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Visibility */}
          <Card>
            <CardHeader>
              <CardTitle>Visibility</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={formData.isPublic}
                  onChange={(e) => handleInputChange('isPublic', e.target.checked)}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="isPublic" className="flex items-center gap-2">
                  Make this playbook public in the marketplace
                  {formData.isPublic && <Check className="h-4 w-4 text-green-600" />}
                </Label>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  )
} 