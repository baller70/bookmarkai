export interface SettingsType {
  appearance: {
    theme: 'light' | 'dark' | 'system'
    autoSchedule: boolean
    scheduleStart: string
    scheduleEnd: string
    accentColor: string
    customColor: string
    fontSize: number
    dyslexiaFont: boolean
    layoutDensity: 'compact' | 'comfortable' | 'spacious'
    motionEnabled: boolean
    backgroundPattern: 'none' | 'dots' | 'lines' | 'grid' | 'waves'
  }
  behavior: {
    defaultView: 'list' | 'grid' | 'timeline'
    linkOpening: 'same-tab' | 'new-tab'
    dragSensitivity: number
    autoSave: boolean
    draftExpiration: string
    confirmations: 'all' | 'important' | 'none'
    aiSuggestionFrequency: 'high' | 'medium' | 'low' | 'off'
    defaultSort: 'date' | 'name' | 'type' | 'size'
  }
  notifications: {
    channels: {
      email: boolean
      push: boolean
      inApp: boolean
    }
    preferences: {
      bookmarkUpdates: boolean
      securityAlerts: boolean
      newsletter: boolean
      tips: boolean
    }
  }
  privacy: {
    currentPassword: string
    newPassword: string
    confirmPassword: string
    twoFactor: {
      enabled: boolean
      method: 'authenticator' | 'sms' | 'email'
      phone: string
    }
    dataSharing: boolean
    analytics: boolean
    oauthConnections: Array<{
      provider: string
      icon: string
    }>
  }
  backup: {
    autoBackup: boolean
    backupFrequency: 'daily' | 'weekly' | 'monthly'
    lastBackup: string | null
    storageUsed: number
    encryptBackups: boolean
  }
}

export interface Settings {
  appearance: {
    theme: string;
    autoSchedule: boolean;
    scheduleStart: string;
    scheduleEnd: string;
    accentColor: string;
    customColor: string;
    fontSize: number;
    dyslexiaFont: boolean;
    layoutDensity: string;
    motionEnabled: boolean;
    backgroundPattern: string;
  };
  behavior: {
    defaultView: string;
    linkOpening: string;
    dragSensitivity: number;
    autoSave: boolean;
    draftExpiration: string;
    confirmations: string;
    aiSuggestionFrequency: string;
    defaultSort: string;
  };
  notifications: {
    channels: {
      email: boolean;
      inApp: boolean;
      push: boolean;
    };
    events: {
      aiRecommendations: boolean;
      weeklyDigest: boolean;
      timeCapsuleReminders: boolean;
      collaborativeInvites: boolean;
      analyticsAlerts: boolean;
    };
    quietHours: {
      enabled: boolean;
      start: string;
      end: string;
    };
    digest: {
      frequency: string;
      day: string;
      time: string;
    };
  };
  privacy: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
    twoFactor: {
      enabled: boolean;
      method: string;
      phone: string;
      backupCodes: string[];
    };
    sessions: unknown[];
    dataSharing: boolean;
    analytics: boolean;
    oauthConnections: unknown[];
  };
  backup: {
    scheduledBackups: boolean;
    frequency: string;
    cloudProvider: string;
    cloudPath: string;
    backupHistory: unknown[];
  };
  performance: {
    cacheExpiry: string;
    prefetchEnabled: boolean;
    lazyLoadImages: boolean;
    maxConcurrentRequests: number;
    debugMode: boolean;
    resourceUsage: {
      memory: number;
      cpu: number;
    };
  };
  accessibility: {
    highContrast: boolean;
    fontScale: number;
    screenReader: boolean;
    dyslexiaFont: boolean;
    colorBlindMode: string;
    focusOutline: boolean;
  };
  voice: {
    enabled: boolean;
    language: string;
    sensitivity: number;
    noiseReduction: boolean;
    voiceFeedback: boolean;
    customCommands: {
      openFavorites: string;
      searchBookmarks: string;
      addBookmark: string;
      deleteBookmark: string;
    };
  };
  advanced: {
    experimentalFeatures: {
      betaUI: boolean;
      advancedSearch: boolean;
      aiEnhancements: boolean;
    };
    apiKeys: unknown[];
    webhooks: unknown[];
    localStorage: {
      size: string;
      items: number;
    };
    devMode: boolean;
  };
  billing: {
    currentPlan: string;
    usage: {
      topics: { current: number; limit: number };
      favorites: { current: number; limit: number };
      capsules: { current: number; limit: number };
    };
    paymentMethods: unknown[];
    invoices: unknown[];
    autoRenew: boolean;
    promoCode: string;
  };
}

export interface EnhancedSettingsProps {
  userId: string
} 