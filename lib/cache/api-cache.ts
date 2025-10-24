import { getCacheManager } from './redis-manager';
import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

export interface CacheConfig {
  ttl?: number; // Time to live in seconds
  tags?: string[]; // Cache tags for invalidation
  staleWhileRevalidate?: number; // Serve stale content while revalidating
  compression?: boolean; // Enable compression for large responses
  vary?: string[]; // HTTP headers to vary cache by
  skipCache?: boolean; // Skip caching for this request
}

export interface CacheMetadata {
  key: string;
  ttl: number;
  tags: string[];
  createdAt: number;
  lastAccessed: number;
  hitCount: number;
  size: number;
  compressed: boolean;
  vary?: Record<string, string>;
}

export interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  totalSize: number;
  itemCount: number;
  avgResponseTime: number;
  topKeys: Array<{ key: string; hits: number; size: number }>;
}

export class APICacheManager {
  private cacheManager: ReturnType<typeof getCacheManager>;
  private redis: ReturnType<ReturnType<typeof getCacheManager>['getClient']>;
  private defaultTTL = 300; // 5 minutes
  private maxCacheSize = 100 * 1024 * 1024; // 100MB
  private compressionThreshold = 1024; // 1KB
  private stats: Map<string, { hits: number; misses: number; responseTime: number[] }> = new Map();

  constructor() {
    this.cacheManager = getCacheManager();
    this.redis = this.cacheManager.getClient();
  }

  /**
   * Generate cache key from request
   */
  private generateCacheKey(
    endpoint: string,
    params: Record<string, any> = {},
    vary: Record<string, string> = {}
  ): string {
    const paramsStr = JSON.stringify(params, Object.keys(params).sort());
    const varyStr = JSON.stringify(vary, Object.keys(vary).sort());
    const content = `${endpoint}:${paramsStr}:${varyStr}`;
    return `api_cache:${crypto.createHash('sha256').update(content).digest('hex')}`;
  }

  /**
   * Generate cache key from NextRequest
   */
  private generateRequestCacheKey(
    request: NextRequest,
    vary: string[] = []
  ): string {
    const url = new URL(request.url);
    const endpoint = url.pathname;
    
    // Extract query parameters
    const params: Record<string, string> = {};
    url.searchParams.forEach((value, key) => {
      params[key] = value;
    });

    // Extract vary headers
    const varyHeaders: Record<string, string> = {};
    vary.forEach(header => {
      const value = request.headers.get(header);
      if (value) {
        varyHeaders[header] = value;
      }
    });

    return this.generateCacheKey(endpoint, params, varyHeaders);
  }

  /**
   * Compress data if it exceeds threshold
   */
  private async compressData(data: any): Promise<{ data: string; compressed: boolean }> {
    const jsonStr = JSON.stringify(data);
    
    if (jsonStr.length < this.compressionThreshold) {
      return { data: jsonStr, compressed: false };
    }

    try {
      const compressed = Buffer.from(jsonStr, 'utf8').toString('base64');
      return { data: compressed, compressed: true };
    } catch (error) {
      console.warn('Failed to compress cache data:', error);
      return { data: jsonStr, compressed: false };
    }
  }

  /**
   * Decompress data if needed
   */
  private async decompressData(data: string, compressed: boolean): Promise<any> {
    if (!compressed) {
      return JSON.parse(data);
    }

    try {
      const decompressed = Buffer.from(data, 'base64').toString('utf8');
      return JSON.parse(decompressed);
    } catch (error) {
      console.error('Failed to decompress cache data:', error);
      throw error;
    }
  }

