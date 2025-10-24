import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import OpenAI from 'openai'
import { isOracleEnabled, createOracleDisabledResponse } from '@/lib/oracle-state'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(req: NextRequest) {
  try {
    // Check if Oracle is enabled before processing
    const oracleEnabled = await isOracleEnabled()
    if (!oracleEnabled) {
      console.log('🚫 Whisper API blocked - Oracle is disabled')
      return NextResponse.json(
        createOracleDisabledResponse(),
        { status: 403 }
      )
    }

    // Get the form data from the request
    const formData = await req.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Convert the file to a buffer and create a readable stream
    const buffer = Buffer.from(await file.arrayBuffer())
    
    // Create a temporary file for OpenAI API
    const tempFilePath = `/tmp/${Date.now()}-${file.name}`
    fs.writeFileSync(tempFilePath, new Uint8Array(buffer))
    
    // Create a readable stream from the temp file
    const stream = fs.createReadStream(tempFilePath)

    // Transcribe the audio
    const transcription = await openai.audio.transcriptions.create({
      file: stream,
      model: 'whisper-1',
      response_format: 'json',
    })

    const userPrompt = transcription.text

    // Generate response using GPT-4
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: userPrompt }],
    })

    // Clean up the temporary file
    fs.unlinkSync(tempFilePath)

    return NextResponse.json({ reply: completion.choices[0].message.content })
  } catch (error) {
    console.error('Whisper API error:', error)
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 })
  }
} 