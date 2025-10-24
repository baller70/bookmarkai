// Sentry removed
'use client'

import React, { useState, useEffect, useRef } from 'react'
import { MessageSquare, Settings, X, Mic, MicOff, Volume2, VolumeX, Send, Zap, BookOpen, Search, Calendar, FileText, Sparkles, Pause, Square } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { getOracleSetting } from '@/lib/user-settings-service'

interface OracleAppearanceSettings {
  primaryColor: string
  secondaryColor: string
  gradientDirection: 'linear' | 'radial' | 'conic'
  gradientIntensity: number
  blobSize: number
  blobFluidness: number
  blobRoundness: number
  morphingSpeed: number
  voiceVisualization: boolean
  voiceBarsCount: number
  voiceBarsHeight: number
  voiceBarsSpacing: number
  voiceReactivity: number
  idleAnimation: boolean
  idleAnimationSpeed: number
  pulseEffect: boolean
  pulseIntensity: number
  glowEffect: boolean
  glowIntensity: number
  themeIntegration: boolean
  floatingAnimation: boolean
  floatingSpeed: number
  floatingRange: number
}

interface VoiceSettings {
  speechToText: boolean
  textToSpeech: boolean
  voiceModel: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer'
  speechRate: number
  speechPitch: number
  speechVolume: number
  language: string
  autoPlayResponses: boolean
  voiceActivation: boolean
  pushToTalk: boolean
  noiseReduction: boolean
  echoCancellation: boolean
  microphoneGain: number
  silenceThreshold: number
  pauseDetection: number
  continuousListening: boolean
  wakeWord: string
  responseFormat: 'mp3' | 'opus' | 'aac' | 'flac'
  audioQuality: 'low' | 'medium' | 'high'
}

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  audioUrl?: string
}

interface QuickAction {
  id: string
  label: string
  icon: React.ReactNode
  description: string
  action: () => void
}

const defaultAppearanceSettings: OracleAppearanceSettings = {
  primaryColor: '#1e40af',
  secondaryColor: '#a855f7',
  gradientDirection: 'linear',
  gradientIntensity: 80,
  blobSize: 80,
  blobFluidness: 70,
  blobRoundness: 80,
  morphingSpeed: 3,
  voiceVisualization: true,
  voiceBarsCount: 8,
  voiceBarsHeight: 40,
  voiceBarsSpacing: 4,
  voiceReactivity: 70,
  idleAnimation: true,
  idleAnimationSpeed: 2,
  pulseEffect: true,
  pulseIntensity: 20,
  glowEffect: true,
  glowIntensity: 30,
  themeIntegration: true,
  floatingAnimation: true,
  floatingSpeed: 1.5,
  floatingRange: 10
}

const defaultVoiceSettings: VoiceSettings = {
  speechToText: true,
  textToSpeech: true,
  voiceModel: 'alloy',
  speechRate: 1.0,
  speechPitch: 1.0,
  speechVolume: 0.8,
  language: 'en-US',
  autoPlayResponses: true,
  voiceActivation: false,
  pushToTalk: false,
  noiseReduction: true,
  echoCancellation: true,
  microphoneGain: 50,
  silenceThreshold: 30,
  pauseDetection: 2000,
  continuousListening: false,
  wakeWord: 'Oracle',
  responseFormat: 'mp3',
  audioQuality: 'medium'
}

// Predefined heights for voice bars to avoid hydration issues
const voiceBarHeights = [0.4, 0.7, 0.3, 0.9, 0.6, 0.8, 0.5, 0.4, 0.9, 0.7, 0.6, 0.8, 0.5, 0.3, 0.7]

