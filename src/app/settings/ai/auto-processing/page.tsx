'use client'

// TODO: Migrate to PostgreSQL/Prisma - Supabase imports removed
import React, { useState, useEffect, useContext, createContext, useCallback, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { Separator } from '@/components/ui/separator'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { 
  Settings, 
  ChevronDown, 
  ChevronUp,
  Save,
  RotateCcw,
  Plus,
  Trash2,
  Edit,
  History,
  Download,
  Upload,
  AlertCircle,
  Info,
  HelpCircle,
  Tag,
  Folder,
  AlertTriangle,
  CheckCircle,
  Eye,
  EyeOff
} from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts'
import { getAISetting, saveAISetting } from '@/lib/user-settings-service'

// TypeScript Interfaces
interface Rule {
  id: string
  ifType: 'domain' | 'tag' | 'urlRegex' | 'content'
  ifValue: string
  thenActions: (
    | { type: 'addTag'; value: string }
    | { type: 'moveFolder'; folderId: string; value: string }
    | { type: 'setPriority'; value: 'high' | 'normal' | 'low' }
  )[]
}

interface AutoProcessingSettings {
  // Intake
  processManual: boolean
  processBulk: boolean
  processBrowserCapture: boolean
  paused: boolean

  // Tagging
  taggingEnabled: boolean
  confidence: number
  tagStyle: 'singular' | 'plural' | 'camel' | 'kebab'
  languageMode: 'detect' | 'english' | 'source'
  synonymMapping: boolean
  normalization: boolean
  manualReview: boolean

  // Filtering & Categorization
  stripTracking: boolean
  domainBlacklist: string[]
  minWordCount: number
  duplicateHandling: 'skip' | 'overwrite' | 'keepBoth'
  suggestFolder: boolean
  autoFile: boolean
  smartFolderContext: boolean
  fallbackFolderId: string | null
  draftExpirationDays: 1 | 7 | 30

  // Extras
  rules: Rule[]
  historyDepth: number
}

interface HistoryItem {
  id: string
  timestamp: Date
  action: string
  details: string
  user: string
  undoable: boolean
}

// Default Settings
const defaultSettings: AutoProcessingSettings = {
  processManual: true,
  processBulk: true,
  processBrowserCapture: true,
  paused: false,
  taggingEnabled: true,
  confidence: 60,
  tagStyle: 'singular',
  languageMode: 'detect',
  synonymMapping: false,
  normalization: true,
  manualReview: true,
  stripTracking: true,
  domainBlacklist: [],
  minWordCount: 100,
  duplicateHandling: 'skip',
  suggestFolder: true,
  autoFile: false,
  smartFolderContext: true,
  fallbackFolderId: 'inbox',
  draftExpirationDays: 7,
  rules: [],
  historyDepth: 50
}

// Context
interface AutoProcessingContextType {
  settings: AutoProcessingSettings
  setSettings: (settings: AutoProcessingSettings) => void
  hasUnsavedChanges: boolean
  saveSettings: () => void
  resetSettings: () => void
}

const AutoProcessingContext = createContext<AutoProcessingContextType | null>(null)

// Custom Hooks
const useHeatmapColor = (value: number): string => {
  const hue = (value / 100) * 120 // 0 = red, 120 = green
  return `hsl(${hue}, 100%, 50%)`
}

const useAutoProcessingSettings = () => {
  const context = useContext(AutoProcessingContext)
  if (!context) {
    throw new Error('useAutoProcessingSettings must be used within AutoProcessingProvider')
  }
  return context
}

// Provider Component
const AutoProcessingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AutoProcessingSettings>(defaultSettings)
  const [persistedSettings, setPersistedSettings] = useState<AutoProcessingSettings>(defaultSettings)

  useEffect(() => {
    ;(async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        try {
          const remote = await getAISetting(user.id, 'auto_processing')
          setSettings(remote as unknown as AutoProcessingSettings)
        } catch (error) {
          console.error('Failed to load auto-processing settings:', error)
        }
      }
    })()
  }, [])

  const hasUnsavedChanges = useMemo(() => {
    return JSON.stringify(settings) !== JSON.stringify(persistedSettings)
  }, [settings, persistedSettings])

  const saveSettings = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (user) {
      try {
        await saveAISetting(user.id, 'auto_processing', settings as any)
        toast.success('Auto-processing settings saved successfully')
      } catch (error) {
        console.error('Failed to save auto-processing settings:', error)
        toast.error('Failed to save auto-processing settings')
      }
    }
  }

  const resetSettings = useCallback(() => {
    setSettings(persistedSettings)
    toast.info('Settings reset to last saved state')
  }, [persistedSettings])

  return (
    <AutoProcessingContext.Provider value={{
      settings,
      setSettings,
      hasUnsavedChanges,
      saveSettings,
      resetSettings
    }}>
      {children}
    </AutoProcessingContext.Provider>
  )
}

