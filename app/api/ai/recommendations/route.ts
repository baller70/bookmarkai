// Sentry removed
import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase'
import { cookies } from 'next/headers'
import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { authenticateUser, createUnauthorizedResponse } from '@/lib/auth-utils'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Testing mode flag
const TESTING_MODE = process.env.AI_RECOMMENDATIONS_TESTING === 'true'

interface RecommendationSettings {
  suggestionsPerRefresh: number
  serendipityLevel: number
  autoIncludeOnSelect: boolean
  autoBundle: boolean
  includeTLDR: boolean
  domainBlacklist: string[]
  revisitNudgeDays: number
  includeTrending: boolean
}

interface RecommendationItem {
  id: string
  url: string
  title: string
  description: string
  favicon: string
  readTime: string
  confidence: number
  why: string[]
}

interface UserContext {
  recentBookmarks: Array<{
    url: string
    title: string
    description?: string
    tags?: string[]
    createdAt: string
  }>
  topCategories: string[]
  browsingPatterns: {
    preferredReadTime: string
    activeHours: string[]
    deviceTypes: string[]
  }
  interests: string[]
}

// Mock user context for testing
const mockUserContext: UserContext = {
  recentBookmarks: [
    {
      url: 'https://react.dev',
      title: 'React Documentation',
      description: 'Official React documentation',
      tags: ['react', 'javascript', 'frontend'],
      createdAt: '2024-01-15T10:00:00Z'
    },
    {
      url: 'https://nextjs.org',
      title: 'Next.js Documentation',
      description: 'The React framework for production',
      tags: ['nextjs', 'react', 'fullstack'],
      createdAt: '2024-01-14T15:30:00Z'
    }
  ],
  topCategories: ['Development', 'AI/ML', 'Design'],
  browsingPatterns: {
    preferredReadTime: '5-10 minutes',
    activeHours: ['9-11 AM', '2-4 PM'],
    deviceTypes: ['desktop', 'mobile']
  },
  interests: ['web development', 'artificial intelligence', 'user experience', 'productivity tools']
}

async function getUserContext(_userId: string): Promise<UserContext> {
  void _userId; // parameter currently unused but preserved for future implementation
  
  try {
    // Create Supabase client for server-side access
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Load enhanced context from JSON file
    let enhancedContext = null
    try {
      const contextPath = path.join(process.cwd(), 'dev-user-context.json')
      if (fs.existsSync(contextPath)) {
        const contextData = fs.readFileSync(contextPath, 'utf8')
        enhancedContext = JSON.parse(contextData)
        console.log('✅ Enhanced context loaded from file')
      }
    } catch (fileError) {
      console.log('📄 No enhanced context file found, using basic context')
    }

    // Try to fetch real bookmarks data
    let realBookmarks = []
    try {
      const { data: bookmarksData, error: bookmarksError } = await supabase
        .from('bookmarks')
        .select('*')
        .limit(10)
        .order('created_at', { ascending: false })

      if (!bookmarksError && bookmarksData) {
        realBookmarks = bookmarksData.map(bookmark => ({
          url: bookmark.url,
          title: bookmark.title,
          description: bookmark.description,
          tags: bookmark.ai_tags || [],
          createdAt: bookmark.created_at
        }))
        console.log('✅ Real bookmarks loaded:', realBookmarks.length)
      }
    } catch (dbError) {
      console.log('📊 No real bookmarks available, using mock data')
    }

    // Combine real data with enhanced context
    const userContext: UserContext = {
      recentBookmarks: realBookmarks.length > 0 ? realBookmarks : 
        enhancedContext?.recentBookmarks?.map(bookmark => ({
          url: bookmark.url,
          title: bookmark.title,
          description: bookmark.category,
          tags: bookmark.ai_tags || [],
          createdAt: new Date().toISOString()
        })) || mockUserContext.recentBookmarks,
      
      topCategories: enhancedContext ? 
        extractTopCategoriesFromContext(enhancedContext) : 
        mockUserContext.topCategories,
      
      browsingPatterns: {
        preferredReadTime: '5-10 minutes',
        activeHours: ['9-11 AM', '2-4 PM'],
        deviceTypes: ['desktop', 'mobile']
      },
      
      interests: enhancedContext?.topInterests?.map(interest => interest.name) || 
        mockUserContext.interests
    }

    console.log('✅ Sophisticated user context loaded:', {
      recentBookmarksCount: userContext.recentBookmarks.length,
      topCategories: userContext.topCategories,
      interestsCount: userContext.interests.length,
      contextSource: enhancedContext ? 'enhanced + real data' : 'mock data'
    })

    return userContext
  } catch (error) {
    console.error('❌ Error in getUserContext:', error)
    // Fall back to mock data if anything goes wrong
    return mockUserContext
  }
}

