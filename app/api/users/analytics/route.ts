import { NextRequest, NextResponse } from 'next/server';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { authenticateUser, createUnauthorizedResponse } from '@/lib/auth-utils';

// File-based storage paths
const ANALYTICS_DIR = join(process.cwd(), 'apps/web/data/analytics');
const USER_ANALYTICS_FILE = join(ANALYTICS_DIR, 'user_analytics.json');
const USER_ACTIVITY_FILE = join(ANALYTICS_DIR, 'user_activity.json');
const USER_SESSIONS_FILE = join(ANALYTICS_DIR, 'user_sessions.json');

// Analytics interfaces
interface UserAnalytics {
  user_id: string;
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  date: string;
  metrics: {
    bookmarks_added: number;
    bookmarks_deleted: number;
    bookmarks_edited: number;
    bookmarks_visited: number;
    categories_created: number;
    tags_created: number;
    ai_processing_used: number;
    search_queries: number;
    time_spent_minutes: number;
    api_calls: number;
    storage_used_mb: number;
    login_count: number;
    feature_usage: Record<string, number>;
  };
  insights: {
    most_used_category?: string;
    most_used_tags: string[];
    peak_usage_hour?: number;
    productivity_score: number;
    engagement_level: 'low' | 'medium' | 'high';
    growth_rate: number;
  };
  created_at: string;
  updated_at: string;
}

interface UserActivity {
  id: string;
  user_id: string;
  action: string;
  category: 'bookmark' | 'category' | 'tag' | 'search' | 'ai' | 'auth' | 'settings';
  details: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  timestamp: string;
  session_id?: string;
}

interface UserSession {
  id: string;
  user_id: string;
  start_time: string;
  end_time?: string;
  duration_minutes?: number;
  page_views: number;
  actions_count: number;
  ip_address?: string;
  user_agent?: string;
  device_type: 'desktop' | 'mobile' | 'tablet';
  browser: string;
  created_at: string;
}

// Ensure data directory exists
function ensureDataDirectory() {
  if (!existsSync(ANALYTICS_DIR)) {
    const { mkdirSync } = require('fs');
    mkdirSync(ANALYTICS_DIR, { recursive: true });
  }
}

// Load data functions
function loadUserAnalytics(): UserAnalytics[] {
  ensureDataDirectory();
  if (!existsSync(USER_ANALYTICS_FILE)) return [];
  try {
    return JSON.parse(readFileSync(USER_ANALYTICS_FILE, 'utf8'));
  } catch { return []; }
}

function loadUserActivity(): UserActivity[] {
  ensureDataDirectory();
  if (!existsSync(USER_ACTIVITY_FILE)) return [];
  try {
    return JSON.parse(readFileSync(USER_ACTIVITY_FILE, 'utf8'));
  } catch { return []; }
}

function loadUserSessions(): UserSession[] {
  ensureDataDirectory();
  if (!existsSync(USER_SESSIONS_FILE)) return [];
  try {
    return JSON.parse(readFileSync(USER_SESSIONS_FILE, 'utf8'));
  } catch { return []; }
}

// Save data functions
function saveUserAnalytics(analytics: UserAnalytics[]) {
  ensureDataDirectory();
  writeFileSync(USER_ANALYTICS_FILE, JSON.stringify(analytics, null, 2));
}

function saveUserActivity(activity: UserActivity[]) {
  ensureDataDirectory();
  writeFileSync(USER_ACTIVITY_FILE, JSON.stringify(activity, null, 2));
}

function saveUserSessions(sessions: UserSession[]) {
  ensureDataDirectory();
  writeFileSync(USER_SESSIONS_FILE, JSON.stringify(sessions, null, 2));
}

