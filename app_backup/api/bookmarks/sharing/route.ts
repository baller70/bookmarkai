import { NextRequest, NextResponse } from 'next/server';
import { writeFile, readFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { authenticateUser, createUnauthorizedResponse } from '@/lib/auth-utils';

// File-based storage for persistent data
const BOOKMARKS_FILE = join(process.cwd(), 'data', 'bookmarks.json');
const SHARES_FILE = join(process.cwd(), 'data', 'bookmark_shares.json');
const COLLECTIONS_FILE = join(process.cwd(), 'data', 'bookmark_collections.json');

interface Bookmark {
  id: number;
  user_id: string;
  title: string;
  url: string;
  description: string;
  category: string;
  tags?: string[];
  ai_summary?: string;
  ai_tags?: string[];
  ai_category?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  site_health?: 'excellent' | 'working' | 'fair' | 'poor' | 'broken';
  last_health_check?: string;
  healthCheckCount?: number;
  customBackground?: string;
  visits?: number;
  time_spent?: number;
  relatedBookmarks?: number[];
}

interface BookmarkShare {
  id: string;
  bookmark_id: number;
  owner_id: string;
  shared_with: string[]; // User IDs
  share_type: 'read' | 'edit' | 'public';
  share_url?: string; // For public shares
  title?: string;
  description?: string;
  expires_at?: string;
  created_at: string;
  updated_at: string;
  access_count: number;
  last_accessed?: string;
}

interface BookmarkCollection {
  id: string;
  name: string;
  description: string;
  owner_id: string;
  bookmark_ids: number[];
  collaborators: {
    user_id: string;
    permission: 'read' | 'edit' | 'admin';
    added_at: string;
  }[];
  is_public: boolean;
  share_url?: string;
  tags: string[];
  created_at: string;
  updated_at: string;
  access_count: number;
  last_accessed?: string;
}

interface SharingResult {
  success: boolean;
  data?: any;
  message: string;
  processing_time_ms: number;
  error?: string;
}

// Ensure data directory exists
async function ensureDataDirectory() {
  const dataDir = join(process.cwd(), 'data');
  if (!existsSync(dataDir)) {
    await mkdir(dataDir, { recursive: true });
  }
}

// Load data from JSON files
async function loadBookmarks(): Promise<Bookmark[]> {
  try {
    await ensureDataDirectory();
    if (!existsSync(BOOKMARKS_FILE)) return [];
    const data = await readFile(BOOKMARKS_FILE, 'utf-8');
    return JSON.parse(data) as Bookmark[];
  } catch (error) {
    console.error('Error loading bookmarks:', error);
    return [];
  }
}

async function loadShares(): Promise<BookmarkShare[]> {
  try {
    await ensureDataDirectory();
    if (!existsSync(SHARES_FILE)) return [];
    const data = await readFile(SHARES_FILE, 'utf-8');
    return JSON.parse(data) as BookmarkShare[];
  } catch (error) {
    console.error('Error loading shares:', error);
    return [];
  }
}

async function loadCollections(): Promise<BookmarkCollection[]> {
  try {
    await ensureDataDirectory();
    if (!existsSync(COLLECTIONS_FILE)) return [];
    const data = await readFile(COLLECTIONS_FILE, 'utf-8');
    return JSON.parse(data) as BookmarkCollection[];
  } catch (error) {
    console.error('Error loading collections:', error);
    return [];
  }
}

// Save data to JSON files
async function saveShares(shares: BookmarkShare[]): Promise<void> {
  try {
    await ensureDataDirectory();
    await writeFile(SHARES_FILE, JSON.stringify(shares, null, 2));
  } catch (error) {
    console.error('Error saving shares:', error);
    throw error;
  }
}

async function saveCollections(collections: BookmarkCollection[]): Promise<void> {
  try {
    await ensureDataDirectory();
    await writeFile(COLLECTIONS_FILE, JSON.stringify(collections, null, 2));
  } catch (error) {
    console.error('Error saving collections:', error);
    throw error;
  }
}

// Generate share URL
function generateShareUrl(shareId: string, type: 'bookmark' | 'collection'): string {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  return `${baseUrl}/shared/${type}/${shareId}`;
}

// Check if user has access to bookmark
function hasBookmarkAccess(bookmark: Bookmark, userId: string, shares: BookmarkShare[]): boolean {
  if (bookmark.user_id === userId) return true;
  
  const share = shares.find(s => 
    s.bookmark_id === bookmark.id && 
    (s.shared_with.includes(userId) || s.share_type === 'public')
  );
  
  return !!share;
}

// Check if share is expired
function isShareExpired(share: BookmarkShare): boolean {
  if (!share.expires_at) return false;
  return new Date(share.expires_at) < new Date();
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    
    const authResult = await authenticateUser(request);
    if (!authResult.success) {
      return createUnauthorizedResponse(authResult.error);
    }
    const userId = authResult.userId!;
    
    const shareId = searchParams.get('share_id');
    const collectionId = searchParams.get('collection_id');
    
    if (action === 'my-shares') {
      console.log(`📤 Getting shares for user: ${userId}`);
      
      const shares = await loadShares();
      const bookmarks = await loadBookmarks();
      
      const userShares = shares.filter(share => share.owner_id === userId);
      
      const sharesWithBookmarks = userShares.map(share => {
        const bookmark = bookmarks.find(b => b.id === share.bookmark_id);
        return {
          ...share,
          bookmark: bookmark ? {
            id: bookmark.id,
            title: bookmark.title,
            url: bookmark.url,
            description: bookmark.description,
            category: bookmark.category
          } : null
        };
      });
      
      const result: SharingResult = {
        success: true,
        data: { shares: sharesWithBookmarks },
        message: `Found ${userShares.length} shares`,
        processing_time_ms: Date.now() - startTime
      };
      
      return NextResponse.json(result);
    }
    
    if (action === 'shared-with-me') {
      console.log(`📥 Getting bookmarks shared with user: ${userId}`);
      
      const shares = await loadShares();
      const bookmarks = await loadBookmarks();
      
      const sharedWithUser = shares.filter(share => 
        share.shared_with.includes(userId) && !isShareExpired(share)
      );
      
      const sharedBookmarks = sharedWithUser.map(share => {
        const bookmark = bookmarks.find(b => b.id === share.bookmark_id);
        return {
          share_info: {
            id: share.id,
            share_type: share.share_type,
            owner_id: share.owner_id,
            shared_at: share.created_at
          },
          bookmark: bookmark ? {
            id: bookmark.id,
            title: bookmark.title,
            url: bookmark.url,
            description: bookmark.description,
            category: bookmark.category,
            tags: bookmark.tags,
            ai_summary: bookmark.ai_summary
          } : null
        };
      }).filter(item => item.bookmark);
      
      const result: SharingResult = {
        success: true,
        data: { shared_bookmarks: sharedBookmarks },
        message: `Found ${sharedBookmarks.length} bookmarks shared with you`,
        processing_time_ms: Date.now() - startTime
      };
      
      return NextResponse.json(result);
    }
    
    if (action === 'public-share' && shareId) {
      console.log(`🌐 Getting public share: ${shareId}`);
      
      const shares = await loadShares();
      const bookmarks = await loadBookmarks();
      
      const share = shares.find(s => s.id === shareId && s.share_type === 'public');
      
      if (!share || isShareExpired(share)) {
        return NextResponse.json(
          { error: 'Share not found or expired' },
          { status: 404 }
        );
      }
      
      const bookmark = bookmarks.find(b => b.id === share.bookmark_id);
      
      if (!bookmark) {
        return NextResponse.json(
          { error: 'Bookmark not found' },
          { status: 404 }
        );
      }
      
      // Update access count
      share.access_count++;
      share.last_accessed = new Date().toISOString();
      await saveShares(shares);
      
      const result: SharingResult = {
        success: true,
        data: {
          share: {
            id: share.id,
            title: share.title || bookmark.title,
            description: share.description || bookmark.description,
            created_at: share.created_at,
            access_count: share.access_count
          },
          bookmark: {
            id: bookmark.id,
            title: bookmark.title,
            url: bookmark.url,
            description: bookmark.description,
            category: bookmark.category,
            tags: bookmark.tags,
            ai_summary: bookmark.ai_summary
          }
        },
        message: 'Public share retrieved successfully',
        processing_time_ms: Date.now() - startTime
      };
      
      return NextResponse.json(result);
    }
    
    if (action === 'collections') {
      console.log(`📚 Getting collections for user: ${userId}`);
      
      const collections = await loadCollections();
      const bookmarks = await loadBookmarks();
      
      const userCollections = collections.filter(collection => 
        collection.owner_id === userId || 
        collection.collaborators.some(c => c.user_id === userId) ||
        collection.is_public
      );
      
      const collectionsWithBookmarks = userCollections.map(collection => {
        const collectionBookmarks = bookmarks.filter(b => 
          collection.bookmark_ids.includes(b.id)
        );
        
        return {
          ...collection,
          bookmark_count: collectionBookmarks.length,
          bookmarks: collectionBookmarks.map(b => ({
            id: b.id,
            title: b.title,
            url: b.url,
            description: b.description,
            category: b.category
          }))
        };
      });
      
      const result: SharingResult = {
        success: true,
        data: { collections: collectionsWithBookmarks },
        message: `Found ${userCollections.length} collections`,
        processing_time_ms: Date.now() - startTime
      };
      
      return NextResponse.json(result);
    }
    
    if (action === 'collection' && collectionId) {
      console.log(`📖 Getting collection: ${collectionId}`);
      
      const collections = await loadCollections();
      const bookmarks = await loadBookmarks();
      
      const collection = collections.find(c => c.id === collectionId);
      
      if (!collection) {
        return NextResponse.json(
          { error: 'Collection not found' },
          { status: 404 }
        );
      }
      
      // Check access permissions
      const hasAccess = collection.owner_id === userId ||
        collection.collaborators.some(c => c.user_id === userId) ||
        collection.is_public;
      
      if (!hasAccess) {
        return NextResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        );
      }
      
      const collectionBookmarks = bookmarks.filter(b => 
        collection.bookmark_ids.includes(b.id)
      );
      
      // Update access count for public collections
      if (collection.is_public) {
        collection.access_count++;
        collection.last_accessed = new Date().toISOString();
        await saveCollections(collections);
      }
      
      const result: SharingResult = {
        success: true,
        data: {
          collection: {
            ...collection,
            bookmark_count: collectionBookmarks.length,
            bookmarks: collectionBookmarks.map(b => ({
              id: b.id,
              title: b.title,
              url: b.url,
              description: b.description,
              category: b.category,
              tags: b.tags,
              ai_summary: b.ai_summary
            }))
          }
        },
        message: 'Collection retrieved successfully',
        processing_time_ms: Date.now() - startTime
      };
      
      return NextResponse.json(result);
    }
    
    return NextResponse.json(
      { 
        error: 'Invalid action or missing parameters',
        available_actions: ['my-shares', 'shared-with-me', 'public-share', 'collections', 'collection']
      },
      { status: 400 }
    );
    
  } catch (error) {
    console.error('Sharing operation error:', error);
    
    const result: SharingResult = {
      success: false,
      message: 'Sharing operation failed',
      processing_time_ms: Date.now() - startTime,
      error: (error as Error).message
    };
    
    return NextResponse.json(result, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const authResult = await authenticateUser(request);
    if (!authResult.success) {
      return createUnauthorizedResponse(authResult.error);
    }
    
    const userId = authResult.userId!;
    const body = await request.json();
    const { action, bookmark_id, user_ids, share_type, expires_at, title, description, collection_name, collection_description, bookmark_ids, collaborators, is_public } = body;
    
    if (action === 'create-share') {
      console.log(`🔗 Creating share for bookmark ${bookmark_id} by user: ${userId}`);
      
      const bookmarks = await loadBookmarks();
      const shares = await loadShares();
      
      // Verify bookmark ownership
      const bookmark = bookmarks.find(b => b.id === bookmark_id && b.user_id === userId);
      if (!bookmark) {
        return NextResponse.json(
          { error: 'Bookmark not found or access denied' },
          { status: 404 }
        );
      }
      
      // Create new share
      const newShare: BookmarkShare = {
        id: randomUUID(),
        bookmark_id,
        owner_id: userId,
        shared_with: user_ids || [],
        share_type: share_type || 'read',
        title,
        description,
        expires_at,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        access_count: 0
      };
      
      // Generate share URL for public shares
      if (share_type === 'public') {
        newShare.share_url = generateShareUrl(newShare.id, 'bookmark');
      }
      
      shares.push(newShare);
      await saveShares(shares);
      
      const result: SharingResult = {
        success: true,
        data: { share: newShare },
        message: 'Share created successfully',
        processing_time_ms: Date.now() - startTime
      };
      
      return NextResponse.json(result);
    }
    
    if (action === 'create-collection') {
      console.log(`📚 Creating collection "${collection_name}" by user: ${userId}`);
      
      const collections = await loadCollections();
      const bookmarks = await loadBookmarks();
      
      // Verify bookmark ownership for all bookmarks in collection
      if (bookmark_ids && bookmark_ids.length > 0) {
        const userBookmarkIds = bookmarks
          .filter(b => b.user_id === userId)
          .map(b => b.id);
        
        const invalidBookmarks = bookmark_ids.filter((id: number) => !userBookmarkIds.includes(id));
        if (invalidBookmarks.length > 0) {
          return NextResponse.json(
            { error: `Access denied for bookmark IDs: ${invalidBookmarks.join(', ')}` },
            { status: 403 }
          );
        }
      }
      
      // Create new collection
      const newCollection: BookmarkCollection = {
        id: randomUUID(),
        name: collection_name,
        description: collection_description || '',
        owner_id: userId,
        bookmark_ids: bookmark_ids || [],
        collaborators: collaborators || [],
        is_public: is_public || false,
        tags: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        access_count: 0
      };
      
      // Generate share URL for public collections
      if (is_public) {
        newCollection.share_url = generateShareUrl(newCollection.id, 'collection');
      }
      
      collections.push(newCollection);
      await saveCollections(collections);
      
      const result: SharingResult = {
        success: true,
        data: { collection: newCollection },
        message: 'Collection created successfully',
        processing_time_ms: Date.now() - startTime
      };
      
      return NextResponse.json(result);
    }
    
    if (action === 'add-collaborator') {
      console.log(`👥 Adding collaborator to collection by user: ${userId}`);
      
      const { collection_id, collaborator_user_id, permission } = body;
      const collections = await loadCollections();
      
      const collection = collections.find(c => c.id === collection_id && c.owner_id === userId);
      if (!collection) {
        return NextResponse.json(
          { error: 'Collection not found or access denied' },
          { status: 404 }
        );
      }
      
      // Check if collaborator already exists
      const existingCollaborator = collection.collaborators.find(c => c.user_id === collaborator_user_id);
      if (existingCollaborator) {
        existingCollaborator.permission = permission;
      } else {
        collection.collaborators.push({
          user_id: collaborator_user_id,
          permission: permission || 'read',
          added_at: new Date().toISOString()
        });
      }
      
      collection.updated_at = new Date().toISOString();
      await saveCollections(collections);
      
      const result: SharingResult = {
        success: true,
        data: { collection },
        message: 'Collaborator added successfully',
        processing_time_ms: Date.now() - startTime
      };
      
      return NextResponse.json(result);
    }
    
    return NextResponse.json(
      { 
        error: 'Invalid action',
        available_actions: ['create-share', 'create-collection', 'add-collaborator']
      },
      { status: 400 }
    );
    
  } catch (error) {
    console.error('Sharing operation error:', error);
    
    const result: SharingResult = {
      success: false,
      message: 'Sharing operation failed',
      processing_time_ms: Date.now() - startTime,
      error: (error as Error).message
    };
    
    return NextResponse.json(result, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const { searchParams } = new URL(request.url);
    const shareId = searchParams.get('share_id');
    const collectionId = searchParams.get('collection_id');
    
    const authResult = await authenticateUser(request);
    if (!authResult.success) {
      return createUnauthorizedResponse(authResult.error);
    }
    const userId = authResult.userId!;
    
    if (shareId) {
      console.log(`🗑️ Deleting share ${shareId} by user: ${userId}`);
      
      const shares = await loadShares();
      const shareIndex = shares.findIndex(s => s.id === shareId && s.owner_id === userId);
      
      if (shareIndex === -1) {
        return NextResponse.json(
          { error: 'Share not found or access denied' },
          { status: 404 }
        );
      }
      
      shares.splice(shareIndex, 1);
      await saveShares(shares);
      
      const result: SharingResult = {
        success: true,
        message: 'Share deleted successfully',
        processing_time_ms: Date.now() - startTime
      };
      
      return NextResponse.json(result);
    }
    
    if (collectionId) {
      console.log(`🗑️ Deleting collection ${collectionId} by user: ${userId}`);
      
      const collections = await loadCollections();
      const collectionIndex = collections.findIndex(c => c.id === collectionId && c.owner_id === userId);
      
      if (collectionIndex === -1) {
        return NextResponse.json(
          { error: 'Collection not found or access denied' },
          { status: 404 }
        );
      }
      
      collections.splice(collectionIndex, 1);
      await saveCollections(collections);
      
      const result: SharingResult = {
        success: true,
        message: 'Collection deleted successfully',
        processing_time_ms: Date.now() - startTime
      };
      
      return NextResponse.json(result);
    }
    
    return NextResponse.json(
      { error: 'share_id or collection_id is required' },
      { status: 400 }
    );
    
  } catch (error) {
    console.error('Delete operation error:', error);
    
    const result: SharingResult = {
      success: false,
      message: 'Delete operation failed',
      processing_time_ms: Date.now() - startTime,
      error: (error as Error).message
    };
    
    return NextResponse.json(result, { status: 500 });
  }
}    