/**
 * BookAIMark Responsive Design System
 * 
 * Comprehensive responsive utilities for building mobile-first,
 * accessible, and performant responsive layouts.
 */

import { useEffect, useState } from 'react'
import { breakpoints } from './design-tokens'

// ==================== BREAKPOINT SYSTEM ====================

/**
 * Breakpoint values in pixels
 */
export const breakpointValues = {
  xs: 475,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
  '3xl': 1920,
} as const

export type BreakpointKey = keyof typeof breakpointValues

/**
 * Media query helpers
 */
export const mediaQueries = {
  // Min-width queries (mobile-first)
  up: (breakpoint: BreakpointKey) => `@media (min-width: ${breakpointValues[breakpoint]}px)`,
  
  // Max-width queries
  down: (breakpoint: BreakpointKey) => `@media (max-width: ${breakpointValues[breakpoint] - 1}px)`,
  
  // Between two breakpoints
  between: (min: BreakpointKey, max: BreakpointKey) => 
    `@media (min-width: ${breakpointValues[min]}px) and (max-width: ${breakpointValues[max] - 1}px)`,
  
  // Only specific breakpoint
  only: (breakpoint: BreakpointKey) => {
    const keys = Object.keys(breakpointValues) as BreakpointKey[]
    const index = keys.indexOf(breakpoint)
    const nextBreakpoint = keys[index + 1]
    
    if (!nextBreakpoint) {
      return mediaQueries.up(breakpoint)
    }
    
    return mediaQueries.between(breakpoint, nextBreakpoint)
  },
  
  // Custom queries
  custom: (query: string) => `@media ${query}`,
  
  // Orientation queries
  landscape: '@media (orientation: landscape)',
  portrait: '@media (orientation: portrait)',
  
  // Device-specific queries
  mobile: '@media (max-width: 767px)',
  tablet: '@media (min-width: 768px) and (max-width: 1023px)',
  desktop: '@media (min-width: 1024px)',
  
  // High DPI displays
  retina: '@media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi)',
  
  // Accessibility queries
  reducedMotion: '@media (prefers-reduced-motion: reduce)',
  highContrast: '@media (prefers-contrast: high)',
  darkMode: '@media (prefers-color-scheme: dark)',
  lightMode: '@media (prefers-color-scheme: light)',
} as const

// ==================== RESPONSIVE HOOKS ====================

/**
 * Hook for detecting current breakpoint
 */
export function useBreakpoint(): BreakpointKey {
  const [breakpoint, setBreakpoint] = useState<BreakpointKey>('xs')

  useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth
      
      if (width >= breakpointValues['3xl']) setBreakpoint('3xl')
      else if (width >= breakpointValues['2xl']) setBreakpoint('2xl')
      else if (width >= breakpointValues.xl) setBreakpoint('xl')
      else if (width >= breakpointValues.lg) setBreakpoint('lg')
      else if (width >= breakpointValues.md) setBreakpoint('md')
      else if (width >= breakpointValues.sm) setBreakpoint('sm')
      else setBreakpoint('xs')
    }

    updateBreakpoint()
    window.addEventListener('resize', updateBreakpoint)
    
    return () => window.removeEventListener('resize', updateBreakpoint)
  }, [])

  return breakpoint
}

/**
 * Hook for checking if current viewport matches a breakpoint condition
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia(query)
    setMatches(mediaQuery.matches)

    const handleChange = () => setMatches(mediaQuery.matches)
    mediaQuery.addEventListener('change', handleChange)
    
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [query])

  return matches
}

/**
 * Hook for responsive values based on breakpoints
 */
export function useResponsiveValue<T>(values: Partial<Record<BreakpointKey, T>>): T | undefined {
  const currentBreakpoint = useBreakpoint()
  
  // Find the appropriate value by checking breakpoints in descending order
  const breakpointOrder: BreakpointKey[] = ['3xl', '2xl', 'xl', 'lg', 'md', 'sm', 'xs']
  const currentIndex = breakpointOrder.indexOf(currentBreakpoint)
  
  for (let i = currentIndex; i < breakpointOrder.length; i++) {
    const bp = breakpointOrder[i]
    if (values[bp] !== undefined) {
      return values[bp]
    }
  }
  
  return undefined
}

/**
 * Hook for device type detection
 */
