import { getCacheManager } from '../cache/redis-manager';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  algorithm?: 'fixed-window' | 'sliding-window' | 'token-bucket' | 'leaky-bucket';
  keyGenerator?: (request: NextRequest) => string; // Custom key generator
  skipSuccessfulRequests?: boolean; // Don't count successful requests
  skipFailedRequests?: boolean; // Don't count failed requests
  onLimitReached?: (request: NextRequest) => Promise<NextResponse>; // Custom response
  headers?: boolean; // Include rate limit headers in response
  store?: 'redis' | 'memory'; // Storage backend
  burst?: number; // Allow burst requests (for token bucket)
  refillRate?: number; // Token refill rate (for token bucket)
  capacity?: number; // Bucket capacity (for leaky bucket)
  leakRate?: number; // Leak rate (for leaky bucket)
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
  algorithm: string;
}

export interface RateLimitStats {
  endpoint: string;
  totalRequests: number;
  blockedRequests: number;
  blockRate: number;
  avgResponseTime: number;
  peakRPS: number;
  currentRPS: number;
  topClients: Array<{ identifier: string; requests: number; blocked: number }>;
}

export class RateLimiter {
  private cacheManager: ReturnType<typeof getCacheManager>;
  private redis: ReturnType<ReturnType<typeof getCacheManager>['getClient']>;
  private memoryStore: Map<string, any> = new Map();
  private stats: Map<string, { requests: number; blocked: number; responseTimes: number[] }> = new Map();

  constructor() {
    this.cacheManager = getCacheManager();
    this.redis = this.cacheManager.getClient();
  }

  /**
   * Default key generator - uses IP + User-Agent
   */
  private defaultKeyGenerator(request: NextRequest): string {
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const endpoint = new URL(request.url).pathname;
    
    return `rate_limit:${endpoint}:${crypto
      .createHash('sha256')
      .update(`${ip}:${userAgent}`)
      .digest('hex')}`;
  }

  /**
   * User-based key generator
   */
  private userKeyGenerator(request: NextRequest): string {
    const userId = request.headers.get('x-user-id') || 
                   request.headers.get('authorization')?.split(' ')[1] || 
                   this.defaultKeyGenerator(request);
    const endpoint = new URL(request.url).pathname;
    
    return `rate_limit:user:${endpoint}:${userId}`;
  }

  /**
   * API key-based key generator
   */
  private apiKeyGenerator(request: NextRequest): string {
    const apiKey = request.headers.get('x-api-key') || 
                   request.headers.get('authorization')?.replace('Bearer ', '') ||
                   this.defaultKeyGenerator(request);
    const endpoint = new URL(request.url).pathname;
    
    return `rate_limit:api:${endpoint}:${crypto
      .createHash('sha256')
      .update(apiKey)
      .digest('hex')}`;
  }

  /**
   * Fixed window rate limiting
   */
  private async fixedWindow(
    key: string,
    config: RateLimitConfig,
    store: 'redis' | 'memory'
  ): Promise<RateLimitResult> {
    const now = Date.now();
    const windowStart = Math.floor(now / config.windowMs) * config.windowMs;
    const windowKey = `${key}:${windowStart}`;

    let currentCount = 0;
    
    // Fall back to memory if Redis is not available
    if (store === 'redis' && this.redis) {
      currentCount = await this.redis.incr(windowKey);
      if (currentCount === 1) {
        await this.redis.expire(windowKey, Math.ceil(config.windowMs / 1000));
      }
    } else {
      const stored = this.memoryStore.get(windowKey) || 0;
      currentCount = stored + 1;
      this.memoryStore.set(windowKey, currentCount);
      
      // Clean up expired windows
      setTimeout(() => {
        this.memoryStore.delete(windowKey);
      }, config.windowMs);
    }

    const remaining = Math.max(0, config.maxRequests - currentCount);
    const resetTime = windowStart + config.windowMs;

    return {
      allowed: currentCount <= config.maxRequests,
      limit: config.maxRequests,
      remaining,
      resetTime,
      retryAfter: currentCount > config.maxRequests ? Math.ceil((resetTime - now) / 1000) : undefined,
      algorithm: 'fixed-window'
    };
  }

