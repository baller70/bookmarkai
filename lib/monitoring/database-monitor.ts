// BookAIMark Database Performance Monitoring & Alerting System
// Task 14.5: Add database performance monitoring and alerting

import { EventEmitter } from 'events';
import { getDatabaseManager } from '../database/connection';
import { getCacheManager } from '../cache/redis-manager';

// ============================================================================
// 1. MONITORING CONFIGURATION
// ============================================================================

interface MonitoringConfig {
  enabled: boolean;
  checkInterval: number; // milliseconds
  alertThresholds: {
    slowQueryTime: number; // milliseconds
    connectionPoolUsage: number; // percentage
    cacheHitRate: number; // percentage
    errorRate: number; // percentage
    responseTime: number; // milliseconds
    memoryUsage: number; // percentage
    diskUsage: number; // percentage
    connectionCount: number; // absolute number
  };
  alertChannels: {
    console: boolean;
    webhook?: string;
    email?: string;
    slack?: string;
  };
  retentionDays: number;
  samplingRate: number; // 0-1, percentage of queries to monitor
}

interface DatabaseMetrics {
  timestamp: Date;
  connectionPool: {
    total: number;
    active: number;
    idle: number;
    waiting: number;
    usage: number; // percentage
  };
  queries: {
    total: number;
    successful: number;
    failed: number;
    averageTime: number;
    slowQueries: number;
    errorRate: number;
  };
  cache: {
    hitRate: number;
    missRate: number;
    evictions: number;
    memoryUsage: string;
  };
  system: {
    cpuUsage: number;
    memoryUsage: number;
    diskUsage: number;
    networkIO: {
      bytesIn: number;
      bytesOut: number;
    };
  };
  replication?: {
    lag: number; // seconds
    status: 'healthy' | 'warning' | 'critical';
    replicas: Array<{
      id: string;
      lag: number;
      connected: boolean;
    }>;
  };
}

interface Alert {
  id: string;
  timestamp: Date;
  severity: 'info' | 'warning' | 'critical';
  type: string;
  message: string;
  metrics: Partial<DatabaseMetrics>;
  resolved: boolean;
  resolvedAt?: Date;
}

// ============================================================================
// 2. DATABASE PERFORMANCE MONITOR
// ============================================================================

class DatabasePerformanceMonitor extends EventEmitter {
  private isRunning = false;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private metrics: DatabaseMetrics[] = [];
  private alerts: Alert[] = [];
  private slowQueries: Array<{
    query: string;
    duration: number;
    timestamp: Date;
    params?: any[];
  }> = [];

  constructor(private config: MonitoringConfig) {
    super();
    this.setupEventHandlers();
  }

  // ============================================================================
  // 3. MONITORING LIFECYCLE
  // ============================================================================

  start(): void {
    if (this.isRunning) {
      console.log('⚠️ Database monitor is already running');
      return;
    }

    console.log('🚀 Starting database performance monitor...');
    this.isRunning = true;

    this.monitoringInterval = setInterval(async () => {
      await this.collectMetrics();
    }, this.config.checkInterval);

    // Initial metrics collection
    this.collectMetrics();

    console.log('✅ Database performance monitor started');
  }

  stop(): void {
    if (!this.isRunning) {
      return;
    }

    console.log('🛑 Stopping database performance monitor...');
    this.isRunning = false;

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    console.log('✅ Database performance monitor stopped');
  }

  // ============================================================================
  // 4. METRICS COLLECTION
  // ============================================================================

