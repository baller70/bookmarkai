import { NextRequest, NextResponse } from 'next/server'
import { getOracleSettingServer, saveOracleSettingServer, OracleSettings } from '@/lib/user-settings-server'

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
    const setting = resolvedParams.setting as keyof OracleSettings
    const value = await getOracleSettingServer(userId, setting)
    
    return NextResponse.json({ value })
  } catch (error) {
    console.error('Error fetching Oracle setting:', error)
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
    const setting = resolvedParams.setting as keyof OracleSettings
    await saveOracleSettingServer(userId, setting, value)
    
    return NextResponse.json({ success: true, message: 'Setting saved successfully' })
  } catch (error) {
    console.error('Error saving Oracle setting:', error)
    return NextResponse.json({ error: 'Failed to save setting' }, { status: 500 })
  }
} 