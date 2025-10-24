import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// Normalize a URL. If the scheme is missing, try https://
function normalizeUrl(input: string): string | null {
  if (!input) return null
  let u = input.trim()
  try {
    // already valid
    new URL(u)
    return u
  } catch {
    try {
      const prefixed = `https://${u}`
      new URL(prefixed)
      return prefixed
    } catch {
      return null
    }
  }
}

// Basic metadata extraction (best-effort, safe fallbacks)
async function fetchBasicMetadata(url: string): Promise<{ title?: string; description?: string }> {
  try {
    const controller = new AbortController()
    const t = setTimeout(() => controller.abort(), 8000)
    const res = await fetch(url, { signal: controller.signal })
    clearTimeout(t)
    const html = await res.text()

    let titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
    const ogTitleMatch = html.match(/<meta[^>]+property=["']og:title["'][^>]*content=["']([^"']+)["'][^>]*>/i)
    const ogDescMatch = html.match(/<meta[^>]+property=["']og:description["'][^>]*content=["']([^"']+)["'][^>]*>/i)
    const metaDescMatch = html.match(/<meta[^>]+name=["']description["'][^>]*content=["']([^"']+)["'][^>]*>/i)

    const title = (ogTitleMatch?.[1] || titleMatch?.[1])?.trim()
    const description = (ogDescMatch?.[1] || metaDescMatch?.[1])?.trim()

    return { title, description }
  } catch {
    return {}
  }
}

export async function POST(request: NextRequest) {
  try {
    const start = Date.now()
    const body = await request.json().catch(() => ({})) as {
      url?: string
      title?: string
      notes?: string
      enableAI?: boolean
      user_id?: string
    }

    if (!body?.url || typeof body.url !== 'string') {
      return NextResponse.json({ success: false, error: 'URL is required' }, { status: 400 })
    }

    // 1) Normalize URL
    const normalized = normalizeUrl(body.url)
    if (!normalized) {
      return NextResponse.json({ success: false, error: 'Invalid URL format' }, { status: 400 })
    }

    // 2) Basic metadata (best-effort)
    const basic = await fetchBasicMetadata(normalized)

    // 3) Prepare payload for the robust bookmark creation endpoint
    //    We reuse the proven logic of /api/bookmarks (AI analysis, favicon extraction, Supabase fallbacks)
    const finalTitle = (body.title?.trim()) || basic.title || (() => {
      try { return new URL(normalized).hostname.replace('www.', '') } catch { return normalized }
    })()

    // Only pass description if user explicitly provided notes; otherwise let server-side AI generate it
    const desc = body.notes?.trim();

    const payload: any = {
      title: finalTitle,
      url: normalized,
      description: desc ?? undefined,
      notes: body.notes || '',
      enableAI: body.enableAI !== false, // default true
    };
    // If the caller provided a user_id, forward it for proper scoping; otherwise let /api/bookmarks use its fallback
    if (body.user_id) payload.user_id = body.user_id;

    const bookmarksUrl = new URL('/api/bookmarks', request.url).toString()
    const createResp = await fetch(bookmarksUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    const createJson = await createResp.json().catch(() => ({}))
    if (!createResp.ok || !createJson?.success) {
      const message = createJson?.error || createJson?.message || `Bookmark create failed (status ${createResp.status})`
      return NextResponse.json({ success: false, error: message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      bookmark: createJson.bookmark,
      processingTime: Date.now() - start,
    })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Internal server error' }, { status: 500 })
  }
}

