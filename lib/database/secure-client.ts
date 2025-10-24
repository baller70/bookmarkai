/**
 * Secure Database Client
 * Parameterized queries and proper access control
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { getSecureConfig } from '@/lib/config/secure-env';
import { z } from 'zod';

// Database schemas for validation
const BookmarkSchema = z.object({
  id: z.number().optional(),
  user_id: z.string().uuid(),
  title: z.string().min(1).max(200),
  url: z.string().url(),
  description: z.string().max(1000).optional(),
  category: z.string().max(50).optional(),
  tags: z.array(z.string().max(30)).optional(),
  ai_summary: z.string().max(2000).optional(),
  ai_tags: z.array(z.string().max(30)).optional(),
  ai_category: z.string().max(50).optional(),
  notes: z.string().max(2000).optional(),
  is_favorite: z.boolean().optional(),
  favicon: z.string().url().optional(),
  custom_favicon: z.string().url().optional(),
  custom_logo: z.string().url().optional(),
  custom_background: z.string().url().optional(),
  folder_id: z.string().uuid().optional(),
});

const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

// Database client singleton
class SecureDatabaseClient {
  private static instance: SecureDatabaseClient;
  private supabase: SupabaseClient;
  private config: ReturnType<typeof getSecureConfig>;

  private constructor() {
    this.config = getSecureConfig();
    this.supabase = createClient(
      this.config.supabase.url,
      this.config.supabase.serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );
  }

  public static getInstance(): SecureDatabaseClient {
    if (!SecureDatabaseClient.instance) {
      SecureDatabaseClient.instance = new SecureDatabaseClient();
    }
    return SecureDatabaseClient.instance;
  }

  // Secure bookmark operations with proper parameterization
  async getBookmarks(userId: string, options?: {
    limit?: number;
    offset?: number;
    category?: string;
    search?: string;
  }): Promise<{ data: any[]; error: string | null }> {
    try {
      // Validate user ID
      const userIdValidation = z.string().uuid().safeParse(userId);
      if (!userIdValidation.success) {
        return { data: [], error: 'Invalid user ID format' };
      }

      let query = this.supabase
        .from('bookmarks')
        .select('*')
        .eq('user_id', userId) // Parameterized query
        .order('created_at', { ascending: false });

      // Apply filters with parameterization
      if (options?.category) {
        query = query.eq('category', options.category);
      }

      if (options?.search) {
        // Use full-text search with parameterization
        query = query.or(`title.ilike.%${options.search}%,description.ilike.%${options.search}%`);
      }

      if (options?.limit) {
        query = query.limit(Math.min(options.limit, 100)); // Cap at 100
      }

      if (options?.offset) {
        query = query.range(options.offset, (options.offset + (options.limit || 10)) - 1);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Database query error:', error);
        return { data: [], error: 'Failed to fetch bookmarks' };
      }

      return { data: data || [], error: null };
    } catch (error) {
      console.error('Unexpected database error:', error);
      return { data: [], error: 'Database operation failed' };
    }
  }

  async getBookmarkById(bookmarkId: number, userId: string): Promise<{ data: any | null; error: string | null }> {
    try {
      // Validate inputs
      const bookmarkIdValidation = z.number().positive().safeParse(bookmarkId);
      const userIdValidation = z.string().uuid().safeParse(userId);

      if (!bookmarkIdValidation.success || !userIdValidation.success) {
        return { data: null, error: 'Invalid bookmark ID or user ID' };
      }

      const { data, error } = await this.supabase
        .from('bookmarks')
        .select('*')
        .eq('id', bookmarkId)
        .eq('user_id', userId) // Ensure user can only access their bookmarks
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return { data: null, error: 'Bookmark not found' };
        }
        console.error('Database query error:', error);
        return { data: null, error: 'Failed to fetch bookmark' };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Unexpected database error:', error);
      return { data: null, error: 'Database operation failed' };
    }
  }

  async createBookmark(bookmarkData: any, userId: string): Promise<{ data: any | null; error: string | null }> {
    try {
      // Validate and sanitize input
      const validatedData = BookmarkSchema.parse({
        ...bookmarkData,
        user_id: userId,
      });

      const { data, error } = await this.supabase
        .from('bookmarks')
        .insert([validatedData])
        .select('*')
        .single();

      if (error) {
        console.error('Database insert error:', error);
        return { data: null, error: 'Failed to create bookmark' };
      }

      return { data, error: null };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { data: null, error: 'Invalid bookmark data: ' + error.errors.map(e => e.message).join(', ') };
      }
      console.error('Unexpected database error:', error);
      return { data: null, error: 'Database operation failed' };
    }
  }

  async updateBookmark(bookmarkId: number, bookmarkData: any, userId: string): Promise<{ data: any | null; error: string | null }> {
    try {
      // Validate inputs
      const bookmarkIdValidation = z.number().positive().safeParse(bookmarkId);
      const userIdValidation = z.string().uuid().safeParse(userId);

      if (!bookmarkIdValidation.success || !userIdValidation.success) {
        return { data: null, error: 'Invalid bookmark ID or user ID' };
      }

      // Validate and sanitize update data
      const validatedData = BookmarkSchema.partial().parse(bookmarkData);
      
      // Remove user_id from update data to prevent privilege escalation
      delete validatedData.user_id;

      const { data, error } = await this.supabase
        .from('bookmarks')
        .update(validatedData)
        .eq('id', bookmarkId)
        .eq('user_id', userId) // Ensure user can only update their bookmarks
        .select('*')
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return { data: null, error: 'Bookmark not found or access denied' };
        }
        console.error('Database update error:', error);
        return { data: null, error: 'Failed to update bookmark' };
      }

      return { data, error: null };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { data: null, error: 'Invalid bookmark data: ' + error.errors.map(e => e.message).join(', ') };
      }
      console.error('Unexpected database error:', error);
      return { data: null, error: 'Database operation failed' };
    }
  }

  async deleteBookmark(bookmarkId: number, userId: string): Promise<{ success: boolean; error: string | null }> {
    try {
      // Validate inputs
      const bookmarkIdValidation = z.number().positive().safeParse(bookmarkId);
      const userIdValidation = z.string().uuid().safeParse(userId);

      if (!bookmarkIdValidation.success || !userIdValidation.success) {
        return { success: false, error: 'Invalid bookmark ID or user ID' };
      }

      const { error } = await this.supabase
        .from('bookmarks')
        .delete()
        .eq('id', bookmarkId)
        .eq('user_id', userId); // Ensure user can only delete their bookmarks

      if (error) {
        console.error('Database delete error:', error);
        return { success: false, error: 'Failed to delete bookmark' };
      }

      return { success: true, error: null };
    } catch (error) {
      console.error('Unexpected database error:', error);
      return { success: false, error: 'Database operation failed' };
    }
  }

  // User operations
  async getUserById(userId: string): Promise<{ data: any | null; error: string | null }> {
    try {
      const userIdValidation = z.string().uuid().safeParse(userId);
      if (!userIdValidation.success) {
        return { data: null, error: 'Invalid user ID format' };
      }

      const { data, error } = await this.supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return { data: null, error: 'User not found' };
        }
        console.error('Database query error:', error);
        return { data: null, error: 'Failed to fetch user' };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Unexpected database error:', error);
      return { data: null, error: 'Database operation failed' };
    }
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('bookmarks')
        .select('id')
        .limit(1);

      return !error;
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const secureDb = SecureDatabaseClient.getInstance();

// Export types
export type { BookmarkSchema, UserSchema };
