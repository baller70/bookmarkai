
'use client'
export const dynamic = 'force-dynamic'

import React, { useState, useEffect, useRef } from 'react'
import { Mic, MicOff, Volume2, VolumeX, Settings, Play, Square, RotateCcw, CheckCircle, XCircle, Headphones } from 'lucide-react'
import { useTranslation } from '@/hooks/use-translation'

interface VoiceCommand {
  id: string
  phrase: string
  action: string
  description: string
  enabled: boolean
  category: 'navigation' | 'bookmarks' | 'search' | 'ai' | 'system'
  confidence: number
  lastUsed?: Date
  usageCount: number
}

interface VoiceSession {
  isListening: boolean
  isProcessing: boolean
  transcript: string
  confidence: number
  lastCommand?: string
  error?: string
}

export default function VoiceCommandsPage() {
  const { t } = useTranslation()
  const [voiceSession, setVoiceSession] = useState<VoiceSession>({
    isListening: false,
    isProcessing: false,
    transcript: '',
    confidence: 0
  })
  
  const [voiceCommands, setVoiceCommands] = useState<VoiceCommand[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [voiceSettings, setVoiceSettings] = useState({
    language: 'en-US',
    sensitivity: 0.8,
    autoExecute: true,
    feedbackEnabled: true,
    wakePhraseEnabled: false,
    wakePhrase: 'Hey BookAI'
  })
  
  const recognitionRef = useRef<any>(null)
  const [isSupported, setIsSupported] = useState(false)

  // Initialize voice commands
  useEffect(() => {
    const defaultCommands: VoiceCommand[] = [
      // Navigation Commands
      {
        id: '1',
        phrase: 'Go to dashboard',
        action: 'navigate:/dashboard',
        description: 'Navigate to the main dashboard',
        enabled: true,
        category: 'navigation',
        confidence: 0.95,
        usageCount: 45
      },
      {
        id: '2',
        phrase: 'Open bookmarks',
        action: 'navigate:/bookmarks',
        description: 'Open the bookmarks page',
        enabled: true,
        category: 'navigation',
        confidence: 0.92,
        usageCount: 38
      },
      {
        id: '3',
        phrase: 'Show settings',
        action: 'navigate:/settings',
        description: 'Open application settings',
        enabled: true,
        category: 'navigation',
        confidence: 0.90,
        usageCount: 22
      },
      
      // Bookmark Commands
      {
        id: '4',
        phrase: 'Add bookmark',
        action: 'bookmark:add',
        description: 'Add current page to bookmarks',
        enabled: true,
        category: 'bookmarks',
        confidence: 0.88,
        usageCount: 67
      },
      {
        id: '5',
        phrase: 'Search bookmarks',
        action: 'bookmark:search',
        description: 'Open bookmark search',
        enabled: true,
        category: 'bookmarks',
        confidence: 0.85,
        usageCount: 34
      },
      {
        id: '6',
        phrase: 'Show favorites',
        action: 'bookmark:favorites',
        description: 'Display favorite bookmarks',
        enabled: true,
        category: 'bookmarks',
        confidence: 0.91,
        usageCount: 28
      },
      
      // Search Commands
      {
        id: '7',
        phrase: 'Search for',
        action: 'search:query',
        description: 'Perform a search query',
        enabled: true,
        category: 'search',
        confidence: 0.87,
        usageCount: 89
      },
      {
        id: '8',
        phrase: 'Find in bookmarks',
        action: 'search:bookmarks',
        description: 'Search within saved bookmarks',
        enabled: true,
        category: 'search',
        confidence: 0.84,
        usageCount: 56
      },
      
      // AI Commands
      {
        id: '9',
        phrase: 'Analyze this page',
        action: 'ai:analyze',
        description: 'Run AI analysis on current page',
        enabled: true,
        category: 'ai',
        confidence: 0.93,
        usageCount: 23
      },
      {
        id: '10',
        phrase: 'Smart tag',
        action: 'ai:tag',
        description: 'Generate AI-powered tags',
        enabled: true,
        category: 'ai',
        confidence: 0.89,
        usageCount: 41
      },
      {
        id: '11',
        phrase: 'Start AI filtering',
        action: 'ai:filter',
        description: 'Enable AI content filtering',
        enabled: true,
        category: 'ai',
        confidence: 0.86,
        usageCount: 19
      },
      
      // System Commands
      {
        id: '12',
        phrase: 'Toggle dark mode',
        action: 'system:theme',
        description: 'Switch between light and dark themes',
        enabled: true,
        category: 'system',
        confidence: 0.94,
        usageCount: 15
      },
      {
        id: '13',
        phrase: 'Show help',
        action: 'system:help',
        description: 'Display help information',
        enabled: true,
        category: 'system',
        confidence: 0.91,
        usageCount: 8
      }
    ]
    
    setVoiceCommands(defaultCommands)
  }, [])

  // Check for speech recognition support
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    setIsSupported(!!SpeechRecognition)
    
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = false
      recognitionRef.current.interimResults = true
      recognitionRef.current.lang = voiceSettings.language
      
      recognitionRef.current.onstart = () => {
        setVoiceSession(prev => ({ ...prev, isListening: true, error: undefined }))
      }
      
      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        const confidence = event.results[0][0].confidence
        
        setVoiceSession(prev => ({
          ...prev,
          transcript,
          confidence,
          isProcessing: true
        }))
        
        // Process the command
        processVoiceCommand(transcript, confidence)
      }
      
      recognitionRef.current.onerror = (event: any) => {
        setVoiceSession(prev => ({
          ...prev,
          isListening: false,
          isProcessing: false,
          error: `Speech recognition error: ${event.error}`
        }))
      }
      
      recognitionRef.current.onend = () => {
        setVoiceSession(prev => ({ ...prev, isListening: false }))
      }
    }
  }, [voiceSettings.language])

  const processVoiceCommand = async (transcript: string, confidence: number) => {
    // Find matching command
    const matchedCommand = voiceCommands.find(cmd => 
      cmd.enabled && transcript.toLowerCase().includes(cmd.phrase.toLowerCase())
    )
    
    if (matchedCommand && confidence >= voiceSettings.sensitivity) {
      // Execute the command
      await executeCommand(matchedCommand)
      setVoiceSession(prev => ({
        ...prev,
        lastCommand: matchedCommand.phrase,
        isProcessing: false
      }))
      
      // Update usage count
      setVoiceCommands(commands => 
        commands.map(cmd => 
          cmd.id === matchedCommand.id 
            ? { ...cmd, usageCount: cmd.usageCount + 1, lastUsed: new Date() }
            : cmd
        )
      )
    } else {
      setVoiceSession(prev => ({
        ...prev,
        isProcessing: false,
        error: confidence < voiceSettings.sensitivity 
          ? 'Command confidence too low' 
          : 'No matching command found'
      }))
    }
  }

  const executeCommand = async (command: VoiceCommand) => {
    console.log('Executing command:', command.action)
    
    // Simulate command execution
    switch (command.action.split(':')[0]) {
      case 'navigate':
        const path = command.action.split(':')[1]
        // In production, use your router here
        console.log('Navigate to:', path)
        break
      case 'bookmark':
        console.log('Bookmark action:', command.action)
        break
      case 'search':
        console.log('Search action:', command.action)
        break
      case 'ai':
        console.log('AI action:', command.action)
        break
      case 'system':
        console.log('System action:', command.action)
        break
    }
    
    // Provide audio feedback if enabled
    if (voiceSettings.feedbackEnabled) {
      const utterance = new SpeechSynthesisUtterance(`Executing ${command.phrase}`)
      speechSynthesis.speak(utterance)
    }
  }

  const startListening = () => {
    if (recognitionRef.current && isSupported) {
      setVoiceSession(prev => ({ ...prev, transcript: '', error: undefined }))
      recognitionRef.current.start()
    }
  }

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
  }

  const toggleCommand = (commandId: string) => {
    setVoiceCommands(commands =>
      commands.map(cmd =>
        cmd.id === commandId ? { ...cmd, enabled: !cmd.enabled } : cmd
      )
    )
  }

  const filteredCommands = selectedCategory === 'all' 
    ? voiceCommands 
    : voiceCommands.filter(cmd => cmd.category === selectedCategory)

  const categories = ['all', 'navigation', 'bookmarks', 'search', 'ai', 'system']

  if (!isSupported) {
    return (
      <div className="text-center py-12">
        <MicOff className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Speech Recognition Not Supported
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Your browser doesn't support speech recognition. Please use a modern browser like Chrome or Edge.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg p-6 text-white">
        <div className="flex items-center space-x-3 mb-4">
          <Headphones className="w-8 h-8" />
          <div>
            <h1 className="text-2xl font-bold">{t('aiLinkPilot.voiceCommands')}</h1>
            <p className="text-blue-100">Control your bookmarks with voice commands</p>
          </div>
        </div>
        
        {/* Voice Control Panel */}
        <div className="bg-white/10 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={voiceSession.isListening ? stopListening : startListening}
                disabled={voiceSession.isProcessing}
                className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all ${
                  voiceSession.isListening
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : 'bg-white text-blue-600 hover:bg-gray-100'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {voiceSession.isListening ? (
                  <>
                    <Square className="w-5 h-5" />
                    <span>Stop Listening</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-5 h-5" />
                    <span>Start Listening</span>
                  </>
                )}
              </button>
              
              {voiceSession.isProcessing && (
                <div className="flex items-center space-x-2 text-white">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Processing...</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <Volume2 className="w-5 h-5" />
              <span className="text-sm">
                Sensitivity: {Math.round(voiceSettings.sensitivity * 100)}%
              </span>
            </div>
          </div>
          
          {/* Status Display */}
          <div className="bg-white/10 rounded-lg p-3">
            {voiceSession.isListening && (
              <div className="flex items-center space-x-2 text-white">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <span>Listening for commands...</span>
              </div>
            )}
            
            {voiceSession.transcript && (
              <div className="text-white">
                <div className="text-sm opacity-75">Recognized:</div>
                <div className="font-medium">"{voiceSession.transcript}"</div>
                <div className="text-xs opacity-75">
                  Confidence: {Math.round(voiceSession.confidence * 100)}%
                </div>
              </div>
            )}
            
            {voiceSession.lastCommand && (
              <div className="flex items-center space-x-2 text-green-200">
                <CheckCircle className="w-4 h-4" />
                <span>Executed: {voiceSession.lastCommand}</span>
              </div>
            )}
            
            {voiceSession.error && (
              <div className="flex items-center space-x-2 text-red-200">
                <XCircle className="w-4 h-4" />
                <span>{voiceSession.error}</span>
              </div>
            )}
            
            {!voiceSession.isListening && !voiceSession.transcript && !voiceSession.lastCommand && !voiceSession.error && (
              <div className="text-white/75">
                Click "Start Listening" and say a command like "Go to dashboard" or "Add bookmark"
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Command Categories */}
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedCategory === category
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </button>
        ))}
      </div>

      {/* Voice Commands List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Available Commands ({filteredCommands.length})
          </h2>
        </div>
        
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {filteredCommands.map((command) => (
            <div key={command.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="font-medium text-gray-900 dark:text-gray-100">
                      "{command.phrase}"
                    </h3>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      command.enabled
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                    }`}>
                      {command.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                    <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full">
                      {command.category}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 dark:text-gray-400 mb-3">
                    {command.description}
                  </p>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                    <span>Used {command.usageCount} times</span>
                    <span>•</span>
                    <span>Confidence: {Math.round(command.confidence * 100)}%</span>
                    {command.lastUsed && (
                      <>
                        <span>•</span>
                        <span>Last used: {command.lastUsed.toLocaleDateString()}</span>
                      </>
                    )}
                  </div>
                </div>
                
                <button
                  onClick={() => toggleCommand(command.id)}
                  className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                    command.enabled
                      ? 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900 dark:text-red-200'
                      : 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900 dark:text-green-200'
                  }`}
                >
                  {command.enabled ? 'Disable' : 'Enable'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Settings Panel */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center space-x-2">
          <Settings className="w-5 h-5" />
          <span>Voice Settings</span>
        </h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Language
            </label>
            <select 
              value={voiceSettings.language}
              onChange={(e) => setVoiceSettings(prev => ({ ...prev, language: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
            >
              <option value="en-US">English (US)</option>
              <option value="en-GB">English (UK)</option>
              <option value="es-ES">Spanish</option>
              <option value="fr-FR">French</option>
              <option value="de-DE">German</option>
              <option value="it-IT">Italian</option>
              <option value="pt-PT">Portuguese</option>
              <option value="ja-JP">Japanese</option>
              <option value="ko-KR">Korean</option>
              <option value="zh-CN">Chinese</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Sensitivity ({Math.round(voiceSettings.sensitivity * 100)}%)
            </label>
            <input
              type="range"
              min="0.5"
              max="1.0"
              step="0.05"
              value={voiceSettings.sensitivity}
              onChange={(e) => setVoiceSettings(prev => ({ ...prev, sensitivity: parseFloat(e.target.value) }))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
              <span>Low</span>
              <span>High</span>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <input 
                type="checkbox" 
                id="auto-execute"
                checked={voiceSettings.autoExecute}
                onChange={(e) => setVoiceSettings(prev => ({ ...prev, autoExecute: e.target.checked }))}
                className="rounded" 
              />
              <label htmlFor="auto-execute" className="text-sm text-gray-600 dark:text-gray-400">
                Auto-execute recognized commands
              </label>
            </div>
            
            <div className="flex items-center space-x-2">
              <input 
                type="checkbox" 
                id="feedback-enabled"
                checked={voiceSettings.feedbackEnabled}
                onChange={(e) => setVoiceSettings(prev => ({ ...prev, feedbackEnabled: e.target.checked }))}
                className="rounded" 
              />
              <label htmlFor="feedback-enabled" className="text-sm text-gray-600 dark:text-gray-400">
                Enable audio feedback
              </label>
            </div>
            
            <div className="flex items-center space-x-2">
              <input 
                type="checkbox" 
                id="wake-phrase"
                checked={voiceSettings.wakePhraseEnabled}
                onChange={(e) => setVoiceSettings(prev => ({ ...prev, wakePhraseEnabled: e.target.checked }))}
                className="rounded" 
              />
              <label htmlFor="wake-phrase" className="text-sm text-gray-600 dark:text-gray-400">
                Enable wake phrase
              </label>
            </div>
          </div>
          
          {voiceSettings.wakePhraseEnabled && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Wake Phrase
              </label>
              <input
                type="text"
                value={voiceSettings.wakePhrase}
                onChange={(e) => setVoiceSettings(prev => ({ ...prev, wakePhrase: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                placeholder="Hey BookAI"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 