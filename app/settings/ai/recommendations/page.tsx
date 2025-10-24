'use client'
export const dynamic = 'force-dynamic'

import React, { useState, useEffect, useContext, createContext, useCallback, useMemo, useReducer } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Separator } from '@/components/ui/separator'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { 
  Settings, 
  ChevronDown, 
  ChevronUp,
  Save,
  RotateCcw,
  Sparkles,
  TrendingUp,
  Info,
  ThumbsUp,
  ThumbsDown,
  ExternalLink,
  Clock,
  Plus,
  CheckSquare,
  RefreshCw,
  Zap,
  Target,
  BookOpen,
  Calendar,
  Search,
  FileText,
  Video,
  FileIcon,
  GitBranch,
  Database,
  Globe,
  Filter,
  AlertCircle,
  Loader2,
  Eye,
  Heart
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { getAISetting, saveAISetting } from '@/lib/user-settings-service'

// Combined TypeScript Interfaces
interface RecommendationSettings {
  suggestionsPerRefresh: 1|2|3|4|5|6|7|8|9|10
  serendipityLevel: 0|1|2|3|4|5|6|7|8|9|10
  autoIncludeOnSelect: boolean
  autoBundle: boolean
  includeTLDR: boolean
  domainBlacklist: string[]
  revisitNudgeDays: 1|3|7|14|21|30
  includeTrending: boolean
}

type LinkType = 'article' | 'video' | 'pdf' | 'repo' | 'dataset'

interface LinkFinderPrefs {
  enabled: boolean
  confidence_threshold: number
  categories: string[]
  auto_tags: boolean
  smart_descriptions: boolean
  topic: string
  useProfileInterests: boolean
  dateRange: string
  linkTypes: string[]
  maxResults: number
  includeMetadata: boolean
  filterDuplicates: boolean
}

interface CombinedSettings {
  recommendations: RecommendationSettings
  linkFinder: LinkFinderPrefs
}

interface RecommendationItem {
  id: string
  title: string
  url: string
  description: string
  favicon: string
  readTime: string
  confidence: number
  tags: string[]
  domain: string
  dateAdded: string
  feedback?: 'up' | 'down'
}

interface FinderResult {
  id: string
  title: string
  url: string
  description: string
  type: LinkType
  confidence: number
  datePublished: string
  readTime: string
  domain: string
  selected: boolean
  feedback?: 'up' | 'down'
}

interface CombinedContextType {
  settings: CombinedSettings
  setSettings: (settings: CombinedSettings) => void
  hasUnsavedChanges: boolean
  saveSettings: () => Promise<void>
  resetSettings: () => void
  recommendations: RecommendationItem[]
  finderResults: FinderResult[]
  isGeneratingRecs: boolean
  isFindingLinks: boolean
  generateRecommendations: () => Promise<void>
  findLinks: () => Promise<void>
}

// Default Settings
const defaultRecommendationSettings: RecommendationSettings = {
  suggestionsPerRefresh: 5,
  serendipityLevel: 3,
  autoIncludeOnSelect: true,
  autoBundle: false,
  includeTLDR: true,
  domainBlacklist: [],
  revisitNudgeDays: 14,
  includeTrending: false
}

const defaultLinkFinderPrefs: LinkFinderPrefs = {
  enabled: false,
  confidence_threshold: 0.8,
  categories: ['Development', 'Design', 'Marketing'],
  auto_tags: true,
  smart_descriptions: true,
  topic: '',
  useProfileInterests: true,
  dateRange: 'week',
  linkTypes: ['article', 'video', 'tool'],
  maxResults: 20,
  includeMetadata: true,
  filterDuplicates: true
}

const defaultCombinedSettings: CombinedSettings = {
  recommendations: defaultRecommendationSettings,
  linkFinder: defaultLinkFinderPrefs
}

// Context
const CombinedContext = createContext<CombinedContextType | null>(null)

// Custom Hooks
const useCombinedSettings = () => {
  const context = useContext(CombinedContext)
  if (!context) {
    throw new Error('useCombinedSettings must be used within CombinedProvider')
  }
  return context
}

// API Hooks
const useRecommendationsAPI = () => {
  const fetchRecommendations = useCallback(async (settings: RecommendationSettings): Promise<RecommendationItem[]> => {
    console.log('🎯 Fetching AI recommendations with settings:', settings)
    
    try {
      const response = await fetch('/api/ai/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to generate recommendations')
      }

      return data.recommendations
      
    } catch (error) {
      console.error('❌ Failed to fetch recommendations:', error)
      throw error
    }
  }, [])

  return { fetchRecommendations }
}

