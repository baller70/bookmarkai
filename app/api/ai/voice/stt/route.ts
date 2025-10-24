// Sentry removed
import { createRouteHandlerClient } from '@/lib/supabase'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { isOracleEnabled, createOracleDisabledResponse } from '@/lib/oracle-state'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(req: Request) {
      try {
        console.log('🎤 STT API called')
        
        // Check if Oracle is enabled before processing
        const oracleEnabled = await isOracleEnabled()
        if (!oracleEnabled) {
          console.log('🚫 STT API blocked - Oracle is disabled')
          return NextResponse.json(
            createOracleDisabledResponse(),
            { status: 403 }
          )
        }
        
        // Testing mode bypass for development
        const isTestingMode = process.env.NODE_ENV === 'development' || process.env.STT_TESTING_MODE === 'true'
        
        if (isTestingMode) {
          console.log('🧪 TESTING MODE: STT Authentication bypassed')
        } else {
          // Authentication check for production
          const supabase = createRouteHandlerClient({ cookies })
          const { data: { session } } = await supabase.auth.getSession()

          if (!session) {
            return NextResponse.json(
              { error: 'Authentication required' },
              { status: 401 }
            )
          }
        }

        // Enhanced Content-Type and FormData handling
        const contentType = req.headers.get('content-type') || ''
        console.log('📋 Request Content-Type:', contentType)
        
        let formData: FormData
        let audioFile: File | null = null
        let language = 'en'
        let prompt = ''

        try {
          // Parse FormData with better error handling
          if (!contentType.includes('multipart/form-data') && !contentType.includes('application/x-www-form-urlencoded')) {
            console.log('⚠️ Unexpected Content-Type, attempting FormData parsing anyway...')
          }
          
          formData = await req.formData()
          audioFile = formData.get('audio') as File
          language = formData.get('language') as string || 'en'
          prompt = formData.get('prompt') as string || ''
          
        } catch (formDataError) {
          console.error('❌ FormData parsing failed:', formDataError)
          
          return NextResponse.json(
            { 
              error: 'Invalid request format. Expected multipart/form-data with audio file.',
              details: formDataError instanceof Error ? formDataError.message : 'Unknown parsing error'
            },
            { status: 400 }
          )
        }

        // Validate audio file
        if (!audioFile || audioFile.size === 0) {
          console.log('❌ No audio file provided or file is empty')
          return NextResponse.json(
            { error: 'No audio file provided or file is empty' },
            { status: 400 }
          )
        }

        console.log('📋 STT Request details:', {
          audioFileName: audioFile.name || 'null',
          audioFileSize: audioFile.size,
          audioFileType: audioFile.type,
          language,
          promptLength: prompt.length
        })

        // Check file size (25MB limit)
        const maxSize = 25 * 1024 * 1024 // 25MB
        if (audioFile.size > maxSize) {
          console.log('❌ Audio file too large:', audioFile.size, 'bytes')
          return NextResponse.json(
            { error: 'Audio file too large. Maximum size is 25MB.' },
            { status: 413 }
          )
        }

        // Validate audio format
        const supportedFormats = ['flac', 'm4a', 'mp3', 'mp4', 'mpeg', 'mpga', 'oga', 'ogg', 'wav', 'webm']
        const fileExtension = audioFile.name?.split('.').pop()?.toLowerCase()
        const mimeType = audioFile.type.toLowerCase()
        
        console.log('🎵 Audio format check:', {
          fileName: audioFile.name,
          fileExtension,
          mimeType,
          supportedFormats
        })

        // Check if format is supported
        const isFormatSupported = supportedFormats.some(format => 
          mimeType.includes(format) || fileExtension === format
        )

        if (!isFormatSupported) {
          console.log('⚠️ Potentially unsupported audio type:', mimeType)
        }

        // Convert File to Buffer for OpenAI
        const audioBuffer = await audioFile.arrayBuffer()
        console.log('📊 Audio buffer size:', audioBuffer.byteLength, 'bytes')

        if (audioBuffer.byteLength === 0) {
          console.log('❌ Audio buffer is empty')
          return NextResponse.json(
            { error: 'Audio file appears to be empty or corrupted' },
            { status: 400 }
          )
        }

        // Create a File object with proper name and type for OpenAI
        const fileName = audioFile.name || `audio.${fileExtension || 'webm'}`
        const file = new File([audioBuffer], fileName, { 
          type: audioFile.type || 'audio/webm' 
        })

        console.log('🔄 Sending to OpenAI Whisper...')

        // Use OpenAI Whisper for transcription with optimized settings
        const transcription = await openai.audio.transcriptions.create({
          file: file,
          model: 'whisper-1',
          language: language === 'auto' ? undefined : language,
          prompt: prompt || 'Oracle, wake word, voice assistant, hey Oracle, Oracle AI',
          response_format: 'text',
          temperature: 0.0 // Use 0 for most consistent results
        })

        console.log('✅ Transcription successful:', transcription.substring(0, 100) + '...')

        // Sentry tracing removed

        return NextResponse.json({
          transcription: transcription,
          language: language,
          confidence: 0.95 // Whisper doesn't provide confidence, so we use a default
        })

      } catch (error) {
        console.error('❌ Error in STT route:', error)
        
        let errorMessage = 'Speech-to-text processing failed'
        let statusCode = 500
        
        if (error instanceof Error) {
          if (error.message.includes('Unrecognized file format')) {
            errorMessage = '🎵 Audio format error: ' + error.message
            statusCode = 400
            console.log(errorMessage)
          } else if (error.message.includes('rate limit')) {
            errorMessage = 'Rate limit exceeded. Please try again later.'
            statusCode = 429
          } else if (error.message.includes('timeout')) {
            errorMessage = 'Request timeout. Please try with a shorter audio file.'
            statusCode = 408
          }
        }

        // Sentry tracing removed

        return NextResponse.json(
          { error: errorMessage },
          { status: statusCode }
        )
      }
    }

