
/**
 * Core Infrastructure Layer
 * Central export for all core utilities
 */

// Database
export {
  dbConfig,
  ensureDataDirectory,
  FileStorage,
  isValidUuid,
  generateUuid,
  safeJsonParse,
  type DatabaseConfig,
} from './database';

// Authentication
export {
  DEV_USER_ID,
  DEV_USER_EMAIL,
  getAuthSession,
  authenticateRequest,
  requireAuth,
  getUserId,
  createAuthErrorResponse,
  isResourceOwner,
  type AuthResult,
} from './auth';

// API Responses
export {
  createSuccessResponse,
  createErrorResponse,
  createValidationError,
  createNotFoundError,
  createUnauthorizedError,
  createForbiddenError,
  withErrorHandling,
  parseRequestBody,
  type ApiSuccessResponse,
  type ApiErrorResponse,
  type ApiResponse,
} from './api-response';
