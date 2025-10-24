'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { AlertCircle, CheckCircle, Clock, Activity, Server, Database, TrendingUp, TrendingDown, Minus, RefreshCw } from 'lucide-react';

interface PerformanceData {
  timestamp: string;
  health: {
    status: 'healthy' | 'warning' | 'critical';
    details: {
      uptime: number;
      memoryUsage: number;
      cpuUsage: number;
      activeConnections: number;
      averageResponseTime: number;
      errorRate: number;
    };
    alerts: string[];
  };
  summary: {
    totalRequests: number;
    averageResponseTime: number;
    minResponseTime: number;
    maxResponseTime: number;
    errorRate: number;
    slowestEndpoints: Array<{ url: string; averageTime: number }>;
    statusCodeDistribution: Record<number, number>;
  };
  analysis: {
    trends: {
      responseTime: 'increasing' | 'decreasing' | 'stable' | 'insufficient_data';
      errorRate: 'increasing' | 'decreasing' | 'stable' | 'insufficient_data';
      throughput: 'increasing' | 'decreasing' | 'stable' | 'insufficient_data';
    };
    bottlenecks: Array<{
      type: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
      description: string;
      recommendation: string;
    }>;
    recommendations: Array<{
      category: string;
      priority: 'low' | 'medium' | 'high';
      title: string;
      description: string;
      actions: string[];
    }>;
  };
}

interface HealthData {
  status: 'healthy' | 'warning' | 'critical';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  system: {
    memory: {
      used: number;
      total: number;
      usage: number;
    };
    cpu: {
      usage: number;
    };
    connections: {
      active: number;
    };
  };
  performance: {
    requestsPerMinute: number;
    averageResponseTime: number;
    errorRate: number;
    totalRequests: number;
    slowestEndpoints: Array<{ url: string; averageTime: number }>;
  };
  alerts: string[];
}

