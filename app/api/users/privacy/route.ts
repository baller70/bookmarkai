import { NextRequest, NextResponse } from 'next/server';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { authenticateUser, createUnauthorizedResponse } from '@/lib/auth-utils';

// File-based storage paths
const PRIVACY_DIR = join(process.cwd(), 'apps/web/data/privacy');
const CONSENT_FILE = join(PRIVACY_DIR, 'user_consent.json');
const DATA_REQUESTS_FILE = join(PRIVACY_DIR, 'data_requests.json');
const PRIVACY_SETTINGS_FILE = join(PRIVACY_DIR, 'privacy_settings.json');

// Privacy interfaces
interface UserConsent {
  user_id: string;
  consent_version: string;
  consents: {
    essential: boolean;
    analytics: boolean;
    marketing: boolean;
    personalization: boolean;
    third_party_sharing: boolean;
    data_processing: boolean;
    cookies: boolean;
    email_communications: boolean;
    push_notifications: boolean;
  };
  ip_address: string;
  user_agent: string;
  timestamp: string;
  withdrawn_at?: string;
  updated_at: string;
}

interface DataRequest {
  id: string;
  user_id: string;
  type: 'export' | 'delete' | 'rectification' | 'portability' | 'restriction';
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  reason?: string;
  details: string;
  requested_at: string;
  processed_at?: string;
  completed_at?: string;
  data_url?: string; // For export requests
  expiry_date?: string; // For download links
  processing_notes?: string;
}

interface PrivacySettings {
  user_id: string;
  profile_visibility: 'public' | 'private' | 'friends_only';
  data_sharing: {
    analytics: boolean;
    marketing: boolean;
    research: boolean;
    third_parties: boolean;
  };
  data_retention: {
    activity_logs_days: number;
    deleted_items_days: number;
    session_data_days: number;
  };
  communication_preferences: {
    email_notifications: boolean;
    push_notifications: boolean;
    sms_notifications: boolean;
    marketing_emails: boolean;
    product_updates: boolean;
    security_alerts: boolean;
  };
  cookie_preferences: {
    essential: boolean;
    functional: boolean;
    analytics: boolean;
    marketing: boolean;
  };
  data_processing_purposes: string[];
  third_party_integrations: Record<string, boolean>;
  created_at: string;
  updated_at: string;
}

// Consent versions and requirements
const CONSENT_VERSIONS = {
  'v1.0': {
    version: 'v1.0',
    effective_date: '2024-01-01',
    required_consents: ['essential', 'data_processing'],
    optional_consents: ['analytics', 'marketing', 'personalization', 'third_party_sharing', 'cookies', 'email_communications', 'push_notifications']
  },
  'v1.1': {
    version: 'v1.1',
    effective_date: '2024-06-01',
    required_consents: ['essential', 'data_processing', 'cookies'],
    optional_consents: ['analytics', 'marketing', 'personalization', 'third_party_sharing', 'email_communications', 'push_notifications']
  }
};

const CURRENT_CONSENT_VERSION = 'v1.1';

// Ensure data directory exists
function ensureDataDirectory() {
  if (!existsSync(PRIVACY_DIR)) {
    const { mkdirSync } = require('fs');
    mkdirSync(PRIVACY_DIR, { recursive: true });
  }
}

// Load data functions
function loadUserConsent(): UserConsent[] {
  ensureDataDirectory();
  if (!existsSync(CONSENT_FILE)) return [];
  try {
    return JSON.parse(readFileSync(CONSENT_FILE, 'utf8'));
  } catch { return []; }
}

function loadDataRequests(): DataRequest[] {
  ensureDataDirectory();
  if (!existsSync(DATA_REQUESTS_FILE)) return [];
  try {
    return JSON.parse(readFileSync(DATA_REQUESTS_FILE, 'utf8'));
  } catch { return []; }
}

function loadPrivacySettings(): PrivacySettings[] {
  ensureDataDirectory();
  if (!existsSync(PRIVACY_SETTINGS_FILE)) return [];
  try {
    return JSON.parse(readFileSync(PRIVACY_SETTINGS_FILE, 'utf8'));
  } catch { return []; }
}

// Save data functions
function saveUserConsent(consents: UserConsent[]) {
  ensureDataDirectory();
  writeFileSync(CONSENT_FILE, JSON.stringify(consents, null, 2));
}

function saveDataRequests(requests: DataRequest[]) {
  ensureDataDirectory();
  writeFileSync(DATA_REQUESTS_FILE, JSON.stringify(requests, null, 2));
}

function savePrivacySettings(settings: PrivacySettings[]) {
  ensureDataDirectory();
  writeFileSync(PRIVACY_SETTINGS_FILE, JSON.stringify(settings, null, 2));
}

