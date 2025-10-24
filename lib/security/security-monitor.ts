// @ts-nocheck
/**
 * Security Monitoring and Logging
 * Detect and log security events
 */

import { NextRequest } from 'next/server';

// Security event types
export enum SecurityEventType {
  AUTHENTICATION_FAILURE = 'auth_failure',
  AUTHORIZATION_FAILURE = 'authz_failure',
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  SUSPICIOUS_REQUEST = 'suspicious_request',
  CSRF_VIOLATION = 'csrf_violation',
  INPUT_VALIDATION_FAILURE = 'input_validation_failure',
  FILE_UPLOAD_VIOLATION = 'file_upload_violation',
  SQL_INJECTION_ATTEMPT = 'sql_injection_attempt',
  XSS_ATTEMPT = 'xss_attempt',
  PATH_TRAVERSAL_ATTEMPT = 'path_traversal_attempt',
  BRUTE_FORCE_ATTEMPT = 'brute_force_attempt',
  ACCOUNT_LOCKOUT = 'account_lockout',
  PRIVILEGE_ESCALATION_ATTEMPT = 'privilege_escalation_attempt',
}

// Security event severity levels
export enum SecuritySeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

// Security event interface
interface SecurityEvent {
  id: string;
  type: SecurityEventType;
  severity: SecuritySeverity;
  timestamp: number;
  ip: string;
  userAgent: string;
  userId?: string;
  endpoint: string;
  method: string;
  details: Record<string, any>;
  blocked: boolean;
}

