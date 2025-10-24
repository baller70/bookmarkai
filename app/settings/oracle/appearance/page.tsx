'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { Eye, Palette, Waves, Zap, Volume2, Sparkles, Save, RotateCcw } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { getOracleSetting, saveOracleSetting, OracleSettings } from '@/lib/user-settings-service'

type OracleAppearanceSettings = OracleSettings['appearance']

const defaultSettings: OracleAppearanceSettings = {
  theme: 'auto',
  size: 'medium',
  position: 'bottom-right',
  opacity: 0.9,
  blur_background: true,
  show_animations: true,
  primaryColor: '#3B82F6',
  secondaryColor: '#8B5CF6',
  gradientDirection: 'linear',
  gradientIntensity: 80,
  blobSize: 60,
  blobFluidness: 60,
  blobRoundness: 75,
  morphingSpeed: 50,
  voiceVisualization: true,
  voiceBarsCount: 6,
  voiceBarsHeight: 30,
  voiceBarsSpacing: 3,
  voiceReactivity: 80,
  idleAnimation: true,
  idleAnimationSpeed: 30,
  pulseEffect: true,
  pulseIntensity: 20,
  glowEffect: true,
  glowIntensity: 50,
  floatingBehavior: true,
  floatingRange: 10,
  rotationEffect: false,
  rotationSpeed: 20,
  blobOpacity: 85,
  backgroundBlur: 2,
  adaptToSystemTheme: true,
  darkModeAdjustment: 15,
}