// Helper function to extract top categories from enhanced context
function extractTopCategoriesFromContext(contextData: {
  recentBookmarks?: Array<{category?: string, ai_category?: string}>
  recentBrowsing?: Array<{categories?: string[]}>
  topInterests?: Array<{name?: string}>
}): string[] {
  const categories = new Set<string>()
  
  // Add categories from bookmarks
  if (contextData.recentBookmarks) {
    contextData.recentBookmarks.forEach((bookmark) => {
      if (bookmark.category) categories.add(bookmark.category)
      if (bookmark.ai_category) categories.add(bookmark.ai_category)
    })
  }
  
  // Add categories from browsing history
  if (contextData.recentBrowsing) {
    contextData.recentBrowsing.forEach((browsing) => {
      if (browsing.categories) {
        browsing.categories.forEach((cat: string) => categories.add(cat))
      }
    })
  }
  
  // Add categories from interests
  if (contextData.topInterests) {
    contextData.topInterests.forEach((interest) => {
      if (interest.name) categories.add(interest.name)
    })
  }
  
  return Array.from(categories).slice(0, 5) // Return top 5 categories
}

function createRecommendationPrompt(settings: RecommendationSettings, userContext: UserContext): string {
  const serendipityDescription = settings.serendipityLevel <= 3 ? 'focused on user\'s established interests' :
    settings.serendipityLevel <= 7 ? 'balanced between familiar and new topics' :
    'exploratory with diverse, unexpected suggestions'

  const domainBlacklistText = settings.domainBlacklist.length > 0 
    ? `Avoid these domains: ${settings.domainBlacklist.join(', ')}`
    : 'No domain restrictions'

  return `You are an AI recommendation engine for a bookmark management platform. Generate ${settings.suggestionsPerRefresh} personalized content recommendations.

USER CONTEXT:
- Recent bookmarks: ${userContext.recentBookmarks.map(b => `${b.title} (${b.url})`).join(', ')}
- Top categories: ${userContext.topCategories.join(', ')}
- Interests: ${userContext.interests.join(', ')}
- Preferred read time: ${userContext.browsingPatterns.preferredReadTime}
- Active hours: ${userContext.browsingPatterns.activeHours.join(', ')}

RECOMMENDATION PARAMETERS:
- Serendipity level: ${settings.serendipityLevel}/10 (${serendipityDescription})
- Include trending content: ${settings.includeTrending ? 'Yes' : 'No'}
- ${domainBlacklistText}
- Include TL;DR summaries: ${settings.includeTLDR ? 'Yes' : 'No'}

REQUIREMENTS:
1. Generate diverse, high-quality content recommendations
2. Each recommendation should be relevant to the user's interests
3. Provide realistic URLs (they don't need to be real, but should look authentic)
4. Include confidence scores (0.0-1.0) based on relevance
5. Provide 2-3 reasons why each recommendation fits the user
6. Estimate realistic read times
7. Choose appropriate emoji icons for each recommendation

Return a JSON array of recommendations with this exact structure:
[
  {
    "id": "unique-id",
    "url": "https://example.com/article",
    "title": "Article Title",
    "description": "Brief description of the content",
    "favicon": "🔗",
    "readTime": "≈X min read",
    "confidence": 0.85,
    "why": ["Reason 1", "Reason 2", "Reason 3"]
  }
]

Focus on creating valuable, actionable content that matches the user's demonstrated interests while respecting their serendipity preference.`
}

