/**
 * Goals API - Refactored with unified infrastructure + Phase 3 Cleanup
 * Manages user goals with file-based storage
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

// Goal interface with complete type definitions
interface GoalFolder {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at?: string;
  updated_at?: string;
}

interface Goal {
  id: string;
  user_id: string;
  folder_id: string | null;
  name: string;
  description: string | null;
  color: string;
  deadline_date: string | null;
  goal_type: string;
  goal_description: string | null;
  goal_status: 'not_started' | 'in_progress' | 'completed' | 'on_hold';
  goal_priority: 'low' | 'medium' | 'high' | 'urgent';
  goal_progress: number;
  connected_bookmarks: string[];
  tags: string[];
  notes: string | null;
  created_at: string;
  updated_at: string;
  goal_folders?: GoalFolder | null;
}

// Initialize file storage
const goalStorage = new FileStorage<Goal>('goals.json');
const folderStorage = new FileStorage<GoalFolder>('goal-folders.json');

/**
 * GET /api/goals
 * Fetch goals for the authenticated user with optional folder filtering
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
        const folderId = searchParams.get('folder_id');

        // Get user ID with dev fallback
        const userId = (qpUserId && isValidUuid(qpUserId))
          ? qpUserId
          : await getUserId({ allowDevFallback: true }) || '00000000-0000-0000-0000-000000000001';

        appLogger.debug('Fetching goals', { userId, folderId });

        // Load goals from file storage
        const allGoals = await goalStorage.read();
        
        // Filter goals for this user
        let userGoals = allGoals.filter(goal => goal.user_id === userId);

        // Apply folder filter if specified
        if (folderId) {
          if (folderId === 'null' || folderId === 'unassigned') {
            userGoals = userGoals.filter(goal => !goal.folder_id);
          } else {
            userGoals = userGoals.filter(goal => goal.folder_id === folderId);
          }
        }

        // Enrich with folder information if needed
        if (userGoals.length > 0) {
          const folders = await folderStorage.read();
          userGoals = userGoals.map(goal => {
            if (goal.folder_id) {
              const folder = folders.find(f => f.id === goal.folder_id);
              return {
                ...goal,
                goal_folders: folder || null,
              };
            }
            return goal;
          });
        }

        appLogger.info('Goals fetched successfully', { 
          userId, 
          count: userGoals.length,
          folderId 
        });

        return createSuccessResponse(userGoals);
      });
    },
    {
      ttl: 300, // Cache for 5 minutes
      tags: ['goals', `user:${request.headers.get('x-user-id') || 'default'}`],
      compression: true,
    }
  );
}

/**
 * POST /api/goals
 * Create a new goal
 * Rate limited and invalidates cache on success
 */
