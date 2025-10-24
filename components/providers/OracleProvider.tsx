'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface OracleGlobalSettings {
  enabled: boolean
  lastActivated: string | null
  totalSessions: number
}

interface OracleContextType {
  settings: OracleGlobalSettings
  updateSettings: (newSettings: Partial<OracleGlobalSettings>) => void
  isLoading: boolean
}

const defaultSettings: OracleGlobalSettings = {
  enabled: true,
  lastActivated: null,
  totalSessions: 0
}

const OracleContext = createContext<OracleContextType | undefined>(undefined)

export function OracleProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<OracleGlobalSettings>(defaultSettings)
  const [isLoading, setIsLoading] = useState(true)

  // Load Oracle global settings on mount
  useEffect(() => {
    const loadGlobalSettings = async () => {
      try {
        console.log('🔍 Loading Oracle global settings...')
        const response = await fetch('/api/save?table=bookmarks&title=Oracle Global Settings')
        const result = await response.json()
        
        if (result.success && result.data.found) {
          console.log('✅ Loaded Oracle global settings:', result.data.settings)
          setSettings(result.data.settings)
        } else {
          console.log('📭 No Oracle global settings found, using defaults')
          setSettings(defaultSettings)
        }
      } catch (error) {
        console.error('❌ Failed to load Oracle global settings:', error)
        setSettings(defaultSettings)
      } finally {
        setIsLoading(false)
      }
    }
    
    loadGlobalSettings()
  }, [])

  const updateSettings = (newSettings: Partial<OracleGlobalSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }))
  }

  return (
    <OracleContext.Provider value={{ settings, updateSettings, isLoading }}>
      {children}
    </OracleContext.Provider>
  )
}

export function useOracle() {
  const context = useContext(OracleContext)
  if (context === undefined) {
    throw new Error('useOracle must be used within an OracleProvider')
  }
  return context
} 