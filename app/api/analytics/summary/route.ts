// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(_request: NextRequest) {
  try {
    // Get total bookmarks count from database
    const totalBookmarks = await prisma.bookmark.count()
    
    // Get unique categories count
    const categories = await prisma.bookmark.findMany({
      select: { category: true },
      distinct: ['category']
    })
    const totalCategories = categories.length

    // Mock analytics data (can be enhanced later with actual tracking)
    const totalVisits = 0
    const totalTimeSpentMinutes = 0
    const engagementScore = 0
    const activeStreak = 0
    const thisWeekVisits = 0
    const brokenCount = 0

    return NextResponse.json({
      totalBookmarks: totalBookmarks || 0,
      totalCategories: totalCategories || 0,
      totalVisits,
      totalTimeSpentMinutes,
      engagementScore,
      activeStreak,
      thisWeekVisits,
      brokenCount,
    })
  } catch (err) {
    console.error('Summary API error:', err)
    return NextResponse.json({ 
      totalBookmarks: 0,
      totalCategories: 0,
      totalVisits: 0,
      totalTimeSpentMinutes: 0,
      engagementScore: 0,
      activeStreak: 0,
      thisWeekVisits: 0,
      brokenCount: 0,
    }, { status: 200 })
  }
}
