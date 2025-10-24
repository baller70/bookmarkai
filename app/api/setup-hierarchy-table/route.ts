import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    console.log('🔧 Setting up hierarchy_assignments table...');

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({
        success: false,
        error: 'Missing Supabase environment variables'
      }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Create the table using raw SQL
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS hierarchy_assignments (
        id SERIAL PRIMARY KEY,
        folder_id TEXT NOT NULL,
        level TEXT NOT NULL CHECK (level IN ('director', 'teams', 'collaborators')),
        "order" INTEGER DEFAULT 0,
        user_id TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(folder_id, user_id)
      );
      
      CREATE INDEX IF NOT EXISTS idx_hierarchy_assignments_user_id ON hierarchy_assignments(user_id);
      CREATE INDEX IF NOT EXISTS idx_hierarchy_assignments_level ON hierarchy_assignments(level);
    `;

    // Execute the SQL using the REST API approach
    const { data, error } = await supabase
      .from('_sql')
      .select('*')
      .eq('query', createTableSQL);

    if (error) {
      console.log('❌ Failed to create table via _sql:', error);
      
      // Try alternative approach using rpc if available
      try {
        const { data: rpcData, error: rpcError } = await supabase
          .rpc('exec_sql', { sql: createTableSQL });
        
        if (rpcError) {
          console.log('❌ RPC approach also failed:', rpcError);
          return NextResponse.json({
            success: false,
            error: 'Failed to create hierarchy_assignments table',
            details: { sqlError: error, rpcError }
          }, { status: 500 });
        }
        
        console.log('✅ Table created successfully via RPC');
        return NextResponse.json({
          success: true,
          message: 'hierarchy_assignments table created successfully via RPC',
          data: rpcData
        });
      } catch (rpcErr) {
        console.log('❌ RPC method not available:', rpcErr);
        return NextResponse.json({
          success: false,
          error: 'Unable to create table - manual creation required',
          sql: createTableSQL,
          instructions: 'Please create this table manually in Supabase dashboard'
        }, { status: 500 });
      }
    }

    console.log('✅ Table created successfully');
    return NextResponse.json({
      success: true,
      message: 'hierarchy_assignments table created successfully',
      data: data
    });

  } catch (error) {
    console.error('❌ Setup error:', error);
    return NextResponse.json({
      success: false,
      error: 'Setup failed',
      details: error
    }, { status: 500 });
  }
}
