'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Target,
  Clock,
  AlertTriangle,
  CheckCircle,
  Users,
  Calendar
} from 'lucide-react'

interface ARPSection {
  id: string
  title: string
  dueDate?: Date
  assignedTo?: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'not_started' | 'in_progress' | 'review' | 'complete'
  progress: number
  estimatedHours?: number
  actualHours?: number
}

interface ARPSummaryDashboardProps {
  sections: ARPSection[]
}

export const ARPSummaryDashboard: React.FC<ARPSummaryDashboardProps> = ({
  sections
}) => {
  console.log('🔍 ARPSummaryDashboard: Rendering with sections:', sections)

  const toDate = (d: any): Date | undefined => {
    try {
      console.log('🔍 ARPSummaryDashboard: toDate called with:', typeof d, d)
      if (!d) return undefined
      const dt = d instanceof Date ? d : (() => new Date(d))()
      const result = isNaN(dt.getTime()) ? undefined : dt
      console.log('🔍 ARPSummaryDashboard: toDate result:', result)
      return result
    } catch (error) {
      console.error('🚨 ARPSummaryDashboard: toDate error:', error)
      return undefined
    }
  }

  const safeSections = React.useMemo(() => {
    try {
      console.log('🔍 ARPSummaryDashboard: Processing sections in useMemo:', sections)
      console.log('🔍 ARPSummaryDashboard: sections is array:', Array.isArray(sections))

      if (!Array.isArray(sections)) {
        console.log('🔍 ARPSummaryDashboard: sections is not array, returning empty array')
        return []
      }

      const mapped = sections.map((s: any, index: number) => {
        try {
          console.log(`🔍 ARPSummaryDashboard: Processing section ${index}:`, s)

          const result = {
            ...s,
            // Normalize dates defensively
            dueDate: toDate(s?.dueDate),
            // Coerce numeric fields
            progress: typeof s?.progress === 'number' ? s.progress : Number(s?.progress) || 0,
            estimatedHours: typeof s?.estimatedHours === 'number' ? s.estimatedHours : (s?.estimatedHours != null ? Number(s.estimatedHours) : undefined),
            actualHours: typeof s?.actualHours === 'number' ? s.actualHours : (s?.actualHours != null ? Number(s.actualHours) : undefined),
          }

          console.log(`🔍 ARPSummaryDashboard: Processed section ${index}:`, result)
          return result
        } catch (sectionError) {
          console.error(`🚨 ARPSummaryDashboard: Error processing section ${index}:`, sectionError)
          return s // Return original section if processing fails
        }
      })

      console.log('🔍 ARPSummaryDashboard: Final mapped sections:', mapped)
      return mapped
    } catch (e) {
      console.error('🚨 ARPSummaryDashboard: Failed to map sections', { e, sections })
      return []
    }
  }, [sections, toDate])

  const totalSections = safeSections.length
  const completedSections = safeSections.filter(s => s.status === 'complete').length
  const inProgressSections = safeSections.filter(s => s.status === 'in_progress').length
  const overdueSections = safeSections.filter(s => {
    // Extra defensive check to prevent calling methods on non-Date objects
    if (!(s.dueDate instanceof Date) || isNaN(s.dueDate.getTime())) return false
    return (() => new Date())() > s.dueDate && s.status !== 'complete'
  }).length

  const averageProgress = totalSections > 0
    ? Math.round(
        safeSections.reduce((sum, s) => sum + (typeof s.progress === 'number' ? s.progress : 0), 0) / totalSections
      )
    : 0

  const totalEstimatedHours = safeSections.reduce((sum, s) => sum + (typeof s.estimatedHours === 'number' ? s.estimatedHours : 0), 0)
  const totalActualHours = safeSections.reduce((sum, s) => sum + (typeof s.actualHours === 'number' ? s.actualHours : 0), 0)

  const urgentSections = safeSections.filter(s => s.priority === 'urgent' && s.status !== 'complete').length
  const assignedSections = safeSections.filter(s => Boolean(s.assignedTo)).length

  const upcomingDeadlines = React.useMemo(() => {
    try {
      console.log('🔍 ARPSummaryDashboard: Computing upcomingDeadlines from safeSections:', safeSections)

      if (!Array.isArray(safeSections)) {
        console.error('🚨 ARPSummaryDashboard: safeSections is not an array:', safeSections)
        return []
      }

      const filtered = safeSections.filter((s, index) => {
        try {
          console.log(`🔍 ARPSummaryDashboard: Filtering section ${index}:`, s)
          const hasValidDate = s.dueDate instanceof Date && !isNaN(s.dueDate.getTime())
          const isNotComplete = s.status !== 'complete'
          console.log(`🔍 ARPSummaryDashboard: Section ${index} - hasValidDate: ${hasValidDate}, isNotComplete: ${isNotComplete}`)
          return hasValidDate && isNotComplete
        } catch (filterError) {
          console.error(`🚨 ARPSummaryDashboard: Error filtering section ${index}:`, filterError)
          return false
        }
      })

      console.log('🔍 ARPSummaryDashboard: Filtered sections:', filtered)

      const sorted = filtered.sort((a, b) => {
        try {
          // Extra defensive checks to prevent "y is not a function" errors
          const aTime = (a.dueDate instanceof Date && !isNaN(a.dueDate.getTime())) ? a.dueDate.getTime() : Number.POSITIVE_INFINITY
          const bTime = (b.dueDate instanceof Date && !isNaN(b.dueDate.getTime())) ? b.dueDate.getTime() : Number.POSITIVE_INFINITY
          console.log('🔍 ARPSummaryDashboard: Comparing times:', aTime, bTime)
          return aTime - bTime
        } catch (sortError) {
          console.error('🚨 ARPSummaryDashboard: Error sorting:', sortError)
          return 0
        }
      })

      console.log('🔍 ARPSummaryDashboard: Sorted sections:', sorted)

      const sliced = sorted.slice(0, 3)
      console.log('🔍 ARPSummaryDashboard: Final upcomingDeadlines:', sliced)

      return sliced
    } catch (error) {
      console.error('🚨 ARPSummaryDashboard: Error computing upcomingDeadlines:', error)
      return []
    }
  }, [safeSections])

  const formatDate = (date: Date | undefined | null) => {
    // Defensive check - ensure we have a valid Date object
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
      return 'No date'
    }

    const today = (() => new Date())()
    const diffTime = date.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Tomorrow'
    if (diffDays < 0) return `${Math.abs(diffDays)} days overdue`
    if (diffDays <= 7) return `${diffDays} days`

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Overall Progress */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Target className="h-4 w-4 text-blue-500" />
            Overall Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">{averageProgress}%</span>
              <Badge variant="secondary">{completedSections}/{totalSections}</Badge>
            </div>
            <Progress value={averageProgress} className="h-2" />
            <div className="text-xs text-gray-500">
              {inProgressSections} in progress
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Time Tracking */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Clock className="h-4 w-4 text-green-500" />
            Time Tracking
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Actual</span>
              <span className="font-semibold">{totalActualHours}h</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Estimated</span>
              <span className="font-semibold">{totalEstimatedHours}h</span>
            </div>
            {totalEstimatedHours > 0 && (
              <div className="text-xs text-gray-500">
                {totalActualHours > totalEstimatedHours ? 'Over' : 'Under'} by{' '}
                {Math.abs(totalActualHours - totalEstimatedHours)}h
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Alerts */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-orange-500" />
            Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {overdueSections > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-red-600">Overdue</span>
                <Badge variant="destructive">{overdueSections}</Badge>
              </div>
            )}
            {urgentSections > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-orange-600">Urgent</span>
                <Badge className="bg-orange-500">{urgentSections}</Badge>
              </div>
            )}
            {overdueSections === 0 && urgentSections === 0 && (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm">All on track</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Deadlines */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Calendar className="h-4 w-4 text-purple-500" />
            Upcoming
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {upcomingDeadlines.length > 0 ? (
              upcomingDeadlines.map((section) => (
                <div key={section.id} className="flex items-center justify-between">
                  <span className="text-xs truncate flex-1 mr-2">
                    {section.title || 'Untitled'}
                  </span>
                  <span className={`text-xs ${
                    section.dueDate instanceof Date && !isNaN(section.dueDate.getTime()) && (() => new Date())() > section.dueDate
                      ? 'text-red-600 font-medium'
                      : 'text-gray-500'
                  }`}>
                    {formatDate(section.dueDate)}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-xs text-gray-500 text-center py-2">
                No upcoming deadlines
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
