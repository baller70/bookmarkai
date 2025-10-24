'use client'

import { Settings } from 'lucide-react'
import EnhancedBookmarkSettings from './enhanced-bookmark-settings'

export default function SettingsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <Settings className="h-8 w-8" />
        <h1 className="text-3xl font-bold">Settings</h1>
      </div>
      
      <div className="max-w-4xl mx-auto">
        <EnhancedBookmarkSettings />
      </div>
    </div>
  )
} 