'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Bot, Brain, Zap, MessageSquare, Clock, Target, Save, RotateCcw } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { getOracleSetting, saveOracleSetting, OracleSettings } from '@/lib/user-settings-service'

type BehaviorSettings = OracleSettings['behavior']

const defaultSettings: BehaviorSettings = {
  auto_minimize: false,
  stay_on_top: true,
  click_through: false,
  smart_responses: true,
  personality: 'friendly',
  responseStyle: 'balanced',
  creativity: 70,
  temperature: 0.7,
  maxTokens: 1000,
  contextWindow: 4000,
  enableEmoji: true,
  enableHumor: false,
  enableExplanations: true,
  proactiveMode: false,
  suggestFollowUps: true,
  rememberPreferences: true,
  adaptToUser: true,
  responseDelay: 500,
  typingIndicator: true,
  customInstructions: '',
  safetyLevel: 'moderate',
  languageStyle: 'conversational',
  errorHandling: 'helpful',
}

export default function BehaviorPage() {
  const [settings, setSettings] = useState<BehaviorSettings>(defaultSettings)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  useEffect(() => {
    ;(async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        try {
          const remote = await getOracleSetting(user.id, 'behavior')
          setSettings(remote)
        } catch (error) {
          console.error('Failed to load behavior settings:', error)
        }
      }
    })()
  }, [])

  const updateSetting = (key: keyof BehaviorSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }))
    setHasUnsavedChanges(true)
  }

  const saveSettings = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (user) {
      try {
        await saveOracleSetting(user.id, 'behavior', settings)
      } catch (error) {
        console.error('Failed to save behavior settings:', error)
        toast.error('Failed to save behavior settings')
        return
      }
    }
    setHasUnsavedChanges(false)
    toast.success('Behavior settings saved successfully')
  }

  const resetSettings = () => {
    setSettings(defaultSettings)
    setHasUnsavedChanges(true)
    toast.info('Settings reset to defaults')
  }

  const personalityDescriptions = {
    professional: 'Formal, business-like responses with clear structure',
    friendly: 'Warm and approachable with helpful explanations',
    casual: 'Relaxed and conversational tone',
    creative: 'Imaginative and expressive responses',
    analytical: 'Data-driven and logical approach'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Bot className="h-5 w-5 text-primary" />
          <h2 className="text-2xl font-semibold tracking-tight">Oracle AI Chatbot - Behavior</h2>
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
          <Button 
            size="sm" 
            onClick={saveSettings}
            disabled={!hasUnsavedChanges}
          >
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>

      {/* Personality Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Brain className="h-5 w-5" />
            <span>Personality & Style</span>
          </CardTitle>
          <CardDescription>
            Configure how Oracle AI communicates and responds
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label>Personality Type</Label>
            <Select value={settings.personality} onValueChange={(value) => updateSetting('personality', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="professional">Professional</SelectItem>
                <SelectItem value="friendly">Friendly</SelectItem>
                <SelectItem value="casual">Casual</SelectItem>
                <SelectItem value="creative">Creative</SelectItem>
                <SelectItem value="analytical">Analytical</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              {personalityDescriptions[settings.personality]}
            </p>
          </div>

          <div className="space-y-3">
            <Label>Response Style</Label>
            <Select value={settings.responseStyle} onValueChange={(value) => updateSetting('responseStyle', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="concise">Concise - Brief and to the point</SelectItem>
                <SelectItem value="balanced">Balanced - Moderate detail level</SelectItem>
                <SelectItem value="detailed">Detailed - Comprehensive explanations</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label>Language Style</Label>
            <Select value={settings.languageStyle} onValueChange={(value) => updateSetting('languageStyle', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="formal">Formal - Professional language</SelectItem>
                <SelectItem value="conversational">Conversational - Natural dialogue</SelectItem>
                <SelectItem value="technical">Technical - Precise terminology</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label>Error Handling Style</Label>
            <Select value={settings.errorHandling} onValueChange={(value) => updateSetting('errorHandling', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="apologetic">Apologetic - Express regret for limitations</SelectItem>
                <SelectItem value="direct">Direct - State limitations clearly</SelectItem>
                <SelectItem value="helpful">Helpful - Suggest alternatives</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* AI Parameters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="h-5 w-5" />
            <span>AI Parameters</span>
          </CardTitle>
          <CardDescription>
            Fine-tune the AI's response generation behavior
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label>Creativity Level: {settings.creativity}%</Label>
              <Slider
                value={[settings.creativity]}
                onValueChange={(value) => updateSetting('creativity', value[0])}
                max={100}
                min={0}
                step={5}
                className="w-full"
              />
              <p className="text-sm text-muted-foreground">
                Higher values produce more creative and varied responses
              </p>
            </div>

            <div className="space-y-3">
              <Label>Temperature: {settings.temperature}</Label>
              <Slider
                value={[settings.temperature]}
                onValueChange={(value) => updateSetting('temperature', value[0])}
                max={2}
                min={0}
                step={0.1}
                className="w-full"
              />
              <p className="text-sm text-muted-foreground">
                Controls randomness in responses (0 = deterministic, 2 = very random)
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label>Max Response Length: {settings.maxTokens} tokens</Label>
              <Slider
                value={[settings.maxTokens]}
                onValueChange={(value) => updateSetting('maxTokens', value[0])}
                max={4096}
                min={256}
                step={256}
                className="w-full"
              />
            </div>

            <div className="space-y-3">
              <Label>Context Window: {settings.contextWindow} tokens</Label>
              <Slider
                value={[settings.contextWindow]}
                onValueChange={(value) => updateSetting('contextWindow', value[0])}
                max={8192}
                min={1024}
                step={512}
                className="w-full"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Interaction Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MessageSquare className="h-5 w-5" />
            <span>Interaction Behavior</span>
          </CardTitle>
          <CardDescription>
            Configure how Oracle AI interacts with users
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable Emoji</Label>
              <p className="text-sm text-muted-foreground">Use emojis in responses</p>
            </div>
            <Switch
              checked={settings.enableEmoji}
              onCheckedChange={(checked) => updateSetting('enableEmoji', checked)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable Humor</Label>
              <p className="text-sm text-muted-foreground">Include appropriate humor in responses</p>
            </div>
            <Switch
              checked={settings.enableHumor}
              onCheckedChange={(checked) => updateSetting('enableHumor', checked)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Provide Explanations</Label>
              <p className="text-sm text-muted-foreground">Explain reasoning behind responses</p>
            </div>
            <Switch
              checked={settings.enableExplanations}
              onCheckedChange={(checked) => updateSetting('enableExplanations', checked)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Proactive Mode</Label>
              <p className="text-sm text-muted-foreground">Offer help and suggestions proactively</p>
            </div>
            <Switch
              checked={settings.proactiveMode}
              onCheckedChange={(checked) => updateSetting('proactiveMode', checked)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Suggest Follow-ups</Label>
              <p className="text-sm text-muted-foreground">Recommend related questions or topics</p>
            </div>
            <Switch
              checked={settings.suggestFollowUps}
              onCheckedChange={(checked) => updateSetting('suggestFollowUps', checked)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Remember Preferences</Label>
              <p className="text-sm text-muted-foreground">Learn and adapt to user preferences</p>
            </div>
            <Switch
              checked={settings.rememberPreferences}
              onCheckedChange={(checked) => updateSetting('rememberPreferences', checked)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Adapt to User</Label>
              <p className="text-sm text-muted-foreground">Adjust communication style based on user</p>
            </div>
            <Switch
              checked={settings.adaptToUser}
              onCheckedChange={(checked) => updateSetting('adaptToUser', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Response Timing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Response Timing</span>
          </CardTitle>
          <CardDescription>
            Control response timing and visual feedback
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label>Response Delay: {settings.responseDelay}ms</Label>
            <Slider
              value={[settings.responseDelay]}
              onValueChange={(value) => updateSetting('responseDelay', value[0])}
              max={3000}
              min={0}
              step={250}
              className="w-full"
            />
            <p className="text-sm text-muted-foreground">
              Artificial delay before showing responses (makes AI seem more natural)
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Typing Indicator</Label>
              <p className="text-sm text-muted-foreground">Show "typing..." indicator while processing</p>
            </div>
            <Switch
              checked={settings.typingIndicator}
              onCheckedChange={(checked) => updateSetting('typingIndicator', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Safety & Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="h-5 w-5" />
            <span>Safety & Content</span>
          </CardTitle>
          <CardDescription>
            Configure content filtering and safety measures
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label>Safety Level</Label>
            <Select value={settings.safetyLevel} onValueChange={(value) => updateSetting('safetyLevel', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="strict">
                  <div className="space-y-1">
                    <div className="font-medium">Strict</div>
                    <div className="text-sm text-muted-foreground">Maximum content filtering</div>
                  </div>
                </SelectItem>
                <SelectItem value="moderate">
                  <div className="space-y-1">
                    <div className="font-medium">Moderate</div>
                    <div className="text-sm text-muted-foreground">Balanced content filtering</div>
                  </div>
                </SelectItem>
                <SelectItem value="permissive">
                  <div className="space-y-1">
                    <div className="font-medium">Permissive</div>
                    <div className="text-sm text-muted-foreground">Minimal content filtering</div>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Custom Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Custom Instructions</CardTitle>
          <CardDescription>
            Provide specific instructions to guide Oracle AI's behavior
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            placeholder="Enter custom instructions for Oracle AI (e.g., 'Always provide code examples when discussing programming topics', 'Use British English spelling', etc.)"
            value={settings.customInstructions}
            onChange={(e) => updateSetting('customInstructions', e.target.value)}
            rows={4}
            className="min-h-[100px]"
          />
          <p className="text-sm text-muted-foreground">
            These instructions will be included in every conversation with Oracle AI
          </p>
        </CardContent>
      </Card>
    </div>
  )
}          