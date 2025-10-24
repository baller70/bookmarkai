'use client'

export function StagewiseWrapper() {
  // Only render in development mode and when packages are available
  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  // Gracefully handle missing stagewise packages in production builds
  try {
    // Dynamic imports to avoid build errors
    return null // Disabled for production deployment
  } catch (error) {
    console.warn('Stagewise packages not available:', error)
    return null
  }
} 