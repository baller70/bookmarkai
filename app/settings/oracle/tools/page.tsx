'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { Wrench, Code, Search, Calculator, Globe, Database, Image, FileText, Calendar, Mail, Save, RotateCcw, Plus, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { getOracleSetting, saveOracleSetting } from '@/lib/user-settings-service'

interface ToolsSettings {
  web_search: boolean
  code_execution: boolean
  file_operations: boolean
  system_integration: boolean
  allowedDomains: string[]
  blockedDomains: string[]
  apiKeys: { [key: string]: string }
  rateLimits: { [key: string]: number }
  securityLevel: 'basic' | 'standard' | 'strict'
  sandboxMode: boolean
  logToolUsage: boolean
}

const defaultSettings: ToolsSettings = {
  web_search: true,
  code_execution: false,
  file_operations: false,
  system_integration: false,
  allowedDomains: ['wikipedia.org', 'github.com', 'stackoverflow.com'],
  blockedDomains: [],
  apiKeys: {},
  rateLimits: {},
  securityLevel: 'standard',
  sandboxMode: true,
  logToolUsage: true
}

export default function ToolsPage() {
  const [settings, setSettings] = useState<ToolsSettings>(defaultSettings)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [newDomain, setNewDomain] = useState('')
  const [newApiKey, setNewApiKey] = useState({ name: '', key: '' })
  const [showApiKeys, setShowApiKeys] = useState(false)

  useEffect(() => {
    ;(async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        try {
          const remote = await getOracleSetting(user.id, 'tools')
          setSettings(remote as any)
        } catch (error) {
          console.error('Failed to load tools settings:', error)
        }
      }
    })()
  }, [])

  const updateSetting = (key: keyof ToolsSettings, value: unknown) => {
    setSettings(prev => ({ ...prev, [key]: value }))
    setHasUnsavedChanges(true)
  }

  const saveSettings = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (user) {
      try {
        await saveOracleSetting(user.id, 'tools', settings)
      } catch (error) {
        console.error('Failed to save tools settings:', error)
        toast.error('Failed to save tools settings')
        return
      }
    }
    setHasUnsavedChanges(false)
    toast.success('Tools settings saved successfully')
  }

  const resetSettings = () => {
    setSettings(defaultSettings)
    setHasUnsavedChanges(true)
    toast.info('Settings reset to defaults')
  }

  const addDomain = (type: 'allowed' | 'blocked') => {
    if (newDomain.trim()) {
      const key = type === 'allowed' ? 'allowedDomains' : 'blockedDomains'
      const currentDomains = settings[key]
      if (!currentDomains.includes(newDomain.trim())) {
        updateSetting(key, [...currentDomains, newDomain.trim()])
        setNewDomain('')
      }
    }
  }

  const removeDomain = (domain: string, type: 'allowed' | 'blocked') => {
    const key = type === 'allowed' ? 'allowedDomains' : 'blockedDomains'
    const currentDomains = settings[key]
    updateSetting(key, currentDomains.filter(d => d !== domain))
  }

  const addApiKey = () => {
    if (newApiKey.name.trim() && newApiKey.key.trim()) {
      updateSetting('apiKeys', {
        ...settings.apiKeys,
        [newApiKey.name.trim()]: newApiKey.key.trim()
      })
      setNewApiKey({ name: '', key: '' })
    }
  }

  const removeApiKey = (name: string) => {
    const updatedKeys = { ...settings.apiKeys }
    delete updatedKeys[name]
    updateSetting('apiKeys', updatedKeys)
  }

  const tools = [
    { key: 'webSearch', label: 'Web Search', icon: Search, description: 'Search the internet for information' },
    { key: 'codeExecution', label: 'Code Execution', icon: Code, description: 'Execute code snippets (Python, JavaScript, etc.)' },
    { key: 'calculator', label: 'Calculator', icon: Calculator, description: 'Perform mathematical calculations' },
    { key: 'fileAccess', label: 'File Access', icon: FileText, description: 'Read and write files on the system' },
    { key: 'imageGeneration', label: 'Image Generation', icon: Image, description: 'Generate images using AI' },
    { key: 'imageAnalysis', label: 'Image Analysis', icon: Image, description: 'Analyze and describe images' },
    { key: 'documentProcessing', label: 'Document Processing', icon: FileText, description: 'Process PDF, Word, and other documents' },
    { key: 'calendarIntegration', label: 'Calendar Integration', icon: Calendar, description: 'Access and manage calendar events' },
    { key: 'emailIntegration', label: 'Email Integration', icon: Mail, description: 'Send and receive emails' },
    { key: 'databaseAccess', label: 'Database Access', icon: Database, description: 'Query and update databases' },
    { key: 'apiIntegrations', label: 'API Integrations', icon: Globe, description: 'Connect to external APIs and services' },
    { key: 'customTools', label: 'Custom Tools', icon: Wrench, description: 'Use custom-built tools and plugins' }
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Wrench className="h-5 w-5 text-primary" />
          <h2 className="text-2xl font-semibold tracking-tight">Oracle AI Chatbot - Tools</h2>
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

      {/* Available Tools */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Wrench className="h-5 w-5" />
            <span>Available Tools</span>
          </CardTitle>
          <CardDescription>
            Enable or disable tools that Oracle AI can use to assist you
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {tools.map((tool, index) => (
            <div key={tool.key}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <tool.icon className="h-5 w-5 text-muted-foreground" />
                  <div className="space-y-0.5">
                    <Label>{tool.label}</Label>
                    <p className="text-sm text-muted-foreground">{tool.description}</p>
                  </div>
                </div>
                <Switch
                  checked={settings[tool.key as keyof ToolsSettings] as boolean}
                  onCheckedChange={(checked) => updateSetting(tool.key as keyof ToolsSettings, checked)}
                />
              </div>
              {index < tools.length - 1 && <Separator className="mt-4" />}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Tool Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Tool Configuration</CardTitle>
          <CardDescription>
            Configure how tools behave and interact
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label>Security Level</Label>
            <Select value={settings.securityLevel} onValueChange={(value) => updateSetting('securityLevel', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="basic">Basic - Minimal security restrictions</SelectItem>
                <SelectItem value="standard">Standard - Balanced security and functionality</SelectItem>
                <SelectItem value="strict">Strict - Maximum security, limited functionality</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Sandbox Mode</Label>
                <p className="text-sm text-muted-foreground">Run tools in a secure sandbox environment</p>
              </div>
              <Switch
                checked={settings.sandboxMode}
                onCheckedChange={(checked) => updateSetting('sandboxMode', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Tool Usage Logging</Label>
                <p className="text-sm text-muted-foreground">Log all tool usage for debugging and analysis</p>
              </div>
              <Switch
                checked={settings.logToolUsage}
                onCheckedChange={(checked) => updateSetting('logToolUsage', checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Domain Management */}
      <Card>
        <CardHeader>
          <CardTitle>Domain Management</CardTitle>
          <CardDescription>
            Control which domains Oracle AI can access for web-based tools
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-3">
              <Label>Allowed Domains</Label>
              <div className="flex flex-wrap gap-2">
                {settings.allowedDomains.map((domain) => (
                  <Badge key={domain} variant="secondary" className="flex items-center gap-1">
                    {domain}
                    <button
                      onClick={() => removeDomain(domain, 'allowed')}
                      className="ml-1 hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Add allowed domain..."
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addDomain('allowed')}
                />
                <Button onClick={() => addDomain('allowed')} disabled={!newDomain.trim()}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <Label>Blocked Domains</Label>
              <div className="flex flex-wrap gap-2">
                {settings.blockedDomains.map((domain) => (
                  <Badge key={domain} variant="destructive" className="flex items-center gap-1">
                    {domain}
                    <button
                      onClick={() => removeDomain(domain, 'blocked')}
                      className="ml-1 hover:text-destructive-foreground"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Add blocked domain..."
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addDomain('blocked')}
                />
                <Button onClick={() => addDomain('blocked')} disabled={!newDomain.trim()}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* API Keys Management */}
      <Card>
        <CardHeader>
          <CardTitle>API Keys Management</CardTitle>
          <CardDescription>
            Manage API keys for external services and integrations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Show API Keys</Label>
            <Switch
              checked={showApiKeys}
              onCheckedChange={setShowApiKeys}
            />
          </div>

          {showApiKeys && (
            <div className="space-y-4">
              <div className="space-y-3">
                <Label>Custom API Keys</Label>
                <div className="space-y-2">
                  {Object.entries(settings.apiKeys).map(([name, key]) => (
                    <div key={name} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{name}</div>
                        <div className="text-sm text-muted-foreground font-mono">
                          {key.substring(0, 8)}...{key.substring(key.length - 4)}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeApiKey(name)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label>Add New API Key</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Service name..."
                    value={newApiKey.name}
                    onChange={(e) => setNewApiKey(prev => ({ ...prev, name: e.target.value }))}
                  />
                  <Input
                    placeholder="API key..."
                    type="password"
                    value={newApiKey.key}
                    onChange={(e) => setNewApiKey(prev => ({ ...prev, key: e.target.value }))}
                  />
                </div>
                <Button 
                  onClick={addApiKey} 
                  disabled={!newApiKey.name.trim() || !newApiKey.key.trim()}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add API Key
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tool Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Tool Statistics</CardTitle>
          <CardDescription>
            Usage statistics for Oracle AI tools
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg text-center">
              <div className="text-2xl font-bold">24</div>
              <div className="text-sm text-muted-foreground">Tools Used Today</div>
            </div>
            <div className="p-4 border rounded-lg text-center">
              <div className="text-2xl font-bold">156</div>
              <div className="text-sm text-muted-foreground">Total Tool Calls</div>
            </div>
            <div className="p-4 border rounded-lg text-center">
              <div className="text-2xl font-bold">98%</div>
              <div className="text-sm text-muted-foreground">Success Rate</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}              