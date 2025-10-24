/**
 * Bookmarks Analytics API - Refactored with unified infrastructure + Phase 2 Optimization
 * Tracks bookmark usage, visits, and time spent
 * Features: Caching, Rate Limiting, Compression
 */

import { NextRequest } from 'next/server';
import {
  FileStorage,
  createSuccessResponse,
  createErrorResponse,
  createValidationError,
  withErrorHandling,
  parseRequestBody,
} from '@/lib/core';
import { appLogger } from '@/lib/logger';
import { apiCache } from '@/lib/cache/api-cache';
import { rateLimiter } from '@/lib/middleware/rate-limiter';

// Analytics interface
interface BookmarkAnalytics {
  bookmark_id: string;
  visits: number;
  sessionCount: number;
  weeklyVisits: number;
  monthlyVisits: number;
  lastVisited: string;
  timeSpent: number;
}

// Initialize file storage
const analyticsStorage = new FileStorage<BookmarkAnalytics>('analytics.json');

/**
 * POST /api/bookmarks/analytics
 * Track bookmark analytics (visit or time update)
 * Rate limited to prevent spam
 */
export async function POST(request: NextRequest) {
  // Apply rate limiting (200 analytics tracks per minute per user)
  const rateLimitResponse = await rateLimiter.middleware(request, {
    windowMs: 60 * 1000,
    maxRequests: 200,
    algorithm: 'token-bucket',
    burst: 50,
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

    const { bookmarkId, action, timeSpent } = bodyResult.data;

    // Validate bookmark ID
    if (!bookmarkId) {
      return createValidationError('Bookmark ID is required');
    }

    appLogger.debug('Tracking analytics', { bookmarkId, action, timeSpent });

    // Load current analytics
    const allAnalytics = await analyticsStorage.read();
    const bookmarkKey = String(bookmarkId);
    
    // Find or create analytics record
    let analytics = allAnalytics.find(a => a.bookmark_id === bookmarkKey);
    
    if (!analytics) {
      analytics = {
        bookmark_id: bookmarkKey,
        visits: 0,
        sessionCount: 0,
        weeklyVisits: 0,
        monthlyVisits: 0,
        lastVisited: new Date().toISOString(),
        timeSpent: 0,
      };
      allAnalytics.push(analytics);
    }

    // Update analytics based on action
    if (action === 'visit') {
      analytics.visits += 1;
      analytics.sessionCount += 1;
      analytics.weeklyVisits += 1;
      analytics.monthlyVisits += 1;
      analytics.lastVisited = new Date().toISOString();
    } else if (action === 'timeUpdate' && timeSpent !== undefined) {
      analytics.timeSpent = timeSpent;
    }

    // Save updated analytics
    await analyticsStorage.write(allAnalytics);

    // Invalidate analytics cache
    await apiCache.invalidateByTags(['analytics', `bookmark:${bookmarkKey}`]);

    appLogger.info('Analytics tracked successfully', { 
      bookmarkId: bookmarkKey, 
      action,
      visits: analytics.visits 
    });

    return createSuccessResponse({
      ...analytics,
      action,
      tracked_at: new Date().toISOString(),
    });
  });
}

/**
 * GET /api/bookmarks/analytics
 * Fetch analytics for a specific bookmark or global analytics
 * With caching and rate limiting
 */
export async function GET(request: NextRequest) {
  // Apply rate limiting (150 requests per minute)
  const rateLimitResponse = await rateLimiter.middleware(request, {
    windowMs: 60 * 1000,
    maxRequests: 150,
    algorithm: 'sliding-window',
    headers: true,
  });

  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  // Use cache with stale-while-revalidate
  return apiCache.cacheMiddleware(
    request,
    async () => {
      return withErrorHandling(async (): Promise<any> => {
        const { searchParams } = new URL(request.url);
        const bookmarkId = searchParams.get('bookmarkId');

        // Load all analytics
        const allAnalytics = await analyticsStorage.read();

        // If specific bookmark requested
        if (bookmarkId && bookmarkId.trim() !== '') {
          const bookmarkKey = String(bookmarkId);
          const analytics = allAnalytics.find(a => a.bookmark_id === bookmarkKey);

          if (analytics) {
            return createSuccessResponse(analytics);
          }

          // Return default analytics if not found
          return createSuccessResponse({
            bookmark_id: bookmarkKey,
            visits: 0,
            sessionCount: 0,
            weeklyVisits: 0,
            monthlyVisits: 0,
            lastVisited: null,
            timeSpent: 0,
          });
        }

        // Return global analytics (computationally expensive, benefits from caching)
        const totalVisits = allAnalytics.reduce((sum, a) => sum + a.visits, 0);
        const totalBookmarks = allAnalytics.length;
        const activeBookmarks = allAnalytics.filter(a => a.visits > 0).length;
        const avgUsage = totalBookmarks > 0 ? Math.round(totalVisits / totalBookmarks) : 0;
        const topPerformer = allAnalytics.length > 0
          ? allAnalytics.reduce((top, current) => current.visits > top.visits ? current : top)
          : null;

        return createSuccessResponse({
          analytics: allAnalytics,
          globalStats: {
            totalVisits,
            totalBookmarks,
            activeBookmarks,
            avgUsage,
            topPerformer,
            lastUpdated: new Date().toISOString(),
          },
        });
      });
    },
    {
      ttl: 180, // Cache for 3 minutes (analytics updated frequently)
      staleWhileRevalidate: 60, // Serve stale for up to 1 minute while revalidating
      tags: ['analytics'],
      compression: true,
    }
  );
}    