  /**
   * Sliding window rate limiting
   */
  private async slidingWindow(
    key: string,
    config: RateLimitConfig,
    store: 'redis' | 'memory'
  ): Promise<RateLimitResult> {
    const now = Date.now();
    const windowStart = now - config.windowMs;

    // Fall back to memory if Redis is not available
    if (store === 'redis' && this.redis) {
      // Use Redis sorted set to track requests with timestamps
      // Remove old requests
      await this.redis.zRemRangeByScore(key, 0, windowStart);
      
      // Add current request
      await this.redis.zAdd(key, { score: now, value: `${now}-${Math.random()}` });
      
      // Count requests in window
      const currentCount = await this.redis.zCard(key);
      
      // Set expiration
      await this.redis.expire(key, Math.ceil(config.windowMs / 1000));

      const remaining = Math.max(0, config.maxRequests - currentCount);
      const resetTime = now + config.windowMs;

      return {
        allowed: currentCount <= config.maxRequests,
        limit: config.maxRequests,
        remaining,
        resetTime,
        retryAfter: currentCount > config.maxRequests ? Math.ceil(config.windowMs / 1000) : undefined,
        algorithm: 'sliding-window'
      };
    } else {
      // Memory-based sliding window
      let requests = this.memoryStore.get(key) || [];
      
      // Filter out old requests
      requests = requests.filter((timestamp: number) => timestamp > windowStart);
      
      // Add current request
      requests.push(now);
      
      this.memoryStore.set(key, requests);

      const remaining = Math.max(0, config.maxRequests - requests.length);
      const resetTime = now + config.windowMs;

      return {
        allowed: requests.length <= config.maxRequests,
        limit: config.maxRequests,
        remaining,
        resetTime,
        retryAfter: requests.length > config.maxRequests ? Math.ceil(config.windowMs / 1000) : undefined,
        algorithm: 'sliding-window'
      };
    }
  }

  /**
   * Token bucket rate limiting
   */
  private async tokenBucket(
    key: string,
    config: RateLimitConfig,
    store: 'redis' | 'memory'
  ): Promise<RateLimitResult> {
    const now = Date.now();
    const capacity = config.burst || config.maxRequests;
    const refillRate = config.refillRate || config.maxRequests / (config.windowMs / 1000);

    // Fall back to memory if Redis is not available
    if (store === 'redis' && this.redis) {
      const script = `
        local key = KEYS[1]
        local capacity = tonumber(ARGV[1])
        local refillRate = tonumber(ARGV[2])
        local now = tonumber(ARGV[3])
        
        local bucket = redis.call('HMGET', key, 'tokens', 'lastRefill')
        local tokens = tonumber(bucket[1]) or capacity
        local lastRefill = tonumber(bucket[2]) or now
        
        -- Calculate tokens to add
        local timePassed = (now - lastRefill) / 1000
        local tokensToAdd = timePassed * refillRate
        tokens = math.min(capacity, tokens + tokensToAdd)
        
        local allowed = tokens >= 1
        if allowed then
          tokens = tokens - 1
        end
        
        -- Update bucket
        redis.call('HMSET', key, 'tokens', tokens, 'lastRefill', now)
        redis.call('EXPIRE', key, 3600) -- 1 hour expiration
        
        return {allowed and 1 or 0, tokens, capacity}
      `;

      const result = await this.redis.eval(script, { keys: [key], arguments: [capacity.toString(), refillRate.toString(), now.toString()] }) as number[];
      const [allowed, tokens, maxTokens] = result;

      return {
        allowed: allowed === 1,
        limit: maxTokens,
        remaining: Math.floor(tokens),
        resetTime: now + ((maxTokens - tokens) / refillRate) * 1000,
        retryAfter: allowed === 0 ? Math.ceil((1 - tokens) / refillRate) : undefined,
        algorithm: 'token-bucket'
      };
    } else {
      // Memory-based token bucket
      const bucket = this.memoryStore.get(key) || { tokens: capacity, lastRefill: now };
      
      // Calculate tokens to add
      const timePassed = (now - bucket.lastRefill) / 1000;
      const tokensToAdd = timePassed * refillRate;
      bucket.tokens = Math.min(capacity, bucket.tokens + tokensToAdd);
      bucket.lastRefill = now;

      const allowed = bucket.tokens >= 1;
      if (allowed) {
        bucket.tokens -= 1;
      }

      this.memoryStore.set(key, bucket);

      return {
        allowed,
        limit: capacity,
        remaining: Math.floor(bucket.tokens),
        resetTime: now + ((capacity - bucket.tokens) / refillRate) * 1000,
        retryAfter: !allowed ? Math.ceil((1 - bucket.tokens) / refillRate) : undefined,
        algorithm: 'token-bucket'
      };
    }
  }

