// BookAIMark Redis Caching Layer
// Task 14.4: Implement Redis caching layer for frequently accessed data

import { createClient, RedisClientType, RedisModules, RedisFunctions, RedisScripts } from 'redis';
import { createHash } from 'crypto';

// ============================================================================
// 1. CACHE CONFIGURATION
// ============================================================================

interface CacheConfig {
  host: string;
  port: number;
  password?: string;
  database?: number;
  maxRetries: number;
  retryDelayMs: number;
  connectTimeoutMs: number;
  commandTimeoutMs: number;
  keyPrefix: string;
  defaultTTL: number; // seconds
  maxMemoryPolicy: 'allkeys-lru' | 'volatile-lru' | 'allkeys-lfu' | 'volatile-lfu';
}

interface CacheOptions {
  ttl?: number; // Time to live in seconds
  tags?: string[]; // Cache tags for invalidation
  compress?: boolean; // Compress large values
  serialize?: boolean; // Serialize objects
  namespace?: string; // Cache namespace
}

interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  errors: number;
  totalMemory: string;
  usedMemory: string;
  connectedClients: number;
  operationsPerSecond: number;
}

// ============================================================================
// 2. REDIS CACHE MANAGER
// ============================================================================

class RedisCacheManager {
  private client: RedisClientType<RedisModules, RedisFunctions, RedisScripts> | null = null;
  private isConnected = false;
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    errors: 0,
    totalMemory: '0',
    usedMemory: '0',
    connectedClients: 0,
    operationsPerSecond: 0
  };
  private operationCount = 0;
  private lastStatsUpdate = Date.now();

  constructor(private config: CacheConfig) {
    this.initializeClient();
  }

  // ============================================================================
  // 3. CLIENT INITIALIZATION
  // ============================================================================

  private async initializeClient(): Promise<void> {
    try {
      this.client = createClient({
        socket: {
          host: this.config.host,
          port: this.config.port,
          connectTimeout: this.config.connectTimeoutMs,
          reconnectStrategy: (retries) => {
            if (retries > this.config.maxRetries) {
              return false; // Stop retrying
            }
            return Math.min(retries * this.config.retryDelayMs, 3000);
          }
        },
        password: this.config.password,
        database: this.config.database || 0,
        name: 'BookAIMark-Cache',
      });

      // Event handlers
      this.client.on('connect', () => {
        console.log('🔗 Redis cache connected');
        this.isConnected = true;
      });

      this.client.on('ready', () => {
        console.log('✅ Redis cache ready');
        this.configureRedis();
      });

      this.client.on('error', (error) => {
        console.error('🚨 Redis cache error:', error);
        this.stats.errors++;
        this.isConnected = false;
      });

      this.client.on('end', () => {
        console.log('🔌 Redis cache connection ended');
        this.isConnected = false;
      });

      this.client.on('reconnecting', () => {
        console.log('🔄 Redis cache reconnecting...');
      });

      await this.client.connect();
    } catch (error) {
      console.error('❌ Failed to initialize Redis cache:', error);
      this.stats.errors++;
    }
  }

  private async configureRedis(): Promise<void> {
    if (!this.client) return;

    try {
      // Set memory policy
      await this.client.configSet('maxmemory-policy', this.config.maxMemoryPolicy);
      
      // Enable keyspace notifications for cache invalidation
      await this.client.configSet('notify-keyspace-events', 'Ex');
      
      console.log('⚙️ Redis cache configured');
    } catch (error) {
      console.warn('⚠️ Failed to configure Redis:', error);
    }
  }

  // ============================================================================
  // 4. BASIC CACHE OPERATIONS
  // ============================================================================

  async get<T = any>(key: string, options: CacheOptions = {}): Promise<T | null> {
    if (!this.isConnected || !this.client) {
      this.stats.misses++;
      return null;
    }

    try {
      const fullKey = this.buildKey(key, options.namespace);
      const value = await this.client.get(fullKey);
      
      if (value === null) {
        this.stats.misses++;
        return null;
      }

      this.stats.hits++;
      this.updateOperationCount();
      
      return this.deserializeValue(value, options);
    } catch (error) {
      console.error('❌ Cache get error:', error);
      this.stats.errors++;
      this.stats.misses++;
      return null;
    }
  }

  async set<T = any>(
    key: string, 
    value: T, 
    options: CacheOptions = {}
  ): Promise<boolean> {
    if (!this.isConnected || !this.client) {
      return false;
    }

    try {
      const fullKey = this.buildKey(key, options.namespace);
      const serializedValue = this.serializeValue(value, options);
      const ttl = options.ttl || this.config.defaultTTL;

      if (ttl > 0) {
        await this.client.setEx(fullKey, ttl, serializedValue);
      } else {
        await this.client.set(fullKey, serializedValue);
      }

      // Set cache tags for invalidation
      if (options.tags && options.tags.length > 0) {
        await this.setTags(fullKey, options.tags);
      }

      this.stats.sets++;
      this.updateOperationCount();
      return true;
    } catch (error) {
      console.error('❌ Cache set error:', error);
      this.stats.errors++;
      return false;
    }
  }

  async delete(key: string, namespace?: string): Promise<boolean> {
    if (!this.isConnected || !this.client) {
      return false;
    }

    try {
      const fullKey = this.buildKey(key, namespace);
      const result = await this.client.del(fullKey);
      
      this.stats.deletes++;
      this.updateOperationCount();
      
      return result > 0;
    } catch (error) {
      console.error('❌ Cache delete error:', error);
      this.stats.errors++;
      return false;
    }
  }

  async exists(key: string, namespace?: string): Promise<boolean> {
    if (!this.isConnected || !this.client) {
      return false;
    }

    try {
      const fullKey = this.buildKey(key, namespace);
      const result = await this.client.exists(fullKey);
      this.updateOperationCount();
      return result > 0;
    } catch (error) {
      console.error('❌ Cache exists error:', error);
      this.stats.errors++;
      return false;
    }
  }

  // ============================================================================
  // 5. ADVANCED CACHE OPERATIONS
  // ============================================================================

  async getMultiple<T = any>(
    keys: string[], 
    namespace?: string
  ): Promise<Record<string, T | null>> {
    if (!this.isConnected || !this.client || keys.length === 0) {
      return {};
    }

    try {
      const fullKeys = keys.map(key => this.buildKey(key, namespace));
      const values = await this.client.mGet(fullKeys);
      
      const result: Record<string, T | null> = {};
      keys.forEach((key, index) => {
        const value = values[index];
        result[key] = value ? this.deserializeValue(value) : null;
        
        if (value) {
          this.stats.hits++;
        } else {
          this.stats.misses++;
        }
      });

      this.updateOperationCount();
      return result;
    } catch (error) {
      console.error('❌ Cache getMultiple error:', error);
      this.stats.errors++;
      return {};
    }
  }

  async setMultiple<T = any>(
    data: Record<string, T>, 
    options: CacheOptions = {}
  ): Promise<boolean> {
    if (!this.isConnected || !this.client || Object.keys(data).length === 0) {
      return false;
    }

    try {
      const pipeline = this.client.multi();
      const ttl = options.ttl || this.config.defaultTTL;

      for (const [key, value] of Object.entries(data)) {
        const fullKey = this.buildKey(key, options.namespace);
        const serializedValue = this.serializeValue(value, options);

        if (ttl > 0) {
          pipeline.setEx(fullKey, ttl, serializedValue);
        } else {
          pipeline.set(fullKey, serializedValue);
        }
      }

      await pipeline.exec();
      this.stats.sets += Object.keys(data).length;
      this.updateOperationCount();
      return true;
    } catch (error) {
      console.error('❌ Cache setMultiple error:', error);
      this.stats.errors++;
      return false;
    }
  }

  // ============================================================================
  // 6. CACHE INVALIDATION
  // ============================================================================

  async invalidateByPattern(pattern: string, namespace?: string): Promise<number> {
    if (!this.isConnected || !this.client) {
      return 0;
    }

    try {
      const fullPattern = this.buildKey(pattern, namespace);
      const keys = await this.client.keys(fullPattern);
      
      if (keys.length === 0) {
        return 0;
      }

      const result = await this.client.del(keys);
      this.stats.deletes += result;
      this.updateOperationCount();
      
      console.log(`🗑️ Invalidated ${result} cache entries matching pattern: ${fullPattern}`);
      return result;
    } catch (error) {
      console.error('❌ Cache invalidateByPattern error:', error);
      this.stats.errors++;
      return 0;
    }
  }

  async invalidateByTags(tags: string[]): Promise<number> {
    if (!this.isConnected || !this.client || tags.length === 0) {
      return 0;
    }

    try {
      let totalInvalidated = 0;

      for (const tag of tags) {
        const tagKey = `${this.config.keyPrefix}:tags:${tag}`;
        const keys = await this.client.sMembers(tagKey);
        
        if (keys.length > 0) {
          const result = await this.client.del(keys);
          totalInvalidated += result;
          
          // Remove the tag set
          await this.client.del(tagKey);
        }
      }

      this.stats.deletes += totalInvalidated;
      this.updateOperationCount();
      
      console.log(`🗑️ Invalidated ${totalInvalidated} cache entries by tags:`, tags);
      return totalInvalidated;
    } catch (error) {
      console.error('❌ Cache invalidateByTags error:', error);
      this.stats.errors++;
      return 0;
    }
  }

  async flush(namespace?: string): Promise<boolean> {
    if (!this.isConnected || !this.client) {
      return false;
    }

    try {
      if (namespace) {
        const pattern = this.buildKey('*', namespace);
        return (await this.invalidateByPattern(pattern)) > 0;
      } else {
        await this.client.flushDb();
        console.log('🗑️ Flushed entire cache database');
        return true;
      }
    } catch (error) {
      console.error('❌ Cache flush error:', error);
      this.stats.errors++;
      return false;
    }
  }

  // ============================================================================
  // 7. SPECIALIZED CACHING METHODS
  // ============================================================================

  // Cache with automatic refresh
  async getOrSet<T = any>(
    key: string,
    fetcher: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    const cached = await this.get<T>(key, options);
    
    if (cached !== null) {
      return cached;
    }

    try {
      const fresh = await fetcher();
      await this.set(key, fresh, options);
      return fresh;
    } catch (error) {
      console.error('❌ Cache getOrSet fetcher error:', error);
      throw error;
    }
  }

  // Cache with stale-while-revalidate pattern
  async getStaleWhileRevalidate<T = any>(
    key: string,
    fetcher: () => Promise<T>,
    options: CacheOptions & { staleTime?: number } = {}
  ): Promise<T> {
    const cached = await this.get<T>(key, options);
    const staleTime = options.staleTime || 300; // 5 minutes default
    
    if (cached !== null) {
      // Check if data is stale
      const keyInfo = await this.client?.ttl(this.buildKey(key, options.namespace));
      const remainingTtl = keyInfo || 0;
      const totalTtl = options.ttl || this.config.defaultTTL;
      const dataAge = totalTtl - remainingTtl;
      
      if (dataAge < staleTime) {
        return cached; // Fresh data
      }
      
      // Data is stale, refresh in background
      this.refreshInBackground(key, fetcher, options);
      return cached; // Return stale data immediately
    }

    // No cached data, fetch fresh
    const fresh = await fetcher();
    await this.set(key, fresh, options);
    return fresh;
  }

  private async refreshInBackground<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: CacheOptions
  ): Promise<void> {
    try {
      const fresh = await fetcher();
      await this.set(key, fresh, options);
    } catch (error) {
      console.error('❌ Background refresh error:', error);
    }
  }

  // ============================================================================
  // 8. UTILITY METHODS
  // ============================================================================

  private buildKey(key: string, namespace?: string): string {
    const parts = [this.config.keyPrefix];
    if (namespace) parts.push(namespace);
    parts.push(key);
    return parts.join(':');
  }

  private serializeValue<T>(value: T, options: CacheOptions): string {
    if (typeof value === 'string') {
      return value;
    }

    let serialized = JSON.stringify(value);
    
    if (options.compress && serialized.length > 1024) {
      // In a real implementation, you'd use compression here
      // For now, we'll just mark it as compressed
      serialized = `COMPRESSED:${serialized}`;
    }

    return serialized;
  }

  private deserializeValue<T>(value: string, options: CacheOptions = {}): T {
    if (value.startsWith('COMPRESSED:')) {
      // In a real implementation, you'd decompress here
      value = value.substring(11);
    }

    try {
      return JSON.parse(value);
    } catch {
      return value as unknown as T;
    }
  }

  private async setTags(key: string, tags: string[]): Promise<void> {
    if (!this.client) return;

    try {
      for (const tag of tags) {
        const tagKey = `${this.config.keyPrefix}:tags:${tag}`;
        await this.client.sAdd(tagKey, key);
        
        // Set TTL for tag set (longer than cache entries)
        await this.client.expire(tagKey, this.config.defaultTTL * 2);
      }
    } catch (error) {
      console.error('❌ Error setting cache tags:', error);
    }
  }

  private updateOperationCount(): void {
    this.operationCount++;
    
    // Update operations per second every 10 seconds
    const now = Date.now();
    if (now - this.lastStatsUpdate > 10000) {
      const timeDiff = (now - this.lastStatsUpdate) / 1000;
      this.stats.operationsPerSecond = Math.round(this.operationCount / timeDiff);
      this.operationCount = 0;
      this.lastStatsUpdate = now;
    }
  }

  // ============================================================================
  // 9. MONITORING AND STATS
  // ============================================================================

  async getStats(): Promise<CacheStats> {
    if (!this.isConnected || !this.client) {
      return this.stats;
    }

    try {
      const info = await this.client.info('memory');
      const clients = await this.client.info('clients');
      
      // Parse memory info
      const memoryMatch = info.match(/used_memory_human:([^\r\n]+)/);
      const totalMemoryMatch = info.match(/total_system_memory_human:([^\r\n]+)/);
      const clientsMatch = clients.match(/connected_clients:(\d+)/);

      this.stats.usedMemory = memoryMatch ? memoryMatch[1].trim() : '0';
      this.stats.totalMemory = totalMemoryMatch ? totalMemoryMatch[1].trim() : '0';
      this.stats.connectedClients = clientsMatch ? parseInt(clientsMatch[1]) : 0;

      return { ...this.stats };
    } catch (error) {
      console.error('❌ Error getting cache stats:', error);
      return this.stats;
    }
  }

  getHitRate(): number {
    const total = this.stats.hits + this.stats.misses;
    return total > 0 ? this.stats.hits / total : 0;
  }

  async healthCheck(): Promise<{
    connected: boolean;
    latency: number;
    memoryUsage: string;
    hitRate: number;
  }> {
    if (!this.isConnected || !this.client) {
      return {
        connected: false,
        latency: -1,
        memoryUsage: '0',
        hitRate: 0
      };
    }

    try {
      const start = Date.now();
      await this.client.ping();
      const latency = Date.now() - start;

      const stats = await this.getStats();

      return {
        connected: true,
        latency,
        memoryUsage: stats.usedMemory,
        hitRate: this.getHitRate()
      };
    } catch (error) {
      return {
        connected: false,
        latency: -1,
        memoryUsage: '0',
        hitRate: 0
      };
    }
  }

  // ============================================================================
  // 10. CLEANUP
  // ============================================================================

  async shutdown(): Promise<void> {
    console.log('🔌 Shutting down Redis cache...');

    if (this.client) {
      await this.client.disconnect();
      this.client = null;
    }

    this.isConnected = false;
    console.log('✅ Redis cache shut down');
  }

  getClient(): RedisClientType<RedisModules, RedisFunctions, RedisScripts> | null {
    return this.client;
  }
}

