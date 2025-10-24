import { appLogger } from '../logger';

// Create logger instance for integrations
const logger = appLogger;

// Ensure logger is properly initialized with fallback
const safeLogger = {
  info: (message: string, data?: any) => {
    if (logger && logger.info) {
      logger.info(message, data);
    } else {
      console.log(`[INFO] ${message}`, data);
    }
  },
  error: (message: string, error?: Error, data?: any) => {
    if (logger && logger.error) {
      logger.error(message, error, data);
    } else {
      console.error(`[ERROR] ${message}`, error, data);
    }
  },
  warn: (message: string, data?: any) => {
    if (logger && logger.warn) {
      logger.warn(message, data);
    } else {
      console.warn(`[WARN] ${message}`, data);
    }
  }
};

export interface IntegrationConfig {
  id: string;
  name: string;
  type: 'import' | 'export' | 'sync' | 'social';
  enabled: boolean;
  apiKey?: string;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
  settings: Record<string, any>;
  lastSync?: number;
  syncInterval?: number; // in milliseconds
}

export interface ImportResult {
  success: boolean;
  imported: number;
  failed: number;
  duplicates: number;
  errors: string[];
  data?: any[];
}

export interface ExportResult {
  success: boolean;
  exported: number;
  failed: number;
  errors: string[];
}

export interface SyncResult {
  success: boolean;
  imported: number;
  exported: number;
  updated: number;
  deleted: number;
  errors: string[];
}

export interface BookmarkData {
  url: string;
  title: string;
  description?: string;
  tags?: string[];
  category?: string;
  createdAt?: Date;
  updatedAt?: Date;
  source: string;
  sourceId?: string;
  metadata?: Record<string, any>;
}

export abstract class BaseIntegration {
  protected config: IntegrationConfig;
  protected logger = safeLogger;

  constructor(config: IntegrationConfig) {
    this.config = config;
  }

  abstract getName(): string;
  abstract getType(): string;
  abstract isConfigured(): boolean;
  abstract authenticate(credentials: Record<string, any>): Promise<boolean>;
  abstract import(): Promise<ImportResult>;
  abstract export?(bookmarks: BookmarkData[]): Promise<ExportResult>;
  abstract sync?(): Promise<SyncResult>;

  getConfig(): IntegrationConfig {
    return this.config;
  }

  updateConfig(updates: Partial<IntegrationConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  isEnabled(): boolean {
    return this.config.enabled;
  }

  needsReauth(): boolean {
    if (!this.config.expiresAt) return false;
    return Date.now() >= this.config.expiresAt;
  }

  getLastSync(): Date | null {
    return this.config.lastSync ? new Date(this.config.lastSync) : null;
  }

  updateLastSync(): void {
    this.config.lastSync = Date.now();
  }

  shouldAutoSync(): boolean {
    if (!this.config.syncInterval || !this.config.lastSync) return false;
    return Date.now() - this.config.lastSync >= this.config.syncInterval;
  }
}

export class IntegrationManager {
  private integrations = new Map<string, BaseIntegration>();
  private logger = safeLogger;

  constructor() {
    this.logger.info('Integration Manager initialized');
  }

  // Register an integration
  registerIntegration(integration: BaseIntegration): void {
    const config = integration.getConfig();
    this.integrations.set(config.id, integration);
    this.logger.info('Integration registered', { id: config.id, name: config.name });
  }

  // Get all integrations
  getIntegrations(): BaseIntegration[] {
    return Array.from(this.integrations.values());
  }

  // Get integration by ID
  getIntegration(id: string): BaseIntegration | null {
    return this.integrations.get(id) || null;
  }

  // Get enabled integrations
  getEnabledIntegrations(): BaseIntegration[] {
    return this.getIntegrations().filter(integration => integration.isEnabled());
  }

  // Get integrations by type
  getIntegrationsByType(type: string): BaseIntegration[] {
    return this.getIntegrations().filter(integration => integration.getType() === type);
  }

  // Import from a specific integration
  async importFromIntegration(id: string): Promise<ImportResult> {
    const integration = this.getIntegration(id);
    if (!integration) {
      throw new Error(`Integration not found: ${id}`);
    }

    if (!integration.isEnabled()) {
      throw new Error(`Integration is disabled: ${id}`);
    }

    if (!integration.isConfigured()) {
      throw new Error(`Integration is not configured: ${id}`);
    }

    if (integration.needsReauth()) {
      throw new Error(`Integration needs re-authentication: ${id}`);
    }

    try {
      this.logger.info('Starting import', { integration: id });
      const result = await integration.import();
      integration.updateLastSync();
      this.logger.info('Import completed', { integration: id, result });
      return result;
    } catch (error) {
      this.logger.error('Import failed', error, { integration: id });
      throw error;
    }
  }

