'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

const navigationItems = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: '📊',
    badge: null
  },
  {
    title: 'DNA Profile',
    href: '/dna-profile',
    icon: '🧬',
    badge: null
  },
  {
    title: 'AI-Copolit',
    href: '/settings/ai',
    icon: '🤖',
    badge: 'New'
  },
  {
    title: 'Marketplace',
    href: '/marketplace',
    icon: '🛒',
    badge: null
  },
  {
    title: 'Setting',
    href: '/settings',
    icon: '⚙️',
    badge: null
  }
]

const quickActions = [
  {
    title: 'New Project',
    icon: '➕',
    action: () => console.log('New project')
  },
  {
    title: 'Import Data',
    icon: '📥',
    action: () => console.log('Import data')
  },
  {
    title: 'Export',
    icon: '📤',
    action: () => console.log('Export')
  }
]

interface SidebarProps {
  className?: string
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname()

  return (
    <div className={cn("flex flex-col h-full bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800", className)}>
      {/* Logo/Brand */}
      <div className="flex items-center gap-2 p-6 border-b border-slate-200 dark:border-slate-800">
        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-sm">AI</span>
        </div>
        <div>
          <h2 className="font-semibold text-slate-900 dark:text-white">BookAI Mark</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">AI-Powered SaaS</p>
        </div>
      </div>

      {/* User Profile */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src="https://github.com/shadcn.png" alt="User" />
            <AvatarFallback>JD</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
              John Doe
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
              john@example.com
            </p>
          </div>
          <Badge variant="secondary" className="text-xs">
            Pro
          </Badge>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto">
        <nav className="p-4 space-y-2">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
            Main Menu
          </div>
          {navigationItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start gap-3 h-10",
                    isActive && "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white"
                  )}
                >
                  <span className="text-base">{item.icon}</span>
                  <span className="flex-1 text-left">{item.title}</span>
                  {item.badge && (
                    <Badge variant="destructive" className="text-xs">
                      {item.badge}
                    </Badge>
                  )}
                </Button>
              </Link>
            )
          })}
        </nav>

        <Separator className="mx-4" />

        {/* Quick Actions */}
        <div className="p-4 space-y-2">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
            Quick Actions
          </div>
          {quickActions.map((action) => (
            <Button
              key={action.title}
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-3 h-9"
              onClick={action.action}
            >
              <span className="text-sm">{action.icon}</span>
              <span className="text-sm">{action.title}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800">
        <div className="space-y-2">
          <Button variant="outline" size="sm" className="w-full justify-start gap-2">
            <span>💬</span>
            <span className="text-sm">Support</span>
          </Button>
          <Button variant="outline" size="sm" className="w-full justify-start gap-2">
            <span>📚</span>
            <span className="text-sm">Documentation</span>
          </Button>
        </div>
        
        <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
          <div className="text-xs text-slate-600 dark:text-slate-400">
            <div className="flex justify-between items-center mb-1">
              <span>Storage</span>
              <span>75%</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5">
              <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: '75%' }}></div>
            </div>
            <div className="mt-1 text-xs">7.5 GB of 10 GB used</div>
          </div>
        </div>
      </div>
    </div>
  )
} 