export function useDeviceType() {
  const isMobile = useMediaQuery(mediaQueries.mobile)
  const isTablet = useMediaQuery(mediaQueries.tablet)
  const isDesktop = useMediaQuery(mediaQueries.desktop)
  
  return {
    isMobile,
    isTablet,
    isDesktop,
    deviceType: isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop' as const
  }
}

/**
 * Hook for viewport dimensions
 */
export function useViewport() {
  const [viewport, setViewport] = useState({
    width: 0,
    height: 0,
  })

  useEffect(() => {
    const updateViewport = () => {
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }

    updateViewport()
    window.addEventListener('resize', updateViewport)
    
    return () => window.removeEventListener('resize', updateViewport)
  }, [])

  return viewport
}

// ==================== RESPONSIVE UTILITIES ====================

/**
 * Generate responsive classes for Tailwind CSS
 */
export function generateResponsiveClasses(
  baseClass: string,
  responsiveValues: Partial<Record<BreakpointKey, string>>
): string {
  const classes = [baseClass]
  
  Object.entries(responsiveValues).forEach(([breakpoint, value]) => {
    if (breakpoint === 'xs') {
      classes.push(value)
    } else {
      classes.push(`${breakpoint}:${value}`)
    }
  })
  
  return classes.join(' ')
}

/**
 * Container query utilities
 */
export const containerQueries = {
  xs: '@container (min-width: 20rem)',
  sm: '@container (min-width: 24rem)',
  md: '@container (min-width: 28rem)',
  lg: '@container (min-width: 32rem)',
  xl: '@container (min-width: 36rem)',
  '2xl': '@container (min-width: 42rem)',
  '3xl': '@container (min-width: 48rem)',
  '4xl': '@container (min-width: 56rem)',
  '5xl': '@container (min-width: 64rem)',
  '6xl': '@container (min-width: 72rem)',
  '7xl': '@container (min-width: 80rem)',
} as const

// ==================== RESPONSIVE COMPONENTS ====================

/**
 * Responsive grid system
 */
export const responsiveGrid = {
  // Column configurations
  columns: {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
    5: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5',
    6: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6',
    auto: 'grid-cols-[repeat(auto-fit,minmax(250px,1fr))]',
    autoSm: 'grid-cols-[repeat(auto-fit,minmax(200px,1fr))]',
    autoLg: 'grid-cols-[repeat(auto-fit,minmax(300px,1fr))]',
  },
  
  // Gap configurations
  gaps: {
    none: 'gap-0',
    sm: 'gap-2 sm:gap-3 lg:gap-4',
    md: 'gap-3 sm:gap-4 lg:gap-6',
    lg: 'gap-4 sm:gap-6 lg:gap-8',
    xl: 'gap-6 sm:gap-8 lg:gap-10',
  },
}

/**
 * Responsive typography scale
 */
export const responsiveTypography = {
  // Heading scales
  h1: 'text-2xl sm:text-3xl lg:text-4xl xl:text-5xl',
  h2: 'text-xl sm:text-2xl lg:text-3xl xl:text-4xl',
  h3: 'text-lg sm:text-xl lg:text-2xl xl:text-3xl',
  h4: 'text-base sm:text-lg lg:text-xl xl:text-2xl',
  h5: 'text-sm sm:text-base lg:text-lg xl:text-xl',
  h6: 'text-xs sm:text-sm lg:text-base xl:text-lg',
  
  // Body text scales
  body: 'text-sm sm:text-base',
  bodyLarge: 'text-base sm:text-lg',
  bodySmall: 'text-xs sm:text-sm',
  
  // Display text
  display: 'text-3xl sm:text-4xl lg:text-5xl xl:text-6xl 2xl:text-7xl',
  displayLarge: 'text-4xl sm:text-5xl lg:text-6xl xl:text-7xl 2xl:text-8xl',
  
  // Lead text
  lead: 'text-lg sm:text-xl lg:text-2xl',
  
  // Caption
  caption: 'text-xs sm:text-sm',
}

/**
 * Responsive spacing scale
 */