export default function OracleAppearancePage() {
  const [settings, setSettings] = useState<OracleAppearanceSettings>(defaultSettings)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  useEffect(() => {
    ;(async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        try {
          const remote = await getOracleSetting(user.id, 'appearance')
          setSettings(remote)
        } catch (error) {
          console.error('Failed to load Oracle appearance settings:', error)
        }
      }
    })()
  }, [])

  const updateSetting = (key: keyof OracleAppearanceSettings, value: string | number | boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }))
    setHasUnsavedChanges(true)
  }

  const saveSettings = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (user) {
      try {
        await saveOracleSetting(user.id, 'appearance', settings)
      } catch (error) {
        console.error('Failed to save Oracle appearance settings:', error)
        toast.error('Failed to save Oracle appearance settings')
        return
      }
    }

    setHasUnsavedChanges(false)
    toast.success('Oracle appearance settings saved successfully')

    // Trigger Oracle blob update by dispatching a custom event
    window.dispatchEvent(
      new CustomEvent('oracleSettingsUpdated', {
        detail: settings,
      }),
    )
  }

  const resetSettings = () => {
    setSettings(defaultSettings)
    setHasUnsavedChanges(true)
    toast.info('Oracle appearance reset to defaults')
  }

  const presetColors = [
    { name: 'Default', primary: '#3B82F6', secondary: '#8B5CF6' },
    { name: 'Ocean', primary: '#00d4ff', secondary: '#6366f1' },
    { name: 'Sunset', primary: '#ff6b6b', secondary: '#ffd93d' },
    { name: 'Forest', primary: '#4ecdc4', secondary: '#44a08d' },
    { name: 'Fire', primary: '#ff9a9e', secondary: '#fecfef' },
    { name: 'Aurora', primary: '#a18cd1', secondary: '#fbc2eb' }
  ]

  const getGradientStyle = () => {
    const direction = settings.gradientDirection === 'linear' ? 'linear-gradient(135deg,' :
                     settings.gradientDirection === 'radial' ? 'radial-gradient(circle,' :
                     'conic-gradient(from 0deg,'
    
    return {
      background: `${direction} ${settings.primaryColor} 0%, ${settings.secondaryColor} 100%)`,
      opacity: settings.blobOpacity / 100,
      filter: `blur(${settings.backgroundBlur}px)`,
      borderRadius: `${settings.blobRoundness}%`
    }
  }

  // Fixed heights for voice bars to prevent hydration mismatch
  const voiceBarHeights = [0.4, 0.7, 0.3, 0.9, 0.6, 0.8, 0.5, 0.4, 0.9, 0.7, 0.6, 0.8, 0.5, 0.3, 0.7]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Eye className="h-5 w-5 text-primary" />
          <h2 className="text-2xl font-semibold tracking-tight">Oracle AI Chatbot - Appearance</h2>
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

      {/* Live Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Sparkles className="h-5 w-5" />
            <span>Live Oracle Preview</span>
          </CardTitle>
          <CardDescription>
            See your Oracle blob in real-time with current settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8 bg-muted/20 rounded-lg min-h-[300px]">
            <div className="relative">
              {/* Oracle Blob */}
              <div 
                className="relative transition-all duration-1000 ease-in-out"
                style={getGradientStyle()}
              >
                <div 
                  className="relative overflow-hidden"
                  style={{
                    width: `${settings.blobSize}px`,
                    height: `${settings.blobSize}px`,
                    borderRadius: `${settings.blobRoundness}% ${settings.blobRoundness - 10}% ${settings.blobRoundness + 5}% ${settings.blobRoundness - 5}%`,
                    animation: settings.idleAnimation ? `oracleFloat ${3000 / (settings.idleAnimationSpeed / 30)}ms ease-in-out infinite` : 'none'
                  }}
                >
                  {/* Voice Visualization Bars */}
                  {settings.voiceVisualization && (
                    <div className="absolute inset-0 flex items-center justify-center space-x-1">
                      {Array.from({ length: settings.voiceBarsCount }, (_, i) => (
                        <div
                          key={i}
                          className="bg-white/70 rounded-full transition-all duration-300"
                          style={{
                            width: '3px',
                            height: `${settings.voiceBarsHeight * voiceBarHeights[i % voiceBarHeights.length]}%`,
                            marginRight: `${settings.voiceBarsSpacing}px`,
                            animation: settings.voiceVisualization ? `voicePulse ${800 + i * 100}ms ease-in-out infinite alternate` : 'none'
                          }}
                        />
                      ))}
                    </div>
                  )}
                  
                  {/* Glow Effect */}
                  {settings.glowEffect && (
                    <div 
                      className="absolute inset-0 rounded-full"
                      style={{
                        boxShadow: `0 0 ${settings.glowIntensity}px ${settings.primaryColor}40`,
                        borderRadius: `${settings.blobRoundness}% ${settings.blobRoundness - 10}% ${settings.blobRoundness + 5}% ${settings.blobRoundness - 5}%`
                      }}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Blob Colors & Gradients */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Palette className="h-5 w-5" />
            <span>Blob Colors & Gradients</span>
          </CardTitle>
          <CardDescription>
            Customize the Oracle&apos;s color scheme and gradient effects
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label>Color Presets</Label>
            <div className="grid grid-cols-3 gap-2">
              {presetColors.map((preset) => (
                <button
                  key={preset.name}
                  className="h-16 rounded-lg border-2 transition-all hover:scale-105 relative overflow-hidden"
                  style={{
                    background: `linear-gradient(135deg, ${preset.primary} 0%, ${preset.secondary} 100%)`,
                    borderColor: settings.primaryColor === preset.primary ? '#fff' : 'transparent'
                  }}
                  onClick={() => {
                    updateSetting('primaryColor', preset.primary)
                    updateSetting('secondaryColor', preset.secondary)
                  }}
                >
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                    <span className="text-white text-xs font-medium">{preset.name}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <Label>Primary Color</Label>
              <input
                type="color"
                value={settings.primaryColor}
                onChange={(e) => updateSetting('primaryColor', e.target.value)}
                className="w-full h-12 rounded-lg border cursor-pointer"
              />
            </div>
            <div className="space-y-3">
              <Label>Secondary Color</Label>
              <input
                type="color"
                value={settings.secondaryColor}
                onChange={(e) => updateSetting('secondaryColor', e.target.value)}
                className="w-full h-12 rounded-lg border cursor-pointer"
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label>Gradient Direction</Label>
            <Select value={settings.gradientDirection} onValueChange={(value: 'linear' | 'radial' | 'conic') => updateSetting('gradientDirection', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="linear">Linear</SelectItem>
                <SelectItem value="radial">Radial</SelectItem>
                <SelectItem value="conic">Conic</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label>Gradient Intensity: {settings.gradientIntensity}%</Label>
            <Slider
              value={[settings.gradientIntensity]}
              onValueChange={(value) => updateSetting('gradientIntensity', value[0])}
              max={100}
              min={0}
              step={5}
              className="w-full"
            />
          </div>
        </CardContent>
      </Card>

      {/* Blob Shape & Morphing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Waves className="h-5 w-5" />
            <span>Blob Shape & Morphing</span>
          </CardTitle>
          <CardDescription>
            Control the Oracle&apos;s organic shape and fluid animations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <Label>Blob Size: {settings.blobSize}px</Label>
              <Slider
                value={[settings.blobSize]}
                onValueChange={(value) => updateSetting('blobSize', value[0])}
                max={100}
                min={30}
                step={5}
                className="w-full"
              />
            </div>
            <div className="space-y-3">
              <Label>Roundness: {settings.blobRoundness}%</Label>
              <Slider
                value={[settings.blobRoundness]}
                onValueChange={(value) => updateSetting('blobRoundness', value[0])}
                max={100}
                min={20}
                step={5}
                className="w-full"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <Label>Fluidness: {settings.blobFluidness}%</Label>
              <Slider
                value={[settings.blobFluidness]}
                onValueChange={(value) => updateSetting('blobFluidness', value[0])}
                max={100}
                min={0}
                step={5}
                className="w-full"
              />
            </div>
            <div className="space-y-3">
              <Label>Morphing Speed: {settings.morphingSpeed}%</Label>
              <Slider
                value={[settings.morphingSpeed]}
                onValueChange={(value) => updateSetting('morphingSpeed', value[0])}
                max={100}
                min={0}
                step={5}
                className="w-full"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Voice Visualization */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Volume2 className="h-5 w-5" />
            <span>Voice Visualization</span>
          </CardTitle>
          <CardDescription>
            Configure the sound wave bars that appear inside the Oracle
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Show Voice Visualization</Label>
              <p className="text-sm text-muted-foreground">Display animated sound bars when speaking</p>
            </div>
            <Switch
              checked={settings.voiceVisualization}
              onCheckedChange={(checked) => updateSetting('voiceVisualization', checked)}
            />
          </div>

          {settings.voiceVisualization && (
            <>
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <Label>Number of Bars: {settings.voiceBarsCount}</Label>
                  <Slider
                    value={[settings.voiceBarsCount]}
                    onValueChange={(value) => updateSetting('voiceBarsCount', value[0])}
                    max={15}
                    min={3}
                    step={1}
                    className="w-full"
                  />
                </div>
                <div className="space-y-3">
                  <Label>Bar Height: {settings.voiceBarsHeight}%</Label>
                  <Slider
                    value={[settings.voiceBarsHeight]}
                    onValueChange={(value) => updateSetting('voiceBarsHeight', value[0])}
                    max={80}
                    min={20}
                    step={5}
                    className="w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <Label>Bar Spacing: {settings.voiceBarsSpacing}px</Label>
                  <Slider
                    value={[settings.voiceBarsSpacing]}
                    onValueChange={(value) => updateSetting('voiceBarsSpacing', value[0])}
                    max={16}
                    min={2}
                    step={1}
                    className="w-full"
                  />
                </div>
                <div className="space-y-3">
                  <Label>Voice Reactivity: {settings.voiceReactivity}%</Label>
                  <Slider
                    value={[settings.voiceReactivity]}
                    onValueChange={(value) => updateSetting('voiceReactivity', value[0])}
                    max={100}
                    min={10}
                    step={5}
                    className="w-full"
                  />
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Animation & Effects */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="h-5 w-5" />
            <span>Animation & Effects</span>
          </CardTitle>
          <CardDescription>
            Control the Oracle&apos;s movement and visual effects
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Idle Animation</Label>
                <p className="text-sm text-muted-foreground">Gentle floating movement when idle</p>
              </div>
              <Switch
                checked={settings.idleAnimation}
                onCheckedChange={(checked) => updateSetting('idleAnimation', checked)}
              />
            </div>

            {settings.idleAnimation && (
              <div className="ml-4 space-y-3">
                <Label>Animation Speed: {settings.idleAnimationSpeed}%</Label>
                <Slider
                  value={[settings.idleAnimationSpeed]}
                  onValueChange={(value) => updateSetting('idleAnimationSpeed', value[0])}
                  max={100}
                  min={10}
                  step={5}
                  className="w-full"
                />
              </div>
            )}

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Pulse Effect</Label>
                <p className="text-sm text-muted-foreground">Subtle pulsing when active</p>
              </div>
              <Switch
                checked={settings.pulseEffect}
                onCheckedChange={(checked) => updateSetting('pulseEffect', checked)}
              />
            </div>

            {settings.pulseEffect && (
              <div className="ml-4 space-y-3">
                <Label>Pulse Intensity: {settings.pulseIntensity}%</Label>
                <Slider
                  value={[settings.pulseIntensity]}
                  onValueChange={(value) => updateSetting('pulseIntensity', value[0])}
                  max={50}
                  min={5}
                  step={5}
                  className="w-full"
                />
              </div>
            )}

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Glow Effect</Label>
                <p className="text-sm text-muted-foreground">Soft glow around the Oracle</p>
              </div>
              <Switch
                checked={settings.glowEffect}
                onCheckedChange={(checked) => updateSetting('glowEffect', checked)}
              />
            </div>

            {settings.glowEffect && (
              <div className="ml-4 space-y-3">
                <Label>Glow Intensity: {settings.glowIntensity}px</Label>
                <Slider
                  value={[settings.glowIntensity]}
                  onValueChange={(value) => updateSetting('glowIntensity', value[0])}
                  max={60}
                  min={10}
                  step={5}
                  className="w-full"
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Advanced Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Advanced Settings</CardTitle>
          <CardDescription>
            Fine-tune opacity, blur, and theme integration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <Label>Blob Opacity: {settings.blobOpacity}%</Label>
              <Slider
                value={[settings.blobOpacity]}
                onValueChange={(value) => updateSetting('blobOpacity', value[0])}
                max={100}
                min={50}
                step={5}
                className="w-full"
              />
            </div>
            <div className="space-y-3">
              <Label>Background Blur: {settings.backgroundBlur}px</Label>
              <Slider
                value={[settings.backgroundBlur]}
                onValueChange={(value) => updateSetting('backgroundBlur', value[0])}
                max={20}
                min={0}
                step={1}
                className="w-full"
              />
            </div>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Adapt to System Theme</Label>
              <p className="text-sm text-muted-foreground">Automatically adjust colors for dark/light mode</p>
            </div>
            <Switch
              checked={settings.adaptToSystemTheme}
              onCheckedChange={(checked) => updateSetting('adaptToSystemTheme', checked)}
            />
          </div>

          {settings.adaptToSystemTheme && (
            <div className="ml-4 space-y-3">
              <Label>Dark Mode Adjustment: {settings.darkModeAdjustment}%</Label>
              <Slider
                value={[settings.darkModeAdjustment]}
                onValueChange={(value) => updateSetting('darkModeAdjustment', value[0])}
                max={50}
                min={0}
                step={5}
                className="w-full"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add CSS animations */}
      <style jsx>{`
        @keyframes oracleFloat {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(1deg); }
        }
        
        @keyframes voicePulse {
          0% { transform: scaleY(0.3); opacity: 0.6; }
          100% { transform: scaleY(1); opacity: 1; }
        }
      `}</style>
    </div>
  )
}          