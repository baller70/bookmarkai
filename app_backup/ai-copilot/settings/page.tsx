
'use client'
export const dynamic = 'force-dynamic'

import React, { useState, useEffect } from 'react'
import { Settings, Save, RotateCcw, Shield, Database, Zap, Bell, Palette, Globe, Key, Download, Upload, Trash2 } from 'lucide-react'
import { useTranslation } from '@/hooks/use-translation'

interface AISettings {
  // AI Engine Settings
  aiProvider: 'openai' | 'anthropic' | 'google' | 'local'
  model: string
  temperature: number
  maxTokens: number
  responseTimeout: number
  
  // Processing Settings
  autoProcessing: boolean
  batchProcessing: boolean
  backgroundProcessing: boolean
  processingPriority: 'speed' | 'accuracy' | 'balanced'
  
  // Privacy Settings
  dataRetention: number // days
  shareAnalytics: boolean
  localProcessing: boolean
  encryptData: boolean
  
  // Notification Settings
  enableNotifications: boolean
  notificationTypes: string[]
  notificationFrequency: 'immediate' | 'hourly' | 'daily' | 'weekly'
  
  // Interface Settings
  theme: 'light' | 'dark' | 'auto'
  language: string
  compactMode: boolean
  showAdvancedOptions: boolean
  
  // API Settings
  customApiEndpoint?: string
  apiKey?: string
  rateLimitPerMinute: number
}

