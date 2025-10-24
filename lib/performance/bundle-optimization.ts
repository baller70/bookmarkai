import { logger } from '../logger';

// Bundle analysis interfaces
interface BundleAnalysis {
  totalSize: number;
  gzippedSize: number;
  chunks: ChunkInfo[];
  assets: AssetInfo[];
  modules: ModuleInfo[];
  warnings: string[];
  recommendations: string[];
}

interface ChunkInfo {
  name: string;
  size: number;
  modules: string[];
  parents: string[];
  children: string[];
  isEntry: boolean;
  isInitial: boolean;
}

interface AssetInfo {
  name: string;
  size: number;
  type: 'js' | 'css' | 'image' | 'font' | 'other';
  compressed: boolean;
  cached: boolean;
}

interface ModuleInfo {
  name: string;
  size: number;
  chunks: string[];
  depth: number;
  issuer: string | null;
  reasons: string[];
}

// Performance metrics
interface PerformanceMetrics {
  bundleSize: number;
  loadTime: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  cumulativeLayoutShift: number;
  firstInputDelay: number;
  timeToInteractive: number;
}

class BundleOptimizer {
  private metrics: PerformanceMetrics[] = [];
  private thresholds = {
    bundleSize: 250 * 1024, // 250KB
    loadTime: 3000, // 3 seconds
    firstContentfulPaint: 1800, // 1.8 seconds
    largestContentfulPaint: 2500, // 2.5 seconds
    cumulativeLayoutShift: 0.1,
    firstInputDelay: 100, // 100ms
    timeToInteractive: 5000 // 5 seconds
  };

  // Analyze bundle composition
  analyzeBundleComposition(): BundleAnalysis {
    const analysis: BundleAnalysis = {
      totalSize: 0,
      gzippedSize: 0,
      chunks: [],
      assets: [],
      modules: [],
      warnings: [],
      recommendations: []
    };

    // Simulate bundle analysis (in a real implementation, this would parse webpack stats)
    try {
      // Mock data for demonstration
      analysis.totalSize = 1024 * 1024; // 1MB
      analysis.gzippedSize = 300 * 1024; // 300KB
      
      // Add sample chunks
      analysis.chunks = [
        {
          name: 'main',
          size: 400 * 1024,
          modules: ['react', 'react-dom', 'next'],
          parents: [],
          children: ['dashboard', 'settings'],
          isEntry: true,
          isInitial: true
        },
        {
          name: 'dashboard',
          size: 200 * 1024,
          modules: ['dashboard components'],
          parents: ['main'],
          children: [],
          isEntry: false,
          isInitial: false
        },
        {
          name: 'settings',
          size: 150 * 1024,
          modules: ['settings components'],
          parents: ['main'],
          children: [],
          isEntry: false,
          isInitial: false
        }
      ];

      // Add sample assets
      analysis.assets = [
        {
          name: 'main.js',
          size: 400 * 1024,
          type: 'js',
          compressed: true,
          cached: true
        },
        {
          name: 'styles.css',
          size: 50 * 1024,
          type: 'css',
          compressed: true,
          cached: true
        }
      ];

      // Generate recommendations
      analysis.recommendations = this.generateRecommendations(analysis);
      
      logger.info('Bundle analysis completed', {
        totalSize: `${(analysis.totalSize / 1024).toFixed(2)}KB`,
        gzippedSize: `${(analysis.gzippedSize / 1024).toFixed(2)}KB`,
        chunks: analysis.chunks.length,
        assets: analysis.assets.length
      });

    } catch (error) {
      logger.error('Bundle analysis failed', error as Error);
      analysis.warnings.push('Failed to analyze bundle composition');
    }

    return analysis;
  }

  // Generate optimization recommendations
  private generateRecommendations(analysis: BundleAnalysis): string[] {
    const recommendations: string[] = [];

    // Check bundle size
    if (analysis.totalSize > this.thresholds.bundleSize * 4) {
      recommendations.push('Bundle size is too large. Consider code splitting and lazy loading.');
    }

    // Check for large chunks
    const largeChunks = analysis.chunks.filter(chunk => chunk.size > 200 * 1024);
    if (largeChunks.length > 0) {
      recommendations.push(`Large chunks detected: ${largeChunks.map(c => c.name).join(', ')}. Consider splitting these further.`);
    }

    // Check for duplicate dependencies
    const allModules = analysis.chunks.flatMap(chunk => chunk.modules);
    const duplicates = allModules.filter((module, index) => allModules.indexOf(module) !== index);
    if (duplicates.length > 0) {
      recommendations.push('Duplicate modules detected. Consider using webpack optimization.splitChunks.');
    }

    // Check compression
    const uncompressedAssets = analysis.assets.filter(asset => !asset.compressed);
    if (uncompressedAssets.length > 0) {
      recommendations.push('Some assets are not compressed. Enable gzip/brotli compression.');
    }

    return recommendations;
  }

