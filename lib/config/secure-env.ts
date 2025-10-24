/**
 * Secure Environment Configuration
 * Centralized, validated environment variable management
 */

import { z } from 'zod';

// Environment validation schemas
const ServerEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  
  // Supabase Configuration (Server-side only)
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'SUPABASE_SERVICE_ROLE_KEY is required'),
  
  // API Keys (Server-side only)
  OPENAI_API_KEY: z.string().optional(),
  
  // Security Configuration
  NEXTAUTH_SECRET: z.string().min(32, 'NEXTAUTH_SECRET must be at least 32 characters'),
  ENCRYPTION_KEY: z.string().length(32, 'ENCRYPTION_KEY must be exactly 32 characters').optional(),
  
  // Feature Flags (Server-side only)
  BYPASS_AUTHENTICATION: z.enum(['true', 'false']).default('false'),
  ENABLE_FILE_STORAGE_FALLBACK: z.enum(['true', 'false']).default('false'),
  
  // Rate Limiting
  RATE_LIMIT_MAX: z.coerce.number().default(100),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900000), // 15 minutes
});

const PublicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('NEXT_PUBLIC_SUPABASE_URL must be a valid URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'NEXT_PUBLIC_SUPABASE_ANON_KEY is required'),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
});

// Validate and export server environment
function validateServerEnv() {
  try {
    return ServerEnvSchema.parse(process.env);
  } catch (error) {
    console.warn('⚠️ Server environment validation failed, using defaults:', error);
    // Return safe defaults for build time
    return {
      NODE_ENV: process.env.NODE_ENV || 'development',
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || 'default-build-secret',
      ENCRYPTION_KEY: process.env.ENCRYPTION_KEY || 'default-build-key-32-characters',
      BYPASS_AUTHENTICATION: (process.env.BYPASS_AUTHENTICATION?.trim() || 'false') as 'true' | 'false',
      ENABLE_FILE_STORAGE_FALLBACK: (process.env.ENABLE_FILE_STORAGE_FALLBACK?.trim() || 'false') as 'true' | 'false',
      RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX || '100'),
      RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
    };
  }
}

// Validate and export public environment
function validatePublicEnv() {
  try {
    return PublicEnvSchema.parse(process.env);
  } catch (error) {
    console.warn('⚠️ Public environment validation failed, using defaults:', error);
    // Return safe defaults for build time
    return {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key',
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    };
  }
}

// Server-side environment (never exposed to client)
export const serverEnv = validateServerEnv();

// Public environment (safe to expose to client)
export const publicEnv = validatePublicEnv();

// Environment utilities
export const isProduction = serverEnv.NODE_ENV === 'production';
export const isDevelopment = serverEnv.NODE_ENV === 'development';
export const isStaging = serverEnv.NODE_ENV === 'staging';

// Security utilities
export function requireServerEnv(): typeof serverEnv {
  if (typeof window !== 'undefined') {
    throw new Error('Server environment accessed on client side');
  }
  return serverEnv;
}

export function getSecureConfig() {
  const env = requireServerEnv();
  
  return {
    // Database
    supabase: {
      url: publicEnv.NEXT_PUBLIC_SUPABASE_URL,
      anonKey: publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
    },
    
    // Authentication
    auth: {
      secret: env.NEXTAUTH_SECRET,
      bypassEnabled: env.BYPASS_AUTHENTICATION === 'true' && isDevelopment,
    },
    
    // Security
    security: {
      encryptionKey: env.ENCRYPTION_KEY,
      rateLimit: {
        max: env.RATE_LIMIT_MAX,
        windowMs: env.RATE_LIMIT_WINDOW_MS,
      },
    },
    
    // Features
    features: {
      fileStorageFallback: env.ENABLE_FILE_STORAGE_FALLBACK === 'true',
    },
    
    // External APIs
    apis: {
      openai: env.OPENAI_API_KEY,
    },
  };
}

// Type exports
export type ServerEnv = z.infer<typeof ServerEnvSchema>;
export type PublicEnv = z.infer<typeof PublicEnvSchema>;
export type SecureConfig = ReturnType<typeof getSecureConfig>;
