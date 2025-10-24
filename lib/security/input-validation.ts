// @ts-nocheck
/**
 * Input Validation and Sanitization
 * Comprehensive validation and XSS prevention
 */

import { z } from 'zod';
import DOMPurify from 'isomorphic-dompurify';
import validator from 'validator';

// Custom validation schemas
const SafeStringSchema = z.string().refine(
  (val) => !/<script|javascript:|data:|vbscript:|on\w+=/i.test(val),
  { message: 'Potentially dangerous content detected' }
);

const SafeUrlSchema = z.string().refine(
  (val) => {
    try {
      const url = new URL(val);
      return ['http:', 'https:'].includes(url.protocol) && 
             !val.includes('javascript:') && 
             !val.includes('data:') &&
             !val.includes('vbscript:');
    } catch {
      return false;
    }
  },
  { message: 'Invalid or unsafe URL' }
);

// Bookmark validation schemas
export const CreateBookmarkSchema = z.object({
  title: SafeStringSchema.min(1, 'Title is required').max(200, 'Title too long'),
  url: SafeUrlSchema,
  description: SafeStringSchema.max(1000, 'Description too long').optional(),
  category: SafeStringSchema.max(50, 'Category too long').optional(),
  tags: z.array(SafeStringSchema.max(30, 'Tag too long')).max(20, 'Too many tags').optional(),
  notes: SafeStringSchema.max(2000, 'Notes too long').optional(),
  is_favorite: z.boolean().optional(),
  folder_id: z.string().uuid('Invalid folder ID').optional(),
});

export const UpdateBookmarkSchema = CreateBookmarkSchema.partial().extend({
  id: z.number().positive('Invalid bookmark ID'),
});

export const BookmarkQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(100).optional(),
  offset: z.coerce.number().min(0).optional(),
  category: SafeStringSchema.max(50).optional(),
  search: SafeStringSchema.max(100).optional(),
  folder_id: z.string().uuid().optional(),
});

// File upload validation
export const FileUploadSchema = z.object({
  name: z.string().min(1, 'Filename is required'),
  size: z.number().max(5 * 1024 * 1024, 'File too large (max 5MB)'),
  type: z.enum([
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/webp',
    'image/gif'
  ], { errorMap: () => ({ message: 'Invalid file type' }) }),
});

// User input validation
export const UserInputSchema = z.object({
  email: z.string().email('Invalid email format'),
  name: SafeStringSchema.min(1, 'Name is required').max(100, 'Name too long'),
  bio: SafeStringSchema.max(500, 'Bio too long').optional(),
});

// Sanitization functions
export class InputSanitizer {
  /**
   * Sanitize HTML content to prevent XSS
   */
  static sanitizeHtml(input: string): string {
    return DOMPurify.sanitize(input, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
      ALLOWED_ATTR: [],
      KEEP_CONTENT: true,
    });
  }

  /**
   * Sanitize plain text input
   */
  static sanitizeText(input: string): string {
    return validator.escape(input.trim());
  }

  /**
   * Sanitize and validate URL
   */
  static sanitizeUrl(input: string): string | null {
    try {
      const url = new URL(input.trim());
      
      // Only allow HTTP/HTTPS protocols
      if (!['http:', 'https:'].includes(url.protocol)) {
        return null;
      }

      // Block dangerous protocols and schemes
      if (input.includes('javascript:') || 
          input.includes('data:') || 
          input.includes('vbscript:')) {
        return null;
      }

      return url.toString();
    } catch {
      return null;
    }
  }

  /**
   * Sanitize filename for safe storage
   */
  static sanitizeFilename(filename: string): string {
    // Remove path traversal attempts
    const baseName = filename.replace(/^.*[\\\/]/, '');
    
    // Allow only safe characters
    return baseName.replace(/[^a-zA-Z0-9.-_]/g, '').substring(0, 100);
  }

  /**
   * Sanitize search query
   */
  static sanitizeSearchQuery(query: string): string {
    return query
      .trim()
      .replace(/[<>'"&]/g, '') // Remove potentially dangerous characters
      .substring(0, 100); // Limit length
  }

  /**
   * Sanitize tag input
   */
  static sanitizeTags(tags: string[]): string[] {
    return tags
      .map(tag => tag.trim().toLowerCase())
      .filter(tag => tag.length > 0 && tag.length <= 30)
      .filter(tag => /^[a-zA-Z0-9-_\s]+$/.test(tag)) // Only allow safe characters
      .slice(0, 20); // Limit number of tags
  }
}

// Validation middleware helper
export function validateInput<T>(schema: z.ZodSchema<T>, input: unknown): {
  success: boolean;
  data?: T;
  errors?: string[];
} {
  try {
    const result = schema.safeParse(input);
    
    if (result.success) {
      return { success: true, data: result.data };
    } else {
      return {
        success: false,
        errors: result.error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
      };
    }
  } catch (error) {
    return {
      success: false,
      errors: ['Validation failed: Invalid input format']
    };
  }
}

// Rate limiting validation
export const RateLimitSchema = z.object({
  ip: z.string().ip('Invalid IP address'),
  endpoint: z.string().min(1, 'Endpoint is required'),
  timestamp: z.number().positive('Invalid timestamp'),
});

// API request validation
export function validateApiRequest(request: Request): {
  isValid: boolean;
  errors: string[];
  sanitizedData?: any;
} {
  const errors: string[] = [];
  
  // Check Content-Type for POST/PUT requests
  if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
    const contentType = request.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      errors.push('Invalid Content-Type. Expected application/json');
    }
  }

  // Check for required headers
  const userAgent = request.headers.get('user-agent');
  if (!userAgent) {
    errors.push('User-Agent header is required');
  }

  // Validate request size (approximate)
  const contentLength = request.headers.get('content-length');
  if (contentLength && parseInt(contentLength) > 1024 * 1024) { // 1MB limit
    errors.push('Request payload too large');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Export validation schemas for reuse
export {
  SafeStringSchema,
  SafeUrlSchema,
};
