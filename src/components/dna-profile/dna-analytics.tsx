'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog'
import { Progress } from '../ui/progress'
import { 
  BarChart3,
  TrendingUp,
  TrendingDown,
  Eye,
  Bookmark,
  Clock,
  Star,
  Target,
  Zap,
  Brain,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Calendar,
  Download,
  Share,
  RefreshCw,
  Filter,
  Sparkles,
  Activity,
  PieChart,
  LineChart,
  Users,
  Globe,
  Folder,
  Tag,
  Heart,
  MousePointer,
  Timer,
  Database,
  Shield,
  Gauge
} from 'lucide-react'
import { toast } from 'sonner'

interface AnalyticsData {
  overview: {
    totalBookmarks: number
    totalVisits: number
    avgRating: number
    engagementScore: number
    growthRate: number
    activeTime: number
  }
  trends: {
    bookmarksOverTime: Array<{ date: string; count: number }>
    visitsOverTime: Array<{ date: string; count: number }>
    topCategories: Array<{ name: string; count: number; percentage: number }>
    topDomains: Array<{ domain: string; count: number; visits: number }>
  }
  behavior: {
    mostActiveHours: Array<{ hour: number; activity: number }>
    averageSessionTime: number
    bookmarkingPatterns: Array<{ day: string; count: number }>
    searchQueries: Array<{ query: string; count: number; success: number }>
  }
  health: {
    duplicates: number
    brokenLinks: number
    untagged: number
    unused: number
    lastBackup: Date
    storageUsed: number
    storageLimit: number
  }
}

const mockAnalytics: AnalyticsData = {
  overview: {
    totalBookmarks: 1247,
    totalVisits: 8934,
    avgRating: 4.2,
    engagementScore: 87,
    growthRate: 12.5,
    activeTime: 156
  },
  trends: {
    bookmarksOverTime: [
      { date: '2024-01-01', count: 1200 },
      { date: '2024-01-07', count: 1215 },
      { date: '2024-01-14', count: 1230 },
      { date: '2024-01-21', count: 1247 }
    ],
    visitsOverTime: [
      { date: '2024-01-01', count: 8500 },
      { date: '2024-01-07', count: 8650 },
      { date: '2024-01-14', count: 8800 },
      { date: '2024-01-21', count: 8934 }
    ],
    topCategories: [
      { name: 'Development', count: 456, percentage: 36.6 },
      { name: 'Design', count: 234, percentage: 18.8 },
      { name: 'Research', count: 189, percentage: 15.2 },
      { name: 'Tools', count: 156, percentage: 12.5 },
      { name: 'Learning', count: 212, percentage: 17.0 }
    ],
    topDomains: [
      { domain: 'github.com', count: 89, visits: 1234 },
      { domain: 'stackoverflow.com', count: 67, visits: 987 },
      { domain: 'medium.com', count: 45, visits: 654 },
      { domain: 'dev.to', count: 34, visits: 432 }
    ]
  },
  behavior: {
    mostActiveHours: [
      { hour: 9, activity: 85 },
      { hour: 10, activity: 92 },
      { hour: 11, activity: 78 },
      { hour: 14, activity: 88 },
      { hour: 15, activity: 95 },
      { hour: 16, activity: 82 }
    ],
    averageSessionTime: 24,
    bookmarkingPatterns: [
      { day: 'Mon', count: 45 },
      { day: 'Tue', count: 52 },
      { day: 'Wed', count: 38 },
      { day: 'Thu', count: 61 },
      { day: 'Fri', count: 47 }
    ],
    searchQueries: [
      { query: 'React hooks', count: 23, success: 89 },
      { query: 'TypeScript tutorial', count: 18, success: 94 },
      { query: 'CSS flexbox', count: 15, success: 76 },
      { query: 'JavaScript async', count: 12, success: 82 }
    ]
  },
  health: {
    duplicates: 12,
    brokenLinks: 8,
    untagged: 34,
    unused: 156,
    lastBackup: new Date('2024-01-20'),
    storageUsed: 2.4,
    storageLimit: 10
  }
}

