// BookAIMark Read Replica Management System
// Task 14.3: Set up read replicas for scaling database operations

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Pool, PoolClient } from 'pg';

// ============================================================================
// 1. READ REPLICA CONFIGURATION
// ============================================================================

interface ReplicaConfig {
  id: string;
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  ssl?: boolean;
  weight: number; // Load balancing weight (1-10)
  region?: string;
  priority: number; // 1 = highest priority
  maxConnections: number;
  healthCheckInterval: number; // ms
}

interface ReplicaHealth {
  id: string;
  isHealthy: boolean;
  lastCheck: Date;
  responseTime: number;
  errorCount: number;
  consecutiveFailures: number;
  connectionCount: number;
}

interface QueryRouting {
  useReplicas: boolean;
  preferredRegion?: string;
  maxRetries: number;
  fallbackToMaster: boolean;
  readOnly: boolean;
}

// ============================================================================
// 2. READ REPLICA MANAGER
// ============================================================================

class ReadReplicaManager {
  private masterPool: Pool;
  private replicaPools: Map<string, Pool> = new Map();
  private replicaHealth: Map<string, ReplicaHealth> = new Map();
  private healthCheckIntervals: Map<string, NodeJS.Timeout> = new Map();
  private loadBalancer: LoadBalancer;
  private circuitBreaker: CircuitBreaker;
  private queryMetrics: QueryMetrics[] = [];

  constructor(
    private masterConfig: ReplicaConfig,
    private replicaConfigs: ReplicaConfig[]
  ) {
    this.initializeMaster();
    this.initializeReplicas();
    this.loadBalancer = new LoadBalancer(replicaConfigs);
    this.circuitBreaker = new CircuitBreaker();
    this.startHealthChecks();
  }

  // ============================================================================
  // 3. INITIALIZATION
  // ============================================================================

  private initializeMaster(): void {
    this.masterPool = new Pool({
      host: this.masterConfig.host,
      port: this.masterConfig.port,
      database: this.masterConfig.database,
      user: this.masterConfig.user,
      password: this.masterConfig.password,
      ssl: this.masterConfig.ssl ? { rejectUnauthorized: false } : false,
      max: this.masterConfig.maxConnections,
      min: 2,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
      application_name: 'BookAIMark-Master',
    });

    this.masterPool.on('error', (err) => {
      console.error('🚨 Master database error:', err);
    });

    console.log('✅ Master database pool initialized');
  }

  private initializeReplicas(): void {
    for (const config of this.replicaConfigs) {
      const pool = new Pool({
        host: config.host,
        port: config.port,
        database: config.database,
        user: config.user,
        password: config.password,
        ssl: config.ssl ? { rejectUnauthorized: false } : false,
        max: config.maxConnections,
        min: 1,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
        application_name: `BookAIMark-Replica-${config.id}`,
      });

      pool.on('error', (err) => {
        console.error(`🚨 Replica ${config.id} error:`, err);
        this.markReplicaUnhealthy(config.id, err.message);
      });

      this.replicaPools.set(config.id, pool);
      this.replicaHealth.set(config.id, {
        id: config.id,
        isHealthy: true,
        lastCheck: new Date(),
        responseTime: 0,
        errorCount: 0,
        consecutiveFailures: 0,
        connectionCount: 0,
      });

      console.log(`✅ Replica ${config.id} pool initialized`);
    }
  }

  // ============================================================================
  // 4. HEALTH MONITORING
  // ============================================================================

  private startHealthChecks(): void {
    for (const config of this.replicaConfigs) {
      const interval = setInterval(async () => {
        await this.checkReplicaHealth(config.id);
      }, config.healthCheckInterval);

      this.healthCheckIntervals.set(config.id, interval);
    }

    // Master health check
    const masterInterval = setInterval(async () => {
      await this.checkMasterHealth();
    }, this.masterConfig.healthCheckInterval);

    this.healthCheckIntervals.set('master', masterInterval);
  }

