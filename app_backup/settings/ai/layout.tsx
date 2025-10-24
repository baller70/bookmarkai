'use client'

import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Tags, Upload, ShieldCheck, Search, Globe, ArrowLeft, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

// Simple SVG compass icon to prevent hydration issues
const CompassIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none"/>
    <path d="m16.24 7.76-1.804 5.411a2 2 0 0 1-1.265 1.265L7.76 16.24l1.804-5.411a2 2 0 0 1 1.265-1.265z" fill="currentColor"/>
  </svg>
)

const nav = [
  { href: '/settings/ai/auto-processing', label: 'Auto-Processing', icon: CompassIcon },
  { href: '/settings/ai/recommendations', label: 'Content Discovery', icon: Tags },
  { href: '/settings/ai/bulk-uploader', label: 'Bulk Link Uploader', icon: Upload },
  { href: '/settings/ai/link-validator', label: 'Link Validator', icon: ShieldCheck },
  { href: '/settings/ai/browser-launcher', label: 'Browser Launcher', icon: Globe },
]

export default function AILinkPilotLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()

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
                <Settings className="h-6 w-6" />
                <h1 className="text-xl font-bold">AI LinkPilot</h1>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-6">
          {/* Sidebar */}
          <ScrollArea className="hidden lg:block w-56 shrink-0 rounded-lg border p-2">
            {nav.map(item => {
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-muted',
                    pathname.startsWith(item.href) && 'bg-muted font-medium'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              )
            })}
          </ScrollArea>

          {/* Main content */}
          <div className="flex-1 w-full">{children}</div>
        </div>
      </div>
    </div>
  )
} 