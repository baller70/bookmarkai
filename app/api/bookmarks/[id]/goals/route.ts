import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { mockStorage } from '@/lib/mockStorage'

export const dynamic = 'force-dynamic'

// Supabase clients
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()

const USE_SUPABASE = !!(supabaseUrl && (anonKey || serviceKey))
const admin = (USE_SUPABASE && serviceKey)
  ? createClient(supabaseUrl!, serviceKey!, { auth: { autoRefreshToken: false, persistSession: false } })
  : null
const client = (USE_SUPABASE && anonKey)
  ? createClient(supabaseUrl!, anonKey!)
  : null

function ok(data: any, init?: number) { return NextResponse.json(data, { status: init || 200 }) }
function err(message: string, init?: number, extra?: any) { return NextResponse.json({ error: message, ...(extra ? { details: extra } : {}) }, { status: init || 500 }) }

// Utility: detect if bookmark_goals table exists
async function hasBookmarkGoalsTable() {
  try {
    if (!admin) return false
    const { error } = await admin.from('bookmark_goals').select('count', { head: true, count: 'exact' })
    return !error
  } catch {
    return false
  }
}

// GET /api/bookmarks/[id]/goals -> list goals associated to a bookmark
export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const resolvedParams = await context.params;
  const bookmarkId = resolvedParams.id
  if (!bookmarkId) return err('Bookmark ID missing', 400)

  // If Supabase with junction table
  if (await hasBookmarkGoalsTable()) {
    try {
      const db = admin!
      const { data, error } = await db
        .from('bookmark_goals')
        .select('goal_id')
        .eq('bookmark_id', bookmarkId)

      if (error) return err('Failed to load associated goals', 500, error.message)

      // Get goal details separately
      const goalIds = (data || []).map((row: any) => row.goal_id)
      if (goalIds.length === 0) {
        return Response.json({ success: true, goals: [] })
      }

      const { data: goalsData, error: goalsError } = await db
        .from('goals')
        .select('id, title, description, status, priority, due_date')
        .in('id', goalIds)
      if (goalsError) return err('Failed to load goal details', 500, goalsError.message)

      // Transform the data to match the expected format
      const goals = (goalsData || []).map((goal: any) => ({
        id: goal.id,
        name: goal.title, // Map title to name for frontend compatibility
        description: goal.description,
        goal_status: goal.status, // Map status to goal_status for frontend compatibility
        goal_priority: goal.priority, // Map priority to goal_priority for frontend compatibility
        deadline_date: goal.due_date, // Map due_date to deadline_date for frontend compatibility
      }))

      return Response.json({ success: true, goals })
    } catch (e: any) {
      return err('Exception reading associations', 500, e?.message)
    }
  }

  // Fallback: derive from mockStorage.goals.connected_bookmarks
  try {
    // In dev we use a fixed user id in other APIs; here we just scan all mock goals
    const goals = mockStorage.getGoals('dev-user-fixed-id')
      .filter(g => Array.isArray(g.connected_bookmarks) && g.connected_bookmarks.some((b: any) => String(b) === String(bookmarkId)))
      .map(g => ({ id: g.id, name: g.name, description: g.description, goal_status: g.goal_status, goal_priority: g.goal_priority, deadline_date: g.deadline_date }))
    return ok({ success: true, data: goals })
  } catch (e: any) {
    return err('Failed to load (mock)', 500, e?.message)
  }
}

// POST /api/bookmarks/[id]/goals -> body: { goal_id }
export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const resolvedParams = await context.params;
  const bookmarkId = resolvedParams.id
  if (!bookmarkId) return err('Bookmark ID missing', 400)
  const body = await req.json().catch(() => ({}))
  const goalId = body.goal_id as string
  const userId = body.user_id as string | undefined // optional for auditing
  if (!goalId) return err('goal_id is required', 400)

  if (await hasBookmarkGoalsTable()) {
    try {
      const db = admin!

      // First check if association already exists
      const { data: existing } = await db
        .from('bookmark_goals')
        .select('id')
        .eq('bookmark_id', bookmarkId)
        .eq('goal_id', goalId)
        .single()

      if (existing) {
        // Association already exists, return success (idempotent)
        return ok({ success: true, message: 'Association already exists' })
      }

      // Create new association
      const payload: any = { bookmark_id: bookmarkId, goal_id: goalId }
      if (userId) payload.user_id = userId
      const { error } = await db.from('bookmark_goals').insert(payload)
      if (error) return err('Failed to create association', 500, error.message)
      return ok({ success: true })
    } catch (e: any) {
      return err('Exception creating association', 500, e?.message)
    }
  }

  // Fallback: push bookmarkId into goal.connected_bookmarks
  try {
    const uid = userId || 'dev-user-fixed-id'
    const updated = mockStorage.updateGoal(goalId, uid, {
      connected_bookmarks: [
        ...(mockStorage.getGoals(uid).find(g => g.id === goalId)?.connected_bookmarks || []),
        String(bookmarkId)
      ]
    })
    if (!updated) return err('Goal not found (mock)', 404)
    return ok({ success: true })
  } catch (e: any) {
    return err('Failed to create association (mock)', 500, e?.message)
  }
}

// DELETE /api/bookmarks/[id]/goals?goal_id=...
export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const resolvedParams = await context.params;
  const bookmarkId = resolvedParams.id
  const { searchParams } = new URL(req.url)
  const goalId = searchParams.get('goal_id')
  const userId = searchParams.get('user_id') || undefined
  if (!bookmarkId || !goalId) return err('bookmark_id and goal_id required', 400)

  if (await hasBookmarkGoalsTable()) {
    try {
      const db = admin!
      const q = db.from('bookmark_goals').delete().eq('bookmark_id', bookmarkId).eq('goal_id', goalId)
      const { error } = await q
      if (error) return err('Failed to delete association', 500, error.message)
      return ok({ success: true })
    } catch (e: any) {
      return err('Exception deleting association', 500, e?.message)
    }
  }

  // Fallback: remove from connected_bookmarks array
  try {
    const uid = userId || 'dev-user-fixed-id'
    const goal = mockStorage.getGoals(uid).find(g => g.id === goalId)
    if (!goal) return err('Goal not found (mock)', 404)
    const filtered = (goal.connected_bookmarks || []).filter(b => String(b) !== String(bookmarkId))
    const updated = mockStorage.updateGoal(goalId, uid, { connected_bookmarks: filtered })
    if (!updated) return err('Failed to update goal (mock)', 500)
    return ok({ success: true })
  } catch (e: any) {
    return err('Failed to delete association (mock)', 500, e?.message)
  }
}

