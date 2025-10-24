import { BaseIntegration, IntegrationConfig, ImportResult, ExportResult, SyncResult, BookmarkData } from './integration-manager';

export interface ChromeBookmark {
  id: string;
  name: string;
  url?: string;
  dateAdded: number;
  dateGroupModified?: number;
  children?: ChromeBookmark[];
  type?: 'url' | 'folder';
}

export interface ChromeBookmarksFile {
  version: number;
  roots: {
    bookmark_bar: ChromeBookmark;
    other: ChromeBookmark;
    synced: ChromeBookmark;
  };
}

export class ChromeIntegration extends BaseIntegration {
  constructor(config: IntegrationConfig) {
    super(config);
  }

  getName(): string {
    return 'Chrome Bookmarks';
  }

  getType(): string {
    return 'sync';
  }

  isConfigured(): boolean {
    // Chrome integration can work with file upload or Chrome extension
    return this.config.settings?.method === 'file' || this.config.settings?.method === 'extension';
  }

  async authenticate(credentials: Record<string, any>): Promise<boolean> {
    try {
      if (credentials.method === 'file') {
        // For file-based import, no authentication needed
        this.updateConfig({
          settings: {
            ...this.config.settings,
            method: 'file'
          }
        });
        return true;
      } else if (credentials.method === 'extension') {
        // For extension-based sync, we'd need to verify extension connection
        // This would typically involve checking if the extension is installed and connected
        this.updateConfig({
          settings: {
            ...this.config.settings,
            method: 'extension',
            extensionId: credentials.extensionId
          }
        });
        return true;
      }
      
      return false;
    } catch (error) {
      this.logger.error('Chrome authentication error', error);
      return false;
    }
  }

  async import(): Promise<ImportResult> {
    if (!this.isConfigured()) {
      throw new Error('Chrome integration is not configured');
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
      this.logger.info('Starting Chrome bookmarks import');

      let bookmarksData: ChromeBookmarksFile;

      if (this.config.settings?.method === 'file') {
        bookmarksData = await this.importFromFile();
      } else if (this.config.settings?.method === 'extension') {
        bookmarksData = await this.importFromExtension();
      } else {
        throw new Error('No valid import method configured');
      }

      const processedBookmarks: BookmarkData[] = [];

      // Process bookmark bar
      if (bookmarksData.roots.bookmark_bar) {
        this.processBookmarkFolder(bookmarksData.roots.bookmark_bar, 'Bookmarks Bar', processedBookmarks);
      }

      // Process other bookmarks
      if (bookmarksData.roots.other) {
        this.processBookmarkFolder(bookmarksData.roots.other, 'Other Bookmarks', processedBookmarks);
      }

      // Process synced bookmarks
      if (bookmarksData.roots.synced) {
        this.processBookmarkFolder(bookmarksData.roots.synced, 'Mobile Bookmarks', processedBookmarks);
      }

      result.imported = processedBookmarks.length;
      result.data = processedBookmarks;
      result.success = true;

      this.logger.info('Chrome import completed', {
        imported: result.imported,
        failed: result.failed,
        duplicates: result.duplicates
      });

      return result;
    } catch (error) {
      this.logger.error('Chrome import failed', error);
      result.errors.push(error instanceof Error ? error.message : 'Unknown error');
      return result;
    }
  }

