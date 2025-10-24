'use client'


// TODO: Migrate to PostgreSQL/Prisma - Supabase imports removed
import { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { toast } from '@/hooks/use-toast'
import {
  Plus,
  Edit2,
  Trash2,
  Search,
  Layers,
  FolderOpen,
  Hash,
  ArrowLeft,
  Settings,
  RefreshCw
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

import CategoryFolderCard, { type CategoryFolder } from './CategoryFolderCard'
import CategoryFolderDialog from './CategoryFolderDialog'

interface Category {
  id: string
  name: string
  description: string
  color: string
  bookmarkCount: number
  createdAt: string
  updatedAt: string
}

// Available color options for categories
const colorOptions = [
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#10B981', // Green
  '#F59E0B', // Orange
  '#EF4444', // Red
  '#6B7280', // Gray
  '#EC4899', // Pink
  '#14B8A6', // Teal
]

// Draggable Category Card (matches Goal 2.0 drag UX)
function CategoryCardDraggable({
  category,
  currentFolderId,
  folders,
  onMove,
  onEdit,
  onDelete,
}: {
  category: Category
  currentFolderId?: string
  folders: CategoryFolder[]
  onMove: (categoryId: string, folderId: string) => void
  onEdit: (c: Category) => void
  onDelete: (id: string) => void
}) {
  const [isDragging, setIsDragging] = useState(false)

  const handleDragStart = (e: React.DragEvent) => {
    setIsDragging(true)
    const dragData = { type: 'category', id: category.id }
    // Primary channel
    try { e.dataTransfer.setData('application/json', JSON.stringify(dragData)) } catch {}
    // Safari / cross-browser fallback
    try { e.dataTransfer.setData('text/plain', JSON.stringify(dragData)) } catch {}
    try {
      e.dataTransfer.effectAllowed = 'move'
      e.dataTransfer.dropEffect = 'move'
    } catch {}
  }
  const handleDragEnd = () => setIsDragging(false)

  return (
    <Card
      data-testid={`category-card-${category.id}`}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={`hover:shadow-lg transition-shadow ${isDragging ? 'opacity-70 ring-2 ring-blue-400' : ''}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: category.color }} />
            <div>
              <CardTitle className="text-lg">{category.name}</CardTitle>
              <CardDescription className="text-sm mt-1">{category.description}</CardDescription>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className="text-xs">{category.bookmarkCount} bookmarks</Badge>
            <Button variant="ghost" size="sm" onClick={() => onEdit(category)}>
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onDelete(category.id)} className="text-red-500 hover:text-red-700">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center">
          <select
            aria-label="Move to folder"
            defaultValue={currentFolderId || ''}
            onChange={(e)=>{ onMove(category.id, e.target.value) }}
            className="h-7 border rounded-md px-2 text-xs w-36 ml-auto"
          >
            <option value="">Unassigned</option>
            {folders.map(f => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>
        </div>
      </CardContent>
    </Card>
  )
}

// Droppable Section container (mirrors Goal 2.0 folder drop feedback)
function DroppableSection({
  title,
  count,
  onDropItem,
  children,
}: {
  title: string
  count: number
  onDropItem: (item: { type: string; id: string }) => void
  children: React.ReactNode
}) {
  const [isDragOver, setIsDragOver] = useState(false)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
    try {
      const data = e.dataTransfer.getData('application/json')
      const item = JSON.parse(data)
      if (item?.type === 'category') onDropItem(item)
    } catch {}
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">{title}</h3>
        <span className="text-xs text-muted-foreground">{count} {count === 1 ? 'category' : 'categories'}</span>
      </div>
      <div
        data-testid={`droppable-${title.replace(/\s+/g,'-').toLowerCase()}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`rounded-xl border p-3 transition-all ${isDragOver ? 'border-blue-500 bg-blue-50/60' : 'border-gray-200'}`}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {children}
        </div>
        {isDragOver && (
          <div className="mt-2 text-xs text-blue-600 font-medium">Drop category here</div>
        )}
      </div>
    </section>
  )
}


export default function CategoriesPageClient() {
  // TODO: Replace with real auth-derived userId. Using dev/test ID to ensure correct API counts.
  const router = useRouter();

  const userId = '48e1b5b9-3b0f-4ccb-8b34-831b1337fc3f';
  const [categories, setCategories] = useState<Category[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [newCategory, setNewCategory] = useState({
    name: '',
    description: '',
    color: '#3B82F6'
  })

  const [isFolderDialogOpen, setIsFolderDialogOpen] = useState(false)
  const [folders, setFolders] = useState<CategoryFolder[]>([])
    const [isFolderFormOpen, setIsFolderFormOpen] = useState(false)
  const [editingFolder, setEditingFolder] = useState<CategoryFolder | null>(null)




  // Category-folder mappings for this user
  const [mappings, setMappings] = useState<Array<{folder_id:string; category_id:string}>>([])

  const [selectedFolderId, setSelectedFolderId] = useState<string>('')
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([])

  const [categorySearch, setCategorySearch] = useState('')
  const filteredCategories = useMemo(() => (
    [...categories]
      .filter((category) =>
        category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        category.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a,b)=>String(a?.name||'').localeCompare(String(b?.name||''), undefined, { sensitivity: 'base' }))
  ), [categories, searchTerm])

  const filteredModalCategories = useMemo(() => {
    const term = categorySearch.trim().toLowerCase()
    const list = term ? categories.filter(c => c.name.toLowerCase().includes(term)) : categories
    return [...list].sort((a,b)=>a.name.localeCompare(b.name))
  }, [categories, categorySearch])

  // Counts per folder (independent of search)
  const countsByFolder = useMemo(() => {
    const seen = new Map<string, Set<string>>()
    for (const m of mappings) {
      const fid = String(m.folder_id)
      const cid = String(m.category_id)
      if (!seen.has(fid)) seen.set(fid, new Set())
      seen.get(fid)!.add(cid)
    }
    const out: Record<string, number> = {}
    for (const [fid, set] of seen) out[fid] = set.size
    return out
  }, [mappings])

  const unassignedCategories = useMemo(() => {
    const assignedIds = new Set(mappings.map(m => String(m.category_id)))
    return filteredCategories.filter(c => !assignedIds.has(String(c.id)))
      .sort((a,b)=>a.name.localeCompare(b.name))
  }, [filteredCategories, mappings])

  const loadCategoryFolderMappings = async () => {
    try {
      const res = await fetch(`/api/category-folders?user_id=${userId}&t=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' }
      })
      const data = await res.json()
      if (data?.success && Array.isArray(data.mappings)) {
        setMappings(data.mappings.map((m:any)=>({ folder_id: String(m.folder_id), category_id: String(m.category_id) })))
      } else {
        setMappings([])
      }
    } catch {
      setMappings([])
    }
  }

  // Poll the server briefly to avoid stale overwrite of optimistic state
  const confirmMappingPersisted = async (categoryId: string, folderId: string) => {
    const maxAttempts = 6; // ~1.2s total
    const delay = (ms: number) => new Promise(r => setTimeout(r, ms));
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const res = await fetch(`/api/category-folders?user_id=${userId}&t=${Date.now()}`, {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' }
        });
        const data = await res.json();
        if (data?.success && Array.isArray(data.mappings)) {
          const mapped = data.mappings.map((m:any)=>({ folder_id: String(m.folder_id), category_id: String(m.category_id) }));
          const found = mapped.some(m => String(m.category_id) === String(categoryId) && (!folderId ? true : String(m.folder_id) === String(folderId)));
          if (found || !folderId) { // for unassign, just need it removed from all
            setMappings(mapped);
            return true;
          }
        }
      } catch {}
      await delay(200);
    }
    return false;
  }

  // Prefill selections when switching folders in the modal
  useEffect(() => {
    if (!isFolderDialogOpen) return;
    if (!selectedFolderId) { setSelectedCategoryIds([]); return; }
    (async () => {
      try {
        const res = await fetch(`/api/category-folders?user_id=${userId}&folder_id=${selectedFolderId}&t=${Date.now()}`, {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' }
        })
        const data = await res.json()
        if (data?.success && Array.isArray(data.mappings)) {
          setSelectedCategoryIds(data.mappings.map((m:any) => String(m.category_id)))
        } else {
          setSelectedCategoryIds([])
        }
      } catch {
        setSelectedCategoryIds([])
      }
    })()
  }, [selectedFolderId, isFolderDialogOpen])

  const loadFolders = async () => {
    try {
      const res = await fetch(`/api/category-folders/folders?user_id=${userId}`)
      const data = await res.json()
      if (data?.success) setFolders((data.folders || []).map((f:any)=>({
  id: String(f.id),
  name: String(f.name),
  description: typeof f.description === 'string' ? f.description : '',
  color: typeof f.color === 'string' ? f.color : '#3B82F6',
  created_at: f.created_at,
  updated_at: f.updated_at
})))
    } catch {}
  }
  // Load categories from dedicated categories API
  const loadCategories = async () => {
    try {
      console.log('🔄 Loading categories from API...');
      const response = await fetch(`/api/categories?t=${Date.now()}&user_id=${userId}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      const data = await response.json();
      console.log('📁 Categories API response:', data);

      if (data.success && data.categories) {
        const sorted = [...data.categories].sort((a,b)=>String(a?.name||'').localeCompare(String(b?.name||''), undefined, { sensitivity: 'base' }))
        setCategories(sorted);
        console.log('✅ Loaded categories:', sorted.length, 'categories');
        console.log('📋 Category names:', sorted.map(c => c.name));
      } else {
        console.warn('⚠️ Categories API returned no data or failed:', data);
        setCategories([]);
      }
    } catch (error) {
      console.error('❌ Error loading categories:', error);
      // Fallback to empty array if API fails
      setCategories([]);
    }
  };

  // Initial load
  useEffect(() => {
    loadCategories();
    loadFolders();
    loadCategoryFolderMappings();
  }, [])


  // Real-time updates from other pages/tabs
  useEffect(() => {
    const onAdded = () => {
      console.log('📣 bookmarkAdded event received → refreshing categories');
      loadCategories();
    };
    window.addEventListener('bookmarkAdded', onAdded);

    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel('bookmarks');
      bc.onmessage = (e: any) => {
        if (e?.data?.type === 'added') {
          console.log('📡 BroadcastChannel: bookmark added → refreshing categories');
          loadCategories();
        }
      };
    } catch {}

    return () => {
      window.removeEventListener('bookmarkAdded', onAdded);
      try { bc?.close(); } catch {}
    };
  }, [])

  // Auto-refresh on page focus (when user switches back to this tab)
  useEffect(() => {
    const handleFocus = () => {
      console.log('📁 Categories page focused, refreshing...');
      loadCategories();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [])

  // Periodic refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('📁 Auto-refreshing categories...');
      loadCategories();
    }, 30000);

    return () => clearInterval(interval);
  }, [])

  // Live updates disabled on Categories to prevent client-side realtime errors in production.
  // If needed later, re-enable behind a feature flag or authenticated session.


  const handleCreateCategory = async () => {
    if (!newCategory.name.trim()) {
      toast({
        title: "Error",
        description: "Category name is required",
        variant: "destructive"
      })
      return
    }

    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newCategory.name,
          description: newCategory.description,
          color: newCategory.color,
          user_id: userId
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create category');
      }

      const result = await response.json();

      if (result.success) {
        // Optimistically show the new category immediately
        setCategories((prev) => {
          const exists = prev.some((c) => c.id === result.category.id)
          const next = exists ? prev : [...prev, result.category]
          return [...next].sort((a,b)=>String(a?.name||'').localeCompare(String(b?.name||''), undefined, { sensitivity: 'base' }))
        })
        // Fire a background refresh to sync counts/dedupe
        void loadCategories()
        setNewCategory({ name: '', description: '', color: '#3B82F6' })
        setIsCreateDialogOpen(false)

        toast({
          title: "Success",
          description: "Category created successfully"
        })
      } else {
        throw new Error(result.error || 'Failed to create category');
      }
    } catch (error) {
      console.error('Error creating category:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create category. Please try again.",
        variant: "destructive"
      })
    }
  }

  const handleEditCategory = async () => {
    if (!editingCategory || !editingCategory.name.trim()) {
      toast({
        title: "Error",
        description: "Category name is required",
        variant: "destructive"
      })
      return
    }

    try {
      const response = await fetch('/api/categories', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: editingCategory.id,
          name: editingCategory.name,
          description: editingCategory.description,
          color: editingCategory.color,
          user_id: userId
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update category');
      }

      const result = await response.json();

      if (result.success) {
        // Reload from server to ensure dedupe and accurate counts
        await loadCategories()
        setIsEditDialogOpen(false)
        setEditingCategory(null)

        toast({
          title: "Success",
          description: "Category updated successfully"
        })
      } else {
        throw new Error(result.error || 'Failed to update category');
      }
    } catch (error) {
      console.error('Error updating category:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update category. Please try again.",
        variant: "destructive"
      })
    }
  }

  const handleDeleteCategory = async (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId)
    if (category && category.bookmarkCount > 0) {
      toast({
        title: "Cannot delete category",
        description: `Category "${category.name}" contains ${category.bookmarkCount} bookmarks. Please move or delete the bookmarks first.`,
        variant: "destructive"
      })
      return
    }

    try {
      const response = await fetch(`/api/categories?id=${categoryId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete category');
      }

      const result = await response.json();

      if (result.success) {
        // Reload from server to ensure dedupe and accurate counts
        await loadCategories()
        toast({
          title: "Success",
          description: "Category deleted successfully"

        })
      } else {
        throw new Error(result.error || 'Failed to delete category');
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete category. Please try again.",
        variant: "destructive"
      })
    }
  }

  const openEditDialog = (category: Category) => {
    setEditingCategory({ ...category })
    setIsEditDialogOpen(true)
  }

  const [newFolderName, setNewFolderName] = useState('')

  const saveFolderAssignments = async () => {
    if (!selectedFolderId) {
      toast({ title: 'Select a folder', description: 'Choose a folder to assign categories to.', variant: 'destructive' })
      return
    }
    try {
      const assignments = selectedCategoryIds.map((cid, idx) => ({ folder_id: selectedFolderId, category_id: cid, user_id: userId, order: idx }))
      const res = await fetch('/api/category-folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignments, user_id: userId })
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to save')
      toast({ title: 'Saved', description: 'Folder assignments updated.' })
      setIsFolderDialogOpen(false)
      setSelectedCategoryIds([])
    } catch (e:any) {
      toast({ title: 'Error', description: e?.message || 'Failed to save assignments', variant: 'destructive' })
    }
  }

  const isDuplicateFolderName = (name: string) =>
    folders.some(f => f.name.trim().toLowerCase() === name.trim().toLowerCase())

  const createFolderValidated = async (name: string) => {
    const trimmed = name.trim()
    if (!trimmed || trimmed.length > 60) {
      toast({ title: 'Invalid name', description: 'Folder name is required and must be under 60 characters.', variant: 'destructive' })
      return false
    }
    if (isDuplicateFolderName(trimmed)) {
      toast({ title: 'Duplicate folder', description: 'A folder with this name already exists.', variant: 'destructive' })
      return false
    }
    try {
      const res = await fetch('/api/category-folders/folders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: trimmed, description: '', color: '#3b82f6', user_id: userId }) })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to create folder')
      await loadFolders();
      toast({ title: 'Folder created', description: `"${data.folder.name}"` })
      return true
    } catch (e:any) {
      toast({ title: 'Error', description: e?.message || 'Failed to create folder', variant: 'destructive' })
      return false
    }
  }

  const updateFolderName = async (folderId: string, name: string) => {
    const trimmed = name.trim()
    if (!trimmed || trimmed.length > 60) {
      toast({ title: 'Invalid name', description: 'Folder name is required and must be under 60 characters.', variant: 'destructive' })
      return
    }
    if (folders.some(f => f.id !== folderId && f.name.trim().toLowerCase() === trimmed.toLowerCase())) {
      toast({ title: 'Duplicate folder', description: 'A folder with this name already exists.', variant: 'destructive' })
      return
    }
    try {
      const res = await fetch('/api/category-folders/folders', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: folderId, name: trimmed }) })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to update folder')
      await loadFolders()
      try { window.dispatchEvent(new Event('bookmarkAdded')) } catch {}
      try { const bc = new BroadcastChannel('bookmarks'); bc.postMessage('bookmarkAdded'); setTimeout(() => bc.close(), 300) } catch {}
      toast({ title: 'Updated', description: 'Folder renamed.' })
    } catch (e:any) {
      toast({ title: 'Error', description: e?.message || 'Failed to update folder', variant: 'destructive' })
    }
  }
  const handleFolderSubmit = async (folder: CategoryFolder) => {
    try {
      if (editingFolder) {
        const res = await fetch('/api/category-folders/folders', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: folder.id,
            name: folder.name,
            description: folder.description || '',
            color: folder.color || '#3B82F6',
          }),
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok || data?.success === false) throw new Error(data?.error || 'Failed to update folder')
        toast({ title: 'Updated', description: 'Folder updated.' })
      } else {
        const res = await fetch('/api/category-folders/folders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: userId,
            name: folder.name,
            description: folder.description || '',
            color: folder.color || '#3B82F6',
          }),
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok || data?.success === false) throw new Error(data?.error || 'Failed to create folder')
        toast({ title: 'Folder created', description: `"${data.folder?.name || folder.name}"` })
      }
      await loadFolders()
      await loadCategoryFolderMappings()
    } catch (e: any) {
      toast({ title: 'Error', description: e?.message || 'Failed to save folder', variant: 'destructive' })
    } finally {
      setIsFolderFormOpen(false)
      setEditingFolder(null)
    }
  }


  const deleteFolderWithMappings = async (folderId: string) => {
    try {

      const res = await fetch(`/api/category-folders/folders?id=${encodeURIComponent(folderId)}` , { method: 'DELETE' })
      const data = await res.json().catch(()=>({}))
      if (!res.ok || data?.success === false) throw new Error(data?.error || 'Failed to delete folder')
      // Clear mappings for this folder
      await fetch(`/api/category-folders?user_id=${encodeURIComponent(userId)}&folder_id=${encodeURIComponent(folderId)}`, { method: 'DELETE' })
      await loadFolders()
      toast({ title: 'Deleted', description: 'Folder removed.' })
    } catch (e:any) {
      toast({ title: 'Error', description: e?.message || 'Failed to delete folder', variant: 'destructive' })
    }
  }

  // Move single category to a folder (or unassign when folderId is '')
  const moveCategoryToFolder = async (categoryId: string, folderId: string) => {
    try {
      // Remove existing mappings for this category
      const current = mappings.filter(m => String(m.category_id) === String(categoryId))
      for (const m of current) {
        await fetch(`/api/category-folders?user_id=${encodeURIComponent(userId)}&folder_id=${encodeURIComponent(m.folder_id)}&category_id=${encodeURIComponent(categoryId)}`, { method: 'DELETE' })
      }
      // If a folder is selected, create new mapping
      if (folderId) {
        const assignments = [{ folder_id: folderId, category_id: categoryId, user_id: userId, order: 0 }]
        const res = await fetch('/api/category-folders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ assignments, user_id: userId }) })
        const data = await res.json().catch(()=>({success:false}))
        if (!res.ok || !data?.success) throw new Error(data?.error || 'Failed to assign')
      }
      // Optimistic UI update so the card leaves Unassigned immediately
      setMappings(prev => {
        const without = prev.filter(m => String(m.category_id) !== String(categoryId))
        return folderId ? [...without, { user_id: userId, folder_id: folderId, category_id: categoryId, order: 0 }] : without
      })
      // Confirm on server before replacing optimistic state to avoid stale flip-back
      const ok = await confirmMappingPersisted(categoryId, folderId)
      if (!ok) {
        // If not yet visible on server, try a late refresh without clobbering optimistic state
        setTimeout(() => { void loadCategoryFolderMappings() }, 800)
      }
      toast({ title: 'Updated', description: folderId ? 'Category moved to folder.' : 'Category unassigned.' })
    } catch (e:any) {
      toast({ title: 'Error', description: e?.message || 'Failed to update folder assignment', variant: 'destructive' })
    }
  }

  const quickCreateFolder = async () => {
    const name = newFolderName.trim()
    if (!name) return
    const ok = await createFolderValidated(name)
    if (ok) {
      setNewFolderName('')
      await loadFolders()
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white/80 dark:bg-card backdrop-blur-sm border-b border-gray-200 dark:border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back to Dashboard</span>
                </Button>
              </Link>

              <Dialog open={isFolderDialogOpen} onOpenChange={(o)=>{setIsFolderDialogOpen(o); if(o) { loadFolders(); setSelectedCategoryIds([]); }}}>
                <DialogTrigger asChild>
                  <Button variant="default" className="flex items-center space-x-2">
                    <FolderOpen className="h-4 w-4" />
                    <span>Manage Folders</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[700px]">
                  <DialogHeader>
                    <DialogTitle>Folder Manager</DialogTitle>
                    <DialogDescription>
                      Create folders and assign categories to a selected folder. You can also quickly add a new folder here.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-end">
                      <div className="flex-1">
                        <Label className="mb-1 block">Select folder</Label>
                        <select
                          aria-label="Select folder"
                          className="w-full h-10 rounded-md border border-gray-300 bg-background px-3 text-sm"
                          value={selectedFolderId}
                          onChange={(e)=>setSelectedFolderId(e.target.value)}
                        >
                          <option value="">— Choose a folder —</option>
                          {folders.map(f => (
                            <option key={f.id} value={f.id}>{f.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex-1">
                        <Label className="mb-1 block">Quick add folder</Label>
                        <div className="flex gap-2">
                          <Input placeholder="Folder name" value={newFolderName} onChange={(e)=>setNewFolderName(e.target.value)} />
                          <Button onClick={quickCreateFolder}>Add</Button>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <Label className="mb-2 block">Assign categories to this folder</Label>
                      <div className="mb-2 flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
                        <Input
                          aria-label="Search categories"
                          placeholder="Search categories..."
                          value={categorySearch}
                          onChange={(e)=>setCategorySearch(e.target.value)}
                          className="w-full sm:w-72"
                        />
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">Selected: {selectedCategoryIds.length}</span>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedCategoryIds(prev => Array.from(new Set([...prev, ...filteredModalCategories.map(c=>c.id)])))}
                          >
                            Select all visible
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => setSelectedCategoryIds(prev => prev.filter(id => !filteredModalCategories.some(c=>c.id===id)))}
                          >
                            Clear
                          </Button>
                        </div>
                      </div>

                      <ScrollArea className="h-64 border rounded-md p-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {filteredModalCategories.map((cat) => {
                            const checked = selectedCategoryIds.includes(cat.id)
                            return (
                              <label key={cat.id} className="flex items-center gap-2 text-sm">
                                <input
                                  aria-label={`Toggle category ${cat.name}`}
                                  type="checkbox"
                                  className="h-4 w-4"
                                  checked={checked}
                                  onChange={(e)=>{
                                    setSelectedCategoryIds(prev => e.target.checked ? [...prev, cat.id] : prev.filter(id => id !== cat.id))
                                  }}
                                />
                                <span className="truncate">{cat.name}</span>
                              </label>
                            )
                          })}
                        </div>
                      </ScrollArea>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={saveFolderAssignments} disabled={!selectedFolderId || selectedCategoryIds.length===0}>Save Assignments</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <div className="h-6 w-px bg-gray-300" />
              <div className="flex items-center space-x-2">
                <Layers className="h-6 w-6" />
                <h1 className="text-xl font-bold">Categories</h1>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Manage Categories</h2>
              <p className="text-gray-600 dark:text-gray-400">Organize your bookmarks with custom categories</p>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                onClick={loadCategories}
                className="flex items-center space-x-2"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Refresh</span>
              </Button>

              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="flex items-center space-x-2">
                    <Plus className="h-4 w-4" />
                    <span>Add Category</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Create New Category</DialogTitle>
                    <DialogDescription>
                      Add a new category to organize your bookmarks.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        value={newCategory.name}
                        onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                        placeholder="Enter category name"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={newCategory.description}
                        onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                        placeholder="Enter category description"
                        rows={3}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Color</Label>
                      <div className="flex flex-wrap gap-2">
                        {colorOptions.map((color) => (
                          <button
                            key={color}
                            className={`w-8 h-8 rounded-full border-2 ${
                              newCategory.color === color ? 'border-gray-900 dark:border-white' : 'border-gray-300'
                            }`}
                            style={{ backgroundColor: color }}
                            onClick={() => setNewCategory({ ...newCategory, color })}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" onClick={handleCreateCategory}>
                      Create Category
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Button variant="outline" className="flex items-center space-x-2" onClick={() => { setEditingFolder(null); setIsFolderFormOpen(true); }}>
                <FolderOpen className="h-4 w-4" />
                <span>Add Folder</span>
              </Button>
            </div>
            </div>


            {/* Folders (top of page, Goal 2.0 compact grid) */}
            <div data-testid="category-folders-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {folders.map((folder) => (
                <CategoryFolderCard
                  key={folder.id}
                  folder={folder}
                  count={(countsByFolder[folder.id] ?? 0)}
                  onEdit={(f) => { setEditingFolder(f); setIsFolderFormOpen(true); }}
                  onDelete={(id) => { void deleteFolderWithMappings(id); }}
                  onDrop={(folderId, item) => { if ((item as any)?.id) { void moveCategoryToFolder((item as any).id, folderId) } }}
                  onClick={(f) => { router.push(`/bookmarkai-addons/categories/folders/${f.id}`) }}
                />
              ))}
            </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Folder sections */}
          <div className="space-y-8">

            {/* Unassigned Section (render below folders) */}
            <DroppableSection
              title="Unassigned"
              count={unassignedCategories.length}
              onDropItem={(item) => { void moveCategoryToFolder(item.id, '') }}
            >
              {unassignedCategories.map((category) => (
                <CategoryCardDraggable
                  key={category.id}
                  category={category}
                  currentFolderId={''}
                  folders={folders}
                  onMove={(cid, fid) => { void moveCategoryToFolder(cid, fid) }}
                  onEdit={openEditDialog}
                  onDelete={handleDeleteCategory}
                />
              ))}
              {unassignedCategories.length === 0 && (
                <div className="col-span-full text-sm text-muted-foreground">All categories are assigned.</div>
              )}
            </DroppableSection>
          </div>

          {/* Edit Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Edit Category</DialogTitle>
                <DialogDescription>
                  Update the category information.
                </DialogDescription>
              </DialogHeader>
              {editingCategory && (
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-name">Name</Label>
                    <Input
                      id="edit-name"
                      value={editingCategory.name}
                      onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                      placeholder="Enter category name"
                    />
                  </div>
                  <div className="grid gap-2">

                    <Label htmlFor="edit-description">Description</Label>
                    <Textarea
                      id="edit-description"
                      value={editingCategory.description}
                      onChange={(e) => setEditingCategory({ ...editingCategory, description: e.target.value })}
                      placeholder="Enter category description"
                      rows={3}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Color</Label>
                    <div className="flex flex-wrap gap-2">
                      {colorOptions.map((color) => (
                        <button
                          key={color}
                          className={`w-8 h-8 rounded-full border-2 ${
                            editingCategory.color === color ? 'border-gray-900 dark:border-white' : 'border-gray-300'
                          }`}
                          style={{ backgroundColor: color }}
                          onClick={() => setEditingCategory({ ...editingCategory, color })}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <DialogFooter>
                <Button type="submit" onClick={handleEditCategory}>
                  Update Category
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <CategoryFolderDialog
            open={isFolderFormOpen}
            onOpenChange={(o) => { setIsFolderFormOpen(o); if (!o) setEditingFolder(null) }}
            folder={editingFolder}
            onSubmit={(f) => { void handleFolderSubmit(f) }}
          />

        </div>
      </div>
    </div>

  )
}

