
import { NextRequest, NextResponse } from 'next/server';
import { apiLogger, createPerformanceTimer, type LogContext } from '../logger';

// Helper to generate request IDs
const generateRequestId = () => {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};

// Request logging middleware
export function withLogging<T extends (...args: any[]) => any>(
  handler: T,
  options: {
    component?: string;
    logBody?: boolean;
    logHeaders?: boolean;
    logResponse?: boolean;
  } = {}
): T {
  return (async (...args: Parameters<T>) => {
    const [request] = args;
    const timer = createPerformanceTimer();
    const requestId = generateRequestId();
    
    // Extract request information
    const method = request.method || 'UNKNOWN';
    const url = request.url || 'UNKNOWN';
    const userAgent = request.headers?.get('user-agent') || 'unknown';
    const ip = request.headers?.get('x-forwarded-for') || 
               request.headers?.get('x-real-ip') || 
               'unknown';
    
    // Create request context
    const requestContext: LogContext = {
      requestId,
      component: options.component || 'api',
      metadata: {
        method,
        url,
        userAgent,
        ip,
      },
    };
    
    // Log request body if enabled
    if (options.logBody && request.body) {
      try {
        const bodyClone = request.clone();
        const body = await bodyClone.json();
        requestContext.metadata!.requestBody = body;
      } catch (error) {
        // Ignore body parsing errors
      }
    }
    
    // Log request headers if enabled
    if (options.logHeaders) {
      const headers: Record<string, string> = {};
      request.headers?.forEach((value, key) => {
        headers[key] = value;
      });
      requestContext.metadata!.requestHeaders = headers;
    }
    
    apiLogger.info(`${method} ${url}`, requestContext);
    
    try {
      // Execute handler
      const response = await handler(...args);
      
      // Measure response time
      const metrics = timer.end();
      
      // Extract response information
      const statusCode = response?.status || 200;
      const responseContext: LogContext = {
        ...requestContext,
        metadata: {
          ...requestContext.metadata,
          statusCode,
          duration: metrics,
        },
      };
      
      // Log response body if enabled
      if (options.logResponse && response?.body) {
        try {
          const responseClone = response.clone();
          const responseText = await responseClone.text();
          if (responseText && responseText.length < 1000) {
            responseContext.metadata!.responseBody = responseText;
          }
        } catch (error) {
          // Ignore response parsing errors
        }
      }
      
      apiLogger.info(`${method} ${url} - ${statusCode} (${metrics}ms)`, responseContext);
      
      // Log performance metrics
      if (metrics > 1000) { // Log slow requests
        apiLogger.warn(`Slow request: ${method} ${url} - ${metrics}ms`, responseContext);
      }
      
      return response;
      
    } catch (error) {
      // Measure error response time
      const metrics = timer.end();
      
      apiLogger.error(`${method} ${url} failed`, error as Error, {
        ...requestContext,
        metadata: {
          ...requestContext.metadata,
          duration: metrics,
        },
      });
      
      throw error;
    } finally {
      // Request context cleanup removed
    }
  }) as T;
}

// User action logging middleware
export function withUserActionLogging<T extends (...args: any[]) => any>(
  handler: T,
  actionName: string
): T {
  return (async (...args: Parameters<T>) => {
    const [request] = args;
    
    try {
      // Extract user information from request
      const userId = request.headers?.get('x-user-id') || 'anonymous';
      const sessionId = request.headers?.get('x-session-id') || 'unknown';
      
      // Log user action
      console.log(`User action: ${actionName}`, {
        userId,
        sessionId,
        timestamp: new Date().toISOString(),
      });
      
      return await handler(...args);
      
    } catch (error) {
      // Log failed user action
      apiLogger.error(`User action failed: ${actionName}`, error as Error, {
        metadata: {
          method: request.method,
          url: request.url,
        },
      });
      
      throw error;
    }
  }) as T;
}

// Security event logging middleware
export function withSecurityLogging<T extends (...args: any[]) => any>(
  handler: T,
  eventType: string
): T {
  return (async (...args: Parameters<T>) => {
    const [request] = args;
    const requestId = generateRequestId();
    
    // Extract security-relevant information
    const ip = request.headers?.get('x-forwarded-for') || 
               request.headers?.get('x-real-ip') || 
               'unknown';
    const userAgent = request.headers?.get('user-agent') || 'unknown';
    const userId = request.headers?.get('x-user-id') || 'anonymous';
    
    const context: LogContext = {
      requestId,
      component: 'security',
      metadata: {
        eventType,
        ip,
        userAgent,
        userId,
        timestamp: new Date().toISOString(),
      },
    };
    
    apiLogger.security(eventType, 'medium', context);
    
    try {
      return await handler(...args);
    } catch (error) {
      apiLogger.error(`Security event failed: ${eventType}`, error as Error, context);
      throw error;
    }
  }) as T;
}

// Performance monitoring middleware
export function withPerformanceMonitoring<T extends (...args: any[]) => any>(
  handler: T,
  operationName: string
): T {
  return (async (...args: Parameters<T>) => {
    const timer = createPerformanceTimer();
    
    try {
      const result = await handler(...args);
      const duration = timer.end();
      
      apiLogger.performance(operationName, { duration }, {
        component: 'performance',
        requestId: generateRequestId(),
      });
      
      return result;
    } catch (error) {
      const duration = timer.end();
      
      apiLogger.error(`Performance monitoring failed: ${operationName}`, error as Error, {
        component: 'performance',
        requestId: generateRequestId(),
        metadata: { duration },
      });
      
      throw error;
    }
  }) as T;
}

// Database query logging utility
export function logDatabaseQuery(
  query: string,
  duration: number,
  rowCount: number,
  context?: Partial<LogContext>
) {
  console.log(`DB Query: ${query.substring(0, 100)}... (${duration}ms, ${rowCount} rows)`, context);
}

// Business event logging utility
export function logBusinessEvent(
  event: string,
  data: Record<string, any>,
  context?: Partial<LogContext>
) {
  console.log(`Business Event: ${event}`, { ...data, ...context });
}
