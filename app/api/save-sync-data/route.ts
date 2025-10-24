import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'

export async function POST(request: NextRequest) {
  try {
    const { path, data } = await request.json()

    if (!path || !data) {
      return NextResponse.json(
        { success: false, error: 'Path and data are required' },
        { status: 400 }
      )
    }

    // Create the full file path
    const fullPath = join(process.cwd(), path)
    const dirPath = fullPath.substring(0, fullPath.lastIndexOf('/'))

    // Ensure directory exists
    await mkdir(dirPath, { recursive: true })

    // Write the sync data file
    await writeFile(fullPath, JSON.stringify(data, null, 2), 'utf-8')

    return NextResponse.json({
      success: true,
      message: 'Sync data file saved successfully',
      path: fullPath
    })

  } catch (error) {
    console.error('Error saving sync data file:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
} 