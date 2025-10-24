// @ts-nocheck
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAnalytics, useRealtimeAnalytics } from '../../hooks/useAnalytics'
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  Star,
  Bookmark,
  Eye,
  Activity,
  ArrowUp,
  ArrowDown,
  Calendar,
  Target,
  Users,
  Trash2,
  Lightbulb,
  Timer,
  FolderOpen,
  Tag,
  AlertTriangle,
  Zap,
  Sun
} from 'lucide-react'

interface AnalyticsData {
  overview: {
    totalBookmarks: number
    totalVisits: number
    engagementScore: number
    growthRate: number
    timeSpent: number
    productivityScore: number
  }
  timeTracking: {
    dailyAverage: number
    weeklyPattern: { day: string; hours: number }[]
    peakHours: { hour: string; productivity: number }[]
    totalHours: number
  }
  bookmarkInsights: {
    topPerformers: { name: string; visits: number; timeSpent: number; productivity: number }[]
    underperformers: { name: string; visits: number; lastVisited: string; category: string }[]
    unusedBookmarks: { name: string; daysUnused: number; category: string }[]
  }
  categoryAnalysis: {
    categories: { name: string; efficiency: number; timeSpent: number; bookmarkCount: number }[]
    productivityByCategory: { category: string; score: number }[]
  }
  projectManagement: {
    activeProjects: { name: string; progress: number; deadline: string; status: string }[]
    resourceAllocation: { resource: string; utilization: number }[]
  }
  smartRecommendations: {
    cleanup: { type: string; count: number; impact: string }[]
    optimization: { suggestion: string; benefit: string; effort: string }[]
    trending: { item: string; growth: number; category: string }[]
  }
}

