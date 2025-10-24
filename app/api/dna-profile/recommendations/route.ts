import { NextResponse } from 'next/server'

// Mock recommendations data
const mockRecommendations = [
  {
    id: 'rec-1',
    title: 'Optimize Morning Schedule',
    description: 'Schedule your most important tasks between 9-11 AM when you are most productive.',
    category: 'Productivity',
    priority: 'high',
    status: 'pending',
    createdAt: '2024-01-12T08:00:00Z',
    estimatedImpact: 'High'
  },
  {
    id: 'rec-2',
    title: 'Enable Visual Notifications',
    description: 'Switch to visual notification style to match your learning preferences.',
    category: 'Interface',
    priority: 'medium',
    status: 'pending',
    createdAt: '2024-01-10T12:00:00Z',
    estimatedImpact: 'Medium'
  },
  {
    id: 'rec-3',
    title: 'Join Collaborative Sessions',
    description: 'Participate in weekday collaborative sessions to maximize engagement.',
    category: 'Social',
    priority: 'low',
    status: 'pending',
    createdAt: '2024-01-08T15:30:00Z',
    estimatedImpact: 'Low'
  }
]

export async function GET() {
  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 350))
    
    return NextResponse.json(mockRecommendations)
  } catch (error) {
    console.error('Error fetching DNA profile recommendations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch recommendations' },
      { status: 500 }
    )
  }
} 