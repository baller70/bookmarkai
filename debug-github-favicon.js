#!/usr/bin/env node

/**
 * Debug GitHub favicon extraction to see what's being extracted
 */

async function debugGitHubFavicon() {
  console.log('🔍 Debugging GitHub favicon extraction...\n');
  
  try {
    // Fetch GitHub HTML
    console.log('📡 Fetching GitHub HTML...');
    const response = await fetch('https://github.com');
    const html = await response.text();
    
    console.log('✅ HTML fetched successfully');
    console.log(`📊 HTML length: ${html.length} characters\n`);
    
    // Extract favicon-related lines
    console.log('🔍 Looking for favicon-related HTML...');
    const faviconLines = html.split('\n').filter(line => 
      line.toLowerCase().includes('favicon') || 
      line.toLowerCase().includes('icon')
    );
    
    console.log(`📋 Found ${faviconLines.length} favicon-related lines:\n`);
    faviconLines.forEach((line, index) => {
      console.log(`${index + 1}. ${line.trim()}`);
    });
    
    console.log('\n🧪 Testing regex patterns...');
    
    // Test the current regex patterns
    const faviconSelectors = [
      'link[rel="icon"]',
      'link[rel="shortcut icon"]',
      'link[rel="apple-touch-icon"]',
      'link[rel="apple-touch-icon-precomposed"]'
    ];
    
    for (const selector of faviconSelectors) {
      console.log(`\n🔍 Testing selector: ${selector}`);
      const regex = new RegExp(`<${selector}[^>]*href=['"']([^'"]*)['"']`, 'i');
      const match = html.match(regex);
      
      if (match) {
        console.log(`  ✅ Match found!`);
        console.log(`  📋 Full match: ${match[0]}`);
        console.log(`  🖼️  Extracted URL: ${match[1]}`);
        
        // Check if this URL is accessible
        try {
          const testResponse = await fetch(match[1], { method: 'HEAD' });
          console.log(`  🌐 URL test: ${testResponse.status} ${testResponse.statusText}`);
        } catch (error) {
          console.log(`  ❌ URL test failed: ${error.message}`);
        }
      } else {
        console.log(`  ❌ No match found`);
      }
    }
    
    console.log('\n🔧 Manual extraction of all link tags with rel="icon"...');
    const iconRegex = /<link[^>]*rel=['"'][^'"]*icon[^'"]*['"'][^>]*>/gi;
    const iconMatches = html.match(iconRegex);
    
    if (iconMatches) {
      console.log(`📋 Found ${iconMatches.length} icon link tags:`);
      iconMatches.forEach((match, index) => {
        console.log(`\n${index + 1}. ${match}`);
        
        // Extract href from this specific match
        const hrefMatch = match.match(/href=['"']([^'"]*)['"']/i);
        if (hrefMatch) {
          console.log(`   🖼️  href: ${hrefMatch[1]}`);
        }
      });
    } else {
      console.log('❌ No icon link tags found');
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

// Run the debug
debugGitHubFavicon().catch(console.error);
