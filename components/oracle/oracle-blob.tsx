// Sentry removed
'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { 
  Mic, 
  MicOff, 
  Send, 
  Settings, 
  VolumeX, 
  MessageCircle,
  Sparkles,
  HelpCircle,
  Search,
  Calendar,
  Zap,
  Lightbulb,
  X
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { getOracleSetting } from '@/lib/user-settings-service'
import { useOracle } from '@/components/providers/OracleProvider'

// Oracle Appearance Settings Interface
interface OracleAppearanceSettings {
  primaryColor: string
  secondaryColor: string
  gradientDirection: 'linear' | 'radial' | 'conic'
  blobSize: number
  voiceVisualization: boolean
  voiceBarsCount: number
  voiceBarsHeight: number
  voiceBarsSpacing: number
  voiceBarsReactivity: number
  idleAnimation: boolean
  pulseEffect: boolean
  glowEffect: boolean
  glowIntensity: number
  floatingAnimation: boolean
  floatingSpeed: number
  rotationSpeed: number
  morphingSpeed: number
  themeIntegration: boolean
}

interface OracleVoiceSettings {
  enabled: boolean
  wakeWord: string
  language: string
  voiceId: string
  volume: number
  speed: number
  pitch: number
  autoListen: boolean
  voiceActivation: boolean
  noiseReduction: boolean
  echoCancel: boolean
  autoGainControl: boolean
  continuousListening: boolean
  wakeWordSensitivity: number
  voiceTimeout: number
  responseDelay: number
}

interface Message {
  id: string
  text: string
  isUser: boolean
  timestamp: Date
}

const defaultAppearanceSettings: OracleAppearanceSettings = {
  primaryColor: '#3B82F6',
  secondaryColor: '#8B5CF6',
  gradientDirection: 'linear',
  blobSize: 60,
  voiceVisualization: true,
  voiceBarsCount: 6,
  voiceBarsHeight: 0.3,
  voiceBarsSpacing: 3,
  voiceBarsReactivity: 0.8,
  idleAnimation: true,
  pulseEffect: true,
  glowEffect: true,
  glowIntensity: 0.5,
  floatingAnimation: true,
  floatingSpeed: 2,
  rotationSpeed: 20,
  morphingSpeed: 3,
  themeIntegration: false
}

const defaultVoiceSettings: OracleVoiceSettings = {
  enabled: true,
  wakeWord: 'Oracle',
  language: 'en',
  voiceId: 'alloy',
  volume: 0.8,
  speed: 1.0,
  pitch: 1.0,
  autoListen: true,
  voiceActivation: true,
  noiseReduction: true,
  echoCancel: true,
  autoGainControl: true,
  continuousListening: true,
  wakeWordSensitivity: 0.7,
  voiceTimeout: 30000,
  responseDelay: 500
}

