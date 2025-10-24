import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import { authenticateUser } from '@/lib/auth-utils'

// File-based history store. We keep parity with the main bulk uploader route.
const historyFilePath = path.join(process.cwd(), 'data', 'bulk_upload_history.json')

interface HistoryRecordLink {
  url: string
  title?: string
  status: 'queued' | 'validating' | 'processing' | 'processed' | 'saved' | 'duplicate' | 'failed'
  error?: string
}

interface HistoryRecord {
  id: string
  user_id: string
  created_at: string
  total: number
  success: number
  failed: number
  links: HistoryRecordLink[]
}

async function loadHistory(): Promise<HistoryRecord[]> {
  try {
    const data = await fs.readFile(historyFilePath, 'utf8')
    return JSON.parse(data) as HistoryRecord[]
  } catch {
    return []
  }
}

export const dynamic = 'force-dynamic'

// GET /api/ai/bulk-uploader/history
export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateUser(request)
    let userId: string
    if (!authResult.success) {
      // Match the same fallback used in the uploader for unauthenticated scenarios
      userId = '48e1b5b9-3b0f-4ccb-8b34-831b1337fc3f'
    } else {
      userId = authResult.userId!
    }

    const all = await loadHistory()
    const userHistory = all
      .filter(r => r.user_id === userId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    return NextResponse.json({ success: true, count: userHistory.length, history: userHistory })
  } catch (error) {
    console.error('Bulk upload history GET error:', error)
    return NextResponse.json({ success: false, error: 'Failed to load history' }, { status: 500 })
  }
}

