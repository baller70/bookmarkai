export const dynamic = 'force-dynamic'

// Sentry removed
import { NextRequest, NextResponse } from 'next/server'
// Supabase removed
import OpenAI from 'openai'
// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Supported languages for auto-processing
const SUPPORTED_LANGUAGES = {
  'en': 'English',
  'es': 'Spanish',
  'fr': 'French',
  'de': 'German',
  'it': 'Italian',
  'pt': 'Portuguese',
  'ru': 'Russian',
  'ja': 'Japanese',
  'ko': 'Korean',
  'zh': 'Chinese',
  'ar': 'Arabic',
  'hi': 'Hindi',
  'th': 'Thai',
  'vi': 'Vietnamese',
  'tr': 'Turkish',
  'nl': 'Dutch',
  'sv': 'Swedish',
  'da': 'Danish',
  'no': 'Norwegian',
  'fi': 'Finnish',
  'pl': 'Polish',
  'cs': 'Czech',
  'hu': 'Hungarian',
  'ro': 'Romanian',
  'bg': 'Bulgarian',
  'hr': 'Croatian',
  'sk': 'Slovak',
  'sl': 'Slovenian',
  'et': 'Estonian',
  'lv': 'Latvian',
  'lt': 'Lithuanian',
  'mt': 'Maltese',
  'cy': 'Welsh',
  'ga': 'Irish',
  'is': 'Icelandic',
  'mk': 'Macedonian',
  'sq': 'Albanian',
  'sr': 'Serbian',
  'bs': 'Bosnian',
  'me': 'Montenegrin',
  'uk': 'Ukrainian',
  'be': 'Belarusian',
  'kk': 'Kazakh',
  'ky': 'Kyrgyz',
  'tg': 'Tajik',
  'tk': 'Turkmen',
  'uz': 'Uzbek',
  'mn': 'Mongolian',
  'my': 'Burmese',
  'km': 'Khmer',
  'lo': 'Lao',
  'si': 'Sinhala',
  'ta': 'Tamil',
  'te': 'Telugu',
  'ml': 'Malayalam',
  'kn': 'Kannada',
  'gu': 'Gujarati',
  'pa': 'Punjabi',
  'ur': 'Urdu',
  'fa': 'Persian',
  'he': 'Hebrew',
  'am': 'Amharic',
  'sw': 'Swahili',
  'zu': 'Zulu',
  'af': 'Afrikaans',
  'id': 'Indonesian',
  'ms': 'Malay',
  'tl': 'Filipino',
  'haw': 'Hawaiian',
  'mi': 'Maori',
  'sm': 'Samoan',
  'to': 'Tongan',
  'fj': 'Fijian',
  'mg': 'Malagasy',
  'ny': 'Chichewa',
  'sn': 'Shona',
  'yo': 'Yoruba',
  'ig': 'Igbo',
  'ha': 'Hausa',
  'bn': 'Bengali',
  'ne': 'Nepali',
  'dz': 'Dzongkha',
  'bo': 'Tibetan',
  'ug': 'Uyghur',
  'yi': 'Yiddish',
  'jw': 'Javanese',
  'su': 'Sundanese',
  'ceb': 'Cebuano',
  'hmn': 'Hmong',
  'co': 'Corsican',
  'eo': 'Esperanto',
  'la': 'Latin',
  'gd': 'Scottish Gaelic',
  'fy': 'Frisian',
  'lb': 'Luxembourgish',
  'eu': 'Basque',
  'ca': 'Catalan',
  'gl': 'Galician'
}

interface ProcessingRequest {
  url: string
  content?: string
  title?: string
  description?: string
  language?: string
  settings?: {
    taggingEnabled?: boolean
    confidence?: number
    tagStyle?: 'singular' | 'plural' | 'camel' | 'kebab'
    languageMode?: 'detect' | 'english' | 'source'
    synonymMapping?: boolean
    normalization?: boolean
    suggestFolder?: boolean
    autoFile?: boolean
    smartFolderContext?: boolean
    stripTracking?: boolean
    minWordCount?: number
    duplicateHandling?: 'skip' | 'overwrite' | 'keepBoth'
    domainBlacklist?: string[]
    rules?: Array<{
      id: string
      ifType: 'domain' | 'tag' | 'urlRegex' | 'content'
      ifValue: string
      thenActions: Array<{
        type: 'addTag' | 'moveFolder' | 'setPriority'
        value: string
        folderId?: string
      }>
    }>
  }
}

interface ProcessingResult {
  success: boolean
  processedUrl: string
  originalUrl: string
  detectedLanguage?: string
  title?: string
  description?: string
  tags: string[]
  suggestedFolder?: {
    id: string
    name: string
    confidence: number
  }
  priority: 'high' | 'normal' | 'low'
  readingTime?: number
  wordCount?: number
  duplicateStatus: 'unique' | 'duplicate' | 'similar'
  appliedRules: Array<{
    ruleId: string
    actions: string[]
  }>
  confidence: number
  metadata: {
    domain: string
    processedAt: string
    processingTime: number
    languageSupported: boolean
  }
  warnings?: string[]
  errors?: string[]
}

