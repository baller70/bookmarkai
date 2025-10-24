import { NextResponse } from 'next/server'

// Mock insights data
const mockInsights = [
  {
    id: 'insight-1',
    title: 'Peak Productivity Hours',
    description: 'You are most productive between 9 AM and 11 AM based on your activity patterns.',
    category: 'Productivity',
    confidence: 0.89,
    createdAt: '2024-01-10T09:00:00Z',
    actionable: true
  },
  {
    id: 'insight-2',
    title: 'Content Preference',
    description: 'You show a strong preference for visual content over text-heavy materials.',
    category: 'Learning Style',
    confidence: 0.76,
    createdAt: '2024-01-08T14:30:00Z',
    actionable: true
  },
  {
    id: 'insight-3',
    title: 'Social Interaction Pattern',
    description: 'You tend to engage more with collaborative features during weekdays.',
    category: 'Social Behavior',
    confidence: 0.82,
    createdAt: '2024-01-05T16:45:00Z',
    actionable: false
  }
]

export async function GET() {
  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 400))
    
    return NextResponse.json(mockInsights)
  } catch (error) {
    console.error('Error fetching DNA profile insights:', error)
    return NextResponse.json(
      { error: 'Failed to fetch insights' },
      { status: 500 }
    )
  }
} 