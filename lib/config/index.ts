import { z } from 'zod';

// Environment types
export type Environment = 'development' | 'staging' | 'production' | 'test';

// Configuration schema with validation
const configSchema = z.object({
  // Environment
  NODE_ENV: z.enum(['development', 'staging', 'production', 'test']).default('development'),
  
  // Application
  APP_NAME: z.string().default('BookAIMark'),
  APP_VERSION: z.string().default('1.0.0'),
  APP_URL: z.string().url().optional(),
  PORT: z.coerce.number().default(3000),
  
  // Database
  DATABASE_URL: z.string().optional(),
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SERVICE_KEY: z.string().optional(),
  
  // Redis
  REDIS_URL: z.string().optional(),
  REDIS_HOST: z.string().optional(),
  REDIS_PORT: z.coerce.number().optional(),
  REDIS_PASSWORD: z.string().optional(),
  
  // AI Services
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().default('gpt-4'),
  ANTHROPIC_API_KEY: z.string().optional(),
  
  // Authentication
  NEXTAUTH_SECRET: z.string().optional(),
  NEXTAUTH_URL: z.string().url().optional(),
  JWT_SECRET: z.string().optional(),
  
  // Email
  RESEND_API_KEY: z.string().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  
  // Payment
  STRIPE_PUBLIC_KEY: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  
  // Monitoring
  SENTRY_DSN: z.string().optional(),
  SENTRY_ORG: z.string().optional(),
  SENTRY_PROJECT: z.string().optional(),
  SENTRY_AUTH_TOKEN: z.string().optional(),
  
  // Logging
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error', 'fatal']).default('info'),
  LOG_WEBHOOK_URL: z.string().url().optional(),
  
  // Security
  CORS_ORIGIN: z.string().optional(),
  RATE_LIMIT_MAX: z.coerce.number().default(100),
  RATE_LIMIT_WINDOW: z.coerce.number().default(900000), // 15 minutes
  
  // Feature Flags
  FEATURE_AI_ENABLED: z.coerce.boolean().default(true),
  FEATURE_ANALYTICS_ENABLED: z.coerce.boolean().default(true),
  FEATURE_MARKETPLACE_ENABLED: z.coerce.boolean().default(true),
  FEATURE_ORACLE_ENABLED: z.coerce.boolean().default(true),
  
  // File Storage
  STORAGE_TYPE: z.enum(['local', 'supabase', 's3']).default('local'),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_REGION: z.string().optional(),
  AWS_S3_BUCKET: z.string().optional(),
  
  // Performance
  MAX_REQUEST_SIZE: z.coerce.number().default(10485760), // 10MB
  REQUEST_TIMEOUT: z.coerce.number().default(30000), // 30 seconds
  
  // Development
  DEBUG: z.coerce.boolean().default(false),
  MOCK_EXTERNAL_APIS: z.coerce.boolean().default(false),
});

// Infer the config type from schema
export type Config = z.infer<typeof configSchema>;

// Environment-specific default configurations
const environmentDefaults: Record<Environment, Partial<Config>> = {
  development: {
    NODE_ENV: 'development',
    LOG_LEVEL: 'debug',
    DEBUG: true,
    MOCK_EXTERNAL_APIS: true,
    FEATURE_AI_ENABLED: true,
    FEATURE_ANALYTICS_ENABLED: true,
    FEATURE_MARKETPLACE_ENABLED: true,
    FEATURE_ORACLE_ENABLED: true,
  },
  staging: {
    NODE_ENV: 'staging',
    LOG_LEVEL: 'info',
    DEBUG: false,
    MOCK_EXTERNAL_APIS: false,
    FEATURE_AI_ENABLED: true,
    FEATURE_ANALYTICS_ENABLED: true,
    FEATURE_MARKETPLACE_ENABLED: true,
    FEATURE_ORACLE_ENABLED: true,
  },
  production: {
    NODE_ENV: 'production',
    LOG_LEVEL: 'warn',
    DEBUG: false,
    MOCK_EXTERNAL_APIS: false,
    FEATURE_AI_ENABLED: true,
    FEATURE_ANALYTICS_ENABLED: true,
    FEATURE_MARKETPLACE_ENABLED: true,
    FEATURE_ORACLE_ENABLED: true,
  },
  test: {
    NODE_ENV: 'test',
    LOG_LEVEL: 'error',
    DEBUG: false,
    MOCK_EXTERNAL_APIS: true,
    FEATURE_AI_ENABLED: false,
    FEATURE_ANALYTICS_ENABLED: false,
    FEATURE_MARKETPLACE_ENABLED: false,
    FEATURE_ORACLE_ENABLED: false,
  },
};

