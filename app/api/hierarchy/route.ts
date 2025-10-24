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
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase: any = null;
if (supabaseUrl && supabaseServiceKey) {
  supabase = createClient(supabaseUrl, supabaseServiceKey);
}

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
      }
    } catch (error) {
      console.warn('⚠️ Supabase load failed, falling back to file storage:', error);
    }
  }

  // Fallback to file storage
  try {
    await ensureDataDirectory();
    if (!existsSync(HIERARCHY_FILE)) {
      return [];
    }
    const data = await readFile(HIERARCHY_FILE, 'utf8');
    const allAssignments = JSON.parse(data);
    return user_id ? allAssignments.filter((a: HierarchyAssignment) => a.user_id === user_id) : allAssignments;
  } catch (error) {
    console.error('Error loading hierarchy assignments from file:', error);
    return [];
  }
}

// Ensure hierarchy_assignments table exists
async function ensureHierarchyAssignmentsTable(): Promise<void> {
  if (!supabase) return;

  try {
    // Try to query the table to see if it exists
    const { error } = await supabase
      .from('hierarchy_assignments')
      .select('id')
      .limit(1);

    if (error && error.message.includes('does not exist')) {
      console.log('📝 Creating hierarchy_assignments table...');

      // Create the table using direct SQL execution
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS hierarchy_assignments (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id TEXT NOT NULL,
          folder_id VARCHAR(255) NOT NULL,
          level VARCHAR(50) NOT NULL CHECK (level IN ('director', 'teams', 'collaborators')),
          "order" INTEGER DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(user_id, folder_id)
        );

        CREATE INDEX IF NOT EXISTS hierarchy_assignments_user_id_idx ON hierarchy_assignments(user_id);
        CREATE INDEX IF NOT EXISTS hierarchy_assignments_level_idx ON hierarchy_assignments(user_id, level);
      `;

      // Use direct REST API call to execute SQL
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!
        },
        body: JSON.stringify({ sql: createTableSQL })
      });

      if (response.ok) {
        console.log('✅ hierarchy_assignments table created successfully');
      } else {
        const errorText = await response.text();
        console.warn('⚠️ Failed to create table via SQL:', errorText);
      }
    }
  } catch (error) {
    console.warn('⚠️ Error checking/creating hierarchy_assignments table:', error);
  }
}

// Save hierarchy assignments to Supabase or file
async function saveHierarchyAssignments(assignments: HierarchyAssignment[]): Promise<void> {
  // Ensure table exists first
  await ensureHierarchyAssignmentsTable();

  // Try Supabase first
  if (supabase && assignments.length > 0) {
    try {
      // Delete existing assignments for this user
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
        return;
      } else {
        console.warn('⚠️ Supabase save failed, falling back to file storage:', error);
      }
    } catch (error) {
      console.warn('⚠️ Supabase save failed, falling back to file storage:', error);
    }
  }

  // Fallback to file storage
  try {
    await ensureDataDirectory();

    // Load existing assignments
    let allAssignments: HierarchyAssignment[] = [];
    if (existsSync(HIERARCHY_FILE)) {
      const data = await readFile(HIERARCHY_FILE, 'utf8');
      allAssignments = JSON.parse(data);
    }

    if (assignments.length > 0) {
      const user_id = assignments[0].user_id;
      // Remove existing assignments for this user
      allAssignments = allAssignments.filter(a => a.user_id !== user_id);
      // Add new assignments
      allAssignments.push(...assignments);
    }

    await writeFile(HIERARCHY_FILE, JSON.stringify(allAssignments, null, 2));
    console.log('✅ Saved hierarchy assignments to file:', assignments.length);
  } catch (error) {
    console.error('Error saving hierarchy assignments to file:', error);
    throw error;
  }
}

// GET: Fetch hierarchy assignments for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get('user_id');

    if (!user_id) {
      return NextResponse.json({
        success: false,
        error: 'User ID is required'
      }, { status: 400 });
    }

    const assignments = await loadHierarchyAssignments(user_id);

    return NextResponse.json({
      success: true,
      assignments: assignments
    });
  } catch (error) {
    console.error('Error fetching hierarchy assignments:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch hierarchy assignments'
    }, { status: 500 });
  }
}

// POST: Create or update hierarchy assignments
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { assignments, user_id } = body;

    console.log('📝 POST /api/hierarchy - Received:', { user_id, assignmentsCount: assignments?.length });

    if (!user_id) {
      return NextResponse.json({
        success: false,
        error: 'User ID is required'
      }, { status: 400 });
    }

    if (!Array.isArray(assignments)) {
      return NextResponse.json({
        success: false,
        error: 'Assignments must be an array'
      }, { status: 400 });
    }

    // Add new assignments with timestamps
    const newAssignments = assignments.map((assignment: any) => ({
      ...assignment,
      user_id,
      createdAt: assignment.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));

    // Save assignments (Supabase handles user-specific updates)
    await saveHierarchyAssignments(newAssignments);

    console.log('✅ Hierarchy assignments saved successfully:', newAssignments.length);

    return NextResponse.json({
      success: true,
      message: 'Hierarchy assignments updated successfully',
      assignments: newAssignments
    });
  } catch (error) {
    console.error('❌ Error updating hierarchy assignments:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to update hierarchy assignments'
    }, { status: 500 });
  }
}

// DELETE: Remove hierarchy assignments
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get('user_id');
    const folderId = searchParams.get('folderId');

    if (!user_id) {
      return NextResponse.json({
        success: false,
        error: 'User ID is required'
      }, { status: 400 });
    }

    // Try Supabase first
    if (supabase) {
      try {
        let query = supabase
          .from('hierarchy_assignments')
          .delete()
          .eq('user_id', user_id);

        if (folderId) {
          query = query.eq('folder_id', folderId);
        }

        const { error } = await query;

        if (!error) {
          return NextResponse.json({
            success: true,
            message: 'Hierarchy assignments deleted successfully'
          });
        } else {
          console.warn('⚠️ Supabase delete failed, falling back to file storage:', error);
        }
      } catch (error) {
        console.warn('⚠️ Supabase delete failed, falling back to file storage:', error);
      }
    }

    // Fallback to file storage
    const assignments = await loadHierarchyAssignments();

    let filteredAssignments;
    if (folderId) {
      // Remove specific folder assignment
      filteredAssignments = assignments.filter(a =>
        !(a.user_id === user_id && a.folderId === folderId)
      );
    } else {
      // Remove all assignments for user
      filteredAssignments = assignments.filter(a => a.user_id !== user_id);
    }

    await saveHierarchyAssignments(filteredAssignments);

    return NextResponse.json({
      success: true,
      message: 'Hierarchy assignments deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting hierarchy assignments:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to delete hierarchy assignments'
    }, { status: 500 });
  }
}