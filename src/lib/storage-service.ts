// @ts-nocheck
const GITHUB_OWNER = process.env.NEXT_PUBLIC_GH_OWNER!
const GITHUB_REPO = process.env.NEXT_PUBLIC_GH_REPO!
const GITHUB_BRANCH = process.env.NEXT_PUBLIC_GH_BRANCH ?? 'main'
const GITHUB_TOKEN = process.env.GITHUB_TOKEN // server-side only

// File storage configuration
const FILE_STORAGE_ENABLED = process.env.ENABLE_FILE_STORAGE_FALLBACK === 'true'

interface TriStoreOptions<T> {
  userId: string
  key: string // e.g. 'auto_processing'
  supabaseTable: string // e.g. 'linkpilot_settings'
  defaultValue: T
}

/**
 * File-based storage utilities for server-side persistence
 */
async function writeToFile<T>(userId: string, key: string, value: T): Promise<boolean> {
  if (!FILE_STORAGE_ENABLED || typeof window !== 'undefined') {
    return false
  }
  try {
    const { writeSettingToFile } = await // TODO: Migrate to PostgreSQL/Prisma - Supabase imports removed
import('./file-storage-server')
    await writeSettingToFile(userId, key, value)
    console.log(`✅ Settings saved to file: ${userId}/${key}`)
    return true
  } catch (error) {
    console.error('❌ File storage failed:', error)
    return false
  }
}

async function readFromFile<T>(userId: string, key: string): Promise<T | null> {
  if (!FILE_STORAGE_ENABLED || typeof window !== 'undefined') {
    return null
  }
  try {
    const { readSettingFromFile } = await import('./file-storage-server')
    return await readSettingFromFile<T>(userId, key)
  } catch {
    return null
  }
}

/**
 * Read the setting in priority: Supabase → GitHub → File → localStorage (client).
 */
export async function readTriStore<T = unknown>({
  userId,
  key,
  supabaseTable,
  defaultValue,
}: TriStoreOptions<T>): Promise<T> {
  // 1. Supabase
  try {
    const { data, error } = await supabase
      .from(supabaseTable)
      .select(key)
      .eq('user_id', userId)
      .single()

    if (!error && data && data[key]) {
      // keep copies downstream
      if (typeof window !== 'undefined') {
        localStorage.setItem(key, JSON.stringify(data[key]))
      }
      return data[key] as T
    }
  } catch (error) {
    console.warn(`Supabase read failed for ${key}:`, error)
  }

  // 2. GitHub (server-only)
  if (GITHUB_TOKEN && typeof window === 'undefined') {
    try {
      const path = `config/${key}/${userId}.json`
      const res = await fetch(
        `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}?ref=${GITHUB_BRANCH}`,
        {
          headers: {
            Authorization: `Bearer ${GITHUB_TOKEN}`,
            Accept: 'application/vnd.github.v3.raw',
          },
        },
      )
      if (res.ok) {
        const json = (await res.json()) as T
        if (typeof window !== 'undefined') {
          localStorage.setItem(key, JSON.stringify(json))
        }
        return json
      }
    } catch (error) {
      console.warn(`GitHub read failed for ${key}:`, error)
    }
  }

  // 3. File storage (server-only)
  if (FILE_STORAGE_ENABLED && typeof window === 'undefined') {
    try {
      const fileData = await readFromFile<T>(userId, key)
      if (fileData !== null) {
        return fileData
      }
    } catch (error) {
      console.warn(`File read failed for ${key}:`, error)
    }
  }

  // 4. localStorage (client only)
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(key)
      if (raw) return JSON.parse(raw)
    } catch (error) {
      console.warn(`localStorage read failed for ${key}:`, error)
    }
  }

  return defaultValue
}

/**
 * Write to Supabase → GitHub → File → localStorage with proper error handling.
 */
export async function writeTriStore<T = unknown>({
  userId,
  key,
  supabaseTable,
  value,
}: TriStoreOptions<T> & { value: T }) {
  const errors: string[] = []
  let successCount = 0

  // 1. Supabase
  try {
    const { error } = await supabase.from(supabaseTable).upsert({ user_id: userId, [key]: value })
    if (error) {
      throw error
    }
    console.log(`✅ Settings saved to Supabase: ${key}`)
    successCount++
  } catch (error) {
    const message = `Supabase write failed for ${key}: ${error}`
    console.warn(message)
    errors.push(message)
  }

  // 2. GitHub (server-side only)
  if (GITHUB_TOKEN && typeof window === 'undefined') {
    try {
      const path = `config/${key}/${userId}.json`
      const content = Buffer.from(JSON.stringify(value, null, 2)).toString('base64')
      
      const response = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `chore: update ${key} for ${userId}`,
          content,
          branch: GITHUB_BRANCH,
        }),
      })

      if (!response.ok) {
        throw new Error(`GitHub API returned ${response.status}`)
      }
      
      console.log(`✅ Settings saved to GitHub: ${key}`)
      successCount++
    } catch (error) {
      const message = `GitHub write failed for ${key}: ${error}`
      console.warn(message)
      errors.push(message)
    }
  }

  // 3. File storage (server-side only)
  if (FILE_STORAGE_ENABLED && typeof window === 'undefined') {
    try {
      const fileSuccess = await writeToFile(userId, key, value)
      if (fileSuccess) {
        successCount++
      } else {
        errors.push(`File write failed for ${key}`)
      }
    } catch (error) {
      const message = `File write failed for ${key}: ${error}`
      console.warn(message)
      errors.push(message)
    }
  }

  // 4. localStorage (client only) - ALWAYS attempt this as last resort
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(key, JSON.stringify(value))
      console.log(`✅ Settings saved to localStorage: ${key}`)
      successCount++
    } catch (error) {
      const message = `localStorage write failed for ${key}: ${error}`
      console.warn(message)
      errors.push(message)
    }
  }

  // Log results
  if (successCount === 0) {
    console.error(`❌ All storage methods failed for ${key}:`, errors)
    throw new Error(`Failed to save settings: ${errors.join(', ')}`)
  } else {
    console.log(`✅ Settings saved successfully to ${successCount} storage locations for ${key}`)
  }
} 