  private async checkReplicaHealth(replicaId: string): Promise<void> {
    const pool = this.replicaPools.get(replicaId);
    if (!pool) return;

    const startTime = Date.now();
    const health = this.replicaHealth.get(replicaId)!;

    try {
      const client = await pool.connect();
      
      // Simple health check query
      await client.query('SELECT 1 as health_check');
      
      // Check replication lag
      const lagResult = await client.query(`
        SELECT 
          CASE 
            WHEN pg_is_in_recovery() THEN 
              EXTRACT(EPOCH FROM (now() - pg_last_xact_replay_timestamp()))
            ELSE 0 
          END as lag_seconds
      `);
      
      const lagSeconds = parseFloat(lagResult.rows[0]?.lag_seconds || '0');
      
      client.release();

      const responseTime = Date.now() - startTime;

      // Update health status
      health.isHealthy = lagSeconds < 30; // Consider unhealthy if lag > 30 seconds
      health.lastCheck = new Date();
      health.responseTime = responseTime;
      health.consecutiveFailures = 0;
      health.connectionCount = pool.totalCount;

      if (lagSeconds > 10) {
        console.warn(`⚠️ Replica ${replicaId} has high lag: ${lagSeconds}s`);
      }

      console.log(`💚 Replica ${replicaId} healthy (${responseTime}ms, lag: ${lagSeconds}s)`);

    } catch (error) {
      health.isHealthy = false;
      health.lastCheck = new Date();
      health.errorCount++;
      health.consecutiveFailures++;
      health.responseTime = Date.now() - startTime;

      console.error(`❌ Replica ${replicaId} health check failed:`, error);

      // Remove from load balancer if too many failures
      if (health.consecutiveFailures >= 3) {
        this.loadBalancer.removeReplica(replicaId);
        console.warn(`🚫 Replica ${replicaId} removed from load balancer`);
      }
    }
  }

  private async checkMasterHealth(): Promise<void> {
    const startTime = Date.now();

    try {
      const client = await this.masterPool.connect();
      await client.query('SELECT 1 as health_check');
      client.release();

      const responseTime = Date.now() - startTime;
      console.log(`💚 Master database healthy (${responseTime}ms)`);

    } catch (error) {
      console.error('❌ Master database health check failed:', error);
    }
  }

  private markReplicaUnhealthy(replicaId: string, error: string): void {
    const health = this.replicaHealth.get(replicaId);
    if (health) {
      health.isHealthy = false;
      health.errorCount++;
      health.consecutiveFailures++;
      this.loadBalancer.removeReplica(replicaId);
    }
  }

  // ============================================================================
  // 5. QUERY ROUTING
  // ============================================================================

  async executeQuery<T = any>(
    query: string,
    params: any[] = [],
    routing: QueryRouting = {
      useReplicas: true,
      maxRetries: 2,
      fallbackToMaster: true,
      readOnly: true
    }
  ): Promise<T[]> {
    const startTime = Date.now();
    let attempt = 0;
    let lastError: Error | null = null;

    // For write operations, always use master
    if (!routing.readOnly || this.isWriteQuery(query)) {
      return this.executeOnMaster(query, params);
    }

    // Try replicas first if enabled
    if (routing.useReplicas) {
      while (attempt <= routing.maxRetries) {
        const replica = this.loadBalancer.selectReplica(routing.preferredRegion);
        
        if (replica && this.circuitBreaker.canExecute(replica.id)) {
          try {
            const result = await this.executeOnReplica(replica.id, query, params);
            
            this.circuitBreaker.recordSuccess(replica.id);
            this.recordMetric(query, Date.now() - startTime, true, 'replica', replica.id);
            
            return result;
          } catch (error) {
            lastError = error as Error;
            this.circuitBreaker.recordFailure(replica.id);
            this.markReplicaUnhealthy(replica.id, lastError.message);
            
            console.warn(`⚠️ Query failed on replica ${replica.id}, attempt ${attempt + 1}:`, error);
            attempt++;
          }
        } else {
          break; // No healthy replicas available
        }
      }
    }

    // Fallback to master if enabled
    if (routing.fallbackToMaster) {
      try {
        const result = await this.executeOnMaster(query, params);
        this.recordMetric(query, Date.now() - startTime, true, 'master', 'master');
        return result;
      } catch (error) {
        this.recordMetric(query, Date.now() - startTime, false, 'master', 'master');
        throw error;
      }
    }

    throw lastError || new Error('No available database connections');
  }

  private async executeOnMaster<T = any>(query: string, params: any[]): Promise<T[]> {
    const client = await this.masterPool.connect();
    try {
      const result = await client.query(query, params);
      return result.rows;
    } finally {
      client.release();
    }
  }

  private async executeOnReplica<T = any>(
    replicaId: string, 
    query: string, 
    params: any[]
  ): Promise<T[]> {
    const pool = this.replicaPools.get(replicaId);
    if (!pool) throw new Error(`Replica ${replicaId} not found`);

    const client = await pool.connect();
    try {
      const result = await client.query(query, params);
      return result.rows;
    } finally {
      client.release();
    }
  }

