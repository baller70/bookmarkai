import { NextRequest, NextResponse } from 'next/server';

// Mock timeline data
const mockTimelineData = {
  boards: [
    {
      id: 'board-1',
      title: 'Welcome Board',
      position: { x: 200, y: 150 },
      timestamp: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ],
  bookmarks: [
    {
      id: 'bookmark-1',
      boardId: 'board-1',
      title: 'Getting Started',
      url: 'https://example.com',
      order: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ],
  connectors: []
};

export async function GET() {
  try {
    return NextResponse.json(mockTimelineData);
  } catch (error) {
    console.error('Timeline API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch timeline data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Handle different types of creation requests
    if (body.type === 'board') {
      const newBoard = {
        id: `board-${Date.now()}`,
        title: body.title,
        position: body.position,
        timestamp: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      return NextResponse.json(newBoard);
    }
    
    if (body.type === 'bookmark') {
      const newBookmark = {
        id: `bookmark-${Date.now()}`,
        boardId: body.boardId,
        title: body.title,
        url: body.url,
        order: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      return NextResponse.json(newBookmark);
    }
    
    return NextResponse.json({ error: 'Invalid request type' }, { status: 400 });
  } catch (error) {
    console.error('Timeline creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create timeline item' },
      { status: 500 }
    );
  }
} 