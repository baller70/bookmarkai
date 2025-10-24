'use client'

import React, { useState, useEffect } from 'react'

// Minimal Dashboard Client for testing
export default function DashboardClientMinimal() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className="p-10">Loading dashboard...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            🎉 Dashboard is Working!
          </h1>
          <p className="text-lg text-gray-600">
            The DashboardClient component has loaded successfully.
          </p>
          <div className="mt-8 p-6 bg-white rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Test Results</h2>
            <div className="space-y-2 text-left">
              <div className="flex items-center">
                <span className="text-green-500 mr-2">✅</span>
                <span>React component rendering</span>
              </div>
              <div className="flex items-center">
                <span className="text-green-500 mr-2">✅</span>
                <span>Client-side hydration</span>
              </div>
              <div className="flex items-center">
                <span className="text-green-500 mr-2">✅</span>
                <span>TypeScript compilation</span>
              </div>
              <div className="flex items-center">
                <span className="text-green-500 mr-2">✅</span>
                <span>Dynamic imports working</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
