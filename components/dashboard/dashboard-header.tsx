
'use client'

import { useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { 
  SearchIcon, 
  PlusIcon, 
  GridIcon, 
  KanbanSquareIcon, 
  SettingsIcon,
  LogOutIcon,
  BookmarkIcon,
  BellIcon,
  UserIcon
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'

interface DashboardHeaderProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  currentView: 'grid' | 'kanban'
  onViewChange: (view: 'grid' | 'kanban') => void
  onAddBookmark: () => void
}

export default function DashboardHeader({
  searchQuery,
  onSearchChange,
  currentView,
  onViewChange,
  onAddBookmark
}: DashboardHeaderProps) {
  const { data: session } = useSession()

  return (
    <motion.header
      className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="max-w-[1200px] mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left section - Logo and Search */}
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <BookmarkIcon className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-slate-900 dark:text-white">
                BookmarkAI
              </span>
            </div>
            
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
              <Input
                placeholder="Search bookmarks..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10 w-80"
              />
            </div>
          </div>

          {/* Right section - Actions and User menu */}
          <div className="flex items-center space-x-4">
            {/* View Toggle */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
              <Button
                variant={currentView === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onViewChange('grid')}
                className="rounded"
              >
                <GridIcon className="h-4 w-4" />
              </Button>
              <Button
                variant={currentView === 'kanban' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onViewChange('kanban')}
                className="rounded"
              >
                <KanbanSquareIcon className="h-4 w-4" />
              </Button>
            </div>

            {/* Add Bookmark Button */}
            <Button onClick={onAddBookmark} className="bg-blue-600 hover:bg-blue-700">
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Bookmark
            </Button>

            {/* Notifications */}
            <Button variant="ghost" size="sm" className="relative" asChild>
              <Link href="/notifications">
                <BellIcon className="h-5 w-5" />
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs"
                >
                  3
                </Badge>
              </Link>
            </Button>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Link href="/profile">
                  <Button 
                    variant="ghost" 
                    className="relative h-10 w-10 rounded-full"
                    title="User Profile"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src="" alt={session?.user?.name || ''} />
                      <AvatarFallback className="bg-blue-600 text-white cursor-pointer">
                        {session?.user?.name?.slice(0, 2)?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </Link>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{session?.user?.name}</p>
                  <p className="text-xs text-slate-500">{session?.user?.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="flex items-center">
                    <UserIcon className="mr-2 h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="flex items-center">
                    <SettingsIcon className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => signOut()}
                  className="text-red-600 focus:text-red-600"
                >
                  <LogOutIcon className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </motion.header>
  )
}
