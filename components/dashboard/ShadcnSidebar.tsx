'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { 
  LayoutDashboard,
  Settings,
  Bookmark,
  Grid3X3,
  TrendingUp,
  Users,
  FolderOpen,
  ShoppingCart,
  Tags,
  Layers
} from 'lucide-react'

// Custom SVG components to prevent hydration errors
const DnaIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
  </svg>
)

const BrainIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
  </svg>
)

export function ShadcnSidebar() {
  const [selectedItem, setSelectedItem] = useState('Dashboard')
  const pathname = usePathname()

  const navigationItems = [
    { id: 'Dashboard', name: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
    { id: 'DNA Profile', name: 'DNA Profile', icon: DnaIcon, href: '/dashboard/dna-profile' },
    { id: 'AI LinkPilot', name: 'AI LinkPilot', icon: BrainIcon, href: '/settings/ai' },
    { id: 'Marketplace', name: 'Marketplace', icon: ShoppingCart, href: '/dashboard/marketplace' },
    { id: 'Setting', name: 'Setting', icon: Settings, href: '/dashboard/settings-main' },
  ]

  const bookmarkaiAddonItems = [
    { id: 'Categories', name: 'Categories', icon: Layers, href: '/bookmarkai-addons/categories' },
    { id: 'Tags', name: 'Tags', icon: Tags, href: '/bookmarkai-addons/tags' },
    { id: 'Priority', name: 'Priority', icon: TrendingUp, href: '/bookmarkai-addons/priority' }
  ]

  const handleItemClick = (itemId: string) => {
    setSelectedItem(itemId)
  }

  return (
    <div className="h-full flex flex-col p-4">
      {/* Sidebar Container - Fixed width, always visible */}
      <div className="w-56 bg-white rounded-lg border border-slate-200 shadow-sm h-full flex flex-col dark:bg-slate-950 dark:border-slate-800">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <svg className="h-4 w-4 text-primary-foreground" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-medium text-slate-900 dark:text-slate-100">BookmarkHub</span>
              <span className="text-sm text-slate-500">Your digital workspace</span>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 min-h-0">
            <ScrollArea className="h-full py-4 px-4">
              <div className="space-y-6">
                
                {/* Navigation Section */}
                <div className="space-y-1">
                  <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">
                    Navigation
                  </h3>
                  
                  <div className="space-y-1">
                    {navigationItems.map((item) => {
                      const Icon = item.icon
                      const isSelected = pathname === item.href
                      
                      return (
                        <Link key={item.id} href={item.href}>
                          <button
                            className={cn(
                              "flex items-center rounded-md transition-colors group w-full justify-between px-3 py-2 text-sm",
                              isSelected 
                                ? "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100" 
                                : "text-slate-700 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <Icon className="h-4 w-4" />
                              <span>{item.name}</span>
                            </div>
                          </button>
                        </Link>
                      )
                    })}
                  </div>
                </div>

                {/* Bookmarkai Addons Section */}
                <div className="space-y-1">
                  <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">
                    Bookmarkai Addons
                  </h3>
                  
                  <div className="space-y-1">
                    {bookmarkaiAddonItems.map((item) => {
                      const Icon = item.icon
                      const isSelected = pathname === item.href
                      
                      return (
                        <Link key={item.id} href={item.href}>
                          <button
                            className={cn(
                              "flex items-center rounded-md transition-colors group w-full justify-between px-3 py-2 text-sm",
                              isSelected 
                                ? "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100" 
                                : "text-slate-700 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <Icon className="h-4 w-4" />
                              <span>{item.name}</span>
                            </div>
                          </button>
                        </Link>
                      )
                    })}
                  </div>
                </div>

                {/* Upgrade to Pro Card - Always visible */}
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                  <div className="space-y-3">
                    <div>
                      <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                        Upgrade to Pro
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                        Get pro now to own all dashboards, templates and components for life.
                      </p>
                    </div>
                    
                    <Button 
                      className="w-full bg-black text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200 font-medium rounded-md"
                      size="sm"
                    >
                      Get Shadcn UI Kit
                    </Button>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>
    </div>
  )
} 