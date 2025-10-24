/**
 * Test script to verify favicon extraction functionality
 */

const { FaviconExtractor } = require('./lib/favicon-extractor.ts');

async function testFaviconExtraction() {
  console.log('🧪 Testing Favicon Extraction Functionality\n');
  
  const testUrls = [
    'https://github.com',
    'https://google.com',
    'https://stackoverflow.com',
    'https://reddit.com',
    'https://example.com'
  ];
  
  for (const url of testUrls) {
    console.log(`\n🔍 Testing: ${url}`);
    console.log('─'.repeat(50));
    
    try {
      const result = await FaviconExtractor.extractFavicon(url);
      
      console.log(`✅ Success: ${result.success}`);
      console.log(`📍 Source: ${result.source}`);
      console.log(`🖼️  Favicon URL: ${result.faviconUrl}`);
      
      if (result.error) {
        console.log(`❌ Error: ${result.error}`);
      }
      
      // Test fallback generation
      if (!result.success) {
        const fallback = FaviconExtractor.generateFallbackFavicon(url);
        console.log(`🔄 Fallback: ${fallback}`);
      }
      
    } catch (error) {
      console.error(`❌ Exception: ${error.message}`);
    }
  }
  
  console.log('\n🏁 Favicon extraction test completed');
}

// Run the test
testFaviconExtraction().catch(console.error);
