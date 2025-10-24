
/**
 * Error Handler Utilities
 * Centralized error handling for API routes
 */

import { NextResponse } from 'next/server';
import { createLogger } from '@/lib/logger';

const logger = createLogger('error-handlers');

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
  details?: any;
}

/**
 * Handle Supabase errors with proper logging and fallback
 */
export function handleSupabaseError(
  error: any,
  operation: string,
  fallbackMessage: string = 'Database operation failed'
): NextResponse {
  const errorMessage = error?.message || error?.toString() || fallbackMessage;
  const errorCode = error?.code;

  logger.error(`Supabase ${operation} failed`, error as Error, { operation, errorCode });

  // Handle specific error codes
  if (errorCode === '23503') {
    return NextResponse.json(
      { error: 'Referenced record not found', details: errorMessage },
      { status: 404 }
    );
  }

  if (errorCode === '23505') {
    return NextResponse.json(
      { error: 'Record already exists', details: errorMessage },
      { status: 409 }
    );
  }

  if (errorCode === '42501' || errorMessage.toLowerCase().includes('row-level security')) {
    return NextResponse.json(
      { error: 'Access denied', details: 'Insufficient permissions' },
      { status: 403 }
    );
  }

  return NextResponse.json(
    { error: fallbackMessage, details: errorMessage },
    { status: 500 }
  );
}

/**
 * Handle file storage errors
 */
export function handleFileError(
  error: any,
  operation: string
): NextResponse {
  logger.error(`File ${operation} failed`, error as Error, { operation });
  
  return NextResponse.json(
    { error: `File storage error: ${operation}`, details: error?.message || 'Unknown error' },
    { status: 500 }
  );
}

/**
 * Handle validation errors
 */
export function handleValidationError(
  message: string,
  details?: any
): NextResponse {
  logger.warn('Validation error', { message, details });
  
  return NextResponse.json(
    { error: 'Validation failed', message, details },
    { status: 400 }
  );
}

/**
 * Generic error handler
 */
export function handleGenericError(
  error: any,
  context: string
): NextResponse {
  logger.error(`Unexpected error in ${context}`, error as Error, { context });
  
  return NextResponse.json(
    { error: 'Internal server error', details: error?.message || 'Unknown error' },
    { status: 500 }
  );
}

/**
 * Retry operation with exponential backoff
 */
export async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 100
): Promise<T> {
  let lastError: any;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      const delay = initialDelay * Math.pow(2, attempt);
      logger.warn(`Operation failed, retrying in ${delay}ms`, { attempt, maxRetries });
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

/**
 * Handle API errors with logging and proper response
 */
export function handleApiError(error: any, endpoint: string): NextResponse {
  logger.error(`API error in ${endpoint}`, error as Error, { endpoint });
  
  return NextResponse.json(
    { error: 'Internal server error', details: error?.message || 'Unknown error' },
    { status: 500 }
  );
}
