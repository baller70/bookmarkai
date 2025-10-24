'use client'

import React from 'react'
import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
      <div className="text-center max-w-md">
        <h1 className="text-4xl font-bold text-white mb-4">
          AI-Powered SaaS Kit
        </h1>
        <p className="text-white/60 mb-8">
          Your complete starter kit for building AI-powered applications with Next.js and Supabase.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center px-6 py-3 rounded-lg bg-[#FFBE1A] text-black font-medium hover:bg-[#FFBE1A]/90 transition-colors"
        >
          View Dashboard
        </Link>
        <p className="text-white/40 text-sm mt-4">
          Demo mode - Authentication temporarily disabled
        </p>
      </div>
    </div>
  )
}