// Required environment variables by environment
const requiredEnvVars: Record<Environment, string[]> = {
  development: [],
  staging: [
    'DATABASE_URL',
    'NEXTAUTH_SECRET',
    'SENTRY_DSN',
  ],
  production: [
    'DATABASE_URL',
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL',
    'SENTRY_DSN',
    'SENTRY_ORG',
    'SENTRY_PROJECT',
  ],
  test: [],
};

// Configuration class
export class ConfigManager {
  private config: Config;
  private environment: Environment;

  constructor() {
    this.environment = this.detectEnvironment();
    this.config = this.loadConfig();
    this.validateConfig();
  }

  // Detect current environment
  private detectEnvironment(): Environment {
    const env = process.env.NODE_ENV as Environment;
    if (['development', 'staging', 'production', 'test'].includes(env)) {
      return env;
    }
    return 'development';
  }

  // Load configuration from environment variables
  private loadConfig(): Config {
    const envDefaults = environmentDefaults[this.environment];
    
    // Merge environment defaults with process.env
    const rawConfig = {
      ...envDefaults,
      ...process.env,
    };

    // Parse and validate with zod
    const parseResult = configSchema.safeParse(rawConfig);
    
    if (!parseResult.success) {
      const errors = parseResult.error.errors.map(err => 
        `${err.path.join('.')}: ${err.message}`
      ).join('\n');
      
      throw new Error(`Configuration validation failed:\n${errors}`);
    }

    return parseResult.data;
  }

