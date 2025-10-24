#!/usr/bin/env node

/**
 * Production Environment Setup Script
 * Creates .env.local with all required variables for AI LinkPilot production deployment
 */

import fs from 'fs';
import path from 'path';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

// Environment variables configuration
const ENV_VARIABLES = {
  // Supabase Configuration
  NEXT_PUBLIC_SUPABASE_URL: {
    description: 'Supabase Project URL',
    example: 'https://your-project.supabase.co',
    required: true
  },
  NEXT_PUBLIC_SUPABASE_ANON_KEY: {
    description: 'Supabase Anonymous Key',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    required: true
  },
  SUPABASE_SERVICE_ROLE_KEY: {
    description: 'Supabase Service Role Key (for server operations)',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    required: true
  },
  
  // OpenAI Configuration
  OPENAI_API_KEY: {
    description: 'OpenAI API Key',
    example: 'sk-...',
    required: true
  },
  OPENAI_ORGANIZATION_ID: {
    description: 'OpenAI Organization ID (optional)',
    example: 'org-...',
    required: false
  },
  
  // Application Configuration
  NEXT_PUBLIC_APP_URL: {
    description: 'Application URL',
    example: 'https://your-app.com',
    required: true
  },
  NEXT_PUBLIC_APP_NAME: {
    description: 'Application Name',
    example: 'AI LinkPilot',
    required: false,
    default: 'AI LinkPilot'
  },
  
  // Authentication
  NEXTAUTH_SECRET: {
    description: 'NextAuth Secret Key',
    example: 'your-secret-key',
    required: true
  },
  NEXTAUTH_URL: {
    description: 'NextAuth URL',
    example: 'https://your-app.com',
    required: true
  },
  
  // AI Processing
  AI_PROCESSING_ENABLED: {
    description: 'Enable AI Processing',
    example: 'true',
    required: false,
    default: 'true'
  },
  AI_BATCH_SIZE: {
    description: 'AI Processing Batch Size',
    example: '10',
    required: false,
    default: '10'
  },
  AI_RATE_LIMIT: {
    description: 'AI API Rate Limit (requests per minute)',
    example: '60',
    required: false,
    default: '60'
  },
  
  // Database Configuration
  DATABASE_URL: {
    description: 'Database URL (if using external database)',
    example: 'postgresql://user:password@host:port/database',
    required: false
  },
  
  // Redis Configuration (for caching)
  REDIS_URL: {
    description: 'Redis URL (for caching and sessions)',
    example: 'redis://localhost:6379',
    required: false
  },
  
  // Email Configuration
  EMAIL_FROM: {
    description: 'Email From Address',
    example: 'noreply@your-app.com',
    required: false
  },
  SMTP_HOST: {
    description: 'SMTP Host',
    example: 'smtp.gmail.com',
    required: false
  },
  SMTP_PORT: {
    description: 'SMTP Port',
    example: '587',
    required: false
  },
  SMTP_USER: {
    description: 'SMTP Username',
    example: 'your-email@gmail.com',
    required: false
  },
  SMTP_PASSWORD: {
    description: 'SMTP Password',
    example: 'your-app-password',
    required: false
  },
  
  // Analytics & Monitoring
  GOOGLE_ANALYTICS_ID: {
    description: 'Google Analytics ID',
    example: 'G-XXXXXXXXXX',
    required: false
  },
  SENTRY_DSN: {
    description: 'Sentry DSN (for error tracking)',
    example: 'https://...@sentry.io/...',
    required: false
  },
  
  // File Storage
  NEXT_PUBLIC_STORAGE_BUCKET: {
    description: 'Storage Bucket Name',
    example: 'your-storage-bucket',
    required: false
  },
  STORAGE_ACCESS_KEY: {
    description: 'Storage Access Key',
    example: 'your-access-key',
    required: false
  },
  STORAGE_SECRET_KEY: {
    description: 'Storage Secret Key',
    example: 'your-secret-key',
    required: false
  },
  
  // Security
  ENCRYPTION_KEY: {
    description: 'Encryption Key (32 characters)',
    example: 'your-32-character-encryption-key',
    required: false
  },
  CORS_ORIGIN: {
    description: 'CORS Allowed Origins (comma-separated)',
    example: 'https://your-app.com,https://www.your-app.com',
    required: false
  },
  
  // Feature Flags
  FEATURE_VOICE_COMMANDS: {
    description: 'Enable Voice Commands Feature',
    example: 'true',
    required: false,
    default: 'true'
  },
  FEATURE_AI_FILTERING: {
    description: 'Enable AI Filtering Feature',
    example: 'true',
    required: false,
    default: 'true'
  },
  FEATURE_LEARNING_MODE: {
    description: 'Enable Learning Mode Feature',
    example: 'true',
    required: false,
    default: 'true'
  },
  
  // API Configuration
  API_RATE_LIMIT_MAX: {
    description: 'API Rate Limit Maximum Requests',
    example: '100',
    required: false,
    default: '100'
  },
  API_RATE_LIMIT_WINDOW: {
    description: 'API Rate Limit Window (minutes)',
    example: '15',
    required: false,
    default: '15'
  },
  
  // Logging
  LOG_LEVEL: {
    description: 'Log Level',
    example: 'info',
    required: false,
    default: 'info'
  },
  
  // Development/Production
  NODE_ENV: {
    description: 'Node Environment',
    example: 'production',
    required: false,
    default: 'production'
  }
};