  // Export to a specific integration
  async exportToIntegration(id: string, bookmarks: BookmarkData[]): Promise<ExportResult> {
    const integration = this.getIntegration(id);
    if (!integration) {
      throw new Error(`Integration not found: ${id}`);
    }

    if (!integration.export) {
      throw new Error(`Integration does not support export: ${id}`);
    }

    if (!integration.isEnabled()) {
      throw new Error(`Integration is disabled: ${id}`);
    }

    if (!integration.isConfigured()) {
      throw new Error(`Integration is not configured: ${id}`);
    }

    try {
      this.logger.info('Starting export', { integration: id, count: bookmarks.length });
      const result = await integration.export(bookmarks);
      this.logger.info('Export completed', { integration: id, result });
      return result;
    } catch (error) {
      this.logger.error('Export failed', error, { integration: id });
      throw error;
    }
  }

  // Sync with a specific integration
  async syncWithIntegration(id: string): Promise<SyncResult> {
    const integration = this.getIntegration(id);
    if (!integration) {
      throw new Error(`Integration not found: ${id}`);
    }

    if (!integration.sync) {
      throw new Error(`Integration does not support sync: ${id}`);
    }

    if (!integration.isEnabled()) {
      throw new Error(`Integration is disabled: ${id}`);
    }

    if (!integration.isConfigured()) {
      throw new Error(`Integration is not configured: ${id}`);
    }

    try {
      this.logger.info('Starting sync', { integration: id });
      const result = await integration.sync();
      integration.updateLastSync();
      this.logger.info('Sync completed', { integration: id, result });
      return result;
    } catch (error) {
      this.logger.error('Sync failed', error, { integration: id });
      throw error;
    }
  }

  // Import from all enabled integrations
  async importFromAll(): Promise<Record<string, ImportResult>> {
    const integrations = this.getEnabledIntegrations().filter(
      integration => integration.isConfigured() && !integration.needsReauth()
    );

    const results: Record<string, ImportResult> = {};

    await Promise.allSettled(
      integrations.map(async (integration) => {
        const config = integration.getConfig();
        try {
          results[config.id] = await this.importFromIntegration(config.id);
        } catch (error) {
          results[config.id] = {
            success: false,
            imported: 0,
            failed: 0,
            duplicates: 0,
            errors: [error instanceof Error ? error.message : 'Unknown error']
          };
        }
      })
    );

    return results;
  }

  // Auto-sync integrations that need it
  async autoSync(): Promise<Record<string, SyncResult>> {
    const integrations = this.getEnabledIntegrations().filter(
      integration => integration.sync && integration.shouldAutoSync() && 
                    integration.isConfigured() && !integration.needsReauth()
    );

    const results: Record<string, SyncResult> = {};

    await Promise.allSettled(
      integrations.map(async (integration) => {
        const config = integration.getConfig();
        try {
          results[config.id] = await this.syncWithIntegration(config.id);
        } catch (error) {
          results[config.id] = {
            success: false,
            imported: 0,
            exported: 0,
            updated: 0,
            deleted: 0,
            errors: [error instanceof Error ? error.message : 'Unknown error']
          };
        }
      })
    );

    return results;
  }

  // Get integration status
  getIntegrationStatus(id: string): {
    configured: boolean;
    enabled: boolean;
    needsReauth: boolean;
    lastSync: Date | null;
    shouldAutoSync: boolean;
  } {
    const integration = this.getIntegration(id);
    if (!integration) {
      throw new Error(`Integration not found: ${id}`);
    }

    return {
      configured: integration.isConfigured(),
      enabled: integration.isEnabled(),
      needsReauth: integration.needsReauth(),
      lastSync: integration.getLastSync(),
      shouldAutoSync: integration.shouldAutoSync()
    };
  }

  // Get all integration statuses
  getAllIntegrationStatuses(): Record<string, any> {
    const statuses: Record<string, any> = {};
    
    for (const integration of this.getIntegrations()) {
      const config = integration.getConfig();
      statuses[config.id] = {
        ...this.getIntegrationStatus(config.id),
        name: config.name,
        type: config.type
      };
    }

    return statuses;
  }

  // Enable/disable integration
  setIntegrationEnabled(id: string, enabled: boolean): void {
    const integration = this.getIntegration(id);
    if (!integration) {
      throw new Error(`Integration not found: ${id}`);
    }

    integration.updateConfig({ enabled });
    this.logger.info('Integration enabled status changed', { id, enabled });
  }

  // Update integration configuration
  updateIntegrationConfig(id: string, updates: Partial<IntegrationConfig>): void {
    const integration = this.getIntegration(id);
    if (!integration) {
      throw new Error(`Integration not found: ${id}`);
    }

    integration.updateConfig(updates);
    this.logger.info('Integration configuration updated', { id, updates });
  }

  // Authenticate integration
  async authenticateIntegration(id: string, credentials: Record<string, any>): Promise<boolean> {
    const integration = this.getIntegration(id);
    if (!integration) {
      throw new Error(`Integration not found: ${id}`);
    }

    try {
      this.logger.info('Authenticating integration', { id });
      const success = await integration.authenticate(credentials);
      this.logger.info('Authentication completed', { id, success });
      return success;
    } catch (error) {
      this.logger.error('Authentication failed', error, { id });
      throw error;
    }
  }
}

// Global integration manager instance
export const integrationManager = new IntegrationManager();  