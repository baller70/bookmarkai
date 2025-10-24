#!/usr/bin/env node

/**
 * Verify that the favicon column has been added to the bookmarks table
 */

const { createClient } = require('@supabase/supabase-js');

async function verifyFaviconColumn() {
  console.log('🔍 Verifying favicon column in bookmarks table...\n');
  
  const supabaseUrl = 'https://kljhlubpxxcawacrzaix.supabase.co';
  const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtsamhsdWJweHhjYXdhY3J6YWl4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODY5OTg3NCwiZXhwIjoyMDY0Mjc1ODc0fQ.GXO_NsRI2VtJt0dmkER9DszNpoRyELASZuyKd47-ZQs';
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  try {
    // Test 1: Try to select favicon column
    console.log('📊 Test 1: Checking if favicon column exists...');
    const { data: faviconTest, error: faviconError } = await supabase
      .from('bookmarks')
      .select('favicon')
      .limit(1);
    
    if (faviconError) {
      if (faviconError.message.includes('favicon')) {
        console.log('❌ Favicon column does not exist');
        console.log('📋 Error:', faviconError.message);
        return false;
      } else {
        console.log('⚠️ Other error:', faviconError.message);
      }
    } else {
      console.log('✅ Favicon column exists and is accessible');
    }
    
    // Test 2: Get full schema of bookmarks table
    console.log('\n📋 Test 2: Current bookmarks table schema...');
    const { data: sampleBookmark, error: schemaError } = await supabase
      .from('bookmarks')
      .select('*')
      .limit(1);
    
    if (schemaError) {
      console.log('❌ Could not retrieve table schema:', schemaError.message);
      return false;
    }
    
    if (sampleBookmark && sampleBookmark.length > 0) {
      const columns = Object.keys(sampleBookmark[0]);
      console.log('📋 Available columns:');
      columns.forEach(col => {
        if (col === 'favicon') {
          console.log(`  ✅ ${col} (FAVICON COLUMN FOUND!)`);
        } else if (col.includes('favicon') || col.includes('logo')) {
          console.log(`  🎨 ${col}`);
        } else {
          console.log(`  📝 ${col}`);
        }
      });
      
      // Check if favicon column is present
      if (columns.includes('favicon')) {
        console.log('\n🎉 SUCCESS: favicon column is present in the table!');
        return true;
      } else {
        console.log('\n❌ FAILED: favicon column is still missing');
        return false;
      }
    } else {
      console.log('⚠️ No bookmarks found in table (empty table)');
      // Try to insert a test record to verify schema
      console.log('\n📝 Test 3: Testing favicon column with insert...');
      try {
        const { data: insertTest, error: insertError } = await supabase
          .from('bookmarks')
          .insert({
            user_id: 'test-user',
            title: 'Schema Test',
            url: 'https://example.com',
            description: 'Testing favicon column',
            favicon: 'https://example.com/favicon.ico'
          })
          .select()
          .single();
        
        if (insertError) {
          if (insertError.message.includes('favicon')) {
            console.log('❌ Insert failed - favicon column missing:', insertError.message);
            return false;
          } else {
            console.log('⚠️ Insert failed for other reason:', insertError.message);
          }
        } else {
          console.log('✅ Insert successful - favicon column working!');
          console.log('🖼️ Favicon value:', insertTest.favicon);
          
          // Clean up test record
          await supabase.from('bookmarks').delete().eq('id', insertTest.id);
          console.log('🧹 Test record cleaned up');
          return true;
        }
      } catch (error) {
        console.log('❌ Insert test failed:', error.message);
        return false;
      }
    }
    
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    return false;
  }
}

// Run verification
verifyFaviconColumn().then(success => {
  if (success) {
    console.log('\n🎉 VERIFICATION PASSED: Ready to test favicon extraction!');
    console.log('💡 You can now run: node test-favicon-extraction-complete.js');
  } else {
    console.log('\n❌ VERIFICATION FAILED: Please add the favicon column first');
    console.log('\n📋 Manual steps:');
    console.log('1. Open: https://supabase.com/dashboard/project/kljhlubpxxcawacrzaix/editor');
    console.log('2. Run this SQL:');
    console.log('   ALTER TABLE public.bookmarks ADD COLUMN IF NOT EXISTS favicon TEXT;');
    console.log('3. Run this script again to verify');
  }
}).catch(console.error);
