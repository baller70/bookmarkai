'use client'

import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Eye, Bot, Mic, BrainCircuit, Wrench, Sparkles, ArrowLeft, Settings, Power } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import SaveButton from '../../../components/SaveButton'
import { useOracle, OracleProvider } from '@/components/providers/OracleProvider'

const nav = [
  { href: '/settings/oracle/appearance', label: 'Appearance', icon: Eye },
  { href: '/settings/oracle/behavior',   label: 'Behavior',   icon: Bot },
  { href: '/settings/oracle/voice',      label: 'Voice',      icon: Mic },
  { href: '/settings/oracle/context',    label: 'Context',    icon: BrainCircuit },
  { href: '/settings/oracle/tools',      label: 'Tools',      icon: Wrench },
  { href: '/settings/oracle/advanced',   label: 'Advanced',   icon: Sparkles },
]

interface OracleGlobalSettings {
  enabled: boolean
  lastActivated: string | null
  totalSessions: number
}

const defaultGlobalSettings: OracleGlobalSettings = {
  enabled: true,
  lastActivated: null,
  totalSessions: 0
}

function OracleLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { settings: globalSettings, updateSettings: updateGlobalSettings } = useOracle()
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  const updateGlobalSetting = (key: keyof OracleGlobalSettings, value: boolean | string | number) => {
    const newSettings = { 
      [key]: value,
      ...(key === 'enabled' && value === true ? { lastActivated: new Date().toISOString() } : {})
    }
    
    updateGlobalSettings(newSettings)
    setHasUnsavedChanges(true)
    
    if (key === 'enabled') {
      toast.success(value ? 'Oracle AI activated' : 'Oracle AI deactivated')
    }
  }

  const handleSave = () => {
    setHasUnsavedChanges(false)
    toast.success('Oracle settings saved successfully')
  }

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-gradient-to-r from-purple-600 to-purple-800 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/settings')}
                className="flex items-center space-x-2 text-white hover:bg-white/10"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Settings</span>
              </Button>
              <div className="h-6 w-px bg-white/30" />
              <div className="flex items-center space-x-2">
                <Settings className="h-6 w-6" />
                <h1 className="text-xl font-bold">Oracle Settings</h1>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Oracle Master Control */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Power className="h-5 w-5" />
              <span>Oracle AI Control</span>
            </CardTitle>
            <CardDescription>
              Master control to activate or deactivate Oracle AI functionality
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base font-medium">
                  Oracle AI {globalSettings.enabled ? 'Activated' : 'Deactivated'}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {globalSettings.enabled 
                    ? 'Oracle AI is currently active and ready to assist you'
                    : 'Oracle AI is currently disabled. Enable to start using AI assistance'
                  }
                </p>
                {globalSettings.lastActivated && (
                  <p className="text-xs text-muted-foreground">
                    Last activated: {new Date(globalSettings.lastActivated).toLocaleString()}
                  </p>
                )}
              </div>
              <div className="flex items-center space-x-3">
                <Switch
                  checked={globalSettings.enabled}
                  onCheckedChange={(checked) => updateGlobalSetting('enabled', checked)}
                  className="data-[state=checked]:bg-green-600"
                />
                <SaveButton
                  table="bookmarks"
                  payload={{
                    url: 'https://settings.example.com/oracle-global',
                    title: 'Oracle Global Settings',
                    description: JSON.stringify(globalSettings),
                    created_at: new Date().toISOString()
                  }}
                  onSuccess={handleSave}
                />
              </div>
            </div>
            
            {!globalSettings.enabled && (
              <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <div className="flex items-center space-x-2 text-yellow-800 dark:text-yellow-200">
                  <Power className="h-4 w-4" />
                  <span className="text-sm font-medium">Oracle AI is currently disabled</span>
                </div>
                <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                  Enable Oracle AI above to access voice chat, AI assistance, and all Oracle features.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex gap-6">
          {/* Sidebar */}
          <ScrollArea className="hidden lg:block w-64 shrink-0 rounded-lg border bg-white dark:bg-card shadow-sm p-2">
            <div className="space-y-1">
              {nav.map((item) => {
                const IconComponent = item.icon
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-purple-50 text-purple-700 border-r-2 border-purple-600'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    )}
                  >
                    <IconComponent className="h-4 w-4" />
                    {item.label}
                  </Link>
                )
              })}
            </div>
          </ScrollArea>

          {/* Main content */}
          <div className="flex-1 w-full">
            {globalSettings.enabled ? (
              children
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center space-y-4">
                    <Power className="h-12 w-12 mx-auto text-muted-foreground" />
                    <h3 className="text-lg font-semibold">Oracle AI is Disabled</h3>
                    <p className="text-muted-foreground max-w-md mx-auto">
                      Enable Oracle AI using the master control above to access and configure all Oracle settings and features.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function OracleLayout({ children }: { children: React.ReactNode }) {
  return (
    <OracleProvider>
      <OracleLayoutInner>{children}</OracleLayoutInner>
    </OracleProvider>
  )
} 