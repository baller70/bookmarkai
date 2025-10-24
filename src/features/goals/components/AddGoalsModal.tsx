"use client";
import React, { useEffect, useMemo, useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Search, Target, PlusCircle } from 'lucide-react'

export interface GoalItem {
  id: string
  name: string
  description?: string | null
}

interface AddGoalsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  // When user confirms, we pass back selected goal IDs
  onConfirm: (goalIds: string[]) => Promise<void> | void
  userId?: string // optional override (defaults to dev-user-fixed-id)
}

export default function AddGoalsModal({ open, onOpenChange, onConfirm, userId }: AddGoalsModalProps) {
  const [loading, setLoading] = useState(false)
  const [goals, setGoals] = useState<GoalItem[]>([])
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<Record<string, boolean>>({})
  const [submitting, setSubmitting] = useState(false)

  const effectiveUserId = userId || 'dev-user-fixed-id'

  useEffect(() => {
    if (!open) return
    let cancelled = false
    async function loadGoals() {
      try {
        setLoading(true)
        const resp = await fetch(`/api/goals?user_id=${encodeURIComponent(effectiveUserId)}`)
        const json = await resp.json()
        const items: GoalItem[] = (json?.data || []).map((g: any) => ({ id: g.id, name: g.name || g.title || 'Untitled Goal', description: g.description || null }))
        if (!cancelled) setGoals(items)
      } catch (_e) {
        if (!cancelled) setGoals([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    loadGoals()
    return () => { cancelled = true }
  }, [open, effectiveUserId])

  useEffect(() => {
    if (!open) setSelected({})
  }, [open])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return goals
    return goals.filter(g => (g.name || '').toLowerCase().includes(q) || (g.description || '').toLowerCase().includes(q))
  }, [goals, query])

  const toggle = (id: string) => setSelected(prev => ({ ...prev, [id]: !prev[id] }))

  const selectedIds = useMemo(() => Object.keys(selected).filter(id => selected[id]), [selected])

  async function handleConfirm() {
    if (selectedIds.length === 0) {
      onOpenChange(false)
      return
    }
    try {
      setSubmitting(true)
      await onConfirm(selectedIds)
      onOpenChange(false)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-500" />
            Add Goals
          </DialogTitle>
          <DialogDescription>
            Search and select existing goals to associate with this bookmark.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search goals by name or description"
              className="pl-8"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <Button variant="outline" size="sm" onClick={() => setQuery('')}>Clear</Button>
        </div>

        <div className="flex-1 overflow-auto divide-y rounded-md border">
          {loading ? (
            <div className="p-6 text-center text-gray-500">Loading goals…</div>
          ) : filtered.length === 0 ? (
            <div className="p-6 text-center text-gray-500">No goals found</div>
          ) : (
            filtered.map(goal => (
              <label key={goal.id} className="flex items-start gap-3 p-3 hover:bg-gray-50 cursor-pointer">
                <Checkbox checked={!!selected[goal.id]} onCheckedChange={() => toggle(goal.id)} />
                <div className="min-w-0">
                  <div className="font-medium truncate">{goal.name}</div>
                  {goal.description && <div className="text-sm text-gray-600 line-clamp-2">{goal.description}</div>}
                </div>
              </label>
            ))
          )}
        </div>

        <div className="flex items-center justify-between pt-4">
          <div className="text-sm text-gray-600">
            {selectedIds.length} selected
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleConfirm} disabled={submitting || selectedIds.length === 0}>
              <PlusCircle className="h-4 w-4 mr-2" />
              Add {selectedIds.length > 0 ? `(${selectedIds.length})` : ''}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

