import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser } from '@/lib/auth-utils';
import { createClient } from '@supabase/supabase-js';
import { writeFile, readFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';

const DEV_USER_ID = '00000000-0000-0000-0000-000000000001';

// Disable Supabase - using file-based storage now
const USE_SUPABASE = false;
const DATA_BASE_DIR = process.env.DATA_DIR || (process.env.VERCEL ? '/tmp/data' : join(process.cwd(), 'data'));
const POMODORO_FILE = join(DATA_BASE_DIR, 'pomodoro.json');

// Supabase client for server-side operations (kept for future use)
const getSupabase = () => {
  if (!USE_SUPABASE) return null;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(supabaseUrl, supabaseServiceKey);
};

interface Task {
  id: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  tags: string[];
  isCompleted: boolean;
  estimatedPomodoros: number;
  completedPomodoros: number;
  duration?: number; // Duration in minutes for how long the task will take
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  dueDate?: Date;
  notes?: string;
  userId: string;
}

interface PomodoroSession {
  id: string;
  taskId?: string;
  taskTitle?: string;
  startTime: Date;
  endTime?: Date;
  duration: number;
  type: 'work' | 'shortBreak' | 'longBreak';
  isCompleted: boolean;
  wasInterrupted: boolean;
  interruptionReason?: string;
  notes?: string;
  userId: string;
}

interface PomodoroSettings {
  workDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  longBreakInterval: number;
  autoStartBreaks: boolean;
  autoStartWork: boolean;
  soundEnabled: boolean;
  notificationsEnabled: boolean;
  tickingSound: boolean;
  alarmSound: string;
  alarmVolume: number;
  userId: string;
}

interface TaskList {
  id: string;
  name: string;
  description?: string;
  color: string;
  taskIds: string[];
  createdAt: Date;
  updatedAt: Date;
  isArchived: boolean;
  isActiveList: boolean;
  estimatedDuration: number;
  completedTasks: number;
}

interface PomodoroData {
  tasks: Task[];
  sessions: PomodoroSession[];
  settings: PomodoroSettings;
  taskLists: TaskList[];
}

// Ensure data directory exists
async function ensureDataDirectory() {
  if (!existsSync(DATA_BASE_DIR)) {
    await mkdir(DATA_BASE_DIR, { recursive: true });
  }
}

// Load pomodoro data from file
async function loadPomodoroDataFromFile(userId: string): Promise<PomodoroData> {
  try {
    await ensureDataDirectory();
    if (!existsSync(POMODORO_FILE)) {
      return getDefaultPomodoroData(userId);
    }
    const data = await readFile(POMODORO_FILE, 'utf-8');
    const parsed = JSON.parse(data);
    // Filter by userId
    return {
      tasks: parsed.tasks?.filter((t: any) => t.userId === userId) || [],
      sessions: parsed.sessions?.filter((s: any) => s.userId === userId) || [],
      settings: parsed.settings?.[userId] || getDefaultSettings(userId),
      taskLists: parsed.taskLists?.filter((tl: any) => tl.userId === userId) || []
    };
  } catch (e) {
    console.warn('Failed to load pomodoro file:', (e as Error).message);
    return getDefaultPomodoroData(userId);
  }
}

// Save pomodoro data to file
async function savePomodoroDataToFile(data: any) {
  try {
    await ensureDataDirectory();
    let existing: any = { tasks: [], sessions: [], settings: {}, taskLists: [] };
    if (existsSync(POMODORO_FILE)) {
      const fileData = await readFile(POMODORO_FILE, 'utf-8');
      existing = JSON.parse(fileData);
    }
    // Merge with existing data
    await writeFile(POMODORO_FILE, JSON.stringify({ ...existing, ...data }, null, 2));
  } catch (e) {
    console.warn('Failed to save pomodoro file:', (e as Error).message);
  }
}

// Get default pomodoro data
function getDefaultPomodoroData(userId: string): PomodoroData {
  return {
    tasks: [],
    sessions: [],
    settings: getDefaultSettings(userId),
    taskLists: []
  };
}

// Get default settings
function getDefaultSettings(userId: string): PomodoroSettings {
  return {
    workDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    longBreakInterval: 4,
    autoStartBreaks: false,
    autoStartWork: false,
    soundEnabled: true,
    notificationsEnabled: true,
    tickingSound: false,
    alarmSound: 'bell',
    alarmVolume: 0.5,
    userId
  };
}

// Note: Tables should be created manually in Supabase dashboard or via migrations
// This function is removed to avoid permission issues with RPC calls

// Load pomodoro data from Supabase or file
async function loadPomodoroData(userId: string, bookmarkId?: string): Promise<PomodoroData> {
  // Use file-based storage when Supabase is disabled
  if (!USE_SUPABASE) {
    console.log('Loading pomodoro data from file for user:', userId);
    return loadPomodoroDataFromFile(userId);
  }

  const supabase = getSupabase();
  if (!supabase) {
    console.log('Supabase not configured, using file fallback');
    return loadPomodoroDataFromFile(userId);
  }
  
  console.log('Loading pomodoro data for user:', userId);
  
  try {
    // Load tasks from proper pomodoro_tasks table
    let tasksQuery = supabase
      .from('pomodoro_tasks')
      .select('*')
      .eq('user_id', userId);
    if (bookmarkId) tasksQuery = tasksQuery.eq('bookmark_id', bookmarkId);
    const { data: tasks, error: tasksError } = await tasksQuery
      .order('created_at', { ascending: false });

    if (tasksError) {
      console.error('Error loading tasks:', tasksError);
      console.error('Tasks error code:', tasksError.code);
    }

    // Load sessions
    let sessionsQuery = supabase
      .from('pomodoro_sessions')
      .select('*')
      .eq('user_id', userId);
    if (bookmarkId) sessionsQuery = sessionsQuery.eq('bookmark_id', bookmarkId);
    const { data: sessions, error: sessionsError } = await sessionsQuery
      .order('start_time', { ascending: false });

    if (sessionsError && sessionsError.code !== 'PGRST116') {
      console.error('Error loading sessions:', sessionsError);
    }

    // Load settings
    const { data: settings, error: settingsError } = await supabase
      .from('pomodoro_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (settingsError && settingsError.code !== 'PGRST116') {
      console.error('Error loading settings:', settingsError);
    }

    // Load task lists
    const { data: taskLists, error: taskListsError } = await supabase
      .from('pomodoro_task_lists')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (taskListsError && taskListsError.code !== 'PGRST116') {
      console.error('Error loading task lists:', taskListsError);
    }

    return {
      tasks: tasks?.map(task => ({
        id: task.id,
        title: task.title,
        description: task.description,
        priority: task.priority,
        category: task.category,
        tags: task.tags || [],
        isCompleted: task.is_completed,
        estimatedPomodoros: task.estimated_pomodoros,
        completedPomodoros: task.completed_pomodoros,
        duration: task.duration,
        createdAt: new Date(task.created_at),
        updatedAt: new Date(task.updated_at),
        completedAt: task.completed_at ? new Date(task.completed_at) : undefined,
        dueDate: task.due_date ? new Date(task.due_date) : undefined,
        notes: task.notes,
        userId: task.user_id
      })) || [],
      sessions: sessions?.map(session => ({
        id: session.id,
        taskId: session.task_id,
        taskTitle: session.task_title,
        startTime: new Date(session.start_time),
        endTime: session.end_time ? new Date(session.end_time) : undefined,
        duration: session.duration,
        type: session.type,
        isCompleted: session.is_completed,
        wasInterrupted: session.was_interrupted,
        interruptionReason: session.interruption_reason,
        notes: session.notes,
        userId: session.user_id
      })) || [],
      settings: settings ? {
        workDuration: settings.work_duration,
        shortBreakDuration: settings.short_break_duration,
        longBreakDuration: settings.long_break_duration,
        longBreakInterval: settings.long_break_interval,
        autoStartBreaks: settings.auto_start_breaks,
        autoStartWork: settings.auto_start_work,
        soundEnabled: settings.sound_enabled,
        notificationsEnabled: settings.notifications_enabled,
        tickingSound: settings.ticking_sound,
        alarmSound: settings.alarm_sound,
        alarmVolume: settings.alarm_volume,
        userId: settings.user_id
      } : {
        workDuration: 25,
        shortBreakDuration: 5,
        longBreakDuration: 15,
        longBreakInterval: 4,
        autoStartBreaks: true,
        autoStartWork: false,
        soundEnabled: true,
        notificationsEnabled: true,
        tickingSound: false,
        alarmSound: 'bell',
        alarmVolume: 0.7,
        userId
      },
      taskLists: taskLists?.map(list => ({
        id: list.id,
        name: list.name,
        description: list.description,
        color: list.color,
        taskIds: list.task_ids || [],
        createdAt: new Date(list.created_at),
        updatedAt: new Date(list.updated_at),
        isArchived: list.is_archived,
        isActiveList: list.is_active_list,
        estimatedDuration: list.estimated_duration,
        completedTasks: list.completed_tasks
      })) || []
    };
  } catch (error) {
    console.error('Error loading pomodoro data from Supabase:', error);
    return {
      tasks: [],
      sessions: [],
      settings: {
        workDuration: 25,
        shortBreakDuration: 5,
        longBreakDuration: 15,
        longBreakInterval: 4,
        autoStartBreaks: true,
        autoStartWork: false,
        soundEnabled: true,
        notificationsEnabled: true,
        tickingSound: false,
        alarmSound: 'bell',
        alarmVolume: 0.7,
        userId
      },
      taskLists: []
    };
  }
}

// GET /api/pomodoro - Get all pomodoro data for user
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const bookmarkId = searchParams.get('bookmarkId') || undefined;
  try {
    const authResult = await authenticateUser(request);
    let userId: string;
    
    if (!authResult.success) {
      // Use dev user ID when Supabase is disabled
      if (!USE_SUPABASE) {
        console.log('Authentication failed, using DEV_USER_ID for file storage');
        userId = DEV_USER_ID;
      } else {
        return NextResponse.json(
          { error: authResult.error },
          { status: authResult.status || 401 }
        );
      }
    } else {
      userId = authResult.userId!;
    }
    
    const data = await loadPomodoroData(userId, bookmarkId);
    
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
  } catch (error) {
    console.error('Error in GET /api/pomodoro:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/pomodoro - Create or update pomodoro data
export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const bookmarkId = searchParams.get('bookmarkId') || null;
  
  console.log('🔍 Pomodoro POST - bookmarkId:', bookmarkId);
  
  try {
    const authResult = await authenticateUser(request);
    let userId: string;
    
    if (!authResult.success) {
      // Use dev user ID when Supabase is disabled
      if (!USE_SUPABASE) {
        console.log('Authentication failed, using DEV_USER_ID for file storage');
        userId = DEV_USER_ID;
      } else {
        return NextResponse.json(
          { error: authResult.error },
          { status: authResult.status || 401 }
        );
      }
    } else {
      userId = authResult.userId!;
    }

    const body = await request.json();
    const { type, action, data: itemData } = body;

    // When Supabase is disabled, use file-based storage
    if (!USE_SUPABASE) {
      console.log('Using file-based storage for pomodoro data');
      
      // Load current data
      const currentData = await loadPomodoroDataFromFile(userId);
      let allData: any = { tasks: [], sessions: [], settings: {}, taskLists: [] };
      if (existsSync(POMODORO_FILE)) {
        const fileData = await readFile(POMODORO_FILE, 'utf-8');
        allData = JSON.parse(fileData);
      }
      
      // Handle different actions
      switch (type) {
        case 'task':
          if (action === 'create') {
            const newTask = { ...itemData, userId, createdAt: new Date(), updatedAt: new Date() };
            allData.tasks = [...(allData.tasks || []), newTask];
          } else if (action === 'update') {
            allData.tasks = (allData.tasks || []).map((t: any) => 
              t.id === itemData.id && t.userId === userId ? { ...t, ...itemData, updatedAt: new Date() } : t
            );
          } else if (action === 'delete') {
            allData.tasks = (allData.tasks || []).filter((t: any) => !(t.id === itemData.id && t.userId === userId));
          }
          break;
        case 'session':
          if (action === 'create') {
            const newSession = { ...itemData, userId, startTime: new Date() };
            allData.sessions = [...(allData.sessions || []), newSession];
          } else if (action === 'update') {
            allData.sessions = (allData.sessions || []).map((s: any) => 
              s.id === itemData.id && s.userId === userId ? { ...s, ...itemData } : s
            );
          }
          break;
        case 'settings':
          if (action === 'update' || action === 'create') {
            allData.settings = allData.settings || {};
            allData.settings[userId] = { ...itemData, userId };
          }
          break;
        case 'taskList':
          if (action === 'create') {
            const newTaskList = { ...itemData, userId, createdAt: new Date(), updatedAt: new Date() };
            allData.taskLists = [...(allData.taskLists || []), newTaskList];
          } else if (action === 'update') {
            allData.taskLists = (allData.taskLists || []).map((tl: any) => 
              tl.id === itemData.id && tl.userId === userId ? { ...tl, ...itemData, updatedAt: new Date() } : tl
            );
          } else if (action === 'delete') {
            allData.taskLists = (allData.taskLists || []).filter((tl: any) => !(tl.id === itemData.id && tl.userId === userId));
          }
          break;
      }
      
      await savePomodoroDataToFile(allData);
      return NextResponse.json({ success: true, data: itemData });
    }

    const supabase = getSupabase();
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }

    console.log('POST /api/pomodoro - Request:', { type, action, userId, itemData });
    
    switch (type) {
      case 'task':
        if (action === 'create') {
          const { error } = await supabase
            .from('pomodoro_tasks')
            .insert({
              id: itemData.id,
              user_id: userId,
              title: itemData.title,
              description: itemData.description,
              priority: itemData.priority,
              category: itemData.category,
              tags: itemData.tags,
              is_completed: itemData.isCompleted,
              estimated_pomodoros: itemData.estimatedPomodoros,
              completed_pomodoros: itemData.completedPomodoros,
              duration: itemData.duration,
              due_date: itemData.dueDate,
              notes: itemData.notes,
              bookmark_id: bookmarkId
            });
          
          if (error) {
            console.error('Error creating task:', error);
            console.error('Full error details:', JSON.stringify(error, null, 2));
            
            // If table doesn't exist, provide a helpful error message
            if (error.code === '42P01') {
              return NextResponse.json({ 
                error: 'Pomodoro tables not found. Please contact support to set up the database tables.',
                code: 'TABLES_NOT_FOUND'
              }, { status: 500 });
            }
            
            return NextResponse.json({ 
              error: 'Failed to create task', 
              details: error.message,
              code: error.code 
            }, { status: 500 });
          }
          
          return NextResponse.json({ 
            success: true, 
            message: 'Task created successfully' 
          });
        } else if (action === 'update') {
          const { error } = await supabase
            .from('pomodoro_tasks')
            .update({
              title: itemData.title,
              description: itemData.description,
              priority: itemData.priority,
              category: itemData.category,
              tags: itemData.tags,
              is_completed: itemData.isCompleted,
              estimated_pomodoros: itemData.estimatedPomodoros,
              completed_pomodoros: itemData.completedPomodoros,
              duration: itemData.duration,
              completed_at: itemData.completedAt,
              due_date: itemData.dueDate,
              notes: itemData.notes,
              updated_at: new Date().toISOString()
            })
            .eq('id', itemData.id)
            .eq('user_id', userId);
          
          if (error) {
            console.error('Error updating task:', error);
            return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
          }
        } else if (action === 'delete') {
          const { error } = await supabase
            .from('pomodoro_tasks')
            .delete()
            .eq('id', itemData.id)
            .eq('user_id', userId);
          
          if (error) {
            console.error('Error deleting task:', error);
            return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
          }
        }
        break;

      case 'session':
        if (action === 'create') {
          const { error } = await supabase
            .from('pomodoro_sessions')
            .insert({
              id: itemData.id,
              user_id: userId,
              task_id: itemData.taskId,
              task_title: itemData.taskTitle,
              start_time: itemData.startTime,
              end_time: itemData.endTime,
              duration: itemData.duration,
              type: itemData.type,
              is_completed: itemData.isCompleted,
              was_interrupted: itemData.wasInterrupted,
              interruption_reason: itemData.interruptionReason,
              notes: itemData.notes,
              bookmark_id: bookmarkId
            });
          
          if (error) {
            console.error('Error creating session:', error);
            return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
          }
        }
        break;

      case 'settings':
        if (action === 'update') {
          const { error } = await supabase
            .from('pomodoro_settings')
            .upsert({
              user_id: userId,
              work_duration: itemData.workDuration,
              short_break_duration: itemData.shortBreakDuration,
              long_break_duration: itemData.longBreakDuration,
              long_break_interval: itemData.longBreakInterval,
              auto_start_breaks: itemData.autoStartBreaks,
              auto_start_work: itemData.autoStartWork,
              sound_enabled: itemData.soundEnabled,
              notifications_enabled: itemData.notificationsEnabled,
              ticking_sound: itemData.tickingSound,
              alarm_sound: itemData.alarmSound,
              alarm_volume: itemData.alarmVolume,
              updated_at: new Date().toISOString()
            });
          
          if (error) {
            console.error('Error updating settings:', error);
            return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
          }
        }
        break;

      case 'taskList':
        if (action === 'create') {
          const { error } = await supabase
            .from('pomodoro_task_lists')
            .insert({
              id: itemData.id,
              user_id: userId,
              name: itemData.name,
              description: itemData.description,
              color: itemData.color,
              task_ids: itemData.taskIds,
              is_archived: itemData.isArchived,
              is_active_list: itemData.isActiveList,
              estimated_duration: itemData.estimatedDuration,
              completed_tasks: itemData.completedTasks
            });
          
          if (error) {
            console.error('Error creating task list:', error);
            return NextResponse.json({ error: 'Failed to create task list' }, { status: 500 });
          }
        } else if (action === 'update') {
          const { error } = await supabase
            .from('pomodoro_task_lists')
            .update({
              name: itemData.name,
              description: itemData.description,
              color: itemData.color,
              task_ids: itemData.taskIds,
              is_archived: itemData.isArchived,
              is_active_list: itemData.isActiveList,
              estimated_duration: itemData.estimatedDuration,
              completed_tasks: itemData.completedTasks,
              updated_at: new Date().toISOString()
            })
            .eq('id', itemData.id)
            .eq('user_id', userId);
          
          if (error) {
            console.error('Error updating task list:', error);
            return NextResponse.json({ error: 'Failed to update task list' }, { status: 500 });
          }
        } else if (action === 'delete') {
          const { error } = await supabase
            .from('pomodoro_task_lists')
            .delete()
            .eq('id', itemData.id)
            .eq('user_id', userId);
          
          if (error) {
            console.error('Error deleting task list:', error);
            return NextResponse.json({ error: 'Failed to delete task list' }, { status: 500 });
          }
        }
        break;

      default:
        return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in POST /api/pomodoro:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}