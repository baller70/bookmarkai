'use server'

import { promises as fs } from 'fs'
import path from 'path'

// Directory where settings files will be saved
const FILE_STORAGE_PATH = process.env.FILE_STORAGE_PATH || './data'

/**
 * Ensure a directory exists (recursive).
 */
async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true })
}

/**
 * Write a JSON serialisable value to disk under data/settings/<userId>/<key>.json
 */
export async function writeSettingToFile<T>(userId: string, key: string, value: T): Promise<void> {
  const settingsDir = path.join(FILE_STORAGE_PATH, 'settings', userId)
  await ensureDir(settingsDir)
  const filePath = path.join(settingsDir, `${key}.json`)
  await fs.writeFile(filePath, JSON.stringify(value, null, 2))
}

/**
 * Read a previously stored value from disk. Returns null if the file does not exist or cannot be parsed.
 */
export async function readSettingFromFile<T>(userId: string, key: string): Promise<T | null> {
  try {
    const filePath = path.join(FILE_STORAGE_PATH, 'settings', userId, `${key}.json`)
    const file = await fs.readFile(filePath, 'utf8')
    return JSON.parse(file) as T
  } catch {
    return null
  }
} 