'use client'

import React, { createContext, useContext, useState, ReactNode } from 'react'

export interface DashboardMetrics {
  totalCredits: number
  messages: number
  appsCreated: number
  successRate: number
  lastUpdated: Date
}

export interface Project {
  id: string
  name: string
  status: 'Active' | 'In Development' | 'Planning'
  badge: 'Live' | 'Dev' | 'Soon'
  color: string
}

export interface ActivityItem {
  id: string
  title: string
  description: string
  timestamp: Date
  type: 'Success' | 'Payment' | 'Profile' | 'Security'
  color: string
}

export interface DashboardState {
  metrics: DashboardMetrics
  projects: Project[]
  recentActivity: ActivityItem[]
  isLoading: boolean
  selectedSection: string | null
}

export interface DashboardActions {
  refreshMetrics: () => void
  updateMetrics: (metrics: Partial<DashboardMetrics>) => void
  addProject: (project: Omit<Project, 'id'>) => void
  updateProject: (id: string, updates: Partial<Project>) => void
  addActivity: (activity: Omit<ActivityItem, 'id' | 'timestamp'>) => void
  navigateToSection: (section: string) => void
  filterProjects: (status?: string) => Project[]
  getMetricValue: (metric: keyof DashboardMetrics) => number | string | Date
  executeQuickAction: (action: string) => void
}

export interface DashboardContextType {
  state: DashboardState
  actions: DashboardActions
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined)

const initialState: DashboardState = {
  metrics: {
    totalCredits: 1250,
    messages: 347,
    appsCreated: 12,
    successRate: 98.5,
    lastUpdated: new Date('2024-01-01T00:00:00.000Z')
  },
  projects: [
    {
      id: '1',
      name: 'BookAI Dashboard',
      status: 'Active',
      badge: 'Live',
      color: 'bg-green-500'
    },
    {
      id: '2',
      name: 'Analytics Engine',
      status: 'In Development',
      badge: 'Dev',
      color: 'bg-blue-500'
    },
    {
      id: '3',
      name: 'API Gateway',
      status: 'Planning',
      badge: 'Soon',
      color: 'bg-purple-500'
    }
  ],
  recentActivity: [
    {
      id: '1',
      title: 'New app created successfully',
      description: '2 minutes ago',
      timestamp: new Date('2024-01-01T00:00:00.000Z'),
      type: 'Success',
      color: 'bg-green-500'
    },
    {
      id: '2',
      title: 'Credits purchased',
      description: '1 hour ago',
      timestamp: new Date('2024-01-01T00:00:00.000Z'),
      type: 'Payment',
      color: 'bg-blue-500'
    },
    {
      id: '3',
      title: 'Profile updated',
      description: '3 hours ago',
      timestamp: new Date('2024-01-01T00:00:00.000Z'),
      type: 'Profile',
      color: 'bg-yellow-500'
    },
    {
      id: '4',
      title: 'API key regenerated',
      description: '1 day ago',
      timestamp: new Date('2024-01-01T00:00:00.000Z'),
      type: 'Security',
      color: 'bg-purple-500'
    }
  ],
  isLoading: false,
  selectedSection: null
}

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DashboardState>(initialState)
  const mounted = React.useRef(false)

  React.useEffect(() => {
    if (!mounted.current) {
      mounted.current = true
      setState(prev => ({
        ...prev,
        metrics: {
          ...prev.metrics,
          lastUpdated: new Date()
        },
        recentActivity: prev.recentActivity.map((item, idx) => ({
          ...item,
          timestamp: new Date(Date.now() - idx * 60 * 60 * 1000)
        }))
      }))
    }
  }, [])

  const actions: DashboardActions = {
    refreshMetrics: () => {
      setState(prev => ({
        ...prev,
        isLoading: true
      }))
      
      // Simulate API call
      setTimeout(() => {
        setState(prev => ({
          ...prev,
          metrics: {
            ...prev.metrics,
            lastUpdated: new Date()
          },
          isLoading: false
        }))
      }, 1000)
    },

    updateMetrics: (metrics) => {
      setState(prev => ({
        ...prev,
        metrics: {
          ...prev.metrics,
          ...metrics,
          lastUpdated: new Date()
        }
      }))
    },

    addProject: (project) => {
      const newProject: Project = {
        ...project,
        id: Date.now().toString()
      }
      setState(prev => ({
        ...prev,
        projects: [...prev.projects, newProject]
      }))
    },

    updateProject: (id, updates) => {
      setState(prev => ({
        ...prev,
        projects: prev.projects.map(project =>
          project.id === id ? { ...project, ...updates } : project
        )
      }))
    },

    addActivity: (activity) => {
      const newActivity: ActivityItem = {
        ...activity,
        id: Date.now().toString(),
        timestamp: new Date()
      }
      setState(prev => ({
        ...prev,
        recentActivity: [newActivity, ...prev.recentActivity.slice(0, 9)] // Keep only 10 items
      }))
    },

    navigateToSection: (section) => {
      setState(prev => ({
        ...prev,
        selectedSection: section
      }))
    },

    filterProjects: (status) => {
      if (!status) return state.projects
      return state.projects.filter(project => project.status === status)
    },

    getMetricValue: (metric) => {
      return state.metrics[metric]
    },

    executeQuickAction: (action) => {
      switch (action.toLowerCase()) {
        case 'get more credits':
        case 'credits':
          actions.addActivity({
            title: 'Credit purchase initiated',
            description: 'Redirecting to billing...',
            type: 'Payment',
            color: 'bg-blue-500'
          })
          actions.navigateToSection('billing')
          break
        
        case 'update profile':
        case 'profile':
          actions.addActivity({
            title: 'Profile page opened',
            description: 'Navigating to profile settings...',
            type: 'Profile',
            color: 'bg-yellow-500'
          })
          actions.navigateToSection('profile')
          break
        
        case 'view documentation':
        case 'docs':
        case 'documentation':
          actions.addActivity({
            title: 'Documentation accessed',
            description: 'Opening help documentation...',
            type: 'Success',
            color: 'bg-green-500'
          })
          actions.navigateToSection('docs')
          break
        
        case 'settings':
          actions.addActivity({
            title: 'Settings opened',
            description: 'Accessing account settings...',
            type: 'Profile',
            color: 'bg-purple-500'
          })
          actions.navigateToSection('settings')
          break
        
        case 'refresh':
        case 'refresh data':
          actions.refreshMetrics()
          actions.addActivity({
            title: 'Data refreshed',
            description: 'Dashboard metrics updated',
            type: 'Success',
            color: 'bg-green-500'
          })
          break
        
        default:
          actions.addActivity({
            title: `Action: ${action}`,
            description: 'Command executed via AI chat',
            type: 'Success',
            color: 'bg-blue-500'
          })
      }
    }
  }

  return (
    <DashboardContext.Provider value={{ state, actions }}>
      {children}
    </DashboardContext.Provider>
  )
}

export function useDashboard() {
  const context = useContext(DashboardContext)
  if (context === undefined) {
    throw new Error('useDashboard must be used within a DashboardProvider')
  }
  return context
} 