const EnhancedMonitoringDashboard: React.FC = () => {
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null);
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchMonitoringData();
    const interval = setInterval(fetchMonitoringData, 30000); // Refresh every 30 seconds
    setRefreshInterval(interval);
    return () => {
      if (interval) clearInterval(interval);
    };
  }, []);

  const fetchMonitoringData = async () => {
    try {
      setLoading(true);
      
      // Fetch performance data
      const [performanceResponse, healthResponse] = await Promise.all([
        fetch('/api/performance'),
        fetch('/api/health')
      ]);
      
      if (performanceResponse.ok) {
        const perfData = await performanceResponse.json();
        setPerformanceData(perfData);
      }
      
      if (healthResponse.ok) {
        const healthData = await healthResponse.json();
        setHealthData(healthData);
      }

      setLastRefresh(new Date());
    } catch (error) {
      console.error('Failed to fetch monitoring data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const getStatusColor = (status: 'healthy' | 'warning' | 'critical') => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-50';
      case 'warning': return 'text-yellow-600 bg-yellow-50';
      case 'critical': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: 'healthy' | 'warning' | 'critical') => {
    switch (status) {
      case 'healthy': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'warning': return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'critical': return <AlertCircle className="w-5 h-5 text-red-500" />;
      default: return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing': return <TrendingUp className="w-4 h-4 text-red-500" />;
      case 'decreasing': return <TrendingDown className="w-4 h-4 text-green-500" />;
      case 'stable': return <Minus className="w-4 h-4 text-blue-500" />;
      default: return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Enhanced System Monitoring</h1>
          <p className="text-gray-600 mt-2">
            Comprehensive performance monitoring with real-time analytics and recommendations
          </p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </span>
          <Button
            onClick={fetchMonitoringData}
            disabled={loading}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* System Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Status</CardTitle>
            {healthData && getStatusIcon(healthData.status)}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {healthData ? (
                <Badge className={getStatusColor(healthData.status)}>
                  {healthData.status.charAt(0).toUpperCase() + healthData.status.slice(1)}
                </Badge>
              ) : (
                <span className="text-gray-400">Loading...</span>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Uptime</CardTitle>
            <Clock className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {healthData ? formatUptime(healthData.uptime) : '--'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Response Time</CardTitle>
            <Activity className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {healthData ? `${Math.round(healthData.performance.averageResponseTime)}ms` : '--'}
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              {performanceData && getTrendIcon(performanceData.analysis.trends.responseTime)}
              <span className="ml-1">
                {performanceData?.analysis.trends.responseTime || 'No data'}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
            <AlertCircle className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {healthData ? `${healthData.performance.errorRate.toFixed(1)}%` : '--'}
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              {performanceData && getTrendIcon(performanceData.analysis.trends.errorRate)}
              <span className="ml-1">
                {performanceData?.analysis.trends.errorRate || 'No data'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Monitoring Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>System Resources</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {healthData && (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Memory Usage</span>
                      <span className="text-sm text-gray-600">
                        {healthData.system.memory.used}MB / {healthData.system.memory.total}MB
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${healthData.system.memory.usage}%` }}
                      ></div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">CPU Usage</span>
                      <span className="text-sm text-gray-600">{healthData.system.cpu.usage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full" 
                        style={{ width: `${healthData.system.cpu.usage}%` }}
                      ></div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Request Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {healthData && (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Requests/Min</span>
                      <span className="text-sm text-gray-600">{healthData.performance.requestsPerMinute}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Total Requests</span>
                      <span className="text-sm text-gray-600">{healthData.performance.totalRequests}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Active Connections</span>
                      <span className="text-sm text-gray-600">{healthData.system.connections.active}</span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              {performanceData && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{Math.round(performanceData.summary.averageResponseTime)}ms</div>
                      <div className="text-sm text-gray-600">Average Response Time</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{Math.round(performanceData.summary.minResponseTime)}ms</div>
                      <div className="text-sm text-gray-600">Fastest Response</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{Math.round(performanceData.summary.maxResponseTime)}ms</div>
                      <div className="text-sm text-gray-600">Slowest Response</div>
                    </div>
                  </div>
                  
                  {performanceData.summary.slowestEndpoints.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2">Slowest Endpoints</h4>
                      <div className="space-y-2">
                        {performanceData.summary.slowestEndpoints.map((endpoint, index) => (
                          <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                            <span className="font-mono text-sm">{endpoint.url}</span>
                            <span className="text-sm text-gray-600">{Math.round(endpoint.averageTime)}ms</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Information</CardTitle>
            </CardHeader>
            <CardContent>
              {healthData && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm font-medium">Version</span>
                    <div className="text-sm text-gray-600">{healthData.version}</div>
                  </div>
                  <div>
                    <span className="text-sm font-medium">Environment</span>
                    <div className="text-sm text-gray-600">{healthData.environment}</div>
                  </div>
                  <div>
                    <span className="text-sm font-medium">Last Updated</span>
                    <div className="text-sm text-gray-600">{new Date(healthData.timestamp).toLocaleString()}</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              {healthData?.alerts && healthData.alerts.length > 0 ? (
                <div className="space-y-2">
                  {healthData.alerts.map((alert, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded">
                      <AlertCircle className="w-4 h-4 text-red-500" />
                      <span className="text-sm">{alert}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
                  <p className="text-gray-600">No active alerts</p>
                </div>
              )}
              
              {performanceData?.analysis.bottlenecks && performanceData.analysis.bottlenecks.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-semibold mb-2">Performance Bottlenecks</h4>
                  <div className="space-y-2">
                    {performanceData.analysis.bottlenecks.map((bottleneck, index) => (
                      <div key={index} className="p-3 border rounded">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium">{bottleneck.type}</span>
                          <Badge className={getSeverityColor(bottleneck.severity)}>
                            {bottleneck.severity}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">{bottleneck.description}</p>
                        <p className="text-xs text-blue-600">{bottleneck.recommendation}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              {performanceData?.analysis.recommendations && performanceData.analysis.recommendations.length > 0 ? (
                <div className="space-y-4">
                  {performanceData.analysis.recommendations.map((rec, index) => (
                    <div key={index} className="p-4 border rounded">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold">{rec.title}</h4>
                        <Badge className={getPriorityColor(rec.priority)}>
                          {rec.priority} priority
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{rec.description}</p>
                      <div className="text-xs text-gray-500">
                        <span className="font-medium">Category:</span> {rec.category}
                      </div>
                      <div className="mt-2">
                        <span className="text-xs font-medium">Recommended Actions:</span>
                        <ul className="text-xs text-gray-600 mt-1 ml-4">
                          {rec.actions.map((action, actionIndex) => (
                            <li key={actionIndex} className="list-disc">{action}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
                  <p className="text-gray-600">No recommendations at this time</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EnhancedMonitoringDashboard; 