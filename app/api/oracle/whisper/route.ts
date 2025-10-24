import { OpenAI } from 'openai'
import { Readable } from 'stream'
import { NextRequest, NextResponse } from 'next/server'
// Sentry removed
import { isOracleEnabled, createOracleDisabledResponse } from '@/lib/oracle-state'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })

export async function POST(request: NextRequest) {
  try {
    console.log('🎤 Oracle Whisper API called')
    
    // Check if Oracle is enabled before processing
    const oracleEnabled = await isOracleEnabled()
    if (!oracleEnabled) {
      console.log('🚫 Oracle Whisper API blocked - Oracle is disabled')
      return NextResponse.json(
        createOracleDisabledResponse(),
        { status: 403 }
      )
    }
    
    const formData = await request.formData()
    const audioFile = formData.get('audio') as File
    
    if (!audioFile) {
      console.error('❌ No audio file provided')
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 })
    }

    console.log('📋 Oracle Whisper Request details:', {
      audioFileName: audioFile.name,
      audioFileSize: audioFile.size,
      audioFileType: audioFile.type,
    })

    // Convert File to buffer for OpenAI
    const buffer = Buffer.from(await audioFile.arrayBuffer())
    
    console.log('🔄 Sending to OpenAI Whisper...')
    
    const stream = Readable.from(buffer)
    
    const transcription = await openai.audio.transcriptions.create({
      file: stream as unknown as File,
      model: 'whisper-1',
      response_format: 'json',
    })

    console.log('✅ Oracle Whisper transcription successful:', transcription.text)

    return NextResponse.json({ 
      text: transcription.text,
      success: true 
    })
  } catch (error) {
    console.error('❌ Oracle Whisper API error:', error)

    return NextResponse.json(
      { error: 'Transcription failed', success: false }, 
      { status: 500 }
    )
  }
} 