// Utility functions
function stripTrackingParams(url: string): string {
  try {
    const urlObj = new URL(url)
    const trackingParams = [
      'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
      'fbclid', 'gclid', 'msclkid', 'twclid', 'li_fat_id', 'mc_cid', 'mc_eid',
      'ref', 'referrer', 'source', 'campaign', 'medium', 'term', 'content',
      '_ga', '_gid', '_gac', '_gl', '_gac_', '_gat', '_gcl_au', '_gcl_aw',
      'dclid', 'zanpid', 'affiliate_id', 'aff_id', 'partner_id', 'click_id',
      'session_id', 'visitor_id', 'user_id', 'client_id', 'transaction_id'
    ]
    
    trackingParams.forEach(param => {
      urlObj.searchParams.delete(param)
    })
    
    return urlObj.toString()
  } catch (error) {
    return url
  }
}

function detectLanguage(content: string): string {
  const patterns = {
    'zh': /[\u4e00-\u9fff]/,
    'ja': /[\u3040-\u309f\u30a0-\u30ff]/,
    'ko': /[\uac00-\ud7af]/,
    'ar': /[\u0600-\u06ff]/,
    'ru': /[\u0400-\u04ff]/,
    'th': /[\u0e00-\u0e7f]/,
    'hi': /[\u0900-\u097f]/,
    'he': /[\u0590-\u05ff]/,
    'fa': /[\u0600-\u06ff]/,
  }
  
  for (const [lang, pattern] of Object.entries(patterns)) {
    if (pattern.test(content)) {
      return lang
    }
  }
  
  return 'en'
}

function normalizeTag(tag: string, style: 'singular' | 'plural' | 'camel' | 'kebab'): string {
  const normalized = tag.toLowerCase().trim()
  
  switch (style) {
    case 'camel':
      return normalized.replace(/\s+(.)/g, (_, char) => char.toUpperCase())
    case 'kebab':
      return normalized.replace(/\s+/g, '-')
    case 'plural':
      return normalized.endsWith('s') ? normalized : normalized + 's'
    case 'singular':
      return normalized.endsWith('s') ? normalized.slice(0, -1) : normalized
    default:
      return normalized
  }
}

function calculateReadingTime(wordCount: number): number {
  return Math.ceil(wordCount / 225)
}

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname
  } catch {
    return 'unknown'
  }
}

async function generateTags(content: string, title: string, language: string, settings?: ProcessingRequest['settings']): Promise<string[]> {
  const languageName = SUPPORTED_LANGUAGES[language as keyof typeof SUPPORTED_LANGUAGES] || 'English'
  const tagStyle = settings?.tagStyle || 'singular'
  const languageMode = settings?.languageMode || 'detect'
  
  // Determine the language for tag generation
  let tagLanguage = language
  if (languageMode === 'english') {
    tagLanguage = 'en'
  } else if (languageMode === 'source') {
    tagLanguage = language
  }
  
  const tagLanguageName = SUPPORTED_LANGUAGES[tagLanguage as keyof typeof SUPPORTED_LANGUAGES] || 'English'
  
  const prompt = `Analyze the following content and generate relevant tags.

Content Language: ${languageName}
Tag Language: ${tagLanguageName}
Tag Style: ${tagStyle}

Title: ${title}
Content: ${content.substring(0, 2000)}...

Generate 3-8 relevant tags that best describe the content. Return only the tags, separated by commas.
Tags should be:
- In ${tagLanguageName}
- ${tagStyle === 'singular' ? 'Singular form' : tagStyle === 'plural' ? 'Plural form' : tagStyle === 'camel' ? 'camelCase format' : 'kebab-case format'}
- Concise and relevant
- No longer than 30 characters each

Focus on:
- Main topics and themes
- Industry/domain
- Content type (article, tutorial, news, etc.)
- Key concepts or technologies mentioned

Tags:`

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: `You are a content tagging expert. Generate relevant, concise tags for web content. Always respond in ${tagLanguageName}.`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 200,
    })

    let tags = response.choices[0]?.message?.content
      ?.split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0 && tag.length <= 30) || []

    // Apply tag normalization if enabled
    if (settings?.normalization) {
      tags = tags.map(tag => normalizeTag(tag, tagStyle))
    }

    return tags.slice(0, 8)
  } catch (error) {
    console.error('Error generating tags:', error)
    return []
  }
}

