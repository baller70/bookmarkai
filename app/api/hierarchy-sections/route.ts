import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
// Use dynamic imports for Node built-ins to avoid any accidental Edge bundling
// (fs/path/os are imported inside functions)
// Force Node.js runtime and dynamic rendering to ensure file system access and avoid caching issues
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';


const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// File-based storage for hierarchy sections
// Use OS tmp dir in production to avoid Vercel's read-only FS issues
let HIERARCHY_SECTIONS_FILE: string | null = null;

async function getFilePaths() {
  const { join } = await import('path');
  const { tmpdir } = await import('os');
  const base = process.env.VERCEL ? tmpdir() : process.cwd() + '/data';
  return {
    base,
    file: process.env.VERCEL ? join(tmpdir(), 'hierarchy-sections.json') : join(process.cwd(), 'data', 'hierarchy-sections.json'),
  };
}

// Ensure data directory exists (safe for serverless)
async function ensureDataDirectory() {
  try {
    const { join } = await import('path');
    const { tmpdir } = await import('os');
    const { existsSync } = await import('fs');
    const dataDir = process.env.VERCEL ? tmpdir() : join(process.cwd(), 'data');
    if (!existsSync(dataDir)) {
      const { mkdir } = await import('fs/promises');
      await mkdir(dataDir, { recursive: true });
    }
  } catch (e) {
    // On serverless (e.g., Vercel) the FS may be read-only; we will fall back to /tmp via HIERARCHY_SECTIONS_FILE
    console.warn('⚠️ ensureDataDirectory: non-fatal error creating data dir:', (e as any)?.message || e);
  }
}

function getSupabaseServerClient() {
  if (!supabaseUrl || !supabaseServiceKey) return null;
  return createClient(supabaseUrl, supabaseServiceKey);
}

function resolveUserId(request: NextRequest): string | null {
  const url = new URL(request.url);
  // Prefer explicit search param
  const fromQuery = url.searchParams.get('user_id');
  if (fromQuery) return fromQuery;
  // Fallback to header
  const fromHeader = request.headers.get('x-user-id');
  if (fromHeader) return fromHeader;
  return null;
}

