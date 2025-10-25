'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';

interface HighQualityFaviconProps {
  url: string;
  favicon?: string;
  alt: string;
  size?: number;
  className?: string;
  fallbackIcon?: React.ReactNode;
}

export function HighQualityFavicon({
  url,
  favicon,
  alt,
  size = 64,
  className = '',
  fallbackIcon,
}: HighQualityFaviconProps) {
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    async function loadFavicon() {
      setIsLoading(true);
      setHasError(false);

      try {
        // If favicon is provided, use it
        if (favicon) {
          setImgSrc(favicon);
          setIsLoading(false);
          return;
        }

        // Otherwise, fetch high-quality favicon
        const urlObj = new URL(url);
        const domain = urlObj.hostname;

        // Try multiple high-quality sources
        const sources = [
          `https://logo.clearbit.com/${domain}`,
          `https://www.google.com/s2/favicons?domain=${domain}&sz=256`,
          `https://icons.duckduckgo.com/ip3/${domain}.ico`,
          `${urlObj.origin}/apple-touch-icon.png`,
          `${urlObj.origin}/favicon-192x192.png`,
        ];

        // Try each source
        for (const source of sources) {
          try {
            const response = await fetch(source, { method: 'HEAD' });
            if (response.ok) {
              setImgSrc(source);
              setIsLoading(false);
              return;
            }
          } catch {
            continue;
          }
        }

        // Fallback to Google's service (always works)
        setImgSrc(`https://www.google.com/s2/favicons?domain=${domain}&sz=256`);
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading favicon:', error);
        setHasError(true);
        setIsLoading(false);
      }
    }

    if (url) {
      loadFavicon();
    }
  }, [url, favicon]);

  if (isLoading) {
    return (
      <div
        className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }

  if (hasError || !imgSrc) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded ${className}`}
        style={{ width: size, height: size }}
      >
        {fallbackIcon || (
          <svg
            className="w-1/2 h-1/2 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
            />
          </svg>
        )}
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      <Image
        src={imgSrc}
        alt={alt}
        width={size}
        height={size}
        className="rounded object-cover"
        onError={() => {
          setHasError(true);
          // Try fallback
          const urlObj = new URL(url);
          const domain = urlObj.hostname;
          setImgSrc(`https://www.google.com/s2/favicons?domain=${domain}&sz=256`);
        }}
        unoptimized // Allow external images
      />
    </div>
  );
}

/**
 * High-quality bookmark card with background image
 */
interface BookmarkCardProps {
  title: string;
  url: string;
  favicon?: string;
  description?: string;
  onClick?: () => void;
  className?: string;
}

export function HighQualityBookmarkCard({
  title,
  url,
  favicon,
  description,
  onClick,
  className = '',
}: BookmarkCardProps) {
  const [bgImage, setBgImage] = useState<string | null>(null);

  useEffect(() => {
    async function loadBackgroundImage() {
      try {
        const urlObj = new URL(url);
        const domain = urlObj.hostname;

        // Try to get high-quality logo for background
        const sources = [
          `https://logo.clearbit.com/${domain}`,
          `https://www.google.com/s2/favicons?domain=${domain}&sz=256`,
        ];

        for (const source of sources) {
          try {
            const response = await fetch(source, { method: 'HEAD' });
            if (response.ok) {
              setBgImage(source);
              return;
            }
          } catch {
            continue;
          }
        }
      } catch (error) {
        console.error('Error loading background image:', error);
      }
    }

    loadBackgroundImage();
  }, [url]);

  return (
    <div
      className={`relative overflow-hidden rounded-lg border bg-card hover:shadow-lg transition-all cursor-pointer ${className}`}
      onClick={onClick}
    >
      {/* Background image with blur effect */}
      {bgImage && (
        <div
          className="absolute inset-0 opacity-10 blur-2xl"
          style={{
            backgroundImage: `url(${bgImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
      )}

      {/* Content */}
      <div className="relative p-4 flex items-start gap-4">
        {/* High-quality favicon */}
        <HighQualityFavicon
          url={url}
          favicon={favicon}
          alt={title}
          size={64}
          className="flex-shrink-0"
        />

        {/* Text content */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-lg truncate">{title}</h3>
          {description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
              {description}
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-2 truncate">{url}</p>
        </div>
      </div>
    </div>
  );
}
