import { NextResponse } from 'next/server';

export async function PATCH(
  request: Request
) {
  try {
    const bookmarkId = new URL(request.url).pathname.split('/').at(-2)!;
    const updates = await request.json();
    
    // Mock update - return updated bookmark
    const updatedBookmark = {
      id: bookmarkId,
      boardId: updates.boardId || 'board-1',
      title: updates.title || 'Updated Bookmark',
      url: updates.url,
      description: updates.description,
      order: updates.order || 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    return NextResponse.json(updatedBookmark);
  } catch (error) {
    console.error('Bookmark update error:', error);
    return NextResponse.json(
      { error: 'Failed to update bookmark' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request
) {
  try {
    const bookmarkId = new URL(request.url).pathname.split('/').at(-2)!;
    
    // Mock deletion - just return success
    return NextResponse.json({ 
      success: true, 
      message: `Bookmark ${bookmarkId} deleted successfully` 
    });
  } catch (error) {
    console.error('Bookmark deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete bookmark' },
      { status: 500 }
    );
  }
} 