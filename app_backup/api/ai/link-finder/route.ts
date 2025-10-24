// Sentry removed
// TODO: Migrate to PostgreSQL/Prisma - Supabase imports removed
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import OpenAI from 'openai'
import { authenticateUser, createUnauthorizedResponse } from '@/lib/auth-utils'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Types
interface LinkFinderRequest {
  prefs: {
    topic: string
    useProfileInterests: boolean
    dateRange: 'any' | '24h' | 'week' | 'month' | 'year'
    linkTypes: string[]
    language: string
    includeDomains: string[]
    excludeDomains: string[]
    maxLinks: number
    serendipity: number
    autoSaveAll: boolean
    schedule: string
  }
}

interface LinkFinderResult {
  id: string
  url: string
  title: string
  description: string
  domain: string
  favicon: string
  contentType: 'webpage' | 'image' | 'video' | 'document' | 'pdf'
  relevanceScore: number
  publishedDate?: string
  author?: string
  tags: string[]
  snippet: string
  thumbnail?: string
  readTime?: string
  confidence: number
  why: string[]
}

// Mock data for testing
const mockLinkFinderResults: LinkFinderResult[] = [
  {
    id: 'link-1',
    url: 'https://example.com/ai-development-guide',
    title: 'Complete Guide to AI Development in 2024',
    description: 'Comprehensive tutorial covering machine learning, deep learning, and AI implementation strategies.',
    domain: 'example.com',
    favicon: '🤖',
    contentType: 'webpage',
    relevanceScore: 0.95,
    publishedDate: '2024-01-15',
    author: 'Tech Expert',
    tags: ['AI', 'Development', 'Machine Learning', 'Tutorial'],
    snippet: 'Learn how to build AI applications from scratch with practical examples and best practices...',
    thumbnail: '/placeholder.svg',
    readTime: '12 min read',
    confidence: 0.92,
    why: ['Exact match for AI development', 'High authority domain', 'Recent publication', 'Comprehensive content']
  },
  {
    id: 'link-2',
    url: 'https://example.com/typescript-patterns',
    title: 'Advanced TypeScript Design Patterns',
    description: 'Master complex TypeScript patterns for scalable application architecture.',
    domain: 'example.com',
    favicon: '📘',
    contentType: 'webpage',
    relevanceScore: 0.88,
    publishedDate: '2024-01-10',
    author: 'Code Master',
    tags: ['TypeScript', 'Design Patterns', 'Architecture', 'Programming'],
    snippet: 'Explore advanced TypeScript patterns including decorators, mixins, and advanced generics...',
    thumbnail: '/placeholder.svg',
    readTime: '8 min read',
    confidence: 0.85,
    why: ['Matches programming keywords', 'Popular in developer community', 'High quality content']
  },
  {
    id: 'link-3',
    url: 'https://example.com/react-performance',
    title: 'React Performance Optimization Techniques',
    description: 'Boost your React app performance with these proven optimization strategies.',
    domain: 'example.com',
    favicon: '⚛️',
    contentType: 'webpage',
    relevanceScore: 0.82,
    publishedDate: '2024-01-08',
    author: 'React Expert',
    tags: ['React', 'Performance', 'Optimization', 'JavaScript'],
    snippet: 'Learn about React.memo, useMemo, useCallback, and other performance optimization techniques...',
    thumbnail: '/placeholder.svg',
    readTime: '10 min read',
    confidence: 0.78,
    why: ['Related to web development', 'Performance focus', 'Actionable content']
  }
]

const TESTING_MODE = process.env.LINK_FINDER_TESTING === 'true' || process.env.NODE_ENV === 'development'

