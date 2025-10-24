import { BaseIntegration, IntegrationConfig, ImportResult, ExportResult, SyncResult, BookmarkData } from './integration-manager';
import { validateUrl } from '../security/url-validator';

export interface RedditCredentials {
  clientId: string;
  clientSecret: string;
  username: string;
  password: string;
  userAgent: string;
}

export interface RedditPost {
  id: string;
  title: string;
  url: string;
  selftext: string;
  author: string;
  subreddit: string;
  created_utc: number;
  score: number;
  num_comments: number;
  permalink: string;
  is_self: boolean;
  domain: string;
  thumbnail?: string;
  preview?: {
    images: Array<{
      source: { url: string; width: number; height: number; };
    }>;
  };
}

export class RedditIntegration extends BaseIntegration {
  private accessToken?: string;
  private tokenExpiry?: number;

  constructor(config: IntegrationConfig) {
    super(config);
  }

  getName(): string {
    return 'Reddit';
  }

  getType(): string {
    return 'import';
  }

  isConfigured(): boolean {
    return !!(
      this.config.settings?.clientId &&
      this.config.settings?.clientSecret &&
      this.config.settings?.username &&
      this.config.settings?.password &&
      this.config.settings?.userAgent
    );
  }

  async authenticate(credentials: RedditCredentials): Promise<boolean> {
    try {
      this.logger.info('Authenticating with Reddit');

      // Reddit uses OAuth2 with client credentials + password flow
      const authUrl = 'https://www.reddit.com/api/v1/access_token';
      const authString = btoa(`${credentials.clientId}:${credentials.clientSecret}`);

      const formData = new URLSearchParams();
      formData.append('grant_type', 'password');
      formData.append('username', credentials.username);
      formData.append('password', credentials.password);

      const response = await fetch(authUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${authString}`,
          'User-Agent': credentials.userAgent,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: formData
      });

      if (!response.ok) {
        this.logger.error('Reddit authentication failed', new Error(`HTTP ${response.status}`));
        return false;
      }

      const data = await response.json();
      
      if (data.access_token) {
        this.accessToken = data.access_token;
        this.tokenExpiry = Date.now() + (data.expires_in * 1000);

        // Store credentials (without password for security)
        this.updateConfig({
          settings: {
            ...this.config.settings,
            clientId: credentials.clientId,
            clientSecret: credentials.clientSecret,
            username: credentials.username,
            userAgent: credentials.userAgent
          },
          expiresAt: this.tokenExpiry
        });

        this.logger.info('Reddit authentication successful');
        return true;
      } else {
        this.logger.error('Reddit authentication failed', new Error('No access token received'));
        return false;
      }
    } catch (error) {
      this.logger.error('Reddit authentication error', error);
      return false;
    }
  }

  async import(): Promise<ImportResult> {
    if (!this.isConfigured()) {
      throw new Error('Reddit integration is not configured');
    }

    // Check if we need to re-authenticate
    if (this.needsReauth() || !this.accessToken) {
      throw new Error('Reddit integration needs re-authentication');
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
      this.logger.info('Starting Reddit saved posts import');

      // Fetch saved posts
      const savedPosts = await this.fetchSavedPosts();
      
      // Fetch upvoted posts (optional)
      const upvotedPosts = await this.fetchUpvotedPosts();
      
      // Combine and process all posts
      const allPosts = [...savedPosts, ...upvotedPosts];
      const processedBookmarks: BookmarkData[] = [];

      for (const post of allPosts) {
        try {
          const bookmarkData = this.convertPostToBookmark(post);
          if (bookmarkData) {
            processedBookmarks.push(bookmarkData);
            result.imported++;
          }
        } catch (error) {
          result.failed++;
          result.errors.push(`Failed to process post ${post.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      result.data = processedBookmarks;
      result.success = result.errors.length === 0 || result.imported > 0;

      this.logger.info('Reddit import completed', {
        imported: result.imported,
        failed: result.failed,
        duplicates: result.duplicates
      });

      return result;
    } catch (error) {
      this.logger.error('Reddit import failed', error);
      result.errors.push(error instanceof Error ? error.message : 'Unknown error');
      return result;
    }
  }

  private async fetchSavedPosts(): Promise<RedditPost[]> {
    const posts: RedditPost[] = [];
    let after: string | undefined;

    try {
      do {
        const url = new URL(`https://oauth.reddit.com/user/${this.config.settings?.username}/saved`);
        url.searchParams.set('limit', '100');
        url.searchParams.set('raw_json', '1');
        
        if (after) {
          url.searchParams.set('after', after);
        }

        const response = await this.makeAuthenticatedRequest(url.toString());
        
        if (!response.ok) {
          throw new Error(`Reddit API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        
        if (data.data?.children) {
          for (const child of data.data.children) {
            if (child.kind === 't3') { // Post type
              posts.push(child.data);
            }
          }
        }

        after = data.data?.after;
      } while (after);

      this.logger.info('Fetched Reddit saved posts', { count: posts.length });
      return posts;
    } catch (error) {
      this.logger.error('Failed to fetch Reddit saved posts', error);
      throw error;
    }
  }

  private async fetchUpvotedPosts(): Promise<RedditPost[]> {
    const posts: RedditPost[] = [];
    let after: string | undefined;

    try {
      do {
        const url = new URL(`https://oauth.reddit.com/user/${this.config.settings?.username}/upvoted`);
        url.searchParams.set('limit', '100');
        url.searchParams.set('raw_json', '1');
        
        if (after) {
          url.searchParams.set('after', after);
        }

        const response = await this.makeAuthenticatedRequest(url.toString());
        
        if (!response.ok) {
          // Upvoted posts might not be accessible, that's okay
          this.logger.warn('Could not fetch upvoted posts', { status: response.status });
          break;
        }

        const data = await response.json();
        
        if (data.data?.children) {
          for (const child of data.data.children) {
            if (child.kind === 't3') { // Post type
              posts.push(child.data);
            }
          }
        }

        after = data.data?.after;
      } while (after);

      this.logger.info('Fetched Reddit upvoted posts', { count: posts.length });
      return posts;
    } catch (error) {
      this.logger.error('Failed to fetch Reddit upvoted posts', error);
      // Don't throw here, upvoted posts are optional
      return [];
    }
  }

  private convertPostToBookmark(post: RedditPost): BookmarkData | null {
    try {
      // Determine the primary URL
      let primaryUrl = post.url;
      
      // For self posts, use the Reddit permalink
      if (post.is_self || !post.url || post.url.startsWith('/r/')) {
        primaryUrl = `https://www.reddit.com${post.permalink}`;
      }

      // Create description from post content and metadata
      let description = '';
      if (post.selftext) {
        description = post.selftext.substring(0, 500);
        if (post.selftext.length > 500) {
          description += '...';
        }
      }
      
      description += `\n\nSubreddit: r/${post.subreddit}`;
      description += `\nAuthor: u/${post.author}`;
      description += `\nScore: ${post.score} points`;
      description += `\nComments: ${post.num_comments}`;

      // Generate tags from subreddit and domain
      const tags = ['reddit', `r/${post.subreddit}`];
      
      if (post.domain && !post.is_self) {
        tags.push(post.domain);
      }

      // Determine category based on subreddit
      const category = this.categorizeBySubreddit(post.subreddit);

      return {
        url: primaryUrl,
        title: post.title,
        description,
        tags,
        category,
        createdAt: new Date(post.created_utc * 1000),
        updatedAt: new Date(),
        source: 'reddit',
        sourceId: post.id,
        metadata: {
          subreddit: post.subreddit,
          author: post.author,
          score: post.score,
          numComments: post.num_comments,
          permalink: post.permalink,
          isSelf: post.is_self,
          domain: post.domain,
          thumbnail: post.thumbnail,
          redditUrl: `https://www.reddit.com${post.permalink}`
        }
      };
    } catch (error) {
      this.logger.error('Failed to convert Reddit post to bookmark', error, { postId: post.id });
      return null;
    }
  }

  private categorizeBySubreddit(subreddit: string): string {
    const subredditLower = subreddit.toLowerCase();
    
    // Programming and tech
    if (['programming', 'webdev', 'javascript', 'python', 'reactjs', 'nodejs', 'coding', 'learnprogramming', 'compsci'].includes(subredditLower)) {
      return 'Programming';
    }
    
    // News and politics
    if (['news', 'worldnews', 'politics', 'technology', 'science'].includes(subredditLower)) {
      return 'News';
    }
    
    // Entertainment
    if (['movies', 'television', 'gaming', 'music', 'books', 'entertainment'].includes(subredditLower)) {
      return 'Entertainment';
    }
    
    // Education and learning
    if (['todayilearned', 'explainlikeimfive', 'askscience', 'educationalgifs', 'lectures'].includes(subredditLower)) {
      return 'Education';
    }
    
    // Business and finance
    if (['business', 'entrepreneur', 'investing', 'personalfinance', 'economy'].includes(subredditLower)) {
      return 'Business';
    }
    
    // Default category
    return 'Social Media';
  }

  private async makeAuthenticatedRequest(url: string): Promise<Response> {
    if (!this.accessToken) {
      throw new Error('No access token available');
    }

    const validation = validateUrl(url);
    if (!validation.isValid) {
      throw new Error(`URL validation failed: ${validation.error}`);
    }

    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.accessToken}`,
      'User-Agent': this.config.settings?.userAgent || 'BookAIMark/1.0'
    };

    const response = await fetch(url, {
      method: 'GET',
      headers
    });

    return response;
  }

  needsReauth(): boolean {
    if (!this.tokenExpiry) return true;
    return Date.now() >= this.tokenExpiry;
  }

  async export?(bookmarks: BookmarkData[]): Promise<ExportResult> {
    return { success: true, exported: bookmarks.length, failed: 0, errors: [] };
  }

  async sync?(): Promise<SyncResult> {
    return { success: true, imported: 0, exported: 0, updated: 0, deleted: 0, errors: [] };
  }
}

// Create and export Reddit integration instance
export function createRedditIntegration(): RedditIntegration {
  const config: IntegrationConfig = {
    id: 'reddit',
    name: 'Reddit',
    type: 'import',
    enabled: false,
    settings: {},
    syncInterval: 24 * 60 * 60 * 1000 // 24 hours
  };

  return new RedditIntegration(config);
}          