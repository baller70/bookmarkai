
'use client';

import dynamic from 'next/dynamic';

// Use the enhanced monitoring dashboard with full performance monitoring
const EnhancedMonitoringDashboard = dynamic(
  () => import('../../components/monitoring/EnhancedMonitoringDashboard'),
  { 
    loading: () => <div className="flex items-center justify-center h-64">Loading enhanced monitoring dashboard...</div>
  }
);

export default function MonitoringPage() {
  return (
    <div className="container mx-auto p-6">
      <EnhancedMonitoringDashboard />
    </div>
  );
} 