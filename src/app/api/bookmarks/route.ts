import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { DbService } from '@/lib/db-service'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category') || undefined
    const search = searchParams.get('search') || undefined
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined

    const bookmarks = await DbService.getBookmarks(session.user.id, {
      category,
      search,
      limit,
      offset
    })

    return NextResponse.json({ success: true, bookmarks })
  } catch (error) {
    console.error('Error fetching bookmarks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch bookmarks' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { title, url, description, category, tags, folderId, enableAI } = body

    // Validate required fields
    if (!title?.trim()) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      )
    }

    if (!url?.trim()) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      )
    }

    // Validate URL format
    try {
      new URL(url)
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      )
    }

    // Check for duplicate URL (prevent double submissions)
    const existingBookmarks = await DbService.getBookmarks(session.user.id, {
      search: url,
      limit: 1
    })

    if (existingBookmarks.some(b => b.url === url)) {
      return NextResponse.json(
        { error: 'Bookmark with this URL already exists' },
        { status: 409 }
      )
    }

    // Create bookmark
    const bookmark = await DbService.createBookmark(session.user.id, {
      title: title.trim(),
      url: url.trim(),
      description: description?.trim(),
      category: category?.trim(),
      tags: Array.isArray(tags) ? tags : [],
      folderId: folderId || undefined
    })

    // TODO: If enableAI is true, trigger AI processing in background
    // This would be done via a queue or background job

    return NextResponse.json({
      success: true,
      bookmark,
      message: 'Bookmark created successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating bookmark:', error)
    return NextResponse.json(
      { error: 'Failed to create bookmark' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, ...data } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Bookmark ID is required' },
        { status: 400 }
      )
    }

    await DbService.updateBookmark(id, session.user.id, data)

    return NextResponse.json({
      success: true,
      message: 'Bookmark updated successfully'
    })

  } catch (error) {
    console.error('Error updating bookmark:', error)
    return NextResponse.json(
      { error: 'Failed to update bookmark' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Bookmark ID is required' },
        { status: 400 }
      )
    }

    await DbService.deleteBookmark(id, session.user.id)

    return NextResponse.json({
      success: true,
      message: 'Bookmark deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting bookmark:', error)
    return NextResponse.json(
      { error: 'Failed to delete bookmark' },
      { status: 500 }
    )
  }
}
