
/**
 * Standardized API Response Utilities
 * Provides consistent response formats across all API routes
 */

import { NextResponse } from 'next/server';
import { appLogger } from '@/lib/logger';

export interface ApiSuccessResponse<T = any> {
  success: true;
  data: T;
  message?: string;
  meta?: Record<string, any>;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  details?: any;
  code?: string;
}

export type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * Create a success response
 */
export function createSuccessResponse<T>(
  data: T,
  options?: {
    message?: string;
    meta?: Record<string, any>;
    status?: number;
  }
): NextResponse<ApiSuccessResponse<T>> {
  const { message, meta, status = 200 } = options || {};
  
  return NextResponse.json(
    {
      success: true,
      data,
      ...(message && { message }),
      ...(meta && { meta }),
    },
    { status }
  );
}

/**
 * Create an error response
 */
export function createErrorResponse(
  error: string | Error,
  options?: {
    status?: number;
    details?: any;
    code?: string;
    logError?: boolean;
  }
): NextResponse<ApiErrorResponse> {
  const { status = 500, details, code, logError = true } = options || {};
  
  const errorMessage = error instanceof Error ? error.message : error;
  
  if (logError) {
    appLogger.error(
      'API Error',
      error instanceof Error ? error : undefined,
      { status, code, details }
    );
  }
  
  return NextResponse.json(
    {
      success: false,
      error: errorMessage,
      ...(details && { details }),
      ...(code && { code }),
    },
    { status }
  );
}

/**
 * Create validation error response
 */
export function createValidationError(
  message: string,
  details?: Record<string, any>
): NextResponse<ApiErrorResponse> {
  return createErrorResponse(message, {
    status: 400,
    code: 'VALIDATION_ERROR',
    details,
    logError: false, // Don't log validation errors as they're client errors
  });
}

/**
 * Create not found error response
 */
export function createNotFoundError(
  resource: string
): NextResponse<ApiErrorResponse> {
  return createErrorResponse(`${resource} not found`, {
    status: 404,
    code: 'NOT_FOUND',
    logError: false,
  });
}

/**
 * Create unauthorized error response
 */
export function createUnauthorizedError(
  message: string = 'Unauthorized'
): NextResponse<ApiErrorResponse> {
  return createErrorResponse(message, {
    status: 401,
    code: 'UNAUTHORIZED',
    logError: false,
  });
}

/**
 * Create forbidden error response
 */
export function createForbiddenError(
  message: string = 'Forbidden'
): NextResponse<ApiErrorResponse> {
  return createErrorResponse(message, {
    status: 403,
    code: 'FORBIDDEN',
    logError: false,
  });
}

/**
 * Wrap async API handler with error handling
 */
export function withErrorHandling<T = any>(
  handler: () => Promise<NextResponse<T>>
): Promise<NextResponse<T | ApiErrorResponse>> {
  return handler().catch((error) => {
    appLogger.error(
      'Unhandled API error',
      error instanceof Error ? error : undefined
    );
    return createErrorResponse(
      error instanceof Error ? error.message : 'Internal server error',
      { status: 500 }
    ) as NextResponse<ApiErrorResponse>;
  });
}

/**
 * Parse and validate request body
 */
export async function parseRequestBody<T = any>(
  request: Request,
  validator?: (data: any) => boolean
): Promise<{ success: true; data: T } | { success: false; error: NextResponse<ApiErrorResponse> }> {
  try {
    const data = await request.json();
    
    if (validator && !validator(data)) {
      return {
        success: false,
        error: createValidationError('Invalid request body'),
      };
    }
    
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: createValidationError('Invalid JSON in request body'),
    };
  }
}
