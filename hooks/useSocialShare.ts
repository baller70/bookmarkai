import { useState, useCallback } from 'react';

export interface SocialShareOptions {
  platform: 'twitter' | 'linkedin' | 'facebook' | 'reddit' | 'email' | 'copy';
  url: string;
  title: string;
  description?: string;
  tags?: string[];
  via?: string;
  hashtags?: string[];
}

export interface SocialPlatform {
  platform: string;
  shareUrl: string;
  icon: string;
  label: string;
}

export interface UseSocialShareReturn {
  shareOptions: Record<string, SocialPlatform> | null;
  loading: boolean;
  error: string | null;
  getShareOptions: (url: string, title: string, description?: string) => Promise<void>;
  shareToSocial: (options: SocialShareOptions) => Promise<boolean>;
  copyToClipboard: (text: string) => Promise<boolean>;
}

export function useSocialShare(): UseSocialShareReturn {
  const [shareOptions, setShareOptions] = useState<Record<string, SocialPlatform> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getShareOptions = useCallback(async (url: string, title: string, description?: string) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        url,
        title,
        ...(description && { description })
      });

      const response = await fetch(`/api/integrations/social?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setShareOptions(data.options);
      } else {
        setError(data.error || 'Failed to get share options');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  const shareToSocial = useCallback(async (options: SocialShareOptions): Promise<boolean> => {
    try {
      setError(null);

      if (options.platform === 'copy') {
        return await copyToClipboard(options.url);
      }

      // For other platforms, generate share URL and open in new window
      const response = await fetch('/api/integrations/social', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'generate-share-url',
          ...options
        })
      });

      const data = await response.json();

      if (data.success && data.shareUrl) {
        // Open share URL in new window
        const shareWindow = window.open(
          data.shareUrl,
          'share',
          'width=600,height=400,scrollbars=yes,resizable=yes'
        );

        // Check if window was blocked
        if (!shareWindow) {
          setError('Popup blocked. Please allow popups for this site.');
          return false;
        }

        return true;
      } else {
        setError(data.error || 'Failed to generate share URL');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Share error');
      return false;
    }
  }, []);

  const copyToClipboard = useCallback(async (text: string): Promise<boolean> => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        // Use modern clipboard API
        await navigator.clipboard.writeText(text);
        return true;
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        const success = document.execCommand('copy');
        document.body.removeChild(textArea);
        
        if (!success) {
          throw new Error('Copy command failed');
        }
        
        return true;
      }
    } catch (err) {
      setError('Failed to copy to clipboard');
      return false;
    }
  }, []);

  return {
    shareOptions,
    loading,
    error,
    getShareOptions,
    shareToSocial,
    copyToClipboard
  };
}

export default useSocialShare; 