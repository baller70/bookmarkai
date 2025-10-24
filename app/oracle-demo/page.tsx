
'use client'
export const dynamic = 'force-dynamic'

import React, { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'
import { 
  Bot, 
  User, 
  Mic, 
  MicOff, 
  Volume2, 
  Send, 
  Settings,
  Brain,
  MessageSquare,
  Sparkles
} from 'lucide-react'
import OracleVoiceChat from '@/components/oracle/oracle-voice-chat'
import OracleWhisper from '@/components/oracle/oracle-whisper'
import { supabase } from '@/lib/supabase'
import { getOracleSetting } from '@/lib/user-settings-service'

interface Message {
  id: string
  text: string
  isUser: boolean
  timestamp: Date
  audioUrl?: string
}

interface VoiceSettings {
  speechToText: boolean
  textToSpeech: boolean
  voiceModel: string
  autoPlayResponses: boolean
  pushToTalk: boolean
}

export default function OracleDemoPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputText, setInputText] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>({
    speechToText: true,
    textToSpeech: true,
    voiceModel: 'alloy',
    autoPlayResponses: true,
    pushToTalk: false
  })
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)

  // Load settings from Supabase
  useEffect(() => {
    ;(async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        try {
                     const remoteVoice = await getOracleSetting(user.id, 'voice')
           
           if (remoteVoice && typeof remoteVoice === 'object' && 'voiceModel' in remoteVoice) {
             setVoiceSettings(prev => ({ ...prev, voiceModel: remoteVoice.voiceModel as string }))
           }
          
          console.log('✅ Oracle Demo settings loaded from Supabase')
        } catch (error) {
          console.error('Failed to load Oracle Demo settings:', error)
        }
      }
    })()
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const sendMessage = async (text?: string) => {
    const messageText = text || inputText.trim()
    if (!messageText) return

    const newMessage: Message = {
      id: Date.now().toString(),
      text: messageText,
      isUser: true,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, newMessage])
    setInputText('')
    setIsProcessing(true)

    try {
      // Load Oracle behavior settings
      const behaviorSettings = localStorage.getItem('oracleBehaviorSettings')
      let settings = {
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
        customInstructions: ''
      }

      if (behaviorSettings) {
        try {
          const parsed = JSON.parse(behaviorSettings)
          settings = { ...settings, ...parsed }
        } catch (error) {
          console.error('Failed to parse behavior settings:', error)
        }
      }

      // Get conversation history for context
      const conversationHistory = messages.slice(-10).map(msg => ({
        role: msg.isUser ? 'user' : 'assistant',
        content: msg.text
      }))

      // Add current message to history
      conversationHistory.push({
        role: 'user',
        content: messageText
      })

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: messageText,
          history: conversationHistory,
          settings: settings
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to get AI response')
      }

      const data = await response.json()
      
      if (data.success) {
        const aiResponse: Message = {
          id: (Date.now() + 1).toString(),
          text: data.response,
          isUser: false,
          timestamp: new Date()
        }
        setMessages(prev => [...prev, aiResponse])

        // Auto-play response if enabled
        if (voiceSettings.textToSpeech && voiceSettings.autoPlayResponses) {
          playTextToSpeech(data.response)
        }
      } else {
        throw new Error(data.error || 'Failed to get AI response')
      }
    } catch (error) {
      console.error('Error sending message:', error)
      toast.error('Failed to send message. Please try again.')
      
      const errorMessage: Message = {
        id: (Date.now() + 2).toString(),
        text: 'Sorry, I encountered an error processing your message. Please try again.',
        isUser: false,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsProcessing(false)
    }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      })
      
      mediaRecorderRef.current = new MediaRecorder(stream)
      audioChunksRef.current = []

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data)
      }

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' })
        await processAudioInput(audioBlob)
        
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorderRef.current.start()
      setIsRecording(true)
      toast.success('Recording started...')
    } catch (error) {
      console.error('Error starting recording:', error)
      toast.error('Failed to start recording. Please check microphone permissions.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      toast.info('Processing your voice...')
    }
  }

  const processAudioInput = async (audioBlob: Blob) => {
    setIsProcessing(true)
    
    try {
      const formData = new FormData()
      formData.append('audio', audioBlob, 'recording.wav')
      formData.append('language', 'en')

      const response = await fetch('/api/ai/voice/stt', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Failed to process speech')
      }

      const data = await response.json()
      
      if (data.success && data.text) {
        // Send the transcribed text as a message
        await sendMessage(data.text)
      } else {
        throw new Error(data.error || 'Failed to transcribe speech')
      }
    } catch (error) {
      console.error('Error processing audio:', error)
      toast.error('Failed to process voice input. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  const playTextToSpeech = async (text: string) => {
    if (isPlaying) return
    
    setIsPlaying(true)
    
    try {
      const response = await fetch('/api/ai/voice/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text,
          voice: voiceSettings.voiceModel,
          speed: 1.0
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate speech')
      }

      const audioBlob = await response.blob()
      const audioUrl = URL.createObjectURL(audioBlob)
      
      if (audioRef.current) {
        audioRef.current.src = audioUrl
        audioRef.current.play()
        
        audioRef.current.onended = () => {
          setIsPlaying(false)
          URL.revokeObjectURL(audioUrl)
        }
      }
    } catch (error) {
      console.error('Error playing text-to-speech:', error)
      toast.error('Failed to play audio response')
      setIsPlaying(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center space-x-2">
            <Bot className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Oracle AI Demo
            </h1>
          </div>
          <p className="text-muted-foreground">
            Experience conversational AI with voice and text capabilities
          </p>
        </div>

        {/* Status Bar */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Badge variant={voiceSettings.speechToText ? "default" : "secondary"}>
                  <Mic className="h-3 w-3 mr-1" />
                  Speech-to-Text
                </Badge>
                <Badge variant={voiceSettings.textToSpeech ? "default" : "secondary"}>
                  <Volume2 className="h-3 w-3 mr-1" />
                  Text-to-Speech
                </Badge>
                <Badge variant="outline">
                  <Brain className="h-3 w-3 mr-1" />
                  Voice: {voiceSettings.voiceModel}
                </Badge>
              </div>
              <Button variant="outline" size="sm" onClick={() => window.open('/settings/oracle', '_blank')}>
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Chat Interface */}
        <Card className="h-[500px] flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MessageSquare className="h-5 w-5" />
              <span>Conversation</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col p-0">
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg p-3 ${
                        message.isUser
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <div className="flex items-start space-x-2">
                        {!message.isUser && (
                          <Bot className="h-4 w-4 mt-0.5 text-blue-600" />
                        )}
                        {message.isUser && (
                          <User className="h-4 w-4 mt-0.5 text-white" />
                        )}
                        <div className="flex-1">
                          <p className="text-sm">{message.text}</p>
                          <p className={`text-xs mt-1 ${
                            message.isUser ? 'text-blue-200' : 'text-gray-500'
                          }`}>
                            {formatTime(message.timestamp)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {isProcessing && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 rounded-lg p-3">
                      <div className="flex items-center space-x-2">
                        <Bot className="h-4 w-4 text-blue-600" />
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" />
                          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div ref={messagesEndRef} />
            </ScrollArea>
            
            <Separator />
            
            {/* Input Area */}
            <div className="p-4">
              <div className="flex items-center space-x-2">
                <Button
                  variant={isRecording ? "destructive" : "outline"}
                  size="sm"
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={isProcessing || !voiceSettings.speechToText}
                >
                  {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </Button>
                
                <Input
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message or use voice..."
                  disabled={isProcessing}
                  className="flex-1"
                />
                
                <Button
                  onClick={() => sendMessage()}
                  disabled={isProcessing || !inputText.trim()}
                  size="sm"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              
              {isRecording && (
                <div className="mt-2 text-center">
                  <Badge variant="destructive" className="animate-pulse">
                    <Mic className="h-3 w-3 mr-1" />
                    Recording...
                  </Badge>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Simple Oracle Voice Chat */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Sparkles className="h-5 w-5 text-green-600" />
              <span>Simple Oracle Voice Chat</span>
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              A simplified voice chat interface using react-speech-kit for instant conversation
            </p>
          </CardHeader>
          <CardContent>
            <OracleVoiceChat />
          </CardContent>
        </Card>

        {/* Oracle Whisper - Native TTS */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Brain className="h-5 w-5 text-indigo-600" />
              <span>Oracle Whisper (Native TTS)</span>
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Direct voice-to-voice conversation using native browser speech synthesis
            </p>
          </CardHeader>
          <CardContent>
            <OracleWhisper />
          </CardContent>
        </Card>

        {/* Oracle Realtime - OpenAI Realtime API */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Sparkles className="h-5 w-5 text-red-600" />
              <span>Oracle Realtime (OpenAI Realtime API)</span>
            </CardTitle>
            <p className="text-sm text-muted-foreground">
                             Real-time voice conversation using OpenAI&apos;s Realtime API - requires API key
            </p>
          </CardHeader>
          <CardContent>
            <div className="p-4 border rounded-lg bg-gradient-to-r from-red-50 to-pink-50">
              <div className="flex items-center space-x-2 mb-3">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <span className="font-semibold text-red-700">Real-time Voice Chat</span>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                                 Experience ultra-low latency voice conversation with OpenAI&apos;s cutting-edge Realtime API.
              </p>
              <Button 
                onClick={() => window.open('/oracle-realtime', '_blank')}
                className="w-full bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Open Oracle Realtime Chat
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <Mic className="h-8 w-8 mx-auto mb-2 text-blue-600" />
              <h3 className="font-semibold mb-1">Voice Input</h3>
              <p className="text-sm text-muted-foreground">
                Speak naturally using OpenAI Whisper
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <Volume2 className="h-8 w-8 mx-auto mb-2 text-purple-600" />
              <h3 className="font-semibold mb-1">Voice Output</h3>
              <p className="text-sm text-muted-foreground">
                Hear responses with natural voices
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <Sparkles className="h-8 w-8 mx-auto mb-2 text-green-600" />
              <h3 className="font-semibold mb-1">AI Personality</h3>
              <p className="text-sm text-muted-foreground">
                Customizable behavior and responses
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Hidden audio element for TTS playback */}
      <audio ref={audioRef} style={{ display: 'none' }} />
    </div>
  )
}    