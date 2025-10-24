/**
 * CSRF Protection Implementation
 * Secure token generation and validation
 */

import { NextRequest, NextResponse } from 'next/server';
import { createHash, randomBytes } from 'crypto';
import { getSecureConfig } from '@/lib/config/secure-env';

// CSRF token configuration
const CSRF_TOKEN_LENGTH = 32;
const CSRF_TOKEN_EXPIRY = 60 * 60 * 1000; // 1 hour
const CSRF_HEADER_NAME = 'x-csrf-token';
const CSRF_COOKIE_NAME = '__csrf-token';

// In-memory token store (use Redis in production)
const tokenStore = new Map<string, { token: string; expires: number; userId?: string }>();

// Clean up expired tokens periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of tokenStore.entries()) {
    if (value.expires < now) {
      tokenStore.delete(key);
    }
  }
}, 5 * 60 * 1000); // Clean up every 5 minutes

export class CSRFProtection {
  /**
   * Generate a secure CSRF token
   */
  static generateToken(userId?: string): string {
    const randomToken = randomBytes(CSRF_TOKEN_LENGTH).toString('hex');
    const timestamp = Date.now().toString();
    const config = getSecureConfig();
    
    // Create a hash that includes the token, timestamp, and secret
    const hash = createHash('sha256')
      .update(randomToken)
      .update(timestamp)
      .update(config.auth.secret)
      .digest('hex');
    
    const token = `${randomToken}.${timestamp}.${hash}`;
    
    // Store token with expiry
    tokenStore.set(token, {
      token,
      expires: Date.now() + CSRF_TOKEN_EXPIRY,
      userId
    });
    
    return token;
  }

  /**
   * Validate CSRF token
   */
  static validateToken(token: string, userId?: string): boolean {
    if (!token) return false;
    
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return false;
      
      const [randomToken, timestamp, hash] = parts;
      const config = getSecureConfig();
      
      // Verify hash
      const expectedHash = createHash('sha256')
        .update(randomToken)
        .update(timestamp)
        .update(config.auth.secret)
        .digest('hex');
      
      if (hash !== expectedHash) return false;
      
      // Check if token exists in store
      const storedToken = tokenStore.get(token);
      if (!storedToken) return false;
      
      // Check expiry
      if (storedToken.expires < Date.now()) {
        tokenStore.delete(token);
        return false;
      }
      
      // Check user association if provided
      if (userId && storedToken.userId && storedToken.userId !== userId) {
        return false;
      }
      
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Generate CSRF token for response
   */
  static generateTokenResponse(userId?: string): {
    token: string;
    cookie: string;
  } {
    const token = this.generateToken(userId);
    
    const cookie = `${CSRF_COOKIE_NAME}=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${CSRF_TOKEN_EXPIRY / 1000}`;
    
    return { token, cookie };
  }

  /**
   * Extract CSRF token from request
   */
  static extractToken(request: NextRequest): string | null {
    // Try header first
    const headerToken = request.headers.get(CSRF_HEADER_NAME);
    if (headerToken) return headerToken;
    
    // Try cookie as fallback
    const cookieHeader = request.headers.get('cookie');
    if (cookieHeader) {
      const cookies = cookieHeader.split(';').map(c => c.trim());
      for (const cookie of cookies) {
        if (cookie.startsWith(`${CSRF_COOKIE_NAME}=`)) {
          return cookie.split('=')[1];
        }
      }
    }
    
    return null;
  }

  /**
   * Middleware to validate CSRF tokens
   */
  static async validateRequest(
    request: NextRequest,
    userId?: string
  ): Promise<{ valid: boolean; error?: string }> {
    // Only validate state-changing methods
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
      return { valid: true };
    }

    // Skip CSRF for API routes that use other authentication methods
    const pathname = request.nextUrl.pathname;
    if (pathname.startsWith('/api/auth/')) {
      return { valid: true };
    }

    const token = this.extractToken(request);
    if (!token) {
      return { valid: false, error: 'CSRF token missing' };
    }

    const isValid = this.validateToken(token, userId);
    if (!isValid) {
      return { valid: false, error: 'Invalid CSRF token' };
    }

    return { valid: true };
  }

  /**
   * Add CSRF token to response headers
   */
  static addTokenToResponse(response: NextResponse, userId?: string): NextResponse {
    const { token, cookie } = this.generateTokenResponse(userId);
    
    response.headers.set('X-CSRF-Token', token);
    response.headers.set('Set-Cookie', cookie);
    
    return response;
  }
}

// Middleware helper for easy integration
export async function withCSRFProtection(
  request: NextRequest,
  handler: (request: NextRequest) => Promise<NextResponse>,
  userId?: string
): Promise<NextResponse> {
  // Validate CSRF token
  const validation = await CSRFProtection.validateRequest(request, userId);
  
  if (!validation.valid) {
    return NextResponse.json(
      { error: validation.error || 'CSRF validation failed' },
      { status: 403 }
    );
  }

  // Execute the handler
  const response = await handler(request);
  
  // Add new CSRF token to response for next request
  return CSRFProtection.addTokenToResponse(response, userId);
}

// React hook for client-side CSRF token management
export const csrfTokenUtils = {
  /**
   * Get CSRF token from cookie or meta tag
   */
  getToken(): string | null {
    // Try cookie first
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === CSRF_COOKIE_NAME) {
        return value;
      }
    }
    
    // Try meta tag as fallback
    const metaTag = document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement;
    return metaTag?.content || null;
  },

  /**
   * Add CSRF token to fetch request headers
   */
  addTokenToHeaders(headers: HeadersInit = {}): HeadersInit {
    const token = this.getToken();
    if (token) {
      return {
        ...headers,
        [CSRF_HEADER_NAME]: token,
      };
    }
    return headers;
  },

  /**
   * Create fetch wrapper with automatic CSRF token inclusion
   */
  createSecureFetch() {
    return async (url: string, options: RequestInit = {}) => {
      const secureOptions = {
        ...options,
        headers: this.addTokenToHeaders(options.headers),
      };
      
      return fetch(url, secureOptions);
    };
  },
};

// Export constants for use in other modules
export { CSRF_HEADER_NAME, CSRF_COOKIE_NAME };
