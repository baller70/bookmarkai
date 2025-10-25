import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { DatabaseService } from '@/lib/db-service';
import { FaviconService } from '@/lib/favicon-service';

/**
 * Update all bookmarks with high-quality favicons
 * This endpoint can be called to upgrade existing bookmarks
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all user's bookmarks
    const bookmarks = await DatabaseService.getBookmarks(session.user.id, {
      limit: 1000,
    });

    let updated = 0;
    let failed = 0;
    const results = [];

    // Update each bookmark with high-quality favicon
    for (const bookmark of bookmarks) {
      try {
        // Skip if already has a high-quality favicon
        if (
          bookmark.favicon &&
          (bookmark.favicon.includes('sz=256') ||
            bookmark.favicon.includes('clearbit') ||
            bookmark.favicon.includes('192x192'))
        ) {
          results.push({
            id: bookmark.id,
            title: bookmark.title,
            status: 'skipped',
            reason: 'Already has high-quality favicon',
          });
          continue;
        }

        // Fetch high-quality favicon
        const faviconResult = await FaviconService.getBestFavicon(bookmark.url);

        // Update bookmark
        await DatabaseService.updateBookmark(bookmark.id, session.user.id, {
          favicon: faviconResult.url,
        });

        updated++;
        results.push({
          id: bookmark.id,
          title: bookmark.title,
          status: 'updated',
          favicon: faviconResult.url,
          source: faviconResult.source,
          quality: faviconResult.quality,
        });
      } catch (error) {
        failed++;
        results.push({
          id: bookmark.id,
          title: bookmark.title,
          status: 'failed',
          error: String(error),
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Updated ${updated} bookmarks, ${failed} failed`,
      stats: {
        total: bookmarks.length,
        updated,
        failed,
        skipped: bookmarks.length - updated - failed,
      },
      results,
    });
  } catch (error) {
    console.error('Error updating favicons:', error);
    return NextResponse.json(
      { error: 'Failed to update favicons' },
      { status: 500 }
    );
  }
}

/**
 * Get favicon upgrade status
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all user's bookmarks
    const bookmarks = await DatabaseService.getBookmarks(session.user.id, {
      limit: 1000,
    });

    let highQuality = 0;
    let lowQuality = 0;
    let noFavicon = 0;

    for (const bookmark of bookmarks) {
      if (!bookmark.favicon) {
        noFavicon++;
      } else if (
        bookmark.favicon.includes('sz=256') ||
        bookmark.favicon.includes('clearbit') ||
        bookmark.favicon.includes('192x192')
      ) {
        highQuality++;
      } else {
        lowQuality++;
      }
    }

    return NextResponse.json({
      success: true,
      stats: {
        total: bookmarks.length,
        highQuality,
        lowQuality,
        noFavicon,
        needsUpgrade: lowQuality + noFavicon,
      },
    });
  } catch (error) {
    console.error('Error getting favicon status:', error);
    return NextResponse.json(
      { error: 'Failed to get favicon status' },
      { status: 500 }
    );
  }
}