  /**
   * Leaky bucket rate limiting
   */
  private async leakyBucket(
    key: string,
    config: RateLimitConfig,
    store: 'redis' | 'memory'
  ): Promise<RateLimitResult> {
    const now = Date.now();
    const capacity = config.capacity || config.maxRequests;
    const leakRate = config.leakRate || config.maxRequests / (config.windowMs / 1000);

    // Fall back to memory if Redis is not available
    if (store === 'redis' && this.redis) {
      const script = `
        local key = KEYS[1]
        local capacity = tonumber(ARGV[1])
        local leakRate = tonumber(ARGV[2])
        local now = tonumber(ARGV[3])
        
        local bucket = redis.call('HMGET', key, 'volume', 'lastLeak')
        local volume = tonumber(bucket[1]) or 0
        local lastLeak = tonumber(bucket[2]) or now
        
        -- Calculate leaked volume
        local timePassed = (now - lastLeak) / 1000
        local leaked = timePassed * leakRate
        volume = math.max(0, volume - leaked)
        
        local allowed = volume < capacity
        if allowed then
          volume = volume + 1
        end
        
        -- Update bucket
        redis.call('HMSET', key, 'volume', volume, 'lastLeak', now)
        redis.call('EXPIRE', key, 3600) -- 1 hour expiration
        
        return {allowed and 1 or 0, volume, capacity}
      `;

      const result = await this.redis.eval(script, { keys: [key], arguments: [capacity.toString(), leakRate.toString(), now.toString()] }) as number[];
      const [allowed, volume, maxVolume] = result;

      return {
        allowed: allowed === 1,
        limit: maxVolume,
        remaining: Math.max(0, maxVolume - volume),
        resetTime: now + ((volume / leakRate) * 1000),
        retryAfter: allowed === 0 ? Math.ceil(1 / leakRate) : undefined,
        algorithm: 'leaky-bucket'
      };
    } else {
      // Memory-based leaky bucket
      const bucket = this.memoryStore.get(key) || { volume: 0, lastLeak: now };
      
      // Calculate leaked volume
      const timePassed = (now - bucket.lastLeak) / 1000;
      const leaked = timePassed * leakRate;
      bucket.volume = Math.max(0, bucket.volume - leaked);
      bucket.lastLeak = now;

      const allowed = bucket.volume < capacity;
      if (allowed) {
        bucket.volume += 1;
      }

      this.memoryStore.set(key, bucket);

      return {
        allowed,
        limit: capacity,
        remaining: Math.max(0, capacity - bucket.volume),
        resetTime: now + ((bucket.volume / leakRate) * 1000),
        retryAfter: !allowed ? Math.ceil(1 / leakRate) : undefined,
        algorithm: 'leaky-bucket'
      };
    }
  }

