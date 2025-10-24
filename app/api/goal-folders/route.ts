/**
 * Goal Folders API - Refactored with unified infrastructure + Phase 3 Cleanup
 * Manages goal organization folders with file-based storage
 * Features: Structured Logging, Type Safety, Unified Error Handling
 */

import { NextRequest } from 'next/server';
import {
  FileStorage,
  generateUuid,
  isValidUuid,
  getUserId,
  createSuccessResponse,
  createErrorResponse,
  createValidationError,
  createNotFoundError,
  withErrorHandling,
  parseRequestBody,
} from '@/lib/core';
import { appLogger } from '@/lib/logger';
import { apiCache } from '@/lib/cache/api-cache';
import { rateLimiter } from '@/lib/middleware/rate-limiter';

export const dynamic = 'force-dynamic';

// Goal Folder interface
interface GoalFolder {
  id: string;
  user_id: string;
  name: string;
  description?: string | null;
  color: string;
  order_index?: number;
  created_at: string;
  updated_at: string;
}

// Initialize file storage
const folderStorage = new FileStorage<GoalFolder>('goal-folders.json');

/**
 * GET /api/goal-folders
 * Fetch all goal folders for the authenticated user
 * With caching and rate limiting
 */
export async function GET(request: NextRequest) {
  // Apply rate limiting (100 requests per minute)
  const rateLimitResponse = await rateLimiter.middleware(request, {
    windowMs: 60 * 1000,
    maxRequests: 100,
    algorithm: 'sliding-window',
    headers: true,
  });

  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  // Cache middleware for GET requests
  return apiCache.cacheMiddleware(
    request,
    async () => {
      return withErrorHandling(async () => {
        const { searchParams } = new URL(request.url);
        const qpUserId = searchParams.get('user_id');

        // Get user ID with dev fallback
        const userId = (qpUserId && isValidUuid(qpUserId))
          ? qpUserId
          : await getUserId({ allowDevFallback: true }) || '00000000-0000-0000-0000-000000000001';

        appLogger.debug('Fetching goal folders', { userId });

        // Load folders from file storage
        const allFolders = await folderStorage.read();
        
        // Filter folders for this user
        const userFolders = allFolders.filter(folder => folder.user_id === userId);

        // Sort by order_index if available
        userFolders.sort((a, b) => (a.order_index || 0) - (b.order_index || 0));

        appLogger.info('Goal folders fetched successfully', { 
          userId, 
          count: userFolders.length 
        });

        return createSuccessResponse(userFolders);
      });
    },
    {
      ttl: 300, // Cache for 5 minutes
      tags: ['goal-folders', `user:${request.headers.get('x-user-id') || 'default'}`],
      compression: true,
    }
  );
}

/**
 * POST /api/goal-folders
 * Create a new goal folder
 * Rate limited and invalidates cache on success
 */
