import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    console.log('🔍 Debugging Goal 2.0 tables...');

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({
        success: false,
        error: 'Missing Supabase environment variables'
      }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Test if goal_folders table exists
    console.log('📁 Testing goal_folders table...');
    const { data: foldersData, error: foldersError } = await supabase
      .from('goal_folders')
      .select('*')
      .limit(1);

    console.log('📁 goal_folders query result:', { data: foldersData, error: foldersError });

    // Test if goals table exists
    console.log('🎯 Testing goals table...');
    const { data: goalsData, error: goalsError } = await supabase
      .from('goals')
      .select('*')
      .limit(1);

    console.log('🎯 goals query result:', { data: goalsData, error: goalsError });

    // Test with dev UUID
    const devUserId = '00000000-0000-0000-0000-000000000001';
    console.log('🔍 Testing with dev UUID:', devUserId);
    
    const { data: devData, error: devError } = await supabase
      .from('goal_folders')
      .select('*')
      .eq('user_id', devUserId);

    console.log('🔍 Dev UUID query result:', { data: devData, error: devError });

    return NextResponse.json({
      success: true,
      message: 'Goal 2.0 tables debug complete',
      results: {
        goal_folders: {
          data: foldersData,
          error: foldersError
        },
        goals: {
          data: goalsData,
          error: goalsError
        },
        dev_uuid_test: {
          data: devData,
          error: devError
        }
      }
    });

  } catch (error) {
    console.error('❌ Debug error:', error);
    return NextResponse.json({
      success: false,
      error: 'Debug failed',
      details: error
    }, { status: 500 });
  }
}