  /**
   * Check rate limit
   */
  async checkLimit(request: NextRequest, config: RateLimitConfig): Promise<RateLimitResult> {
    const keyGenerator = config.keyGenerator || this.defaultKeyGenerator.bind(this);
    const key = keyGenerator(request);
    const algorithm = config.algorithm || 'sliding-window';
    const store = config.store || 'redis';

    let result: RateLimitResult;

    switch (algorithm) {
      case 'fixed-window':
        result = await this.fixedWindow(key, config, store);
        break;
      case 'sliding-window':
        result = await this.slidingWindow(key, config, store);
        break;
      case 'token-bucket':
        result = await this.tokenBucket(key, config, store);
        break;
      case 'leaky-bucket':
        result = await this.leakyBucket(key, config, store);
        break;
      default:
        result = await this.slidingWindow(key, config, store);
    }

    // Record stats
    this.recordRequest(request, result);

    return result;
  }

  /**
   * Rate limiting middleware
   */
  async middleware(
    request: NextRequest,
    config: RateLimitConfig
  ): Promise<NextResponse | null> {
    const startTime = Date.now();
    const result = await this.checkLimit(request, config);

    if (!result.allowed) {
      const response = config.onLimitReached 
        ? await config.onLimitReached(request)
        : new NextResponse(
            JSON.stringify({
              error: 'Rate limit exceeded',
              message: `Too many requests. Try again in ${result.retryAfter} seconds.`,
              retryAfter: result.retryAfter
            }),
            {
              status: 429,
              headers: {
                'Content-Type': 'application/json',
                'Retry-After': result.retryAfter?.toString() || '60'
              }
            }
          );

      if (config.headers !== false) {
        response.headers.set('X-RateLimit-Limit', result.limit.toString());
        response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
        response.headers.set('X-RateLimit-Reset', result.resetTime.toString());
        response.headers.set('X-RateLimit-Algorithm', result.algorithm);
      }

      return response;
    }

    // Add rate limit headers to successful responses
    if (config.headers !== false) {
      // These will be added to the response by the calling code
      (request as any).rateLimitHeaders = {
        'X-RateLimit-Limit': result.limit.toString(),
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset': result.resetTime.toString(),
        'X-RateLimit-Algorithm': result.algorithm
      };
    }

    return null; // Allow request to proceed
  }

  /**
   * Record request statistics
   */
  private recordRequest(request: NextRequest, result: RateLimitResult): void {
    const endpoint = new URL(request.url).pathname;
    const stat = this.stats.get(endpoint) || { requests: 0, blocked: 0, responseTimes: [] };
    
    stat.requests++;
    if (!result.allowed) {
      stat.blocked++;
    }

    this.stats.set(endpoint, stat);
  }

  /**
   * Get rate limiting statistics
   */
  async getStats(endpoint?: string): Promise<RateLimitStats[]> {
    const results: RateLimitStats[] = [];

    for (const [endpointPath, stat] of this.stats.entries()) {
      if (endpoint && endpointPath !== endpoint) {
        continue;
      }

      const blockRate = stat.requests > 0 ? stat.blocked / stat.requests : 0;
      const avgResponseTime = stat.responseTimes.length > 0 
        ? stat.responseTimes.reduce((a, b) => a + b, 0) / stat.responseTimes.length 
        : 0;

      results.push({
        endpoint: endpointPath,
        totalRequests: stat.requests,
        blockedRequests: stat.blocked,
        blockRate,
        avgResponseTime,
        peakRPS: 0, // Would need more sophisticated tracking
        currentRPS: 0, // Would need more sophisticated tracking
        topClients: [] // Would need client tracking
      });
    }

    return results;
  }

  /**
   * Clear rate limit for a specific key
   */
  async clearLimit(request: NextRequest, config: RateLimitConfig): Promise<boolean> {
    const keyGenerator = config.keyGenerator || this.defaultKeyGenerator.bind(this);
    const key = keyGenerator(request);
    
    try {
      if (config.store === 'memory' || !this.redis) {
        this.memoryStore.delete(key);
      } else {
        await this.redis.del(key);
      }
      return true;
    } catch (error) {
      console.error('Failed to clear rate limit:', error);
      return false;
    }
  }

