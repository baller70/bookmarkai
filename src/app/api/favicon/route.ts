import { NextRequest, NextResponse } from 'next/server';
import { FaviconService } from '@/lib/favicon-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');

    if (!url) {
      return NextResponse.json(
        { error: 'URL parameter is required' },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    // Get the best favicon
    const favicon = await FaviconService.getBestFavicon(url);

    return NextResponse.json({
      success: true,
      favicon: favicon.url,
      source: favicon.source,
      quality: favicon.quality,
    });
  } catch (error) {
    console.error('Error fetching favicon:', error);
    return NextResponse.json(
      { error: 'Failed to fetch favicon' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body;

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    // Get high-quality logo
    const logo = await FaviconService.getHighQualityLogo(url);

    // Get all available options
    const options = FaviconService.getFaviconOptions(url);

    return NextResponse.json({
      success: true,
      logo,
      options,
    });
  } catch (error) {
    console.error('Error fetching logo:', error);
    return NextResponse.json(
      { error: 'Failed to fetch logo' },
      { status: 500 }
    );
  }
}
