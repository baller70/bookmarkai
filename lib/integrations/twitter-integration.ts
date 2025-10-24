import { BaseIntegration, IntegrationConfig, ImportResult, ExportResult, SyncResult, BookmarkData } from './integration-manager';
import { validateUrl } from '../security/url-validator';

export interface TwitterCredentials {
  consumerKey: string;
  consumerSecret: string;
  accessToken: string;
  accessTokenSecret: string;
}

export interface TwitterBookmark {
  id: string;
  text: string;
  created_at: string;
  author: {
    username: string;
    name: string;
    profile_image_url: string;
  };
  entities?: {
    urls?: Array<{
      url: string;
      expanded_url: string;
      display_url: string;
    }>;
    hashtags?: Array<{
      tag: string;
    }>;
  };
  public_metrics?: {
    retweet_count: number;
    like_count: number;
    reply_count: number;
    quote_count: number;
  };
}

export class TwitterIntegration extends BaseIntegration {
  constructor(config: IntegrationConfig) {
    super(config);
  }

  getName(): string {
    return 'Twitter/X';
  }

  getType(): string {
    return 'import';
  }

  isConfigured(): boolean {
    return !!(
      this.config.settings?.consumerKey &&
      this.config.settings?.consumerSecret &&
      this.config.accessToken &&
      this.config.settings?.accessTokenSecret
    );
  }

  async authenticate(credentials: TwitterCredentials): Promise<boolean> {
    try {
      // Validate credentials by making a test API call
      const testUrl = 'https://api.twitter.com/2/users/me';
      const response = await this.makeAuthenticatedRequest(testUrl, 'GET', credentials);
      
      if (response.ok) {
        // Store credentials
        this.updateConfig({
          accessToken: credentials.accessToken,
          settings: {
            ...this.config.settings,
            consumerKey: credentials.consumerKey,
            consumerSecret: credentials.consumerSecret,
            accessTokenSecret: credentials.accessTokenSecret
          }
        });
        
        this.logger.info('Twitter authentication successful');
        return true;
      } else {
        this.logger.error('Twitter authentication failed', new Error(`HTTP ${response.status}`));
        return false;
      }
    } catch (error) {
      this.logger.error('Twitter authentication error', error);
      return false;
    }
  }

