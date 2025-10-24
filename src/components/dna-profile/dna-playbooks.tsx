'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Badge } from '../ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Textarea } from '../ui/textarea'
import { Switch } from '../ui/switch'
import { Label } from '../ui/label'
import { Skeleton } from '../ui/skeleton'
import { 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack,
  Shuffle,
  Repeat,
  Volume2,
  Plus,
  Search,
  Share,
  Users,
  Lock,
  Globe,
  Heart,
  List,
  Music,
  Sparkles,
  ExternalLink,
  MoreHorizontal,
  Eye,
  Loader2,
  Trash2
} from 'lucide-react'
import { toast } from 'sonner'

// Types
interface PlaybookData {
  id: string
  name: string
  description: string
  thumbnail?: string
  isPublic: boolean
  isCollaborative: boolean
  isMarketplaceListed: boolean
  price: number
  category: string
  tags: string[]
  plays: number
  likes: number
  downloads: number
  createdAt: string
  updatedAt: string
  bookmarks?: BookmarkData[]
  collaborators: CollaboratorData[]
  isLiked: boolean
  owner: {
    id: string
    name: string
    avatar: string
  }
}

interface BookmarkData {
  id: string
  title: string
  url: string
  description: string
  favicon: string
  tags: string[]
  duration: number
  orderIndex: number
  notes?: string
  dateAdded: string
  playbookBookmarkId?: string
}

interface CollaboratorData {
  id: string
  role: string
  canEdit: boolean
}

// Mock data
const mockPlaybooks: PlaybookData[] = [
  {
    id: '1',
    name: 'React Development Essentials',
    description: 'Complete guide to modern React development with hooks, context, and best practices',
    thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=300&h=200&fit=crop',
    isPublic: true,
    isCollaborative: false,
    isMarketplaceListed: true,
    price: 0,
    category: 'Development',
    tags: ['React', 'JavaScript', 'Frontend'],
    plays: 1247,
    likes: 89,
    downloads: 234,
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-20T15:45:00Z',
    collaborators: [],
    isLiked: false,
    owner: {
      id: 'user_123',
      name: 'John Doe',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face'
    },
    bookmarks: [
      {
        id: 'b1',
        title: 'React Official Documentation',
        url: 'https://react.dev',
        description: 'Official React documentation and guides',
        favicon: 'https://react.dev/favicon.ico',
        tags: ['React', 'Documentation'],
        duration: 15,
        orderIndex: 0,
        dateAdded: '2024-01-15T10:30:00Z',
        notes: 'Start here for React fundamentals'
      },
      {
        id: 'b2',
        title: 'React Hooks in Depth',
        url: 'https://reactjs.org/docs/hooks-intro.html',
        description: 'Deep dive into React Hooks',
        favicon: 'https://react.dev/favicon.ico',
        tags: ['React', 'Hooks'],
        duration: 25,
        orderIndex: 1,
        dateAdded: '2024-01-15T11:00:00Z',
        notes: 'Essential for modern React development'
      },
      {
        id: 'b3',
        title: 'React Context API Guide',
        url: 'https://reactjs.org/docs/context.html',
        description: 'Understanding React Context for state management',
        favicon: 'https://react.dev/favicon.ico',
        tags: ['React', 'Context', 'State Management'],
        duration: 20,
        orderIndex: 2,
        dateAdded: '2024-01-15T11:30:00Z',
        notes: 'Alternative to prop drilling'
      }
    ]
  },
  {
    id: '2',
    name: 'TypeScript Mastery',
    description: 'From basics to advanced TypeScript patterns and best practices',
    thumbnail: 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=300&h=200&fit=crop',
    isPublic: true,
    isCollaborative: true,
    isMarketplaceListed: false,
    price: 0,
    category: 'Development',
    tags: ['TypeScript', 'JavaScript', 'Programming'],
    plays: 892,
    likes: 67,
    downloads: 156,
    createdAt: '2024-01-10T14:20:00Z',
    updatedAt: '2024-01-18T09:15:00Z',
    collaborators: [
      { id: 'collab1', role: 'Editor', canEdit: true }
    ],
    isLiked: true,
    owner: {
      id: 'user_456',
      name: 'Jane Smith',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=40&h=40&fit=crop&crop=face'
    },
    bookmarks: [
      {
        id: 'b4',
        title: 'TypeScript Handbook',
        url: 'https://www.typescriptlang.org/docs/',
        description: 'Official TypeScript documentation',
        favicon: 'https://www.typescriptlang.org/favicon-32x32.png',
        tags: ['TypeScript', 'Documentation'],
        duration: 30,
        orderIndex: 0,
        dateAdded: '2024-01-10T14:20:00Z',
        notes: 'Comprehensive guide to TypeScript'
      },
      {
        id: 'b5',
        title: 'Advanced TypeScript Patterns',
        url: 'https://typescript.tv/hands-on/advanced-typescript-patterns/',
        description: 'Learn advanced TypeScript patterns',
        favicon: 'https://www.typescriptlang.org/favicon-32x32.png',
        tags: ['TypeScript', 'Advanced', 'Patterns'],
        duration: 45,
        orderIndex: 1,
        dateAdded: '2024-01-10T15:00:00Z',
        notes: 'For experienced developers'
      }
    ]
  },
  {
    id: '3',
    name: 'UI/UX Design Resources',
    description: 'Essential resources for modern UI/UX design and prototyping',
    thumbnail: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=300&h=200&fit=crop',
    isPublic: false,
    isCollaborative: false,
    isMarketplaceListed: false,
    price: 0,
    category: 'Design',
    tags: ['UI', 'UX', 'Design', 'Figma'],
    plays: 456,
    likes: 34,
    downloads: 89,
    createdAt: '2024-01-05T16:45:00Z',
    updatedAt: '2024-01-12T11:20:00Z',
    collaborators: [],
    isLiked: false,
    owner: {
      id: 'user_123',
      name: 'John Doe',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face'
    },
    bookmarks: [
      {
        id: 'b6',
        title: 'Figma Design System',
        url: 'https://www.figma.com/design-systems/',
        description: 'Building design systems in Figma',
        favicon: 'https://static.figma.com/app/icon/1/favicon.png',
        tags: ['Figma', 'Design System'],
        duration: 35,
        orderIndex: 0,
        dateAdded: '2024-01-05T16:45:00Z',
        notes: 'Essential for consistent design'
      }
    ]
  }
]

