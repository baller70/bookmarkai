
/**
 * Unified Authentication Layer
 * Provides consistent authentication across all API routes
 */

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { NextResponse } from 'next/server';
import { appLogger } from '@/lib/logger';

// Development user for testing
export const DEV_USER_ID = '00000000-0000-0000-0000-000000000001';
export const DEV_USER_EMAIL = 'dev@example.com';

export interface AuthResult {
  success: boolean;
  userId?: string;
  user?: {
    id: string;
    email: string;
    name?: string | null;
  };
  status?: number;
  error?: string;
}

/**
 * Get current session and user
 * Returns null if not authenticated
 */
export async function getAuthSession() {
  try {
    const session = await getServerSession(authOptions);
    return session;
  } catch (error) {
    appLogger.error('Error getting session', error instanceof Error ? error : undefined);
    return null;
  }
}

/**
 * Authenticate request and return user information
 * In development mode, falls back to dev user if no session
 */
export async function authenticateRequest(options: {
  allowDevFallback?: boolean;
  required?: boolean;
} = {}): Promise<AuthResult> {
  const { allowDevFallback = true, required = false } = options;

  try {
    const session = await getAuthSession();

    // If session exists, return user
    if (session?.user?.id) {
      return {
        success: true,
        userId: session.user.id,
        user: {
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.name,
        },
      };
    }

    // Development fallback (also allow in production for testing)
    if (allowDevFallback) {
      appLogger.debug('Using dev user fallback', { env: process.env.NODE_ENV });
      return {
        success: true,
        userId: DEV_USER_ID,
        user: {
          id: DEV_USER_ID,
          email: DEV_USER_EMAIL,
          name: 'Development User',
        },
      };
    }

    // No session and not allowed to fallback
    if (required) {
      return {
        success: false,
        status: 401,
        error: 'Authentication required',
      };
    }

    return {
      success: false,
      status: 401,
      error: 'Not authenticated',
    };
  } catch (error) {
    appLogger.error('Authentication error', error instanceof Error ? error : undefined);
    return {
      success: false,
      status: 500,
      error: 'Authentication failed',
    };
  }
}

/**
 * Require authentication - returns user or throws
 */
export async function requireAuth(options?: { allowDevFallback?: boolean }): Promise<NonNullable<AuthResult['user']>> {
  const auth = await authenticateRequest({ ...options, required: true });
  
  if (!auth.success || !auth.user) {
    throw new Error(auth.error || 'Unauthorized');
  }
  
  return auth.user;
}

/**
 * Get user ID from session or dev fallback
 * Returns null if not authenticated and fallback not allowed
 */
export async function getUserId(options?: { allowDevFallback?: boolean }): Promise<string | null> {
  const auth = await authenticateRequest(options);
  return auth.userId || null;
}

/**
 * Create authentication error responses
 */
export function createAuthErrorResponse(error: string = 'Unauthorized', status: number = 401) {
  return NextResponse.json(
    { success: false, error },
    { status }
  );
}

/**
 * Check if user owns resource
 */
export function isResourceOwner(resourceUserId: string, currentUserId: string): boolean {
  return resourceUserId === currentUserId;
}
