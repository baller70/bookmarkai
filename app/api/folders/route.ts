import { NextRequest, NextResponse } from 'next/server';
import { createLogger } from '@/lib/logger';
import {
  getSupabaseAdminClient,
  USE_SUPABASE,
  loadJsonFile,
  saveJsonFile,
  ensureDataDirectory
} from '@/lib/api-helpers/storage-helpers';
import {
  handleGenericError,
  handleValidationError
} from '@/lib/api-helpers/error-handlers';

const logger = createLogger('folders-api');

const FOLDERS_FILE = 'folders.json';

interface Folder {
  id: string;
  name: string;
  description: string;
  color: string;
  bookmark_count: number;
  created_at: string;
}

interface FoldersData {
  folders: Folder[];
  lastUpdated: string;
  version: string;
}

const DEFAULT_FOLDERS: Folder[] = [
  {
    id: 'development',
    name: 'Development',
    description: 'Development resources and tools',
    color: '#3b82f6',
    bookmark_count: 0,
    created_at: new Date().toISOString()
  },
  {
    id: 'design',
    name: 'Design',
    description: 'Design inspiration and resources',
    color: '#8b5cf6',
    bookmark_count: 0,
    created_at: new Date().toISOString()
  },
  {
    id: 'productivity',
    name: 'Productivity',
    description: 'Tools to boost productivity',
    color: '#10b981',
    bookmark_count: 0,
    created_at: new Date().toISOString()
  }
];

export async function GET(request: NextRequest) {
  try {
    logger.info('Fetching folders');

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id') || 'dev-user-123';

    // Try Supabase first
    if (USE_SUPABASE) {
      const supabase = getSupabaseAdminClient();
      if (supabase) {
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: true });

        if (!error && data && data.length > 0) {
          const folders = data.map((f) => ({
            id: f.id,
            name: f.name,
            description: f.description || '',
            color: f.color || '#3b82f6',
            bookmark_count: 0,
            created_at: f.created_at,
          }));
          
          logger.info(`Loaded ${folders.length} folders from Supabase`, { userId });
          return NextResponse.json({ success: true, folders });
        }

        if (error) {
          logger.warn('Supabase query failed, using fallback', { error: error.message });
        }
      }
    }

    // Try file storage
    const savedData = await loadJsonFile<FoldersData>(FOLDERS_FILE, {
      folders: DEFAULT_FOLDERS,
      lastUpdated: new Date().toISOString(),
      version: '1.0'
    });

    if (savedData.folders && savedData.folders.length > 0) {
      logger.info(`Loaded ${savedData.folders.length} folders from file`);
      return NextResponse.json({ success: true, folders: savedData.folders });
    }

    // Return defaults
    logger.info('Using default folders');
    return NextResponse.json({ success: true, folders: DEFAULT_FOLDERS });

  } catch (error) {
    return handleGenericError(error, 'GET /api/folders');
  }
}

export async function POST(request: NextRequest) {
  try {
    logger.info('Creating folder');

    const body = await request.json();
    const { name, description, color, user_id } = body;

    if (!name || !user_id) {
      return handleValidationError('Name and user_id are required');
    }

    const newFolderData = {
      name: name.trim(),
      description: description || '',
      color: color || '#3b82f6',
      user_id
    };

    // Try Supabase first
    if (USE_SUPABASE) {
      const supabase = getSupabaseAdminClient();
      if (supabase) {
        const { data: folder, error } = await supabase
          .from('categories')
          .insert(newFolderData)
          .select()
          .single();

        if (!error && folder) {
          logger.info('Folder created in Supabase', { folderId: folder.id, userId: user_id });
          return NextResponse.json({
            success: true,
            folder: {
              id: folder.id,
              name: folder.name,
              description: folder.description || '',
              color: folder.color || '#3b82f6',
              bookmark_count: 0,
              created_at: folder.created_at
            }
          });
        }

        if (error) {
          logger.warn('Supabase insert failed, using file fallback', { error: error.message });
        }
      }
    }

    // Fallback to file storage
    await ensureDataDirectory();

    const newFolder: Folder = {
      id: `folder-${Date.now()}`,
      ...newFolderData,
      bookmark_count: 0,
      created_at: new Date().toISOString()
    };

    const savedData = await loadJsonFile<FoldersData>(FOLDERS_FILE, {
      folders: [],
      lastUpdated: new Date().toISOString(),
      version: '1.0'
    });

    savedData.folders.push(newFolder);
    savedData.lastUpdated = new Date().toISOString();

    await saveJsonFile(FOLDERS_FILE, savedData);

    logger.info('Folder created in file storage', { folderId: newFolder.id });
    return NextResponse.json({ success: true, folder: newFolder });

  } catch (error) {
    return handleGenericError(error, 'POST /api/folders');
  }
}

