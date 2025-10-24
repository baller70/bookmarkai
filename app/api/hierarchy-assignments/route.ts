import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { writeFile, readFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';

// File-based storage for hierarchy assignments (fallback)
const HIERARCHY_FILE = join(process.cwd(), 'data', 'hierarchy.json');

interface HierarchyAssignment {
  folderId: string;
  level: 'director' | 'teams' | 'collaborators';
  order: number;
  user_id: string;
  createdAt: string;
  updatedAt: string;
}

// Initialize Supabase client
// Disable Supabase - using Prisma/file storage now
let supabase: any = null;

// Ensure data directory exists (fallback)
async function ensureDataDirectory() {
  const dataDir = join(process.cwd(), 'data');
  if (!existsSync(dataDir)) {
    await mkdir(dataDir, { recursive: true });
  }
}

// Load hierarchy assignments from Supabase or file
async function loadHierarchyAssignments(user_id?: string): Promise<HierarchyAssignment[]> {
  // Ensure table exists first
  await ensureHierarchyAssignmentsTable();

  // Try Supabase first
  if (supabase && user_id) {
    try {
      const { data, error } = await supabase
        .from('hierarchy_assignments')
        .select('*')
        .eq('user_id', user_id);

      if (!error && data) {
        console.log('✅ Loaded hierarchy assignments from Supabase:', data.length);
        return data.map((item: any) => ({
          folderId: item.folder_id,
          level: item.level,
          order: item.order || 0,
          user_id: item.user_id,
          createdAt: item.created_at,
          updatedAt: item.updated_at
        }));
      } else {
        console.log('⚠️ Supabase query failed, falling back to file:', error?.message);
      }
    } catch (error) {
      console.log('⚠️ Supabase error, falling back to file:', error);
    }
  }

  // Fallback to file storage
  try {
    await ensureDataDirectory();
    if (existsSync(HIERARCHY_FILE)) {
      const data = await readFile(HIERARCHY_FILE, 'utf-8');
      const assignments = JSON.parse(data);
      console.log('✅ Loaded hierarchy assignments from file:', assignments.length);
      return assignments;
    }
  } catch (error) {
    console.log('⚠️ File read error:', error);
  }

  console.log('📁 No hierarchy assignments found, returning empty array');
  return [];
}

// Save hierarchy assignments to Supabase and file
async function saveHierarchyAssignments(assignments: HierarchyAssignment[]): Promise<void> {
  // Ensure table exists first
  await ensureHierarchyAssignmentsTable();

  // Try Supabase first
  if (supabase && assignments.length > 0) {
    try {
      // Clear existing assignments for this user
      const user_id = assignments[0].user_id;
      await supabase
        .from('hierarchy_assignments')
        .delete()
        .eq('user_id', user_id);

      // Insert new assignments
      const supabaseData = assignments.map(assignment => ({
        folder_id: assignment.folderId,
        level: assignment.level,
        order: assignment.order,
        user_id: assignment.user_id,
        created_at: assignment.createdAt,
        updated_at: assignment.updatedAt
      }));

      const { error } = await supabase
        .from('hierarchy_assignments')
        .insert(supabaseData);

      if (!error) {
        console.log('✅ Saved hierarchy assignments to Supabase:', assignments.length);
        return; // Success! No need for file backup
      } else {
        console.log('⚠️ Supabase save failed, falling back to file:', error.message);
        throw error;
      }
    } catch (error) {
      console.log('⚠️ Supabase error, falling back to file:', error);
      // Continue to file fallback
    }
  }

  // File fallback (only if Supabase failed or not available)
  try {
    await ensureDataDirectory();
    await writeFile(HIERARCHY_FILE, JSON.stringify(assignments, null, 2));
    console.log('✅ Saved hierarchy assignments to file:', assignments.length);
  } catch (error) {
    console.log('❌ File save error:', error);
    // In production (Vercel), file system is read-only, so this is expected
    if (process.env.NODE_ENV === 'production') {
      console.log('⚠️ File save failed in production (read-only filesystem) - this is expected');
      throw new Error('Unable to save hierarchy assignments: Supabase failed and production filesystem is read-only');
    }
    throw error;
  }
}

// Ensure hierarchy_assignments table exists
async function ensureHierarchyAssignmentsTable() {
  if (!supabase) return;

  try {
    // Check if table exists by trying to select from it
    const { error } = await supabase
      .from('hierarchy_assignments')
      .select('id')
      .limit(1);

    if (error && error.code === '42P01') {
      // Table doesn't exist - this is the root cause of the production persistence issue
      console.log('❌ CRITICAL: hierarchy_assignments table does not exist in Supabase database');
      console.log('🔧 This is why drag and drop persistence is failing in production');
      console.log('📋 Please create the table manually in Supabase dashboard:');
      console.log('🌐 Go to: https://supabase.com/dashboard/project/kljhlubpxxcawacrzaix/editor');
      console.log('📝 Run this SQL:');
      console.log(`
        CREATE TABLE hierarchy_assignments (
          id SERIAL PRIMARY KEY,
          folder_id TEXT NOT NULL,
          level TEXT NOT NULL CHECK (level IN ('director', 'teams', 'collaborators')),
          "order" INTEGER DEFAULT 0,
          user_id TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(folder_id, user_id)
        );

        CREATE INDEX idx_hierarchy_assignments_user_id ON hierarchy_assignments(user_id);
        CREATE INDEX idx_hierarchy_assignments_level ON hierarchy_assignments(level);
      `);

      // Return a specific error for missing table
      throw new Error('MISSING_TABLE: hierarchy_assignments table does not exist in Supabase database. Please create it manually.');
    } else if (!error) {
      console.log('✅ hierarchy_assignments table exists and is accessible');
    } else {
      console.log('⚠️ Error checking hierarchy_assignments table:', error.message);
      throw new Error(`DATABASE_ERROR: ${error.message}`);
    }
  } catch (error) {
    console.log('⚠️ Error in ensureHierarchyAssignmentsTable:', error);
    // Re-throw the error so the calling function can handle it
    throw error;
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || searchParams.get('user_id');

    console.log('🔍 Loading hierarchy assignments for user:', userId);

    const assignments = await loadHierarchyAssignments(userId || undefined);

    return NextResponse.json({
      success: true,
      assignments,
      count: assignments.length
    });
  } catch (error) {
    console.error('❌ Error loading hierarchy assignments:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to load hierarchy assignments',
        assignments: [],
        count: 0
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { assignments, user_id } = body;

    if (!assignments || !Array.isArray(assignments)) {
      return NextResponse.json(
        { success: false, error: 'Invalid assignments data' },
        { status: 400 }
      );
    }

    console.log('💾 Saving hierarchy assignments for user:', user_id, 'Count:', assignments.length);

    // Add timestamps and user_id to assignments
    const timestampedAssignments = assignments.map((assignment: any) => ({
      ...assignment,
      user_id: user_id || assignment.user_id,
      createdAt: assignment.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));

    await saveHierarchyAssignments(timestampedAssignments);

    return NextResponse.json({
      success: true,
      message: 'Hierarchy assignments saved successfully',
      count: timestampedAssignments.length
    });
  } catch (error: any) {
    console.error('❌ Error saving hierarchy assignments:', error);

    // Check if this is a missing table error
    if (error.message?.includes('MISSING_TABLE') || error.message?.includes('relation "public.hierarchy_assignments" does not exist')) {
      return NextResponse.json({
        success: false,
        error: 'Database table missing',
        message: 'The hierarchy_assignments table does not exist in the Supabase database.',
        instructions: 'Please create the table manually in Supabase dashboard.',
        dashboardUrl: 'https://supabase.com/dashboard/project/kljhlubpxxcawacrzaix/editor',
        sql: `CREATE TABLE hierarchy_assignments (
  id SERIAL PRIMARY KEY,
  folder_id TEXT NOT NULL,
  level TEXT NOT NULL CHECK (level IN ('director', 'teams', 'collaborators')),
  "order" INTEGER DEFAULT 0,
  user_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(folder_id, user_id)
);
CREATE INDEX idx_hierarchy_assignments_user_id ON hierarchy_assignments(user_id);
CREATE INDEX idx_hierarchy_assignments_level ON hierarchy_assignments(level);`
      }, { status: 500 });
    }

    return NextResponse.json(
      { success: false, error: 'Failed to save hierarchy assignments', details: error.message },
      { status: 500 }
    );
  }
}
