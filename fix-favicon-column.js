#!/usr/bin/env node

/**
 * Fix missing favicon column in bookmarks table
 * This script adds the missing favicon column that the API expects
 */

const { createClient } = require('@supabase/supabase-js');

async function fixFaviconColumn() {
  console.log('🔧 Starting favicon column fix...');
  
  // Initialize Supabase client
  const supabaseUrl = 'https://kljhlubpxxcawacrzaix.supabase.co';
  const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtsamhsdWJweHhjYXdhY3J6YWl4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODY5OTg3NCwiZXhwIjoyMDY0Mjc1ODc0fQ.GXO_NsRI2VtJt0dmkER9DszNpoRyELASZuyKd47-ZQs';
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  try {
    // First, check current schema
    console.log('📊 Checking current bookmarks table schema...');
    const { data: existingBookmarks, error: checkError } = await supabase
      .from('bookmarks')
      .select('*')
      .limit(1);
    
    if (checkError) {
      console.error('❌ Error checking bookmarks table:', checkError);
      return;
    }
    
    console.log('✅ Current bookmarks table exists');
    if (existingBookmarks && existingBookmarks.length > 0) {
      console.log('📋 Sample bookmark columns:', Object.keys(existingBookmarks[0]));
      
      // Check if favicon column exists
      if ('favicon' in existingBookmarks[0]) {
        console.log('✅ favicon column already exists!');
        return;
      } else {
        console.log('⚠️ favicon column is missing');
      }
    }
    
    // Try to add the favicon column using raw SQL
    console.log('🔧 Adding favicon column...');
    
    // Use the SQL editor approach
    const sql = `
      ALTER TABLE public.bookmarks 
      ADD COLUMN IF NOT EXISTS favicon TEXT;
      
      COMMENT ON COLUMN public.bookmarks.favicon IS 'Automatically extracted favicon URL from the website, used as fallback when no custom logo is provided';
    `;
    
    // Try using a direct SQL query
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey
      },
      body: JSON.stringify({ sql })
    });
    
    if (response.ok) {
      console.log('✅ Successfully added favicon column!');
    } else {
      const errorText = await response.text();
      console.log('⚠️ Direct SQL failed:', errorText);
      
      // Manual instructions
      console.log('\n' + '='.repeat(80));
      console.log('⚠️  MANUAL MIGRATION REQUIRED');
      console.log('='.repeat(80));
      console.log('Please execute the following SQL in your Supabase SQL Editor:');
      console.log('');
      console.log('ALTER TABLE public.bookmarks ADD COLUMN IF NOT EXISTS favicon TEXT;');
      console.log('');
      console.log('COMMENT ON COLUMN public.bookmarks.favicon IS \'Automatically extracted favicon URL from the website, used as fallback when no custom logo is provided\';');
      console.log('');
      console.log('1. Go to https://supabase.com/dashboard');
      console.log('2. Navigate to SQL Editor');
      console.log('3. Copy and paste the SQL above');
      console.log('4. Click "Run" to execute the migration');
      console.log('='.repeat(80));
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the fix
fixFaviconColumn().catch(console.error);
