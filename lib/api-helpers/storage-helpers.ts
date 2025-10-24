
/**
 * Storage Helper Utilities
 * Centralized helpers for file and database storage operations
 */

import { createLogger } from '@/lib/logger';
import { createClient } from '@supabase/supabase-js';
import { writeFile, readFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';

const logger = createLogger('storage-helpers');

// Storage configuration
const CWD = process.cwd();
const DATA_DIR_PRIMARY = join(CWD, 'data');
const DATA_DIR_ALT = join(CWD, '..', '..', 'data');
const DATA_DIR = existsSync(DATA_DIR_PRIMARY) ? DATA_DIR_PRIMARY : DATA_DIR_ALT;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

export const USE_SUPABASE = !!(
  supabaseUrl &&
  supabaseKey &&
  !supabaseUrl.includes('placeholder') &&
  !supabaseKey.includes('placeholder') &&
  !supabaseKey.includes('dev-placeholder-service-key')
);

/**
 * Get Supabase client (anon key)
 */
export function getSupabaseClient() {
  if (!USE_SUPABASE || !supabaseUrl || !supabaseKey) return null;
  return createClient(supabaseUrl, supabaseKey);
}

/**
 * Get Supabase admin client (service role key)
 */
export function getSupabaseAdminClient() {
  if (!USE_SUPABASE || !supabaseUrl || !serviceRoleKey) return null;
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
}

/**
 * Get write client (admin if available, otherwise anon)
 */
export function getWriteClient() {
  return getSupabaseAdminClient() ?? getSupabaseClient();
}

/**
 * Ensure data directory exists
 */
export async function ensureDataDirectory(subDir?: string): Promise<string> {
  try {
    const targetDir = subDir ? join(DATA_DIR, subDir) : DATA_DIR;
    if (!existsSync(targetDir)) {
      await mkdir(targetDir, { recursive: true });
      logger.info(`Created data directory: ${targetDir}`);
    }
    return targetDir;
  } catch (error) {
    logger.error('Failed to create data directory', error as Error);
    throw error;
  }
}

/**
 * Load data from JSON file
 */
export async function loadJsonFile<T>(filename: string, defaultValue: T): Promise<T> {
  try {
    const filePath = join(DATA_DIR, filename);
    if (!existsSync(filePath)) {
      logger.info(`File not found, using default: ${filename}`);
      return defaultValue;
    }
    const content = await readFile(filePath, 'utf-8');
    return JSON.parse(content || JSON.stringify(defaultValue));
  } catch (error) {
    logger.warn(`Failed to load ${filename}, using default`, { error: (error as Error).message });
    return defaultValue;
  }
}

/**
 * Save data to JSON file
 */
export async function saveJsonFile<T>(filename: string, data: T): Promise<void> {
  try {
    await ensureDataDirectory();
    const filePath = join(DATA_DIR, filename);
    await writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
    logger.info(`Saved data to ${filename}`);
  } catch (error) {
    logger.error(`Failed to save ${filename}`, error as Error);
    throw error;
  }
}

/**
 * Check if value is a valid UUID
 */
export function isUuid(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(value);
}

/**
 * Get file path for a resource
 */
export function getFilePath(filename: string): string {
  const primary = join(DATA_DIR_PRIMARY, filename);
  const alt = join(DATA_DIR_ALT, filename);
  return existsSync(primary) ? primary : alt;
}

/**
 * Load priority map from file
 */
export async function loadPriorityMap(): Promise<Record<string, 'low' | 'medium' | 'high'>> {
  return loadJsonFile('bookmark-priority.json', {});
}

/**
 * Save priority map to file
 */
export async function savePriorityMap(map: Record<string, 'low' | 'medium' | 'high'>): Promise<void> {
  return saveJsonFile('bookmark-priority.json', map);
}

/**
 * Set priority for a specific bookmark ID
 */
export async function setPriorityForId(id: string | number, level: 'low' | 'medium' | 'high'): Promise<void> {
  const map = await loadPriorityMap();
  map[String(id)] = level;
  await savePriorityMap(map);
}

/**
 * Get priority for a specific bookmark ID
 */
export async function getPriorityForId(id: string | number): Promise<'low' | 'medium' | 'high' | undefined> {
  const map = await loadPriorityMap();
  return map[String(id)];
}

/**
 * Load data from file by resource name
 */
export async function loadFromFile(resource: string): Promise<any[]> {
  const filename = `${resource}.json`;
  return loadJsonFile(filename, []);
}

/**
 * Save data to file by resource name
 */
export async function saveToFile(resource: string, data: any[]): Promise<void> {
  const filename = `${resource}.json`;
  return saveJsonFile(filename, data);
}

// Export unified storage helpers object
export const storageHelpers = {
  supabase: getSupabaseClient(),
  adminSupabase: getSupabaseAdminClient(),
  writeClient: getWriteClient(),
  USE_SUPABASE,
  USE_FILES_FALLBACK: true,
  isUuid,
  loadPriorityMap,
  savePriorityMap,
  setPriorityForId,
  getPriorityForId,
  loadFromFile,
  saveToFile,
  loadJsonFile,
  saveJsonFile,
  ensureDataDirectory,
  getFilePath
};
