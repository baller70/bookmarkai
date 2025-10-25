/**
 * High-Quality Favicon Service
 * Fetches the best quality favicon/logo for a given URL
 */

interface FaviconResult {
  url: string;
  source: string;
  quality: 'high' | 'medium' | 'low';
}

export class FaviconService {
  /**
   * Get the best quality favicon for a URL
   * Tries multiple sources in order of quality
   */
  static async getBestFavicon(url: string): Promise<FaviconResult> {
    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname;
      const origin = urlObj.origin;

      // Try multiple sources in order of quality
      const sources = [
        // 1. Google's high-quality favicon service (best quality, 256x256)
        {
          url: `https://www.google.com/s2/favicons?domain=${domain}&sz=256`,
          source: 'google-hq',
          quality: 'high' as const,
        },
        // 2. DuckDuckGo icons (good quality, 128x128)
        {
          url: `https://icons.duckduckgo.com/ip3/${domain}.ico`,
          source: 'duckduckgo',
          quality: 'high' as const,
        },
        // 3. Clearbit Logo API (excellent for companies, 256x256)
        {
          url: `https://logo.clearbit.com/${domain}`,
          source: 'clearbit',
          quality: 'high' as const,
        },
        // 4. Favicon.io (good quality)
        {
          url: `https://favicon.io/favicon-converter/?url=${origin}`,
          source: 'favicon-io',
          quality: 'medium' as const,
        },
        // 5. Direct favicon from site
        {
          url: `${origin}/favicon.ico`,
          source: 'direct',
          quality: 'medium' as const,
        },
        // 6. Google's standard favicon service (fallback, 32x32)
        {
          url: `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
          source: 'google-standard',
          quality: 'medium' as const,
        },
      ];

      // Try each source until we find a working one
      for (const source of sources) {
        try {
          const response = await fetch(source.url, {
            method: 'HEAD',
            signal: AbortSignal.timeout(3000), // 3 second timeout
          });

          if (response.ok) {
            return source;
          }
        } catch (error) {
          // Continue to next source
          continue;
        }
      }

      // Fallback to Google's high-quality service (always works)
      return {
        url: `https://www.google.com/s2/favicons?domain=${domain}&sz=256`,
        source: 'google-hq-fallback',
        quality: 'high',
      };
    } catch (error) {
      console.error('Error fetching favicon:', error);
      // Return a default icon
      return {
        url: '/default-favicon.png',
        source: 'default',
        quality: 'low',
      };
    }
  }

  /**
   * Get multiple favicon options for a URL
   * Returns all available sources
   */
  static getFaviconOptions(url: string): FaviconResult[] {
    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname;
      const origin = urlObj.origin;

      return [
        {
          url: `https://www.google.com/s2/favicons?domain=${domain}&sz=256`,
          source: 'Google (256x256)',
          quality: 'high',
        },
        {
          url: `https://logo.clearbit.com/${domain}`,
          source: 'Clearbit Logo',
          quality: 'high',
        },
        {
          url: `https://icons.duckduckgo.com/ip3/${domain}.ico`,
          source: 'DuckDuckGo',
          quality: 'high',
        },
        {
          url: `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
          source: 'Google (128x128)',
          quality: 'medium',
        },
        {
          url: `${origin}/apple-touch-icon.png`,
          source: 'Apple Touch Icon',
          quality: 'high',
        },
        {
          url: `${origin}/favicon-192x192.png`,
          source: 'Direct (192x192)',
          quality: 'high',
        },
        {
          url: `${origin}/favicon-96x96.png`,
          source: 'Direct (96x96)',
          quality: 'medium',
        },
        {
          url: `${origin}/favicon.ico`,
          source: 'Direct ICO',
          quality: 'medium',
        },
      ];
    } catch (error) {
      return [];
    }
  }

  /**
   * Fetch and validate a favicon URL
   * Returns null if the favicon doesn't exist or is invalid
   */
  static async validateFavicon(faviconUrl: string): Promise<boolean> {
    try {
      const response = await fetch(faviconUrl, {
        method: 'HEAD',
        signal: AbortSignal.timeout(3000),
      });

      return response.ok && response.headers.get('content-type')?.startsWith('image/');
    } catch (error) {
      return false;
    }
  }

  /**
   * Get the best quality logo/icon for a URL
   * Specifically targets company logos and high-res icons
   */
  static async getHighQualityLogo(url: string): Promise<string> {
    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname;

      // Priority order for high-quality logos
      const logoSources = [
        // Clearbit is best for company logos
        `https://logo.clearbit.com/${domain}`,
        // Google's largest size
        `https://www.google.com/s2/favicons?domain=${domain}&sz=256`,
        // Try apple-touch-icon (usually high quality)
        `${urlObj.origin}/apple-touch-icon.png`,
        `${urlObj.origin}/apple-touch-icon-precomposed.png`,
        // Try various high-res favicon sizes
        `${urlObj.origin}/favicon-192x192.png`,
        `${urlObj.origin}/favicon-180x180.png`,
        `${urlObj.origin}/favicon-152x152.png`,
      ];

      for (const logoUrl of logoSources) {
        const isValid = await this.validateFavicon(logoUrl);
        if (isValid) {
          return logoUrl;
        }
      }

      // Fallback to Google's high-quality service
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=256`;
    } catch (error) {
      console.error('Error getting high-quality logo:', error);
      return '/default-favicon.png';
    }
  }
}

/**
 * Client-side hook for fetching favicons
 */
export function useFavicon(url: string) {
  const [favicon, setFavicon] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let mounted = true;

    async function fetchFavicon() {
      try {
        setIsLoading(true);
        setError(null);

        const result = await FaviconService.getBestFavicon(url);
        
        if (mounted) {
          setFavicon(result.url);
        }
      } catch (err) {
        if (mounted) {
          setError('Failed to load favicon');
          setFavicon(null);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    if (url) {
      fetchFavicon();
    }

    return () => {
      mounted = false;
    };
  }, [url]);

  return { favicon, isLoading, error };
}

// For React import
import * as React from 'react';
