#!/usr/bin/env node

/**
 * Apply favicon column migration to Supabase database
 * This script adds the missing favicon column to the bookmarks table
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// Load environment variables from the correct location
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

async function applyFaviconMigration() {
  console.log('🚀 Starting favicon column migration...');
  
  // Get Supabase configuration
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase configuration');
    console.error('SUPABASE_URL:', supabaseUrl ? 'SET' : 'MISSING');
    console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? 'SET' : 'MISSING');
    console.error('Please ensure environment variables are properly configured');
    process.exit(1);
  }
  
  console.log('🔧 Supabase URL:', supabaseUrl);
  console.log('🔑 Service key:', supabaseServiceKey ? 'SET' : 'MISSING');
  
  // Initialize Supabase client
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
  
  try {
    console.log('📝 Checking current table schema...');
    
    // First, check if the favicon column already exists
    const { data: testData, error: testError } = await supabase
      .from('bookmarks')
      .select('id, favicon')
      .limit(1);
    
    if (!testError) {
      console.log('✅ Favicon column already exists!');
      console.log('📊 Sample data:', testData);
      return true;
    }
    
    console.log('⚠️ Favicon column does not exist:', testError.message);
    console.log('🔧 Attempting to add favicon column...');
    
    // Try to use the migration API endpoint
    console.log('📡 Calling migration API endpoint...');
    
    const response = await fetch(`${supabaseUrl.replace('/rest/v1', '')}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey
      },
      body: JSON.stringify({
        sql: `
          ALTER TABLE public.bookmarks 
          ADD COLUMN IF NOT EXISTS favicon TEXT;
          
          COMMENT ON COLUMN public.bookmarks.favicon IS 'Automatically extracted favicon URL from the website, used as fallback when no custom logo is provided';
        `
      })
    });
    
    if (response.ok) {
      console.log('✅ Migration applied successfully via API!');
      return true;
    } else {
      const errorText = await response.text();
      console.log('⚠️ API migration failed:', errorText);
    }
    
    // Fallback: Try using Supabase RPC
    console.log('🔄 Trying RPC approach...');
    
    const { data: rpcData, error: rpcError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE public.bookmarks 
        ADD COLUMN IF NOT EXISTS favicon TEXT;
        
        COMMENT ON COLUMN public.bookmarks.favicon IS 'Automatically extracted favicon URL from the website, used as fallback when no custom logo is provided';
      `
    });
    
    if (!rpcError) {
      console.log('✅ Migration applied successfully via RPC!');
      return true;
    }
    
    console.log('⚠️ RPC migration failed:', rpcError.message);
    
    // Final fallback: Manual instructions
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
    
    return false;
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    return false;
  }
}

// Run the migration
if (require.main === module) {
  applyFaviconMigration().then(success => {
    if (success) {
      console.log('🎉 Migration completed successfully!');
      process.exit(0);
    } else {
      console.log('⚠️ Migration requires manual intervention');
      process.exit(1);
    }
  });
}

module.exports = { applyFaviconMigration };