export async function POST(request: NextRequest) {
  // Apply rate limiting (20 creates per minute)
  const rateLimitResponse = await rateLimiter.middleware(request, {
    windowMs: 60 * 1000,
    maxRequests: 20,
    algorithm: 'token-bucket',
    headers: true,
  });

  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  return withErrorHandling(async () => {
    // Parse request body
    const bodyResult = await parseRequestBody(request);
    if (!bodyResult.success) {
      return (bodyResult as any).error;
    }

    const { user_id, name, description, color, order_index } = bodyResult.data;

    // Validate required fields
    if (!name || typeof name !== 'string') {
      return createValidationError('Folder name is required');
    }

    // Get user ID with dev fallback
    const userId = (user_id && isValidUuid(user_id))
      ? user_id
      : await getUserId({ allowDevFallback: true }) || '00000000-0000-0000-0000-000000000001';

    appLogger.debug('Creating goal folder', { userId, folderName: name });

    // Load existing folders
    const folders = await folderStorage.read();

    // Check for duplicate folder name (case-insensitive)
    const duplicate = folders.find(
      f => f.user_id === userId && 
      f.name.trim().toLowerCase() === name.trim().toLowerCase()
    );

    if (duplicate) {
      return createValidationError('Folder with this name already exists');
    }

    // Create new folder
    const newFolder: GoalFolder = {
      id: generateUuid(),
      user_id: userId,
      name: name.trim(),
      description: description?.trim() || null,
      color: color || '#3B82F6',
      order_index: order_index || 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Save to storage
    await folderStorage.append(newFolder);

    // Invalidate cache for this user
    await apiCache.invalidateByTags(['goal-folders', `user:${userId}`]);

    appLogger.info('Goal folder created successfully', { 
      userId, 
      folderId: newFolder.id,
      folderName: newFolder.name 
    });

    return createSuccessResponse(newFolder, { 
      status: 201,
      message: 'Folder created successfully' 
    });
  });
}

/**
 * PUT /api/goal-folders
 * Update an existing goal folder
 * Rate limited and invalidates cache on success
 */
export async function PUT(request: NextRequest) {
  // Apply rate limiting (50 updates per minute)
  const rateLimitResponse = await rateLimiter.middleware(request, {
    windowMs: 60 * 1000,
    maxRequests: 50,
    algorithm: 'sliding-window',
    headers: true,
  });

  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  return withErrorHandling(async () => {
    // Parse request body
    const bodyResult = await parseRequestBody(request);
    if (!bodyResult.success) {
      return (bodyResult as any).error;
    }

    const { id, user_id, name, description, color, order_index } = bodyResult.data;

    // Validate folder ID
    if (!id || !isValidUuid(id)) {
      return createValidationError('Valid folder ID is required');
    }

    // Get user ID with dev fallback
    const userId = (user_id && isValidUuid(user_id))
      ? user_id
      : await getUserId({ allowDevFallback: true }) || '00000000-0000-0000-0000-000000000001';

    appLogger.debug('Updating goal folder', { userId, folderId: id });

    // Update folder
    const updated = await folderStorage.update(
      (folder) => folder.id === id && folder.user_id === userId,
      (folder) => ({
        ...folder,
        ...(name && { name: name.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(color && { color }),
        ...(order_index !== undefined && { order_index }),
        updated_at: new Date().toISOString(),
      })
    );

    if (!updated) {
      return createNotFoundError('Folder');
    }

    // Invalidate cache for this user
    await apiCache.invalidateByTags(['goal-folders', `user:${userId}`]);

    appLogger.info('Goal folder updated successfully', { userId, folderId: id });

    // Get updated folder
    const folders = await folderStorage.read();
    const updatedFolder = folders.find(f => f.id === id);

    return createSuccessResponse(updatedFolder, {
      message: 'Folder updated successfully'
    });
  });
}

/**
 * DELETE /api/goal-folders
 * Delete a goal folder
 * Rate limited and invalidates cache on success
 */
export async function DELETE(request: NextRequest) {
  // Apply rate limiting (30 deletes per minute)
  const rateLimitResponse = await rateLimiter.middleware(request, {
    windowMs: 60 * 1000,
    maxRequests: 30,
    algorithm: 'sliding-window',
    headers: true,
  });

  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  return withErrorHandling(async (): Promise<any> => {
    const { searchParams } = new URL(request.url);
    const folderId = searchParams.get('id');
    const qpUserId = searchParams.get('user_id');

    // Validate folder ID
    if (!folderId || !isValidUuid(folderId)) {
      return createValidationError('Valid folder ID is required');
    }

    // Get user ID with dev fallback
    const userId = (qpUserId && isValidUuid(qpUserId))
      ? qpUserId
      : await getUserId({ allowDevFallback: true }) || '00000000-0000-0000-0000-000000000001';

    appLogger.debug('Deleting goal folder', { userId, folderId });

    // Delete folder
    const deleted = await folderStorage.delete(
      (folder) => folder.id === folderId && folder.user_id === userId
    );

    if (!deleted) {
      return createNotFoundError('Folder');
    }

    // Invalidate cache for this user
    await apiCache.invalidateByTags(['goal-folders', `user:${userId}`]);

    appLogger.info('Goal folder deleted successfully', { userId, folderId });

    return createSuccessResponse(
      { id: folderId },
      { message: 'Folder deleted successfully' }
    );
  });
}