export function OracleBlobEnhanced() {
  const [appearanceSettings, setAppearanceSettings] = useState<OracleAppearanceSettings>(defaultAppearanceSettings)
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>(defaultVoiceSettings)
  const [isOpen, setIsOpen] = useState(false)
  const [showQuickActions, setShowQuickActions] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null)
  const [recordingTime, setRecordingTime] = useState(0)
  const [recordingInterval, setRecordingInterval] = useState<NodeJS.Timeout | null>(null)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Load settings from Supabase
  useEffect(() => {
    ;(async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        try {
          const [remoteAppearance, remoteVoice] = await Promise.all([
            getOracleSetting(user.id, 'appearance'),
            getOracleSetting(user.id, 'voice')
          ])
          
          setAppearanceSettings({ ...defaultAppearanceSettings, ...(remoteAppearance || {}) } as OracleAppearanceSettings)
          setVoiceSettings({ ...defaultVoiceSettings, ...(remoteVoice || {}) } as VoiceSettings)
          
          console.log('✅ Oracle Enhanced settings loaded from Supabase')
        } catch (error) {
          console.error('Failed to load Oracle Enhanced settings:', error)
        }
      }
    })()
  }, [])

  // Listen for settings updates
  useEffect(() => {
    const handleSettingsUpdate = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        try {
          const [remoteAppearance, remoteVoice] = await Promise.all([
            getOracleSetting(user.id, 'appearance'),
            getOracleSetting(user.id, 'voice')
          ])
          
          setAppearanceSettings({ ...defaultAppearanceSettings, ...(remoteAppearance || {}) } as OracleAppearanceSettings)
          setVoiceSettings({ ...defaultVoiceSettings, ...(remoteVoice || {}) } as VoiceSettings)
        } catch (error) {
          console.error('Failed to parse updated Oracle settings:', error)
        }
      }
    }

    window.addEventListener('oracleSettingsUpdated', handleSettingsUpdate)
    window.addEventListener('storage', handleSettingsUpdate)

    return () => {
      window.removeEventListener('oracleSettingsUpdated', handleSettingsUpdate)
      window.removeEventListener('storage', handleSettingsUpdate)
    }
  }, [])

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Clean up audio and recording on unmount
  useEffect(() => {
    return () => {
      if (currentAudio) {
        currentAudio.pause()
        currentAudio.src = ''
      }
      if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop()
      }
      if (recordingInterval) {
        clearInterval(recordingInterval)
      }
    }
  }, [currentAudio, mediaRecorder, recordingInterval])

  // Quick Actions
  const quickActions: QuickAction[] = [
    {
      id: 'summarize',
      label: 'Summarize',
      icon: <FileText className="h-4 w-4" />,
      description: 'Summarize current page or selection',
      action: () => {
        handleQuickAction('Please summarize the current content or selection on this page.')
      }
    },
    {
      id: 'explain',
      label: 'Explain',
      icon: <BookOpen className="h-4 w-4" />,
      description: 'Explain complex concepts',
      action: () => {
        handleQuickAction('Please explain any complex concepts or terms on this page in simple terms.')
      }
    },
    {
      id: 'search',
      label: 'Search',
      icon: <Search className="h-4 w-4" />,
      description: 'Search for information',
      action: () => {
        handleQuickAction('What would you like me to search for or help you find?')
      }
    },
    {
      id: 'schedule',
      label: 'Schedule',
      icon: <Calendar className="h-4 w-4" />,
      description: 'Schedule tasks or events',
      action: () => {
        handleQuickAction('I can help you schedule tasks, set reminders, or organize your calendar. What would you like to schedule?')
      }
    },
    {
      id: 'enhance',
      label: 'Enhance',
      icon: <Sparkles className="h-4 w-4" />,
      description: 'Improve or enhance content',
      action: () => {
        handleQuickAction('I can help enhance your content, improve writing, or suggest improvements. What would you like me to enhance?')
      }
    },
    {
      id: 'brainstorm',
      label: 'Brainstorm',
      icon: <Zap className="h-4 w-4" />,
      description: 'Generate ideas and solutions',
      action: () => {
        handleQuickAction('Let\'s brainstorm! What topic, problem, or project would you like to generate ideas for?')
      }
    }
  ]

  const handleQuickAction = (message: string) => {
    setInput(message)
    setShowQuickActions(false)
    setIsOpen(true)
    setTimeout(() => {
      inputRef.current?.focus()
    }, 100)
  }

  const startRecording = async () => {
    if (!voiceSettings.speechToText) {
      toast.error('Speech-to-text is disabled in settings')
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: voiceSettings.echoCancellation,
          noiseSuppression: voiceSettings.noiseReduction,
          autoGainControl: true,
          sampleRate: 16000
        } 
      })
      
      const recorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      })
      
      const chunks: Blob[] = []
      
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data)
        }
      }
      
      recorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' })
        await processAudioTranscription(audioBlob)
        
        // Clean up
        stream.getTracks().forEach(track => track.stop())
        // setAudioChunks([])
        if (recordingInterval) {
          clearInterval(recordingInterval)
          setRecordingInterval(null)
        }
        setRecordingTime(0)
      }
      
      recorder.start()
      setMediaRecorder(recorder)
      setIsRecording(true)
      // setAudioChunks(chunks)
      
      // Start recording timer
      const interval = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
      setRecordingInterval(interval)
      
      toast.success('Recording started')
    } catch (error) {
      console.error('Error starting recording:', error)
      toast.error('Failed to start recording. Please check microphone permissions.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop()
      setIsRecording(false)
      toast.info('Processing recording...')
    }
  }

  const processAudioTranscription = async (audioBlob: Blob) => {
    setIsProcessing(true)
    
    try {
      const formData = new FormData()
      formData.append('audio', audioBlob, 'recording.webm')
      formData.append('language', voiceSettings.language.split('-')[0]) // Extract language code
      formData.append('prompt', 'This is a conversation with Oracle AI assistant.')
      
      const response = await fetch('/api/ai/voice/stt', {
        method: 'POST',
        body: formData
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (data.text && data.text.trim()) {
        setInput(data.text.trim())
        toast.success('Speech transcribed successfully')
        
        // Auto-send if enabled
        if (voiceSettings.autoPlayResponses) {
          setTimeout(() => {
            handleSendMessage(data.text.trim())
          }, 500)
        }
      } else {
        toast.warning('No speech detected')
      }
    } catch (error) {
      console.error('Error processing audio:', error)
      toast.error('Failed to process audio. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleSendMessage = async (messageText?: string) => {
    const text = messageText || input.trim()
    if (!text) return

    const userMessage: Message = {
      role: 'user',
      content: text,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content
          }))
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.content,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMessage])

      // Generate TTS if enabled
      if (voiceSettings.textToSpeech && voiceSettings.autoPlayResponses) {
        generateSpeech(data.content)
      }
    } catch (error) {
      console.error('Error sending message:', error)
      toast.error('Failed to send message. Please try again.')
    }
  }

  const generateSpeech = async (text: string) => {
    if (!voiceSettings.textToSpeech) return

    try {
      const response = await fetch('/api/ai/voice/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text,
          voice: voiceSettings.voiceModel,
          speed: voiceSettings.speechRate,
          response_format: voiceSettings.responseFormat
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const audioBlob = await response.blob()
      const audioUrl = URL.createObjectURL(audioBlob)
      
      const audio = new Audio(audioUrl)
      audio.volume = voiceSettings.speechVolume
      
      audio.onplay = () => setIsPlaying(true)
      audio.onended = () => {
        setIsPlaying(false)
        URL.revokeObjectURL(audioUrl)
      }
      audio.onerror = () => {
        setIsPlaying(false)
        URL.revokeObjectURL(audioUrl)
        toast.error('Failed to play audio')
      }
      
      setCurrentAudio(audio)
      audio.play()
    } catch (error) {
      console.error('Error generating speech:', error)
      toast.error('Failed to generate speech')
    }
  }

  const stopAudio = () => {
    if (currentAudio) {
      currentAudio.pause()
      currentAudio.currentTime = 0
      setIsPlaying(false)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const gradientStyle = {
    background: appearanceSettings.gradientDirection === 'linear' 
      ? `linear-gradient(135deg, ${appearanceSettings.primaryColor} 0%, ${appearanceSettings.secondaryColor} 100%)`
      : appearanceSettings.gradientDirection === 'radial'
      ? `radial-gradient(circle, ${appearanceSettings.primaryColor} 0%, ${appearanceSettings.secondaryColor} 100%)`
      : `conic-gradient(from 0deg, ${appearanceSettings.primaryColor} 0%, ${appearanceSettings.secondaryColor} 100%)`
  }

  return (
    <>
      <style jsx>{`
        @keyframes voiceBar1 {
          0%, 100% { 
            height: 20%; 
            opacity: 0.7;
            transform: scaleY(0.9);
          }
          50% { 
            height: 60%; 
            opacity: 1;
            transform: scaleY(1.1);
          }
        }
        
        @keyframes voiceBar2 {
          0%, 100% { 
            height: 25%; 
            opacity: 0.6;
            transform: scaleY(0.8);
          }
          50% { 
            height: 65%; 
            opacity: 1;
            transform: scaleY(1.2);
          }
        }
        
        @keyframes voiceBar3 {
          0%, 100% { 
            height: 15%; 
            opacity: 0.8;
            transform: scaleY(1.0);
          }
          50% { 
            height: 55%; 
            opacity: 1;
            transform: scaleY(1.0);
          }
        }
        
        @keyframes voiceBar4 {
          0%, 100% { 
            height: 30%; 
            opacity: 0.7;
            transform: scaleY(0.9);
          }
          50% { 
            height: 70%; 
            opacity: 1;
            transform: scaleY(1.1);
          }
        }
        
        @keyframes voiceBar5 {
          0%, 100% { 
            height: 22%; 
            opacity: 0.6;
            transform: scaleY(0.8);
          }
          50% { 
            height: 58%; 
            opacity: 1;
            transform: scaleY(1.0);
          }
        }

        @keyframes equalizerGlow {
          0%, 100% { 
            box-shadow: 0 0 5px rgba(255, 255, 255, 0.3);
          }
          50% { 
            box-shadow: 0 0 15px rgba(255, 255, 255, 0.6);
          }
        }

        @keyframes voicePulse {
          0%, 100% { 
            transform: scaleY(0.8);
            opacity: 0.7;
          }
          50% { 
            transform: scaleY(1.2);
            opacity: 1;
          }
        }

        @keyframes blobMorph {
          0%, 100% { 
            border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
          }
          25% { 
            border-radius: 60% 40% 60% 40% / 70% 50% 50% 70%;
          }
          50% { 
            border-radius: 40% 60% 40% 60% / 50% 70% 70% 50%;
          }
          75% { 
            border-radius: 50% 50% 60% 40% / 40% 70% 60% 50%;
          }
        }

        @keyframes blobFloat {
          0%, 100% { 
            transform: translateY(0px) rotate(0deg);
          }
          50% { 
            transform: translateY(-${appearanceSettings.floatingRange}px) rotate(180deg);
          }
        }

        @keyframes blobPulse {
          0%, 100% { 
            transform: scale(1);
            filter: brightness(1);
          }
          50% { 
            transform: scale(1.05);
            filter: brightness(1.1);
          }
        }

        .equalizer-bar {
          background: linear-gradient(to top, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.4));
          border-radius: 1px;
          transform-origin: bottom;
          box-shadow: 0 0 3px rgba(255, 255, 255, 0.3);
        }

        .oracle-blob {
          animation: 
            ${appearanceSettings.idleAnimation ? `blobMorph ${appearanceSettings.morphingSpeed}s ease-in-out infinite` : 'none'},
            ${appearanceSettings.floatingAnimation ? `blobFloat ${appearanceSettings.floatingSpeed * 2}s ease-in-out infinite` : 'none'},
            ${appearanceSettings.pulseEffect ? `blobPulse ${appearanceSettings.pulseIntensity / 10}s ease-in-out infinite` : 'none'};
          filter: ${appearanceSettings.glowEffect ? `drop-shadow(0 0 ${appearanceSettings.glowIntensity}px ${appearanceSettings.primaryColor}40)` : 'none'};
        }
      `}</style>

      {/* Oracle Blob */}
      <div className="fixed bottom-8 right-8 z-40">
        <div className="relative">
          {/* Quick Actions Menu */}
          {showQuickActions && (
            <div className="absolute bottom-full right-0 mb-4 bg-background/95 backdrop-blur-sm border rounded-xl shadow-2xl p-4 w-64">
              <div className="space-y-2">
                <h3 className="font-semibold text-sm text-muted-foreground mb-3">Quick Actions</h3>
                {quickActions.map((action) => (
                  <button
                    key={action.id}
                    onClick={action.action}
                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors text-left"
                  >
                    <div className="text-primary">{action.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{action.label}</div>
                      <div className="text-xs text-muted-foreground truncate">{action.description}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Main Oracle Blob */}
          <div className="relative group">
            <div
              className={cn(
                "oracle-blob relative cursor-pointer transition-all duration-300 group-hover:scale-110",
                "shadow-lg hover:shadow-xl"
              )}
              style={{
                width: `${appearanceSettings.blobSize}px`,
                height: `${appearanceSettings.blobSize}px`,
                ...gradientStyle,
                borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%'
              }}
              onClick={() => setIsOpen(!isOpen)}
              onContextMenu={(e) => {
                e.preventDefault()
                setShowQuickActions(!showQuickActions)
              }}
            >
              {/* Enhanced Voice Visualization Bars */}
              {appearanceSettings.voiceVisualization && (
                <div 
                  className="absolute inset-0 flex items-center justify-center equalizer-container overflow-hidden" 
                  style={{ 
                    gap: `${appearanceSettings.voiceBarsSpacing}px`,
                    borderRadius: 'inherit'
                  }}
                >
                  {Array.from({ length: appearanceSettings.voiceBarsCount }).map((_, i) => {
                    const animationVariants = ['voiceBar1', 'voiceBar2', 'voiceBar3', 'voiceBar4', 'voiceBar5'];
                    const animationName = animationVariants[i % animationVariants.length];
                    const baseHeight = Math.min(appearanceSettings.voiceBarsHeight * voiceBarHeights[i % voiceBarHeights.length], 35);
                    
                    return (
                      <div
                        key={i}
                        className={cn(
                          "equalizer-bar",
                          (isRecording || isPlaying) && "animate-pulse"
                        )}
                        style={{
                          width: '2px',
                          height: `${baseHeight}%`,
                          minHeight: '6px',
                          maxHeight: '60%',
                          animation: `
                            ${animationName} ${600 + i * 80}ms ease-in-out infinite alternate,
                            equalizerGlow ${1200 + i * 100}ms ease-in-out infinite
                          `,
                          animationDelay: `${i * 60}ms`,
                          opacity: 0.8 + (i % 3) * 0.1,
                          transform: 'scaleY(1)',
                          transformOrigin: 'bottom'
                        }}
                      />
                    );
                  })}
                </div>
              )}
              
              {/* Status Indicators */}
              <div className="absolute -top-2 -right-2 flex gap-1">
                {isRecording && (
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-lg" />
                )}
                {isPlaying && (
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-lg" />
                )}
                {isProcessing && (
                  <div className="w-3 h-3 bg-yellow-500 rounded-full animate-spin shadow-lg" />
                )}
              </div>
              
              {/* Hover overlay */}
              <div 
                className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{
                  borderRadius: 'inherit'
                }}
              />
              
              {/* Inner highlight */}
              <div 
                className="absolute inset-1 bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-60"
                style={{
                  borderRadius: 'inherit'
                }}
              />
            </div>

            {/* Floating Action Buttons */}
            <div className="absolute -bottom-2 -left-2 flex gap-2">
              <Button
                size="sm"
                variant="secondary"
                className="w-8 h-8 rounded-full shadow-lg"
                onClick={(e) => {
                  e.stopPropagation()
                  window.location.href = '/settings/oracle'
                }}
              >
                <Settings className="h-3 w-3" />
              </Button>
              
              {voiceSettings.speechToText && (
                <Button
                  size="sm"
                  variant={isRecording ? "destructive" : "secondary"}
                  className="w-8 h-8 rounded-full shadow-lg"
                  onClick={(e) => {
                    e.stopPropagation()
                    isRecording ? stopRecording() : startRecording()
                  }}
                  disabled={isProcessing}
                >
                  {isRecording ? <Square className="h-3 w-3" /> : <Mic className="h-3 w-3" />}
                </Button>
              )}
              
              {isPlaying && (
                <Button
                  size="sm"
                  variant="secondary"
                  className="w-8 h-8 rounded-full shadow-lg"
                  onClick={(e) => {
                    e.stopPropagation()
                    stopAudio()
                  }}
                >
                  <Pause className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recording Status */}
      {isRecording && (
        <div className="fixed bottom-8 right-32 z-50 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            <span className="text-sm font-medium">Recording {formatTime(recordingTime)}</span>
          </div>
        </div>
      )}

      {/* Chat Interface */}
      {isOpen && (
        <div className="fixed bottom-8 right-8 z-50 mb-28">
          <div className="bg-background/95 backdrop-blur-sm border rounded-2xl shadow-2xl w-96 h-[500px] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-500/10 to-purple-500/10">
              <div className="flex items-center gap-3">
                <div 
                  className="w-8 h-8 relative"
                  style={{ 
                    background: `linear-gradient(135deg, #1e40af 0%, #3b82f6 25%, #6366f1 50%, #8b5cf6 75%, #a855f7 100%)`,
                    borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
                    boxShadow: `0 2px 8px rgba(59, 130, 246, 0.3)`
                  }}
                >
                  {/* Mini equalizer in header */}
                  <div className="absolute inset-0 flex items-center justify-center gap-0.5">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div
                        key={i}
                        className="bg-white/70 rounded-full"
                        style={{
                          width: '1px',
                          height: `${20 + i * 5}%`,
                          animation: `voicePulse ${400 + i * 50}ms ease-in-out infinite alternate`,
                          animationDelay: `${i * 100}ms`
                        }}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-sm">Oracle AI</h3>
                  <p className="text-xs text-muted-foreground">
                    {isRecording ? 'Listening...' : isProcessing ? 'Processing...' : isPlaying ? 'Speaking...' : 'Ready'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {voiceSettings.textToSpeech && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="h-8 w-8"
                  >
                    {voiceSettings.textToSpeech ? <Volume2 className="h-3 w-3" /> : <VolumeX className="h-3 w-3" />}
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsOpen(false)}
                  className="h-8 w-8"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-sm">Start a conversation with Oracle AI</p>
                  <p className="text-xs mt-2">Try voice input or type your message</p>
                </div>
              ) : (
                messages.map((message, index) => (
                  <div
                    key={index}
                    className={cn(
                      "flex gap-3 max-w-[80%]",
                      message.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
                    )}
                  >
                    <div
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium",
                        message.role === 'user' 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-gradient-to-br from-blue-500 to-purple-500 text-white'
                      )}
                    >
                      {message.role === 'user' ? 'U' : 'O'}
                    </div>
                    <div
                      className={cn(
                        "rounded-2xl px-4 py-2 text-sm",
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      )}
                    >
                      <p>{message.content}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t p-4">
              <div className="flex gap-2">
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={isRecording ? 'Recording...' : 'Type your message...'}
                  className="flex-1"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSendMessage()
                    }
                  }}
                  disabled={isRecording || isProcessing}
                />
                
                {voiceSettings.speechToText && (
                  <Button
                    size="sm"
                    variant={isRecording ? "destructive" : "outline"}
                    onClick={isRecording ? stopRecording : startRecording}
                    disabled={isProcessing}
                    className="px-3"
                  >
                    {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  </Button>
                )}
                
                <Button
                  size="sm"
                  onClick={() => handleSendMessage()}
                  disabled={!input.trim() || isProcessing}
                  className="px-3"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              
              {isProcessing && (
                <div className="mt-2 text-xs text-muted-foreground flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                  Processing audio...
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}    