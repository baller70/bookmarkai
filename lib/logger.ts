// Logger service with Sentry removed
// Using console logging instead

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';
export type LogContext = Record<string, any>;

export interface PerformanceMetrics {
  duration: number;
  memory?: number;
  cpu?: number;
}

export interface SecurityEventContext extends LogContext {
  ip?: string;
  userId?: string;
  action?: string;
}

export class Logger {
  private component: string;
  private context: LogContext;

  constructor(component: string, context: LogContext = {}) {
    this.component = component;
    this.context = context;
  }

  // Standard log method
  private log(level: LogLevel, message: string, context: LogContext = {}): void {
    const timestamp = new Date().toISOString();
    const logData = {
      timestamp,
      level,
      component: this.component,
      message,
      ...this.context,
      ...context
    };

    // Use appropriate console method
    switch (level) {
      case 'debug':
        console.debug(logData);
        break;
      case 'info':
        console.log(logData);
        break;
      case 'warn':
        console.warn(logData);
        break;
      case 'error':
      case 'fatal':
        console.error(logData);
        break;
      default:
        console.log(logData);
    }
  }

  // Convenience methods
  debug(message: string, context: LogContext = {}): void {
    this.log('debug', message, context);
  }

  info(message: string, context: LogContext = {}): void {
    this.log('info', message, context);
  }

  warn(message: string, context: LogContext = {}): void {
    this.log('warn', message, context);
  }

  error(message: string, error?: Error, context: LogContext = {}): void {
    this.log('error', message, { ...context, error: error?.stack });
    if (error) {
      console.error(error);
    }
  }

  fatal(message: string, error?: Error, context: LogContext = {}): void {
    this.log('fatal', message, { ...context, error: error?.stack });
    if (error) {
      console.error(error);
    }
  }

  performance(message: string, metrics: PerformanceMetrics, context: LogContext = {}): void {
    this.log('info', message, { ...context, metrics });
  }

  business(event: string, data: Record<string, any>): void {
    this.log('info', `Business event: ${event}`, data);
  }

  security(event: string, severity: 'low' | 'medium' | 'high' | 'critical', context: SecurityEventContext = {}): void {
    const level: LogLevel = severity === 'critical' ? 'fatal' : severity === 'high' ? 'error' : 'warn';
    this.log(level, `Security event: ${event}`, { severity, ...context });
  }
}

// Create a default logger
export const logger = new Logger('app');
export const appLogger = logger; // Alias for backwards compatibility

// Export a function to create custom loggers
export function createLogger(component: string, context: LogContext = {}): Logger {
  return new Logger(component, context);
}

// API logger alias
export const apiLogger = createLogger('api');

// Export helper functions for backwards compatibility
export function createPerformanceTimer() {
  const start = Date.now();
  return {
    end: () => Date.now() - start
  };
}

export interface RequestContext {
  requestId: string;
  userId?: string;
  path: string;
  method: string;
  ip?: string;
}
