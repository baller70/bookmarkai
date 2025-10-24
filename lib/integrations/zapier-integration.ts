import { BaseIntegration, IntegrationConfig, ImportResult, ExportResult, SyncResult, BookmarkData } from './integration-manager';

export interface ZapierWebhook {
  id: string;
  url: string;
  event: 'bookmark.created' | 'bookmark.updated' | 'bookmark.deleted' | 'bookmark.tagged' | 'bookmark.categorized';
  enabled: boolean;
  filters?: {
    categories?: string[];
    tags?: string[];
    domains?: string[];
  };
}

export interface ZapierTriggerData {
  event: string;
  timestamp: string;
  bookmark: BookmarkData;
  changes?: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
}

export class ZapierIntegration extends BaseIntegration {
  private webhooks: Map<string, ZapierWebhook> = new Map();

  constructor(config: IntegrationConfig) {
    super(config);
    this.loadWebhooks();
  }

  getName(): string {
    return 'Zapier';
  }

  getType(): string {
    return 'export';
  }

  isConfigured(): boolean {
    return this.webhooks.size > 0;
  }

  async authenticate(credentials: { apiKey?: string }): Promise<boolean> {
    try {
      // Zapier integration primarily uses webhooks, so authentication is simple
      this.updateConfig({
        settings: {
          ...this.config.settings,
          apiKey: credentials.apiKey,
          authenticated: true
        }
      });

      this.logger.info('Zapier authentication successful');
      return true;
    } catch (error) {
      this.logger.error('Zapier authentication error', error);
      return false;
    }
  }

  async import(): Promise<ImportResult> {
    // Zapier is primarily for outbound automation, not importing
    return {
      success: true,
      imported: 0,
      failed: 0,
      duplicates: 0,
      errors: [],
      data: []
    };
  }

