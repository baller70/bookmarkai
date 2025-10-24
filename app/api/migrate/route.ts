import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function getSupabaseClient() {
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase configuration');
  }
  return createClient(supabaseUrl, supabaseServiceKey);
}

// Alternative approach: Use direct HTTP requests to Supabase REST API
async function executeSQL(sql: string) {
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supabaseServiceKey}`,
      'apikey': supabaseServiceKey
    },
    body: JSON.stringify({ sql })
  });

  return response.json();
}

// POST /api/migrate - Run database migration to add custom upload fields
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();

    console.log('🔧 Attempting to check and add custom columns to bookmarks table...');

    // Since direct SQL execution is not allowed, let's try a different approach
    // First, let's check if the columns exist by trying to select them
    const { data: testData, error: testError } = await supabase
      .from('bookmarks')
      .select('id, custom_favicon, custom_logo, custom_background')
      .limit(1);

    console.log('🔧 Column test result:', { data: testData, error: testError });

    if (testError) {
      // Columns don't exist, we need to add them
      console.log('🔧 Custom columns do not exist. Error:', testError.message);

      // Since we can't add columns through the API, let's return instructions
      return NextResponse.json({
        success: false,
        error: 'Database schema update required',
        message: 'The bookmarks table is missing the custom upload columns',
        details: testError.message,
        solution: 'Please run the following SQL in your Supabase SQL editor:\n\nALTER TABLE public.bookmarks \nADD COLUMN IF NOT EXISTS custom_favicon TEXT,\nADD COLUMN IF NOT EXISTS custom_logo TEXT,\nADD COLUMN IF NOT EXISTS custom_background TEXT;',
        sqlCommand: 'ALTER TABLE public.bookmarks ADD COLUMN IF NOT EXISTS custom_favicon TEXT, ADD COLUMN IF NOT EXISTS custom_logo TEXT, ADD COLUMN IF NOT EXISTS custom_background TEXT;'
      });
    } else {
      // Columns exist
      console.log('🔧 Custom columns already exist in bookmarks table');
      return NextResponse.json({
        success: true,
        message: 'Custom columns already exist in bookmarks table',
        method: 'column_check',
        data: testData
      });
    }

    // Fallback: Try using RPC to execute SQL
    const plpgsqlMigration = `
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookmarks' AND column_name = 'custom_favicon') THEN
          ALTER TABLE public.bookmarks ADD COLUMN custom_favicon TEXT;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookmarks' AND column_name = 'custom_logo') THEN
          ALTER TABLE public.bookmarks ADD COLUMN custom_logo TEXT;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookmarks' AND column_name = 'custom_background') THEN
          ALTER TABLE public.bookmarks ADD COLUMN custom_background TEXT;
        END IF;
      END $$;
    `;

    // Try to execute the migration using RPC
    const { data: rpcData, error: rpcError } = await supabase.rpc('exec', { sql: plpgsqlMigration });

    if (rpcError) {
      console.log('RPC exec failed, trying alternative approach:', rpcError.message);

      // Try using sql function if it exists
      const { data: sqlData, error: sqlError } = await supabase.rpc('sql', { query: plpgsqlMigration });

      if (sqlError) {
        console.log('SQL RPC failed, trying direct query:', sqlError.message);

        // Try using query function
        const { data: queryData, error: queryError } = await supabase.rpc('query', { sql: plpgsqlMigration });

        if (queryError) {
          console.log('Query RPC failed, trying raw SQL execution:', queryError.message);

          // Last resort: try to use the raw SQL execution
          try {
            const { data: rawData, error: rawError } = await supabase
              .from('_supabase_migrations')
              .insert({
                version: Date.now().toString(),
                name: 'add_custom_upload_fields',
                statements: [plpgsqlMigration]
              });

            if (rawError) {
              throw rawError;
            }

            return NextResponse.json({
              success: true,
              message: 'Migration executed successfully using migrations table',
              method: 'migrations_table'
            });
          } catch (migrationError) {
            console.log('Migration table approach failed:', (migrationError as Error).message);

            // Final fallback: create a stored procedure to do the migration
            const createProcedureSQL = `
              CREATE OR REPLACE FUNCTION add_custom_columns()
              RETURNS void AS $$
              BEGIN
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookmarks' AND column_name = 'custom_favicon') THEN
                  ALTER TABLE public.bookmarks ADD COLUMN custom_favicon TEXT;
                END IF;

                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookmarks' AND column_name = 'custom_logo') THEN
                  ALTER TABLE public.bookmarks ADD COLUMN custom_logo TEXT;
                END IF;

                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookmarks' AND column_name = 'custom_background') THEN
                  ALTER TABLE public.bookmarks ADD COLUMN custom_background TEXT;
                END IF;
              END;
              $$ LANGUAGE plpgsql;
            `;

            // Try to create and execute the procedure
            const { error: procError } = await supabase.rpc('exec', { sql: createProcedureSQL });

            if (!procError) {
              // Execute the procedure
              const { error: execError } = await supabase.rpc('add_custom_columns');

              if (!execError) {
                return NextResponse.json({
                  success: true,
                  message: 'Migration executed successfully using stored procedure',
                  method: 'stored_procedure'
                });
              }
            }

            return NextResponse.json({
              success: false,
              error: 'All migration methods failed',
              details: 'Unable to execute ALTER TABLE commands through API',
              lastError: (migrationError as Error).message,
              suggestion: 'The database schema needs to be updated manually or through a different method'
            });
          }
        } else {
          return NextResponse.json({
            success: true,
            message: 'Migration executed successfully using query RPC',
            method: 'query_rpc',
            data: queryData
          });
        }
      } else {
        return NextResponse.json({
          success: true,
          message: 'Migration executed successfully using sql RPC',
          method: 'sql_rpc',
          data: sqlData
        });
      }
    } else {
      return NextResponse.json({
        success: true,
        message: 'Migration executed successfully using exec RPC',
        method: 'exec_rpc',
        data: rpcData
      });
    }

  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: (error as Error).message,
      success: false
    }, { status: 500 });
  }
}

// Check if columns exist by trying to query them
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();

    // Try to select the custom columns to see if they exist
    const { data, error } = await supabase
      .from('bookmarks')
      .select('id, custom_favicon, custom_logo, custom_background')
      .limit(1);

    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message,
        columnsExist: false,
        message: 'Custom columns do not exist in bookmarks table'
      });
    }

    return NextResponse.json({
      success: true,
      columnsExist: true,
      message: 'Custom columns exist in bookmarks table',
      sampleData: data
    });

  } catch (error) {
    console.error('Check columns error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: (error as Error).message,
      success: false
    }, { status: 500 });
  }
}
