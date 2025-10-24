import { NextResponse } from 'next/server'

// Mock stats data
const mockStats = {
  totalEvents: 1247,
  profileAge: 45,
  lastAnalysis: '2024-01-15T10:30:00Z',
  confidenceScore: 87,
  activeInsights: 12,
  pendingRecommendations: 5
}

export async function GET() {
  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300))
    
    return NextResponse.json(mockStats)
  } catch (error) {
    console.error('Error fetching DNA profile stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
} 