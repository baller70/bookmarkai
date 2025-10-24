import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    console.log('🔍 Testing Supabase connection...');
    console.log('Supabase URL:', supabaseUrl ? 'Present' : 'Missing');
    console.log('Service Key:', supabaseServiceKey ? 'Present' : 'Missing');

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({
        success: false,
        error: 'Missing Supabase environment variables',
        details: {
          url: supabaseUrl ? 'Present' : 'Missing',
          serviceKey: supabaseServiceKey ? 'Present' : 'Missing'
        }
      }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Test basic connection
    const { data, error } = await supabase
      .from('hierarchy_assignments')
      .select('count')
      .limit(1);

    if (error) {
      console.log('❌ Supabase connection error:', error);
      return NextResponse.json({
        success: false,
        error: 'Supabase connection failed',
        details: error
      }, { status: 500 });
    }

    console.log('✅ Supabase connection successful');
    return NextResponse.json({
      success: true,
      message: 'Supabase connection successful',
      data: data
    });

  } catch (error) {
    console.error('❌ Test error:', error);
    return NextResponse.json({
      success: false,
      error: 'Test failed',
      details: error
    }, { status: 500 });
  }
}
