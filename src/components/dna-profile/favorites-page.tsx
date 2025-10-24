'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { 
  Heart, 
  Search,
  Grid3X3,
  List,
  Calendar,
  ArrowUpDown,
  ArrowDownUp,
  RefreshCw,
  Download,
  Star,
  Globe,
  Folder as FolderIcon,
  TrendingUp,
  Eye,
  X,
  BarChart3,
  ArrowLeft
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '../ui/select';
import { DnaPageHeader } from './dna-page-header';

interface FavoritesPageProps {
  userId: string;
}

type SortOption = 'title' | 'created_at' | 'updated_at' | 'visit_count' | 'folder';
type SortDirection = 'asc' | 'desc';
type FilterOption = 'all' | 'folder' | 'tag' | 'domain';

interface MockBookmark {
  id: string;
  title: string;
  url: string;
  description?: string;
  is_favorite: boolean;
  visit_count: number;
  created_at: string;
  updated_at: string;
  folder?: { name: string };
  tags?: Array<{ name: string }>;
}

const FavoritesSkeleton = React.memo(() => (
  <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
    {Array.from({ length: 6 }).map((_, i) => (
      <Card key={i} className="animate-pulse">
        <CardContent className="p-4">
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
));

FavoritesSkeleton.displayName = 'FavoritesSkeleton';

const EmptyFavoritesState = React.memo(({ onNavigateToDashboard }: { onNavigateToDashboard: () => void }) => (
  <div className="text-center py-16 px-4">
    <div className="max-w-md mx-auto">
      <div className="relative mb-8">
        <Heart className="h-24 w-24 text-gray-200 dark:text-gray-700 mx-auto" />
        <Star className="h-8 w-8 text-yellow-400 absolute -top-2 -right-2 animate-pulse" />
      </div>
      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
        No Favorites Yet
      </h3>
      <p className="text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
        Start building your collection of favorite bookmarks. 
        Click the heart icon on any bookmark to add it here.
      </p>
      <div className="space-y-3">
        <Button onClick={onNavigateToDashboard} className="w-full sm:w-auto">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Browse Bookmarks
        </Button>
        <p className="text-sm text-gray-400 dark:text-gray-500">
          Tip: Use Ctrl+F to quickly find and favorite bookmarks
        </p>
      </div>
    </div>
  </div>
));

EmptyFavoritesState.displayName = 'EmptyFavoritesState';

const StatsCard = React.memo(({ 
  title, 
  value, 
  icon: Icon, 
  description
}: { 
  title: string; 
  value: string | number; 
  icon: React.ElementType; 
  description?: string;
}) => (
  <Card className="hover:shadow-md transition-shadow">
    <CardContent className="p-4">
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <Icon className="h-5 w-5 text-red-600 dark:text-red-400" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
          {description && (
            <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>
          )}
        </div>
      </div>
    </CardContent>
  </Card>
));

StatsCard.displayName = 'StatsCard';

const viewModes = [
  { id: 'grid', name: 'Grid', icon: Grid3X3 },
  { id: 'list', name: 'List', icon: List },
  { id: 'timeline', name: 'Timeline', icon: Calendar },
  { id: 'analytics', name: 'Analytics', icon: BarChart3 }
];

export function FavoritesPage({ userId }: FavoritesPageProps) {
  const router = useRouter();
  const [bookmarks, setBookmarks] = useState<MockBookmark[]>([]);
  const [filteredBookmarks, setFilteredBookmarks] = useState<MockBookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'timeline' | 'analytics'>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('updated_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');

  const loadData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockFavorites: MockBookmark[] = [
        {
          id: '1',
          title: 'React Documentation',
          url: 'https://react.dev',
          description: 'Official React documentation and guides',
          is_favorite: true,
          visit_count: 25,
          created_at: '2024-01-15T10:00:00Z',
          updated_at: '2024-01-20T15:30:00Z',
          folder: { name: 'Development' },
          tags: [{ name: 'React' }, { name: 'JavaScript' }]
        },
        {
          id: '2',
          title: 'TypeScript Handbook',
          url: 'https://www.typescriptlang.org/docs/',
          description: 'Complete guide to TypeScript',
          is_favorite: true,
          visit_count: 18,
          created_at: '2024-01-10T09:00:00Z',
          updated_at: '2024-01-18T14:20:00Z',
          folder: { name: 'Development' },
          tags: [{ name: 'TypeScript' }, { name: 'Programming' }]
        },
        {
          id: '3',
          title: 'Figma Design System',
          url: 'https://www.figma.com/design-systems/',
          description: 'Learn about design systems in Figma',
          is_favorite: true,
          visit_count: 12,
          created_at: '2024-01-12T11:00:00Z',
          updated_at: '2024-01-19T16:45:00Z',
          folder: { name: 'Design' },
          tags: [{ name: 'Design' }, { name: 'UI/UX' }]
        }
      ];
      
      setBookmarks(mockFavorites);
      
      if (isRefresh) {
        console.log('Favorites refreshed successfully');
      }

    } catch (error) {
      console.error('Failed to load favorites:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const applyFiltersAndSort = useCallback(() => {
    let filtered = [...bookmarks];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(bookmark => 
        bookmark.title.toLowerCase().includes(term) ||
        bookmark.url.toLowerCase().includes(term) ||
        bookmark.description?.toLowerCase().includes(term) ||
        bookmark.tags?.some(tag => tag.name.toLowerCase().includes(term))
      );
    }

    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortBy) {
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'created_at':
          aValue = new Date(a.created_at ?? 0);
          bValue = new Date(b.created_at ?? 0);
          break;
        case 'updated_at':
          aValue = new Date(a.updated_at ?? 0);
          bValue = new Date(b.updated_at ?? 0);
          break;
        case 'visit_count':
          aValue = a.visit_count || 0;
          bValue = b.visit_count || 0;
          break;
        case 'folder':
          aValue = a.folder?.name || '';
          bValue = b.folder?.name || '';
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredBookmarks(filtered);
  }, [bookmarks, searchTerm, sortBy, sortDirection]);

  useEffect(() => {
    applyFiltersAndSort();
  }, [applyFiltersAndSort]);

  const analytics = useMemo(() => {
    const totalVisits = bookmarks.reduce((sum, b) => sum + (b.visit_count || 0), 0);
    const avgVisits = bookmarks.length > 0 ? Math.round(totalVisits / bookmarks.length) : 0;
    
    const domains = new Set(bookmarks.map(b => {
      try {
        return new URL(b.url).hostname;
      } catch {
        return 'unknown';
      }
    }));

    const foldersUsed = new Set(bookmarks.map(b => b.folder?.name).filter(Boolean));
    
    return {
      totalFavorites: bookmarks.length,
      totalVisits,
      avgVisits,
      uniqueDomains: domains.size,
      foldersUsed: foldersUsed.size,
      mostVisited: bookmarks.sort((a, b) => (b.visit_count || 0) - (a.visit_count || 0))[0]
    };
  }, [bookmarks]);

  const clearFilters = useCallback(() => {
    setSearchTerm('');
    setFilterBy('all');
    setSortBy('updated_at');
    setSortDirection('desc');
  }, []);

  const handleExportFavorites = useCallback(() => {
    const exportData = bookmarks.map(bookmark => ({
      title: bookmark.title,
      url: bookmark.url,
      description: bookmark.description,
      folder: bookmark.folder?.name,
      tags: bookmark.tags?.map(tag => tag.name).join(', '),
      visits: bookmark.visit_count || 0,
      created: bookmark.created_at,
      updated: bookmark.updated_at
    }));

    const csvContent = [
      ['Title', 'URL', 'Description', 'Folder', 'Tags', 'Visits', 'Created', 'Updated'],
      ...exportData.map(item => [
        item.title,
        item.url,
        item.description || '',
        item.folder || '',
        item.tags || '',
        item.visits.toString(),
        item.created || '',
        item.updated || ''
      ])
    ].map(row => row.map(field => `"${field}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `favorites-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log('Favorites exported successfully');
  }, [bookmarks]);

  const renderBookmarks = () => {
    if (filteredBookmarks.length === 0) {
      if (searchTerm || filterBy !== 'all') {
        return (
          <div className="text-center py-12">
            <Search className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No matches found
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Try adjusting your search or filters
            </p>
            <Button variant="outline" onClick={clearFilters}>
              <X className="h-4 w-4 mr-2" />
              Clear Filters
            </Button>
          </div>
        );
      }

      return <EmptyFavoritesState onNavigateToDashboard={() => router.push('/dashboard')} />;
    }

    const gridClasses = {
      grid: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
      list: 'grid-cols-1',
      timeline: 'grid-cols-1',
      analytics: 'grid-cols-1'
    };

    return (
      <div className={`grid gap-6 ${gridClasses[viewMode]}`}>
        {filteredBookmarks.map((bookmark) => (
          <Card key={bookmark.id} className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1 line-clamp-2">
                    {bookmark.title}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                    {new URL(bookmark.url).hostname}
                  </p>
                </div>
                <Heart className="h-5 w-5 text-red-500 fill-current" />
              </div>
              
              {bookmark.description && (
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">
                  {bookmark.description}
                </p>
              )}
              
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center space-x-4">
                  <span className="flex items-center">
                    <Eye className="h-3 w-3 mr-1" />
                    {bookmark.visit_count} visits
                  </span>
                  {bookmark.folder && (
                    <span className="flex items-center">
                      <FolderIcon className="h-3 w-3 mr-1" />
                      {bookmark.folder.name}
                    </span>
                  )}
                </div>
                <span>
                  {new Date(bookmark.updated_at).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </span>
              </div>
              
              {bookmark.tags && bookmark.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3">
                  {bookmark.tags.slice(0, 3).map((tag, index) => (
                    <span 
                      key={index}
                      className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-xs rounded-full"
                    >
                      {tag.name}
                    </span>
                  ))}
                  {bookmark.tags.length > 3 && (
                    <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-xs rounded-full">
                      +{bookmark.tags.length - 3}
                    </span>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              <div className="h-6 w-px bg-gray-300 dark:bg-gray-600"></div>
              <div className="h-8 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            </div>
            <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
          </div>
        </header>
        <div className="p-4 sm:p-6">
          <FavoritesSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <DnaPageHeader 
        title="Favorites"
        description={`${bookmarks.length} bookmarks marked as favorite`}
      >
        <Button
          variant="outline"
          size="sm"
          onClick={() => loadData(true)}
          disabled={refreshing}
          className="flex items-center space-x-2"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Refresh</span>
        </Button>
        
        {bookmarks.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportFavorites}
            className="flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export</span>
          </Button>
        )}
      </DnaPageHeader>

      {bookmarks.length > 0 && (
        <div className="px-4 sm:px-6 py-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatsCard
              title="Total Favorites"
              value={analytics.totalFavorites}
              icon={Heart}
              description="Bookmarks marked as favorite"
            />
            <StatsCard
              title="Total Visits"
              value={analytics.totalVisits}
              icon={Eye}
              description="Combined visits to favorites"
            />
            <StatsCard
              title="Avg Visits"
              value={analytics.avgVisits}
              icon={TrendingUp}
              description="Average visits per favorite"
            />

            <StatsCard
              title="Most Visited"
              value={analytics.mostVisited?.visit_count || 0}
              icon={Star}
              description={analytics.mostVisited?.title || 'None'}
            />
          </div>
        </div>
      )}

      <div className="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">View:</span>
              <div className="flex rounded-lg border border-gray-200 dark:border-gray-700">
                {viewModes.map((mode) => {
                  const IconComponent = mode.icon
                  return (
                    <Button
                      key={mode.id}
                      variant={viewMode === mode.id ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode(mode.id as any)}
                      className="rounded-none first:rounded-l-lg last:rounded-r-lg border-r border-gray-200 dark:border-gray-700 last:border-r-0"
                      title={mode.name}
                    >
                      <IconComponent className="h-4 w-4" />
                    </Button>
                  )
                })}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Sort:</span>
              <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="title">Title</SelectItem>
                  <SelectItem value="created_at">Date Added</SelectItem>
                  <SelectItem value="updated_at">Last Updated</SelectItem>
                  <SelectItem value="visit_count">Most Visited</SelectItem>
                  <SelectItem value="folder">Folder</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
                className="flex items-center space-x-1"
              >
                {sortDirection === 'asc' ? <ArrowUpDown className="h-4 w-4" /> : <ArrowDownUp className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <main className="p-4 sm:p-6">
        {renderBookmarks()}
      </main>
    </div>
  );
} 