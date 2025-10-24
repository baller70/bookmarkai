import { BaseIntegration, IntegrationConfig, ImportResult, ExportResult, SyncResult, BookmarkData } from './integration-manager';
import { validateUrl } from '../security/url-validator';

export interface NotionCredentials {
  accessToken: string;
  databaseId: string;
}

export interface NotionPage {
  id: string;
  created_time: string;
  last_edited_time: string;
  properties: {
    [key: string]: any;
  };
  url: string;
}

export interface NotionDatabase {
  id: string;
  title: Array<{ plain_text: string }>;
  properties: {
    [key: string]: {
      type: string;
      [key: string]: any;
    };
  };
}

export class NotionIntegration extends BaseIntegration {
  private baseUrl = 'https://api.notion.com/v1';
  private apiVersion = '2022-06-28';

  constructor(config: IntegrationConfig) {
    super(config);
  }

  getName(): string {
    return 'Notion';
  }

  getType(): string {
    return 'sync';
  }

  isConfigured(): boolean {
    return !!(
      this.config.accessToken &&
      this.config.settings?.databaseId
    );
  }

  async authenticate(credentials: NotionCredentials): Promise<boolean> {
    try {
      this.logger.info('Authenticating with Notion');

      // Test the connection by fetching the database
      const response = await this.makeAuthenticatedRequest(
        `/databases/${credentials.databaseId}`,
        'GET',
        credentials.accessToken
      );

      if (response.ok) {
        const database = await response.json();
        
        // Store credentials and database info
        this.updateConfig({
          accessToken: credentials.accessToken,
          settings: {
            ...this.config.settings,
            databaseId: credentials.databaseId,
            databaseTitle: database.title?.[0]?.plain_text || 'Bookmarks',
            properties: database.properties
          }
        });

        this.logger.info('Notion authentication successful');
        return true;
      } else {
        this.logger.error('Notion authentication failed', new Error(`HTTP ${response.status}`));
        return false;
      }
    } catch (error) {
      this.logger.error('Notion authentication error', error);
      return false;
    }
  }

