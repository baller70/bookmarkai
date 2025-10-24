// @ts-nocheck
'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Badge } from '../ui/badge'
import { Checkbox } from '../ui/checkbox'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Textarea } from '../ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../ui/sheet'
import { Slider } from '../ui/slider'
import { 
  Search,
  Filter,
  SortAsc,
  SortDesc,
  Grid3X3,
  List,
  MoreHorizontal,
  X,
  RefreshCw,
  Download,
  Bookmark,
  Heart,
  Share,
  ExternalLink,
  Calendar,
  Clock,
  Star,
  Tag,
  Folder as FolderIcon,
  User,
  Globe,
  Lock,
  Trash2,
  Edit,
  Plus,
  Sparkles,
  Zap,
  Brain,
  Target,
  TrendingUp,
  Eye,
  MousePointer,
  BarChart3,
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  SlidersHorizontal,
  Lightbulb,
  History
} from 'lucide-react'
import { toast } from 'sonner'

interface SearchResult {
  id: string
  title: string
  url: string
  description: string
  content: string
  favicon: string
  tags: string[]
  folder: string
  dateAdded: Date
  lastVisited: Date
  visitCount: number
  rating: number
  relevanceScore: number
  matchType: 'title' | 'content' | 'tags' | 'url'
  highlights: string[]
}

interface SearchHistory {
  id: string
  query: string
  timestamp: Date
  resultCount: number
  filters: SearchFilters
}

interface SearchFilters {
  dateRange: {
    start: Date | null
    end: Date | null
  }
  folders: string[]
  tags: string[]
  domains: string[]
  minRating: number
  visitCount: {
    min: number
    max: number
  }
  contentType: string[]
}

const mockResults: SearchResult[] = [
  {
    id: '1',
    title: 'React Hooks Documentation',
    url: 'https://react.dev/reference/react',
    description: 'Complete reference for React Hooks including useState, useEffect, and custom hooks',
    content: 'React Hooks let you use state and other React features without writing a class...',
    favicon: '/react-icon.png',
    tags: ['React', 'Hooks', 'Documentation'],
    folder: 'Development',
    dateAdded: new Date('2024-01-15'),
    lastVisited: new Date('2024-01-20'),
    visitCount: 45,
    rating: 5,
    relevanceScore: 0.95,
    matchType: 'title',
    highlights: ['React Hooks', 'useState', 'useEffect']
  },
  {
    id: '2',
    title: 'Advanced TypeScript Patterns',
    url: 'https://typescript.org/docs/handbook/advanced-types.html',
    description: 'Learn advanced TypeScript patterns including conditional types, mapped types, and utility types',
    content: 'TypeScript provides several utility types to facilitate common type transformations...',
    favicon: '/ts-icon.png',
    tags: ['TypeScript', 'Advanced', 'Patterns'],
    folder: 'Development',
    dateAdded: new Date('2024-01-10'),
    lastVisited: new Date('2024-01-18'),
    visitCount: 32,
    rating: 4,
    relevanceScore: 0.87,
    matchType: 'content',
    highlights: ['conditional types', 'mapped types', 'utility types']
  }
]

const mockHistory: SearchHistory[] = [
  {
    id: '1',
    query: 'React hooks tutorial',
    timestamp: new Date('2024-01-20'),
    resultCount: 15,
    filters: {
      dateRange: { start: null, end: null },
      folders: ['Development'],
      tags: ['React'],
      domains: [],
      minRating: 0,
      visitCount: { min: 0, max: 100 },
      contentType: []
    }
  },
  {
    id: '2',
    query: 'TypeScript best practices',
    timestamp: new Date('2024-01-19'),
    resultCount: 8,
    filters: {
      dateRange: { start: null, end: null },
      folders: [],
      tags: ['TypeScript'],
      domains: [],
      minRating: 4,
      visitCount: { min: 0, max: 100 },
      contentType: []
    }
  }
]

