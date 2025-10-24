import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const categories = [
      { id: 'all', name: 'All', count: 156 },
      { id: 'development', name: 'Development', count: 45 },
      { id: 'design', name: 'Design', count: 32 },
      { id: 'marketing', name: 'Marketing', count: 28 },
      { id: 'ai-ml', name: 'AI/ML', count: 21 },
      { id: 'business', name: 'Business', count: 18 },
      { id: 'education', name: 'Education', count: 12 }
    ]

    return NextResponse.json({ categories })
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    )
  }
} 