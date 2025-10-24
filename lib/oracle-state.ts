/**
 * Oracle State Management Utility
 * Checks if Oracle is enabled/disabled to prevent API charges when disabled
 */

interface OracleGlobalSettings {
  enabled: boolean
  lastActivated: string | null
  totalSessions: number
}

// Global Oracle state storage (shared across API routes)
let globalOracleState: { enabled: boolean; timestamp: number } | null = null
const CACHE_DURATION = 30 * 1000 // 30 seconds

/**
 * Sets the global Oracle state (called from the save API when Oracle settings are updated)
 */
export function setOracleState(enabled: boolean): void {
  globalOracleState = {
    enabled,
    timestamp: Date.now()
  }
  console.log('🔄 Oracle state updated:', enabled ? 'ENABLED' : 'DISABLED')
}

/**
 * Checks if Oracle is currently enabled
 * Returns false if Oracle is disabled to prevent API charges
 */
export async function isOracleEnabled(): Promise<boolean> {
  try {
    const now = Date.now()
    
    // Check if we have a cached state and it's still valid
    if (globalOracleState && (now - globalOracleState.timestamp) < CACHE_DURATION) {
      console.log('🔍 Oracle state check (cached):', globalOracleState.enabled ? 'ENABLED' : 'DISABLED')
      return globalOracleState.enabled
    }
    
    // If no cached state, default to disabled for safety
    // The state will be properly set when Oracle settings are saved
    console.log('📭 No Oracle state cached, defaulting to DISABLED for safety')
    globalOracleState = {
      enabled: false,
      timestamp: now
    }
    return false
    
  } catch (error) {
    console.error('❌ Error checking Oracle state:', error)
    // Default to disabled on error to prevent API charges
    return false
  }
}

/**
 * Creates a standardized response for when Oracle is disabled
 */
export function createOracleDisabledResponse() {
  return {
    error: 'Oracle is currently disabled. Please enable Oracle in Settings to use this feature.',
    code: 'ORACLE_DISABLED',
    message: 'Oracle AI services are disabled to prevent API charges.'
  }
} 