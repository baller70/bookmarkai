import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import { join } from 'path'
import { authenticateUser } from '@/lib/auth-utils'

// POST /api/user-data/upload - Upload file to Supabase storage and save metadata
export async function POST(request: NextRequest) {
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

    // Create Supabase client with service role for database operations
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string || 'document'; // 'image', 'video', 'document', 'logo'
    const tags = formData.get('tags') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided', success: false }, { status: 400 });
    }

    // Validate file type and size
    const supabaseMaxSize = 50 * 1024 * 1024; // 50MB to Supabase

    // Generate unique filename
    const fileExtension = file.name.split('.').pop();
    const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExtension}`;

    // If file is larger than Supabase threshold, save locally under public/user-media
    if (file.size > supabaseMaxSize) {
      const publicDir = join(process.cwd(), 'public', 'user-media', userId, type)
      if (!existsSync(publicDir)) {
        await mkdir(publicDir, { recursive: true })
      }
      const localPath = join(publicDir, uniqueFileName)
      const arrayBuffer = await file.arrayBuffer()
      await writeFile(localPath, Buffer.from(arrayBuffer))

      const publicUrl = `/user-media/${userId}/${type}/${uniqueFileName}`

      const mediaFileData = {
        user_id: userId,
        name: file.name,
        type: type as 'image' | 'video' | 'document' | 'logo',
        url: publicUrl,
        size: file.size,
        mime_type: file.type,
        tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
        metadata: {
          original_name: file.name,
          upload_path: localPath,
          file_extension: fileExtension,
          storage: 'local'
        }
      };

      const { data: mediaFile, error: dbError } = await supabase
        .from('user_media_files')
        .insert(mediaFileData)
        .select()
        .single();

      if (dbError) {
        return NextResponse.json({ error: 'Failed to save file metadata', success: false }, { status: 500 });
      }

      return NextResponse.json({ 
        data: mediaFile, 
        success: true,
        message: 'File saved locally due to large size'
      }, { status: 201 });
    }

    const filePath = `${userId}/${type}/${uniqueFileName}`;

    // Convert file to buffer
    const fileBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(fileBuffer);

    // Upload to Supabase storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('user-media')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false
      });

    if (uploadError) {
      console.error('Error uploading file:', uploadError);
      return NextResponse.json({ error: 'Failed to upload file', success: false }, { status: 500 });
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('user-media')
      .getPublicUrl(filePath);

    // Save metadata to database
    const mediaFileData = {
      user_id: userId,
      name: file.name,
      type: type as 'image' | 'video' | 'document' | 'logo',
      url: publicUrl,
      size: file.size,
      mime_type: file.type,
      tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
      metadata: {
        original_name: file.name,
        upload_path: filePath,
        file_extension: fileExtension,
        storage: 'supabase'
      }
    };

    const { data: mediaFile, error: dbError } = await supabase
      .from('user_media_files')
      .insert(mediaFileData)
      .select()
      .single();

    if (dbError) {
      console.error('Error saving media file metadata:', dbError);
      
      // Clean up uploaded file if database save fails
      await supabase.storage
        .from('user-media')
        .remove([filePath]);
        
      return NextResponse.json({ error: 'Failed to save file metadata', success: false }, { status: 500 });
    }

    return NextResponse.json({ 
      data: mediaFile, 
      success: true,
      message: 'File uploaded successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error in POST /api/user-data/upload:', error);
    return NextResponse.json({ error: 'Internal server error', success: false }, { status: 500 });
  }
}

// GET /api/user-data/upload - Get upload status or signed URL for large files
export async function GET(request: NextRequest) {
  try {
    // Lazy initialization to avoid build-time environment variable issues
let supabaseClient: any = null

const getSupabaseClient = () => {
  if (!supabaseClient && process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )
  }
  return supabaseClient
};
    const { data: { user }, error: authError } = await getSupabaseClient().auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized', success: false }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const fileName = searchParams.get('fileName');
    const fileType = searchParams.get('fileType');
    const type = searchParams.get('type') || 'document';

    if (!fileName || !fileType) {
      return NextResponse.json({ error: 'fileName and fileType are required', success: false }, { status: 400 });
    }

    // Generate signed URL for direct upload (useful for large files)
    const fileExtension = fileName.split('.').pop();
    const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExtension}`;
    const filePath = `${user.id}/${type}/${uniqueFileName}`;

    const { data: signedUrl, error: signedUrlError } = await getSupabaseClient().storage
      .from('user-media')
      .createSignedUploadUrl(filePath);

    if (signedUrlError) {
      console.error('Error creating signed URL:', signedUrlError);
      return NextResponse.json({ error: 'Failed to create upload URL', success: false }, { status: 500 });
    }

    return NextResponse.json({
      data: {
        signedUrl: signedUrl.signedUrl,
        token: signedUrl.token,
        path: filePath,
        fileName: uniqueFileName
      },
      success: true
    });

  } catch (error) {
    console.error('Error in GET /api/user-data/upload:', error);
    return NextResponse.json({ error: 'Internal server error', success: false }, { status: 500 });
  }
}    