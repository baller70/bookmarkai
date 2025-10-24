/**
 * Categories API - Refactored with unified infrastructure + Phase 2 Optimization
 * Manages bookmark categories with file-based storage
 * Features: Caching, Rate Limiting, Compression
 */

import { NextRequest, NextResponse } from 'next/server';
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

// Category interface
interface Category {
  id: string;
  name: string;
  description: string;
  color: string;
  user_id: string;
  bookmarkCount: number;
  createdAt: string;
  updatedAt: string;
}

// Initialize file storage
const categoryStorage = new FileStorage<Category>('categories.json');
const bookmarkStorage = new FileStorage<any>('bookmarks.json');

/**
 * Get bookmark count for a category
 */
async function getBookmarkCountForCategory(
  categoryName: string,
  userId: string,
  categoryId?: string
): Promise<number> {
  try {
    const bookmarks = await bookmarkStorage.read();
    const normalize = (s: any) => (typeof s === 'string' ? s.trim().toLowerCase() : '');
    const target = normalize(categoryName);

    return bookmarks.filter(bookmark => {
      // Check if bookmark belongs to user
      if (bookmark.user_id !== userId) return false;

      // Match by folder_id if present
      if (categoryId && bookmark.folder_id) {
        return String(bookmark.folder_id) === categoryId;
      }

      // Match by category name
      return normalize(bookmark.category) === target;
    }).length;
  } catch (error) {
    appLogger.error(
      'Error counting bookmarks for category',
      error instanceof Error ? error : undefined,
      { categoryName }
    );
    return 0;
  }
}

/**
 * GET /api/categories
 * Fetch all categories for the authenticated user
 * With caching and rate limiting
 */
export async function GET(request: NextRequest) {
  // Apply rate limiting (100 requests per minute per user)
  const rateLimitResponse = await rateLimiter.middleware(request, {
    windowMs: 60 * 1000,
    maxRequests: 100,
    algorithm: 'sliding-window',
    headers: true,
  });

  if (rateLimitResponse) {
    return rateLimitResponse; // Rate limited
  }

  // Try cache first
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

        appLogger.debug('Fetching categories', { userId });

        // Load categories from file storage
        const allCategories = await categoryStorage.read();
        
        // Filter categories for this user
        const userCategories = allCategories.filter(cat => cat.user_id === userId);

        // Add bookmark counts (optimized with parallel processing)
        const categoriesWithCounts = await Promise.all(
          userCategories.map(async (category) => {
            const bookmarkCount = await getBookmarkCountForCategory(
              category.name,
              userId,
              category.id
            );
            
            return {
              ...category,
              bookmarkCount,
            };
          })
        );

        appLogger.info('Categories fetched successfully', { 
          userId, 
          count: categoriesWithCounts.length 
        });

        return createSuccessResponse(categoriesWithCounts);
      });
    },
    {
      ttl: 300, // Cache for 5 minutes
      tags: ['categories', `user:${request.headers.get('x-user-id') || 'default'}`],
      compression: true,
    }
  );
}

/**
 * POST /api/categories
 * Create a new category
 * Invalidates cache on success
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
    const { searchParams } = new URL(request.url);
    const qpUserId = searchParams.get('user_id');

    // Get user ID
    const userId = (qpUserId && isValidUuid(qpUserId))
      ? qpUserId
      : await getUserId({ allowDevFallback: true }) || '00000000-0000-0000-0000-000000000001';

    // Parse request body
    const bodyResult = await parseRequestBody(request);
    if (!bodyResult.success) {
      return (bodyResult as any).error;
    }

    const { name, description, color } = bodyResult.data;

    // Validate required fields
    if (!name || typeof name !== 'string') {
      return createValidationError('Category name is required');
    }

    // Load existing categories
    const categories = await categoryStorage.read();

    // Check for duplicate category name (case-insensitive)
    const duplicate = categories.find(
      cat => cat.user_id === userId && 
      cat.name.trim().toLowerCase() === name.trim().toLowerCase()
    );

    if (duplicate) {
      return createValidationError('Category with this name already exists');
    }

    // Create new category
    const newCategory: Category = {
      id: generateUuid(),
      name: name.trim(),
      description: description?.trim() || '',
      color: color || '#3B82F6',
      user_id: userId,
      bookmarkCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Save to storage
    await categoryStorage.append(newCategory);

    // Invalidate cache for this user
    await apiCache.invalidateByTags(['categories', `user:${userId}`]);

    appLogger.info('Category created successfully', { 
      userId, 
      categoryId: newCategory.id,
      name: newCategory.name 
    });

    return createSuccessResponse(newCategory, { 
      status: 201,
      message: 'Category created successfully' 
    });
  });
}

/**
 * PUT /api/categories
 * Update an existing category
 * Invalidates cache on success
 */
export async function PUT(request: NextRequest) {
  // Apply rate limiting
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
    const { searchParams } = new URL(request.url);
    const qpUserId = searchParams.get('user_id');

    // Get user ID
    const userId = (qpUserId && isValidUuid(qpUserId))
      ? qpUserId
      : await getUserId({ allowDevFallback: true }) || '00000000-0000-0000-0000-000000000001';

    // Parse request body
    const bodyResult = await parseRequestBody(request);
    if (!bodyResult.success) {
      return (bodyResult as any).error;
    }

    const { id, name, description, color } = bodyResult.data;

    // Validate required fields
    if (!id || !isValidUuid(id)) {
      return createValidationError('Valid category ID is required');
    }

    // Update category
    const updated = await categoryStorage.update(
      (cat) => cat.id === id && cat.user_id === userId,
      (cat) => ({
        ...cat,
        ...(name && { name: name.trim() }),
        ...(description !== undefined && { description: description.trim() }),
        ...(color && { color }),
        updatedAt: new Date().toISOString(),
      })
    );

    if (!updated) {
      return createNotFoundError('Category');
    }

    // Invalidate cache for this user
    await apiCache.invalidateByTags(['categories', `user:${userId}`]);

    appLogger.info('Category updated successfully', { userId, categoryId: id });

    // Get updated category
    const categories = await categoryStorage.read();
    const updatedCategory = categories.find(cat => cat.id === id);

    return createSuccessResponse(updatedCategory, {
      message: 'Category updated successfully'
    });
  });
}

/**
 * DELETE /api/categories
 * Delete a category
 * Invalidates cache on success
 */
export async function DELETE(request: NextRequest) {
  // Apply rate limiting
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
    const categoryId = searchParams.get('id');
    const qpUserId = searchParams.get('user_id');

    // Validate category ID
    if (!categoryId || !isValidUuid(categoryId)) {
      return createValidationError('Valid category ID is required');
    }

    // Get user ID
    const userId = (qpUserId && isValidUuid(qpUserId))
      ? qpUserId
      : await getUserId({ allowDevFallback: true }) || '00000000-0000-0000-0000-000000000001';

    // Delete category
    const deleted = await categoryStorage.delete(
      (cat) => cat.id === categoryId && cat.user_id === userId
    );

    if (!deleted) {
      return createNotFoundError('Category');
    }

    // Invalidate cache for this user
    await apiCache.invalidateByTags(['categories', `user:${userId}`]);

    appLogger.info('Category deleted successfully', { userId, categoryId });

    return createSuccessResponse(
      { id: categoryId },
      { message: 'Category deleted successfully' }
    );
  });
}
