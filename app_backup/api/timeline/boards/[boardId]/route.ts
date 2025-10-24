import { NextResponse } from 'next/server';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ boardId: string }> }
) {
  const resolvedParams = await params;
  try {
    const { boardId } = await params;
    const updates = await request.json();
    
    // Mock update - return updated board
    const updatedBoard = {
      id: boardId,
      title: updates.title || 'Updated Board',
      position: updates.position || { x: 0, y: 0 },
      timestamp: updates.timestamp || new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    return NextResponse.json(updatedBoard);
  } catch (error) {
    console.error('Board update error:', error);
    return NextResponse.json(
      { error: 'Failed to update board' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ boardId: string }> }
) {
  const resolvedParams = await params;
  try {
    const { boardId } = await params;
    
    // Mock deletion - just return success
    return NextResponse.json({ 
      success: true, 
      message: `Board ${boardId} deleted successfully` 
    });
  } catch (error) {
    console.error('Board deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete board' },
      { status: 500 }
    );
  }
} 