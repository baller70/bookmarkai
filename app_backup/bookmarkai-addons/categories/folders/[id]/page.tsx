import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { headers } from 'next/headers'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, FolderOpen } from 'lucide-react'

// Server Component – dedicated Category Folder page (Goal 2.0 behavior)
// Fetches folder meta, mappings, and categories, and renders the folder contents on its own page.

export const metadata: Metadata = {
  title: 'Category Folder',
}

interface Category {
  id: string
  name: string
  description: string
  color: string
  bookmarkCount: number
  createdAt: string
  updatedAt: string
}

interface CategoryFolder {
  id: string
  name: string
  description?: string
  color: string
}

async function getData(id: string) {
  // TODO: replace with real auth; mirrors Categories API dev fallback
  const userId = '48e1b5b9-3b0f-4ccb-8b34-831b1337fc3f'

  // Build absolute origin for server-side fetch in RSC
  const hdrs = await headers()
  const proto = hdrs.get('x-forwarded-proto') || 'https'
  const host = hdrs.get('host') || ''
  const base = process.env.NEXT_PUBLIC_BASE_URL || (host ? `${proto}://${host}` : '')

  const [foldersRes, mappingsRes, categoriesRes] = await Promise.all([
    fetch(`${base}/api/category-folders/folders?id=${id}`, { cache: 'no-store' }),
    fetch(`${base}/api/category-folders?user_id=${userId}&folder_id=${id}&expand=category`, { cache: 'no-store' }),
    fetch(`${base}/api/categories?user_id=${userId}`, { cache: 'no-store' })
  ])

  const foldersJson = await foldersRes.json().catch(() => ({} as any))
  const mappingsJson = await mappingsRes.json().catch(() => ({} as any))
  let categoriesJson = await categoriesRes.json().catch(() => ({} as any))

  const folder: CategoryFolder | undefined = (foldersJson?.folders || []).find((f: any) => String(f.id) === String(id))

  // Build from mappings only; do NOT call categories?ids=. Use expand join if present; else filter from all categories by id.
  const mappingsArr = (mappingsJson?.mappings || [])
  const allCats: Category[] = (categoriesJson?.categories || [])
  const byId = new Map<string, Category>(allCats.map(c => [String(c.id), c]))
  const byName = new Map<string, Category>(allCats.map(c => [c.name.trim().toLowerCase(), c]))

  let categoriesInFolder: Category[] = []
  if (mappingsArr.length && mappingsArr[0]?.categories) {
    // Supabase expand join present: map directly from joined category rows
    const seen = new Set<string>()
    for (const m of mappingsArr) {
      const joined = (m as any).categories
      if (!joined) continue
      const id = String(joined.id)
      if (seen.has(id)) continue
      seen.add(id)
      const name = String(joined.name || '').trim()
      const match = byName.get(name.toLowerCase())
      categoriesInFolder.push({
        id,
        name,
        description: joined.description || '',
        color: joined.color || '#3B82F6',
        bookmarkCount: match?.bookmarkCount ?? 0,
        createdAt: match?.createdAt || '',
        updatedAt: match?.updatedAt || '',
      })
    }
  } else {
    // File fallback (no expand): filter by mapping ids from the full categories list
    const idSet = new Set<string>(mappingsArr.map((m: any) => String(m.category_id)).filter(Boolean))
    categoriesInFolder = allCats.filter(c => idSet.has(String(c.id)))
  }

  return { folder, categoriesInFolder }
}

export default async function CategoryFolderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { folder, categoriesInFolder } = await getData(id)

  if (!folder) return notFound()

  const isLight = (() => {
    const hex = (folder.color || '#3B82F6').replace('#','')
    const r = parseInt(hex.substring(0,2),16)
    const g = parseInt(hex.substring(2,4),16)
    const b = parseInt(hex.substring(4,6),16)
    const lum = (0.299*r + 0.587*g + 0.114*b)/255
    return lum > 0.5
  })()
  const textColor = isLight ? '#111827' : '#FFFFFF'

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white/80 dark:bg-card backdrop-blur-sm border-b border-gray-200 dark:border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <Link href="/bookmarkai-addons/categories">
                <Button variant="ghost" size="sm" className="text-gray-600">
                  <ArrowLeft className="h-4 w-4 mr-1" /> Back to Categories
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Folder header (Goal 2.0 pattern + app DS) */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center shadow-sm"
                  style={{ backgroundColor: folder.color }}
                >
                  <FolderOpen className="w-6 h-6" style={{ color: textColor }} />
                </div>
                <div>
                  <CardTitle className="text-xl font-semibold">{folder.name}</CardTitle>
                  <CardDescription className="pt-1">
                    {categoriesInFolder.length} {categoriesInFolder.length === 1 ? 'category' : 'categories'}
                  </CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Search (local filter – clientless) */}
        <form action="#" className="w-full">
          <input name="q" placeholder="Search categories in this folder..." className="w-full md:w-96 h-9 rounded-md border border-input bg-background px-3 py-1 text-sm" />
        </form>

        {/* Categories grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categoriesInFolder.map((category) => (
            <Card key={category.id} data-testid={`folder-category-card-${category.id}`} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: category.color }} />
                    <div>
                      <CardTitle className="text-lg">{category.name}</CardTitle>
                      {category.description && (
                        <CardDescription className="text-sm mt-1">{category.description}</CardDescription>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">{category.bookmarkCount} bookmarks</span>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
          {categoriesInFolder.length === 0 && (
            <div className="col-span-full text-sm text-muted-foreground">No categories in this folder yet.</div>
          )}
        </div>
      </div>
    </div>
  )
}
