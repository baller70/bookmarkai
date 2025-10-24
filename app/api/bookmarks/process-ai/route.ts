
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/db'
import { authOptions } from '@/lib/auth/options'

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { bookmarkId } = await request.json()
    if (!bookmarkId) {
      return NextResponse.json({ error: 'Bookmark ID is required' }, { status: 400 })
    }

    // Get the bookmark
    const bookmark = await prisma.bookmark.findFirst({
      where: { 
        id: bookmarkId,
        userId: session.user.id 
      }
    })

    if (!bookmark) {
      return NextResponse.json({ error: 'Bookmark not found' }, { status: 404 })
    }

    // Call the LLM API to process the bookmark
    const response = await fetch('https://apps.abacus.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ABACUSAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4.1-mini',
        messages: [{
          role: 'user',
          content: `Analyze this bookmark and provide AI-powered insights:
Title: ${bookmark.title}
URL: ${bookmark.url}
Description: ${bookmark.description}

Please provide:
1. A concise summary (max 100 words)
2. Relevant tags (max 5 tags, comma-separated)
3. A suggested category
4. Related keywords

Respond in JSON format:
{
  "summary": "...",
  "tags": ["tag1", "tag2", ...],
  "category": "...",
  "keywords": ["keyword1", "keyword2", ...]
}`
        }],
        max_tokens: 300,
        response_format: { type: "json_object" }
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to process bookmark with AI')
    }

    const aiResult = await response.json()
    const aiContent = JSON.parse(aiResult.choices[0].message.content)

    // Update the bookmark with AI-generated content
    const updatedBookmark = await prisma.bookmark.update({
      where: { id: bookmarkId },
      data: {
        aiSummary: aiContent.summary,
        aiTags: aiContent.tags || [],
        aiCategory: aiContent.category,
        // Merge existing tags with AI tags
        tags: [...new Set([...(bookmark.tags || []), ...(aiContent.keywords || [])])]
      }
    })

    return NextResponse.json(updatedBookmark)
  } catch (error) {
    console.error('AI processing error:', error)
    return NextResponse.json(
      { error: 'Failed to process bookmark with AI' },
      { status: 500 }
    )
  }
}