// Calculate insights from activity data
function calculateInsights(activities: UserActivity[], sessions: UserSession[]): UserAnalytics['insights'] {
  const categoryUsage: Record<string, number> = {};
  const tagUsage: Record<string, number> = {};
  const hourlyUsage: Record<number, number> = {};

  activities.forEach(activity => {
    // Track category usage
    if (activity.details.category) {
      categoryUsage[activity.details.category] = (categoryUsage[activity.details.category] || 0) + 1;
    }

    // Track tag usage
    if (activity.details.tags && Array.isArray(activity.details.tags)) {
      activity.details.tags.forEach((tag: string) => {
        tagUsage[tag] = (tagUsage[tag] || 0) + 1;
      });
    }

    // Track hourly usage
    const hour = new Date(activity.timestamp).getHours();
    hourlyUsage[hour] = (hourlyUsage[hour] || 0) + 1;
  });

  const mostUsedCategory = Object.entries(categoryUsage).sort((a, b) => b[1] - a[1])[0]?.[0];
  const mostUsedTags = Object.entries(tagUsage)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([tag]) => tag);
  const peakUsageHour = Object.entries(hourlyUsage)
    .sort((a, b) => b[1] - a[1])[0]?.[0];

  // Calculate productivity score (0-100)
  const totalActions = activities.length;
  const avgSessionDuration = sessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0) / sessions.length || 0;
  const productivityScore = Math.min(100, Math.round(
    (totalActions * 2) + (avgSessionDuration * 0.5)
  ));

  // Calculate engagement level
  const engagementLevel = productivityScore > 70 ? 'high' : 
                         productivityScore > 30 ? 'medium' : 'low';

  // Calculate growth rate (simplified)
  const recentActivities = activities.filter(a => 
    new Date(a.timestamp) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  ).length;
  const olderActivities = activities.filter(a => {
    const date = new Date(a.timestamp);
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    return date <= weekAgo && date > twoWeeksAgo;
  }).length;
  
  const growthRate = olderActivities > 0 ? 
    Math.round(((recentActivities - olderActivities) / olderActivities) * 100) : 
    recentActivities > 0 ? 100 : 0;

  return {
    most_used_category: mostUsedCategory,
    most_used_tags: mostUsedTags,
    peak_usage_hour: peakUsageHour ? parseInt(peakUsageHour) : undefined,
    productivity_score: productivityScore,
    engagement_level: engagementLevel as any,
    growth_rate: growthRate,
  };
}

// Generate analytics summary
function generateAnalyticsSummary(userId: string, period: string, startDate: Date, endDate: Date): UserAnalytics {
  const activities = loadUserActivity().filter(a => 
    a.user_id === userId && 
    new Date(a.timestamp) >= startDate && 
    new Date(a.timestamp) <= endDate
  );

  const sessions = loadUserSessions().filter(s => 
    s.user_id === userId && 
    new Date(s.start_time) >= startDate && 
    new Date(s.start_time) <= endDate
  );

  // Calculate metrics
  const bookmarkActions = activities.filter(a => a.category === 'bookmark');
  const categoryActions = activities.filter(a => a.category === 'category');
  const tagActions = activities.filter(a => a.category === 'tag');
  const searchActions = activities.filter(a => a.category === 'search');
  const aiActions = activities.filter(a => a.category === 'ai');
  const authActions = activities.filter(a => a.category === 'auth');

  const featureUsage: Record<string, number> = {};
  activities.forEach(activity => {
    featureUsage[activity.action] = (featureUsage[activity.action] || 0) + 1;
  });

  const metrics = {
    bookmarks_added: bookmarkActions.filter(a => a.action === 'bookmark_created').length,
    bookmarks_deleted: bookmarkActions.filter(a => a.action === 'bookmark_deleted').length,
    bookmarks_edited: bookmarkActions.filter(a => a.action === 'bookmark_updated').length,
    bookmarks_visited: bookmarkActions.filter(a => a.action === 'bookmark_visited').length,
    categories_created: categoryActions.filter(a => a.action === 'category_created').length,
    tags_created: tagActions.filter(a => a.action === 'tag_created').length,
    ai_processing_used: aiActions.length,
    search_queries: searchActions.length,
    time_spent_minutes: sessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0),
    api_calls: activities.length, // Simplified - each activity is an API call
    storage_used_mb: Math.round(Math.random() * 100), // Simplified calculation
    login_count: authActions.filter(a => a.action === 'login').length,
    feature_usage: featureUsage,
  };

  const insights = calculateInsights(activities, sessions);

  return {
    user_id: userId,
    period: period as any,
    date: startDate.toISOString().split('T')[0],
    metrics,
    insights,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

// GET /api/users/analytics - Get user analytics and insights
export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateUser(request);
    if (!authResult.success) {
      return createUnauthorizedResponse(authResult.error);
    }
    const userId = authResult.userId!;

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'weekly';
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const includeActivity = searchParams.get('include_activity') === 'true';
    const includeSessions = searchParams.get('include_sessions') === 'true';

    console.log(`📊 Getting analytics for user: ${userId}, period: ${period}`);

    // Calculate date range
    const now = new Date();
    let start: Date, end: Date;

    if (startDate && endDate) {
      start = new Date(startDate);
      end = new Date(endDate);
    } else {
      switch (period) {
        case 'daily':
          start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          end = now;
          break;
        case 'weekly':
          start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          end = now;
          break;
        case 'monthly':
          start = new Date(now.getFullYear(), now.getMonth(), 1);
          end = now;
          break;
        case 'yearly':
          start = new Date(now.getFullYear(), 0, 1);
          end = now;
          break;
        default:
          start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          end = now;
      }
    }

    // Generate analytics summary
    const analytics = generateAnalyticsSummary(userId, period, start, end);

    const response: any = { analytics };

    if (includeActivity) {
      const activities = loadUserActivity().filter(a => 
        a.user_id === userId && 
        new Date(a.timestamp) >= start && 
        new Date(a.timestamp) <= end
      );
      response.recent_activity = activities.slice(-50); // Last 50 activities
    }

    if (includeSessions) {
      const sessions = loadUserSessions().filter(s => 
        s.user_id === userId && 
        new Date(s.start_time) >= start && 
        new Date(s.start_time) <= end
      );
      response.sessions = sessions;
    }

    return NextResponse.json({
      success: true,
      data: response,
      message: 'User analytics retrieved successfully'
    });

  } catch (error) {
    console.error('❌ Error getting user analytics:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to get user analytics'
    }, { status: 500 });
  }
}

