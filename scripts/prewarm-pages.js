#!/usr/bin/env node

const http = require('http');

const pages = [
  // Core DNA Profile features
  '/dna-profile',
  '/about-you',
  '/analytics', 
  '/search',
  '/playbooks',
  '/time-capsule',
  
  // Dashboard & Main Features
  '/dashboard',
  '/favorites',
  '/features',
  
  // AI Features
  '/ai-copilot',
  '/ai-copilot-2', 
  '/ai-copilot-3',
  '/ai-copolit',
  
  // Oracle Features
  '/oracle-demo',
  '/oracle-realtime',
  '/oracle-voice-test',
  '/oracle-whisper-test',
  
  // Marketplace
  '/marketplace',
  '/marketplace-2',
  
  // Productivity Features
  '/kanban',
  '/simple-board',
  
  // Settings & Configuration
  '/settings',
  '/settings-test',
  '/debug-settings',
  
  // Landing & Auth
  '/landing-page',
  '/auth',
  '/pricing',
  '/docs',
  
  // Testing & Debug
  '/test-notifications',
  '/sentry-example-page',
  '/url-checker',
  '/undefined-error',
  '/safari-window'
];

function prewarmPage(path) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: 'GET',
      timeout: 30000
    };

    const req = http.request(options, (res) => {
      console.log(`✓ Pre-warmed: ${path} (${res.statusCode})`);
      resolve();
    });

    req.on('error', (err) => {
      console.log(`✗ Failed to pre-warm: ${path} - ${err.message}`);
      resolve();
    });

    req.on('timeout', () => {
      console.log(`⏱ Timeout pre-warming: ${path}`);
      req.destroy();
      resolve();
    });

    req.end();
  });
}

async function prewarmAll() {
  console.log('🔥 Pre-warming pages for faster navigation...');
  
  // Wait for server to be ready
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  // Pre-warm pages in parallel
  await Promise.all(pages.map(prewarmPage));
  
  console.log('🚀 All pages pre-warmed! Navigation should be much faster now.');
}

prewarmAll().catch(console.error); 