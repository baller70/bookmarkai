import { NextRequest, NextResponse } from 'next/server'
import { writeFile, readFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import { join } from 'path'
import { createClient } from '@supabase/supabase-js'

// Use the same writable base directory strategy as /api/categories
const DATA_BASE_DIR = process.env.DATA_DIR || (process.env.VERCEL ? '/tmp/data' : join(process.cwd(), 'data'))
const MAP_FILE = join(DATA_BASE_DIR, 'category_folders.json')

// Supabase setup
const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim()
const supabaseKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim()
const USE_SUPABASE = !!(supabaseUrl && supabaseKey && !supabaseUrl.includes('placeholder') && !supabaseKey.includes('placeholder'))
const supabase = USE_SUPABASE ? createClient(supabaseUrl, supabaseKey) : null

interface Mapping {
  folder_id: string
  category_id: string
  user_id: string
  order?: number
  created_at?: string
  updated_at?: string
}

async function ensureDataDir() {
  const dir = DATA_BASE_DIR
  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true })
  }
}

async function loadMappings(): Promise<Mapping[]> {
  try {
    await ensureDataDir()
    if (!existsSync(MAP_FILE)) return []
    const txt = await readFile(MAP_FILE, 'utf8')
    return JSON.parse(txt)
  } catch {
    return []
  }
}

async function saveMappings(m: Mapping[]) {
  await ensureDataDir()
  await writeFile(MAP_FILE, JSON.stringify(m, null, 2), 'utf8')
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const user_id = searchParams.get('user_id') || ''
    const folder_id = searchParams.get('folder_id') || undefined
    const expand = searchParams.get('expand') || ''

    if (USE_SUPABASE && supabase) {
      // When expand=category, join category details to avoid ID/name dedupe issues downstream
      const baseSelect = expand ? 'folder_id,category_id,user_id,created_at,updated_at,order,categories!inner(id,name,description,color)' : 'folder_id,category_id,user_id,created_at,updated_at,order'
      let query = supabase
        .from('category_folder_categories')
        .select(baseSelect)
      if (user_id) query = query.eq('user_id', user_id)
      if (folder_id) query = query.eq('folder_id', folder_id)
      const { data, error } = await query
      if (!error && data) {
        return NextResponse.json({ success: true, mappings: data })
      }
      console.warn('category-folder mappings GET: Supabase error, falling back to file:', (error as any)?.message)
    }

    const all = await loadMappings()
    let filtered = all
    if (user_id) filtered = filtered.filter(x => x.user_id === user_id)
    if (folder_id) filtered = filtered.filter(x => x.folder_id === folder_id)

    // No expand in file fallback
    return NextResponse.json({ success: true, mappings: filtered })
  } catch (e) {
    return NextResponse.json({ success: false, error: 'Failed to load mappings' }, { status: 500 })
  }
}

// Upsert mappings for a folder or for a set
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { assignments, user_id } = body as { assignments: Mapping[]; user_id?: string }
    if (!Array.isArray(assignments) || assignments.length === 0) {
      return NextResponse.json({ success: false, error: 'assignments[] required' }, { status: 400 })
    }
    const uid = user_id || assignments[0]?.user_id
    if (!uid) {
      return NextResponse.json({ success: false, error: 'user_id required' }, { status: 400 })
    }

    const { searchParams } = new URL(request.url)
    const replace = searchParams.get('replace') === 'true'

    if (USE_SUPABASE && supabase) {
      if (replace || assignments.length > 1) {
        // Replace mappings for provided (user_id, folder_id) pairs
        const pairs = Array.from(new Set(assignments.map(a => `${uid}::${a.folder_id}`)))
        for (const pair of pairs) {
          const folderId = pair.split('::')[1]
          await supabase.from('category_folder_categories').delete().match({ user_id: uid, folder_id: folderId })
        }
        const rows = assignments.map(a => ({
          user_id: uid,
          folder_id: a.folder_id,
          category_id: a.category_id,
          order: a.order ?? null
        }))
        const { error } = await supabase.from('category_folder_categories').insert(rows)
        if (!error) return NextResponse.json({ success: true, count: rows.length })
        console.warn('category-folder mappings POST: Supabase error, falling back to file:', (error as any)?.message)
      } else {
        // Upsert single mapping without removing other categories in the folder
        const a = assignments[0]
        await supabase.from('category_folder_categories').delete().match({ user_id: uid, folder_id: a.folder_id, category_id: a.category_id })
        const { error } = await supabase.from('category_folder_categories').insert({ user_id: uid, folder_id: a.folder_id, category_id: a.category_id, order: a.order ?? null })
        if (!error) return NextResponse.json({ success: true, count: 1 })
        console.warn('category-folder mappings POST (single upsert): Supabase error, falling back to file:', (error as any)?.message)
      }
    }

    const now = new Date().toISOString()
    const incoming = assignments.map(a => ({ ...a, user_id: uid, updated_at: now, created_at: a.created_at || now }))

    const existing = await loadMappings()

    let next: Mapping[] = []
    if (replace || assignments.length > 1) {
      // Replace all mappings for (user_id, folder_id) pairs present in incoming
      const keyPairs = new Set(incoming.map(a => `${a.user_id}::${a.folder_id}`))
      const kept = existing.filter(x => !keyPairs.has(`${x.user_id}::${x.folder_id}`))
      next = [...kept, ...incoming]
    } else {
      // Single upsert: remove exact match then append
      const a = incoming[0]
      const kept = existing.filter(x => !(x.user_id === a.user_id && x.folder_id === a.folder_id && x.category_id === a.category_id))
      next = [...kept, a]
    }

    await saveMappings(next)

    return NextResponse.json({ success: true, count: incoming.length })
  } catch (e) {
    return NextResponse.json({ success: false, error: 'Failed to save mappings' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const user_id = searchParams.get('user_id')
    const folder_id = searchParams.get('folder_id')
    const category_id = searchParams.get('category_id')

    if (!user_id) return NextResponse.json({ success: false, error: 'user_id required' }, { status: 400 })

    if (USE_SUPABASE && supabase) {
      const builder = supabase.from('category_folder_categories').delete().eq('user_id', user_id)
      if (folder_id && category_id) {
        await builder.eq('folder_id', folder_id).eq('category_id', category_id)
      } else if (folder_id) {
        await builder.eq('folder_id', folder_id)
      } else {
        await builder
      }
      return NextResponse.json({ success: true })
    }

    const existing = await loadMappings()
    let next = existing.filter(x => x.user_id !== user_id)
    if (folder_id) next = existing.filter(x => !(x.user_id === user_id && x.folder_id === folder_id))
    if (folder_id && category_id) next = existing.filter(x => !(x.user_id === user_id && x.folder_id === folder_id && x.category_id === category_id))

    await saveMappings(next)
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ success: false, error: 'Failed to delete mappings' }, { status: 500 })
  }
}