const useLinkFinderAPI = () => {
  const findLinks = useCallback(async (prefs: LinkFinderPrefs): Promise<FinderResult[]> => {
    console.log('🔍 Finding links with preferences:', prefs)
    
    try {
      const response = await fetch('/api/ai/link-finder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prefs })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to find links')
      }

      return data.results
      
    } catch (error) {
      console.error('❌ Failed to find links:', error)
      throw error
    }
  }, [])

  return { findLinks }
}

// Provider Component
const CombinedProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<CombinedSettings>(defaultCombinedSettings)
  const [persistedSettings, setPersistedSettings] = useState<CombinedSettings>(defaultCombinedSettings)
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([])
  const [finderResults, setFinderResults] = useState<FinderResult[]>([])
  const [isGeneratingRecs, setIsGeneratingRecs] = useState(false)
  const [isFindingLinks, setIsFindingLinks] = useState(false)

  const { fetchRecommendations } = useRecommendationsAPI()
  const { findLinks } = useLinkFinderAPI()

  useEffect(() => {
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        try {
          const [recSettings] = await Promise.all([
            getAISetting(user.id, 'recommendations').catch(() => defaultRecommendationSettings)
          ])
          
          const combined = {
            recommendations: recSettings,
            linkFinder: defaultLinkFinderPrefs
          }
          
          setSettings(combined)
          setPersistedSettings(combined)
        } catch (error) {
          console.error('Failed to load settings:', error)
        }
      }
    })()
  }, [])

  const hasUnsavedChanges = useMemo(() => {
    return JSON.stringify(settings) !== JSON.stringify(persistedSettings)
  }, [settings, persistedSettings])

  const saveSettings = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      try {
        await saveAISetting(user.id, 'recommendations', settings.recommendations)
        setPersistedSettings(settings)
        toast.success('Settings saved successfully')
      } catch (error) {
        console.error('Failed to save settings:', error)
        toast.error('Failed to save settings')
      }
    }
  }

  const resetSettings = useCallback(() => {
    setSettings(persistedSettings)
    toast.info('Settings reset to last saved state')
  }, [persistedSettings])

  const generateRecommendations = async () => {
    setIsGeneratingRecs(true)
    try {
      const newRecs = await fetchRecommendations(settings.recommendations)
      setRecommendations(newRecs)
    } catch (error) {
      toast.error('Failed to generate recommendations')
    } finally {
      setIsGeneratingRecs(false)
    }
  }

  const findLinksHandler = async () => {
    setIsFindingLinks(true)
    try {
      const results = await findLinks(settings.linkFinder)
      setFinderResults(results)
    } catch (error) {
      toast.error('Failed to find links')
    } finally {
      setIsFindingLinks(false)
    }
  }

  return (
    <CombinedContext.Provider value={{
      settings,
      setSettings,
      hasUnsavedChanges,
      saveSettings,
      resetSettings,
      recommendations,
      finderResults,
      isGeneratingRecs,
      isFindingLinks,
      generateRecommendations,
      findLinks: findLinksHandler
    }}>
      {children}
    </CombinedContext.Provider>
  )
}

// Components
const UnsavedChangesBar: React.FC = () => {
  const { hasUnsavedChanges, saveSettings, resetSettings } = useCombinedSettings()

  if (!hasUnsavedChanges) return null

  return (
    <Alert className="mb-6 border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
      <Info className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between w-full">
        <span>You have unsaved changes to your AI settings.</span>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={resetSettings}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button size="sm" onClick={saveSettings}>
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  )
}

