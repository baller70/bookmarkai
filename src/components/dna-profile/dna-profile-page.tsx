/* eslint-disable no-unused-vars */
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  Brain, 
  TrendingUp, 
  Clock, 
  Target, 
  Lightbulb, 
  RefreshCw,
  User,
  BarChart3,
  Zap,
  ArrowLeft
} from 'lucide-react';
import { DnaPageHeader } from './dna-page-header';
import { DNAProfileOverview } from './dna-profile-overview';
import { useRouter } from 'next/navigation';
import { NewHeaderComponent } from '../ui/new-header';
import { NewSidebarComponent } from '../ui/new-sidebar';

interface DnaProfileStats {
  totalEvents: number;
  profileAge: number;
  lastAnalysis: string | null;
  confidenceScore: number;
  activeInsights: number;
  pendingRecommendations: number;
}

const sidebarSections = [
  { id: 'overview', label: 'Overview', icon: User },
  { id: 'insights', label: 'Insights', icon: Lightbulb },
  { id: 'recommendations', label: 'Recommendations', icon: Zap },
];

export default function DnaProfilePage() {
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [profile, setProfile] = useState(null);
  const [insights, setInsights] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [stats, setStats] = useState<DnaProfileStats | null>(null);
  const [activeSection, setActiveSection] = useState('overview');
  const router = useRouter();

  useEffect(() => {
    loadDnaProfile();
  }, []);

  const loadDnaProfile = async () => {
    try {
      setLoading(true);
      
      // Load profile data
      const profileResponse = await fetch('/api/dna-profile');
      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        setProfile(profileData);
      }

      // Load insights
      const insightsResponse = await fetch('/api/dna-profile/insights');
      if (insightsResponse.ok) {
        const insightsData = await insightsResponse.json();
        setInsights(insightsData);
      }

      // Load recommendations
      const recommendationsResponse = await fetch('/api/dna-profile/recommendations');
      if (recommendationsResponse.ok) {
        const recommendationsData = await recommendationsResponse.json();
        setRecommendations(recommendationsData);
      }

      // Load stats
      const statsResponse = await fetch('/api/dna-profile/stats');
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }
    } catch (error) {
      console.error('Error loading DNA profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const triggerAnalysis = async () => {
    try {
      setAnalyzing(true);
      const response = await fetch('/api/dna-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'analyze' })
      });

      if (response.ok) {
        await loadDnaProfile();
      }
    } catch (error) {
      console.error('Error triggering analysis:', error);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleRecommendationAction = async (id: string, action: 'apply' | 'dismiss') => {
    try {
      const response = await fetch(`/api/dna-profile/recommendations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });

      if (response.ok) {
        await loadDnaProfile();
      }
    } catch (error) {
      console.error('Error handling recommendation:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading your DNA profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors">
      {/* New Header with props */}
      <NewHeaderComponent
        onBack={() => router.push('/dashboard')}
        onRunAnalysis={triggerAnalysis}
        analyzing={analyzing}
        title="DNA Profile"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* New Sidebar with props */}
          <NewSidebarComponent
            sections={sidebarSections}
            activeSection={activeSection}
            onSectionChange={setActiveSection}
          />

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-8">
            {activeSection === 'overview' && profile && (
              <DNAProfileOverview profileData={profile} />
            )}
            {activeSection === 'insights' && (
              <Card>
                <CardContent className="p-8 text-center">
                  <Lightbulb className="h-12 w-12 mx-auto mb-4 text-yellow-500" />
                  <h3 className="text-lg font-semibold mb-2">Insights</h3>
                  <p className="text-muted-foreground mb-4">
                    Your personalized insights will appear here.
                  </p>
                </CardContent>
              </Card>
            )}
            {activeSection === 'recommendations' && (
              <Card>
                <CardContent className="p-8 text-center">
                  <Zap className="h-12 w-12 mx-auto mb-4 text-orange-500" />
                  <h3 className="text-lg font-semibold mb-2">Recommendations</h3>
                  <p className="text-muted-foreground mb-4">
                    Your personalized recommendations will appear here.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}  