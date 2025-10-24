import { NextRequest, NextResponse } from 'next/server'

// Mock DNA profile data
const mockProfile = {
  id: 'dna-profile-1',
  userId: 'user-1',
  status: 'analyzed',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: new Date().toISOString(),
  analysis: {
    behaviorPatterns: [
      { pattern: 'Early Bird', confidence: 0.85, description: 'Most active in morning hours' },
      { pattern: 'Detail Oriented', confidence: 0.92, description: 'Shows preference for detailed information' },
      { pattern: 'Visual Learner', confidence: 0.78, description: 'Responds well to visual content' }
    ],
    preferences: [
      { category: 'Content Type', preference: 'Technical Articles', score: 0.88 },
      { category: 'Interface Style', preference: 'Minimalist', score: 0.76 },
      { category: 'Notification Timing', preference: 'Morning', score: 0.91 }
    ]
  }
}

export async function GET() {
  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500))
    
    return NextResponse.json(mockProfile)
  } catch (error) {
    console.error('Error fetching DNA profile:', error)
    return NextResponse.json(
      { error: 'Failed to fetch DNA profile' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    if (body.action === 'analyze') {
      // Simulate analysis process
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const updatedProfile = {
        ...mockProfile,
        updatedAt: new Date().toISOString(),
        analysis: {
          ...mockProfile.analysis,
          lastAnalysis: new Date().toISOString()
        }
      }
      
      return NextResponse.json(updatedProfile)
    }
    
    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error processing DNA profile request:', error)
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    )
  }
} 