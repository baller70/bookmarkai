// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { gzip, deflate, brotliCompress } from 'zlib';
import { promisify } from 'util';

const gzipAsync = promisify(gzip);
const deflateAsync = promisify(deflate);
const brotliCompressAsync = promisify(brotliCompress);

export interface CompressionConfig {
  threshold?: number; // Minimum size to compress (bytes)
  level?: number; // Compression level (1-9)
  algorithms?: ('gzip' | 'deflate' | 'br')[];
  mimeTypes?: string[]; // MIME types to compress
  excludeTypes?: string[]; // MIME types to exclude
  maxSize?: number; // Maximum size to compress (bytes)
  enabled?: boolean; // Enable/disable compression
  cacheCompressed?: boolean; // Cache compressed responses
  measurePerformance?: boolean; // Track compression performance
}

export interface CompressionStats {
  totalRequests: number;
  compressedRequests: number;
  compressionRatio: number;
  avgCompressionTime: number;
  totalBytesSaved: number;
  algorithmUsage: Record<string, number>;
  mimeTypeStats: Record<string, { requests: number; avgRatio: number }>;
}

export interface CompressionResult {
  compressed: boolean;
  algorithm?: string;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  compressionTime: number;
}

export class CompressionManager {
  private config: Required<CompressionConfig>;
  private stats: CompressionStats;
  private performanceMetrics: Array<{
    timestamp: number;
    algorithm: string;
    originalSize: number;
    compressedSize: number;
    compressionTime: number;
    mimeType: string;
  }> = [];

  constructor(config: CompressionConfig = {}) {
    this.config = {
      threshold: config.threshold || 1024, // 1KB
      level: config.level || 6, // Balanced compression
      algorithms: config.algorithms || ['br', 'gzip', 'deflate'],
      mimeTypes: config.mimeTypes || [
        'application/json',
        'application/javascript',
        'application/xml',
        'text/html',
        'text/css',
        'text/javascript',
        'text/xml',
        'text/plain',
        'text/csv',
        'image/svg+xml'
      ],
      excludeTypes: config.excludeTypes || [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'video/*',
        'audio/*',
        'application/zip',
        'application/gzip',
        'application/pdf'
      ],
      maxSize: config.maxSize || 10 * 1024 * 1024, // 10MB
      enabled: config.enabled !== false,
      cacheCompressed: config.cacheCompressed !== false,
      measurePerformance: config.measurePerformance !== false
    };

    this.stats = {
      totalRequests: 0,
      compressedRequests: 0,
      compressionRatio: 0,
      avgCompressionTime: 0,
      totalBytesSaved: 0,
      algorithmUsage: {},
      mimeTypeStats: {}
    };
  }

  /**
   * Determine the best compression algorithm based on Accept-Encoding header
   */
  private getBestAlgorithm(acceptEncoding: string | null): string | null {
    if (!acceptEncoding) return null;

    const supported = acceptEncoding.toLowerCase().split(',').map(enc => enc.trim());
    
    // Check algorithms in order of preference
    for (const algorithm of this.config.algorithms) {
      if (algorithm === 'br' && supported.some(enc => enc.includes('br'))) {
        return 'br';
      }
      if (algorithm === 'gzip' && supported.some(enc => enc.includes('gzip'))) {
        return 'gzip';
      }
      if (algorithm === 'deflate' && supported.some(enc => enc.includes('deflate'))) {
        return 'deflate';
      }
    }

    return null;
  }