export default function DnaAnalytics() {
  const [analytics] = useState<AnalyticsData>(mockAnalytics)
  const [dateRange, setDateRange] = useState('30d')
  const [showAIInsights, setShowAIInsights] = useState(false)
  const [showExportDialog, setShowExportDialog] = useState(false)
  const [selectedTab, setSelectedTab] = useState('overview')

  const aiInsights = [
    {
      type: 'trend',
      title: 'Peak Productivity Hours',
      description: 'You\'re most active between 2-4 PM. Consider scheduling important research during this time.',
      confidence: 92,
      action: 'Set reminder for peak hours'
    },
    {
      type: 'optimization',
      title: 'Duplicate Content Detected',
      description: '12 duplicate bookmarks found. Cleaning these up could improve your search efficiency.',
      confidence: 88,
      action: 'Auto-merge duplicates'
    },
    {
      type: 'recommendation',
      title: 'Tagging Improvement',
      description: '34 untagged bookmarks. Adding tags would improve AI recommendations by 23%.',
      confidence: 85,
      action: 'Auto-tag with AI'
    }
  ]

  const healthChecks = [
    { name: 'Broken Links', status: 'warning', count: analytics.health.brokenLinks, total: analytics.overview.totalBookmarks },
    { name: 'Duplicates', status: 'warning', count: analytics.health.duplicates, total: analytics.overview.totalBookmarks },
    { name: 'Untagged', status: 'error', count: analytics.health.untagged, total: analytics.overview.totalBookmarks },
    { name: 'Unused (90+ days)', status: 'info', count: analytics.health.unused, total: analytics.overview.totalBookmarks }
  ]

  const handleExport = (format: string) => {
    toast.loading(`Exporting analytics as ${format.toUpperCase()}...`)
    setTimeout(() => {
      toast.success(`Analytics exported successfully as ${format.toUpperCase()}`)
      setShowExportDialog(false)
    }, 1500)
  }

  const handleAIAction = (action: string) => {
    toast.loading(`AI is ${action}...`)
    setTimeout(() => {
      toast.success(`${action} completed successfully!`)
    }, 2000)
  }

  const MetricCard = ({ title, value, change, icon: Icon, trend }: any) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {change && (
              <div className={`flex items-center text-sm ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                {trend === 'up' ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
                {change}
              </div>
            )}
          </div>
          <Icon className="h-8 w-8 text-blue-500" />
        </div>
      </CardContent>
    </Card>
  )

  const CategoryChart = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <PieChart className="h-5 w-5 mr-2" />
          Top Categories
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {analytics.trends.topCategories.map((category, index) => (
            <div key={category.name} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{category.name}</span>
                <span className="text-sm text-gray-600">{category.count} ({category.percentage}%)</span>
              </div>
              <Progress value={category.percentage} className="h-2" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )

  const ActivityChart = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Activity className="h-5 w-5 mr-2" />
          Activity by Hour
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {analytics.behavior.mostActiveHours.map((hour) => (
            <div key={hour.hour} className="flex items-center space-x-3">
              <span className="text-sm font-medium w-12">{hour.hour}:00</span>
              <div className="flex-1">
                <Progress value={hour.activity} className="h-2" />
              </div>
              <span className="text-sm text-gray-600">{hour.activity}%</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )

  const HealthStatus = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Shield className="h-5 w-5 mr-2" />
          Health Check
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {healthChecks.map((check) => (
            <div key={check.name} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                {check.status === 'error' ? (
                  <XCircle className="h-5 w-5 text-red-500" />
                ) : check.status === 'warning' ? (
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                ) : (
                  <CheckCircle className="h-5 w-5 text-blue-500" />
                )}
                <div>
                  <h4 className="font-medium text-sm">{check.name}</h4>
                  <p className="text-xs text-gray-600">
                    {check.count} of {check.total} items
                  </p>
                </div>
              </div>
              <Badge 
                variant={check.status === 'error' ? 'destructive' : check.status === 'warning' ? 'secondary' : 'outline'}
              >
                {check.count}
              </Badge>
            </div>
          ))}
          
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Storage Used</span>
              <span className="text-sm text-gray-600">
                {analytics.health.storageUsed}GB / {analytics.health.storageLimit}GB
              </span>
            </div>
            <Progress value={(analytics.health.storageUsed / analytics.health.storageLimit) * 100} className="h-2" />
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Analytics</h2>
          <p className="text-gray-600">Insights into your bookmark behavior</p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => setShowAIInsights(true)}>
            <Sparkles className="h-4 w-4 mr-2" />
            AI Insights
          </Button>
          <Button variant="outline" onClick={() => setShowExportDialog(true)}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="behavior">Behavior</TabsTrigger>
          <TabsTrigger value="health">Health</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard
              title="Total Bookmarks"
              value={analytics.overview.totalBookmarks.toLocaleString()}
              change="+12.5%"
              trend="up"
              icon={Bookmark}
            />
            <MetricCard
              title="Total Visits"
              value={analytics.overview.totalVisits.toLocaleString()}
              change="+8.3%"
              trend="up"
              icon={Eye}
            />
            <MetricCard
              title="Avg Rating"
              value={`${analytics.overview.avgRating}/5`}
              change="+0.2"
              trend="up"
              icon={Star}
            />
            <MetricCard
              title="Engagement Score"
              value={`${analytics.overview.engagementScore}%`}
              change="+5.1%"
              trend="up"
              icon={Target}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <CategoryChart />
            <ActivityChart />
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <LineChart className="h-5 w-5 mr-2" />
                Bookmark Growth
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center text-gray-500">
                <BarChart3 className="h-12 w-12 mr-4" />
                <span>Interactive chart would be rendered here</span>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Globe className="h-5 w-5 mr-2" />
                  Top Domains
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.trends.topDomains.map((domain, index) => (
                    <div key={domain.domain} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="text-sm font-medium">{index + 1}</span>
                        <div>
                          <h4 className="font-medium text-sm">{domain.domain}</h4>
                          <p className="text-xs text-gray-600">{domain.visits} visits</p>
                        </div>
                      </div>
                      <Badge variant="secondary">{domain.count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  Weekly Pattern
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.behavior.bookmarkingPatterns.map((day) => (
                    <div key={day.day} className="flex items-center space-x-3">
                      <span className="text-sm font-medium w-8">{day.day}</span>
                      <div className="flex-1">
                        <Progress value={(day.count / 70) * 100} className="h-2" />
                      </div>
                      <span className="text-sm text-gray-600">{day.count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="behavior" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Timer className="h-5 w-5 mr-2" />
                  Session Analytics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Average Session Time</span>
                    <span className="text-sm text-gray-600">{analytics.behavior.averageSessionTime} min</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Sessions This Week</span>
                    <span className="text-sm text-gray-600">23</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Total Active Time</span>
                    <span className="text-sm text-gray-600">{analytics.overview.activeTime} hours</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MousePointer className="h-5 w-5 mr-2" />
                  Search Queries
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.behavior.searchQueries.map((query, index) => (
                    <div key={query.query} className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-sm">{query.query}</h4>
                        <p className="text-xs text-gray-600">{query.success}% success rate</p>
                      </div>
                      <Badge variant="secondary">{query.count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <ActivityChart />
        </TabsContent>

        <TabsContent value="health" className="space-y-6">
          <HealthStatus />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Database className="h-5 w-5 mr-2" />
                  Data Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Last Backup</span>
                    <span className="text-sm text-gray-600">
                      {analytics.health.lastBackup.toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Auto-backup</span>
                    <Badge variant="outline">Enabled</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Sync Status</span>
                    <Badge variant="outline">Up to date</Badge>
                  </div>
                  <Button className="w-full" variant="outline">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Force Backup Now
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Gauge className="h-5 w-5 mr-2" />
                  Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Search Speed</span>
                      <span className="text-sm text-gray-600">0.3s avg</span>
                    </div>
                    <Progress value={85} className="h-2" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Load Time</span>
                      <span className="text-sm text-gray-600">1.2s avg</span>
                    </div>
                    <Progress value={75} className="h-2" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Sync Speed</span>
                      <span className="text-sm text-gray-600">2.1s avg</span>
                    </div>
                    <Progress value={90} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* AI Insights Dialog */}
      <Dialog open={showAIInsights} onOpenChange={setShowAIInsights}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Sparkles className="h-5 w-5 mr-2 text-purple-500" />
              AI Insights & Recommendations
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {aiInsights.map((insight, index) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <Brain className="h-5 w-5 text-purple-500" />
                      <h4 className="font-medium">{insight.title}</h4>
                    </div>
                    <Badge variant="secondary">{insight.confidence}% confidence</Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{insight.description}</p>
                  <Button 
                    size="sm" 
                    onClick={() => handleAIAction(insight.action)}
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    {insight.action}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Export Dialog */}
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Download className="h-5 w-5 mr-2" />
              Export Analytics
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Choose the format for your analytics export:
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" onClick={() => handleExport('pdf')}>
                PDF Report
              </Button>
              <Button variant="outline" onClick={() => handleExport('csv')}>
                CSV Data
              </Button>
              <Button variant="outline" onClick={() => handleExport('json')}>
                JSON Export
              </Button>
              <Button variant="outline" onClick={() => handleExport('xlsx')}>
                Excel File
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 