const RecommendationsPanel: React.FC = () => {
  const { settings, setSettings, recommendations, isGeneratingRecs, generateRecommendations } = useCombinedSettings()

  const updateRecommendationSetting = <K extends keyof RecommendationSettings>(
    key: K, 
    value: RecommendationSettings[K]
  ) => {
    setSettings({
      ...settings,
      recommendations: { ...settings.recommendations, [key]: value }
    })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Sparkles className="h-5 w-5 mr-2 text-primary" />
            Personalized Recommendations
          </CardTitle>
          <CardDescription>
            AI-powered suggestions based on your interests and reading habits
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Suggestions per refresh</Label>
                <Badge variant="secondary">{settings.recommendations.suggestionsPerRefresh}</Badge>
              </div>
              <Slider
                value={[settings.recommendations.suggestionsPerRefresh]}
                onValueChange={([value]) => updateRecommendationSetting('suggestionsPerRefresh', value as RecommendationSettings['suggestionsPerRefresh'])}
                min={1}
                max={10}
                step={1}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Serendipity Level</Label>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Balance between focused recommendations and diverse exploration</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Slider
                value={[settings.recommendations.serendipityLevel]}
                onValueChange={([value]) => updateRecommendationSetting('serendipityLevel', value as RecommendationSettings['serendipityLevel'])}
                min={0}
                max={10}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Focused</span>
                <span>Diverse</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4" />
                <Label>Include trending links</Label>
              </div>
              <Switch
                checked={settings.recommendations.includeTrending}
                onCheckedChange={(checked) => updateRecommendationSetting('includeTrending', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>Auto-include after selection</Label>
              <Switch
                checked={settings.recommendations.autoIncludeOnSelect}
                onCheckedChange={(checked) => updateRecommendationSetting('autoIncludeOnSelect', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>Show TL;DR summaries</Label>
              <Switch
                checked={settings.recommendations.includeTLDR}
                onCheckedChange={(checked) => updateRecommendationSetting('includeTLDR', checked)}
              />
            </div>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Generate Recommendations</h4>
              <p className="text-sm text-muted-foreground">Get AI-powered content suggestions</p>
            </div>
            <Button onClick={generateRecommendations} disabled={isGeneratingRecs}>
              {isGeneratingRecs ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate
                </>
              )}
            </Button>
          </div>

          {recommendations.length > 0 && (
            <div className="space-y-4">
              <h4 className="font-medium">Recent Recommendations</h4>
              <div className="space-y-3">
                {recommendations.slice(0, 3).map((item) => (
                  <div key={item.id} className="flex items-start space-x-3 p-3 bg-muted/50 rounded-lg">
                    <div className="text-lg">{item.favicon}</div>
                    <div className="flex-1 min-w-0">
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium hover:text-primary transition-colors line-clamp-1"
                      >
                        {item.title}
                      </a>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {item.description}
                      </p>
                      <div className="flex items-center space-x-2 mt-2">
                        <Badge variant="outline" className="text-xs">
                          {Math.round(item.confidence * 100)}% match
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {item.readTime}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

const LinkFinderPanel: React.FC = () => {
  const { settings, setSettings, finderResults, isFindingLinks, findLinks } = useCombinedSettings()

  const updateLinkFinderSetting = <K extends keyof LinkFinderPrefs>(
    key: K, 
    value: LinkFinderPrefs[K]
  ) => {
    setSettings({
      ...settings,
      linkFinder: { ...settings.linkFinder, [key]: value }
    })
  }

  const handleLinkTypeToggle = (type: LinkType) => {
    const newTypes = settings.linkFinder.linkTypes.includes(type)
      ? settings.linkFinder.linkTypes.filter(t => t !== type)
      : [...settings.linkFinder.linkTypes, type]
    updateLinkFinderSetting('linkTypes', newTypes)
  }

  const LinkTypeChip: React.FC<{ type: LinkType; selected: boolean; onToggle: (type: LinkType) => void }> = ({ type, selected, onToggle }) => {
    const icons = {
      article: FileText,
      video: Video,
      pdf: FileIcon,
      repo: GitBranch,
      dataset: Database
    }
    
    const Icon = icons[type]
    
    return (
      <Button
        variant={selected ? "default" : "outline"}
        size="sm"
        onClick={() => onToggle(type)}
        className="flex items-center space-x-1"
      >
        <Icon className="h-3 w-3" />
        <span className="capitalize">{type}</span>
      </Button>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Search className="h-5 w-5 mr-2 text-primary" />
            AI Link Finder
          </CardTitle>
          <CardDescription>
            Discover relevant links using AI-powered search
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="topic" className="text-sm font-medium">Topic / Keywords</Label>
              <Input
                id="topic"
                placeholder="e.g., artificial intelligence, web development"
                value={settings.linkFinder.topic}
                onChange={(e) => updateLinkFinderSetting('topic', e.target.value)}
                className="mt-2"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Sparkles className="h-4 w-4 text-purple-500" />
                <Label>Use my profile interests</Label>
              </div>
              <Switch
                checked={settings.linkFinder.useProfileInterests}
                onCheckedChange={(checked) => updateLinkFinderSetting('useProfileInterests', checked)}
              />
            </div>

            <div>
              <Label className="text-sm font-medium mb-2 block">Date Range</Label>
              <Select 
                value={settings.linkFinder.dateRange} 
                onValueChange={(value) => updateLinkFinderSetting('dateRange', value as LinkFinderPrefs['dateRange'])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any time</SelectItem>
                  <SelectItem value="24h">Past 24 hours</SelectItem>
                  <SelectItem value="week">Past week</SelectItem>
                  <SelectItem value="month">Past month</SelectItem>
                  <SelectItem value="year">Past year</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium mb-3 block">Link Types</Label>
              <div className="flex flex-wrap gap-2">
                {(['article', 'video', 'pdf', 'repo', 'dataset'] as LinkType[]).map(type => (
                  <LinkTypeChip
                    key={type}
                    type={type}
                    selected={settings.linkFinder.linkTypes.includes(type)}
                    onToggle={handleLinkTypeToggle}
                  />
                ))}
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium mb-3 block">
                Max results: {settings.linkFinder.maxResults}
              </Label>
              <Slider
                value={[settings.linkFinder.maxResults]}
                onValueChange={([value]) => updateLinkFinderSetting('maxResults', value as LinkFinderPrefs['maxResults'])}
                max={100}
                min={10}
                step={15}
                className="w-full"
              />
            </div>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Find Links</h4>
              <p className="text-sm text-muted-foreground">Search for relevant content</p>
            </div>
            <Button onClick={findLinks} disabled={isFindingLinks || !settings.linkFinder.topic.trim()}>
              {isFindingLinks ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Finding...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Find Links
                </>
              )}
            </Button>
          </div>

          {finderResults.length > 0 && (
            <div className="space-y-4">
              <h4 className="font-medium">Search Results</h4>
              <div className="space-y-3">
                {finderResults.slice(0, 3).map((result) => (
                  <div key={result.id} className="flex items-start space-x-3 p-3 bg-muted/50 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <a
                        href={result.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium hover:text-primary transition-colors line-clamp-1"
                      >
                        {result.title}
                      </a>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {result.description}
                      </p>
                      <div className="flex items-center space-x-2 mt-2">
                        <Badge variant="outline" className="text-xs">
                          {result.type}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {Math.round(result.confidence * 100)}% match
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {result.readTime}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// Main Content Component
function CombinedContent() {
  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background">
        {/* Page Header */}
        <div className="border-b bg-card">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">AI Content Discovery</h1>
                <p className="text-muted-foreground mt-1">
                  Personalized recommendations and intelligent link finding powered by AI
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Settings className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">AI LinkPilot</span>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <UnsavedChangesBar />
          
          <Tabs defaultValue="recommendations" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="recommendations" className="flex items-center space-x-2">
                <Sparkles className="h-4 w-4" />
                <span>Recommendations</span>
              </TabsTrigger>
              <TabsTrigger value="finder" className="flex items-center space-x-2">
                <Search className="h-4 w-4" />
                <span>Link Finder</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="recommendations" className="mt-6">
              <RecommendationsPanel />
            </TabsContent>
            
            <TabsContent value="finder" className="mt-6">
              <LinkFinderPanel />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </TooltipProvider>
  )
}

// Main Export
export default function CombinedAIPage() {
  return (
    <CombinedProvider>
      <CombinedContent />
    </CombinedProvider>
  )
}    