// Threat detection patterns
const THREAT_PATTERNS = {
  SQL_INJECTION: [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/i,
    /(\b(OR|AND)\s+\d+\s*=\s*\d+)/i,
    /(\'|\"|;|--|\*|\|)/,
    /(\bUNION\b.*\bSELECT\b)/i,
  ],
  XSS: [
    /<script[^>]*>.*?<\/script>/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /<iframe[^>]*>/i,
    /eval\s*\(/i,
    /document\.cookie/i,
  ],
  PATH_TRAVERSAL: [
    /\.\.\//,
    /\.\.\\/,
    /%2e%2e%2f/i,
    /%2e%2e%5c/i,
    /\.\.%2f/i,
    /\.\.%5c/i,
  ],
  COMMAND_INJECTION: [
    /[;&|`$(){}[\]]/,
    /\b(cat|ls|pwd|whoami|id|uname|ps|netstat|ifconfig)\b/i,
  ],
};

// Rate limiting for security events
const eventRateLimit = new Map<string, { count: number; resetTime: number }>();
const EVENT_RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const EVENT_RATE_LIMIT_MAX = 10; // events per window

export class SecurityMonitor {
  private static events: SecurityEvent[] = [];
  private static maxEvents = 1000; // Keep last 1000 events in memory

  /**
   * Log a security event
   */
  static logEvent(
    type: SecurityEventType,
    severity: SecuritySeverity,
    request: NextRequest,
    details: Record<string, any> = {},
    blocked: boolean = false,
    userId?: string
  ): void {
    try {
      const event: SecurityEvent = {
        id: this.generateEventId(),
        type,
        severity,
        timestamp: Date.now(),
        ip: this.extractClientIP(request),
        userAgent: request.headers.get('user-agent') || 'unknown',
        userId,
        endpoint: request.nextUrl.pathname,
        method: request.method,
        details,
        blocked,
      };

      // Add to in-memory store
      this.events.push(event);
      
      // Keep only recent events
      if (this.events.length > this.maxEvents) {
        this.events = this.events.slice(-this.maxEvents);
      }

      // Log to console (in production, send to logging service)
      this.logToConsole(event);

      // Send alerts for critical events
      if (severity === SecuritySeverity.CRITICAL) {
        this.sendAlert(event);
      }

    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }

  /**
   * Analyze request for security threats
   */
  static analyzeRequest(request: NextRequest, body?: any): {
    threats: SecurityEventType[];
    severity: SecuritySeverity;
    shouldBlock: boolean;
  } {
    const threats: SecurityEventType[] = [];
    let maxSeverity = SecuritySeverity.LOW;
    let shouldBlock = false;

    try {
      const url = request.nextUrl.toString();
      const headers = Object.fromEntries(request.headers.entries());
      const queryParams = Object.fromEntries(request.nextUrl.searchParams.entries());

      // Combine all text data for analysis
      const textData = [
        url,
        JSON.stringify(headers),
        JSON.stringify(queryParams),
        body ? JSON.stringify(body) : '',
      ].join(' ');

      // Check for SQL injection
      if (this.detectPattern(textData, THREAT_PATTERNS.SQL_INJECTION)) {
        threats.push(SecurityEventType.SQL_INJECTION_ATTEMPT);
        maxSeverity = SecuritySeverity.HIGH;
        shouldBlock = true;
      }

      // Check for XSS
      if (this.detectPattern(textData, THREAT_PATTERNS.XSS)) {
        threats.push(SecurityEventType.XSS_ATTEMPT);
        maxSeverity = SecuritySeverity.HIGH;
        shouldBlock = true;
      }

      // Check for path traversal
      if (this.detectPattern(textData, THREAT_PATTERNS.PATH_TRAVERSAL)) {
        threats.push(SecurityEventType.PATH_TRAVERSAL_ATTEMPT);
        maxSeverity = SecuritySeverity.MEDIUM;
        shouldBlock = true;
      }

      // Check for command injection
      if (this.detectPattern(textData, THREAT_PATTERNS.COMMAND_INJECTION)) {
        threats.push(SecurityEventType.SUSPICIOUS_REQUEST);
        maxSeverity = SecuritySeverity.HIGH;
        shouldBlock = true;
      }

      // Check for suspicious headers
      if (this.detectSuspiciousHeaders(headers)) {
        threats.push(SecurityEventType.SUSPICIOUS_REQUEST);
        maxSeverity = Math.max(maxSeverity as any, SecuritySeverity.MEDIUM as any) as SecuritySeverity;
      }

      // Check for brute force patterns
      if (this.detectBruteForce(request)) {
        threats.push(SecurityEventType.BRUTE_FORCE_ATTEMPT);
        maxSeverity = SecuritySeverity.HIGH;
        shouldBlock = true;
      }

    } catch (error) {
      console.error('Request analysis failed:', error);
    }

    return { threats, severity: maxSeverity, shouldBlock };
  }

  /**
   * Check if IP should be blocked
   */
  static shouldBlockIP(ip: string): boolean {
    const recentEvents = this.events.filter(
      event => event.ip === ip && 
      event.timestamp > Date.now() - (5 * 60 * 1000) && // Last 5 minutes
      event.severity === SecuritySeverity.CRITICAL
    );

    return recentEvents.length >= 3; // Block after 3 critical events
  }

  /**
   * Get security metrics
   */
  static getSecurityMetrics(timeWindow: number = 60 * 60 * 1000): {
    totalEvents: number;
    eventsByType: Record<string, number>;
    eventsBySeverity: Record<string, number>;
    topIPs: Array<{ ip: string; count: number }>;
    blockedRequests: number;
  } {
    const cutoff = Date.now() - timeWindow;
    const recentEvents = this.events.filter(event => event.timestamp > cutoff);

    const eventsByType: Record<string, number> = {};
    const eventsBySeverity: Record<string, number> = {};
    const ipCounts: Record<string, number> = {};
    let blockedRequests = 0;

    recentEvents.forEach(event => {
      eventsByType[event.type] = (eventsByType[event.type] || 0) + 1;
      eventsBySeverity[event.severity] = (eventsBySeverity[event.severity] || 0) + 1;
      ipCounts[event.ip] = (ipCounts[event.ip] || 0) + 1;
      if (event.blocked) blockedRequests++;
    });

    const topIPs = Object.entries(ipCounts)
      .map(([ip, count]) => ({ ip, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalEvents: recentEvents.length,
      eventsByType,
      eventsBySeverity,
      topIPs,
      blockedRequests,
    };
  }

  // Private helper methods
  private static generateEventId(): string {
    return `sec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private static extractClientIP(request: NextRequest): string {
    return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
           request.headers.get('x-real-ip') ||
           request.headers.get('cf-connecting-ip') ||
           'unknown';
  }

  private static detectPattern(text: string, patterns: RegExp[]): boolean {
    return patterns.some(pattern => pattern.test(text));
  }

  private static detectSuspiciousHeaders(headers: Record<string, string>): boolean {
    const suspiciousHeaders = [
      'x-forwarded-host',
      'x-original-url',
      'x-rewrite-url',
    ];

    return suspiciousHeaders.some(header => 
      headers[header] && headers[header] !== headers['host']
    );
  }

  private static detectBruteForce(request: NextRequest): boolean {
    const ip = this.extractClientIP(request);
    const endpoint = request.nextUrl.pathname;
    
    // Check for rapid requests to auth endpoints
    if (endpoint.includes('/auth') || endpoint.includes('/login')) {
      const recentRequests = this.events.filter(
        event => event.ip === ip && 
        event.endpoint.includes('/auth') &&
        event.timestamp > Date.now() - (60 * 1000) // Last minute
      );
      
      return recentRequests.length > 5; // More than 5 auth requests per minute
    }

    return false;
  }

  private static logToConsole(event: SecurityEvent): void {
    const logLevel = event.severity === SecuritySeverity.CRITICAL ? 'error' :
                    event.severity === SecuritySeverity.HIGH ? 'warn' : 'info';
    
    console[logLevel](`🔒 Security Event [${event.type}]:`, {
      id: event.id,
      severity: event.severity,
      ip: event.ip,
      endpoint: event.endpoint,
      blocked: event.blocked,
      details: event.details,
    });
  }

  private static sendAlert(event: SecurityEvent): void {
    // In production, integrate with alerting service (PagerDuty, Slack, etc.)
    console.error('🚨 CRITICAL SECURITY ALERT:', {
      type: event.type,
      ip: event.ip,
      endpoint: event.endpoint,
      details: event.details,
    });
  }
}

// Middleware helper for automatic threat detection
export async function withSecurityMonitoring(
  request: NextRequest,
  handler: (request: NextRequest) => Promise<Response>,
  userId?: string
): Promise<Response> {
  try {
    // Parse request body for analysis
    let body;
    if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
      try {
        body = await request.clone().json();
      } catch {
        // Body might not be JSON, that's okay
      }
    }

    // Analyze request for threats
    const analysis = SecurityMonitor.analyzeRequest(request, body);

    // Log detected threats
    analysis.threats.forEach(threat => {
      SecurityMonitor.logEvent(
        threat,
        analysis.severity,
        request,
        { analysis },
        analysis.shouldBlock,
        userId
      );
    });

    // Block request if necessary
    if (analysis.shouldBlock || SecurityMonitor.shouldBlockIP(SecurityMonitor.extractClientIP(request))) {
      SecurityMonitor.logEvent(
        SecurityEventType.SUSPICIOUS_REQUEST,
        SecuritySeverity.CRITICAL,
        request,
        { reason: 'Request blocked by security monitor' },
        true,
        userId
      );

      return new Response(
        JSON.stringify({ error: 'Request blocked for security reasons' }),
        { 
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Execute handler
    return await handler(request);

  } catch (error) {
    console.error('Security monitoring failed:', error);
    // Don't block request if monitoring fails
    return await handler(request);
  }
}

// Export for use in other modules
export { SecurityEvent, SecurityEventType, SecuritySeverity };