  async import(): Promise<ImportResult> {
    if (!this.isConfigured()) {
      throw new Error('Notion integration is not configured');
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
      this.logger.info('Starting Notion bookmarks import');

      const pages = await this.fetchDatabasePages();
      const processedBookmarks: BookmarkData[] = [];

      for (const page of pages) {
        try {
          const bookmarkData = this.convertNotionPageToBookmark(page);
          if (bookmarkData) {
            processedBookmarks.push(bookmarkData);
            result.imported++;
          }
        } catch (error) {
          result.failed++;
          result.errors.push(`Failed to process page ${page.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      result.data = processedBookmarks;
      result.success = result.errors.length === 0 || result.imported > 0;

      this.logger.info('Notion import completed', {
        imported: result.imported,
        failed: result.failed,
        duplicates: result.duplicates
      });

      return result;
    } catch (error) {
      this.logger.error('Notion import failed', error);
      result.errors.push(error instanceof Error ? error.message : 'Unknown error');
      return result;
    }
  }

  async export(bookmarks: BookmarkData[]): Promise<ExportResult> {
    if (!this.isConfigured()) {
      throw new Error('Notion integration is not configured');
    }

    const result: ExportResult = {
      success: false,
      exported: 0,
      failed: 0,
      errors: []
    };

    try {
      this.logger.info('Starting Notion bookmarks export', { count: bookmarks.length });

      for (const bookmark of bookmarks) {
        try {
          await this.createNotionPage(bookmark);
          result.exported++;
        } catch (error) {
          result.failed++;
          result.errors.push(`Failed to export bookmark ${bookmark.url}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      result.success = result.exported > 0;

      this.logger.info('Notion export completed', {
        exported: result.exported,
        failed: result.failed
      });

      return result;
    } catch (error) {
      this.logger.error('Notion export failed', error);
      result.errors.push(error instanceof Error ? error.message : 'Unknown error');
      return result;
    }
  }

  async sync(): Promise<SyncResult> {
    const result: SyncResult = {
      success: false,
      imported: 0,
      exported: 0,
      updated: 0,
      deleted: 0,
      errors: []
    };

    try {
      this.logger.info('Starting Notion bookmarks sync');

      // Import from Notion
      const importResult = await this.import();
      result.imported = importResult.imported;
      result.errors.push(...importResult.errors);

      // Note: For a full sync implementation, we would also:
      // 1. Export new local bookmarks to Notion
      // 2. Update modified bookmarks
      // 3. Handle deletions
      // This is a simplified version focusing on import

      result.success = importResult.success;

      this.logger.info('Notion sync completed', {
        imported: result.imported,
        exported: result.exported,
        updated: result.updated,
        deleted: result.deleted
      });

      return result;
    } catch (error) {
      this.logger.error('Notion sync failed', error);
      result.errors.push(error instanceof Error ? error.message : 'Unknown error');
      return result;
    }
  }

  private async fetchDatabasePages(): Promise<NotionPage[]> {
    const pages: NotionPage[] = [];
    let hasMore = true;
    let startCursor: string | undefined;

    try {
      while (hasMore) {
        const requestBody: any = {
          page_size: 100
        };

        if (startCursor) {
          requestBody.start_cursor = startCursor;
        }

        const response = await this.makeAuthenticatedRequest(
          `/databases/${this.config.settings?.databaseId}/query`,
          'POST',
          this.config.accessToken!,
          requestBody
        );

        if (!response.ok) {
          throw new Error(`Notion API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        
        if (data.results) {
          pages.push(...data.results);
        }

        hasMore = data.has_more;
        startCursor = data.next_cursor;
      }

      this.logger.info('Fetched Notion pages', { count: pages.length });
      return pages;
    } catch (error) {
      this.logger.error('Failed to fetch Notion pages', error);
      throw error;
    }
  }

  private async createNotionPage(bookmark: BookmarkData): Promise<void> {
    try {
      const pageProperties = this.buildNotionPageProperties(bookmark);

      const requestBody = {
        parent: {
          database_id: this.config.settings?.databaseId
        },
        properties: pageProperties
      };

      const response = await this.makeAuthenticatedRequest(
        '/pages',
        'POST',
        this.config.accessToken!,
        requestBody
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Notion API error: ${response.status} - ${errorData.message || response.statusText}`);
      }

      this.logger.info('Created Notion page', { url: bookmark.url });
    } catch (error) {
      this.logger.error('Failed to create Notion page', error, { url: bookmark.url });
      throw error;
    }
  }

  private convertNotionPageToBookmark(page: NotionPage): BookmarkData | null {
    try {
      const properties = page.properties;
      
      // Extract URL (required field)
      const url = this.extractNotionProperty(properties, 'URL', 'url') ||
                  this.extractNotionProperty(properties, 'Link', 'url') ||
                  this.extractNotionProperty(properties, 'url', 'url');

      if (!url) {
        this.logger.warn('No URL found in Notion page', { pageId: page.id });
        return null;
      }

      // Extract title
      const title = this.extractNotionProperty(properties, 'Name', 'title') ||
                    this.extractNotionProperty(properties, 'Title', 'title') ||
                    this.extractNotionProperty(properties, 'name', 'title') ||
                    'Untitled';

      // Extract description
      const description = this.extractNotionProperty(properties, 'Description', 'rich_text') ||
                         this.extractNotionProperty(properties, 'Notes', 'rich_text') ||
                         this.extractNotionProperty(properties, 'description', 'rich_text');

      // Extract tags
      const tags = this.extractNotionProperty(properties, 'Tags', 'multi_select') ||
                   this.extractNotionProperty(properties, 'tags', 'multi_select') ||
                   ['notion'];

      // Extract category
      const category = this.extractNotionProperty(properties, 'Category', 'select') ||
                      this.extractNotionProperty(properties, 'category', 'select') ||
                      'General';

      return {
        url,
        title,
        description,
        tags: Array.isArray(tags) ? tags : ['notion'],
        category,
        createdAt: new Date(page.created_time),
        updatedAt: new Date(page.last_edited_time),
        source: 'notion',
        sourceId: page.id,
        metadata: {
          notionPageId: page.id,
          notionUrl: page.url,
          properties: page.properties
        }
      };
    } catch (error) {
      this.logger.error('Failed to convert Notion page to bookmark', error, { pageId: page.id });
      return null;
    }
  }

  private buildNotionPageProperties(bookmark: BookmarkData): any {
    const properties: any = {};

    // Title property (required)
    properties.Name = {
      title: [
        {
          text: {
            content: bookmark.title
          }
        }
      ]
    };

    // URL property
    properties.URL = {
      url: bookmark.url
    };

    // Description property
    if (bookmark.description) {
      properties.Description = {
        rich_text: [
          {
            text: {
              content: bookmark.description.substring(0, 2000) // Notion has limits
            }
          }
        ]
      };
    }

    // Tags property
    if (bookmark.tags && bookmark.tags.length > 0) {
      properties.Tags = {
        multi_select: bookmark.tags.map(tag => ({ name: tag }))
      };
    }

    // Category property
    if (bookmark.category) {
      properties.Category = {
        select: {
          name: bookmark.category
        }
      };
    }

    // Created date
    if (bookmark.createdAt) {
      properties['Created Date'] = {
        date: {
          start: bookmark.createdAt.toISOString()
        }
      };
    }

    return properties;
  }

  private extractNotionProperty(properties: any, propertyName: string, propertyType: string): any {
    const property = properties[propertyName];
    if (!property) return null;

    switch (propertyType) {
      case 'title':
        return property.title?.[0]?.plain_text || null;
      
      case 'rich_text':
        return property.rich_text?.map((rt: any) => rt.plain_text).join('') || null;
      
      case 'url':
        return property.url || null;
      
      case 'select':
        return property.select?.name || null;
      
      case 'multi_select':
        return property.multi_select?.map((ms: any) => ms.name) || [];
      
      case 'date':
        return property.date?.start || null;
      
      default:
        return null;
    }
  }

  private async makeAuthenticatedRequest(
    endpoint: string,
    method: string = 'GET',
    accessToken?: string,
    body?: any
  ): Promise<Response> {
    const token = accessToken || this.config.accessToken;
    
    if (!token) {
      throw new Error('No access token available');
    }

    const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`;

    const validation = validateUrl(url);
    if (!validation.isValid) {
      throw new Error(`URL validation failed: ${validation.error}`);
    }

    const headers: Record<string, string> = {
      'Authorization': `Bearer ${token}`,
      'Notion-Version': this.apiVersion,
      'Content-Type': 'application/json'
    };

    const options: RequestInit = {
      method,
      headers
    };

    if (body && (method === 'POST' || method === 'PATCH' || method === 'PUT')) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);
    return response;
  }
}

// Create and export Notion integration instance
export function createNotionIntegration(): NotionIntegration {
  const config: IntegrationConfig = {
    id: 'notion',
    name: 'Notion',
    type: 'sync',
    enabled: false,
    settings: {},
    syncInterval: 6 * 60 * 60 * 1000 // 6 hours
  };

  return new NotionIntegration(config);
}  