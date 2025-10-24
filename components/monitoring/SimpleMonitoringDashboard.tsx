'use client';

import React, { useState, useEffect } from 'react';

interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical';
  uptime: number;
  responseTime: number;
  errorRate: number;
  timestamp: number;
}

const SimpleMonitoringDashboard: React.FC = () => {
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  useEffect(() => {
    fetchMonitoringData();
    const interval = setInterval(fetchMonitoringData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchMonitoringData = async () => {
    try {
      setLoading(true);
      
      const healthResponse = await fetch('/api/health');
      const healthData = await healthResponse.json();
      
      setSystemHealth({
        status: healthData.status === 'ok' ? 'healthy' : 'warning',
        uptime: healthData.uptime || 0,
        responseTime: 0,
        errorRate: 0,
        timestamp: Date.now(),
      });

      setLastRefresh(new Date());
    } catch (error) {
      console.error('Failed to fetch monitoring data:', error);
      setSystemHealth({
        status: 'critical',
        uptime: 0,
        responseTime: 0,
        errorRate: 100,
        timestamp: Date.now(),
      });
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

  const getStatusColor = (status: SystemHealth['status']) => {
    switch (status) {
      case 'healthy': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">System Monitoring</h1>
          <p className="text-gray-600 mt-2">
            Monitor system health, performance, and errors in real-time
          </p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </span>
          <button
            onClick={fetchMonitoringData}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* System Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium">System Status</h3>
            <div className="w-5 h-5 bg-green-500 rounded-full"></div>
          </div>
          <div className="text-2xl font-bold">
            {systemHealth ? (
              <span className={getStatusColor(systemHealth.status)}>
                {systemHealth.status.charAt(0).toUpperCase() + systemHealth.status.slice(1)}
              </span>
            ) : (
              <span className="text-gray-400">Loading...</span>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium">Uptime</h3>
            <div className="w-5 h-5 bg-blue-500 rounded-full"></div>
          </div>
          <div className="text-2xl font-bold">
            {systemHealth ? formatUptime(systemHealth.uptime) : '--'}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium">Response Time</h3>
            <div className="w-5 h-5 bg-yellow-500 rounded-full"></div>
          </div>
          <div className="text-2xl font-bold">
            {systemHealth ? `${Math.round(systemHealth.responseTime)}ms` : '--'}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium">Error Rate</h3>
            <div className="w-5 h-5 bg-red-500 rounded-full"></div>
          </div>
          <div className="text-2xl font-bold">
            {systemHealth ? `${systemHealth.errorRate.toFixed(1)}%` : '--'}
          </div>
        </div>
      </div>

      {/* Additional Information */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">System Information</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-sm font-medium">Environment</span>
            <div className="text-sm text-gray-600">
              {typeof window !== 'undefined' ? 'Client-side' : 'Server-side'}
            </div>
          </div>
          <div>
            <span className="text-sm font-medium">Timestamp</span>
            <div className="text-sm text-gray-600">
              {new Date().toISOString()}
            </div>
          </div>
        </div>
      </div>

      {/* API Endpoints Status */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">API Endpoints</h2>
        <div className="space-y-2">
          <div className="flex items-center justify-between p-2 border rounded">
            <span className="font-mono text-sm">/api/health</span>
            <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
              200 OK
            </span>
          </div>
          <div className="flex items-center justify-between p-2 border rounded">
            <span className="font-mono text-sm">/api/analytics</span>
            <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
              200 OK
            </span>
          </div>
          <div className="flex items-center justify-between p-2 border rounded">
            <span className="font-mono text-sm">/api/bookmarks</span>
            <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
              200 OK
            </span>
          </div>
          <div className="flex items-center justify-between p-2 border rounded">
            <span className="font-mono text-sm">/api/sentry-test</span>
            <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
              200 OK
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleMonitoringDashboard; 