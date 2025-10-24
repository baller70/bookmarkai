import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    return NextResponse.json({
      environment: 'production',
      supabaseUrl: supabaseUrl ? 'SET' : 'NOT SET',
      supabaseUrlLength: supabaseUrl?.length || 0,
      supabaseUrlStart: supabaseUrl?.substring(0, 20) + '...',
      serviceRoleKey: serviceRoleKey ? 'SET' : 'NOT SET', 
      serviceRoleKeyLength: serviceRoleKey?.length || 0,
      serviceRoleKeyStart: serviceRoleKey?.substring(0, 20) + '...',
      anonKey: anonKey ? 'SET' : 'NOT SET',
      anonKeyLength: anonKey?.length || 0,
      anonKeyStart: anonKey?.substring(0, 20) + '...',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to check environment', details: (error as Error).message },
      { status: 500 }
    );
  }
}