// Create default privacy settings
function createDefaultPrivacySettings(userId: string): PrivacySettings {
  return {
    user_id: userId,
    profile_visibility: 'private',
    data_sharing: {
      analytics: false,
      marketing: false,
      research: false,
      third_parties: false,
    },
    data_retention: {
      activity_logs_days: 365,
      deleted_items_days: 30,
      session_data_days: 90,
    },
    communication_preferences: {
      email_notifications: true,
      push_notifications: true,
      sms_notifications: false,
      marketing_emails: false,
      product_updates: true,
      security_alerts: true,
    },
    cookie_preferences: {
      essential: true,
      functional: true,
      analytics: false,
      marketing: false,
    },
    data_processing_purposes: ['service_provision', 'account_management', 'security'],
    third_party_integrations: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

// GET /api/users/privacy - Get user privacy settings and consent status
export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateUser(request);
    if (!authResult.success) {
      return createUnauthorizedResponse(authResult.error);
    }
    const userId = authResult.userId!;
    
    const { searchParams } = new URL(request.url);
    const include = searchParams.get('include')?.split(',') || [];

    console.log(`🔒 Getting privacy settings for user: ${userId}`);

    const response: any = {};

    // Get current consent status
    const consents = loadUserConsent();
    const currentConsent = consents
      .filter(c => c.user_id === userId && !c.withdrawn_at)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];

    response.consent_status = {
      has_current_consent: !!currentConsent && currentConsent.consent_version === CURRENT_CONSENT_VERSION,
      current_version: CURRENT_CONSENT_VERSION,
      user_version: currentConsent?.consent_version || null,
      consents: currentConsent?.consents || null,
      last_updated: currentConsent?.updated_at || null,
    };

    // Get privacy settings
    const privacySettings = loadPrivacySettings();
    let userSettings = privacySettings.find(s => s.user_id === userId);

    if (!userSettings) {
      userSettings = createDefaultPrivacySettings(userId);
      privacySettings.push(userSettings);
      savePrivacySettings(privacySettings);
    }

    response.privacy_settings = userSettings;

    // Include data requests if requested
    if (include.includes('data_requests')) {
      const dataRequests = loadDataRequests().filter(r => r.user_id === userId);
      response.data_requests = dataRequests;
    }

    // Include consent history if requested
    if (include.includes('consent_history')) {
      const consentHistory = consents.filter(c => c.user_id === userId);
      response.consent_history = consentHistory;
    }

    // Include consent requirements
    response.consent_requirements = CONSENT_VERSIONS[CURRENT_CONSENT_VERSION];

    return NextResponse.json({
      success: true,
      data: response,
      message: 'Privacy settings retrieved successfully'
    });

  } catch (error) {
    console.error('❌ Error getting privacy settings:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to get privacy settings'
    }, { status: 500 });
  }
}

// POST /api/users/privacy - Record user consent or create data request
export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateUser(request);
    if (!authResult.success) {
      return createUnauthorizedResponse(authResult.error);
    }
    const userId = authResult.userId!;
    
    const body = await request.json();
    const { action, ...data } = body;

    console.log(`📝 Processing privacy action for user: ${userId}, action: ${action}`);

    if (action === 'record_consent') {
      // Record user consent
      const { consents } = data;

      if (!consents) {
        return NextResponse.json({
          success: false,
          error: 'Consents are required'
        }, { status: 400 });
      }

      // Validate required consents
      const requiredConsents = CONSENT_VERSIONS[CURRENT_CONSENT_VERSION].required_consents;
      const missingConsents = requiredConsents.filter(consent => !consents[consent]);

      if (missingConsents.length > 0) {
        return NextResponse.json({
          success: false,
          error: `Missing required consents: ${missingConsents.join(', ')}`
        }, { status: 400 });
      }

      const userConsents = loadUserConsent();
      const newConsent: UserConsent = {
        user_id: userId,
        consent_version: CURRENT_CONSENT_VERSION,
        consents,
        ip_address: request.headers.get('x-forwarded-for') || 'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown',
        timestamp: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      userConsents.push(newConsent);
      saveUserConsent(userConsents);

      return NextResponse.json({
        success: true,
        data: newConsent,
        message: 'Consent recorded successfully'
      }, { status: 201 });

    } else if (action === 'data_request') {
      // Create data request (GDPR rights)
      const { type, details, reason } = data;

      if (!type || !['export', 'delete', 'rectification', 'portability', 'restriction'].includes(type)) {
        return NextResponse.json({
          success: false,
          error: 'Invalid request type'
        }, { status: 400 });
      }

      const dataRequests = loadDataRequests();
      const newRequest: DataRequest = {
        id: uuidv4(),
        user_id: userId,
        type: type as any,
        status: 'pending',
        reason,
        details: details || `User requested ${type} of their data`,
        requested_at: new Date().toISOString(),
      };

      // Set automatic processing for some request types
      if (type === 'export') {
        newRequest.status = 'processing';
        newRequest.processed_at = new Date().toISOString();
        // In a real implementation, this would trigger data export
        newRequest.processing_notes = 'Data export initiated';
      }

      dataRequests.push(newRequest);
      saveDataRequests(dataRequests);

      return NextResponse.json({
        success: true,
        data: newRequest,
        message: `Data ${type} request submitted successfully`
      }, { status: 201 });

    } else {
      return NextResponse.json({
        success: false,
        error: 'Invalid action'
      }, { status: 400 });
    }

  } catch (error) {
    console.error('❌ Error processing privacy action:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to process privacy action'
    }, { status: 500 });
  }
}

