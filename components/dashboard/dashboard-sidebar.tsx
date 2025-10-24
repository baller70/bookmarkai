
'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { 
  FolderIcon, 
  PlusIcon, 
  MoreVerticalIcon,
  BookmarkIcon,
  StarIcon,
  ClockIcon,
  TagIcon,
  SettingsIcon
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Folder } from '@/lib/types'
import { cn } from '@/lib/utils'

interface DashboardSidebarProps {
  folders: Folder[]
  selectedFolder: string | null
  onFolderSelect: (folderId: string | null) => void
  bookmarkCount: number
}

export default function DashboardSidebar({
  folders,
  selectedFolder,
  onFolderSelect,
  bookmarkCount
}: DashboardSidebarProps) {
  const [showAddFolder, setShowAddFolder] = useState(false)

  const sidebarItems = [
    {
      id: null,
      name: 'All Bookmarks',
      icon: BookmarkIcon,
      count: bookmarkCount,
      color: 'text-slate-600'
    },
    {
      id: 'favorites',
      name: 'Favorites',
      icon: StarIcon,
      count: 0,
      color: 'text-yellow-600'
    },
    {
      id: 'recent',
      name: 'Recent',
      icon: ClockIcon,
      count: 0,
      color: 'text-blue-600'
    },
    {
      id: 'tags',
      name: 'Tags',
      icon: TagIcon,
      count: 0,
      color: 'text-green-600'
    }
  ]

  const getFolderIconColor = (color: string) => {
    const colorMap: { [key: string]: string } = {
      blue: 'text-blue-600',
      green: 'text-green-600',
      red: 'text-red-600',
      purple: 'text-purple-600',
      yellow: 'text-yellow-600',
      pink: 'text-pink-600',
      indigo: 'text-indigo-600',
      gray: 'text-gray-600',
    }
    return colorMap[color] || 'text-slate-600'
  }

  return (
    <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 min-h-[calc(100vh-80px)] p-4">
      <motion.div
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="space-y-6"
      >
        {/* Quick Navigation */}
        <div>
          <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">
            Navigation
          </h3>
          <div className="space-y-1">
            {sidebarItems.map((item) => (
              <Button
                key={item.id || 'all'}
                variant={selectedFolder === item.id ? 'secondary' : 'ghost'}
                className={cn(
                  "w-full justify-start h-10",
                  selectedFolder === item.id && "bg-blue-50 dark:bg-blue-900/20 border-r-2 border-blue-600"
                )}
                onClick={() => onFolderSelect(item.id)}
              >
                <item.icon className={cn("h-4 w-4 mr-3", item.color)} />
                <span className="flex-1 text-left">{item.name}</span>
                {item.count > 0 && (
                  <Badge variant="secondary" className="ml-auto">
                    {item.count}
                  </Badge>
                )}
              </Button>
            ))}
          </div>
        </div>

        <Separator />

        {/* Folders */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              Folders
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAddFolder(true)}
              className="h-6 w-6 p-0"
            >
              <PlusIcon className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="space-y-1">
            {folders?.length === 0 ? (
              <div className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">
                No folders yet
              </div>
            ) : (
              folders?.map((folder) => (
                <div key={folder?.id} className="group relative">
                  <Button
                    variant={selectedFolder === folder?.id ? 'secondary' : 'ghost'}
                    className={cn(
                      "w-full justify-start h-10 pr-8",
                      selectedFolder === folder?.id && "bg-blue-50 dark:bg-blue-900/20 border-r-2 border-blue-600"
                    )}
                    onClick={() => onFolderSelect(folder?.id)}
                  >
                    <FolderIcon className={cn("h-4 w-4 mr-3", getFolderIconColor(folder?.color || 'gray'))} />
                    <span className="flex-1 text-left truncate">{folder?.name}</span>
                    {folder?.bookmarks && folder.bookmarks.length > 0 && (
                      <Badge variant="secondary" className="ml-auto">
                        {folder.bookmarks.length}
                      </Badge>
                    )}
                  </Button>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreVerticalIcon className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>Edit Folder</DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600">
                        Delete Folder
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))
            )}
          </div>
        </div>

        <Separator />

        {/* Settings */}
        <div>
          <Button variant="ghost" className="w-full justify-start h-10" asChild>
            <Link href="/settings">
              <SettingsIcon className="h-4 w-4 mr-3 text-slate-600" />
              <span className="flex-1 text-left">Settings</span>
            </Link>
          </Button>
        </div>
      </motion.div>
    </aside>
  )
}
