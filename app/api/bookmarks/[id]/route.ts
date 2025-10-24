
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/db'
import { authOptions } from '@/lib/auth/options'
import { z } from 'zod'

export const dynamic = "force-dynamic"

const updateBookmarkSchema = z.object({
  title: z.string().min(1).optional(),
  url: z.string().url().optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  folderId: z.string().optional(),
  notes: z.string().optional(),
})

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const bookmark = await prisma.bookmark.findFirst({
      where: {
        id: resolvedParams.id,
        userId: session.user.id
      },
      include: {
        folder: {
          select: {
            id: true,
            name: true,
            color: true,
            icon: true
          }
        }
      }
    })

    if (!bookmark) {
      return NextResponse.json({ error: 'Bookmark not found' }, { status: 404 })
    }

    return NextResponse.json(bookmark)
  } catch (error) {
    console.error('Failed to fetch bookmark:', error)
    return NextResponse.json(
      { error: 'Failed to fetch bookmark' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const data = updateBookmarkSchema.parse(body)

    // Check if bookmark exists and belongs to user
    const existingBookmark = await prisma.bookmark.findFirst({
      where: {
        id: resolvedParams.id,
        userId: session.user.id
      }
    })

    if (!existingBookmark) {
      return NextResponse.json({ error: 'Bookmark not found' }, { status: 404 })
    }

    const bookmark = await prisma.bookmark.update({
      where: { id: resolvedParams.id },
      data,
      include: {
        folder: {
          select: {
            id: true,
            name: true,
            color: true,
            icon: true
          }
        }
      }
    })

    return NextResponse.json(bookmark)
  } catch (error) {
    console.error('Failed to update bookmark:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update bookmark' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if bookmark exists and belongs to user
    const existingBookmark = await prisma.bookmark.findFirst({
      where: {
        id: resolvedParams.id,
        userId: session.user.id
      }
    })

    if (!existingBookmark) {
      return NextResponse.json({ error: 'Bookmark not found' }, { status: 404 })
    }

    await prisma.bookmark.delete({
      where: { id: resolvedParams.id }
    })

    return NextResponse.json({ message: 'Bookmark deleted successfully' })
  } catch (error) {
    console.error('Failed to delete bookmark:', error)
    return NextResponse.json(
      { error: 'Failed to delete bookmark' },
      { status: 500 }
    )
  }
}
