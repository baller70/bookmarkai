/**
 * Favicon Extraction Utility
 * Extracts favicons from websites using multiple strategies
 */

export interface FaviconResult {
  faviconUrl: string | null;
  source: 'html-link' | 'root-favicon' | 'google-service' | 'fallback';
  success: boolean;
  error?: string;
}

export class FaviconExtractor {
  private static readonly TIMEOUT = 5000; // 5 seconds timeout
  private static readonly USER_AGENT = 'BookmarkHub Favicon Extractor 1.0';

  /**
   * Extract favicon from a website URL
   * Tries multiple strategies in order of preference
   */
  static async extractFavicon(url: string): Promise<FaviconResult> {
    try {
      console.log(`🔍 Extracting favicon for: ${url}`);
      
      // Parse the URL to get domain and base URL
      const parsedUrl = new URL(url);
      const domain = parsedUrl.hostname;
      const baseUrl = `${parsedUrl.protocol}//${parsedUrl.hostname}`;
      
      // Strategy 1: Try to extract from HTML <link> tags
      try {
        const htmlFavicon = await this.extractFromHTML(url);
        if (htmlFavicon) {
          console.log(`✅ Found favicon in HTML: ${htmlFavicon}`);
          return {
            faviconUrl: htmlFavicon,
            source: 'html-link',
            success: true
          };
        }
      } catch (error) {
        console.warn(`⚠️ HTML extraction failed: ${(error as Error).message}`);
      }

      // Strategy 2: Try common favicon locations
      const commonPaths = ['/favicon.ico', '/favicon.png', '/favicon.svg'];
      for (const path of commonPaths) {
        try {
          const faviconUrl = `${baseUrl}${path}`;
          const exists = await this.checkFaviconExists(faviconUrl);
          if (exists) {
            console.log(`✅ Found favicon at: ${faviconUrl}`);
            return {
              faviconUrl,
              source: 'root-favicon',
              success: true
            };
          }
        } catch (error) {
          console.warn(`⚠️ Failed to check ${path}: ${(error as Error).message}`);
        }
      }

      // Strategy 3: Use Google's favicon service as fallback
      const googleFavicon = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
      console.log(`🔄 Using Google favicon service: ${googleFavicon}`);
      return {
        faviconUrl: googleFavicon,
        source: 'google-service',
        success: true
      };

    } catch (error) {
      console.error(`❌ Favicon extraction failed for ${url}:`, error);
      return {
        faviconUrl: null,
        source: 'fallback',
        success: false,
        error: (error as Error).message
      };
    }
  }

  /**
   * Extract favicon URL from HTML content
   */
  private static async extractFromHTML(url: string): Promise<string | null> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': this.USER_AGENT,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        redirect: 'follow',
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const html = await response.text();
      const parsedUrl = new URL(url);
      const baseUrl = `${parsedUrl.protocol}//${parsedUrl.hostname}`;

      // Look for favicon link tags in order of preference
      // Use more specific regex patterns to avoid false matches
      // Reordered to prioritize working patterns first
      const faviconPatterns = [
        // Alternate icon (works well for GitHub)
        /<link[^>]*rel=['"]\s*alternate\s+icon\s*['"'][^>]*href=['"']([^'"]*)['"']/i,
        // Standard icon - more precise to avoid data-base-href confusion
        /<link[^>]*rel=['"]\s*icon\s*['"'][^>]*?href=['"']([^'"]*?\.(?:ico|png|svg|gif|jpg|jpeg))['"']/i,
        // Shortcut icon (legacy)
        /<link[^>]*rel=['"]\s*shortcut\s+icon\s*['"'][^>]*href=['"']([^'"]*)['"']/i,
        // Apple touch icon
        /<link[^>]*rel=['"]\s*apple-touch-icon\s*['"'][^>]*href=['"']([^'"]*)['"']/i,
        // Apple touch icon precomposed
        /<link[^>]*rel=['"]\s*apple-touch-icon-precomposed\s*['"'][^>]*href=['"']([^'"]*)['"']/i
      ];

      for (const regex of faviconPatterns) {
        const match = html.match(regex);

        if (match && match[1]) {
          let faviconUrl = match[1];

          // Convert relative URLs to absolute
          if (faviconUrl.startsWith('//')) {
            faviconUrl = `${parsedUrl.protocol}${faviconUrl}`;
          } else if (faviconUrl.startsWith('/')) {
            faviconUrl = `${baseUrl}${faviconUrl}`;
          } else if (!faviconUrl.startsWith('http')) {
            faviconUrl = `${baseUrl}/${faviconUrl}`;
          }

          return faviconUrl;
        }
      }

      return null;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Check if a favicon URL exists and is accessible
   */
  private static async checkFaviconExists(faviconUrl: string): Promise<boolean> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT);

    try {
      const response = await fetch(faviconUrl, {
        method: 'HEAD',
        signal: controller.signal,
        headers: {
          'User-Agent': this.USER_AGENT,
        },
        redirect: 'follow',
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      clearTimeout(timeoutId);
      return false;
    }
  }

  /**
   * Generate a fallback favicon based on the domain name
   * Creates a simple text-based favicon using the first letter of the domain
   */
  static generateFallbackFavicon(url: string): string {
    try {
      const domain = new URL(url).hostname.replace('www.', '');
      const firstLetter = domain.charAt(0).toUpperCase();
      
      // Create a data URL for a simple text-based favicon
      const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
          <rect width="64" height="64" fill="#3B82F6" rx="8"/>
          <text x="32" y="40" font-family="Arial, sans-serif" font-size="32" font-weight="bold" 
                text-anchor="middle" fill="white">${firstLetter}</text>
        </svg>
      `;
      
      return `data:image/svg+xml;base64,${btoa(svg)}`;
    } catch (error) {
      // Ultimate fallback - a generic bookmark icon
      return '/favicon.ico';
    }
  }

  /**
   * Validate if a favicon URL is accessible
   */
  static async validateFavicon(faviconUrl: string): Promise<boolean> {
    if (!faviconUrl || faviconUrl === '/favicon.ico') {
      return false;
    }

    try {
      return await this.checkFaviconExists(faviconUrl);
    } catch (error) {
      return false;
    }
  }
}