  private async collectMetrics(): Promise<void> {
    if (!this.config.enabled) return;

    try {
      const timestamp = new Date();
      const dbManager = getDatabaseManager();
      const cacheManager = getCacheManager();

      // Collect database metrics
      const dbHealth = await dbManager.healthCheck();
      const dbPerformance = dbManager.getPerformanceMetrics();
      
      // Collect cache metrics
      const cacheHealth = await cacheManager.healthCheck();
      const cacheStats = await cacheManager.getStats();

      // Collect system metrics
      const systemMetrics = await this.collectSystemMetrics();

      const metrics: DatabaseMetrics = {
        timestamp,
        connectionPool: {
          total: dbHealth.activeConnections + dbHealth.idleConnections,
          active: dbHealth.activeConnections,
          idle: dbHealth.idleConnections,
          waiting: dbHealth.waitingClients,
          usage: this.calculatePoolUsage(dbHealth)
        },
        queries: {
          total: dbPerformance.totalQueries,
          successful: dbPerformance.totalQueries * (1 - dbPerformance.errorRate),
          failed: dbPerformance.totalQueries * dbPerformance.errorRate,
          averageTime: dbPerformance.averageResponseTime,
          slowQueries: dbPerformance.slowQueries.length,
          errorRate: dbPerformance.errorRate
        },
        cache: {
          hitRate: cacheHealth.hitRate,
          missRate: 1 - cacheHealth.hitRate,
          evictions: 0, // Would need to be tracked separately
          memoryUsage: cacheHealth.memoryUsage
        },
        system: systemMetrics
      };

      // Store metrics
      this.metrics.push(metrics);
      this.pruneOldMetrics();

      // Check for alerts
      await this.checkAlerts(metrics);

      // Emit metrics event
      this.emit('metrics', metrics);

    } catch (error) {
      console.error('❌ Error collecting database metrics:', error);
      
      // Create error alert
      const alert: Alert = {
        id: this.generateAlertId(),
        timestamp: new Date(),
        severity: 'critical',
        type: 'monitoring_error',
        message: `Failed to collect database metrics: ${error}`,
        metrics: {},
        resolved: false
      };

      this.addAlert(alert);
    }
  }

  private async collectSystemMetrics(): Promise<DatabaseMetrics['system']> {
    // In a real implementation, you'd use system monitoring libraries
    // For now, we'll return mock data that would come from system monitoring
    return {
      cpuUsage: Math.random() * 100,
      memoryUsage: Math.random() * 100,
      diskUsage: Math.random() * 100,
      networkIO: {
        bytesIn: Math.floor(Math.random() * 1000000),
        bytesOut: Math.floor(Math.random() * 1000000)
      }
    };
  }

  private calculatePoolUsage(health: any): number {
    const total = health.activeConnections + health.idleConnections;
    return total > 0 ? (health.activeConnections / total) * 100 : 0;
  }

  // ============================================================================
  // 5. ALERT SYSTEM
  // ============================================================================

  private async checkAlerts(metrics: DatabaseMetrics): Promise<void> {
    const thresholds = this.config.alertThresholds;

    // Check slow query threshold
    if (metrics.queries.averageTime > thresholds.slowQueryTime) {
      this.createAlert('slow_queries', 'warning', 
        `Average query time (${metrics.queries.averageTime}ms) exceeds threshold (${thresholds.slowQueryTime}ms)`,
        metrics
      );
    }

    // Check connection pool usage
    if (metrics.connectionPool.usage > thresholds.connectionPoolUsage) {
      this.createAlert('high_pool_usage', 'warning',
        `Connection pool usage (${metrics.connectionPool.usage.toFixed(1)}%) exceeds threshold (${thresholds.connectionPoolUsage}%)`,
        metrics
      );
    }

    // Check cache hit rate
    if (metrics.cache.hitRate < thresholds.cacheHitRate) {
      this.createAlert('low_cache_hit_rate', 'warning',
        `Cache hit rate (${(metrics.cache.hitRate * 100).toFixed(1)}%) below threshold (${thresholds.cacheHitRate * 100}%)`,
        metrics
      );
    }

    // Check error rate
    if (metrics.queries.errorRate > thresholds.errorRate) {
      this.createAlert('high_error_rate', 'critical',
        `Query error rate (${(metrics.queries.errorRate * 100).toFixed(1)}%) exceeds threshold (${thresholds.errorRate * 100}%)`,
        metrics
      );
    }

    // Check system memory usage
    if (metrics.system.memoryUsage > thresholds.memoryUsage) {
      this.createAlert('high_memory_usage', 'warning',
        `System memory usage (${metrics.system.memoryUsage.toFixed(1)}%) exceeds threshold (${thresholds.memoryUsage}%)`,
        metrics
      );
    }

    // Check connection count
    if (metrics.connectionPool.total > thresholds.connectionCount) {
      this.createAlert('high_connection_count', 'warning',
        `Connection count (${metrics.connectionPool.total}) exceeds threshold (${thresholds.connectionCount})`,
        metrics
      );
    }
  }

