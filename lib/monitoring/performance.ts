import { logger } from '@/lib/logger';

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: 'ms' | 'bytes' | 'count' | 'percentage';
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface PageLoadMetrics {
  navigationStart: number;
  domContentLoaded: number;
  loadComplete: number;
  firstPaint: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  cumulativeLayoutShift: number;
  firstInputDelay: number;
  timeToInteractive: number;
}

export interface APIPerformanceMetrics {
  endpoint: string;
  method: string;
  responseTime: number;
  statusCode: number;
  requestSize?: number;
  responseSize?: number;
  timestamp: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private apiMetrics: APIPerformanceMetrics[] = [];
  private observers: Map<string, PerformanceObserver> = new Map();

  constructor() {
    this.initializePerformanceObservers();
  }

  private initializePerformanceObservers() {
    if (typeof window === 'undefined') return;

    // Web Vitals Observer
    this.observeWebVitals();
    
    // Navigation Observer
    this.observeNavigation();
    
    // Resource Observer
    this.observeResources();
    
    // Long Task Observer
    this.observeLongTasks();
  }

  private observeWebVitals() {
    try {
      // Largest Contentful Paint
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.recordMetric({
          name: 'largest_contentful_paint',
          value: lastEntry.startTime,
          unit: 'ms',
          timestamp: Date.now(),
          metadata: {
            element: (lastEntry as any).element?.tagName,
            url: (lastEntry as any).url,
          },
        });
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.set('lcp', lcpObserver);

      // First Input Delay
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          const entryWithProcessing = entry as any;
          this.recordMetric({
            name: 'first_input_delay',
            value: (entryWithProcessing.processingStart || entry.startTime) - entry.startTime,
            unit: 'ms',
            timestamp: Date.now(),
            metadata: {
              eventType: entry.name,
            },
          });
        });
      });
      fidObserver.observe({ entryTypes: ['first-input'] });
      this.observers.set('fid', fidObserver);

      // Cumulative Layout Shift
      const clsObserver = new PerformanceObserver((list) => {
        let clsValue = 0;
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
          }
        });
        this.recordMetric({
          name: 'cumulative_layout_shift',
          value: clsValue,
          unit: 'count',
          timestamp: Date.now(),
        });
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
      this.observers.set('cls', clsObserver);

    } catch (error) {
      logger.warn('Failed to initialize Web Vitals observers:', error);
    }
  }

  private observeNavigation() {
    try {
      const navigationObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          const navEntry = entry as PerformanceNavigationTiming;
          this.recordPageLoadMetrics({
            navigationStart: navEntry.startTime,
            domContentLoaded: navEntry.domContentLoadedEventEnd - navEntry.startTime,
            loadComplete: navEntry.loadEventEnd - navEntry.startTime,
            firstPaint: 0, // Will be set by paint observer
            firstContentfulPaint: 0, // Will be set by paint observer
            largestContentfulPaint: 0, // Will be set by LCP observer
            cumulativeLayoutShift: 0, // Will be set by CLS observer
            firstInputDelay: 0, // Will be set by FID observer
            timeToInteractive: this.calculateTimeToInteractive(navEntry),
          });
        });
      });
      navigationObserver.observe({ entryTypes: ['navigation'] });
      this.observers.set('navigation', navigationObserver);
    } catch (error) {
      logger.warn('Failed to initialize navigation observer:', error);
    }
  }

  private observeResources() {
    try {
      const resourceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          const resourceEntry = entry as PerformanceResourceTiming;
          this.recordMetric({
            name: 'resource_load_time',
            value: resourceEntry.responseEnd - resourceEntry.startTime,
            unit: 'ms',
            timestamp: Date.now(),
            metadata: {
              name: resourceEntry.name,
              type: resourceEntry.initiatorType,
              size: resourceEntry.transferSize,
              cached: resourceEntry.transferSize === 0,
            },
          });
        });
      });
      resourceObserver.observe({ entryTypes: ['resource'] });
      this.observers.set('resource', resourceObserver);
    } catch (error) {
      logger.warn('Failed to initialize resource observer:', error);
    }
  }

  private observeLongTasks() {
    try {
      const longTaskObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          this.recordMetric({
            name: 'long_task',
            value: entry.duration,
            unit: 'ms',
            timestamp: Date.now(),
            metadata: {
              startTime: entry.startTime,
              attribution: (entry as any).attribution,
            },
          });
        });
      });
      longTaskObserver.observe({ entryTypes: ['longtask'] });
      this.observers.set('longtask', longTaskObserver);
    } catch (error) {
      logger.warn('Failed to initialize long task observer:', error);
    }
  }

  private calculateTimeToInteractive(navEntry: PerformanceNavigationTiming): number {
    // Simplified TTI calculation
    // In a real implementation, you'd need more sophisticated logic
    return navEntry.domContentLoadedEventEnd - navEntry.startTime;
  }

  public recordMetric(metric: PerformanceMetric) {
    this.metrics.push(metric);
    
    // Log significant performance issues
    if (metric.name === 'largest_contentful_paint' && metric.value > 2500) {
      logger.warn('Poor LCP performance detected:', metric);
    }
    
    if (metric.name === 'first_input_delay' && metric.value > 100) {
      logger.warn('Poor FID performance detected:', metric);
    }
    
    if (metric.name === 'cumulative_layout_shift' && metric.value > 0.1) {
      logger.warn('Poor CLS performance detected:', metric);
    }
    
    if (metric.name === 'long_task' && metric.value > 50) {
      logger.warn('Long task detected:', metric);
    }
  }

  public recordPageLoadMetrics(metrics: PageLoadMetrics) {
    Object.entries(metrics).forEach(([key, value]) => {
      if (value > 0) {
        this.recordMetric({
          name: key,
          value,
          unit: 'ms',
          timestamp: Date.now(),
        });
      }
    });
  }

  public recordAPIMetrics(metrics: APIPerformanceMetrics) {
    this.apiMetrics.push(metrics);
    
    // Log slow API calls
    if (metrics.responseTime > 1000) {
      logger.warn('Slow API call detected:', metrics);
    }
    
    // Log API errors
    if (metrics.statusCode >= 400) {
      logger.error('API error detected:', new Error(`API error: ${metrics.statusCode}`), metrics);
    }
  }

  public startTimer(name: string): () => void {
    const startTime = performance.now();
    return () => {
      const endTime = performance.now();
      this.recordMetric({
        name,
        value: endTime - startTime,
        unit: 'ms',
        timestamp: Date.now(),
      });
    };
  }

  public measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const startTime = performance.now();
    return fn().finally(() => {
      const endTime = performance.now();
      this.recordMetric({
        name,
        value: endTime - startTime,
        unit: 'ms',
        timestamp: Date.now(),
      });
    });
  }

  public getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  public getAPIMetrics(): APIPerformanceMetrics[] {
    return [...this.apiMetrics];
  }

  public getMetricsSummary() {
    const summary: Record<string, { count: number; avg: number; min: number; max: number }> = {};
    
    this.metrics.forEach((metric) => {
      if (!summary[metric.name]) {
        summary[metric.name] = { count: 0, avg: 0, min: Infinity, max: -Infinity };
      }
      
      const s = summary[metric.name];
      s.count++;
      s.min = Math.min(s.min, metric.value);
      s.max = Math.max(s.max, metric.value);
      s.avg = (s.avg * (s.count - 1) + metric.value) / s.count;
    });
    
    return summary;
  }

  public clearMetrics() {
    this.metrics = [];
    this.apiMetrics = [];
  }

  public destroy() {
    this.observers.forEach((observer) => {
      observer.disconnect();
    });
    this.observers.clear();
  }
}

