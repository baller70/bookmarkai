import { NextRequest, NextResponse } from 'next/server';
import { integrationManager } from '../../../lib/integrations/integration-manager';
import { createTwitterIntegration } from '../../../lib/integrations/twitter-integration';
import { createRedditIntegration } from '../../../lib/integrations/reddit-integration';
import { createChromeIntegration } from '../../../lib/integrations/chrome-integration';
import { createNotionIntegration } from '../../../lib/integrations/notion-integration';
import { createZapierIntegration } from '../../../lib/integrations/zapier-integration';

// Initialize integrations
const twitterIntegration = createTwitterIntegration();
const redditIntegration = createRedditIntegration();
const chromeIntegration = createChromeIntegration();
const notionIntegration = createNotionIntegration();
const zapierIntegration = createZapierIntegration();

// Register integrations with the manager
integrationManager.registerIntegration(twitterIntegration);
integrationManager.registerIntegration(redditIntegration);
integrationManager.registerIntegration(chromeIntegration);
integrationManager.registerIntegration(notionIntegration);
integrationManager.registerIntegration(zapierIntegration);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const integrationId = searchParams.get('id');

    switch (action) {
      case 'list':
        // Get all integrations with their status
        const integrations = integrationManager.getAllIntegrationStatuses();
        return NextResponse.json({
          success: true,
          integrations
        });

      case 'status':
        if (!integrationId) {
          return NextResponse.json(
            { success: false, error: 'Integration ID is required' },
            { status: 400 }
          );
        }

        const status = integrationManager.getIntegrationStatus(integrationId);
        return NextResponse.json({
          success: true,
          status
        });

      case 'import':
        if (!integrationId) {
          return NextResponse.json(
            { success: false, error: 'Integration ID is required' },
            { status: 400 }
          );
        }

        const importResult = await integrationManager.importFromIntegration(integrationId);
        return NextResponse.json({
          success: true,
          result: importResult
        });

      case 'import-all':
        const importAllResult = await integrationManager.importFromAll();
        return NextResponse.json({
          success: true,
          results: importAllResult
        });

      case 'sync':
        if (!integrationId) {
          return NextResponse.json(
            { success: false, error: 'Integration ID is required' },
            { status: 400 }
          );
        }

        const syncResult = await integrationManager.syncWithIntegration(integrationId);
        return NextResponse.json({
          success: true,
          result: syncResult
        });

      case 'auto-sync':
        const autoSyncResult = await integrationManager.autoSync();
        return NextResponse.json({
          success: true,
          results: autoSyncResult
        });

      case 'webhooks':
        // Zapier-specific webhook management
        if (integrationId === 'zapier') {
          const webhooks = zapierIntegration.getWebhooks();
          const stats = zapierIntegration.getWebhookStats();
          return NextResponse.json({
            success: true,
            webhooks,
            stats
          });
        }
        return NextResponse.json(
          { success: false, error: 'Webhooks only available for Zapier integration' },
          { status: 400 }
        );

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Integrations API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, integrationId, ...data } = body;

    switch (action) {
      case 'authenticate':
        if (!integrationId || !data.credentials) {
          return NextResponse.json(
            { success: false, error: 'Integration ID and credentials are required' },
            { status: 400 }
          );
        }

        const authResult = await integrationManager.authenticateIntegration(
          integrationId,
          data.credentials
        );

        return NextResponse.json({
          success: authResult,
          message: authResult ? 'Authentication successful' : 'Authentication failed'
        });

      case 'configure':
        if (!integrationId || !data.config) {
          return NextResponse.json(
            { success: false, error: 'Integration ID and config are required' },
            { status: 400 }
          );
        }

        integrationManager.updateIntegrationConfig(integrationId, data.config);

        return NextResponse.json({
          success: true,
          message: 'Configuration updated'
        });

      case 'enable':
        if (!integrationId || typeof data.enabled !== 'boolean') {
          return NextResponse.json(
            { success: false, error: 'Integration ID and enabled status are required' },
            { status: 400 }
          );
        }

        integrationManager.setIntegrationEnabled(integrationId, data.enabled);

        return NextResponse.json({
          success: true,
          message: `Integration ${data.enabled ? 'enabled' : 'disabled'}`
        });

      case 'export':
        if (!integrationId || !data.bookmarks) {
          return NextResponse.json(
            { success: false, error: 'Integration ID and bookmarks are required' },
            { status: 400 }
          );
        }

        const exportResult = await integrationManager.exportToIntegration(
          integrationId,
          data.bookmarks
        );

        return NextResponse.json({
          success: true,
          result: exportResult
        });

      case 'upload-file':
        if (!integrationId || !data.fileData) {
          return NextResponse.json(
            { success: false, error: 'Integration ID and file data are required' },
            { status: 400 }
          );
        }

        // Handle file upload for integrations like Chrome bookmarks
        integrationManager.updateIntegrationConfig(integrationId, {
          settings: {
            ...data.currentSettings,
            fileData: data.fileData,
            method: 'file'
          }
        });

        return NextResponse.json({
          success: true,
          message: 'File uploaded successfully'
        });

      case 'add-webhook':
        // Zapier-specific webhook management
        if (integrationId === 'zapier') {
          const webhookId = zapierIntegration.addWebhook(data.webhook);
          return NextResponse.json({
            success: true,
            webhookId,
            message: 'Webhook added successfully'
          });
        }
        return NextResponse.json(
          { success: false, error: 'Webhooks only available for Zapier integration' },
          { status: 400 }
        );

      case 'test-webhook':
        if (integrationId === 'zapier' && data.webhookId) {
          const testResult = await zapierIntegration.testWebhook(data.webhookId);
          return NextResponse.json({
            success: testResult,
            message: testResult ? 'Webhook test successful' : 'Webhook test failed'
          });
        }
        return NextResponse.json(
          { success: false, error: 'Invalid webhook test request' },
          { status: 400 }
        );

      case 'trigger-webhook':
        if (integrationId === 'zapier' && data.event && data.bookmark) {
          switch (data.event) {
            case 'bookmark.created':
              await zapierIntegration.triggerBookmarkCreated(data.bookmark);
              break;
            case 'bookmark.updated':
              await zapierIntegration.triggerBookmarkUpdated(data.bookmark, data.changes);
              break;
            case 'bookmark.deleted':
              await zapierIntegration.triggerBookmarkDeleted(data.bookmark);
              break;
            case 'bookmark.tagged':
              await zapierIntegration.triggerBookmarkTagged(data.bookmark, data.newTags);
              break;
            case 'bookmark.categorized':
              await zapierIntegration.triggerBookmarkCategorized(data.bookmark, data.newCategory);
              break;
            default:
              return NextResponse.json(
                { success: false, error: 'Invalid webhook event' },
                { status: 400 }
              );
          }
          
          return NextResponse.json({
            success: true,
            message: 'Webhook triggered successfully'
          });
        }
        return NextResponse.json(
          { success: false, error: 'Invalid webhook trigger request' },
          { status: 400 }
        );

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Integrations API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { integrationId, config, webhookId, webhook } = body;

    if (integrationId === 'zapier' && webhookId && webhook) {
      // Update Zapier webhook
      const updated = zapierIntegration.updateWebhook(webhookId, webhook);
      return NextResponse.json({
        success: updated,
        message: updated ? 'Webhook updated successfully' : 'Webhook not found'
      });
    }

    if (!integrationId || !config) {
      return NextResponse.json(
        { success: false, error: 'Integration ID and config are required' },
        { status: 400 }
      );
    }

    integrationManager.updateIntegrationConfig(integrationId, config);

    return NextResponse.json({
      success: true,
      message: 'Integration configuration updated'
    });
  } catch (error) {
    console.error('Integrations API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const integrationId = searchParams.get('id');
    const webhookId = searchParams.get('webhookId');

    if (integrationId === 'zapier' && webhookId) {
      // Delete Zapier webhook
      const removed = zapierIntegration.removeWebhook(webhookId);
      return NextResponse.json({
        success: removed,
        message: removed ? 'Webhook removed successfully' : 'Webhook not found'
      });
    }

    if (!integrationId) {
      return NextResponse.json(
        { success: false, error: 'Integration ID is required' },
        { status: 400 }
      );
    }

    // Disable the integration
    integrationManager.setIntegrationEnabled(integrationId, false);

    // Clear sensitive data
    integrationManager.updateIntegrationConfig(integrationId, {
      accessToken: undefined,
      refreshToken: undefined,
      settings: {}
    });

    return NextResponse.json({
      success: true,
      message: 'Integration disabled and data cleared'
    });
  } catch (error) {
    console.error('Integrations API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
} 