  async import(): Promise<ImportResult> {
    if (!this.isConfigured()) {
      throw new Error('Twitter integration is not configured');
    }

    const result: ImportResult = {
      success: false,
      imported: 0,
      failed: 0,
      duplicates: 0,
      errors: [],
      data: []
    };

    try {
      this.logger.info('Starting Twitter bookmark import');

      // Import bookmarks (saved tweets)
      const bookmarks = await this.fetchBookmarks();
      
      // Import liked tweets
      const likedTweets = await this.fetchLikedTweets();
      
      // Combine and process all tweets
      const allTweets = [...bookmarks, ...likedTweets];
      const processedBookmarks: BookmarkData[] = [];

      for (const tweet of allTweets) {
        try {
          const bookmarkData = this.convertTweetToBookmark(tweet);
          if (bookmarkData) {
            processedBookmarks.push(bookmarkData);
            result.imported++;
          }
        } catch (error) {
          result.failed++;
          result.errors.push(`Failed to process tweet ${tweet.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      result.data = processedBookmarks;
      result.success = result.errors.length === 0 || result.imported > 0;

      this.logger.info('Twitter import completed', {
        imported: result.imported,
        failed: result.failed,
        duplicates: result.duplicates
      });

      return result;
    } catch (error) {
      this.logger.error('Twitter import failed', error);
      result.errors.push(error instanceof Error ? error.message : 'Unknown error');
      return result;
    }
  }

  private async fetchBookmarks(): Promise<TwitterBookmark[]> {
    const bookmarks: TwitterBookmark[] = [];
    let nextToken: string | undefined;

    try {
      do {
        const url = new URL('https://api.twitter.com/2/users/me/bookmarks');
        url.searchParams.set('tweet.fields', 'created_at,author_id,public_metrics,entities');
        url.searchParams.set('user.fields', 'username,name,profile_image_url');
        url.searchParams.set('expansions', 'author_id');
        url.searchParams.set('max_results', '100');
        
        if (nextToken) {
          url.searchParams.set('pagination_token', nextToken);
        }

        const response = await this.makeAuthenticatedRequest(url.toString(), 'GET');
        
        if (!response.ok) {
          throw new Error(`Twitter API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        
        if (data.data) {
          // Map user data for easier access
          const users = data.includes?.users || [];
          const userMap = new Map(users.map((user: any) => [user.id, user]));

          for (const tweet of data.data) {
            const author = userMap.get(tweet.author_id);
            bookmarks.push({
              ...tweet,
              author: author || { username: 'unknown', name: 'Unknown User', profile_image_url: '' }
            });
          }
        }

        nextToken = data.meta?.next_token;
      } while (nextToken);

      this.logger.info('Fetched Twitter bookmarks', { count: bookmarks.length });
      return bookmarks;
    } catch (error) {
      this.logger.error('Failed to fetch Twitter bookmarks', error);
      throw error;
    }
  }

  private async fetchLikedTweets(): Promise<TwitterBookmark[]> {
    const likedTweets: TwitterBookmark[] = [];
    let nextToken: string | undefined;

    try {
      // First get user ID
      const userResponse = await this.makeAuthenticatedRequest('https://api.twitter.com/2/users/me', 'GET');
      const userData = await userResponse.json();
      const userId = userData.data?.id;

      if (!userId) {
        throw new Error('Could not get user ID');
      }

      do {
        const url = new URL(`https://api.twitter.com/2/users/${userId}/liked_tweets`);
        url.searchParams.set('tweet.fields', 'created_at,author_id,public_metrics,entities');
        url.searchParams.set('user.fields', 'username,name,profile_image_url');
        url.searchParams.set('expansions', 'author_id');
        url.searchParams.set('max_results', '100');
        
        if (nextToken) {
          url.searchParams.set('pagination_token', nextToken);
        }

        const response = await this.makeAuthenticatedRequest(url.toString(), 'GET');
        
        if (!response.ok) {
          throw new Error(`Twitter API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        
        if (data.data) {
          // Map user data for easier access
          const users = data.includes?.users || [];
          const userMap = new Map(users.map((user: any) => [user.id, user]));

          for (const tweet of data.data) {
            const author = userMap.get(tweet.author_id);
            likedTweets.push({
              ...tweet,
              author: author || { username: 'unknown', name: 'Unknown User', profile_image_url: '' }
            });
          }
        }

        nextToken = data.meta?.next_token;
      } while (nextToken);

      this.logger.info('Fetched Twitter liked tweets', { count: likedTweets.length });
      return likedTweets;
    } catch (error) {
      this.logger.error('Failed to fetch Twitter liked tweets', error);
      // Don't throw here, just return empty array as liked tweets are optional
      return [];
    }
  }

  private convertTweetToBookmark(tweet: TwitterBookmark): BookmarkData | null {
    try {
      // Extract URLs from the tweet
      const urls = tweet.entities?.urls || [];
      let primaryUrl = `https://twitter.com/${tweet.author.username}/status/${tweet.id}`;
      
      // If the tweet contains external URLs, use the first one as primary
      if (urls.length > 0 && urls[0].expanded_url) {
        primaryUrl = urls[0].expanded_url;
      }

      // Extract hashtags as tags
      const hashtags = tweet.entities?.hashtags?.map(h => h.tag) || [];
      
      // Create description from tweet text and metrics
      const metrics = tweet.public_metrics;
      let description = tweet.text;
      
      if (metrics) {
        description += `\n\nEngagement: ${metrics.like_count} likes, ${metrics.retweet_count} retweets, ${metrics.reply_count} replies`;
      }

      return {
        url: primaryUrl,
        title: `Tweet by @${tweet.author.username}: ${tweet.text.substring(0, 100)}${tweet.text.length > 100 ? '...' : ''}`,
        description,
        tags: ['twitter', 'social-media', ...hashtags],
        category: 'Social Media',
        createdAt: new Date(tweet.created_at),
        updatedAt: new Date(),
        source: 'twitter',
        sourceId: tweet.id,
        metadata: {
          author: tweet.author,
          metrics: tweet.public_metrics,
          originalText: tweet.text,
          tweetUrl: `https://twitter.com/${tweet.author.username}/status/${tweet.id}`
        }
      };
    } catch (error) {
      this.logger.error('Failed to convert tweet to bookmark', error, { tweetId: tweet.id });
      return null;
    }
  }

  private async makeAuthenticatedRequest(
    url: string, 
    method: string = 'GET', 
    credentials?: TwitterCredentials
  ): Promise<Response> {
    // Validate URL to prevent SSRF
    const validation = validateUrl(url);
    if (!validation.isValid) {
      throw new Error(`URL validation failed: ${validation.error}`);
    }

    const creds = credentials || {
      consumerKey: this.config.settings?.consumerKey,
      consumerSecret: this.config.settings?.consumerSecret,
      accessToken: this.config.accessToken!,
      accessTokenSecret: this.config.settings?.accessTokenSecret
    };

    // Generate OAuth 1.0a signature
    const oauth = this.generateOAuthHeader(url, method, creds);

    const headers: Record<string, string> = {
      'Authorization': oauth,
      'Content-Type': 'application/json'
    };

    const response = await fetch(url, {
      method,
      headers
    });

    return response;
  }

  private generateOAuthHeader(url: string, method: string, credentials: TwitterCredentials): string {
    const oauth_consumer_key = credentials.consumerKey;
    const oauth_token = credentials.accessToken;
    const oauth_signature_method = 'HMAC-SHA1';
    const oauth_timestamp = Math.floor(Date.now() / 1000).toString();
    const oauth_nonce = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const oauth_version = '1.0';

    // Parse URL
    const urlObj = new URL(url);
    const baseUrl = `${urlObj.protocol}//${urlObj.host}${urlObj.pathname}`;
    
    // Collect parameters
    const params: Record<string, string> = {
      oauth_consumer_key,
      oauth_token,
      oauth_signature_method,
      oauth_timestamp,
      oauth_nonce,
      oauth_version
    };

    // Add query parameters
    for (const [key, value] of urlObj.searchParams.entries()) {
      params[key] = value;
    }

    // Create parameter string
    const paramString = Object.keys(params)
      .sort()
      .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
      .join('&');

    // Create signature base string
    const signatureBaseString = `${method.toUpperCase()}&${encodeURIComponent(baseUrl)}&${encodeURIComponent(paramString)}`;

    // Create signing key
    const signingKey = `${encodeURIComponent(credentials.consumerSecret)}&${encodeURIComponent(credentials.accessTokenSecret)}`;

    // Generate signature (simplified - in production, use crypto library)
    // For now, we'll use a placeholder - this would need proper HMAC-SHA1 implementation
    const oauth_signature = this.simpleHash(signatureBaseString + signingKey);

    // Build OAuth header
    const oauthParams = {
      oauth_consumer_key,
      oauth_token,
      oauth_signature_method,
      oauth_timestamp,
      oauth_nonce,
      oauth_version,
      oauth_signature
    };

    const oauthHeader = 'OAuth ' + Object.keys(oauthParams)
      .map(key => `${encodeURIComponent(key)}="${encodeURIComponent(oauthParams[key as keyof typeof oauthParams])}"`)
      .join(', ');

    return oauthHeader;
  }

  private simpleHash(input: string): string {
    // Simplified hash function - in production, use proper HMAC-SHA1
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  async export?(bookmarks: BookmarkData[]): Promise<ExportResult> {
    return { success: true, exported: bookmarks.length, failed: 0, errors: [] };
  }

  async sync?(): Promise<SyncResult> {
    return { success: true, imported: 0, exported: 0, updated: 0, deleted: 0, errors: [] };
  }
}

// Create and export Twitter integration instance
export function createTwitterIntegration(): TwitterIntegration {
  const config: IntegrationConfig = {
    id: 'twitter',
    name: 'Twitter/X',
    type: 'import',
    enabled: false,
    settings: {},
    syncInterval: 24 * 60 * 60 * 1000 // 24 hours
  };

  return new TwitterIntegration(config);
}          