'use client'

import React, { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Mic, 
  Square,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react'
import { toast } from 'sonner'
// Sentry removed

interface LogEntry {
  id: string
  timestamp: Date
  level: 'info' | 'warn' | 'error' | 'success'
  message: string
  data?: Record<string, unknown>
}

interface AudioTest {
  id: string
  name: string
  description: string
  status: 'pending' | 'running' | 'passed' | 'failed'
  result?: string
}

export default function WakeWordDebugPage() {
  const [isListening, setIsListening] = useState(false)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [audioTests, setAudioTests] = useState<AudioTest[]>([
    {
      id: 'mic-permission',
      name: 'Microphone Permission',
      description: 'Check if microphone access is granted',
      status: 'pending'
    },
    {
      id: 'media-recorder',
      name: 'MediaRecorder Support',
      description: 'Verify MediaRecorder API support',
      status: 'pending'
    },
    {
      id: 'mime-types',
      name: 'Audio MIME Types',
      description: 'Check supported audio formats',
      status: 'pending'
    },
    {
      id: 'stt-api',
      name: 'STT API Connection',
      description: 'Test speech-to-text API endpoint',
      status: 'pending'
    },
    {
      id: 'wake-word-detection',
      name: 'Wake Word Detection',
      description: 'Test actual wake word recognition',
      status: 'pending'
    }
  ])
  const [currentTranscription, setCurrentTranscription] = useState('')
  const [audioStats, setAudioStats] = useState({
    chunkCount: 0,
    totalSize: 0,
    avgChunkSize: 0,
    lastChunkSize: 0
  })

  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)

  const addLog = (level: LogEntry['level'], message: string, data?: Record<string, unknown>) => {
    const logEntry: LogEntry = {
      id: Date.now().toString(),
      timestamp: new Date(),
      level,
      message,
      data
    }
    
    setLogs(prev => [logEntry, ...prev].slice(0, 100)) // Keep last 100 logs
    
    // Also log to console with emojis
    const emoji = {
      info: 'ℹ️',
      warn: '⚠️',
      error: '❌',
      success: '✅'
    }[level]
    
    console.log(`${emoji} [Wake Word Debug] ${message}`, data || '')
  }

  const updateTestStatus = (testId: string, status: AudioTest['status'], result?: string) => {
    setAudioTests(prev => prev.map(test => 
      test.id === testId 
        ? { ...test, status, result }
        : test
    ))
  }

  const runAllTests = async () => {
    addLog('info', 'Starting comprehensive audio tests...')
    
    // Reset all tests
    setAudioTests(prev => prev.map(test => ({ ...test, status: 'pending' })))
    
    // Test 1: Microphone Permission
    try {
      updateTestStatus('mic-permission', 'running')
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach(track => track.stop())
      updateTestStatus('mic-permission', 'passed', 'Microphone access granted')
      addLog('success', 'Microphone permission test passed')
    } catch (error) {
      updateTestStatus('mic-permission', 'failed', `Error: ${error}`)
      addLog('error', 'Microphone permission test failed', { error: String(error) })
    }

    // Test 2: MediaRecorder Support
    try {
      updateTestStatus('media-recorder', 'running')
      if (typeof MediaRecorder === 'undefined') {
        throw new Error('MediaRecorder not supported')
      }
      updateTestStatus('media-recorder', 'passed', 'MediaRecorder API available')
      addLog('success', 'MediaRecorder support test passed')
    } catch (error) {
      updateTestStatus('media-recorder', 'failed', `Error: ${error}`)
      addLog('error', 'MediaRecorder support test failed', { error: String(error) })
    }

    // Test 3: MIME Types
    try {
      updateTestStatus('mime-types', 'running')
      const supportedTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4',
        'audio/wav',
        'audio/ogg'
      ]
      
      const supported = supportedTypes.filter(type => MediaRecorder.isTypeSupported(type))
      
      if (supported.length === 0) {
        throw new Error('No supported audio MIME types found')
      }
      
      updateTestStatus('mime-types', 'passed', `Supported: ${supported.join(', ')}`)
      addLog('success', 'MIME types test passed', { supported })
    } catch (error) {
      updateTestStatus('mime-types', 'failed', `Error: ${error}`)
      addLog('error', 'MIME types test failed', { error: String(error) })
    }

    // Test 4: STT API
    try {
      updateTestStatus('stt-api', 'running')
      
      // Create a simple test by making a basic connectivity test
      // Skip actual audio test since we don't have real audio data
      const response = await fetch('/api/ai/voice/stt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          test: 'connectivity'
        })
      })
      
      // We expect a 400 error for non-FormData requests, which means the API is working
      if (response.status === 400) {
        updateTestStatus('stt-api', 'passed', 'STT API responding correctly (expects FormData)')
        addLog('success', 'STT API test passed - API correctly rejects non-FormData requests')
      } else {
        const errorText = await response.text()
        updateTestStatus('stt-api', 'failed', `Unexpected response: HTTP ${response.status}`)
        addLog('error', 'STT API test failed', { status: response.status, error: errorText })
      }
    } catch (error) {
      updateTestStatus('stt-api', 'failed', `Error: ${error}`)
      addLog('error', 'STT API test failed', { error: String(error) })
    }

    // Test 5: Wake Word Detection (requires manual testing)
    updateTestStatus('wake-word-detection', 'pending', 'Manual test required - use the recording button below')
    addLog('info', 'Wake word detection test requires manual recording')
  }

  const startListening = async () => {
    try {
      addLog('info', 'Starting wake word listening test...')
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000,
          channelCount: 1
        } 
      })
      
      streamRef.current = stream
      
      const supportedTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4',
        'audio/wav'
      ]
      
      let mimeType = 'audio/webm;codecs=opus'
      for (const type of supportedTypes) {
        if (MediaRecorder.isTypeSupported(type)) {
          mimeType = type
          break
        }
      }
      
      addLog('info', `Using MIME type: ${mimeType}`)
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: mimeType,
        audioBitsPerSecond: 16000
      })
      
      recorderRef.current = mediaRecorder
      chunksRef.current = []
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
          
          setAudioStats(prev => {
            const newChunkCount = prev.chunkCount + 1
            const newTotalSize = prev.totalSize + event.data.size
            return {
              chunkCount: newChunkCount,
              totalSize: newTotalSize,
              avgChunkSize: Math.round(newTotalSize / newChunkCount),
              lastChunkSize: event.data.size
            }
          })
          
          addLog('info', `Audio chunk received: ${event.data.size} bytes`)
        }
      }
      
      mediaRecorder.onstop = async () => {
        addLog('info', 'Recording stopped, processing audio...')
        
        const audioBlob = new Blob(chunksRef.current, { type: mimeType })
        addLog('info', `Processing audio blob: ${audioBlob.size} bytes`)
        
        try {
          const formData = new FormData()
          formData.append('audio', audioBlob, 'test.webm')
          formData.append('language', 'en')
          formData.append('prompt', 'Listen for the wake word Oracle or oracle')
          
          const response = await fetch('/api/ai/voice/stt', {
            method: 'POST',
            body: formData
          })
          
          if (response.ok) {
            const data = await response.json()
            setCurrentTranscription(data.transcription || 'No transcription')
            addLog('success', `Transcription: ${data.transcription}`)
            
            // Check for wake word
            if (data.transcription) {
              const transcription = data.transcription.toLowerCase().trim()
              const wakeWords = ['oracle', 'orical', 'oracles', 'oral']
              const detected = wakeWords.some(word => transcription.includes(word))
              
              if (detected) {
                addLog('success', 'Wake word detected!', { transcription })
                updateTestStatus('wake-word-detection', 'passed', `Wake word found in: ${data.transcription}`)
                toast.success('Wake word detected!')
              } else {
                addLog('warn', 'No wake word detected', { transcription })
                updateTestStatus('wake-word-detection', 'failed', `No wake word in: ${data.transcription}`)
              }
            }
          } else {
            const errorText = await response.text()
            addLog('error', 'STT API error', { status: response.status, error: errorText })
          }
        } catch (error) {
          addLog('error', 'Error processing audio', { error: String(error) })
        }
      }
      
      mediaRecorder.onerror = (event) => {
        addLog('error', 'MediaRecorder error', { error: String(event) })
      }
      
      mediaRecorder.start()
      setIsListening(true)
      addLog('info', 'Recording started - say Oracle to test wake word detection')
      
      // Auto-stop after 5 seconds
      setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop()
        }
      }, 5000)
      
    } catch (error) {
      addLog('error', 'Error starting listening test', { error: String(error) })
      console.error(error, {
        tags: { component: 'wake-word-debug', action: 'start-listening' }
      })
    }
  }

  const stopListening = () => {
    if (recorderRef.current && recorderRef.current.state === 'recording') {
      recorderRef.current.stop()
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
    }
    
    setIsListening(false)
    addLog('info', 'Listening stopped manually')
  }

  const clearLogs = () => {
    setLogs([])
    setCurrentTranscription('')
    setAudioStats({
      chunkCount: 0,
      totalSize: 0,
      avgChunkSize: 0,
      lastChunkSize: 0
    })
    addLog('info', 'Logs cleared')
  }

  const getStatusIcon = (status: AudioTest['status']) => {
    switch (status) {
      case 'passed': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />
      case 'running': return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />
      default: return <AlertCircle className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusColor = (status: AudioTest['status']) => {
    switch (status) {
      case 'passed': return 'bg-green-100 text-green-800'
      case 'failed': return 'bg-red-100 text-red-800'
      case 'running': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getLevelColor = (level: LogEntry['level']) => {
    switch (level) {
      case 'success': return 'text-green-600'
      case 'error': return 'text-red-600'
      case 'warn': return 'text-yellow-600'
      default: return 'text-blue-600'
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Wake Word Debug Console</h1>
          <p className="text-muted-foreground mt-2">
            Comprehensive testing and debugging for Oracle wake word detection
          </p>
        </div>
        <Button onClick={runAllTests} className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          Run All Tests
        </Button>
      </div>

      {/* Audio Tests */}
      <Card>
        <CardHeader>
          <CardTitle>Audio System Tests</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {audioTests.map((test) => (
            <div key={test.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                {getStatusIcon(test.status)}
                <div>
                  <h3 className="font-medium">{test.name}</h3>
                  <p className="text-sm text-muted-foreground">{test.description}</p>
                  {test.result && (
                    <p className="text-xs mt-1 text-muted-foreground">{test.result}</p>
                  )}
                </div>
              </div>
              <Badge className={getStatusColor(test.status)}>
                {test.status}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Manual Testing */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Manual Wake Word Test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <Button
                size="lg"
                variant={isListening ? "destructive" : "default"}
                onClick={isListening ? stopListening : startListening}
                className="flex items-center gap-2"
                disabled={isListening}
              >
                {isListening ? (
                  <>
                    <Square className="h-5 w-5" />
                    Recording... (auto-stops in 5s)
                  </>
                ) : (
                  <>
                    <Mic className="h-5 w-5" />
                    Start Recording Test
                  </>
                )}
              </Button>
            </div>
            
            {currentTranscription && (
              <div className="p-3 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">Last Transcription:</h4>
                <p className="text-sm">{currentTranscription}</p>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Chunks:</span> {audioStats.chunkCount}
              </div>
              <div>
                <span className="font-medium">Total Size:</span> {audioStats.totalSize} bytes
              </div>
              <div>
                <span className="font-medium">Avg Chunk:</span> {audioStats.avgChunkSize} bytes
              </div>
              <div>
                <span className="font-medium">Last Chunk:</span> {audioStats.lastChunkSize} bytes
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Debug Logs</CardTitle>
              <Button variant="outline" size="sm" onClick={clearLogs}>
                Clear Logs
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64">
              <div className="space-y-2">
                {logs.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No logs yet...</p>
                ) : (
                  logs.map((log) => (
                    <div key={log.id} className="text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">
                          {log.timestamp.toLocaleTimeString()}
                        </span>
                        <span className={getLevelColor(log.level)}>
                          [{log.level.toUpperCase()}]
                        </span>
                        <span>{log.message}</span>
                      </div>
                      {log.data && (
                        <pre className="text-xs text-muted-foreground mt-1 ml-4 overflow-x-auto">
                          {JSON.stringify(log.data, null, 2)}
                        </pre>
                      )}
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Testing Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm space-y-2">
            <p><strong>1. Run System Tests:</strong> Click the Run All Tests button to verify all components are working.</p>
            <p><strong>2. Manual Test:</strong> Use the Start Recording Test button and say Oracle clearly.</p>
            <p><strong>3. Check Logs:</strong> Monitor the debug logs for detailed information about the process.</p>
            <p><strong>4. Expected Results:</strong> The system should detect Oracle, oracle, or similar variations.</p>
          </div>
          
          <Separator />
          
          <div className="text-sm">
            <h4 className="font-medium mb-2">Common Issues:</h4>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Microphone permission denied - check browser settings</li>
              <li>No supported audio formats - browser compatibility issue</li>
              <li>STT API errors - check network connection and API keys</li>
              <li>Wake word not detected - try speaking more clearly or closer to microphone</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 