  async export(bookmarks: BookmarkData[]): Promise<ExportResult> {
    const result: ExportResult = {
      success: false,
      exported: 0,
      failed: 0,
      errors: []
    };

    try {
      this.logger.info('Starting Chrome bookmarks export', { count: bookmarks.length });

      if (this.config.settings?.method === 'extension') {
        // Export via Chrome extension
        await this.exportViaExtension(bookmarks);
      } else {
        // Generate Chrome bookmarks file format
        const chromeBookmarks = this.convertToChromeFormat(bookmarks);
        
        // In a real implementation, this would trigger a file download
        // For now, we'll store it in the integration settings
        this.updateConfig({
          settings: {
            ...this.config.settings,
            exportedData: chromeBookmarks,
            lastExport: Date.now()
          }
        });
      }

      result.exported = bookmarks.length;
      result.success = true;

      this.logger.info('Chrome export completed', {
        exported: result.exported,
        failed: result.failed
      });

      return result;
    } catch (error) {
      this.logger.error('Chrome export failed', error);
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
      this.logger.info('Starting Chrome bookmarks sync');

      if (this.config.settings?.method !== 'extension') {
        throw new Error('Sync is only available with Chrome extension');
      }

      // Import current Chrome bookmarks
      const importResult = await this.import();
      result.imported = importResult.imported;
      result.errors.push(...importResult.errors);

      // Export local bookmarks to Chrome (if needed)
      // This would typically be handled by the extension
      
      result.success = importResult.success;

      this.logger.info('Chrome sync completed', {
        imported: result.imported,
        exported: result.exported,
        updated: result.updated,
        deleted: result.deleted
      });

      return result;
    } catch (error) {
      this.logger.error('Chrome sync failed', error);
      result.errors.push(error instanceof Error ? error.message : 'Unknown error');
      return result;
    }
  }

  private async importFromFile(): Promise<ChromeBookmarksFile> {
    // In a real implementation, this would read from an uploaded file
    // For now, we'll check if there's file data in the settings
    const fileData = this.config.settings?.fileData;
    
    if (!fileData) {
      throw new Error('No Chrome bookmarks file data available');
    }

    try {
      const bookmarksData: ChromeBookmarksFile = typeof fileData === 'string' 
        ? JSON.parse(fileData) 
        : fileData;
      
      if (!bookmarksData.roots) {
        throw new Error('Invalid Chrome bookmarks file format');
      }

      return bookmarksData;
    } catch (error) {
      throw new Error('Failed to parse Chrome bookmarks file');
    }
  }

  private async importFromExtension(): Promise<ChromeBookmarksFile> {
    // In a real implementation, this would communicate with the Chrome extension
    // The extension would use chrome.bookmarks API to get all bookmarks
    
    if (typeof window !== 'undefined' && (window as any).chrome?.runtime) {
      try {
        // Send message to Chrome extension
        const response = await new Promise((resolve, reject) => {
          (window as any).chrome.runtime.sendMessage(
            this.config.settings?.extensionId,
            { action: 'getBookmarks' },
            (response: any) => {
              if ((window as any).chrome.runtime.lastError) {
                reject(new Error((window as any).chrome.runtime.lastError.message));
              } else {
                resolve(response);
              }
            }
          );
        });

        return response as ChromeBookmarksFile;
      } catch (error) {
        throw new Error('Failed to communicate with Chrome extension');
      }
    } else {
      throw new Error('Chrome extension not available');
    }
  }

  private async exportViaExtension(bookmarks: BookmarkData[]): Promise<void> {
    if (typeof window !== 'undefined' && (window as any).chrome?.runtime) {
      try {
        // Send bookmarks to Chrome extension for import
        await new Promise((resolve, reject) => {
          (window as any).chrome.runtime.sendMessage(
            this.config.settings?.extensionId,
            { 
              action: 'importBookmarks',
              bookmarks: bookmarks.map(b => ({
                title: b.title,
                url: b.url,
                folder: b.category || 'BookAIMark'
              }))
            },
            (response: any) => {
              if ((window as any).chrome.runtime.lastError) {
                reject(new Error((window as any).chrome.runtime.lastError.message));
              } else {
                resolve(response);
              }
            }
          );
        });
      } catch (error) {
        throw new Error('Failed to export to Chrome extension');
      }
    } else {
      throw new Error('Chrome extension not available');
    }
  }

  private processBookmarkFolder(
    folder: ChromeBookmark, 
    folderPath: string, 
    result: BookmarkData[]
  ): void {
    if (!folder.children) return;

    for (const item of folder.children) {
      if (item.url) {
        // It's a bookmark
        const bookmark = this.convertChromeBookmarkToBookmarkData(item, folderPath);
        if (bookmark) {
          result.push(bookmark);
        }
      } else if (item.children) {
        // It's a folder, process recursively
        const newPath = folderPath ? `${folderPath}/${item.name}` : item.name;
        this.processBookmarkFolder(item, newPath, result);
      }
    }
  }

