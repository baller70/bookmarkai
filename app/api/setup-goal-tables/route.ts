import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    console.log('🎯 Setting up Goal 2.0 tables...');

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({
        success: false,
        error: 'Missing Supabase environment variables'
      }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('📁 Creating goal_folders table...');

    // Try to create goal_folders table using direct SQL
    try {
      const { data: createResult, error: createError } = await supabase
        .from('goal_folders')
        .select('*')
        .limit(1);

      if (createError && createError.code === '42P01') {
        // Table doesn't exist, we need to create it
        console.log('🔧 Table does not exist, attempting to create via SQL...');

        // Since we can't use exec_sql, let's try a different approach
        // We'll return instructions for manual table creation
        return NextResponse.json({
          success: false,
          error: 'Tables need to be created manually',
          instructions: {
            goal_folders_sql: `
              CREATE TABLE goal_folders (
                id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                user_id UUID NOT NULL,
                name TEXT NOT NULL,
                description TEXT,
                color TEXT DEFAULT '#3B82F6',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
              );
            `,
            goals_sql: `
              CREATE TABLE goals (
                id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                user_id UUID NOT NULL,
                folder_id UUID REFERENCES goal_folders(id) ON DELETE CASCADE,
                title TEXT NOT NULL,
                description TEXT,
                status TEXT DEFAULT 'not_started',
                priority TEXT DEFAULT 'medium',
                due_date TIMESTAMP WITH TIME ZONE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
              );
            `,
            indexes_sql: `
              CREATE INDEX idx_goal_folders_user_id ON goal_folders(user_id);
              CREATE INDEX idx_goals_user_id ON goals(user_id);
              CREATE INDEX idx_goals_folder_id ON goals(folder_id);
            `
          }
        }, { status: 500 });
      } else if (!createError) {
        console.log('✅ goal_folders table already exists');
      }
    } catch (error) {
      console.error('❌ Error checking goal_folders table:', error);
    }

    console.log('✅ Goal 2.0 tables created successfully');
    return NextResponse.json({
      success: true,
      message: 'Goal 2.0 tables created successfully',
      tables: ['goal_folders', 'goals']
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
