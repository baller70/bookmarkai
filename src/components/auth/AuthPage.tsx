'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

export default function AuthPage() {
  const [view, setView] = useState('sign-in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // For demo purposes, just redirect to dashboard
    window.location.href = '/dashboard'
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0A0A0A] border-b border-white/10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2">
              <Image src="/logo.svg" alt="Logo" width={32} height={32} priority />
              <span className="text-white font-bold text-xl">SaaS Kit Pro</span>
            </Link>

            {/* Navigation */}
            <nav className="flex items-center space-x-6">
              <Link href="/features" className="text-white/60 hover:text-white transition-colors">
                Features
              </Link>
              <Link href="/docs" className="text-white/60 hover:text-white transition-colors">
                Documentation
              </Link>
              <button 
                onClick={() => setView(view === 'sign-in' ? 'sign-up' : 'sign-in')}
                className="text-[#FFBE1A] hover:text-[#FFBE1A]/80 transition-colors"
              >
                {view === 'sign-in' ? 'Sign up' : 'Sign in'}
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="min-h-screen flex items-center justify-center pt-20 px-4">
        <div className="w-full max-w-md bg-[#1A1A1A] border border-white/10 rounded-lg p-6">
          <div className="text-center mb-6">
            <h1 className="text-2xl text-white font-bold mb-2">
              {view === 'sign-in' ? 'Welcome back' : 'Create account'}
            </h1>
            <p className="text-white/60">
              {view === 'sign-in' 
                ? 'Sign in to your account to continue' 
                : 'Create a new account to get started'
              }
            </p>
          </div>
          <div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0A0A0A] border border-white/20 rounded-md text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#FFBE1A] focus:border-transparent"
                  required
                />
              </div>
              <div>
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0A0A0A] border border-white/20 rounded-md text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#FFBE1A] focus:border-transparent"
                  required
                />
              </div>
              <button 
                type="submit" 
                className="w-full py-2 px-4 bg-[#FFBE1A] hover:bg-[#FFBE1A]/90 text-black font-semibold rounded-md transition-colors"
              >
                {view === 'sign-in' ? 'Sign in' : 'Sign up'}
              </button>
            </form>
            
            <div className="mt-6 text-center">
              <button
                onClick={() => setView(view === 'sign-in' ? 'sign-up' : 'sign-in')}
                className="text-[#FFBE1A] hover:text-[#FFBE1A]/80 transition-colors text-sm"
              >
                {view === 'sign-in' 
                  ? "Don't have an account? Sign up" 
                  : "Already have an account? Sign in"
                }
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 