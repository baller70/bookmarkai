import { readTriStore, writeTriStore } from './storage-service'

export interface AISettings {
  auto_processing: {
    enabled: boolean
    confidence_threshold: number
    categories: string[]
    auto_tags: boolean
    smart_descriptions: boolean
  }
  bulk_uploader: {
    batch_size: number
    retry_attempts: number
    timeout_seconds: number
  }
  recommendations: {
    suggestionsPerRefresh: 1|2|3|4|5|6|7|8|9|10
    serendipityLevel: 0|1|2|3|4|5|6|7|8|9|10
    autoIncludeOnSelect: boolean
    autoBundle: boolean
    includeTLDR: boolean
    domainBlacklist: string[]
    revisitNudgeDays: 1|3|7|14|21|30
    includeTrending: boolean
  }
  link_validator: {
    check_frequency: 'daily' | 'weekly' | 'monthly'
    auto_remove_broken: boolean
    notify_on_broken: boolean
  }
  browser_launcher: {
    default_browser: string
    open_in_new_tab: boolean
    focus_window: boolean
  }
}

export interface OracleSettings {
  appearance: {
    theme: 'light' | 'dark' | 'auto'
    size: 'small' | 'medium' | 'large'
    position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
    opacity: number
    blur_background: boolean
    show_animations: boolean
  }
  behavior: {
    auto_minimize: boolean
    stay_on_top: boolean
    click_through: boolean
    smart_responses: boolean
  }
  voice: {
    enabled: boolean
    voice_id: string
    speed: number
    pitch: number
    volume: number
  }
  context: {
    remember_conversations: boolean
    context_window_size: number
    personality: 'professional' | 'friendly' | 'casual' | 'technical'
  }
  tools: {
    web_search: boolean
    code_execution: boolean
    file_operations: boolean
    system_integration: boolean
  }
  advanced: {
    model: string
    temperature: number
    max_tokens: number
    custom_instructions: string
  }
}

// Default settings functions
function getDefaultAISetting<K extends keyof AISettings>(key: K): AISettings[K] {
  const defaults: AISettings = {
    auto_processing: {
      enabled: false,
      confidence_threshold: 0.8,
      categories: ['Development', 'Design', 'Marketing'],
      auto_tags: true,
      smart_descriptions: true,
    },
    bulk_uploader: {
      batch_size: 10,
      retry_attempts: 3,
      timeout_seconds: 30,
    },
    recommendations: {
      suggestionsPerRefresh: 5,
      serendipityLevel: 3,
      autoIncludeOnSelect: true,
      autoBundle: false,
      includeTLDR: true,
      domainBlacklist: [],
      revisitNudgeDays: 14,
      includeTrending: false,
    },
    link_validator: {
      check_frequency: 'weekly',
      auto_remove_broken: false,
      notify_on_broken: true,
    },
    browser_launcher: {
      default_browser: 'default',
      open_in_new_tab: true,
      focus_window: true,
    },
  }
  return defaults[key]
}

function getDefaultOracleSetting<K extends keyof OracleSettings>(key: K): OracleSettings[K] {
  const defaults: OracleSettings = {
    appearance: {
      theme: 'auto',
      size: 'medium',
      position: 'bottom-right',
      opacity: 0.9,
      blur_background: true,
      show_animations: true,
    },
    behavior: {
      auto_minimize: false,
      stay_on_top: true,
      click_through: false,
      smart_responses: true,
    },
    voice: {
      enabled: true,
      voice_id: 'alloy',
      speed: 1.0,
      pitch: 1.0,
      volume: 0.8,
    },
    context: {
      remember_conversations: true,
      context_window_size: 4000,
      personality: 'professional',
    },
    tools: {
      web_search: true,
      code_execution: false,
      file_operations: false,
      system_integration: false,
    },
    advanced: {
      model: 'gpt-4',
      temperature: 0.7,
      max_tokens: 1000,
      custom_instructions: '',
    },
  }
  return defaults[key]
}

// Server-side functions that directly use storage service
export async function getAISettingServer<K extends keyof AISettings>(
  userId: string,
  key: K
): Promise<AISettings[K]> {
  return await readTriStore({
    userId,
    key,
    supabaseTable: 'linkpilot_settings',
    defaultValue: getDefaultAISetting(key),
  })
}

export async function saveAISettingServer<K extends keyof AISettings>(
  userId: string,
  key: K,
  value: AISettings[K]
): Promise<void> {
  await writeTriStore({
    userId,
    key,
    supabaseTable: 'linkpilot_settings',
    value,
    defaultValue: getDefaultAISetting(key),
  })
}

export async function getOracleSettingServer<K extends keyof OracleSettings>(
  userId: string,
  key: K
): Promise<OracleSettings[K]> {
  return await readTriStore({
    userId,
    key,
    supabaseTable: 'oracle_settings',
    defaultValue: getDefaultOracleSetting(key),
  })
}

export async function saveOracleSettingServer<K extends keyof OracleSettings>(
  userId: string,
  key: K,
  value: OracleSettings[K]
): Promise<void> {
  await writeTriStore({
    userId,
    key,
    supabaseTable: 'oracle_settings',
    value,
    defaultValue: getDefaultOracleSetting(key),
  })
} 