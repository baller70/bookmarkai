// @ts-nocheck
"use client";

import React, { useMemo } from "react";
import { useEditor, EditorContent, JSONContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Underline from "@tiptap/extension-underline";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import HorizontalRule from "@tiptap/extension-horizontal-rule";
// import { SlashCommands } from "./extensions/slash-commands";
import './novel-editor.css'
import { toast } from '@/hooks/use-toast'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

import { Node } from '@tiptap/core'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'


// Extend TaskItem with custom attributes for task metadata
const TaskItemX = TaskItem.extend({
  addAttributes() {
    return {
      status: {
        default: 'not_started',
        parseHTML: el => el.getAttribute('data-status') || 'not_started',
        renderHTML: attrs => ({ 'data-status': attrs.status })
      },
      priority: {
        default: 'low',
        parseHTML: el => el.getAttribute('data-priority') || 'low',
        renderHTML: attrs => ({ 'data-priority': attrs.priority })
      },
      progress: {
        default: 0,
        parseHTML: el => {
          const v = el.getAttribute('data-progress');
          const n = v ? parseInt(v, 10) : 0;
          return isNaN(n) ? 0 : Math.max(0, Math.min(100, n));
        },
        renderHTML: attrs => ({ 'data-progress': String(attrs.progress ?? 0) })
      },
      dueDate: {
        default: null,
        parseHTML: el => el.getAttribute('data-due-date') || null,
        renderHTML: attrs => (attrs.dueDate ? { 'data-due-date': String(attrs.dueDate) } : {})
      },
      overdue: {
        default: false,
        parseHTML: el => (el.getAttribute('data-overdue') === 'true'),
        renderHTML: attrs => (attrs.overdue ? { 'data-overdue': 'true' } : {})
      },
      assignedToId: {
        default: null,
        parseHTML: el => el.getAttribute('data-assigned-to-id') || null,
        renderHTML: attrs => (attrs.assignedToId ? { 'data-assigned-to-id': String(attrs.assignedToId) } : {})
      },
      assignedToName: {
        default: null,
        parseHTML: el => el.getAttribute('data-assigned-to-name') || null,
        renderHTML: attrs => (attrs.assignedToName ? { 'data-assigned-to-name': String(attrs.assignedToName) } : {})
      },
      assignedToAvatar: {
        default: null,
        parseHTML: el => el.getAttribute('data-assigned-to-avatar') || null,
        renderHTML: attrs => (attrs.assignedToAvatar ? { 'data-assigned-to-avatar': String(attrs.assignedToAvatar) } : {})
      },
      linkedTaskId: {
        default: null,
        parseHTML: el => el.getAttribute('data-linked-task-id') || null,
        renderHTML: attrs => (attrs.linkedTaskId ? { 'data-linked-task-id': String(attrs.linkedTaskId) } : {})
      },
      linkedNotificationId: {
        default: null,
        parseHTML: el => el.getAttribute('data-linked-notification-id') || null,
        renderHTML: attrs => (attrs.linkedNotificationId ? { 'data-linked-notification-id': String(attrs.linkedNotificationId) } : {})
      },
    };
  },
});

// Helper to ensure we're on a task item before updating attributes
function setTaskItemAttrs(editor: any, attrs: Record<string, any>) {
  try {
    if (!editor) return;
    if (!editor.isActive('taskItem')) {
      editor.chain().focus().toggleTaskList().run();
    }
    editor.chain().focus().updateAttributes('taskItem', attrs).run();
  } catch {}
}

// --- Standalone metadata nodes (work anywhere in the doc) ---
const StatusLabel = Node.create({
  name: 'statusLabel',
  inline: true,
  group: 'inline',
  atom: true,
  selectable: true,
  addAttributes() {
    return { status: { default: 'not_started' as 'not_started'|'in_progress'|'completed'|'on_hold'|'cancelled' } };
  },
  parseHTML() { return [{ tag: 'span[data-node="statusLabel"]' }]; },
  renderHTML({ node }) {
    const status = node.attrs.status as string;
    const text = ({not_started:'Not Started',in_progress:'In Progress',completed:'Completed',on_hold:'On Hold',cancelled:'Cancelled'} as Record<string,string>)[status] || 'Not Started';
    return ['span', { 'data-node':'statusLabel', 'data-status': status, class: 'tt-status-badge' }, text];
  },
});

const PriorityLabel = Node.create({
  name: 'priorityLabel',
  inline: true,
  group: 'inline',
  atom: true,
  selectable: true,
  addAttributes() { return { priority: { default: 'low' as 'low'|'medium'|'high'|'critical' } }; },
  parseHTML() { return [{ tag: 'span[data-node="priorityLabel"]' }]; },
  renderHTML({ node }) {
    const p = node.attrs.priority as string;
    const text = p.charAt(0).toUpperCase() + p.slice(1);
    return ['span', { 'data-node':'priorityLabel', 'data-priority': p, class: 'tt-priority-badge' }, `Priority: ${text}`];
  },
});

const DueDateChip = Node.create({
  name: 'dueDateChip',
  inline: true,
  group: 'inline',
  atom: true,
  selectable: true,
  addAttributes() { return { date: { default: null as string | null } }; },
  parseHTML() { return [{ tag: 'span[data-node="dueDateChip"]' }]; },
  renderHTML({ node }) {
    const date = node.attrs.date as string | null;
    return ['span', { 'data-node':'dueDateChip', 'data-date': date ?? '', class: 'tt-date-chip' }, `Due Date: ${date ?? 'N/A'}`];
  },
});

const AssigneeChip = Node.create({
  name: 'assigneeChip',
  inline: true,
  group: 'inline',
  atom: true,
  selectable: true,
  addAttributes() { return { id: { default: null as string | null }, name: { default: null as string | null }, avatar: { default: null as string | null } }; },
  parseHTML() { return [{ tag: 'span[data-node="assigneeChip"]' }]; },
  renderHTML({ node }) {
    const name = (node.attrs.name as string) || 'Assignee';
    return ['span', { 'data-node':'assigneeChip', 'data-id': node.attrs.id || '', class: 'tt-assignee-chip' }, name];
  },
});

const NotificationBadge = Node.create({
  name: 'notificationBadge',
  inline: true,
  group: 'inline',
  atom: true,
  selectable: true,
  addAttributes() { return { id: { default: null as string | null }, title: { default: null as string | null } }; },
  parseHTML() { return [{ tag: 'span[data-node="notificationBadge"]' }]; },
  renderHTML({ node }) {
    const title = (node.attrs.title as string) || 'Notification';
    return ['span', { 'data-node':'notificationBadge', 'data-id': node.attrs.id || '', 'data-title': title, class: 'tt-notification-badge' }, `Notification: ${title}`];
  },
});

const ProgressBlock = Node.create({
  name: 'progressBlock',
  group: 'block',
  atom: true,
  selectable: true,
  addAttributes() {
    return {
      progress: { default: 0 as number },
      title: { default: '' as string },
      description: { default: '' as string },
      linkType: { default: null as 'task' | 'list' | null },
      linkId: { default: null as string | null },
    };
  },
  parseHTML() { return [{ tag: 'div[data-node="progressBlock"]' }]; },
  renderHTML({ node }) {
    const pct = Math.max(0, Math.min(100, Number(node.attrs.progress || 0)));
    const title = String(node.attrs.title || 'Progress');
    const desc = String(node.attrs.description || '');
    const linkType = node.attrs.linkType ? String(node.attrs.linkType) : '';
    const linkId = node.attrs.linkId ? String(node.attrs.linkId) : '';
    return [
      'div',
      { 'data-node': 'progressBlock', 'data-progress': String(pct), 'data-link-type': linkType, 'data-link-id': linkId, 'data-title': title, 'data-desc': desc, class: 'tt-progress-block' },
      ['div', { class: 'tt-progress-title' }, title],
      ['div', { class: 'tt-progress-desc' }, desc],
      ['div', { class: 'tt-progress-meter' }, ['div', { class: 'tt-progress-fill', style: `width: ${pct}%` }]],
      ['div', { class: 'tt-progress-line' }, `Progress: ${pct}%`],
    ];
  },
});



// Minimal block type used by existing consumers
type Block = {
  id: string;
  type: "paragraph" | "heading" | "list" | "quote" | "code" | "divider";
  data?: any;
  order: number;
};

function blocksToTipTapJSON(blocks: any[]): JSONContent {
  // Handle empty blocks by providing a default empty paragraph
  if (!blocks || blocks.length === 0) {
    return {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: []
        }
      ]
    };
  }

  const content = blocks.map((block) => {
    switch (block.type) {
      case "paragraph":
        return {
          type: "paragraph",
          content: block.data?.text ? [{ type: "text", text: block.data.text }] : [],
        };
      case "heading":
        return {
          type: "heading",
          attrs: { level: block.data?.level || 1 },
          content: block.data?.text ? [{ type: "text", text: block.data.text }] : [],
        };
      case "list":
        return {
          type: block.data?.style === "ordered" ? "orderedList" : "bulletList",
          content: (block.data?.items || []).map((item: string) => ({
            type: "listItem",
            content: [{ type: "paragraph", content: [{ type: "text", text: item }] }],
          })),
        };
      case "quote":
        return {
          type: "blockquote",
          content: [{ type: "paragraph", content: [{ type: "text", text: block.data?.text || "" }] }],
        };
      case "code":
        return {
          type: "codeBlock",
          attrs: { language: block.data?.language || "javascript" },
          content: [{ type: "text", text: block.data?.code || "" }],
        };
      case "divider":
        return { type: "horizontalRule" };
      default:
        return { type: "paragraph", content: [{ type: "text", text: block.data?.text || "" }] };
    }
  });

  // Ensure we always have at least one paragraph if content is empty
  if (content.length === 0) {
    content.push({
      type: "paragraph",
      content: []
    });
  }

  return {
    type: "doc",
    content: content,
  };
}

