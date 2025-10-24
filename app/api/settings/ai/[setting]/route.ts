import { NextRequest, NextResponse } from 'next/server'
import { writeFile, readFile, mkdir } from 'fs/promises'
import { join } from 'path'

export interface AISettings {
  auto_processing: {
    enabled: boolean
    confidence_threshold: number
    categories: string[]
    auto_tags: boolean
    smart_descriptions: boolean
  }
  bulk_uploader: {
    batch_size: number
    retry_attempts: number
    timeout_seconds: number
  }
  recommendations: {
    suggestionsPerRefresh: 1|2|3|4|5|6|7|8|9|10
    serendipityLevel: 0|1|2|3|4|5|6|7|8|9|10
    autoIncludeOnSelect: boolean
    autoBundle: boolean
    includeTLDR: boolean
    domainBlacklist: string[]
    revisitNudgeDays: 1|3|7|14|21|30
    includeTrending: boolean
  }
  link_validator: {
    check_frequency: 'daily' | 'weekly' | 'monthly'
    auto_remove_broken: boolean
    notify_on_broken: boolean
  }
  browser_launcher: {
    default_browser: string
    open_in_new_tab: boolean
    focus_window: boolean
  }
}

// Default settings
function getDefaultAISetting<K extends keyof AISettings>(key: K): AISettings[K] {
  const defaults: AISettings = {
    auto_processing: {
      enabled: false,
      confidence_threshold: 0.8,
      categories: ['Development', 'Design', 'Marketing'],
      auto_tags: true,
      smart_descriptions: true,
    },
    bulk_uploader: {
      batch_size: 10,
      retry_attempts: 3,
      timeout_seconds: 30,
    },
    recommendations: {
      suggestionsPerRefresh: 5,
      serendipityLevel: 3,
      autoIncludeOnSelect: true,
      autoBundle: false,
      includeTLDR: true,
      domainBlacklist: [],
      revisitNudgeDays: 14,
      includeTrending: false,
    },
    link_validator: {
      check_frequency: 'weekly',
      auto_remove_broken: false,
      notify_on_broken: true,
    },
    browser_launcher: {
      default_browser: 'default',
      open_in_new_tab: true,
      focus_window: true,
    },
  }
  return defaults[key]
}

// Simple file-based storage
async function getSettingFromFile<K extends keyof AISettings>(
  userId: string,
  key: K
): Promise<AISettings[K]> {
  try {
    const dataDir = join(process.cwd(), 'data', 'users', userId)
    const filePath = join(dataDir, `ai_${key}.json`)
    const data = await readFile(filePath, 'utf-8')
    return JSON.parse(data)
  } catch (error) {
    // Return default if file doesn't exist
    return getDefaultAISetting(key)
  }
}

async function saveSettingToFile<K extends keyof AISettings>(
  userId: string,
  key: K,
  value: AISettings[K]
): Promise<void> {
  const dataDir = join(process.cwd(), 'data', 'users', userId)
  await mkdir(dataDir, { recursive: true })
  const filePath = join(dataDir, `ai_${key}.json`)
  await writeFile(filePath, JSON.stringify(value, null, 2))
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ setting: string }> }
) {
  const resolvedParams = await params;
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')
    
    if (!userId) {
      return NextResponse.json({ error: 'Missing user_id parameter' }, { status: 400 })
    }

    const resolvedParams = await params
    const setting = resolvedParams.setting as keyof AISettings
    const value = await getSettingFromFile(userId, setting)
    
    return NextResponse.json({ value })
  } catch (error) {
    console.error('Error fetching AI setting:', error)
    return NextResponse.json({ error: 'Failed to fetch setting' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ setting: string }> }
) {
  const resolvedParams = await params;
  try {
    const body = await request.json()
    const { user_id: userId, value } = body
    
    if (!userId) {
      return NextResponse.json({ error: 'Missing user_id in request body' }, { status: 400 })
    }

    const resolvedParams = await params
    const setting = resolvedParams.setting as keyof AISettings
    
    await saveSettingToFile(userId, setting, value)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error saving AI setting:', error)
    return NextResponse.json({ error: 'Failed to save setting' }, { status: 500 })
  }
} 