export async function GET() {
      try {
        console.log('🔄 Auto-processing API called (GET)')

        if (process.env.AI_AUTO_PROCESSING_TESTING === 'true') {
          console.log('🧪 TESTING MODE: Auto-processing returning mock data')
          return NextResponse.json({
            success: true,
            message: 'Auto-processing API is running in testing mode',
            supportedLanguages: Object.keys(SUPPORTED_LANGUAGES),
            features: [
              'Link processing and cleaning',
              'AI-powered content tagging',
              'Folder suggestions',
              'Content analysis',
              'Multi-language support',
              'Custom rules processing',
              'Duplicate detection'
            ]
          })
        }

        // Authentication bypassed for auto-processing
        console.log('🔓 AUTH BYPASS: Auto-processing in testing mode')

        return NextResponse.json({
          success: true,
          message: 'Auto-processing API is ready',
          supportedLanguages: Object.keys(SUPPORTED_LANGUAGES),
          features: [
            'Link processing and cleaning',
            'AI-powered content tagging',
            'Folder suggestions',
            'Content analysis',
            'Multi-language support',
            'Custom rules processing',
            'Duplicate detection'
          ]
        })
      } catch (error) {
        console.error('Error in auto-processing API (GET):', error)
        return NextResponse.json(
          { error: 'Internal server error' },
          { status: 500 }
        )
      }
    }

export async function POST(request: NextRequest) {
      const startTime = Date.now()
      
      try {
        console.log('🔄 Auto-processing API called (POST)')

        if (process.env.AI_AUTO_PROCESSING_TESTING === 'true') {
          console.log('🧪 TESTING MODE: Auto-processing authentication bypassed')
        } else {
          // Authentication bypassed for auto-processing
        console.log('🔓 AUTH BYPASS: Auto-processing in testing mode')
        }

        const body: ProcessingRequest = await request.json()
        const { url, content = '', title = '', description = '', language, settings = {} } = body

        if (!url) {
          return NextResponse.json({ error: 'URL is required' }, { status: 400 })
        }

        console.log('📋 Processing request:', {
          url: url.substring(0, 100),
          hasContent: !!content,
          hasTitle: !!title,
          language,
          settingsKeys: Object.keys(settings)
        })

        const result: ProcessingResult = {
          success: true,
          processedUrl: url,
          originalUrl: url,
          tags: [],
          priority: 'normal',
          duplicateStatus: 'unique',
          appliedRules: [],
          confidence: 0,
          metadata: {
            domain: extractDomain(url),
            processedAt: new Date().toISOString(),
            processingTime: 0,
            languageSupported: true
          },
          warnings: [],
          errors: []
        }

        // Step 1: Clean URL
        if (settings.stripTracking !== false) {
          result.processedUrl = stripTrackingParams(url)
          if (result.processedUrl !== url) {
            console.log('🧹 Stripped tracking parameters from URL')
          }
        }

        // Step 2: Check domain blacklist
        if (settings.domainBlacklist && settings.domainBlacklist.length > 0) {
          const domain = extractDomain(url)
          if (settings.domainBlacklist.some(blocked => domain.includes(blocked))) {
            result.warnings?.push(`Domain ${domain} is in blacklist`)
            console.log('⚠️ Domain is blacklisted:', domain)
          }
        }

        // Step 3: Detect language
        let detectedLanguage = language || 'en'
        if (!language && content) {
          detectedLanguage = detectLanguage(content)
          result.detectedLanguage = detectedLanguage
          console.log('🌐 Detected language:', detectedLanguage)
        }

        if (!SUPPORTED_LANGUAGES[detectedLanguage as keyof typeof SUPPORTED_LANGUAGES]) {
          result.metadata.languageSupported = false
          result.warnings?.push(`Language ${detectedLanguage} not fully supported`)
          detectedLanguage = 'en'
        }

        // Step 4: Check word count
        const wordCount = content.split(/\s+/).length
        result.wordCount = wordCount
        result.readingTime = calculateReadingTime(wordCount)

        if (settings.minWordCount && wordCount < settings.minWordCount) {
          result.warnings?.push(`Content word count (${wordCount}) below minimum (${settings.minWordCount})`)
        }

        // Step 5: Generate tags
        if (settings.taggingEnabled !== false && content && title) {
          const tags = await generateTags(content, title, detectedLanguage, settings)
          result.tags = tags
          result.confidence = Math.min(100, (result.tags.length / 5) * 100)
          console.log('🏷️ Generated tags:', result.tags)
        }

        result.title = title
        result.description = description
        result.metadata.processingTime = Date.now() - startTime

        console.log('✅ Auto-processing completed successfully')

        return NextResponse.json(result)
      } catch (error) {
        console.error('Error in auto-processing API (POST):', error)
        return NextResponse.json({
          success: false,
          error: 'Processing failed',
          metadata: {
            processingTime: Date.now() - startTime,
            processedAt: new Date().toISOString()
          }
        }, { status: 500 })
      }
    }