export async function POST(request: NextRequest) {
      try {
        console.log('🎯 AI Recommendations API called')

        if (TESTING_MODE) {
          console.log('🧪 TESTING MODE: Recommendations Authentication bypassed')
          
          // Return mock response in testing mode
          const mockRecommendations: RecommendationItem[] = [
            {
              id: 'test-1',
              url: 'https://example.com/ai-breakthroughs-2024',
              title: 'Latest AI Breakthroughs in 2024',
              description: 'Comprehensive overview of the most significant artificial intelligence developments this year.',
              favicon: '🤖',
              readTime: '≈5 min read',
              confidence: 0.87,
              why: ['Matches your AI interest tags', 'Popular in your network', 'Recent publication']
            },
            {
              id: 'test-2',
              url: 'https://example.com/typescript-advanced-patterns',
              title: 'Advanced TypeScript Patterns You Should Know',
              description: 'Deep dive into powerful TypeScript patterns for better code organization.',
              favicon: '📘',
              readTime: '≈8 min read',
              confidence: 0.92,
              why: ['Similar to your saved articles', 'High engagement rate', 'Trending in tech']
            }
          ]

          return NextResponse.json({
            success: true,
            recommendations: mockRecommendations,
            totalGenerated: mockRecommendations.length,
            timestamp: Date.now()
          })
        }

        // Production authentication
        const supabase = createRouteHandlerClient({ cookies: () => cookies() })
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        // Check if authentication bypass is enabled (independent of dev mode)
        const bypassAuth = process.env.BYPASS_AUTHENTICATION === 'true'
        const isDevelopment = process.env.NODE_ENV === 'development' || process.env.DEV_MODE === 'true'
        let userId = user?.id
        
        if (authError || !user) {
          if (bypassAuth || isDevelopment) {
            // Use a fixed dev user ID when authentication is bypassed
            userId = 'dev-user-fixed-id'
            console.log('🔓 AUTH BYPASS: Using development user ID:', userId)
            console.log('🏭 Production mode:', !isDevelopment ? 'ENABLED' : 'DISABLED')
          } else {
            return NextResponse.json(
              { error: 'Authentication required' },
              { status: 401 }
            )
          }
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

        const { settings } = body as { settings: RecommendationSettings }

        if (!settings) {
          return NextResponse.json(
            { error: 'Recommendation settings are required' },
            { status: 400 }
          )
        }

        console.log('📝 Processing recommendation request for user:', userId)
        console.log('⚙️ Settings:', {
          suggestionsPerRefresh: settings.suggestionsPerRefresh,
          serendipityLevel: settings.serendipityLevel,
          includeTrending: settings.includeTrending,
          domainBlacklistCount: settings.domainBlacklist.length
        })

        // Get user context
        const userContext = await getUserContext(userId)
        console.log('👤 User context loaded:', {
          recentBookmarksCount: userContext.recentBookmarks.length,
          topCategories: userContext.topCategories,
          interestsCount: userContext.interests.length
        })

        // Create recommendation prompt
        const prompt = createRecommendationPrompt(settings, userContext)

        // Call OpenAI API
        const completion = await openai.chat.completions.create({
          model: 'gpt-4-turbo-preview',
          messages: [
            {
              role: 'system',
              content: 'You are an expert content curator and recommendation engine. Always return valid JSON arrays as requested.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: Math.max(0.3, Math.min(0.9, settings.serendipityLevel / 10)), // Scale serendipity to temperature
          max_tokens: 2000,
          top_p: 1,
          frequency_penalty: 0.1,
          presence_penalty: 0.1,
        })

        const response = completion.choices[0]?.message?.content

        if (!response) {
          console.error('❌ No response from OpenAI')
          return NextResponse.json(
            { error: 'No recommendations generated' },
            { status: 500 }
          )
        }

        console.log('🤖 OpenAI response received:', response.substring(0, 200) + '...')

        // Strip markdown code blocks if present
        let cleanedResponse = response
        if (response.startsWith('```json')) {
          cleanedResponse = response
            .replace(/^```json\s*/, '')  // Remove opening ```json
            .replace(/\s*```$/, '')      // Remove closing ```
        } else if (response.startsWith('```')) {
          cleanedResponse = response
            .replace(/^```\s*/, '')      // Remove opening ```
            .replace(/\s*```$/, '')      // Remove closing ```
        }

        // Parse the JSON response
        let recommendations: RecommendationItem[]
        try {
          recommendations = JSON.parse(cleanedResponse)
          
          // Validate the response structure
          if (!Array.isArray(recommendations)) {
            throw new Error('Response is not an array')
          }

          // Validate each recommendation
          recommendations.forEach((rec, index) => {
            if (!rec.id || !rec.url || !rec.title || !rec.description || !rec.favicon || !rec.readTime || typeof rec.confidence !== 'number' || !Array.isArray(rec.why)) {
              throw new Error(`Invalid recommendation structure at index ${index}`)
            }
          })

        } catch (parseError) {
          console.error('❌ Failed to parse OpenAI response:', parseError)
          console.error('📄 Raw OpenAI response (first 1000 chars):', response?.substring(0, 1000))
          console.error('📄 Full OpenAI response length:', response?.length)
          console.error('📄 Response type:', typeof response)
          
          return NextResponse.json(
            { error: 'Failed to parse AI recommendations' },
            { status: 500 }
          )
        }

        // Filter out blacklisted domains
        const filteredRecommendations = recommendations.filter(rec => {
          const domain = new URL(rec.url).hostname
          return !settings.domainBlacklist.some(blacklistedDomain => 
            domain.includes(blacklistedDomain.toLowerCase())
          )
        })

        console.log('✅ AI recommendations generated successfully')
        console.log('📊 Usage:', completion.usage)
        console.log('🎯 Recommendations:', filteredRecommendations.length, 'generated,', recommendations.length - filteredRecommendations.length, 'filtered')

        // Sentry tracing removed

        return NextResponse.json({
          success: true,
          recommendations: filteredRecommendations,
          totalGenerated: recommendations.length,
          totalFiltered: recommendations.length - filteredRecommendations.length,
          usage: completion.usage,
          model: completion.model,
          timestamp: Date.now(),
          settings: {
            suggestionsPerRefresh: settings.suggestionsPerRefresh,
            serendipityLevel: settings.serendipityLevel,
            includeTrending: settings.includeTrending
          }
        })

      } catch (error) {
        console.error('❌ AI Recommendations API Error:', error)
        
        let errorMessage = 'Failed to generate recommendations'
        let statusCode = 500
        
        if (error instanceof Error) {
          if (error.message.includes('rate limit')) {
            errorMessage = 'Rate limit exceeded. Please try again later.'
            statusCode = 429
          } else if (error.message.includes('timeout')) {
            errorMessage = 'Request timeout. Please try again.'
            statusCode = 408
          } else if (error.message.includes('content policy')) {
            errorMessage = 'Content policy violation. Please adjust your preferences.'
            statusCode = 400
          }
        }

        // Sentry tracing removed
        
        return NextResponse.json(
          { 
            error: errorMessage,
            details: error instanceof Error ? error.message : 'Unknown error'
          },
          { status: statusCode }
        )
      }
    }

export async function GET() {
  return NextResponse.json({
    service: 'AI Recommendations API',
    version: '1.0.0',
    status: 'active',
    endpoints: {
      'POST /api/ai/recommendations': 'Generate personalized recommendations'
    }
  })
}    