import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser } from '../../../../../lib/auth-utils';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  try {
    const authResult = await authenticateUser(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status || 401 }
      );
    }

    const userId = authResult.userId!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data: document, error } = await supabase
      .from('user_documents')
      .select('*')
      .eq('id', resolvedParams.id)
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Document not found' },
          { status: 404 }
        );
      }
      console.error('Error fetching document:', error);
      return NextResponse.json(
        { error: 'Failed to fetch document' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: document
    });
  } catch (error) {
    console.error('Get document API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  try {
    const authResult = await authenticateUser(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status || 401 }
      );
    }

    const userId = authResult.userId!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const body = await request.json();
    const { title, content, tags, isPublic } = body;

    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (tags !== undefined) updateData.tags = tags;
    if (isPublic !== undefined) updateData.is_public = isPublic;

    const { data: document, error } = await supabase
      .from('user_documents')
      .update(updateData)
      .eq('id', resolvedParams.id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Document not found' },
          { status: 404 }
        );
      }
      console.error('Error updating document:', error);
      return NextResponse.json(
        { error: 'Failed to update document' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: document
    });
  } catch (error) {
    console.error('Update document API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  try {
    const authResult = await authenticateUser(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status || 401 }
      );
    }

    const userId = authResult.userId!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { error } = await supabase
      .from('user_documents')
      .delete()
      .eq('id', resolvedParams.id)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting document:', error);
      return NextResponse.json(
        { error: 'Failed to delete document' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true
    });
  } catch (error) {
    console.error('Delete document API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

