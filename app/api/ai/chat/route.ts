import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
// Oracle state not required for TipTap AI commands

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Testing mode flag
const TESTING_MODE = process.env.ORACLE_CHAT_TESTING === 'true'

interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
  timestamp?: number
}

interface OracleBehaviorSettings {
  personality: string
  responseStyle: string
  language: string
  creativity: number
  temperature: number
  maxTokens: number
  contextWindow: number
  useEmoji: boolean
  useHumor: boolean
  detailedExplanations: boolean
  proactiveMode: boolean
  responseSpeed: string
  safetyLevel: string
  customInstructions: string
}

const DEFAULT_BEHAVIOR: OracleBehaviorSettings = {
  personality: 'friendly',
  responseStyle: 'balanced',
  language: 'en',
  creativity: 0.7,
  temperature: 0.7,
  maxTokens: 500,
  contextWindow: 4000,
  useEmoji: true,
  useHumor: false,
  detailedExplanations: true,
  proactiveMode: true,
  responseSpeed: 'normal',
  safetyLevel: 'moderate',
  customInstructions: ''
}

function createSystemPrompt(settings: OracleBehaviorSettings): string {
  const personalityPrompts = {
    professional: "You are a professional, efficient, and knowledgeable AI assistant.",
    friendly: "You are a warm, approachable, and helpful AI assistant who enjoys conversations.",
    casual: "You are a relaxed, informal, and easy-going AI assistant who speaks naturally.",
    creative: "You are an imaginative, innovative, and artistic AI assistant who thinks outside the box.",
    analytical: "You are a logical, data-driven, and methodical AI assistant who provides detailed analysis."
  }

  const stylePrompts = {
    concise: "Keep your responses brief and to the point.",
    detailed: "Provide comprehensive and thorough explanations.",
    balanced: "Balance brevity with necessary detail.",
    conversational: "Use a natural, conversational tone.",
    formal: "Maintain a professional and formal tone."
  }

  let systemPrompt = `${personalityPrompts[settings.personality as keyof typeof personalityPrompts] || personalityPrompts.friendly}

${stylePrompts[settings.responseStyle as keyof typeof stylePrompts] || stylePrompts.balanced}

You are Oracle, an advanced AI assistant with the following characteristics:
- You are integrated into a productivity and knowledge management platform
- You can help with various tasks including analysis, writing, research, and problem-solving
- You have access to voice capabilities and can engage in natural conversations`

  if (settings.useEmoji) {
    systemPrompt += "\n- Use appropriate emojis to enhance your responses and make them more engaging"
  }

  if (settings.useHumor) {
    systemPrompt += "\n- Feel free to use appropriate humor and wit in your responses"
  }

  if (settings.detailedExplanations) {
    systemPrompt += "\n- Provide detailed explanations when helpful, breaking down complex topics"
  }

  if (settings.proactiveMode) {
    systemPrompt += "\n- Be proactive in offering additional help, suggestions, or related information"
  }

  if (settings.customInstructions) {
    systemPrompt += `\n\nAdditional Instructions: ${settings.customInstructions}`
  }

  systemPrompt += `\n\nLanguage: Respond primarily in ${settings.language === 'en' ? 'English' : settings.language}
Safety Level: ${settings.safetyLevel} - Be helpful while maintaining appropriate boundaries.`

  return systemPrompt
}

export async function POST(request: NextRequest) {
  try {
    console.log('🤖 Oracle Chat API called')

    // Proceed regardless of Oracle state

    if (TESTING_MODE) {
      console.log('🧪 TESTING MODE: Chat Authentication bypassed')
      
      // Return mock response in testing mode
      const body = await request.json()
      const { message } = body

      return NextResponse.json({
        success: true,
        response: `Oracle Test Response: I received your message "${message}". This is a test response from Oracle AI. In production, I would provide intelligent responses using OpenAI's GPT models.`,
        usage: {
          prompt_tokens: 50,
          completion_tokens: 30,
          total_tokens: 80
        },
        model: 'gpt-4-turbo-preview',
        timestamp: Date.now()
      })
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
    
    const { 
      message, 
      conversationHistory = [], 
      behaviorSettings = DEFAULT_BEHAVIOR,
      context = ''
    } = body

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    console.log('📝 Processing message:', message.substring(0, 100) + '...')
    console.log('🎭 Personality:', behaviorSettings.personality)
    console.log('📚 Context window:', behaviorSettings.contextWindow)

    // Create system prompt based on behavior settings
    const systemPrompt = createSystemPrompt(behaviorSettings)

    // Prepare conversation messages
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: systemPrompt
      }
    ]

    // Add conversation history (limited by context window)
    const historyTokenLimit = Math.floor(behaviorSettings.contextWindow * 0.7) // Reserve 30% for system prompt and new message
    let tokenCount = systemPrompt.length / 4 // Rough token estimation

    // Add context if provided
    if (context) {
      messages.push({
        role: 'system',
        content: `Context: ${context}`
      })
      tokenCount += context.length / 4
    }

    // Add conversation history in reverse order (most recent first)
    const recentHistory = [...conversationHistory].reverse()
    for (const historyMessage of recentHistory) {
      const messageTokens = historyMessage.content.length / 4
      if (tokenCount + messageTokens > historyTokenLimit) break
      
      messages.unshift(historyMessage)
      tokenCount += messageTokens
    }

    // Add current user message
    messages.push({
      role: 'user',
      content: message
    })

    console.log('💬 Total messages in conversation:', messages.length)

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      temperature: behaviorSettings.temperature,
      max_tokens: behaviorSettings.maxTokens,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
    })

    const response = completion.choices[0]?.message?.content

    if (!response) {
      console.error('❌ No response from OpenAI')
      return NextResponse.json(
        { error: 'No response generated' },
        { status: 500 }
      )
    }

    console.log('✅ Oracle response generated successfully')
    console.log('📊 Usage:', completion.usage)

    return NextResponse.json({
      success: true,
      response: response,
      usage: completion.usage,
      model: completion.model,
      timestamp: Date.now(),
      settings: {
        personality: behaviorSettings.personality,
        temperature: behaviorSettings.temperature,
        maxTokens: behaviorSettings.maxTokens
      }
    })

  } catch (error) {
    console.error('❌ Oracle Chat API Error:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to process chat request',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 