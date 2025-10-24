'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs'
import { Button } from '@/src/components/ui/button'
import { Input } from '@/src/components/ui/input'
import { Badge } from '@/src/components/ui/badge'
import { Slider } from '@/src/components/ui/slider'
import { Switch } from '@/src/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/src/components/ui/select'
import { Textarea } from '@/src/components/ui/textarea'
import { Checkbox } from '@/src/components/ui/checkbox'
import { Progress } from '@/src/components/ui/progress'
import { Separator } from '@/src/components/ui/separator'
import { Alert, AlertDescription } from '@/src/components/ui/alert'
import { 
  Sparkles,
  Tags,
  FileText,
  Copy,
  Heart,
  Folder,
  Search,
  BookOpen,
  Users,
  MessageSquare,
  Calendar,
  Clock,
  TrendingUp,
  CheckCircle,
  XCircle,
  Download,
  Upload,
  Play,
  Pause,
  SkipForward,
  Volume2,
  Eye,
  EyeOff,
  Star,
  ThumbsUp,
  ThumbsDown,
  Filter,
  SortAsc,
  MoreHorizontal,
  Plus,
  Minus,
  Trash2,
  Edit,
  Share,
  Settings,
  Zap,
  Target,
  BarChart,
  PieChart,
  Activity,
  Globe,
  Shield,
  Lock,
  Unlock,
  RefreshCw,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Info,
  AlertTriangle,
  CheckSquare,
  Square,
  Loader2
} from 'lucide-react'

// Mock data for demonstration
const mockBookmarks = [
  { id: 1, title: 'React Documentation', url: 'https://react.dev', tags: ['development', 'javascript'], lastVisited: '2024-01-15', folder: 'Development' },
  { id: 2, title: 'CSS Grid Guide', url: 'https://css-tricks.com/grid', tags: ['css', 'design'], lastVisited: '2024-01-14', folder: 'Design' },
  { id: 3, title: 'Node.js Tutorial', url: 'https://nodejs.org/docs', tags: ['backend', 'javascript'], lastVisited: '2024-01-13', folder: 'Development' },
  { id: 4, title: 'Figma Design System', url: 'https://figma.com/design', tags: ['design', 'ui'], lastVisited: '2024-01-12', folder: 'Design' },
  { id: 5, title: 'TypeScript Handbook', url: 'https://typescriptlang.org', tags: ['typescript', 'development'], lastVisited: '2024-01-11', folder: 'Development' }
]

const mockDuplicates = [
  {
    id: 1,
    urls: [
      { id: 1, url: 'https://react.dev', title: 'React Documentation', lastVisited: '2024-01-15' },
      { id: 2, url: 'https://react.dev/', title: 'React Docs', lastVisited: '2024-01-10' }
    ]
  },
  {
    id: 2,
    urls: [
      { id: 3, url: 'https://css-tricks.com/grid', title: 'CSS Grid Guide', lastVisited: '2024-01-14' },
      { id: 4, url: 'https://css-tricks.com/grid/', title: 'CSS Grid Tutorial', lastVisited: '2024-01-08' }
    ]
  }
]

const mockRecommendations = [
  { id: 1, title: 'Advanced React Patterns', url: 'https://advanced-react.com', snippet: 'Learn advanced React patterns and techniques', tags: ['react', 'advanced'], confidence: 0.95 },
  { id: 2, title: 'Modern CSS Techniques', url: 'https://modern-css.dev', snippet: 'Explore modern CSS features and best practices', tags: ['css', 'modern'], confidence: 0.88 },
  { id: 3, title: 'JavaScript Performance', url: 'https://js-performance.com', snippet: 'Optimize JavaScript performance in web applications', tags: ['javascript', 'performance'], confidence: 0.82 }
]