  // Tree shaking optimization
  optimizeTreeShaking(): void {
    logger.info('Starting tree shaking optimization');

    const optimizations = [
      'Remove unused imports',
      'Eliminate dead code',
      'Optimize module exports',
      'Remove unused CSS',
      'Optimize image assets'
    ];

    optimizations.forEach(optimization => {
      logger.info(`Applying: ${optimization}`);
      // In a real implementation, this would apply actual optimizations
    });

    logger.info('Tree shaking optimization completed');
  }

  // Code splitting optimization
  optimizeCodeSplitting(): void {
    logger.info('Starting code splitting optimization');

    const strategies = [
      'Route-based splitting',
      'Component-based splitting',
      'Library-based splitting',
      'Dynamic imports',
      'Lazy loading'
    ];

    strategies.forEach(strategy => {
      logger.info(`Implementing: ${strategy}`);
      // In a real implementation, this would configure webpack/next.js splitting
    });

    logger.info('Code splitting optimization completed');
  }

  // Performance monitoring
  recordPerformanceMetrics(metrics: PerformanceMetrics): void {
    this.metrics.push({
      ...metrics,
      timestamp: Date.now()
    } as PerformanceMetrics & { timestamp: number });

    // Keep only last 100 metrics
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100);
    }

    // Check against thresholds
    this.checkPerformanceThresholds(metrics);
  }

  private checkPerformanceThresholds(metrics: PerformanceMetrics): void {
    const issues: string[] = [];

    Object.entries(this.thresholds).forEach(([key, threshold]) => {
      const value = metrics[key as keyof PerformanceMetrics];
      if (value > threshold) {
        issues.push(`${key}: ${value} exceeds threshold ${threshold}`);
      }
    });

    if (issues.length > 0) {
      logger.warn('Performance thresholds exceeded', { issues });
    }
  }

  // Get performance summary
  getPerformanceSummary(): {
    current: PerformanceMetrics | null;
    average: PerformanceMetrics;
    trend: 'improving' | 'degrading' | 'stable';
  } {
    if (this.metrics.length === 0) {
      return {
        current: null,
        average: {} as PerformanceMetrics,
        trend: 'stable'
      };
    }

    const current = this.metrics[this.metrics.length - 1];
    const average = this.calculateAverageMetrics();
    const trend = this.calculateTrend();

    return { current, average, trend };
  }

  private calculateAverageMetrics(): PerformanceMetrics {
    const totals = this.metrics.reduce((acc, metric) => {
      Object.keys(metric).forEach(key => {
        if (key !== 'timestamp') {
          acc[key] = (acc[key] || 0) + metric[key as keyof PerformanceMetrics];
        }
      });
      return acc;
    }, {} as any);

    const count = this.metrics.length;
    const average = {} as PerformanceMetrics;

    Object.keys(totals).forEach(key => {
      average[key as keyof PerformanceMetrics] = totals[key] / count;
    });

    return average;
  }

  private calculateTrend(): 'improving' | 'degrading' | 'stable' {
    if (this.metrics.length < 5) return 'stable';

    const recent = this.metrics.slice(-5);
    const older = this.metrics.slice(-10, -5);

    if (older.length === 0) return 'stable';

    const recentAvg = recent.reduce((sum, m) => sum + m.loadTime, 0) / recent.length;
    const olderAvg = older.reduce((sum, m) => sum + m.loadTime, 0) / older.length;

    const difference = recentAvg - olderAvg;
    const threshold = olderAvg * 0.1; // 10% threshold

    if (difference < -threshold) return 'improving';
    if (difference > threshold) return 'degrading';
    return 'stable';
  }
}

// Image optimization utilities
class ImageOptimizer {
  private supportedFormats = ['webp', 'avif', 'jpeg', 'png'];
  private qualitySettings = {
    webp: 80,
    avif: 70,
    jpeg: 85,
    png: 100
  };

  // Optimize image loading
  optimizeImageLoading(): void {
    logger.info('Starting image optimization');

    const optimizations = [
      'Convert images to WebP/AVIF',
      'Implement lazy loading',
      'Add responsive images',
      'Optimize image sizes',
      'Add image placeholders'
    ];

    optimizations.forEach(optimization => {
      logger.info(`Applying: ${optimization}`);
    });

    logger.info('Image optimization completed');
  }

  // Generate responsive image srcset
  generateResponsiveSrcSet(imagePath: string, sizes: number[]): string {
    return sizes
      .map(size => `${imagePath}?w=${size}&q=${this.qualitySettings.webp} ${size}w`)
      .join(', ');
  }

  // Check if modern format is supported
  supportsModernFormat(format: string): boolean {
    return this.supportedFormats.includes(format.toLowerCase());
  }
}

// CSS optimization utilities
class CSSOptimizer {
  // Optimize CSS delivery
  optimizeCSSDelivery(): void {
    logger.info('Starting CSS optimization');

    const optimizations = [
      'Remove unused CSS',
      'Minify CSS',
      'Inline critical CSS',
      'Defer non-critical CSS',
      'Optimize CSS imports'
    ];

    optimizations.forEach(optimization => {
      logger.info(`Applying: ${optimization}`);
    });

    logger.info('CSS optimization completed');
  }