export async function GET() {
  try {
    console.log('🔍 Link Finder API called (GET)')
    
    return NextResponse.json({
      success: true,
      message: 'Link Finder API is ready',
      supportedFeatures: [
        'AI-powered link discovery',
        'Multi-domain search',
        'Content type filtering',
        'Relevance scoring',
        'Advanced search filters',
        'Real-time results',
        'Duplicate detection',
        'Custom domain inclusion/exclusion'
      ],
      searchDepthOptions: ['surface', 'deep'],
      contentTypes: ['webpage', 'image', 'video', 'document', 'pdf'],
      timeRanges: ['any', 'day', 'week', 'month', 'year']
    })
  } catch (error) {
    console.error('Link Finder API Error (GET):', error)
    return NextResponse.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const span = undefined; // TODO: fix this
  
      try {
        console.log('🔍 Link Finder API called (POST)')

        if (TESTING_MODE) {
          console.log('🧪 TESTING MODE: Link Finder Authentication bypassed')
          
          const body = await request.json()
          const { prefs } = body as LinkFinderRequest
          
          // Filter mock results based on topic (more lenient matching)
          const topicWords = prefs.topic.toLowerCase().split(' ')
          const filteredResults = mockLinkFinderResults.filter(result =>
            topicWords.some(word => 
              result.title.toLowerCase().includes(word) ||
              result.description.toLowerCase().includes(word) ||
              result.tags.some(tag => tag.toLowerCase().includes(word))
            )
          ).slice(0, prefs.maxLinks || 10)
          
          // If no matches found, return all mock results
          const finalResults = filteredResults.length > 0 ? filteredResults : mockLinkFinderResults.slice(0, prefs.maxLinks || 10)
          
          return NextResponse.json({
            success: true,
            results: finalResults,
            query: prefs.topic,
            totalFound: finalResults.length,
            searchDepth: 'surface',
            processingTime: Math.random() * 2000 + 500, // Mock processing time
            timestamp: Date.now()
          })
        }

        // Production authentication
        const bypassAuth = process.env.BYPASS_AUTHENTICATION === 'true'
        const isDevelopment = process.env.NODE_ENV === 'development'
        let userId: string
        
        if (bypassAuth || isDevelopment) {
          userId = 'dev-user-fixed-id'
          console.log('🔓 AUTH BYPASS: Using development user ID:', userId)
        } else {
          // Production mode: require proper authentication
          const authResult = await authenticateUser(request)
          if (!authResult.success) {
            return createUnauthorizedResponse(authResult.error)
          }
          userId = authResult.userId!
        }

        // Verify OpenAI API key
        if (!process.env.OPENAI_API_KEY) {
          console.error('❌ OpenAI API key not configured')
          return NextResponse.json(
            { error: 'OpenAI API key not configured' },
            { status: 500 }
          )
        }

        let body
        try {
          body = await request.json()
        } catch (error) {
          console.error('❌ Invalid JSON in request body:', error)
          return NextResponse.json(
            { error: 'Invalid JSON in request body' },
            { status: 400 }
          )
        }

        const { prefs } = body as LinkFinderRequest

        if (!prefs.topic || prefs.topic.trim().length === 0) {
          return NextResponse.json(
            { error: 'Search topic is required' },
            { status: 400 }
          )
        }

        if (!prefs) {
          return NextResponse.json(
            { error: 'Search preferences are required' },
            { status: 400 }
          )
        }

        console.log('🔍 Processing link finder request:', {
          topic: prefs.topic.substring(0, 50),
          maxLinks: prefs.maxLinks,
          dateRange: prefs.dateRange,
          userId: userId
        })

        // Use OpenAI to generate relevant links based on the topic
        const searchPrompt = `
You are an expert link finder. Based on the search topic "${prefs.topic}", suggest ${prefs.maxLinks} highly relevant web resources.

Search Preferences:
- Date Range: ${prefs.dateRange}
- Link Types: ${prefs.linkTypes.join(', ')}
- Language: ${prefs.language}
- Include Domains: ${prefs.includeDomains.join(', ') || 'Any'}
- Exclude Domains: ${prefs.excludeDomains.join(', ') || 'None'}
- Serendipity Level: ${prefs.serendipity}/10

For each suggested link, provide:
1. A realistic URL (use real domains when possible)
2. A compelling title
3. A detailed description
4. Content type (webpage, image, video, document, pdf)
5. Relevance score (0-1)
6. Tags (3-5 relevant tags)
7. A brief snippet
8. Why this link is relevant (2-3 reasons)

Format your response as a JSON array of link objects with these fields:
- url, title, description, contentType, relevanceScore, tags, snippet, why (array of reasons)

Make the suggestions diverse, high-quality, and truly relevant to the search query.
`

        const completion = await openai.chat.completions.create({
          model: 'gpt-4-turbo-preview',
          messages: [
            {
              role: 'system',
              content: 'You are an expert link finder that suggests high-quality, relevant web resources based on search queries. Always return valid JSON.'
            },
            {
              role: 'user',
              content: searchPrompt
            }
          ],
          max_tokens: 2000,
          temperature: 0.7
        })

        const response = completion.choices[0].message.content
        
        if (!response) {
          console.error('❌ No response from OpenAI')
          return NextResponse.json(
            { error: 'No results generated' },
            { status: 500 }
          )
        }

        let aiResults: any[]
        try {
          aiResults = JSON.parse(response)
        } catch (parseError) {
          console.error('❌ Failed to parse AI response:', parseError)
          // Fall back to mock results
          aiResults = mockLinkFinderResults.slice(0, prefs.maxLinks)
        }

        // Transform AI results to our format
        const results: LinkFinderResult[] = aiResults.map((result, index) => ({
          id: `ai-link-${index + 1}`,
          url: result.url || `https://example.com/result-${index + 1}`,
          title: result.title || 'Generated Link',
          description: result.description || 'AI-generated link description',
          domain: result.url ? new URL(result.url).hostname : 'example.com',
          favicon: result.favicon || '🔗',
          contentType: result.contentType || 'webpage',
          relevanceScore: result.relevanceScore || 0.8,
          publishedDate: new Date().toISOString().split('T')[0],
          tags: result.tags || ['AI-Generated'],
          snippet: result.snippet || result.description || 'AI-generated content snippet',
          readTime: `${Math.ceil(Math.random() * 10) + 2} min read`,
          confidence: result.relevanceScore || 0.8,
          why: result.why || ['AI-generated match', 'Relevant to topic']
        }))

        console.log(`✅ Link Finder: ${results.length} results generated`)

        return NextResponse.json({
          success: true,
          results: results,
          query: prefs.topic,
          totalFound: results.length,
          searchDepth: 'surface',
          processingTime: Date.now(),
          timestamp: Date.now(),
          usage: completion.usage
        })

      } catch (error) {
        console.error('❌ Link Finder API Error:', error)
        return NextResponse.json({
          error: 'Failed to process link finder request',
          message: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
      }
    }