function tipTapJSONToBlocks(json: JSONContent): Block[] {
  const nodes = json?.content || [];
  // Generate timestamp once to avoid minification issues with Date.now() in production
  const timestamp = Date.now();
  return nodes.map((node: any, index: number) => {
    const id = `block-${timestamp}-${index}`;
    switch (node.type) {
      case "paragraph":
        return { id, type: "paragraph", data: { text: node.content?.map((n: any) => n.text).join("") || "" }, order: index };
      case "heading":
        return {
          id,
          type: "heading",
          data: { text: node.content?.map((n: any) => n.text).join("") || "", level: node.attrs?.level || 1 },
          order: index,
        };
      case "bulletList":
      case "orderedList":
        return {
          id,
          type: "list",
          data: {
            style: node.type === "orderedList" ? "ordered" : "unordered",
            items:
              node.content?.map((item: any) => item.content?.[0]?.content?.map((n: any) => n.text).join("") || "") || [],
          },
          order: index,
        };
      case "blockquote":
        return { id, type: "quote", data: { text: node.content?.[0]?.content?.map((n: any) => n.text).join("") || "" }, order: index };
      case "codeBlock":
        return {
          id,
          type: "code",
          data: { code: node.content?.map((n: any) => n.text).join("") || "", language: node.attrs?.language || "javascript" },
          order: index,
        };
      case "horizontalRule":
        return { id, type: "divider", data: {}, order: index };
      default:
        return { id, type: "paragraph", data: { text: "" }, order: index };
    }
  });
}

