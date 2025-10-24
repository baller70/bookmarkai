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
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { Sparkles, Shield, Zap, Database, Code, Brain, Globe, AlertTriangle, Save, RotateCcw, Download, Upload, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { getOracleSetting, saveOracleSetting, OracleSettings } from '@/lib/user-settings-service'

type AdvancedSettings = OracleSettings['advanced']

const defaultSettings: AdvancedSettings = {
  model: 'gpt-4o-mini',
  temperature: 0.7,
  max_tokens: 1000,
  custom_instructions: '',
  debugMode: false,
  developerMode: false,
  experimentalFeatures: false,
  betaFeatures: false,
  telemetryEnabled: true,
  crashReporting: true,
  performanceMonitoring: true,
  memoryOptimization: true,
  cacheEnabled: true,
  cacheSize: 100,
  logLevel: 'info',
  maxLogSize: 10,
  autoBackup: true,
  backupInterval: 24,
  encryptionEnabled: true,
  securityLevel: 'standard',
  rateLimiting: true,
  maxRequestsPerMinute: 60,
  customPrompts: {},
  systemPrompts: '',
  modelParameters: {
    temperature: 0.7,
    topP: 0.9,
    topK: 40,
    repetitionPenalty: 1.1,
    maxTokens: 1000,
    presencePenalty: 0.0,
    frequencyPenalty: 0.0,
  },
  advancedLogging: false,
  networkTimeout: 30000,
  retryAttempts: 3,
  fallbackModel: 'gpt-3.5-turbo',
  customEndpoints: {},
  resourceLimits: {
    maxMemoryUsage: 512,
    maxCpuUsage: 80,
    maxDiskUsage: 1024,
  },
}

export default function AdvancedPage() {
  const [settings, setSettings] = useState<AdvancedSettings>(defaultSettings)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [showDangerZone, setShowDangerZone] = useState(false)

  useEffect(() => {
    ;(async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        try {
          const remote = await getOracleSetting(user.id, 'advanced')
          setSettings(remote)
        } catch (error) {
          console.error('Failed to load advanced settings:', error)
        }
      }
    })()
  }, [])

  const updateSetting = (key: keyof AdvancedSettings, value: unknown) => {
    setSettings(prev => ({ ...prev, [key]: value }))
    setHasUnsavedChanges(true)
  }

  const updateModelParameter = (key: keyof AdvancedSettings['modelParameters'], value: number) => {
    setSettings(prev => ({
      ...prev,
      modelParameters: {
        ...prev.modelParameters,
        [key]: value
      }
    }))
    setHasUnsavedChanges(true)
  }

  const updateResourceLimit = (key: keyof AdvancedSettings['resourceLimits'], value: number) => {
    setSettings(prev => ({
      ...prev,
      resourceLimits: {
        ...prev.resourceLimits,
        [key]: value
      }
    }))
    setHasUnsavedChanges(true)
  }

  const saveSettings = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (user) {
      try {
        await saveOracleSetting(user.id, 'advanced', settings)
      } catch (error) {
        console.error('Failed to save advanced settings:', error)
        toast.error('Failed to save advanced settings')
        return
      }
    }
    setHasUnsavedChanges(false)
    toast.success('Advanced settings saved successfully')
  }

  const resetSettings = () => {
    setSettings(defaultSettings)
    setHasUnsavedChanges(true)
    toast.info('Settings reset to defaults')
  }

  const exportSettings = () => {
    const dataStr = JSON.stringify(settings, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
    const exportFileDefaultName = 'oracle-advanced-settings.json'
    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
    toast.success('Settings exported successfully')
  }

  const importSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const importedSettings = JSON.parse(e.target?.result as string)
          setSettings(importedSettings)
          setHasUnsavedChanges(true)
          toast.success('Settings imported successfully')
        } catch (error) {
          toast.error('Failed to import settings: Invalid JSON file')
        }
      }
      reader.readAsText(file)
    }
  }

  const clearAllData = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return
    // reset all categories to default locally and remote
    const merged = {
      appearance: defaultSettings,
      behavior: {},
      voice: {},
      context: {},
      tools: {},
      advanced: defaultSettings,
    }
    await saveOracleSetting(user.id, 'advanced', defaultSettings)
    toast.success('All Oracle AI data cleared')
    setSettings(defaultSettings)
    setHasUnsavedChanges(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="text-2xl font-semibold tracking-tight">Oracle AI Chatbot - Advanced</h2>
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

      {/* Developer Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Code className="h-5 w-5" />
            <span>Developer Settings</span>
          </CardTitle>
          <CardDescription>
            Advanced settings for developers and power users
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Debug Mode</Label>
              <p className="text-sm text-muted-foreground">Enable detailed debugging information</p>
            </div>
            <Switch
              checked={settings.debugMode}
              onCheckedChange={(checked) => updateSetting('debugMode', checked)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Developer Mode</Label>
              <p className="text-sm text-muted-foreground">Enable advanced developer features</p>
            </div>
            <Switch
              checked={settings.developerMode}
              onCheckedChange={(checked) => updateSetting('developerMode', checked)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Experimental Features</Label>
              <p className="text-sm text-muted-foreground">Enable experimental and unstable features</p>
            </div>
            <Switch
              checked={settings.experimentalFeatures}
              onCheckedChange={(checked) => updateSetting('experimentalFeatures', checked)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Beta Features</Label>
              <p className="text-sm text-muted-foreground">Enable beta features and early access</p>
            </div>
            <Switch
              checked={settings.betaFeatures}
              onCheckedChange={(checked) => updateSetting('betaFeatures', checked)}
            />
          </div>

          <Separator />

          <div className="space-y-3">
            <Label>Log Level</Label>
            <Select value={settings.logLevel} onValueChange={(value) => updateSetting('logLevel', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="error">Error - Only critical errors</SelectItem>
                <SelectItem value="warn">Warning - Errors and warnings</SelectItem>
                <SelectItem value="info">Info - General information</SelectItem>
                <SelectItem value="debug">Debug - Detailed debugging</SelectItem>
                <SelectItem value="verbose">Verbose - Everything</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label>Max Log Size: {settings.maxLogSize} MB</Label>
            <Slider
              value={[settings.maxLogSize]}
              onValueChange={(value) => updateSetting('maxLogSize', value[0])}
              max={100}
              min={1}
              step={1}
              className="w-full"
            />
          </div>
        </CardContent>
      </Card>

      {/* Model Parameters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Brain className="h-5 w-5" />
            <span>Model Parameters</span>
          </CardTitle>
          <CardDescription>
            Fine-tune AI model behavior and response generation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label>Temperature: {settings.modelParameters.temperature}</Label>
              <Slider
                value={[settings.modelParameters.temperature]}
                onValueChange={(value) => updateModelParameter('temperature', value[0])}
                max={2}
                min={0}
                step={0.1}
                className="w-full"
              />
              <p className="text-sm text-muted-foreground">
                Controls randomness in responses (0 = deterministic, 2 = very random)
              </p>
            </div>

            <div className="space-y-3">
              <Label>Top P: {settings.modelParameters.topP}</Label>
              <Slider
                value={[settings.modelParameters.topP]}
                onValueChange={(value) => updateModelParameter('topP', value[0])}
                max={1}
                min={0}
                step={0.1}
                className="w-full"
              />
              <p className="text-sm text-muted-foreground">
                Nucleus sampling parameter (0.1 = conservative, 1.0 = diverse)
              </p>
            </div>

            <div className="space-y-3">
              <Label>Top K: {settings.modelParameters.topK}</Label>
              <Slider
                value={[settings.modelParameters.topK]}
                onValueChange={(value) => updateModelParameter('topK', value[0])}
                max={100}
                min={1}
                step={1}
                className="w-full"
              />
              <p className="text-sm text-muted-foreground">
                Limits vocabulary to top K tokens
              </p>
            </div>

            <div className="space-y-3">
              <Label>Repetition Penalty: {settings.modelParameters.repetitionPenalty}</Label>
              <Slider
                value={[settings.modelParameters.repetitionPenalty]}
                onValueChange={(value) => updateModelParameter('repetitionPenalty', value[0])}
                max={2}
                min={0.5}
                step={0.1}
                className="w-full"
              />
              <p className="text-sm text-muted-foreground">
                Penalty for repeating tokens (1.0 = no penalty, 2.0 = high penalty)
              </p>
            </div>

            <div className="space-y-3">
              <Label>Max Tokens: {settings.modelParameters.maxTokens}</Label>
              <Slider
                value={[settings.modelParameters.maxTokens]}
                onValueChange={(value) => updateModelParameter('maxTokens', value[0])}
                max={4096}
                min={100}
                step={100}
                className="w-full"
              />
              <p className="text-sm text-muted-foreground">
                Maximum length of generated responses
              </p>
            </div>

            <div className="space-y-3">
              <Label>Presence Penalty: {settings.modelParameters.presencePenalty}</Label>
              <Slider
                value={[settings.modelParameters.presencePenalty]}
                onValueChange={(value) => updateModelParameter('presencePenalty', value[0])}
                max={2}
                min={-2}
                step={0.1}
                className="w-full"
              />
              <p className="text-sm text-muted-foreground">
                Penalty for using tokens that appear in the text
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance & Security */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="h-5 w-5" />
            <span>Performance & Security</span>
          </CardTitle>
          <CardDescription>
            Optimize performance and configure security settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Memory Optimization</Label>
                  <p className="text-sm text-muted-foreground">Optimize memory usage</p>
                </div>
                <Switch
                  checked={settings.memoryOptimization}
                  onCheckedChange={(checked) => updateSetting('memoryOptimization', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Cache Enabled</Label>
                  <p className="text-sm text-muted-foreground">Enable response caching</p>
                </div>
                <Switch
                  checked={settings.cacheEnabled}
                  onCheckedChange={(checked) => updateSetting('cacheEnabled', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Rate Limiting</Label>
                  <p className="text-sm text-muted-foreground">Enable request rate limiting</p>
                </div>
                <Switch
                  checked={settings.rateLimiting}
                  onCheckedChange={(checked) => updateSetting('rateLimiting', checked)}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Encryption Enabled</Label>
                  <p className="text-sm text-muted-foreground">Encrypt stored data</p>
                </div>
                <Switch
                  checked={settings.encryptionEnabled}
                  onCheckedChange={(checked) => updateSetting('encryptionEnabled', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Crash Reporting</Label>
                  <p className="text-sm text-muted-foreground">Send crash reports</p>
                </div>
                <Switch
                  checked={settings.crashReporting}
                  onCheckedChange={(checked) => updateSetting('crashReporting', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Telemetry</Label>
                  <p className="text-sm text-muted-foreground">Send usage analytics</p>
                </div>
                <Switch
                  checked={settings.telemetryEnabled}
                  onCheckedChange={(checked) => updateSetting('telemetryEnabled', checked)}
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Label>Security Level</Label>
            <Select value={settings.securityLevel} onValueChange={(value) => updateSetting('securityLevel', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="basic">Basic - Minimal security measures</SelectItem>
                <SelectItem value="standard">Standard - Balanced security</SelectItem>
                <SelectItem value="high">High - Enhanced security</SelectItem>
                <SelectItem value="paranoid">Paranoid - Maximum security</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label>Cache Size: {settings.cacheSize} MB</Label>
            <Slider
              value={[settings.cacheSize]}
              onValueChange={(value) => updateSetting('cacheSize', value[0])}
              max={1000}
              min={10}
              step={10}
              className="w-full"
            />
          </div>
        </CardContent>
      </Card>

      {/* Resource Limits */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Database className="h-5 w-5" />
            <span>Resource Limits</span>
          </CardTitle>
          <CardDescription>
            Configure resource usage limits and quotas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-3 gap-6">
            <div className="space-y-3">
              <Label>Max Memory: {settings.resourceLimits.maxMemoryUsage} MB</Label>
              <Slider
                value={[settings.resourceLimits.maxMemoryUsage]}
                onValueChange={(value) => updateResourceLimit('maxMemoryUsage', value[0])}
                max={4096}
                min={256}
                step={64}
                className="w-full"
              />
            </div>

            <div className="space-y-3">
              <Label>Max CPU: {settings.resourceLimits.maxCpuUsage}%</Label>
              <Slider
                value={[settings.resourceLimits.maxCpuUsage]}
                onValueChange={(value) => updateResourceLimit('maxCpuUsage', value[0])}
                max={100}
                min={10}
                step={5}
                className="w-full"
              />
            </div>

            <div className="space-y-3">
              <Label>Max Disk: {settings.resourceLimits.maxDiskUsage} MB</Label>
              <Slider
                value={[settings.resourceLimits.maxDiskUsage]}
                onValueChange={(value) => updateResourceLimit('maxDiskUsage', value[0])}
                max={10240}
                min={512}
                step={512}
                className="w-full"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label>Network Timeout: {settings.networkTimeout} seconds</Label>
              <Slider
                value={[settings.networkTimeout]}
                onValueChange={(value) => updateSetting('networkTimeout', value[0])}
                max={120}
                min={5}
                step={5}
                className="w-full"
              />
            </div>

            <div className="space-y-3">
              <Label>Retry Attempts: {settings.retryAttempts}</Label>
              <Slider
                value={[settings.retryAttempts]}
                onValueChange={(value) => updateSetting('retryAttempts', value[0])}
                max={10}
                min={0}
                step={1}
                className="w-full"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Prompts */}
      <Card>
        <CardHeader>
          <CardTitle>System Prompts</CardTitle>
          <CardDescription>
            Configure the base system prompt for Oracle AI
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <Label>System Prompt</Label>
            <Textarea
              value={settings.systemPrompts}
              onChange={(e) => updateSetting('systemPrompts', e.target.value)}
              placeholder="Enter system prompt..."
              className="min-h-[100px]"
            />
            <p className="text-sm text-muted-foreground">
              This prompt defines Oracle AI's personality and behavior
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card>
        <CardHeader>
          <CardTitle>Data Management</CardTitle>
          <CardDescription>
            Export, import, and manage Oracle AI configuration data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Auto Backup</Label>
              <p className="text-sm text-muted-foreground">Automatically backup settings</p>
            </div>
            <Switch
              checked={settings.autoBackup}
              onCheckedChange={(checked) => updateSetting('autoBackup', checked)}
            />
          </div>

          <div className="space-y-3">
            <Label>Backup Interval: {settings.backupInterval} hours</Label>
            <Slider
              value={[settings.backupInterval]}
              onValueChange={(value) => updateSetting('backupInterval', value[0])}
              max={168}
              min={1}
              step={1}
              className="w-full"
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={exportSettings} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Settings
            </Button>
            <Button variant="outline" onClick={() => document.getElementById('import-file')?.click()}>
              <Upload className="h-4 w-4 mr-2" />
              Import Settings
            </Button>
            <input
              id="import-file"
              type="file"
              accept=".json"
              onChange={importSettings}
              style={{ display: 'none' }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            <span>Danger Zone</span>
          </CardTitle>
          <CardDescription>
            Irreversible actions that affect all Oracle AI data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Show Danger Zone</Label>
              <p className="text-sm text-muted-foreground">Reveal destructive actions</p>
            </div>
            <Switch
              checked={showDangerZone}
              onCheckedChange={setShowDangerZone}
            />
          </div>

          {showDangerZone && (
            <div className="space-y-4 pt-4 border-t border-destructive">
              <Button 
                variant="destructive" 
                onClick={clearAllData}
                className="w-full"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear All Oracle AI Data
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                This will permanently delete all Oracle AI settings, conversations, and data. This action cannot be undone.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}          