export async function POST(request: NextRequest) {
  // Apply rate limiting (30 creates per minute)
  const rateLimitResponse = await rateLimiter.middleware(request, {
    windowMs: 60 * 1000,
    maxRequests: 30,
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

    const {
      user_id,
      folder_id,
      name,
      description,
      color,
      deadline_date,
      goal_type,
      goal_description,
      goal_status,
      goal_priority,
      goal_progress,
      connected_bookmarks,
      tags,
      notes,
    } = bodyResult.data;

    // Validate required fields
    if (!name || typeof name !== 'string') {
      return createValidationError('Goal name is required');
    }

    // Get user ID with dev fallback
    const userId = (user_id && isValidUuid(user_id))
      ? user_id
      : await getUserId({ allowDevFallback: true }) || '00000000-0000-0000-0000-000000000001';

    // Validate folder_id if provided
    if (folder_id) {
      const folders = await folderStorage.read();
      const folderExists = folders.some(f => f.id === folder_id && f.user_id === userId);
      
      if (!folderExists) {
        return createValidationError('Invalid folder ID');
      }
    }

    appLogger.debug('Creating goal', { userId, goalName: name, folderId: folder_id });

    // Create new goal
    const newGoal: Goal = {
      id: generateUuid(),
      user_id: userId,
      folder_id: folder_id || null,
      name: name.trim(),
      description: description?.trim() || null,
      color: color || '#3B82F6',
      deadline_date: deadline_date || null,
      goal_type: goal_type || 'custom',
      goal_description: goal_description || null,
      goal_status: goal_status || 'not_started',
      goal_priority: goal_priority || 'medium',
      goal_progress: goal_progress || 0,
      connected_bookmarks: connected_bookmarks || [],
      tags: tags || [],
      notes: notes || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Save to storage
    await goalStorage.append(newGoal);

    // Invalidate cache for this user
    await apiCache.invalidateByTags(['goals', `user:${userId}`]);

    appLogger.info('Goal created successfully', { 
      userId, 
      goalId: newGoal.id,
      goalName: newGoal.name 
    });

    return createSuccessResponse(newGoal, { 
      status: 201,
      message: 'Goal created successfully' 
    });
  });
}

/**
 * PUT /api/goals
 * Update an existing goal
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

    const {
      id,
      user_id,
      folder_id,
      name,
      description,
      color,
      deadline_date,
      goal_type,
      goal_description,
      goal_status,
      goal_priority,
      goal_progress,
      connected_bookmarks,
      tags,
      notes,
    } = bodyResult.data;

    // Validate goal ID
    if (!id || !isValidUuid(id)) {
      return createValidationError('Valid goal ID is required');
    }

    // Get user ID with dev fallback
    const userId = (user_id && isValidUuid(user_id))
      ? user_id
      : await getUserId({ allowDevFallback: true }) || '00000000-0000-0000-0000-000000000001';

    // Validate folder_id if provided
    if (folder_id !== undefined && folder_id !== null) {
      const folders = await folderStorage.read();
      const folderExists = folders.some(f => f.id === folder_id && f.user_id === userId);
      
      if (!folderExists) {
        appLogger.warn('Invalid folder ID provided for goal update', { 
          goalId: id, 
          folderId: folder_id, 
          userId 
        });
        return createValidationError('Invalid folder ID');
      }
    }

    appLogger.debug('Updating goal', { userId, goalId: id });

    // Update goal
    const updated = await goalStorage.update(
      (goal) => goal.id === id && goal.user_id === userId,
      (goal) => ({
        ...goal,
        ...(folder_id !== undefined && { folder_id }),
        ...(name && { name: name.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(color && { color }),
        ...(deadline_date !== undefined && { deadline_date }),
        ...(goal_type && { goal_type }),
        ...(goal_description !== undefined && { goal_description }),
        ...(goal_status && { goal_status }),
        ...(goal_priority && { goal_priority }),
        ...(goal_progress !== undefined && { goal_progress }),
        ...(connected_bookmarks !== undefined && { connected_bookmarks }),
        ...(tags !== undefined && { tags }),
        ...(notes !== undefined && { notes }),
        updated_at: new Date().toISOString(),
      })
    );

    if (!updated) {
      return createNotFoundError('Goal');
    }

    // Invalidate cache for this user
    await apiCache.invalidateByTags(['goals', `user:${userId}`]);

    appLogger.info('Goal updated successfully', { userId, goalId: id });

    // Get updated goal
    const goals = await goalStorage.read();
    const updatedGoal = goals.find(g => g.id === id);

    return createSuccessResponse(updatedGoal, {
      message: 'Goal updated successfully'
    });
  });
}

/**
 * DELETE /api/goals
 * Delete a goal
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
    const goalId = searchParams.get('id');
    const qpUserId = searchParams.get('user_id');

    // Validate goal ID
    if (!goalId || !isValidUuid(goalId)) {
      return createValidationError('Valid goal ID is required');
    }

    // Get user ID with dev fallback
    const userId = (qpUserId && isValidUuid(qpUserId))
      ? qpUserId
      : await getUserId({ allowDevFallback: true }) || '00000000-0000-0000-0000-000000000001';

    appLogger.debug('Deleting goal', { userId, goalId });

    // Delete goal
    const deleted = await goalStorage.delete(
      (goal) => goal.id === goalId && goal.user_id === userId
    );

    if (!deleted) {
      return createNotFoundError('Goal');
    }

    // Invalidate cache for this user
    await apiCache.invalidateByTags(['goals', `user:${userId}`]);

    appLogger.info('Goal deleted successfully', { userId, goalId });

    return createSuccessResponse(
      { id: goalId },
      { message: 'Goal deleted successfully' }
    );
  });
}