// Global performance monitor instance
// export const performanceMonitor = new PerformanceMonitor();

// Utility functions for common performance measurements
export const measurePageLoad = () => {
  if (typeof window === 'undefined') return;
  
  window.addEventListener('load', () => {
    setTimeout(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigation) {
        // performanceMonitor.recordPageLoadMetrics({
        //   navigationStart: navigation.navigationStart,
        //   domContentLoaded: navigation.domContentLoadedEventEnd - navigation.navigationStart,
        //   loadComplete: navigation.loadEventEnd - navigation.navigationStart,
        //   firstPaint: 0,
        //   firstContentfulPaint: 0,
        //   largestContentfulPaint: 0,
        //   cumulativeLayoutShift: 0,
        //   firstInputDelay: 0,
        //   timeToInteractive: navigation.domContentLoadedEventEnd - navigation.navigationStart,
        // });
      }
    }, 0);
  });
};

export const measureAPICall = async (
  endpoint: string,
  method: string,
  requestFn: () => Promise<Response>
): Promise<Response> => {
  const startTime = performance.now();
  
  try {
    const response = await requestFn();
    const endTime = performance.now();

    // performanceMonitor.recordAPIMetrics({
    //   endpoint,
    //   method,
    //   responseTime: endTime - startTime,
    //   statusCode: response.status,
    //   timestamp: Date.now(),
    // });

    return response;
  } catch (error) {
    const endTime = performance.now();

    // performanceMonitor.recordAPIMetrics({
    //   endpoint,
    //   method,
    //   responseTime: endTime - startTime,
    //   statusCode: 0, // Network error
    //   timestamp: Date.now(),
    // });
    
    throw error;
  }
};

export const measureUserInteraction = (action: string) => {
//   return performanceMonitor.startTimer(`user_interaction_${action}`);
};

// React hook for performance monitoring
export const usePerformanceMonitor = () => {
  return {
//     recordMetric: performanceMonitor.recordMetric.bind(performanceMonitor),
//     startTimer: performanceMonitor.startTimer.bind(performanceMonitor),
//     measureAsync: performanceMonitor.measureAsync.bind(performanceMonitor),
//     getMetrics: performanceMonitor.getMetrics.bind(performanceMonitor),
//     getMetricsSummary: performanceMonitor.getMetricsSummary.bind(performanceMonitor),
  };
};

// export default performanceMonitor; 