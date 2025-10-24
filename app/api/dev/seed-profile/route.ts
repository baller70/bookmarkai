import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(_req: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ error: 'Supabase service credentials missing' }, { status: 500 })
    }
    const supabase = createClient(supabaseUrl, serviceKey)

    const userId = '00000000-0000-0000-0000-000000000001'

    // Attempt minimal insert first
    let insert = await supabase.from('profiles').insert({ id: userId }).select('id').single()

    // If NOT NULL violations, try with common columns
    if (insert.error && insert.error.code === '23502') {
      insert = await supabase
        .from('profiles')
        .insert({ id: userId, username: 'dev-user', created_at: new Date().toISOString() })
        .select('id, username')
        .single()
    }

    if (insert.error && insert.error.code !== '23505') {
      return NextResponse.json({ error: insert.error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, userId })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Seed failed' }, { status: 500 })
  }
}
