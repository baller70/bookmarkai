'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Progress } from '../ui/progress'
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  Star, 
  Bookmark,
  Eye,
  Activity,
  ArrowUp,
  Calendar,
  Globe,
  Users,
  Target
} from 'lucide-react'

interface DetailedAnalyticsData {
  bookmarkStats: {
    total: number
    thisWeek: number
    categories: { name: string; count: number; percentage: number }[]
  }
  usagePatterns: {
    dailyAverage: number
    peakHours: string[]
    mostActiveDay: string
  }
  performance: {
    loadTime: number
    uptime: number
    errorRate: number
  }
}

interface AnalyticsPageProps {
  userId: string
}

export function AnalyticsPage({ userId }: AnalyticsPageProps) {
  const [data, setData] = useState<DetailedAnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDetailedAnalytics()
  }, [userId])

  const loadDetailedAnalytics = async () => {
    setLoading(true)
    try {
      // Mock detailed analytics data
      const mockData: DetailedAnalyticsData = {
        bookmarkStats: {
          total: 247,
          thisWeek: 18,
          categories: [
            { name: 'Development', count: 89, percentage: 36 },
            { name: 'Design', count: 64, percentage: 26 },
            { name: 'Productivity', count: 45, percentage: 18 },
            { name: 'Learning', count: 32, percentage: 13 },
            { name: 'Others', count: 17, percentage: 7 }
          ]
        },
        usagePatterns: {
          dailyAverage: 12.5,
          peakHours: ['9:00 AM', '2:00 PM', '7:00 PM'],
          mostActiveDay: 'Tuesday'
        },
        performance: {
          loadTime: 1.2,
          uptime: 99.8,
          errorRate: 0.2
        }
      }
      setData(mockData)
    } catch (error) {
      console.error('Failed to load detailed analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-2 bg-gray-200 rounded w-full"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg flex items-center justify-center">
          <BarChart3 className="h-5 w-5 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Detailed Analytics</h2>
          <p className="text-sm text-gray-600">In-depth analysis of your bookmark usage and patterns</p>
        </div>
      </div>

      {/* Bookmark Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Bookmark className="h-4 w-4 text-blue-600" />
              Bookmark Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <div className="text-2xl font-bold">{data.bookmarkStats.total}</div>
                <div className="text-xs text-gray-600">Total bookmarks</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-green-600">+{data.bookmarkStats.thisWeek}</div>
                <div className="text-xs text-gray-600">Added this week</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4 text-purple-600" />
              Usage Patterns
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <div className="text-2xl font-bold">{data.usagePatterns.dailyAverage}</div>
                <div className="text-xs text-gray-600">Daily average visits</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-blue-600">{data.usagePatterns.mostActiveDay}</div>
                <div className="text-xs text-gray-600">Most active day</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4 text-green-600" />
              Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <div className="text-2xl font-bold">{data.performance.uptime}%</div>
                <div className="text-xs text-gray-600">Uptime</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-cyan-600">{data.performance.loadTime}s</div>
                <div className="text-xs text-gray-600">Avg load time</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-blue-600" />
            Category Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.bookmarkStats.categories.map((category, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">{category.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">{category.count}</span>
                    <Badge variant="secondary" className="text-xs">
                      {category.percentage}%
                    </Badge>
                  </div>
                </div>
                <Progress value={category.percentage} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Peak Hours */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-orange-600" />
            Peak Usage Hours
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {data.usagePatterns.peakHours.map((hour, index) => (
              <div key={index} className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-xl font-bold text-orange-600">{hour}</div>
                <div className="text-sm text-gray-600">Peak #{index + 1}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* System Health */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-green-600" />
            System Health
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{data.performance.uptime}%</div>
              <div className="text-sm text-gray-600 mt-1">Uptime</div>
              <Progress value={data.performance.uptime} className="mt-2 h-2" />
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{data.performance.loadTime}s</div>
              <div className="text-sm text-gray-600 mt-1">Avg Load Time</div>
              <Progress value={85} className="mt-2 h-2" />
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600">{data.performance.errorRate}%</div>
              <div className="text-sm text-gray-600 mt-1">Error Rate</div>
              <Progress value={data.performance.errorRate} className="mt-2 h-2" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 