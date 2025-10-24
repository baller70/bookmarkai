import { NextRequest, NextResponse } from 'next/server'
import { writeFile, readFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import { join } from 'path'
import { createClient } from '@supabase/supabase-js'

// Dedicated storage for CATEGORY folders (separate from bookmark folders)
const DATA_BASE_DIR = process.env.DATA_DIR || (process.env.VERCEL ? '/tmp/data' : join(process.cwd(), 'data'))
const CATEGORY_FOLDERS_FILE = join(DATA_BASE_DIR, 'category_folders_meta.json')

// Supabase config (service role preferred for server routes)
const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim()
const supabaseKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim()
const USE_SUPABASE = !!(supabaseUrl && supabaseKey && !supabaseUrl.includes('placeholder') && !supabaseKey.includes('placeholder'))
const supabase = USE_SUPABASE ? createClient(supabaseUrl, supabaseKey) : null

interface CategoryFolder {
  id: string
  user_id: string
  name: string
  description?: string | null
  color?: string | null
  created_at: string
  updated_at: string
}

async function ensureDataDir() {
  if (!existsSync(DATA_BASE_DIR)) {
    await mkdir(DATA_BASE_DIR, { recursive: true })
  }
}

async function loadCategoryFolders(): Promise<CategoryFolder[]> {
  try {
    await ensureDataDir()
    if (!existsSync(CATEGORY_FOLDERS_FILE)) return []
    const txt = await readFile(CATEGORY_FOLDERS_FILE, 'utf8')
    return JSON.parse(txt)
  } catch {
    return []
  }
}

async function saveCategoryFolders(folders: CategoryFolder[]) {
  await ensureDataDir()
  await writeFile(CATEGORY_FOLDERS_FILE, JSON.stringify(folders, null, 2), 'utf8')
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const user_id = searchParams.get('user_id') || ''
    const id = searchParams.get('id') || ''

    if (USE_SUPABASE && supabase) {
      if (id) {
        const { data, error } = await supabase
          .from('category_folders')
          .select('id,user_id,name,description,color,created_at,updated_at')
          .eq('id', id)
          .limit(1)
        if (!error && data) return NextResponse.json({ success: true, folders: data })
        console.warn('category_folders GET by id: Supabase error, falling back to file:', (error as any)?.message)
      } else if (user_id) {
        const { data, error } = await supabase
          .from('category_folders')
          .select('id,user_id,name,description,color,created_at,updated_at')
          .eq('user_id', user_id)
          .order('created_at', { ascending: true })
        if (!error && data) return NextResponse.json({ success: true, folders: data })
        console.warn('category_folders GET by user: Supabase error, falling back to file:', (error as any)?.message)
      } else {
        // Neither id nor user_id provided; return empty
        return NextResponse.json({ success: true, folders: [] })
      }
    }

    const all = await loadCategoryFolders()
    let folders = all
    if (id) folders = all.filter(f => String(f.id) === String(id))
    else if (user_id) folders = all.filter(f => f.user_id === user_id)
    else folders = []
    return NextResponse.json({ success: true, folders })
  } catch (e) {
    return NextResponse.json({ success: false, error: 'Failed to fetch category folders' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { user_id, name, description, color } = body as Partial<CategoryFolder> & { name?: string }

    if (!user_id || !name?.trim()) {
      return NextResponse.json({ success: false, error: 'user_id and name are required' }, { status: 400 })
    }

    if (USE_SUPABASE && supabase) {
      const { data, error } = await supabase
        .from('category_folders')
        .insert({ user_id, name: name.trim(), description: description || null, color: color || '#3B82F6' })
        .select('id,user_id,name,description,color,created_at,updated_at')
        .single()
      if (!error && data) {
        return NextResponse.json({ success: true, folder: data })
      }
      console.warn('category_folders POST: Supabase error, falling back to file:', (error as any)?.message)
    }

    const now = new Date().toISOString()
    const newFolder: CategoryFolder = {
      id: `cat-folder-${Date.now()}`,
      user_id,
      name: name.trim(),
      description: (description ?? '') as string,
      color: (color ?? '#3B82F6') as string,
      created_at: now,
      updated_at: now,
    }

    const folders = await loadCategoryFolders()
    folders.push(newFolder)
    await saveCategoryFolders(folders)

    return NextResponse.json({ success: true, folder: newFolder })
  } catch (e) {
    return NextResponse.json({ success: false, error: 'Failed to create category folder' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, name, description, color } = body as Partial<CategoryFolder> & { id?: string }

    if (!id || !name?.trim()) {
      return NextResponse.json({ success: false, error: 'id and name are required' }, { status: 400 })
    }

    if (USE_SUPABASE && supabase) {
      // 1) Load old folder to get previous name and user_id
      const { data: oldFolder, error: fetchErr } = await supabase
        .from('category_folders')
        .select('id,user_id,name')
        .eq('id', id)
        .single();
      if (fetchErr) {
        console.error('category_folders PUT: fetch old folder failed', fetchErr);
        return NextResponse.json({ success: false, error: fetchErr.message }, { status: 500 })
      }
      const oldName = String(oldFolder?.name || '').trim();
      const ownerId = String(oldFolder?.user_id || '').trim();

      // 2) Update the folder itself
      const { data, error } = await supabase
        .from('category_folders')
        .update({ name: name.trim(), description: description ?? null, color: color ?? '#3B82F6' })
        .eq('id', id)
        .select('id,user_id,name,description,color,created_at,updated_at')
        .single();
      if (error) {
        console.error('category_folders PUT: update folder failed', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
      }

      // 3) Migrate bookmarks so nothing is orphaned
      const nowIso = new Date().toISOString();
      // a) For bookmarks already linked via folder_id, update the denormalized category text
      try {
        await supabase
          .from('user_bookmarks')
          .update({ category: name.trim(), updated_at: nowIso })
          .eq('folder_id', id)
          .eq('user_id', ownerId);
      } catch (e) { console.warn('user_bookmarks folder_id text update failed', e) }
      try {
        await supabase
          .from('bookmarks')
          .update({ category: name.trim(), updated_at: nowIso })
          .eq('folder_id', id);
      } catch (e) { console.warn('bookmarks folder_id text update failed', e) }

      // b) For bookmarks with NULL folder_id but old name, link and rename
      if (oldName) {
        try {
          await supabase
            .from('user_bookmarks')
            .update({ folder_id: id, category: name.trim(), updated_at: nowIso })
            .is('folder_id', null)
            .eq('user_id', ownerId)
            .ilike('category', oldName);
        } catch (e) { console.warn('user_bookmarks link by oldName failed', e) }
        try {
          await supabase
            .from('bookmarks')
            .update({ folder_id: id, category: name.trim(), updated_at: nowIso })
            .is('folder_id', null)
            .ilike('category', oldName);
        } catch (e) { console.warn('bookmarks link by oldName failed', e) }
      }

      return NextResponse.json({ success: true, folder: data })
    }

    const folders = await loadCategoryFolders()
    const idx = folders.findIndex(f => f.id === id)
    if (idx === -1) {
      return NextResponse.json({ success: false, error: 'Folder not found' }, { status: 404 })
    }

    const now = new Date().toISOString()
    folders[idx] = {
      ...folders[idx],
      name: name.trim(),
      description: description ?? folders[idx].description ?? '',
      color: color ?? folders[idx].color ?? '#3B82F6',
      updated_at: now,
    }

    await saveCategoryFolders(folders)
    return NextResponse.json({ success: true, folder: folders[idx] })
  } catch (e) {
    return NextResponse.json({ success: false, error: 'Failed to update category folder' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ success: false, error: 'id is required' }, { status: 400 })

    if (USE_SUPABASE && supabase) {
      const { error } = await supabase.from('category_folders').delete().eq('id', id)
      if (!error) return NextResponse.json({ success: true })
      console.warn('category_folders DELETE: Supabase error, falling back to file:', (error as any)?.message)
    }

    const folders = await loadCategoryFolders()
    const next = folders.filter(f => f.id !== id)
    await saveCategoryFolders(next)

    // Note: category-folder mappings cleanup is handled by client via /api/category-folders DELETE
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ success: false, error: 'Failed to delete category folder' }, { status: 500 })
  }
}
