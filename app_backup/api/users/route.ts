import { NextRequest, NextResponse } from 'next/server';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { authenticateUser, createUnauthorizedResponse } from '@/lib/auth-utils';

// File-based storage paths
const USERS_DIR = join(process.cwd(), 'apps/web/data/users');
const USERS_FILE = join(USERS_DIR, 'users.json');

// User data interfaces
interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  username?: string;
  avatar_url?: string;
  bio?: string;
  website?: string;
  location?: string;
  timezone?: string;
  language?: string;
  theme?: 'light' | 'dark' | 'system';
  created_at: string;
  updated_at: string;
  last_login?: string;
  email_verified: boolean;
  phone?: string;
  phone_verified: boolean;
  two_factor_enabled: boolean;
  notification_preferences: {
    email_notifications: boolean;
    push_notifications: boolean;
    marketing_emails: boolean;
    product_updates: boolean;
    security_alerts: boolean;
  };
  privacy_settings: {
    profile_visibility: 'public' | 'private' | 'friends';
    data_sharing: boolean;
    analytics_tracking: boolean;
    personalized_ads: boolean;
  };
  subscription: {
    plan: 'free' | 'pro' | 'enterprise';
    status: 'active' | 'cancelled' | 'expired' | 'trial';
    trial_ends_at?: string;
    billing_cycle?: 'monthly' | 'yearly';
    next_billing_date?: string;
    features: string[];
  };
  usage_stats: {
    bookmarks_count: number;
    categories_count: number;
    tags_count: number;
    ai_processing_count: number;
    storage_used_mb: number;
    api_calls_count: number;
  };
  preferences: {
    default_category?: string;
    auto_categorization: boolean;
    auto_tagging: boolean;
    ai_suggestions: boolean;
    duplicate_detection: boolean;
    bookmark_sync: boolean;
    export_format: 'json' | 'csv' | 'html';
    items_per_page: number;
    sort_order: 'newest' | 'oldest' | 'alphabetical' | 'most_visited';
  };
}

// Ensure data directory exists
function ensureDataDirectory() {
  if (!existsSync(USERS_DIR)) {
    const { mkdirSync } = require('fs');
    mkdirSync(USERS_DIR, { recursive: true });
  }
}

// Load users data
function loadUsers(): UserProfile[] {
  ensureDataDirectory();
  if (!existsSync(USERS_FILE)) {
    return [];
  }
  try {
    const data = readFileSync(USERS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading users:', error);
    return [];
  }
}

// Save users data
function saveUsers(users: UserProfile[]) {
  ensureDataDirectory();
  try {
    writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
  } catch (error) {
    console.error('Error saving users:', error);
    throw new Error('Failed to save users data');
  }
}

// Create default user profile
function createDefaultProfile(userId: string, email: string): UserProfile {
  return {
    id: userId,
    email,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    email_verified: false,
    phone_verified: false,
    two_factor_enabled: false,
    notification_preferences: {
      email_notifications: true,
      push_notifications: true,
      marketing_emails: false,
      product_updates: true,
      security_alerts: true,
    },
    privacy_settings: {
      profile_visibility: 'private',
      data_sharing: false,
      analytics_tracking: true,
      personalized_ads: false,
    },
    subscription: {
      plan: 'free',
      status: 'active',
      features: ['basic_bookmarks', 'basic_categories', 'basic_search'],
    },
    usage_stats: {
      bookmarks_count: 0,
      categories_count: 0,
      tags_count: 0,
      ai_processing_count: 0,
      storage_used_mb: 0,
      api_calls_count: 0,
    },
    preferences: {
      auto_categorization: true,
      auto_tagging: true,
      ai_suggestions: true,
      duplicate_detection: true,
      bookmark_sync: true,
      export_format: 'json',
      items_per_page: 20,
      sort_order: 'newest',
    },
  };
}

// GET /api/users - Get user profile
export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateUser(request);
    if (!authResult.success) {
      return createUnauthorizedResponse(authResult.error);
    }
    
    const userId = authResult.userId!;
    const { searchParams } = new URL(request.url);
    const include = searchParams.get('include')?.split(',') || [];

    console.log(`📋 Getting user profile for: ${userId}`);

    const users = loadUsers();
    let user = users.find(u => u.id === userId);

    // Create default profile if user doesn't exist
    if (!user) {
      console.log(`👤 Creating new user profile for: ${userId}`);
      user = createDefaultProfile(userId, `${userId}@example.com`);
      users.push(user);
      saveUsers(users);
    }

    // Filter response based on include parameters
    const response: any = { ...user };

    if (include.length > 0) {
      const filteredResponse: any = {
        id: user.id,
        email: user.email,
        updated_at: user.updated_at,
      };

      include.forEach(field => {
        if (field in user) {
          filteredResponse[field] = (user as any)[field];
        }
      });

      return NextResponse.json({
        success: true,
        data: filteredResponse,
        message: 'User profile retrieved successfully'
      });
    }

    return NextResponse.json({
      success: true,
      data: response,
      message: 'User profile retrieved successfully'
    });

  } catch (error) {
    console.error('❌ Error getting user profile:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to get user profile'
    }, { status: 500 });
  }
}