  async export(bookmarks: BookmarkData[]): Promise<ExportResult> {
    const result: ExportResult = {
      success: false,
      exported: 0,
      failed: 0,
      errors: []
    };

    try {
      this.logger.info('Starting Zapier webhook triggers', { count: bookmarks.length });

      for (const bookmark of bookmarks) {
        try {
          await this.triggerWebhooks('bookmark.created', bookmark);
          result.exported++;
        } catch (error) {
          result.failed++;
          result.errors.push(`Failed to trigger webhook for bookmark ${bookmark.url}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      result.success = result.exported > 0;

      this.logger.info('Zapier webhook triggers completed', {
        exported: result.exported,
        failed: result.failed
      });

      return result;
    } catch (error) {
      this.logger.error('Zapier export failed', error);
      result.errors.push(error instanceof Error ? error.message : 'Unknown error');
      return result;
    }
  }

  // Webhook management methods
  addWebhook(webhook: Omit<ZapierWebhook, 'id'>): string {
    const id = Math.random().toString(36).substring(7);
    const fullWebhook: ZapierWebhook = {
      id,
      ...webhook
    };

    this.webhooks.set(id, fullWebhook);
    this.saveWebhooks();

    this.logger.info('Zapier webhook added', { id, event: webhook.event, url: webhook.url });
    return id;
  }

  removeWebhook(id: string): boolean {
    const removed = this.webhooks.delete(id);
    if (removed) {
      this.saveWebhooks();
      this.logger.info('Zapier webhook removed', { id });
    }
    return removed;
  }

  updateWebhook(id: string, updates: Partial<ZapierWebhook>): boolean {
    const webhook = this.webhooks.get(id);
    if (!webhook) return false;

    const updatedWebhook = { ...webhook, ...updates, id };
    this.webhooks.set(id, updatedWebhook);
    this.saveWebhooks();

    this.logger.info('Zapier webhook updated', { id, updates });
    return true;
  }

  getWebhooks(): ZapierWebhook[] {
    return Array.from(this.webhooks.values());
  }

  getWebhook(id: string): ZapierWebhook | null {
    return this.webhooks.get(id) || null;
  }

  // Event trigger methods
  async triggerBookmarkCreated(bookmark: BookmarkData): Promise<void> {
    await this.triggerWebhooks('bookmark.created', bookmark);
  }

  async triggerBookmarkUpdated(bookmark: BookmarkData, changes?: any[]): Promise<void> {
    await this.triggerWebhooks('bookmark.updated', bookmark, changes);
  }

  async triggerBookmarkDeleted(bookmark: BookmarkData): Promise<void> {
    await this.triggerWebhooks('bookmark.deleted', bookmark);
  }

  async triggerBookmarkTagged(bookmark: BookmarkData, newTags: string[]): Promise<void> {
    const changes = [{
      field: 'tags',
      oldValue: bookmark.tags || [],
      newValue: newTags
    }];
    await this.triggerWebhooks('bookmark.tagged', bookmark, changes);
  }

  async triggerBookmarkCategorized(bookmark: BookmarkData, newCategory: string): Promise<void> {
    const changes = [{
      field: 'category',
      oldValue: bookmark.category,
      newValue: newCategory
    }];
    await this.triggerWebhooks('bookmark.categorized', bookmark, changes);
  }

  private async triggerWebhooks(event: ZapierWebhook['event'], bookmark: BookmarkData, changes?: any[]): Promise<void> {
    const relevantWebhooks = Array.from(this.webhooks.values())
      .filter(webhook => webhook.enabled && webhook.event === event)
      .filter(webhook => this.matchesFilters(webhook, bookmark));

    const triggerPromises = relevantWebhooks.map(webhook => 
      this.sendWebhook(webhook, event, bookmark, changes)
    );

    await Promise.allSettled(triggerPromises);
  }

  private matchesFilters(webhook: ZapierWebhook, bookmark: BookmarkData): boolean {
    if (!webhook.filters) return true;

    const { categories, tags, domains } = webhook.filters;

    // Check category filter
    if (categories && categories.length > 0) {
      if (!bookmark.category || !categories.includes(bookmark.category)) {
        return false;
      }
    }

    // Check tags filter
    if (tags && tags.length > 0) {
      if (!bookmark.tags || !tags.some(tag => bookmark.tags!.includes(tag))) {
        return false;
      }
    }

    // Check domain filter
    if (domains && domains.length > 0) {
      try {
        const bookmarkDomain = new URL(bookmark.url).hostname;
        if (!domains.some(domain => bookmarkDomain.includes(domain))) {
          return false;
        }
      } catch (error) {
        // Invalid URL, skip domain check
      }
    }

    return true;
  }

  private async sendWebhook(
    webhook: ZapierWebhook, 
    event: string, 
    bookmark: BookmarkData, 
    changes?: any[]
  ): Promise<void> {
    try {
      const payload: ZapierTriggerData = {
        event,
        timestamp: new Date().toISOString(),
        bookmark: {
          ...bookmark,
          // Ensure dates are strings for JSON serialization
          createdAt: bookmark.createdAt ? bookmark.createdAt : undefined,
          updatedAt: bookmark.updatedAt ? bookmark.updatedAt : undefined
        },
        ...(changes && { changes })
      };

      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'BookAIMark-Zapier/1.0'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Webhook failed: ${response.status} ${response.statusText}`);
      }

      this.logger.info('Zapier webhook triggered successfully', {
        webhookId: webhook.id,
        event,
        bookmarkUrl: bookmark.url,
        responseStatus: response.status
      });
    } catch (error) {
      this.logger.error('Zapier webhook failed', error, {
        webhookId: webhook.id,
        event,
        bookmarkUrl: bookmark.url,
        webhookUrl: webhook.url
      });
      throw error;
    }
  }

  private loadWebhooks(): void {
    const webhooksData = this.config.settings?.webhooks;
    if (webhooksData && Array.isArray(webhooksData)) {
      for (const webhook of webhooksData) {
        this.webhooks.set(webhook.id, webhook);
      }
    }
  }

  private saveWebhooks(): void {
    const webhooksArray = Array.from(this.webhooks.values());
    this.updateConfig({
      settings: {
        ...this.config.settings,
        webhooks: webhooksArray
      }
    });
  }

  // Test webhook functionality
  async testWebhook(webhookId: string): Promise<boolean> {
    const webhook = this.webhooks.get(webhookId);
    if (!webhook) {
      throw new Error('Webhook not found');
    }

    try {
      const testBookmark: BookmarkData = {
        url: 'https://example.com/test',
        title: 'Test Bookmark',
        description: 'This is a test bookmark for webhook validation',
        tags: ['test', 'webhook'],
        category: 'Test',
        createdAt: new Date(),
        updatedAt: new Date(),
        source: 'zapier-test',
        sourceId: 'test-' + Date.now()
      };

      await this.sendWebhook(webhook, 'bookmark.created', testBookmark);
      return true;
    } catch (error) {
      this.logger.error('Webhook test failed', error, { webhookId });
      return false;
    }
  }

  // Get webhook statistics
  getWebhookStats(): {
    total: number;
    enabled: number;
    byEvent: Record<string, number>;
  } {
    const webhooks = Array.from(this.webhooks.values());
    const stats = {
      total: webhooks.length,
      enabled: webhooks.filter(w => w.enabled).length,
      byEvent: {} as Record<string, number>
    };

    for (const webhook of webhooks) {
      stats.byEvent[webhook.event] = (stats.byEvent[webhook.event] || 0) + 1;
    }

    return stats;
  }

  async sync?(): Promise<SyncResult> {
    return { success: true, imported: 0, exported: 0, updated: 0, deleted: 0, errors: [] };
  }
}

// Create and export Zapier integration instance
export function createZapierIntegration(): ZapierIntegration {
  const config: IntegrationConfig = {
    id: 'zapier',
    name: 'Zapier',
    type: 'export',
    enabled: false,
    settings: {
      webhooks: []
    }
  };

  return new ZapierIntegration(config);
}

// Export webhook management utilities
export const ZapierWebhookEvents = [
  'bookmark.created',
  'bookmark.updated', 
  'bookmark.deleted',
  'bookmark.tagged',
  'bookmark.categorized'
] as const;

export const ZapierWebhookFilters = {
  categories: 'Filter by bookmark categories',
  tags: 'Filter by bookmark tags',
  domains: 'Filter by website domains'
} as const;        