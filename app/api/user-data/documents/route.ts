import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser } from '../../../../lib/auth-utils';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: NextRequest) {
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
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    const { data: documents, error, count } = await supabase
      .from('user_documents')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching documents:', error);
      return NextResponse.json(
        { error: 'Failed to fetch documents' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: documents || [],
      total: count || 0,
      page,
      limit
    });
  } catch (error) {
    console.error('Documents API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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
    const { title, content, tags = [], isPublic = false } = body;

    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    const documentData = {
      user_id: userId,
      title,
      content: content || [],
      tags,
      is_public: isPublic,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: document, error } = await supabase
      .from('user_documents')
      .insert([documentData])
      .select()
      .single();

    if (error) {
      console.error('Error creating document:', error);
      return NextResponse.json(
        { error: 'Failed to create document' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: document
    });
  } catch (error) {
    console.error('Create document API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

