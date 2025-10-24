
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { url } = await request.json()
    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }

    // Try to fetch the page and extract metadata
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; BookmarkAI/1.0)'
        },
        // Add timeout
        signal: AbortSignal.timeout(10000)
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const html = await response.text()
      
      // Extract title
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
      const title = titleMatch?.[1]?.trim() || ''

      // Extract description from meta tags
      const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["'][^>]*>/i) ||
                       html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["'][^>]*>/i)
      const description = descMatch?.[1]?.trim() || ''

      // Extract Open Graph data
      const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["'][^>]*>/i)
      const ogDescMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["'][^>]*>/i)

      const metadata = {
        title: ogTitleMatch?.[1]?.trim() || title || new URL(url).hostname,
        description: ogDescMatch?.[1]?.trim() || description || '',
        url: url
      }

      return NextResponse.json(metadata)
    } catch (fetchError) {
      // If we can't fetch the page, return basic metadata
      const urlObj = new URL(url)
      return NextResponse.json({
        title: urlObj.hostname,
        description: `Link from ${urlObj.hostname}`,
        url: url
      })
    }
  } catch (error) {
    console.error('Metadata extraction error:', error)
    return NextResponse.json(
      { error: 'Failed to extract metadata' },
      { status: 500 }
    )
  }
}