export default function AICopilot2() {
  const [activeTab, setActiveTab] = useState('smart-tagging')
  const [selectedBookmarks, setSelectedBookmarks] = useState<number[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [suggestedTags, setSuggestedTags] = useState<any[]>([])
  const [customTag, setCustomTag] = useState('')
  const [summaryUrl, setSummaryUrl] = useState('')
  const [generatedSummary, setGeneratedSummary] = useState('')
  const [duplicateGroups, setDuplicateGroups] = useState(mockDuplicates)
  const [recommendations, setRecommendations] = useState(mockRecommendations)
  const [filterScore, setFilterScore] = useState([0.7])
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])

  // AI Smart Tagging Component
  const SmartTaggingTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">AI Smart Tagging</h2>
          <p className="text-muted-foreground">Automatically label and organize bookmarks at scale</p>
        </div>
        <Badge variant="outline">Free: 50/day | Pro: 500 | Elite: unlimited</Badge>
      </div>

      {/* Selection Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckSquare className="h-5 w-5" />
            Selection Panel
          </CardTitle>
          <CardDescription>
            {selectedBookmarks.length} items selected
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setSelectedBookmarks(mockBookmarks.map(b => b.id))}
            >
              Select All
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setSelectedBookmarks(selectedBookmarks.length === mockBookmarks.length ? [] : mockBookmarks.filter((_, i) => !selectedBookmarks.includes(mockBookmarks[i].id)).map(b => b.id))}
            >
              Invert
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setSelectedBookmarks([])}
            >
              Clear
            </Button>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {mockBookmarks.map((bookmark) => (
              <div key={bookmark.id} className="flex items-center space-x-2 p-2 border rounded">
                <Checkbox
                  checked={selectedBookmarks.includes(bookmark.id)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedBookmarks([...selectedBookmarks, bookmark.id])
                    } else {
                      setSelectedBookmarks(selectedBookmarks.filter(id => id !== bookmark.id))
                    }
                  }}
                />
                <div className="flex-1">
                  <p className="font-medium">{bookmark.title}</p>
                  <p className="text-sm text-muted-foreground">{bookmark.url}</p>
                  <div className="flex gap-1 mt-1">
                    {bookmark.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Suggest Tags */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            AI Tag Suggestions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={() => {
              setIsProcessing(true)
              setTimeout(() => {
                setSuggestedTags([
                  { tag: 'frontend', confidence: 0.95 },
                  { tag: 'tutorial', confidence: 0.88 },
                  { tag: 'documentation', confidence: 0.82 },
                  { tag: 'beginner-friendly', confidence: 0.75 },
                  { tag: 'web-development', confidence: 0.70 }
                ])
                setIsProcessing(false)
              }, 2000)
            }}
            disabled={selectedBookmarks.length === 0 || isProcessing}
            className="w-full"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing content...
              </>
            ) : (
              <>
                <Tags className="mr-2 h-4 w-4" />
                Generate Tag Suggestions
              </>
            )}
          </Button>

          {suggestedTags.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium">Suggested Tags:</h4>
              {suggestedTags.map((suggestion, index) => (
                <div key={index} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{suggestion.tag}</Badge>
                    <Progress value={suggestion.confidence * 100} className="w-20" />
                    <span className="text-sm text-muted-foreground">{Math.round(suggestion.confidence * 100)}%</span>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                      <XCircle className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              ))}
              
              <div className="flex gap-2 pt-2">
                <Button size="sm">Apply All</Button>
                <Button size="sm" variant="outline">Apply Selected</Button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <h4 className="font-medium">Custom Tags:</h4>
            <div className="flex gap-2">
              <Input
                placeholder="Add custom tag..."
                value={customTag}
                onChange={(e) => setCustomTag(e.target.value)}
              />
              <Button size="sm">Add</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Operations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowRight className="h-5 w-5" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Heart className="mr-2 h-4 w-4" />
              Move to Favorites
            </Button>
            <Button variant="outline" size="sm">
              <Folder className="mr-2 h-4 w-4" />
              Move to Playbook
            </Button>
            <Button variant="outline" size="sm">
              <Share className="mr-2 h-4 w-4" />
              Share Selected
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  // Content Summarization Component
  const ContentSummarizationTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">AI-Powered Content Summarization</h2>
          <p className="text-muted-foreground">Create concise overviews of saved pages</p>
        </div>
        <Badge variant="outline">Free: 5/month | Pro/Elite: unlimited</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Input Source
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select defaultValue="bookmarks">
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bookmarks">Selected Bookmarks</SelectItem>
              <SelectItem value="url">New URL</SelectItem>
            </SelectContent>
          </Select>

          <div className="space-y-2">
            <Input
              placeholder="Enter URL to summarize..."
              value={summaryUrl}
              onChange={(e) => setSummaryUrl(e.target.value)}
            />
            <div className="flex gap-2">
              <Button 
                onClick={() => {
                  setIsProcessing(true)
                  setTimeout(() => {
                    setGeneratedSummary("This comprehensive guide covers modern React development patterns including hooks, context, and performance optimization. Key takeaways include: • Use custom hooks for reusable logic • Implement proper error boundaries • Optimize with React.memo and useMemo • Follow component composition patterns")
                    setIsProcessing(false)
                  }, 3000)
                }}
                disabled={!summaryUrl || isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Summary...
                  </>
                ) : (
                  'Generate Summary'
                )}
              </Button>
              <Button variant="outline">Full Summary (5-7 sentences)</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {generatedSummary && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Generated Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm leading-relaxed">{generatedSummary}</p>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                Est. reading time: 3 min
              </div>
              <div className="flex items-center gap-1">
                <FileText className="h-4 w-4" />
                142 words
              </div>
            </div>

            <div className="flex gap-2">
              <Button size="sm">Save to Notes</Button>
              <Button size="sm" variant="outline">Edit Summary</Button>
              <Button size="sm" variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Export TXT
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )

  // Duplicate Detection Component
  const DuplicateDetectionTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Duplicate Detection</h2>
          <p className="text-muted-foreground">Identify and resolve redundant links</p>
        </div>
        <Badge variant="outline">Pro/Elite: Near-duplicate fuzzy matching</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Library Scan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button>
              <RefreshCw className="mr-2 h-4 w-4" />
              Scan for Duplicates
            </Button>
            <Button variant="outline">
              <Zap className="mr-2 h-4 w-4" />
              Near-Duplicate Mode
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Found {duplicateGroups.length} duplicate groups</h3>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        </div>

        {duplicateGroups.map((group) => (
          <Card key={group.id}>
            <CardHeader>
              <CardTitle className="text-base">Duplicate Group #{group.id}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {group.urls.map((url) => (
                <div key={url.id} className="flex items-center justify-between p-3 border rounded">
                  <div className="flex items-center gap-3">
                    <Checkbox />
                    <div>
                      <p className="font-medium">{url.title}</p>
                      <p className="text-sm text-muted-foreground">{url.url}</p>
                      <p className="text-xs text-muted-foreground">Last visited: {url.lastVisited}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost">Keep</Button>
                    <Button size="sm" variant="ghost">Delete</Button>
                  </div>
                </div>
              ))}
              
              <div className="flex gap-2 pt-2 border-t">
                <Button size="sm">Keep Latest</Button>
                <Button size="sm" variant="outline">Merge Notes & Tags</Button>
                <Button size="sm" variant="outline">Keep All</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Undo Stack
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-2 border rounded">
              <span className="text-sm">Deleted 2 duplicates from React Documentation</span>
              <Button size="sm" variant="ghost">Revert</Button>
            </div>
            <div className="flex items-center justify-between p-2 border rounded">
              <span className="text-sm">Merged tags for CSS Grid guides</span>
              <Button size="sm" variant="ghost">Revert</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  // Personalized Recommendations Component
  const RecommendationsTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Personalized Recommendations</h2>
          <p className="text-muted-foreground">Discover new bookmarks tailored to you</p>
        </div>
        <Badge variant="outline">Free: 1/day | Pro: 5 | Elite: unlimited</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Generate Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button className="w-full">
            <Sparkles className="mr-2 h-4 w-4" />
            Generate AI Recommendations
          </Button>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Topic Filter</label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="All topics" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="development">Development</SelectItem>
                  <SelectItem value="design">Design</SelectItem>
                  <SelectItem value="productivity">Productivity</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Date Range</label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="All time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">Past week</SelectItem>
                  <SelectItem value="month">Past month</SelectItem>
                  <SelectItem value="year">Past year</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">AI Confidence Score: {filterScore[0]}</label>
            <Slider
              value={filterScore}
              onValueChange={setFilterScore}
              max={1}
              min={0}
              step={0.1}
              className="w-full"
            />
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Recommended for You</h3>
        
        {recommendations.map((rec) => (
          <Card key={rec.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-medium">{rec.title}</h4>
                    <Badge variant="secondary" className="text-xs">
                      {Math.round(rec.confidence * 100)}% match
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{rec.snippet}</p>
                  <div className="flex gap-1 mb-3">
                    {rec.tags.map(tag => (
                      <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm">
                      <Plus className="mr-2 h-4 w-4" />
                      Add to Favorites
                    </Button>
                    <Button size="sm" variant="outline">
                      <Folder className="mr-2 h-4 w-4" />
                      Add to Folder
                    </Button>
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                    <ThumbsUp className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                    <ThumbsDown className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Email Digest
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Weekly Top Picks</p>
              <p className="text-sm text-muted-foreground">Get personalized recommendations delivered</p>
            </div>
            <Switch />
          </div>
        </CardContent>
      </Card>
    </div>
  )

  // Category Suggestions Component
  const CategorySuggestionsTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Automated Category Suggestions</h2>
          <p className="text-muted-foreground">Let AI build your folders for you</p>
        </div>
        <Badge variant="outline">Pro/Elite feature</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart className="h-5 w-5" />
            Analyze Library
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Button className="w-full">
            <Search className="mr-2 h-4 w-4" />
            Analyze All Tags & URLs
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Suggested Categories</CardTitle>
          <CardDescription>AI found 8 potential categories based on your bookmarks</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { name: 'Web Development', count: 15, examples: ['React', 'Node.js', 'CSS'] },
            { name: 'Design Resources', count: 8, examples: ['Figma', 'Icons', 'Typography'] },
            { name: 'Learning & Tutorials', count: 12, examples: ['Courses', 'Documentation', 'Guides'] },
            { name: 'Productivity Tools', count: 6, examples: ['Task Management', 'Time Tracking'] },
            { name: 'News & Blogs', count: 9, examples: ['Tech News', 'Industry Updates'] }
          ].map((category, index) => (
            <div key={index} className="flex items-center justify-between p-3 border rounded">
              <div className="flex items-center gap-3">
                <Checkbox />
                <div>
                  <p className="font-medium">{category.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {category.count} bookmarks • Examples: {category.examples.join(', ')}
                  </p>
                </div>
              </div>
              <Button size="sm" variant="outline">
                <Eye className="mr-2 h-4 w-4" />
                Preview
              </Button>
            </div>
          ))}
          
          <div className="flex gap-2 pt-4 border-t">
            <Button>Apply Selected</Button>
            <Button variant="outline">Merge Similar</Button>
            <Button variant="outline">Edit Names</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Folder className="h-5 w-5" />
            Folder Preview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            <div className="flex items-center gap-2 p-2 border rounded">
              <Folder className="h-4 w-4" />
              <span className="font-medium">📁 Web Development (15)</span>
            </div>
            <div className="ml-6 space-y-1">
              <div className="text-sm text-muted-foreground">• React Documentation</div>
              <div className="text-sm text-muted-foreground">• Node.js Tutorial</div>
              <div className="text-sm text-muted-foreground">• TypeScript Handbook</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Sparkles className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">AI-Copilot 2.0</h1>
          <Badge variant="secondary">Elite</Badge>
        </div>
        <p className="text-muted-foreground text-lg">
          Supercharge your bookmark management with advanced AI-powered tools
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="smart-tagging" className="text-xs">
            <Tags className="mr-2 h-4 w-4" />
            Smart Tagging
          </TabsTrigger>
          <TabsTrigger value="summarization" className="text-xs">
            <FileText className="mr-2 h-4 w-4" />
            Summarization
          </TabsTrigger>
          <TabsTrigger value="duplicates" className="text-xs">
            <Copy className="mr-2 h-4 w-4" />
            Duplicates
          </TabsTrigger>
          <TabsTrigger value="recommendations" className="text-xs">
            <Target className="mr-2 h-4 w-4" />
            Recommendations
          </TabsTrigger>
          <TabsTrigger value="categories" className="text-xs">
            <Folder className="mr-2 h-4 w-4" />
            Categories
          </TabsTrigger>
        </TabsList>

        <TabsContent value="smart-tagging" className="mt-6">
          <SmartTaggingTab />
        </TabsContent>

        <TabsContent value="summarization" className="mt-6">
          <ContentSummarizationTab />
        </TabsContent>

        <TabsContent value="duplicates" className="mt-6">
          <DuplicateDetectionTab />
        </TabsContent>

        <TabsContent value="recommendations" className="mt-6">
          <RecommendationsTab />
        </TabsContent>

        <TabsContent value="categories" className="mt-6">
          <CategorySuggestionsTab />
        </TabsContent>
      </Tabs>
    </div>
  )
} 