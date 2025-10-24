'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  ExternalLink, 
  Check, 
  X, 
  Clock, 
  Download,
  Copy,
  Trash2,
  RefreshCw,
  Globe,
  ArrowLeft,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Link,
  Shield,
  Zap,
  Search,
  Filter,
  Play,
  Pause
} from 'lucide-react'
import { useRouter } from 'next/navigation'

interface BookmarkResult {
  id: number
  title: string
  url: string
  status: 'checking' | 'valid' | 'invalid' | 'warning'
  statusCode?: number
  responseTime?: number
  lastChecked: Date
  redirectUrl?: string
  error?: string
  category: string
  favicon: string
}

interface ValidationStats {
  total: number
  valid: number
  invalid: number
  warning: number
  checking: number
  unchecked: number
}

export default function BookmarkValidatorPage() {
  const router = useRouter()
  
  // State management
  const [bookmarks, setBookmarks] = useState<BookmarkResult[]>([])
  const [filteredBookmarks, setFilteredBookmarks] = useState<BookmarkResult[]>([])
  const [isValidating, setIsValidating] = useState(false)
  const [validationProgress, setValidationProgress] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [isPaused, setIsPaused] = useState(false)
  const [currentValidationIndex, setCurrentValidationIndex] = useState(0)

  // Sample bookmark data (in real app, this would come from your bookmark store)
  const sampleBookmarks: BookmarkResult[] = [
    {
      id: 1,
      title: "GitHub",
      url: "https://github.com",
      status: 'checking',
      category: "Development",
      favicon: "G",
      lastChecked: new Date()
    },
    {
      id: 2,
      title: "Figma",
      url: "https://figma.com",
      status: 'checking',
      category: "Design",
      favicon: "F",
      lastChecked: new Date()
    },
    {
      id: 3,
      title: "Stack Overflow",
      url: "https://stackoverflow.com",
      status: 'checking',
      category: "Development",
      favicon: "S",
      lastChecked: new Date()
    },
    {
      id: 4,
      title: "Notion",
      url: "https://notion.so",
      status: 'checking',
      category: "Productivity",
      favicon: "N",
      lastChecked: new Date()
    },
    {
      id: 5,
      title: "Dribbble",
      url: "https://dribbble.com",
      status: 'checking',
      category: "Design",
      favicon: "D",
      lastChecked: new Date()
    },
    {
      id: 6,
      title: "CodePen",
      url: "https://codepen.io",
      status: 'checking',
      category: "Development",
      favicon: "C",
      lastChecked: new Date()
    },
    {
      id: 7,
      title: "Behance",
      url: "https://behance.net",
      status: 'checking',
      category: "Design",
      favicon: "B",
      lastChecked: new Date()
    },
    {
      id: 8,
      title: "Medium",
      url: "https://medium.com",
      status: 'checking',
      category: "Learning",
      favicon: "M",
      lastChecked: new Date()
    }
  ]

  // Initialize bookmarks
  useEffect(() => {
    setBookmarks(sampleBookmarks.map(bookmark => ({ ...bookmark, status: 'checking' as const })))
  }, [])

  // Filter bookmarks based on search and status
  useEffect(() => {
    let filtered = bookmarks
    
    if (searchQuery) {
      filtered = filtered.filter(bookmark => 
        bookmark.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bookmark.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bookmark.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(bookmark => bookmark.status === statusFilter)
    }
    
    setFilteredBookmarks(filtered)
  }, [bookmarks, searchQuery, statusFilter])

  // Simulate bookmark validation
  const validateBookmark = async (bookmark: BookmarkResult): Promise<BookmarkResult> => {
    // Simulate validation delay
    await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 1000))
    
    // Simulate various validation results
    const outcomes = [
      { status: 'valid' as const, statusCode: 200, responseTime: Math.floor(Math.random() * 500) + 100 },
      { status: 'valid' as const, statusCode: 200, responseTime: Math.floor(Math.random() * 500) + 100 },
      { status: 'valid' as const, statusCode: 200, responseTime: Math.floor(Math.random() * 500) + 100 },
      { status: 'valid' as const, statusCode: 200, responseTime: Math.floor(Math.random() * 500) + 100 },
      { status: 'invalid' as const, statusCode: 404, error: 'Page not found' },
      { status: 'invalid' as const, statusCode: 500, error: 'Server error' },
      { status: 'warning' as const, statusCode: 301, redirectUrl: 'https://example-redirect.com' },
      { status: 'warning' as const, statusCode: 403, error: 'Access forbidden' }
    ]
    
    const outcome = outcomes[Math.floor(Math.random() * outcomes.length)]
    
    return {
      ...bookmark,
      ...outcome,
      lastChecked: new Date()
    }
  }

  // Start validation process
  const startValidation = async () => {
    setIsValidating(true)
    setValidationProgress(0)
    setCurrentValidationIndex(0)
    setIsPaused(false)
    
    // Reset all bookmarks to checking state
    setBookmarks(prev => prev.map(bookmark => ({ 
      ...bookmark, 
      status: 'checking' as const,
      statusCode: undefined,
      responseTime: undefined,
      error: undefined,
      redirectUrl: undefined
    })))
    
    // Validate bookmarks one by one
    for (let i = 0; i < bookmarks.length; i++) {
      if (isPaused) break
      
      setCurrentValidationIndex(i)
      const bookmark = bookmarks[i]
      
      try {
        const validatedBookmark = await validateBookmark(bookmark)
        
        // Update the specific bookmark
        setBookmarks(prev => prev.map(b => 
          b.id === bookmark.id ? validatedBookmark : b
        ))
        
        // Update progress
        setValidationProgress(((i + 1) / bookmarks.length) * 100)
        
      } catch (error) {
        console.error('Validation error:', error)
        
        // Mark as error
        setBookmarks(prev => prev.map(b => 
          b.id === bookmark.id ? { 
            ...b, 
            status: 'invalid' as const, 
            error: 'Validation failed',
            lastChecked: new Date()
          } : b
        ))
      }
    }
    
    setIsValidating(false)
    setCurrentValidationIndex(0)
  }

  // Pause/Resume validation
  const toggleValidation = () => {
    setIsPaused(!isPaused)
  }

  // Stop validation
  const stopValidation = () => {
    setIsValidating(false)
    setIsPaused(false)
    setCurrentValidationIndex(0)
  }

  // Calculate statistics
  const getStats = (): ValidationStats => {
    return bookmarks.reduce((stats, bookmark) => {
      stats.total++
      switch (bookmark.status) {
        case 'valid': stats.valid++; break
        case 'invalid': stats.invalid++; break
        case 'warning': stats.warning++; break
        case 'checking': stats.checking++; break
        default: stats.unchecked++; break
      }
      return stats
    }, { total: 0, valid: 0, invalid: 0, warning: 0, checking: 0, unchecked: 0 })
  }

  const stats = getStats()

  // Get status icon and color
  const getStatusIcon = (status: BookmarkResult['status']) => {
    switch (status) {
      case 'valid': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'invalid': return <XCircle className="h-4 w-4 text-red-500" />
      case 'warning': return <AlertCircle className="h-4 w-4 text-yellow-500" />
      case 'checking': return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
      default: return <Globe className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusColor = (status: BookmarkResult['status']) => {
    switch (status) {
      case 'valid': return 'bg-green-50 border-green-200'
      case 'invalid': return 'bg-red-50 border-red-200'
      case 'warning': return 'bg-yellow-50 border-yellow-200'
      case 'checking': return 'bg-blue-50 border-blue-200'
      default: return 'bg-gray-50 border-gray-200'
    }
  }

  // Export validation results
  const exportResults = () => {
    const csvContent = [
      ['Title', 'URL', 'Status', 'Status Code', 'Response Time', 'Error', 'Category', 'Last Checked'].join(','),
      ...bookmarks.map(bookmark => [
        bookmark.title,
        bookmark.url,
        bookmark.status,
        bookmark.statusCode || '',
        bookmark.responseTime || '',
        bookmark.error || '',
        bookmark.category,
        bookmark.lastChecked.toISOString()
      ].join(','))
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `bookmark-validation-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                onClick={() => router.push('/dashboard')}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Dashboard</span>
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Bookmark Validator</h1>
                <p className="text-gray-600 mt-1">Check the validity of all your bookmarks</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Badge variant="outline" className="flex items-center space-x-1">
                <Shield className="h-3 w-3" />
                <span>Secure</span>
              </Badge>
              <Badge variant="outline" className="flex items-center space-x-1">
                <Zap className="h-3 w-3" />
                <span>Fast</span>
              </Badge>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-8">
            <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Total</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                  </div>
                  <Globe className="h-8 w-8 text-gray-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-600 text-sm font-medium">Valid</p>
                    <p className="text-2xl font-bold text-green-900">{stats.valid}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-red-600 text-sm font-medium">Invalid</p>
                    <p className="text-2xl font-bold text-red-900">{stats.invalid}</p>
                  </div>
                  <XCircle className="h-8 w-8 text-red-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-yellow-600 text-sm font-medium">Warnings</p>
                    <p className="text-2xl font-bold text-yellow-900">{stats.warning}</p>
                  </div>
                  <AlertCircle className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-600 text-sm font-medium">Checking</p>
                    <p className="text-2xl font-bold text-blue-900">{stats.checking}</p>
                  </div>
                  <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-600 text-sm font-medium">Unchecked</p>
                    <p className="text-2xl font-bold text-purple-900">{stats.unchecked}</p>
                  </div>
                  <Clock className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Progress Bar */}
          {isValidating && (
            <Card className="mb-8 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
                    <span className="font-medium text-gray-900">
                      Validating bookmarks... ({currentValidationIndex + 1}/{bookmarks.length})
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">{Math.round(validationProgress)}% Complete</span>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={toggleValidation}
                    >
                      {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={stopValidation}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <Progress value={validationProgress} className="h-2" />
              </CardContent>
            </Card>
          )}

          {/* Controls */}
          <Card className="mb-8 bg-gradient-to-br from-white via-gray-50/50 to-white border-gray-200 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Link className="h-5 w-5 text-blue-500" />
                  <span>Bookmark Validation</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Button 
                    onClick={startValidation}
                    disabled={isValidating}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {isValidating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Validating...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Validate All Bookmarks
                      </>
                    )}
                  </Button>
                  {bookmarks.some(b => b.status !== 'checking') && (
                    <>
                      <Button variant="outline" onClick={exportResults}>
                        <Download className="h-4 w-4 mr-2" />
                        Export Results
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => setBookmarks(sampleBookmarks.map(bookmark => ({ ...bookmark, status: 'checking' as const })))}
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Reset
                      </Button>
                    </>
                  )}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Search and Filter */}
              <div className="flex items-center space-x-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search bookmarks..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Filter className="h-4 w-4 text-gray-400" />
                  <select 
                    value={statusFilter} 
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-md text-sm"
                  >
                    <option value="all">All Status</option>
                    <option value="valid">Valid</option>
                    <option value="invalid">Invalid</option>
                    <option value="warning">Warning</option>
                    <option value="checking">Checking</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bookmark Results */}
          <Card className="bg-gradient-to-br from-white via-gray-50/50 to-white border-gray-200 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Globe className="h-5 w-5 text-green-500" />
                <span>Bookmark Results ({filteredBookmarks.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {filteredBookmarks.map((bookmark) => (
                  <div
                    key={bookmark.id}
                    className={`p-4 rounded-lg border transition-all duration-200 hover:shadow-md ${getStatusColor(bookmark.status)}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1 min-w-0">
                        <div className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center font-bold text-gray-700">
                          {bookmark.favicon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            {getStatusIcon(bookmark.status)}
                            <span className="font-medium text-gray-900 truncate">
                              {bookmark.title}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {bookmark.category}
                            </Badge>
                            {bookmark.statusCode && (
                              <Badge variant="outline" className="text-xs">
                                {bookmark.statusCode}
                              </Badge>
                            )}
                          </div>
                          
                          <p className="text-sm text-gray-600 truncate mb-2">{bookmark.url}</p>
                          
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            {bookmark.responseTime && (
                              <span className="flex items-center space-x-1">
                                <Clock className="h-3 w-3" />
                                <span>{bookmark.responseTime}ms</span>
                              </span>
                            )}
                            <span>
                              Last checked: {bookmark.lastChecked.toLocaleTimeString()}
                            </span>
                          </div>
                          
                          {bookmark.error && (
                            <p className="text-sm text-red-600 mt-1">{bookmark.error}</p>
                          )}
                          
                          {bookmark.redirectUrl && (
                            <p className="text-sm text-yellow-600 mt-1">
                              Redirects to: {bookmark.redirectUrl}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-1 ml-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigator.clipboard.writeText(bookmark.url)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        {bookmark.status === 'valid' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(bookmark.url, '_blank')}
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 