export async function GET(request: NextRequest) {
  try {
    console.log('📖 Fetching hierarchy sections...');

    // If Supabase is configured and we have a user_id, read from DB
    const supabase = getSupabaseServerClient();
    const userId = resolveUserId(request);

    if (supabase && userId) {
      console.log(`🔎 Fetching hierarchy_sections for user_id=${userId}`);
      const { data, error } = await supabase
        .from('hierarchy_sections')
        .select('section_id, title, icon, color, gradient, position')
        .eq('user_id', userId)
        .order('position', { ascending: true });

      if (error) {
        console.warn('⚠️ Supabase query error, falling back to file/defaults:', error);
      } else if (data && data.length > 0) {
        const sections = data.map((s) => ({
          id: s.section_id,
          section_id: s.section_id,
          title: s.title,
          icon: s.icon,
          color: s.color,
          gradient: s.gradient,
          position: s.position ?? 0,
        }));
        console.log(`✅ Returning ${sections.length} sections from Supabase`);
        return NextResponse.json({ hierarchySections: sections });
      }
    }

    // Try to read from saved file (local dev) if exists
    try {
      const { existsSync } = await import('fs');
      const { readFile } = await import('fs/promises');
      const { file } = await getFilePaths();
      if (existsSync(file)) {
        console.log('📂 Reading hierarchy sections from file...');
        const fileContent = await readFile(file, 'utf8');
        const savedData = JSON.parse(fileContent);
        if (savedData.hierarchySections && Array.isArray(savedData.hierarchySections)) {
          console.log(`✅ Loaded ${savedData.hierarchySections.length} hierarchy sections from file`);
          return NextResponse.json({ hierarchySections: savedData.hierarchySections });
        }
      }
    } catch (fileError) {
      console.warn('⚠️ Error reading hierarchy sections file, falling back to defaults:', fileError);
    }

    // Fall back to default sections
    console.log('📝 Using default hierarchy sections');
    const defaultSections = [
      {
        id: 'director',
        section_id: 'director',
        title: 'DIRECTOR',
        icon: 'Crown',
        color: 'purple',
        gradient: 'bg-gradient-to-r from-purple-600 to-blue-600',
        position: 0
      },
      {
        id: 'teams',
        section_id: 'teams',
        title: 'TEAMS',
        icon: 'Users',
        color: 'emerald',
        gradient: 'bg-gradient-to-r from-emerald-600 to-teal-600',
        position: 1
      },
      {
        id: 'collaborators',
        section_id: 'collaborators',
        title: 'COLLABORATORS',
        icon: 'User',
        color: 'orange',
        gradient: 'bg-gradient-to-r from-orange-600 to-red-600',
        position: 2
      }
    ];

    console.log(`✅ Returning ${defaultSections.length} default hierarchy sections`);
    return NextResponse.json({ hierarchySections: defaultSections });

  } catch (error) {
    console.error('❌ Error in GET /api/hierarchy-sections:', error);
    // Fail-safe: return a minimal default set instead of 500 to avoid breaking the UI
    const defaultSections = [
      {
        id: 'director',
        section_id: 'director',
        title: 'DIRECTOR',
        icon: 'Crown',
        color: 'purple',
        gradient: 'bg-gradient-to-r from-purple-600 to-pink-600',
        position: 0
      },
      {
        id: 'teams',
        section_id: 'teams',
        title: 'TEAMS',
        icon: 'Users',
        color: 'blue',
        gradient: 'bg-gradient-to-r from-blue-600 to-cyan-600',
        position: 1
      },
      {
        id: 'collaborators',
        section_id: 'collaborators',
        title: 'COLLABORATORS',
        icon: 'User',
        color: 'green',
        gradient: 'bg-gradient-to-r from-green-600 to-emerald-600',
        position: 2
      }
    ];
    return NextResponse.json({ hierarchySections: defaultSections }, { status: 200 });
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 POST /api/hierarchy-sections - Starting request processing');

    console.log('📦 Parsing request body...');
    const body = await request.json();
    const { hierarchySections, user_id: bodyUserId } = body;

    if (!hierarchySections || !Array.isArray(hierarchySections)) {
      return NextResponse.json(
        { error: 'Invalid hierarchy sections data' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServerClient();
    const headerOrQueryUserId = resolveUserId(request);
    const userId = bodyUserId || headerOrQueryUserId;

    if (supabase && userId) {
      try {
        console.log(`📝 Persisting ${hierarchySections.length} sections to Supabase for user_id=${userId}`);

        // Normalize incoming payload
        const normalized = hierarchySections.map((s: any, index: number) => ({
          user_id: userId,
          section_id: s.section_id ?? s.id,
          title: s.title,
          icon: s.icon ?? s.iconName,
          color: s.color ?? 'gray',
          gradient: s.gradient ?? 'bg-gradient-to-r from-gray-600 to-slate-600',
          position: s.position ?? s.order ?? index,
          updated_at: new Date().toISOString(),
        }));

        // Fetch existing to compute deletions
        const { data: existing, error: fetchErr } = await supabase
          .from('hierarchy_sections')
          .select('section_id')
          .eq('user_id', userId);

        if (fetchErr) {
          console.warn('⚠️ Failed to fetch existing sections before upsert:', fetchErr);
        }

        // Upsert new/updated records
        const { error: upsertErr } = await supabase
          .from('hierarchy_sections')
          .upsert(normalized, { onConflict: 'user_id,section_id' });

        if (upsertErr) {
          console.warn('❌ Supabase upsert error, falling back to file storage (non-fatal):', upsertErr);
          try {
            await ensureDataDirectory();
            const { writeFile } = await import('fs/promises');
            const { file } = await getFilePaths();
            const dataToSave = {
              hierarchySections: hierarchySections,
              lastUpdated: new Date().toISOString(),
              version: '1.0'
            };
            await writeFile(file, JSON.stringify(dataToSave, null, 2), 'utf8');
            console.log('✅ Fallback saved hierarchy sections to file');
          } catch (fallbackErr) {
            console.error('❌ Fallback file save error:', fallbackErr);
          }
          return NextResponse.json({
            message: 'Hierarchy sections accepted (fallback used)',
            hierarchySections: hierarchySections,
            saved: false
          });
        }

        // Delete removed sections
        if (existing && existing.length > 0) {
          const incomingIds = new Set(normalized.map((n) => n.section_id));
          const toDelete = existing
            .map((e) => e.section_id)
            .filter((id) => !incomingIds.has(id));
          if (toDelete.length > 0) {
            const { error: delErr } = await supabase
              .from('hierarchy_sections')
              .delete()
              .eq('user_id', userId)
              .in('section_id', toDelete);
            if (delErr) {
              console.warn('⚠️ Supabase delete error (non-fatal):', delErr);
            }
          }
        }

        return NextResponse.json({
          message: 'Hierarchy sections saved successfully',
          hierarchySections: normalized.map((n) => ({
            id: n.section_id,
            section_id: n.section_id,
            title: n.title,
            icon: n.icon,
            color: n.color,
            gradient: n.gradient,
            position: n.position,
          })),
          saved: true,
        }, { status: 200 });
      } catch (supabaseUnexpectedErr) {
        console.warn('⚠️ Unexpected Supabase branch error, using fallback and returning 200:', supabaseUnexpectedErr);
        try {
          await ensureDataDirectory();
          const { writeFile } = await import('fs/promises');
          const { file } = await getFilePaths();
          const dataToSave = {
            hierarchySections: hierarchySections,
            lastUpdated: new Date().toISOString(),
            version: '1.0'
          };
          await writeFile(file, JSON.stringify(dataToSave, null, 2), 'utf8');
          console.log('✅ Fallback saved hierarchy sections to file');
        } catch (fallbackErr) {
          console.error('❌ Fallback file save error:', fallbackErr);
        }
        return NextResponse.json({ message: 'Hierarchy sections accepted (fallback used)', hierarchySections, saved: false }, { status: 200 });
      }
    }

    // Fallback to file-based storage (serverless-safe)
    console.log(`📝 Supabase not configured or user_id missing. Attempting to save ${hierarchySections.length} sections to file storage...`);

    // Ensure data directory exists
    await ensureDataDirectory();
    let saved = false;

    // Save to file storage
    const dataToSave = {
      hierarchySections: hierarchySections,
      lastUpdated: new Date().toISOString(),
      version: '1.0'
    };

    const { writeFile } = await import('fs/promises');
    const { file } = await getFilePaths();
    try {
      await writeFile(file, JSON.stringify(dataToSave, null, 2), 'utf8');
      console.log('✅ Fallback saved hierarchy sections to file');
      saved = true;
    } catch (fallbackErr) {
      console.warn('⚠️ Fallback file save error (non-fatal):', fallbackErr);
    }

    return NextResponse.json({
      message: saved ? 'Hierarchy sections saved successfully' : 'Hierarchy sections accepted (not persisted)',
      hierarchySections: hierarchySections,
      saved
    });

  } catch (error) {
    console.error('❌ Error in POST /api/hierarchy-sections:', error);
    // Do not break client flows: accept request and indicate not persisted
    let saved = false;
    try {
      await ensureDataDirectory();
      // Best-effort: write a heartbeat file to confirm route runs (no sensitive data)
      const { writeFile } = await import('fs/promises');
      const { file } = await getFilePaths();
      const payload = { lastError: String((error as any)?.message || error), lastUpdated: new Date().toISOString(), version: '1.0' };
      await writeFile(file, JSON.stringify(payload, null, 2), 'utf8');
    } catch (e) {
      // ignore
    }
    return NextResponse.json({ message: 'Hierarchy sections accepted (error handled)', saved }, { status: 200 });
  }
}