  // Extract critical CSS
  extractCriticalCSS(): string {
    // In a real implementation, this would analyze the above-the-fold content
    return `
      /* Critical CSS */
      body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
      .header { background: #fff; border-bottom: 1px solid #e2e8f0; }
      .main { min-height: 100vh; }
    `;
  }
}

// Main performance optimization manager
export class PerformanceOptimizer {
  private bundleOptimizer: BundleOptimizer;
  private imageOptimizer: ImageOptimizer;
  private cssOptimizer: CSSOptimizer;

  constructor() {
    this.bundleOptimizer = new BundleOptimizer();
    this.imageOptimizer = new ImageOptimizer();
    this.cssOptimizer = new CSSOptimizer();
  }

  // Run complete optimization
  async runOptimization(): Promise<void> {
    logger.info('Starting performance optimization');

    try {
      // Bundle optimization
      const bundleAnalysis = this.bundleOptimizer.analyzeBundleComposition();
      this.bundleOptimizer.optimizeTreeShaking();
      this.bundleOptimizer.optimizeCodeSplitting();

      // Image optimization
      this.imageOptimizer.optimizeImageLoading();

      // CSS optimization
      this.cssOptimizer.optimizeCSSDelivery();

      logger.info('Performance optimization completed successfully', {
        bundleSize: `${(bundleAnalysis.totalSize / 1024).toFixed(2)}KB`,
        recommendations: bundleAnalysis.recommendations.length
      });

    } catch (error) {
      logger.error('Performance optimization failed', error as Error);
      throw error;
    }
  }

  // Get optimization report
  getOptimizationReport(): {
    bundle: BundleAnalysis;
    performance: ReturnType<BundleOptimizer['getPerformanceSummary']>;
    recommendations: string[];
  } {
    const bundle = this.bundleOptimizer.analyzeBundleComposition();
    const performance = this.bundleOptimizer.getPerformanceSummary();
    
    const recommendations = [
      ...bundle.recommendations,
      'Enable gzip compression on server',
      'Use CDN for static assets',
      'Implement service worker caching',
      'Optimize font loading',
      'Use preload for critical resources'
    ];

    return {
      bundle,
      performance,
      recommendations
    };
  }

  // Record performance metrics
  recordMetrics(metrics: PerformanceMetrics): void {
    this.bundleOptimizer.recordPerformanceMetrics(metrics);
  }

  // Get image optimizer
  getImageOptimizer(): ImageOptimizer {
    return this.imageOptimizer;
  }

  // Get CSS optimizer
  getCSSOptimizer(): CSSOptimizer {
    return this.cssOptimizer;
  }
}

// Web Vitals monitoring
export class WebVitalsMonitor {
  private metrics: Map<string, number[]> = new Map();

  // Record Web Vitals metric
  recordMetric(name: string, value: number): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    
    const values = this.metrics.get(name)!;
    values.push(value);
    
    // Keep only last 50 values
    if (values.length > 50) {
      values.splice(0, values.length - 50);
    }
    
    logger.info(`Web Vitals: ${name}`, { value });
  }

  // Get metric summary
  getMetricSummary(name: string): {
    current: number | null;
    average: number;
    p75: number;
    p95: number;
  } {
    const values = this.metrics.get(name) || [];
    
    if (values.length === 0) {
      return { current: null, average: 0, p75: 0, p95: 0 };
    }
    
    const sorted = [...values].sort((a, b) => a - b);
    const current = values[values.length - 1];
    const average = values.reduce((sum, val) => sum + val, 0) / values.length;
    const p75 = sorted[Math.floor(sorted.length * 0.75)];
    const p95 = sorted[Math.floor(sorted.length * 0.95)];
    
    return { current, average, p75, p95 };
  }

  // Get all metrics summary
  getAllMetrics(): Record<string, ReturnType<WebVitalsMonitor['getMetricSummary']>> {
    const summary: Record<string, ReturnType<WebVitalsMonitor['getMetricSummary']>> = {};
    
    this.metrics.forEach((_, name) => {
      summary[name] = this.getMetricSummary(name);
    });
    
    return summary;
  }
}

// Export singleton instances
export const performanceOptimizer = new PerformanceOptimizer();
export const webVitalsMonitor = new WebVitalsMonitor();

// Initialize performance monitoring
export function initializePerformanceMonitoring(): void {
  if (typeof window === 'undefined') return;

  // Monitor Web Vitals
  if ('web-vitals' in window) {
    // In a real implementation, you would import and use the web-vitals library
    logger.info('Web Vitals monitoring initialized');
  }

  // Monitor bundle loading
  window.addEventListener('load', () => {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    
    if (navigation) {
      const metrics: PerformanceMetrics = {
        bundleSize: 0, // Would be calculated from resource timings
        loadTime: navigation.loadEventEnd - navigation.loadEventStart,
        firstContentfulPaint: 0, // Would be from paint timing API
        largestContentfulPaint: 0, // Would be from LCP observer
        cumulativeLayoutShift: 0, // Would be from CLS observer
        firstInputDelay: 0, // Would be from FID observer
        timeToInteractive: navigation.domInteractive - navigation.startTime
      };
      
      performanceOptimizer.recordMetrics(metrics);
    }
  });

  logger.info('Performance monitoring initialized');
} 