  /**
   * Store response in cache
   */
  async set(
    key: string,
    data: any,
    config: CacheConfig = {}
  ): Promise<void> {
    // Skip if Redis is not available
    if (!this.redis) {
      return;
    }

    try {
      const ttl = config.ttl || this.defaultTTL;
      const tags = config.tags || [];
      const now = Date.now();

      // Compress data if needed
      const { data: processedData, compressed } = await this.compressData(data);
      const size = Buffer.byteLength(processedData, 'utf8');

      // Check cache size limit
      if (size > this.maxCacheSize) {
        console.warn(`Cache entry too large (${size} bytes), skipping cache`);
        return;
      }

      // Create metadata
      const metadata: CacheMetadata = {
        key,
        ttl,
        tags,
        createdAt: now,
        lastAccessed: now,
        hitCount: 0,
        size,
        compressed,
        vary: config.vary ? config.vary.reduce((acc, header) => {
          acc[header] = 'varies';
          return acc;
        }, {} as Record<string, string>) : undefined
      };

      // Store data and metadata
      await Promise.all([
        this.redis.setEx(key, ttl, processedData),
        this.redis.setEx(`${key}:meta`, ttl + 60, JSON.stringify(metadata)),
        // Add to tag sets for invalidation
        ...tags.map(tag => this.redis.sAdd(`cache_tag:${tag}`, key))
      ]);

      console.log(`✅ Cached API response: ${key} (${size} bytes, TTL: ${ttl}s)`);

    } catch (error) {
      console.error('Failed to cache API response:', error);
    }
  }

  /**
   * Get response from cache
   */
  async get(key: string): Promise<{ data: any; metadata: CacheMetadata } | null> {
    // Skip if Redis is not available
    if (!this.redis) {
      return null;
    }

    try {
      const startTime = Date.now();
      const [cachedData, metadataStr] = await Promise.all([
        this.redis.get(key),
        this.redis.get(`${key}:meta`)
      ]);

      if (!cachedData || !metadataStr) {
        this.recordMiss(key, Date.now() - startTime);
        return null;
      }

      const metadata: CacheMetadata = JSON.parse(metadataStr);
      const data = await this.decompressData(cachedData, metadata.compressed);

      // Update access metadata
      metadata.lastAccessed = Date.now();
      metadata.hitCount++;
      await this.redis.setEx(`${key}:meta`, 60, JSON.stringify(metadata));

      this.recordHit(key, Date.now() - startTime);
      console.log(`🎯 Cache hit: ${key} (${metadata.hitCount} hits)`);

      return { data, metadata };

    } catch (error) {
      console.error('Failed to get cached API response:', error);
      this.recordMiss(key, Date.now() - Date.now());
      return null;
    }
  }

