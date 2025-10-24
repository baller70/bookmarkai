'use client'

import React from 'react'
import { SafariDemo } from '../../components/Safari Window/src/components/SafariDemo'
import { ThemeToggle } from '../../components/Safari Window/src/components/theme-toggle'
import { ThemeProvider } from '../../components/providers/ThemeProvider'

function AnimatedCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="card-wrapper">
      <div className="card">
        <div className="bg" />
        <div className="blob" />
        <div className="content">
          {children}
        </div>
      </div>
    </div>
  )
}

export default function SafariWindowPage() {
  return (
    <ThemeProvider defaultTheme="light" attribute="class">
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
        <div className="fixed top-4 right-4 z-50">
          <ThemeToggle />
        </div>
        <AnimatedCard>
          <SafariDemo />
        </AnimatedCard>
      </div>
      <style jsx global>{`
        .card-wrapper {
          display: flex;
          justify-content: center;
          align-items: center;
          width: 100%;
        }

        .card {
          position: relative;
          width: 100%;
          max-width: 1220px;
          height: auto;
          min-height: 773px;
          border-radius: 14px;
          z-index: 1111;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          box-shadow: 20px 20px 60px #bebebe, -20px -20px 60px #ffffff;
        }

        .dark .card {
          box-shadow: 20px 20px 60px #1a1a1a, -20px -20px 60px #404040;
        }

        .bg {
          position: absolute;
          top: 5px;
          left: 5px;
          right: 5px;
          bottom: 5px;
          z-index: 2;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(24px);
          border-radius: 10px;
          overflow: hidden;
          outline: 2px solid white;
        }

        .dark .bg {
          background: rgba(15, 23, 42, 0.95);
          outline: 2px solid rgba(255, 255, 255, 0.1);
        }

        .blob {
          position: absolute;
          z-index: 1;
          width: 150px;
          height: 150px;
          border-radius: 50%;
          background: linear-gradient(45deg, #ec4899, #8b5cf6, #d946ef);
          opacity: 1;
          filter: blur(12px);
          animation: blob-bounce 12s infinite linear;
        }

        .dark .blob {
          background: linear-gradient(45deg, #f472b6, #a855f7, #e879f9);
        }

        .content {
          position: relative;
          z-index: 3;
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        @keyframes blob-bounce {
          0% {
            top: -75px;
            left: -75px;
          }
          12.5% {
            top: -75px;
            left: 50%;
            transform: translateX(-50%);
          }
          25% {
            top: -75px;
            left: calc(100% + 75px);
            transform: translateX(-100%);
          }
          37.5% {
            top: 50%;
            left: calc(100% + 75px);
            transform: translate(-100%, -50%);
          }
          50% {
            top: calc(100% + 75px);
            left: calc(100% + 75px);
            transform: translate(-100%, -100%);
          }
          62.5% {
            top: calc(100% + 75px);
            left: 50%;
            transform: translate(-50%, -100%);
          }
          75% {
            top: calc(100% + 75px);
            left: -75px;
          }
          87.5% {
            top: 50%;
            left: -75px;
            transform: translateY(-50%);
          }
          100% {
            top: -75px;
            left: -75px;
          }
        }
      `}</style>
    </ThemeProvider>
  )
} 