export const responsiveSpacing = {
  // Padding
  padding: {
    xs: 'p-2 sm:p-3 lg:p-4',
    sm: 'p-3 sm:p-4 lg:p-6',
    md: 'p-4 sm:p-6 lg:p-8',
    lg: 'p-6 sm:p-8 lg:p-12',
    xl: 'p-8 sm:p-12 lg:p-16',
  },
  
  // Margin
  margin: {
    xs: 'm-2 sm:m-3 lg:m-4',
    sm: 'm-3 sm:m-4 lg:m-6',
    md: 'm-4 sm:m-6 lg:m-8',
    lg: 'm-6 sm:m-8 lg:m-12',
    xl: 'm-8 sm:m-12 lg:m-16',
  },
  
  // Section spacing
  section: 'py-8 sm:py-12 lg:py-16 xl:py-20',
  sectionLarge: 'py-12 sm:py-16 lg:py-20 xl:py-24',
  
  // Container spacing
  container: 'px-4 sm:px-6 lg:px-8',
  containerWide: 'px-6 sm:px-8 lg:px-12',
}

// ==================== RESPONSIVE LAYOUTS ====================

/**
 * Common responsive layout patterns
 */
export const layouts = {
  // Sidebar layouts
  sidebar: {
    left: 'flex flex-col lg:flex-row',
    right: 'flex flex-col lg:flex-row-reverse',
    collapsible: 'flex flex-col lg:flex-row [&>aside]:w-full [&>aside]:lg:w-64 [&>main]:flex-1',
  },
  
  // Stack layouts
  stack: {
    vertical: 'flex flex-col space-y-4 sm:space-y-6 lg:space-y-8',
    horizontal: 'flex flex-col sm:flex-row sm:space-x-4 sm:space-y-0 space-y-4 lg:space-x-6',
    centered: 'flex flex-col items-center space-y-4 sm:space-y-6 lg:space-y-8',
  },
  
  // Card layouts
  cards: {
    masonry: 'columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 sm:gap-6',
    grid: responsiveGrid.columns[3] + ' ' + responsiveGrid.gaps.md,
    list: 'flex flex-col space-y-3 sm:space-y-4',
  },
  
  // Navigation layouts
  navigation: {
    horizontal: 'flex flex-row space-x-4 sm:space-x-6 lg:space-x-8',
    vertical: 'flex flex-col space-y-2 sm:space-y-3',
    tabs: 'flex flex-row overflow-x-auto scrollbar-hide space-x-1 sm:space-x-2',
  },
}

// ==================== ACCESSIBILITY RESPONSIVE ====================

/**
 * Responsive accessibility utilities
 */
export const a11yResponsive = {
  // Touch targets
  touchTarget: 'min-h-[44px] min-w-[44px] sm:min-h-[48px] sm:min-w-[48px]',
  
  // Focus indicators
  focusRing: 'focus:ring-2 focus:ring-offset-2 focus:ring-primary',
  focusVisible: 'focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary',
  
  // Skip links
  skipLink: 'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md',
}

// ==================== PERFORMANCE OPTIMIZATIONS ====================

/**
 * Responsive image utilities
 */
export const responsiveImages = {
  // Aspect ratios
  aspectRatios: {
    square: 'aspect-square',
    video: 'aspect-video',
    portrait: 'aspect-[3/4]',
    landscape: 'aspect-[4/3]',
    wide: 'aspect-[16/9]',
    ultrawide: 'aspect-[21/9]',
  },
  
  // Object fit
  objectFit: {
    cover: 'object-cover',
    contain: 'object-contain',
    fill: 'object-fill',
    none: 'object-none',
    scaleDown: 'object-scale-down',
  },
  
  // Responsive sizing
  sizes: {
    thumbnail: 'w-12 h-12 sm:w-16 sm:h-16',
    small: 'w-16 h-16 sm:w-20 sm:h-20',
    medium: 'w-24 h-24 sm:w-32 sm:h-32',
    large: 'w-32 h-32 sm:w-40 sm:h-40',
    hero: 'w-full h-48 sm:h-64 lg:h-80 xl:h-96',
  },
}

// ==================== EXPORTS ====================

export const responsive = {
  breakpointValues,
  mediaQueries,
  useBreakpoint,
  useMediaQuery,
  useResponsiveValue,
  useDeviceType,
  useViewport,
  generateResponsiveClasses,
  containerQueries,
  responsiveGrid,
  responsiveTypography,
  responsiveSpacing,
  layouts,
  a11yResponsive,
  responsiveImages,
}

export default responsive 