'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DnaPageHeader } from '../dna-profile/dna-page-header';
import { 
  Users, 
  Hash, 
  TrendingUp, 
  Zap,
  ExternalLink,
  RefreshCw,
  Network,
  Link
} from 'lucide-react';

interface Alliance {
  tag: string;
  bookmarks: Array<{
    id: string;
    title: string;
    url: string;
  }>;
  strength: number;
  category: string;
}

export function AIAlliancesPage() {
  const [alliances, setAlliances] = useState<Alliance[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    loadAlliances();
  }, []);

  const loadAlliances = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/ai/alliances');
      if (response.ok) {
        const data = await response.json();
        // Transform the data to match our interface
        const transformedAlliances: Alliance[] = (data.alliances || []).map((alliance: any) => ({
          tag: alliance.tag,
          bookmarks: alliance.bookmarks || [],
          strength: alliance.bookmarks?.length * 10 || 50, // Mock strength calculation
          category: getCategoryFromTag(alliance.tag)
        }));
        setAlliances(transformedAlliances);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error('Error loading alliances:', error);
      // Fallback to mock data
      const mockAlliances: Alliance[] = [
        {
          tag: 'web-development',
          bookmarks: [
            { id: '1', title: 'React Documentation', url: 'https://react.dev' },
            { id: '2', title: 'MDN Web Docs', url: 'https://developer.mozilla.org' },
            { id: '3', title: 'Stack Overflow', url: 'https://stackoverflow.com' },
            { id: '4', title: 'GitHub', url: 'https://github.com' }
          ],
          strength: 85,
          category: 'Technology'
        },
        {
          tag: 'design-tools',
          bookmarks: [
            { id: '5', title: 'Figma', url: 'https://figma.com' },
            { id: '6', title: 'Adobe Creative Cloud', url: 'https://adobe.com' },
            { id: '7', title: 'Dribbble', url: 'https://dribbble.com' }
          ],
          strength: 72,
          category: 'Design'
        },
        {
          tag: 'productivity',
          bookmarks: [
            { id: '8', title: 'Notion', url: 'https://notion.so' },
            { id: '9', title: 'Todoist', url: 'https://todoist.com' },
            { id: '10', title: 'Calendly', url: 'https://calendly.com' },
            { id: '11', title: 'Slack', url: 'https://slack.com' },
            { id: '12', title: 'Zoom', url: 'https://zoom.us' }
          ],
          strength: 90,
          category: 'Productivity'
        }
      ];
      setAlliances(mockAlliances);
      setLastUpdated(new Date());
    } finally {
      setIsLoading(false);
    }
  };

  const getCategoryFromTag = (tag: string): string => {
    const categoryMap: Record<string, string> = {
      'web-development': 'Technology',
      'design': 'Design',
      'productivity': 'Productivity',
      'ai': 'Technology',
      'business': 'Business',
      'education': 'Education'
    };
    
    for (const [key, category] of Object.entries(categoryMap)) {
      if (tag.toLowerCase().includes(key)) {
        return category;
      }
    }
    return 'General';
  };

  const refreshAlliances = () => {
    loadAlliances();
  };

  const getStrengthColor = (strength: number) => {
    if (strength >= 80) return 'bg-green-100 text-green-800';
    if (strength >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Technology': 'bg-blue-100 text-blue-800',
      'Design': 'bg-purple-100 text-purple-800',
      'Productivity': 'bg-green-100 text-green-800',
      'Business': 'bg-orange-100 text-orange-800',
      'Education': 'bg-indigo-100 text-indigo-800',
      'General': 'bg-gray-100 text-gray-800'
    };
    return colors[category] || colors['General'];
  };

  return (
    <div className="space-y-6">
      {/* Standardized Header */}
      <DnaPageHeader 
        title="AI ALLIANCES"
        description="AI-discovered connections and relationships between your bookmarks"
      >
        <Button
          onClick={refreshAlliances}
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          {isLoading ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Network className="h-4 w-4" />
          )}
          {isLoading ? 'Discovering...' : 'Discover Alliances'}
        </Button>
      </DnaPageHeader>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Alliances</p>
                <p className="text-2xl font-bold">{alliances.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Strong Alliances</p>
                <p className="text-2xl font-bold">
                  {alliances.filter(a => a.strength >= 80).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Hash className="h-4 w-4 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Connected Tags</p>
                <p className="text-2xl font-bold">{alliances.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Link className="h-4 w-4 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Connections</p>
                <p className="text-2xl font-bold">
                  {alliances.reduce((sum, alliance) => sum + alliance.bookmarks.length, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alliances Grid */}
      <div className="space-y-6">
        {alliances.length > 0 ? (
          alliances.map((alliance, index) => (
            <Card key={alliance.tag} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Hash className="h-5 w-5 text-blue-500" />
                      <span className="text-xl">{alliance.tag}</span>
                    </div>
                    <Badge className={getCategoryColor(alliance.category)}>
                      {alliance.category}
                    </Badge>
                  </CardTitle>
                  <div className="flex items-center gap-3">
                    <Badge className={getStrengthColor(alliance.strength)}>
                      {alliance.strength}% strength
                    </Badge>
                    <span className="text-sm text-gray-500">
                      {alliance.bookmarks.length} bookmarks
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Strength Indicator */}
                  <div>
                    <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                      <span>Alliance Strength</span>
                      <span>{alliance.strength}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${alliance.strength}%` }}
                      />
                    </div>
                  </div>

                  {/* Connected Bookmarks */}
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                      Connected Bookmarks
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {alliance.bookmarks.map((bookmark) => (
                        <div 
                          key={bookmark.id}
                          className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <h5 className="font-medium text-sm text-gray-900 dark:text-white truncate">
                                {bookmark.title}
                              </h5>
                              <p className="text-xs text-gray-500 truncate">
                                {bookmark.url}
                              </p>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => window.open(bookmark.url, '_blank')}
                              className="ml-2 p-1 h-6 w-6"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold mb-2">No Alliances Discovered</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {isLoading 
                  ? 'Discovering bookmark alliances...' 
                  : 'Add more bookmarks with tags to discover AI-powered alliances.'
                }
              </p>
              {!isLoading && (
                <Button onClick={refreshAlliances}>
                  Discover Alliances
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
} 