// PUT /api/users/privacy - Update privacy settings
export async function PUT(request: NextRequest) {
  try {
    const authResult = await authenticateUser(request);
    if (!authResult.success) {
      return createUnauthorizedResponse(authResult.error);
    }
    const userId = authResult.userId!;
    
    const body = await request.json();
    const { ...updates } = body;

    console.log(`✏️ Updating privacy settings for user: ${userId}`);

    const privacySettings = loadPrivacySettings();
    const settingsIndex = privacySettings.findIndex(s => s.user_id === userId);

    let userSettings: PrivacySettings;

    if (settingsIndex === -1) {
      // Create new settings
      userSettings = createDefaultPrivacySettings(userId);
      privacySettings.push(userSettings);
    } else {
      userSettings = privacySettings[settingsIndex];
    }

    // Update settings with proper merging for nested objects
    if (updates.data_sharing) {
      userSettings.data_sharing = { ...userSettings.data_sharing, ...updates.data_sharing };
    }
    if (updates.data_retention) {
      userSettings.data_retention = { ...userSettings.data_retention, ...updates.data_retention };
    }
    if (updates.communication_preferences) {
      userSettings.communication_preferences = { ...userSettings.communication_preferences, ...updates.communication_preferences };
    }
    if (updates.cookie_preferences) {
      userSettings.cookie_preferences = { ...userSettings.cookie_preferences, ...updates.cookie_preferences };
    }
    if (updates.third_party_integrations) {
      userSettings.third_party_integrations = { ...userSettings.third_party_integrations, ...updates.third_party_integrations };
    }

    // Update other fields
    Object.keys(updates).forEach(key => {
      if (!['data_sharing', 'data_retention', 'communication_preferences', 'cookie_preferences', 'third_party_integrations'].includes(key)) {
        (userSettings as any)[key] = updates[key];
      }
    });

    userSettings.updated_at = new Date().toISOString();

    if (settingsIndex === -1) {
      privacySettings.push(userSettings);
    } else {
      privacySettings[settingsIndex] = userSettings;
    }

    savePrivacySettings(privacySettings);

    return NextResponse.json({
      success: true,
      data: userSettings,
      message: 'Privacy settings updated successfully'
    });

  } catch (error) {
    console.error('❌ Error updating privacy settings:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to update privacy settings'
    }, { status: 500 });
  }
}

// DELETE /api/users/privacy - Withdraw consent or delete privacy data
export async function DELETE(request: NextRequest) {
  try {
    const authResult = await authenticateUser(request);
    if (!authResult.success) {
      return createUnauthorizedResponse(authResult.error);
    }
    const userId = authResult.userId!;
    
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'withdraw_consent';

    console.log(`🗑️ Processing privacy deletion for user: ${userId}, action: ${action}`);

    if (action === 'withdraw_consent') {
      // Withdraw all consents
      const consents = loadUserConsent();
      const userConsents = consents.filter(c => c.user_id === userId && !c.withdrawn_at);

      if (userConsents.length === 0) {
        return NextResponse.json({
          success: false,
          error: 'No active consents found'
        }, { status: 404 });
      }

      // Mark all consents as withdrawn
      const now = new Date().toISOString();
      consents.forEach(consent => {
        if (consent.user_id === userId && !consent.withdrawn_at) {
          consent.withdrawn_at = now;
          consent.updated_at = now;
        }
      });

      saveUserConsent(consents);

      return NextResponse.json({
        success: true,
        message: 'All consents withdrawn successfully'
      });

    } else if (action === 'delete_privacy_data') {
      // Delete all privacy-related data for user
      const consents = loadUserConsent().filter(c => c.user_id !== userId);
      const dataRequests = loadDataRequests().filter(r => r.user_id !== userId);
      const privacySettings = loadPrivacySettings().filter(s => s.user_id !== userId);

      saveUserConsent(consents);
      saveDataRequests(dataRequests);
      savePrivacySettings(privacySettings);

      return NextResponse.json({
        success: true,
        message: 'Privacy data deleted successfully'
      });

    } else {
      return NextResponse.json({
        success: false,
        error: 'Invalid action'
      }, { status: 400 });
    }

  } catch (error) {
    console.error('❌ Error processing privacy deletion:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to process privacy deletion'
    }, { status: 500 });
  }
}  