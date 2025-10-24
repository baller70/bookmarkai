'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { DnaPageHeader } from '../dna-profile/dna-page-header';
import { 
  Filter, 
  Building2, 
  TrendingUp, 
  Target,
  Search,
  RefreshCw,
  Check,
  X
} from 'lucide-react';

interface IndustryFilter {
  id: string;
  name: string;
  description: string;
  bookmarkCount: number;
  accuracy: number;
  isActive: boolean;
  color: string;
  icon: string;
}

interface FilteredBookmark {
  id: string;
  title: string;
  url: string;
  industry: string;
  confidence: number;
}

export function AIFilterPage() {
  const [filters, setFilters] = useState<IndustryFilter[]>([]);
  const [filteredBookmarks, setFilteredBookmarks] = useState<FilteredBookmark[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFiltering, setIsFiltering] = useState(false);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  useEffect(() => {
    loadFilters();
    loadFilteredBookmarks();
  }, []);

  const loadFilters = async () => {
    // Mock industry filters data
    const mockFilters: IndustryFilter[] = [
      {
        id: '1',
        name: 'Technology',
        description: 'Software, hardware, and tech companies',
        bookmarkCount: 24,
        accuracy: 0.94,
        isActive: false,
        color: 'bg-blue-100 text-blue-800',
        icon: '💻'
      },
      {
        id: '2',
        name: 'Design',
        description: 'UI/UX, graphic design, and creative resources',
        bookmarkCount: 18,
        accuracy: 0.87,
        isActive: false,
        color: 'bg-purple-100 text-purple-800',
        icon: '🎨'
      },
      {
        id: '3',
        name: 'Business',
        description: 'Startups, marketing, and business tools',
        bookmarkCount: 15,
        accuracy: 0.91,
        isActive: false,
        color: 'bg-green-100 text-green-800',
        icon: '📊'
      },
      {
        id: '4',
        name: 'Education',
        description: 'Learning platforms and educational content',
        bookmarkCount: 12,
        accuracy: 0.89,
        isActive: false,
        color: 'bg-orange-100 text-orange-800',
        icon: '🎓'
      },
      {
        id: '5',
        name: 'Finance',
        description: 'Banking, investing, and fintech',
        bookmarkCount: 8,
        accuracy: 0.92,
        isActive: false,
        color: 'bg-yellow-100 text-yellow-800',
        icon: '💰'
      },
      {
        id: '6',
        name: 'Healthcare',
        description: 'Medical resources and health tech',
        bookmarkCount: 6,
        accuracy: 0.88,
        isActive: false,
        color: 'bg-red-100 text-red-800',
        icon: '🏥'
      }
    ];
    setFilters(mockFilters);
  };

  const loadFilteredBookmarks = async () => {
    // Mock filtered bookmarks data
    const mockBookmarks: FilteredBookmark[] = [
      {
        id: '1',
        title: 'React Documentation',
        url: 'https://react.dev',
        industry: 'Technology',
        confidence: 0.96
      },
      {
        id: '2',
        title: 'Figma',
        url: 'https://figma.com',
        industry: 'Design',
        confidence: 0.94
      },
      {
        id: '3',
        title: 'Y Combinator',
        url: 'https://ycombinator.com',
        industry: 'Business',
        confidence: 0.92
      },
      {
        id: '4',
        title: 'Coursera',
        url: 'https://coursera.org',
        industry: 'Education',
        confidence: 0.90
      }
    ];
    setFilteredBookmarks(mockBookmarks);
  };

  const toggleFilter = (filterId: string) => {
    setActiveFilters(prev => 
      prev.includes(filterId)
        ? prev.filter(id => id !== filterId)
        : [...prev, filterId]
    );
    
    setFilters(prev => 
      prev.map(filter => 
        filter.id === filterId 
          ? { ...filter, isActive: !filter.isActive }
          : filter
      )
    );
  };

  const clearAllFilters = () => {
    setActiveFilters([]);
    setFilters(prev => prev.map(filter => ({ ...filter, isActive: false })));
  };

  const runAIFilter = async () => {
    setIsFiltering(true);
    try {
      // Simulate AI filtering process
      await new Promise(resolve => setTimeout(resolve, 2000));
      await loadFilteredBookmarks();
    } catch (error) {
      console.error('Error running AI filter:', error);
    } finally {
      setIsFiltering(false);
    }
  };

  const getFilteredBookmarks = () => {
    if (activeFilters.length === 0) return filteredBookmarks;
    
    return filteredBookmarks.filter(bookmark =>
      activeFilters.some(filterId => {
        const filter = filters.find(f => f.id === filterId);
        return filter && bookmark.industry === filter.name;
      })
    );
  };

  const filteredResults = getFilteredBookmarks().filter(bookmark =>
    bookmark.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    bookmark.industry.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Standardized Header */}
      <DnaPageHeader 
        title="AI FILTER"
        description="AI-powered industry filtering for intelligent bookmark categorization"
      >
        <Button
          onClick={runAIFilter}
          disabled={isFiltering}
          className="flex items-center gap-2"
        >
          {isFiltering ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Filter className="h-4 w-4" />
          )}
          {isFiltering ? 'Filtering...' : 'Run AI Filter'}
        </Button>
      </DnaPageHeader>

      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search filtered bookmarks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        {activeFilters.length > 0 && (
          <Button variant="outline" onClick={clearAllFilters} className="flex items-center gap-2">
            <X className="h-4 w-4" />
            Clear Filters ({activeFilters.length})
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Industries</p>
                <p className="text-2xl font-bold">{filters.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Filtered Bookmarks</p>
                <p className="text-2xl font-bold">{filteredResults.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Active Filters</p>
                <p className="text-2xl font-bold">{activeFilters.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">Avg Accuracy</p>
                <p className="text-2xl font-bold">
                  {Math.round(filters.reduce((sum, f) => sum + f.accuracy, 0) / filters.length * 100)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Industry Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Industry Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filters.map((filter) => (
              <div
                key={filter.id}
                className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                  filter.isActive 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                    : 'border-gray-200 dark:border-gray-700'
                }`}
                onClick={() => toggleFilter(filter.id)}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{filter.icon}</span>
                    <h3 className="font-semibold">{filter.name}</h3>
                  </div>
                  {filter.isActive && (
                    <Check className="h-4 w-4 text-blue-500" />
                  )}
                </div>
                
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  {filter.description}
                </p>
                
                <div className="flex items-center justify-between">
                  <Badge className={filter.color}>
                    {filter.bookmarkCount} bookmarks
                  </Badge>
                  <span className="text-sm text-gray-500">
                    {Math.round(filter.accuracy * 100)}% accuracy
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Filtered Results */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Filtered Results
            <Badge variant="secondary">{filteredResults.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredResults.length > 0 ? (
            <div className="space-y-3">
              {filteredResults.map((bookmark) => (
                <div
                  key={bookmark.id}
                  className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 dark:text-white truncate">
                        {bookmark.title}
                      </h4>
                      <p className="text-sm text-gray-500 truncate">
                        {bookmark.url}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 ml-4">
                      <Badge className="whitespace-nowrap">
                        {bookmark.industry}
                      </Badge>
                      <span className="text-sm text-gray-500">
                        {Math.round(bookmark.confidence * 100)}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Filter className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold mb-2">No Results Found</h3>
              <p className="text-gray-600 dark:text-gray-400">
                {activeFilters.length > 0 
                  ? 'No bookmarks match the selected filters.' 
                  : 'Run AI filter to categorize your bookmarks by industry.'
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 