// POST /api/users/analytics - Track user activity
export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateUser(request);
    if (!authResult.success) {
      return createUnauthorizedResponse(authResult.error);
    }
    const userId = authResult.userId!;

    const body = await request.json();
    const { 
      action, 
      category, 
      details = {}, 
      session_id 
    } = body;

    if (!action || !category) {
      return NextResponse.json({
        success: false,
        error: 'Action and category are required'
      }, { status: 400 });
    }

    console.log(`📝 Tracking activity for user: ${userId}, action: ${action}`);

    const activities = loadUserActivity();
    const newActivity: UserActivity = {
      id: uuidv4(),
      user_id: userId,
      action,
      category,
      details,
      ip_address: request.headers.get('x-forwarded-for') || 'unknown',
      user_agent: request.headers.get('user-agent') || 'unknown',
      timestamp: new Date().toISOString(),
      session_id,
    };

    activities.push(newActivity);
    saveUserActivity(activities);

    // Update session if provided
    if (session_id) {
      const sessions = loadUserSessions();
      const sessionIndex = sessions.findIndex(s => s.id === session_id);
      if (sessionIndex !== -1) {
        sessions[sessionIndex].actions_count += 1;
        sessions[sessionIndex].end_time = new Date().toISOString();
        if (sessions[sessionIndex].start_time) {
          const duration = (new Date().getTime() - new Date(sessions[sessionIndex].start_time).getTime()) / (1000 * 60);
          sessions[sessionIndex].duration_minutes = Math.round(duration);
        }
        saveUserSessions(sessions);
      }
    }

    return NextResponse.json({
      success: true,
      data: { activity_id: newActivity.id },
      message: 'Activity tracked successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('❌ Error tracking activity:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to track activity'
    }, { status: 500 });
  }
}

// PUT /api/users/analytics - Start/end user session
export async function PUT(request: NextRequest) {
  try {
    const authResult = await authenticateUser(request);
    if (!authResult.success) {
      return createUnauthorizedResponse(authResult.error);
    }
    const userId = authResult.userId!;

    const body = await request.json();
    const { action, session_id } = body;

    console.log(`🔄 Managing session for user: ${userId}, action: ${action}`);

    const sessions = loadUserSessions();

    if (action === 'start_session') {
      // Start new session
      const userAgent = request.headers.get('user-agent') || 'unknown';
      const deviceType = userAgent.includes('Mobile') ? 'mobile' : 
                        userAgent.includes('Tablet') ? 'tablet' : 'desktop';
      const browser = userAgent.includes('Chrome') ? 'Chrome' :
                     userAgent.includes('Firefox') ? 'Firefox' :
                     userAgent.includes('Safari') ? 'Safari' : 'Unknown';

      const newSession: UserSession = {
        id: uuidv4(),
        user_id: userId,
        start_time: new Date().toISOString(),
        page_views: 1,
        actions_count: 0,
        ip_address: request.headers.get('x-forwarded-for') || 'unknown',
        user_agent: userAgent,
        device_type: deviceType,
        browser: browser,
        created_at: new Date().toISOString(),
      };

      sessions.push(newSession);
      saveUserSessions(sessions);

      return NextResponse.json({
        success: true,
        data: { session_id: newSession.id },
        message: 'Session started successfully'
      });

    } else if (action === 'end_session' && session_id) {
      // End existing session
      const sessionIndex = sessions.findIndex(s => s.id === session_id);
      if (sessionIndex !== -1) {
        const session = sessions[sessionIndex];
        session.end_time = new Date().toISOString();
        if (session.start_time) {
          const duration = (new Date().getTime() - new Date(session.start_time).getTime()) / (1000 * 60);
          session.duration_minutes = Math.round(duration);
        }
        sessions[sessionIndex] = session;
        saveUserSessions(sessions);

        return NextResponse.json({
          success: true,
          data: { session },
          message: 'Session ended successfully'
        });
      } else {
        return NextResponse.json({
          success: false,
          error: 'Session not found'
        }, { status: 404 });
      }
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid action or missing session_id'
    }, { status: 400 });

  } catch (error) {
    console.error('❌ Error managing session:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to manage session'
    }, { status: 500 });
  }
}  