// ============================================================================
// 11. CACHE STRATEGIES
// ============================================================================

export class CacheStrategies {
  constructor(private cache: RedisCacheManager) {}

  // User bookmarks caching
  async getUserBookmarks(userId: string, page = 1, limit = 50) {
    const key = `user:${userId}:bookmarks:${page}:${limit}`;
    return this.cache.getOrSet(
      key,
      async () => {
        // This would be replaced with actual database query
        return { bookmarks: [], total: 0 };
      },
      {
        ttl: 300, // 5 minutes
        tags: [`user:${userId}`, 'bookmarks'],
        namespace: 'api'
      }
    );
  }

  // AI processing results caching
  async cacheAIResult(contentHash: string, result: any) {
    const key = `ai:result:${contentHash}`;
    return this.cache.set(key, result, {
      ttl: 86400, // 24 hours
      tags: ['ai-results'],
      namespace: 'ai'
    });
  }

  // Session caching
  async cacheUserSession(sessionId: string, data: any) {
    const key = `session:${sessionId}`;
    return this.cache.set(key, data, {
      ttl: 3600, // 1 hour
      namespace: 'sessions'
    });
  }

  // Analytics caching
  async cacheAnalytics(userId: string, timeRange: string, data: any) {
    const key = `analytics:${userId}:${timeRange}`;
    return this.cache.set(key, data, {
      ttl: 1800, // 30 minutes
      tags: [`user:${userId}`, 'analytics'],
      namespace: 'analytics'
    });
  }
}

