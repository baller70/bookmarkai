'use client'

import React from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { ArrowLeft, User, Heart, BookOpen, Search, BarChart, Clock, Dna } from 'lucide-react'

interface TabDef {
  id: string
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

const dnaProfileTabs: TabDef[] = [
  { id: 'about-you', label: 'About You', href: '/about-you', icon: User },
  { id: 'favorites', label: 'Favorites', href: '/favorites', icon: Heart },
  { id: 'playbooks', label: 'Playbooks', href: '/playbooks', icon: BookOpen },
  { id: 'search', label: 'Search', href: '/search', icon: Search },
  { id: 'analytics', label: 'Analytics', href: '/analytics', icon: BarChart },
  { id: 'time-capsule', label: 'Time Capsule', href: '/time-capsule', icon: Clock },
]

interface DnaProfileLayoutProps {
  children: React.ReactNode
  title?: string
  description?: string
}

export default function DnaProfileLayout({ children, title, description }: DnaProfileLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()

  const activeTab = dnaProfileTabs.find((tab) => 
    pathname === tab.href || pathname.startsWith(tab.href + '/')
  )?.id ?? 'about-you'

  const handleTabChange = (href: string) => {
    router.push(href)
  }

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white/80 dark:bg-card backdrop-blur-sm border-b border-gray-200 dark:border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/dashboard')}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Dashboard</span>
              </Button>
              <div className="h-6 w-px bg-gray-300" />
              <div className="flex items-center space-x-2">
                <Dna className="h-6 w-6 text-primary" />
                <h1 className="text-xl font-bold">DNA Profile</h1>
                {activeTab && (
                  <>
                    <span className="text-gray-400">•</span>
                    <span className="text-lg font-medium text-gray-600 dark:text-gray-400">
                      {dnaProfileTabs.find(tab => tab.id === activeTab)?.label}
                    </span>
                  </>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="bg-primary/10 text-primary">
                AI-Powered
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-2">
              <div className="bg-white dark:bg-card rounded-lg border border-gray-200 dark:border-border p-4">
                <div className="mb-4">
                  <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    DNA Profile Sections
                  </h2>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Build your personalized AI profile
                  </p>
                </div>
                <nav className="space-y-1">
                  {dnaProfileTabs.map(({ id, label, href, icon: Icon }) => {
                    const isActive = activeTab === id
                    const iconClassName = isActive ? "h-4 w-4 text-primary" : "h-4 w-4"
                    
                    return (
                      <button
                        key={id}
                        onClick={() => handleTabChange(href)}
                        className={`w-full flex items-center space-x-3 px-3 py-2.5 text-sm font-medium rounded-md transition-all duration-200 ${
                          isActive
                            ? 'bg-primary/10 text-primary border-l-2 border-primary shadow-sm'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100'
                        }`}
                      >
                        <Icon className={iconClassName} />
                        <span>{label}</span>
                      </button>
                    )
                  })}
                </nav>
              </div>
              
              {/* DNA Profile Progress */}
              <div className="bg-white dark:bg-card rounded-lg border border-gray-200 dark:border-border p-4">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
                  Profile Completion
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600 dark:text-gray-400">Progress</span>
                    <span className="font-medium">4/6 sections</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full transition-all duration-300" style={{ width: '67%' }}></div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Complete all sections for better AI recommendations
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white dark:bg-card rounded-lg border border-gray-200 dark:border-border">
              {title && (
                <div className="px-6 py-4 border-b border-gray-200 dark:border-border">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    {title}
                  </h2>
                  {description && (
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                      {description}
                    </p>
                  )}
                </div>
              )}
              <div className="p-6">
                {children}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 