import { NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'
import { createClient } from '@supabase/supabase-js'

export async function POST() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ 
        error: 'Missing Supabase configuration',
        details: {
          hasUrl: !!supabaseUrl,
          hasServiceKey: !!supabaseServiceKey
        }
      }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Create the main table directly with a simple SQL statement
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS user_notifications (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id TEXT,
          type TEXT NOT NULL DEFAULT 'reminder',
          title TEXT NOT NULL,
          message TEXT,
          is_read BOOLEAN DEFAULT false,
          data JSONB DEFAULT '{}',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `

    console.log('Creating user_notifications table...')
    
    // Try to create the table using a direct query
    const { data, error } = await supabase.rpc('exec', { 
      sql: createTableSQL 
    })

    if (error) {
      console.error('RPC exec failed, trying alternative approach:', error)
      
      // Alternative: try to test the connection by inserting directly
      const testPayload = {
        user_id: 'test-setup',
        type: 'reminder',
        title: 'Setup Test',
        message: 'Testing table creation',
        is_read: false,
        data: {}
      }
      
      const { data: insertData, error: insertError } = await supabase
        .from('user_notifications')
        .insert(testPayload)
        .select()

      if (insertError) {
        console.error('Insert test failed:', insertError)
        return NextResponse.json({ 
          error: 'Table does not exist and could not be created',
          details: {
            rpcError: error,
            insertError: insertError
          }
        }, { status: 500 })
      }

      // If insert worked, the table exists
      return NextResponse.json({ 
        success: true, 
        message: 'Table already exists - tested with insert',
        testData: insertData
      })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'user_notifications table created successfully',
      data 
    })

  } catch (error) {
    console.error('Setup error:', error)
    return NextResponse.json({ 
      error: 'Failed to setup notifications database',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ 
        error: 'Missing Supabase configuration' 
      }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Check if the tables exist
    const { data: tables, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['user_notifications', 'notification_logs', 'notification_settings'])

    if (error) {
      return NextResponse.json({ 
        error: 'Failed to check tables',
        details: error
      }, { status: 500 })
    }

    const existingTables = tables?.map(t => t.table_name) || []
    const requiredTables = ['user_notifications', 'notification_logs', 'notification_settings']
    const missingTables = requiredTables.filter(table => !existingTables.includes(table))

    return NextResponse.json({
      existingTables,
      missingTables,
      allTablesExist: missingTables.length === 0
    })

  } catch (error) {
    return NextResponse.json({ 
      error: 'Failed to check database status',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