  private isWriteQuery(query: string): boolean {
    const writeKeywords = ['INSERT', 'UPDATE', 'DELETE', 'CREATE', 'DROP', 'ALTER', 'TRUNCATE'];
    const upperQuery = query.trim().toUpperCase();
    return writeKeywords.some(keyword => upperQuery.startsWith(keyword));
  }

  // ============================================================================
  // 6. PERFORMANCE MONITORING
  // ============================================================================

  private recordMetric(
    query: string,
    duration: number,
    success: boolean,
    source: 'master' | 'replica',
    nodeId: string
  ): void {
    const metric = {
      query: query.length > 100 ? query.substring(0, 100) + '...' : query,
      duration,
      timestamp: new Date(),
      success,
      source,
      nodeId
    };

    this.queryMetrics.push(metric);

    // Keep only recent metrics
    if (this.queryMetrics.length > 1000) {
      this.queryMetrics.shift();
    }
  }

  getPerformanceReport(): {
    masterMetrics: any;
    replicaMetrics: Map<string, any>;
    loadBalancerStats: any;
    circuitBreakerStats: any;
  } {
    const masterQueries = this.queryMetrics.filter(m => m.source === 'master');
    const replicaQueries = this.queryMetrics.filter(m => m.source === 'replica');

    const masterMetrics = {
      totalQueries: masterQueries.length,
      averageResponseTime: this.calculateAverage(masterQueries.map(m => m.duration)),
      successRate: masterQueries.filter(m => m.success).length / masterQueries.length || 0
    };

    const replicaMetrics = new Map();
    for (const config of this.replicaConfigs) {
      const queries = replicaQueries.filter(m => m.nodeId === config.id);
      replicaMetrics.set(config.id, {
        totalQueries: queries.length,
        averageResponseTime: this.calculateAverage(queries.map(m => m.duration)),
        successRate: queries.filter(m => m.success).length / queries.length || 0,
        health: this.replicaHealth.get(config.id)
      });
    }

    return {
      masterMetrics,
      replicaMetrics,
      loadBalancerStats: this.loadBalancer.getStats(),
      circuitBreakerStats: this.circuitBreaker.getStats()
    };
  }

  private calculateAverage(numbers: number[]): number {
    return numbers.length > 0 ? numbers.reduce((a, b) => a + b, 0) / numbers.length : 0;
  }

  // ============================================================================
  // 7. CLEANUP
  // ============================================================================

  async shutdown(): Promise<void> {
    console.log('🔌 Shutting down read replica manager...');

    // Clear health check intervals
    for (const interval of this.healthCheckIntervals.values()) {
      clearInterval(interval);
    }

    // Close all pools
    await this.masterPool.end();
    for (const pool of this.replicaPools.values()) {
      await pool.end();
    }

    console.log('✅ Read replica manager shut down');
  }
}

// ============================================================================
// 8. LOAD BALANCER
// ============================================================================

class LoadBalancer {
  private availableReplicas: Set<string> = new Set();
  private roundRobinIndex = 0;
  private requestCounts: Map<string, number> = new Map();

  constructor(private replicaConfigs: ReplicaConfig[]) {
    for (const config of replicaConfigs) {
      this.availableReplicas.add(config.id);
      this.requestCounts.set(config.id, 0);
    }
  }

  selectReplica(preferredRegion?: string): ReplicaConfig | null {
    const available = Array.from(this.availableReplicas);
    if (available.length === 0) return null;

    // Filter by region if specified
    let candidates = this.replicaConfigs.filter(config => 
      available.includes(config.id) &&
      (!preferredRegion || config.region === preferredRegion)
    );

    if (candidates.length === 0) {
      candidates = this.replicaConfigs.filter(config => available.includes(config.id));
    }

    if (candidates.length === 0) return null;

    // Weighted round-robin selection
    candidates.sort((a, b) => {
      const aRequests = this.requestCounts.get(a.id) || 0;
      const bRequests = this.requestCounts.get(b.id) || 0;
      const aWeight = aRequests / a.weight;
      const bWeight = bRequests / b.weight;
      return aWeight - bWeight;
    });

    const selected = candidates[0];
    this.requestCounts.set(selected.id, (this.requestCounts.get(selected.id) || 0) + 1);

    return selected;
  }

  removeReplica(replicaId: string): void {
    this.availableReplicas.delete(replicaId);
  }

  addReplica(replicaId: string): void {
    this.availableReplicas.add(replicaId);
  }

  getStats(): any {
    return {
      availableReplicas: Array.from(this.availableReplicas),
      requestCounts: Object.fromEntries(this.requestCounts)
    };
  }
}