export function ComprehensiveAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d')

  useEffect(() => {
    loadAnalyticsData()
  }, [timeRange])

  const loadAnalyticsData = async () => {
    setLoading(true)
    try {
      // Fetch live summary to override hardcoded overview values
      let summary = { totalBookmarks: 0, totalVisits: 0, engagementScore: 0, totalTimeSpentMinutes: 0 }
      try {
        const res = await fetch('/api/analytics/summary', { cache: 'no-store' })
        if (res.ok) {
          const data = await res.json()
          summary = {
            totalBookmarks: Number(data.totalBookmarks) || 0,
            totalVisits: Number(data.totalVisits) || 0,
            engagementScore: Number(data.engagementScore) || 0,
            totalTimeSpentMinutes: Number(data.totalTimeSpentMinutes) || 0,
          }
        }
      } catch {}

      // Mock comprehensive analytics data (kept for layout), but override overview from API
      const mockData: AnalyticsData = {
        overview: {
          totalBookmarks: summary.totalBookmarks,
          totalVisits: summary.totalVisits,
          engagementScore: summary.engagementScore,
          growthRate: 0,
          timeSpent: Number((summary.totalTimeSpentMinutes / 60).toFixed(1)) || 0,
          productivityScore: 0
        },
        timeTracking: {
          dailyAverage: 0,
          weeklyPattern: [
            { day: 'Mon', hours: 0 },
            { day: 'Tue', hours: 0 },
            { day: 'Wed', hours: 0 },
            { day: 'Thu', hours: 0 },
            { day: 'Fri', hours: 0 },
            { day: 'Sat', hours: 0 },
            { day: 'Sun', hours: 0 }
          ],
          peakHours: [
            { hour: '9-10 AM', productivity: 0 },
            { hour: '2-3 PM', productivity: 0 },
            { hour: '10-11 AM', productivity: 0 }
          ],
          totalHours: Number((summary.totalTimeSpentMinutes / 60).toFixed(1)) || 0
        },
        bookmarkInsights: {
          topPerformers: [],
          underperformers: [],
          unusedBookmarks: []
        },
        categoryAnalysis: {
          categories: [],
          productivityByCategory: []
        },
        projectManagement: {
          activeProjects: [],
          resourceAllocation: []
        },
        smartRecommendations: {
          cleanup: [],
          optimization: [],
          trending: []
        }
      }
      setData(mockData)
    } catch (error) {
      console.error('Failed to load analytics data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-6 w-6 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-6 bg-gray-200 rounded w-48 animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    )
  }

  if (!data) return null

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Bookmark className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">Total Bookmarks</span>
              </div>
            <div className="mt-2">
              <div className="text-2xl font-bold">{data.overview.totalBookmarks}</div>
              <div className="text-xs text-gray-600">+{data.overview.growthRate}% this month</div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Total Visits</span>
              </div>
            <div className="mt-2">
              <div className="text-2xl font-bold">{data.overview.totalVisits}</div>
              <div className="text-xs text-gray-600">Last 30 days</div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium">Engagement Score</span>
              </div>
            <div className="mt-2">
              <div className="text-2xl font-bold">{data.overview.engagementScore}%</div>
              <div className="text-xs text-gray-600">Above average</div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-medium">Active Time</span>
              </div>
            <div className="mt-2">
              <div className="text-2xl font-bold">{data.overview.timeSpent}h</div>
              <div className="text-xs text-gray-600">Today</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Heatmap */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Activity Heatmap - Last 30 Days
            </CardTitle>
          </CardHeader>
          <CardContent>
          <div className="grid grid-cols-7 gap-1 mb-4">
            {Array.from({ length: 30 }, (_, i) => (
              <div
                key={i}
                className={`h-8 w-8 rounded-sm border ${
                              i % 3 !== 0
              ? i % 7 === 0 
                      ? 'bg-green-500' 
                      : 'bg-green-300'
                    : 'bg-gray-100'
                }`}
                                  title={`Day ${i + 1}: ${(i % 10) + 1} bookmarks visited`}
              />
            ))}
                  </div>
          <div className="flex items-center justify-between text-xs text-gray-600">
            <span>Less active</span>
            <div className="flex gap-1">
              <div className="h-3 w-3 bg-gray-100 rounded-sm" />
              <div className="h-3 w-3 bg-green-200 rounded-sm" />
              <div className="h-3 w-3 bg-green-300 rounded-sm" />
              <div className="h-3 w-3 bg-green-400 rounded-sm" />
              <div className="h-3 w-3 bg-green-500 rounded-sm" />
                </div>
            <span>More active</span>
            </div>
          </CardContent>
        </Card>

      {/* Insights Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              Performance Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Productivity Score</span>
              <div className="flex items-center gap-2">
                <Progress value={data.overview.productivityScore} className="w-16 h-2" />
                <span className="font-medium text-green-600">{data.overview.productivityScore}%</span>
                  </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Focus Time</span>
              <span className="font-medium">4.2h avg</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Distraction Rate</span>
              <span className="font-medium text-yellow-600">12%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Goal Achievement</span>
              <span className="font-medium text-green-600">85%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-purple-500" />
              Top Categories
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { name: 'Development', time: '8.4h', percentage: 35 },
              { name: 'Research', time: '6.2h', percentage: 26 },
              { name: 'Learning', time: '4.8h', percentage: 20 },
              { name: 'Design', time: '2.9h', percentage: 12 },
              { name: 'Others', time: '1.7h', percentage: 7 }
            ].map((category, index) => (
              <div key={index} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{category.name}</span>
                  <span className="text-gray-600">{category.time}</span>
                </div>
                <Progress value={category.percentage} className="h-2" />
                </div>
              ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              Quick Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-sm font-medium text-blue-800">Most Productive Hour</div>
              <div className="text-xs text-blue-600">10:00 AM - 11:00 AM (92% efficiency)</div>
            </div>
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="text-sm font-medium text-green-800">Streak Record</div>
              <div className="text-xs text-green-600">14 days consecutive bookmark usage</div>
            </div>
            <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
              <div className="text-sm font-medium text-purple-800">Favorite Domain</div>
              <div className="text-xs text-purple-600">github.com (127 visits this month)</div>
            </div>
            <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="text-sm font-medium text-orange-800">Time Saved</div>
              <div className="text-xs text-orange-600">~2.3h saved with quick access</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )

  const renderTimeTracking = () => (
    <div className="space-y-6">
      {/* Time Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-cyan-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-cyan-600" />
              <span className="text-sm font-medium">Daily Average</span>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold">{data.timeTracking.dailyAverage}h</div>
              <div className="text-xs text-gray-600">+0.5h vs last week</div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-medium">Total Hours</span>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold">{data.timeTracking.totalHours}h</div>
              <div className="text-xs text-gray-600">This month</div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-indigo-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-indigo-600" />
              <span className="text-sm font-medium">Focus Sessions</span>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold">23</div>
              <div className="text-xs text-gray-600">Avg 1.8h each</div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Efficiency</span>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold">{data.timeTracking.peakHours[0].productivity}%</div>
              <div className="text-xs text-gray-600">Peak performance</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Time Analysis Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Weekly Pattern
            </CardTitle>
            <p className="text-sm text-gray-600">Your bookmark usage throughout the week</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.timeTracking.weeklyPattern.map((day, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium w-12">{day.day}</span>
                    <span className="text-sm text-gray-600">{day.hours}h</span>
                </div>
                  <div className="flex items-center gap-2">
                    <Progress value={(day.hours / 7) * 100} className="h-3 flex-1" />
                    <span className="text-xs text-gray-500 w-8">{Math.round((day.hours / 7) * 100)}%</span>
              </div>
                </div>
              ))}
              </div>
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-sm font-medium text-blue-800">💡 Insight</div>
              <div className="text-xs text-blue-600">You're most productive on Tuesdays and Wednesdays</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sun className="h-5 w-5" />
              Peak Hours Analysis
            </CardTitle>
            <p className="text-sm text-gray-600">When you're most effective with bookmarks</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.timeTracking.peakHours.map((hour, index) => (
                <div key={index} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{hour.hour}</span>
                    <Badge variant={hour.productivity > 80 ? "default" : "secondary"}>
                      {hour.productivity}% efficiency
                    </Badge>
                  </div>
                  <Progress value={hour.productivity} className="h-2" />
                  <div className="text-xs text-gray-500 mt-1">
                    {hour.productivity > 80 ? "🔥 Peak performance" : 
                     hour.productivity > 60 ? "⚡ Good focus" : "😴 Low energy"}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Deep Dive Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Timer className="h-5 w-5 text-purple-500" />
              Session Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm">Short sessions (&lt;30min)</span>
              <span className="font-medium">15</span>
                </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Medium sessions (30min-2h)</span>
              <span className="font-medium">8</span>
              </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Long sessions (&gt;2h)</span>
              <span className="font-medium">5</span>
            </div>
            <div className="pt-2 border-t">
              <div className="text-xs text-gray-600">
                💡 Your optimal session length is 1.8 hours
      </div>
    </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-red-500" />
              Distraction Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm">Tab switching rate</span>
              <span className="font-medium text-yellow-600">12/hour</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Focus streaks</span>
              <span className="font-medium text-green-600">6 avg</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Break frequency</span>
              <span className="font-medium">Every 45min</span>
            </div>
            <div className="pt-2 border-t">
              <div className="text-xs text-gray-600">
                🎯 Consider 25min focused work blocks
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-green-500" />
              Time Goals
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Daily Goal (5h)</span>
                <span className="text-green-600">85%</span>
              </div>
              <Progress value={85} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Weekly Goal (30h)</span>
                <span className="text-blue-600">72%</span>
              </div>
              <Progress value={72} className="h-2" />
            </div>
            <div className="pt-2 border-t">
              <div className="text-xs text-gray-600">
                📈 On track to exceed monthly goal
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )

  const renderBookmarkInsights = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              Top Performers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.bookmarkInsights.topPerformers.map((bookmark, index) => (
                <div key={index} className="p-3 border rounded-lg bg-green-50 border-green-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{bookmark.name}</span>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      {bookmark.productivity}% productivity
                    </Badge>
                    </div>
                  <div className="text-sm text-gray-600">
                    {bookmark.visits} visits • {bookmark.timeSpent}h spent
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowDown className="h-5 w-5 text-red-500" />
              Underperformers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.bookmarkInsights.underperformers.map((bookmark, index) => (
                <div key={index} className="p-3 border rounded-lg bg-yellow-50 border-yellow-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{bookmark.name}</span>
                    <Badge variant="outline" className="border-yellow-500 text-yellow-700">
                      {bookmark.visits} visits
                    </Badge>
                      </div>
                  <div className="text-sm text-gray-600">
                    Last visited: {bookmark.lastVisited} • {bookmark.category}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )

  const renderCategoryAnalysis = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5 text-blue-500" />
              Category Efficiency
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.categoryAnalysis.categories.map((category, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{category.name}</span>
                    <span className="text-sm text-gray-600">{category.efficiency}%</span>
                  </div>
                  <Progress value={category.efficiency} className="h-2" />
                  <div className="text-xs text-gray-500">
                    {category.timeSpent}h spent • {category.bookmarkCount} bookmarks
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-purple-500" />
              Productivity by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.categoryAnalysis.productivityByCategory.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-2 border rounded">
                  <span className="text-sm font-medium">{item.category}</span>
                  <div className="flex items-center gap-2">
                    <Progress value={item.score} className="h-2 w-20" />
                    <span className="text-sm text-gray-600">{item.score}%</span>
                </div>
              </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )

  const renderProjectManagement = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-green-500" />
              Active Projects
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.projectManagement.activeProjects.map((project, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{project.name}</span>
                    <Badge 
                      variant={project.status === 'On Track' ? 'default' : 
                              project.status === 'At Risk' ? 'destructive' : 'secondary'}
                    >
                        {project.status}
                      </Badge>
                    </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Progress</span>
                      <span>{project.progress}%</span>
                  </div>
                    <Progress value={project.progress} className="h-2" />
                    <div className="text-xs text-gray-500">
                      Deadline: {project.deadline}
                    </div>
                    </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-500" />
              Resource Allocation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.projectManagement.resourceAllocation.map((resource, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{resource.resource}</span>
                    <span className="text-sm text-gray-600">{resource.utilization}%</span>
                  </div>
                  <Progress value={resource.utilization} className="h-3" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )

  const renderSmartRecommendations = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-500" />
              Cleanup Suggestions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.smartRecommendations.cleanup.map((item, index) => (
                <div key={index} className="p-3 border rounded-lg bg-red-50 border-red-200">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm">{item.type}</span>
                    <Badge variant="outline" className="text-xs">{item.count}</Badge>
                    </div>
                  <div className="text-xs text-gray-600">{item.impact}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
              Optimization Tips
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.smartRecommendations.optimization.map((item, index) => (
                <div key={index} className="p-3 border rounded-lg bg-yellow-50 border-yellow-200">
                  <div className="text-sm font-medium mb-1">{item.suggestion}</div>
                  <div className="text-xs text-gray-600 mb-1">{item.benefit}</div>
                  <Badge variant="outline" className="text-xs">
                    {item.effort} effort
                    </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              Trending Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.smartRecommendations.trending.map((item, index) => (
                <div key={index} className="p-3 border rounded-lg bg-green-50 border-green-200">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm">{item.item}</span>
                    <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                      +{item.growth}%
                    </Badge>
                    </div>
                  <div className="text-xs text-gray-600">{item.category}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )

    return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
            <div>
          <h1 className="text-3xl font-bold">Comprehensive Analytics</h1>
          <p className="text-gray-600">Deep insights into your bookmark usage and productivity</p>
            </div>
            <div className="flex gap-2">
              {(['7d', '30d', '90d', '1y'] as const).map((range) => (
                <Button
                  key={range}
                  variant={timeRange === range ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTimeRange(range)}
                >
                  {range}
                </Button>
              ))}
            </div>
          </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="time-tracking">Time Tracking</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {renderOverview()}
        </TabsContent>

        <TabsContent value="time-tracking" className="space-y-6">
          {renderTimeTracking()}
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          {renderBookmarkInsights()}
        </TabsContent>

        <TabsContent value="categories" className="space-y-6">
          {renderCategoryAnalysis()}
        </TabsContent>

        <TabsContent value="projects" className="space-y-6">
          {renderProjectManagement()}
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-6">
          {renderSmartRecommendations()}
        </TabsContent>
      </Tabs>
    </div>
  )
} 