export default function SettingsPage() {
  const { t } = useTranslation()
  const [settings, setSettings] = useState<AISettings>({
    // AI Engine Settings
    aiProvider: 'openai',
    model: 'gpt-4',
    temperature: 0.7,
    maxTokens: 2048,
    responseTimeout: 30,
    
    // Processing Settings
    autoProcessing: true,
    batchProcessing: false,
    backgroundProcessing: true,
    processingPriority: 'balanced',
    
    // Privacy Settings
    dataRetention: 30,
    shareAnalytics: false,
    localProcessing: false,
    encryptData: true,
    
    // Notification Settings
    enableNotifications: true,
    notificationTypes: ['processing_complete', 'errors', 'insights'],
    notificationFrequency: 'immediate',
    
    // Interface Settings
    theme: 'auto',
    language: 'en',
    compactMode: false,
    showAdvancedOptions: false,
    
    // API Settings
    rateLimitPerMinute: 60
  })
  
  const [isLoading, setIsLoading] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [activeTab, setActiveTab] = useState('general')

  // Load settings on component mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        // In production, load from your backend
        const savedSettings = localStorage.getItem('ai-linkpilot-settings')
        if (savedSettings) {
          setSettings({ ...settings, ...JSON.parse(savedSettings) })
        }
      } catch (error) {
        console.error('Failed to load settings:', error)
      }
    }
    
    loadSettings()
  }, [])

  const handleSaveSettings = async () => {
    setSaveStatus('saving')
    setIsLoading(true)
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // In production, save to your backend
      localStorage.setItem('ai-linkpilot-settings', JSON.stringify(settings))
      
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 3000)
    } catch (error) {
      console.error('Failed to save settings:', error)
      setSaveStatus('error')
      setTimeout(() => setSaveStatus('idle'), 3000)
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetSettings = () => {
    if (confirm('Are you sure you want to reset all settings to default values?')) {
      const defaultSettings: AISettings = {
        aiProvider: 'openai',
        model: 'gpt-4',
        temperature: 0.7,
        maxTokens: 2048,
        responseTimeout: 30,
        autoProcessing: true,
        batchProcessing: false,
        backgroundProcessing: true,
        processingPriority: 'balanced',
        dataRetention: 30,
        shareAnalytics: false,
        localProcessing: false,
        encryptData: true,
        enableNotifications: true,
        notificationTypes: ['processing_complete', 'errors', 'insights'],
        notificationFrequency: 'immediate',
        theme: 'auto',
        language: 'en',
        compactMode: false,
        showAdvancedOptions: false,
        rateLimitPerMinute: 60
      }
      setSettings(defaultSettings)
    }
  }

  const handleExportSettings = () => {
    const dataStr = JSON.stringify(settings, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
    
    const exportFileDefaultName = 'ai-linkpilot-settings.json'
    
    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
  }

  const handleImportSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const importedSettings = JSON.parse(e.target?.result as string)
          setSettings({ ...settings, ...importedSettings })
        } catch (error) {
          alert('Invalid settings file')
        }
      }
      reader.readAsText(file)
    }
  }

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'ai', label: 'AI Engine', icon: Zap },
    { id: 'privacy', label: 'Privacy', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'interface', label: 'Interface', icon: Palette },
    { id: 'api', label: 'API', icon: Key },
    { id: 'data', label: 'Data Management', icon: Database }
  ]

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Processing Settings</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Auto Processing</label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Automatically process new bookmarks</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.autoProcessing}
                    onChange={(e) => setSettings(prev => ({ ...prev, autoProcessing: e.target.checked }))}
                    className="rounded"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Batch Processing</label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Process multiple items together for efficiency</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.batchProcessing}
                    onChange={(e) => setSettings(prev => ({ ...prev, batchProcessing: e.target.checked }))}
                    className="rounded"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Background Processing</label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Continue processing when app is not active</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.backgroundProcessing}
                    onChange={(e) => setSettings(prev => ({ ...prev, backgroundProcessing: e.target.checked }))}
                    className="rounded"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Processing Priority
                  </label>
                  <select
                    value={settings.processingPriority}
                    onChange={(e) => setSettings(prev => ({ ...prev, processingPriority: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  >
                    <option value="speed">Speed (Faster, less accurate)</option>
                    <option value="balanced">Balanced (Recommended)</option>
                    <option value="accuracy">Accuracy (Slower, more accurate)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )
        
      case 'ai':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">AI Provider</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    AI Provider
                  </label>
                  <select
                    value={settings.aiProvider}
                    onChange={(e) => setSettings(prev => ({ ...prev, aiProvider: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  >
                    <option value="openai">OpenAI</option>
                    <option value="anthropic">Anthropic (Claude)</option>
                    <option value="google">Google (Gemini)</option>
                    <option value="local">Local Model</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Model
                  </label>
                  <select
                    value={settings.model}
                    onChange={(e) => setSettings(prev => ({ ...prev, model: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  >
                    {settings.aiProvider === 'openai' && (
                      <>
                        <option value="gpt-4">GPT-4</option>
                        <option value="gpt-4-turbo">GPT-4 Turbo</option>
                        <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                      </>
                    )}
                    {settings.aiProvider === 'anthropic' && (
                      <>
                        <option value="claude-3-opus">Claude 3 Opus</option>
                        <option value="claude-3-sonnet">Claude 3 Sonnet</option>
                        <option value="claude-3-haiku">Claude 3 Haiku</option>
                      </>
                    )}
                    {settings.aiProvider === 'google' && (
                      <>
                        <option value="gemini-pro">Gemini Pro</option>
                        <option value="gemini-pro-vision">Gemini Pro Vision</option>
                      </>
                    )}
                    {settings.aiProvider === 'local' && (
                      <>
                        <option value="llama-2-7b">Llama 2 7B</option>
                        <option value="llama-2-13b">Llama 2 13B</option>
                        <option value="mistral-7b">Mistral 7B</option>
                      </>
                    )}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Temperature ({settings.temperature})
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.1"
                    value={settings.temperature}
                    onChange={(e) => setSettings(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                    <span>Conservative</span>
                    <span>Creative</span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Max Tokens
                  </label>
                  <input
                    type="number"
                    min="100"
                    max="8192"
                    value={settings.maxTokens}
                    onChange={(e) => setSettings(prev => ({ ...prev, maxTokens: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Response Timeout (seconds)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="300"
                    value={settings.responseTimeout}
                    onChange={(e) => setSettings(prev => ({ ...prev, responseTimeout: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  />
                </div>
              </div>
            </div>
          </div>
        )
        
      case 'privacy':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Privacy & Security</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Local Processing</label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Process data locally when possible</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.localProcessing}
                    onChange={(e) => setSettings(prev => ({ ...prev, localProcessing: e.target.checked }))}
                    className="rounded"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Encrypt Data</label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Encrypt stored data and communications</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.encryptData}
                    onChange={(e) => setSettings(prev => ({ ...prev, encryptData: e.target.checked }))}
                    className="rounded"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Share Analytics</label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Share anonymized usage analytics</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.shareAnalytics}
                    onChange={(e) => setSettings(prev => ({ ...prev, shareAnalytics: e.target.checked }))}
                    className="rounded"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Data Retention (days)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={settings.dataRetention}
                    onChange={(e) => setSettings(prev => ({ ...prev, dataRetention: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  />
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Data will be automatically deleted after this period
                  </p>
                </div>
              </div>
            </div>
          </div>
        )
        
      case 'notifications':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Notification Settings</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Enable Notifications</label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Receive notifications for important events</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.enableNotifications}
                    onChange={(e) => setSettings(prev => ({ ...prev, enableNotifications: e.target.checked }))}
                    className="rounded"
                  />
                </div>
                
                {settings.enableNotifications && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Notification Types
                      </label>
                      <div className="space-y-2">
                        {[
                          { id: 'processing_complete', label: 'Processing Complete' },
                          { id: 'errors', label: 'Errors & Issues' },
                          { id: 'insights', label: 'AI Insights' },
                          { id: 'updates', label: 'Feature Updates' },
                          { id: 'tips', label: 'Tips & Suggestions' }
                        ].map((type) => (
                          <div key={type.id} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={type.id}
                              checked={settings.notificationTypes.includes(type.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSettings(prev => ({ 
                                    ...prev, 
                                    notificationTypes: [...prev.notificationTypes, type.id] 
                                  }))
                                } else {
                                  setSettings(prev => ({ 
                                    ...prev, 
                                    notificationTypes: prev.notificationTypes.filter(t => t !== type.id) 
                                  }))
                                }
                              }}
                              className="rounded"
                            />
                            <label htmlFor={type.id} className="text-sm text-gray-600 dark:text-gray-400">
                              {type.label}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Notification Frequency
                      </label>
                      <select
                        value={settings.notificationFrequency}
                        onChange={(e) => setSettings(prev => ({ ...prev, notificationFrequency: e.target.value as any }))}
                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                      >
                        <option value="immediate">Immediate</option>
                        <option value="hourly">Hourly Digest</option>
                        <option value="daily">Daily Digest</option>
                        <option value="weekly">Weekly Summary</option>
                      </select>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )
        
      case 'interface':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Interface Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Theme
                  </label>
                  <select
                    value={settings.theme}
                    onChange={(e) => setSettings(prev => ({ ...prev, theme: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  >
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="auto">Auto (System)</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Language
                  </label>
                  <select
                    value={settings.language}
                    onChange={(e) => setSettings(prev => ({ ...prev, language: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  >
                    <option value="en">English</option>
                    <option value="es">Español</option>
                    <option value="fr">Français</option>
                    <option value="de">Deutsch</option>
                    <option value="it">Italiano</option>
                    <option value="pt">Português</option>
                    <option value="ja">日本語</option>
                    <option value="ko">한국어</option>
                    <option value="zh">中文</option>
                  </select>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Compact Mode</label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Use more compact interface layout</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.compactMode}
                    onChange={(e) => setSettings(prev => ({ ...prev, compactMode: e.target.checked }))}
                    className="rounded"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Show Advanced Options</label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Display advanced configuration options</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.showAdvancedOptions}
                    onChange={(e) => setSettings(prev => ({ ...prev, showAdvancedOptions: e.target.checked }))}
                    className="rounded"
                  />
                </div>
              </div>
            </div>
          </div>
        )
        
      case 'api':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">API Configuration</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Custom API Endpoint (Optional)
                  </label>
                  <input
                    type="url"
                    value={settings.customApiEndpoint || ''}
                    onChange={(e) => setSettings(prev => ({ ...prev, customApiEndpoint: e.target.value }))}
                    placeholder="https://api.example.com/v1"
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    API Key (Optional)
                  </label>
                  <input
                    type="password"
                    value={settings.apiKey || ''}
                    onChange={(e) => setSettings(prev => ({ ...prev, apiKey: e.target.value }))}
                    placeholder="Your custom API key"
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Rate Limit (requests per minute)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    value={settings.rateLimitPerMinute}
                    onChange={(e) => setSettings(prev => ({ ...prev, rateLimitPerMinute: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  />
                </div>
              </div>
            </div>
          </div>
        )
        
      case 'data':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Data Management</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Export Settings</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Download your current settings as a backup</p>
                  </div>
                  <button
                    onClick={handleExportSettings}
                    className="flex items-center space-x-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200"
                  >
                    <Download className="w-4 h-4" />
                    <span>Export</span>
                  </button>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Import Settings</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Restore settings from a backup file</p>
                  </div>
                  <label className="flex items-center space-x-2 px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 dark:bg-green-900 dark:text-green-200 cursor-pointer">
                    <Upload className="w-4 h-4" />
                    <span>Import</span>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImportSettings}
                      className="hidden"
                    />
                  </label>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <div>
                    <h4 className="text-sm font-medium text-red-700 dark:text-red-300">Clear All Data</h4>
                    <p className="text-sm text-red-500 dark:text-red-400">Permanently delete all settings and data</p>
                  </div>
                  <button
                    onClick={() => {
                      if (confirm('This will permanently delete all your data. This action cannot be undone.')) {
                        localStorage.clear()
                        window.location.reload()
                      }
                    }}
                    className="flex items-center space-x-2 px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 dark:bg-red-900 dark:text-red-200"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Clear Data</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
        
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg p-6 text-white">
        <div className="flex items-center space-x-3 mb-4">
          <Settings className="w-8 h-8" />
          <div>
            <h1 className="text-2xl font-bold">{t('aiLinkPilot.settings')}</h1>
            <p className="text-indigo-100">Configure AI LinkPilot to match your preferences</p>
          </div>
        </div>
      </div>

      {/* Settings Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="flex border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
          {tabs.map((tab) => {
            const IconComponent = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-6 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <IconComponent className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>
        
        <div className="p-6">
          {renderTabContent()}
        </div>
      </div>

      {/* Save Controls */}
      <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-4">
          {saveStatus === 'saved' && (
            <div className="flex items-center space-x-2 text-green-600 dark:text-green-400">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm">Settings saved successfully</span>
            </div>
          )}
          
          {saveStatus === 'error' && (
            <div className="flex items-center space-x-2 text-red-600 dark:text-red-400">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span className="text-sm">Failed to save settings</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={handleResetSettings}
            className="flex items-center space-x-2 px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset to Defaults</span>
          </button>
          
          <button
            onClick={handleSaveSettings}
            disabled={isLoading}
            className="flex items-center space-x-2 px-6 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{isLoading ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </div>
      </div>
    </div>
  )
} 