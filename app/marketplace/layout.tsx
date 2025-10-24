'use client'

import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Store, Star, TrendingUp, Package, ShoppingCart, BarChart3, ArrowLeft, Search, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'

const navigation = [
  {
    href: '/marketplace',
    label: 'Browse',
    icon: Store
  },
  {
    href: '/marketplace/featured',
    label: 'Featured',
    icon: Star
  },
  {
    href: '/marketplace/trending',
    label: 'Trending',
    icon: TrendingUp
  },
  {
    href: '/marketplace/my-playbooks',
    label: 'My Playbooks',
    icon: Package
  },
  {
    href: '/marketplace/purchased',
    label: 'Purchased',
    icon: ShoppingCart
  },
  {
    href: '/marketplace/analytics',
    label: 'Analytics',
    icon: BarChart3
  }
]

const categories = [
  { name: 'Development', count: 45 },
  { name: 'Design', count: 32 },
  { name: 'Marketing', count: 28 },
  { name: 'Productivity', count: 67 },
  { name: 'Education', count: 23 },
  { name: 'Entertainment', count: 19 }
]

function MarketplaceLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      toast.success(`Searching for: ${searchQuery}`)
      // Implement search functionality here
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-gradient-to-r from-emerald-600 to-emerald-800 text-white shadow-lg">
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
                <Store className="h-6 w-6" />
                <h1 className="text-xl font-bold">Marketplace</h1>
              </div>
            </div>
            
            {/* Search */}
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/70" />
                <Input
                  placeholder="Search playbooks..."
                  className="pl-10 w-64 bg-white/10 border-white/20 text-white placeholder:text-white/70 focus:bg-white/20"
                />
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
              {navigation.map((item) => {
                const IconComponent = item.icon
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-emerald-50 text-emerald-700 border-r-2 border-emerald-600'
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
          <div className="flex-1 w-full">
            <Card>
              <CardContent className="p-6">
                {children}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function MarketplaceLayout({ children }: { children: React.ReactNode }) {
  return <MarketplaceLayoutInner>{children}</MarketplaceLayoutInner>
} 