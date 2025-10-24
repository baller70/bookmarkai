// BookAIMark Database Connection Manager
// Task 14.2: Database Query Optimization with Connection Pooling

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Pool, PoolClient } from 'pg';

// ============================================================================
// 1. CONNECTION POOL CONFIGURATION
// ============================================================================

interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  ssl?: boolean;
  max?: number; // Maximum number of connections in pool
  min?: number; // Minimum number of connections in pool
  idleTimeoutMillis?: number; // Close idle connections after this time
  connectionTimeoutMillis?: number; // Return error after this time if unable to get connection
  maxUses?: number; // Close connection after this many uses
  allowExitOnIdle?: boolean; // Allow process to exit when all connections are idle
}

interface QueryMetrics {
  query: string;
  duration: number;
  timestamp: Date;
  success: boolean;
  error?: string;
  rowCount?: number;
}

class DatabaseConnectionManager {
  private pool: Pool | null = null;
  private supabaseClient: SupabaseClient | null = null;
  private queryMetrics: QueryMetrics[] = [];
  private readonly maxMetricsHistory = 1000;
  private preparedStatements: Map<string, string> = new Map();

  constructor(private config: DatabaseConfig) {
    this.initializePool();
    this.initializeSupabase();
  }

  // ============================================================================
  // 2. CONNECTION POOL INITIALIZATION
  // ============================================================================

  private initializePool(): void {
    const poolConfig = {
      host: this.config.host,
      port: this.config.port,
      database: this.config.database,
      user: this.config.user,
      password: this.config.password,
      ssl: this.config.ssl ? { rejectUnauthorized: false } : false,
      
      // Connection pool settings
      max: this.config.max || 20, // Maximum connections
      min: this.config.min || 5,  // Minimum connections
      idleTimeoutMillis: this.config.idleTimeoutMillis || 30000, // 30 seconds
      connectionTimeoutMillis: this.config.connectionTimeoutMillis || 10000, // 10 seconds
      maxUses: this.config.maxUses || 7500, // Close connection after 7500 uses
      allowExitOnIdle: this.config.allowExitOnIdle || false,
      
      // Connection validation
      statement_timeout: 30000, // 30 seconds
      query_timeout: 30000,
      
      // Performance settings
      application_name: 'BookAIMark-Web',
      
      // Error handling
      keepAlive: true,
      keepAliveInitialDelayMillis: 10000,
    };

    this.pool = new Pool(poolConfig);

    // Pool event handlers
    this.pool.on('connect', (client: PoolClient) => {
      console.log('🔗 New database connection established');
      
      // Set session-level optimizations
      client.query(`
        SET statement_timeout = '30s';
        SET lock_timeout = '10s';
        SET idle_in_transaction_session_timeout = '60s';
        SET work_mem = '256MB';
        SET maintenance_work_mem = '512MB';
        SET effective_cache_size = '2GB';
        SET random_page_cost = 1.1;
        SET cpu_tuple_cost = 0.01;
        SET cpu_index_tuple_cost = 0.005;
        SET cpu_operator_cost = 0.0025;
      `).catch(err => console.warn('Failed to set session optimizations:', err));
    });

    this.pool.on('error', (err: Error) => {
      console.error('🚨 Database pool error:', err);
      this.recordMetric('pool_error', 0, false, err.message);
    });

    this.pool.on('remove', () => {
      console.log('🔌 Database connection removed from pool');
    });
  }

