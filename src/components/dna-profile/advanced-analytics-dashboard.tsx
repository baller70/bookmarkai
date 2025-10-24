'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '../ui/card'
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
  ArrowUp
} from 'lucide-react'

interface AnalyticsData {
  overview: {
    totalBookmarks: number
    totalVisits: number
    engagementScore: number
    growthRate: number
  }
}

export function AdvancedAnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d')

  useEffect(() => {
    loadAnalyticsData()
  }, [timeRange])

  const loadAnalyticsData = async () => {
    setLoading(true)
    try {
      // Mock analytics data
      const mockData: AnalyticsData = {
        overview: {
          totalBookmarks: 247,
          totalVisits: 1834,
          engagementScore: 82,
          growthRate: 15.3
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
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
            <BarChart3 className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Advanced Analytics</h2>
            <p className="text-sm text-gray-600">Comprehensive insights into your bookmark usage</p>
          </div>
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

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 density-gap">
        <Card>
          <CardContent className="density-p">
            <div className="flex items-center gap-2">
              <Bookmark className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">Total Bookmarks</span>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold">{data.overview.totalBookmarks}</div>
              <div className="flex items-center gap-1 text-xs text-green-600">
                <ArrowUp className="h-3 w-3" />
                {data.overview.growthRate}%
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="density-p">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Total Visits</span>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold">{data.overview.totalVisits.toLocaleString()}</div>
              <div className="text-xs text-gray-600">This month</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="density-p">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium">Engagement</span>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold">{data.overview.engagementScore}%</div>
              <Progress value={data.overview.engagementScore} className="mt-1 h-1" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="density-p">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-cyan-600" />
              <span className="text-sm font-medium">Growth Rate</span>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold">+{data.overview.growthRate}%</div>
              <div className="text-xs text-gray-600">This month</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Coming Soon */}
      <Card>
        <CardContent className="text-center py-12">
          <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Advanced Analytics Coming Soon</h3>
          <p className="text-gray-600 mb-4">
            Detailed charts, insights, and performance metrics will be available soon.
          </p>
          <Button variant="outline">
            Learn More
          </Button>
        </CardContent>
      </Card>
    </div>
  )
} 