'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { DnaPageHeader } from '../dna-profile/dna-page-header';
import { 
  Sparkles, 
  TrendingUp, 
  Target, 
  Clock,
  Zap,
  RefreshCw,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react';

interface Prediction {
  id: string;
  type: 'trending' | 'declining' | 'stable';
  title: string;
  description: string;
  confidence: number;
  timeframe: string;
  impact: 'high' | 'medium' | 'low';
  category: string;
  relatedBookmarks: string[];
}

interface TrendData {
  period: string;
  value: number;
  prediction: number;
}

export function AIPredictionPage() {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'week' | 'month' | 'quarter'>('month');

  useEffect(() => {
    loadPredictions();
    loadTrendData();
  }, [selectedTimeframe]);

  const loadPredictions = async () => {
    // Mock predictions data
    const mockPredictions: Prediction[] = [
      {
        id: '1',
        type: 'trending',
        title: 'AI Tools Surge',
        description: 'AI-related bookmarks will see 40% increase in usage',
        confidence: 0.87,
        timeframe: 'Next 30 days',
        impact: 'high',
        category: 'Technology',
        relatedBookmarks: ['OpenAI', 'ChatGPT', 'Midjourney']
      },
      {
        id: '2',
        type: 'declining',
        title: 'Legacy Tools Decline',
        description: 'Traditional design tools usage may drop by 25%',
        confidence: 0.73,
        timeframe: 'Next 60 days',
        impact: 'medium',
        category: 'Design',
        relatedBookmarks: ['Photoshop', 'Illustrator']
      },
      {
        id: '3',
        type: 'stable',
        title: 'Development Resources Stable',
        description: 'Programming documentation will maintain current usage',
        confidence: 0.91,
        timeframe: 'Next 90 days',
        impact: 'low',
        category: 'Development',
        relatedBookmarks: ['MDN', 'Stack Overflow', 'GitHub']
      },
      {
        id: '4',
        type: 'trending',
        title: 'Remote Work Tools Growth',
        description: 'Collaboration tools expected to grow by 35%',
        confidence: 0.82,
        timeframe: 'Next 45 days',
        impact: 'high',
        category: 'Productivity',
        relatedBookmarks: ['Slack', 'Zoom', 'Notion']
      }
    ];
    setPredictions(mockPredictions);
  };

  const loadTrendData = async () => {
    // Mock trend data based on selected timeframe
    const mockTrendData: TrendData[] = selectedTimeframe === 'week' 
      ? [
          { period: 'Mon', value: 45, prediction: 48 },
          { period: 'Tue', value: 52, prediction: 55 },
          { period: 'Wed', value: 48, prediction: 52 },
          { period: 'Thu', value: 61, prediction: 65 },
          { period: 'Fri', value: 55, prediction: 58 },
          { period: 'Sat', value: 43, prediction: 45 },
          { period: 'Sun', value: 38, prediction: 40 }
        ]
      : selectedTimeframe === 'month'
      ? [
          { period: 'Week 1', value: 180, prediction: 195 },
          { period: 'Week 2', value: 220, prediction: 235 },
          { period: 'Week 3', value: 195, prediction: 210 },
          { period: 'Week 4', value: 240, prediction: 255 }
        ]
      : [
          { period: 'Month 1', value: 850, prediction: 920 },
          { period: 'Month 2', value: 920, prediction: 980 },
          { period: 'Month 3', value: 875, prediction: 940 }
        ];
    
    setTrendData(mockTrendData);
  };

  const runPredictionAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      // Simulate AI prediction analysis
      await new Promise(resolve => setTimeout(resolve, 3000));
      await loadPredictions();
      await loadTrendData();
    } catch (error) {
      console.error('Error running prediction analysis:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getPredictionIcon = (type: Prediction['type']) => {
    switch (type) {
      case 'trending':
        return <ArrowUp className="h-4 w-4 text-green-500" />;
      case 'declining':
        return <ArrowDown className="h-4 w-4 text-red-500" />;
      case 'stable':
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getPredictionColor = (type: Prediction['type']) => {
    switch (type) {
      case 'trending':
        return 'bg-green-100 text-green-800';
      case 'declining':
        return 'bg-red-100 text-red-800';
      case 'stable':
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getImpactColor = (impact: Prediction['impact']) => {
    switch (impact) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Standardized Header */}
      <DnaPageHeader 
        title="AI PREDICTION"
        description="AI-powered predictions for bookmark usage trends and patterns"
      >
        <Button
          onClick={runPredictionAnalysis}
          disabled={isAnalyzing}
          className="flex items-center gap-2"
        >
          {isAnalyzing ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          {isAnalyzing ? 'Analyzing...' : 'Generate Predictions'}
        </Button>
      </DnaPageHeader>

      {/* Timeframe Selector */}
      <div className="flex gap-2">
        {(['week', 'month', 'quarter'] as const).map((timeframe) => (
          <Button
            key={timeframe}
            variant={selectedTimeframe === timeframe ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedTimeframe(timeframe)}
            className="capitalize"
          >
            {timeframe}
          </Button>
        ))}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Predictions</p>
                <p className="text-2xl font-bold">{predictions.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Trending</p>
                <p className="text-2xl font-bold">
                  {predictions.filter(p => p.type === 'trending').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">High Confidence</p>
                <p className="text-2xl font-bold">
                  {predictions.filter(p => p.confidence > 0.8).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">Avg Confidence</p>
                <p className="text-2xl font-bold">
                  {Math.round(predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length * 100)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trend Visualization */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Usage Trend & Predictions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {trendData.map((data, index) => (
              <div key={data.period} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{data.period}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-gray-600">Actual: {data.value}</span>
                    <span className="text-blue-600">Predicted: {data.prediction}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Progress value={(data.value / Math.max(...trendData.map(d => Math.max(d.value, d.prediction)))) * 100} className="h-2" />
                  </div>
                  <div className="flex-1">
                    <Progress value={(data.prediction / Math.max(...trendData.map(d => Math.max(d.value, d.prediction)))) * 100} className="h-2 bg-blue-200" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Predictions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {predictions.map((prediction) => (
          <Card key={prediction.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  {getPredictionIcon(prediction.type)}
                  {prediction.title}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge className={getPredictionColor(prediction.type)}>
                    {prediction.type}
                  </Badge>
                  <Badge className={getImpactColor(prediction.impact)}>
                    {prediction.impact} impact
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-gray-600 dark:text-gray-400">
                  {prediction.description}
                </p>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium text-gray-600 dark:text-gray-400">Timeframe</p>
                    <p>{prediction.timeframe}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-600 dark:text-gray-400">Category</p>
                    <p>{prediction.category}</p>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="font-medium text-gray-600 dark:text-gray-400">Confidence</span>
                    <span>{Math.round(prediction.confidence * 100)}%</span>
                  </div>
                  <Progress value={prediction.confidence * 100} className="h-2" />
                </div>

                <div>
                  <p className="font-medium text-gray-600 dark:text-gray-400 mb-2 text-sm">
                    Related Bookmarks
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {prediction.relatedBookmarks.map((bookmark, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {bookmark}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {predictions.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Sparkles className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold mb-2">No Predictions Available</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {isAnalyzing 
                ? 'Analyzing bookmark patterns to generate predictions...' 
                : 'Run AI analysis to generate usage predictions for your bookmarks.'
              }
            </p>
            {!isAnalyzing && (
              <Button onClick={runPredictionAnalysis}>
                Generate Predictions
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
} 