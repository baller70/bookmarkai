
import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { authenticateUser } from '@/lib/auth-utils';
import prisma from '@/lib/prisma';

// POST /api/bookmarks/upload - Upload custom images for bookmark customization
export async function POST(request: NextRequest) {
  try {
    const { userId } = await authenticateUser(request);

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const uploadType = formData.get('uploadType') as string; // 'favicon', 'logo', 'background'
    const bookmarkId = formData.get('bookmarkId') as string;

    console.log(`🔧 Upload request details:`, { uploadType, bookmarkId, userId, fileName: file?.name });

    if (!file) {
      return NextResponse.json({ error: 'No file provided', success: false }, { status: 400 });
    }

    if (!uploadType || !['favicon', 'logo', 'background'].includes(uploadType)) {
      return NextResponse.json({ error: 'Invalid upload type. Must be favicon, logo, or background', success: false }, { status: 400 });
    }

    if (!bookmarkId) {
      return NextResponse.json({ error: 'Bookmark ID is required', success: false }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Invalid file type. Only PNG, JPG, SVG, and WebP images are allowed', 
        success: false 
      }, { status: 400 });
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: 'File too large. Maximum size is 5MB', 
        success: false 
      }, { status: 400 });
    }

    // Generate unique filename
    const fileExtension = file.name.split('.').pop();
    const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExtension}`;
    
    // Create upload directory
    const uploadDir = join(process.cwd(), 'public', 'uploads', userId, 'bookmarks', bookmarkId, uploadType);
    await mkdir(uploadDir, { recursive: true });
    
    // Save file to file system
    const filePath = join(uploadDir, uniqueFileName);
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, fileBuffer);

    // Generate public URL
    const publicUrl = `/uploads/${userId}/bookmarks/${bookmarkId}/${uploadType}/${uniqueFileName}`;

    // Update bookmark with the new custom upload URL
    const updateField = uploadType === 'favicon' ? 'customFavicon' : 
                       uploadType === 'logo' ? 'customLogo' : 'customBackground';

    try {
      await prisma.bookmark.update({
        where: { 
          id: bookmarkId,
          userId: userId 
        },
        data: {
          [updateField]: publicUrl
        }
      });

      console.log(`✅ Successfully updated bookmark ${bookmarkId} with ${uploadType}: ${publicUrl}`);

      return NextResponse.json({
        success: true,
        url: publicUrl,
        message: `${uploadType} uploaded successfully`
      });
    } catch (updateError) {
      console.error('Error updating bookmark:', updateError);
      return NextResponse.json({ error: 'Failed to update bookmark', success: false }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in upload handler:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      success: false 
    }, { status: 500 });
  }
}

// GET /api/bookmarks/upload - Get upload information for a bookmark
export async function GET(request: NextRequest) {
  try {
    const { userId } = await authenticateUser(request);
    const { searchParams } = new URL(request.url);
    const bookmarkId = searchParams.get('bookmarkId');

    if (!bookmarkId) {
      return NextResponse.json({ error: 'Bookmark ID is required' }, { status: 400 });
    }

    const bookmark = await prisma.bookmark.findFirst({
      where: {
        id: bookmarkId,
        userId: userId
      },
      select: {
        customFavicon: true,
        customLogo: true,
        customBackground: true,
      }
    });

    if (!bookmark) {
      return NextResponse.json({ error: 'Bookmark not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      uploads: {
        favicon: bookmark.customFavicon,
        logo: bookmark.customLogo,
        background: bookmark.customBackground,
      }
    });
  } catch (error) {
    console.error('Error getting bookmark uploads:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/bookmarks/upload - Delete a custom upload
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await authenticateUser(request);
    const { searchParams } = new URL(request.url);
    const bookmarkId = searchParams.get('bookmarkId');
    const uploadType = searchParams.get('uploadType');

    if (!bookmarkId || !uploadType) {
      return NextResponse.json({ error: 'Bookmark ID and upload type are required' }, { status: 400 });
    }

    const updateField = uploadType === 'favicon' ? 'customFavicon' : 
                       uploadType === 'logo' ? 'customLogo' : 'customBackground';

    await prisma.bookmark.update({
      where: {
        id: bookmarkId,
        userId: userId
      },
      data: {
        [updateField]: null
      }
    });

    return NextResponse.json({
      success: true,
      message: `${uploadType} removed successfully`
    });
  } catch (error) {
    console.error('Error deleting upload:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
