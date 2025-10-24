// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Get all bookmarks with basic analytics data
    const bookmarks = await prisma.bookmark.findMany({
      select: {
        id: true,
        title: true,
        url: true,
        category: true,
        tags: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    // Transform into analytics format
    const analyticsData = bookmarks.reduce((acc, bookmark) => {
      acc[bookmark.id] = {
        id: bookmark.id,
        title: bookmark.title,
        url: bookmark.url,
        category: bookmark.category,
        tags: bookmark.tags || [],
        visits: 0,
        timeSpent: 0,
        lastVisited: bookmark.updatedAt.toISOString(),
        createdAt: bookmark.createdAt.toISOString()
      }
      return acc
    }, {} as Record<string, any>)
    
    return NextResponse.json({
      success: true,
      bookmarks: analyticsData,
      lastUpdated: new Date().toISOString()
    })
  } catch (error) {
    console.error('Failed to load analytics:', error)
    return NextResponse.json(
      { 
        success: false,
        bookmarks: {},
        lastUpdated: new Date().toISOString(),
        error: 'Failed to load analytics' 
      },
      { status: 200 }
    )
  }
}  