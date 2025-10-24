#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up optimized development environment...\n');

// Step 1: Install dependencies
console.log('📦 Installing dependencies...');
try {
  // Try pnpm first (for workspace), fallback to npm
  try {
    execSync('pnpm install', { stdio: 'inherit' });
  } catch {
    execSync('npm install', { stdio: 'inherit' });
  }
  console.log('✅ Dependencies installed\n');
} catch (error) {
  console.warn('⚠️  Could not install dependencies:', error.message);
  console.log('   Continuing with existing dependencies...\n');
}

// Step 2: Clean build cache
console.log('🧹 Cleaning build cache...');
try {
  // Try to clean .next and cache directories
  execSync('rm -rf .next && rm -rf node_modules/.cache', { stdio: 'inherit' });
  console.log('✅ Build cache cleaned\n');
} catch (error) {
  console.warn('⚠️  Could not clean cache:', error.message);
}

// Step 3: Check for required environment variables
console.log('🔧 Checking environment configuration...');
const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingVars.length > 0) {
  console.log('⚠️  Missing environment variables (will use demo mode):');
  missingVars.forEach(varName => console.log(`   - ${varName}`));
  console.log('   Demo mode will be activated automatically.\n');
} else {
  console.log('✅ Environment variables configured\n');
}

// Step 4: Verify critical files exist
console.log('📁 Verifying project structure...');
const criticalFiles = [
  'lib/supabase-demo.ts',
  'scripts/prewarm-pages.js',
  'scripts/performance-monitor.js',
  'next.config.js',
  'tsconfig.json'
];

let allFilesExist = true;
criticalFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ Missing: ${file}`);
    allFilesExist = false;
  }
});

if (!allFilesExist) {
  console.error('\n❌ Some critical files are missing. Please ensure all optimization files are in place.');
  process.exit(1);
}

console.log('✅ Project structure verified\n');

// Step 5: Display available development commands
console.log('🎯 Available optimized development commands:');
console.log('');
console.log('  npm run dev:fast     - Fast development with Turbo mode');
console.log('  npm run dev:ultra    - Ultra-fast mode with maximum memory');
console.log('  npm run dev:prewarm  - Auto pre-warm pages for instant navigation');
console.log('  npm run dev:monitor  - Development with performance monitoring');
console.log('  npm run prewarm      - Pre-warm all pages manually');
console.log('  npm run monitor      - Check current performance metrics');
console.log('  npm run perf         - Run full performance analysis');
console.log('');

// Step 6: Provide usage recommendations
console.log('💡 Performance Tips:');
console.log('');
console.log('  🔥 For fastest development:   npm run dev:ultra');
console.log('  📊 For monitoring:            npm run dev:monitor');
console.log('  🎯 For instant navigation:    npm run dev:prewarm');
console.log('  📈 For performance analysis:  npm run perf');
console.log('');

console.log('✨ Development environment setup complete!');
console.log('   Ready for high-performance development 🚀'); 