
/**
 * Unified Database Abstraction Layer
 * Provides a consistent interface for data access with automatic fallback
 * Priority: PostgreSQL/Prisma → File Storage
 */

import { join } from 'path';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { appLogger } from '@/lib/logger';

// Database configuration
const USE_SUPABASE = false; // Disabled - using Prisma
const USE_FILES_FALLBACK = true;
const DATA_BASE_DIR = process.env.DATA_DIR || (process.env.VERCEL ? '/tmp/data' : join(process.cwd(), 'data'));

export interface DatabaseConfig {
  useSupabase: boolean;
  useFilesFallback: boolean;
  dataDir: string;
}

export const dbConfig: DatabaseConfig = {
  useSupabase: USE_SUPABASE,
  useFilesFallback: USE_FILES_FALLBACK,
  dataDir: DATA_BASE_DIR,
};

/**
 * Ensure data directory exists
 */
export async function ensureDataDirectory(subDir?: string): Promise<string> {
  const targetDir = subDir ? join(DATA_BASE_DIR, subDir) : DATA_BASE_DIR;
  if (!existsSync(targetDir)) {
    await mkdir(targetDir, { recursive: true });
    appLogger.debug('Created data directory', { path: targetDir });
  }
  return targetDir;
}

/**
 * Generic file-based storage operations
 */
export class FileStorage<T> {
  private filePath: string;

  constructor(fileName: string, subDir?: string) {
    this.filePath = subDir 
      ? join(DATA_BASE_DIR, subDir, fileName)
      : join(DATA_BASE_DIR, fileName);
  }

  async read(): Promise<T[]> {
    try {
      await ensureDataDirectory();
      if (!existsSync(this.filePath)) {
        appLogger.debug('File not found, returning empty array', { path: this.filePath });
        return [];
      }
      const data = await readFile(this.filePath, 'utf-8');
      return JSON.parse(data) as T[];
    } catch (error) {
      appLogger.error(
        'Error reading file',
        error instanceof Error ? error : undefined,
        { path: this.filePath }
      );
      return [];
    }
  }

  async write(data: T[]): Promise<void> {
    try {
      await ensureDataDirectory();
      await writeFile(this.filePath, JSON.stringify(data, null, 2), 'utf-8');
      appLogger.debug('Data written successfully', { path: this.filePath, count: data.length });
    } catch (error) {
      appLogger.error(
        'Error writing file',
        error instanceof Error ? error : undefined,
        { path: this.filePath }
      );
      throw error;
    }
  }

  async append(item: T): Promise<void> {
    const items = await this.read();
    items.push(item);
    await this.write(items);
  }

  async update(predicate: (item: T) => boolean, updater: (item: T) => T): Promise<boolean> {
    const items = await this.read();
    let found = false;
    const updated = items.map(item => {
      if (predicate(item)) {
        found = true;
        return updater(item);
      }
      return item;
    });
    if (found) {
      await this.write(updated);
    }
    return found;
  }

  async delete(predicate: (item: T) => boolean): Promise<boolean> {
    const items = await this.read();
    const filtered = items.filter(item => !predicate(item));
    if (filtered.length !== items.length) {
      await this.write(filtered);
      return true;
    }
    return false;
  }

  exists(): boolean {
    return existsSync(this.filePath);
  }
}

/**
 * UUID validation utility
 */
export function isValidUuid(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(value);
}

/**
 * Generate a simple UUID v4
 */
export function generateUuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Safe JSON parse with fallback
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}