export default function OracleBlob() {
  // All hooks must be called unconditionally at the top
  const { settings: oracleGlobalSettings, isLoading: oracleLoading } = useOracle()
  const router = useRouter()

  const [isOpen, setIsOpen] = useState(false)
  const [showQuickActions, setShowQuickActions] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputText, setInputText] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [appearanceSettings, setAppearanceSettings] = useState<OracleAppearanceSettings>(defaultAppearanceSettings)
  const [voiceSettings, setVoiceSettings] = useState<OracleVoiceSettings>(defaultVoiceSettings)
  const [isWakeWordListening, setIsWakeWordListening] = useState(false)
  const [wakeWordDetected, setWakeWordDetected] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [isClicked, setIsClicked] = useState(false)
  const [hasUserInteracted, setHasUserInteracted] = useState(false)
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null)
  const currentAudioRef = useRef<HTMLAudioElement | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const wakeWordRecorderRef = useRef<MediaRecorder | null>(null)
  const wakeWordChunksRef = useRef<Blob[]>([])

  // Predefined heights for voice bars to avoid hydration issues
  const voiceBarHeights = [0.4, 0.7, 0.3, 0.9, 0.6, 0.8, 0.5, 0.4, 0.9, 0.7, 0.6, 0.8, 0.5, 0.3, 0.7]
  
  // Wake word detection functionality - defined early to be available for useEffect hooks
  const startWakeWordListening = async () => {
    try {
      console.log('🎯 Starting wake word listening...')
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: voiceSettings.echoCancel,
          noiseSuppression: voiceSettings.noiseReduction,
          autoGainControl: voiceSettings.autoGainControl,
          sampleRate: 16000,
          channelCount: 1
        } 
      })
      
      console.log('🎤 Microphone stream acquired for wake word detection')
      
      // Check if MediaRecorder supports the format
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
      
      console.log('🔧 Using MIME type:', mimeType)
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: mimeType,
        audioBitsPerSecond: 16000
      })
      
      wakeWordRecorderRef.current = mediaRecorder
      wakeWordChunksRef.current = []
      
      let isProcessingChunk = false
      
      mediaRecorder.ondataavailable = (event) => {
        console.log('📊 Wake word audio chunk received:', event.data.size, 'bytes')
        if (event.data.size > 0) {
          wakeWordChunksRef.current.push(event.data)
        }
      }
      
      mediaRecorder.onstop = async () => {
        console.log('⏹️ Wake word recorder stopped')
        
        if (isProcessingChunk) {
          console.log('⚠️ Already processing chunk, skipping...')
          return
        }
        
        isProcessingChunk = true
        
        try {
          const audioBlob = new Blob(wakeWordChunksRef.current, { type: mimeType })
          console.log('🎵 Processing wake word audio blob:', audioBlob.size, 'bytes')
          
          if (audioBlob.size > 0) {
            await processWakeWordAudio(audioBlob)
          }
          
          // Continue listening if wake word not detected and still in listening mode
          if (isWakeWordListening && !wakeWordDetected && !isRecording) {
            console.log('🔄 Continuing wake word listening...')
            setTimeout(() => {
              if (isWakeWordListening && !wakeWordDetected && !isRecording) {
                startWakeWordListening()
              }
            }, 100)
          }
        } catch (error) {
          console.error('❌ Error in wake word onstop handler:', error)
          } finally {
          isProcessingChunk = false
        }
      }
      
      mediaRecorder.onerror = (event) => {
        console.error('❌ Wake word MediaRecorder error:', event)
        setIsWakeWordListening(false)
      }
      
      // Record in 3-second chunks for better wake word detection
      mediaRecorder.start()
      console.log('🎬 Wake word recording started')
      
      setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
          console.log('⏱️ Stopping wake word chunk after 3 seconds')
          mediaRecorder.stop()
        }
      }, 3000)
      
    } catch (error) {
      console.error('❌ Error starting wake word listening:', error)
      setIsWakeWordListening(false)
      
      // Show user-friendly error
      if (error instanceof Error && error.name === 'NotAllowedError') {
        toast.error('Microphone permission denied. Please allow microphone access for wake word detection.')
      } else if (error instanceof Error && error.name === 'NotFoundError') {
        toast.error('No microphone found. Please connect a microphone for wake word detection.')
      } else {
        toast.error('Failed to start wake word listening. Please check your microphone.')
      }
    }
  }

  const processWakeWordAudio = async (audioBlob: Blob) => {
    try {
      console.log('🔍 Processing wake word audio:', audioBlob.size, 'bytes')
      
      await (async (span) => {
          // Create a proper File object instead of just appending a Blob
          const audioFile = new File([audioBlob], 'wakeword.webm', {
            type: audioBlob.type || 'audio/webm'
          })
          
          const formData = new FormData()
          formData.append('audio', audioFile)
          formData.append('language', voiceSettings.language)
          formData.append('prompt', 'Oracle, wake word, voice assistant, hey Oracle, Oracle AI')
          
          console.log('📤 Sending wake word audio to STT API...', {
            fileName: audioFile.name,
            fileSize: audioFile.size,
            fileType: audioFile.type
          })
          
          const response = await fetch('/api/ai/voice/stt', {
            method: 'POST',
            body: formData
          })
          
          console.log('📥 STT API response status:', response.status)
          
          if (response.ok) {
            const data = await response.json()
            console.log('📝 STT transcription:', data.transcription)
            
            if (data.transcription) {
              const transcription = data.transcription.toLowerCase().trim()
              console.log('🔍 Checking transcription for wake word:', transcription)
                
              // Simplified and more reliable wake word detection
              const wakeWords = [
                'oracle', 'orical', 'oracles', 'oracle.', 'oracle,',
                'hey oracle', 'oracle ai', 'oracle assistant', 'hi oracle',
                'ok oracle', 'oracle please', 'oracle help'
              ]
              
              let detected = false
              
              // Method 1: Direct word boundary matching (most reliable)
              const oracleWordMatch = /\b(oracle|orical|oracles)\b/i.test(transcription)
              
              // Method 2: Check for phrase patterns
              const phraseMatch = wakeWords.some(phrase => {
                if (phrase.includes(' ')) {
                  return transcription.includes(phrase.toLowerCase())
                }
                const wordRegex = new RegExp(`\\b${phrase.toLowerCase()}\\b`, 'i')
                return wordRegex.test(transcription)
              })
              
              // Method 3: Starts with oracle (high priority)
              const startsWithOracle = transcription.startsWith('oracle') || 
                                     transcription.startsWith('hey oracle') || 
                                     transcription.startsWith('hi oracle')
              
              detected = oracleWordMatch || phraseMatch || startsWithOracle
              
              console.log('🔍 Wake word detection results:', {
                transcription,
                oracleWordMatch,
                phraseMatch,
                startsWithOracle,
                detected
              })
              
              if (detected) {
                console.log('🎯 Wake word detected!')
                setWakeWordDetected(true)
                setIsWakeWordListening(false)
                
                // Open chat interface
                setIsOpen(true)
                
                // Stop current wake word recorder
                if (wakeWordRecorderRef.current) {
                  wakeWordRecorderRef.current.stop()
                }
                
                // Provide feedback
                toast.success('Wake word detected! Chat is ready.')
                
                // Optional: Play a sound or provide other feedback
                try {
                  // Create a short beep sound
                  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
                  const oscillator = audioContext.createOscillator()
                  const gainNode = audioContext.createGain()
                  
                  oscillator.connect(gainNode)
                  gainNode.connect(audioContext.destination)
                  
                  oscillator.frequency.value = 800
                  gainNode.gain.value = 0.1
                  
                  oscillator.start()
                  oscillator.stop(audioContext.currentTime + 0.1)
                } catch (beepError) {
                  console.log('Could not play wake word sound:', beepError)
                }
              }
            }
          } else {
            // Handle API errors gracefully for wake word detection
            const errorData = await response.text()
            
            // Parse error data to check if Oracle is disabled
            let parsedError = null
            try {
              parsedError = JSON.parse(errorData)
            } catch (e) {
              // Error data is not JSON, treat as regular error
            }
            
            // Handle Oracle disabled status gracefully for wake word
            if (response.status === 403 && parsedError?.code === 'ORACLE_DISABLED') {
              console.warn('⚠️ Oracle is disabled - Wake word STT API blocked')
              // Don't show error toast for wake word when Oracle is disabled
              // Just silently stop wake word listening
              setIsWakeWordListening(false)
              return
            }
            
            console.error('❌ Wake word STT API error:', response.status, errorData)
            
            // Don't show error toasts for wake word detection failures
            // Just log them and continue)
          }
        }
      )
    } catch (error) {
      console.error('❌ Error processing wake word audio:', error)
      // Don't show error toasts for wake word processing failures
      // Just log them and continue
    }
  }

  const stopWakeWordListening = () => {
    console.log('🛑 Stopping wake word listening')
    setIsWakeWordListening(false)
    
    if (wakeWordRecorderRef.current) {
      const recorder = wakeWordRecorderRef.current
      if (recorder.state === 'recording') {
        console.log('⏹️ Stopping active wake word recorder')
        recorder.stop()
      }
      
      // Stop all tracks to release microphone
      if (recorder.stream) {
        recorder.stream.getTracks().forEach(track => {
          console.log('🔇 Stopping microphone track')
          track.stop()
        })
      }
    }
  }

  // Detect user interaction to enable audio
  useEffect(() => {
    const enableAudio = () => {
      setHasUserInteracted(true)
      console.log('✅ User interaction detected - audio enabled')
    }
    
    if (!hasUserInteracted) {
      document.addEventListener('click', enableAudio, { once: true })
      document.addEventListener('keydown', enableAudio, { once: true })
      document.addEventListener('touchstart', enableAudio, { once: true })
    }
    
    return () => {
      document.removeEventListener('click', enableAudio)
      document.removeEventListener('keydown', enableAudio)
      document.removeEventListener('touchstart', enableAudio)
    }
  }, [hasUserInteracted])

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
          
          const normalizedAppearance = normalizeSettings(remoteAppearance as Record<string, unknown> || {})
          setAppearanceSettings(normalizedAppearance)
          setVoiceSettings(remoteVoice as unknown as OracleVoiceSettings || defaultVoiceSettings)
          
          console.log('✅ Oracle settings loaded from Supabase')
        } catch (error) {
          console.error('Failed to load Oracle settings:', error)
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
          
          const normalizedAppearance = normalizeSettings(remoteAppearance as Record<string, unknown> || {})
          setAppearanceSettings(normalizedAppearance)
          setVoiceSettings(remoteVoice as unknown as OracleVoiceSettings || defaultVoiceSettings)
        } catch (error) {
          console.error('Error loading updated settings:', error)
          setAppearanceSettings(defaultAppearanceSettings)
          setVoiceSettings(defaultVoiceSettings)
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

  // Recording timer
  useEffect(() => {
    if (isRecording) {
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
    } else {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current)
      }
      setRecordingTime(0)
    }

    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current)
      }
    }
  }, [isRecording])

  // Auto-start wake word listening when voice activation is enabled
  useEffect(() => {
    console.log('🔄 Wake word useEffect triggered:', {
      voiceActivation: voiceSettings.voiceActivation,
      isWakeWordListening,
      wakeWordDetected,
      isRecording,
      isOpen
    })
    
    // Start wake word listening if conditions are met
    if (voiceSettings.voiceActivation && 
        !isWakeWordListening && 
        !wakeWordDetected && 
        !isRecording) {
      
      console.log('✅ Starting wake word listening due to settings change')
      setIsWakeWordListening(true)
      
      // Small delay to ensure state is updated
      setTimeout(() => {
        startWakeWordListening()
      }, 100)
    } 
    // Stop wake word listening if voice activation is disabled
    else if (!voiceSettings.voiceActivation && isWakeWordListening) {
      console.log('🛑 Stopping wake word listening due to settings change')
      stopWakeWordListening()
    }
    // Stop wake word listening if recording
    else if (isWakeWordListening && isRecording) {
      console.log('⏸️ Pausing wake word listening (recording active)')
      stopWakeWordListening()
    }

    return () => {
      // Cleanup on unmount or dependency change
      if (isWakeWordListening) {
        console.log('🧹 Cleanup: Stopping wake word listening')
        stopWakeWordListening()
      }
    }
  }, [voiceSettings.voiceActivation, isWakeWordListening, wakeWordDetected, isRecording])

  // Additional effect to handle wake word detection reset
  useEffect(() => {
    if (wakeWordDetected) {
      console.log('🎯 Wake word detected, setting up reset timer')
      
      const resetTimer = setTimeout(() => {
        console.log('⏰ Resetting wake word detection after timeout')
        setWakeWordDetected(false)
        
        // Restart listening if voice activation is still enabled and not busy
        if (voiceSettings.voiceActivation && !isRecording) {
          console.log('🔄 Restarting wake word listening after reset')
          setTimeout(() => {
            setIsWakeWordListening(true)
          }, 500)
        }
      }, 30000)
      
      return () => {
        console.log('🧹 Clearing wake word reset timer')
        clearTimeout(resetTimer)
      }
    }
  }, [wakeWordDetected, voiceSettings.voiceActivation, isRecording])

  // Effect to handle page visibility changes (pause/resume when tab is hidden/shown)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log('👁️ Page hidden, pausing wake word listening')
        if (isWakeWordListening) {
          stopWakeWordListening()
        }
      } else {
        console.log('👁️ Page visible, resuming wake word listening if needed')
        if (voiceSettings.voiceActivation && !isWakeWordListening && !wakeWordDetected && !isRecording) {
          setTimeout(() => {
            setIsWakeWordListening(true)
          }, 1000)
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [voiceSettings.voiceActivation, isWakeWordListening, wakeWordDetected, isRecording])

  // Check Oracle global state AFTER all hooks are called
  if (oracleLoading) {
    return null // Don't show blob while loading Oracle settings
  }
  
  if (!oracleGlobalSettings.enabled) {
    console.log('🚫 Oracle is disabled, hiding Oracle blob')
    return null
  }

  const quickActions = [
    {
      id: 'summarize',
      label: 'Summarize',
      icon: <Sparkles className="h-4 w-4" />,
      description: 'Summarize the current page or selected text',
      action: () => {} // handleQuickAction('Please summarize the current page content or any selected text. Focus on the key points and main ideas.')
    },
    {
      id: 'explain',
      label: 'Explain',
      icon: <HelpCircle className="h-4 w-4" />,
      description: 'Explain complex concepts in simple terms',
      action: () => {} // handleQuickAction('Please explain any complex concepts on this page in simple, easy-to-understand terms. Break down technical jargon and provide clear examples.')
    },
    {
      id: 'search',
      label: 'Search',
      icon: <Search className="h-4 w-4" />,
      description: 'Help with intelligent search queries',
      action: () => {} // handleQuickAction('I need help with searching for information. Please assist me in formulating effective search queries or finding specific information.')
    },
    {
      id: 'schedule',
      label: 'Schedule',
      icon: <Calendar className="h-4 w-4" />,
      description: 'Assist with scheduling and time management',
      action: () => {} // handleQuickAction('Help me with scheduling tasks, managing my time, or organizing my calendar. What would you like to schedule or organize?')
    },
    {
      id: 'enhance',
      label: 'Enhance',
      icon: <Zap className="h-4 w-4" />,
      description: 'Improve and enhance content',
      action: () => {} // handleQuickAction('Please help me improve and enhance content. This could include writing, editing, formatting, or making suggestions for better presentation.')
    },
    {
      id: 'brainstorm',
      label: 'Brainstorm',
      icon: <Lightbulb className="h-4 w-4" />,
      description: 'Generate ideas and creative solutions',
      action: () => {} // handleQuickAction('Let\'s brainstorm! Help me generate creative ideas, solutions, or approaches for any challenge or project I\'m working on.')
    }
  ]

  const startRecording = async () => {
    try {
      console.log('🎤 Starting main recording...')
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
            audio: {
              echoCancellation: voiceSettings.echoCancel,
              noiseSuppression: voiceSettings.noiseReduction,
              autoGainControl: voiceSettings.autoGainControl,
              sampleRate: 16000,
              channelCount: 1
            } 
          })
          
          // Check supported MIME types
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
          
          console.log('🔧 Using MIME type for recording:', mimeType)
          
          const mediaRecorder = new MediaRecorder(stream, {
            mimeType: mimeType,
            audioBitsPerSecond: 16000
          })
          
          mediaRecorderRef.current = mediaRecorder
          audioChunksRef.current = []
          
          mediaRecorder.ondataavailable = (event) => {
            console.log('📊 Audio chunk received:', event.data.size, 'bytes')
            if (event.data.size > 0) {
              audioChunksRef.current.push(event.data)
            }
          }
          
          mediaRecorder.onstop = () => {
            console.log('⏹️ Main recording stopped')
            const audioBlob = new Blob(audioChunksRef.current, { type: mimeType })
            console.log('🎵 Processing main audio blob:', audioBlob.size, 'bytes')
            processAudio(audioBlob)
            
            // Stop all tracks to release microphone
            stream.getTracks().forEach(track => track.stop())
          }
          
          mediaRecorder.onerror = (event) => {
            console.error('❌ Main MediaRecorder error:', event)
          }
          
          mediaRecorder.start()
          setIsRecording(true)
          setRecordingTime(0)
          
          console.log('🎬 Main recording started')
          
          // Start recording timer
          recordingTimerRef.current = setInterval(() => {
            setRecordingTime(prev => prev + 1)
          }, 1000)
          
          // Auto-stop after timeout
          setTimeout(() => {
            if (mediaRecorder.state === 'recording') {
              console.log('⏰ Auto-stopping recording due to timeout')
              stopRecording()
            }
          }, voiceSettings.voiceTimeout)
          
    } catch (error) {
      console.error('❌ Error starting recording:', error)
      // Show user-friendly error
      if (error instanceof Error && error.name === 'NotAllowedError') {
        toast.error('Microphone permission denied. Please allow microphone access.')
      } else if (error instanceof Error && error.name === 'NotFoundError') {
        toast.error('No microphone found. Please connect a microphone.')
      } else {
        toast.error('Failed to start recording. Please check your microphone.')
      }
      
      setIsRecording(false)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      setIsProcessing(true)
      toast.info('Processing audio...')
    }
  }

  const processAudio = async (audioBlob: Blob) => {
    try {
      console.log('🔄 Processing main audio:', audioBlob.size, 'bytes')
      setIsProcessing(true)
      
      await (async (span) => {
          // Create a proper File object instead of just appending a Blob
          const audioFile = new File([audioBlob], 'recording.webm', {
            type: audioBlob.type || 'audio/webm'
          })
          
          const formData = new FormData()
          formData.append('audio', audioFile)
          formData.append('language', voiceSettings.language)
          
          console.log('📤 Sending main audio to STT API...', {
            fileName: audioFile.name,
            fileSize: audioFile.size,
            fileType: audioFile.type
          })
          
          const response = await fetch('/api/ai/voice/stt', {
            method: 'POST',
            body: formData
          })
          
          console.log('📥 Main STT API response status:', response.status)
          
          if (response.ok) {
            const data = await response.json()
            console.log('📝 Main STT transcription:', data.transcription)
            
            if (data.transcription) {
              await sendMessage(data.transcription)
            } else {
              toast.error('No speech detected. Please try again.')
            }
                      } else {
              const errorData = await response.text()
            
            // Parse error data to check if Oracle is disabled
            let parsedError = null
            try {
              parsedError = JSON.parse(errorData)
            } catch (e) {
              // Error data is not JSON, treat as regular error
            }
            
            // Handle Oracle disabled status gracefully
            if (response.status === 403 && parsedError?.code === 'ORACLE_DISABLED') {
              console.warn('⚠️ Oracle is disabled - STT API blocked to prevent charges')
              toast.info('Oracle is currently disabled. Enable Oracle in Settings to use voice features.')
              return // Exit gracefully without throwing error
            }
            
            // For other errors, log as error and capture in Sentry
              console.error('❌ Main STT API error:', response.status, errorData)
              
              // More specific error messages
              if (response.status === 401) {
                toast.error('Authentication required. Please log in.')
              } else if (response.status === 402) {
                toast.error('Insufficient credits. Please upgrade your plan.')
              } else if (response.status === 413) {
                toast.error('Audio file too large. Please record a shorter message.')
              } else if (response.status === 429) {
                toast.error('Rate limit exceeded. Please wait a moment and try again.')
              } else {
                toast.error('Failed to process audio. Please try again.')
              }
            }
        }
      )
    } catch (error) {
      console.error('❌ Error processing audio:', error)
      toast.error('Error processing audio. Please try again.')
    } finally {
      setIsProcessing(false)
    }
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
        responseSpeed: 'normal',
        safetyLevel: 'moderate',
        customInstructions: ''
      }

      if (behaviorSettings) {
        try {
          settings = { ...settings, ...JSON.parse(behaviorSettings) }
        } catch (error) {
          console.error('Error parsing behavior settings:', error)
        }
      }

      // Prepare conversation history for context
      const conversationHistory = messages.slice(-10).map(msg => ({
        role: msg.isUser ? 'user' as const : 'assistant' as const,
        content: msg.text,
        timestamp: msg.timestamp.getTime()
      }))

      // Call Oracle Chat API
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: messageText,
          conversationHistory,
          behaviorSettings: settings,
          context: 'Voice conversation with Oracle AI assistant'
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        
        // Handle Oracle disabled status gracefully
        if (response.status === 403 && errorData?.code === 'ORACLE_DISABLED') {
          console.warn('⚠️ Oracle is disabled - Chat API blocked to prevent charges')
          toast.info('Oracle is currently disabled. Enable Oracle in Settings to use AI features.')
          
          const disabledMessage: Message = {
            id: (Date.now() + 1).toString(),
            text: "I'm currently disabled to prevent API charges. You can enable me in the Oracle Settings.",
            isUser: false,
            timestamp: new Date()
          }
          
          setMessages(prev => [...prev, disabledMessage])
          return // Exit gracefully without throwing error
        }
        
        throw new Error(errorData.error || 'Failed to get AI response')
      }

      const data = await response.json()
      
      if (!data.success || !data.response) {
        throw new Error('Invalid response from AI service')
      }

      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: data.response,
        isUser: false,
        timestamp: new Date()
      }
      
      setMessages(prev => [...prev, aiResponse])

      // Auto-play response if voice is being used or if voice settings are enabled
      if (voiceSettings.voiceActivation || isRecording || isWakeWordListening) {
        console.log('🔊 Playing TTS response...')
        try {
          await playTextToSpeech(data.response)
          console.log('✅ TTS playback completed successfully')
        } catch (error) {
          console.error('❌ TTS playback failed:', error)
        }
        
        // If continuous listening is enabled, restart wake word listening after TTS completes
        if (voiceSettings.continuousListening && voiceSettings.voiceActivation) {
          console.log('🔄 TTS completed, scheduling wake word restart...', {
            continuousListening: voiceSettings.continuousListening,
            voiceActivation: voiceSettings.voiceActivation,
            isRecording,
            isProcessing,
            wakeWordDetected,
            responseDelay: voiceSettings.responseDelay
          })
          
          setTimeout(() => {
            console.log('⏰ Wake word restart timer triggered:', {
              isRecording,
              isProcessing,
              wakeWordDetected,
              isWakeWordListening
            })
            
            if (!isRecording && !isProcessing && !wakeWordDetected) {
              console.log('✅ Restarting wake word listening for next conversation...')
              setWakeWordDetected(false)
              setIsWakeWordListening(true)
            } else {
              console.log('⚠️ Cannot restart wake word listening - conditions not met')
            }
          }, voiceSettings.responseDelay || 1000)
        } else {
          console.log('❌ Wake word restart skipped:', {
            continuousListening: voiceSettings.continuousListening,
            voiceActivation: voiceSettings.voiceActivation
          })
        }
      }

      console.log('✅ Oracle conversation completed:', {
        model: data.model,
        usage: data.usage,
        settings: data.settings
      })

    } catch (error) {
      console.error('Error sending message to Oracle:', error)
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: `I apologize, but I'm having trouble processing your request right now. ${error instanceof Error ? error.message : 'Please try again.'}`,
        isUser: false,
        timestamp: new Date()
      }
      
      setMessages(prev => [...prev, errorMessage])
      toast.error('Failed to get AI response')
    } finally {
      setIsProcessing(false)
    }
  }

  const playTextToSpeech = async (text: string) => {
    try {
      console.log('🔊 Starting TTS for:', text.substring(0, 50) + '...')
      setIsPlaying(true)
      
      const response = await fetch('/api/ai/voice/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text,
          voice: voiceSettings.voiceId || 'alloy',
          speed: voiceSettings.speed || 1.0,
          response_format: 'mp3'
        })
      })

      if (!response.ok) {
        const errorData = await response.text()
        
        // Parse error data to check if Oracle is disabled
        let parsedError = null
        try {
          parsedError = JSON.parse(errorData)
        } catch (e) {
          // Error data is not JSON, treat as regular error
        }
        
        // Handle Oracle disabled status gracefully for TTS
        if (response.status === 403 && parsedError?.code === 'ORACLE_DISABLED') {
          console.warn('⚠️ Oracle is disabled - TTS API blocked to prevent charges')
          // Don't throw error for TTS when Oracle is disabled, just skip TTS
          return // Exit gracefully without throwing error
        }
        
        // For other errors, log and throw
        console.error('❌ TTS API error:', response.status, errorData)
        throw new Error(`TTS API error: ${response.status}`)
      }

      const audioBlob = await response.blob()
      console.log('🎵 TTS audio blob created:', audioBlob.size, 'bytes')
      
      const audioUrl = URL.createObjectURL(audioBlob)
      
      if (currentAudioRef.current) {
        currentAudioRef.current.pause()
        currentAudioRef.current = null
      }
      
      const audio = new Audio(audioUrl)
      currentAudioRef.current = audio
      
      // Set audio properties for better compatibility
      audio.volume = voiceSettings.volume || 0.8
      audio.crossOrigin = 'anonymous'
      audio.preload = 'auto'
      
      console.log('🎵 Audio object created:', {
        src: audioUrl,
        volume: audio.volume,
        duration: audio.duration,
        readyState: audio.readyState
      })
      
      // Return a promise that resolves when audio finishes playing
      return new Promise<void>((resolve, reject) => {
        let hasResolved = false
        
        // Add a timeout to prevent hanging
        const timeout = setTimeout(() => {
          if (!hasResolved) {
            console.log('⏰ TTS playback timeout reached, resolving anyway')
            hasResolved = true
            setIsPlaying(false)
            URL.revokeObjectURL(audioUrl)
            resolve()
          }
        }, 30000) // 30 second timeout
        
        const cleanup = () => {
          if (!hasResolved) {
            hasResolved = true
            clearTimeout(timeout)
            setIsPlaying(false)
            URL.revokeObjectURL(audioUrl)
          }
        }
        
        audio.onended = () => {
          console.log('✅ TTS playback completed - audio ended event fired')
          cleanup()
          resolve()
        }
        
        audio.onerror = (error) => {
          console.error('❌ Audio playback error:', error)
          cleanup()
          reject(new Error('Audio playback failed'))
        }
        
        // Simplified audio loading and playing
        const attemptPlay = async () => {
          try {
            console.log('🎵 Attempting to play TTS audio...')
            
            // Try to play the audio
            await audio.play()
            console.log('🎵 TTS playback started successfully')
            setIsPlaying(true)
            
          } catch (playError) {
            console.error('❌ Failed to start audio playback:', playError)
            console.error('❌ Play error details:', {
              name: playError.name,
              message: playError.message,
              code: playError.code
            })
            
            // Handle autoplay policy restrictions
            if (playError.name === 'NotAllowedError' || playError.name === 'AbortError') {
              console.log('🔒 Autoplay blocked by browser policy')
              
              // Show user-friendly message
              toast.error('🔒 Audio blocked! Click the Oracle or anywhere on the page to enable voice responses.')
              
              // Set up one-time user interaction listeners
              const enableAudioOnInteraction = async () => {
                try {
                  console.log('🔓 User interaction detected, attempting to play audio...')
                  await audio.play()
                  console.log('🎵 TTS playback started after user interaction')
                  setIsPlaying(true)
                  setHasUserInteracted(true)
                  
                  // Remove listeners after successful play
                  document.removeEventListener('click', enableAudioOnInteraction)
                  document.removeEventListener('keydown', enableAudioOnInteraction)
                  document.removeEventListener('touchstart', enableAudioOnInteraction)
                  
                } catch (interactionError) {
                  console.error('❌ Still failed to play after user interaction:', interactionError)
                  cleanup()
                  reject(interactionError)
                }
              }
              
              // Add multiple interaction listeners for better compatibility
              document.addEventListener('click', enableAudioOnInteraction, { once: true })
              document.addEventListener('keydown', enableAudioOnInteraction, { once: true })
              document.addEventListener('touchstart', enableAudioOnInteraction, { once: true })
              
              // Also add a specific listener to the Oracle blob for immediate play
              const oracleBlob = document.querySelector('[data-oracle-blob]')
              if (oracleBlob) {
                oracleBlob.addEventListener('click', enableAudioOnInteraction, { once: true })
              }
              
              return // Don't reject immediately, wait for user interaction
            }
            
            // For other errors, reject immediately
            cleanup()
            reject(playError)
          }
        }
        
        // Load audio first, then attempt to play
        if (audio.readyState >= 2) { // HAVE_CURRENT_DATA
          console.log('✅ Audio already loaded, ready to play')
          attemptPlay()
        } else {
          console.log('🔄 Loading audio...')
          
          audio.addEventListener('canplay', () => {
            console.log('✅ Audio loaded and ready to play')
            attemptPlay()
          }, { once: true })
          
          audio.addEventListener('error', (error) => {
            console.error('❌ Audio loading error:', error)
            cleanup()
            reject(new Error('Audio loading failed'))
          }, { once: true })
          
          // Force load
          audio.load()
        }
      })
      
    } catch (error) {
      console.error('❌ Error in TTS:', error)
      setIsPlaying(false)
      throw error
    }
  }

  const stopAudio = () => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause()
      currentAudioRef.current = null
      setIsPlaying(false)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleBlobClick = () => {
    setIsClicked(true)
    setTimeout(() => setIsClicked(false), 200)
    setShowQuickActions(true)
  }

  const handleOpenChat = () => {
    setShowQuickActions(false)
    setIsOpen(true)
  }

  const handleOpenSettings = () => {
    setShowQuickActions(false)
    router.push('/settings/oracle')
  }

  // Normalize settings from different formats (simple vs extended)
  const normalizeSettings = (settings: Record<string, unknown>): OracleAppearanceSettings => {
    return {
      primaryColor: (typeof settings.primaryColor === 'string' ? settings.primaryColor : defaultAppearanceSettings.primaryColor),
      secondaryColor: (typeof settings.secondaryColor === 'string' ? settings.secondaryColor : defaultAppearanceSettings.secondaryColor),
      gradientDirection: (settings.gradientDirection === 'linear' || settings.gradientDirection === 'radial' || settings.gradientDirection === 'conic' ? settings.gradientDirection : defaultAppearanceSettings.gradientDirection),
      blobSize: (typeof settings.blobSize === 'number' ? settings.blobSize : defaultAppearanceSettings.blobSize),
      voiceVisualization: (typeof settings.voiceVisualization === 'boolean' ? settings.voiceVisualization : defaultAppearanceSettings.voiceVisualization),
      voiceBarsCount: (typeof settings.voiceBarsCount === 'number' ? settings.voiceBarsCount : defaultAppearanceSettings.voiceBarsCount),
      // Convert percentage to decimal if needed
      voiceBarsHeight: (typeof settings.voiceBarsHeight === 'number' ? (settings.voiceBarsHeight > 1 ? settings.voiceBarsHeight / 100 : settings.voiceBarsHeight) : defaultAppearanceSettings.voiceBarsHeight),
      voiceBarsSpacing: (typeof settings.voiceBarsSpacing === 'number' ? settings.voiceBarsSpacing : defaultAppearanceSettings.voiceBarsSpacing),
      // Handle both voiceReactivity and voiceBarsReactivity
      voiceBarsReactivity: (typeof settings.voiceBarsReactivity === 'number' ? settings.voiceBarsReactivity : (typeof settings.voiceReactivity === 'number' ? settings.voiceReactivity / 100 : defaultAppearanceSettings.voiceBarsReactivity)),
      idleAnimation: (typeof settings.idleAnimation === 'boolean' ? settings.idleAnimation : defaultAppearanceSettings.idleAnimation),
      pulseEffect: (typeof settings.pulseEffect === 'boolean' ? settings.pulseEffect : defaultAppearanceSettings.pulseEffect),
      glowEffect: (typeof settings.glowEffect === 'boolean' ? settings.glowEffect : defaultAppearanceSettings.glowEffect),
      // Convert percentage to decimal if needed
      glowIntensity: (typeof settings.glowIntensity === 'number' ? (settings.glowIntensity > 1 ? settings.glowIntensity / 100 : settings.glowIntensity) : defaultAppearanceSettings.glowIntensity),
      // Handle both floatingAnimation and floatingBehavior
      floatingAnimation: (typeof settings.floatingAnimation === 'boolean' ? settings.floatingAnimation : (typeof settings.floatingBehavior === 'boolean' ? settings.floatingBehavior : defaultAppearanceSettings.floatingAnimation)),
      floatingSpeed: (typeof settings.floatingSpeed === 'number' ? settings.floatingSpeed : defaultAppearanceSettings.floatingSpeed),
      rotationSpeed: (typeof settings.rotationSpeed === 'number' ? settings.rotationSpeed : defaultAppearanceSettings.rotationSpeed),
      morphingSpeed: (typeof settings.morphingSpeed === 'number' ? settings.morphingSpeed : defaultAppearanceSettings.morphingSpeed),
      themeIntegration: (typeof settings.themeIntegration === 'boolean' ? settings.themeIntegration : defaultAppearanceSettings.themeIntegration)
    }
  }

  return (
    <>
      {/* Quick Actions Popup */}
      {showQuickActions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-80 max-w-sm mx-4">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Quick Actions</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowQuickActions(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {quickActions.map((action) => (
                <Button
                  key={action.id}
                  variant="outline"
                  className="w-full justify-start h-auto p-3"
                  onClick={action.action}
                >
                  <div className="flex items-start gap-3 w-full">
                    <div className="flex-shrink-0 mt-0.5">
                      {action.icon}
                    </div>
                    <div className="text-left flex-1 min-w-0">
                      <div className="font-medium truncate">{action.label}</div>
                      <div className="text-xs text-muted-foreground leading-tight">
                        {action.description}
                      </div>
                    </div>
                  </div>
                </Button>
              ))}
              <Separator />
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleOpenChat}
                  className="flex items-center gap-2"
                >
                  <MessageCircle className="h-4 w-4" />
                  Chat
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleOpenSettings}
                  className="flex items-center gap-2"
                >
                  <Settings className="h-4 w-4" />
                  Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Chat Interface */}
      {isOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md h-[600px] flex flex-col">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Oracle AI Chat</CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleOpenSettings}
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsOpen(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="flex-1 flex flex-col p-4">
              <ScrollArea className="flex-1 mb-4">
                <div className="space-y-4">
                  {messages.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Start a conversation with Oracle</p>
                      <p className="text-sm">Try using voice input or quick actions</p>
                    </div>
                  ) : (
                    messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg p-3 ${
                            message.isUser
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          }`}
                        >
                          <p className="text-sm">{message.text}</p>
                          <p className="text-xs opacity-70 mt-1">
                            {message.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
              
              <div className="space-y-3">
                {isRecording && (
                  <div className="flex items-center justify-center gap-2 p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    <span className="text-sm font-medium">Recording: {formatTime(recordingTime)}</span>
                  </div>
                )}
                
                {isProcessing && (
                  <div className="flex items-center justify-center gap-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                    <span className="text-sm font-medium">Processing audio...</span>
                  </div>
                )}
                
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <Input
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      placeholder="Type your message..."
                      onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                      disabled={isRecording || isProcessing}
                    />
                  </div>
                  
                  <div className="flex gap-1">
                    {voiceSettings.autoListen && (
                      <Button
                        size="sm"
                        variant={isRecording ? "destructive" : "outline"}
                        onClick={isRecording ? stopRecording : startRecording}
                        disabled={isProcessing}
                      >
                        {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                      </Button>
                    )}
                    
                    {isPlaying && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={stopAudio}
                      >
                        <VolumeX className="h-4 w-4" />
                      </Button>
                    )}
                    
                    <Button
                      size="sm"
                      onClick={() => sendMessage()}
                      disabled={!inputText.trim() || isRecording || isProcessing}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Oracle Blob */}
      <div className="fixed bottom-6 right-6 z-30">
        <div className="relative flex items-center justify-center">
          {/* Wake Word Listening Indicator */}
          {isWakeWordListening && (
            <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-blue-500/90 text-white px-3 py-1 rounded-full text-xs font-medium animate-pulse">
              Listening for &quot;Oracle&quot;
            </div>
          )}
          
          {/* Wake Word Detected Indicator */}
          {wakeWordDetected && (
            <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-green-500/90 text-white px-3 py-1 rounded-full text-xs font-medium animate-bounce">
              Oracle Activated!
            </div>
          )}
          
          <button
            onClick={handleBlobClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            data-oracle-blob
            className={`relative overflow-hidden transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-full animate-float hover:animate-blobPulse ${isHovered ? 'scale-110' : 'scale-100'} ${isClicked ? 'scale-95' : ''}`}
            style={{
              width: `${appearanceSettings.blobSize}px`,
              height: `${appearanceSettings.blobSize}px`,
              borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%',
              background: appearanceSettings.gradientDirection === 'linear' 
                ? `linear-gradient(135deg, ${appearanceSettings.primaryColor}, ${appearanceSettings.secondaryColor})`
                : appearanceSettings.gradientDirection === 'radial'
                ? `radial-gradient(circle, ${appearanceSettings.primaryColor}, ${appearanceSettings.secondaryColor})`
                : `conic-gradient(from 0deg, ${appearanceSettings.primaryColor}, ${appearanceSettings.secondaryColor}, ${appearanceSettings.primaryColor})`,
              boxShadow: appearanceSettings.glowEffect 
                ? `0 0 ${20 * appearanceSettings.glowIntensity * (isHovered ? 1.5 : 1)}px ${appearanceSettings.primaryColor}40, 0 0 ${40 * appearanceSettings.glowIntensity * (isHovered ? 1.5 : 1)}px ${appearanceSettings.primaryColor}20`
                : 'none',
              animation: [
                appearanceSettings.idleAnimation ? `morphBlobAdvanced ${appearanceSettings.morphingSpeed * 2}s ease-in-out infinite` : `morphBlob ${appearanceSettings.morphingSpeed}s ease-in-out infinite`,
                appearanceSettings.floatingAnimation ? `float ${appearanceSettings.floatingSpeed}s ease-in-out infinite` : '',
                appearanceSettings.pulseEffect ? `blobPulse 2s ease-in-out infinite` : '',
                appearanceSettings.glowEffect ? `glowPulse 3s ease-in-out infinite` : '',
                `rotate ${appearanceSettings.rotationSpeed}s linear infinite`
              ].filter(Boolean).join(', ') || 'float 3s ease-in-out infinite, morphBlob 6s ease-in-out infinite'
            }}
          >
            {/* Voice Visualization - Enhanced Equalizers */}
            {appearanceSettings.voiceVisualization && (
              <div 
                className="absolute inset-0 flex items-center justify-center overflow-hidden"
                style={{ 
                  borderRadius: 'inherit',
                  gap: `${appearanceSettings.voiceBarsSpacing}px`
                }}
              >
                {Array.from({ length: appearanceSettings.voiceBarsCount }, (_, i) => (
                  <div
                    key={i}
                    className="rounded-full transition-all duration-200 shadow-md"
                    style={{
                      width: '4px',
                      height: `${Math.min(appearanceSettings.voiceBarsHeight * voiceBarHeights[i % voiceBarHeights.length] * 45, 40)}px`,
                      minHeight: '8px',
                      background: isRecording 
                        ? `linear-gradient(to top, ${appearanceSettings.primaryColor}, ${appearanceSettings.secondaryColor})`
                        : isPlaying
                        ? `linear-gradient(to top, ${appearanceSettings.secondaryColor}, ${appearanceSettings.primaryColor})`
                        : 'rgba(255, 255, 255, 0.8)',
                      animation: (isRecording || isPlaying) 
                        ? `voiceBar${(i % 5) + 1} ${0.2 + (i * 0.03)}s ease-in-out infinite alternate`
                        : appearanceSettings.idleAnimation
                        ? `voiceBar${(i % 5) + 1} ${1.5 + (i * 0.15)}s ease-in-out infinite alternate`
                        : 'none',
                      transformOrigin: 'bottom center',
                      filter: isRecording || isPlaying ? 'brightness(1.3) saturate(1.4) drop-shadow(0 1px 2px rgba(0,0,0,0.3))' : 'drop-shadow(0 1px 1px rgba(0,0,0,0.2))',
                      boxShadow: (isRecording || isPlaying) 
                        ? `0 0 6px ${appearanceSettings.primaryColor}40`
                        : 'none'
                    }}
                  />
                ))}
              </div>
            )}
            
            {/* Status Indicators */}
            <div className="absolute -top-1 -right-1 flex flex-col gap-1">
              {isRecording && (
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              )}
              {isProcessing && (
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-spin" />
              )}
              {isPlaying && (
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
              )}
            </div>
          </button>
        </div>
      </div>
    </>
  )
}