// ============================================================================
// 12. FACTORY AND SINGLETON
// ============================================================================

let cacheManager: RedisCacheManager | null = null;

export function createCacheManager(config?: Partial<CacheConfig>): RedisCacheManager {
  if (cacheManager) {
    return cacheManager;
  }

  // Skip Redis initialization during build or when explicitly disabled
  if (process.env.REDIS_DISABLE === 'true' || 
      (process.env.NODE_ENV === 'production' && process.env.VERCEL_ENV === 'production' && !process.env.REDIS_URL)) {
    console.log('⚠️ Skipping Redis initialization - disabled or no Redis URL in production');
    return createMockCacheManager();
  }

  const defaultConfig: CacheConfig = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    database: parseInt(process.env.REDIS_DATABASE || '0'),
    maxRetries: 3,
    retryDelayMs: 1000,
    connectTimeoutMs: 10000,
    commandTimeoutMs: 5000,
    keyPrefix: process.env.REDIS_KEY_PREFIX || 'bookaimark',
    defaultTTL: parseInt(process.env.REDIS_DEFAULT_TTL || '3600'),
    maxMemoryPolicy: 'allkeys-lru'
  };

  const finalConfig = { ...defaultConfig, ...config };
  cacheManager = new RedisCacheManager(finalConfig);

  // Graceful shutdown
  process.on('SIGINT', async () => {
    await cacheManager?.shutdown();
  });

  process.on('SIGTERM', async () => {
    await cacheManager?.shutdown();
  });

  return cacheManager;
}

// Mock cache manager for production builds without Redis
function createMockCacheManager(): RedisCacheManager {
  const mockManager = {
    async get() { return null; },
    async set() { return true; },
    async delete() { return true; },
    async clear() { return true; },
    async exists() { return false; },
    async increment() { return 1; },
    async expire() { return true; },
    async getStats() { return { hits: 0, misses: 0, sets: 0, deletes: 0, errors: 0, totalMemory: '0', usedMemory: '0', connectedClients: 0, operationsPerSecond: 0 }; },
    async shutdown() { return; },
    getClient() { return null; },
    isHealthy() { return false; }
  } as any;
  return mockManager;
}

export function getCacheManager(): RedisCacheManager {
  if (!cacheManager) {
    return createCacheManager();
  }
  return cacheManager;
}

export default RedisCacheManager;  