  /**
   * Cache middleware for API routes
   */
  async cacheMiddleware(
    request: NextRequest,
    handler: () => Promise<NextResponse>,
    config: CacheConfig = {}
  ): Promise<NextResponse> {
    if (config.skipCache || request.method !== 'GET') {
      return handler();
    }

    const cacheKey = this.generateRequestCacheKey(request, config.vary);
    
    // Try to get from cache
    const cached = await this.get(cacheKey);
    if (cached) {
      const { data, metadata } = cached;
      
      // Check if stale-while-revalidate should trigger
      const age = (Date.now() - metadata.createdAt) / 1000;
      const isStale = config.staleWhileRevalidate && age > (metadata.ttl - config.staleWhileRevalidate);
      
      if (isStale) {
        // Serve stale content while revalidating in background
        this.revalidateInBackground(cacheKey, handler, config);
      }

      return new NextResponse(JSON.stringify(data), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'X-Cache': 'HIT',
          'X-Cache-Age': age.toString(),
          'X-Cache-Key': cacheKey
        }
      });
    }

    // Cache miss - execute handler and cache result
    const startTime = Date.now();
    const response = await handler();
    const responseTime = Date.now() - startTime;

    // Only cache successful responses
    if (response.status === 200) {
      try {
        // Clone response so we can read the body without consuming the original
        const clonedResponse = response.clone();
        const responseData = await clonedResponse.json();
        await this.set(cacheKey, responseData, config);
        
        return new NextResponse(JSON.stringify(responseData), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'X-Cache': 'MISS',
            'X-Cache-Response-Time': responseTime.toString(),
            'X-Cache-Key': cacheKey
          }
        });
      } catch (error) {
        console.error('Failed to cache response:', error);
        // If caching fails, return the original response
        return response;
      }
    }

    return response;
  }

  /**
   * Revalidate cache entry in background
   */
  private async revalidateInBackground(
    cacheKey: string,
    handler: () => Promise<NextResponse>,
    config: CacheConfig
  ): Promise<void> {
    try {
      console.log(`🔄 Background revalidation for: ${cacheKey}`);
      const response = await handler();
      
      if (response.status === 200) {
        const responseData = await response.json();
        await this.set(cacheKey, responseData, config);
        console.log(`✅ Background revalidation completed: ${cacheKey}`);
      }
    } catch (error) {
      console.error('Background revalidation failed:', error);
    }
  }

  /**
   * Invalidate cache by tags
   */
  async invalidateByTags(tags: string[]): Promise<number> {
    // Skip if Redis is not available
    if (!this.redis) {
      return 0;
    }

    let totalInvalidated = 0;

    for (const tag of tags) {
      try {
        const keys = await this.redis.sMembers(`cache_tag:${tag}`);
        
        if (keys.length > 0) {
          // Delete cache entries and metadata
          const deletePromises = keys.flatMap(key => [
            this.redis.del(key),
            this.redis.del(`${key}:meta`)
          ]);
          
          await Promise.all(deletePromises);
          
          // Remove tag set
          await this.redis.del(`cache_tag:${tag}`);
          
          totalInvalidated += keys.length;
          console.log(`🗑️  Invalidated ${keys.length} cache entries for tag: ${tag}`);
        }
      } catch (error) {
        console.error(`Failed to invalidate cache tag ${tag}:`, error);
      }
    }

    return totalInvalidated;
  }

  /**
   * Invalidate specific cache key
   */
  async invalidate(key: string): Promise<boolean> {
    // Skip if Redis is not available
    if (!this.redis) {
      return false;
    }

    try {
      const [deleted1, deleted2] = await Promise.all([
        this.redis.del(key),
        this.redis.del(`${key}:meta`)
      ]);
      
      const success = deleted1 > 0 || deleted2 > 0;
      if (success) {
        console.log(`🗑️  Invalidated cache entry: ${key}`);
      }
      
      return success;
    } catch (error) {
      console.error('Failed to invalidate cache key:', error);
      return false;
    }
  }

  /**
   * Clear all API cache
   */
  async clear(): Promise<number> {
    // Skip if Redis is not available
    if (!this.redis) {
      return 0;
    }

    try {
      const keys = await this.redis.keys('api_cache:*');
      const tagKeys = await this.redis.keys('cache_tag:*');
      const allKeys = [...keys, ...tagKeys];
      
      if (allKeys.length > 0) {
        await this.redis.del(allKeys);
        console.log(`🗑️  Cleared ${allKeys.length} cache entries`);
      }
      
      return allKeys.length;
    } catch (error) {
      console.error('Failed to clear cache:', error);
      return 0;
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<CacheStats> {
    // Skip if Redis is not available
    if (!this.redis) {
      return {
        hits: 0,
        misses: 0,
        hitRate: 0,
        totalSize: 0,
        itemCount: 0,
        avgResponseTime: 0,
        topKeys: []
      };
    }

    try {
      const keys = await this.redis.keys('api_cache:*');
      const metaKeys = keys.map(key => `${key}:meta`);
      
      let totalHits = 0;
      let totalMisses = 0;
      let totalSize = 0;
      let totalResponseTime = 0;
      const topKeys: Array<{ key: string; hits: number; size: number }> = [];

      // Get metadata for all cache entries
      const metadataResults = await Promise.all(
        metaKeys.map(key => this.redis!.get(key))
      );

      metadataResults.forEach(metaStr => {
        if (metaStr) {
          try {
            const meta: CacheMetadata = JSON.parse(metaStr);
            totalSize += meta.size;
            topKeys.push({
              key: meta.key,
              hits: meta.hitCount,
              size: meta.size
            });
          } catch (error) {
            // Ignore invalid metadata
          }
        }
      });

      // Calculate stats from recorded metrics
      this.stats.forEach(stat => {
        totalHits += stat.hits;
        totalMisses += stat.misses;
        if (stat.responseTime.length > 0) {
          totalResponseTime += stat.responseTime.reduce((a, b) => a + b, 0) / stat.responseTime.length;
        }
      });

      // Sort top keys by hits
      topKeys.sort((a, b) => b.hits - a.hits);

      return {
        hits: totalHits,
        misses: totalMisses,
        hitRate: totalHits + totalMisses > 0 ? totalHits / (totalHits + totalMisses) : 0,
        totalSize,
        itemCount: keys.length,
        avgResponseTime: this.stats.size > 0 ? totalResponseTime / this.stats.size : 0,
        topKeys: topKeys.slice(0, 10)
      };

    } catch (error) {
      console.error('Failed to get cache stats:', error);
      return {
        hits: 0,
        misses: 0,
        hitRate: 0,
        totalSize: 0,
        itemCount: 0,
        avgResponseTime: 0,
        topKeys: []
      };
    }
  }

  /**
   * Record cache hit
   */
  private recordHit(key: string, responseTime: number): void {
    const stat = this.stats.get(key) || { hits: 0, misses: 0, responseTime: [] };
    stat.hits++;
    stat.responseTime.push(responseTime);
    
    // Keep only last 100 response times
    if (stat.responseTime.length > 100) {
      stat.responseTime = stat.responseTime.slice(-100);
    }
    
    this.stats.set(key, stat);
  }

  /**
   * Record cache miss
   */
  private recordMiss(key: string, responseTime: number): void {
    const stat = this.stats.get(key) || { hits: 0, misses: 0, responseTime: [] };
    stat.misses++;
    stat.responseTime.push(responseTime);
    
    // Keep only last 100 response times
    if (stat.responseTime.length > 100) {
      stat.responseTime = stat.responseTime.slice(-100);
    }
    
    this.stats.set(key, stat);
  }

  /**
   * Warm up cache with common queries
   */
  async warmUp(endpoints: Array<{ path: string; params?: Record<string, any> }>): Promise<void> {
    console.log(`🔥 Warming up cache for ${endpoints.length} endpoints`);
    
    const warmupPromises = endpoints.map(async endpoint => {
      try {
        const cacheKey = this.generateCacheKey(endpoint.path, endpoint.params);
        console.log(`🔥 Warming up: ${endpoint.path}`);
        // Note: In real implementation, you'd make actual API calls here
      } catch (error) {
        console.error(`Failed to warm up ${endpoint.path}:`, error);
      }
    });

    await Promise.all(warmupPromises);
    console.log('🔥 Cache warm-up completed');
  }

  /**
   * AI-specific cache configurations
   */
  static getAIConfig(operation: string): CacheConfig {
    const configs: Record<string, CacheConfig> = {
      'categorization': {
        ttl: 3600, // 1 hour
        tags: ['ai', 'categorization'],
        staleWhileRevalidate: 600, // 10 minutes
        compression: true
      },
      'tagging': {
        ttl: 1800, // 30 minutes
        tags: ['ai', 'tagging'],
        staleWhileRevalidate: 300, // 5 minutes
        compression: true
      },
      'content-analysis': {
        ttl: 7200, // 2 hours
        tags: ['ai', 'content-analysis'],
        staleWhileRevalidate: 1200, // 20 minutes
        compression: true
      },
      'recommendations': {
        ttl: 900, // 15 minutes
        tags: ['ai', 'recommendations'],
        staleWhileRevalidate: 180, // 3 minutes
        compression: true,
        vary: ['user-id', 'preferences']
      },
      'chat': {
        ttl: 300, // 5 minutes
        tags: ['ai', 'chat'],
        compression: true,
        vary: ['user-id', 'conversation-id']
      }
    };

    return configs[operation] || {
      ttl: 300,
      tags: ['ai'],
      compression: true
    };
  }
}

// Export singleton instance
export const apiCache = new APICacheManager();

// Helper functions for common patterns
export const withCache = (config: CacheConfig = {}) => {
  return (handler: () => Promise<NextResponse>) => {
    return async (request: NextRequest) => {
      return apiCache.cacheMiddleware(request, handler, config);
    };
  };
};

export const invalidateAICache = async (operation?: string) => {
  if (operation) {
    return apiCache.invalidateByTags(['ai', operation]);
  }
  return apiCache.invalidateByTags(['ai']);
};

export const cacheAIResponse = async (
  operation: string,
  key: string,
  data: any
) => {
  const config = APICacheManager.getAIConfig(operation);
  return apiCache.set(key, data, config);
};                  