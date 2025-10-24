import { useState, useEffect, useCallback } from 'react';
import { IntegrationConfig, ImportResult, ExportResult, SyncResult } from '../lib/integrations/integration-manager';

export interface IntegrationStatus {
  configured: boolean;
  enabled: boolean;
  needsReauth: boolean;
  lastSync: Date | null;
  shouldAutoSync: boolean;
  name: string;
  type: string;
}

export interface UseIntegrationsReturn {
  integrations: Record<string, IntegrationStatus>;
  loading: boolean;
  error: string | null;
  refreshIntegrations: () => Promise<void>;
  authenticateIntegration: (id: string, credentials: Record<string, any>) => Promise<boolean>;
  enableIntegration: (id: string, enabled: boolean) => Promise<void>;
  importFromIntegration: (id: string) => Promise<ImportResult>;
  exportToIntegration: (id: string, bookmarks: any[]) => Promise<ExportResult>;
  syncIntegration: (id: string) => Promise<SyncResult>;
  importFromAll: () => Promise<Record<string, ImportResult>>;
  autoSync: () => Promise<Record<string, SyncResult>>;
  updateConfig: (id: string, config: Partial<IntegrationConfig>) => Promise<void>;
  uploadFile: (id: string, fileData: any, currentSettings?: any) => Promise<void>;
}

export function useIntegrations(): UseIntegrationsReturn {
  const [integrations, setIntegrations] = useState<Record<string, IntegrationStatus>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshIntegrations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/integrations?action=list');
      const data = await response.json();

      if (data.success) {
        setIntegrations(data.integrations);
      } else {
        setError(data.error || 'Failed to fetch integrations');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  const authenticateIntegration = useCallback(async (id: string, credentials: Record<string, any>): Promise<boolean> => {
    try {
      setError(null);

      const response = await fetch('/api/integrations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'authenticate',
          integrationId: id,
          credentials
        })
      });

      const data = await response.json();

      if (data.success) {
        await refreshIntegrations();
        return true;
      } else {
        setError(data.error || 'Authentication failed');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication error');
      return false;
    }
  }, [refreshIntegrations]);

  const enableIntegration = useCallback(async (id: string, enabled: boolean): Promise<void> => {
    try {
      setError(null);

      const response = await fetch('/api/integrations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'enable',
          integrationId: id,
          enabled
        })
      });

      const data = await response.json();

      if (data.success) {
        await refreshIntegrations();
      } else {
        setError(data.error || 'Failed to update integration status');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [refreshIntegrations]);

  const importFromIntegration = useCallback(async (id: string): Promise<ImportResult> => {
    try {
      setError(null);

      const response = await fetch(`/api/integrations?action=import&id=${id}`);
      const data = await response.json();

      if (data.success) {
        await refreshIntegrations();
        return data.result;
      } else {
        setError(data.error || 'Import failed');
        throw new Error(data.error || 'Import failed');
      }
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Import error';
      setError(error);
      throw new Error(error);
    }
  }, [refreshIntegrations]);

  const exportToIntegration = useCallback(async (id: string, bookmarks: any[]): Promise<ExportResult> => {
    try {
      setError(null);

      const response = await fetch('/api/integrations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'export',
          integrationId: id,
          bookmarks
        })
      });

      const data = await response.json();

      if (data.success) {
        await refreshIntegrations();
        return data.result;
      } else {
        setError(data.error || 'Export failed');
        throw new Error(data.error || 'Export failed');
      }
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Export error';
      setError(error);
      throw new Error(error);
    }
  }, [refreshIntegrations]);

  const syncIntegration = useCallback(async (id: string): Promise<SyncResult> => {
    try {
      setError(null);

      const response = await fetch(`/api/integrations?action=sync&id=${id}`);
      const data = await response.json();

      if (data.success) {
        await refreshIntegrations();
        return data.result;
      } else {
        setError(data.error || 'Sync failed');
        throw new Error(data.error || 'Sync failed');
      }
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Sync error';
      setError(error);
      throw new Error(error);
    }
  }, [refreshIntegrations]);

  const importFromAll = useCallback(async (): Promise<Record<string, ImportResult>> => {
    try {
      setError(null);

      const response = await fetch('/api/integrations?action=import-all');
      const data = await response.json();

      if (data.success) {
        await refreshIntegrations();
        return data.results;
      } else {
        setError(data.error || 'Bulk import failed');
        throw new Error(data.error || 'Bulk import failed');
      }
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Bulk import error';
      setError(error);
      throw new Error(error);
    }
  }, [refreshIntegrations]);

  const autoSync = useCallback(async (): Promise<Record<string, SyncResult>> => {
    try {
      setError(null);

      const response = await fetch('/api/integrations?action=auto-sync');
      const data = await response.json();

      if (data.success) {
        await refreshIntegrations();
        return data.results;
      } else {
        setError(data.error || 'Auto sync failed');
        throw new Error(data.error || 'Auto sync failed');
      }
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Auto sync error';
      setError(error);
      throw new Error(error);
    }
  }, [refreshIntegrations]);

  const updateConfig = useCallback(async (id: string, config: Partial<IntegrationConfig>): Promise<void> => {
    try {
      setError(null);

      const response = await fetch('/api/integrations', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          integrationId: id,
          config
        })
      });

      const data = await response.json();

      if (data.success) {
        await refreshIntegrations();
      } else {
        setError(data.error || 'Failed to update configuration');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Configuration update error');
    }
  }, [refreshIntegrations]);

  const uploadFile = useCallback(async (id: string, fileData: any, currentSettings?: any): Promise<void> => {
    try {
      setError(null);

      const response = await fetch('/api/integrations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'upload-file',
          integrationId: id,
          fileData,
          currentSettings
        })
      });

      const data = await response.json();

      if (data.success) {
        await refreshIntegrations();
      } else {
        setError(data.error || 'File upload failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'File upload error');
    }
  }, [refreshIntegrations]);

  useEffect(() => {
    refreshIntegrations();
  }, [refreshIntegrations]);

  return {
    integrations,
    loading,
    error,
    refreshIntegrations,
    authenticateIntegration,
    enableIntegration,
    importFromIntegration,
    exportToIntegration,
    syncIntegration,
    importFromAll,
    autoSync,
    updateConfig,
    uploadFile
  };
}

export default useIntegrations; 