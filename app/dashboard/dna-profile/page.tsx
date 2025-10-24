
'use client'
export const dynamic = 'force-dynamic'

import React from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AboutYouComponent } from '@/src/components/dna-profile/about-you'
import { User, Heart, BookOpen, Search, BarChart, Clock, Dna } from 'lucide-react'

const dnaProfileTabs = [
  { id: 'about-you', label: 'About You', href: '/dashboard/dna-profile', icon: User },
  { id: 'favorites', label: 'Favorites', href: '/favorites', icon: Heart },
  { id: 'playbooks', label: 'Playbooks', href: '/playbooks', icon: BookOpen },
  { id: 'search', label: 'Search', href: '/search', icon: Search },
  { id: 'analytics', label: 'Analytics', href: '/dashboard/analytics', icon: BarChart },
  { id: 'time-capsule', label: 'Time Capsule', href: '/time-capsule', icon: Clock },
]

export default function DnaProfilePage() {
  const pathname = usePathname()
  const router = useRouter()
  
  const activeTab = dnaProfileTabs.find((tab) => 
    pathname === tab.href || pathname.startsWith(tab.href + '/')
  )?.id ?? 'about-you'

  return (
    <div className="h-full bg-background text-foreground p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center space-x-2 mb-2">
          <Dna className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">DNA Profile</h1>
          <Badge variant="secondary" className="bg-primary/10 text-primary">
            AI-Powered
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Build your personalized AI profile
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-1">
          <div className="space-y-4">
            <div className="bg-card rounded-lg border p-4">
              <h2 className="text-sm font-semibold mb-3">
                DNA Profile Sections
              </h2>
              <nav className="space-y-1">
                {dnaProfileTabs.map(({ id, label, href, icon: Icon }) => {
                  const isActive = activeTab === id
                  
                  return (
                    <button
                      key={id}
                      onClick={() => router.push(href)}
                      className={`w-full flex items-center space-x-3 px-3 py-2.5 text-sm font-medium rounded-md transition-all ${
                        isActive
                          ? 'bg-primary/10 text-primary border-l-2 border-primary'
                          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{label}</span>
                    </button>
                  )
                })}
              </nav>
            </div>
            
            {/* Profile Progress */}
            <div className="bg-card rounded-lg border p-4">
              <h3 className="text-sm font-semibold mb-3">
                Profile Completion
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium">4/6 sections</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full transition-all" style={{ width: '67%' }}></div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Complete all sections for better AI recommendations
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <div className="bg-card rounded-lg border">
            <div className="px-6 py-4 border-b">
              <h2 className="text-xl font-semibold">
                About You
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Tell us about yourself to get personalized AI recommendations
              </p>
            </div>
            <div className="p-6">
              <AboutYouComponent />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 