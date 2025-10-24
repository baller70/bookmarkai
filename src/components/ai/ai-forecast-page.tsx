'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { DnaPageHeader } from '../dna-profile/dna-page-header';
import { 
  BarChart3, 
  TrendingUp, 
  Calendar, 
  Target,
  RefreshCw,
  Clock,
  Activity,
  Zap
} from 'lucide-react';

interface ForecastData {
  id: string;
  bookmarkTitle: string;
  currentUsage: number;
  forecastedUsage: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  confidence: number;
  category: string;
  timeframe: string;
}

interface UsageMetrics {
  totalBookmarks: number;
  activeBookmarks: number;
  avgUsageGrowth: number;
  forecastAccuracy: number;
}

export function AIForecastPage() {
  const [forecasts, setForecasts] = useState<ForecastData[]>([]);
  const [metrics, setMetrics] = useState<UsageMetrics | null>(null);
  const [isForecasting, setIsForecasting] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter'>('month');

  useEffect(() => {
    loadForecasts();
    loadMetrics();
  }, [selectedPeriod]);

  const loadForecasts = async () => {
    // Mock forecast data
    const mockForecasts: ForecastData[] = [
      {
        id: '1',
        bookmarkTitle: 'React Documentation',
        currentUsage: 45,
        forecastedUsage: 67,
        trend: 'increasing',
        confidence: 0.89,
        category: 'Development',
        timeframe: 'Next 30 days'
      },
      {
        id: '2',
        bookmarkTitle: 'Figma',
        currentUsage: 32,
        forecastedUsage: 28,
        trend: 'decreasing',
        confidence: 0.76,
        category: 'Design',
        timeframe: 'Next 30 days'
      },
      {
        id: '3',
        bookmarkTitle: 'ChatGPT',
        currentUsage: 78,
        forecastedUsage: 95,
        trend: 'increasing',
        confidence: 0.94,
        category: 'AI Tools',
        timeframe: 'Next 30 days'
      },
      {
        id: '4',
        bookmarkTitle: 'Stack Overflow',
        currentUsage: 56,
        forecastedUsage: 55,
        trend: 'stable',
        confidence: 0.82,
        category: 'Development',
        timeframe: 'Next 30 days'
      },
      {
        id: '5',
        bookmarkTitle: 'Notion',
        currentUsage: 41,
        forecastedUsage: 52,
        trend: 'increasing',
        confidence: 0.88,
        category: 'Productivity',
        timeframe: 'Next 30 days'
      }
    ];
    setForecasts(mockForecasts);
  };

  const loadMetrics = async () => {
    // Mock metrics data
    const mockMetrics: UsageMetrics = {
      totalBookmarks: 127,
      activeBookmarks: 89,
      avgUsageGrowth: 15.3,
      forecastAccuracy: 86.7
    };
    setMetrics(mockMetrics);
  };

  const runForecastAnalysis = async () => {
    setIsForecasting(true);
    try {
      // Simulate AI forecasting process
      await new Promise(resolve => setTimeout(resolve, 2500));
      await loadForecasts();
      await loadMetrics();
    } catch (error) {
      console.error('Error running forecast analysis:', error);
    } finally {
      setIsForecasting(false);
    }
  };

  const getTrendIcon = (trend: ForecastData['trend']) => {
    switch (trend) {
      case 'increasing':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'decreasing':
        return <TrendingUp className="h-4 w-4 text-red-500 rotate-180" />;
      case 'stable':
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTrendColor = (trend: ForecastData['trend']) => {
    switch (trend) {
      case 'increasing':
        return 'bg-green-100 text-green-800';
      case 'decreasing':
        return 'bg-red-100 text-red-800';
      case 'stable':
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getUsageChange = (current: number, forecasted: number) => {
    const change = ((forecasted - current) / current) * 100;
    return {
      value: Math.abs(change),
      isIncrease: change > 0,
      isDecrease: change < 0
    };
  };

  return (
    <div className="space-y-6">
      {/* Standardized Header */}
      <DnaPageHeader 
        title="AI FORECAST"
        description="AI-powered usage forecasting for bookmark analytics and planning"
      >
        <Button
          onClick={runForecastAnalysis}
          disabled={isForecasting}
          className="flex items-center gap-2"
        >
          {isForecasting ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <BarChart3 className="h-4 w-4" />
          )}
          {isForecasting ? 'Forecasting...' : 'Generate Forecast'}
        </Button>
      </DnaPageHeader>

      {/* Period Selector */}
      <div className="flex gap-2">
        {(['week', 'month', 'quarter'] as const).map((period) => (
          <Button
            key={period}
            variant={selectedPeriod === period ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedPeriod(period)}
            className="capitalize"
          >
            {period}
          </Button>
        ))}
      </div>

      {/* Metrics Cards */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Bookmarks</p>
                  <p className="text-2xl font-bold">{metrics.totalBookmarks}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-green-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Active Bookmarks</p>
                  <p className="text-2xl font-bold">{metrics.activeBookmarks}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-purple-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Avg Growth</p>
                  <p className="text-2xl font-bold">+{metrics.avgUsageGrowth}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-orange-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Accuracy</p>
                  <p className="text-2xl font-bold">{metrics.forecastAccuracy}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Forecast Results */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {forecasts.map((forecast) => {
          const usageChange = getUsageChange(forecast.currentUsage, forecast.forecastedUsage);
          
          return (
            <Card key={forecast.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {getTrendIcon(forecast.trend)}
                    {forecast.bookmarkTitle}
                  </CardTitle>
                  <Badge className={getTrendColor(forecast.trend)}>
                    {forecast.trend}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Usage Comparison */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Current Usage</p>
                      <p className="text-2xl font-bold">{forecast.currentUsage}</p>
                    </div>
                    <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Forecasted</p>
                      <p className="text-2xl font-bold text-blue-600">{forecast.forecastedUsage}</p>
                    </div>
                  </div>

                  {/* Change Indicator */}
                  <div className="text-center">
                    {usageChange.isIncrease && (
                      <div className="flex items-center justify-center gap-1 text-green-600">
                        <TrendingUp className="h-4 w-4" />
                        <span className="font-medium">+{usageChange.value.toFixed(1)}% increase</span>
                      </div>
                    )}
                    {usageChange.isDecrease && (
                      <div className="flex items-center justify-center gap-1 text-red-600">
                        <TrendingUp className="h-4 w-4 rotate-180" />
                        <span className="font-medium">{usageChange.value.toFixed(1)}% decrease</span>
                      </div>
                    )}
                    {!usageChange.isIncrease && !usageChange.isDecrease && (
                      <div className="flex items-center justify-center gap-1 text-gray-600">
                        <Activity className="h-4 w-4" />
                        <span className="font-medium">Stable usage</span>
                      </div>
                    )}
                  </div>

                  {/* Progress Visualization */}
                  <div>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span>Current</span>
                      <span>Forecasted</span>
                    </div>
                    <div className="relative">
                      <Progress value={(forecast.currentUsage / 100) * 100} className="h-3" />
                      <div 
                        className="absolute top-0 h-3 bg-blue-400 rounded-full opacity-60" 
                        style={{ width: `${(forecast.forecastedUsage / 100) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium text-gray-600 dark:text-gray-400">Category</p>
                      <p>{forecast.category}</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-600 dark:text-gray-400">Timeframe</p>
                      <p>{forecast.timeframe}</p>
                    </div>
                  </div>

                  {/* Confidence */}
                  <div>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="font-medium text-gray-600 dark:text-gray-400">Confidence</span>
                      <span>{Math.round(forecast.confidence * 100)}%</span>
                    </div>
                    <Progress value={forecast.confidence * 100} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {forecasts.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold mb-2">No Forecasts Available</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {isForecasting 
                ? 'Analyzing usage patterns to generate forecasts...' 
                : 'Run AI analysis to generate usage forecasts for your bookmarks.'
              }
            </p>
            {!isForecasting && (
              <Button onClick={runForecastAnalysis}>
                Generate Forecasts
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
} 