// Mock user ID - in production, this would come from auth context
const MOCK_USER_ID = 'user_123'

// Mock service implementation
const mockPlaybookService = {
  async getPlaybooks(filters: any): Promise<PlaybookData[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500))
    
    let filtered = [...mockPlaybooks]
    
    // Apply filters
    if (filters.category && filters.category !== 'All') {
      filtered = filtered.filter(p => p.category === filters.category)
    }
    
    if (filters.search) {
      const search = filters.search.toLowerCase()
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(search) ||
        p.description.toLowerCase().includes(search) ||
        p.tags.some(tag => tag.toLowerCase().includes(search))
      )
    }
    
    // Apply sorting
    if (filters.sort_by === 'created_at') {
      filtered.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
        const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
        const timeA = isNaN(dateA.getTime()) ? 0 : dateA.getTime();
        const timeB = isNaN(dateB.getTime()) ? 0 : dateB.getTime();
        return filters.sort_order === 'desc' ? timeB - timeA : timeA - timeB;
      })
    } else if (filters.sort_by === 'plays') {
      filtered.sort((a, b) => {
        return filters.sort_order === 'desc' ? b.plays - a.plays : a.plays - b.plays
      })
    }
    
    return filtered
  },

  async createPlaybook(data: any): Promise<PlaybookData> {
    await new Promise(resolve => setTimeout(resolve, 800))
    
    const newPlaybook: PlaybookData = {
      id: Date.now().toString(),
      name: data.name,
      description: data.description || '',
      isPublic: data.is_public || false,
      isCollaborative: data.is_collaborative || false,
      isMarketplaceListed: false,
      price: 0,
      category: data.category || 'General',
      tags: data.tags || [],
      plays: 0,
      likes: 0,
      downloads: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      collaborators: [],
      isLiked: false,
      bookmarks: [],
      owner: {
        id: data.user_id,
        name: 'John Doe',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face'
      }
    }
    
    mockPlaybooks.unshift(newPlaybook)
    toast.success('Playbook created successfully!')
    return newPlaybook
  },

  async getPlaybookBookmarks(playbookId: string, userId: string): Promise<BookmarkData[]> {
    await new Promise(resolve => setTimeout(resolve, 300))
    
    const playbook = mockPlaybooks.find(p => p.id === playbookId)
    return playbook?.bookmarks || []
  },

  async recordPlay(playbookId: string, userId: string, sessionData: any): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 200))
    
    const playbook = mockPlaybooks.find(p => p.id === playbookId)
    if (playbook) {
      playbook.plays += 1
    }
    
    console.log('Play recorded:', { playbookId, userId, sessionData })
  },

  async likePlaybook(playbookId: string, userId: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 300))
    
    const playbook = mockPlaybooks.find(p => p.id === playbookId)
    if (playbook) {
      playbook.isLiked = true
      playbook.likes += 1
    }
    
    toast.success('Playbook liked!')
  },

  async deletePlaybook(playbookId: string, userId: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const index = mockPlaybooks.findIndex(p => p.id === playbookId)
    if (index > -1) {
      mockPlaybooks.splice(index, 1)
    }
    
    toast.success('Playbook deleted successfully!')
  },

  async generateAIPlaybook(userId: string, prompt: string): Promise<PlaybookData> {
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    const aiPlaybook: PlaybookData = {
      id: `ai_${Date.now()}`,
      name: `AI Generated: ${prompt.slice(0, 30)}...`,
      description: `This playbook was generated by AI based on your prompt: "${prompt}"`,
      isPublic: false,
      isCollaborative: false,
      isMarketplaceListed: false,
      price: 0,
      category: 'AI Generated',
      tags: ['AI', 'Generated'],
      plays: 0,
      likes: 0,
      downloads: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      collaborators: [],
      isLiked: false,
      bookmarks: [
        {
          id: `ai_b_${Date.now()}`,
          title: 'AI Suggested Resource',
          url: 'https://example.com/ai-resource',
          description: 'This resource was suggested by AI based on your prompt',
          favicon: 'https://example.com/favicon.ico',
          tags: ['AI', 'Suggested'],
          duration: 15,
          orderIndex: 0,
          dateAdded: new Date().toISOString(),
          notes: 'AI generated content'
        }
      ],
      owner: {
        id: userId,
        name: 'AI Assistant',
        avatar: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=40&h=40&fit=crop&crop=face'
      }
    }
    
    mockPlaybooks.unshift(aiPlaybook)
    toast.success('AI playbook generated successfully!')
    return aiPlaybook
  }
}

