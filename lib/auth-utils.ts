
// Authentication utility functions for NextAuth migration
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { NextResponse } from 'next/server';

export interface AuthenticatedUser {
  success: boolean;
  userId?: string;
  user?: {
    id: string;
    email: string;
    name?: string;
  };
  status?: number;
  error?: string;
}

/**
 * Authenticate user from request
 * Returns user information if authenticated, error response otherwise
 */
export async function authenticateUser(req?: Request): Promise<AuthenticatedUser> {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return {
        success: false,
        status: 401,
        error: 'Not authenticated'
      };
    }
    
    return {
      success: true,
      userId: session.user.id,
      user: {
        id: session.user.id!,
        email: session.user.email!,
        name: session.user.name || undefined
      }
    };
  } catch (error) {
    console.error('Authentication error:', error);
    return {
      success: false,
      status: 500,
      error: 'Authentication failed'
    };
  }
}

/**
 * Create an unauthorized response
 */
export function createUnauthorizedResponse(message = 'Unauthorized') {
  return NextResponse.json(
    { error: message },
    { status: 401 }
  );
}

/**
 * Get current user from session
 */
export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  return session?.user || null;
}

/**
 * Require authentication - throws if not authenticated
 */
export async function requireAuth() {
  const auth = await authenticateUser();
  if (!auth.success) {
    throw new Error(auth.error || 'Unauthorized');
  }
  return auth;
}
