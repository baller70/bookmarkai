/**
 * Secure Bookmark API Route
 * Replaces the vulnerable bookmark route with secure implementation
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser } from '@/lib/auth-utils';
import { secureDb } from '@/lib/database/secure-client';
import { 
  validateInput, 
  CreateBookmarkSchema, 
  UpdateBookmarkSchema, 
  BookmarkQuerySchema,
  validateApiRequest 
} from '@/lib/security/input-validation';
import { getSecureConfig } from '@/lib/config/secure-env';
import { contentAnalysisService } from '@/lib/ai/content-analysis';

// Rate limiting (simple in-memory implementation - use Redis in production)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX = 100; // requests per window

function checkRateLimit(identifier: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW;
  
  // Clean up old entries
  for (const [key, value] of rateLimitMap.entries()) {
    if (value.resetTime < now) {
      rateLimitMap.delete(key);
    }
  }
  
  const current = rateLimitMap.get(identifier);
  if (!current || current.resetTime < now) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1 };
  }
  
  if (current.count >= RATE_LIMIT_MAX) {
    return { allowed: false, remaining: 0 };
  }
  
  current.count++;
  return { allowed: true, remaining: RATE_LIMIT_MAX - current.count };
}

// GET /api/bookmarks - Fetch user's bookmarks
export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const clientIP = request.headers.get('x-forwarded-for') || 'unknown';
    const rateLimit = checkRateLimit(`GET:${clientIP}`);
    
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': RATE_LIMIT_MAX.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(Date.now() + RATE_LIMIT_WINDOW).toISOString()
          }
        }
      );
    }

    // Validate request
    const requestValidation = validateApiRequest(request);
    if (!requestValidation.isValid) {
      return NextResponse.json(
        { error: 'Invalid request', details: requestValidation.errors },
        { status: 400 }
      );
    }

    // Authenticate user
    const authResult = await authenticateUser(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error || 'Authentication failed' },
        { status: authResult.status || 401 }
      );
    }

    // Validate query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = {
      limit: searchParams.get('limit'),
      offset: searchParams.get('offset'),
      category: searchParams.get('category'),
      search: searchParams.get('search'),
      folder_id: searchParams.get('folder_id'),
    };

    const validation = validateInput(BookmarkQuerySchema, queryParams);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: validation.errors },
        { status: 400 }
      );
    }

    // Fetch bookmarks using secure database client
    const { limit = 20, offset = 0, category, search } = validation.data;
    const { data: bookmarks, error } = await secureDb.getBookmarks(
      authResult.userId,
      { 
        limit: Number(limit), 
        offset: Number(offset), 
        category: category as string | undefined, 
        search: search as string | undefined
      }
    );

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch bookmarks' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { 
        success: true, 
        bookmarks,
        count: bookmarks.length 
      },
      {
        headers: {
          'X-RateLimit-Limit': RATE_LIMIT_MAX.toString(),
          'X-RateLimit-Remaining': rateLimit.remaining.toString(),
        }
      }
    );

  } catch (error) {
    console.error('GET /api/bookmarks error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/bookmarks - Create new bookmark
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientIP = request.headers.get('x-forwarded-for') || 'unknown';
    const rateLimit = checkRateLimit(`POST:${clientIP}`);
    
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    // Validate request
    const requestValidation = validateApiRequest(request);
    if (!requestValidation.isValid) {
      return NextResponse.json(
        { error: 'Invalid request', details: requestValidation.errors },
        { status: 400 }
      );
    }

    // Authenticate user
    const authResult = await authenticateUser(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error || 'Authentication failed' },
        { status: authResult.status || 401 }
      );
    }

    // Parse and validate request body
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    // Check if this is an update (has ID) or create
    const isUpdate = body.id && typeof body.id === 'number';
    const schema = isUpdate ? UpdateBookmarkSchema : CreateBookmarkSchema;
    
    const validation = validateInput(schema, body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid bookmark data', details: validation.errors },
        { status: 400 }
      );
    }

    let result;
    
    if (isUpdate) {
      // Update existing bookmark
      const { data, error } = await secureDb.updateBookmark(
        body.id,
        validation.data,
        authResult.userId
      );
      
      if (error) {
        return NextResponse.json(
          { error },
          { status: error.includes('not found') ? 404 : 500 }
        );
      }
      
      result = { bookmark: data, message: 'Bookmark updated successfully' };
    } else {
      // Create new bookmark
      let bookmarkData = validation.data;
      
      // AI processing if enabled
      if (body.enableAI && !body.ai_summary) {
        try {
          const aiResult = await contentAnalysisService.analyzeContent({
            title: bookmarkData.title as string,
            url: bookmarkData.url as string,
            description: (bookmarkData.description as string) || '',
            userId: authResult.userId
          });
          
          if (aiResult && aiResult.aiSummary) {
            bookmarkData = {
              ...bookmarkData,
              ai_summary: aiResult.aiSummary,
              ai_tags: aiResult.aiTags,
              ai_category: aiResult.aiCategory
            };
          }
        } catch (aiError) {
          console.warn('AI processing failed:', aiError);
          // Continue without AI data - don't fail the request
        }
      }
      
      const { data, error } = await secureDb.createBookmark(bookmarkData, authResult.userId);
      
      if (error) {
        return NextResponse.json(
          { error },
          { status: 500 }
        );
      }
      
      result = { bookmark: data, message: 'Bookmark created successfully' };
    }

    return NextResponse.json(
      { success: true, ...result },
      {
        status: isUpdate ? 200 : 201,
        headers: {
          'X-RateLimit-Limit': RATE_LIMIT_MAX.toString(),
          'X-RateLimit-Remaining': rateLimit.remaining.toString(),
        }
      }
    );

  } catch (error) {
    console.error('POST /api/bookmarks error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/bookmarks - Delete bookmark
export async function DELETE(request: NextRequest) {
  try {
    // Rate limiting
    const clientIP = request.headers.get('x-forwarded-for') || 'unknown';
    const rateLimit = checkRateLimit(`DELETE:${clientIP}`);
    
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    // Authenticate user
    const authResult = await authenticateUser(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error || 'Authentication failed' },
        { status: authResult.status || 401 }
      );
    }

    // Get bookmark ID from query parameters
    const { searchParams } = new URL(request.url);
    const bookmarkId = searchParams.get('id');
    
    if (!bookmarkId) {
      return NextResponse.json(
        { error: 'Bookmark ID is required' },
        { status: 400 }
      );
    }

    const id = parseInt(bookmarkId);
    if (isNaN(id) || id <= 0) {
      return NextResponse.json(
        { error: 'Invalid bookmark ID' },
        { status: 400 }
      );
    }

    // Delete bookmark using secure database client
    const { success, error } = await secureDb.deleteBookmark(id, authResult.userId);
    
    if (error) {
      return NextResponse.json(
        { error },
        { status: error.includes('not found') ? 404 : 500 }
      );
    }

    return NextResponse.json(
      { success: true, message: 'Bookmark deleted successfully' },
      {
        headers: {
          'X-RateLimit-Limit': RATE_LIMIT_MAX.toString(),
          'X-RateLimit-Remaining': rateLimit.remaining.toString(),
        }
      }
    );

  } catch (error) {
    console.error('DELETE /api/bookmarks error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
