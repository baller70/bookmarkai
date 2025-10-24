'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Textarea } from '../ui/textarea'
import { Badge } from '../ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog'
import { Calendar } from '../ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import { Progress } from '../ui/progress'
import { Switch } from '../ui/switch'
import { 
  Clock,
  Calendar as CalendarIcon,
  Archive,
  Unlock,
  Lock,
  Star,
  Bookmark,
  Eye,
  Share,
  Download,
  Upload,
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  SortAsc,
  SortDesc,
  Grid3X3,
  List,
  MoreHorizontal,
  ChevronDown,
  X,
  RefreshCw,
  Bell,
  BellOff,
  Timer,
  Hourglass,
  Sparkles,
  Brain,
  Target,
  Zap,
  History,
  Gift,
  Package,
  Mail,
  MessageSquare,
  Heart,
  Lightbulb,
  Rocket,
  RotateCcw,
  Camera,
  GitCompare,
  Folder as FolderIcon,
  Tag
} from 'lucide-react'
import { toast } from 'sonner'

// Use existing date formatter
const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

interface TimeCapsule {
  id: string
  name: string
  description: string
  createdAt: Date
  type: 'manual' | 'scheduled' | 'auto'
  status: 'active' | 'archived' | 'scheduled'
  size: number
  bookmarkCount: number
  folderCount: number
  tagCount: number
  metadata: {
    totalVisits: number
    avgRating: number
    topCategories: string[]
    createdBy: string
  }
  changes?: {
    added: number
    removed: number
    modified: number
  }
  aiSummary?: string
  schedule?: {
    frequency: 'daily' | 'weekly' | 'monthly'
    nextRun: Date
    enabled: boolean
  }
}

interface CapsuleComparison {
  from: TimeCapsule
  to: TimeCapsule
  differences: {
    bookmarksAdded: Array<{ title: string; url: string; date: Date }>
    bookmarksRemoved: Array<{ title: string; url: string; date: Date }>
    bookmarksModified: Array<{ title: string; url: string; changes: string[] }>
    foldersChanged: Array<{ name: string; action: 'added' | 'removed' | 'renamed' }>
    tagsChanged: Array<{ name: string; action: 'added' | 'removed' }>
  }
}

const mockCapsules: TimeCapsule[] = [
  {
    id: '1',
    name: 'Q4 2024 Development Resources',
    description: 'Snapshot of all development-related bookmarks at the end of Q4',
    createdAt: (() => new Date('2024-01-20'))(),
    type: 'manual',
    status: 'active',
    size: 15.6,
    bookmarkCount: 1247,
    folderCount: 12,
    tagCount: 89,
    metadata: {
      totalVisits: 8934,
      avgRating: 4.2,
      topCategories: ['Development', 'Design', 'Tools'],
      createdBy: 'John Doe'
    },
    changes: {
      added: 23,
      removed: 5,
      modified: 12
    },
    aiSummary: 'This snapshot captures a significant expansion in React and TypeScript resources, with notable additions in AI/ML tooling and design systems. The collection shows a 18% growth in development bookmarks with improved organization.'
  },
  {
    id: '2',
    name: 'Weekly Auto-Backup',
    description: 'Automated weekly snapshot',
    createdAt: new Date('2024-01-15'),
    type: 'scheduled',
    status: 'active',
    size: 14.2,
    bookmarkCount: 1189,
    folderCount: 11,
    tagCount: 82,
    metadata: {
      totalVisits: 8456,
      avgRating: 4.1,
      topCategories: ['Development', 'Research', 'Design'],
      createdBy: 'System'
    },
    schedule: {
      frequency: 'weekly',
      nextRun: new Date('2024-01-27'),
      enabled: true
    },
    aiSummary: 'Steady growth period with focus on research materials. Notable increase in bookmark organization and tagging activity.'
  },
  {
    id: '3',
    name: 'Pre-Migration Backup',
    description: 'Backup before major system migration',
    createdAt: new Date('2024-01-01'),
    type: 'manual',
    status: 'archived',
    size: 12.8,
    bookmarkCount: 1098,
    folderCount: 10,
    tagCount: 76,
    metadata: {
      totalVisits: 7234,
      avgRating: 3.9,
      topCategories: ['Development', 'Tools', 'Learning'],
      createdBy: 'John Doe'
    },
    aiSummary: 'Baseline snapshot showing established bookmark collection with strong development focus. Good foundation for future growth tracking.'
  }
]