  private convertChromeBookmarkToBookmarkData(
    chromeBookmark: ChromeBookmark, 
    folderPath: string
  ): BookmarkData | null {
    try {
      if (!chromeBookmark.url) return null;

      return {
        url: chromeBookmark.url,
        title: chromeBookmark.name || 'Untitled',
        description: `Imported from Chrome bookmarks folder: ${folderPath}`,
        tags: ['chrome', 'browser', folderPath.toLowerCase().replace(/\s+/g, '-')],
        category: this.mapFolderToCategory(folderPath),
        createdAt: new Date(chromeBookmark.dateAdded),
        updatedAt: new Date(chromeBookmark.dateGroupModified || chromeBookmark.dateAdded),
        source: 'chrome',
        sourceId: chromeBookmark.id,
        metadata: {
          folderPath,
          chromeId: chromeBookmark.id,
          dateAdded: chromeBookmark.dateAdded,
          dateGroupModified: chromeBookmark.dateGroupModified
        }
      };
    } catch (error) {
      this.logger.error('Failed to convert Chrome bookmark', error, { bookmarkId: chromeBookmark.id });
      return null;
    }
  }

  private mapFolderToCategory(folderPath: string): string {
    const path = folderPath.toLowerCase();
    
    if (path.includes('dev') || path.includes('programming') || path.includes('code')) {
      return 'Programming';
    }
    if (path.includes('news') || path.includes('article')) {
      return 'News';
    }
    if (path.includes('work') || path.includes('business')) {
      return 'Business';
    }
    if (path.includes('learn') || path.includes('education') || path.includes('tutorial')) {
      return 'Education';
    }
    if (path.includes('entertainment') || path.includes('fun') || path.includes('game')) {
      return 'Entertainment';
    }
    if (path.includes('tool') || path.includes('utility')) {
      return 'Tools';
    }
    
    return 'General';
  }

  private convertToChromeFormat(bookmarks: BookmarkData[]): ChromeBookmarksFile {
    const bookmarkBar: ChromeBookmark = {
      id: '1',
      name: 'Bookmarks bar',
      type: 'folder',
      dateAdded: Date.now(),
      children: []
    };

    const other: ChromeBookmark = {
      id: '2',
      name: 'Other bookmarks',
      type: 'folder',
      dateAdded: Date.now(),
      children: []
    };

    // Group bookmarks by category
    const categoryFolders = new Map<string, ChromeBookmark[]>();

    for (const bookmark of bookmarks) {
      const category = bookmark.category || 'General';
      
      if (!categoryFolders.has(category)) {
        categoryFolders.set(category, []);
      }

      const chromeBookmark: ChromeBookmark = {
        id: bookmark.sourceId || Math.random().toString(36).substring(7),
        name: bookmark.title,
        url: bookmark.url,
        type: 'url',
        dateAdded: bookmark.createdAt?.getTime() || Date.now()
      };

      categoryFolders.get(category)!.push(chromeBookmark);
    }

    // Create folders for each category
    let folderId = 3;
    for (const [category, categoryBookmarks] of categoryFolders.entries()) {
      const folder: ChromeBookmark = {
        id: (folderId++).toString(),
        name: category,
        type: 'folder',
        dateAdded: Date.now(),
        children: categoryBookmarks
      };

      if (category === 'General' || category === 'Bookmarks Bar') {
        bookmarkBar.children!.push(...categoryBookmarks);
      } else {
        other.children!.push(folder);
      }
    }

    return {
      version: 1,
      roots: {
        bookmark_bar: bookmarkBar,
        other: other,
        synced: {
          id: '3',
          name: 'Mobile bookmarks',
          type: 'folder',
          dateAdded: Date.now(),
          children: []
        }
      }
    };
  }
}

// Create and export Chrome integration instance
export function createChromeIntegration(): ChromeIntegration {
  const config: IntegrationConfig = {
    id: 'chrome',
    name: 'Chrome Bookmarks',
    type: 'sync',
    enabled: false,
    settings: {},
    syncInterval: 60 * 60 * 1000 // 1 hour
  };

  return new ChromeIntegration(config);
} 