  // Validate required environment variables
  private validateConfig(): void {
    const required = requiredEnvVars[this.environment];
    const missing = required.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
      throw new Error(
        `Missing required environment variables for ${this.environment}: ${missing.join(', ')}`
      );
    }
  }

  // Get configuration value
  get<K extends keyof Config>(key: K): Config[K] {
    return this.config[key];
  }

  // Get all configuration
  getAll(): Config {
    return { ...this.config };
  }

  // Get environment
  getEnvironment(): Environment {
    return this.environment;
  }

  // Check if feature is enabled
  isFeatureEnabled(feature: string): boolean {
    const featureKey = `FEATURE_${feature.toUpperCase()}_ENABLED` as keyof Config;
    return Boolean(this.config[featureKey]);
  }

  // Get database configuration
  getDatabaseConfig() {
    return {
      url: this.config.DATABASE_URL,
      supabase: {
        url: this.config.SUPABASE_URL,
        anonKey: this.config.SUPABASE_ANON_KEY,
        serviceKey: this.config.SUPABASE_SERVICE_KEY,
      },
    };
  }

  // Get Redis configuration
  getRedisConfig() {
    return {
      url: this.config.REDIS_URL,
      host: this.config.REDIS_HOST,
      port: this.config.REDIS_PORT,
      password: this.config.REDIS_PASSWORD,
    };
  }

  // Get AI services configuration
  getAIConfig() {
    return {
      openai: {
        apiKey: this.config.OPENAI_API_KEY,
        model: this.config.OPENAI_MODEL,
      },
      anthropic: {
        apiKey: this.config.ANTHROPIC_API_KEY,
      },
      enabled: this.config.FEATURE_AI_ENABLED,
    };
  }

  // Get authentication configuration
  getAuthConfig() {
    return {
      nextAuthSecret: this.config.NEXTAUTH_SECRET,
      nextAuthUrl: this.config.NEXTAUTH_URL,
      jwtSecret: this.config.JWT_SECRET,
    };
  }

  // Get email configuration
  getEmailConfig() {
    return {
      resend: {
        apiKey: this.config.RESEND_API_KEY,
      },
      smtp: {
        host: this.config.SMTP_HOST,
        port: this.config.SMTP_PORT,
        user: this.config.SMTP_USER,
        pass: this.config.SMTP_PASS,
      },
    };
  }

  // Get payment configuration
  getPaymentConfig() {
    return {
      stripe: {
        publicKey: this.config.STRIPE_PUBLIC_KEY,
        secretKey: this.config.STRIPE_SECRET_KEY,
        webhookSecret: this.config.STRIPE_WEBHOOK_SECRET,
      },
    };
  }

  // Get monitoring configuration
  getMonitoringConfig() {
    return {
      sentry: {
        dsn: this.config.SENTRY_DSN,
        org: this.config.SENTRY_ORG,
        project: this.config.SENTRY_PROJECT,
        authToken: this.config.SENTRY_AUTH_TOKEN,
      },
      logging: {
        level: this.config.LOG_LEVEL,
        webhookUrl: this.config.LOG_WEBHOOK_URL,
      },
    };
  }

  // Get security configuration
  getSecurityConfig() {
    return {
      corsOrigin: this.config.CORS_ORIGIN,
      rateLimit: {
        max: this.config.RATE_LIMIT_MAX,
        window: this.config.RATE_LIMIT_WINDOW,
      },
    };
  }

  // Get storage configuration
  getStorageConfig() {
    return {
      type: this.config.STORAGE_TYPE,
      aws: {
        accessKeyId: this.config.AWS_ACCESS_KEY_ID,
        secretAccessKey: this.config.AWS_SECRET_ACCESS_KEY,
        region: this.config.AWS_REGION,
        bucket: this.config.AWS_S3_BUCKET,
      },
    };
  }

  // Get performance configuration
  getPerformanceConfig() {
    return {
      maxRequestSize: this.config.MAX_REQUEST_SIZE,
      requestTimeout: this.config.REQUEST_TIMEOUT,
    };
  }

  // Check if in development mode
  isDevelopment(): boolean {
    return this.environment === 'development';
  }

  // Check if in production mode
  isProduction(): boolean {
    return this.environment === 'production';
  }

  // Check if in test mode
  isTest(): boolean {
    return this.environment === 'test';
  }

  // Check if in staging mode
  isStaging(): boolean {
    return this.environment === 'staging';
  }

  // Get configuration summary for logging
  getConfigSummary() {
    return {
      environment: this.environment,
      appName: this.config.APP_NAME,
      appVersion: this.config.APP_VERSION,
      port: this.config.PORT,
      logLevel: this.config.LOG_LEVEL,
      features: {
        ai: this.config.FEATURE_AI_ENABLED,
        analytics: this.config.FEATURE_ANALYTICS_ENABLED,
        marketplace: this.config.FEATURE_MARKETPLACE_ENABLED,
        oracle: this.config.FEATURE_ORACLE_ENABLED,
      },
      storageType: this.config.STORAGE_TYPE,
      debug: this.config.DEBUG,
    };
  }
}

// Global configuration instance
let configInstance: ConfigManager | null = null;

// Get configuration instance (singleton)
export function getConfig(): ConfigManager {
  if (!configInstance) {
    configInstance = new ConfigManager();
  }
  return configInstance;
}

// Reset configuration instance (for testing)
export function resetConfig(): void {
  configInstance = null;
}

// Export default configuration
export const config = getConfig();

// Export configuration helpers
export const isDevelopment = () => config.isDevelopment();
export const isProduction = () => config.isProduction();
export const isTest = () => config.isTest();
export const isStaging = () => config.isStaging();

// Export specific configuration getters
export const getDatabaseConfig = () => config.getDatabaseConfig();
export const getAIConfig = () => config.getAIConfig();
export const getAuthConfig = () => config.getAuthConfig();
export const getEmailConfig = () => config.getEmailConfig();
export const getPaymentConfig = () => config.getPaymentConfig();
export const getMonitoringConfig = () => config.getMonitoringConfig();
export const getSecurityConfig = () => config.getSecurityConfig();
export const getStorageConfig = () => config.getStorageConfig();
export const getPerformanceConfig = () => config.getPerformanceConfig();

// Feature flag helpers
export const isFeatureEnabled = (feature: string) => config.isFeatureEnabled(feature);
export const isAIEnabled = () => config.isFeatureEnabled('ai');
export const isAnalyticsEnabled = () => config.isFeatureEnabled('analytics');
export const isMarketplaceEnabled = () => config.isFeatureEnabled('marketplace');
export const isOracleEnabled = () => config.isFeatureEnabled('oracle'); 