export default function DnaTimeCapsule() {
  const [capsules, setCapsules] = useState<TimeCapsule[]>(mockCapsules)
  const [selectedCapsule, setSelectedCapsule] = useState<TimeCapsule | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showCompareDialog, setShowCompareDialog] = useState(false)
  const [showScheduleDialog, setShowScheduleDialog] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('list')
  const [compareFrom, setCompareFrom] = useState<string>('')
  const [compareTo, setCompareTo] = useState<string>('')
  
  const [newCapsule, setNewCapsule] = useState({
    name: '',
    description: '',
    type: 'manual' as const,
    includeSettings: true,
    includeAnalytics: false
  })

  const [scheduleSettings, setScheduleSettings] = useState({
    frequency: 'weekly' as const,
    enabled: true,
    maxCapsules: 10,
    autoCleanup: true
  })

  const handleCreateCapsule = () => {
    const now = (() => new Date())()
    const capsule: TimeCapsule = {
      id: `capsule-${now.getTime()}`,
      ...newCapsule,
      createdAt: now,
      status: 'active',
      size: 15.5, // Fixed value to prevent hydration mismatch
      bookmarkCount: 1247,
      folderCount: 12,
      tagCount: 89,
      metadata: {
        totalVisits: 8934,
        avgRating: 4.2,
        topCategories: ['Development', 'Design', 'Tools'],
        createdBy: 'John Doe'
      },
      aiSummary: 'New snapshot created with current bookmark collection state. AI analysis will be available shortly.'
    }
    
    setCapsules(prev => [capsule, ...prev])
    setShowCreateDialog(false)
    setNewCapsule({
      name: '',
      description: '',
      type: 'manual',
      includeSettings: true,
      includeAnalytics: false
    })
    toast.success('Time capsule created successfully!')
  }

  const handleRestore = (capsule: TimeCapsule) => {
    toast.loading('Restoring from time capsule...')
    setTimeout(() => {
      toast.success(`Successfully restored ${capsule.bookmarkCount} bookmarks from "${capsule.name}"`)
    }, 2000)
  }

  const handleCompare = () => {
    if (!compareFrom || !compareTo) {
      toast.error('Please select two capsules to compare')
      return
    }
    
    toast.success('Comparison generated successfully!')
    setShowCompareDialog(false)
  }

  const handleScheduleUpdate = () => {
    toast.success('Schedule settings updated successfully!')
    setShowScheduleDialog(false)
  }

  const CapsuleCard = ({ capsule }: { capsule: TimeCapsule }) => (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedCapsule(capsule)}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${
              capsule.status === 'active' ? 'bg-green-500' : 
              capsule.status === 'scheduled' ? 'bg-blue-500' : 'bg-gray-400'
            }`} />
            <h3 className="font-medium text-sm">{capsule.name}</h3>
          </div>
          <Badge variant={capsule.type === 'manual' ? 'default' : 'secondary'}>
            {capsule.type}
          </Badge>
        </div>
        
        <p className="text-xs text-gray-600 mb-3 line-clamp-2">{capsule.description}</p>
        
        <div className="grid grid-cols-3 gap-2 text-xs text-gray-500 mb-3">
          <div className="flex items-center">
            <Bookmark className="h-3 w-3 mr-1" />
            {capsule.bookmarkCount}
          </div>
          <div className="flex items-center">
                                    <FolderIcon className="h-3 w-3 mr-1" />
            {capsule.folderCount}
          </div>
          <div className="flex items-center">
            <Tag className="h-3 w-3 mr-1" />
            {capsule.tagCount}
          </div>
        </div>
        
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-600">{capsule.size.toFixed(1)} MB</span>
          <span className="text-gray-600">{capsule.createdAt.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
          })}</span>
        </div>
        
        {capsule.changes && (
          <div className="flex items-center space-x-2 mt-2 pt-2 border-t">
            <Badge variant="outline" className="text-xs">
              <Plus className="h-3 w-3 mr-1" />
              {capsule.changes.added}
            </Badge>
            <Badge variant="outline" className="text-xs">
              <Edit className="h-3 w-3 mr-1" />
              {capsule.changes.modified}
            </Badge>
            {capsule.changes.removed > 0 && (
              <Badge variant="outline" className="text-xs">
                <Trash2 className="h-3 w-3 mr-1" />
                {capsule.changes.removed}
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )

  const CapsuleCalendar = () => {
    const capsulesOnDate = capsules.filter(capsule => 
      capsule.createdAt.toDateString() === selectedDate?.toDateString()
    )

    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Calendar View</CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="rounded-md border"
            />
          </CardContent>
        </Card>
        
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">
              Capsules on {selectedDate?.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {capsulesOnDate.length > 0 ? (
              <div className="space-y-3">
                {capsulesOnDate.map(capsule => (
                  <CapsuleCard key={capsule.id} capsule={capsule} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No capsules created on this date</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Time Capsule</h2>
          <p className="text-gray-600">Versioned snapshots of your bookmark collection</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => setShowScheduleDialog(true)}>
            <Timer className="h-4 w-4 mr-2" />
            Schedule
          </Button>
                          <Button variant="outline" onClick={() => setShowCompareDialog(true)}>
                  <GitCompare className="h-4 w-4 mr-2" />
                  Compare
          </Button>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Camera className="h-4 w-4 mr-2" />
            Create Snapshot
          </Button>
        </div>
      </div>

      {/* View Toggle */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium">View:</span>
              <div className="flex items-center border rounded-md">
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <History className="h-4 w-4 mr-2" />
                  List
                </Button>
                <Button
                  variant={viewMode === 'calendar' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('calendar')}
                >
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  Calendar
                </Button>
              </div>
            </div>
            
            <div className="text-sm text-gray-600">
              {capsules.length} capsules • {capsules.reduce((acc, c) => acc + c.size, 0).toFixed(1)} MB total
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content */}
      {viewMode === 'calendar' ? (
        <CapsuleCalendar />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Capsules List */}
          <div className="lg:col-span-2 space-y-4">
            {capsules.map(capsule => (
              <CapsuleCard key={capsule.id} capsule={capsule} />
            ))}
          </div>

          {/* Details Panel */}
          <div className="lg:col-span-1">
            {selectedCapsule ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="truncate">{selectedCapsule.name}</span>
                    <Badge variant={selectedCapsule.type === 'manual' ? 'default' : 'secondary'}>
                      {selectedCapsule.type}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Description</h4>
                    <p className="text-sm text-gray-600">{selectedCapsule.description}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <h4 className="font-medium mb-1">Created</h4>
                      <p className="text-gray-600">{selectedCapsule.createdAt.toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</p>
                    </div>
                    <div>
                      <h4 className="font-medium mb-1">Size</h4>
                      <p className="text-gray-600">{selectedCapsule.size.toFixed(1)} MB</p>
                    </div>
                    <div>
                      <h4 className="font-medium mb-1">Bookmarks</h4>
                      <p className="text-gray-600">{selectedCapsule.bookmarkCount}</p>
                    </div>
                    <div>
                      <h4 className="font-medium mb-1">Folders</h4>
                      <p className="text-gray-600">{selectedCapsule.folderCount}</p>
                    </div>
                  </div>

                  {selectedCapsule.aiSummary && (
                    <div>
                      <h4 className="font-medium mb-2 flex items-center">
                        <Star className="h-4 w-4 mr-1 text-purple-500" />
                        AI Summary
                      </h4>
                      <p className="text-sm text-gray-600 bg-purple-50 p-3 rounded-lg">
                        {selectedCapsule.aiSummary}
                      </p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Button className="w-full" onClick={() => handleRestore(selectedCapsule)}>
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Restore
                    </Button>
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Export
                      </Button>
                      <Button variant="outline" size="sm">
                        <Share className="h-4 w-4 mr-2" />
                        Share
                      </Button>
                    </div>
                  </div>

                  {selectedCapsule.schedule && (
                    <div className="pt-4 border-t">
                      <h4 className="font-medium mb-2">Schedule</h4>
                      <div className="text-sm space-y-1">
                        <p className="text-gray-600">
                          Frequency: {selectedCapsule.schedule.frequency}
                        </p>
                        <p className="text-gray-600">
                          Next run: {selectedCapsule.schedule.nextRun.toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                        </p>
                        <p className="text-gray-600">
                          Status: {selectedCapsule.schedule.enabled ? 'Enabled' : 'Disabled'}
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Capsule</h3>
                  <p className="text-gray-600">Choose a time capsule to view details</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Create Capsule Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Camera className="h-5 w-5 mr-2" />
              Create Time Capsule
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Name</label>
              <Input
                placeholder="Q1 2024 Snapshot"
                value={newCapsule.name}
                onChange={(e) => setNewCapsule(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Description</label>
              <Textarea
                placeholder="Describe this snapshot..."
                value={newCapsule.description}
                onChange={(e) => setNewCapsule(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Include settings</label>
                <Switch
                  checked={newCapsule.includeSettings}
                  onCheckedChange={(checked) => setNewCapsule(prev => ({ ...prev, includeSettings: checked }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Include analytics</label>
                <Switch
                  checked={newCapsule.includeAnalytics}
                  onCheckedChange={(checked) => setNewCapsule(prev => ({ ...prev, includeAnalytics: checked }))}
                />
              </div>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateCapsule} disabled={!newCapsule.name.trim()}>
                Create Capsule
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Compare Dialog */}
      <Dialog open={showCompareDialog} onOpenChange={setShowCompareDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <GitCompare className="h-5 w-5 mr-2" />
              Compare Capsules
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">From</label>
              <Select value={compareFrom} onValueChange={setCompareFrom}>
                <SelectTrigger>
                  <SelectValue placeholder="Select first capsule" />
                </SelectTrigger>
                <SelectContent>
                  {capsules.map(capsule => (
                    <SelectItem key={capsule.id} value={capsule.id}>
                      {capsule.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">To</label>
              <Select value={compareTo} onValueChange={setCompareTo}>
                <SelectTrigger>
                  <SelectValue placeholder="Select second capsule" />
                </SelectTrigger>
                <SelectContent>
                  {capsules.map(capsule => (
                    <SelectItem key={capsule.id} value={capsule.id}>
                      {capsule.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => setShowCompareDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCompare}>
                Compare
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Schedule Dialog */}
      <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Timer className="h-5 w-5 mr-2" />
              Schedule Settings
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Frequency</label>
              <Select value={scheduleSettings.frequency} onValueChange={(value: any) => setScheduleSettings(prev => ({ ...prev, frequency: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Max Capsules</label>
              <Input
                type="number"
                value={scheduleSettings.maxCapsules}
                onChange={(e) => setScheduleSettings(prev => ({ ...prev, maxCapsules: parseInt(e.target.value) }))}
              />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Enable automatic snapshots</label>
                <Switch
                  checked={scheduleSettings.enabled}
                  onCheckedChange={(checked) => setScheduleSettings(prev => ({ ...prev, enabled: checked }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Auto cleanup old capsules</label>
                <Switch
                  checked={scheduleSettings.autoCleanup}
                  onCheckedChange={(checked) => setScheduleSettings(prev => ({ ...prev, autoCleanup: checked }))}
                />
              </div>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => setShowScheduleDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleScheduleUpdate}>
                Save Settings
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 