  private initializeSupabase(): void {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey) {
      this.supabaseClient = createClient(supabaseUrl, supabaseKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        },
        db: {
          schema: 'public'
        },
        global: {
          headers: {
            'x-application-name': 'BookAIMark-Web',
          },
        },
      });
    }
  }

  // ============================================================================
  // 3. QUERY EXECUTION WITH OPTIMIZATION
  // ============================================================================

  async executeQuery<T = any>(
    query: string, 
    params: any[] = [], 
    options: {
      usePool?: boolean;
      timeout?: number;
      retries?: number;
      cacheable?: boolean;
    } = {}
  ): Promise<T[]> {
    const startTime = Date.now();
    const { usePool = true, timeout = 30000, retries = 2 } = options;

    let attempt = 0;
    while (attempt <= retries) {
      try {
        let result;
        
        if (usePool && this.pool) {
          result = await this.executeWithPool(query, params, timeout);
        } else if (this.supabaseClient) {
          result = await this.executeWithSupabase(query, params);
        } else {
          throw new Error('No database connection available');
        }

        const duration = Date.now() - startTime;
        this.recordMetric(query, duration, true, undefined, result.length);
        
        return result;
      } catch (error) {
        attempt++;
        const duration = Date.now() - startTime;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        
        if (attempt > retries) {
          this.recordMetric(query, duration, false, errorMessage);
          throw error;
        }
        
        // Exponential backoff for retries
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }

    throw new Error('Max retries exceeded');
  }

  private async executeWithPool<T = any>(
    query: string, 
    params: any[], 
    timeout: number
  ): Promise<T[]> {
    if (!this.pool) throw new Error('Pool not initialized');

    const client = await this.pool.connect();
    try {
      // Set query timeout
      await client.query(`SET statement_timeout = ${timeout}`);
      
      const result = await client.query(query, params);
      return result.rows;
    } finally {
      client.release();
    }
  }

  private async executeWithSupabase<T = any>(
    query: string, 
    params: any[]
  ): Promise<T[]> {
    if (!this.supabaseClient) throw new Error('Supabase client not initialized');

    // Convert parameterized query to Supabase format
    const { data, error } = await this.supabaseClient.rpc('execute_sql', {
      sql_query: query,
      sql_params: params
    });

    if (error) throw error;
    return data || [];
  }

  // ============================================================================
  // 4. PREPARED STATEMENTS
  // ============================================================================

  async prepareBatch(statements: { name: string; query: string }[]): Promise<void> {
    if (!this.pool) return;

    const client = await this.pool.connect();
    try {
      for (const { name, query } of statements) {
        await client.query(`PREPARE ${name} AS ${query}`);
        this.preparedStatements.set(name, query);
      }
    } finally {
      client.release();
    }
  }

  async executePrepared<T = any>(
    statementName: string, 
    params: any[] = []
  ): Promise<T[]> {
    if (!this.pool) throw new Error('Pool not initialized');
    if (!this.preparedStatements.has(statementName)) {
      throw new Error(`Prepared statement '${statementName}' not found`);
    }

    const startTime = Date.now();
    const client = await this.pool.connect();
    
    try {
      const result = await client.query(`EXECUTE ${statementName}(${params.map((_, i) => `$${i + 1}`).join(', ')})`, params);
      
      const duration = Date.now() - startTime;
      this.recordMetric(`PREPARED: ${statementName}`, duration, true, undefined, result.rows.length);
      
      return result.rows;
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.recordMetric(`PREPARED: ${statementName}`, duration, false, errorMessage);
      throw error;
    } finally {
      client.release();
    }
  }

  // ============================================================================
  // 5. TRANSACTION MANAGEMENT
  // ============================================================================

  async executeTransaction<T>(
    operations: (client: PoolClient) => Promise<T>,
    isolationLevel: 'READ UNCOMMITTED' | 'READ COMMITTED' | 'REPEATABLE READ' | 'SERIALIZABLE' = 'READ COMMITTED'
  ): Promise<T> {
    if (!this.pool) throw new Error('Pool not initialized');

    const client = await this.pool.connect();
    const startTime = Date.now();
    
    try {
      await client.query('BEGIN');
      await client.query(`SET TRANSACTION ISOLATION LEVEL ${isolationLevel}`);
      
      const result = await operations(client);
      
      await client.query('COMMIT');
      
      const duration = Date.now() - startTime;
      this.recordMetric('TRANSACTION', duration, true);
      
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.recordMetric('TRANSACTION', duration, false, errorMessage);
      
      throw error;
    } finally {
      client.release();
    }
  }

  // ============================================================================
  // 6. BULK OPERATIONS
  // ============================================================================

  async bulkInsert<T>(
    tableName: string,
    records: T[],
    conflictResolution: 'ignore' | 'update' | 'error' = 'error',
    batchSize: number = 1000
  ): Promise<number> {
    if (!records.length) return 0;
    if (!this.pool) throw new Error('Pool not initialized');

    const startTime = Date.now();
    let totalInserted = 0;

    // Process in batches
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      const client = await this.pool.connect();

      try {
        await client.query('BEGIN');

        // Build bulk insert query
        const columns = Object.keys(batch[0] as any);
        const values = batch.map((record, index) => 
          `(${columns.map((_, colIndex) => `$${index * columns.length + colIndex + 1}`).join(', ')})`
        ).join(', ');

        const params = batch.flatMap(record => 
          columns.map(col => (record as any)[col])
        );

        let query = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES ${values}`;
        
        // Add conflict resolution
        if (conflictResolution === 'ignore') {
          query += ' ON CONFLICT DO NOTHING';
        } else if (conflictResolution === 'update') {
          const updates = columns.map(col => `${col} = EXCLUDED.${col}`).join(', ');
          query += ` ON CONFLICT DO UPDATE SET ${updates}`;
        }

        const result = await client.query(query, params);
        totalInserted += result.rowCount || 0;

        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    }

    const duration = Date.now() - startTime;
    this.recordMetric(`BULK_INSERT: ${tableName}`, duration, true, undefined, totalInserted);

    return totalInserted;
  }

  // ============================================================================
  // 7. PERFORMANCE MONITORING
  // ============================================================================

  private recordMetric(
    query: string, 
    duration: number, 
    success: boolean, 
    error?: string, 
    rowCount?: number
  ): void {
    const metric: QueryMetrics = {
      query: query.length > 100 ? query.substring(0, 100) + '...' : query,
      duration,
      timestamp: new Date(),
      success,
      error,
      rowCount
    };

    this.queryMetrics.push(metric);

    // Keep only recent metrics
    if (this.queryMetrics.length > this.maxMetricsHistory) {
      this.queryMetrics.shift();
    }

    // Log slow queries
    if (duration > 5000) { // 5 seconds
      console.warn(`🐌 Slow query detected (${duration}ms):`, query.substring(0, 200));
    }
  }

  getPerformanceMetrics(): {
    totalQueries: number;
    averageResponseTime: number;
    slowQueries: QueryMetrics[];
    errorRate: number;
    recentMetrics: QueryMetrics[];
  } {
    const totalQueries = this.queryMetrics.length;
    const successfulQueries = this.queryMetrics.filter(m => m.success);
    const slowQueries = this.queryMetrics.filter(m => m.duration > 2000);
    
    const averageResponseTime = successfulQueries.length > 0
      ? successfulQueries.reduce((sum, m) => sum + m.duration, 0) / successfulQueries.length
      : 0;

    const errorRate = totalQueries > 0
      ? (totalQueries - successfulQueries.length) / totalQueries
      : 0;

    return {
      totalQueries,
      averageResponseTime,
      slowQueries,
      errorRate,
      recentMetrics: this.queryMetrics.slice(-50) // Last 50 queries
    };
  }

  // ============================================================================
  // 8. CONNECTION HEALTH MONITORING
  // ============================================================================

  async healthCheck(): Promise<{
    poolConnected: boolean;
    supabaseConnected: boolean;
    activeConnections: number;
    idleConnections: number;
    waitingClients: number;
  }> {
    let poolConnected = false;
    let activeConnections = 0;
    let idleConnections = 0;
    let waitingClients = 0;

    if (this.pool) {
      try {
        const client = await this.pool.connect();
        await client.query('SELECT 1');
        client.release();
        poolConnected = true;
        
        activeConnections = this.pool.totalCount;
        idleConnections = this.pool.idleCount;
        waitingClients = this.pool.waitingCount;
      } catch (error) {
        console.error('Pool health check failed:', error);
      }
    }

    let supabaseConnected = false;
    if (this.supabaseClient) {
      try {
        const { data, error } = await this.supabaseClient.from('user_bookmarks').select('id').limit(1);
        supabaseConnected = !error;
      } catch (error) {
        console.error('Supabase health check failed:', error);
      }
    }

    return {
      poolConnected,
      supabaseConnected,
      activeConnections,
      idleConnections,
      waitingClients
    };
  }

  // ============================================================================
  // 9. CLEANUP AND SHUTDOWN
  // ============================================================================

  async shutdown(): Promise<void> {
    console.log('🔌 Shutting down database connections...');

    if (this.pool) {
      await this.pool.end();
      this.pool = null;
    }

    // Clear metrics
    this.queryMetrics = [];
    this.preparedStatements.clear();

    console.log('✅ Database connections closed');
  }
}

// ============================================================================
// 10. SINGLETON INSTANCE AND FACTORY
// ============================================================================

let dbManager: DatabaseConnectionManager | null = null;

export function createDatabaseManager(config?: Partial<DatabaseConfig>): DatabaseConnectionManager {
  if (dbManager) {
    return dbManager;
  }

  const defaultConfig: DatabaseConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'bookaimark',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    ssl: process.env.NODE_ENV === 'production',
    max: parseInt(process.env.DB_POOL_MAX || '20'),
    min: parseInt(process.env.DB_POOL_MIN || '5'),
    idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000'),
    connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '10000'),
  };

  const finalConfig = { ...defaultConfig, ...config };
  dbManager = new DatabaseConnectionManager(finalConfig);

  // Graceful shutdown
  process.on('SIGINT', async () => {
    await dbManager?.shutdown();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    await dbManager?.shutdown();
    process.exit(0);
  });

  return dbManager;
}

export function getDatabaseManager(): DatabaseConnectionManager {
  if (!dbManager) {
    return createDatabaseManager();
  }
  return dbManager;
}

// ============================================================================
// 11. COMMON PREPARED STATEMENTS
// ============================================================================

export const PREPARED_STATEMENTS = {
  // User bookmarks
  GET_USER_BOOKMARKS: {
    name: 'get_user_bookmarks',
    query: 'SELECT * FROM user_bookmarks WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3'
  },
  
  INSERT_BOOKMARK: {
    name: 'insert_bookmark',
    query: `
      INSERT INTO user_bookmarks (user_id, title, url, description, category, tags, ai_summary, ai_tags, ai_category)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `
  },

  UPDATE_BOOKMARK: {
    name: 'update_bookmark',
    query: `
      UPDATE user_bookmarks 
      SET title = $2, description = $3, category = $4, tags = $5, updated_at = NOW()
      WHERE id = $1 AND user_id = $6
      RETURNING *
    `
  },

  // User analytics
  RECORD_ACTIVITY: {
    name: 'record_activity',
    query: `
      INSERT INTO user_activity_log (user_id, activity_type, entity_type, entity_id, metadata, duration_minutes)
      VALUES ($1, $2, $3, $4, $5, $6)
    `
  },

  // Marketplace
  GET_ACTIVE_LISTINGS: {
    name: 'get_active_listings',
    query: `
      SELECT * FROM listings 
      WHERE is_active = true AND category = $1
      ORDER BY rating_avg DESC, created_at DESC
      LIMIT $2 OFFSET $3
    `
  },

  // Playbooks
  GET_PUBLIC_PLAYBOOKS: {
    name: 'get_public_playbooks',
    query: `
      SELECT * FROM user_playbooks 
      WHERE is_public = true AND category = $1
      ORDER BY plays DESC, likes_count DESC
      LIMIT $2 OFFSET $3
    `
  }
};

export default DatabaseConnectionManager; 