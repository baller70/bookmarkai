#!/usr/bin/env node

/**
 * Test the regex fix for GitHub favicon extraction
 */

async function testRegexFix() {
  console.log('🧪 Testing regex fix for GitHub favicon extraction...\n');
  
  // Sample HTML from GitHub
  const testHtml = `
    <link rel="alternate icon" class="js-site-favicon" type="image/png" href="https://github.githubassets.com/favicons/favicon.png">
    <link rel="icon" class="js-site-favicon" type="image/svg+xml" href="https://github.githubassets.com/favicons/favicon.svg" data-base-href="https://github.githubassets.com/favicons/favicon">
  `;
  
  console.log('📋 Test HTML:');
  console.log(testHtml);
  console.log('');
  
  // Test the new regex patterns
  const faviconPatterns = [
    // Standard icon (most common)
    /<link[^>]*rel=['"]\s*icon\s*['"'][^>]*href=['"']([^'"]*)['"']/i,
    // Alternate icon
    /<link[^>]*rel=['"]\s*alternate\s+icon\s*['"'][^>]*href=['"']([^'"]*)['"']/i,
    // Shortcut icon (legacy)
    /<link[^>]*rel=['"]\s*shortcut\s+icon\s*['"'][^>]*href=['"']([^'"]*)['"']/i,
  ];
  
  console.log('🔍 Testing new regex patterns:');
  
  for (let i = 0; i < faviconPatterns.length; i++) {
    const regex = faviconPatterns[i];
    const match = testHtml.match(regex);
    
    console.log(`\n${i + 1}. Pattern: ${regex}`);
    if (match) {
      console.log(`   ✅ Match found!`);
      console.log(`   📋 Full match: ${match[0]}`);
      console.log(`   🖼️  Extracted URL: ${match[1]}`);
      
      // Test if URL is accessible
      try {
        const response = await fetch(match[1], { method: 'HEAD' });
        console.log(`   🌐 URL test: ${response.status} ${response.statusText}`);
      } catch (error) {
        console.log(`   ❌ URL test failed: ${error.message}`);
      }
    } else {
      console.log(`   ❌ No match found`);
    }
  }
  
  console.log('\n🔧 Testing with actual GitHub HTML...');
  
  try {
    const response = await fetch('https://github.com');
    const html = await response.text();
    
    for (let i = 0; i < faviconPatterns.length; i++) {
      const regex = faviconPatterns[i];
      const match = html.match(regex);
      
      console.log(`\n${i + 1}. Testing pattern ${i + 1} on real HTML:`);
      if (match) {
        console.log(`   ✅ Match found!`);
        console.log(`   🖼️  Extracted URL: ${match[1]}`);
        
        // Test if URL is accessible
        try {
          const testResponse = await fetch(match[1], { method: 'HEAD' });
          console.log(`   🌐 URL test: ${testResponse.status} ${testResponse.statusText}`);
          
          if (testResponse.ok) {
            console.log(`   🎉 SUCCESS! This URL works!`);
            break;
          }
        } catch (error) {
          console.log(`   ❌ URL test failed: ${error.message}`);
        }
      } else {
        console.log(`   ❌ No match found`);
      }
    }
    
  } catch (error) {
    console.error('❌ Failed to fetch GitHub HTML:', error.message);
  }
}

// Run the test
testRegexFix().catch(console.error);
