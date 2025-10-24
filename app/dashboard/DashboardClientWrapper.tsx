'use client'

import React from 'react'
import dynamic from 'next/dynamic'
import BookmarkCounter from './BookmarkCounter'

const DashboardClient = dynamic(() => import('./DashboardClient'), {
  ssr: false,
  loading: () => <div className="p-10">Loading dashboard...</div>,
})

class DashboardErrorBoundary extends React.Component<React.PropsWithChildren, { hasError: boolean; error?: any; componentStack?: string }>{
  constructor(props: React.PropsWithChildren) {
    super(props)
    this.state = { hasError: false }
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error }
  }
  componentDidCatch(error: any, info: any) {
    // Log full details for debugging
    console.error('Dashboard error:', error, info)
    this.setState({ componentStack: info?.componentStack })
  }
  render() {
    if (this.state.hasError) {
      const message = this.state.error?.message || String(this.state.error || 'Unknown error')
      const stack = this.state.error?.stack
      const componentStack = this.state.componentStack
      return (
        <div className="p-6 text-red-600">
          <div className="font-semibold mb-2">Dashboard error:</div>
          <pre className="whitespace-pre-wrap text-sm">{message}</pre>
          {stack && (
            <details className="mt-3">
              <summary className="cursor-pointer text-red-700">Stack trace</summary>
              <pre className="whitespace-pre-wrap text-xs mt-2">{stack}</pre>
            </details>
          )}
          {componentStack && (
            <details className="mt-3">
              <summary className="cursor-pointer text-red-700">Component stack</summary>
              <pre className="whitespace-pre-wrap text-xs mt-2">{componentStack}</pre>
            </details>
          )}
        </div>
      )
    }
    return this.props.children
  }
}

export default function DashboardClientWrapper() {
  return (
    <DashboardErrorBoundary>
      <div className="px-6 pt-6">
        <div>
          <BookmarkCounter />
        </div>
      </div>
      <DashboardClient />
    </DashboardErrorBoundary>
  )
}
