import { NextRequest, NextResponse } from 'next/server'

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await context.params;
  try {
    const body = await request.json()
    const { action } = body
    const { id } = await context.params
    
    if (!['apply', 'dismiss'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "apply" or "dismiss"' },
        { status: 400 }
      )
    }
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Mock response - in real app, this would update the database
    const updatedRecommendation = {
      id,
      status: action === 'apply' ? 'applied' : 'dismissed',
      updatedAt: new Date().toISOString()
    }
    
    return NextResponse.json({
      success: true,
      recommendation: updatedRecommendation,
      message: `Recommendation ${action}d successfully`
    })
  } catch (error) {
    console.error('Error processing recommendation action:', error)
    return NextResponse.json(
      { error: 'Failed to process recommendation action' },
      { status: 500 }
    )
  }
} 