  private createAlert(
    type: string, 
    severity: Alert['severity'], 
    message: string, 
    metrics: DatabaseMetrics
  ): void {
    // Check if similar alert already exists and is unresolved
    const existingAlert = this.alerts.find(alert => 
      alert.type === type && !alert.resolved
    );

    if (existingAlert) {
      // Update existing alert timestamp
      existingAlert.timestamp = new Date();
      return;
    }

    const alert: Alert = {
      id: this.generateAlertId(),
      timestamp: new Date(),
      severity,
      type,
      message,
      metrics,
      resolved: false
    };

    this.addAlert(alert);
  }

  private addAlert(alert: Alert): void {
    this.alerts.push(alert);
    this.pruneOldAlerts();

    // Emit alert event
    this.emit('alert', alert);

    // Send alert through configured channels
    this.sendAlert(alert);

    console.log(`🚨 ${alert.severity.toUpperCase()} Alert: ${alert.message}`);
  }

  private async sendAlert(alert: Alert): Promise<void> {
    const channels = this.config.alertChannels;

    // Console logging (always enabled for critical alerts)
    if (channels.console || alert.severity === 'critical') {
      console.log(`🚨 [${alert.severity.toUpperCase()}] ${alert.type}: ${alert.message}`);
    }

    // Webhook notification
    if (channels.webhook) {
      try {
        await fetch(channels.webhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            alert,
            timestamp: alert.timestamp.toISOString(),
            service: 'BookAIMark Database Monitor'
          })
        });
      } catch (error) {
        console.error('❌ Failed to send webhook alert:', error);
      }
    }

    // Email notification (would require email service integration)
    if (channels.email && alert.severity === 'critical') {
      // Implementation would depend on your email service
      console.log(`📧 Would send email alert to ${channels.email}`);
    }

    // Slack notification (would require Slack integration)
    if (channels.slack) {
      // Implementation would depend on your Slack setup
      console.log(`💬 Would send Slack alert to ${channels.slack}`);
    }
  }

  // ============================================================================
  // 6. QUERY MONITORING
  // ============================================================================

  recordSlowQuery(query: string, duration: number, params?: any[]): void {
    if (!this.config.enabled) return;

    // Sample queries based on sampling rate
    if (Math.random() > this.config.samplingRate) return;

    const slowQuery = {
      query: query.length > 500 ? query.substring(0, 500) + '...' : query,
      duration,
      timestamp: new Date(),
      params: params?.length ? params.slice(0, 10) : undefined // Limit params for storage
    };

    this.slowQueries.push(slowQuery);

    // Keep only recent slow queries
    const cutoff = new Date(Date.now() - (24 * 60 * 60 * 1000)); // 24 hours
    this.slowQueries = this.slowQueries.filter(sq => sq.timestamp > cutoff);

    // Create alert for extremely slow queries
    if (duration > this.config.alertThresholds.slowQueryTime * 2) {
      this.createAlert('extremely_slow_query', 'critical',
        `Extremely slow query detected (${duration}ms): ${slowQuery.query}`,
        {} as DatabaseMetrics
      );
    }

    console.log(`🐌 Slow query recorded (${duration}ms): ${slowQuery.query.substring(0, 100)}`);
  }

  getSlowQueries(limit = 50): typeof this.slowQueries {
    return this.slowQueries
      .sort((a, b) => b.duration - a.duration)
      .slice(0, limit);
  }

  // ============================================================================
  // 7. ANALYTICS AND REPORTING
  // ============================================================================

  getMetrics(timeRange?: { start: Date; end: Date }): DatabaseMetrics[] {
    if (!timeRange) {
      return [...this.metrics];
    }

    return this.metrics.filter(metric => 
      metric.timestamp >= timeRange.start && metric.timestamp <= timeRange.end
    );
  }

  getAlerts(resolved?: boolean): Alert[] {
    if (resolved === undefined) {
      return [...this.alerts];
    }

    return this.alerts.filter(alert => alert.resolved === resolved);
  }

  getPerformanceReport(): {
    summary: {
      totalQueries: number;
      averageResponseTime: number;
      errorRate: number;
      cacheHitRate: number;
      uptime: number;
    };
    trends: {
      responseTimeTrend: number; // positive = getting slower
      errorRateTrend: number;
      cacheHitRateTrend: number;
    };
    topSlowQueries: typeof this.slowQueries;
    recentAlerts: Alert[];
  } {
    const recentMetrics = this.metrics.slice(-100); // Last 100 data points
    const olderMetrics = this.metrics.slice(-200, -100); // Previous 100 data points

    const summary = this.calculateSummary(recentMetrics);
    const trends = this.calculateTrends(recentMetrics, olderMetrics);

    return {
      summary,
      trends,
      topSlowQueries: this.getSlowQueries(10),
      recentAlerts: this.alerts.slice(-20)
    };
  }

  private calculateSummary(metrics: DatabaseMetrics[]): any {
    if (metrics.length === 0) {
      return {
        totalQueries: 0,
        averageResponseTime: 0,
        errorRate: 0,
        cacheHitRate: 0,
        uptime: 100
      };
    }

    const latest = metrics[metrics.length - 1];
    const totalQueries = metrics.reduce((sum, m) => sum + m.queries.total, 0);
    const avgResponseTime = metrics.reduce((sum, m) => sum + m.queries.averageTime, 0) / metrics.length;
    const avgErrorRate = metrics.reduce((sum, m) => sum + m.queries.errorRate, 0) / metrics.length;
    const avgCacheHitRate = metrics.reduce((sum, m) => sum + m.cache.hitRate, 0) / metrics.length;

    return {
      totalQueries,
      averageResponseTime: Math.round(avgResponseTime),
      errorRate: Math.round(avgErrorRate * 10000) / 100, // Percentage with 2 decimals
      cacheHitRate: Math.round(avgCacheHitRate * 10000) / 100,
      uptime: 99.9 // Would calculate based on actual downtime tracking
    };
  }

  private calculateTrends(recent: DatabaseMetrics[], older: DatabaseMetrics[]): any {
    if (recent.length === 0 || older.length === 0) {
      return {
        responseTimeTrend: 0,
        errorRateTrend: 0,
        cacheHitRateTrend: 0
      };
    }

    const recentAvgResponseTime = recent.reduce((sum, m) => sum + m.queries.averageTime, 0) / recent.length;
    const olderAvgResponseTime = older.reduce((sum, m) => sum + m.queries.averageTime, 0) / older.length;

    const recentAvgErrorRate = recent.reduce((sum, m) => sum + m.queries.errorRate, 0) / recent.length;
    const olderAvgErrorRate = older.reduce((sum, m) => sum + m.queries.errorRate, 0) / older.length;

    const recentAvgCacheHitRate = recent.reduce((sum, m) => sum + m.cache.hitRate, 0) / recent.length;
    const olderAvgCacheHitRate = older.reduce((sum, m) => sum + m.cache.hitRate, 0) / older.length;

    return {
      responseTimeTrend: ((recentAvgResponseTime - olderAvgResponseTime) / olderAvgResponseTime) * 100,
      errorRateTrend: ((recentAvgErrorRate - olderAvgErrorRate) / (olderAvgErrorRate || 0.001)) * 100,
      cacheHitRateTrend: ((recentAvgCacheHitRate - olderAvgCacheHitRate) / olderAvgCacheHitRate) * 100
    };
  }

  // ============================================================================
  // 8. ALERT MANAGEMENT
  // ============================================================================

  resolveAlert(alertId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (!alert || alert.resolved) {
      return false;
    }

    alert.resolved = true;
    alert.resolvedAt = new Date();

    console.log(`✅ Alert resolved: ${alert.type}`);
    this.emit('alertResolved', alert);

    return true;
  }

  resolveAlertsByType(type: string): number {
    let resolvedCount = 0;
    
    for (const alert of this.alerts) {
      if (alert.type === type && !alert.resolved) {
        alert.resolved = true;
        alert.resolvedAt = new Date();
        resolvedCount++;
      }
    }

    if (resolvedCount > 0) {
      console.log(`✅ Resolved ${resolvedCount} alerts of type: ${type}`);
    }

    return resolvedCount;
  }

  // ============================================================================
  // 9. UTILITY METHODS
  // ============================================================================

  private setupEventHandlers(): void {
    this.on('alert', (alert: Alert) => {
      // Custom alert handling can be added here
    });

    this.on('metrics', (metrics: DatabaseMetrics) => {
      // Custom metrics processing can be added here
    });
  }

  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private pruneOldMetrics(): void {
    const cutoff = (() => new Date(Date.now() - (this.config.retentionDays * 24 * 60 * 60 * 1000)))();
    this.metrics = this.metrics.filter(metric => metric.timestamp > cutoff);
  }

  private pruneOldAlerts(): void {
    const cutoff = new Date(Date.now() - (this.config.retentionDays * 24 * 60 * 60 * 1000));
    this.alerts = this.alerts.filter(alert => alert.timestamp > cutoff);
  }

  // ============================================================================
  // 10. CLEANUP
  // ============================================================================

  shutdown(): void {
    this.stop();
    this.removeAllListeners();
    this.metrics = [];
    this.alerts = [];
    this.slowQueries = [];
    console.log('✅ Database performance monitor shut down');
  }
}

