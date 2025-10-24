#!/usr/bin/env node

/**
 * Execute favicon column migration using direct PostgreSQL connection
 */

const { Client } = require('pg');

async function executeMigration() {
  console.log('🔧 Executing favicon column migration...');
  
  // Extract connection details from Supabase URL
  const supabaseUrl = 'https://kljhlubpxxcawacrzaix.supabase.co';
  const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtsamhsdWJweHhjYXdhY3J6YWl4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODY5OTg3NCwiZXhwIjoyMDY0Mjc1ODc0fQ.GXO_NsRI2VtJt0dmkER9DszNpoRyELASZuyKd47-ZQs';
  
  // Construct PostgreSQL connection string for Supabase
  const connectionString = `postgresql://postgres.kljhlubpxxcawacrzaix:${process.env.SUPABASE_DB_PASSWORD || '[DB_PASSWORD]'}@aws-0-us-west-1.pooler.supabase.com:6543/postgres`;
  
  console.log('📡 Attempting direct PostgreSQL connection...');
  console.log('⚠️ Note: This requires the database password to be set in environment variables');
  
  try {
    const client = new Client({
      connectionString,
      ssl: { rejectUnauthorized: false }
    });
    
    await client.connect();
    console.log('✅ Connected to PostgreSQL database');
    
    // Execute the migration
    const migrationSQL = `
      ALTER TABLE public.bookmarks 
      ADD COLUMN IF NOT EXISTS favicon TEXT;
      
      COMMENT ON COLUMN public.bookmarks.favicon IS 'Automatically extracted favicon URL from the website, used as fallback when no custom logo is provided';
    `;
    
    console.log('🔧 Executing migration SQL...');
    await client.query(migrationSQL);
    console.log('✅ Migration executed successfully!');
    
    // Verify the column was added
    const verifyResult = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'bookmarks' 
      AND column_name = 'favicon';
    `);
    
    if (verifyResult.rows.length > 0) {
      console.log('✅ Favicon column verified:', verifyResult.rows[0]);
    } else {
      console.log('⚠️ Favicon column not found after migration');
    }
    
    await client.end();
    console.log('🏁 Migration completed successfully!');
    
  } catch (error) {
    if (error.message.includes('password')) {
      console.log('⚠️ Database password not available. Using manual approach instead...');
      console.log('\n' + '='.repeat(80));
      console.log('📋 MANUAL MIGRATION INSTRUCTIONS');
      console.log('='.repeat(80));
      console.log('1. Open Supabase Dashboard: https://supabase.com/dashboard/project/kljhlubpxxcawacrzaix/editor');
      console.log('2. Go to SQL Editor');
      console.log('3. Copy and paste the following SQL:');
      console.log('');
      console.log('ALTER TABLE public.bookmarks ADD COLUMN IF NOT EXISTS favicon TEXT;');
      console.log('COMMENT ON COLUMN public.bookmarks.favicon IS \'Automatically extracted favicon URL from the website, used as fallback when no custom logo is provided\';');
      console.log('');
      console.log('4. Click "Run" to execute the migration');
      console.log('5. Verify success by running the test script again');
      console.log('='.repeat(80));
    } else {
      console.error('❌ Migration failed:', error.message);
    }
  }
}

// Check if pg module is available
try {
  require('pg');
  executeMigration().catch(console.error);
} catch (error) {
  console.log('⚠️ pg module not available. Installing...');
  console.log('Run: npm install pg');
  console.log('Then run this script again.');
}
