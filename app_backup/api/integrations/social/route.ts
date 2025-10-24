import { NextRequest, NextResponse } from 'next/server';

export interface SocialShareOptions {
  platform: 'twitter' | 'linkedin' | 'facebook' | 'reddit' | 'email' | 'copy';
  url: string;
  title: string;
  description?: string;
  tags?: string[];
  via?: string;
  hashtags?: string[];
}

export interface SocialShareResult {
  success: boolean;
  shareUrl?: string;
  error?: string;
  platform: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...shareOptions } = body as { action: string } & SocialShareOptions;

    switch (action) {
      case 'generate-share-url':
        const shareUrl = generateSocialShareUrl(shareOptions);
        return NextResponse.json({
          success: true,
          shareUrl,
          platform: shareOptions.platform
        });

      case 'share':
        const result = await shareToSocialPlatform(shareOptions);
        return NextResponse.json(result);

      case 'get-share-options':
        const options = getSocialShareOptions(shareOptions.url, shareOptions.title, shareOptions.description);
        return NextResponse.json({
          success: true,
          options
        });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Social sharing API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

function generateSocialShareUrl(options: SocialShareOptions): string {
  const { platform, url, title, description, tags, via, hashtags } = options;
  
  // Encode parameters for URL safety
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const encodedDescription = encodeURIComponent(description || '');

  switch (platform) {
    case 'twitter':
      let twitterText = title;
      if (description) {
        twitterText += ` - ${description}`;
      }
      
      const twitterParams = new URLSearchParams({
        text: twitterText,
        url: url
      });
      
      if (via) {
        twitterParams.set('via', via);
      }
      
      if (hashtags && hashtags.length > 0) {
        twitterParams.set('hashtags', hashtags.join(','));
      }
      
      return `https://twitter.com/intent/tweet?${twitterParams.toString()}`;

    case 'linkedin':
      const linkedinParams = new URLSearchParams({
        mini: 'true',
        url: url,
        title: title
      });
      
      if (description) {
        linkedinParams.set('summary', description);
      }
      
      return `https://www.linkedin.com/sharing/share-offsite/?${linkedinParams.toString()}`;

    case 'facebook':
      const facebookParams = new URLSearchParams({
        u: url,
        quote: `${title}${description ? ` - ${description}` : ''}`
      });
      
      return `https://www.facebook.com/sharer/sharer.php?${facebookParams.toString()}`;

    case 'reddit':
      const redditParams = new URLSearchParams({
        url: url,
        title: title
      });
      
      return `https://www.reddit.com/submit?${redditParams.toString()}`;

    case 'email':
      const emailSubject = encodeURIComponent(`Check out: ${title}`);
      const emailBody = encodeURIComponent(
        `I thought you might be interested in this:\n\n${title}\n${url}${description ? `\n\n${description}` : ''}`
      );
      
      return `mailto:?subject=${emailSubject}&body=${emailBody}`;

    case 'copy':
      // For copy action, return the URL to be copied
      return url;

    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }
}

async function shareToSocialPlatform(options: SocialShareOptions): Promise<SocialShareResult> {
  try {
    const shareUrl = generateSocialShareUrl(options);
    
    // For client-side sharing, we just return the URL
    // The actual sharing would be handled on the frontend
    return {
      success: true,
      shareUrl,
      platform: options.platform
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      platform: options.platform
    };
  }
}

function getSocialShareOptions(url: string, title: string, description?: string) {
  const baseOptions = { url, title, description };
  
  return {
    twitter: {
      ...baseOptions,
      platform: 'twitter' as const,
      shareUrl: generateSocialShareUrl({ ...baseOptions, platform: 'twitter' }),
      icon: 'twitter',
      label: 'Share on Twitter'
    },
    linkedin: {
      ...baseOptions,
      platform: 'linkedin' as const,
      shareUrl: generateSocialShareUrl({ ...baseOptions, platform: 'linkedin' }),
      icon: 'linkedin',
      label: 'Share on LinkedIn'
    },
    facebook: {
      ...baseOptions,
      platform: 'facebook' as const,
      shareUrl: generateSocialShareUrl({ ...baseOptions, platform: 'facebook' }),
      icon: 'facebook',
      label: 'Share on Facebook'
    },
    reddit: {
      ...baseOptions,
      platform: 'reddit' as const,
      shareUrl: generateSocialShareUrl({ ...baseOptions, platform: 'reddit' }),
      icon: 'reddit',
      label: 'Share on Reddit'
    },
    email: {
      ...baseOptions,
      platform: 'email' as const,
      shareUrl: generateSocialShareUrl({ ...baseOptions, platform: 'email' }),
      icon: 'mail',
      label: 'Share via Email'
    },
    copy: {
      ...baseOptions,
      platform: 'copy' as const,
      shareUrl: url,
      icon: 'copy',
      label: 'Copy Link'
    }
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');
    const title = searchParams.get('title');
    const description = searchParams.get('description');

    if (!url || !title) {
      return NextResponse.json(
        { success: false, error: 'URL and title are required' },
        { status: 400 }
      );
    }

    const options = getSocialShareOptions(url, title, description || undefined);
    
    return NextResponse.json({
      success: true,
      options
    });
  } catch (error) {
    console.error('Social sharing API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
} 