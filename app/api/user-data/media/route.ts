import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { authenticateUser } from '@/lib/auth-utils';

// GET /api/user-data/media - Get user's media files
export async function GET(request: NextRequest) {
  try {
    // Use authentication utility
    const authResult = await authenticateUser(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status || 401 }
      );
    }

    const userId = authResult.userId!;

    // Create Supabase client with service role
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // Filter by media type
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    let query = supabase
      .from('user_media_files')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (type) {
      query = query.eq('type', type);
    }

    const { data: mediaFiles, error, count } = await query
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching media files:', error);
      return NextResponse.json({ error: 'Failed to fetch media files', success: false }, { status: 500 });
    }

    const totalPages = count ? Math.ceil(count / limit) : 0;

    return NextResponse.json({
      data: mediaFiles || [],
      count: count || 0,
      page,
      limit,
      total_pages: totalPages,
      success: true
    });
  } catch (error) {
    console.error('Error in GET /api/user-data/media:', error);
    return NextResponse.json({ error: 'Internal server error', success: false }, { status: 500 });
  }
}

// DELETE /api/user-data/media - Delete a media file
export async function DELETE(request: NextRequest) {
  try {
    // Use authentication utility
    const authResult = await authenticateUser(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status || 401 }
      );
    }

    const userId = authResult.userId!;

    // Create Supabase client with service role
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get('id');

    if (!fileId) {
      return NextResponse.json({ error: 'File ID is required', success: false }, { status: 400 });
    }

    // First, get the file to check ownership and get storage path
    const { data: file, error: fetchError } = await supabase
      .from('user_media_files')
      .select('*')
      .eq('id', fileId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !file) {
      return NextResponse.json({ error: 'File not found or access denied', success: false }, { status: 404 });
    }

    // Delete from storage if it's stored in Supabase storage
    if (file.url.includes('supabase')) {
      // Extract storage path from URL
      const urlParts = file.url.split('/');
      const bucketIndex = urlParts.findIndex(part => part === 'user-media');
      if (bucketIndex !== -1 && bucketIndex < urlParts.length - 1) {
        const storagePath = urlParts.slice(bucketIndex + 1).join('/');
        
        const { error: storageError } = await supabase.storage
          .from('user-media')
          .remove([storagePath]);

        if (storageError) {
          console.error('Error deleting from storage:', storageError);
          // Continue with database deletion even if storage deletion fails
        }
      }
    }

    // Delete from database
    const { error: deleteError } = await supabase
      .from('user_media_files')
      .delete()
      .eq('id', fileId)
      .eq('user_id', userId);

    if (deleteError) {
      console.error('Error deleting media file from database:', deleteError);
      return NextResponse.json({ error: 'Failed to delete media file', success: false }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/user-data/media:', error);
    return NextResponse.json({ error: 'Internal server error', success: false }, { status: 500 });
  }
} 