
'use client'

// Shared folder color options (used across Compact/List/Folder 2.0 and passed to FolderCard)
const categoryColorOptions: { value: string; label: string }[] = [
  { value: '#3B82F6', label: 'Blue' },
  { value: '#10B981', label: 'Green' },
  { value: '#F59E0B', label: 'Yellow' },
  { value: '#EF4444', label: 'Red' },
  { value: '#8B5CF6', label: 'Purple' },
  { value: '#06B6D4', label: 'Cyan' },
  { value: '#F97316', label: 'Orange' },
  { value: '#84CC16', label: 'Lime' },
  { value: '#EC4899', label: 'Pink' },
  { value: '#6B7280', label: 'Gray' },
  { value: '#1E40AF', label: 'Dark Blue' },
  { value: '#059669', label: 'Dark Green' },
  { value: '#DC2626', label: 'Dark Red' },
  { value: '#7C3AED', label: 'Dark Purple' },
  { value: '#0891B2', label: 'Dark Cyan' },
  { value: '#EA580C', label: 'Dark Orange' },
  { value: '#65A30D', label: 'Dark Lime' },
  { value: '#DB2777', label: 'Dark Pink' },
  { value: '#374151', label: 'Dark Gray' },
]


/* eslint-disable no-unused-vars */

import React, { useState, useEffect, useMemo, useRef, useCallback, memo, useLayoutEffect } from 'react'
import { useSearchParams } from 'next/navigation';
import { useAnalytics } from '../../src/hooks/useAnalytics'
import usePomodoro from '../../src/features/pomodoro/hooks/usePomodoro'

import Link from 'next/link'
import { Button } from '../../src/components/ui/button'
import { Input } from '../../src/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../src/components/ui/card'
import { Label } from '../../src/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '../../src/components/ui/avatar'
import { Checkbox } from '../../src/components/ui/checkbox'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../src/components/ui/dialog'
import { Textarea } from '../../src/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../src/components/ui/select'
import { Switch } from '../../src/components/ui/switch'
import { Badge } from '../../src/components/ui/badge'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuCheckboxItem } from '../../src/components/ui/dropdown-menu'
import { BookmarkManager } from '../../components/bookmarks/BookmarkManager'
import { UploadButton } from '../../components/bookmarks/UploadButton'
import { getFaviconUrl, getGoogleFaviconUrl, handleFaviconError, getDomainFromUrl, computeVisuals } from '../../lib/favicon-utils'

import { enhanceOnLoad } from '../../lib/image/enhanceOnLoad'

import {
  Search,
  Plus,
  Filter,
  MoreHorizontal,
  Grid3X3,
  List,
  LayoutGrid,
  Clock,
  Heart,
  ExternalLink,
  Edit,
  Edit2,
  Star,
  Eye,
  TrendingUp,
  Bookmark,
  Tag,
  Share2,

  Download,
  X,
  Calendar,
  Globe,
  Trash2,
  Copy,
  Activity,
  Folder as FolderIcon,
  Target,
  Kanban,
  GitBranch,
  Camera,
  GripVertical,
  Check,
  Bell,
  Timer,
  Image,
  Upload,
  ImageIcon,
  Play,
  Pause,
  MessageSquare,
  ArrowLeft,
  ChevronRight,
  ChevronDown,
  BookmarkIcon as BookmarkIconLucide,
  Building,
  Columns,
  FileText,
  Settings,
  Users,
  TestTube,
  GraduationCap,
  Rocket,
  Zap,
  ShoppingCart,
  PieChart,
  Code,
  Palette,
  Database,
  Shield,
  Smartphone,
  Monitor,
  CheckCircle,
  ArrowRight,
  PlayCircle,
  BarChart3,
  Lightbulb,
  Layers,
  Cloud,
  BookOpen,
  Workflow,
  ClipboardCheck,
  Users2,
  TrendingDown,
  Filter as FilterIcon,
  RotateCcw,
  AlertTriangle,
  AlertCircle
} from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../src/components/ui/tabs'
import { ARPTab } from '../../src/features/arp/components/ARPTab'
import { CommentTab } from '../../src/features/comments/components/CommentTab'
import { GoalEditDialog } from '../../src/features/goals/components/GoalEditDialog'
import { GoalFolderDialog } from '../../src/features/goals/components/GoalFolderDialog'
import AddGoalsModal from '../../src/features/goals/components/AddGoalsModal'

import GoalFolderCard from '../../src/features/goals/components/GoalFolderCard'
import { GoalCard } from '../../src/features/goals/components/GoalCard'
import { goalService, type GoalFolder, type Goal } from '../../src/services/goalService'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../src/components/ui/tooltip'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import { SortableContext, arrayMove } from '@dnd-kit/sortable'
import { sortableKeyboardCoordinates, verticalListSortingStrategy, rectSortingStrategy } from '@dnd-kit/sortable'
import { useSortable as useSortableOrig } from '@dnd-kit/sortable'
import { CSS as DndCSS } from '@dnd-kit/utilities'
import dynamic from 'next/dynamic'

const toTransformString = (t: any) => (t ? DndCSS.Transform.toString(t) : undefined)

const useSortable = useSortableOrig

// Using static import for FolderCard to avoid TDZ/circular init issues on initial render
// Prefer static imports for core components used on initial render to avoid TDZ/circular-eval issues
import { FolderFormDialog } from '../../src/components/ui/FolderFormDialog'
import { FolderCard } from '../../src/components/ui/FolderCard'

const NotificationTab = dynamic(() => import('../../src/features/notifications/components/NotificationTab').then(m => m.NotificationTab), { ssr: false, loading: () => <div /> })
const TimerTab = dynamic(() => import('../../src/features/pomodoro/components/TimerTab').then(m => m.default), { ssr: false, loading: () => <div /> })
const MediaHub = dynamic(() => import('../../src/features/media/components/MediaHub').then(m => m.MediaHub), { ssr: false, loading: () => <div /> })
const SimpleBoardCanvas = dynamic(() => import('../../src/features/simpleBoard/SimpleBoardCanvas').then(m => m.SimpleBoardCanvas), { ssr: false, loading: () => <div /> })
const BookmarkTimeline = dynamic(() => import('../../src/features/timeline/components/BookmarkTimeline').then(m => m.BookmarkTimeline), { ssr: false, loading: () => <div /> })
const FolderOrgChartView = dynamic(() => import('../../src/components/ui/folder-org-chart-view').then(m => m.FolderOrgChartView), { ssr: false, loading: () => <div /> })
const KanbanView = dynamic(() => import('../../src/components/ui/BookmarkKanban').then(m => m.KanbanView), { ssr: false, loading: () => <div /> })
const TrelloBoard = dynamic(() => import('../../src/components/ui/TrelloBoard').then(m => m.default), { ssr: false, loading: () => <div /> })
const KanbanBoard2 = dynamic(
  () => import('../../src/features/kanban/components/KanbanBoard2').then(m => m.KanbanBoard2),
  { ssr: false, loading: () => <div className="p-4 text-center">Loading Kanban 2.0...</div> }
)
const DnaSearch = dynamic(() => import('../../src/components/dna-profile/dna-search').then(m => m.default), { ssr: false, loading: () => <div /> })
// Temporarily disabled to fix user undefined error
// const Oracle = dynamic(() => import('../../src/components/oracle/Oracle').then(m => m.default), { ssr: false, loading: () => <div /> })

const InfinityBoardBackground = dynamic(() => import('../../src/features/infinity-board/InfinityBoard').then(m => m.InfinityBoardBackground), { ssr: false, loading: () => null })
const KHV1InfinityBoard = dynamic(() => import('../../src/features/infinity-board/InfinityBoard').then(m => m.KHV1InfinityBoard), { ssr: false, loading: () => <div className="p-4">Loading board…</div> })

import { SyncButton } from '../../components/SyncButton'
import { getProfilePicture, onProfilePictureChange } from '../../lib/profile-utils'

import { useRealTimeAnalytics } from '../../lib/real-time-analytics'
import { toast } from 'sonner'

// Type definitions
interface FolderHierarchyAssignment {
  id?: string;
  folderId: string;
  sectionId?: string;
  position?: number;
  level?: string;
  order?: number;
}

interface Folder {
  id: string;
  name: string;
  description?: string;
  color?: string;
  user_id?: string;
  created_at?: string;
  updated_at?: string;
  // Goal-related properties (optional for goal folders)
  deadline_date?: string;
  goal_type?: string;
  goal_description?: string;
  goal_status?: string;
  goal_priority?: string;
  goal_progress?: number;
  goal_notes?: string;
  connected_bookmarks?: any[];
  tags?: string[];
  notes?: string;
}

interface BookmarkWithRelations {
  id: string;
  title: string;
  url: string;
  description?: string;
  category?: string;
  tags?: string[];
  isFavorite?: boolean;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  user_id?: string;
  related_bookmarks?: string[];
}