  /**
   * Predefined configurations for different use cases
   */
  static getPresetConfig(preset: string): RateLimitConfig {
    const presets: Record<string, RateLimitConfig> = {
      // API endpoints
      'api-strict': {
        windowMs: 60 * 1000, // 1 minute
        maxRequests: 60, // 60 requests per minute
        algorithm: 'sliding-window',
        keyGenerator: this.prototype.apiKeyGenerator,
        headers: true
      },
      'api-moderate': {
        windowMs: 60 * 1000, // 1 minute
        maxRequests: 300, // 300 requests per minute
        algorithm: 'sliding-window',
        keyGenerator: this.prototype.apiKeyGenerator,
        headers: true
      },
      'api-lenient': {
        windowMs: 60 * 1000, // 1 minute
        maxRequests: 1000, // 1000 requests per minute
        algorithm: 'token-bucket',
        burst: 100,
        keyGenerator: this.prototype.apiKeyGenerator,
        headers: true
      },

      // AI operations
      'ai-processing': {
        windowMs: 60 * 1000, // 1 minute
        maxRequests: 20, // 20 AI requests per minute
        algorithm: 'token-bucket',
        burst: 5,
        refillRate: 0.33, // ~20 per minute
        keyGenerator: this.prototype.userKeyGenerator,
        headers: true
      },
      'ai-chat': {
        windowMs: 60 * 1000, // 1 minute
        maxRequests: 60, // 60 messages per minute
        algorithm: 'leaky-bucket',
        capacity: 10,
        leakRate: 1, // 1 message per second
        keyGenerator: this.prototype.userKeyGenerator,
        headers: true
      },

      // User operations
      'user-actions': {
        windowMs: 60 * 1000, // 1 minute
        maxRequests: 100, // 100 actions per minute
        algorithm: 'sliding-window',
        keyGenerator: this.prototype.userKeyGenerator,
        headers: true
      },
      'user-uploads': {
        windowMs: 60 * 1000, // 1 minute
        maxRequests: 10, // 10 uploads per minute
        algorithm: 'fixed-window',
        keyGenerator: this.prototype.userKeyGenerator,
        headers: true
      },

      // Public endpoints
      'public-strict': {
        windowMs: 60 * 1000, // 1 minute
        maxRequests: 30, // 30 requests per minute per IP
        algorithm: 'sliding-window',
        headers: true
      },
      'public-moderate': {
        windowMs: 60 * 1000, // 1 minute
        maxRequests: 100, // 100 requests per minute per IP
        algorithm: 'sliding-window',
        headers: true
      }
    };

    return presets[preset] || presets['api-moderate'];
  }
}

// Export singleton instance
export const rateLimiter = new RateLimiter();

// Helper functions
export const withRateLimit = (config: RateLimitConfig | string) => {
  const rateLimitConfig = typeof config === 'string' 
    ? RateLimiter.getPresetConfig(config)
    : config;

  return async (request: NextRequest, handler: () => Promise<NextResponse>) => {
    const limitResponse = await rateLimiter.middleware(request, rateLimitConfig);
    
    if (limitResponse) {
      return limitResponse; // Rate limited
    }

    // Execute handler
    const response = await handler();

    // Add rate limit headers if available
    const headers = (request as any).rateLimitHeaders;
    if (headers && rateLimitConfig.headers !== false) {
      Object.entries(headers).forEach(([key, value]) => {
        response.headers.set(key, value as string);
      });
    }

    return response;
  };
};

export const clearUserRateLimit = async (userId: string, endpoint: string) => {
  const key = `rate_limit:user:${endpoint}:${userId}`;
  const rateLimiterInstance = rateLimiter as any;
  if (rateLimiterInstance.redis) {
    return rateLimiterInstance.redis.del(key);
  }
  return false;
};

export const getRateLimitStats = async (endpoint?: string) => {
  return rateLimiter.getStats(endpoint);
};              