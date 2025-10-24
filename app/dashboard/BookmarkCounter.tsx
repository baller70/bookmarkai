"use client"

import { useEffect, useMemo, useState } from "react"
import { ChevronDown } from "lucide-react"

type Bookmark = {
  id: string | number
  category?: string | null
  ai_category?: string | null
}

export default function BookmarkCounter() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [open, setOpen] = useState(false)

  const total = useMemo(() => bookmarks.length, [bookmarks])
  const breakdown = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const b of bookmarks) {
      const key = (b.category || b.ai_category || "Unassigned").toString().trim() || "Unassigned"
      counts[key] = (counts[key] || 0) + 1
    }
    if (counts["Unassigned"] == null) counts["Unassigned"] = 0
    return Object.entries(counts).sort((a, b) => a[0].localeCompare(b[0]))
  }, [bookmarks])

  async function fetchCounts(signal?: AbortSignal) {
    try {
      setError(null)
      // Use existing API to fetch unified bookmarks and derive counts
      const res = await fetch("/api/bookmarks", { signal })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      const arr: Bookmark[] = Array.isArray(json?.bookmarks) ? json.bookmarks : []
      setBookmarks(arr)
    } catch (e: any) {
      if (e?.name === "AbortError") return
      setError(e?.message || "Failed to load")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const ctrl = new AbortController()
    fetchCounts(ctrl.signal)

    // Listen for app-level updates (best-effort)
    const handler = () => fetchCounts()
    window.addEventListener("bookmarkhub:bookmarks-changed", handler)

    // Light polling as a fallback to keep counts fresh
    const iv = window.setInterval(() => fetchCounts(), 15000)

    return () => {
      ctrl.abort()
      window.removeEventListener("bookmarkhub:bookmarks-changed", handler)
      window.clearInterval(iv)
    }
  }, [])

  return (
    <div className="mb-6">
      <div className="flex items-end justify-between">
        <div>
          <div className="text-sm text-gray-500">Total bookmarks</div>
          {loading ? (
            <div className="mt-1 h-8 w-40 rounded bg-gray-100 animate-pulse" />
          ) : (
            <div className="mt-1 text-4xl md:text-5xl font-extrabold tracking-tight text-gray-900">
              {total.toLocaleString()}
            </div>
          )}
          {error && (
            <div className="mt-1 text-xs text-red-600">{error}</div>
          )}
        </div>
        <button
          type="button"
          onClick={() => setOpen(v => !v)}
          aria-expanded={open}
          className="inline-flex items-center text-gray-600 hover:text-gray-800 transition-colors"
        >
          <span className="mr-2 text-sm hidden sm:inline">Breakdown</span>
          <ChevronDown className={`h-5 w-5 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
        </button>
      </div>

      <div className={`${open ? "mt-3" : "hidden"}`}>
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
          {loading ? (
            <div className="space-y-2">
              <div className="h-4 w-64 bg-gray-100 rounded animate-pulse" />
              <div className="h-4 w-56 bg-gray-100 rounded animate-pulse" />
              <div className="h-4 w-44 bg-gray-100 rounded animate-pulse" />
            </div>
          ) : (
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {breakdown.map(([name, count]) => (
                <li key={name} className="flex items-center justify-between text-sm text-gray-700">
                  <span className="truncate">{name}: </span>
                  <span className="ml-2 font-medium">{Number(count).toLocaleString()} bookmarks</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