// ============================================================================
// 9. CIRCUIT BREAKER
// ============================================================================

class CircuitBreaker {
  private states: Map<string, CircuitState> = new Map();
  private readonly failureThreshold = 5;
  private readonly timeoutMs = 60000; // 1 minute

  canExecute(replicaId: string): boolean {
    const state = this.getState(replicaId);
    
    if (state.state === 'closed') return true;
    if (state.state === 'open') {
      if (Date.now() - state.lastFailure > this.timeoutMs) {
        state.state = 'half-open';
        return true;
      }
      return false;
    }
    if (state.state === 'half-open') return true;
    
    return false;
  }

  recordSuccess(replicaId: string): void {
    const state = this.getState(replicaId);
    state.failures = 0;
    state.state = 'closed';
  }

  recordFailure(replicaId: string): void {
    const state = this.getState(replicaId);
    state.failures++;
    state.lastFailure = Date.now();
    
    if (state.failures >= this.failureThreshold) {
      state.state = 'open';
    }
  }

  private getState(replicaId: string): CircuitState {
    if (!this.states.has(replicaId)) {
      this.states.set(replicaId, {
        state: 'closed',
        failures: 0,
        lastFailure: 0
      });
    }
    return this.states.get(replicaId)!;
  }

  getStats(): any {
    const stats: any = {};
    for (const [replicaId, state] of this.states) {
      stats[replicaId] = { ...state };
    }
    return stats;
  }
}

// ============================================================================
// 10. TYPES AND INTERFACES
// ============================================================================

interface CircuitState {
  state: 'open' | 'closed' | 'half-open';
  failures: number;
  lastFailure: number;
}

interface QueryMetrics {
  query: string;
  duration: number;
  timestamp: Date;
  success: boolean;
  source: 'master' | 'replica';
  nodeId: string;
}

// ============================================================================
// 11. CONFIGURATION FACTORY
// ============================================================================

export function createReadReplicaConfig(): {
  master: ReplicaConfig;
  replicas: ReplicaConfig[];
} {
  const master: ReplicaConfig = {
    id: 'master',
    host: process.env.DB_MASTER_HOST || 'localhost',
    port: parseInt(process.env.DB_MASTER_PORT || '5432'),
    database: process.env.DB_NAME || 'bookaimark',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    ssl: process.env.NODE_ENV === 'production',
    weight: 10,
    priority: 1,
    maxConnections: 20,
    healthCheckInterval: 30000
  };

  const replicas: ReplicaConfig[] = [];

  // Read replica 1 (same region)
  if (process.env.DB_REPLICA1_HOST) {
    replicas.push({
      id: 'replica-1',
      host: process.env.DB_REPLICA1_HOST,
      port: parseInt(process.env.DB_REPLICA1_PORT || '5432'),
      database: process.env.DB_NAME || 'bookaimark',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || '',
      ssl: process.env.NODE_ENV === 'production',
      weight: 8,
      region: process.env.DB_REPLICA1_REGION || 'us-east-1',
      priority: 2,
      maxConnections: 15,
      healthCheckInterval: 15000
    });
  }

  // Read replica 2 (different region)
  if (process.env.DB_REPLICA2_HOST) {
    replicas.push({
      id: 'replica-2',
      host: process.env.DB_REPLICA2_HOST,
      port: parseInt(process.env.DB_REPLICA2_PORT || '5432'),
      database: process.env.DB_NAME || 'bookaimark',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || '',
      ssl: process.env.NODE_ENV === 'production',
      weight: 6,
      region: process.env.DB_REPLICA2_REGION || 'us-west-2',
      priority: 3,
      maxConnections: 10,
      healthCheckInterval: 20000
    });
  }

  return { master, replicas };
}

// ============================================================================
// 12. SINGLETON INSTANCE
// ============================================================================

let replicaManager: ReadReplicaManager | null = null;

export function createReplicaManager(): ReadReplicaManager {
  if (replicaManager) {
    return replicaManager;
  }

  const config = createReadReplicaConfig();
  replicaManager = new ReadReplicaManager(config.master, config.replicas);

  // Graceful shutdown
  process.on('SIGINT', async () => {
    await replicaManager?.shutdown();
  });

  process.on('SIGTERM', async () => {
    await replicaManager?.shutdown();
  });

  return replicaManager;
}

export function getReplicaManager(): ReadReplicaManager {
  if (!replicaManager) {
    return createReplicaManager();
  }
  return replicaManager;
}

export default ReadReplicaManager; 