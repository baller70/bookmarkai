'use client'

import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Eye, Sparkles, Filter, Mic, GraduationCap, Settings, TestTube, ArrowLeft, Bot } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

const nav = [
  { href: '/ai-copilot',            label: 'Overview',        icon: Eye },
  { href: '/ai-copilot/smart-tag',  label: 'Smart Tag',       icon: Sparkles },
  { href: '/ai-copilot/ai-filtering', label: 'AI Filtering',  icon: Filter },
  { href: '/ai-copilot/voice-commands', label: 'Voice Commands', icon: Mic },
  { href: '/ai-copilot/learning-mode', label: 'Learning Mode', icon: GraduationCap },
  { href: '/ai-copilot/settings',   label: 'Settings',        icon: Settings },
  { href: '/ai-copilot/voice-test', label: 'Voice Test',      icon: TestTube }
]

export default function AICopilotLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/dashboard')}
                className="flex items-center space-x-2 text-white hover:bg-white/10"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Dashboard</span>
              </Button>
              <div className="h-6 w-px bg-white/30" />
              <div className="flex items-center space-x-2">
                <Bot className="h-6 w-6" />
                <h1 className="text-xl font-bold">AI LinkPilot</h1>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-6">
          {/* Sidebar */}
          <ScrollArea className="hidden lg:block w-64 shrink-0 rounded-lg border bg-white dark:bg-card shadow-sm p-2">
            <div className="space-y-1">
              {nav.map((item) => {
                const IconComponent = item.icon
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    )}
                  >
                    <IconComponent className="h-4 w-4" />
                    {item.label}
                  </Link>
                )
              })}
            </div>
          </ScrollArea>

          {/* Main content */}
          <div className="flex-1 w-full">{children}</div>
        </div>
      </div>
    </div>
  )
} 