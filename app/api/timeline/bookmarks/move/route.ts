import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { readFile, writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import { join } from 'path'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// Minimal Supabase setup (service role preferred for server writes)
const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim()
const SERVICE_ROLE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim()
const ANON_KEY = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim()
const HAS_SERVICE_KEY = !!(SERVICE_ROLE_KEY && !SERVICE_ROLE_KEY.includes('placeholder'))
const USE_SUPABASE = !!(SUPABASE_URL && (HAS_SERVICE_KEY || ANON_KEY))
const supabase = USE_SUPABASE ? createClient(SUPABASE_URL, HAS_SERVICE_KEY ? SERVICE_ROLE_KEY : ANON_KEY, { auth: { autoRefreshToken: false, persistSession: false } }) : null

// File fallbacks
const DATA_DIR = join(process.cwd(), 'data')
const BOOKMARKS_FILE = join(DATA_DIR, 'bookmarks.json')
const FOLDERS_FILE = join(DATA_DIR, 'folders.json')

async function ensureDataDir() {
  if (!existsSync(DATA_DIR)) await mkdir(DATA_DIR, { recursive: true })
}

async function getFolderNameById(folderId: string): Promise<string | null> {
  // Supabase categories table first
  if (USE_SUPABASE && supabase) {
    try {
      // Try by ID
      {
        const { data, error } = await supabase
          .from('categories')
          .select('id,name')
          .eq('id', folderId)
          .single()
        if (!error && data?.name) return String(data.name)
      }
      // If not found by ID, try by name (exact)
      {
        const { data, error } = await supabase
          .from('categories')
          .select('id,name')
          .eq('name', folderId)
          .maybeSingle()
        if (!error && data?.name) return String(data.name)
      }
      // Case-insensitive match
      try {
        const { data, error } = await supabase
          .from('categories')
          .select('id,name')
          .ilike('name', folderId)
          .maybeSingle()
        if (!error && data?.name) return String(data.name)
      } catch (_) {}
    } catch (_) {}
  }
  // File fallback
  try {
    await ensureDataDir()
    if (!existsSync(FOLDERS_FILE)) return null
    const raw = await readFile(FOLDERS_FILE, 'utf8')
    const parsed = JSON.parse(raw)
    const folders: Array<{ id: string; name: string }> = Array.isArray(parsed?.folders) ? parsed.folders : []
    const f = folders.find(x => String(x.id) === String(folderId) || String(x.name) === String(folderId))
    return f?.name || null
  } catch (_) {
    return null
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const qp = url.searchParams
    const body = await request.json().catch(() => ({} as any))
    const bookmarkId: string = body.bookmarkId || body.id || body.bookmark_id || qp.get('bookmarkId') || qp.get('id') || qp.get('bookmark_id') || ''
    const rawFolder: string | null = (body.newFolderId || body.newBoardId || body.folder_id || qp.get('newFolderId') || qp.get('folderId') || qp.get('folder_id')) as any
    const newFolderId = rawFolder ? String(rawFolder).replace(/^folder-/, '') : ''

    if (!bookmarkId) return NextResponse.json({ success: false, error: 'bookmarkId is required' }, { status: 400 })
    if (!newFolderId) return NextResponse.json({ success: false, error: 'newFolderId is required' }, { status: 400 })

    // Resolve destination folder name -> becomes the bookmark.category
    const folderName = await getFolderNameById(newFolderId)
    if (!folderName) {
      return NextResponse.json({ success: false, error: 'Destination folder not found' }, { status: 400 })
    }

    // Try Supabase first (server-side write). We consider it configured only when a service key is present.
    if (USE_SUPABASE && supabase) {
      let updatedCount = 0
      let lastErr: any = null

      async function upsertCategory(table: 'user_bookmarks' | 'bookmarks') {
        const base = supabase.from(table)
        // Try full update (folder_id + category + clear ai_category)
        let { data, error } = await base
          .update({ folder_id: newFolderId, category: folderName, ai_category: null, updated_at: new Date().toISOString() })
          .eq('id', bookmarkId)
          .select('id')
        if (error) {
          // Retry updating category only (schema mismatch tolerance)
          const retry = await base
            .update({ category: folderName, updated_at: new Date().toISOString() })
            .eq('id', bookmarkId)
            .select('id')
          data = retry.data as any
          error = retry.error as any
        }
        if (!error && data && (Array.isArray(data) ? data.length > 0 : !!data)) {
          updatedCount += Array.isArray(data) ? data.length : 1
          return true
        }
        lastErr = error
        return false
      }

      // Attempt to update both tables; success if either updates at least one row
      for (const table of ['user_bookmarks', 'bookmarks'] as const) {
        try { await upsertCategory(table) } catch (e) { lastErr = e }
      }

      if (updatedCount === 0) {
        // If no service key, don’t pretend success in production – surface a real error
        if (!HAS_SERVICE_KEY) {
          console.error('Move error: Supabase write not configured (service key missing).')
          return NextResponse.json({ success: false, error: 'Server write not configured' }, { status: 500 })
        }
        console.error('Move error (Supabase):', lastErr)
        return NextResponse.json({ success: false, error: 'Failed to persist move' }, { status: 500 })
      }

      return NextResponse.json({ success: true, data: { id: bookmarkId, folder_id: newFolderId, category: folderName, ai_category: null } })
    }

    // File fallback only for local/dev (Vercel file system is ephemeral and non-persistent)
    if (process.env.NODE_ENV !== 'production') {
      await ensureDataDir()
      if (!existsSync(BOOKMARKS_FILE)) {
        return NextResponse.json({ success: false, error: 'No bookmarks store found' }, { status: 404 })
      }
      const raw = await readFile(BOOKMARKS_FILE, 'utf8')
      const list: any[] = JSON.parse(raw)

      // IDs can be numeric in file storage; match loosely
      const idx = list.findIndex(b => String(b.id) === String(bookmarkId))
      if (idx === -1) {
        return NextResponse.json({ success: false, error: 'Bookmark not found' }, { status: 404 })
      }
      const updated = { ...list[idx], folder_id: newFolderId, category: folderName, ai_category: null, updated_at: new Date().toISOString() }
      list[idx] = updated
      await writeFile(BOOKMARKS_FILE, JSON.stringify(list, null, 2), 'utf8')
      return NextResponse.json({ success: true, data: updated })
    }

    return NextResponse.json({ success: false, error: 'Persistence disabled in production without Supabase' }, { status: 500 })
  } catch (error) {
    console.error('Move API error (flat route):', error)
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 })
  }
}

