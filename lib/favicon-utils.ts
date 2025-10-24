/**
 * Frontend Favicon Utilities
 * Helper functions for displaying favicons in the UI
 */

export interface BookmarkWithFavicon {
  id: string | number;
  url: string;
  favicon?: string | null;
  custom_favicon?: string | null;
  title?: string;
}

/**
 * Get the best available favicon URL for a bookmark
 * Priority: custom_favicon > favicon > Google service > fallback
 */
export function getFaviconUrl(bookmark: BookmarkWithFavicon | string, size: number = 32): string {
  // Handle string URL input (legacy support)
  if (typeof bookmark === 'string') {
    return getGoogleFaviconUrl(bookmark, size);
  }

  // Priority 1: Custom favicon (user uploaded)
  if (bookmark.custom_favicon) {
    return bookmark.custom_favicon;
  }

  // Priority 2: Extracted favicon
  if (bookmark.favicon) {
    return bookmark.favicon;
  }

  // Priority 3: Google favicon service
  if (bookmark.url) {
    return getGoogleFaviconUrl(bookmark.url, size);
  }

  // Priority 4: Fallback
  return '/favicon.ico';
}

/**
 * Get Google favicon service URL
 */
export function getGoogleFaviconUrl(url: string, size: number = 32): string {
  try {
    // Validate that the URL is not just a single letter or invalid string
    if (!url || url.length < 3 || !/^https?:\/\//.test(url)) {
      return '/favicon.ico';
    }

    const domain = new URL(url).hostname.replace('www.', '');

    // Additional validation: ensure domain is not empty or just a single character
    if (!domain || domain.length < 2) {
      return '/favicon.ico';
    }

    return `https://www.google.com/s2/favicons?domain=${domain}&sz=${size}`;
  } catch {
    return '/favicon.ico';
  }
}

/**
 * Generate a fallback favicon based on the bookmark title or domain
 */
export function generateFallbackFavicon(bookmark: BookmarkWithFavicon): string {
  try {
    const domain = new URL(bookmark.url).hostname.replace('www.', '');
    const firstLetter = (bookmark.title || domain).charAt(0).toUpperCase();

    // Create a data URL for a simple text-based favicon
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
        <rect width="32" height="32" fill="#3B82F6" rx="4"/>
        <text x="16" y="20" font-family="Arial, sans-serif" font-size="16" font-weight="bold"
              text-anchor="middle" fill="white">${firstLetter}</text>
      </svg>
    `;

    return `data:image/svg+xml;base64,${btoa(svg)}`;
  } catch (error) {
    return '/favicon.ico';
  }
}

/**
 * Handle favicon loading errors with fallback
 */
export function handleFaviconError(
  event: React.SyntheticEvent<HTMLImageElement>,
  bookmark: BookmarkWithFavicon,
  fallbackElement?: HTMLElement | null
): void {
  const img = event.currentTarget;
  const currentSrc = img.src;

  // If we're already showing the ultimate fallback, don't try again
  if (currentSrc === '/favicon.ico' || currentSrc.startsWith('data:image/svg+xml')) {
    if (fallbackElement) {
      img.style.display = 'none';
      fallbackElement.classList.remove('hidden');
    }
    return;
  }

  // Try Google favicon service if we haven't already
  if (!currentSrc.includes('google.com/s2/favicons')) {
    img.src = getGoogleFaviconUrl(bookmark.url);
    return;
  }

  // Try generated fallback
  img.src = generateFallbackFavicon(bookmark);
}

/**
 * Preload favicon to check if it's valid
 */
export function preloadFavicon(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
  });
}

/**
 * Get domain from URL with proper validation
 */
export function getDomainFromUrl(url: string): string {
  try {
    // Validate that the URL is not just a single letter or invalid string
    if (!url || url.length < 3) {
      return 'invalid-url';
    }

    // If it doesn't start with http/https, try to parse it anyway
    let urlToParse = url;
    if (!/^https?:\/\//.test(url)) {
      urlToParse = `https://${url}`;
    }

    const domain = new URL(urlToParse).hostname.replace('www.', '');

    // Additional validation: ensure domain is not empty or just a single character
    if (!domain || domain.length < 2) {
      return 'invalid-url';
    }

    return domain;
  } catch {
    // If all parsing fails, return a safe fallback instead of the original URL
    return 'invalid-url';
  }
}


// Visual source computation helpers
export interface BookmarkVisualLike {
  url?: string;
  title?: string | null;
  // extracted and custom fields (both snake_case and camelCase tolerated)
  favicon?: string | null;
  custom_favicon?: string | null;
  custom_logo?: string | null;
  customLogo?: string | null;
  custom_background?: string | null;
  customBackground?: string | null;
}

export function computeVisuals(
  bookmark: Partial<BookmarkVisualLike>,
  globalProfileLogo?: string
): { smallFavicon: string; largeCircle: string; background: string } {
  const hasGlobal =
    typeof globalProfileLogo === 'string' &&
    globalProfileLogo.length > 0 &&
    globalProfileLogo !== '/default-profile.png';
  const customLogo = (bookmark.custom_logo ?? (bookmark as any).customLogo) || null;
  const customBg = (bookmark.custom_background ?? (bookmark as any).customBackground) || null;
  const url = bookmark.url || '';
  const extractedFavicon = (bookmark as any).favicon as string | undefined;
  const customFavicon = (bookmark as any).custom_favicon as string | undefined;

  // Small favicon: custom_favicon > extracted favicon > Google service
  const smallFavicon = customFavicon || extractedFavicon || (url ? getGoogleFaviconUrl(url, 16) : '/favicon.ico');

  // Large circle: Global DNA > custom_logo > custom_favicon > extracted favicon > Google service
  const largeCircle =
    (hasGlobal ? globalProfileLogo! : undefined) ||
    customLogo ||
    customFavicon ||
    extractedFavicon ||
    (url ? getGoogleFaviconUrl(url, 64) : '/favicon.ico');

  // Background: Global DNA > custom_background > custom_logo > custom_favicon > extracted favicon > Google service
  const background =
    (hasGlobal ? globalProfileLogo! : undefined) ||
    customBg ||
    customLogo ||
    customFavicon ||
    extractedFavicon ||
    (url ? getGoogleFaviconUrl(url, 64) : '/favicon.ico');

  return { smallFavicon, largeCircle, background };
}