export function TipTapEditor({
  content,
  onChange,
  className = "",
  placeholder = "Press '/' for commands, or start writing...",
  bookmarkId,
}: {
  content: any[];
  onChange: (content: any[]) => void;
  className?: string;
  bookmarkId?: string;

  placeholder?: string;
}) {
  const [showSlashMenu, setShowSlashMenu] = React.useState(false);
  const [showAIGenerate, setShowAIGenerate] = React.useState(false);
  const [aiPrompt, setAIPrompt] = React.useState('');
  const [aiGenerating, setAIGenerating] = React.useState(false);
  const [slashPos, setSlashPos] = React.useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [slashQuery, setSlashQuery] = React.useState("");
  const lastSelectionRef = React.useRef<{ from: number; to: number } | null>(null);
  const saveCurrentSelection = (ed?: any) => {
    try {
      const state: any = ed?.state ?? editor?.state;
      if (!state) return;
      const { from, to } = state.selection;
      lastSelectionRef.current = { from, to };
    } catch {}
  };
  const restoreLastSelection = () => {
    try {
      const sel = lastSelectionRef.current;
      if (sel && editor) {
        editor.chain().setTextSelection(sel).focus().run();
      } else if (editor) {
        editor.chain().focus().run();
      }
    } catch {}
  };

  const runAIGenerate = async () => {
    try {
      if (!aiPrompt || aiPrompt.trim().length === 0) {
        toast({ title: 'Enter a prompt', description: 'Please describe what to write.', variant: 'destructive' as any });
        return;
      }
      setAIGenerating(true);
      restoreLastSelection();
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: aiPrompt })
      });
      const data = await res.json().catch(() => ({} as any));
      if (!res.ok) {
        toast({ title: 'AI request failed', description: data?.error || `Status ${res.status}`, variant: 'destructive' as any });
        return;
      }
      const text = data?.response ?? data?.text ?? '';
      if (text && editor) {
        editor.chain().focus().insertContent(text).run();
        setShowAIGenerate(false);
        setAIPrompt('');
      }
    } catch (e: any) {
      toast({ title: 'AI request error', description: String(e?.message || e) || 'Check your connection and API settings.', variant: 'destructive' as any });
    } finally {
      setAIGenerating(false);
    }
  };

  function getCaretRect() {
    try {
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) return null;
      const range = sel.getRangeAt(0).cloneRange();
      if (range.getClientRects().length === 0) {
        // insert temporary marker
        const span = document.createElement("span");
        span.appendChild(document.createTextNode("\u200b"));
        range.insertNode(span);
        const rect = span.getBoundingClientRect();
        span.parentNode?.removeChild(span);
        return rect;
      }

      return range.getBoundingClientRect();
    } catch {
      return null;
    }
  }

  // Dialog state for standalone commands
  const [showStatusDlg, setShowStatusDlg] = React.useState(false);
  const [statusVal, setStatusVal] = React.useState<'not_started'|'in_progress'|'completed'|'on_hold'|'cancelled'>('not_started');

  const [showPriorityDlg, setShowPriorityDlg] = React.useState(false);
  const [priorityVal, setPriorityVal] = React.useState<'low'|'medium'|'high'|'critical'>('low');

  const [showProgressDlg, setShowProgressDlg] = React.useState(false);
  const [progressVal, setProgressVal] = React.useState<number>(0);
  const [progressTaskId, setProgressTaskId] = React.useState<string | null>(null);
  const [progressTasks, setProgressTasks] = React.useState<Array<{ id: string; title: string }>>([]);

  const [showDueDlg, setShowDueDlg] = React.useState(false);
  const [dueDateVal, setDueDateVal] = React.useState<string>('');

  const [showAssigneeDlg, setShowAssigneeDlg] = React.useState(false);
  const [progressTitle, setProgressTitle] = React.useState<string>('');
  const [progressDesc, setProgressDesc] = React.useState<string>('');
  const [progressLinkMode, setProgressLinkMode] = React.useState<'none' | 'task' | 'list'>('none');
  const [progressListId, setProgressListId] = React.useState<string | null>(null);
  const [progressLists, setProgressLists] = React.useState<Array<{ id: string; name: string }>>([]);

  const [assigneeQuery, setAssigneeQuery] = React.useState('');
  const [assigneeResults, setAssigneeResults] = React.useState<Array<{ id: string; display_name?: string; name?: string; email?: string; avatar_url?: string }>>([]);
  const [assigneePicked, setAssigneePicked] = React.useState<{ id: string; name: string; avatar?: string } | null>(null);

  const [showNotifDlg, setShowNotifDlg] = React.useState(false);
  const [notifList, setNotifList] = React.useState<Array<{ id: string; title?: string; message?: string }>>([]);
  const [notifPicked, setNotifPicked] = React.useState<string | null>(null);

  // Track manual edits to avoid overwriting user-entered title when auto-filling
  const [titleManuallyEdited, setTitleManuallyEdited] = React.useState(false);

  // Inline overlay for clicking on inserted Progress blocks
  const [showProgressOverlay, setShowProgressOverlay] = React.useState(false);
  const [progressOverlayData, setProgressOverlayData] = React.useState<{
    title: string;
    description: string;
    progress: number;
    linkType: 'task' | 'list' | null;
    linkId: string | null;
  } | null>(null);
  // Inline overlay for clicking on inserted Notification badges
  const [showNotificationOverlay, setShowNotificationOverlay] = React.useState(false);
  const [notificationOverlayData, setNotificationOverlayData] = React.useState<{ id: string; title: string } | null>(null);

  const openInNotificationsFromOverlay = () => {
    try {
      const id = notificationOverlayData?.id || null;
      if (id) {
        try { localStorage.setItem('notifications.open', id); } catch {}
        try { window.dispatchEvent(new CustomEvent('notifications:open', { detail: { id } })); } catch {}
      }
      try { window.dispatchEvent(new CustomEvent('bookmarkModal:switchTab', { detail: 'notification' })); } catch {}
    } finally {
      setShowNotificationOverlay(false);
    }
  };


  const handleEditorClick = (e: React.MouseEvent) => {
    try {
      const el = e.target as HTMLElement;
      if (!el) return;

      // Progress block overlay
      const progressEl = el.closest('[data-node="progressBlock"]') as HTMLElement | null;

      if (progressEl) {
        e.preventDefault();
        e.stopPropagation();
        const title = progressEl.getAttribute('data-title') || 'Progress';
        const description = progressEl.getAttribute('data-desc') || '';
        const progress = Math.max(0, Math.min(100, parseInt(progressEl.getAttribute('data-progress') || '0', 10) || 0));
        const lt = progressEl.getAttribute('data-link-type');
        const linkType: 'task' | 'list' | null = lt === 'task' ? 'task' : lt === 'list' ? 'list' : null;
        const linkId = progressEl.getAttribute('data-link-id');
        setProgressOverlayData({ title, description, progress, linkType, linkId: linkId || null });
        setShowProgressOverlay(true);
        return;
      }

      // Notification overlay
      const notifEl = el.closest('[data-node="notificationBadge"]') as HTMLElement | null;
      if (notifEl) {
        e.preventDefault();
        e.stopPropagation();
        const nid = notifEl.getAttribute('data-id') || '';
        const ntitle = notifEl.getAttribute('data-title') || 'Notification';
        setNotificationOverlayData({ id: nid, title: ntitle });
        setShowNotificationOverlay(true);
        return;
      }
    } catch {}
  };

  const openInTasksFromOverlay = () => {
    try {
      const detail = {
        tab: 'TASKS',
        focusTaskId: progressOverlayData?.linkType === 'task' ? (progressOverlayData?.linkId || null) : null,
        focusListId: progressOverlayData?.linkType === 'list' ? (progressOverlayData?.linkId || null) : null,
      } as any;
      try { localStorage.setItem('pomodoro.open', JSON.stringify(detail)); } catch {}
      try { window.dispatchEvent(new CustomEvent('pomodoro:open', { detail })); } catch {}
      try { window.dispatchEvent(new CustomEvent('bookmarkModal:switchTab', { detail: 'timer' })); } catch {}
    } finally {
      setShowProgressOverlay(false);
    }
  };

  // Auto-fill the title when a task/list is selected, unless the user already typed a custom title
  React.useEffect(() => {
    try {
      if (titleManuallyEdited) return;
      if (progressLinkMode === 'task' && progressTaskId) {
        const t = progressTasks.find(t => t.id === progressTaskId);
        if (t?.title) setProgressTitle(t.title);
      } else if (progressLinkMode === 'list' && progressListId) {
        const l = progressLists.find(l => l.id === progressListId);
        if (l?.name) setProgressTitle(l.name);
      }
    } catch {}
  }, [progressLinkMode, progressTaskId, progressListId, progressTasks, progressLists, titleManuallyEdited]);

  // Insert helpers
  const insertStatusNode = (status: 'not_started'|'in_progress'|'completed'|'on_hold'|'cancelled') => {
    editor?.chain().focus().insertContent({ type: 'statusLabel', attrs: { status } }).run();
  };
  const insertPriorityNode = (priority: 'low'|'medium'|'high'|'critical') => {
    editor?.chain().focus().insertContent({ type: 'priorityLabel', attrs: { priority } }).run();
  };
  const insertProgressNode = (args: { progress: number; title: string; description?: string; linkType?: 'task' | 'list' | null; linkId?: string | null }) => {
    const { progress, title, description, linkType, linkId } = args;
    editor?.chain().focus().insertContent({ type: 'progressBlock', attrs: { progress, title, description: description || '', linkType: linkType ?? null, linkId: linkId ?? null } }).run();
  };
  const insertDueDateNode = (dateISO: string) => {
    editor?.chain().focus().insertContent({ type: 'dueDateChip', attrs: { date: dateISO } }).run();
  };
  const insertAssigneeNode = (id: string, name: string, avatar?: string) => {
    editor?.chain().focus().insertContent({ type: 'assigneeChip', attrs: { id, name, avatar: avatar || null } }).run();
  };
  const insertNotificationNode = (id: string, title?: string) => {
    editor?.chain().focus().insertContent({ type: 'notificationBadge', attrs: { id, title: title || null } }).run();
  };

  // Fetch helpers for dialogs
  const refreshPomodoroTasks = async () => {
    try {
      const res = await fetch('/api/pomodoro', { cache: 'no-store' });
      const data = await res.json().catch(() => ({} as any));
      const tasks = Array.isArray(data?.tasks) ? data.tasks : [];
      const mappedTasks = tasks
        .map((t: any) => ({ id: String(t?.id ?? ''), title: String(t?.title || 'Untitled') }))
        .filter((t: any) => Boolean(t.id));
      setProgressTasks(mappedTasks);

      const lists = Array.isArray(data?.taskLists) ? data.taskLists : [];
      const mappedLists = lists
        .map((l: any) => ({ id: String(l?.id ?? ''), name: String(l?.name || 'List') }))
        .filter((l: any) => Boolean(l.id));
      setProgressLists(mappedLists);
    } catch {}
  };
  const searchAssignees = async (q: string) => {
    try {
      const res = await fetch(`/api/mentions?q=${encodeURIComponent(q)}`, { cache: 'no-store' });
      const data = await res.json().catch(() => ({} as any));
      const users = Array.isArray(data?.users) ? data.users : (Array.isArray(data) ? data : []);
      setAssigneeResults(users);
    } catch {}
  };
  const refreshNotifications = async () => {
    try {
      const url = new URL('/api/notifications', window.location.origin);
      url.searchParams.set('type', 'notifications');
      if (bookmarkId) url.searchParams.set('bookmark_id', bookmarkId);
      const res = await fetch(url.toString(), { cache: 'no-store' });
      const payload = await res.json().catch(() => ({} as any));
      let arr: any[] = [];
      if (Array.isArray(payload?.data)) {
        arr = payload.data;
      } else if (Array.isArray(payload?.data?.notifications)) {
        arr = payload.data.notifications;
      } else if (Array.isArray(payload?.notifications)) {
        arr = payload.notifications;
      } else if (Array.isArray(payload)) {
        arr = payload;
      }
      const mapped = arr
        .map((n: any) => ({ id: String(n?.id ?? ''), title: String(n?.title || n?.message || 'Notification') }))
        .filter((n: any) => Boolean(n.id));
      setNotifList(mapped);
    } catch (e) {
      setNotifList([]);
    }
  };

  type CmdItem = { label: string; description: string; run: () => void };
  const getSelectedText = (): string => {
    try {
      const state: any = editor?.state;
      if (!state) return '';
      const { from, to } = state.selection;
      const selected = state.doc.textBetween(from, to, '\n');
      if (selected && selected.trim().length > 0) return selected;
      // fallback to current paragraph if selection empty
      const parentText = (state.selection as any).$from?.parent?.textContent ?? '';
      return parentText || '';
    } catch {
      return '';
    }
  };
  const getCommandItems = (q: string): CmdItem[] => {
    const items: CmdItem[] = [
      { label: "Paragraph", description: "Regular text paragraph", run: () => editor?.chain().focus().setParagraph().run() },
      { label: "Heading 1", description: "Large section heading", run: () => editor?.chain().focus().toggleHeading({ level: 1 }).run() },
      { label: "Heading 2", description: "Medium section heading", run: () => editor?.chain().focus().toggleHeading({ level: 2 }).run() },
      { label: "Heading 3", description: "Small section heading", run: () => editor?.chain().focus().toggleHeading({ level: 3 }).run() },
      { label: "Bullet List", description: "Unordered list with bullets", run: () => {
  try {
    restoreLastSelection();
    if (!editor) return;

    // Try native toggle first
    const ok = editor.chain().focus().toggleBulletList().run();
    if (!ok) {
      // Fallback: insert a bullet list with one empty item
      editor.chain().focus().insertContent({
        type: 'bulletList',
        content: [
          {
            type: 'listItem',
            content: [{ type: 'paragraph', content: [] }],
          },
        ],
      }).run();
    }
  } catch (e) {
    console.error('Bullet List command failed:', e);
  }
} },
      { label: "Ordered List", description: "Numbered list", run: () => {
  try {
    restoreLastSelection();
    if (!editor) return;

    const ok = editor.chain().focus().toggleOrderedList().run();
    if (!ok) {
      editor.chain().focus().insertContent({
        type: 'orderedList',
        content: [
          {
            type: 'listItem',
            content: [{ type: 'paragraph', content: [] }],
          },
        ],
      }).run();
    }
  } catch (e) {
    console.error('Ordered List command failed:', e);
  }
} },
      { label: "Blockquote", description: "Quote or citation", run: () => {
  try {
    restoreLastSelection();
    if (!editor) return;

    const ok = editor.chain().focus().toggleBlockquote().run();
    if (!ok) {
      editor.chain().focus().insertContent({
        type: 'blockquote',
        content: [{ type: 'paragraph', content: [] }],
      }).run();
    }
  } catch (e) {
    console.error('Blockquote command failed:', e);
  }
} },
      { label: "Horizontal Rule", description: "Divider line", run: () => editor?.chain().focus().setHorizontalRule().run() },
      { label: "Task List", description: "Checklist with checkboxes", run: () => editor?.chain().focus().toggleTaskList().run() },
      // Link insertion
      { label: "Link", description: "Add or edit a link on selection", run: () => {
  try {
    restoreLastSelection();
    if (!editor) return;
    let href = window.prompt('Enter URL');
    if (!href) return;
    href = href.trim();
    if (!/^https?:\/\//i.test(href)) href = `https://${href}`;
    const { from, to } = editor.state.selection as any;
    if (from === to) {
      editor.chain().focus().insertContent({
        type: 'text',
        text: href,
        marks: [{ type: 'link', attrs: { href } }]
      }).run();
    } else {
      const ok = editor.chain().focus().extendMarkRange('link').setLink({ href }).run();
      if (!ok) {
        const text = editor.state.doc.textBetween(from, to, '\n') || href;
        editor.chain().focus().deleteSelection().insertContent({
          type: 'text',
          text,
          marks: [{ type: 'link', attrs: { href } }]
        }).run();
      }
    }
  } catch {}
} },
      // Image insertion by URL
      { label: "Image", description: "Insert an image by URL", run: () => {
          try {
            const src = window.prompt('Image URL');
            if (!src) return;
            const ok = editor?.chain().focus().setImage({ src }).run();
            if (!ok && editor) {
              // Fallback: insert raw node
              editor.chain().focus().insertContent({ type: 'image', attrs: { src } }).run();
            }
          } catch (e) {
            console.error('Image command failed:', e);
          }
        }
      },
      { label: "AI: Generate Content", description: "Write new content from a topic/prompt", run: () => {
          try {
            restoreLastSelection();
            setShowAIGenerate(true);
          } catch {}
        }
      },
      // AI helpers (graceful fallback + helpful toasts)
      { label: "AI: Summarize Selection", description: "Summarize selected text in 1–2 sentences", run: async () => {
          restoreLastSelection();
          const sel = getSelectedText();
          const fallback = () => editor?.chain().focus().insertContent({ type: 'blockquote', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'AI summary unavailable' }] }] }).run();
          if (!sel || sel.trim().length === 0) return fallback();
          try {
            const res = await fetch('/api/ai/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: `Summarize succinctly: ${sel}` }) });
            const data = await res.json().catch(() => ({} as any));
            if (!res.ok) {
              toast({ title: 'AI request failed', description: data?.error || `Status ${res.status}`, variant: 'destructive' as any });
              return fallback();
            }
            const text = data?.response ?? data?.text ?? 'AI summary unavailable';
            editor?.chain().focus().deleteSelection().insertContent({ type: 'blockquote', content: [{ type: 'paragraph', content: [{ type: 'text', text }] }] }).run();
          } catch (e: any) {
            toast({ title: 'AI request error', description: String(e?.message || e) || 'Check your connection and API settings.', variant: 'destructive' as any });
            fallback();
          }
        }
      },
      { label: "AI: Improve Writing", description: "Rewrite selection to be clearer and concise", run: async () => {
          restoreLastSelection();
          const sel = getSelectedText();
          const fallback = () => { if (sel) editor?.chain().focus().insertContent(sel).run(); };
          if (!sel || sel.trim().length === 0) return;
          try {
            const res = await fetch('/api/ai/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: `Rewrite to be clearer and concise, keep meaning: ${sel}` }) });
            const data = await res.json().catch(() => ({} as any));
            if (!res.ok) {
              toast({ title: 'AI request failed', description: data?.error || `Status ${res.status}`, variant: 'destructive' as any });
              return fallback();
            }
            const text = data?.response ?? data?.text ?? sel;
            editor?.chain().focus().deleteSelection().insertContent(text).run();
          } catch (e: any) {
            toast({ title: 'AI request error', description: String(e?.message || e) || 'Check your connection and API settings.', variant: 'destructive' as any });
            fallback();
          }
        }
      },
      { label: "AI: Generate Outline", description: "Create outline bullets from selection", run: async () => {
          restoreLastSelection();
          const sel = getSelectedText();
          const fallback = () => editor?.chain().focus().toggleBulletList().run();
          if (!sel || sel.trim().length === 0) return fallback();
          try {
            const res = await fetch('/api/ai/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: `Create a short outline (3-7 bullets) from: ${sel}` }) });
            const data = await res.json().catch(() => ({} as any));
            if (!res.ok) {
              toast({ title: 'AI request failed', description: data?.error || `Status ${res.status}`, variant: 'destructive' as any });
              return fallback();
            }
            const text = data?.response ?? data?.text ?? '';
            if (text) {
              const bullets = text.split('\n').map(l => l.replace(/^[-*\d.\s]+/, '').trim()).filter(Boolean);
              const listJSON: any = {
                type: 'bulletList',
                content: bullets.map(b => ({
                  type: 'listItem',
                  content: [{ type: 'paragraph', content: [{ type: 'text', text: b }] }]
                }))
              };
              editor?.chain().focus().deleteSelection().insertContent(listJSON).run();
            } else fallback();
          } catch (e: any) {
            toast({ title: 'AI request error', description: String(e?.message || e) || 'Check your connection and API settings.', variant: 'destructive' as any });
            fallback();
          }
        }
      },
      // ---- Task metadata commands ----
      { label: "Status", description: "Insert a status badge", run: () => { setShowStatusDlg(true); } },
      { label: "Priority", description: "Insert a priority badge", run: () => { setShowPriorityDlg(true); } },
      { label: "Task Progress", description: "Insert a progress block with title/description and optional link to a task or list", run: () => { refreshPomodoroTasks(); setProgressTitle(''); setProgressDesc(''); setProgressLinkMode('none'); setProgressTaskId(null); setProgressListId(null); setProgressVal(0); setTitleManuallyEdited(false); setShowProgressDlg(true); } },
      { label: "Due Date", description: "Insert a due date chip (YYYY-MM-DD)", run: () => { setShowDueDlg(true); } },
      { label: "Assigned To", description: "Insert an assignee chip (search users)", run: () => { setAssigneeResults([]); setAssigneePicked(null); setAssigneeQuery(''); setShowAssigneeDlg(true); } },
      { label: "Link Notification", description: "Insert a notification badge", run: () => { refreshNotifications(); setShowNotifDlg(true); } }
    ];
    const qq = (q || "").toLowerCase();
    return items.filter(it => it.label.toLowerCase().includes(qq) || it.description.toLowerCase().includes(qq)).slice(0, 20);
  };

  const initial = useMemo(() => {
    try {
      console.log('🔍 TipTapEditor: Converting blocks to TipTap JSON:', content);
      const result = blocksToTipTapJSON(content || []);
      console.log('🔍 TipTapEditor: TipTap JSON result:', result);
      return result;
    } catch (error) {
      console.error('🚨 TipTapEditor blocksToTipTapJSON error:', error);
      return {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: []
          }
        ]
      };
    }
  }, [content]);

  console.log('🔍 TipTapEditor: About to create editor with content:', content);
  console.log('🔍 TipTapEditor: initial value:', initial);
  console.log('🔍 TipTapEditor: blocksToTipTapJSON result:', blocksToTipTapJSON(content));

  const editor = useEditor({
    content: initial,
    extensions: [
      StarterKit.configure({
        // Enhanced configuration with more features and inline styling
        horizontalRule: true,
        bulletList: {
          keepMarks: true,
          HTMLAttributes: {
            style: "list-style-type: disc !important; margin: 1rem 0 !important; padding-left: 1.5rem !important;",
          },
        },
        orderedList: {
          keepMarks: true,
          HTMLAttributes: {
            style: "list-style-type: decimal !important; margin: 1rem 0 !important; padding-left: 1.5rem !important;",
          },
        },
        blockquote: {
          HTMLAttributes: {
            style: "border-left: 4px solid #e5e7eb !important; margin: 1rem 0 !important; padding-left: 1rem !important; font-style: italic !important; color: #6b7280 !important; background-color: #f9fafb !important;",
          },
        },
        listItem: {
          HTMLAttributes: {
            style: "margin: 0.25rem 0 !important;",
          },
        },
        codeBlock: true,
        heading: {
          levels: [1, 2, 3],
        },
        underline: false, // Keep disabled to avoid duplicate extension warning
      }),
      Placeholder.configure({
        placeholder: placeholder || "Start writing... Press '/' for commands",
        includeChildren: true,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg',
          style: "max-width: 100% !important; height: auto !important; border-radius: 0.5rem !important; margin: 1rem 0 !important;",
        },
      }),
      TaskList.configure({
        HTMLAttributes: {
          class: 'task-list',
        },
      }),
      TaskItemX.configure({
        nested: true,
        HTMLAttributes: {
          class: 'task-item',
        },
      }),
      // Standalone metadata nodes
      StatusLabel,
      PriorityLabel,
      DueDateChip,
      AssigneeChip,
      NotificationBadge,
      ProgressBlock,
      Underline,
      TextStyle,
      Color,
      HorizontalRule.configure({
        HTMLAttributes: {
          class: 'my-4 border-gray-300',
        },
      }),
      // SlashCommands disabled due to Suggestion plugin crash; replaced with custom menu
    ],
    onCreate: ({ editor }) => {
      console.log('🔍 TipTapEditor: Editor created successfully', editor);
      console.log('🔍 TipTapEditor: Editor initial content:', editor.getJSON());
      console.log('🔍 TipTapEditor: Editor isEditable:', editor.isEditable);
    },
    onUpdate: ({ editor }) => {
      try {
        if (!editor) {
          console.warn('🚨 TipTapEditor onUpdate: editor is undefined');
          return;
        }
        console.log('🔍 TipTapEditor: Content updated, converting to blocks');
        const json = editor.getJSON();
        console.log('🔍 TipTapEditor: Editor JSON:', json);
        const blocks = tipTapJSONToBlocks(json);
        console.log('🔍 TipTapEditor: Converted blocks:', blocks);
        onChange(blocks);
      } catch (error) {
        console.error('🚨 TipTapEditor onUpdate error:', error);
      }
    },
    onSelectionUpdate: ({ editor }) => {
      try {
        const state: any = (editor as any).state;
        if (!state) return;
        const { from, to } = state.selection;
        lastSelectionRef.current = { from, to };
      } catch {}
    },

    onDestroy: () => {
      console.log('🔍 TipTapEditor: Editor destroyed');
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-stone dark:prose-invert prose-headings:font-title font-default focus:outline-none max-w-none p-6 min-h-[200px]",
      },
      handleDOMEvents: {
        // Add error handling for DOM events
        keydown: (view, event) => {
          try {
            // Open custom slash menu on '/'
            if (event.key === '/') {
              saveCurrentSelection(view?.state);
              const rect = getCaretRect();
              if (rect) {
                setSlashPos({ x: rect.left, y: rect.bottom + 6 });
              } else {
                const elRect = (view.dom as HTMLElement).getBoundingClientRect();
                setSlashPos({ x: elRect.left + 16, y: elRect.top + 40 });
              }
              setSlashQuery('');
              setShowSlashMenu(true);
              event.preventDefault();
              return true;
            }
            if (event.key === 'Escape' && showSlashMenu) {
              setShowSlashMenu(false);
              setSlashQuery('');
              return true;
            }
            return false; // Let TipTap handle other keys
          } catch (error) {
            console.error('🚨 TipTapEditor keydown error:', error);
            return false;
          }
        },
      },
    },
  });

  if (!editor) {
    console.log('🔍 TipTapEditor: Editor not ready, showing loading state');
    return (
      <div className="flex items-center justify-center min-h-[200px] text-gray-500 border rounded-lg bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
          <div>Loading editor...</div>
        </div>
      </div>
    );
  }

  console.log('🔍 TipTapEditor: Rendering editor with content');
  return (
    <div
      className="border rounded-lg min-h-[200px] bg-white relative"
      onClickCapture={(e) => handleEditorClick(e)}
      onKeyDownCapture={(e) => {
        if (e.key === '/') {
          saveCurrentSelection();
          const rect = getCaretRect();
          if (rect) {
            setSlashPos({ x: rect.left, y: rect.bottom + 6 });
          }
          setSlashQuery('');
          setShowSlashMenu(true);
          e.preventDefault();
          e.stopPropagation();
        }
        if (e.key === 'Escape' && showSlashMenu) {
          setShowSlashMenu(false);
          setSlashQuery('');
          e.preventDefault();
          e.stopPropagation();
        }
      }}
    >
      <EditorContent
        editor={editor}
        className={`novel-editor h-full w-full min-h-[200px] ${className}`}
      />

      {showSlashMenu && (
        <div
          className="fixed z-50 w-80 max-h-80 overflow-y-auto rounded-md border bg-white shadow-xl"
          style={{ left: Math.max(8, slashPos.x), top: Math.max(8, slashPos.y) }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setShowSlashMenu(false);
              setSlashQuery('');
            }
          }}
        >
          <div className="p-2 border-b">
            <input
              value={slashQuery}
              onChange={(e) => setSlashQuery(e.target.value)}
              placeholder="Search commands..."
              autoFocus
              className="w-full rounded border px-2 py-1 text-sm outline-none"
            />
          </div>
          <div className="p-1">
            {getCommandItems(slashQuery).map((item, idx) => (
              <button
                key={idx}
                className="w-full text-left px-3 py-2 rounded hover:bg-gray-50"
                onClick={() => {
                  try {
                    restoreLastSelection();
                    item.run();
                  } finally {
                    setShowSlashMenu(false);
                    setSlashQuery('');
                  }
                }}
              >
                <div className="font-medium text-sm">{item.label}</div>
                <div className="text-xs text-gray-500">{item.description}</div>
              </button>
            ))}
            {getCommandItems(slashQuery).length === 0 && (
              <div className="px-3 py-2 text-sm text-gray-400">No commands</div>
            )}
          </div>
        </div>
      )}
      <Dialog open={showAIGenerate} onOpenChange={(o) => { setShowAIGenerate(o); if (!o) setAIPrompt(''); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>AI: Generate Content</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Textarea
              value={aiPrompt}
              onChange={(e) => setAIPrompt(e.target.value)}
              placeholder="Describe what you want written about..."
              rows={6}
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => { setShowAIGenerate(false); setAIPrompt(''); }} disabled={aiGenerating}>Cancel</Button>
            <Button onClick={runAIGenerate} disabled={aiGenerating || !aiPrompt.trim()}>
              {aiGenerating ? 'Generating…' : 'Generate'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Status Dialog */}
      <Dialog open={showStatusDlg} onOpenChange={(o) => setShowStatusDlg(o)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Insert Status</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={statusVal} onValueChange={(v: any) => setStatusVal(v)}>
              <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="not_started">Not Started</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="on_hold">On Hold</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowStatusDlg(false)}>Cancel</Button>
            <Button onClick={() => { restoreLastSelection(); insertStatusNode(statusVal); setShowStatusDlg(false); }}>Insert</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Priority Dialog */}
      <Dialog open={showPriorityDlg} onOpenChange={(o) => setShowPriorityDlg(o)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Insert Priority</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Priority</Label>
            <Select value={priorityVal} onValueChange={(v: any) => setPriorityVal(v)}>
              <SelectTrigger><SelectValue placeholder="Select priority" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowPriorityDlg(false)}>Cancel</Button>
            <Button onClick={() => { restoreLastSelection(); insertPriorityNode(priorityVal); setShowPriorityDlg(false); }}>Insert</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Progress Dialog */}
      <Dialog open={showProgressDlg} onOpenChange={(o) => setShowProgressDlg(o)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Insert Progress</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={progressTitle} onChange={(e) => { setTitleManuallyEdited(true); setProgressTitle(e.target.value); }} placeholder="e.g., Sprint Alpha – API Integration" />
            </div>
            <div className="space-y-2">
              <Label>Description (optional)</Label>
              <Textarea value={progressDesc} onChange={(e) => setProgressDesc(e.target.value)} rows={3} placeholder="Short details for this progress block..." />
            </div>
            <div className="space-y-2">
              <Label>Link selection</Label>
              <Select value={progressLinkMode} onValueChange={(v: any) => setProgressLinkMode(v)}>
                <SelectTrigger><SelectValue placeholder="Choose link mode" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No link</SelectItem>
                  <SelectItem value="task">Individual Task</SelectItem>
                  <SelectItem value="list">Task List / Category</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {progressLinkMode === 'task' && (
              <div className="space-y-2">
                <Label>Select task</Label>
                <Select value={progressTaskId ?? 'none'} onValueChange={(v: any) => setProgressTaskId(v === 'none' ? null : v)}>
                  <SelectTrigger><SelectValue placeholder="Select a task" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No link</SelectItem>
                    {progressTasks.map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {progressLinkMode === 'list' && (
              <div className="space-y-2">
                <Label>Select task list</Label>
                <Select value={progressListId ?? 'none'} onValueChange={(v: any) => setProgressListId(v === 'none' ? null : v)}>
                  <SelectTrigger><SelectValue placeholder="Select a task list" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No link</SelectItem>
                    {progressLists.map((l) => (
                      <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label>Progress: {progressVal}%</Label>
              <Slider value={[progressVal]} onValueChange={(v) => setProgressVal(Math.max(0, Math.min(100, Number(v?.[0] ?? 0))))} min={0} max={100} step={1} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowProgressDlg(false)}>Cancel</Button>
            <Button disabled={!progressTitle.trim()} onClick={() => { restoreLastSelection(); insertProgressNode({ progress: progressVal, title: progressTitle.trim(), description: progressDesc.trim(), linkType: progressLinkMode === 'none' ? null : progressLinkMode, linkId: progressLinkMode === 'task' ? (progressTaskId || null) : progressLinkMode === 'list' ? (progressListId || null) : null }); setShowProgressDlg(false); }}>Insert</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Due Date Dialog */}
      <Dialog open={showDueDlg} onOpenChange={(o) => setShowDueDlg(o)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Insert Due Date</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Date</Label>
            <Input type="date" value={dueDateVal} onChange={(e) => setDueDateVal(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowDueDlg(false)}>Cancel</Button>
            <Button onClick={() => { if (!/^\d{4}-\d{2}-\d{2}$/.test(dueDateVal)) { toast({ title: 'Invalid date', description: 'Use YYYY-MM-DD', variant: 'destructive' as any }); return; } restoreLastSelection(); insertDueDateNode(dueDateVal); setShowDueDlg(false); }}>Insert</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assignee Dialog */}
      {/* Inline Progress Overlay (opens when clicking an inserted progress block) */}
      <Dialog open={showProgressOverlay} onOpenChange={(o) => setShowProgressOverlay(o)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Task Progress</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Title</Label>
              <div className="mt-1 text-sm font-medium">{progressOverlayData?.title || 'Progress'}</div>
            </div>
            {progressOverlayData?.description && (
              <div>
                <Label>Description</Label>
                <div className="mt-1 text-sm text-gray-600">{progressOverlayData.description}</div>
              </div>
            )}
            <div className="space-y-2">
              <Label>Progress</Label>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="h-2 rounded-full bg-blue-500" style={{ width: `${progressOverlayData?.progress ?? 0}%` }} />
              </div>
              <div className="text-xs text-gray-500">{progressOverlayData?.progress ?? 0}%</div>
            </div>
            {progressOverlayData?.linkType && (
              <div className="text-sm text-gray-700">
                Linked {progressOverlayData.linkType === 'task' ? 'Task' : 'List'}: <span className="font-mono">{progressOverlayData.linkId}</span>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowProgressOverlay(false)}>Close</Button>
            <Button onClick={openInTasksFromOverlay} disabled={!progressOverlayData}>Open in Tasks</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Inline Notification Overlay (opens when clicking an inserted notification badge) */}
      <Dialog open={showNotificationOverlay} onOpenChange={(o) => setShowNotificationOverlay(o)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Notification</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Title</Label>
              <div className="mt-1 text-sm font-medium">{notificationOverlayData?.title || 'Notification'}</div>
            </div>
            {notificationOverlayData?.id && (
              <div>
                <Label>ID</Label>
                <div className="mt-1 text-sm font-mono text-gray-700">{notificationOverlayData.id}</div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowNotificationOverlay(false)}>Close</Button>
            <Button onClick={openInNotificationsFromOverlay} disabled={!notificationOverlayData}>Open in Notifications</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      <Dialog open={showAssigneeDlg} onOpenChange={(o) => setShowAssigneeDlg(o)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Insert Assignee</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Search</Label>
              <div className="flex gap-2">
                <Input value={assigneeQuery} onChange={(e) => setAssigneeQuery(e.target.value)} placeholder="Type name or email" />
                <Button variant="outline" onClick={() => searchAssignees(assigneeQuery)}>Search</Button>
              </div>
            </div>
            <ScrollArea className="h-48 rounded border">
              <div className="p-2 space-y-1">
                {assigneeResults.length === 0 && (
                  <div className="text-sm text-muted-foreground">No results</div>
                )}
                {assigneeResults.map((u) => {
                  const name = u.display_name || u.name || u.email || u.id;
                  return (
                    <Button key={u.id} variant={assigneePicked?.id === u.id ? 'default' : 'ghost'} className="w-full justify-start" onClick={() => setAssigneePicked({ id: String(u.id), name: String(name), avatar: u.avatar_url })}>
                      {name}
                    </Button>
                  );
                })}
              </div>
            </ScrollArea>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowAssigneeDlg(false)}>Cancel</Button>
            <Button disabled={!assigneePicked} onClick={() => { if (!assigneePicked) return; restoreLastSelection(); insertAssigneeNode(assigneePicked.id, assigneePicked.name, assigneePicked.avatar); setShowAssigneeDlg(false); }}>Insert</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Notification Dialog */}
      <Dialog open={showNotifDlg} onOpenChange={(o) => setShowNotifDlg(o)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Insert Notification</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Notification</Label>
            <Select value={notifPicked ?? ''} onValueChange={(v: any) => setNotifPicked(v)}>
              <SelectTrigger><SelectValue placeholder="Select notification" /></SelectTrigger>
              <SelectContent>
                {notifList.map((n) => (
                  <SelectItem key={n.id} value={n.id}>{n.title || `Notification ${n.id}`}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowNotifDlg(false)}>Cancel</Button>
            <Button disabled={!notifPicked} onClick={() => { const n = notifList.find(x => x.id === notifPicked); if (!n) return; restoreLastSelection(); insertNotificationNode(n.id, n.title); setShowNotifDlg(false); }}>Insert</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

