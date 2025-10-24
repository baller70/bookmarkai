
'use client'
export const dynamic = 'force-dynamic'

import React from 'react'
import { TestTube, Globe } from 'lucide-react'
import { useTranslation } from '@/hooks/use-translation'

export default function VoiceTestPage() {
  const { t, language } = useTranslation()

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <TestTube className="h-8 w-8" />
            <div>
              <h1 className="text-2xl font-bold">Voice Test</h1>
              <p className="text-blue-100">Test and optimize your voice recognition settings</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 text-white/80">
            <Globe className="h-4 w-4" />
            <span className="text-sm uppercase">{language}</span>
          </div>
        </div>
      </div>

      <div className="p-6 bg-white rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Voice Recognition Test</h2>
        <p className="text-gray-600">
          This is a working version of the voice test page. Full functionality will be restored gradually.
        </p>
        
        <div className="mt-6 space-y-4">
          <div className="p-4 bg-gray-50 rounded">
            <h3 className="font-medium">Browser Compatibility</h3>
            <p className="text-sm text-gray-600 mt-2">
              Voice recognition is supported in Chrome, Safari, and Edge browsers.
            </p>
          </div>
          
          <div className="p-4 bg-blue-50 rounded">
            <h3 className="font-medium text-blue-800">Status</h3>
            <p className="text-sm text-blue-600 mt-2">
              Page loading successfully. Translation working: {t('status.loading')}
            </p>
          </div>
          
          <div className="p-4 bg-green-50 rounded">
            <h3 className="font-medium text-green-800">Next Steps</h3>
            <p className="text-sm text-green-600 mt-2">
              Ready to add voice testing functionality step by step.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 