export default function DnaSearch() {
  const [searchQuery, setSearchQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>(mockHistory)
  const [isSearching, setIsSearching] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'table'>('list')
  const [selectedResults, setSelectedResults] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)
  const [showAIAssist, setShowAIAssist] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  
  const [filters, setFilters] = useState<SearchFilters>({
    dateRange: { start: null, end: null },
    folders: [],
    tags: [],
    domains: [],
    minRating: 0,
    visitCount: { min: 0, max: 100 },
    contentType: []
  })

  const [aiSuggestions, setAiSuggestions] = useState<string[]>([
    'Find React performance optimization guides',
    'Search for TypeScript migration tutorials',
    'Look for design system documentation',
    'Find accessibility best practices'
  ])

  const handleSearch = async (query: string = searchQuery) => {
    if (!query.trim()) return

    setIsSearching(true)

    try {
      // Build search parameters
      const params = new URLSearchParams({
        query: query,
        limit: '20',
        offset: '0'
      })

      // Add filters if they exist
      if (filters.categories && filters.categories.length > 0) {
        params.append('category', filters.categories[0]) // Use first category for now
      }

      // Call the real search API
      const response = await fetch(`/api/bookmarks/search?${params}`)

      if (response.ok) {
        const data = await response.json()

        // Transform API results to match the expected format
        const transformedResults = (data.bookmarks || []).map((bookmark: any) => ({
          id: bookmark.id.toString(),
          title: bookmark.title,
          content: bookmark.description || bookmark.ai_summary || 'No description available',
          url: bookmark.url,
          tags: [...(bookmark.tags || []), ...(bookmark.ai_tags || [])],
          category: bookmark.category || bookmark.ai_category || 'General',
          relevance: bookmark.relevance_score || 0.8,
          timestamp: new Date(bookmark.created_at || Date.now()),
          favicon: bookmark.favicon,
          ai_summary: bookmark.ai_summary,
          notes: bookmark.notes
        }))

        setResults(transformedResults)

        // Add to history
        const historyItem: SearchHistory = {
          id: Date.now().toString(),
          query,
          timestamp: new Date(),
          resultCount: transformedResults.length,
          filters: { ...filters }
        }
        setSearchHistory(prev => [historyItem, ...prev.slice(0, 9)])
      } else {
        console.error('Search failed:', response.statusText)
        setResults([])
      }
    } catch (error) {
      console.error('Search error:', error)
      setResults([])
    } finally {
      setIsSearching(false)
    }
  }

  const handleAIAssist = (suggestion: string) => {
    setSearchQuery(suggestion)
    handleSearch(suggestion)
    setShowAIAssist(false)
  }

  const handleBulkAction = (action: string) => {
    if (selectedResults.length === 0) {
      toast.error('Please select items first')
      return
    }

    switch (action) {
      case 'bookmark':
        toast.success(`Added ${selectedResults.length} items to bookmarks`)
        break
      case 'archive':
        toast.success(`Archived ${selectedResults.length} items`)
        break
      case 'export':
        toast.success(`Exported ${selectedResults.length} items`)
        break
      case 'delete':
        setResults(prev => prev.filter(result => !selectedResults.includes(result.id)))
        toast.success(`Deleted ${selectedResults.length} items`)
        break
    }
    setSelectedResults([])
  }

  const SearchResultCard = ({ result }: { result: SearchResult }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          <Checkbox
            checked={selectedResults.includes(result.id)}
            onCheckedChange={(checked) => {
              if (checked) {
                setSelectedResults(prev => [...prev, result.id])
              } else {
                setSelectedResults(prev => prev.filter(id => id !== result.id))
              }
            }}
          />
          
          <img src={result.favicon} alt="" className="w-5 h-5 mt-1" />
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-medium text-sm line-clamp-2">{result.title}</h3>
              <Badge variant="secondary" className="text-xs ml-2">
                {Math.round(result.relevanceScore * 100)}% match
              </Badge>
            </div>
            
            <p className="text-sm text-gray-600 line-clamp-2 mb-2">{result.description}</p>
            
            <div className="flex items-center space-x-2 mb-2">
              {result.highlights.map((highlight, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {highlight}
                </Badge>
              ))}
            </div>
            
            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center space-x-3">
                <span className="flex items-center">
                                          <FolderIcon className="h-3 w-3 mr-1" />
                  {result.folder}
                </span>
                <span className="flex items-center">
                  <Eye className="h-3 w-3 mr-1" />
                  {result.visitCount}
                </span>
                <span className="flex items-center">
                  <Star className="h-3 w-3 mr-1" />
                  {result.rating}/5
                </span>
              </div>
              <span>{result.lastVisited.toLocaleDateString()}</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-1">
            <Button variant="ghost" size="sm">
              <ExternalLink className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const SearchResultTable = () => (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b">
              <tr className="text-left">
                <th className="p-4 w-12">
                  <Checkbox
                    checked={selectedResults.length === results.length && results.length > 0}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedResults(results.map(r => r.id))
                      } else {
                        setSelectedResults([])
                      }
                    }}
                  />
                </th>
                <th className="p-4 font-medium text-sm">Title</th>
                <th className="p-4 font-medium text-sm">Folder</th>
                <th className="p-4 font-medium text-sm">Rating</th>
                <th className="p-4 font-medium text-sm">Visits</th>
                <th className="p-4 font-medium text-sm">Match</th>
                <th className="p-4 font-medium text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {results.map(result => (
                <tr key={result.id} className="border-b hover:bg-gray-50">
                  <td className="p-4">
                    <Checkbox
                      checked={selectedResults.includes(result.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedResults(prev => [...prev, result.id])
                        } else {
                          setSelectedResults(prev => prev.filter(id => id !== result.id))
                        }
                      }}
                    />
                  </td>
                  <td className="p-4">
                    <div className="flex items-center space-x-2">
                      <img src={result.favicon} alt="" className="w-4 h-4" />
                      <div>
                        <h4 className="font-medium text-sm">{result.title}</h4>
                        <p className="text-xs text-gray-600 truncate max-w-xs">{result.description}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-sm">{result.folder}</td>
                  <td className="p-4">
                    <div className="flex items-center">
                      <Star className="h-3 w-3 text-yellow-400 fill-current mr-1" />
                      <span className="text-sm">{result.rating}</span>
                    </div>
                  </td>
                  <td className="p-4 text-sm">{result.visitCount}</td>
                  <td className="p-4">
                    <Badge variant="secondary" className="text-xs">
                      {Math.round(result.relevanceScore * 100)}%
                    </Badge>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center space-x-1">
                      <Button variant="ghost" size="sm">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Search</h2>
          <p className="text-gray-600">AI-enhanced bookmark search</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => setShowHistory(true)}>
            <History className="h-4 w-4 mr-2" />
            History
          </Button>
          <Button variant="outline" onClick={() => setShowAIAssist(true)}>
            <Sparkles className="h-4 w-4 mr-2" />
            AI Assist
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex space-x-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Search your bookmarks with AI..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10 text-base h-12"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2"
                  onClick={() => setSearchQuery('')}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            <Button onClick={() => handleSearch()} disabled={isSearching} className="h-12">
              {isSearching ? <RefreshCw className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
            </Button>
            <Button variant="outline" onClick={() => setShowFilters(true)} className="h-12">
              <Filter className="h-5 w-5" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results Header */}
      {results.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">
                  {results.length} results found
                </span>
                {selectedResults.length > 0 && (
                  <span className="text-sm text-gray-600">
                    {selectedResults.length} selected
                  </span>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                {selectedResults.length > 0 && (
                  <div className="flex items-center space-x-1 mr-4">
                    <Button variant="outline" size="sm" onClick={() => handleBulkAction('bookmark')}>
                      <Bookmark className="h-4 w-4 mr-1" />
                      Bookmark
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleBulkAction('export')}>
                      <Download className="h-4 w-4 mr-1" />
                      Export
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleBulkAction('delete')}>
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                )}
                
                <div className="flex items-center border rounded-md">
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'table' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('table')}
                  >
                    <SlidersHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      <div className="space-y-4">
        {viewMode === 'table' ? (
          <SearchResultTable />
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.map(result => (
              <SearchResultCard key={result.id} result={result} />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {results.map(result => (
              <SearchResultCard key={result.id} result={result} />
            ))}
          </div>
        )}

        {searchQuery && results.length === 0 && !isSearching && (
          <Card>
            <CardContent className="p-8 text-center">
              <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
              <p className="text-gray-600 mb-4">
                Try adjusting your search query or filters, or let AI help you find what you're looking for.
              </p>
              <Button onClick={() => setShowAIAssist(true)}>
                <Sparkles className="h-4 w-4 mr-2" />
                Get AI Suggestions
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Filters Sheet */}
      <Sheet open={showFilters} onOpenChange={setShowFilters}>
        <SheetContent className="w-96">
          <SheetHeader>
            <SheetTitle>Advanced Filters</SheetTitle>
          </SheetHeader>
          <div className="space-y-6 mt-6">
            <div>
              <h4 className="font-medium mb-3">Date Range</h4>
              <div className="space-y-2">
                <Input type="date" placeholder="Start date" />
                <Input type="date" placeholder="End date" />
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-3">Minimum Rating</h4>
              <Slider
                value={[filters.minRating]}
                onValueChange={([value]) => setFilters(prev => ({ ...prev, minRating: value }))}
                max={5}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Any</span>
                <span>5 stars</span>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-3">Folders</h4>
              <div className="space-y-2">
                {['Development', 'Design', 'Research', 'Tools'].map(folder => (
                  <div key={folder} className="flex items-center space-x-2">
                    <Checkbox
                      checked={filters.folders.includes(folder)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setFilters(prev => ({ ...prev, folders: [...prev.folders, folder] }))
                        } else {
                          setFilters(prev => ({ ...prev, folders: prev.folders.filter(f => f !== folder) }))
                        }
                      }}
                    />
                    <label className="text-sm">{folder}</label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-3">Content Type</h4>
              <div className="space-y-2">
                {['Articles', 'Documentation', 'Tutorials', 'Tools', 'Videos'].map(type => (
                  <div key={type} className="flex items-center space-x-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox />
                      <label className="text-sm">{type}</label>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => setShowFilters(false)}>
                Cancel
              </Button>
              <Button onClick={() => setShowFilters(false)}>
                Apply Filters
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* AI Assist Dialog */}
      <Dialog open={showAIAssist} onOpenChange={setShowAIAssist}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Sparkles className="h-5 w-5 mr-2 text-purple-500" />
              AI Search Assistant
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Let AI help you find exactly what you're looking for with these smart suggestions:
            </p>
            <div className="space-y-2">
              {aiSuggestions.map((suggestion, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="w-full justify-start text-left h-auto p-3"
                  onClick={() => handleAIAssist(suggestion)}
                >
                  <Lightbulb className="h-4 w-4 mr-2 text-yellow-500" />
                  {suggestion}
                </Button>
              ))}
            </div>
            <div className="pt-4 border-t">
              <Input
                placeholder="Describe what you're looking for..."
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleAIAssist(e.currentTarget.value)
                  }
                }}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Search History Dialog */}
      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <History className="h-5 w-5 mr-2" />
              Search History
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {searchHistory.map(item => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                onClick={() => {
                  setSearchQuery(item.query)
                  setShowHistory(false)
                  handleSearch(item.query)
                }}
              >
                <div className="flex-1">
                  <h4 className="font-medium text-sm">{item.query}</h4>
                  <p className="text-xs text-gray-600">
                    {item.resultCount} results • {item.timestamp.toLocaleDateString()}
                  </p>
                </div>
                <Button variant="ghost" size="sm">
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 