export async function PUT(request: NextRequest) {
  try {
    logger.info('Updating folder');

    const body = await request.json();
    const { id, name, description, color } = body;

    if (!id || !name) {
      return handleValidationError('id and name are required');
    }

    const updateData = {
      name: name.trim(),
      description: description || '',
      color: color || '#3b82f6'
    };

    // Try Supabase first
    if (USE_SUPABASE) {
      const supabase = getSupabaseAdminClient();
      if (supabase) {
        const { data, error } = await supabase
          .from('categories')
          .update(updateData)
          .eq('id', id)
          .select('*')
          .single();

        if (!error && data) {
          logger.info('Folder updated in Supabase', { folderId: id });
          return NextResponse.json({
            success: true,
            folder: {
              id: data.id,
              name: data.name,
              description: data.description || '',
              color: data.color || '#3b82f6',
              bookmark_count: 0,
              created_at: data.created_at
            }
          });
        }

        if (error) {
          logger.warn('Supabase update failed, using file fallback', { error: error.message });
        }
      }
    }

    // Fallback to file storage
    const savedData = await loadJsonFile<FoldersData>(FOLDERS_FILE, {
      folders: [],
      lastUpdated: new Date().toISOString(),
      version: '1.0'
    });

    const idx = savedData.folders.findIndex((f) => f.id === id);
    if (idx === -1) {
      return NextResponse.json({ success: false, error: 'Folder not found' }, { status: 404 });
    }

    savedData.folders[idx] = { ...savedData.folders[idx], ...updateData };
    savedData.lastUpdated = new Date().toISOString();

    await saveJsonFile(FOLDERS_FILE, savedData);

    logger.info('Folder updated in file storage', { folderId: id });
    return NextResponse.json({ success: true, folder: savedData.folders[idx] });

  } catch (error) {
    return handleGenericError(error, 'PUT /api/folders');
  }
}

export async function DELETE(request: NextRequest) {
  try {
    logger.info('Deleting folder');

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return handleValidationError('id is required');
    }

    // Try Supabase first
    if (USE_SUPABASE) {
      const supabase = getSupabaseAdminClient();
      if (supabase) {
        const { error } = await supabase.from('categories').delete().eq('id', id);

        if (!error) {
          logger.info('Folder deleted from Supabase', { folderId: id });
          return NextResponse.json({ success: true });
        }

        logger.warn('Supabase delete failed, using file fallback', { error: error.message });
      }
    }

    // Fallback to file storage
    const savedData = await loadJsonFile<FoldersData>(FOLDERS_FILE, {
      folders: [],
      lastUpdated: new Date().toISOString(),
      version: '1.0'
    });

    savedData.folders = savedData.folders.filter((f) => f.id !== id);
    savedData.lastUpdated = new Date().toISOString();

    await saveJsonFile(FOLDERS_FILE, savedData);

    logger.info('Folder deleted from file storage', { folderId: id });
    return NextResponse.json({ success: true });

  } catch (error) {
    return handleGenericError(error, 'DELETE /api/folders');
  }
}
