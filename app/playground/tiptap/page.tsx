'use client'

import React from 'react'
import { TipTapEditor } from '@/src/features/media/components/TipTapEditor'

export default function TipTapPlaygroundPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">TipTap Playground</h1>
          <p className="text-gray-600">Public playground for validating TipTap slash commands without authentication.</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <TipTapEditor
            content={[]}
            onChange={() => { /* no-op: public test page does not persist */ }}
            className="min-h-[280px]"
            placeholder="Type '/' and select a command (Bullet List, Ordered List, Blockquote, Link, Task List)"
          />
        </div>
      </div>
    </div>
  )
}