// POST /api/users - Create new user profile
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, full_name, username } = body;

    if (!email) {
      return NextResponse.json({
        success: false,
        error: 'Email is required'
      }, { status: 400 });
    }

    console.log(`👤 Creating new user profile for: ${email}`);

    const users = loadUsers();
    const existingUser = users.find(u => u.email === email);

    if (existingUser) {
      return NextResponse.json({
        success: false,
        error: 'User with this email already exists'
      }, { status: 409 });
    }

    // Check username uniqueness if provided
    if (username) {
      const existingUsername = users.find(u => u.username === username);
      if (existingUsername) {
        return NextResponse.json({
          success: false,
          error: 'Username already taken'
        }, { status: 409 });
      }
    }

    const userId = uuidv4();
    const newUser = createDefaultProfile(userId, email);

    // Update with provided data
    if (full_name) newUser.full_name = full_name;
    if (username) newUser.username = username;

    users.push(newUser);
    saveUsers(users);

    return NextResponse.json({
      success: true,
      data: newUser,
      message: 'User profile created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('❌ Error creating user profile:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to create user profile'
    }, { status: 500 });
  }
}

// PUT /api/users - Update user profile
export async function PUT(request: NextRequest) {
  try {
    const authResult = await authenticateUser(request);
    if (!authResult.success) {
      return createUnauthorizedResponse(authResult.error);
    }
    
    const userId = authResult.userId!;
    const body = await request.json();
    const { user_id, ...updates } = body;

    console.log(`✏️ Updating user profile for: ${userId}`);

    const users = loadUsers();
    const userIndex = users.findIndex(u => u.id === userId);

    if (userIndex === -1) {
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 404 });
    }

    // Validate username uniqueness if being updated
    if (updates.username) {
      const existingUsername = users.find(u => u.username === updates.username && u.id !== userId);
      if (existingUsername) {
        return NextResponse.json({
          success: false,
          error: 'Username already taken'
        }, { status: 409 });
      }
    }

    // Update user profile
    const updatedUser = {
      ...users[userIndex],
      ...updates,
      updated_at: new Date().toISOString(),
    };

    // Merge nested objects properly
    if (updates.notification_preferences) {
      updatedUser.notification_preferences = {
        ...users[userIndex].notification_preferences,
        ...updates.notification_preferences,
      };
    }

    if (updates.privacy_settings) {
      updatedUser.privacy_settings = {
        ...users[userIndex].privacy_settings,
        ...updates.privacy_settings,
      };
    }

    if (updates.preferences) {
      updatedUser.preferences = {
        ...users[userIndex].preferences,
        ...updates.preferences,
      };
    }

    users[userIndex] = updatedUser;
    saveUsers(users);

    return NextResponse.json({
      success: true,
      data: updatedUser,
      message: 'User profile updated successfully'
    });

  } catch (error) {
    console.error('❌ Error updating user profile:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to update user profile'
    }, { status: 500 });
  }
}

// DELETE /api/users - Delete user profile (soft delete)
export async function DELETE(request: NextRequest) {
  try {
    const authResult = await authenticateUser(request);
    if (!authResult.success) {
      return createUnauthorizedResponse(authResult.error);
    }
    
    const userId = authResult.userId!;
    const { searchParams } = new URL(request.url);
    const hard_delete = searchParams.get('hard_delete') === 'true';

    console.log(`🗑️ ${hard_delete ? 'Hard' : 'Soft'} deleting user: ${userId}`);

    const users = loadUsers();
    const userIndex = users.findIndex(u => u.id === userId);

    if (userIndex === -1) {
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 404 });
    }

    if (hard_delete) {
      // Hard delete - remove completely
      users.splice(userIndex, 1);
    } else {
      // Soft delete - mark as deleted
      users[userIndex] = {
        ...users[userIndex],
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as any;
    }

    saveUsers(users);

    return NextResponse.json({
      success: true,
      message: `User ${hard_delete ? 'permanently deleted' : 'deactivated'} successfully`
    });

  } catch (error) {
    console.error('❌ Error deleting user:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to delete user'
    }, { status: 500 });
  }
}  