export default function DnaPlaybooks() {
  const [playbooks, setPlaybooks] = useState<PlaybookData[]>([])
  const [selectedPlaybook, setSelectedPlaybook] = useState<PlaybookData | null>(null)
  const [currentBookmark, setCurrentBookmark] = useState<BookmarkData | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isShuffled, setIsShuffled] = useState(false)
  const [isLooped, setIsLooped] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showAIGenerator, setShowAIGenerator] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [isGeneratingAI, setIsGeneratingAI] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const [sortBy, setSortBy] = useState<string>('created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [aiPrompt, setAiPrompt] = useState('')
  const [newPlaybook, setNewPlaybook] = useState({
    name: '',
    description: '',
    isPublic: false,
    isCollaborative: false,
    category: '',
    tags: [] as string[]
  })

  // Load playbooks on component mount
  useEffect(() => {
    loadPlaybooks()
  }, [selectedCategory, sortBy, sortOrder, searchQuery])

  // Load playbook bookmarks when selected playbook changes
  useEffect(() => {
    if (selectedPlaybook) {
      loadPlaybookBookmarks(selectedPlaybook.id)
    }
  }, [selectedPlaybook])

  const loadPlaybooks = async () => {
    try {
      setIsLoading(true)
      const filters = {
        user_id: MOCK_USER_ID,
        include_public: true,
        include_collaborative: true,
        category: selectedCategory !== 'All' ? selectedCategory : undefined,
        search: searchQuery || undefined,
        sort_by: sortBy,
        sort_order: sortOrder,
        limit: 50
      }

      const data = await mockPlaybookService.getPlaybooks(filters)
      setPlaybooks(data)
      
      // Auto-select first playbook if none selected
      if (!selectedPlaybook && data.length > 0) {
        setSelectedPlaybook(data[0])
      }
    } catch (error) {
      console.error('Error loading playbooks:', error)
      toast.error('Failed to load playbooks')
    } finally {
      setIsLoading(false)
    }
  }

  const loadPlaybookBookmarks = async (playbookId: string) => {
    try {
      const bookmarks = await mockPlaybookService.getPlaybookBookmarks(playbookId, MOCK_USER_ID)
      // Update the selected playbook with fresh bookmark data
      setSelectedPlaybook(prev => prev ? { ...prev, bookmarks } : null)
    } catch (error) {
      console.error('Error loading playbook bookmarks:', error)
      toast.error('Failed to load playbook bookmarks')
    }
  }

  const filteredPlaybooks = useMemo(() => {
    if (!Array.isArray(playbooks) || isLoading) return []
    
    return playbooks.filter(playbook => {
      if (!playbook || typeof playbook !== 'object') return false
      
      // Category filter
      if (selectedCategory !== 'All' && playbook.category !== selectedCategory) {
        return false
      }
      
      // Search filter
      if (searchQuery && searchQuery.trim()) {
        const searchLower = searchQuery.toLowerCase()
        const name = typeof playbook.name === 'string' ? playbook.name : ''
        const description = typeof playbook.description === 'string' ? playbook.description : ''
        const tags = Array.isArray(playbook.tags) ? playbook.tags : []
        
        return (
          name.toLowerCase().includes(searchLower) ||
          description.toLowerCase().includes(searchLower) ||
          tags.some(tag => typeof tag === 'string' && tag.toLowerCase().includes(searchLower))
        )
      }
      
      return true
    })
  }, [playbooks, selectedCategory, searchQuery, isLoading])

  const totalDuration = selectedPlaybook?.bookmarks?.reduce((acc, bookmark) => acc + (bookmark.duration || 0), 0) || 0

  const handlePlayPause = async () => {
    if (!selectedPlaybook) return

    setIsPlaying(!isPlaying)
    
    if (!currentBookmark && selectedPlaybook.bookmarks?.length) {
      setCurrentBookmark(selectedPlaybook.bookmarks[0])
    }

    // Record play analytics
    if (!isPlaying) {
      await mockPlaybookService.recordPlay(selectedPlaybook.id, MOCK_USER_ID, {
        session_id: `session_${Date.now()}`,
        bookmark_count: selectedPlaybook.bookmarks?.length || 0
      })
    }
  }

  const handleNext = () => {
    if (!selectedPlaybook || !currentBookmark || !selectedPlaybook.bookmarks?.length) return
    
    const currentIndex = selectedPlaybook.bookmarks.findIndex(b => b.id === currentBookmark.id)
    const nextIndex = isShuffled 
      ? Math.floor(Math.random() * selectedPlaybook.bookmarks.length)
      : (currentIndex + 1) % selectedPlaybook.bookmarks.length
    
    setCurrentBookmark(selectedPlaybook.bookmarks[nextIndex])
  }

  const handlePrevious = () => {
    if (!selectedPlaybook || !currentBookmark || !selectedPlaybook.bookmarks?.length) return
    
    const currentIndex = selectedPlaybook.bookmarks.findIndex(b => b.id === currentBookmark.id)
    const prevIndex = currentIndex === 0 
      ? selectedPlaybook.bookmarks.length - 1 
      : currentIndex - 1
    
    setCurrentBookmark(selectedPlaybook.bookmarks[prevIndex])
  }

  const handleCreatePlaybook = async () => {
    if (!newPlaybook.name.trim()) {
      toast.error('Please enter a playbook name')
      return
    }

    try {
      setIsCreating(true)
      const playbook = await mockPlaybookService.createPlaybook({
        user_id: MOCK_USER_ID,
        name: newPlaybook.name,
        description: newPlaybook.description,
        is_public: newPlaybook.isPublic,
        is_collaborative: newPlaybook.isCollaborative,
        category: newPlaybook.category,
        tags: newPlaybook.tags
      })
    
      setPlaybooks(prev => [playbook, ...prev])
      setSelectedPlaybook(playbook)
      setShowCreateDialog(false)
      setNewPlaybook({
        name: '',
        description: '',
        isPublic: false,
        isCollaborative: false,
        category: '',
        tags: []
      })
    } catch (error) {
      console.error('Error creating playbook:', error)
    } finally {
      setIsCreating(false)
    }
  }

  const handleAIGenerate = async () => {
    if (!aiPrompt.trim()) {
      toast.error('Please enter a prompt for AI generation')
      return
    }

    try {
      setIsGeneratingAI(true)
      const playbook = await mockPlaybookService.generateAIPlaybook(MOCK_USER_ID, aiPrompt)
      
      setPlaybooks(prev => [playbook, ...prev])
      setSelectedPlaybook(playbook)
      setShowAIGenerator(false)
      setAiPrompt('')
    } catch (error) {
      console.error('Error generating AI playbook:', error)
      toast.error('Failed to generate AI playbook')
    } finally {
      setIsGeneratingAI(false)
    }
  }

  const handleLikePlaybook = async (playbook: PlaybookData) => {
    try {
      if (playbook.isLiked) {
        // Unlike logic would go here
        toast.success('Playbook unliked!')
      } else {
        await mockPlaybookService.likePlaybook(playbook.id, MOCK_USER_ID)
        
        // Update local state
        setPlaybooks(prev => prev.map(p => 
          p.id === playbook.id 
            ? { ...p, isLiked: true, likes: p.likes + 1 }
            : p
        ))
        
        if (selectedPlaybook?.id === playbook.id) {
          setSelectedPlaybook(prev => prev ? { ...prev, isLiked: true, likes: prev.likes + 1 } : null)
        }
      }
    } catch (error) {
      console.error('Error liking playbook:', error)
      toast.error('Failed to like playbook')
    }
  }

  const handleDeletePlaybook = async (playbook: PlaybookData) => {
    if (!confirm('Are you sure you want to delete this playbook?')) return

    try {
      await mockPlaybookService.deletePlaybook(playbook.id, MOCK_USER_ID)
      
      // Update local state
      setPlaybooks(prev => prev.filter(p => p.id !== playbook.id))
      
      if (selectedPlaybook?.id === playbook.id) {
        setSelectedPlaybook(playbooks.length > 1 ? playbooks[0] : null)
      }
    } catch (error) {
      console.error('Error deleting playbook:', error)
      toast.error('Failed to delete playbook')
    }
  }

  const PlaybookSidebar = () => (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <Music className="h-5 w-5 mr-2" />
            Playbooks
          </CardTitle>
          <div className="flex items-center space-x-1">
            <Button size="sm" variant="ghost" onClick={() => setShowAIGenerator(true)}>
              <Sparkles className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search playbooks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
          </div>
          <div className="flex space-x-2">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Categories</SelectItem>
                <SelectItem value="Frontend">Frontend</SelectItem>
                <SelectItem value="Backend">Backend</SelectItem>
                <SelectItem value="Design">Design</SelectItem>
                <SelectItem value="AI/ML">AI/ML</SelectItem>
                <SelectItem value="DevOps">DevOps</SelectItem>
              </SelectContent>
            </Select>
            <Select value={`${sortBy}_${sortOrder}`} onValueChange={(value) => {
              const [field, order] = value.split('_')
              setSortBy(field)
              setSortOrder(order as 'asc' | 'desc')
            }}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at_desc">Newest First</SelectItem>
                <SelectItem value="created_at_asc">Oldest First</SelectItem>
                <SelectItem value="name_asc">Name A-Z</SelectItem>
                <SelectItem value="name_desc">Name Z-A</SelectItem>
                <SelectItem value="plays_desc">Most Played</SelectItem>
                <SelectItem value="likes_desc">Most Liked</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="space-y-1">
          {isLoading ? (
            // Loading skeleton
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-3 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <div className="flex space-x-2">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-16" />
                </div>
              </div>
            ))
          ) : filteredPlaybooks.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <Music className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p>No playbooks found</p>
              <p className="text-sm">Create your first playbook to get started</p>
            </div>
          ) : (
            filteredPlaybooks.map(playbook => (
            <div
              key={playbook.id}
              className={`p-3 cursor-pointer hover:bg-gray-50 border-l-4 transition-colors ${
                selectedPlaybook?.id === playbook.id ? 'bg-blue-50 border-l-blue-500' : 'border-l-transparent'
              }`}
              onClick={() => setSelectedPlaybook(playbook)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm truncate">{playbook.name}</h4>
                  <p className="text-xs text-gray-600 truncate">{playbook.description}</p>
                  <div className="flex items-center space-x-2 mt-2">
                    <Badge variant="secondary" className="text-xs">
                      {playbook.bookmarks?.length || 0} items
                    </Badge>
                      {playbook.category && (
                        <Badge variant="outline" className="text-xs">
                          {playbook.category}
                        </Badge>
                      )}
                    {playbook.isPublic && <Globe className="h-3 w-3 text-gray-400" />}
                    {playbook.isCollaborative && <Users className="h-3 w-3 text-gray-400" />}
                    {!playbook.isPublic && <Lock className="h-3 w-3 text-gray-400" />}
                  </div>
                    <div className="flex items-center space-x-3 mt-2">
                <div className="flex items-center space-x-1 text-xs text-gray-500">
                  <Eye className="h-3 w-3" />
                  <span>{playbook.plays}</span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleLikePlaybook(playbook)
                        }}
                        className={`flex items-center space-x-1 text-xs ${
                          playbook.isLiked ? 'text-red-500' : 'text-gray-500'
                        }`}
                      >
                        <Heart className={`h-3 w-3 ${playbook.isLiked ? 'fill-current' : ''}`} />
                        <span>{playbook.likes}</span>
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    {playbook.owner.id === MOCK_USER_ID && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeletePlaybook(playbook)
                        }}
                        className="h-6 w-6 p-0 text-gray-400 hover:text-red-500"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )

  const PlaybookPlayer = () => (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" onClick={handlePrevious}>
                <SkipBack className="h-4 w-4" />
              </Button>
              <Button onClick={handlePlayPause} disabled={!selectedPlaybook?.bookmarks?.length}>
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
              <Button variant="ghost" size="sm" onClick={handleNext}>
                <SkipForward className="h-4 w-4" />
              </Button>
            </div>
            
            {currentBookmark && (
              <div className="flex items-center space-x-3">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={`https://www.google.com/s2/favicons?domain=${new URL(currentBookmark.url).hostname}&sz=32`} />
                  <AvatarFallback>{currentBookmark.title[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="font-medium text-sm">{currentBookmark.title}</h4>
                  <p className="text-xs text-gray-600">{currentBookmark.duration}min read</p>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsShuffled(!isShuffled)}
              className={isShuffled ? 'text-blue-500' : ''}
            >
              <Shuffle className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsLooped(!isLooped)}
              className={isLooped ? 'text-blue-500' : ''}
            >
              <Repeat className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Volume2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="h-full flex flex-col space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Playbooks</h2>
          <p className="text-gray-600">Spotify for your bookmarks</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => setShowAIGenerator(true)}>
            <Sparkles className="h-4 w-4 mr-2" />
            AI Generate
          </Button>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Playbook
          </Button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <PlaybookSidebar />
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3 space-y-4">
          {/* Player */}
          <PlaybookPlayer />

          {/* Current Playbook */}
          {selectedPlaybook && (
              <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    {selectedPlaybook.thumbnail && (
                      <img 
                        src={selectedPlaybook.thumbnail} 
                        alt={selectedPlaybook.name}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                    )}
                    <div>
                      <CardTitle className="text-xl">{selectedPlaybook.name}</CardTitle>
                      <p className="text-gray-600 mt-1">{selectedPlaybook.description}</p>
                      <div className="flex items-center space-x-4 mt-2">
                        <div className="flex items-center space-x-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={selectedPlaybook.owner.avatar} />
                            <AvatarFallback>{selectedPlaybook.owner.name[0]}</AvatarFallback>
                          </Avatar>
                          <span className="text-sm text-gray-600">{selectedPlaybook.owner.name}</span>
                        </div>
                        <Badge variant="secondary">
                          {selectedPlaybook.bookmarks?.length || 0} bookmarks
                        </Badge>
                        <Badge variant="outline">
                          {totalDuration} min total
                          </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleLikePlaybook(selectedPlaybook)}
                      className={selectedPlaybook.isLiked ? 'text-red-500' : ''}
                    >
                      <Heart className={`h-4 w-4 ${selectedPlaybook.isLiked ? 'fill-current' : ''}`} />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Share className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                  </div>
                </CardHeader>
                <CardContent>
                {selectedPlaybook.bookmarks?.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <List className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                    <p>No bookmarks in this playbook yet</p>
                    <p className="text-sm">Add some bookmarks to get started</p>
                  </div>
                ) : (
                    <div className="space-y-2">
                      {selectedPlaybook.bookmarks?.map((bookmark, index) => (
                        <div
                          key={bookmark.id}
                        className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${
                          currentBookmark?.id === bookmark.id ? 'bg-blue-50 border border-blue-200' : ''
                          }`}
                          onClick={() => setCurrentBookmark(bookmark)}
                        >
                        <div className="flex items-center space-x-3 flex-1">
                          <span className="text-sm text-gray-400 w-6">{index + 1}</span>
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={`https://www.google.com/s2/favicons?domain=${new URL(bookmark.url).hostname}&sz=32`} />
                            <AvatarFallback>{bookmark.title[0]}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm truncate">{bookmark.title}</h4>
                            <p className="text-xs text-gray-600 truncate">{bookmark.description}</p>
                          </div>
                          </div>
                        <div className="flex items-center space-x-2">
                          {bookmark.duration && (
                            <Badge variant="secondary" className="text-xs">
                              {bookmark.duration}min
                            </Badge>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              window.open(bookmark.url, '_blank')
                            }}
                          >
                            <ExternalLink className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Create Playbook Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New Playbook</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="Enter playbook name"
                value={newPlaybook.name}
                onChange={(e) => setNewPlaybook(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Enter playbook description"
                value={newPlaybook.description}
                onChange={(e) => setNewPlaybook(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <Select value={newPlaybook.category} onValueChange={(value) => setNewPlaybook(prev => ({ ...prev, category: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Frontend">Frontend</SelectItem>
                  <SelectItem value="Backend">Backend</SelectItem>
                  <SelectItem value="Design">Design</SelectItem>
                  <SelectItem value="AI/ML">AI/ML</SelectItem>
                  <SelectItem value="DevOps">DevOps</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="isPublic"
                checked={newPlaybook.isPublic}
                onCheckedChange={(checked) => setNewPlaybook(prev => ({ ...prev, isPublic: checked }))}
              />
              <Label htmlFor="isPublic">Make public</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="isCollaborative"
                checked={newPlaybook.isCollaborative}
                onCheckedChange={(checked) => setNewPlaybook(prev => ({ ...prev, isCollaborative: checked }))}
              />
              <Label htmlFor="isCollaborative">Allow collaboration</Label>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreatePlaybook} disabled={isCreating}>
                {isCreating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Create Playbook
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* AI Generator Dialog */}
      <Dialog open={showAIGenerator} onOpenChange={setShowAIGenerator}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Generate AI Playbook</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="aiPrompt">Describe your ideal playbook</Label>
              <Textarea
                id="aiPrompt"
                placeholder="e.g., 'Create a playbook for learning React with best resources for beginners'"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                rows={3}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowAIGenerator(false)}>
                Cancel
              </Button>
              <Button onClick={handleAIGenerate} disabled={isGeneratingAI}>
                {isGeneratingAI && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Generate Playbook
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 