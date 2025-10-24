'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DnaPageHeader } from '../dna-profile/dna-page-header';
import AiCopilotTabsWrapper from './ai-copilot-tabs-wrapper';
import { 
  Bot, 
  Sparkles, 
  Brain, 
  TrendingUp,
  Zap,
  Target,
  BarChart3,
  Network,
  GraduationCap,
  Hash
} from 'lucide-react';

interface AIFeature {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  status: 'active' | 'beta' | 'coming-soon';
  usage: number;
  category: string;
}

export function AICopilotPage() {
  const [features, setFeatures] = useState<AIFeature[]>([]);
  const [stats, setStats] = useState({
    totalAnalyses: 0,
    bookmarksProcessed: 0,
    insightsGenerated: 0,
    accuracyRate: 0
  });

  useEffect(() => {
    loadAIFeatures();
    loadStats();
  }, []);

  const loadAIFeatures = async () => {
    const aiFeatures: AIFeature[] = [
      {
        id: 'smart-tag',
        title: 'AI Smart Tag',
        description: 'Intelligent tagging system that automatically categorizes and organizes your bookmarks',
        icon: <Hash className="h-6 w-6" />,
        status: 'active',
        usage: 89,
        category: 'Organization'
      },
      {
        id: 'filter',
        title: 'AI Filter',
        description: 'Advanced filtering with industry-specific categorization and smart recommendations',
        icon: <Target className="h-6 w-6" />,
        status: 'active',
        usage: 76,
        category: 'Discovery'
      },
      {
        id: 'prediction',
        title: 'AI Prediction',
        description: 'Predictive analytics for bookmark usage patterns and trend forecasting',
        icon: <Sparkles className="h-6 w-6" />,
        status: 'active',
        usage: 65,
        category: 'Analytics'
      },
      {
        id: 'alliances',
        title: 'AI Alliances',
        description: 'Discover connections and relationships between your bookmarks and interests',
        icon: <Network className="h-6 w-6" />,
        status: 'beta',
        usage: 43,
        category: 'Discovery'
      },
      {
        id: 'forecast',
        title: 'AI Forecast',
        description: 'Usage forecasting and planning tools for bookmark management optimization',
        icon: <BarChart3 className="h-6 w-6" />,
        status: 'active',
        usage: 58,
        category: 'Analytics'
      },
      {
        id: 'learning-path',
        title: 'AI Learning Path',
        description: 'Personalized learning journeys curated from your bookmarks and interests',
        icon: <GraduationCap className="h-6 w-6" />,
        status: 'beta',
        usage: 32,
        category: 'Education'
      }
    ];
    setFeatures(aiFeatures);
  };

  const loadStats = async () => {
    // Mock stats data
    setStats({
      totalAnalyses: 1247,
      bookmarksProcessed: 3891,
      insightsGenerated: 567,
      accuracyRate: 94.2
    });
  };

  const getStatusBadge = (status: AIFeature['status']) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'beta':
        return <Badge className="bg-blue-100 text-blue-800">Beta</Badge>;
      case 'coming-soon':
        return <Badge className="bg-gray-100 text-gray-800">Coming Soon</Badge>;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Organization':
        return 'text-purple-600 bg-purple-100';
      case 'Discovery':
        return 'text-blue-600 bg-blue-100';
      case 'Analytics':
        return 'text-green-600 bg-green-100';
      case 'Education':
        return 'text-orange-600 bg-orange-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full">
            <Bot className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            AI COPILOT
          </h1>
        </div>
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
          Your intelligent bookmark assistant powered by advanced AI. Discover insights, 
          predict trends, and optimize your digital knowledge management.
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Brain className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-blue-600">Total Analyses</p>
                <p className="text-3xl font-bold text-blue-700">{stats.totalAnalyses.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Target className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm font-medium text-green-600">Bookmarks Processed</p>
                <p className="text-3xl font-bold text-green-700">{stats.bookmarksProcessed.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Sparkles className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-purple-600">Insights Generated</p>
                <p className="text-3xl font-bold text-purple-700">{stats.insightsGenerated.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-orange-600">Accuracy Rate</p>
                <p className="text-3xl font-bold text-orange-700">{stats.accuracyRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Features Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            AI Features Overview
          </CardTitle>
          <p className="text-gray-600 dark:text-gray-400">
            Explore the powerful AI capabilities available in your bookmark management system
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <Card key={feature.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                          {feature.icon}
                        </div>
                        <div>
                          <h3 className="font-semibold">{feature.title}</h3>
                          <Badge className={getCategoryColor(feature.category)}>
                            {feature.category}
                          </Badge>
                        </div>
                      </div>
                      {getStatusBadge(feature.status)}
                    </div>
                    
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {feature.description}
                    </p>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Usage Score</span>
                        <span className="font-medium">{feature.usage}/100</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${feature.usage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* AI Copilot Tabs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            AI Tools & Features
          </CardTitle>
          <p className="text-gray-600 dark:text-gray-400">
            Access all AI-powered tools and features for your bookmarks
          </p>
        </CardHeader>
        <CardContent className="p-0">
          <AiCopilotTabsWrapper />
        </CardContent>
      </Card>
    </div>
  );
} 