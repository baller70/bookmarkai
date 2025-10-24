
'use client'
export const dynamic = 'force-dynamic'

import React, { useState } from 'react'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Card, CardContent } from '../../components/ui/card'
import { Sheet, SheetContent, SheetTrigger } from '../../components/ui/sheet'
import { 
  Plus, 
  Upload, 
  Download, 
  Search, 
  Filter, 
  LayoutGrid, 
  List as ListIcon,
  Menu,
  Users,
  ChevronRight
} from 'lucide-react'
import { Badge } from '../../components/ui/badge'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../components/ui/dropdown-menu'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs'

interface PlayerList {
  id: string
  name: string
  count: number
  color?: string
}

export default function ManagePlayersPage() {
  const [selectedList, setSelectedList] = useState<string>('all-players')
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const playerLists: PlayerList[] = [
    { id: 'all-players', name: 'All Players', count: 0, color: 'emerald' },
    { id: 'all-players-2', name: 'All Players', count: 0 },
  ]

  // Sidebar Content Component (reusable for mobile and desktop)
  const SidebarContent = () => (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <h3 className="font-semibold text-sm text-gray-700 mb-3">Player Lists</h3>
      </div>
      
      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        {playerLists.map((list) => (
          <button
            key={list.id}
            onClick={() => {
              setSelectedList(list.id)
              setSidebarOpen(false) // Close mobile sidebar on selection
            }}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
              selectedList === list.id
                ? list.color === 'emerald'
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-900'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <span>{list.name}</span>
            <Badge 
              variant="secondary" 
              className={`${
                selectedList === list.id && list.color === 'emerald'
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-white text-gray-600 border-gray-200'
              }`}
            >
              {list.count}
            </Badge>
          </button>
        ))}
      </div>

      <div className="p-3 border-t">
        <Button 
          variant="ghost" 
          className="w-full justify-start text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add New List
        </Button>
      </div>
    </div>
  )

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Top Navigation Bar - Visible on Mobile */}
      <div className="lg:hidden bg-white border-b px-4 py-3 flex items-center justify-between sticky top-0 z-50">
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="lg:hidden">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-[280px]">
            <SidebarContent />
          </SheetContent>
        </Sheet>
        
        <h1 className="text-lg font-bold">Manage Players</h1>
        
        <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600">
          <Plus className="w-4 h-4 lg:mr-2" />
          <span className="hidden sm:inline">Add</span>
        </Button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-[260px] bg-white border-r flex-shrink-0">
          <SidebarContent />
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Header - Desktop Only */}
          <div className="hidden lg:block bg-white border-b px-6 py-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Manage Players</h1>
                <p className="text-sm text-gray-600 mt-1">Add, edit, and organize your players</p>
              </div>
              <div className="flex items-center gap-2">
                <Button size="icon" variant="ghost">
                  <span className="sr-only">Watch Tutorial</span>
                  📺
                </Button>
                <Button size="icon" variant="ghost">
                  <span className="sr-only">Begin Tour</span>
                  🎯
                </Button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4 lg:p-6">
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4 lg:p-6">
                  {/* Header Row */}
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
                    <h2 className="text-xl font-bold text-gray-900">All Players</h2>
                    
                    {/* Desktop Action Buttons */}
                    <div className="hidden lg:flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        <Upload className="w-4 h-4 mr-2" />
                        Bulk Import
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-2" />
                        Export
                      </Button>
                      <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Player
                      </Button>
                    </div>

                    {/* Mobile Action Buttons */}
                    <div className="flex lg:hidden items-center gap-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        <Upload className="w-4 h-4 mr-2" />
                        Import
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                        <Download className="w-4 h-4 mr-2" />
                        Export
                      </Button>
                    </div>
                  </div>

                  {/* Tabs */}
                  <Tabs defaultValue="in-list" className="mb-4">
                    <TabsList className="w-full lg:w-auto">
                      <TabsTrigger value="in-list" className="flex-1 lg:flex-initial">
                        Players in List (0)
                      </TabsTrigger>
                      <TabsTrigger value="not-in-list" className="flex-1 lg:flex-initial">
                        Players Not in List
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>

                  {/* Search and Filters */}
                  <div className="space-y-3 mb-6">
                    {/* Search Bar */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search players..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 pr-4"
                      />
                    </div>

                    {/* Filter Buttons */}
                    <div className="flex flex-wrap items-center gap-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm" className="flex-1 sm:flex-initial">
                            <Filter className="w-4 h-4 mr-2" />
                            Positions
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem>All Positions</DropdownMenuItem>
                          <DropdownMenuItem>Forward</DropdownMenuItem>
                          <DropdownMenuItem>Guard</DropdownMenuItem>
                          <DropdownMenuItem>Center</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm" className="flex-1 sm:flex-initial">
                            <Filter className="w-4 h-4 mr-2" />
                            Categories
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem>All Categories</DropdownMenuItem>
                          <DropdownMenuItem>Active</DropdownMenuItem>
                          <DropdownMenuItem>Inactive</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm" className="flex-1 sm:flex-initial">
                            <LayoutGrid className="w-4 h-4 mr-2" />
                            Columns
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem>Name</DropdownMenuItem>
                          <DropdownMenuItem>Position</DropdownMenuItem>
                          <DropdownMenuItem>Status</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>

                      <div className="hidden sm:block flex-1 lg:flex-initial" />

                      <span className="hidden sm:inline text-sm text-gray-500">Bulk Actions (0)</span>

                      {/* View Toggle - Desktop */}
                      <div className="hidden lg:flex border rounded-md">
                        <Button
                          variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                          size="sm"
                          onClick={() => setViewMode('grid')}
                          className="rounded-r-none"
                        >
                          <LayoutGrid className="w-4 h-4" />
                        </Button>
                        <Button
                          variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                          size="sm"
                          onClick={() => setViewMode('list')}
                          className="rounded-l-none"
                        >
                          <ListIcon className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Empty State */}
                  <div className="flex flex-col items-center justify-center py-12 lg:py-20">
                    <div className="w-16 h-16 lg:w-20 lg:h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <Users className="w-8 h-8 lg:w-10 lg:h-10 text-gray-400" />
                    </div>
                    <h3 className="text-lg lg:text-xl font-semibold text-gray-900 mb-2">No Players Found</h3>
                    <p className="text-sm text-gray-600 mb-6 text-center px-4">
                      Get started by adding your first player
                    </p>
                    <Button className="bg-emerald-500 hover:bg-emerald-600">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Player
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
