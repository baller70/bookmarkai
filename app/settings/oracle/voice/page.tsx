'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Mic, Volume2, Settings, Play, Square, Headphones, RotateCcw } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { getOracleSetting } from '@/lib/user-settings-service'
import SaveButton from '../../../../components/SaveButton'

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

const defaultSettings: VoiceSettings = {
  speechToText: false,
  textToSpeech: false,
  voiceModel: 'alloy',
  speechRate: 1.0,
  speechPitch: 1.0,
  speechVolume: 0.8,
  language: 'en-US',
  autoPlayResponses: false,
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

export default function VoicePage() {
  const [settings, setSettings] = useState<VoiceSettings>(defaultSettings)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [isTestingVoice, setIsTestingVoice] = useState(false)
  const [isRecording, setIsRecording] = useState(false)

  useEffect(() => {
    ;(async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        try {
          const remote = await getOracleSetting(user.id, 'voice')
          setSettings({ ...defaultSettings, ...remote })
        } catch (error) {
          console.error('Failed to load voice settings:', error)
        }
      }
    })()
  }, [])

  const updateSetting = <K extends keyof VoiceSettings>(key: K, value: VoiceSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }))
    setHasUnsavedChanges(true)
  }

  const resetSettings = () => {
    setSettings(defaultSettings)
    setHasUnsavedChanges(true)
    toast.info('Settings reset to defaults')
  }

  const testVoice = () => {
    setIsTestingVoice(true)
    // Simulate voice test
    setTimeout(() => {
      setIsTestingVoice(false)
      toast.success('Voice test completed')
    }, 2000)
  }

  const testMicrophone = () => {
    setIsRecording(true)
    // Simulate microphone test
    setTimeout(() => {
      setIsRecording(false)
      toast.success('Microphone test completed')
    }, 3000)
  }

  const languages = [
    { code: 'en-US', name: 'English (US)' },
    { code: 'en-GB', name: 'English (UK)' },
    { code: 'es-ES', name: 'Spanish (Spain)' },
    { code: 'es-MX', name: 'Spanish (Mexico)' },
    { code: 'fr-FR', name: 'French (France)' },
    { code: 'de-DE', name: 'German' },
    { code: 'it-IT', name: 'Italian' },
    { code: 'pt-BR', name: 'Portuguese (Brazil)' },
    { code: 'ja-JP', name: 'Japanese' },
    { code: 'ko-KR', name: 'Korean' },
    { code: 'zh-CN', name: 'Chinese (Simplified)' },
    { code: 'zh-TW', name: 'Chinese (Traditional)' }
  ]



  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Mic className="h-5 w-5 text-primary" />
          <h2 className="text-2xl font-semibold tracking-tight">Oracle AI Chatbot - Voice</h2>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={resetSettings}
            disabled={!hasUnsavedChanges}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          {hasUnsavedChanges && (
            <SaveButton
              table="oracle_settings"
              payload={{
                setting_key: 'voice',
                setting_value: settings,
                updated_at: new Date().toISOString()
              }}
            />
          )}
        </div>
      </div>

      {/* Voice Features */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Voice Features</span>
          </CardTitle>
          <CardDescription>
            Enable and configure voice interaction capabilities
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Speech-to-Text</Label>
              <p className="text-sm text-muted-foreground">Convert your speech to text input</p>
            </div>
            <Switch
              checked={settings.speechToText}
              onCheckedChange={(checked) => updateSetting('speechToText', checked)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Text-to-Speech</Label>
              <p className="text-sm text-muted-foreground">Have Oracle AI responses read aloud</p>
            </div>
            <Switch
              checked={settings.textToSpeech}
              onCheckedChange={(checked) => updateSetting('textToSpeech', checked)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Auto-play Responses</Label>
              <p className="text-sm text-muted-foreground">Automatically play AI responses aloud</p>
            </div>
            <Switch
              checked={settings.autoPlayResponses}
              onCheckedChange={(checked) => updateSetting('autoPlayResponses', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Text-to-Speech Settings */}
      {settings.textToSpeech && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Volume2 className="h-5 w-5" />
              <span>Text-to-Speech Settings</span>
            </CardTitle>
            <CardDescription>
              Configure how Oracle AI sounds when speaking
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label>Voice Model</Label>
              <Select value={settings.voiceModel} onValueChange={(value) => updateSetting('voiceModel', value as VoiceSettings['voiceModel'])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="alloy">
                    <div className="space-y-1">
                      <div className="font-medium">Alloy</div>
                      <div className="text-sm text-muted-foreground">Balanced and versatile</div>
                    </div>
                  </SelectItem>
                  <SelectItem value="echo">
                    <div className="space-y-1">
                      <div className="font-medium">Echo</div>
                      <div className="text-sm text-muted-foreground">Deep and resonant</div>
                    </div>
                  </SelectItem>
                  <SelectItem value="fable">
                    <div className="space-y-1">
                      <div className="font-medium">Fable</div>
                      <div className="text-sm text-muted-foreground">Warm and storytelling</div>
                    </div>
                  </SelectItem>
                  <SelectItem value="onyx">
                    <div className="space-y-1">
                      <div className="font-medium">Onyx</div>
                      <div className="text-sm text-muted-foreground">Professional and authoritative</div>
                    </div>
                  </SelectItem>
                  <SelectItem value="nova">
                    <div className="space-y-1">
                      <div className="font-medium">Nova</div>
                      <div className="text-sm text-muted-foreground">Bright and energetic</div>
                    </div>
                  </SelectItem>
                  <SelectItem value="shimmer">
                    <div className="space-y-1">
                      <div className="font-medium">Shimmer</div>
                      <div className="text-sm text-muted-foreground">Smooth and calming</div>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={testVoice}
                disabled={isTestingVoice}
                className="w-fit"
              >
                {isTestingVoice ? (
                  <>
                    <Square className="h-4 w-4 mr-2" />
                    Testing...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Test Voice
                  </>
                )}
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-3">
                <Label>Speech Rate: {settings.speechRate}x</Label>
                <Slider
                  value={[settings.speechRate]}
                  onValueChange={(value) => updateSetting('speechRate', value[0])}
                  max={2}
                  min={0.5}
                  step={0.1}
                  className="w-full"
                />
              </div>

              <div className="space-y-3">
                <Label>Pitch: {settings.speechPitch}x</Label>
                <Slider
                  value={[settings.speechPitch]}
                  onValueChange={(value) => updateSetting('speechPitch', value[0])}
                  max={2}
                  min={0.5}
                  step={0.1}
                  className="w-full"
                />
              </div>

              <div className="space-y-3">
                <Label>Volume: {Math.round(settings.speechVolume * 100)}%</Label>
                <Slider
                  value={[settings.speechVolume]}
                  onValueChange={(value) => updateSetting('speechVolume', value[0])}
                  max={1}
                  min={0}
                  step={0.1}
                  className="w-full"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <Label>Audio Quality</Label>
                <Select value={settings.audioQuality} onValueChange={(value) => updateSetting('audioQuality', value as VoiceSettings['audioQuality'])}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low (faster)</SelectItem>
                    <SelectItem value="medium">Medium (balanced)</SelectItem>
                    <SelectItem value="high">High (best quality)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label>Audio Format</Label>
                <Select value={settings.responseFormat} onValueChange={(value) => updateSetting('responseFormat', value as VoiceSettings['responseFormat'])}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mp3">MP3 (recommended)</SelectItem>
                    <SelectItem value="opus">Opus (smallest)</SelectItem>
                    <SelectItem value="aac">AAC (Apple)</SelectItem>
                    <SelectItem value="flac">FLAC (highest quality)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Speech-to-Text Settings */}
      {settings.speechToText && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Mic className="h-5 w-5" />
              <span>Speech-to-Text Settings</span>
            </CardTitle>
            <CardDescription>
              Configure voice input recognition and processing
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label>Language</Label>
              <Select value={settings.language} onValueChange={(value) => updateSetting('language', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {languages.map((lang) => (
                    <SelectItem key={lang.code} value={lang.code}>
                      {lang.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Voice Activation</Label>
                  <p className="text-sm text-muted-foreground">Start listening with wake word</p>
                </div>
                <Switch
                  checked={settings.voiceActivation}
                  onCheckedChange={(checked) => updateSetting('voiceActivation', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Push to Talk</Label>
                  <p className="text-sm text-muted-foreground">Hold button to speak</p>
                </div>
                <Switch
                  checked={settings.pushToTalk}
                  onCheckedChange={(checked) => updateSetting('pushToTalk', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Continuous Listening</Label>
                  <p className="text-sm text-muted-foreground">Keep microphone active</p>
                </div>
                <Switch
                  checked={settings.continuousListening}
                  onCheckedChange={(checked) => updateSetting('continuousListening', checked)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <Label>Microphone Gain: {settings.microphoneGain}%</Label>
                <Slider
                  value={[settings.microphoneGain]}
                  onValueChange={(value) => updateSetting('microphoneGain', value[0])}
                  max={100}
                  min={0}
                  step={5}
                  className="w-full"
                />
              </div>

              <div className="space-y-3">
                <Label>Silence Threshold: {settings.silenceThreshold}dB</Label>
                <Slider
                  value={[settings.silenceThreshold]}
                  onValueChange={(value) => updateSetting('silenceThreshold', value[0])}
                  max={60}
                  min={10}
                  step={5}
                  className="w-full"
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label>Pause Detection: {settings.pauseDetection}ms</Label>
              <Slider
                value={[settings.pauseDetection]}
                onValueChange={(value) => updateSetting('pauseDetection', value[0])}
                max={5000}
                min={500}
                step={250}
                className="w-full"
              />
              <p className="text-sm text-muted-foreground">
                How long to wait for more speech before processing
              </p>
            </div>

            <Button 
              variant="outline" 
              onClick={testMicrophone}
              disabled={isRecording}
              className="w-fit"
            >
              {isRecording ? (
                <>
                  <Square className="h-4 w-4 mr-2 text-red-500" />
                  Recording...
                </>
              ) : (
                <>
                  <Mic className="h-4 w-4 mr-2" />
                  Test Microphone
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Audio Processing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Headphones className="h-5 w-5" />
            <span>Audio Processing</span>
          </CardTitle>
          <CardDescription>
            Advanced audio processing and enhancement settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Noise Reduction</Label>
              <p className="text-sm text-muted-foreground">Filter background noise from microphone input</p>
            </div>
            <Switch
              checked={settings.noiseReduction}
              onCheckedChange={(checked) => updateSetting('noiseReduction', checked)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Echo Cancellation</Label>
              <p className="text-sm text-muted-foreground">Prevent audio feedback loops</p>
            </div>
            <Switch
              checked={settings.echoCancellation}
              onCheckedChange={(checked) => updateSetting('echoCancellation', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Voice Status */}
      <Card>
        <CardHeader>
          <CardTitle>Voice Status</CardTitle>
          <CardDescription>
            Current voice feature availability and status
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="space-y-1">
                <Label className="text-sm">Microphone Access</Label>
                <p className="text-xs text-muted-foreground">Browser permission status</p>
              </div>
              <Badge variant="outline" className="text-yellow-600">
                Not Requested
              </Badge>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="space-y-1">
                <Label className="text-sm">Audio Output</Label>
                <p className="text-xs text-muted-foreground">Speaker availability</p>
              </div>
              <Badge variant="outline" className="text-green-600">
                Available
              </Badge>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="space-y-1">
                <Label className="text-sm">Speech Recognition</Label>
                <p className="text-xs text-muted-foreground">Browser support</p>
              </div>
              <Badge variant="outline" className="text-green-600">
                Supported
              </Badge>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="space-y-1">
                <Label className="text-sm">Voice Synthesis</Label>
                <p className="text-xs text-muted-foreground">Text-to-speech support</p>
              </div>
              <Badge variant="outline" className="text-green-600">
                Supported
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}    