'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DnaPageHeader } from '../dna-profile/dna-page-header';
import { 
  Hash, 
  Sparkles, 
  Brain, 
  TrendingUp, 
  Zap,
  Plus,
  Search
} from 'lucide-react';

interface SmartTag {
  id: string;
  name: string;
  confidence: number;
  category: string;
  suggestedFor: string[];
  color: string;
}

export function AISmartTagPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [smartTags, setSmartTags] = useState<SmartTag[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  useEffect(() => {
    loadSmartTags();
  }, []);

  const loadSmartTags = async () => {
    // Mock smart tags data - in real implementation, this would come from AI analysis
    const mockTags: SmartTag[] = [
      {
        id: '1',
        name: 'web-development',
        confidence: 0.92,
        category: 'Technology',
        suggestedFor: ['React Documentation', 'MDN Web Docs', 'Stack Overflow'],
        color: 'bg-blue-100 text-blue-800'
      },
      {
        id: '2',
        name: 'design-inspiration',
        confidence: 0.87,
        category: 'Design',
        suggestedFor: ['Dribbble', 'Behance', 'Figma Community'],
        color: 'bg-purple-100 text-purple-800'
      },
      {
        id: '3',
        name: 'productivity-tools',
        confidence: 0.78,
        category: 'Productivity',
        suggestedFor: ['Notion', 'Todoist', 'Calendly'],
        color: 'bg-green-100 text-green-800'
      },
      {
        id: '4',
        name: 'ai-resources',
        confidence: 0.85,
        category: 'Technology',
        suggestedFor: ['OpenAI', 'Hugging Face', 'Papers with Code'],
        color: 'bg-orange-100 text-orange-800'
      }
    ];
    setSmartTags(mockTags);
  };

  const analyzeBookmarks = async () => {
    setIsAnalyzing(true);
    try {
      // Simulate AI analysis
      await new Promise(resolve => setTimeout(resolve, 2000));
      await loadSmartTags();
    } catch (error) {
      console.error('Error analyzing bookmarks:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const toggleTagSelection = (tagId: string) => {
    setSelectedTags(prev => 
      prev.includes(tagId) 
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  const applySelectedTags = async () => {
    if (selectedTags.length === 0) return;
    
    // Mock applying tags to bookmarks
    console.log('Applying tags:', selectedTags);
    setSelectedTags([]);
  };

  const filteredTags = smartTags.filter(tag =>
    tag.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tag.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Standardized Header */}
      <DnaPageHeader 
        title="AI SMART TAG"
        description="AI-powered intelligent tagging system for automatic bookmark organization"
      >
        <Button
          onClick={analyzeBookmarks}
          disabled={isAnalyzing}
          className="flex items-center gap-2"
        >
          {isAnalyzing ? (
            <Zap className="h-4 w-4 animate-spin" />
          ) : (
            <Brain className="h-4 w-4" />
          )}
          {isAnalyzing ? 'Analyzing...' : 'Analyze Bookmarks'}
        </Button>
      </DnaPageHeader>

      {/* Search and Actions */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search smart tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        {selectedTags.length > 0 && (
          <Button onClick={applySelectedTags} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Apply {selectedTags.length} Tags
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Hash className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Smart Tags</p>
                <p className="text-2xl font-bold">{smartTags.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">High Confidence</p>
                <p className="text-2xl font-bold">
                  {smartTags.filter(tag => tag.confidence > 0.8).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Categories</p>
                <p className="text-2xl font-bold">
                  {new Set(smartTags.map(tag => tag.category)).size}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Plus className="h-4 w-4 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">Selected</p>
                <p className="text-2xl font-bold">{selectedTags.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Smart Tags Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTags.map((tag) => (
          <Card 
            key={tag.id} 
            className={`cursor-pointer transition-all hover:shadow-md ${
              selectedTags.includes(tag.id) 
                ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                : ''
            }`}
            onClick={() => toggleTagSelection(tag.id)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Hash className="h-4 w-4" />
                  {tag.name}
                </CardTitle>
                <Badge className={tag.color}>
                  {Math.round(tag.confidence * 100)}%
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Category: {tag.category}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                    Suggested for:
                  </p>
                  <div className="space-y-1">
                    {tag.suggestedFor.slice(0, 3).map((suggestion, index) => (
                      <p key={index} className="text-sm text-gray-500 dark:text-gray-400">
                        • {suggestion}
                      </p>
                    ))}
                    {tag.suggestedFor.length > 3 && (
                      <p className="text-sm text-gray-400">
                        +{tag.suggestedFor.length - 3} more
                      </p>
                    )}
                  </div>
                </div>

                <div className="pt-2">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Confidence</span>
                    <span>{Math.round(tag.confidence * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-1">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${tag.confidence * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTags.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Hash className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold mb-2">No Smart Tags Found</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {searchQuery 
                ? 'No tags match your search criteria.' 
                : 'Run AI analysis to generate smart tags for your bookmarks.'
              }
            </p>
            {!searchQuery && (
              <Button onClick={analyzeBookmarks} disabled={isAnalyzing}>
                {isAnalyzing ? 'Analyzing...' : 'Generate Smart Tags'}
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
} 