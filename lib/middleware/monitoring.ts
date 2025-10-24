// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
// import { performanceMonitor } from '@/lib/monitoring/performance';

export interface MonitoringMiddlewareOptions {
  enablePerformanceTracking?: boolean;
  enableErrorTracking?: boolean;
  enableRequestLogging?: boolean;
  slowRequestThreshold?: number;
  excludePaths?: string[];
}

const defaultOptions: MonitoringMiddlewareOptions = {
  enablePerformanceTracking: true,
  enableErrorTracking: true,
  enableRequestLogging: true,
  slowRequestThreshold: 1000, // 1 second
  excludePaths: ['/api/health', '/api/_next', '/_next'],
};

export function createMonitoringMiddleware(options: MonitoringMiddlewareOptions = {}) {
  const config = { ...defaultOptions, ...options };

  return async function monitoringMiddleware(
    request: NextRequest,
    handler: (request: NextRequest) => Promise<NextResponse>
  ): Promise<NextResponse> {
    const startTime = Date.now();
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // Skip monitoring for excluded paths
    if (config.excludePaths?.some(excludePath => path.startsWith(excludePath))) {
      return handler(request);
    }

    // Generate request ID for tracking
    const requestId = `${method}-${path}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Log request start
    if (config.enableRequestLogging) {
      logger.info('API request started', {
        requestId,
        method,
        path,
        userAgent: request.headers.get('user-agent'),
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        timestamp: new Date().toISOString(),
      });
    }

    let response: NextResponse;
    let error: Error | null = null;

    try {
      // Execute the handler
      response = await handler(request);
    } catch (err) {
      error = err as Error;
      
      // Log error
      if (config.enableErrorTracking) {
        logger.error('API request failed', {
          requestId,
          method,
          path,
          error: error.message,
          stack: error.stack,
          timestamp: new Date().toISOString(),
        });
      }

      // Create error response
      response = NextResponse.json(
        { error: 'Internal server error', requestId },
        { status: 500 }
      );
    }

    const endTime = Date.now();
    const duration = endTime - startTime;
    const statusCode = response.status;

    // Log request completion
    if (config.enableRequestLogging) {
      const logLevel = error ? 'error' : duration > config.slowRequestThreshold! ? 'warn' : 'info';
      logger[logLevel]('API request completed', {
        requestId,
        method,
        path,
        statusCode,
        duration,
        success: !error,
        timestamp: new Date().toISOString(),
      });
    }

    // Record performance metrics
    if (config.enablePerformanceTracking) {
      // performanceMonitor.recordAPIMetrics({
      //   endpoint: path,
      //   method,
      //   responseTime: duration,
      //   statusCode,
      //   timestamp: endTime,
      // });

      // Record custom metric for slow requests
      if (duration > config.slowRequestThreshold!) {
        // performanceMonitor.recordMetric({
        //   name: 'slow_api_request',
        //   value: duration,
        //   unit: 'ms',
        //   timestamp: endTime,
        //   metadata: {
        //     endpoint: path,
        //     method,
        //     statusCode,
        //     requestId,
        //   },
        // });
      }
    }

    // Add monitoring headers to response
    response.headers.set('x-request-id', requestId);
    response.headers.set('x-response-time', `${duration}ms`);
    
    return response;
  };
}

// Helper function to wrap API route handlers
export function withMonitoring<T extends any[]>(
  handler: (...args: T) => Promise<NextResponse>,
  options?: MonitoringMiddlewareOptions
) {
  const middleware = createMonitoringMiddleware(options);
  
  return async function wrappedHandler(request: NextRequest, ...args: any[]): Promise<NextResponse> {
    return middleware(request, async (req) => {
      return handler(req, ...args);
    });
  };
}

// Middleware for measuring database operations
export function measureDatabaseOperation<T>(
  operation: string,
  fn: () => Promise<T>
): Promise<T> {
//   return performanceMonitor.measureAsync(`db_${operation}`, fn);
}

// Middleware for measuring external API calls
export function measureExternalAPI<T>(
  service: string,
  endpoint: string,
  fn: () => Promise<T>
): Promise<T> {
  const startTime = Date.now();
  
  return fn().then(
    (result) => {
      const duration = Date.now() - startTime;

      // performanceMonitor.recordMetric({
      //   name: 'external_api_call',
      //   value: duration,
      //   unit: 'ms',
      //   timestamp: Date.now(),
      //   metadata: {
      //     service,
      //     endpoint,
      //     success: true,
      //   },
      // });
      
      logger.info('External API call completed', {
        service,
        endpoint,
        duration,
        success: true,
      });
      
      return result;
    },
    (error) => {
      const duration = Date.now() - startTime;

      // performanceMonitor.recordMetric({
      //   name: 'external_api_call',
      //   value: duration,
      //   unit: 'ms',
      //   timestamp: Date.now(),
      //   metadata: {
      //     service,
      //     endpoint,
      //     success: false,
      //     error: error.message,
      //   },
      // });
      
      logger.error(
        'External API call failed',
        error instanceof Error ? error : new Error(String(error)),
        {
          service,
          endpoint,
          duration,
        }
      );
      
      throw error;
    }
  );
}

// Middleware for measuring user interactions
export function measureUserInteraction(
  action: string,
  userId?: string,
  metadata?: Record<string, any>
) {
  const startTime = Date.now();
  
  return {
    end: () => {
      const duration = Date.now() - startTime;

      // performanceMonitor.recordMetric({
      //   name: 'user_interaction',
      //   value: duration,
      //   unit: 'ms',
      //   timestamp: Date.now(),
      //   metadata: {
      //     action,
      //     userId,
      //     ...metadata,
      //   },
      // });
      
      logger.info('User interaction measured', {
        action,
        userId,
        duration,
        ...metadata,
      });
    },
  };
}

// React hook for measuring component performance
export function useComponentPerformance(componentName: string) {
  const startTime = Date.now();
  
  return {
    recordRender: () => {
      const duration = Date.now() - startTime;

      // performanceMonitor.recordMetric({
      //   name: 'component_render',
      //   value: duration,
      //   unit: 'ms',
      //   timestamp: Date.now(),
      //   metadata: {
      //     component: componentName,
      //   },
      // });
    },
  };
}

export default createMonitoringMiddleware; 