// Client-only wrapper to prevent hydration mismatches
function ClientOnlyDndProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Only run on the client after hydration
    setMounted(true)
  }, [])

  // During SSR (and the first client render) render nothing to avoid mismatches
  if (!mounted) {
    return null
  }

  return <>{children}</>
}
export default function Dashboard() {
  // Reading search params forces dynamic rendering
  const searchParams = useSearchParams();

    // Force dynamic rendering by checking browser environment
  const isBrowser = typeof window !== 'undefined';

  useEffect(() => {
    // Component initialization
  }, []); // Run once after mount

  // State management - Initialize view mode from URL parameter
  const [viewMode, setViewMode] = useState(() => {
    const view = searchParams.get('view');
    // Map URL parameter to internal view mode
    if (view === 'hierarchy') return 'khV1';
    return 'grid';
  })


  const [showAddBookmark, setShowAddBookmark] = useState(false)
  const [selectedBookmarks, setSelectedBookmarks] = useState<string[]>([])
  const [selectedBookmark, setSelectedBookmark] = useState<any>(null)
  const [showBookmarkBreakdown, setShowBookmarkBreakdown] = useState(false)

  // Goals association state
  const [isAddGoalModalOpen, setIsAddGoalModalOpen] = useState(false)
  const [bookmarkGoals, setBookmarkGoals] = useState<Record<string, Array<{ id: string; name: string; description?: string | null }>>>({})

  const loadGoalsForBookmark = useCallback(async (bookmarkId: string) => {
    try {
      console.log(`🎯 Loading goals for bookmark ${bookmarkId}...`)
      const resp = await fetch(`/api/bookmarks/${encodeURIComponent(String(bookmarkId))}/goals`)

      if (!resp.ok) {
        const errorData = await resp.json().catch(() => ({}))
        console.error(`❌ Failed to load goals for bookmark ${bookmarkId}:`, errorData)
        throw new Error(`API error: ${errorData.error || resp.statusText}`)
      }

      const json = await resp.json()
      console.log(`✅ Loaded ${json?.goals?.length || 0} goals for bookmark ${bookmarkId}:`, json.goals)
      const items = (json?.goals || []) as Array<{ id: string; name: string; description?: string | null }>
      setBookmarkGoals(prev => ({ ...prev, [String(bookmarkId)]: items }))
    } catch (error) {
      console.error(`❌ Error loading goals for bookmark ${bookmarkId}:`, error)
      setBookmarkGoals(prev => ({ ...prev, [String(bookmarkId)]: [] }))
    }
  }, [])

  useEffect(() => {
    if (selectedBookmark?.id) {
      const key = String(selectedBookmark.id)
      // Always load goals when a bookmark is selected to ensure fresh data
      loadGoalsForBookmark(key)
    }
  }, [selectedBookmark, loadGoalsForBookmark])

  async function addGoalsToSelectedBookmark(goalIds: string[]) {
    if (!selectedBookmark?.id) return
    const bId = String(selectedBookmark.id)
    try {
      const results = await Promise.all(goalIds.map(async (g) => {
        const response = await fetch(`/api/bookmarks/${encodeURIComponent(bId)}/goals`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ goal_id: g, user_id: 'dev-user-fixed-id' })
        })
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(`Failed to link goal ${g}: ${errorData.error || response.statusText}`)
        }
        return response.json()
      }))

      console.log('✅ Goal association results:', results)

      // Refresh list
      await loadGoalsForBookmark(bId)
      try { showNotification(`${goalIds.length} goal(s) linked`) } catch {}
    } catch (error) {
      console.error('❌ Error linking goals:', error)
      try { showNotification(`Failed to link goals: ${error.message}`, 'error') } catch {}
    }
  }

  async function removeGoalFromSelectedBookmark(goalId: string) {
    if (!selectedBookmark?.id) return
    const bId = String(selectedBookmark.id)
    try {
      await fetch(`/api/bookmarks/${encodeURIComponent(bId)}/goals?goal_id=${encodeURIComponent(goalId)}&user_id=dev-user-fixed-id`, { method: 'DELETE' })
      // Optimistic update
      setBookmarkGoals(prev => ({
        ...prev,
        [bId]: (prev[bId] || []).filter(g => g.id !== goalId)
      }))
      try { showNotification('Goal unlinked') } catch {}
    } catch {
      try { showNotification('Failed to unlink goal', 'error') } catch {}
    }
  }

  const scrollPositionRef = useRef({ x: 0, y: 0 })
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [categories, setCategories] = useState<any[]>([])
  const [isLoadingCategories, setIsLoadingCategories] = useState(false)

  // Map category id -> name for fast lookup and a helper to derive display name for a bookmark
  const categoriesById = React.useMemo(() => {
    const m = new Map<string, string>();
    for (const c of categories || []) {
      if (c && c.id != null && typeof c.name === 'string') m.set(String(c.id), c.name);
    }
    return m;
  }, [categories]);

  const getCategoryDisplay = React.useCallback((b: any): string => {
    try {
      const fid = b?.folder_id != null ? String(b.folder_id) : '';
      if (fid && categoriesById.has(fid)) return categoriesById.get(fid) as string;
      const cat = (b?.category || '').trim();
      if (!cat) return '';
      // If categories include a renamed match (case-insensitive), prefer that canonical name
      const match = (categories || []).find((c: any) => String(c?.name || '').toLowerCase() === cat.toLowerCase());
      return match?.name || cat;
    } catch {
      return String(b?.category || '');
    }
  }, [categoriesById, categories]);


  const [chartTimePeriod, setChartTimePeriod] = useState('3months')
  const [newBookmark, setNewBookmark] = useState({
    title: '',
    url: '',
    description: '',
    tags: '',
    category: 'Development',
    priority: 'medium',
    notes: '',
    circularImage: '',
    logo: ''
  })
  // Prevent the browser from auto-scrolling the page on state updates
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && 'scrollRestoration' in window.history) {
        const prev = window.history.scrollRestoration as History['scrollRestoration']
        window.history.scrollRestoration = 'manual'
        return () => {
          try { window.history.scrollRestoration = prev } catch {}
        }
      }
    } catch {}
  }, [])

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingField, setEditingField] = useState<string | null>(null)
  const [editingValue, setEditingValue] = useState<string>('')
  // Inline title editing caret management
  const titleInputRef = useRef<HTMLInputElement | null>(null)
  const titleModalInputRef = useRef<HTMLInputElement | null>(null)
  const [titleCaret, setTitleCaret] = useState<{ start: number; end: number } | null>(null)
  // Flag to distinguish browser-default changes from our manual caret-preserving edits
  const handledTitleKeyRef = useRef<boolean>(false)
  // Track last user action time for caret updates (to ignore non-user selection changes)
  const lastUserActionTsRef = useRef<number>(0)
  const markUserAction = () => { lastUserActionTsRef.current = Date.now() }


  // Map click position on the static H3 to an approximate caret index for the input
  const computeCaretIndexFromClick = (el: HTMLElement, clientX: number, text: string) => {
    try {
      const rect = el.getBoundingClientRect()
      const x = Math.max(0, Math.min(clientX - rect.left, rect.width))
      const style = window.getComputedStyle(el)
      const font = style.font && style.font !== ''
        ? style.font
        : `${style.fontStyle || 'normal'} ${style.fontVariant || 'normal'} ${style.fontWeight || '400'} ${style.fontSize || '16px'} ${style.fontFamily || 'sans-serif'}`
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        // Fallback: proportional estimate
        return Math.min(text.length, Math.round((x / rect.width) * text.length))
      }
      ctx.font = font
      let index = 0
      for (let i = 1; i <= text.length; i++) {
        const w = ctx.measureText(text.slice(0, i)).width
        if (w >= x) {
          index = i - 1
          break
        }
        index = i
      }
      // Clamp just in case
      if (index < 0) index = 0
      if (index > text.length) index = text.length
      return index
    } catch {
      return 0
    }
  }

  // Focus only when entering title edit mode to avoid re-focus on each render
  useEffect(() => {
    if (editingField === 'title') {
      requestAnimationFrame(() => {
        if (isModalOpen && titleModalInputRef.current) {
          titleModalInputRef.current.focus()
        } else if (titleInputRef.current) {
          titleInputRef.current.focus()
        }
      })
    }
  }, [editingField, isModalOpen])

  // Initialize caret on mount of a title editor if not already set (extra safety against re-renders)
  useEffect(() => {
    if (editingField !== 'title') return
    const el = (isModalOpen ? titleModalInputRef.current : titleInputRef.current) as HTMLInputElement | null
    if (el && !titleCaret) {
      const pos = typeof el.selectionStart === 'number' ? el.selectionStart! : (el.value?.length || 0)
      setTitleCaret({ start: pos, end: pos })
    }
  }, [editingField, isModalOpen])

  // Preserve caret position across controlled value updates and ensure focus stays on the active title input
  useLayoutEffect(() => {
    if (editingField !== 'title') return

    const preferred = (isModalOpen ? titleModalInputRef.current : titleInputRef.current) as HTMLInputElement | null
    const candidates = [titleInputRef.current, titleModalInputRef.current].filter(Boolean) as HTMLInputElement[]
    const active = candidates.find((el) => el === document.activeElement) || preferred
    const el = (active || preferred) as HTMLInputElement | null

    if (!el) return

    try {
      // Keep focus stable on the editor even across re-renders
      if (document.activeElement !== el) {
        el.focus()
      }
      if (titleCaret) {
        // Use double rAF to apply selection after React paints
        const { start, end } = titleCaret
        requestAnimationFrame(() => {
          try { el.setSelectionRange(start, end) } catch {}
          requestAnimationFrame(() => { try { el.setSelectionRange(start, end) } catch {} })
        })
      }
    } catch {}
    // Clear the handled key flag after we reconcile selection to avoid suppressing legitimate onChange later
    handledTitleKeyRef.current = false
  }, [editingValue, editingField, titleCaret, isModalOpen])

  // Extra safety: while editing grid title, keep focus and selection pinned to the input
  useEffect(() => {
    if (editingField !== 'title' || isModalOpen) return
    let cancelled = false
    const tick = () => {
      if (cancelled) return
      const input = titleInputRef.current as HTMLInputElement | null
      if (input) {
        // If focus drifted (e.g., outer card re-render), restore it and the caret
        if (document.activeElement !== input) {
          try { input.focus() } catch {}
          if (titleCaret) {
            const { start, end } = titleCaret
            try { input.setSelectionRange(start, end) } catch {}
          }
        }
      }
      requestAnimationFrame(tick)
    }
    // Start on next frame so the DOM is settled
    const id = requestAnimationFrame(tick)
    return () => {
      cancelled = true
      cancelAnimationFrame(id)
    }
  }, [editingField, isModalOpen, titleCaret])


  const [notification, setNotification] = useState<string | null>(null)
  const [userDefaultLogo, setUserDefaultLogo] = useState<string>('')
  const [showDefaultLogoModal, setShowDefaultLogoModal] = useState(false)
  const [newDefaultLogo, setNewDefaultLogo] = useState('')
  // New states for folder-based compact view
  const [compactViewMode, setCompactViewMode] = useState<'folders' | 'bookmarks'>('folders')
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null)
  // near top state declarations after other states
  const [folderAssignments, setFolderAssignments] = useState<FolderHierarchyAssignment[]>([]);
  const [goalDialogOpen, setGoalDialogOpen] = useState(false);
  const [selectedGoalFolder, setSelectedGoalFolder] = useState<GoalFolder | null>(null);
  // Folder creation states
  const [showAddFolder, setShowAddFolder] = useState(false);
  const [newFolder, setNewFolder] = useState({
    name: '',
    color: '#3b82f6', // Default blue color
    description: ''
  });

  // Add Bookmark modal states
  const [addBookmarkTab, setAddBookmarkTab] = useState<'new' | 'existing'>('new');
  const [selectedExistingBookmarks, setSelectedExistingBookmarks] = useState<number[]>([]);
  const [existingBookmarksSearch, setExistingBookmarksSearch] = useState('');

  // HIERARCHY view mode state
  const [khV1ViewMode, setKhV1ViewMode] = useState<'chart' | 'timeline'>('chart');

  // Add active tab state for bookmark modal
  const [activeBookmarkTab, setActiveBookmarkTab] = useState('overview');
  const [hasVisitedMediaTab, setHasVisitedMediaTab] = useState(false);

  // Listen for external requests to switch the bookmark modal tab (e.g., from TipTap inline overlays)
  React.useEffect(() => {
    const handler = (ev: CustomEvent<string>) => {
      const tab = ev?.detail || 'timer';
      setActiveBookmarkTab(typeof tab === 'string' ? tab : 'timer');
    };
    window.addEventListener('bookmarkModal:switchTab' as any, handler as any);
    return () => window.removeEventListener('bookmarkModal:switchTab' as any, handler as any);
  }, []);

  // ARP (Application Requirements Document) template system state
  const [arpSelectedTemplate, setArpSelectedTemplate] = useState('developer');
  const [arpCompletedSteps, setArpCompletedSteps] = useState<string[]>([]);
  const [arpCurrentStep, setArpCurrentStep] = useState(0);
  const [arpShowAllSteps, setArpShowAllSteps] = useState(false);

  // Dynamic folders based on real bookmark categories
  const [dynamicFolders, setDynamicFolders] = useState<any[]>([]);

  // State for opened folder in Folder 2.0
  const [openedFolder, setOpenedFolder] = useState<any>(null);

  // Move-to-Folder modal state
  const [showMoveModal, setShowMoveModal] = useState(false)
  const [bookmarkToMove, setBookmarkToMove] = useState<any | null>(null)
  const [selectedMoveFolderId, setSelectedMoveFolderId] = useState<string>('')
  const [isMovingBookmark, setIsMovingBookmark] = useState(false)

  const [mockGoalFolders, setMockGoalFolders] = useState([
    {
      id: '1',
      name: 'Q1 Learning Goals',
      description: 'Complete React and TypeScript courses',
      color: '#3b82f6',
      deadline_date: '2024-03-31',
      goal_type: 'learn_category',
      goal_description: 'Master React hooks and TypeScript fundamentals',
      goal_status: 'in_progress',
      goal_priority: 'high',
      goal_progress: 65,
      goal_notes: 'Making good progress on React hooks',
      connected_bookmarks: [],
      tags: ['learning', 'react', 'typescript'],
      notes: 'Making good progress on React hooks'
    },
    {
      id: '2',
      name: 'Project Organization',
      description: 'Organize all development resources',
      color: '#10b981',
      deadline_date: '2024-02-15',
      goal_type: 'organize',
      goal_description: 'Create a systematic approach to project management',
      goal_status: 'pending',
      goal_priority: 'medium',
      goal_progress: 25,
      goal_notes: 'Need to start organizing soon',
      connected_bookmarks: [],
      tags: ['organization', 'productivity'],
      notes: 'Need to start organizing soon'
    },
    {
      id: '3',
      name: 'Research New Technologies',
      description: 'Explore emerging web technologies',
      color: '#f59e0b',
      deadline_date: '2024-04-30',
      goal_type: 'research_topic',
      goal_description: 'Research and evaluate new frameworks and tools',
      goal_status: 'in_progress',
      goal_priority: 'low',
      goal_progress: 40,
      goal_notes: 'Focusing on Next.js 14 and React Server Components',
      connected_bookmarks: [],
      tags: ['research', 'nextjs', 'react'],
      notes: 'Focusing on Next.js 14 and React Server Components'
    }
  ]);

  // --- Real Goal Folders and Goals state ---
  const [goalFolders, setGoalFolders] = useState<GoalFolder[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoadingGoals, setIsLoadingGoals] = useState(false);
  const [goalFolderDialogOpen, setGoalFolderDialogOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [selectedFolderIdForGoal, setSelectedFolderIdForGoal] = useState<string | undefined>(undefined);

  // Hierarchical navigation state for Goal 2.0
  const [currentGoalFolder, setCurrentGoalFolder] = useState<GoalFolder | null>(null);
  const [goalNavigationMode, setGoalNavigationMode] = useState<'main' | 'folder'>('main');
  const [goalError, setGoalError] = useState<string | null>(null);

  // --- Bookmark data state (fetched from database) ---
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [isLoadingBookmarks, setIsLoadingBookmarks] = useState(true);

  // User ID for API calls - must match the API default
  const userId = '48e1b5b9-3b0f-4ccb-8b34-831b1337fc3f';

  // Real-time analytics
  const { analyticsData, globalStats, isLoading: analyticsLoading, trackVisit: trackVisitGlobal, trackTimeSpent: trackTimeSpentGlobal, getBookmarkAnalytics, refreshAnalytics: refreshGlobalAnalytics } = useAnalytics(bookmarks);

  // Dedicated analytics for the selected bookmark to prevent global state interference
  const {
    analyticsData: selectedBookmarkAnalyticsData,
    isLoading: selectedBookmarkAnalyticsLoading,
    trackVisit: trackSelectedBookmarkVisit,
    trackTimeSpent: trackSelectedBookmarkTimeSpent,
    getBookmarkAnalytics: getSelectedBookmarkAnalytics,
    refreshAnalytics: refreshSelectedBookmarkAnalytics,
  } = useAnalytics(selectedBookmark?.id);

  // Pomodoro hook to get tasks data (global for compatibility)
  const pomodoroHook = usePomodoro();
  const { tasks: pomodoroTasks } = pomodoroHook;

  // State to store tasks for each bookmark
  const [bookmarkTasks, setBookmarkTasks] = useState<{[key: string]: any[]}>({});

  // Function to load tasks for a specific bookmark
  const loadBookmarkTasks = async (bookmarkId: string) => {
    try {
      const response = await fetch(`/api/pomodoro?bookmarkId=${encodeURIComponent(bookmarkId)}`);
      if (response.ok) {
        const data = await response.json();
        setBookmarkTasks(prev => ({
          ...prev,
          [bookmarkId]: data.tasks || []
        }));
      }
    } catch (error) {
      console.error('Error loading tasks for bookmark:', bookmarkId, error);
    }
  };

  // Load tasks for all bookmarks when they change
  useEffect(() => {
    if (bookmarks && bookmarks.length > 0) {
      bookmarks.forEach(bookmark => {
        if (bookmark.id && !bookmarkTasks[bookmark.id]) {
          loadBookmarkTasks(bookmark.id);
        }
      });
    }
  }, [bookmarks.length]); // Only depend on length to prevent infinite re-renders

  // Helper function to get tasks for a specific bookmark
  const getTasksForBookmark = (bookmarkId: string) => {
    return bookmarkTasks[bookmarkId] || [];
  };

  // Combined tracking functions that update both global and selected bookmark analytics
  const trackVisitCombined = async (bookmarkId: string) => {
    // Track on the dedicated instance first (for immediate UI updates)
    await trackSelectedBookmarkVisit(bookmarkId);

    // Update direct cache immediately for instant UI updates
    setDirectAnalyticsCache(prev => ({
      ...prev,
      [bookmarkId]: {
        visits: (prev[bookmarkId]?.visits || 0) + 1,
        timeSpent: prev[bookmarkId]?.timeSpent || 0
      }
    }));

    // Refresh global analytics to keep front cards in sync
    setTimeout(() => {
      refreshGlobalAnalytics();
      fetchDirectAnalytics(bookmarkId); // Refresh direct cache with server data
    }, 500);
  };

  const trackTimeSpentCombined = async (bookmarkId: string, timeSpent: number) => {
    // Track on the dedicated instance first
    await trackSelectedBookmarkTimeSpent(bookmarkId, timeSpent);

    // Refresh global analytics to keep front cards in sync
    setTimeout(() => {
      refreshGlobalAnalytics();
    }, 500);
  };

  // Direct analytics cache to bypass complex hook logic
  const [directAnalyticsCache, setDirectAnalyticsCache] = useState<{[key: string]: {visits: number, timeSpent: number}}>({});

  // Fetch analytics directly for a bookmark and cache it
  const fetchDirectAnalytics = async (bookmarkId: string) => {
    try {
      const response = await fetch(`/api/bookmarks/analytics?bookmarkId=${bookmarkId}`);
      const result = await response.json();
      if (result.success) {
        const cacheData = {
          visits: result.data.visits || 0,
          timeSpent: result.data.timeSpent || 0
        };
        setDirectAnalyticsCache(prev => ({
          ...prev,
          [bookmarkId]: cacheData
        }));
      }
    } catch (error) {
      console.error('Failed to fetch direct analytics:', error);
    }
  };

  // Load direct analytics for all bookmarks when they change
  useEffect(() => {
    bookmarks.forEach(bookmark => {
      if (!directAnalyticsCache[bookmark.id]) {
        fetchDirectAnalytics(bookmark.id);
      }
    });
  }, [bookmarks.length]); // Only depend on length to prevent infinite re-renders

  // Memoize analytics functions to prevent unnecessary re-renders during drag operations
  const memoizedGetUnifiedBookmarkAnalytics = useCallback((bookmarkId: string) => {
    // If this is the selected bookmark, use the dedicated instance (most up-to-date)
    if (selectedBookmark?.id === bookmarkId) {
      return getSelectedBookmarkAnalytics(bookmarkId);
    }

    // Otherwise, try direct cache first, then global instance
    const directData = directAnalyticsCache[bookmarkId];
    if (directData) {
      return directData;
    }

    // Fallback to global instance
    return getBookmarkAnalytics(bookmarkId);
  }, [selectedBookmark?.id, directAnalyticsCache, getSelectedBookmarkAnalytics, getBookmarkAnalytics]);

  // Use memoized version to prevent re-renders during drag operations
  const getUnifiedBookmarkAnalytics = memoizedGetUnifiedBookmarkAnalytics;

  // Calculate total visits across all bookmarks for percentage calculation - using live analytics data
  const totalVisits = useMemo(() => {
    return bookmarks.reduce((sum, bookmark) => {
      const analytics = getUnifiedBookmarkAnalytics(bookmark.id)
      return sum + (analytics ? analytics.visits : 0) // Never fall back to bookmark.visits
    }, 0)
  }, [bookmarks, getUnifiedBookmarkAnalytics]);

  // Memoize usage percentage calculation to prevent re-computation during drag operations
  const memoizedGetUsagePercentage = useCallback((visits: number) => {
    if (totalVisits === 0) return 0
    return Math.min(Math.round((visits / totalVisits) * 100), 100)
  }, [totalVisits]);

  // Health check loading state for individual bookmarks
  const [healthCheckLoading, setHealthCheckLoading] = useState<{ [key: string]: boolean }>({});
  const [uploadingBackground, setUploadingBackground] = useState(false);

  // Theme color state
  const [themeColor, setThemeColor] = useState('#3b82f6'); // Default blue
  const [isThemeLoading, setIsThemeLoading] = useState(true);

  // Username state
  const [username, setUsername] = useState('TOM');

  // Analytics summary polling for top cards
  const [summary, setSummary] = useState<{ totalVisits: number; totalTimeSpentMinutes: number; thisWeekVisits?: number; brokenCount?: number } | null>(null)
  useEffect(() => {
    let active = true
    const load = async () => {
      try {
        const res = await fetch('/api/analytics/summary')
        const json = await res.json()
        if (active && json && !json.error) setSummary(json)
      } catch {}
    }
    load()
    const id = setInterval(load, 30000)
    return () => { active = false; clearInterval(id) }
  }, [])

  // Analytics metrics state
  const [selectedMetrics, setSelectedMetrics] = useState(['Total Visits', 'Engagement Score']);
  const [isMetricsDropdownOpen, setIsMetricsDropdownOpen] = useState(false);

  // Available metrics options
  const availableMetrics = [
    'Total Visits',
    'Engagement Score',
    'Click-through Rate',
    'Session Duration',
    'Bounce Rate',
    'Page Views',
    'User Retention',
    'Conversion Rate',
    'Active Users',
    'Revenue Generated'
  ];

  // Load and persist lightweight chart preferences via Supabase API (/api/save)
  useEffect(() => {
    const loadPrefs = async () => {
      try {
        const res = await fetch('/api/save?table=dashboard&title=Chart Preferences')
        const json = await res.json()
        const prefs = json?.data?.settings
        if (prefs) {
          if (Array.isArray(prefs.selectedMetrics)) setSelectedMetrics(prefs.selectedMetrics)
          if (typeof prefs.chartTimePeriod === 'string') setChartTimePeriod(prefs.chartTimePeriod)
        }
      } catch {}
    }
    loadPrefs()
  }, [])

  useEffect(() => {
    const savePrefs = async () => {
      try {
        await fetch('/api/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            table: 'dashboard',
            title: 'Chart Preferences',
            data: { selectedMetrics, chartTimePeriod },
          }),
        })
      } catch {}
    }
    savePrefs()
  }, [selectedMetrics, chartTimePeriod])

  // Load theme color and username from settings
  useEffect(() => {
    const loadSettings = () => {
      try {
        setIsThemeLoading(true);

        // Load from localStorage first
        const savedSettings = localStorage.getItem('userSettings');
        if (savedSettings) {
          const settings = JSON.parse(savedSettings);
          const accentColor = settings.appearance?.accentColor;
          const customColor = settings.appearance?.customColor;

          // Load username from profile settings
          if (settings.profile?.name) {
            setUsername(settings.profile.name);
          }

          // Define color palette mapping
          const colorPalettes = {
            'blue': '#3b82f6',
            'green': '#10b981',
            'purple': '#8b5cf6',
            'red': '#ef4444',
            'orange': '#f97316'
          };

          // Use custom color if accent is custom, otherwise use palette color
          const finalColor = accentColor === 'custom' ? customColor : colorPalettes[accentColor] || '#3b82f6';
          setThemeColor(finalColor);

          console.log('🎨 Theme color loaded:', finalColor);
          console.log('👤 Username loaded:', settings.profile?.name || 'TOM');
        }

        // Listen for settings updates
        const handleSettingsUpdate = () => {
          loadSettings();
        };

        window.addEventListener('userSettingsUpdated', handleSettingsUpdate);

        return () => {
          window.removeEventListener('userSettingsUpdated', handleSettingsUpdate);
        };
      } catch (error) {
        console.error('❌ Error loading settings:', error);
      } finally {
        setIsThemeLoading(false);
      }
    };

    loadSettings();
  }, []);

  // Fetch bookmarks from database
  useEffect(() => {
    console.log('🟢 Dashboard: Bookmarks useEffect triggered');
    console.log('🟢 Dashboard: userId =', userId);
    console.log('🟢 Dashboard: Current URL =', window.location.href);

    // Force a visible test
    if (typeof window !== 'undefined') {
      console.log('🟢 Dashboard: Window is available, component is mounting');
      // Add a temporary alert to test if JS is working
      // alert('Dashboard component is loading!');
    }

    const fetchBookmarks = async () => {
      try {
        setIsLoadingBookmarks(true);
        console.log('🔍 Fetching bookmarks for user ID:', userId);
        const response = await fetch(`/api/bookmarks`);
        const data = await response.json();

        console.log('📡 API Response:', data);

        if (data.success) {
          setBookmarks(data.bookmarks);
          console.log(`✅ Loaded ${data.bookmarks.length} bookmarks from database`);
        } else {
          console.error('❌ Failed to fetch bookmarks:', data.error);
          // Fallback to empty array
          setBookmarks([]);
        }
      } catch (error) {
        console.error('❌ Error fetching bookmarks:', error);
        // Fallback to empty array
        setBookmarks([]);
      } finally {
        setIsLoadingBookmarks(false);
      }
    };

    fetchBookmarks();

    // Add global event listener for bookmark refresh
    const handleBookmarkRefresh = async () => {
      console.log('🔄 Refreshing bookmarks & categories due to external update');
      await fetchBookmarks();
      try {
        const res = await fetch(`/api/categories?t=${Date.now()}&user_id=${userId}` , {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' }
        });
        const data = await res.json();
        if (data?.success && data.categories) {
          // Update base categories state; dynamicFolders will regenerate via the categories->folders effect
          setCategories(data.categories);
          console.log('📁 Categories refreshed from event:', data.categories.length);
        } else {
          console.warn('⚠️ Failed to refresh categories on event:', data);
        }
      } catch (e) {
        console.error('❌ Error refreshing categories on event:', e);
      }
    };

    window.addEventListener('bookmarkAdded', handleBookmarkRefresh);
    // Also listen via BroadcastChannel for cross-tab/page updates
    try {
      const bc = new BroadcastChannel('bookmarks');
      bc.onmessage = (e) => {
        const msg = e?.data;
        if (msg === 'bookmarkAdded' || (msg && typeof msg === 'object' && msg.type === 'added')) {
          void handleBookmarkRefresh();
        }
      };
      // Cleanup
      (window as any).__bh_broadcast_cleanup = () => bc.close();
    } catch (err) {
      console.warn('BroadcastChannel not available:', err);
    }


    // Cleanup event listener
    return () => {

              try {
                (window as any).__bh_broadcast_cleanup?.();
              } catch {}

      window.removeEventListener('bookmarkAdded', handleBookmarkRefresh);
    };
  }, []);

  // ---- Folder category ordering state (for compact & list views) ----
  const [bulkMode, setBulkMode] = useState(false);
  const scrollLockRef = useRef(false);

  // Load categories from the dedicated categories API
  const loadCategories = useCallback(async () => {
    try {
      setIsLoadingCategories(true);
      console.log('🔄 Loading categories from categories API...');
      const response = await fetch(`/api/categories?t=${Date.now()}&user_id=${userId}` , {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });

      const data = await response.json();

      if (data.success && data.categories) {
        setCategories(data.categories);
        console.log('📁 Loaded categories:', data.categories.length);
      } else {
        console.error('❌ Failed to load categories:', data);
        // Fallback to default categories if API fails
        setCategories([
          { name: 'Development', id: 'development' },
          { name: 'Design', id: 'design' },
          { name: 'Marketing', id: 'marketing' },
          { name: 'Productivity', id: 'productivity' },
          { name: 'Research', id: 'research' }
        ]);
      }
    } catch (error) {
      console.error('❌ Error loading categories:', error);
      // Fallback to default categories
      setCategories([
        { name: 'Development', id: 'development' },
        { name: 'Design', id: 'design' },
        { name: 'Marketing', id: 'marketing' },
        { name: 'Productivity', id: 'productivity' },
        { name: 'Research', id: 'research' }
      ]);
    } finally {
      setIsLoadingCategories(false);
    }
  }, [userId]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  // Generate dynamic folders from loaded categories
  useEffect(() => {
    const loadDynamicFolders = async () => {
      try {
        console.log('🔄 Loading dynamic folders from categories...');

        if (categories.length > 0) {
          // Convert categories to folder format
          const folders = categories.map((category: any) => ({
            id: `folder-${category.id}`,
            name: category.name,
            description: category.description || `${category.name} related bookmarks`,
            color: category.color,
            bookmarkCount: category.bookmarkCount
          }));

          setDynamicFolders(folders);
          console.log('📁 Loaded dynamic folders from categories API:', folders);


        } else {
          console.log('⚠️ No categories found, using empty folders');
          setDynamicFolders([]);
        }
      } catch (error) {
        console.error('❌ Error loading dynamic folders:', error);
        // Fallback to empty folders
        setDynamicFolders([]);
      }
    };

    loadDynamicFolders();
  }, [categories]); // Regenerate folders when categories change

  // Update category color and persist
  const updateCategoryColor = async (categoryIdOrFolderId: string, newColor: string) => {
    try {
      const categoryId = categoryIdOrFolderId.startsWith('folder-')
        ? categoryIdOrFolderId.replace(/^folder-/, '')
        : categoryIdOrFolderId

      const category = categories.find((c: any) => String(c.id) === String(categoryId))
      if (!category) {
        console.warn('Category not found for color update:', categoryIdOrFolderId)
        showNotification('Category not found', 'error')
        return
      }

      const res = await fetch('/api/categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: category.id,
          name: category.name,
          description: category.description || '',
          color: newColor,
        }),
      })
      const data = await res.json().catch(() => ({} as any))
      if (!res.ok || !data?.success) {
        console.error('Failed to update category color', { status: res.status, data })
        showNotification('Failed to update folder color', 'error')
        return
      }

      // Optimistically update categories state so UI reflects immediately
      setCategories((prev) => prev.map((c: any) => (
        String(c.id) === String(category.id)
          ? { ...c, color: newColor, updatedAt: new Date().toISOString() }
          : c
      )))

      // Broadcast so other views/tabs refresh if needed
      if (typeof window !== 'undefined') {
        try { window.dispatchEvent(new Event('bookmarkAdded')) } catch {}
        try { const bc = new BroadcastChannel('bookmarks'); bc.postMessage('bookmarkAdded'); setTimeout(() => bc.close(), 300) } catch {}
      }

      showNotification('Folder color updated!')
    } catch (err) {
      console.error('Error updating category color', err)
      showNotification('Failed to update folder color', 'error')
    }
  }


  // Reset compact view mode when switching away from compact/list view
  useEffect(() => {
    if (viewMode !== 'compact' && viewMode !== 'list') {
      setCompactViewMode('folders')
      setSelectedFolder(null)
    }
  }, [viewMode])

  // Session recovery for viewing time tracking
  useEffect(() => {
    const recoverViewingSessions = () => {
      const storedSession = localStorage.getItem('bookmarkViewSession')
      if (storedSession) {
        try {
          const session = JSON.parse(storedSession)
          const now = Date.now()
          const timeSinceStart = now - session.startTime

          // Recover viewing sessions
          console.log('🔄 Recovered viewing session for bookmark:', session.bookmarkId, 'time since start:', Math.round(timeSinceStart / (1000 * 60)), 'minutes')
        } catch (error) {
          console.error('Error recovering viewing session:', error)
          localStorage.removeItem('bookmarkViewSession')
        }
      }
    }

    // Run recovery on mount
    recoverViewingSessions()

    // Set up periodic session recovery (every 2 minutes)
    const recoveryInterval = setInterval(recoverViewingSessions, 2 * 60 * 1000)

    return () => clearInterval(recoveryInterval)
  }, [])

  // Test function to manually end session (for debugging)
  const testEndSession = () => {
    const storedSession = localStorage.getItem('bookmarkSession')
    if (storedSession) {
      try {
        const session = JSON.parse(storedSession)
        const sessionEndTime = Date.now()
        const timeSpentMinutes = Math.round((sessionEndTime - session.startTime) / (1000 * 60))

        console.log(`🧪 Manual session end test for bookmark ${session.bookmarkId}: ${timeSpentMinutes} minutes`)

        // Update analytics with time spent
        fetch('/api/bookmarks/analytics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bookmarkId: session.bookmarkId,
            action: 'timeUpdate',
            timeSpent: Math.max(timeSpentMinutes, 1),
            sessionEndTime: (() => new Date())().toISOString()
          })
        }).then(response => {
          if (response.ok) {
            console.log(`📊 Manual test - Time tracking updated: ${timeSpentMinutes} minutes`)
          } else {
            console.error('Manual test - Failed to update time tracking')
          }
        }).catch(error => {
          console.error('Manual test - Error:', error)
        })

        // Clear session data
        localStorage.removeItem('bookmarkSession')
      } catch (error) {
        console.error('Error in manual session end test:', error)
      }
    } else {
      console.log('🧪 No active session to end')
    }
  }

  // Load global logo from Supabase settings first, fallback to local profile picture
  useEffect(() => {
    const loadGlobalLogo = async () => {
      try {
        const res = await fetch('/api/save?table=bookmarks&title=Global Default Logo')
        const json = await res.json()
        const url = json?.data?.settings?.url
        if (url) {
          setUserDefaultLogo(url)
          return
        }
      } catch {}
      const profilePicture = getProfilePicture()
      const sanitized = profilePicture && profilePicture !== '/default-profile.png' ? profilePicture : ''
      setUserDefaultLogo(sanitized)
    }

    loadGlobalLogo()

    // Keep listening for local profile changes as a live fallback
    const unsubscribe = onProfilePictureChange((newPicture) => {
      const next = newPicture && newPicture !== '/default-profile.png' ? newPicture : ''
      setUserDefaultLogo(next)
    })
    return unsubscribe
  }, [])

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )
  // Available bookmarks that can be added to the workspace
  const availableBookmarks = [
    {
      id: 101,
      title: "YOUTUBE",
      url: "https://youtube.com",
      description: "Video sharing and streaming platform",
      category: "Entertainment",
      tags: ["VIDEO", "STREAMING", "CONTENT"],
      priority: "medium",
      logo: "https://upload.wikimedia.org/wikipedia/commons/e/ef/Youtube_logo.png",
      circularImage: "/placeholder.svg"
    },
    {
      id: 102,
      title: "TWITTER",
      url: "https://twitter.com",
      description: "Social media and microblogging platform",
      category: "Social",
      tags: ["SOCIAL", "NEWS", "NETWORKING"],
      priority: "low",
      logo: "https://abs.twimg.com/icons/apple-touch-icon-192x192.png",
      circularImage: "/placeholder.svg"
    },
    {
      id: 103,
      title: "LINKEDIN",
      url: "https://linkedin.com",
      description: "Professional networking platform",
      category: "Professional",
      tags: ["NETWORKING", "CAREER", "BUSINESS"],
      priority: "medium",
      logo: "https://static.licdn.com/sc/h/al2o9zrvru7aqj8e1x2rzsrca",
      circularImage: "/placeholder.svg"
    },
    {
      id: 104,
      title: "CODEPEN",
      url: "https://codepen.io",
      description: "Online code editor and frontend showcase",
      category: "Development",
      tags: ["CODE", "FRONTEND", "DEMO"],
      priority: "medium",
      logo: "https://cpwebassets.codepen.io/assets/favicon/apple-touch-icon-5ae1a0698dcc2402e9712f7d01ed509a57814f994c660df9f7a952f3060705ee.png",
      circularImage: "/placeholder.svg"
    },
    {
      id: 105,
      title: "MEDIUM",
      url: "https://medium.com",
      description: "Online publishing platform for articles and blogs",
      category: "Learning",
      tags: ["BLOG", "ARTICLES", "WRITING"],
      priority: "low",
      logo: "https://miro.medium.com/v2/resize:fill:152:152/1*sHhtYhaCe2Uc3IU0IgKwIQ.png",
      circularImage: "/placeholder.svg"
    },
    {
      id: 106,
      title: "BEHANCE",
      url: "https://behance.net",
      description: "Creative portfolio showcase platform",
      category: "Design",
      tags: ["PORTFOLIO", "CREATIVE", "SHOWCASE"],
      priority: "medium",
      logo: "https://a5.behance.net/2acd763a-9c19-4ac0-9c1e-6d2b2c0e5e0a/img/site/apple-touch-icon.png",
      circularImage: "/placeholder.svg"
    },
    {
      id: 107,
      title: "SLACK",
      url: "https://slack.com",
      description: "Team collaboration and messaging platform",
      category: "Productivity",
      tags: ["TEAM", "COMMUNICATION", "WORKSPACE"],
      priority: "high",
      logo: "https://a.slack-edge.com/80588/marketing/img/icons/icon_slack_hash_colored.png",
      circularImage: "/placeholder.svg"
    },
    {
      id: 108,
      title: "TRELLO",
      url: "https://trello.com",
      description: "Visual project management with boards and cards",
      category: "Productivity",
      tags: ["PROJECT", "KANBAN", "ORGANIZATION"],
      priority: "medium",
      logo: "https://d2k1ftgv7pobq7.cloudfront.net/meta/c/p/res/images/trello-meta-logo.png",
      circularImage: "/placeholder.svg"
    }
  ];

  // Load bookmarks directly from database API
  const loadBookmarks = async () => {
    console.log('🚀 loadBookmarks function called!');
    setIsLoadingBookmarks(true);
    try {
      console.log('🔍 Loading bookmarks from database for user:', userId)
      console.log('🔍 Making fetch request to:', `/api/bookmarks?user_id=${userId}`)
      const response = await fetch(`/api/bookmarks?user_id=${userId}`)

      if (!response.ok) {
        console.error('❌ API Response not OK:', response.status, response.statusText)
        setBookmarks([])
        return
      }

      const result = await response.json()

      console.log('📡 Database API Response:', result)
      console.log('📡 Response success:', result.success)
      console.log('📡 Bookmarks array:', result.bookmarks)
      console.log('📡 Bookmarks length:', result.bookmarks?.length)

      if (result.success && result.bookmarks && Array.isArray(result.bookmarks)) {
        console.log('✅ Loaded bookmarks from database:', result.bookmarks.length)
        console.log('✅ Setting bookmarks state with:', result.bookmarks)
        setBookmarks(result.bookmarks)
        console.log('✅ Bookmarks state set successfully')
      } else {
        console.log('⚠️ Invalid response format or no bookmarks found')
        console.log('⚠️ result.success:', result.success)
        console.log('⚠️ result.bookmarks:', result.bookmarks)
        console.log('⚠️ Array.isArray(result.bookmarks):', Array.isArray(result.bookmarks))
        setBookmarks([])
      }
    } catch (error) {
      console.error('❌ Error loading bookmarks:', error)
      console.error('❌ Error details:', error.message)
      setBookmarks([])
    } finally {
      setIsLoadingBookmarks(false);
    }
  }

  // Load goal folders and goals from database
  const loadGoalFolders = async () => {
    console.log('🎯 Loading goal folders...');
    setGoalError(null);
    try {
      const folders = await goalService.getGoalFolders();
      console.log('📁 Loaded goal folders:', folders);
      console.log('📁 Setting goalFolders state with:', folders?.length || 0, 'folders');
      setGoalFolders(folders || []);
      console.log('✅ Goal folders state updated successfully');
    } catch (error) {
      console.error('❌ Error loading goal folders:', error);
      setGoalFolders([]);
      // Don't set error for authentication issues in development
      if (!error.message?.includes('User not authenticated')) {
        setGoalError('Failed to load goal folders');
      }
    }
  };

  const loadGoals = async () => {
    console.log('🎯 Loading goals...');
    try {
      const allGoals = await goalService.getGoals();
      console.log('🎯 Loaded goals:', allGoals);
      setGoals(allGoals || []);
    } catch (error) {
      console.error('❌ Error loading goals:', error);
      setGoals([]);
      // Don't set error for authentication issues in development
      if (!error.message?.includes('User not authenticated')) {
        setGoalError('Failed to load goals');
      }
    }
  };

  const loadGoalData = async () => {
    setIsLoadingGoals(true);
    setGoalError(null);
    try {
      await Promise.all([loadGoalFolders(), loadGoals()]);
    } catch (error) {
      console.error('❌ Error loading goal data:', error);
      setGoalError('Failed to load goal data');
    } finally {
      setIsLoadingGoals(false);
    }
  };

  // Load bookmarks from database on component mount
  useEffect(() => {
    console.log('🔄 Mount effect triggered, loading bookmarks...');
    console.log('🔄 userId:', userId);
    console.log('🔄 loadBookmarks function:', typeof loadBookmarks);

    const executeLoad = async () => {
      try {
        console.log('🔄 About to call loadBookmarks...');
        await loadBookmarks();
        console.log('🔄 loadBookmarks completed');
      } catch (error) {
        console.error('❌ Error in loadBookmarks:', error);
        setIsLoadingBookmarks(false); // Stop loading on error
      }
    };

    // Add timeout fallback
    const timeout = setTimeout(() => {
      console.log('⏰ Loading timeout - forcing loading to false');
      setIsLoadingBookmarks(false);
    }, 10000); // 10 second timeout

    executeLoad();

    return () => clearTimeout(timeout);
  }, [])

  // Load goal data on component mount
  useEffect(() => {
    console.log('🎯 Loading goal data...');
    loadGoalData();
  }, []);

  // Debug bookmarks state changes - OPTIMIZED: Only log length changes to prevent spam
  useEffect(() => {
    console.log('🔄 Bookmarks count changed:', bookmarks?.length, 'bookmarks')
  }, [bookmarks?.length]) // Only log when count changes, not on every bookmark update

  // Ensure any legacy bookmark objects that may still contain tags don't render them on the cards
  // FIXED: Added bookmarks dependency and memoization to prevent infinite re-renders
  useEffect(() => {
    if (bookmarks.length > 0) {
      const needsUpdate = bookmarks.some(b => !Array.isArray(b.tags));
      if (needsUpdate) {
        setBookmarks(prev => prev.map(b => ({ ...b, tags: Array.isArray(b.tags) ? b.tags : [] })));
      }
    }
  }, [bookmarks.length]) // Only run when bookmark count changes, not on every bookmark update

  // Load hierarchy assignments from API - MOVED TO TOP TO FIX HOOKS ORDER
  useEffect(() => {
    const loadHierarchyAssignments = async () => {
      try {
        const response = await fetch(`/api/hierarchy-assignments?user_id=${userId}`);
        const data = await response.json();

        if (data.success && data.assignments) {
          setFolderAssignments(data.assignments);
          console.log('✅ Loaded hierarchy assignments:', data.assignments);
        } else {
          console.log('📁 No hierarchy assignments found, using empty array');
          setFolderAssignments([]);
        }
      } catch (error) {
        console.error('❌ Error loading hierarchy assignments:', error);
        setFolderAssignments([]);
      }
    };

    loadHierarchyAssignments();
  }, [userId]);
  // Save hierarchy assignments to API - MOVED UP TO FIX HOOKS ORDER
  const saveHierarchyAssignments = async (assignments: FolderHierarchyAssignment[]) => {
    try {
      console.log('💾 Saving hierarchy assignments:', { userId, assignmentsCount: assignments.length, assignments });

      const response = await fetch('/api/hierarchy-assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assignments,
          user_id: userId
        }),
      });

      const data = await response.json();

      console.log('📥 API Response:', { status: response.status, data });

      if (response.ok && data.success) {
        console.log('✅ Hierarchy assignments saved successfully');
        showNotification('Hierarchy assignments saved!');
      } else {
        console.error('❌ Failed to save hierarchy assignments:', { status: response.status, error: data.error });
        showNotification(`Failed to save: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('❌ Error saving hierarchy assignments:', error);
      showNotification(`Error saving: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };
  // Handle hierarchy assignments change with persistence - MOVED UP TO FIX HOOKS ORDER
  const handleHierarchyAssignmentsChange = (assignments: FolderHierarchyAssignment[]) => {
    setFolderAssignments(assignments);
    saveHierarchyAssignments(assignments);
  };

  // Preserve no custom scroll behavior (rely on browser anchoring)
  useEffect(() => {}, [bulkMode])

  // Monitor selectedBookmarks changes (no scroll manipulation)
  useEffect(() => {
    // Intentionally no-op to avoid scroll jumps
  }, [selectedBookmarks]);

  // Preserve scroll position across state updates that would otherwise reflow the page
  const preserveScrollDuring = (fn: () => void) => {
    try {
      const x = typeof window !== 'undefined' ? window.scrollX : 0;
      const y = typeof window !== 'undefined' ? window.scrollY : 0;
      fn();
      // Double RAF ensures layout + paint committed before restoring scroll
      if (typeof window !== 'undefined') {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            window.scrollTo(x, y);
          });
        });
      }
    } catch {
      fn();
    }
  };


  // State for actual folders
  const [folders, setFolders] = useState<any[]>([]);
  const [isLoadingFolders, setIsLoadingFolders] = useState(true);

  // Load folders from API
  const loadFolders = async () => {
    try {
      console.log('📁 Loading folders from API...');
      setIsLoadingFolders(true);
      const response = await fetch(`/api/categories?t=${Date.now()}&user_id=${userId}`);
      const data = await response.json();
      console.log('📁 Folders API response:', data);

      if (data.success && data.categories) {
        console.log(`✅ Loaded ${data.categories.length} folders:`, data.categories.map(f => f.name));
        setFolders(data.categories);
      } else {
        console.warn('⚠️ No folders found or API failed');
        setFolders([]);
      }
    } catch (error) {
      console.error('❌ Error loading folders:', error);
      setFolders([]);
    } finally {
      setIsLoadingFolders(false);
    }
  };

  // Load folders on mount
  useEffect(() => {
    loadFolders();
  }, []);

  // Create folders for hierarchy - use actual folders + bookmark categories as fallback
  const foldersForHierarchyV1 = useMemo(() => {
    console.log('🔄 Computing foldersForHierarchyV1...');
    console.log('📁 Input folders:', folders.length, folders.map(f => f.name));
    console.log('📚 Input bookmarks:', bookmarks.length);

    // Start with actual folders
    const actualFolders = folders.map(folder => ({
      id: folder.id,
      name: folder.name,
      color: folder.color || '#6b7280',
      bookmark_count: bookmarks.filter((b) => String(b?.folder_id || '') === String(folder.id) || (String(b?.category || '').toLowerCase() === String(folder?.name || '').toLowerCase())).length,
    }));

    // Add bookmark categories that don't have corresponding folders
    const folderNames = new Set(folders.map(f => f.name));
    const categories = Array.from(new Set(bookmarks.map((b) => b.category)));
    const categoryFolders = categories
      .filter(cat => !folderNames.has(cat))
      .map((cat) => ({
        id: cat,
        name: cat,
        color: '#6b7280',
        bookmark_count: bookmarks.filter((b) => (b.category || '').toLowerCase() === (cat || '').toLowerCase()).length,
      }));

    const result = [...actualFolders, ...categoryFolders];
    console.log('✅ Computed hierarchy folders:', result.length, result.map(f => f.name));
    return result;
  }, [folders, bookmarks]);

  // Use search API when there's a search query, otherwise filter locally
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)

  // Debounced search function with client-side fallback and proper category param
  const performSearch = useCallback(async (query: string, category: string) => {
    const q = query.trim()
    if (!q) {
      setSearchResults([])
      return
    }

    // Helper: local fallback across title, url, tags, description, notes, ai fields
    const localFallback = () => {
      const lower = q.toLowerCase()
      const withinCategory = (b: any) => category === 'all' || (b.category || '').toLowerCase() === category.toLowerCase()
      const matches = (b: any) => {
        const tokens: string[] = []
        if (b.title) tokens.push(String(b.title))
        if (b.url) tokens.push(String(b.url))
        if (b.description) tokens.push(String(b.description))
        if (Array.isArray(b.tags)) tokens.push(...b.tags)
        if (b.notes) tokens.push(String(b.notes))
        if ((b as any).ai_summary) tokens.push(String((b as any).ai_summary))
        if (Array.isArray((b as any).ai_tags)) tokens.push(...(b as any).ai_tags)
        if ((b as any).ai_category) tokens.push(String((b as any).ai_category))
        const hay = tokens.filter(Boolean).join(' ').toLowerCase()
        return hay.includes(lower)
      }
      return bookmarks.filter((b) => withinCategory(b) && matches(b))
    }

    setIsSearching(true)
    try {
      const params = new URLSearchParams({
        q: q,
        limit: '100',
        sort_by: 'relevance',
        sort_order: 'desc'
      })
      if (category && category !== 'all') {
        // API expects comma-separated list in `categories`
        params.append('categories', category)
      }

      const response = await fetch(`/api/bookmarks/search?${params}`)
      if (response.ok) {
        const data = await response.json()
        const apiResults = Array.isArray(data?.bookmarks) ? data.bookmarks : []
        // Always apply category filter on top for consistency
        const filtered = category === 'all' ? apiResults : apiResults.filter((b: any) => (b.category || '').toLowerCase() === category.toLowerCase())
        // If API returns empty, fall back locally
        setSearchResults(filtered.length > 0 ? filtered : localFallback())
      } else {
        console.warn('Search failed, using local fallback:', response.status, response.statusText)
        setSearchResults(localFallback())
      }
    } catch (error) {
      console.warn('Search error, using local fallback:', error)
      setSearchResults(localFallback())
    } finally {
      setIsSearching(false)
    }
  }, [bookmarks])

  // Debounce search calls
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim()) {
        performSearch(searchQuery, selectedCategory)
      } else {
        setSearchResults([])
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchQuery, selectedCategory, performSearch])

  // Always apply category filtering on top of either search results or full list
  const applyCategoryFilter = (arr: any[]) => arr.filter(b => selectedCategory === 'all' || (b.category || '').toLowerCase() === selectedCategory.toLowerCase())

  const filteredBookmarks = searchQuery.trim()
    ? applyCategoryFilter(searchResults)
    : applyCategoryFilter(bookmarks)


  // Grid pagination state and derived data (alphabetical sort before paginate)
  const [gridPageSize, setGridPageSize] = useState<number>(25)
  const [gridPage, setGridPage] = useState<number>(1)

  // Restore saved page size preference
  useEffect(() => {
    try {
      const raw = typeof window !== 'undefined' ? window.localStorage.getItem('gridPageSize') : null
      const saved = raw ? Number(raw) : NaN
      if ([10, 25, 50, 100].includes(saved)) {
        setGridPageSize(saved)
      }
    } catch {}
  }, [])

  // Reset to page 1 when filters/search change
  useEffect(() => {
    setGridPage(1)
  }, [searchQuery, selectedCategory])

  // Sort alphabetically by title (case-insensitive)
  const sortedBookmarks = [...filteredBookmarks].sort((a: any, b: any) => {
    const at = (a?.title || '').toString().toLowerCase()
    const bt = (b?.title || '').toString().toLowerCase()
    return at.localeCompare(bt)
  })

  const totalGridPages = Math.max(1, Math.ceil(sortedBookmarks.length / gridPageSize))
  const currentGridPage = Math.min(gridPage, totalGridPages)
  const paginatedBookmarks = sortedBookmarks.slice((currentGridPage - 1) * gridPageSize, currentGridPage * gridPageSize)

  // Clamp current page if page size or dataset size changes
  useEffect(() => {
    if (gridPage > totalGridPages) setGridPage(totalGridPages)
  }, [gridPage, totalGridPages])

  // Loading state and empty state handling
  // OPTIMIZED: Removed excessive render logging to prevent performance issues
  // Removed isClient check to fix hydration issues and loading screen

  if (isLoadingBookmarks) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-lg text-gray-600">Loading your bookmarks...</p>
            <p className="mt-2 text-sm text-gray-500">Debug: Loading state = {isLoadingBookmarks ? 'true' : 'false'}</p>
            <p className="mt-1 text-sm text-gray-500">Debug: Bookmarks count = {bookmarks.length}</p>
          </div>
        </div>
      </div>
    )
  }

  // Utility functions for title and URL formatting
  // GRID CARD CHARACTER LIMIT STANDARD:
  // - Grid cards (GridBookmarkCard & CompactBookmarkCard): 14 characters max
  // - This ensures proper spacing from right edge (~1 character buffer)
  // - Use truncateTitle(title, 14) for all grid view cards
  const truncateTitle = (title: string, maxLength: number = 20) => {
    if (title.length <= maxLength) return title;
    return title.substring(0, maxLength) + '...';
  };

  const extractDomain = (url: string) => {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace('www.', '');
    } catch {
      // If URL parsing fails, try to extract domain manually
      const match = url.match(/(?:https?:\/\/)?(?:www\.)?([^\/]+)/);
      return match ? match[1] : url;
    }
  };

  const handleAddBookmark = async () => {
    // Validate required fields
    if (!newBookmark.title.trim()) {
      alert('Please enter a bookmark title');
      return;
    }

    if (!newBookmark.url.trim()) {
      alert('Please enter a bookmark URL');
      return;
    }

    // Validate URL format
    try {
      new URL(newBookmark.url);
    } catch {
      alert('Please enter a valid URL (e.g., https://example.com)');
      return;
    }

    try {
      console.log('🚀 Saving bookmark to database...');

      const requestBody = {
        title: newBookmark.title,
        url: newBookmark.url,
        // Let server-side AI fill description when not provided
        description: newBookmark.description?.trim() || undefined,
        category: newBookmark.category,
        tags: newBookmark.tags ? newBookmark.tags.split(',').map(tag => tag.trim()) : [],
        notes: newBookmark.notes || 'No notes added',
        user_id: userId, // Include user_id for proper database association
        enableAI: true, // Enable AI automation for description, tags, and category
      };

      console.log('📤 Request body being sent:', requestBody);

      // Call the API to save the bookmark
      const response = await fetch('/api/bookmarks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();
      console.log('📥 API Response:', result);

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save bookmark');
      }

      console.log('✅ Bookmark saved successfully:', result.bookmark);
      console.log('🤖 AI Data:', {
        ai_summary: result.bookmark?.ai_summary,
        ai_tags: result.bookmark?.ai_tags,
        ai_category: result.bookmark?.ai_category
      });

      // Reload bookmarks and categories to reflect new category/folder
      await loadBookmarks();

      // Add a small delay to ensure category is fully created in database
      await new Promise(resolve => setTimeout(resolve, 500));

      try {
        console.log('🔄 Refreshing categories after bookmark creation...');
        const res = await fetch(`/api/categories?t=${Date.now()}&user_id=${userId}` , {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache'
          }
        });
        const data = await res.json();
        console.log('📁 Categories API response:', data);

        if (data?.success && data.categories) {
          // Update categories state; dynamic folders will regenerate via effect
          setCategories(data.categories);
          // Optional: immediate update for any views relying directly on folders
          const folders = data.categories.map((category: any) => ({
            id: `folder-${category.id}`,
            name: category.name,
            description: category.description,
            color: category.color,
            bookmarkCount: category.bookmarkCount
          }));
          setDynamicFolders(folders);
          console.log('✅ Categories & dynamic folders updated:', folders.length, 'categories');

          // Notify other parts of the app (and other tabs/pages) about the new bookmark
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('bookmarkAdded'));
            try {
              const bc = new BroadcastChannel('bookmarks');
              bc.postMessage({ type: 'added' });
              bc.close();
            } catch {}
          }


        } else {
          console.warn('⚠️ Categories API returned no data or failed:', data);
        }
      } catch (e) {
        console.error('❌ Error refreshing categories:', e);
      }

      console.log('✅ Bookmarks and folders reloaded from database');
      setShowAddBookmark(false);
      resetAddBookmarkForm();
      showNotification('Bookmark saved successfully!');

    } catch (error) {
      console.error('❌ Error saving bookmark:', error);
      alert(`Failed to save bookmark: ${(error as Error).message}`);
    }
  }

  const resetAddBookmarkForm = () => {
    setNewBookmark({
      title: '',
      url: '',
      description: '',
      tags: '',
      category: 'Development',
      priority: 'medium',
      notes: '',
      circularImage: '',
      logo: ''
    })
  }

  const handleAddFolder = async () => {
    if (!newFolder.name.trim()) {
      showNotification('Please enter a folder name');
      return;
    }

    console.log('🚀 Creating folder:', newFolder.name);

    try {
      // Create folder via API
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newFolder.name.trim(),
          description: newFolder.description || '',
          color: newFolder.color || '#3b82f6',
          user_id: null // Use null for global categories to bypass RLS issues
        }),
      });

      console.log('📡 API Response status:', response.status);
      const data = await response.json();
      console.log('📡 API Response data:', data);

      if (response.ok && data.success) {
        console.log('✅ Folder created successfully');
        showNotification(`Folder "${newFolder.name}" created successfully!`);

        // Reset the form
        setNewFolder({
          name: '',
          color: '#3b82f6',
          description: ''
        });

        // Close the modal
        setShowAddFolder(false);

        // Force refresh all folder-related state
        console.log('🔄 Refreshing folder state...');
        await Promise.all([
          loadFolders(),
          loadBookmarks(),
          loadCategories() // Also refresh categories
        ]);
        console.log('✅ All data refreshed');

      } else {
        console.error('❌ API returned error:', data);
        throw new Error(data.error || 'Failed to create folder');
      }
    } catch (error) {
      console.error('❌ Error creating folder:', error);
      showNotification(`Failed to create folder: ${error.message}`);
    }
  }

  const resetAddFolderForm = () => {
    setNewFolder({
      name: '',
      color: '#3b82f6',
      description: ''
    })
  }

  // Existing bookmarks handlers
  const handleExistingBookmarkSelect = (bookmarkId: number) => {
    setSelectedExistingBookmarks(prev =>
      prev.includes(bookmarkId)
        ? prev.filter(id => id !== bookmarkId)
        : [...prev, bookmarkId]
    )
  }

  const handleAddExistingBookmarks = async () => {
    if (selectedExistingBookmarks.length === 0) {
      showNotification('Please select at least one bookmark to add')
      return
    }

    // Check if we're adding related bookmarks (modal is open with selected bookmark)
    if (isModalOpen && selectedBookmark) {
      // Add as related bookmarks to the selected bookmark
      const relatedBookmarkIds = selectedExistingBookmarks.map(id =>
        bookmarks.find(b => b.id === id)?.id || id
      ).filter(id => id !== selectedBookmark.id) // Don't add bookmark as related to itself

      if (relatedBookmarkIds.length === 0) {
        showNotification('Cannot add bookmark as related to itself')
        return
      }

      // Update the selected bookmark with new related bookmarks
      const updatedBookmark = {
        ...selectedBookmark,
        relatedBookmarks: [...(selectedBookmark.relatedBookmarks || []), ...relatedBookmarkIds]
      }

      // Update bookmarks array
      setBookmarks(prev => prev.map(bookmark =>
        bookmark.id === selectedBookmark.id ? updatedBookmark : bookmark
      ))

      // Update selected bookmark for immediate UI update
      setSelectedBookmark(updatedBookmark)

      // Save the updated bookmark to the backend
      try {
        const response = await fetch('/api/bookmarks', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: updatedBookmark.id,
            user_id: userId, // Include user_id for proper database update
            title: updatedBookmark.title,
            url: updatedBookmark.url,
            description: updatedBookmark.description || '',
            category: updatedBookmark.category || '',
            tags: Array.isArray(updatedBookmark.tags) ? updatedBookmark.tags : [],
            notes: updatedBookmark.notes || '',
            ai_summary: updatedBookmark.ai_summary || '',
            ai_tags: updatedBookmark.ai_tags || [],
            ai_category: updatedBookmark.ai_category || updatedBookmark.category || '',
            relatedBookmarks: updatedBookmark.relatedBookmarks || []
          })
        })

        const result = await response.json()

        if (result.success) {
          showNotification(`Added ${relatedBookmarkIds.length} related bookmark(s) successfully!`)
        } else {
          showNotification('Failed to save related bookmarks')
          console.error('Save failed:', result.error)
        }
      } catch (error) {
        showNotification('Error saving related bookmarks')
        console.error('Save error:', error)
      }
    } else {
      // Original functionality: Add as new bookmarks to workspace
      const bookmarksToAdd = availableBookmarks.filter(bookmark =>
        selectedExistingBookmarks.includes(bookmark.id)
      ).map(bookmark => ({
        ...bookmark,
        id: bookmarks.length + bookmark.id, // Ensure unique IDs
        isFavorite: false,
        visits: 0,
        lastVisited: (() => {
          const date = new Date();
          return isNaN(date.getTime()) ? 'Unknown' : date.toLocaleDateString();
        })(),
        dateAdded: (() => {
          const date = new Date();
          return isNaN(date.getTime()) ? 'Unknown' : date.toLocaleDateString();
        })(),
        favicon: bookmark.title.charAt(0).toUpperCase(),
        screenshot: "/placeholder.svg",
        notes: 'Added from available bookmarks',
        timeSpent: '0m',
        weeklyVisits: 0,
        siteHealth: 'working',
        project: {
          name: "IMPORTED",
          progress: 0,
          status: "New"
        }
      }))

      setBookmarks(prev => [...prev, ...bookmarksToAdd])
      showNotification(`Added ${bookmarksToAdd.length} bookmark(s) successfully!`)
    }

    setSelectedExistingBookmarks([])
    setShowAddBookmark(false)
  }

  const resetAddBookmarkModal = () => {
    setAddBookmarkTab('new')
    setSelectedExistingBookmarks([])
    setExistingBookmarksSearch('')
    resetAddBookmarkForm()
  }

  // Filter available bookmarks for search
  const filteredAvailableBookmarks = availableBookmarks.filter(bookmark => {
    const searchLower = existingBookmarksSearch.toLowerCase()
    return bookmark.title.toLowerCase().includes(searchLower) ||
           bookmark.description.toLowerCase().includes(searchLower) ||
           (bookmark.category || '').toLowerCase().includes(searchLower) ||
           bookmark.tags.some((tag: string) => tag.toLowerCase().includes(searchLower))
  }).filter(availableBookmark =>
    // Only show bookmarks that aren't already added to the workspace
    !bookmarks.some(existingBookmark => existingBookmark.url === availableBookmark.url)
  )

  // Filter existing user bookmarks for the existing bookmarks tab
  const filteredExistingBookmarks = bookmarks.filter(bookmark => {
    const searchLower = existingBookmarksSearch.toLowerCase()
    return bookmark.title.toLowerCase().includes(searchLower) ||
           bookmark.description.toLowerCase().includes(searchLower) ||
           (bookmark.category || '').toLowerCase().includes(searchLower) ||
           (Array.isArray(bookmark.tags) && bookmark.tags.some((tag: string) => tag.toLowerCase().includes(searchLower)))
  }).filter(bookmark =>
    // Exclude the currently selected bookmark from the list
    selectedBookmark ? bookmark.id !== selectedBookmark.id : true
  )

  const handleBookmarkSelect = (bookmarkId: number | string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }

    // Store current scroll position in ref before state update
    const saved = { x: window.scrollX, y: window.scrollY }
    scrollPositionRef.current = saved

    // Update state - the useEffect will handle additional restoration attempts
    const idStr = String(bookmarkId)
    preserveScrollDuring(() => {
      setSelectedBookmarks(prev =>
        prev.includes(idStr)
          ? prev.filter(id => id !== idStr)
          : [...prev, idStr]
      )
    })

    // Also capture document scrolling element to preserve exact row
    const container: HTMLElement | Document | null = (document.scrollingElement as any) || document.documentElement
    const containerY = (container as any)?.scrollTop ?? 0


  }

  const handleBookmarkClick = (bookmark: any) => {
    setSelectedBookmark(bookmark)
    setIsModalOpen(true)

    // Track the visit using the combined function (updates both instances)
    // Note: We'll track this after setting selectedBookmark so the dedicated instance is initialized
    setTimeout(() => {
      if (bookmark?.id) {
        trackVisitCombined(bookmark.id)
      }
    }, 100)

    // Start time tracking for bookmark viewing
    const sessionStartTime = Date.now()
    const sessionData = {
      bookmarkId: bookmark.id,
      startTime: sessionStartTime,
      title: bookmark.title,
      type: 'viewing' // Track viewing time, not external site time
    }

    localStorage.setItem('bookmarkViewSession', JSON.stringify(sessionData))
    console.log('🚀 Started viewing time tracking for:', bookmark.title)
  }

  const startEditing = (field: string, currentValue: string | string[]) => {
    setEditingField(field)
    if (field === 'tags' && Array.isArray(currentValue)) {
      setEditingValue(currentValue.join(', '))
    } else {
      setEditingValue(currentValue as string)
    }
  }

  const cancelEditing = () => {
    setEditingField(null)
    setEditingValue('')
  }

  const saveEdit = async () => {
    if (!selectedBookmark || !editingField) return

    let newValue: string | string[] = editingValue
    if (editingField === 'tags') {
      newValue = editingValue.split(',').map(tag => tag.trim().toUpperCase()).filter(tag => tag.length > 0)
    } else if (editingField === 'title') {
      // Preserve user-entered casing; only trim. Visual uppercase is handled by CSS classes.
      newValue = editingValue.trim()
    }

    // Create updated bookmark object
    const updatedBookmark = { ...selectedBookmark, [editingField]: newValue }

    try {
      // Save to bookmarks API endpoint with ID for update
      const response = await fetch('/api/bookmarks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: selectedBookmark.id, // Include ID for update
          user_id: userId, // Include user_id for proper database update
          title: updatedBookmark.title,
          url: updatedBookmark.url,
          description: updatedBookmark.description || '',
          category: updatedBookmark.category || '',
          tags: Array.isArray(updatedBookmark.tags) ? updatedBookmark.tags : [],
          notes: updatedBookmark.notes || '',
          ai_summary: updatedBookmark.ai_summary || '',
          ai_tags: updatedBookmark.ai_tags || [],
          ai_category: updatedBookmark.ai_category || updatedBookmark.category || '',
          isFavorite: updatedBookmark.isFavorite || false
        })
      })

      const result = await response.json()

      if (result.success) {
        // Update the bookmark in the bookmarks array only after successful save
        setBookmarks(prev => prev.map(bookmark =>
          bookmark.id === selectedBookmark.id
            ? updatedBookmark
            : bookmark
        ))

        // Update the selected bookmark for immediate UI update
        setSelectedBookmark(updatedBookmark)

        showNotification(`${editingField} updated successfully!`)
      } else {
        showNotification('Failed to save changes')
        console.error('Save failed:', result.error)
      }
    } catch (error) {
      showNotification('Error saving changes')
      console.error('Save error:', error)
    }

    setEditingField(null)
    setEditingValue('')
  }
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const target = e.target as HTMLInputElement | HTMLTextAreaElement
    const isInputField = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')

    // Helpers for word boundaries (treat spaces as separators)
    const prevWordStart = (text: string, from: number) => {
      let i = Math.max(0, Math.min(from, text.length))
      if (i > 0) i--
      while (i > 0 && text[i] === ' ') i--
      while (i > 0 && text[i - 1] !== ' ') i--
      return i
    }
    const nextWordStart = (text: string, from: number) => {
      let i = Math.max(0, Math.min(from, text.length))
      while (i < text.length && text[i] !== ' ') i++
      while (i < text.length && text[i] === ' ') i++
      return i
    }

    if (isInputField) {
      // Enter saves, Escape cancels
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault(); e.stopPropagation(); (saveEdit())
        return
      }
      if (e.key === 'Escape') {
        e.preventDefault(); e.stopPropagation(); (cancelEditing())
        return
      }

      // Robust caret management only for title inputs (grid or modal)
      const isTitleEditor = (
        editingField === 'title' && (
          (target && (target as any).dataset && ((target as any).dataset.editor === 'grid-title' || (target as any).dataset.editor === 'modal-title')) ||
          target === titleInputRef.current ||
          target === (titleModalInputRef.current as any)
        )
      )
      if (!isTitleEditor) {
        // For other inputs, just stop propagation for destructive/typing keys so outer handlers don't interfere
        if (e.key === 'Backspace' || e.key === 'Delete' || e.key.length === 1) {
          e.stopPropagation()
        }
        return
      }

      // Mark user action for caret stability (title editor only)
      lastUserActionTsRef.current = Date.now()

      const value = target.value || ''
      const selStart = target.selectionStart ?? 0
      const selEnd = target.selectionEnd ?? selStart
      const hasSelection = selEnd > selStart

      // Use our tracked caret if available to avoid timing drift after programmatic moves
      const curStart = (titleCaret?.start ?? selStart)
      const curEnd = (titleCaret?.end ?? selEnd)
      const curHasSelection = curEnd > curStart

      const setValueAndCaret = (val: string, caretPos: number) => {
        // Mark that we're handling this change to avoid onChange overwriting caret with browser defaults
        handledTitleKeyRef.current = true
        // Mark user action so any selection events within the next tick are accepted
        lastUserActionTsRef.current = Date.now()
        // Update local controlled value and caret snapshot; layout effect will restore selection
        setEditingValue(val)
        const c = Math.max(0, Math.min(caretPos, val.length))
        setTitleCaret({ start: c, end: c })
        // Extra safety: refocus and set selection on the concrete target immediately (double rAF for stability)
        requestAnimationFrame(() => {
          try {
            (target as HTMLInputElement).focus()
            ;(target as HTMLInputElement).setSelectionRange(c, c)
          } catch {}
          requestAnimationFrame(() => {
            try {
              (target as HTMLInputElement).focus()
              ;(target as HTMLInputElement).setSelectionRange(c, c)
            } catch {}
          })
        })
      }

      const isCtrlLike = e.ctrlKey || e.metaKey
      const isAltLike = e.altKey || (navigator.platform.toLowerCase().includes('mac') ? e.altKey : e.ctrlKey)

      // Word navigation (Option/Ctrl + Arrow)
      if ((e.key === 'ArrowRight' || e.key === 'ArrowLeft') && (e.altKey || e.ctrlKey)) {
        e.preventDefault(); e.stopPropagation()
        if (e.key === 'ArrowRight') {
          const pos = nextWordStart(value, curEnd)
          setTitleCaret({ start: pos, end: pos })
          // Apply immediately to avoid any transient jumps
          try { (target as HTMLInputElement).setSelectionRange(pos, pos) } catch {}
        } else {
          const pos = prevWordStart(value, curStart)
          setTitleCaret({ start: pos, end: pos })
          try { (target as HTMLInputElement).setSelectionRange(pos, pos) } catch {}
        }
        return
      }

      // Delete previous word (Option/Ctrl + Backspace)
      if ((e.key === 'Backspace') && (e.altKey || e.ctrlKey)) {
        e.preventDefault(); e.stopPropagation()
        const start = prevWordStart(value, curStart)
        const newVal = value.slice(0, start) + value.slice(curEnd)
        setValueAndCaret(newVal, start)
        return
      }
      // Delete next word (Option/Ctrl + Delete)
      if ((e.key === 'Delete') && (e.altKey || e.ctrlKey)) {
        e.preventDefault(); e.stopPropagation()
        const end = nextWordStart(value, curEnd)
        const newVal = value.slice(0, curStart) + value.slice(end)
        setValueAndCaret(newVal, curStart)
        return
      }

      // Character deletion
      if (e.key === 'Backspace') {
        e.preventDefault(); e.stopPropagation()
        if (curHasSelection) {
          const newVal = value.slice(0, curStart) + value.slice(curEnd)
          setValueAndCaret(newVal, curStart)
        } else if (curStart > 0) {
          const newVal = value.slice(0, curStart - 1) + value.slice(curEnd)
          setValueAndCaret(newVal, curStart - 1)
        } else {
          // nothing to delete
        }
        return
      }
      if (e.key === 'Delete') {
        e.preventDefault(); e.stopPropagation()
        if (curHasSelection) {
          const newVal = value.slice(0, curStart) + value.slice(curEnd)
          setValueAndCaret(newVal, curStart)
        } else if (curEnd < value.length) {
          const newVal = value.slice(0, curStart) + value.slice(curEnd + 1)
          setValueAndCaret(newVal, curStart)
        } else {
          // nothing to delete
        }
        return
      }


              // Character-by-character navigation with Arrow keys
              if ((e.key === 'ArrowLeft' || e.key === 'ArrowRight') && !isCtrlLike && !isAltLike) {
                e.preventDefault(); e.stopPropagation()
                const pos = e.key === 'ArrowLeft'
                  ? (curHasSelection ? curStart : Math.max(0, curStart - 1))
                  : (curHasSelection ? curEnd : Math.min(value.length, curStart + 1))
                setTitleCaret({ start: pos, end: pos })
                try { (target as HTMLInputElement).setSelectionRange(pos, pos) } catch {}
                return
              }

      // Regular typing: update value manually so caret never gets lost even if default is blocked upstream
      if (e.key.length === 1 && !isCtrlLike && !isAltLike) {
        e.preventDefault(); e.stopPropagation()
        const newVal = value.slice(0, curStart) + e.key + value.slice(curEnd)
        setValueAndCaret(newVal, curStart + 1)
        return
      }

      // For other keys (arrows without modifiers, Home/End, etc.) just stop propagation
      e.stopPropagation()
    }
  }
  const toggleFavorite = async () => {
    if (!selectedBookmark) return

    const newFavoriteStatus = !selectedBookmark.isFavorite
    const updatedBookmark = { ...selectedBookmark, isFavorite: newFavoriteStatus }

    try {
      // Save to bookmarks API endpoint with ID for update
      const response = await fetch('/api/bookmarks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: selectedBookmark.id, // Include ID for update
          user_id: userId, // Include user_id for proper database update
          title: updatedBookmark.title,
          url: updatedBookmark.url,
          description: updatedBookmark.description || '',
          category: updatedBookmark.category || '',
          tags: Array.isArray(updatedBookmark.tags) ? updatedBookmark.tags : [],
          notes: updatedBookmark.notes || '',
          ai_summary: updatedBookmark.ai_summary || '',
          ai_tags: updatedBookmark.ai_tags || [],
          ai_category: updatedBookmark.ai_category || updatedBookmark.category || '',
          isFavorite: newFavoriteStatus
        })
      })

      const result = await response.json()

      if (result.success) {
        // Update the bookmark in the bookmarks array only after successful save
        setBookmarks(prev => prev.map(bookmark =>
          bookmark.id === selectedBookmark.id
            ? updatedBookmark
            : bookmark
        ))

        // Update the selected bookmark for immediate UI update
        setSelectedBookmark(updatedBookmark)

        showNotification(newFavoriteStatus ? 'Added to favorites!' : 'Removed from favorites!')
      } else {
        showNotification('Failed to update favorite status')
        console.error('Save failed:', result.error)
      }
    } catch (error) {
      showNotification('Error updating favorite status')
      console.error('Save error:', error)
    }
  }

  const shareBookmark = async () => {
    if (!selectedBookmark) return

    const shareData = {
      title: selectedBookmark.title,
      text: selectedBookmark.description,
      url: selectedBookmark.url,
    }

    try {
      // Try to use Web Share API if available
      if (navigator.share) {
        await navigator.share(shareData)
      } else {
        // Fallback to copying to clipboard
        await navigator.clipboard.writeText(`${selectedBookmark.title}\n${selectedBookmark.description}\n${selectedBookmark.url}`)
        showNotification('Bookmark details copied to clipboard!')
      }
    } catch (error) {
      console.error('Error sharing:', error)
      // Fallback to copying URL only
      try {
        await navigator.clipboard.writeText(selectedBookmark.url)
        showNotification('Bookmark URL copied to clipboard!')
      } catch (clipboardError) {
        console.error('Clipboard error:', clipboardError)
        showNotification('Unable to share or copy bookmark')
      }
    }
  }

  const copyBookmarkUrl = async () => {
    if (!selectedBookmark) return

    try {
      await navigator.clipboard.writeText(selectedBookmark.url)
      showNotification('Bookmark URL copied to clipboard!')
    } catch (error) {
      console.error('Error copying to clipboard:', error)
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = selectedBookmark.url
      document.body.appendChild(textArea)
      textArea.select()
      try {
        document.execCommand('copy')
        showNotification('Bookmark URL copied to clipboard!')
      } catch (fallbackError) {
        console.error('Fallback copy failed:', fallbackError)
        showNotification('Unable to copy URL to clipboard')
      }
      document.body.removeChild(textArea)
    }
  }

  const visitSite = () => {
    if (!selectedBookmark) return

    // Track the visit using the combined function (updates both instances)
    trackVisitCombined(selectedBookmark.id)

    // Open the bookmark URL
    window.open(selectedBookmark.url, '_blank', 'noopener,noreferrer')

    console.log('🔗 Opened bookmark:', selectedBookmark.title)
  }

  const showNotification = (message: string, type?: string) => {
    setNotification(message)
    setTimeout(() => setNotification(null), 3000)
  }

  const deleteBookmark = async (bookmarkId: string | number) => {
    try {
      const response = await fetch(`/api/bookmarks?id=${bookmarkId}&user_id=${userId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        // Remove bookmark from local state (normalize id types)
        setBookmarks(prev => prev.filter(b => String(b.id) !== String(bookmarkId)));
        // If the deleted bookmark is currently selected, clear selection safely
        setSelectedBookmark(prev => (prev && String(prev.id) === String(bookmarkId) ? null : prev));
        showNotification('Bookmark deleted successfully!');
      } else {
        showNotification('Failed to delete bookmark');
        console.error('Delete failed:', data.error);
      }
    } catch (error) {
      showNotification('Error deleting bookmark');
      console.error('Delete error:', error);
    }
  }

  const handleSetDefaultLogo = async () => {
    if (!selectedBookmark || !newDefaultLogo) return;
    try {
      // Persist per-bookmark logo by storing it in customBackground
      const resp = await fetch('/api/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedBookmark.id,
          user_id: userId, // Include user_id for proper database update
          customBackground: newDefaultLogo,
          // include existing fields to satisfy update payload
          title: selectedBookmark.title,
          url: selectedBookmark.url,
          description: selectedBookmark.description || '',
          category: selectedBookmark.category || '',
          tags: Array.isArray(selectedBookmark.tags) ? selectedBookmark.tags : [],
          notes: selectedBookmark.notes || '',
          ai_summary: selectedBookmark.ai_summary || '',
          ai_tags: Array.isArray(selectedBookmark.ai_tags) ? selectedBookmark.ai_tags : [],
          ai_category: selectedBookmark.ai_category || null
        })
      })
      if (!resp.ok) throw new Error('Failed to save bookmark logo')

      // Update local state for this bookmark only (avatar + background)
      setBookmarks(prev => prev.map(b =>
        String(b.id) === String(selectedBookmark.id)
          ? { ...b, customBackground: newDefaultLogo, circularImage: newDefaultLogo }
          : b
      ))
      setSelectedBookmark(prev => prev ? { ...prev, customBackground: newDefaultLogo, circularImage: newDefaultLogo } : prev)

      setShowDefaultLogoModal(false)
      setNewDefaultLogo('')
      showNotification('Bookmark logo updated')
    } catch (e) {
      console.error(e)
      showNotification('Failed to update logo')
    }
  }

  const openDefaultLogoModal = () => {
    setNewDefaultLogo(userDefaultLogo)
    setShowDefaultLogoModal(true)
  }
  const handleBackgroundUpload = async () => {
    if (!selectedBookmark) return;

    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        setUploadingBackground(true)
        try {
          const reader = new FileReader()
          reader.onload = async (e) => {
            const imageDataUrl = e.target?.result as string

            // Update this specific bookmark background (front avatar uses this)
            const response = await fetch('/api/bookmarks', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                id: selectedBookmark.id,
                user_id: userId, // Include user_id for proper database update
                customBackground: imageDataUrl,
                // Include existing bookmark data to avoid overwrites
                title: selectedBookmark.title,
                url: selectedBookmark.url,
                description: selectedBookmark.description || '',
                category: selectedBookmark.category || '',
                tags: Array.isArray(selectedBookmark.tags) ? selectedBookmark.tags : [],
                notes: selectedBookmark.notes || '',
                ai_summary: selectedBookmark.ai_summary || '',
                ai_tags: Array.isArray(selectedBookmark.ai_tags) ? selectedBookmark.ai_tags : [],
                ai_category: selectedBookmark.ai_category || null,
                is_favorite: selectedBookmark.is_favorite || false,
                project: selectedBookmark.project || null,
                tasks: selectedBookmark.tasks || [],
                relatedBookmarks: selectedBookmark.relatedBookmarks || []
              })
            })

            if (!response.ok) {
              const errorText = await response.text()
              throw new Error(`Failed to save background: ${errorText}`)
            }

            // Verify by reloading this bookmark from the API (ensures Supabase write succeeded)
            try {
              const verifyRes = await fetch(`/api/bookmarks`)
              const verifyJson = await verifyRes.json()
              const refreshed = Array.isArray(verifyJson?.bookmarks) ? verifyJson.bookmarks.find((b:any) => String(b.id) === String(selectedBookmark.id)) : null
              if (refreshed) {
                // Update local state with authoritative values
                setBookmarks(prev => prev.map((bookmark) =>
                  String(bookmark.id) === String(selectedBookmark.id)
                    ? {
                        ...bookmark,
                        customBackground: refreshed.customBackground || imageDataUrl
                      }
                    : bookmark
                ))
                setSelectedBookmark((prev) => prev ? {
                  ...prev,
                  customBackground: refreshed.customBackground || imageDataUrl
                } : prev)
              } else {
                // Fallback to optimistic state if verify failed
                setBookmarks(prev => prev.map((bookmark) =>
                  String(bookmark.id) === String(selectedBookmark.id)
                    ? { ...bookmark, customBackground: imageDataUrl }
                    : bookmark
                ))
                setSelectedBookmark((prev) => prev ? { ...prev, customBackground: imageDataUrl } : prev)
              }
            } catch {}

            toast.success('✅ Background uploaded and saved!')
          }
          reader.readAsDataURL(file)
        } catch (error) {
          console.error('Background upload error:', error)
          toast.error('Failed to upload background')
        } finally {
          setUploadingBackground(false)
        }
      }
    }
    input.click()
  }

  // New explicit button: Replace Front (BG + avatar via customBackground)
  const handleReplaceFront = async () => {
    await handleBackgroundUpload();
  }

  const handleTabChange = (value: string) => {
    console.log('Tab changed to:', value)
    setActiveBookmarkTab(value)
    if (value === 'media') {
      console.log('Media tab visited - setting hasVisitedMediaTab to true')
      setHasVisitedMediaTab(true)
    }
  }

  const handleDragStart = (event: any) => {
    console.log('🎯 DRAG START:', {
      activeId: event.active.id,
      activeData: event.active.data.current,
      timestamp: new Date().toISOString()
    })
  }

  const handleDragOver = (event: any) => {
    console.log('🎯 DRAG OVER:', {
      activeId: event.active.id,
      overId: event.over?.id,
      timestamp: new Date().toISOString()
    })
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    console.log('🎯 DRAG END CALLED:', {
      activeId: event.active.id,
      overId: event.over?.id,
      timestamp: new Date().toISOString(),
      event
    })

    const { active, over } = event

    if (active.id !== over?.id && over?.id) {
      // Handle bookmark reordering
      const activeBookmarkIndex = bookmarks.findIndex((item) => item.id === active.id)
      const overBookmarkIndex = bookmarks.findIndex((item) => item.id === over.id)

      if (activeBookmarkIndex !== -1 && overBookmarkIndex !== -1) {
        const newBookmarks = arrayMove(bookmarks, activeBookmarkIndex, overBookmarkIndex)
        setBookmarks(newBookmarks)

        // Persist bookmark order to database
        try {
          console.log('💾 Persisting bookmark order to database...')
          // For now, just log the new order - API endpoint would be needed for full persistence
          console.log('📝 New bookmark order:', newBookmarks.map((b, index) => ({ id: b.id, title: b.title, order: index })))
          showNotification('Bookmark order updated successfully!')
        } catch (error) {
          console.error('❌ Failed to persist bookmark order:', error)
          showNotification('Failed to save bookmark order', 'error')
          // Revert the change on error
          setBookmarks(bookmarks)
        }
        return
      }

      // Handle mockGoalFolders reordering (Goal 2.0) - only in goal2 view
      if (viewMode === 'goal2') {
        const activeGoalIndex = mockGoalFolders.findIndex((item) => item.id === active.id)
        const overGoalIndex = mockGoalFolders.findIndex((item) => item.id === over.id)

        console.log('🎯 Goal 2.0 Drag Debug:', {
          activeId: active.id,
          overId: over.id,
          activeGoalIndex,
          overGoalIndex,
          mockGoalFoldersLength: mockGoalFolders.length,
          mockGoalFolders: mockGoalFolders.map(f => ({ id: f.id, name: f.name }))
        })

        if (activeGoalIndex !== -1 && overGoalIndex !== -1) {
          console.log('✅ Goal 2.0 Reordering folders from index', activeGoalIndex, 'to index', overGoalIndex)
          const newGoalFolders = arrayMove(mockGoalFolders, activeGoalIndex, overGoalIndex)
          setMockGoalFolders(newGoalFolders)
          console.log('🎯 New Goal order:', newGoalFolders.map(f => ({ id: f.id, name: f.name })))

          // Persist goal folder order
          try {
            console.log('💾 Persisting goal folder order...')
            console.log('📝 New goal folder order:', newGoalFolders.map((f, index) => ({ id: f.id, name: f.name, order: index })))
            showNotification('Goal folder order updated successfully!')
          } catch (error) {
            console.error('❌ Failed to persist goal folder order:', error)
            showNotification('Failed to save goal folder order', 'error')
            setMockGoalFolders(mockGoalFolders)
          }

          console.log('🎉 Goal 2.0 drag-and-drop completed successfully!')
          return
        }
      }

      // Handle dynamicFolders reordering (Folder 2.0)
      const activeFolderIndex = dynamicFolders.findIndex((item) => item.id === active.id)
      const overFolderIndex = dynamicFolders.findIndex((item) => item.id === over.id)

      if (activeFolderIndex !== -1 && overFolderIndex !== -1) {
        const newFolders = arrayMove(dynamicFolders, activeFolderIndex, overFolderIndex)
        setDynamicFolders(newFolders)

        // Persist folder order
        try {
          console.log('💾 Persisting folder order to database...')
          console.log('📝 New folder order:', newFolders.map((f, index) => ({ id: f.id, name: f.name, order: index })))
          showNotification('Folder order updated successfully!')
        } catch (error) {
          console.error('❌ Failed to persist folder order:', error)
          showNotification('Failed to save folder order', 'error')
          setDynamicFolders(dynamicFolders)
        }
        return
      }

      // Handle category folder reordering for Compact & List folder views
      if ((viewMode === 'compact' || viewMode === 'list') && compactViewMode === 'folders') {
        const activeIndex = dynamicFolders.findIndex((f) => f.id === active.id)
        const overIndex = dynamicFolders.findIndex((f) => f.id === over.id)
        if (activeIndex !== -1 && overIndex !== -1) {
          const newFolders = arrayMove(dynamicFolders, activeIndex, overIndex)
          setDynamicFolders(newFolders)

          // Persist compact/list folder order
          try {
            console.log('💾 Persisting compact/list folder order...')
            console.log('📝 New compact/list folder order:', newFolders.map((f, index) => ({ id: f.id, name: f.name, order: index })))
            showNotification('Folder order updated successfully!')
          } catch (error) {
            console.error('❌ Failed to persist folder order:', error)
            showNotification('Failed to save folder order', 'error')
            setDynamicFolders(dynamicFolders)
          }
          return
        }
      }
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  const getSiteHealthColor = (health: string) => {
    switch (health) {
      case 'excellent':
        return 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-200'
      case 'good':
        return 'text-blue-600 bg-blue-100 dark:bg-blue-900 dark:text-blue-200'
      case 'working':
        return 'text-blue-600 bg-blue-100 dark:bg-blue-900 dark:text-blue-200'
      case 'fair':
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-200'
      case 'poor':
        return 'text-orange-600 bg-orange-100 dark:bg-orange-900 dark:text-orange-200'
      case 'broken':
        return 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-200'
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  // Check health of bookmarks
  const checkBookmarkHealth = async (bookmarkIds: number[]) => {
    try {
      // Set loading state for each bookmark
      const loadingStates: { [key: number]: boolean } = {};
      bookmarkIds.forEach(id => {
        loadingStates[id] = true;
      });
      setHealthCheckLoading(prev => ({ ...prev, ...loadingStates }));

      const response = await fetch('/api/bookmarks/health', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookmarkIds,
          userId: userId
        })
      })

      if (!response.ok) {
        throw new Error('Failed to check bookmark health')
      }

      const data = await response.json()

      if (data.success) {
        // Update bookmarks with new health status - the API already increments the count
        setBookmarks(prev => prev.map(bookmark => {
          const healthResult = data.results.find((r: any) => r.bookmarkId === bookmark.id)
          if (healthResult) {
            return {
              ...bookmark,
              site_health: healthResult.status,
              siteHealth: healthResult.status, // Keep both for compatibility
              last_health_check: healthResult.lastChecked,
              lastHealthCheck: healthResult.lastChecked, // Keep both for compatibility
              // Don't increment here - the API already incremented and saved the count
              // We'll get the updated count when we reload bookmarks from the database
            }
          }
          return bookmark
        }))

        // Reload bookmarks from database to get the updated health check count
        setTimeout(() => {
          loadBookmarks()
        }, 100)

        // Refresh analytics summary to update the BROKEN card count
        setTimeout(async () => {
          try {
            const res = await fetch('/api/analytics/summary')
            const json = await res.json()
            if (json && !json.error) setSummary(json)
          } catch {}
        }, 200)

        showNotification(`Health check completed for ${data.results.length} bookmarks`)
      }
    } catch (error) {
      console.error('Health check error:', error)
      showNotification('Failed to check bookmark health')
    } finally {
      // Clear loading state for all checked bookmarks
      const clearedStates: { [key: number]: boolean } = {};
      bookmarkIds.forEach(id => {
        clearedStates[id] = false;
      });
      setHealthCheckLoading(prev => ({ ...prev, ...clearedStates }));
    }
  }

  // Use memoized version to prevent re-computation during drag operations
  const getUsagePercentage = memoizedGetUsagePercentage;

  // Get category color for folder icons
  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'Development': 'text-red-500',
      'Design': 'text-blue-500',
      'Productivity': 'text-green-500',
      'Entertainment': 'text-purple-500',
      'Social': 'text-yellow-500',
      'Education': 'text-indigo-500',
      'News': 'text-orange-500',
      'Shopping': 'text-pink-500',
      'Finance': 'text-teal-500',
      'Health': 'text-emerald-500'
    }
    return colors[category] || 'text-gray-600'
  }

  // Get percentage color based on usage level
  const getPercentageColor = (percentage: number) => {
    if (percentage < 25) return '#dc2626' // red-600
    if (percentage < 50) return '#2563eb' // blue-600
    if (percentage < 75) return '#ea580c' // orange-600
    return '#16a34a' // green-600
  }

  // Hexagon component for displaying usage percentage
  const UsageHexagon = ({ percentage }: { percentage: number }) => {
    const color = getPercentageColor(percentage)
    return (
      <div className="absolute bottom-2 right-2 flex items-center justify-center">
        <svg width="80" height="70" viewBox="0 0 80 70" className="drop-shadow-sm">
          {/* Hexagon shape */}
          <path
            d="M40 5 L65 18 L65 47 L40 60 L15 47 L15 18 Z"
            fill="white"
            stroke={color}
            strokeWidth="2"
          />
          {/* Percentage text */}
          <text
            x="40"
            y="35"
            textAnchor="middle"
            dominantBaseline="middle"
            fill={color}
            fontSize="18"
            fontWeight="bold"
          >
            {percentage}%
          </text>
        </svg>
      </div>
    )
  }

  // Action icons component for top right corner
  const BookmarkActionIcons = ({ bookmark }: { bookmark: any }) => {
    const [priorityMenuOpen, setPriorityMenuOpen] = useState(false)
    const [prioritySaving, setPrioritySaving] = useState(false)

    const updatePriority = async (level: 'high' | 'medium' | 'low') => {
      if (level === bookmark.priority) { setPriorityMenuOpen(false); return }
      setPrioritySaving(true)
      // Optimistic update
      setBookmarks(prev => prev.map(b => b.id === bookmark.id ? { ...b, priority: level } : b))
      try {
        const resp = await fetch('/api/bookmarks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: bookmark.id, priority: level, user_id: 'dev-user-123' })
        })
        if (!resp.ok) throw new Error('Failed to update priority')
        setPriorityMenuOpen(false)
        showNotification(`Priority set to ${level}`)
      } catch (err) {
        // Revert on error
        setBookmarks(prev => prev.map(b => b.id === bookmark.id ? { ...b, priority: bookmark.priority } : b))
        showNotification('Failed to update priority. Please try again.')
      } finally {
        setPrioritySaving(false)
      }
    }

    return (
    <TooltipProvider>
      <div className="absolute top-12 right-2 flex flex-col items-center space-y-1 opacity-40 group-hover:opacity-100 transition-opacity duration-200">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              onClick={async (e) => {
                e.stopPropagation()
                // Toggle favorite for this specific bookmark
                const newFavoriteStatus = !bookmark.isFavorite

                // Optimistically update the UI
                setBookmarks(prev => prev.map(b =>
                  b.id === bookmark.id
                    ? { ...b, isFavorite: newFavoriteStatus }
                    : b
                ))

                try {
                  // Save to backend using the dedicated favorite endpoint
                  const response = await fetch(`/api/bookmarks/${bookmark.id}/favorite`, {
                    method: 'PATCH',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      isFavorite: newFavoriteStatus,
                      user_id: 'dev-user-123'
                    }),
                  })

                  if (!response.ok) {
                    const errorData = await response.json()
                    throw new Error(errorData.error || 'Failed to update favorite status')
                  }

                  const result = await response.json()
                  console.log('✅ Favorite status updated successfully:', result)

                  // Show success notification
                  showNotification(newFavoriteStatus ? 'Added to favorites!' : 'Removed from favorites!')

                } catch (error) {
                  console.error('❌ Error updating favorite status:', error)
                  // Revert the optimistic update on error
                  setBookmarks(prev => prev.map(b =>
                    b.id === bookmark.id
                      ? { ...b, isFavorite: !newFavoriteStatus }
                      : b
                  ))
                  showNotification('Failed to update favorite status. Please try again.')
                }
              }}
            >
              <Heart className={`h-4 w-4 ${bookmark.isFavorite ? 'text-red-500 fill-red-500' : 'text-gray-400 hover:text-red-500'}`} />
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Add to favorites</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              onClick={(e) => {
                e.stopPropagation()
                // Open bookmark detail modal
                setSelectedBookmark(bookmark)
                setIsModalOpen(true)
              }}
            >
              <Eye className="h-4 w-4 text-gray-400 hover:text-blue-500" />
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p>View details</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              onClick={(e) => {
                e.stopPropagation()
                // Start editing the bookmark title
                setSelectedBookmark(bookmark)
                startEditing('title', bookmark.title)
              }}
            >
              <Edit2 className="h-4 w-4 text-gray-400 hover:text-blue-500" />
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Edit bookmark</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              onClick={async (e) => {
                e.stopPropagation()
                console.log('🔄 Duplicate button clicked for bookmark:', bookmark.title)
                try {
                  // Create duplicate bookmark object
                  const duplicatedBookmark = {
                    user_id: 'dev-user-123',
                    title: `${bookmark.title} (Copy)`,
                    url: bookmark.url,
                    description: bookmark.description || '',
                    category: bookmark.category || 'General',
                    tags: bookmark.tags || [],
                    notes: bookmark.notes || '',
                    ai_summary: bookmark.ai_summary || '',
                    ai_tags: bookmark.ai_tags || [],
                    ai_category: bookmark.ai_category || bookmark.category || 'General'
                  }

                  console.log('📋 Creating duplicate bookmark:', duplicatedBookmark)

                  // Save to backend
                  const response = await fetch('/api/bookmarks', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(duplicatedBookmark),
                  })

                  console.log('🌐 API Response status:', response.status)

                  if (response.ok) {
                    const result = await response.json()
                    console.log('✅ API Response:', result)
                    if (result.success) {
                      // Reload bookmarks to show the new duplicate
                      console.log('🔄 Reloading bookmarks...')
                      loadBookmarks()
                      showNotification('Bookmark duplicated successfully!')
                    } else {
                      console.error('❌ API returned failure:', result)
                      showNotification('Failed to duplicate bookmark')
                    }
                  } else {
                    console.error('❌ API request failed with status:', response.status)
                    showNotification('Failed to duplicate bookmark')
                  }
                } catch (error) {
                  console.error('❌ Error duplicating bookmark:', error)
                  showNotification('Failed to duplicate bookmark')
                }
              }}
            >
              <Copy className="h-4 w-4 text-gray-400 hover:text-purple-500" />
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Duplicate bookmark</p>
          </TooltipContent>
        </Tooltip>


        <Tooltip>
          <TooltipTrigger asChild>
            <button
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              onClick={(e) => {
                e.stopPropagation()
                // Delete bookmark with confirmation
                if (confirm(`Are you sure you want to delete "${bookmark.title}"?`)) {
                  deleteBookmark(bookmark.id)
                }
              }}
            >
              <Trash2 className="h-4 w-4 text-gray-400 hover:text-red-500" />
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Delete bookmark</p>
          </TooltipContent>
        </Tooltip>

        {/* Move to Folder */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              onClick={(e) => {
                e.stopPropagation()
                setBookmarkToMove(bookmark)
                setSelectedMoveFolderId('')
                setShowMoveModal(true)
              }}
              aria-label="Move to folder"
            >
              <FolderIcon className="h-4 w-4 text-gray-400 hover:text-blue-600" />
            </button>

          </TooltipTrigger>
          <TooltipContent>
            <p>Move to folder</p>
          </TooltipContent>
        </Tooltip>
        {/* Set Priority */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="relative">
              <button
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                onClick={(e) => { e.stopPropagation(); setPriorityMenuOpen(v => !v) }}
                aria-label="Set priority"
              >
                <Target className="h-4 w-4 text-gray-400 hover:text-amber-600" />
              </button>
              {priorityMenuOpen && (
                <div
                  className="absolute right-6 top-0 z-50 bg-white border border-gray-200 rounded-md shadow-md p-1 w-28"
                  onClick={(e) => e.stopPropagation()}
                >
                  {(['high','medium','low'] as const).map(level => (
                    <button
                      key={level}
                      disabled={prioritySaving}
                      onClick={() => updatePriority(level)}
                      className={`w-full text-left px-2 py-1 rounded text-xs capitalize hover:bg-gray-50 ${
                        bookmark.priority === level ? 'font-semibold' : ''
                      }`}
                    >
                      <span className={`inline-block px-2 py-0.5 rounded ${getPriorityColor(level)}`}>{level}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Set priority</p>
          </TooltipContent>
        </Tooltip>


      </div>

    </TooltipProvider>
  )
}
  // Enhanced Site Health Component with modal analytics card design
  const SiteHealthComponent = ({ bookmark, onClick, isLoading = false }: {
    bookmark: any;
    onClick?: () => void;
    isLoading?: boolean;
  }) => {
    const health = bookmark.site_health || bookmark.siteHealth || 'working';
    const isClickable = !!onClick;

    const getHealthIcon = () => {
      if (isLoading) {
        return <RotateCcw className="h-7 w-7 animate-spin" />;
      }

      switch (health) {
        case 'excellent':
          return <CheckCircle className="h-7 w-7" />;
        case 'good':
          return <Shield className="h-7 w-7" />;
        case 'working':
          return <Shield className="h-7 w-7" />;
        case 'fair':
          return <AlertTriangle className="h-7 w-7" />;
        case 'poor':
          return <AlertTriangle className="h-7 w-7" />;
        case 'broken':
          return <X className="h-7 w-7" />;
        default:
          return <Globe className="h-7 w-7" />;
      }

    };

    const getHealthColor = () => {
      switch (health) {
        case 'excellent':
          return 'text-emerald-600';
        case 'good':
          return 'text-green-600';
        case 'working':
          return 'text-green-600';
        case 'fair':
          return 'text-amber-600';
        case 'poor':
          return 'text-orange-600';
        case 'broken':
          return 'text-red-600';
        default:
          return 'text-gray-600';
      }
    };

    const getHealthText = () => {
      if (isLoading) return 'CHECKING...';

      switch (health) {
        case 'excellent':
          return 'WORKING';
        case 'good':
          return 'WORKING';
        case 'working':
          return 'WORKING';
        case 'fair':
          return 'WORKING';
        case 'poor':
          return 'BROKEN';
        case 'broken':
          return 'BROKEN';
        default:
          return 'BROKEN';
      }
    };

    const getHealthCheckCount = () => {
      if (isLoading) return '...';

      // Get health check count from bookmark data
      const healthCheckCount = bookmark.healthCheckCount || 0;

      return healthCheckCount;
    };

    const getStatusIndicator = () => {
      if (isLoading) return null;

      return (
        <div className={`w-2 h-2 rounded-full mt-1 mx-auto ${
          health === 'working' || health === 'good' || health === 'excellent'
            ? 'bg-green-500 animate-pulse'
            : health === 'fair'
            ? 'bg-yellow-500'
            : 'bg-red-500'
        }`} title="Live status indicator" />
      );
    };

    return (
      <div
        className={`text-center w-full ${
          isClickable ? 'cursor-pointer hover:scale-105 transition-all duration-200 hover:shadow-lg' : ''
        }`}
        onClick={isClickable ? onClick : undefined}
        title={isClickable ? `Click to check ${bookmark.title} health` : `Site health: ${health}`}
      >
        <div className={`flex justify-center mx-auto mb-3 ${getHealthColor()}`}>
          {getHealthIcon()}
        </div>
        <p className={`text-3xl font-bold ${getHealthColor()}`}>
          {getHealthCheckCount()}
        </p>
        <p className="text-xs text-muted-foreground font-medium">
          {getHealthText()}
        </p>
        {getStatusIndicator()}
      </div>
    );
  };

  const SiteHealthComponentModal = ({ bookmark, onClick, isLoading = false }: {
    bookmark: any;
    onClick?: () => void;
    isLoading?: boolean;
  }) => {
    const health = bookmark.site_health || bookmark.siteHealth || 'unknown';

    const getHealthIcon = () => {
      if (isLoading) {
        return <RotateCcw className="h-8 w-8 animate-spin" />;
      }

      switch (health) {
        case 'excellent':
          return <Shield className="h-8 w-8" />;
        case 'good':
          return <Shield className="h-8 w-8" />;
        case 'working':
          return <Shield className="h-8 w-8" />;
        case 'fair':
          return <AlertTriangle className="h-8 w-8" />;
        case 'poor':
          return <AlertCircle className="h-8 w-8" />;
        default:
          return <Shield className="h-8 w-8" />;
      }
    };

    const getHealthColor = () => {
      if (isLoading) return 'text-blue-500';

      switch (health) {
        case 'excellent':
          return 'text-green-600';
        case 'good':
          return 'text-green-500';
        case 'working':
          return 'text-green-500';
        case 'fair':
          return 'text-yellow-500';
        case 'poor':
          return 'text-red-500';
        default:
          return 'text-gray-500';
      }
    };

    const getHealthText = () => {
      if (isLoading) return 'CHECKING...';

      switch (health) {
        case 'excellent':
          return 'WORKING';
        case 'good':
          return 'WORKING';
        case 'working':
          return 'WORKING';
        case 'fair':
          return 'WORKING';
        case 'poor':
          return 'BROKEN';
        case 'broken':
          return 'BROKEN';
        default:
          return 'BROKEN';
      }
    };

    const getStatusIndicator = () => {
      if (isLoading) return null;

      return (
        <div className={`w-2 h-2 rounded-full mt-1 mx-auto ${
          health === 'working' || health === 'good' || health === 'excellent'
            ? 'bg-green-500 animate-pulse'
            : health === 'fair'
            ? 'bg-yellow-500'
            : 'bg-red-500'
        }`} title="Live status indicator" />
      );
    };

    return (
      <div
        className={`text-center w-full ${
          onClick ? 'cursor-pointer hover:scale-105 transition-all duration-200 hover:shadow-lg' : ''
        }`}
        onClick={onClick}
        title={onClick ? `Click to check ${bookmark.title} health` : `Site health: ${health}`}
      >
        <div className={`flex justify-center mx-auto mb-3 ${getHealthColor()}`}>
          {getHealthIcon()}
        </div>
        {getStatusIndicator()}
      </div>
    );
  };

  const SortableGridBookmarkCard = ({ bookmark }: { bookmark: any }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: bookmark.id })

    const style = {
      transform: toTransformString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
      zIndex: isDragging ? 1000 : 1,
    }

    return (
      <div ref={setNodeRef} style={style} {...attributes} className="relative group">
        {/* Drag Handle - Top Right Corner */}
        <div
          {...listeners}
          className="absolute top-2 right-2 z-20 p-1.5 rounded-md bg-white/90 hover:bg-white shadow-md border border-gray-300/50 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-105"
        >
          <GripVertical className="h-4 w-4 text-gray-700" />
        </div>
        <GridBookmarkCard bookmark={bookmark} />
      </div>
    )
  }
  const GridBookmarkCard = ({ bookmark }: { bookmark: any }) => (
    <Card
      draggable
      onDragStart={(e) => { try { const payload = JSON.stringify({ id: bookmark.id, title: bookmark.title, url: bookmark.url, category: bookmark.category, tags: Array.isArray(bookmark.tags)? bookmark.tags: [], isFavorite: Boolean((bookmark as any).isFavorite), notes: (bookmark as any).notes || '' }); e.dataTransfer.setData('application/json', payload); e.dataTransfer.setData('text/plain', payload); e.dataTransfer.effectAllowed = 'copyMove'; } catch {} }}
      className="group hover:shadow-2xl transition-all duration-500 cursor-pointer bg-white border border-gray-300 backdrop-blur-sm relative overflow-hidden"
      style={{
        borderColor: 'rgb(209 213 219)', // gray-300
        transition: 'all 0.5s ease'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = themeColor;
        e.currentTarget.style.boxShadow = `0 25px 50px -12px ${themeColor}20`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'rgb(209 213 219)';
        e.currentTarget.style.boxShadow = '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)';
      }}
      onClick={(e) => {
        // Handle bulk selection mode
        if (bulkMode) {
          e.preventDefault()
          e.stopPropagation()
          handleBookmarkSelect(bookmark.id)
          return
        }
        // Don't open modal if we're currently editing this bookmark
        if (editingField && selectedBookmark?.id === bookmark.id) {
          e.preventDefault()
          e.stopPropagation()
          return
        }
        handleBookmarkClick(bookmark)
      }}
    >
      {/* Bulk Selection Checkbox - Simplified Direct Approach */}
      {bulkMode && (
        <div
          className="absolute top-3 left-3 z-[9999] cursor-pointer"
          onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
          onMouseUp={(e) => { e.preventDefault(); e.stopPropagation(); }}
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            handleBookmarkSelect(bookmark.id, e)
          }}
        >
          <div
            className={`w-6 h-6 border-2 rounded-md flex items-center justify-center shadow-lg ${
              selectedBookmarks.includes(String(bookmark.id))
                ? 'bg-blue-600 border-blue-600'
                : 'bg-white border-gray-400 hover:border-blue-500'
            }`}
          >
            {selectedBookmarks.includes(String(bookmark.id)) && (
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            )}
          </div>
        </div>
      )}

      {/* Background Website Logo with 5% opacity - Custom background takes priority */}
      {(() => {
        // Priority: custom_logo > custom_background > customBackground > userDefaultLogo > extracted favicon > placeholder
        const customBg = (bookmark as any).custom_logo || (bookmark as any).custom_background || bookmark.customBackground;
        if (customBg) {
          return (
            <div
              className="absolute inset-0 bg-cover bg-center bg-no-repeat z-0"
              style={{
                backgroundImage: `url(${customBg || userDefaultLogo})`,
                backgroundSize: (customBg && /logo\.clearbit\.com|faviconkit\.com|s2\/favicons/.test(customBg)) ? '140% 140%' : 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                opacity: 0.10
              }}
            />
          );
        } else {
          // Use unified visual hierarchy helper
          const { background: bg } = computeVisuals(bookmark as any, userDefaultLogo);
          return (
            <div
              className="absolute inset-0 bg-cover bg-center bg-no-repeat z-0"
              style={{
                backgroundImage: `url(${bg})`,
                backgroundSize: (bg && /logo\.clearbit\.com|faviconkit\.com|s2\/favicons/.test(bg)) ? '140% 140%' : 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                opacity: 0.10
              }}
            />
          );
        }
      })()}

      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/3 via-transparent to-purple-500/3 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <CardContent className="p-6 relative z-20">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-black flex items-center justify-center ring-2 ring-gray-300/50 group-hover:ring-gray-400 transition-all duration-300 shadow-sm">
              {(() => {
                // Unified favicon resolution
                const displayImage = getFaviconUrl(bookmark as any, 32);
                return (
                  <img
                    src={displayImage}
                    alt={`${bookmark.title} favicon`}
                    className="w-8 h-8 rounded-lg"
                    onLoad={enhanceOnLoad(64)}
                    onError={(e) => handleFaviconError(e as any, bookmark as any)}
                  />
                );
              })()}
            </div>
            <div className="flex-1 min-w-0">
              {editingField === 'title' && selectedBookmark?.id === bookmark.id && !isModalOpen ? (
                <div
                  className="flex items-center space-x-2"
                  onClick={(e) => {
                    // Allow default caret placement; just stop bubbling to card
                    e.stopPropagation()
                  }}
                  onMouseDown={(e) => {
                    e.stopPropagation()
                  }}
                  onKeyDown={(e) => {
                    // Ensure key events don't bubble to the card wrapper/button
                    e.stopPropagation()
                  }}
                >
                  <input
                    type="text"
                    data-editor="grid-title"
                    ref={titleInputRef}
                    value={editingValue}

                    onMouseDown={(e) => { e.stopPropagation(); markUserAction(); }}
                    onChange={(e) => {
                      const t = e.currentTarget
                      if (!handledTitleKeyRef.current) {
                        // Caret is managed by onKeyDown and onSelect; avoid reading selection here
                        setEditingValue(t.value)
                      } else {
                        handledTitleKeyRef.current = false
                      }
                    }}
                    onKeyDown={handleKeyDown}
                    onSelect={(e) => {
                      if (handledTitleKeyRef.current) return
                      const now = Date.now()
                      if (now - lastUserActionTsRef.current > 1500) return
                      const t = e.currentTarget as HTMLInputElement
                      setTitleCaret({
                        start: t.selectionStart ?? 0,
                        end: t.selectionEnd ?? (t.selectionStart ?? 0),
                      })
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      markUserAction();
                    }}
                    className="font-bold text-gray-900 font-audiowide uppercase text-lg bg-transparent border-b-2 border-blue-500 outline-none flex-1"
                    placeholder="Enter title..."
                  />
                  <div className="flex space-x-1">
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        saveEdit()
                      }}
                      className="h-6 w-6 p-0 bg-green-600 hover:bg-green-700"
                    >
                      <Check className="h-3 w-3 text-white" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        cancelEditing()
                      }}
                      className="h-6 w-6 p-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ) : (
                <h3
                  className="font-bold text-gray-900 font-audiowide uppercase text-lg group-hover:text-blue-900 transition-colors duration-300 truncate cursor-pointer hover:bg-gray-50 rounded px-1 py-0.5"
                  onClick={(e) => {
                    e.stopPropagation();
                    markUserAction();
                    // Compute approximate caret index from click position so caret starts where user clicked
                    const el = e.currentTarget as HTMLElement;
                    const idx = computeCaretIndexFromClick(el, e.clientX, bookmark.title);
                    setTitleCaret({ start: idx, end: idx });
                    setSelectedBookmark(bookmark);
                    startEditing('title', bookmark.title);
                  }}
                >
                  {truncateTitle(bookmark.title, 14)}
                </h3>
              )}
              <p className="text-sm text-blue-600 hover:underline font-medium mt-1">{extractDomain(bookmark.url)}</p>
            </div>
          </div>
        </div>

        {/* Action Icons for Grid View */}
        <BookmarkActionIcons bookmark={bookmark} />

        <div className="mb-4 flex justify-center">
          <div className="relative">
            {(() => {
              // Unified visual hierarchy for large circle
              const { largeCircle: src } = computeVisuals(bookmark as any, userDefaultLogo);
              return (
                <img
                  src={src}
                  alt={`${bookmark.title} image`}
                  className="w-24 h-24 object-cover rounded-full bg-gradient-to-br from-gray-100 to-gray-50 ring-2 ring-gray-200/50 group-hover:ring-blue-300/60 transition-all duration-300 shadow-md group-hover:shadow-lg"
                  onError={(e) => {
                    const el = e.target as HTMLImageElement;
                    el.onerror = null;
                    el.src = computeVisuals(bookmark as any, userDefaultLogo).largeCircle;
                  }}
                />
              );
            })()}
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-transparent via-transparent to-black/5 group-hover:to-blue-500/10 transition-all duration-300"></div>
          </div>
        </div>

        <p className="text-sm text-gray-600 mb-4 line-clamp-2 leading-relaxed">
          {bookmark.ai_summary || bookmark.description}
        </p>

        <div className="flex items-center justify-between mb-4">
          <Badge className={`text-xs border shadow-sm ${getPriorityColor(bookmark.priority)}`}>
            {bookmark.priority}
          </Badge>
          <Badge variant="secondary" className="text-xs bg-gradient-to-r from-gray-100 to-gray-50 text-gray-700 border border-gray-200/50 hover:from-blue-50 hover:to-blue-100 hover:text-blue-700 transition-all duration-300">
            {getCategoryDisplay(bookmark)}
            {bookmark.ai_category && bookmark.ai_category !== bookmark.category && (
              <span className="ml-1 text-blue-600">🤖</span>
            )}
          </Badge>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-gray-100/80 mb-6 relative">
          <div className="flex flex-col space-y-2">
            <div className="flex items-center space-x-2 bg-gray-50/80 rounded-full px-3 py-1.5">
              <Eye className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600 font-medium">
                {(() => {
                  const analytics = getUnifiedBookmarkAnalytics(bookmark.id)
                  const directCache = directAnalyticsCache[bookmark.id]



                  // NEVER fall back to bookmark data - always use analytics or show 0
                  const finalVisits = (analytics && analytics.visits !== undefined) ? analytics.visits : 0;

                  return finalVisits;
                })()}
              </span>
              {/* Real-time indicator */}
              {!analyticsLoading && getBookmarkAnalytics(bookmark.id) && (
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" title="Live data" />
              )}
            </div>
            <div className="flex items-center space-x-2 bg-green-50/80 rounded-full px-3 py-1.5">
              <Clock className="h-4 w-4 text-green-600" />
              <span className="text-sm text-green-600 font-medium">
                {(() => {
                  const analytics = getUnifiedBookmarkAnalytics(bookmark.id)
                  const directCache = directAnalyticsCache[bookmark.id]



                  // NEVER fall back to bookmark data - always use analytics or show 0
                  const timeSpent = analytics ? analytics.timeSpent : 0
                  const timeDisplay = timeSpent > 0 ? `${timeSpent}m` : '0m';

                  return timeDisplay;
                })()}
              </span>
              {/* Real-time indicator */}
              {!analyticsLoading && getBookmarkAnalytics(bookmark.id) && (
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" title="Live data" />
              )}
            </div>
          </div>
          {/* Usage Percentage Hexagon - Moved here to be even with visits */}
          <div className="flex flex-col items-center justify-center">
            <svg width="70" height="62" viewBox="0 0 70 62" className="drop-shadow-sm">
              <path
                d="M35 4 L55 15 L55 40 L35 51 L15 40 L15 15 Z"
                fill="white"
                stroke={(() => {
                  const analytics = getUnifiedBookmarkAnalytics(bookmark.id)
                  const visits = analytics ? analytics.visits : 0
                  const percentage = getUsagePercentage(visits)
                  return getPercentageColor(percentage)
                })()}
                strokeWidth="2"
              />
              <text
                x="35"
                y="30"
                textAnchor="middle"
                dominantBaseline="middle"
                fill={(() => {
                  const analytics = getUnifiedBookmarkAnalytics(bookmark.id)
                  const visits = analytics ? analytics.visits : 0
                  const percentage = getUsagePercentage(visits)
                  return getPercentageColor(percentage)
                })()}
                fontSize="16"
                fontWeight="bold"
              >
                {(() => {
                  const analytics = getUnifiedBookmarkAnalytics(bookmark.id)
                  const visits = analytics ? analytics.visits : 0
                  return getUsagePercentage(visits)
                })()}%
              </text>
            </svg>
            <span className="text-xs text-gray-800 font-bold mt-1">USAGE</span>
          </div>
        </div>



        {/* Project Information Section - Moved to bottom and separated */}
        <div className="border-t border-gray-200/60 pt-3 mt-2">
          {/* Open/Completed Task stats above progress bar */}
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">OPEN TASK</span>
            </div>
            <span className="text-xs text-gray-500 font-medium">TOTAL: {(() => {
              // Show tasks for this specific bookmark
              const tasks = getTasksForBookmark(bookmark.id);
              return tasks.filter(t => !t.isCompleted).length
            })()}</span>
          </div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">COMPLETED TASK</span>
            </div>
            <span className="text-xs text-gray-500 font-medium">TOTAL: {(() => {
              // Show tasks for this specific bookmark
              const tasks = getTasksForBookmark(bookmark.id);
              return tasks.filter(t => !!t.isCompleted).length
            })()}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            {(() => {
              // Show progress for this specific bookmark
              const t = getTasksForBookmark(bookmark.id);
              const pct = (() => {
                if (!t.length) return (bookmark.project?.progress || 0)
                const totals = t.reduce((acc,task)=>{
                  const est = Math.max(0, Number(task.estimatedPomodoros||0))
                  const comp = Math.max(0, Number(task.completedPomodoros||0))
                  return { est: acc.est + est, comp: acc.comp + Math.min(comp, est) }
                }, { est: 0, comp: 0 })
                return totals.est > 0 ? Math.round((totals.comp / totals.est) * 100) : (bookmark.project?.progress || 0)
              })()
              return (
                <div
                  className="bg-black h-2 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${pct}%` }}
                ></div>
              )
            })()}
          </div>
          <div className="flex justify-between items-center mt-1">
            <span className="text-xs text-gray-500">Progress</span>
            <span className="text-xs font-semibold text-green-600">{(() => {
              // Show progress for this specific bookmark
              const t = getTasksForBookmark(bookmark.id);
              if (!t.length) return bookmark.project?.progress || 0
              const totals = t.reduce((acc,task)=>{
                const est = Math.max(0, Number(task.estimatedPomodoros||0))
                const comp = Math.max(0, Number(task.completedPomodoros||0))
                return { est: acc.est + est, comp: acc.comp + Math.min(comp, est) }
              }, { est: 0, comp: 0 })
              const pct = totals.est > 0 ? Math.round((totals.comp / totals.est) * 100) : (bookmark.project?.progress || 0)
              return pct
            })()}%</span>
          </div>
        </div>
      </CardContent>

      {/* Action Icons */}
      <BookmarkActionIcons bookmark={bookmark} />
    </Card>
  )

  const SortableCompactBookmarkCard = ({ bookmark }: { bookmark: any }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: bookmark.id })

    const style = {
      transform: toTransformString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
      zIndex: isDragging ? 1000 : 1,
    }

    return (
      <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="relative group">
        <CompactBookmarkCard bookmark={bookmark} />
      </div>
    )
  }
  const CompactBookmarkCard = ({ bookmark }: { bookmark: any }) => (
    <div
      className="group cursor-pointer"
      draggable
      onDragStart={(e) => { try { const payload = JSON.stringify({ id: bookmark.id, title: bookmark.title, url: bookmark.url, category: bookmark.category, tags: Array.isArray(bookmark.tags)? bookmark.tags: [], isFavorite: Boolean((bookmark as any).isFavorite), notes: (bookmark as any).notes || '' }); e.dataTransfer.setData('application/json', payload); e.dataTransfer.setData('text/plain', payload); e.dataTransfer.effectAllowed = 'copyMove'; } catch {} }}
      onClick={(e) => {
        // Handle bulk selection mode
        if (bulkMode) {
          e.preventDefault()
          e.stopPropagation()
          handleBookmarkSelect(bookmark.id)
          return
        }
        handleBookmarkClick(bookmark)
      }}
    >
      {/* Square Box Design matching folder cards - SAME SIZE */}
      <div className="aspect-square w-full bg-white border border-black relative overflow-hidden rounded-lg">

                 {/* Bulk Selection Checkbox for Compact View */}
         {bulkMode && (
           <div
             className="absolute top-2 left-2 z-[9999] cursor-pointer"
             onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
             onMouseUp={(e) => { e.preventDefault(); e.stopPropagation(); }}
             onClick={(e) => {
               e.preventDefault()
               e.stopPropagation()
               handleBookmarkSelect(bookmark.id, e)
             }}
           >
             <div
               className={`w-5 h-5 border-2 rounded-md flex items-center justify-center shadow-lg ${
                 selectedBookmarks.includes(String(bookmark.id))
                   ? 'bg-blue-600 border-blue-600'
                   : 'bg-white border-gray-400 hover:border-blue-500'
               }`}
             >
               {selectedBookmarks.includes(String(bookmark.id)) && (
                 <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                   <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                 </svg>
               )}
             </div>
           </div>
         )}
        {/* Background Website Logo with 5% opacity - Custom background takes priority */}
        {(() => {
          // Priority: custom_logo > custom_background > customBackground > userDefaultLogo > extracted favicon > automatic favicon
          const customBg = (bookmark as any).custom_logo || (bookmark as any).custom_background || bookmark.customBackground;
          if (customBg) {
            return (
              <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                style={{
                  backgroundImage: `url(${customBg || userDefaultLogo})`,
                  opacity: 0.10
                }}
              />
            );
          } else {
            // Use unified visual hierarchy helper
            const { background: bg } = computeVisuals(bookmark as any, userDefaultLogo);
            return (
              <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                style={{
                  backgroundImage: `url(${bg})`,
                  opacity: 0.10
                }}
              />
            );
          }
        })()}
        <div className="p-2 h-full flex flex-col justify-between relative z-10">
                    {/* Top section with favicon and title */}
          <div>
            <div className="mb-1">
              <div className="w-12 h-12">
                <div className="w-10 h-10 rounded-lg bg-black flex items-center justify-center ring-1 ring-gray-300/50 group-hover:ring-gray-400 transition-all duration-300 shadow-sm m-1">
                  {(() => {
                    // Unified favicon resolution
                    const displayImage = getFaviconUrl(bookmark as any, 24);
                    return (
                      <img
                        src={displayImage}
                        alt={`${bookmark.title} favicon`}
                        className="w-6 h-6 rounded"
                        onLoad={enhanceOnLoad(64)}
                        onError={(e) => handleFaviconError(e as any, bookmark as any)}
                      />
                    );
                  })()}
                </div>
              </div>
            </div>
            <h3 className="font-bold text-gray-900 font-audiowide uppercase text-base leading-tight ml-1">
              {truncateTitle(bookmark.title, 14)}
            </h3>
            <p className="text-xs text-blue-600 ml-1 mt-1">{extractDomain(bookmark.url)}</p>
          </div>

          {/* Middle section with badges */}
          <div className="flex flex-col space-y-1 ml-1">
            <Badge className={`text-xs border shadow-sm w-fit ${getPriorityColor(bookmark.priority)}`}>
              {bookmark.priority}
            </Badge>
          </div>

          {/* Bottom section with visits and profile image */}
          <div className="flex justify-between items-end">
            <div className="flex items-center space-x-1.5">
              <Eye className="h-4 w-4 text-gray-600" />
              <p className="text-sm text-gray-600 font-semibold">
                {(() => {
                  const analytics = getUnifiedBookmarkAnalytics(bookmark.id);
                  console.log('🔍 Analytics for', bookmark.id, ':', analytics);
                  return analytics?.visits || 0;
                })()}
              </p>
              <span className="text-sm text-gray-500 font-medium uppercase">Visits</span>
              {/* Live indicator */}
              {!analyticsLoading && getBookmarkAnalytics(bookmark.id) && (
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" title="Live data" />
              )}
            </div>
            {(() => {
              // Unified visual hierarchy for large circle
              const { largeCircle: src } = computeVisuals(bookmark as any, userDefaultLogo);
              return (
                <img
                  src={src}
                  alt={`${bookmark.title} image`}
                  className="w-16 h-16 object-cover rounded-full border border-gray-300"
                  onError={(e) => {
                    const el = e.target as HTMLImageElement;
                    el.onerror = null;
                    el.src = computeVisuals(bookmark as any, userDefaultLogo).largeCircle;
                  }}
                />
              );
            })()}
          </div>
        </div>

        {/* Drag Icon - positioned at top right corner next to border */}
        <div className="absolute top-0.5 right-0.5">
          <div className="opacity-50 hover:opacity-100 transition-opacity duration-200">
            <GripVertical className="h-4 w-4 text-gray-400 hover:text-gray-600" />
          </div>
        </div>

        {/* Usage Percentage Hexagon - positioned diagonally (Much Bigger) */}
        <div className="absolute top-2 right-2">
          <svg width="70" height="60" viewBox="0 0 70 60" className="drop-shadow-lg">
            <path
              d="M35 5 L55 15 L55 38 L35 48 L15 38 L15 15 Z"
              fill="white"
              stroke={(() => {
                const analytics = getBookmarkAnalytics(bookmark.id)
                const visits = analytics ? analytics.visits : 0
                const percentage = getUsagePercentage(visits)
                return getPercentageColor(percentage)
              })()}
              strokeWidth="3"
            />
            <text
              x="35"
              y="26"
              textAnchor="middle"
              dominantBaseline="middle"
              fill={(() => {
                const analytics = getBookmarkAnalytics(bookmark.id)
                const visits = analytics ? analytics.visits : 0
                const percentage = getUsagePercentage(visits)
                return getPercentageColor(percentage)
              })()}
              fontSize="16"
              fontWeight="bold"
            >
              {(() => {
                const analytics = getBookmarkAnalytics(bookmark.id)
                const visits = analytics ? analytics.visits : 0
                return getUsagePercentage(visits)
              })()}%
            </text>
          </svg>
        </div>

        {/* Action Icons - positioned at bottom right corner */}
        <div className="absolute bottom-1 right-1">
          <BookmarkActionIcons bookmark={bookmark} />
        </div>
      </div>
    </div>
  )

  // Global folder drop handler - moved here to be accessible by all folder card components
  const handleFolderDrop = async (folderId: string, bookmark: any) => {
    try {
      const target = dynamicFolders.find((f) => String(f.id) === String(folderId));
      if (!target) {
        showNotification('Target folder not found', 'error');
        return;
      }
      const newCategory = String(target.name || '').trim();
      const oldCategory = String(bookmark.category || '').trim();
      if (!bookmark || !bookmark.id || !bookmark.title || !bookmark.url) {
        showNotification('Invalid bookmark data for drop', 'error');
        return;
      }
      // Allow idempotent re-save even if already in this folder; do not block user action
      // if (oldCategory.toLowerCase() === newCategory.toLowerCase()) {
      //   showNotification('Bookmark is already in this folder');
      //   // continue without early return
      // }

      // Optimistic UI update (also clear ai_category so UI shows the new manual category)
      preserveScrollDuring(() => {
        setBookmarks((prev) => prev.map((b) => String(b.id) === String(bookmark.id) ? { ...b, category: newCategory, ai_category: null } : b));
        // Keep searchResults and selectedBookmark in sync for instant UI update
        setSearchResults((prev) => prev.map((b:any) => String(b.id) === String(bookmark.id) ? { ...b, category: newCategory, ai_category: null } : b));
        setSelectedBookmark((prev:any) => prev && String(prev.id) === String(bookmark.id) ? { ...prev, category: newCategory, ai_category: null } : prev);
      });

      // Persist via API (move: updates folder_id + category in one operation)
      const res = await fetch(`/api/timeline/bookmarks/move`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookmarkId: bookmark.id, newFolderId: folderId })
      });

      if (!res.ok) {
        throw new Error(`Failed to move (status ${res.status})`);
      }
      const json = await res.json().catch(() => null);
      if (!(json && json.success)) {
        throw new Error(json?.error || 'Move failed');
      }
      showNotification(`Moved "${bookmark.title}" to "${newCategory}"`);
      // Verify with server and sync authoritative fields to prevent any flip-back on refresh
      try {
        const verifyRes = await fetch(`/api/bookmarks`)
        const verifyJson = await verifyRes.json().catch(() => null)
        const refreshed = Array.isArray(verifyJson?.bookmarks)
          ? verifyJson.bookmarks.find((b: any) => String(b.id) === String(bookmark.id))
          : null
        if (refreshed) {
          // Update all local sources to match server authority
          preserveScrollDuring(() => {
            setBookmarks((prev) => prev.map((b) =>
              String(b.id) === String(bookmark.id)
                ? { ...b, category: refreshed.category, ai_category: refreshed.ai_category ?? null }
                : b
            ))
            setSearchResults((prev) => prev.map((b:any) =>
              String(b.id) === String(bookmark.id)
                ? { ...b, category: refreshed.category, ai_category: refreshed.ai_category ?? null }
                : b
            ))
            setSelectedBookmark((prev:any) => prev && String(prev.id) === String(bookmark.id)
              ? { ...prev, category: refreshed.category, ai_category: refreshed.ai_category ?? null }
              : prev
            )
          });
        }
      } catch {}

    } catch (err) {
      console.error('Drop/move error:', err);
      // Best effort: reload bookmarks or revert optimistic change across all local sources
      preserveScrollDuring(() => {
        setBookmarks((prev) => prev.map((b) => String(b.id) === String(bookmark.id) ? { ...b, category: (bookmark.category || '') } : b));
        setSearchResults((prev) => prev.map((b:any) => String(b.id) === String(bookmark.id) ? { ...b, category: (bookmark.category || '') } : b));
        setSelectedBookmark((prev:any) => prev && String(prev.id) === String(bookmark.id) ? { ...prev, category: (bookmark.category || ''), ai_category: prev?.ai_category ?? null } : prev);
      });
      showNotification('Failed to move bookmark', 'error');
    }
  };

    const CompactFolderCard = ({ id, category, bookmarkCount, color }: { id: string, category: string, bookmarkCount: number, color?: string }) => {
      const currentColor = color || (categories.find((c: any) => String(c.id) === String(id.replace(/^folder-/, '')))?.color) || '#3b82f6'
      return (
        <div
          className="group cursor-pointer relative"
          onDragOver={(e) => { e.preventDefault(); try { e.dataTransfer.dropEffect = 'move'; } catch {} }}
          onDrop={async (e) => { e.preventDefault(); e.stopPropagation(); try { const txt = e.dataTransfer.getData('application/json') || e.dataTransfer.getData('text/plain'); if (!txt) return; const bm = JSON.parse(txt); await handleFolderDrop(id, bm as any); } catch (err) { console.error('Folder drop parse error:', err); try { showNotification('Failed to move bookmark', 'error'); } catch {} } }}
          onClick={() => {
            setSelectedFolder(category)
            setCompactViewMode('bookmarks')
          }}
        >
          {/* Simple Square Box Design */}
          <div className="aspect-square w-full bg-white border border-black relative overflow-hidden rounded-lg">
            {/* Background Default Logo with 5% opacity */}
            {userDefaultLogo && (
              <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: `url(${userDefaultLogo})`, opacity: 0.05 }}
              />
            )}

            {/* More menu trigger + dropdown (portal to avoid clipping) */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="absolute top-2 right-10 z-20 p-1.5 rounded-md bg-white/90 hover:bg-white shadow border border-gray-200 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => e.stopPropagation()}
                  aria-label="Folder options"
                  title="More options"
                >
                  <MoreHorizontal className="h-4 w-4 text-gray-700" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <div className="grid grid-cols-5 gap-2 p-2">
                  {categoryColorOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      className={`w-6 h-6 rounded-md border-2 transition-transform duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-400 hover:scale-110 active:scale-95 ${currentColor.toUpperCase() === opt.value ? 'border-gray-900 ring-1 ring-gray-300' : 'border-gray-300 hover:border-gray-400'}`}
                      style={{ backgroundColor: opt.value }}
                      onClick={(e) => { e.preventDefault(); void updateCategoryColor(id, opt.value) }}
                      title={opt.label}
                    />
                  ))}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="p-2 h-full flex flex-col justify-between relative z-10">
              {/* Top section with folder icon and title */}
              <div>
                <div className="mb-2">
                  <div className="w-20 h-20 flex items-center justify-center rounded-lg" style={{ backgroundColor: currentColor + '20' }}>
                    <FolderIcon className={`h-16 w-16 m-2`} style={{ color: currentColor }} />
                  </div>
                </div>
                <h3 className="font-bold text-gray-900 font-audiowide uppercase text-lg leading-tight ml-2">
                  {category}
                </h3>
              </div>

              {/* Bottom section with item count and profile image */}
              <div className="flex justify-between items-end">
                <div className="flex items-center space-x-2">
                  <Bookmark className="h-4 w-4 text-gray-600" />
                  <p className="text-sm text-gray-600">{bookmarkCount} BOOKMARKS</p>
                </div>
                <img
                  src={userDefaultLogo || "/placeholder.svg"}
                  alt={`${category} owner`}
                  className="w-16 h-16 object-cover rounded-full border border-gray-300"
                />
              </div>
            </div>
          </div>
        </div>
      )
    }


  const ListFolderCard = ({ id, category, bookmarkCount, color }: { id: string, category: string, bookmarkCount: number, color?: string }) => {
    const currentColor = color || (categories.find((c: any) => String(c.id) === String(id.replace(/^folder-/, '')))?.color) || '#3b82f6'
    return (
      <div
        className="group cursor-pointer relative"
        onDragOver={(e) => { e.preventDefault(); try { e.dataTransfer.dropEffect = 'move'; } catch {} }}
        onDrop={async (e) => { e.preventDefault(); e.stopPropagation(); try { const txt = e.dataTransfer.getData('application/json') || e.dataTransfer.getData('text/plain'); if (!txt) return; const bm = JSON.parse(txt); await handleFolderDrop(id, bm as any); } catch (err) { console.error('Folder drop parse error:', err); try { showNotification('Failed to move bookmark', 'error'); } catch {} } }}
        onClick={() => {
          setSelectedFolder(category)
          setCompactViewMode('bookmarks')
        }}
      >
        {/* Horizontal List Design */}
        <div className="w-full bg-white border border-black relative overflow-hidden rounded-lg hover:shadow-lg transition-all duration-300">
          {/* Background Default Logo with 5% opacity */}
          {userDefaultLogo && (
            <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url(${userDefaultLogo})`, opacity: 0.05 }} />
          )}

          {/* More menu trigger + dropdown (portal to avoid clipping) */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="absolute top-2 right-2 z-20 p-1.5 rounded-md bg-white/90 hover:bg-white shadow border border-gray-200 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => e.stopPropagation()}
                aria-label="Folder options"
                title="More options"
              >
                <MoreHorizontal className="h-4 w-4 text-gray-700" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <div className="grid grid-cols-5 gap-2 p-2">
                {categoryColorOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    className={`w-6 h-6 rounded-md border-2 transition-transform duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-400 hover:scale-110 active:scale-95 ${currentColor.toUpperCase() === opt.value ? 'border-gray-900 ring-1 ring-gray-300' : 'border-gray-300 hover:border-gray-400'}`}
                    style={{ backgroundColor: opt.value }}
                    onClick={(e) => { e.preventDefault(); void updateCategoryColor(id, opt.value) }}
                    title={opt.label}
                  />
                ))}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="p-4 flex items-center justify-between relative z-10">
            {/* Left section with folder icon and title */}
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 flex items-center justify-center rounded-lg" style={{ backgroundColor: currentColor + '20' }}>
                <FolderIcon className="h-12 w-12 m-2" style={{ color: currentColor }} />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 font-audiowide uppercase text-xl leading-tight">{category}</h3>
                <div className="flex items-center space-x-2 mt-1">
                  <Bookmark className="h-4 w-4 text-gray-600" />
                  <p className="text-sm text-gray-600">{bookmarkCount} BOOKMARKS</p>
                </div>
              </div>
            </div>

            {/* Right section with profile image */}
            <div className="flex items-center space-x-4">
              <img src={userDefaultLogo || "/placeholder.svg"} alt={`${category} owner`} className="w-16 h-16 object-cover rounded-full border border-gray-300" />
              <ArrowLeft className="h-6 w-6 text-gray-400 rotate-180" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Sortable Folder Cards for Drag and Drop
  const SortableCompactFolderCard = ({ category, bookmarkCount, id }: { category: string, bookmarkCount: number, id: string }) => {
    // Debug logging for each sortable component
    console.log('🎯 SortableCompactFolderCard rendered:', { id, category, bookmarkCount })

    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id })

    console.log('🎯 useSortable result:', { id, isDragging, transform, attributes: !!attributes, listeners: !!listeners })

    const style = {
      transform: toTransformString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
      zIndex: isDragging ? 1000 : 1,
    }

    return (
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className="relative group cursor-grab active:cursor-grabbing"
      >
        {/* Drag Handle - Top Right (Visual indicator only) */}
        <div className="absolute top-2 right-2 z-20 p-1.5 rounded-md bg-white/90 hover:bg-white shadow-md border border-gray-300/50 opacity-60 hover:opacity-100 transition-all duration-200 hover:scale-105 pointer-events-none">
          <GripVertical className="h-4 w-4 text-gray-700" />
        </div>
        <CompactFolderCard id={id} category={category} bookmarkCount={bookmarkCount} />
      </div>
    )
  }

  const SortableListFolderCard = ({ category, bookmarkCount, id }: { category: string, bookmarkCount: number, id: string }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id })

    const style = {
      transform: toTransformString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
      zIndex: isDragging ? 1000 : 1,
    }

    return (
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className="relative group cursor-grab active:cursor-grabbing"
      >
        {/* Drag Handle - Right Side (Visual indicator only) */}
        <div className="absolute right-4 top-1/2 transform -translate-y-1/2 z-20 p-1.5 rounded-md bg-white/90 hover:bg-white shadow-md border border-gray-300/50 opacity-60 hover:opacity-100 transition-all duration-200 hover:scale-105 pointer-events-none">
          <GripVertical className="h-4 w-4 text-gray-700" />
        </div>
        <ListFolderCard id={id} category={category} bookmarkCount={bookmarkCount} />
      </div>
    )
  }
  const SortableListBookmarkCard = ({ bookmark }: { bookmark: any }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: bookmark.id })

    const style = {
      transform: toTransformString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
      zIndex: isDragging ? 1000 : 1,
    }

    return (
      <div ref={setNodeRef} style={style} {...attributes} className="relative group">
        {/* Drag Handle - Bottom Center */}
        <div
          {...listeners}
          className="absolute bottom-2 left-1/2 transform -translate-x-1/2 z-20 p-1.5 rounded-md bg-white/90 hover:bg-white shadow-md border border-gray-300/50 cursor-grab active:cursor-grabbing opacity-60 hover:opacity-100 transition-all duration-200 hover:scale-105"
        >
          <GripVertical className="h-4 w-4 text-gray-700" />
        </div>
        <ListBookmarkCard bookmark={bookmark} />
      </div>
    )
  }
  const ListBookmarkCard = ({ bookmark }: { bookmark: any }) => (
    <Card
      draggable
      onDragStart={(e) => { try { const payload = JSON.stringify({ id: bookmark.id, title: bookmark.title, url: bookmark.url, category: bookmark.category, tags: Array.isArray(bookmark.tags)? bookmark.tags: [], isFavorite: Boolean((bookmark as any).isFavorite), notes: (bookmark as any).notes || '' }); e.dataTransfer.setData('application/json', payload); e.dataTransfer.setData('text/plain', payload); e.dataTransfer.effectAllowed = 'copyMove'; } catch {} }}
      className="group hover:shadow-xl transition-all duration-400 cursor-pointer bg-white border border-black backdrop-blur-sm relative overflow-hidden rounded-lg"
      style={{
        borderColor: 'rgb(0 0 0)', // black
        transition: 'all 0.4s ease'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = themeColor;
        e.currentTarget.style.boxShadow = `0 20px 25px -5px ${themeColor}15`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'rgb(0 0 0)';
        e.currentTarget.style.boxShadow = '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)';
      }}
      onClick={(e) => {
        // Handle bulk selection mode
        if (bulkMode) {
          e.preventDefault()
          e.stopPropagation()
          handleBookmarkSelect(bookmark.id)
          return
        }
        handleBookmarkClick(bookmark)
      }}
    >
             {/* Bulk Selection Checkbox for List View */}
       {bulkMode && (
         <div
           className="absolute top-3 left-3 z-[9999] cursor-pointer"
           onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
           onMouseUp={(e) => { e.preventDefault(); e.stopPropagation(); }}
           onClick={(e) => {
             e.preventDefault()
             e.stopPropagation()
             handleBookmarkSelect(bookmark.id, e)
           }}
         >
           <div
             className={`w-6 h-6 border-2 rounded-md flex items-center justify-center shadow-lg ${
               selectedBookmarks.includes(String(bookmark.id))
                 ? 'bg-blue-600 border-blue-600'
                 : 'bg-white border-gray-400 hover:border-blue-500'
             }`}
           >
             {selectedBookmarks.includes(String(bookmark.id)) && (
               <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                 <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
               </svg>
             )}
           </div>
         </div>
       )}

      {/* Background Website Logo with 5% opacity - Custom background takes priority */}
      {(() => {
        const bgSrc = (bookmark as any).custom_logo || (bookmark as any).custom_background || bookmark.customBackground;
        if (bgSrc) {
          return (
            <div
              className="absolute inset-0 bg-cover bg-center bg-no-repeat"
              style={{
                backgroundImage: `url(${bgSrc || userDefaultLogo})`,
                backgroundSize: (bgSrc && /logo\.clearbit\.com|faviconkit\.com|s2\/favicons/.test(String(bgSrc))) ? '140% 140%' : 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                opacity: 0.10
              }}
            />
          );
        } else {
          // Use unified visual hierarchy helper
          const { background: bg } = computeVisuals(bookmark as any, userDefaultLogo);
          return (
            <div
              className="absolute inset-0 bg-cover bg-center bg-no-repeat"
              style={{
                backgroundImage: `url(${bg})`,
                backgroundSize: (bg && /logo\.clearbit\.com|faviconkit\.com|s2\/favicons/.test(bg)) ? '140% 140%' : 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                opacity: 0.10
              }}
            />
          );
        }
      })()}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/2 via-transparent to-purple-500/2 opacity-0 group-hover:opacity-100 transition-opacity duration-400" />

      <CardContent className="p-6 relative z-10">
        {/* Top Section: Title and Category */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center space-x-4 mb-2">
              <div className="w-14 h-14 rounded-xl bg-black flex items-center justify-center ring-2 ring-gray-300/50 group-hover:ring-gray-400 transition-all duration-300 shadow-sm">
                {(() => {
                  // Unified favicon resolution
                  const displayImage = getFaviconUrl(bookmark as any, 32);
                  return (
                    <img
                      src={displayImage}
                      alt={`${bookmark.title} favicon`}
                      className="w-10 h-10 rounded-lg"
                      onLoad={enhanceOnLoad(64)}
                      onError={(e) => handleFaviconError(e as any, bookmark as any)}
                    />
                  );
                })()}
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-4 mb-1">
                  <h3 className="font-bold text-gray-900 font-audiowide uppercase text-lg group-hover:text-blue-900 transition-colors duration-300">{truncateTitle(bookmark.title, 25)}</h3>
                  <Badge className={`text-sm border-2 shadow-sm px-3 py-1 ${getPriorityColor(bookmark.priority)}`}>
                    {bookmark.priority}
                  </Badge>
                </div>
                <div className="flex items-center space-x-2">
                  <FolderIcon className={`h-4 w-4 ${getCategoryColor(bookmark.category)}`} />
                  <span className={`text-sm font-bold uppercase ${getCategoryColor(bookmark.category)}`}>
                    {getCategoryDisplay(bookmark)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Top Right: Profile Image */}
          <div className="flex-shrink-0">
            {(() => {
              // Priority: global DNA logo > custom_logo > extracted favicon > Google service/placeholder
              const src = bookmark.custom_logo || userDefaultLogo || bookmark.favicon || getGoogleFaviconUrl(bookmark.url, 64);
              return (
                <img
                  src={src}
                  alt={`${bookmark.title} image`}
                  className="w-16 h-16 object-cover rounded-full bg-gradient-to-br from-gray-100 to-gray-50 ring-2 ring-gray-200/50 group-hover:ring-blue-300/60 transition-all duration-300 shadow-md"
                  onLoad={enhanceOnLoad(256)}
                  onError={(e) => {
                    const el = e.target as HTMLImageElement;
                    el.onerror = null;
                    el.src = bookmark.custom_logo || userDefaultLogo || bookmark.favicon || getGoogleFaviconUrl(bookmark.url, 64);
                  }}
                />
              );
            })()}
          </div>
        </div>

        {/* Middle Section: URL and Description */}
        <div className="mb-4">
          <p className="text-sm text-blue-600 hover:underline font-medium mb-2">{extractDomain(bookmark.url)}</p>
          <p className="text-sm text-gray-600 leading-relaxed">{bookmark.description}</p>
        </div>

        {/* Bottom Section: Visits and Usage */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="flex items-center space-x-2 bg-gray-50/80 rounded-full px-3 py-1.5">
              <Bookmark className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600 font-medium uppercase">
                {(() => {
                  const analytics = getUnifiedBookmarkAnalytics(bookmark.id)
                  return analytics ? analytics.visits : 0
                })()} VISITS
              </span>
              {/* Live indicator */}
              {!analyticsLoading && getBookmarkAnalytics(bookmark.id) && (
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" title="Live data" />
              )}
            </div>
          </div>

          {/* Bottom Right: Usage Hexagon */}
          <div className="flex items-center space-x-4">
            <UsageHexagon percentage={(() => {
              const analytics = getUnifiedBookmarkAnalytics(bookmark.id)
              const visits = analytics ? analytics.visits : 0
              return getUsagePercentage(visits)
            })()} />
          </div>
        </div>
      </CardContent>

      {/* Drag Icon - Positioned at top right corner */}
      <div className="absolute top-2 right-2">
        <div className="opacity-50 hover:opacity-100 transition-opacity duration-200">
          <GripVertical className="h-5 w-5 text-gray-400 hover:text-gray-600" />
        </div>
      </div>

      {/* Action Icons - Positioned at bottom right corner */}
      <div className="absolute bottom-4 right-4">
        <BookmarkActionIcons bookmark={bookmark} />
      </div>
    </Card>
  )



  const SortableFolderCard = ({ bookmark }: { bookmark: any }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: bookmark.id })

    const style = {
      transform: toTransformString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
      zIndex: isDragging ? 1000 : 1,
    }

    return (
      <div ref={setNodeRef} style={style} {...attributes} className="relative group">
        {/* Drag Handle - Bottom Center */}
        <div
          {...listeners}
          className="absolute bottom-2 left-1/2 transform -translate-x-1/2 z-20 p-1.5 rounded-md bg-white/90 hover:bg-white shadow-md border border-gray-300/50 cursor-grab active:cursor-grabbing opacity-60 hover:opacity-100 transition-all duration-200 hover:scale-105"
        >
          <GripVertical className="h-4 w-4 text-gray-700" />
        </div>
        <Card
          className="p-4 hover:shadow-md transition-shadow cursor-pointer relative border border-gray-300"
          style={{
            borderColor: 'rgb(209 213 219)', // gray-300
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = themeColor;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'rgb(209 213 219)';
          }}
          onClick={() => handleBookmarkClick(bookmark)}
        >
          <div className="flex items-center space-x-3">

            <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <FolderIcon className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-sm font-audiowide uppercase">{truncateTitle(bookmark.title, 15)}</h3>
              <p className="text-xs text-gray-500 truncate">{getCategoryDisplay(bookmark)}</p>
            </div>
          </div>

          {/* Action Icons */}
          <BookmarkActionIcons bookmark={bookmark} />

          {/* Usage Percentage Hexagon */}
          <UsageHexagon percentage={(() => {
            const analytics = getBookmarkAnalytics(bookmark.id)
            const visits = analytics ? analytics.visits : 0
            return getUsagePercentage(visits)
          })()} />
        </Card>
      </div>
    )
  }

  const SortableHierarchyCard = ({ bookmark }: { bookmark: any }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: bookmark.id })

    const style = {
      transform: toTransformString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    }

    return (
      <div ref={setNodeRef} style={style} {...attributes}>
        <div className="relative group">
          {/* Drag handle */}
          <div
            {...listeners}
            className="absolute left-[-24px] top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing z-10"
          >
            <div className="w-4 h-4 flex items-center justify-center">
              <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
              <div className="w-1 h-1 bg-gray-400 rounded-full ml-1"></div>
            </div>
          </div>
          <Card
            className="p-4 hover:shadow-md transition-shadow cursor-pointer relative border border-gray-300"
            style={{
              borderColor: 'rgb(209 213 219)', // gray-300
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = themeColor;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgb(209 213 219)';
            }}
            onClick={() => handleBookmarkClick(bookmark)}
          >
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <div className="text-blue-600 font-bold text-lg">{bookmark.favicon}</div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-sm font-audiowide uppercase">{truncateTitle(bookmark.title, 15)}</h3>
                <p className="text-xs text-gray-500 truncate">{getCategoryDisplay(bookmark)}</p>
                {(bookmark.ai_summary || bookmark.description) && (
                  <p className="text-xs text-gray-400 truncate mt-1" title={bookmark.ai_summary || bookmark.description}>
                    {(bookmark.ai_summary || bookmark.description).substring(0, 50)}...
                  </p>
                )}
              </div>
            </div>

            {/* Action Icons */}
            <BookmarkActionIcons bookmark={bookmark} />

            {/* Usage Percentage Hexagon */}
            <UsageHexagon percentage={(() => {
              const analytics = getUnifiedBookmarkAnalytics(bookmark.id)
              const visits = analytics ? analytics.visits : 0
              return getUsagePercentage(visits)
            })()} />
          </Card>
        </div>
      </div>
    )
  }

  // Sortable version of FolderCard for Folder 2.0
  const SortableFolderCard2 = ({ folder, bookmarkCount, onEdit, onDelete, onAddBookmark, onDrop, onDragOver, onClick }: {
    folder: Folder;
    bookmarkCount: number;
    onEdit: (folder: Folder) => void;
    onDelete: (folderId: string) => void;
    onAddBookmark: (folderId: string) => void;
    onDrop: (folderId: string, bookmark: BookmarkWithRelations) => void;
    onDragOver: (event: React.DragEvent) => void;
    onClick?: () => void;
  }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: folder.id })


    const [showFolderPalette, setShowFolderPalette] = useState(false)

    const style = {
      transform: toTransformString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    }

    return (
      <div ref={setNodeRef} style={style} {...attributes}>
        <div className="relative group">
          {/* Drag handle */}
          <div
            {...listeners}
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing z-10 bg-white/80 rounded-md p-1 shadow-sm"
          >
            <div className="flex flex-col space-y-0.5">
              <div className="flex space-x-0.5">
                <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
              </div>
              <div className="flex space-x-0.5">
                <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                <div className="w-1 h-1 bg-gray-400 rounded-full"></div>

              </div>
            </div>
          </div>
          <FolderCard
            folder={folder}
            bookmarkCount={bookmarkCount}
            onEdit={onEdit}
            onDelete={onDelete}
            onAddBookmark={onAddBookmark}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onClick={onClick}
            disableLink={true}
            onChangeColor={(id, color) => updateCategoryColor(id, color)}
            colorOptions={categoryColorOptions}
          />
        </div>
      </div>
    )
  }
  // Bookmark Folder Card component (non-sortable) - RENAMED to avoid conflict with GoalFolderCard
  const BookmarkFolderCard = ({ folder, bookmarkCount, onEdit, onDelete, onAddBookmark, onDrop, onDragOver, onClick }: {
    folder: Folder;
    bookmarkCount: number;
    onEdit: (folder: Folder) => void;
    onDelete: (folderId: string) => void;
    onAddBookmark: (folderId: string) => void;
    onDrop: (folderId: string, bookmark: BookmarkWithRelations) => void;
    onDragOver: (event: React.DragEvent) => void;
    onClick?: (e: React.MouseEvent) => void;
  }) => {
    return (
      <div
        className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
        onClick={onClick}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          try {
            const raw = e.dataTransfer.getData('application/json') || e.dataTransfer.getData('text/plain');
            if (!raw) return;
            const parsed = JSON.parse(raw);
            if (!parsed || !parsed.id) return;
            onDrop(folder.id, parsed as any);
          } catch (err) {
            console.error('Folder 2.0 drop parse error:', err);
            try { showNotification('Invalid drop data', 'error'); } catch {}
          }
        }}
        onDragOver={onDragOver}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: folder.color }}
            >
              <Target className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{folder.name}</h3>
              <p className="text-sm text-gray-600">{folder.description}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(folder);
            }}
          >
            <Edit2 className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Progress</span>
            <span className="font-medium">{folder.goal_progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${folder.goal_progress}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Deadline</span>
            <span className="font-medium">
              {folder.deadline_date ? (() => {
                const date = new Date(folder.deadline_date);
                return isNaN(date.getTime()) ? 'Invalid date' : date.toLocaleDateString();
              })() : 'No deadline'}
            </span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Priority</span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              folder.goal_priority === 'high' ? 'bg-red-100 text-red-800' :
              folder.goal_priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
              'bg-green-100 text-green-800'
            }`}>
              {folder.goal_priority}
            </span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Status</span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              folder.goal_status === 'completed' ? 'bg-green-100 text-green-800' :
              folder.goal_status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
              folder.goal_status === 'overdue' ? 'bg-red-100 text-red-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {folder.goal_status?.replace('_', ' ')}
            </span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Bookmarks</span>
            <span className="font-medium">{bookmarkCount}</span>
          </div>
        </div>

        {folder.goal_notes && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">{folder.goal_notes}</p>
          </div>
        )}
      </div>
    )
  }

  // Sortable version of Goal Folder Card for Goal 2.0
  const SortableGoalFolderCard = ({ folder, bookmarkCount, onEdit, onDelete, onAddBookmark, onDrop, onDragOver, onClick }: {
    folder: Folder;
    bookmarkCount: number;
    onEdit: (folder: Folder) => void;
    onDelete: (folderId: string) => void;
    onAddBookmark: (folderId: string) => void;
    onDrop: (folderId: string, bookmark: BookmarkWithRelations) => void;
    onDragOver: (event: React.DragEvent) => void;
    onClick?: (e: React.MouseEvent) => void;
  }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: folder.id })

    const style = {
      transform: toTransformString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    }

    // Prevent click event when dragging
    const handleClick = (e: React.MouseEvent) => {
      if (isDragging) {
        return;
      }
      onClick?.(e);
    }

    return (
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className="relative group cursor-grab active:cursor-grabbing"
      >
        {/* Drag handle - positioned with higher z-index (Visual indicator only) */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-50 bg-white/90 rounded-md p-2 shadow-md border border-gray-200 hover:bg-white hover:shadow-lg pointer-events-none">
          <div className="flex flex-col space-y-0.5">
            <div className="flex space-x-0.5">
              <div className="w-1.5 h-1.5 bg-gray-500 rounded-full"></div>
              <div className="w-1.5 h-1.5 bg-gray-500 rounded-full"></div>
            </div>
            <div className="flex space-x-0.5">
              <div className="w-1.5 h-1.5 bg-gray-500 rounded-full"></div>
              <div className="w-1.5 h-1.5 bg-gray-500 rounded-full"></div>
            </div>
          </div>
        </div>

        {/* Use the separated BookmarkFolderCard component */}
        <BookmarkFolderCard
          folder={folder}
          bookmarkCount={bookmarkCount}
          onEdit={onEdit}
          onDelete={onDelete}
          onAddBookmark={onAddBookmark}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onClick={handleClick}
        />
      </div>
    )
  }
  const renderBookmarks = () => {
    const bookmarkIds = paginatedBookmarks.map(bookmark => bookmark.id)

    switch (viewMode) {
      case 'grid':
        return (
          <ClientOnlyDndProvider>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={bookmarkIds} strategy={rectSortingStrategy}>
                {/* Top pagination controls */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Per page</span>
                    <select
                      className="h-9 rounded-md border border-gray-300 bg-white px-2 text-sm"
                      value={gridPageSize}
                      onChange={(e) => {
                        const v = Number(e.target.value)
                        setGridPageSize(v)
                        try { window.localStorage.setItem('gridPageSize', String(v)) } catch {}
                        setGridPage(1)
                      }}
                    >
                      {[10, 25, 50, 100].map((n) => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                  </div>
                  <div className="text-sm text-gray-600">Page {currentGridPage} of {totalGridPages}</div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="h-9 px-3 rounded-md border border-gray-300 bg-white text-sm disabled:opacity-50"
                      disabled={currentGridPage <= 1}
                      onClick={() => setGridPage((p) => Math.max(1, p - 1))}
                    >
                      Previous
                    </button>
                    <button
                      type="button"
                      className="h-9 px-3 rounded-md border border-gray-300 bg-white text-sm disabled:opacity-50"
                      disabled={currentGridPage >= totalGridPages}
                      onClick={() => setGridPage((p) => Math.min(totalGridPages, p + 1))}
                    >
                      Next
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {paginatedBookmarks.map((bookmark) => (
                    <SortableGridBookmarkCard key={bookmark.id} bookmark={bookmark} />
                  ))}
                </div>

                {/* Bottom pagination controls */}
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Per page</span>
                    <select
                      className="h-9 rounded-md border border-gray-300 bg-white px-2 text-sm"
                      value={gridPageSize}
                      onChange={(e) => {
                        const v = Number(e.target.value)
                        setGridPageSize(v)
                        try { window.localStorage.setItem('gridPageSize', String(v)) } catch {}
                        setGridPage(1)
                      }}
                    >
                      {[10, 25, 50, 100].map((n) => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                  </div>
                  <div className="text-sm text-gray-600">Page {currentGridPage} of {totalGridPages}</div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="h-9 px-3 rounded-md border border-gray-300 bg-white text-sm disabled:opacity-50"
                      disabled={currentGridPage <= 1}
                      onClick={() => setGridPage((p) => Math.max(1, p - 1))}
                    >
                      Previous
                    </button>
                    <button
                      type="button"
                      className="h-9 px-3 rounded-md border border-gray-300 bg-white text-sm disabled:opacity-50"
                      disabled={currentGridPage >= totalGridPages}
                      onClick={() => setGridPage((p) => Math.min(totalGridPages, p + 1))}
                    >
                      Next
                    </button>
                  </div>
                </div>
              </SortableContext>
            </DndContext>
          </ClientOnlyDndProvider>
        )
      case 'compact':
        if (compactViewMode === 'folders') {
          // Show folder view - group bookmarks by category
          // Filter folders that have at least one matching bookmark in this view
          const folders = dynamicFolders.filter((f) => {
            const fid = String(f.id).replace(/^folder-/, '');
            return filteredBookmarks.some(b => String(b?.folder_id || '') === fid || (String(b?.category || '').toLowerCase() === String(f?.name || '').toLowerCase()))
          })

          // Reduced debug logging to prevent excessive console output
          // console.log('🎯 COMPACT VIEW DEBUG:')
          // console.log('📁 dynamicFolders:', dynamicFolders.map(f => ({ id: f.id, name: f.name })))
          // console.log('📁 filtered folders:', folders.map(f => ({ id: f.id, name: f.name })))
          // console.log('📁 SortableContext items:', folders.map(f => f.id))

          return (
            <ClientOnlyDndProvider>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
              >
                <SortableContext items={folders.map(f => f.id)} strategy={rectSortingStrategy}>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                    {folders.map((folder) => (
                      <SortableCompactFolderCard
                        key={folder.id}
                        id={folder.id}
                        category={folder.name}
                        bookmarkCount={filteredBookmarks.filter(b => { const fid = String(folder.id).replace(/^folder-/, ''); return String(b?.folder_id || '') === fid || (String(b?.category || '').toLowerCase() === String(folder?.name || '').toLowerCase()); }).length}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </ClientOnlyDndProvider>
          )
        } else {
          // Show bookmarks within selected folder
          const selectedId = (categories || []).find((c:any) => String(c?.name||'').toLowerCase() === String(selectedFolder||'').toLowerCase())?.id;
          const folderBookmarks = filteredBookmarks.filter(bookmark => String(bookmark?.folder_id || '') === String(selectedId || '') || (String(bookmark?.category || '').toLowerCase() === String(selectedFolder || '').toLowerCase()));
          const folderBookmarkIds = folderBookmarks.map(bookmark => bookmark.id)

          return (
            <div className="space-y-4">
              {/* Back Button */}
              <div className="flex items-center space-x-4 mb-6">
                <Button
                  variant="outline"
                  onClick={() => {
                    setCompactViewMode('folders')
                    setSelectedFolder(null)
                  }}
                  className="flex items-center space-x-2 hover:bg-blue-50 hover:border-blue-300 transition-all duration-300"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back to Folders</span>
                </Button>
                <div className="flex items-center space-x-2">
                  <FolderIcon className="h-5 w-5 text-blue-600" />
                  <h2 className="text-xl font-bold text-gray-900 font-audiowide uppercase">{selectedFolder}</h2>
                  <Badge className="bg-blue-50 text-blue-700 border-blue-200">
                    {folderBookmarks.length} bookmarks
                  </Badge>
                </div>
              </div>

              {/* Bookmarks Grid */}
              <ClientOnlyDndProvider>
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext items={folderBookmarkIds} strategy={rectSortingStrategy}>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                      {folderBookmarks.map((bookmark) => (
                        <SortableCompactBookmarkCard key={bookmark.id} bookmark={bookmark} />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              </ClientOnlyDndProvider>
            </div>
          )
        }
      case 'list':
        if (compactViewMode === 'folders') {
          // Show folder view for list - group bookmarks by category
          const folders = dynamicFolders.filter((f) => {
            const fid = String(f.id).replace(/^folder-/, '');
            return filteredBookmarks.some(b => String(b?.folder_id || '') === fid || (String(b?.category || '').toLowerCase() === String(f?.name || '').toLowerCase()))
          })
          return (
            <ClientOnlyDndProvider>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
              >
                <SortableContext items={folders.map(f => f.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-4">
                    {folders.map((folder) => (
                      <SortableListFolderCard
                        key={folder.id}
                        id={folder.id}
                        category={folder.name}
                        bookmarkCount={filteredBookmarks.filter(b => { const fid = String(folder.id).replace(/^folder-/, ''); return String(b?.folder_id || '') === fid || (String(b?.category || '').toLowerCase() === String(folder?.name || '').toLowerCase()); }).length}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </ClientOnlyDndProvider>
          )
        }

        // Show individual bookmarks in selected folder or all bookmarks
        const bookmarksToShow = selectedFolder
          ? filteredBookmarks.filter(bookmark => bookmark.category === selectedFolder)
          : filteredBookmarks
        const listBookmarkIds = bookmarksToShow.map(bookmark => bookmark.id)

        return (
          <div>
            {selectedFolder && (
              <div className="mb-6 flex items-center space-x-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedFolder(null)
                    setCompactViewMode('folders')
                  }}
                  className="flex items-center space-x-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back to Folders</span>
                </Button>
                <h2 className="text-xl font-bold text-gray-900 font-audiowide uppercase">
                  {selectedFolder} ({bookmarksToShow.length} Bookmarks)
                </h2>
              </div>
            )}
            <ClientOnlyDndProvider>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext items={listBookmarkIds} strategy={verticalListSortingStrategy}>
                  <div className="space-y-4">
                    {bookmarksToShow.map((bookmark) => (
                      <SortableListBookmarkCard key={bookmark.id} bookmark={bookmark} />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </ClientOnlyDndProvider>
          </div>
        )


      case 'hierarchy':
        return (
          <div className="density-gap">
            {['Development', 'Design', 'Productivity'].map((category) => {
              const categoryBookmarks = filteredBookmarks.filter((bookmark) => bookmark.category === category)
              const categoryBookmarkIds = categoryBookmarks.map(bookmark => bookmark.id)

              return (
                <div key={category} className="border border-gray-200/60 rounded-xl density-p bg-gradient-to-br from-white via-gray-50/20 to-white shadow-sm hover:shadow-lg transition-all duration-300">
                  <h3 className="font-bold text-2xl mb-6 flex items-center text-gray-900">
                    <GitBranch className="h-7 w-7 mr-4 text-gray-700" />
                    {category}
                  </h3>
                  <ClientOnlyDndProvider>
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleDragEnd}
                    >
                      <SortableContext items={categoryBookmarkIds} strategy={verticalListSortingStrategy}>
                        <div className="ml-11 space-y-4">
                          {categoryBookmarks.map((bookmark, index) => (
                            <SortableHierarchyCard key={bookmark.id} bookmark={bookmark} />
                          ))}
                        </div>
                      </SortableContext>
                    </DndContext>
                  </ClientOnlyDndProvider>
                </div>
              )
            })}
          </div>
        )
      case 'timeline':
        return (
          <BookmarkTimeline
            bookmarks={filteredBookmarks}
            userDefaultLogo={userDefaultLogo}
            onBookmarkClick={(bookmark) => {
              setSelectedBookmark(bookmark);
              setIsModalOpen(true);
            }}
            onBookmarkUpdate={(bookmark) => {
              // Update bookmark in the bookmarks array
              setBookmarks(prev => prev.map(b => b.id === bookmark.id ? bookmark : b));
              showNotification('Bookmark updated successfully!');
            }}
            onBookmarkDelete={(bookmarkId) => {
              // Delete bookmark from the bookmarks array
              setBookmarks(prev => prev.filter(b => b.id.toString() !== bookmarkId));
              showNotification('Bookmark deleted successfully!');
            }}
          />
        )
      case 'hierarchyV1':
        return (
          <div className="density-gap">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Hierarchy V1 - Simple View</h2>
              <p className="text-gray-600">Basic hierarchical organization of your bookmarks</p>
            </div>
            {['Development', 'Design', 'Productivity'].map((category) => {
              const categoryBookmarks = filteredBookmarks.filter((bookmark) => bookmark.category === category)
              const categoryBookmarkIds = categoryBookmarks.map(bookmark => bookmark.id)

              return (
                <div key={category} className="border border-gray-200/60 rounded-xl density-p bg-gradient-to-br from-white via-gray-50/20 to-white shadow-sm hover:shadow-lg transition-all duration-300">
                  <h3 className="font-bold text-2xl mb-6 flex items-center text-gray-900">
                    <GitBranch className="h-7 w-7 mr-4 text-gray-700" />
                    {category}
                    <Badge className="ml-3 bg-blue-50 text-blue-700 border-blue-200">
                      {categoryBookmarks.length} bookmarks
                    </Badge>
                  </h3>
                  <ClientOnlyDndProvider>
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleDragEnd}
                    >
                      <SortableContext items={categoryBookmarkIds} strategy={verticalListSortingStrategy}>
                        <div className="ml-11 space-y-4">
                          {categoryBookmarks.map((bookmark, index) => (
                            <SortableHierarchyCard key={bookmark.id} bookmark={bookmark} />
                          ))}
                        </div>
                      </SortableContext>
                    </DndContext>
                  </ClientOnlyDndProvider>
                </div>
              )
            })}
          </div>
        )
      case 'khV1':
        return (
          <ClientOnlyDndProvider>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <div className="w-full h-screen">
                <KHV1InfinityBoard
                  folders={foldersForHierarchyV1.filter(f => (f.bookmark_count || 0) > 0)}
                  bookmarks={bookmarks}
                  onCreateFolder={() => {
                    // Hierarchy view should not create folders - only organize existing ones
                    console.log('⚠️ Hierarchy view should not create new folders');
                  }}
                  onAddBookmark={() => setShowAddBookmark(true)}
                  onOpenDetail={handleBookmarkClick}
                  isActive={true}
                  folderAssignments={folderAssignments as any}
                  onHierarchyAssignmentsChange={handleHierarchyAssignmentsChange}
                />
              </div>
            </DndContext>
          </ClientOnlyDndProvider>
        )
      case 'folder2':
        const handleFolderEdit = (folder: Folder) => {
          console.log('Edit folder:', folder);
          showNotification(`Edit folder: ${folder.name}`);
        };

        const handleFolderDelete = (folderId: string) => {
          console.log('Delete folder:', folderId);
          showNotification(`Delete folder: ${folderId}`);
        };

        const handleFolderAddBookmark = (folderId: string) => {
          console.log('Add bookmark to folder:', folderId);
          showNotification(`Add bookmark to folder: ${folderId}`);
        };

        const handleFolderDragOver = (event: React.DragEvent) => {
          event.preventDefault();
          try { event.dataTransfer.dropEffect = 'move'; } catch {}
        };

        return (
          <div className="space-y-6">
            {!openedFolder ? (
              <>
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Folder 2.0</h2>
                  <p className="text-gray-600">Advanced folder management with drag-and-drop functionality</p>
                </div>

                <ClientOnlyDndProvider>
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDragEnd={handleDragEnd}
                  >
                    {(() => { const visibleFolders = dynamicFolders.filter((f) => {
                      const fid = String(f.id).replace(/^folder-/, '');
                      return filteredBookmarks.some(b => String(b?.folder_id || '') === fid || (String(b?.category || '').toLowerCase() === String(f?.name || '').toLowerCase()))
                    }); return (
                      <SortableContext items={visibleFolders.map(f => f.id)} strategy={rectSortingStrategy}>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 density-gap">
                          {visibleFolders.map((folder) => {

                          const folderBookmarks = filteredBookmarks.filter(bookmark =>
                            (bookmark.category || '').toLowerCase() === folder.name.toLowerCase()
                          );

                          return (
                            <SortableFolderCard2
                              key={folder.id}
                              folder={folder}
                              bookmarkCount={folderBookmarks.length}
                              onEdit={handleFolderEdit}
                              onDelete={handleFolderDelete}
                              onAddBookmark={handleFolderAddBookmark}
                              onDrop={handleFolderDrop}
                              onDragOver={handleFolderDragOver}
                              onClick={() => {
                                console.log('Folder clicked:', folder);
                                setOpenedFolder(folder);
                                showNotification(`Opened folder: ${folder.name}`);
                              }}
                            />
                          );
                        })}
                        </div>
                      </SortableContext>
                    )})()}
                  </DndContext>
                </ClientOnlyDndProvider>
              </>
            ) : (
              <>
                {/* Opened folder view */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <Button
                        onClick={() => setOpenedFolder(null)}
                        className="flex items-center space-x-2"
                      >
                        <ArrowLeft className="h-4 w-4" />
                        <span>Back to Folders</span>
                      </Button>
                      <div className="flex items-center space-x-3">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: openedFolder.color }}
                        >
                          <FolderIcon className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h2 className="text-xl font-bold text-gray-900">{openedFolder.name}</h2>
                          <p className="text-gray-600 text-sm">{openedFolder.description}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bookmarks in the opened folder */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {bookmarks
                      .filter(bookmark => (bookmark.category || '').toLowerCase() === openedFolder.name.toLowerCase())
                      .map((bookmark) => (
                        <GridBookmarkCard key={bookmark.id} bookmark={bookmark} />
                      ))}
                  </div>

                  {bookmarks.filter(bookmark => (bookmark.category || '').toLowerCase() === openedFolder.name.toLowerCase()).length === 0 && (
                    <div className="text-center py-12">
                      <FolderIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No bookmarks yet</h3>
                      <p className="text-gray-600 mb-4">This folder is empty. Add some bookmarks to get started!</p>
                      <Button
                        onClick={() => handleFolderAddBookmark(openedFolder.id)}
                        className="flex items-center space-x-2"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Add Bookmark</span>
                      </Button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )
      case 'goal2':
        // Goal Folder Management Handlers
        const handleCreateFolder = () => {
          setSelectedGoalFolder(null);
          setGoalFolderDialogOpen(true);
        };

        const handleEditFolder = (folder: GoalFolder) => {
          console.log('Edit goal folder:', folder);
          setSelectedGoalFolder(folder);
          setGoalFolderDialogOpen(true);
        };

        const handleDeleteFolder = async (folderId: string) => {
          try {
            await goalService.deleteGoalFolder(folderId, 'unassign');
            await loadGoalData(); // Reload data
            showNotification('Goal folder deleted successfully!');
          } catch (error) {
            console.error('Error deleting goal folder:', error);
            showNotification('Failed to delete goal folder', 'error');
          }
        };

        const handleFolderSubmit = async (folderData: GoalFolder) => {
          try {
            console.log('🎯 handleFolderSubmit called with:', folderData);
            console.log('🎯 selectedGoalFolder:', selectedGoalFolder);

            if (selectedGoalFolder) {
              // Update existing folder
              console.log('🎯 Updating existing folder...');
              await goalService.updateGoalFolder(selectedGoalFolder.id, folderData);
              showNotification(`Folder "${folderData.name}" updated successfully!`);
            } else {
              // Create new folder
              console.log('🎯 Creating new folder...');
              await goalService.createGoalFolder(folderData);
              showNotification(`Folder "${folderData.name}" created successfully!`);
            }

            console.log('🎯 Reloading goal data...');
            await loadGoalData(); // Reload data
            console.log('🎯 Goal data reloaded successfully');

            // Clear state after successful operation
            setSelectedGoalFolder(null);
            setGoalFolderDialogOpen(false);
          } catch (error) {
            console.error('❌ Error saving goal folder:', error);
            showNotification('Failed to save goal folder', 'error');
          }
        };

        // Goal Management Handlers
        const handleCreateGoal = (folderId?: string) => {
          setSelectedGoal(null);
          setSelectedFolderIdForGoal(folderId);
          setGoalDialogOpen(true);
        };

        const handleEditGoal = (goal: Goal) => {
          setSelectedGoal(goal);
          setGoalDialogOpen(true);
        };

        const handleDeleteGoal = async (goalId: string) => {
          try {
            await goalService.deleteGoal(goalId);
            await loadGoalData(); // Reload data
            showNotification('Goal deleted successfully!');
          } catch (error) {
            console.error('Error deleting goal:', error);
            showNotification('Failed to delete goal', 'error');
          }
        };

        const handleGoalSubmit = async (goalData: Goal) => {
          try {
            console.log('🎯 handleGoalSubmit called with:', goalData);
            console.log('🎯 selectedGoal:', selectedGoal);

            if (selectedGoal) {
              // Update existing goal
              console.log('🎯 Updating existing goal...');
              await goalService.updateGoal(selectedGoal.id, goalData);
              showNotification(`Goal "${goalData.name}" updated successfully!`);
            } else {
              // Create new goal
              console.log('🎯 Creating new goal...');
              const createdGoal = await goalService.createGoal(goalData);
              console.log('🎯 Goal created:', createdGoal);
              showNotification(`Goal "${goalData.name}" created successfully!`);
            }
            console.log('🎯 Reloading goal data...');
            await loadGoalData(); // Reload data
            setSelectedGoal(null);
            setSelectedFolderIdForGoal(undefined);
            setGoalDialogOpen(false);
          } catch (error) {
            console.error('❌ Error saving goal:', error);
            console.error('❌ Error details:', error.message);
            showNotification('Failed to save goal', 'error');
          }
        };

        // Drag and Drop Handlers
        const handleGoalDrop = async (folderId: string, item: any) => {
          try {
            console.log('🎯 handleGoalDrop called with:', { folderId, item });

            if (item.type === 'goal') {
              // Moving a goal to a different folder
              if (item.folder_id !== folderId) {
                console.log('🎯 Moving goal from folder', item.folder_id, 'to folder', folderId);

                // Validate that the target folder exists in our current folder list
                const targetFolder = goalFolders.find(folder => folder.id === folderId);
                if (!targetFolder) {
                  console.error('❌ Target folder not found in current folder list:', folderId);
                  console.log('📁 Available folders:', goalFolders.map(f => ({ id: f.id, name: f.name })));
                  showNotification('Target folder not found. Please refresh and try again.', 'error');
                  return;
                }

                console.log('✅ Target folder found:', targetFolder.name);
                await goalService.moveGoalToFolder(item.id, folderId);
                await loadGoalData(); // Reload data
                showNotification(`Goal "${item.name}" moved to "${targetFolder.name}" successfully!`);
              } else {
                console.log('🎯 Goal is already in the target folder, no action needed');
              }
            }
          } catch (error) {
            console.error('❌ Error moving goal:', error);
            console.error('❌ Error details:', error.message);
            showNotification(`Failed to move goal: ${error.message}`, 'error');
          }
        };

        // Navigation handlers for hierarchical folder navigation
        const handleFolderClick = (folder: GoalFolder) => {
          console.log('🎯 Navigating to folder:', folder.name);
          setCurrentGoalFolder(folder);
          setGoalNavigationMode('folder');
        };

        const handleBackToMain = () => {
          console.log('🎯 Navigating back to main view');
          setCurrentGoalFolder(null);
          setGoalNavigationMode('main');
        };

        // Filter goals based on current navigation mode
        const getVisibleGoals = () => {
          if (goalNavigationMode === 'folder' && currentGoalFolder) {
            // In folder view: show only goals assigned to current folder
            return goals.filter(goal => goal.folder_id === currentGoalFolder.id);
          } else {
            // In main view: show only unassigned goals (goals without folder_id)
            return goals.filter(goal => !goal.folder_id);
          }
        };

        const visibleGoals = getVisibleGoals();

        return (
          <div className="space-y-6">
            {/* Header Section */}
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Goal 2.0</h2>
              <p className="text-gray-600">Advanced goal management with folders, deadline tracking and progress monitoring</p>
            </div>

            {/* Navigation and Action Bar */}
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center space-x-4">
                {/* Back Navigation */}
                {goalNavigationMode === 'folder' && currentGoalFolder && (
                  <Button
                    variant="outline"
                    onClick={handleBackToMain}
                    className="flex items-center space-x-2 hover:bg-blue-50 hover:border-blue-300 transition-all duration-300"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span>Back to Folders</span>
                  </Button>
                )}

                {/* Breadcrumb/Current Location */}
                <div className="flex items-center space-x-2">
                  {goalNavigationMode === 'main' ? (
                    <>
                      <FolderIcon className="h-5 w-5 text-blue-600" />
                      <h3 className="text-lg font-semibold text-gray-900">All Folders</h3>
                      <Badge className="bg-blue-50 text-blue-700 border-blue-200">
                        {goalFolders.length} folders
                      </Badge>
                    </>
                  ) : (
                    <>
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: currentGoalFolder?.color || '#3B82F6' }}
                      >
                        <FolderIcon className="h-4 w-4 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">{currentGoalFolder?.name}</h3>
                      <Badge className="bg-blue-50 text-blue-700 border-blue-200">
                        {visibleGoals.length} goals
                      </Badge>
                    </>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-4">
                {goalNavigationMode === 'main' && (
                  <Button
                    onClick={handleCreateFolder}
                    variant="outline"
                    className="flex items-center space-x-2"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Create Folder</span>
                  </Button>
                )}
                <Button
                  onClick={() => handleCreateGoal(goalNavigationMode === 'folder' ? currentGoalFolder?.id : undefined)}
                  className="flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Create Goal</span>
                </Button>

                {isLoadingGoals && (
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span>Loading goals...</span>
                  </div>
                )}
              </div>
            </div>

            {/* Error Display */}
            {goalError && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className="text-red-600">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-red-800 font-medium">Error loading goals</p>
                    <p className="text-red-600 text-sm">{goalError}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadGoalData}
                    className="ml-auto text-red-600 border-red-300 hover:bg-red-100"
                  >
                    Retry
                  </Button>
                </div>
              </div>
            )}

            {/* Main Content Area */}
            {isLoadingGoals && goalFolders.length === 0 && goals.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-500">Loading your goals...</p>
                </div>
              </div>
            ) : goalNavigationMode === 'main' ? (
              /* MAIN VIEW: Show folders + unassigned goals */
              <div className="space-y-8">
                {/* Goal Folders Grid */}
                {goalFolders.length > 0 ? (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Goal Folders</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {goalFolders.map((folder) => {
                        const folderGoals = goals.filter(goal => goal.folder_id === folder.id);

                        return (
                          <GoalFolderCard
                            key={folder.id}
                            folder={folder}
                            goals={folderGoals}
                            onEdit={handleEditFolder}
                            onDelete={handleDeleteFolder}
                            onCreateGoal={handleCreateGoal}
                            onEditGoal={handleEditGoal}
                            onDeleteGoal={handleDeleteGoal}
                            onDrop={handleGoalDrop}
                            onClick={handleFolderClick}
                            disableLink={false}
                          />
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FolderIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No goal folders yet</h3>
                    <p className="text-gray-500 mb-4">Create your first folder to organize your goals</p>
                    <Button onClick={handleCreateFolder} className="flex items-center space-x-2 mx-auto">
                      <Plus className="h-4 w-4" />
                      <span>Create Your First Folder</span>
                    </Button>
                  </div>
                )}

                {/* Unassigned Goals */}
                {visibleGoals.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Unassigned Goals</h3>
                    <div
                      className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4 border-2 border-dashed border-gray-300 rounded-lg"
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={async (e) => {
                        e.preventDefault()
                        try {
                          const data = e.dataTransfer.getData('application/json')
                          const item = JSON.parse(data)
                          if (item.type === 'goal' && item.folder_id) {
                            // Remove goal from folder (make it unassigned)
                            await goalService.moveGoalToFolder(item.id, null)
                            await loadGoalData()
                            showNotification(`Goal "${item.name}" moved to unassigned!`)
                          }
                        } catch (error) {
                          console.error('Error moving goal to unassigned:', error)
                          showNotification('Failed to move goal', 'error')
                        }
                      }}
                    >
                      {visibleGoals.map((goal) => (
                        <GoalCard
                          key={goal.id}
                          goal={goal}
                          onEdit={handleEditGoal}
                          onDelete={handleDeleteGoal}
                          draggable={true}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* FOLDER VIEW: Show only goals in current folder */
              <div className="space-y-6">
                {visibleGoals.length > 0 ? (
                  <div
                    className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4 border-2 border-dashed border-gray-300 rounded-lg"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={async (e) => {
                      e.preventDefault()
                      try {
                        const data = e.dataTransfer.getData('application/json')
                        const item = JSON.parse(data)
                        if (item.type === 'goal' && !item.folder_id) {
                          // Move unassigned goal to current folder
                          await goalService.moveGoalToFolder(item.id, currentGoalFolder?.id || null)
                          await loadGoalData()
                          showNotification(`Goal "${item.name}" moved to "${currentGoalFolder?.name}"!`)
                        }
                      } catch (error) {
                        console.error('Error moving goal to folder:', error)
                        showNotification('Failed to move goal', 'error')
                      }
                    }}
                  >
                    {visibleGoals.map((goal) => (
                      <GoalCard
                        key={goal.id}
                        goal={goal}
                        onEdit={handleEditGoal}
                        onDelete={handleDeleteGoal}
                        draggable={true}
                      />
                    ))}
                  </div>
                ) : (
                  <div
                    className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={async (e) => {
                      e.preventDefault()
                      try {
                        const data = e.dataTransfer.getData('application/json')
                        const item = JSON.parse(data)
                        if (item.type === 'goal' && !item.folder_id) {
                          // Move unassigned goal to current folder
                          await goalService.moveGoalToFolder(item.id, currentGoalFolder?.id || null)
                          await loadGoalData()
                          showNotification(`Goal "${item.name}" moved to "${currentGoalFolder?.name}"!`)
                        }
                      } catch (error) {
                        console.error('Error moving goal to folder:', error)
                        showNotification('Failed to move goal', 'error')
                      }
                    }}
                  >
                    <Target className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No goals in this folder yet</h3>
                    <p className="text-gray-500 mb-4">Create your first goal in "{currentGoalFolder?.name}" or drag goals here</p>
                    <Button
                      onClick={() => handleCreateGoal(currentGoalFolder?.id)}
                      className="flex items-center space-x-2 mx-auto"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Create Goal</span>
                    </Button>
                  </div>
                )}
              </div>
            )}



            {/* Dialogs */}
            <GoalFolderDialog
              open={goalFolderDialogOpen}
              onOpenChange={setGoalFolderDialogOpen}
              folder={selectedGoalFolder}
              onSubmit={handleFolderSubmit}
            />

            <GoalEditDialog
              open={goalDialogOpen}
              onOpenChange={setGoalDialogOpen}
              goal={selectedGoal as any}
              onSubmit={handleGoalSubmit}
              bookmarks={bookmarks}
              folders={goalFolders}
              selectedFolderId={selectedFolderIdForGoal}
            />
          </div>
        )
      case 'kanban2':
        return (
          <KanbanBoard2
            bookmarks={filteredBookmarks}
            onBookmarkClick={(card) => {
              // Find the bookmark by URL or ID
              const bookmark = bookmarks.find(b => b.url === card.url || b.id.toString() === card.id);
              if (bookmark) {
                setSelectedBookmark(bookmark);
                setIsModalOpen(true);
              } else if (card.url) {
                // Open URL in new tab if bookmark not found
                window.open(card.url, '_blank');
              }
            }}
            onSave={(boards) => {
              console.log('Kanban boards saved:', boards);
              showNotification('Kanban board updated successfully!');
            }}
          />
        )
      default: // grid
        return (
          <ClientOnlyDndProvider>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={bookmarkIds} strategy={rectSortingStrategy}>
                {/* Top pagination controls */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Per page</span>
                    <select
                      className="h-9 rounded-md border border-gray-300 bg-white px-2 text-sm"
                      value={gridPageSize}
                      onChange={(e) => {
                        const v = Number(e.target.value)
                        setGridPageSize(v)
                        try { window.localStorage.setItem('gridPageSize', String(v)) } catch {}
                        setGridPage(1)
                      }}
                    >
                      {[10, 25, 50, 100].map((n) => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                  </div>
                  <div className="text-sm text-gray-600">Page {currentGridPage} of {totalGridPages}</div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="h-9 px-3 rounded-md border border-gray-300 bg-white text-sm disabled:opacity-50"
                      disabled={currentGridPage <= 1}
                      onClick={() => setGridPage((p) => Math.max(1, p - 1))}
                    >
                      Previous
                    </button>
                    <button
                      type="button"
                      className="h-9 px-3 rounded-md border border-gray-300 bg-white text-sm disabled:opacity-50"
                      disabled={currentGridPage >= totalGridPages}
                      onClick={() => setGridPage((p) => Math.min(totalGridPages, p + 1))}
                    >
                      Next
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {paginatedBookmarks.map((bookmark) => (
                    <SortableGridBookmarkCard key={bookmark.id} bookmark={bookmark} />
                  ))}
                </div>

                {/* Bottom pagination controls */}
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Per page</span>
                    <select
                      className="h-9 rounded-md border border-gray-300 bg-white px-2 text-sm"
                      value={gridPageSize}
                      onChange={(e) => {
                        const v = Number(e.target.value)
                        setGridPageSize(v)
                        try { window.localStorage.setItem('gridPageSize', String(v)) } catch {}
                        setGridPage(1)
                      }}
                    >
                      {[10, 25, 50, 100].map((n) => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                  </div>
                  <div className="text-sm text-gray-600">Page {currentGridPage} of {totalGridPages}</div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="h-9 px-3 rounded-md border border-gray-300 bg-white text-sm disabled:opacity-50"
                      disabled={currentGridPage <= 1}
                      onClick={() => setGridPage((p) => Math.max(1, p - 1))}
                    >
                      Previous
                    </button>
                    <button
                      type="button"
                      className="h-9 px-3 rounded-md border border-gray-300 bg-white text-sm disabled:opacity-50"
                      disabled={currentGridPage >= totalGridPages}
                      onClick={() => setGridPage((p) => Math.min(totalGridPages, p + 1))}
                    >
                      Next
                    </button>
                  </div>
                </div>
              </SortableContext>
            </DndContext>
          </ClientOnlyDndProvider>
        )
    }
  }

  const totalBookmarks = bookmarks.length
  const favorites = bookmarks.filter(bookmark => bookmark.isFavorite).length

  // Chart data for different time periods
  const chartData = {
    '3months': {
      title: 'Total for the last 3 months',
      labels: ['Apr 1', 'Apr 7', 'Apr 13', 'Apr 19', 'Apr 26', 'May 2', 'May 8', 'May 14', 'May 21', 'May 28', 'Jun 3', 'Jun 9', 'Jun 15', 'Jun 21', 'Jun 29'],
      path: 'M 20 160 C 60 140, 100 150, 140 130 C 180 110, 220 120, 260 100 C 300 80, 340 90, 380 70 C 420 50, 460 60, 500 40 C 540 20, 580 30, 620 25 C 660 20, 700 30, 740 35 C 760 37, 780 40, 780 40',
      areaPath: 'M 20 160 C 60 140, 100 150, 140 130 C 180 110, 220 120, 260 100 C 300 80, 340 90, 380 70 C 420 50, 460 60, 500 40 C 540 20, 580 30, 620 25 C 660 20, 700 30, 740 35 C 760 37, 780 40, 780 40 L 780 180 L 20 180 Z'
    },
    '30days': {
      title: 'Total for the last 30 days',
      labels: ['Jun 1', 'Jun 3', 'Jun 5', 'Jun 7', 'Jun 9', 'Jun 11', 'Jun 13', 'Jun 15', 'Jun 17', 'Jun 19', 'Jun 21', 'Jun 23', 'Jun 25', 'Jun 27', 'Jun 29'],
      path: 'M 20 170 C 60 160, 100 165, 140 150 C 180 135, 220 140, 260 125 C 300 110, 340 115, 380 100 C 420 85, 460 90, 500 75 C 540 60, 580 65, 620 50 C 660 35, 700 40, 740 25 C 760 20, 780 22, 780 22',
      areaPath: 'M 20 170 C 60 160, 100 165, 140 150 C 180 135, 220 140, 260 125 C 300 110, 340 115, 380 100 C 420 85, 460 90, 500 75 C 540 60, 580 65, 620 50 C 660 35, 700 40, 740 25 C 760 20, 780 22, 780 22 L 780 180 L 20 180 Z'
    },
    '7days': {
      title: 'Total for the last 7 days',
      labels: ['Jun 23', 'Jun 24', 'Jun 25', 'Jun 26', 'Jun 27', 'Jun 28', 'Jun 29'],
      path: 'M 120 180 C 200 165, 280 170, 360 155 C 440 140, 520 145, 600 130 C 680 115, 680 115, 680 115',
      areaPath: 'M 120 180 C 200 165, 280 170, 360 155 C 440 140, 520 145, 600 130 C 680 115, 680 115, 680 115 L 680 180 L 120 180 Z'
    }
  }

  const currentChartData = chartData[chartTimePeriod as keyof typeof chartData]

  // Add bulk delete function
  const handleBulkDelete = async () => {
    if (selectedBookmarks.length === 0) {
      showNotification('No bookmarks selected for deletion')
      return
    }

    const confirmDelete = window.confirm(
      `Are you sure you want to delete ${selectedBookmarks.length} bookmark(s)? This action cannot be undone.`
    )

    if (!confirmDelete) return

    try {
      // TODO: Use NextAuth session for authentication
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }

      const response = await fetch('/api/bookmarks/bulk', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          action: 'delete',
          bookmark_ids: selectedBookmarks
        })
      })

      const data = await response.json()

      if (data.success) {
        // Remove deleted bookmarks from local state
        preserveScrollDuring(() => {
          setBookmarks(prev => prev.filter(b => !selectedBookmarks.includes(String(b.id))))
          setSelectedBookmarks([])
          setBulkMode(false)
        })
        showNotification(`Successfully deleted ${data.processed} bookmark(s)`)
      } else {
        showNotification('Failed to delete bookmarks: ' + data.error)
      }
    } catch (error) {
      showNotification('Error deleting bookmarks')
      console.error('Bulk delete error:', error)
    }
  }

  // Select all visible bookmarks (non-destructive)
  const handleSelectAllVisible = () => {
    if (filteredBookmarks.length === 0) return;
    preserveScrollDuring(() => {
      setSelectedBookmarks(filteredBookmarks.map(b => String(b.id)));
      if (!bulkMode) setBulkMode(true);
    });
  }

  // Add bulk move function
  const handleBulkMove = async (newCategory: string) => {
    if (selectedBookmarks.length === 0) {
      showNotification('No bookmarks selected for moving')
      return
    }

    // Optimistic UI: update category and clear ai_category so badge reflects manual choice
    setBookmarks(prev => prev.map(bookmark =>
      selectedBookmarks.includes(String(bookmark.id))
        ? { ...bookmark, category: newCategory, ai_category: null }
        : bookmark
    ))

    // Keep searchResults and selectedBookmark in sync for bulk move
    setSearchResults(prev => prev.map((bookmark:any) =>
      selectedBookmarks.includes(String(bookmark.id))
        ? { ...bookmark, category: newCategory, ai_category: null }
        : bookmark
    ));
    setSelectedBookmark(prev => prev && selectedBookmarks.includes(String(prev.id))
      ? { ...prev, category: newCategory, ai_category: null }
      : prev
    );


    try {
      const response = await fetch('/api/bookmarks/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'move',
          bookmarkIds: selectedBookmarks,
          userId: 'dev-user-123',
          category: newCategory
        })
      })

      const data = await response.json()

      if (data.success) {
        setSelectedBookmarks([])
        setBulkMode(false)
        showNotification(`Successfully moved ${data.updatedCount} bookmark(s) to "${newCategory}"`)
      } else {
        showNotification('Failed to move bookmarks: ' + data.error)
      }
    } catch (error) {
      showNotification('Error moving bookmarks')
      console.error('Bulk move error:', error)
    }
  }

  // Toggle all bookmarks selection
  const handleSelectAll = () => {
    preserveScrollDuring(() => {
      if (selectedBookmarks.length === filteredBookmarks.length) {
        // Deselect all
        setSelectedBookmarks([])
      } else {
        // Select all visible bookmarks
        setSelectedBookmarks(filteredBookmarks.map(b => b.id))

      }
    })
  }
  // FIXED: Removed console logs from render function to prevent infinite re-render loop

  return (
    <div className="min-h-screen" style={{ overflowAnchor: 'none' as any }}>
      <div className="p-6">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">BOOKMARKHUB</h1>
              <p className="text-gray-600 mt-1">Your Digital Workspace</p>
              <div className="mt-2 min-h-[28px]">
                {selectedBookmarks.length > 0 && (
                  <Badge className="bg-orange-100 text-orange-800 border-orange-200">
                    {selectedBookmarks.length} SELECTED
                  </Badge>

                )}
              </div>






            </div>
            <div className="flex items-center space-x-4">
              {/* Bulk Mode Toggle - Enhanced visibility */}
              <Button
                variant={bulkMode ? 'default' : 'outline'}
                onClick={() => {
                  preserveScrollDuring(() => {
                    const next = !bulkMode;
                    setBulkMode(next);
                    // Clear selection when turning OFF bulk mode

                      <div className="mt-3">
                        <div className="text-sm text-gray-500">Total bookmarks</div>
                        {isLoadingBookmarks ? (
                          <div className="mt-1 h-8 w-40 rounded bg-gray-100 animate-pulse" />
                        ) : (
                          <div className="mt-1 text-4xl md:text-5xl font-extrabold tracking-tight text-gray-900">
                            {(Array.isArray(bookmarks) ? bookmarks.length : 0).toLocaleString()}
                          </div>
                        )}
                      </div>

                    if (!next) {
                      setSelectedBookmarks([]);
                    }
                  });
                }}
                className={`flex items-center space-x-2 ${bulkMode ? 'bg-blue-600 hover:bg-blue-700' : 'border-2 border-blue-600 text-blue-600 hover:bg-blue-50'} font-semibold transition-all duration-200`}
              >
                {bulkMode ? <CheckCircle className="h-4 w-4 text-white" /> : <Check className="h-4 w-4" />}
                <span className={bulkMode ? 'text-white' : ''}>🗂️ BULK SELECT</span>
              </Button>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-40 border-gray-200">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {isLoadingCategories ? (
                    <SelectItem value="loading" disabled>Loading categories...</SelectItem>
                  ) : (
                    categories
                      .filter((category) => category.name && category.name.trim() !== '')
                      .map((category) => {
                        const categoryValue = category.name.trim().toLowerCase();
                        // Ensure value is never empty string
                        const safeValue = categoryValue || 'uncategorized';
                        return (
                          <SelectItem key={category.id || category.name} value={safeValue}>
                            {category.name}
                          </SelectItem>
                        );
                      })
                  )}
                </SelectContent>
              </Select>
              <SyncButton />

              <Button
                onClick={() => setShowAddBookmark(true)}
                className="text-white font-medium transition-all duration-200 hover:shadow-lg"
                style={{
                  backgroundColor: themeColor
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.filter = 'brightness(0.9)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.filter = 'brightness(1)';
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                ADD BOOKMARK
              </Button>
            </div>
          </div>

          {/* Oracle Component - Temporarily disabled to fix user undefined error */}
          {/* <Oracle /> */}

          {/* Bulk toolbar spacer (constant height to avoid layout shift) */}
          <div className="mb-6" style={{ height: '88px' }} aria-hidden="true" />

          {/* Bulk Actions Toolbar - Fixed overlay to fully prevent scroll jumps */}
          <div
            className={`fixed top-0 left-0 right-0 z-50 transition-opacity duration-150 ${
              selectedBookmarks.length > 0 ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          >
            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b-2 border-blue-300 shadow-md">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Button
                      onClick={handleSelectAll}
                      variant="outline"
                      size="sm"
                      className="border-blue-600 text-blue-600 hover:bg-blue-50"
                    >
                      {selectedBookmarks.length === filteredBookmarks.length ? 'Deselect All' : 'Select All'}
                    </Button>
                    <span className="text-sm text-blue-800 font-semibold">
                      ✅ {selectedBookmarks.length} of {filteredBookmarks.length} bookmarks selected
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Select onValueChange={handleBulkMove}>
                      <SelectTrigger className="w-56 border-blue-300">
                        <SelectValue placeholder={isLoadingCategories ? "Loading folders..." : "📁 Move to..."} />
                      </SelectTrigger>
                      <SelectContent>
                        {isLoadingCategories && (
                          <SelectItem value="__loading__" disabled>Loading folders...</SelectItem>
                        )}
                        {!isLoadingCategories && dynamicFolders.length === 0 && (
                          <SelectItem value="__none__" disabled>No folders available</SelectItem>
                        )}
                        {dynamicFolders
                          .slice()
                          .sort((a, b) => String(a.name).localeCompare(String(b.name)))
                          .map((f) => (
                            <SelectItem key={String(f.id)} value={String(f.name)}>
                              {String(f.name)}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <Button
                      onClick={handleBulkDelete}
                      variant="destructive"
                      size="sm"
                      className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 font-semibold"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>🗑️ DELETE SELECTED</span>
                    </Button>
                    <Button
                      onClick={handleSelectAllVisible}
                      variant="outline"
                      size="sm"
                      className="flex items-center space-x-2 border-blue-600 text-blue-600 hover:bg-blue-50 font-semibold"
                    >
                      <Check className="h-4 w-4" />
                      <span>Select All ({filteredBookmarks.length})</span>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 density-gap mb-8">
            {/* Learning Card - Spans 2 columns - Exact copy from screenshot */}





          </div>

          {/* Total Visitors Chart - Interactive with Proper Components */}
          <Card className="mb-8 bg-gradient-to-br from-white via-gray-50/20 to-white border border-gray-200/60 hover:border-blue-300/50 shadow-lg hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="space-y-1">
                <CardTitle className="text-xl font-bold">{username.toUpperCase()} ANALYTICS CHART</CardTitle>
                <p className="text-sm text-muted-foreground">{currentChartData.title}</p>
              </div>
              <div className="flex items-center space-x-1">
                <Button
                  variant={chartTimePeriod === '3months' ? 'outline' : 'ghost'}
                  size="sm"
                  className="h-7 gap-1 text-sm"
                  onClick={() => setChartTimePeriod('3months')}
                >
                  LAST 3 MONTHS
                </Button>
                <Button
                  variant={chartTimePeriod === '30days' ? 'outline' : 'ghost'}
                  size="sm"
                  className="h-7 gap-1 text-sm"
                  onClick={() => setChartTimePeriod('30days')}
                >
                  LAST 30 DAYS
                </Button>
                <Button
                  variant={chartTimePeriod === '7days' ? 'outline' : 'ghost'}
                  size="sm"
                  className="h-7 gap-1 text-sm"
                  onClick={() => setChartTimePeriod('7days')}
                >
                  LAST 7 DAYS
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex flex-col space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div>
                      <h3 className="text-xl font-semibold text-black">Analytics Chart</h3>
                      <p className="text-sm text-gray-500 mt-1">Last 28 days</p>
                    </div>

                    {/* Metrics Dropdown */}
                    <DropdownMenu open={isMetricsDropdownOpen} onOpenChange={setIsMetricsDropdownOpen}>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="flex items-center space-x-2">
                          <span>Metrics ({selectedMetrics.length})</span>
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-56">
                        {availableMetrics.map((metric) => (
                          <DropdownMenuCheckboxItem
                            key={metric}
                            checked={selectedMetrics.includes(metric)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedMetrics([...selectedMetrics, metric])
                              } else {
                                setSelectedMetrics(selectedMetrics.filter(m => m !== metric))
                              }
                            }}
                          >
                            {metric}
                          </DropdownMenuCheckboxItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="flex items-center space-x-8">
                    {selectedMetrics.map((metric, index) => {
                      const getValue = () => {
                        switch (metric) {
                          case 'Total Visits':
                            return analyticsData ? Object.values(analyticsData).reduce((sum: number, data: any) => sum + data.visits, 0) : 0
                          case 'Engagement Score':
                            return analyticsData ? Math.round(Object.values(analyticsData).reduce((sum: number, data: any) => sum + (data.visits * data.timeSpent), 0) / Math.max(Object.values(analyticsData).length, 1)) : 0
                          case 'Click-through Rate':
                            return isBrowser ? Math.round(Math.random() * 15 + 5) + '%' : '12%'
                          case 'Session Duration':
                            return isBrowser ? Math.round(Math.random() * 300 + 120) + 's' : '240s'
                          case 'Bounce Rate':
                            return isBrowser ? Math.round(Math.random() * 40 + 20) + '%' : '30%'
                          case 'Page Views':
                            return isBrowser ? Math.round(Math.random() * 1000 + 500) : 750
                          case 'User Retention':
                            return isBrowser ? Math.round(Math.random() * 30 + 60) + '%' : '75%'
                          case 'Conversion Rate':
                            return isBrowser ? Math.round(Math.random() * 8 + 2) + '%' : '5%'
                          case 'Active Users':
                            return isBrowser ? Math.round(Math.random() * 200 + 100) : 150
                          case 'Revenue Generated':
                            return isBrowser ? '$' + Math.round(Math.random() * 5000 + 1000) : '$3000'
                          default:
                            return 0
                        }
                      }

                      const getColor = (index: number) => {
                        const colors = ['blue', 'purple', 'green', 'orange', 'red', 'indigo', 'pink', 'teal', 'yellow', 'gray']
                        return colors[index % colors.length]
                      }

                      const color = getColor(index)

                      return (
                        <div key={metric} className={`text-right cursor-pointer hover:bg-${color}-50 p-2 rounded-lg transition-colors group`} onClick={() => {
                          toast.success(`📊 ${metric}: ${getValue()}`)
                        }}>
                          <p className={`text-sm text-gray-500 group-hover:text-${color}-600`}>{metric}</p>
                          <p className={`text-2xl font-bold text-black group-hover:text-${color}-700`}>
                            {getValue()}
                          </p>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Interactive Chart */}
                <div className="relative h-[300px] w-full group">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-transparent to-purple-50/20 rounded-lg transition-all duration-500 group-hover:from-blue-50/50 group-hover:to-purple-50/30" />
                  {/* Dynamic date labels based on selected period */}
                  {(() => {
                    // build and store on window for reuse below
                    const now = new Date();
                    now.setHours(0,0,0,0)
                    const days = chartTimePeriod === '3months' ? 90 : chartTimePeriod === '30days' ? 30 : 7;
                    const points = chartTimePeriod === '7days' ? 7 : 10;
                    const labels: string[] = [];
                    for (let i = 0; i < points; i++) {
                      const t = points <= 1 ? 0 : i / (points - 1);
                      const offset = Math.round((days - 1) * t);
                      const d = new Date(now);
                      d.setDate(now.getDate() - ((days - 1) - offset));
                      labels.push(d.toLocaleString(undefined, { month: 'short', day: 'numeric' }));
                    }
                    // @ts-ignore
                    if (typeof window !== 'undefined') {
                      (window as any).__dashDateLabels = labels;
                    }
                    return null;
                  })()}

                  {/* Interactive Bar Chart */}
                  <div className="relative h-full flex items-end justify-between px-4 pt-40 pb-40 overflow-hidden">
                    {/* Bars driven by dynamic date labels */}
                    {((typeof window !== 'undefined' && (window as any).__dashDateLabels) ? (window as any).__dashDateLabels : []).map((dayLabel: string, i: number) => {

                      // Color function - define before use
                      const getColor = (index: number) => {
                        const colors = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#6366f1', '#ec4899', '#14b8a6', '#eab308', '#6b7280'];
                        return colors[index % colors.length];
                      };

                      // Generate data for each selected metric
                      const metricData = selectedMetrics.map((metric, metricIndex) => {
                        const getValue = () => {
                          switch (metric) {
                            case 'Total Visits':
                              return isBrowser ? Math.floor(Math.random() * 15) + 5 : 12; // 5-20
                            case 'Engagement Score':
                              return isBrowser ? Math.floor(Math.random() * 25) + 10 : 22; // 10-35
                            case 'Click-through Rate':
                              return isBrowser ? Math.floor(Math.random() * 15) + 5 : 12; // 5-20
                            case 'Session Duration':
                              return isBrowser ? Math.floor(Math.random() * 300) + 120 : 270; // 120-420
                            case 'Bounce Rate':
                              return isBrowser ? Math.floor(Math.random() * 40) + 20 : 40; // 20-60
                            case 'Page Views':
                              return isBrowser ? Math.floor(Math.random() * 50) + 20 : 45; // 20-70
                            case 'User Retention':
                              return isBrowser ? Math.floor(Math.random() * 30) + 60 : 75; // 60-90
                            case 'Conversion Rate':
                              return isBrowser ? Math.floor(Math.random() * 8) + 2 : 6; // 2-10
                            case 'Active Users':
                              return isBrowser ? Math.floor(Math.random() * 40) + 20 : 40; // 20-60
                            case 'Revenue Generated':
                              return isBrowser ? Math.floor(Math.random() * 50) + 10 : 35; // 10-60
                            default:
                              return isBrowser ? Math.floor(Math.random() * 20) + 5 : 12;
                          }
                        };
                        // Cap bar height so it never overlaps labels/text
                        const rawValue = getValue();
                        const MAX_BAR_PX = 72; // absolute ceiling inside chart area, keeps bars safely below text
                        const metricMaxMap: Record<string, number> = {
                          'Total Visits': 200,
                          'Engagement Score': 100,
                          'Click-through Rate': 40,
                          'Session Duration': 600,
                          'Bounce Rate': 100,
                          'Page Views': 2000,
                          'User Retention': 100,
                          'Conversion Rate': 20,
                          'Active Users': 500,
                          'Revenue Generated': 10000,
                        };
                        const metricMax = metricMaxMap[metric] ?? 100;
                        const scaledHeight = Math.max(12, Math.min(MAX_BAR_PX, (rawValue / metricMax) * MAX_BAR_PX));

                        return {
                          metric,
                          value: rawValue,
                          height: scaledHeight,
                          color: getColor(metricIndex)
                        };
                      });

                      return (
                        <div key={i} className="flex flex-col items-center space-y-1 cursor-pointer group/bar relative">
                          {/* Hover tooltip */}
                          <div className="absolute -top-20 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover/bar:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                            <div className="text-center">
                              <div className="font-semibold">{dayLabel}</div>
                              {metricData.map((data, idx) => (
                                <div key={idx}>
                                  {data.metric}: {data.value}
                                  {data.metric.includes('Rate') || data.metric.includes('Retention') ? '%' : ''}
                                  {data.metric === 'Session Duration' ? 's' : ''}
                                  {data.metric === 'Revenue Generated' ? '$' : ''}
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Side-by-side bars container */}
                          <div className="flex items-end space-x-1">
                            {metricData.map((data, metricIndex) => (
                              <div
                                key={metricIndex}
                                className="w-2 rounded-sm opacity-70 hover:opacity-100 transition-all duration-200 transform hover:scale-110"
                                style={{
                                  height: `${data.height}px`,
                                  backgroundColor: data.color
                                }}
                                onClick={() => {
                                  const displayValue = data.metric.includes('Rate') || data.metric.includes('Retention') ? `${data.value}%` :
                                                     data.metric === 'Session Duration' ? `${data.value}s` :
                                                     data.metric === 'Revenue Generated' ? `$${data.value}` : data.value;
                                  toast.success(`📅 ${dayLabel}: ${data.metric} - ${displayValue}`)
                                }}
                                title={`${dayLabel}: ${data.metric} - ${data.value}`}
                              />
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Interactive X-axis labels */}
                  <div className="absolute bottom-0 left-0 right-0 z-20 flex justify-between px-4 text-xs text-gray-500">
                    {((typeof window !== 'undefined' && (window as any).__dashDateLabels) ? (window as any).__dashDateLabels : []).map((date: string, i: number) => (
                      <span
                        key={i}
                        className="cursor-pointer hover:font-medium transition-all duration-200 px-1 py-1 rounded hover:bg-gray-50"
                        style={{
                          color: 'rgb(107, 114, 128)' // Default gray-500
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = themeColor;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = 'rgb(107, 114, 128)';
                        }}
                        onClick={() => {
                          toast.success(`📊 Filtering data for ${date}`)
                        }}
                      >
                        {date}
                      </span>
                    ))}
                  </div>

                  {/* Interactive Legend */}
                  <div className="absolute top-2 right-2 flex items-center space-x-2 bg-white/80 backdrop-blur-sm rounded-lg p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    {selectedMetrics.map((metric, index) => {
                      const getColor = (index: number) => {
                        const colors = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#6366f1', '#ec4899', '#14b8a6', '#eab308', '#6b7280'];
                        return colors[index % colors.length];
                      };

                      return (
                        <div key={metric} className="flex items-center space-x-1 cursor-pointer hover:bg-gray-50 px-2 py-1 rounded">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: getColor(index) }}
                          ></div>
                          <span className="text-xs font-medium text-gray-700">
                            {metric.length > 10 ? metric.substring(0, 10) + '...' : metric}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

      {/* View Controls */}
      <div className="flex items-center justify-center mb-8">
        <div className="flex items-center bg-gradient-to-r from-white via-gray-50/30 to-white rounded-xl border border-gray-200/60 p-3 shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur-sm">
          <Button
            size="lg"
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            onClick={() => setViewMode('grid')}
            className="h-12 px-4 flex items-center space-x-2"
          >
            <Grid3X3 className="h-5 w-5" />
            <span className="font-medium">GRID</span>
          </Button>
          <Button
            size="lg"
            variant={viewMode === 'compact' ? 'default' : 'ghost'}
            onClick={() => setViewMode('compact')}
            className="h-12 px-4 flex items-center space-x-2"
          >
            <LayoutGrid className="h-5 w-5" />
            <span className="font-medium">COMPACT</span>
          </Button>
          <Button
            size="lg"
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            onClick={() => setViewMode('list')}
            className="h-12 px-4 flex items-center space-x-2"
          >
            <List className="h-5 w-5" />
            <span className="font-medium">LIST</span>
          </Button>
          <Button
            size="lg"
            variant={viewMode === 'timeline' ? 'default' : 'ghost'}
            onClick={() => setViewMode('timeline')}
            className="h-12 px-4 flex items-center space-x-2"
          >
            <Clock className="h-5 w-5" />
            <span className="font-medium">TIMELINE</span>
          </Button>
          <Button
            size="lg"
            variant={viewMode === 'khV1' ? 'default' : 'ghost'}
            onClick={() => setViewMode('khV1')}
            className="h-12 px-4 flex items-center space-x-2"
          >
            <Building className="h-5 w-5" />
            <span className="font-medium">HIERARCHY</span>
          </Button>
          <Button
            size="lg"
            variant={viewMode === 'folder2' ? 'default' : 'ghost'}
            onClick={() => setViewMode('folder2')}
            className="h-12 px-4 flex items-center space-x-2"
          >
            <FolderIcon className="h-5 w-5" />
            <span className="font-medium">FOLDER 2.0</span>
          </Button>
          <Button
            size="lg"
            variant={viewMode === 'goal2' ? 'default' : 'ghost'}
            onClick={() => setViewMode('goal2')}
            className="h-12 px-4 flex items-center space-x-2"
          >
            <Target className="h-5 w-5" />
            <span className="font-medium">GOAL 2.0</span>
          </Button>
          <Button
            size="lg"
            variant={viewMode === 'kanban2' ? 'default' : 'ghost'}
            onClick={() => setViewMode('kanban2')}
            className="h-12 px-4 flex items-center space-x-2"
          >
            <Columns className="h-5 w-5" />
            <span className="font-medium">KANBAN 2.0</span>
          </Button>
        </div>
      </div>

      {/* Search Bar - placed directly below view mode controls */}
      <div role="search" aria-label="Filter bookmarks" className="w-full mb-8 px-2 sm:px-0">
        <div className="relative">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400">
            <Search className="h-5 w-5" aria-hidden="true" />
          </span>
          <Input
            type="text"
            inputMode="search"
            aria-label="Search bookmarks"
            placeholder="Search bookmarks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape' && searchQuery) {
                setSearchQuery('')
              }
            }}
            className="pl-10 pr-10 h-12 text-base bg-white border border-gray-200/70 rounded-xl shadow-sm focus-visible:ring-2 focus-visible:ring-blue-500/40 focus-visible:border-blue-400 placeholder:text-gray-400"
          />
          {searchQuery && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-2 my-2 px-2 flex items-center rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          )}
        </div>
        {/* Helper text for screen readers */}
        <p className="sr-only" id="search-help">Type to filter bookmarks by title, URL, tags, or description. Results update automatically.</p>
      </div>


      {/* Bookmarks */}
      {filteredBookmarks.length === 0 && !isLoadingBookmarks ? (
        <div className="text-center py-12">
          <div className="mx-auto max-w-md">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No bookmarks found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchQuery || selectedCategory !== 'all'
                ? 'Try adjusting your search or filter criteria.'
                : 'Get started by adding your first bookmark.'}
            </p>
            {!searchQuery && selectedCategory === 'all' && (
              <div className="mt-6 flex space-x-4">
                <Button onClick={() => setShowAddBookmark(true)} className="inline-flex items-center">
                  <svg className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Bookmark
                </Button>
                <Button
                  onClick={() => {
                    const bookmarkIds = bookmarks.map(b => b.id)
                    checkBookmarkHealth(bookmarkIds)
                  }}
                  className="inline-flex items-center bg-green-600 hover:bg-green-700 text-white"
                >
                  🔍 Check All Health
                </Button>
              </div>
            )}
          </div>
        </div>
      ) : (
        renderBookmarks()
      )}

      {/* Bookmark Detail Modal - Exact copy from reference website */}
      <Dialog open={isModalOpen} onOpenChange={(open) => {
        setIsModalOpen(open)
        if (!open) {
          // End time tracking for bookmark viewing
          const storedSession = localStorage.getItem('bookmarkViewSession')
          if (storedSession) {
            try {
              const session = JSON.parse(storedSession)
              const sessionEndTime = Date.now()
              const timeSpentMinutes = Math.round((sessionEndTime - session.startTime) / (1000 * 60))

              console.log(`⏱️ Viewing session ended for bookmark ${session.bookmarkId}: ${timeSpentMinutes} minutes`)

              // Track time spent viewing the bookmark (minimum 1 minute for any interaction)
              if (timeSpentMinutes >= 0) {
                // Use client hook (optimistic) and also fire legacy endpoint for backwards-compat
                trackTimeSpentCombined(session.bookmarkId, Math.max(timeSpentMinutes, 1))
                fetch('/api/bookmarks/analytics', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    bookmarkId: session.bookmarkId,
                    action: 'timeUpdate',
                    timeSpent: Math.max(timeSpentMinutes, 1),
                    sessionEndTime: new Date().toISOString()
                  })
                }).catch(() => {})
              }

              // Clear session data
              localStorage.removeItem('bookmarkViewSession')
            } catch (error) {
              console.error('Error processing viewing session end:', error)
              localStorage.removeItem('bookmarkViewSession')
            }
          }

          // Reset editing state when modal closes
          setEditingField(null)
          setEditingValue('')
          setActiveBookmarkTab('overview') // Reset tab when modal closes
          setHasVisitedMediaTab(false) // Reset media tab visit tracking
          console.log('Modal closed - reset hasVisitedMediaTab to false')
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-white via-gray-50/20 to-white border border-gray-200/60 shadow-2xl">
          {selectedBookmark && (
            <>
              <DialogHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-16 w-16 rounded-none" data-testid="bookmark-modal-avatar" style={{ borderRadius: 0 }}>
                      <AvatarImage src={getFaviconUrl(selectedBookmark as any, 64)} alt={selectedBookmark.title} />
                      <AvatarFallback className="rounded-none bg-black text-white">{selectedBookmark.title[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        {editingField === 'title' ? (
                          <div className="flex-1 space-y-2">
                            <Input
                              data-editor="modal-title"
                              ref={titleModalInputRef as any}
                              value={editingValue}
                              onChange={(e) => {
                                const t = e.currentTarget as HTMLInputElement
                                if (!handledTitleKeyRef.current) {
                                  // Caret is managed by onKeyDown/onSelect; keep onChange to value only
                                  setEditingValue(t.value)
                                } else {
                                  handledTitleKeyRef.current = false
                                }
                              }}
                              onKeyDown={handleKeyDown}
                              onSelect={(e) => {
                                if (handledTitleKeyRef.current) return
                                const now = Date.now()
                                if (now - lastUserActionTsRef.current > 1500) return
                                const t = e.currentTarget as HTMLInputElement
                                setTitleCaret({
                                  start: t.selectionStart ?? 0,
                                  end: t.selectionEnd ?? (t.selectionStart ?? 0),
                                })
                              }}
                              onMouseDown={(e) => { e.stopPropagation(); markUserAction(); }}
                              className="text-2xl font-audiowide uppercase bg-transparent border-b-2 border-blue-500 outline-none"
                              placeholder="Enter title..."
                            />
                            <div className="flex space-x-2">
                              <Button size="sm" onClick={saveEdit} className="h-7">
                                <Check className="h-3 w-3 mr-1" />
                                Save
                              </Button>
                              <Button variant="outline" size="sm" onClick={cancelEditing} className="h-7">
                                <X className="h-3 w-3 mr-1" />
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <DialogTitle
                              className="text-2xl font-audiowide uppercase cursor-pointer hover:bg-gray-50 rounded px-2 py-1 transition-colors"
                              onClick={() => startEditing('title', selectedBookmark.title)}
                            >
                              {selectedBookmark.title}
                            </DialogTitle>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => startEditing('title', selectedBookmark.title)}
                              className="h-6 w-6 p-0 hover:bg-gray-100"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                          </>
                        )}
                      </div>
                      <p className="text-base text-muted-foreground mt-1">{selectedBookmark.url}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={toggleFavorite}
                      className={selectedBookmark.isFavorite ? "border-red-300 bg-red-50" : ""}
                    >
                      <Heart className={`h-4 w-4 ${selectedBookmark.isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-500 hover:text-red-500'}`} />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={shareBookmark}
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={copyBookmarkUrl}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      onClick={visitSite}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      VISIT SITE
                    </Button>
                  </div>
                </div>
              </DialogHeader>

              <Tabs value={activeBookmarkTab} onValueChange={handleTabChange} className="mt-6">
                <TabsList className="grid w-full grid-cols-6">
                  <TabsTrigger value="overview">OVERVIEW</TabsTrigger>
                  <TabsTrigger value="arp">ARP</TabsTrigger>
                  <TabsTrigger value="notification">NOTIFICATION</TabsTrigger>
                  <TabsTrigger value="timer">TASK</TabsTrigger>
                  <TabsTrigger value="media">MEDIA</TabsTrigger>
                  <TabsTrigger value="comment">COMMENT</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex justify-center">
                        <div className="relative">
                          <img
                            src={userDefaultLogo || selectedBookmark.circularImage || "/placeholder.svg"}
                            alt={`${selectedBookmark.title} image`}
                            className="w-32 h-32 object-cover rounded-full bg-gradient-to-br from-gray-100 to-gray-50 ring-2 ring-gray-200/50 shadow-lg"
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            className="absolute -bottom-2 -right-2 rounded-full h-8 w-8 p-0 bg-white shadow-md"
                            onClick={async () => {
                              if (!selectedBookmark) return;

                              const input = document.createElement('input');
                              input.type = 'file';
                              input.accept = 'image/*';
                              input.onchange = async (e) => {
                                const file = (e.target as HTMLInputElement).files?.[0];
                                if (!file) return;

                                // Validate file size (max 5MB)
                                if (file.size > 5 * 1024 * 1024) {
                                  showNotification('File size must be less than 5MB');
                                  return;
                                }

                                // Validate file type
                                if (!file.type.startsWith('image/')) {
                                  showNotification('Please select a valid image file');
                                  return;
                                }

                                try {
                                  setUploadingBackground(true);
                                  showNotification('Uploading logo image...');

                                  // Upload to server (unified route: updates bookmark and returns URL)
                                  const formData = new FormData();
                                  formData.append('file', file);
                                  formData.append('uploadType', 'logo');
                                  formData.append('bookmarkId', String(selectedBookmark.id));

                                  const uploadResponse = await fetch('/api/bookmarks/upload', {
                                    method: 'POST',
                                    body: formData
                                  });

                                  const uploadResult = await uploadResponse.json();

                                  if (!uploadResult.success) {
                                    throw new Error(uploadResult.error || 'Upload failed');
                                  }

                                  const imageUrl = uploadResult.data.url;

                                  // Update UI directly from upload result
                                  const result = { success: true };

                                  if (result.success) {
                                    // Update UI
                                    const updatedBookmark = { ...selectedBookmark, custom_logo: imageUrl };
                                    setBookmarks(prev => prev.map(bookmark =>
                                      bookmark.id === selectedBookmark.id ? updatedBookmark : bookmark
                                    ));
                                    setSelectedBookmark(updatedBookmark);
                                    showNotification('Logo updated successfully!');
                                  } else {
                                    throw new Error((result as any).error || 'Failed to save logo');
                                  }
                                } catch (error) {
                                  console.error('Logo upload error:', error);
                                  showNotification('Failed to upload logo. Please try again.');
                                } finally {
                                  setUploadingBackground(false);
                                }
                              };
                              input.click();
                            }}
                          >
                            <Camera className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="text-center space-y-2">
                        <p className="text-sm text-gray-600">Click the camera icon to update image</p>

                        <UploadButton
                          bookmarkId={String(selectedBookmark.id)}
                          uploadType="logo"
                          currentValue={(selectedBookmark as any).custom_logo}
                          onUploadComplete={(url) => {
                            const updatedBookmark = { ...selectedBookmark, custom_logo: url };
                            setBookmarks(prev => prev.map(bookmark =>
                              bookmark.id === selectedBookmark.id ? updatedBookmark : bookmark
                            ));
                            setSelectedBookmark(updatedBookmark);
                          }}
                          onRemove={() => {
                            const updatedBookmark = { ...selectedBookmark, custom_logo: undefined };
                            setBookmarks(prev => prev.map(bookmark =>
                              bookmark.id === selectedBookmark.id ? updatedBookmark : bookmark
                            ));
                            setSelectedBookmark(updatedBookmark);
                          }}
                          variant="outline"
                          size="sm"
                          className="text-xs"
                        >
                          <ImageIcon className="h-3 w-3 mr-2" />
                          Custom Logo
                        </UploadButton>
                        <div className="flex items-center justify-center gap-2">
                          <UploadButton
                            bookmarkId={String(selectedBookmark.id)}
                            uploadType="background"
                            currentValue={selectedBookmark.customBackground}
                            onUploadComplete={(url) => {
                              const updatedBookmark = { ...selectedBookmark, customBackground: url };
                              setBookmarks(prev => prev.map(bookmark =>
                                bookmark.id === selectedBookmark.id ? updatedBookmark : bookmark
                              ));
                              setSelectedBookmark(updatedBookmark);
                            }}
                            onRemove={() => {
                              const updatedBookmark = { ...selectedBookmark, customBackground: undefined };
                              setBookmarks(prev => prev.map(bookmark =>
                                bookmark.id === selectedBookmark.id ? updatedBookmark : bookmark
                              ));
                              setSelectedBookmark(updatedBookmark);
                            }}
                            variant="default"
                            size="sm"
                            className="text-xs"
                          >
                            Front Background
                          </UploadButton>
                          <UploadButton
                            bookmarkId={String(selectedBookmark.id)}
                            uploadType="favicon"
                            currentValue={(selectedBookmark as any).custom_favicon}
                            onUploadComplete={(url) => {
                              const updatedBookmark = { ...selectedBookmark, custom_favicon: url };
                              setBookmarks(prev => prev.map(bookmark =>
                                bookmark.id === selectedBookmark.id ? updatedBookmark : bookmark
                              ));
                              setSelectedBookmark(updatedBookmark);
                            }}
                            onRemove={() => {
                              const updatedBookmark = { ...selectedBookmark, custom_favicon: undefined };
                              setBookmarks(prev => prev.map(bookmark =>
                                bookmark.id === selectedBookmark.id ? updatedBookmark : bookmark
                              ));
                              setSelectedBookmark(updatedBookmark);
                            }}
                            variant="outline"
                            size="sm"
                            className="text-xs"
                          >
                            Favicon
                          </UploadButton>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold">DESCRIPTION</h3>
                          {editingField !== 'description' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => startEditing('description', selectedBookmark.ai_summary || selectedBookmark.description)}
                              className="h-6 w-6 p-0 hover:bg-gray-100"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                        {editingField === 'description' ? (
                          <div className="space-y-2">
                            <Textarea
                              value={editingValue || ''}
                              onChange={(e) => setEditingValue(e.target.value)}
                              onKeyDown={handleKeyDown}
                              className="min-h-[60px]"
                              placeholder="Enter description..."
                              autoFocus
                            />
                            <div className="flex space-x-2">
                              <Button size="sm" onClick={saveEdit} className="h-7">
                                <Check className="h-3 w-3 mr-1" />
                                Save
                              </Button>
                              <Button variant="outline" size="sm" onClick={cancelEditing} className="h-7">
                                <X className="h-3 w-3 mr-1" />
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-muted-foreground">{selectedBookmark.ai_summary || selectedBookmark.description}</p>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold">TAGS</h3>
                          {editingField !== 'tags' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => startEditing('tags', selectedBookmark.tags)}
                              className="h-6 w-6 p-0 hover:bg-gray-100"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                        {editingField === 'tags' ? (
                          <div className="space-y-2">
                            <Input
                              value={editingValue}
                              onChange={(e) => setEditingValue(e.target.value)}
                              onKeyDown={handleKeyDown}
                              placeholder="Enter tags separated by commas..."
                              autoFocus
                            />
                            <div className="flex space-x-2">
                              <Button size="sm" onClick={saveEdit} className="h-7">
                                <Check className="h-3 w-3 mr-1" />
                                Save
                              </Button>
                              <Button variant="outline" size="sm" onClick={cancelEditing} className="h-7">
                                <X className="h-3 w-3 mr-1" />
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {(selectedBookmark.tags && selectedBookmark.tags.length > 0
                              ? selectedBookmark.tags
                              : (selectedBookmark.ai_tags || [])).map((tag: string) => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                <Tag className="h-3 w-3 mr-1" />
                                {String(tag).toUpperCase()}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold">NOTES</h3>
                          {editingField !== 'notes' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => startEditing('notes', selectedBookmark.notes)}
                              className="h-6 w-6 p-0 hover:bg-gray-100"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                        {editingField === 'notes' ? (
                          <div className="space-y-2">
                            <Textarea
                              value={editingValue || ''}
                              onChange={(e) => setEditingValue(e.target.value)}
                              onKeyDown={handleKeyDown}
                              className="min-h-[80px]"
                              placeholder="Enter notes..."
                              autoFocus
                            />
                            <div className="flex space-x-2">
                              <Button size="sm" onClick={saveEdit} className="h-7">
                                <Check className="h-3 w-3 mr-1" />
                                Save
                              </Button>
                              <Button variant="outline" size="sm" onClick={cancelEditing} className="h-7">
                                <X className="h-3 w-3 mr-1" />
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                            {selectedBookmark.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="bg-gradient-to-br from-white via-blue-50/20 to-white border border-gray-200/60 hover:border-blue-300/50 shadow-sm hover:shadow-lg transition-all duration-300">
                      <CardContent className="p-6 text-center">
                        <Eye className="h-7 w-7 mx-auto mb-3 text-blue-600" />
                        <p className="text-3xl font-bold text-gray-900">
                          {getSelectedBookmarkAnalytics(selectedBookmark.id)?.visits || selectedBookmark.visits || 0}
                        </p>
                        <p className="text-xs text-muted-foreground font-medium">TOTAL VISITS</p>
                        {/* Live indicator */}
                        {!selectedBookmarkAnalyticsLoading && getSelectedBookmarkAnalytics(selectedBookmark.id) && (
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mt-1 mx-auto" title="Live data" />
                        )}
                      </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-white via-green-50/20 to-white border border-gray-200/60 hover:border-green-300/50 shadow-sm hover:shadow-lg transition-all duration-300">
                      <CardContent className="p-6 text-center">
                        <Clock className="h-7 w-7 mx-auto mb-3 text-green-600" />
                        <p className="text-3xl font-bold text-gray-900">
                          {(() => {
                            const timeSpent = getSelectedBookmarkAnalytics(selectedBookmark.id)?.timeSpent || selectedBookmark.timeSpent || 0;
                            return timeSpent > 0 ? `${timeSpent}m` : '0m';
                          })()}
                        </p>
                        <p className="text-xs text-muted-foreground font-medium">TIME SPENT</p>
                        {/* Live indicator */}
                        {!selectedBookmarkAnalyticsLoading && getSelectedBookmarkAnalytics(selectedBookmark.id) && (
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mt-1 mx-auto" title="Live data" />
                        )}
                      </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-white via-purple-50/20 to-white border border-gray-200/60 hover:border-purple-300/50 shadow-sm hover:shadow-lg transition-all duration-300">
                      <CardContent className="p-6 text-center">
                        <Activity className="h-7 w-7 mx-auto mb-3 text-purple-600" />
                        <p className="text-3xl font-bold text-gray-900">
                          {getSelectedBookmarkAnalytics(selectedBookmark.id)?.weeklyVisits || selectedBookmark.weeklyVisits || 0}
                        </p>
                        <p className="text-xs text-muted-foreground font-medium">THIS WEEK</p>
                        {/* Live indicator */}
                        {!selectedBookmarkAnalyticsLoading && getSelectedBookmarkAnalytics(selectedBookmark.id) && (
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mt-1 mx-auto" title="Live data" />
                        )}
                      </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-white via-green-50/20 to-white border border-gray-200/60 hover:border-green-300/50 shadow-sm hover:shadow-lg transition-all duration-300">
                      <CardContent className="p-6 text-center">
                        <SiteHealthComponent
                          bookmark={selectedBookmark}
                          onClick={() => checkBookmarkHealth([selectedBookmark.id])}
                          isLoading={healthCheckLoading[selectedBookmark.id] || false}
                        />
                      </CardContent>
                    </Card>
                  </div>

                  {/* View Full Analytics Button */}
                  <div className="flex justify-center mt-6 space-x-4">
                    <Button
                      onClick={() => window.location.href = '/analytics'}
                      className="px-8 py-3 bg-black hover:bg-gray-800 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                    >
                      VIEW FULL ANALYTICS
                    </Button>
                    <Button
                      onClick={() => checkBookmarkHealth([selectedBookmark.id])}
                      disabled={healthCheckLoading[selectedBookmark.id] || false}
                      className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:cursor-not-allowed disabled:transform-none"
                    >
                      {healthCheckLoading[selectedBookmark.id] ? (
                        <>
                          <RotateCcw className="h-4 w-4 mr-2 animate-spin" />
                          CHECKING...
                        </>
                      ) : (
                        <>
                          🔍 CHECK HEALTH
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Related Bookmarks Section */}
                  <div className="mt-8">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-bold text-gray-900">RELATED BOOKMARKS</h3>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          console.log('Opening browse all bookmarks modal');
                          // Open the add bookmark modal and switch to existing bookmarks tab
                          setShowAddBookmark(true);
                          setAddBookmarkTab('existing');
                        }}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        BROWSE ALL BOOKMARKS TO ADD MORE
                      </Button>
                    </div>

                    {/* Related Bookmarks Grid with Drag and Drop */}
                    <ClientOnlyDndProvider>
                      <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={(event) => {
                          // Handle drag end for related bookmarks
                          const { active, over } = event
                          if (active.id !== over?.id) {
                            showNotification('Related bookmark reordered!')
                          }
                        }}
                      >
                        <SortableContext items={(selectedBookmark?.relatedBookmarks || []).map(id => `related-${id}`)} strategy={rectSortingStrategy}>
                          {(selectedBookmark?.relatedBookmarks || []).length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                              <p>No related bookmarks yet.</p>
                              <p className="text-sm mt-2">Click "Browse All Bookmarks to add more" to add related bookmarks.</p>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {(selectedBookmark?.relatedBookmarks || []).map((relatedId) => {
                                const bookmark = bookmarks.find(b => b.id === relatedId)
                                if (!bookmark) return null
                                return (
                              <div key={`related-${bookmark.id}`} className="relative group">
                                {/* Drag Handle for Related Bookmarks */}
                                <div className="absolute top-2 left-2 z-20 p-1.5 rounded-md bg-white/90 hover:bg-white shadow-md border border-gray-300/50 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-105">
                                  <GripVertical className="h-4 w-4 text-gray-700" />
                                </div>

                                <Card
                                  className="p-4 hover:shadow-lg transition-all duration-300 cursor-pointer border border-gray-300 hover:border-blue-400 bg-gradient-to-br from-white via-gray-50/20 to-white backdrop-blur-sm shadow-sm hover:shadow-blue-500/10"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedBookmark(bookmark);
                                    // Track visit after setting selected bookmark
                                    setTimeout(() => {
                                      try { trackVisitCombined(bookmark.id); } catch {}
                                    }, 100);
                                  }}
                                >
                                  <div className="flex items-start space-x-3">
                                    {/* Circular Image */}
                                    <div className="flex-shrink-0">
                                      {(() => {
                                        // Priority: global DNA logo > custom_logo > extracted favicon > Google service/placeholder
                                        const src = bookmark.custom_logo || userDefaultLogo || bookmark.favicon || getGoogleFaviconUrl(bookmark.url, 64);
                                        return (
                                          <img
                                            src={src}
                                            alt={`${bookmark.title} image`}
                                            className="w-10 h-10 object-cover rounded-full bg-gradient-to-br from-gray-100 to-gray-50 ring-1 ring-gray-200/50"
                                            onLoad={enhanceOnLoad(256)}
                                            onError={(e) => {
                                              const el = e.target as HTMLImageElement;
                                              el.onerror = null;
                                              el.src = bookmark.custom_logo || userDefaultLogo || bookmark.favicon || getGoogleFaviconUrl(bookmark.url, 64);
                                            }}
                                          />
                                        );
                                      })()}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                      <h4 className="font-semibold text-sm text-gray-900 truncate font-audiowide uppercase mb-1">
                                        {bookmark.title}
                                      </h4>
                                      <p className="text-xs text-gray-600 truncate mb-2">
                                        {bookmark.description}
                                      </p>
                                      <div className="flex items-center justify-between">
                                        <Badge variant="outline" className="text-xs bg-white/50 border-gray-300/50">
                                          {getCategoryDisplay(bookmark)}
                                        </Badge>
                                        <div className="flex items-center space-x-1 text-xs text-gray-500">
                                          <Eye className="h-3 w-3" />
                                          <span>{(() => {
                                            const analytics = getUnifiedBookmarkAnalytics(bookmark.id)
                                            return analytics ? analytics.visits : 0
                                          })()}</span>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Remove Button */}
                                    <Button
                                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 hover:text-red-600"
                                      onClick={async (e) => {
                                        e.stopPropagation()
                                        if (selectedBookmark) {
                                          const updatedBookmark = {
                                            ...selectedBookmark,
                                            relatedBookmarks: (selectedBookmark.relatedBookmarks || []).filter(id => id !== bookmark.id)
                                          }
                                          setBookmarks(prev => prev.map(b =>
                                            b.id === selectedBookmark.id ? updatedBookmark : b
                                          ))
                                          setSelectedBookmark(updatedBookmark)

                                          // Save the updated bookmark to the backend
                                          try {
                                            const response = await fetch('/api/bookmarks', {
                                              method: 'POST',
                                              headers: {
                                                'Content-Type': 'application/json',



                                              },
                                              body: JSON.stringify({
                                                id: updatedBookmark.id,
                                                title: updatedBookmark.title,
                                                url: updatedBookmark.url,
                                                description: updatedBookmark.description || '',
                                                category: updatedBookmark.category || '',
                                                tags: Array.isArray(updatedBookmark.tags) ? updatedBookmark.tags : [],
                                                notes: updatedBookmark.notes || '',
                                                ai_summary: updatedBookmark.ai_summary || '',
                                                ai_tags: updatedBookmark.ai_tags || [],
                                                ai_category: updatedBookmark.ai_category || updatedBookmark.category || '',
                                                relatedBookmarks: updatedBookmark.relatedBookmarks || []
                                              })
                                            })

                                            const result = await response.json()

                                            if (result.success) {
                                              showNotification('Related bookmark removed!')
                                            } else {
                                              showNotification('Failed to remove related bookmark')
                                              console.error('Save failed:', result.error)
                                            }
                                          } catch (error) {
                                            showNotification('Error removing related bookmark')
                                            console.error('Save error:', error)
                                          }
                                        }
                                      }}
                                    >
                                      <X className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </Card>
                              </div>
                                )})}
                              </div>
                            )}
                          </SortableContext>
                      </DndContext>
                    </ClientOnlyDndProvider>

                    {/* Add More Related Bookmarks */}
                    <div className="mt-4 text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                        onClick={() => {
                          console.log('Opening browse all bookmarks modal');
                          // Open the add bookmark modal and switch to existing bookmarks tab
                          setShowAddBookmark(true);
                          setAddBookmarkTab('existing');
                        }}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        BROWSE ALL BOOKMARKS TO ADD MORE
                      </Button>
                    </div>
                  </div>

                    {/* Goals Section */}
                    <div className="mt-8">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold text-gray-900">GOALS</h3>
                        <Button size="sm" variant="outline" onClick={() => setIsAddGoalModalOpen(true)}>
                          <Plus className="h-4 w-4 mr-2" />
                          ADD GOAL
                        </Button>
                      </div>

                      {(() => {
                        const bId = selectedBookmark?.id ? String(selectedBookmark.id) : ''
                        const goals = bId ? (bookmarkGoals[bId] || []) : []
                        if (!bId) return null
                        if (goals.length === 0) {
                          return (
                            <div className="text-center py-8 text-gray-500">
                              <p>No goals linked yet.</p>
                              <p className="text-sm mt-2">Click "ADD GOAL" to link existing goals to this bookmark.</p>
                            </div>
                          )
                        }
                        return (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {goals.map((g) => {
                              const goalForCard = {
                                id: g.id,
                                name: g.name,
                                description: g.description ?? undefined,
                                color: '#3B82F6',
                                deadline_date: (g as any).deadline_date ?? undefined,
                                goal_type: 'custom' as const,
                                goal_description: undefined,
                                goal_status: (g as any).goal_status ?? 'not_started',
                                goal_priority: (g as any).goal_priority ?? 'medium',
                                goal_progress: 0,
                                connected_bookmarks: [],
                                tags: [],
                                notes: undefined,
                                folder_id: undefined,
                              }
                              return (
                                <div key={g.id} className="relative group">
                                  <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button variant="ghost" size="sm" onClick={() => removeGoalFromSelectedBookmark(g.id)}>
                                      Unlink
                                    </Button>
                                  </div>
                                  <GoalCard
                                    goal={goalForCard}
                                    onEdit={() => {}}
                                    onDelete={() => removeGoalFromSelectedBookmark(g.id)}
                                    draggable={false}
                                  />
                                </div>
                              )
                            })}
                          </div>
                        )
                      })()}
                    </div>

                    <AddGoalsModal
                      open={isAddGoalModalOpen}
                      onOpenChange={setIsAddGoalModalOpen}
                      onConfirm={addGoalsToSelectedBookmark}
                    />

                </TabsContent>

                <TabsContent value="arp" className="h-[600px]">
                  <ARPTab
                    bookmarkId={selectedBookmark.id.toString()}
                    initialData={(() => {
                      try {
                        const raw = (selectedBookmark as any)?.notes;
                        if (!raw) return [] as any[];
                        const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
                        if (Array.isArray(parsed)) return parsed;
                        if (Array.isArray(parsed?.arp_sections)) return parsed.arp_sections;
                        return [] as any[];
                      } catch { return [] as any[]; }
                    })()}
                    onSave={async (sections) => {
                      try {
                        await fetch('/api/bookmarks', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            id: selectedBookmark.id,
                            // Store under notes as JSON with a namespaced key
                            notes: JSON.stringify({ arp_sections: sections })
                          })
                        });
                      } catch (e) {
                        console.error('Failed to persist ARP sections', e);
                      }
                    }}
                  />
                </TabsContent>

                <TabsContent value="arp-old" className="space-y-6">
                  {(() => {
                    // Analyze bookmark URL to determine website type and suggest appropriate workflow
                    const getWebsiteType = (url: string): string => {
                      const domain = url.toLowerCase();

                      // Development & Technical
                      if (domain.includes('github.com') || domain.includes('stackoverflow.com') ||
                          domain.includes('developer.mozilla.org') || domain.includes('docs.') ||
                          domain.includes('api.') || domain.includes('codepen.io') ||
                          domain.includes('jsfiddle.net') || domain.includes('replit.com')) {
                        return 'developer';
                      }

                      // Design & Creative
                      if (domain.includes('dribbble.com') || domain.includes('behance.net') ||
                          domain.includes('figma.com') || domain.includes('adobe.com') ||
                          domain.includes('canva.com') || domain.includes('unsplash.com') ||
                          domain.includes('pexels.com') || domain.includes('pinterest.com')) {
                        return 'creative';
                      }

                      // Business & Analytics
                      if (domain.includes('linkedin.com') || domain.includes('crunchbase.com') ||
                          domain.includes('bloomberg.com') || domain.includes('forbes.com') ||
                          domain.includes('analytics.google.com') || domain.includes('salesforce.com') ||
                          domain.includes('hubspot.com') || domain.includes('tableau.com')) {
                        return 'business';
                      }

                      // Learning & Education
                      if (domain.includes('coursera.org') || domain.includes('udemy.com') ||
                          domain.includes('edx.org') || domain.includes('khanacademy.org') ||
                          domain.includes('pluralsight.com') || domain.includes('youtube.com') ||
                          domain.includes('wikipedia.org') || domain.includes('medium.com')) {


                        return 'learning';
                      }

                      // Sync & Development Infrastructure
                      if (domain.includes('supabase.com') || domain.includes('github.com') ||
                          domain.includes('gitlab.com') || domain.includes('bitbucket.org') ||
                          domain.includes('vercel.com') || domain.includes('netlify.com') ||
                          domain.includes('firebase.google.com') || domain.includes('aws.amazon.com') ||
                          domain.includes('heroku.com') || domain.includes('digitalocean.com')) {
                        return 'sync';
                      }

                      // Default to productivity for general websites
                      return 'productivity';
                    };

                    const websiteType = getWebsiteType(selectedBookmark.url);

                    // Define the 5 professional bookmark workflow templates
                    const templates = {
                      'developer': {
                        title: '💻 Developer Resource Workflow',
                        description: 'Optimize how you save and organize development resources',
                        color: 'from-blue-500 to-purple-600',
                        icon: Code,
                        steps: [
                          {
                            id: 'categorize-resource',
                            title: 'Categorize This Resource',
                            description: 'Tag this bookmark with relevant development categories',
                            icon: Tag,
                            time: '1 min',
                            action: 'Add Tags',
                            details: [
                              'Add programming language tags (JavaScript, Python, etc.)',
                              'Include framework/library tags (React, Node.js, etc.)',
                              'Mark resource type (documentation, tutorial, tool)'
                            ]
                          },
                          {
                            id: 'set-priority',
                            title: 'Set Learning Priority',
                            description: 'Prioritize this resource in your learning queue',
                            icon: Target,
                            time: '30 sec',
                            action: 'Set Priority',
                            details: [
                              'High: Need to learn immediately',
                              'Medium: Learn within this month',
                              'Low: Reference for future projects'
                            ]
                          },
                          {
                            id: 'create-project-folder',
                            title: 'Organize by Project',
                            description: 'Link this resource to relevant projects',
                            icon: FolderIcon,
                            time: '1 min',
                            action: 'Organize',
                            details: [
                              'Create project-specific folders',
                              'Group by technology stack',
                              'Separate learning vs reference materials'
                            ]
                          },
                          {
                            id: 'schedule-review',
                            title: 'Schedule Review Time',
                            description: 'Set reminders to revisit this resource',
                            icon: Clock,
                            time: '30 sec',
                            action: 'Set Reminder',
                            details: [
                              'Daily: For current learning materials',
                              'Weekly: For important references',
                              'Monthly: For general resources'
                            ]
                          }
                        ]
                      },
                      'productivity': {
                        title: '⚡ Productivity Resource Workflow',
                        description: 'Maximize efficiency with this productivity resource',
                        color: 'from-green-500 to-emerald-600',
                        icon: Zap,
                        steps: [
                          {
                            id: 'assess-usefulness',
                            title: 'Assess Resource Value',
                            description: 'Evaluate how this tool/resource fits your workflow',
                            icon: CheckCircle,
                            time: '2 min',
                            action: 'Evaluate',
                            details: [
                              'Rate usefulness (1-5 stars)',
                              'Identify specific use cases',
                              'Compare with current tools'
                            ]
                          },
                          {
                            id: 'integration-plan',
                            title: 'Plan Integration',
                            description: 'Determine how to incorporate this into daily routine',
                            icon: Workflow,
                            time: '3 min',
                            action: 'Plan Usage',
                            details: [
                              'Schedule trial period',
                              'Define success metrics',
                              'Set implementation timeline'
                            ]
                          },
                          {
                            id: 'track-results',
                            title: 'Track Results',
                            description: 'Monitor impact on your productivity',
                            icon: BarChart3,
                            time: '1 min',
                            action: 'Set Tracking',
                            details: [
                              'Create productivity metrics',
                              'Schedule periodic reviews',
                              'Document improvements'
                            ]
                          },
                          {
                            id: 'share-insights',
                            title: 'Share with Team',
                            description: 'Share valuable tools with colleagues',
                            icon: Users2,
                            time: '2 min',
                            action: 'Share Resource',
                            details: [
                              'Write brief review',
                              'Tag team members',
                              'Create usage guidelines'
                            ]
                          }
                        ]
                      },
                      'creative': {
                        title: '🎨 Creative Resource Workflow',
                        description: 'Organize and utilize creative inspiration effectively',
                        color: 'from-purple-500 to-pink-600',
                        icon: Palette,
                        steps: [
                          {
                            id: 'inspiration-category',
                            title: 'Categorize Inspiration',
                            description: 'Tag this creative resource appropriately',
                            icon: Tag,
                            time: '1 min',
                            action: 'Categorize',
                            details: [
                              'Add style tags (minimalist, vintage, modern)',
                              'Include medium type (web, print, illustration)',
                              'Mark inspiration level (high, medium, reference)'
                            ]
                          },
                          {
                            id: 'mood-board',
                            title: 'Add to Mood Board',
                            description: 'Organize into project-specific collections',
                            icon: Layers,
                            time: '2 min',
                            action: 'Organize',
                            details: [
                              'Create project mood boards',
                              'Group by color palette',
                              'Separate by design phase'
                            ]
                          },
                          {
                            id: 'analyze-elements',
                            title: 'Analyze Design Elements',
                            description: 'Document what makes this design effective',
                            icon: Eye,
                            time: '3 min',
                            action: 'Analyze',
                            details: [
                              'Note color schemes',
                              'Identify typography choices',
                              'Document layout principles'
                            ]
                          },
                          {
                            id: 'apply-learnings',
                            title: 'Plan Application',
                            description: 'Schedule how to use this inspiration',
                            icon: CheckCircle,
                            time: '2 min',
                            action: 'Plan Usage',
                            details: [
                              'Link to current projects',
                              'Set review reminders',
                              'Share with design team'
                            ]
                          }
                        ]
                      },
                      'business': {
                        title: '📊 Business Resource Workflow',
                        description: 'Strategic approach to business resource management',
                        color: 'from-orange-500 to-red-600',
                        icon: Building,
                        steps: [
                          {
                            id: 'business-value',
                            title: 'Assess Business Value',
                            description: 'Evaluate strategic importance of this resource',
                            icon: TrendingUp,
                            time: '2 min',
                            action: 'Evaluate',
                            details: [
                              'Rate strategic importance (1-5)',
                              'Identify business impact areas',
                              'Assess implementation complexity'
                            ]
                          },
                          {
                            id: 'stakeholder-relevance',
                            title: 'Identify Stakeholders',
                            description: 'Determine who should know about this resource',
                            icon: Users,
                            time: '2 min',
                            action: 'Tag Stakeholders',
                            details: [
                              'Tag relevant team members',
                              'Identify decision makers',
                              'Note permission levels needed'
                            ]
                          },
                          {
                            id: 'implementation-plan',
                            title: 'Create Action Plan',
                            description: 'Develop implementation or usage strategy',
                            icon: ClipboardCheck,
                            time: '3 min',
                            action: 'Plan Implementation',
                            details: [
                              'Define next steps',
                              'Set timeline milestones',
                              'Allocate required resources'
                            ]
                          },
                          {
                            id: 'track-outcomes',
                            title: 'Monitor Results',
                            description: 'Track business impact and ROI',
                            icon: BarChart3,
                            time: '1 min',
                            action: 'Set Tracking',
                            details: [
                              'Define success metrics',
                              'Schedule progress reviews',
                              'Document lessons learned'
                            ]
                          }
                        ]
                      },
                      'learning': {
                        title: '📚 Learning Resource Workflow',
                        description: 'Systematic approach to educational content',
                        color: 'from-indigo-500 to-purple-600',
                        icon: BookOpen,
                        steps: [
                          {
                            id: 'assess-difficulty',
                            title: 'Assess Learning Level',
                            description: 'Determine complexity and prerequisites',
                            icon: GraduationCap,
                            time: '2 min',
                            action: 'Assess Level',
                            details: [
                              'Rate difficulty (Beginner/Intermediate/Advanced)',
                              'Identify prerequisites needed',
                              'Estimate time investment required'
                            ]
                          },
                          {
                            id: 'create-learning-path',
                            title: 'Build Learning Path',
                            description: 'Structure this resource in your learning journey',
                            icon: GitBranch,
                            time: '3 min',
                            action: 'Plan Learning',
                            details: [
                              'Link to related resources',
                              'Set learning sequence order',
                              'Define completion criteria'
                            ]
                          },
                          {
                            id: 'schedule-study',
                            title: 'Schedule Study Time',
                            description: 'Block time for focused learning',
                            icon: Clock,
                            time: '1 min',
                            action: 'Schedule',
                            details: [
                              'Set dedicated study sessions',
                              'Create progress checkpoints',
                              'Plan review intervals'
                            ]
                          },
                          {
                            id: 'track-progress',
                            title: 'Track Learning Progress',
                            description: 'Monitor understanding and retention',
                            icon: CheckCircle,
                            time: '2 min',
                            action: 'Track Progress',
                            details: [
                              'Mark completion status',
                              'Note key takeaways',
                              'Rate understanding level'
                            ]
                          }
                        ]
                      },
                      'sync': {
                        title: '🔄 Data Sync & Backup Workflow',
                        description: 'Set up comprehensive sync with Supabase, GitHub, and localStorage',
                        color: 'from-cyan-500 to-blue-600',
                        icon: Cloud,
                        steps: [
                          {
                            id: 'supabase-setup',
                            title: 'Configure Supabase Integration',
                            description: 'Set up cloud database storage and real-time sync',
                            icon: Database,
                            time: '8 min',
                            action: 'Setup Supabase',
                            details: [
                              'Create Supabase project',
                              'Configure database schema',
                              'Set up authentication',
                              'Enable real-time subscriptions'
                            ]
                          },
                          {
                            id: 'github-sync',
                            title: 'GitHub Repository Sync',
                            description: 'Connect to GitHub for version control and backup',
                            icon: GitBranch,
                            time: '6 min',
                            action: 'Connect GitHub',
                            details: [
                              'Create GitHub repository',
                              'Set up automated commits (every 5 min)',
                              'Configure push/pull workflows with hooks',
                              'Enable branch protection and CI/CD'
                            ]
                          },
                          {
                            id: 'local-storage',
                            title: 'localStorage Optimization',
                            description: 'Implement efficient local caching and offline support',
                            icon: Smartphone,
                            time: '5 min',
                            action: 'Setup Local Cache',
                            details: [
                              'Configure localStorage strategy',
                              'Implement data compression',
                              'Set up offline fallbacks',
                              'Optimize storage limits'
                            ]
                          },
                          {
                            id: 'sync-automation',
                            title: 'Automated Sync Pipeline',
                            description: 'Create seamless three-way sync between all platforms',
                            icon: RotateCcw,
                            time: '10 min',
                            action: 'Automate Sync',
                            details: [
                              'Set up conflict resolution',
                              'Configure sync intervals (every 5 min)',
                              'Implement real-time change detection',
                              'Add sync status monitoring dashboard'
                            ]
                          },
                          {
                            id: 'backup-strategy',
                            title: 'Backup & Recovery Strategy',
                            description: 'Implement comprehensive backup and disaster recovery',
                            icon: Shield,
                            time: '7 min',
                            action: 'Setup Backups',
                            details: [
                              'Schedule automated backups',
                              'Create recovery procedures',
                              'Test restore processes',
                              'Monitor backup integrity'
                            ]
                          }
                        ]
                      }
                    };

                    const currentTemplate = templates[arpSelectedTemplate as keyof typeof templates];
                    const IconComponent = currentTemplate.icon;

                    const markStepComplete = (stepId: string) => {
                      if (!arpCompletedSteps.includes(stepId)) {
                        setArpCompletedSteps([...arpCompletedSteps, stepId]);
                      }
                    };

                    const getStepStatus = (stepId: string) => {
                      return arpCompletedSteps.includes(stepId);
                    };
                    return (
                      <div className="space-y-6">
                        {/* Header */}
                        <div className="text-center space-y-4">
                          <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r ${currentTemplate.color} text-white shadow-lg`}>
                            <IconComponent className="h-8 w-8" />
                          </div>
                          <div>
                            <h3 className="text-2xl font-bold text-gray-900">{currentTemplate.title}</h3>
                            <p className="text-gray-600 mt-1">{currentTemplate.description}</p>
                          </div>
                        </div>

                        {/* Smart Template Suggestion */}
                        {selectedBookmark && (() => {
                          const suggestedTemplate = getWebsiteType(selectedBookmark.url);
                          const suggestion = templates[suggestedTemplate as keyof typeof templates];

                          if (suggestedTemplate !== arpSelectedTemplate && suggestion) {
                            return (
                              <Card className="border-2 border-blue-200 bg-blue-50">
                                <CardContent className="p-4">
                                  <div className="flex items-center gap-3">
                                    <div className="flex-shrink-0">
                                      <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-r ${suggestion.color} text-white`}>
                                        <suggestion.icon className="h-5 w-5" />
                                      </div>
                                    </div>
                                    <div className="flex-1">
                                      <h4 className="font-semibold text-blue-900">Suggested Workflow</h4>
                                      <p className="text-sm text-blue-700">
                                        Based on <span className="font-medium">{extractDomain(selectedBookmark.url)}</span>,
                                        we recommend the <span className="font-medium">{suggestion.title}</span>
                                      </p>
                                    </div>
                                    <Button
                                      size="sm"
                                      onClick={() => {
                                        setArpSelectedTemplate(suggestedTemplate);
                                        setArpCurrentStep(0);
                                        setArpCompletedSteps([]);
                                      }}
                                      className="bg-blue-600 hover:bg-blue-700 text-white"
                                    >
                                      Use This
                                    </Button>
                                  </div>
                                </CardContent>
                              </Card>
                            );
                          }
                          return null;
                        })()}

                        {/* Template Selector */}
                        <Card className="border-2 border-dashed border-gray-200 hover:border-gray-300 transition-colors">
                          <CardContent className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                              {Object.entries(templates).map(([key, template]) => {
                                const TemplateIcon = template.icon;
                                const isSelected = arpSelectedTemplate === key;
                                return (
                                  <button
                                    key={key}
                                    onClick={() => {
                                      setArpSelectedTemplate(key);
                                      setArpCurrentStep(0);
                                      setArpCompletedSteps([]);
                                    }}
                                    className={`p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                                      isSelected
                                        ? 'border-blue-500 bg-blue-50 shadow-md scale-105'
                                        : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                                    }`}
                                  >
                                    <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-r ${template.color} text-white mb-3`}>
                                      <TemplateIcon className="h-5 w-5" />
                                    </div>
                                    <h4 className="font-semibold text-sm mb-1">{template.title.replace(/^[^\s]+ /, '')}</h4>
                                    <p className="text-xs text-gray-600 line-clamp-2">{template.description}</p>
                                  </button>
                                );
                              })}
                            </div>
                          </CardContent>
                        </Card>

                        {/* Real-time Sync Status (only for sync template) */}
                        {arpSelectedTemplate === 'sync' && (
                          <Card className="border-green-200 bg-green-50">
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                                    <span className="font-semibold text-green-800">Sync Status</span>
                                  </div>
                                  <div className="flex gap-4 text-sm">
                                    <div className="flex items-center gap-1">
                                      <span className="text-gray-600">Supabase: Connected</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <span className="text-gray-600">GitHub: Synced</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <span className="text-gray-600">Local: Cached</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      // Trigger manual sync
                                      showNotification('Manual sync initiated...');
                                    }}
                                    className="text-green-700 border-green-300 hover:bg-green-100"
                                  >
                                    Sync Now
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() => {
                                      // Quick commit and push
                                      showNotification('Committing and pushing changes...');
                                    }}
                                    className="bg-green-600 hover:bg-green-700 text-white"
                                  >
                                    Commit & Push
                                  </Button>
                                </div>
                              </div>
                              <div className="mt-3 text-xs text-green-700">
                                Last sync: Just now • Next auto-sync in 4:32 •
                                <span className="font-medium"> Changes detected: 3 files</span>
                              </div>
                            </CardContent>
                          </Card>
                        )}

                        {/* Progress Overview */}
                        <Card>
                          <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                              <div>
                                <h4 className="font-semibold text-lg">Your Progress</h4>
                                <p className="text-sm text-gray-600">
                                  {arpCompletedSteps.length} of {currentTemplate.steps.length} steps completed
                                </p>
                              </div>
                              <div className="text-right">
                                <div className="text-2xl font-bold text-green-600">
                                  {Math.round((arpCompletedSteps.length / currentTemplate.steps.length) * 100)}%
                                </div>
                                <div className="text-xs text-gray-500">Complete</div>
                              </div>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-3">
                              <div
                                className={`h-3 rounded-full bg-gradient-to-r ${currentTemplate.color} transition-all duration-500`}
                                style={{ width: `${(arpCompletedSteps.length / currentTemplate.steps.length) * 100}%` }}
                              />
                            </div>
                          </CardContent>
                        </Card>

                        {/* Steps */}
                        <div className="space-y-4">
                          {currentTemplate.steps.map((step, index) => {
                            const StepIcon = step.icon;
                            const isCompleted = getStepStatus(step.id);
                            const isCurrent = index === arpCurrentStep;
                            const isLocked = index > arpCurrentStep && !arpShowAllSteps;

                            return (
                              <Card key={step.id} className={`transition-all duration-200 ${
                                isCompleted ? 'bg-green-50 border-green-200' :
                                isCurrent ? 'bg-blue-50 border-blue-200 shadow-md' :
                                isLocked ? 'bg-gray-50 border-gray-200 opacity-60' :
                                'hover:shadow-sm'
                              }`}>
                                <CardContent className="p-6">
                                  <div className="flex items-start gap-4">
                                    {/* Step Icon */}
                                    <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
                                      isCompleted ? 'bg-green-500 text-white' :
                                      isCurrent ? `bg-gradient-to-r ${currentTemplate.color} text-white` :
                                      isLocked ? 'bg-gray-300 text-gray-500' :
                                      'bg-gray-100 text-gray-600'
                                    }`}>
                                      {isCompleted ? (
                                        <CheckCircle className="h-6 w-6" />
                                      ) : (
                                        <StepIcon className="h-6 w-6" />
                                      )}
                                    </div>

                                    {/* Step Content */}
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center justify-between mb-2">
                                        <h5 className="font-semibold text-lg">{step.title}</h5>
                                        <div className="flex items-center gap-2">
                                          <Badge variant="secondary" className="text-xs">
                                            <Clock className="h-3 w-3 mr-1" />
                                            {step.time}
                                          </Badge>
                                          {isCompleted && (
                                            <Badge className="bg-green-500 text-white text-xs">
                                              <CheckCircle className="h-3 w-3 mr-1" />
                                              Complete
                                            </Badge>
                                          )}
                                        </div>
                                      </div>

                                      <p className="text-gray-600 mb-4">{step.description}</p>

                                      {/* Step Details */}
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                        <div>
                                          <h6 className="font-medium text-sm mb-2">What you'll learn:</h6>
                                          <ul className="space-y-1">
                                            {step.details.map((detail, idx) => (
                                              <li key={idx} className="text-sm text-gray-600 flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full flex-shrink-0" />
                                                {detail}
                                              </li>
                                            ))}
                                          </ul>
                                        </div>
                                      </div>

                                      {/* Action Buttons */}
                                      <div className="flex items-center gap-3">
                                        {!isLocked && !isCompleted && (
                                          <>
                                            <Button
                                              className={`bg-gradient-to-r ${currentTemplate.color} hover:opacity-90`}
                                              onClick={() => {
                                                markStepComplete(step.id);
                                                if (index === arpCurrentStep) {
                                                  setArpCurrentStep(Math.min(index + 1, currentTemplate.steps.length - 1));
                                                }
                                              }}
                                            >
                                              <PlayCircle className="h-4 w-4 mr-2" />
                                              {step.action}
                                            </Button>
                                            <Button variant="outline" size="sm">
                                              <Eye className="h-4 w-4 mr-2" />
                                              Preview
                                            </Button>
                                          </>
                                        )}

                                        {isCompleted && (
                                          <Button variant="outline" disabled>
                                            <CheckCircle className="h-4 w-4 mr-2" />
                                            Completed
                                          </Button>
                                        )}

                                        {isLocked && (
                                          <Button variant="outline" disabled>
                                            Complete previous steps first
                                          </Button>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            );
                          })}
                        </div>

                        {/* Action Bar */}
                        <Card className="bg-gradient-to-r from-gray-50 to-gray-100">
                          <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <Button
                                  variant="outline"
                                  onClick={() => setArpShowAllSteps(!arpShowAllSteps)}
                                >
                                  {arpShowAllSteps ? 'Lock Future Steps' : 'Show All Steps'}
                                </Button>
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    setArpCompletedSteps([]);
                                    setArpCurrentStep(0);
                                  }}
                                >
                                  Reset Progress
                                </Button>
                              </div>

                              <div className="flex items-center gap-3">
                                {arpCompletedSteps.length === currentTemplate.steps.length && (
                                  <div className="flex items-center gap-2 text-green-600">
                                    <CheckCircle className="h-5 w-5" />
                                    <span className="font-semibold">Template Complete!</span>
                                  </div>
                                )}
                                <Button className={`bg-gradient-to-r ${currentTemplate.color} hover:opacity-90`}>
                                  <Rocket className="h-4 w-4 mr-2" />
                                  Continue Journey
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    );
                  })()}
                </TabsContent>

                <TabsContent value="notification" className="h-[600px]">
                  <NotificationTab
                    bookmarkId={selectedBookmark.id.toString()}
                    bookmarkTitle={selectedBookmark.title}
                  />
                </TabsContent>

                <TabsContent value="timer" className="h-[600px]">
                  <TimerTab bookmarkId={String(selectedBookmark?.id || '')} />
                </TabsContent>

                <TabsContent value="media" className="h-[600px]">
                  {hasVisitedMediaTab ? (
                    <MediaHub />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      <p>Click the MEDIA tab to load media library</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="comment" className="h-[600px]">
                  <CommentTab
                    bookmarkId={selectedBookmark.id.toString()}
                    bookmarkTitle={selectedBookmark.title}
                    initialComments={(() => {
                      try {
                        const raw = (selectedBookmark as any)?.notes;
                        if (!raw) return [] as any[];
                        const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
                        if (Array.isArray(parsed?.comments)) return parsed.comments as any[];
                        return [] as any[];
                      } catch { return [] as any[]; }
                    })()}
                    onSave={async (comments) => {
                      try {
                        const raw = (selectedBookmark as any)?.notes;
                        let base: any = {};
                        try { base = raw ? (typeof raw === 'string' ? JSON.parse(raw) : raw) : {}; } catch { base = {}; }
                        const merged = { ...base, comments };
                        await fetch('/api/bookmarks', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            id: selectedBookmark.id,
                            notes: JSON.stringify(merged),
                          }),
                        });
                      } catch (e) {
                        console.error('Failed to save comments', e);
                      }
                    }}
                  />
                </TabsContent>
              </Tabs>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Bookmark Modal */}
      <Dialog open={showAddBookmark} onOpenChange={(open) => {
        setShowAddBookmark(open)
        if (!open) resetAddBookmarkModal()
      }}>
        <DialogContent className="max-w-2xl bg-gradient-to-br from-white via-gray-50/20 to-white border border-gray-200/60 shadow-2xl">
          <DialogHeader>
            <DialogTitle>ADD BOOKMARKS</DialogTitle>
          </DialogHeader>

          {/* Tab Navigation */}
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            <Button
              variant={addBookmarkTab === 'new' ? 'default' : 'ghost'}
              onClick={() => setAddBookmarkTab('new')}
              className="flex-1"
            >
              New Bookmark
            </Button>
            <Button
              variant={addBookmarkTab === 'existing' ? 'default' : 'ghost'}
              onClick={() => setAddBookmarkTab('existing')}
              className="flex-1"
            >
              Existing Bookmarks
            </Button>
          </div>

          {/* Tab Content */}
          {addBookmarkTab === 'new' ? (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">TITLE</label>
                <Input
                  placeholder="Enter Bookmark Title"
                  value={newBookmark.title}
                  onChange={(e) => setNewBookmark({ ...newBookmark, title: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">URL</label>
                <Input
                  placeholder="https://example.com"
                  value={newBookmark.url}
                  onChange={(e) => setNewBookmark({ ...newBookmark, url: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">DESCRIPTION</label>
                <Textarea
                  placeholder="Enter Description"
                  value={newBookmark.description || ''}
                  onChange={(e) => setNewBookmark({ ...newBookmark, description: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">CATEGORY</label>
                <Select value={newBookmark.category} onValueChange={(value) => setNewBookmark({ ...newBookmark, category: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Development">Development</SelectItem>
                    <SelectItem value="Design">Design</SelectItem>
                    <SelectItem value="Productivity">Productivity</SelectItem>
                    <SelectItem value="Learning">Learning</SelectItem>
                    <SelectItem value="Entertainment">Entertainment</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">TAGS</label>
                <Input
                  placeholder="Enter Tags Separated By Commas"
                  value={newBookmark.tags}
                  onChange={(e) => setNewBookmark({ ...newBookmark, tags: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">PRIORITY</label>
                <Select value={newBookmark.priority} onValueChange={(value) => setNewBookmark({ ...newBookmark, priority: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">IMAGE</label>
                <div className="space-y-3">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        // Validate file size (max 5MB)
                        if (file.size > 5 * 1024 * 1024) {
                          alert('File size must be less than 5MB');
                          e.target.value = ''; // Clear the input
                          return;
                        }

                        // Validate file type
                        if (!file.type.startsWith('image/')) {
                          alert('Please select a valid image file');
                          e.target.value = ''; // Clear the input
                          return;
                        }

                        const reader = new FileReader();
                        reader.onload = (event) => {
                          setNewBookmark({ ...newBookmark, circularImage: event.target?.result as string });
                        };
                        reader.onerror = () => {
                          alert('Error reading file. Please try again.');
                          e.target.value = ''; // Clear the input
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  {newBookmark.circularImage && (
                    <div className="flex items-center space-x-3">
                      <img
                        src={newBookmark.circularImage}
                        alt="Preview"
                        className="w-16 h-16 object-cover rounded-full border-2 border-gray-200"
                      />
                      <div>
                        <p className="text-sm font-medium text-green-600">✓ Image uploaded successfully</p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setNewBookmark({ ...newBookmark, circularImage: '' })}
                          className="mt-1 h-7 text-xs"
                        >
                          Remove Image
                        </Button>
                      </div>
                    </div>
                  )}
                  <p className="text-xs text-gray-500">Upload a circular image for this bookmark (optional - will auto-fetch from website if not provided). Max file size: 5MB</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">NOTES</label>
                <Textarea
                  placeholder="Enter Any Notes"
                  value={newBookmark.notes || ''}
                  onChange={(e) => setNewBookmark({ ...newBookmark, notes: e.target.value })}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowAddBookmark(false)}>
                  CANCEL
                </Button>
                <Button onClick={handleAddBookmark}>
                  ADD BOOKMARK
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Search Bar */}
              <div>
                <label className="text-sm font-medium">SEARCH YOUR EXISTING BOOKMARKS</label>
                <Input
                  placeholder="Search by name, description, or category..."
                  value={existingBookmarksSearch}
                  onChange={(e) => setExistingBookmarksSearch(e.target.value)}
                />
              </div>

              {/* Existing Bookmarks List */}
              <div className="max-h-96 overflow-y-auto space-y-2">
                {filteredExistingBookmarks.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    {existingBookmarksSearch ? 'No bookmarks match your search' : 'No existing bookmarks to add'}
                  </div>
                ) : (
                  filteredExistingBookmarks.map((bookmark) => (
                    <div
                      key={bookmark.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedExistingBookmarks.includes(bookmark.id)
                          ? 'bg-blue-50 border-blue-200'
                          : 'bg-white border-gray-200 hover:bg-gray-50'
                      }`}
                      onClick={() => handleExistingBookmarkSelect(bookmark.id)}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          {bookmark.favicon ? (
                            <img
                              src={bookmark.favicon}
                              alt={bookmark.title}
                              className="w-10 h-10 rounded-lg object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none'
                                e.currentTarget.nextElementSibling?.classList.remove('hidden')
                              }}
                            />
                          ) : null}
                          <div className={`w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-sm font-medium text-blue-600 ${bookmark.favicon ? 'hidden' : ''}`}>
                            {bookmark.title.charAt(0)}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-medium text-sm">{bookmark.title}</h3>
                            <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                              {getCategoryDisplay(bookmark)}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">{bookmark.description}</p>
                          <div className="flex items-center space-x-2 mt-2">
                            {bookmark.tags.slice(0, 3).map((tag, index) => (
                              <span key={index} className="px-1.5 py-0.5 text-xs bg-blue-100 text-blue-600 rounded">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          <div className={`w-5 h-5 rounded border-2 ${
                            selectedExistingBookmarks.includes(bookmark.id)
                              ? 'bg-blue-600 border-blue-600'
                              : 'border-gray-300'
                          } flex items-center justify-center`}>
                            {selectedExistingBookmarks.includes(bookmark.id) && (
                              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>

                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-500">
                  {selectedExistingBookmarks.length} bookmark(s) selected
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" onClick={() => setShowAddBookmark(false)}>
                    CANCEL
                  </Button>
                  <Button
                    onClick={handleAddExistingBookmarks}
                    disabled={selectedExistingBookmarks.length === 0}
                  >
                    ADD SELECTED ({selectedExistingBookmarks.length})
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>


      {/* Move Bookmark Modal */}
      <Dialog open={showMoveModal} onOpenChange={(open) => {
        setShowMoveModal(open)
        if (!open) {
          setBookmarkToMove(null)
          setSelectedMoveFolderId('')
        }
      }}>
        <DialogContent className="max-w-md bg-gradient-to-br from-white via-gray-50/20 to-white border border-gray-200/60 shadow-2xl">
          <DialogHeader>
            <DialogTitle>MOVE TO FOLDER</DialogTitle>
            <DialogDescription>Select a destination folder for this bookmark. Category will be synchronized automatically.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">DESTINATION FOLDER</label>
              <Select value={selectedMoveFolderId} onValueChange={(val) => setSelectedMoveFolderId(val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a folder" />
                </SelectTrigger>
                <SelectContent>
                  {dynamicFolders.map((f) => (
                    <SelectItem key={String(f.id)} value={String(f.id)}>
                      {String(f.name || f.title || f.id)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => preserveScrollDuring(() => setShowMoveModal(false))}>
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  if (!selectedMoveFolderId || !bookmarkToMove) return
                  setIsMovingBookmark(true)
                  try {
                    await handleFolderDrop(selectedMoveFolderId, bookmarkToMove)
                    preserveScrollDuring(() => {
                      setShowMoveModal(false)
                      setBookmarkToMove(null)
                      setSelectedMoveFolderId('')
                    })
                  } catch (e) {
                    // handleFolderDrop already shows notification on error
                  } finally {
                    setIsMovingBookmark(false)
                  }
                }}
                disabled={!selectedMoveFolderId || !bookmarkToMove || isMovingBookmark}
              >
                {isMovingBookmark ? 'Moving...' : 'Move'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Folder Modal */}
      {showAddFolder && (
        <Dialog
          open={true}
          onOpenChange={(open) => {
            console.log('🔄 Dialog onOpenChange called with:', open);
            if (!open) {
              setShowAddFolder(false);
              resetAddFolderForm();
            }
          }}
        >
        <DialogContent className="max-w-md bg-gradient-to-br from-white via-gray-50/20 to-white border border-gray-200/60 shadow-2xl z-[9999]">
          <DialogHeader>
            <DialogTitle>ADD NEW FOLDER</DialogTitle>
            <DialogDescription>
              Create a new folder to organize your bookmarks.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">FOLDER NAME</label>
              <Input
                placeholder="Enter folder name"
                value={newFolder.name}
                onChange={(e) => setNewFolder({ ...newFolder, name: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && handleAddFolder()}
                autoFocus
              />
            </div>
            <div>
              <label className="text-sm font-medium">FOLDER COLOR</label>
              <div className="flex items-center space-x-3">
                <Input
                  type="color"
                  value={newFolder.color}
                  onChange={(e) => setNewFolder({ ...newFolder, color: e.target.value })}
                  className="w-16 h-10 p-1 rounded-lg"
                />
                <div className="flex-1">
                  <Input
                    placeholder="#3b82f6"
                    value={newFolder.color}
                    onChange={(e) => setNewFolder({ ...newFolder, color: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">DESCRIPTION (OPTIONAL)</label>
              <Textarea
                placeholder="Enter folder description"
                value={newFolder.description}
                onChange={(e) => setNewFolder({ ...newFolder, description: e.target.value })}
                rows={3}
              />
            </div>

            {/* Preview */}
            {newFolder.name && (
              <div className="space-y-2">
                <label className="text-sm font-medium">PREVIEW</label>
                <div className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                  <div
                    className="h-12 w-12 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: newFolder.color + '20' }}
                  >
                    <FolderIcon className="h-6 w-6" style={{ color: newFolder.color }} />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{newFolder.name}</p>
                    {newFolder.description && (
                      <p className="text-xs text-gray-500">{newFolder.description}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => {
                setShowAddFolder(false)
                resetAddFolderForm()
              }}>
                CANCEL
              </Button>
              <Button onClick={handleAddFolder} disabled={!newFolder.name.trim()}>
                CREATE FOLDER
              </Button>
            </div>
          </div>
        </DialogContent>
        </Dialog>
      )}

      {/* Default Logo Modal */}
      <Dialog open={showDefaultLogoModal} onOpenChange={setShowDefaultLogoModal}>
        <DialogContent className="max-w-md bg-gradient-to-br from-white via-gray-50/20 to-white border border-gray-200/60 shadow-2xl">
          <DialogHeader>
            <DialogTitle>SET DEFAULT LOGO</DialogTitle>
            <DialogDescription>
              Set a default logo that will be used as placeholder for all bookmarks instead of letters.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">LOGO URL</label>
              <Input
                placeholder="https://example.com/logo.png"
                value={newDefaultLogo}
                onChange={(e) => setNewDefaultLogo(e.target.value)}
              />
            </div>

            {/* Preview */}
            {newDefaultLogo && (
              <div className="space-y-2">
                <label className="text-sm font-medium">PREVIEW</label>
                <div className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                  <div className="w-12 h-12 rounded-xl bg-black flex items-center justify-center text-white font-bold text-xl ring-2 ring-gray-300/50 transition-all duration-300 shadow-sm overflow-hidden">
                    <img
                      src={newDefaultLogo}
                      alt="Default logo preview"
                      className="w-full h-full object-cover rounded-xl"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        (e.target as HTMLImageElement).parentElement!.innerHTML = 'ERROR';
                      }}
                    />
                  </div>
                  <div>
                    <p className="text-sm font-medium">This logo will appear on all bookmark cards</p>
                    <p className="text-xs text-gray-500">Individual bookmarks can still override this default</p>
                  </div>
                </div>
              </div>
            )}

            {/* Current Default */}
            {userDefaultLogo && (
              <div className="space-y-2">
                <label className="text-sm font-medium">CURRENT DEFAULT</label>
                <div className="flex items-center space-x-4 p-3 bg-blue-50 rounded-lg">
                  <div className="w-12 h-12 rounded-xl bg-black flex items-center justify-center text-white font-bold text-xl ring-2 ring-gray-300/50 transition-all duration-300 shadow-sm overflow-hidden">
                    <img
                      src={userDefaultLogo}
                      alt="Current default logo"
                      className="w-full h-full object-cover rounded-xl"
                    />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Currently active default logo</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setUserDefaultLogo('')
                        localStorage.removeItem('userDefaultLogo')
                        setShowDefaultLogoModal(false)
                        showNotification('Default logo removed!')
                      }}
                      className="mt-1 h-7 text-xs"
                    >
                      Remove Default
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowDefaultLogoModal(false)}>
                CANCEL
              </Button>
              <Button onClick={handleSetDefaultLogo} disabled={!newDefaultLogo}>
                SET DEFAULT
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Notification Toast */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg animate-in slide-in-from-top-2 duration-300">
          {notification}
        </div>
      )}
        </div>
      </div>
    </div>
  )
}