export default function AutoProcessingPage() {
  return (
    <AutoProcessingProvider>
      <AutoProcessingContent />
    </AutoProcessingProvider>
  )
}

function AutoProcessingContent() {
  const { settings, setSettings, hasUnsavedChanges, saveSettings, resetSettings } = useAutoProcessingSettings()
  const [ruleModalOpen, setRuleModalOpen] = useState(false)
  const [historyDrawerOpen, setHistoryDrawerOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<Rule | null>(null)

  // Panel collapse states
  const [intakeCollapsed, setIntakeCollapsed] = useState(false)
  const [taggingCollapsed, setTaggingCollapsed] = useState(false)
  const [filteringCollapsed, setFilteringCollapsed] = useState(false)
  const [rulesCollapsed, setRulesCollapsed] = useState(false)

  // Mock data for tag cloud
  const tagCloudData = [
    { name: 'Technology', value: 35, color: '#8884d8' },
    { name: 'Design', value: 28, color: '#82ca9d' },
    { name: 'Business', value: 22, color: '#ffc658' },
    { name: 'Marketing', value: 15, color: '#ff7c7c' }
  ]

  // Mock history data
  const historyItems: HistoryItem[] = [
    {
      id: '1',
      timestamp: new Date(Date.now() - 1000 * 60 * 30),
      action: 'Auto-tagged 15 links',
      details: 'Applied tags: technology, javascript, react',
      user: 'System',
      undoable: true
    },
    {
      id: '2',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
      action: 'Rule created',
      details: 'IF domain contains "github.com" THEN add tag "development"',
      user: 'User',
      undoable: true
    }
  ]

  const updateSetting = (path: string, value: any) => {
    const newSettings = { ...settings }
    const keys = path.split('.')
    let current: any = newSettings
    
    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]]
    }
    
    current[keys[keys.length - 1]] = value
    setSettings(newSettings)
  }

  const confidenceColor = useHeatmapColor(settings.confidence)
  const estimatedTagRate = Math.round(settings.confidence * 0.8) // Mock calculation

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Auto-Processing Control Panel</h1>
            <p className="text-muted-foreground">
              Configure how AI LinkPilot automatically processes your bookmarks and links
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setHistoryDrawerOpen(true)}
            >
              <History className="h-4 w-4 mr-2" />
              History
            </Button>
          </div>
        </div>

        {/* Unsaved Changes Bar */}
        {hasUnsavedChanges && (
          <Alert className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between w-full">
              <span>You have unsaved changes</span>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" onClick={resetSettings}>
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Reset
                </Button>
                <Button size="sm" onClick={saveSettings}>
                  <Save className="h-4 w-4 mr-1" />
                  Save Changes
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Intake Scope Panel */}
            <Card>
              <Collapsible open={!intakeCollapsed} onOpenChange={setIntakeCollapsed}>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Settings className="h-5 w-5 text-primary" />
                        <CardTitle>Intake Scope</CardTitle>
                      </div>
                      {intakeCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                    </div>
                    <CardDescription>
                      Control which types of link additions trigger auto-processing
                    </CardDescription>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="processManual">Manual saves</Label>
                          <p className="text-sm text-muted-foreground">Process links saved manually</p>
                        </div>
                        <Switch
                          id="processManual"
                          checked={settings.processManual}
                          onCheckedChange={(checked) => updateSetting('processManual', checked)}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="processBulk">Bulk uploads</Label>
                          <p className="text-sm text-muted-foreground">Process bulk imported links</p>
                        </div>
                        <Switch
                          id="processBulk"
                          checked={settings.processBulk}
                          onCheckedChange={(checked) => updateSetting('processBulk', checked)}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="processBrowserCapture">Browser capture</Label>
                          <p className="text-sm text-muted-foreground">Process browser extension saves</p>
                        </div>
                        <Switch
                          id="processBrowserCapture"
                          checked={settings.processBrowserCapture}
                          onCheckedChange={(checked) => updateSetting('processBrowserCapture', checked)}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="paused">Pause all processing</Label>
                          <p className="text-sm text-muted-foreground">Temporarily disable auto-processing</p>
                        </div>
                        <Switch
                          id="paused"
                          checked={settings.paused}
                          onCheckedChange={(checked) => updateSetting('paused', checked)}
                        />
                      </div>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>

            {/* Auto-Tagging Panel */}
            <Card>
              <Collapsible open={!taggingCollapsed} onOpenChange={setTaggingCollapsed}>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Tag className="h-5 w-5 text-primary" />
                        <CardTitle>Auto-Tagging & Metadata</CardTitle>
                      </div>
                      {taggingCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                    </div>
                    <CardDescription>
                      Configure automatic tag generation and content analysis
                    </CardDescription>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="taggingEnabled">Enable auto-tagging</Label>
                        <p className="text-sm text-muted-foreground">Automatically generate tags for new links</p>
                      </div>
                      <Switch
                        id="taggingEnabled"
                        checked={settings.taggingEnabled}
                        onCheckedChange={(checked) => updateSetting('taggingEnabled', checked)}
                      />
                    </div>
                    
                    {settings.taggingEnabled && (
                      <div className="space-y-4 pl-4 border-l-2 border-muted">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label>Confidence threshold</Label>
                            <Tooltip>
                              <TooltipTrigger>
                                <Badge variant="secondary">
                                  ~{estimatedTagRate}% of links will auto-apply
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Estimated percentage of links that will receive automatic tags</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <div className="space-y-2">
                            <Slider
                              value={[settings.confidence]}
                              onValueChange={([value]) => updateSetting('confidence', value)}
                              min={0}
                              max={100}
                              step={5}
                              className="w-full"
                            />
                            <div 
                              className="h-2 rounded-full"
                              style={{
                                background: `linear-gradient(to right, #ef4444 0%, #f59e0b 50%, ${confidenceColor} 100%)`
                              }}
                            />
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>Conservative</span>
                              <span>{settings.confidence}%</span>
                              <span>Aggressive</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Preferred tag style</Label>
                            <Select value={settings.tagStyle} onValueChange={(value: any) => updateSetting('tagStyle', value)}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="singular">Singular (tag)</SelectItem>
                                <SelectItem value="plural">Plural (tags)</SelectItem>
                                <SelectItem value="camel">CamelCase (myTag)</SelectItem>
                                <SelectItem value="kebab">kebab-case (my-tag)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="space-y-2">
                            <Label>Language mode</Label>
                            <Select value={settings.languageMode} onValueChange={(value: any) => updateSetting('languageMode', value)}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="detect">Auto-detect</SelectItem>
                                <SelectItem value="english">English only</SelectItem>
                                <SelectItem value="source">Source language</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <Label htmlFor="synonymMapping">Synonym mapping</Label>
                              <p className="text-sm text-muted-foreground">Group related tags together</p>
                            </div>
                            <Switch
                              id="synonymMapping"
                              checked={settings.synonymMapping}
                              onCheckedChange={(checked) => updateSetting('synonymMapping', checked)}
                            />
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div>
                              <Label htmlFor="normalization">Normalization engine</Label>
                              <p className="text-sm text-muted-foreground">Standardize tag formats and remove duplicates</p>
                            </div>
                            <Switch
                              id="normalization"
                              checked={settings.normalization}
                              onCheckedChange={(checked) => updateSetting('normalization', checked)}
                            />
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div>
                              <Label htmlFor="manualReview">Manual review below threshold</Label>
                              <p className="text-sm text-muted-foreground">Queue low-confidence tags for manual approval</p>
                            </div>
                            <Switch
                              id="manualReview"
                              checked={settings.manualReview}
                              onCheckedChange={(checked) => updateSetting('manualReview', checked)}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>

            {/* Filtering & Categorization Panel */}
            <Card>
              <Collapsible open={!filteringCollapsed} onOpenChange={setFilteringCollapsed}>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Folder className="h-5 w-5 text-primary" />
                        <CardTitle>Filtering & Categorization</CardTitle>
                      </div>
                      {filteringCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                    </div>
                    <CardDescription>
                      Configure content filtering, duplicate handling, and smart categorization
                    </CardDescription>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="stripTracking">Strip tracking parameters</Label>
                        <p className="text-sm text-muted-foreground">Remove UTM codes and tracking parameters from URLs</p>
                      </div>
                      <Switch
                        id="stripTracking"
                        checked={settings.stripTracking}
                        onCheckedChange={(checked) => updateSetting('stripTracking', checked)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Domain blacklist</Label>
                      <Textarea
                        placeholder="Enter domains to exclude, one per line..."
                        value={settings.domainBlacklist.join('\n')}
                        onChange={(e) => updateSetting('domainBlacklist', e.target.value.split('\n').filter(d => d.trim()))}
                        className="min-h-20"
                      />
                      <p className="text-sm text-muted-foreground">
                        Links from these domains will be automatically rejected
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="minWordCount">Minimum content length</Label>
                      <div className="flex items-center space-x-4">
                        <Input
                          id="minWordCount"
                          type="number"
                          value={settings.minWordCount}
                          onChange={(e) => updateSetting('minWordCount', parseInt(e.target.value) || 0)}
                          min={0}
                          max={10000}
                          className="w-32"
                        />
                        <span className="text-sm text-muted-foreground">words</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Reject pages with less content than this threshold
                      </p>
                    </div>
                    
                    <div className="space-y-3">
                      <Label>Duplicate handling</Label>
                      <RadioGroup 
                        value={settings.duplicateHandling} 
                        onValueChange={(value: any) => updateSetting('duplicateHandling', value)}
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="skip" id="skip" />
                          <Label htmlFor="skip">Skip - Ignore duplicate URLs</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="overwrite" id="overwrite" />
                          <Label htmlFor="overwrite">Overwrite - Update existing entry</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="keepBoth" id="keepBoth" />
                          <Label htmlFor="keepBoth">Keep both - Allow multiple versions</Label>
                        </div>
                      </RadioGroup>
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="suggestFolder">Suggest folder path</Label>
                          <p className="text-sm text-muted-foreground">AI recommends appropriate folders for new links</p>
                        </div>
                        <Switch
                          id="suggestFolder"
                          checked={settings.suggestFolder}
                          onCheckedChange={(checked) => updateSetting('suggestFolder', checked)}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="autoFile">Auto-file into suggested folder</Label>
                          <p className="text-sm text-muted-foreground">Automatically move links to suggested folders</p>
                        </div>
                        <Switch
                          id="autoFile"
                          checked={settings.autoFile}
                          onCheckedChange={(checked) => updateSetting('autoFile', checked)}
                          disabled={!settings.suggestFolder}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="smartFolderContext">Smart folder context</Label>
                          <p className="text-sm text-muted-foreground">Consider existing folder contents for better suggestions</p>
                        </div>
                        <Switch
                          id="smartFolderContext"
                          checked={settings.smartFolderContext}
                          onCheckedChange={(checked) => updateSetting('smartFolderContext', checked)}
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Fallback folder</Label>
                        <Select value={settings.fallbackFolderId || ''} onValueChange={(value) => updateSetting('fallbackFolderId', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select fallback folder" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="inbox">📥 Inbox</SelectItem>
                            <SelectItem value="unsorted">📂 Unsorted</SelectItem>
                            <SelectItem value="draft">📝 Draft</SelectItem>
                            <SelectItem value="review">👀 Review</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Draft expiration</Label>
                        <Select value={settings.draftExpirationDays.toString()} onValueChange={(value) => updateSetting('draftExpirationDays', parseInt(value))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1 day</SelectItem>
                            <SelectItem value="7">7 days</SelectItem>
                            <SelectItem value="30">30 days</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>

            {/* Rule Builder Panel */}
            <Card>
              <Collapsible open={!rulesCollapsed} onOpenChange={setRulesCollapsed}>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="h-5 w-5 text-primary" />
                        <CardTitle>Rule Builder</CardTitle>
                      </div>
                      {rulesCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                    </div>
                    <CardDescription>
                      Create custom rules for automatic link processing
                    </CardDescription>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">
                        {settings.rules.length} {settings.rules.length === 1 ? 'rule' : 'rules'} configured
                      </p>
                      <Button
                        onClick={() => setRuleModalOpen(true)}
                        size="sm"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Rule
                      </Button>
                    </div>
                    
                    {settings.rules.length > 0 && (
                      <div className="space-y-2">
                        {settings.rules.map((rule) => (
                          <div key={rule.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 text-sm">
                                <Badge variant="outline">IF</Badge>
                                <span className="font-medium">{rule.ifType}</span>
                                <span className="text-muted-foreground">contains</span>
                                <code className="px-1 py-0.5 bg-muted rounded text-xs">{rule.ifValue}</code>
                              </div>
                              <div className="flex items-center space-x-2 text-sm mt-1">
                                <Badge variant="outline">THEN</Badge>
                                {rule.thenActions.map((action, index) => (
                                  <span key={index} className="text-muted-foreground">
                                    {action.type === 'addTag' && `Add tag "${action.value}"`}
                                    {action.type === 'moveFolder' && `Move to folder "${action.folderId}"`}
                                    {action.type === 'setPriority' && `Set priority to ${action.value}`}
                                    {index < rule.thenActions.length - 1 && ', '}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setEditingRule(rule)
                                  setRuleModalOpen(true)
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  const newRules = settings.rules.filter(r => r.id !== rule.id)
                                  updateSetting('rules', newRules)
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>

            {/* Import/Export Section */}
            <Card>
              <CardHeader>
                <CardTitle>Import / Export Settings</CardTitle>
                <CardDescription>
                  Backup or restore your auto-processing configuration
                </CardDescription>
              </CardHeader>
              <CardContent className="flex space-x-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    const dataStr = JSON.stringify(settings, null, 2)
                    const dataBlob = new Blob([dataStr], { type: 'application/json' })
                    const url = URL.createObjectURL(dataBlob)
                    const link = document.createElement('a')
                    link.href = url
                    link.download = `auto-processing-settings-${new Date().toISOString().split('T')[0]}.json`
                    link.click()
                    URL.revokeObjectURL(url)
                    toast.success('Settings exported successfully')
                  }}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export JSON
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    const input = document.createElement('input')
                    input.type = 'file'
                    input.accept = '.json'
                    input.onchange = (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0]
                      if (!file) return
                      
                      const reader = new FileReader()
                      reader.onload = (e) => {
                        try {
                          const importedSettings = JSON.parse(e.target?.result as string)
                          // Validate settings structure here
                          setSettings(importedSettings)
                          toast.success('Settings imported successfully')
                        } catch (error) {
                          toast.error('Invalid settings file')
                        }
                      }
                      reader.readAsText(file)
                    }
                    input.click()
                  }}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Import JSON
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right-hand Widgets */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Tag Cloud Snapshot</CardTitle>
                <CardDescription>Top tags from the past 7 days</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={tagCloudData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {tagCloudData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-background border rounded-lg p-2 shadow-lg">
                                <p className="font-medium">{payload[0].payload.name}</p>
                                <p className="text-sm text-muted-foreground">{payload[0].value} links</p>
                              </div>
                            )
                          }
                          return null
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2 mt-4">
                  {tagCloudData.map((tag, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: tag.color }}
                        />
                        <span>{tag.name}</span>
                      </div>
                      <span className="text-muted-foreground">{tag.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* History Drawer */}
        <Drawer open={historyDrawerOpen} onOpenChange={setHistoryDrawerOpen}>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Processing History</DrawerTitle>
            </DrawerHeader>
            <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
              {historyItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Checkbox />
                    <div>
                      <p className="font-medium">{item.action}</p>
                      <p className="text-sm text-muted-foreground">{item.details}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.timestamp.toLocaleString()} • {item.user}
                      </p>
                    </div>
                  </div>
                  {item.undoable && (
                    <Button variant="outline" size="sm">
                      Undo
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </DrawerContent>
        </Drawer>

        {/* Rule Builder Modal */}
        <RuleBuilderModal
          open={ruleModalOpen}
          onOpenChange={setRuleModalOpen}
          rule={editingRule}
          onSave={(rule) => {
            if (editingRule) {
              // Edit existing rule
              const newRules = settings.rules.map(r => r.id === rule.id ? rule : r)
              updateSetting('rules', newRules)
            } else {
              // Add new rule
              const newRules = [...settings.rules, { ...rule, id: Date.now().toString() }]
              updateSetting('rules', newRules)
            }
            setEditingRule(null)
            setRuleModalOpen(false)
          }}
          onCancel={() => {
            setEditingRule(null)
            setRuleModalOpen(false)
          }}
        />
      </div>
    </TooltipProvider>
  )
}

// Rule Builder Modal Component
interface RuleBuilderModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  rule: Rule | null
  onSave: (rule: Rule) => void
  onCancel: () => void
}

function RuleBuilderModal({ open, onOpenChange, rule, onSave, onCancel }: RuleBuilderModalProps) {
  const [ifType, setIfType] = useState<Rule['ifType']>('domain')
  const [ifValue, setIfValue] = useState('')
  const [thenActions, setThenActions] = useState<Rule['thenActions']>([])

  useEffect(() => {
    if (rule) {
      setIfType(rule.ifType)
      setIfValue(rule.ifValue)
      setThenActions(rule.thenActions)
    } else {
      setIfType('domain')
      setIfValue('')
      setThenActions([])
    }
  }, [rule])

  const addAction = () => {
    setThenActions([...thenActions, { type: 'addTag', value: '' }])
  }

  const updateAction = (index: number, action: Rule['thenActions'][0]) => {
    const newActions = [...thenActions]
    newActions[index] = action
    setThenActions(newActions)
  }

  const removeAction = (index: number) => {
    setThenActions(thenActions.filter((_, i) => i !== index))
  }

  const handleSave = () => {
    if (!ifValue.trim() || thenActions.length === 0) {
      toast.error('Please fill in all required fields')
      return
    }

    const ruleToSave: Rule = {
      id: rule?.id || '',
      ifType,
      ifValue: ifValue.trim(),
      thenActions: thenActions.filter(action => {
        if (action.type === 'moveFolder') {
          return action.folderId?.trim()
        }
        return action.value?.trim()
      })
    }

    onSave(ruleToSave)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{rule ? 'Edit Rule' : 'Create New Rule'}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* IF Condition */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Badge>IF</Badge>
              <span className="text-sm text-muted-foreground">When a link matches this condition</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Condition type</Label>
                <Select value={ifType} onValueChange={(value: any) => setIfType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="domain">Domain contains</SelectItem>
                    <SelectItem value="tag">Has tag</SelectItem>
                    <SelectItem value="urlRegex">URL matches regex</SelectItem>
                    <SelectItem value="content">Content contains</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Value</Label>
                <Input
                  value={ifValue}
                  onChange={(e) => setIfValue(e.target.value)}
                  placeholder={
                    ifType === 'domain' ? 'example.com' :
                    ifType === 'tag' ? 'technology' :
                    ifType === 'urlRegex' ? '.*github.*' :
                    'keyword'
                  }
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* THEN Actions */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Badge>THEN</Badge>
                <span className="text-sm text-muted-foreground">Perform these actions</span>
              </div>
              <Button variant="outline" size="sm" onClick={addAction}>
                <Plus className="h-4 w-4 mr-2" />
                Add Action
              </Button>
            </div>
            
            {thenActions.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <p>No actions configured</p>
                <p className="text-sm">Click "Add Action" to get started</p>
              </div>
            )}
            
            <div className="space-y-3">
              {thenActions.map((action, index) => (
                <div key={index} className="flex items-center space-x-2 p-3 border rounded-lg">
                  <Select 
                    value={action.type} 
                    onValueChange={(type: any) => updateAction(index, { ...action, type })}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="addTag">Add tag</SelectItem>
                      <SelectItem value="moveFolder">Move to folder</SelectItem>
                      <SelectItem value="setPriority">Set priority</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  {action.type === 'addTag' && (
                    <Input
                      value={action.value}
                      onChange={(e) => updateAction(index, { ...action, value: e.target.value })}
                      placeholder="Tag name"
                      className="flex-1"
                    />
                  )}
                  
                  {action.type === 'moveFolder' && (
                    <Select 
                      value={action.folderId || action.value} 
                      onValueChange={(value) => updateAction(index, { ...action, folderId: value, value })}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select folder" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="inbox">📥 Inbox</SelectItem>
                        <SelectItem value="work">💼 Work</SelectItem>
                        <SelectItem value="personal">👤 Personal</SelectItem>
                        <SelectItem value="archive">📦 Archive</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                  
                  {action.type === 'setPriority' && (
                    <Select 
                      value={action.value} 
                      onValueChange={(value: any) => updateAction(index, { ...action, value })}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="high">🔴 High</SelectItem>
                        <SelectItem value="normal">🟡 Normal</SelectItem>
                        <SelectItem value="low">🟢 Low</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeAction(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            {rule ? 'Update Rule' : 'Create Rule'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}      