async function main() {
  console.log('🚀 AI LinkPilot Production Environment Setup');
  console.log('===========================================\n');
  
  console.log('This script will help you configure all required environment variables for production deployment.\n');
  
  const envPath = path.join(process.cwd(), '.env.local');
  const envExamplePath = path.join(process.cwd(), '.env.example');
  
  // Check if .env.local already exists
  if (fs.existsSync(envPath)) {
    const overwrite = await question('⚠️  .env.local already exists. Do you want to overwrite it? (y/N): ');
    if (overwrite.toLowerCase() !== 'y' && overwrite.toLowerCase() !== 'yes') {
      console.log('Setup cancelled.');
      rl.close();
      return;
    }
  }
  
  const envVars = {};
  
  console.log('\n📝 Please provide the following environment variables:\n');
  
  // Collect required variables first
  console.log('🔴 Required Variables:');
  for (const [key, config] of Object.entries(ENV_VARIABLES)) {
    if (config.required) {
      let value = '';
      while (!value) {
        value = await question(`${key} (${config.description})\nExample: ${config.example}\nValue: `);
        if (!value) {
          console.log('❌ This variable is required. Please provide a value.\n');
        }
      }
      envVars[key] = value;
      console.log('✅ Set\n');
    }
  }
  
  // Collect optional variables
  console.log('\n🟡 Optional Variables (press Enter to skip or use default):');
  for (const [key, config] of Object.entries(ENV_VARIABLES)) {
    if (!config.required) {
      const defaultValue = config.default || '';
      const prompt = defaultValue 
        ? `${key} (${config.description}) [default: ${defaultValue}]\nValue: `
        : `${key} (${config.description})\nExample: ${config.example}\nValue: `;
      
      const value = await question(prompt);
      envVars[key] = value || defaultValue;
      
      if (envVars[key]) {
        console.log('✅ Set\n');
      } else {
        console.log('⏭️  Skipped\n');
      }
    }
  }
  
  // Generate .env.local content
  let envContent = '# AI LinkPilot Production Environment Configuration\n';
  envContent += '# Generated on ' + new Date().toISOString() + '\n\n';
  
  // Group variables by category
  const categories = {
    'Supabase Configuration': ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY'],
    'OpenAI Configuration': ['OPENAI_API_KEY', 'OPENAI_ORGANIZATION_ID'],
    'Application Configuration': ['NEXT_PUBLIC_APP_URL', 'NEXT_PUBLIC_APP_NAME'],
    'Authentication': ['NEXTAUTH_SECRET', 'NEXTAUTH_URL'],
    'AI Processing': ['AI_PROCESSING_ENABLED', 'AI_BATCH_SIZE', 'AI_RATE_LIMIT'],
    'Database Configuration': ['DATABASE_URL'],
    'Redis Configuration': ['REDIS_URL'],
    'Email Configuration': ['EMAIL_FROM', 'SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASSWORD'],
    'Analytics & Monitoring': ['GOOGLE_ANALYTICS_ID', 'SENTRY_DSN'],
    'File Storage': ['NEXT_PUBLIC_STORAGE_BUCKET', 'STORAGE_ACCESS_KEY', 'STORAGE_SECRET_KEY'],
    'Security': ['ENCRYPTION_KEY', 'CORS_ORIGIN'],
    'Feature Flags': ['FEATURE_VOICE_COMMANDS', 'FEATURE_AI_FILTERING', 'FEATURE_LEARNING_MODE'],
    'API Configuration': ['API_RATE_LIMIT_MAX', 'API_RATE_LIMIT_WINDOW'],
    'Logging': ['LOG_LEVEL'],
    'Environment': ['NODE_ENV']
  };
  
  for (const [category, keys] of Object.entries(categories)) {
    envContent += `# ${category}\n`;
    for (const key of keys) {
      if (envVars[key]) {
        envContent += `${key}=${envVars[key]}\n`;
      }
    }
    envContent += '\n';
  }
  
  // Write .env.local file
  fs.writeFileSync(envPath, envContent);
  
  // Create .env.example file
  let exampleContent = '# AI LinkPilot Environment Variables Example\n';
  exampleContent += '# Copy this file to .env.local and fill in your values\n\n';
  
  for (const [category, keys] of Object.entries(categories)) {
    exampleContent += `# ${category}\n`;
    for (const key of keys) {
      const config = ENV_VARIABLES[key];
      exampleContent += `# ${config.description}\n`;
      exampleContent += `${key}=${config.example}\n\n`;
    }
  }
  
  fs.writeFileSync(envExamplePath, exampleContent);
  
  console.log('\n✅ Environment setup complete!');
  console.log(`📁 Created: ${envPath}`);
  console.log(`📁 Created: ${envExamplePath}`);
  
  console.log('\n🔧 Next Steps:');
  console.log('1. Review and verify your environment variables');
  console.log('2. Run: npm run build');
  console.log('3. Run: npm run start');
  console.log('4. Test all features to ensure proper configuration');
  
  console.log('\n📚 Additional Configuration:');
  console.log('• Set up your Supabase database tables and RLS policies');
  console.log('• Configure your domain and SSL certificates');
  console.log('• Set up monitoring and logging');
  console.log('• Configure backup and disaster recovery');
  
  console.log('\n🎉 AI LinkPilot is ready for production!');
  
  rl.close();
}

// Handle errors
process.on('uncaughtException', (error) => {
  console.error('❌ Error:', error.message);
  rl.close();
  process.exit(1);
});

process.on('SIGINT', () => {
  console.log('\n\n⏹️  Setup cancelled by user.');
  rl.close();
  process.exit(0);
});

// Run the setup
main().catch((error) => {
  console.error('❌ Setup failed:', error.message);
  rl.close();
  process.exit(1);
}); 