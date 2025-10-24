import { OpenAI } from 'openai'
import { NextResponse } from 'next/server'
import { isOracleEnabled, createOracleDisabledResponse } from '@/lib/oracle-state'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })

export async function POST(req: Request) {
  // Check if Oracle is enabled before processing
  const oracleEnabled = await isOracleEnabled()
  if (!oracleEnabled) {
    // Provide a safe mock response so UI features work even when Oracle is disabled
    try {
      const { message } = await req.json()
      return NextResponse.json({
        text: `AI (mock): ${typeof message === 'string' ? message.slice(0, 300) : 'No message provided'}`,
        mock: true
      })
    } catch (e) {
      console.log('🚫 Oracle disabled and failed to create mock response:', e)
      return NextResponse.json(
        createOracleDisabledResponse(),
        { status: 403 }
      )
    }
  }

  const { message } = await req.json()

  const chat = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: message }],
  })

  return NextResponse.json({ text: chat.choices[0].message.content })
} 