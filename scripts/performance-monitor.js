#!/usr/bin/env node

const http = require('http');

function measurePageLoad(path) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: 'GET',
      timeout: 10000
    };

    const req = http.request(options, (res) => {
      const endTime = Date.now();
      const loadTime = endTime - startTime;
      
      let status = '🟢';
      if (loadTime > 1000) status = '🟡';
      if (loadTime > 3000) status = '🔴';
      
      console.log(`${status} ${path}: ${loadTime}ms`);
      resolve({ path, loadTime, status: res.statusCode });
    });

    req.on('error', (err) => {
      const endTime = Date.now();
      const loadTime = endTime - startTime;
      console.log(`🔴 ${path}: ERROR after ${loadTime}ms - ${err.message}`);
      resolve({ path, loadTime, error: err.message });
    });

    req.on('timeout', () => {
      console.log(`⏱ ${path}: TIMEOUT after 10s`);
      req.destroy();
      resolve({ path, loadTime: 10000, timeout: true });
    });

    req.end();
  });
}

async function monitorPerformance() {
  const pages = [
    // Core DNA Profile features
    '/about-you',
    '/analytics', 
    '/search',
    '/playbooks',
    '/time-capsule',
    '/dna-profile',
    
    // Dashboard & Main Features
    '/dashboard',
    '/favorites',
    '/features',
    
    // AI Features
    '/ai-copilot',
    '/ai-copilot-2', 
    '/ai-copilot-3',
    
    // Oracle Features
    '/oracle-demo',
    '/oracle-realtime',
    
    // Marketplace
    '/marketplace',
    '/marketplace-2',
    
    // Productivity Features
    '/kanban',
    '/simple-board',
    
    // Settings & Configuration
    '/settings',
    
    // Landing & Auth
    '/landing-page',
    '/auth',
    '/pricing',
    '/docs'
  ];
  
  console.log('🚀 Performance Monitor - Testing page load times...\n');
  console.log('🟢 Fast (<1s)  🟡 Medium (1-3s)  🔴 Slow (>3s)\n');
  
  const results = await Promise.all(pages.map(measurePageLoad));
  
  console.log('\n📊 Performance Summary:');
  const fast = results.filter(r => r.loadTime < 1000).length;
  const medium = results.filter(r => r.loadTime >= 1000 && r.loadTime < 3000).length;
  const slow = results.filter(r => r.loadTime >= 3000).length;
  
  console.log(`🟢 Fast: ${fast}  🟡 Medium: ${medium}  🔴 Slow: ${slow}`);
  
  const avgTime = results.reduce((sum, r) => sum + r.loadTime, 0) / results.length;
  console.log(`⚡ Average load time: ${Math.round(avgTime)}ms`);
}

if (require.main === module) {
  monitorPerformance().catch(console.error);
}

module.exports = { measurePageLoad, monitorPerformance }; 