  /**
   * Check if content should be compressed
   */
  private shouldCompress(
    contentType: string | null,
    contentLength: number,
    acceptEncoding: string | null
  ): boolean {
    if (!this.config.enabled) return false;
    if (!acceptEncoding) return false;
    if (contentLength < this.config.threshold) return false;
    if (contentLength > this.config.maxSize) return false;

    if (!contentType) return false;

    // Check excluded types
    for (const excludeType of this.config.excludeTypes) {
      if (excludeType.endsWith('*')) {
        const prefix = excludeType.slice(0, -1);
        if (contentType.startsWith(prefix)) return false;
      } else if (contentType.includes(excludeType)) {
        return false;
      }
    }

    // Check included types
    for (const mimeType of this.config.mimeTypes) {
      if (mimeType.endsWith('*')) {
        const prefix = mimeType.slice(0, -1);
        if (contentType.startsWith(prefix)) return true;
      } else if (contentType.includes(mimeType)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Compress data using specified algorithm
   */
  private async compressData(
    data: Buffer,
    algorithm: string
  ): Promise<{ compressed: Buffer; time: number }> {
    const startTime = Date.now();
    let compressed: Buffer;

    try {
      switch (algorithm) {
        case 'br':
          compressed = await brotliCompressAsync(data, {
            [require('zlib').constants.BROTLI_PARAM_QUALITY]: this.config.level
          });
          break;
        case 'gzip':
          compressed = await gzipAsync(data, { level: this.config.level });
          break;
        case 'deflate':
          compressed = await deflateAsync(data, { level: this.config.level });
          break;
        default:
          throw new Error(`Unsupported compression algorithm: ${algorithm}`);
      }

      const compressionTime = Date.now() - startTime;
      return { compressed, time: compressionTime };
    } catch (error) {
      console.error(`Compression failed for algorithm ${algorithm}:`, error);
      throw error;
    }
  }

  /**
   * Compress response data
   */
  async compressResponse(
    data: string | Buffer,
    contentType: string | null,
    acceptEncoding: string | null
  ): Promise<CompressionResult> {
    const originalData = Buffer.isBuffer(data) ? data : Buffer.from(data, 'utf8');
    const originalSize = originalData.length;

    const result: CompressionResult = {
      compressed: false,
      originalSize,
      compressedSize: originalSize,
      compressionRatio: 1,
      compressionTime: 0
    };

    // Check if compression should be applied
    if (!this.shouldCompress(contentType, originalSize, acceptEncoding)) {
      return result;
    }

    // Determine best algorithm
    const algorithm = this.getBestAlgorithm(acceptEncoding);
    if (!algorithm) {
      return result;
    }

    try {
      const { compressed, time } = await this.compressData(originalData, algorithm);
      const compressedSize = compressed.length;
      const compressionRatio = originalSize / compressedSize;

      // Only use compression if it actually reduces size significantly
      if (compressedSize >= originalSize * 0.9) {
        return result; // Less than 10% savings, not worth it
      }

      result.compressed = true;
      result.algorithm = algorithm;
      result.compressedSize = compressedSize;
      result.compressionRatio = compressionRatio;
      result.compressionTime = time;

      // Record performance metrics
      if (this.config.measurePerformance) {
        this.recordPerformance({
          timestamp: Date.now(),
          algorithm,
          originalSize,
          compressedSize,
          compressionTime: time,
          mimeType: contentType || 'unknown'
        });
      }

      return result;
    } catch (error) {
      console.error('Compression failed:', error);
      return result;
    }
  }

  /**
   * Compression middleware for API responses
   */
  async middleware(
    request: NextRequest,
    handler: () => Promise<NextResponse>
  ): Promise<NextResponse> {
    this.stats.totalRequests++;

    // Execute the handler first
    const response = await handler();

    // Skip compression for non-successful responses
    if (response.status < 200 || response.status >= 300) {
      return response;
    }

    // Skip if already compressed
    if (response.headers.get('content-encoding')) {
      return response;
    }

    try {
      // Get response data
      const responseData = await response.text();
      const contentType = response.headers.get('content-type');
      const acceptEncoding = request.headers.get('accept-encoding');

      // Attempt compression
      const compressionResult = await this.compressResponse(
        responseData,
        contentType,
        acceptEncoding
      );

      if (compressionResult.compressed && compressionResult.algorithm) {
        this.stats.compressedRequests++;
        this.stats.totalBytesSaved += 
          compressionResult.originalSize - compressionResult.compressedSize;

        // Update algorithm usage stats
        this.stats.algorithmUsage[compressionResult.algorithm] = 
          (this.stats.algorithmUsage[compressionResult.algorithm] || 0) + 1;

        // Create compressed response
        const compressedData = await this.compressData(
          Buffer.from(responseData, 'utf8'),
          compressionResult.algorithm
        );

        const compressedResponse = new NextResponse(compressedData.compressed, {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers
        });

        // Add compression headers
        compressedResponse.headers.set('Content-Encoding', compressionResult.algorithm);
        compressedResponse.headers.set('Content-Length', compressionResult.compressedSize.toString());
        compressedResponse.headers.set('X-Compression-Ratio', compressionResult.compressionRatio.toFixed(2));
        compressedResponse.headers.set('X-Compression-Time', compressionResult.compressionTime.toString());
        compressedResponse.headers.set('X-Original-Size', compressionResult.originalSize.toString());
        compressedResponse.headers.set('Vary', 'Accept-Encoding');

        return compressedResponse;
      }

      return response;
    } catch (error) {
      console.error('Compression middleware error:', error);
      return response; // Return original response on error
    }
  }

  /**
   * Record performance metrics
   */
  private recordPerformance(metric: {
    timestamp: number;
    algorithm: string;
    originalSize: number;
    compressedSize: number;
    compressionTime: number;
    mimeType: string;
  }): void {
    this.performanceMetrics.push(metric);

    // Keep only last 1000 metrics
    if (this.performanceMetrics.length > 1000) {
      this.performanceMetrics = this.performanceMetrics.slice(-1000);
    }

    // Update MIME type stats
    const mimeTypeKey = metric.mimeType.split(';')[0]; // Remove charset etc.
    if (!this.stats.mimeTypeStats[mimeTypeKey]) {
      this.stats.mimeTypeStats[mimeTypeKey] = { requests: 0, avgRatio: 0 };
    }

    const mimeStats = this.stats.mimeTypeStats[mimeTypeKey];
    const oldAvg = mimeStats.avgRatio;
    const oldCount = mimeStats.requests;
    const newRatio = metric.originalSize / metric.compressedSize;

    mimeStats.requests++;
    mimeStats.avgRatio = (oldAvg * oldCount + newRatio) / mimeStats.requests;
  }

  /**
   * Get compression statistics
   */
  getStats(): CompressionStats {
    // Calculate average compression ratio
    if (this.performanceMetrics.length > 0) {
      const totalRatio = this.performanceMetrics.reduce(
        (sum, metric) => sum + (metric.originalSize / metric.compressedSize),
        0
      );
      this.stats.compressionRatio = totalRatio / this.performanceMetrics.length;

      // Calculate average compression time
      const totalTime = this.performanceMetrics.reduce(
        (sum, metric) => sum + metric.compressionTime,
        0
      );
      this.stats.avgCompressionTime = totalTime / this.performanceMetrics.length;
    }

    return { ...this.stats };
  }

  /**
   * Get detailed performance metrics
   */
  getDetailedStats(): {
    stats: CompressionStats;
    recentMetrics: typeof this.performanceMetrics;
    algorithmPerformance: Record<string, {
      count: number;
      avgRatio: number;
      avgTime: number;
      totalSaved: number;
    }>;
  } {
    const algorithmPerformance: Record<string, {
      count: number;
      avgRatio: number;
      avgTime: number;
      totalSaved: number;
    }> = {};

    // Calculate algorithm-specific performance
    this.performanceMetrics.forEach(metric => {
      const alg = metric.algorithm;
      if (!algorithmPerformance[alg]) {
        algorithmPerformance[alg] = {
          count: 0,
          avgRatio: 0,
          avgTime: 0,
          totalSaved: 0
        };
      }

      const perf = algorithmPerformance[alg];
      const oldAvgRatio = perf.avgRatio;
      const oldAvgTime = perf.avgTime;
      const oldCount = perf.count;

      perf.count++;
      perf.avgRatio = (oldAvgRatio * oldCount + (metric.originalSize / metric.compressedSize)) / perf.count;
      perf.avgTime = (oldAvgTime * oldCount + metric.compressionTime) / perf.count;
      perf.totalSaved += metric.originalSize - metric.compressedSize;
    });

    return {
      stats: this.getStats(),
      recentMetrics: [...this.performanceMetrics],
      algorithmPerformance
    };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = {
      totalRequests: 0,
      compressedRequests: 0,
      compressionRatio: 0,
      avgCompressionTime: 0,
      totalBytesSaved: 0,
      algorithmUsage: {},
      mimeTypeStats: {}
    };
    this.performanceMetrics = [];
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<CompressionConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Test compression for a given payload
   */
  async testCompression(
    data: string | Buffer,
    contentType: string = 'application/json'
  ): Promise<{
    algorithms: Record<string, {
      size: number;
      ratio: number;
      time: number;
    }>;
    best: string;
  }> {
    const originalData = Buffer.isBuffer(data) ? data : Buffer.from(data, 'utf8');
    const originalSize = originalData.length;
    const results: Record<string, { size: number; ratio: number; time: number }> = {};

    for (const algorithm of this.config.algorithms) {
      try {
        const { compressed, time } = await this.compressData(originalData, algorithm);
        results[algorithm] = {
          size: compressed.length,
          ratio: originalSize / compressed.length,
          time
        };
      } catch (error) {
        console.error(`Failed to test ${algorithm}:`, error);
      }
    }

    // Find best algorithm (highest compression ratio with reasonable time)
    let best = Object.keys(results)[0];
    let bestScore = 0;

    Object.entries(results).forEach(([algorithm, result]) => {
      // Score based on compression ratio with time penalty
      const score = result.ratio - (result.time / 1000); // Penalize slow compression
      if (score > bestScore) {
        bestScore = score;
        best = algorithm;
      }
    });

    return { algorithms: results, best };
  }
}

// Export singleton instance
export const compressionManager = new CompressionManager();

// Helper functions
export const withCompression = (config: CompressionConfig = {}) => {
  const manager = new CompressionManager(config);
  
  return async (request: NextRequest, handler: () => Promise<NextResponse>) => {
    return manager.middleware(request, handler);
  };
};

export const compressJSON = async (
  data: any,
  acceptEncoding: string | null = 'gzip, deflate, br'
): Promise<{ data: Buffer; encoding?: string; stats: CompressionResult }> => {
  const jsonString = JSON.stringify(data);
  const result = await compressionManager.compressResponse(
    jsonString,
    'application/json',
    acceptEncoding
  );

  if (result.compressed && result.algorithm) {
    const { compressed } = await (compressionManager as any).compressData(
      Buffer.from(jsonString, 'utf8'),
      result.algorithm
    );
    return {
      data: compressed,
      encoding: result.algorithm,
      stats: result
    };
  }

  return {
    data: Buffer.from(jsonString, 'utf8'),
    stats: result
  };
};

export const getCompressionStats = () => compressionManager.getStats();
export const getDetailedCompressionStats = () => compressionManager.getDetailedStats();

// Predefined configurations
export const CompressionPresets = {
  // High compression for APIs with larger responses
  'api-high': {
    threshold: 512, // 512 bytes
    level: 9, // Maximum compression
    algorithms: ['br', 'gzip'] as const,
    measurePerformance: true
  },

  // Balanced compression for general use
  'api-balanced': {
    threshold: 1024, // 1KB
    level: 6, // Balanced
    algorithms: ['br', 'gzip', 'deflate'] as const,
    measurePerformance: true
  },

  // Fast compression for high-throughput APIs
  'api-fast': {
    threshold: 2048, // 2KB
    level: 3, // Fast compression
    algorithms: ['gzip', 'deflate'] as const,
    measurePerformance: false
  },

  // JSON-optimized compression
  'json-optimized': {
    threshold: 256, // 256 bytes
    level: 7,
    algorithms: ['br', 'gzip'] as const,
    mimeTypes: ['application/json'],
    measurePerformance: true
  }
} as const;   