// ============================================================================
// 11. CONFIGURATION FACTORY
// ============================================================================

export function createMonitoringConfig(): MonitoringConfig {
  return {
    enabled: process.env.DB_MONITORING_ENABLED !== 'false',
    checkInterval: parseInt(process.env.DB_MONITORING_INTERVAL || '30000'), // 30 seconds
    alertThresholds: {
      slowQueryTime: parseInt(process.env.DB_SLOW_QUERY_THRESHOLD || '2000'), // 2 seconds
      connectionPoolUsage: parseInt(process.env.DB_POOL_USAGE_THRESHOLD || '80'), // 80%
      cacheHitRate: parseFloat(process.env.CACHE_HIT_RATE_THRESHOLD || '0.8'), // 80%
      errorRate: parseFloat(process.env.DB_ERROR_RATE_THRESHOLD || '0.05'), // 5%
      responseTime: parseInt(process.env.DB_RESPONSE_TIME_THRESHOLD || '1000'), // 1 second
      memoryUsage: parseInt(process.env.SYSTEM_MEMORY_THRESHOLD || '85'), // 85%
      diskUsage: parseInt(process.env.SYSTEM_DISK_THRESHOLD || '90'), // 90%
      connectionCount: parseInt(process.env.DB_CONNECTION_COUNT_THRESHOLD || '50') // 50 connections
    },
    alertChannels: {
      console: true,
      webhook: process.env.ALERT_WEBHOOK_URL,
      email: process.env.ALERT_EMAIL,
      slack: process.env.ALERT_SLACK_WEBHOOK
    },
    retentionDays: parseInt(process.env.DB_METRICS_RETENTION_DAYS || '7'),
    samplingRate: parseFloat(process.env.DB_MONITORING_SAMPLING_RATE || '0.1') // 10%
  };
}

// ============================================================================
// 12. SINGLETON INSTANCE
// ============================================================================

let monitor: DatabasePerformanceMonitor | null = null;

export function createDatabaseMonitor(config?: Partial<MonitoringConfig>): DatabasePerformanceMonitor {
  if (monitor) {
    return monitor;
  }

  const defaultConfig = createMonitoringConfig();
  const finalConfig = { ...defaultConfig, ...config };
  
  monitor = new DatabasePerformanceMonitor(finalConfig);

  // Auto-start if enabled
  if (finalConfig.enabled) {
    monitor.start();
  }

  // Graceful shutdown
  process.on('SIGINT', () => {
    monitor?.shutdown();
  });

  process.on('SIGTERM', () => {
    monitor?.shutdown();
  });

  return monitor;
}

export function getDatabaseMonitor(): DatabasePerformanceMonitor {
  if (!monitor) {
    return createDatabaseMonitor();
  }
  return monitor;
}

export default DatabasePerformanceMonitor; 