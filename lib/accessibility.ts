/**
 * BookAIMark Accessibility Utilities
 * 
 * Comprehensive accessibility utilities for improving app accessibility
 * including focus management, screen reader support, keyboard navigation,
 * and WCAG compliance helpers.
 */

import { useEffect, useRef, useState, useCallback } from 'react'

// ==================== FOCUS MANAGEMENT ====================

/**
 * Hook for managing focus trapping within a component
 */
export function useFocusTrap(isActive: boolean = true) {
  const containerRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!isActive || !containerRef.current) return

    const container = containerRef.current
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    
    const firstElement = focusableElements[0] as HTMLElement
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement?.focus()
          e.preventDefault()
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement?.focus()
          e.preventDefault()
        }
      }
    }

    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        container.dispatchEvent(new CustomEvent('escape-pressed'))
      }
    }

    container.addEventListener('keydown', handleTabKey)
    container.addEventListener('keydown', handleEscapeKey)
    
    // Focus first element when trap becomes active
    firstElement?.focus()

    return () => {
      container.removeEventListener('keydown', handleTabKey)
      container.removeEventListener('keydown', handleEscapeKey)
    }
  }, [isActive])

  return containerRef
}

/**
 * Hook for managing focus restoration
 */
export function useFocusRestore() {
  const previousFocusRef = useRef<HTMLElement | null>(null)

  const saveFocus = useCallback(() => {
    previousFocusRef.current = document.activeElement as HTMLElement
  }, [])

  const restoreFocus = useCallback(() => {
    if (previousFocusRef.current) {
      previousFocusRef.current.focus()
      previousFocusRef.current = null
    }
  }, [])

  return { saveFocus, restoreFocus }
}

/**
 * Hook for managing focus visibility (only show focus rings on keyboard navigation)
 */
export function useFocusVisible() {
  const [isFocusVisible, setIsFocusVisible] = useState(false)
  const [isKeyboardUser, setIsKeyboardUser] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        setIsKeyboardUser(true)
      }
    }

    const handleMouseDown = () => {
      setIsKeyboardUser(false)
    }

    const handleFocus = () => {
      setIsFocusVisible(isKeyboardUser)
    }

    const handleBlur = () => {
      setIsFocusVisible(false)
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('mousedown', handleMouseDown)
    document.addEventListener('focusin', handleFocus)
    document.addEventListener('focusout', handleBlur)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('mousedown', handleMouseDown)
      document.removeEventListener('focusin', handleFocus)
      document.removeEventListener('focusout', handleBlur)
    }
  }, [isKeyboardUser])

  return { isFocusVisible, isKeyboardUser }
}

// ==================== SCREEN READER SUPPORT ====================

/**
 * Hook for managing live regions for screen reader announcements
 */
export function useLiveRegion() {
  const liveRegionRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    // Create live region if it doesn't exist
    if (!liveRegionRef.current) {
      const liveRegion = document.createElement('div')
      liveRegion.setAttribute('aria-live', 'polite')
      liveRegion.setAttribute('aria-atomic', 'true')
      liveRegion.style.position = 'absolute'
      liveRegion.style.left = '-10000px'
      liveRegion.style.width = '1px'
      liveRegion.style.height = '1px'
      liveRegion.style.overflow = 'hidden'
      document.body.appendChild(liveRegion)
      liveRegionRef.current = liveRegion
    }

    return () => {
      if (liveRegionRef.current) {
        document.body.removeChild(liveRegionRef.current)
        liveRegionRef.current = null
      }
    }
  }, [])

  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (liveRegionRef.current) {
      liveRegionRef.current.setAttribute('aria-live', priority)
      liveRegionRef.current.textContent = message
      
      // Clear after announcement to allow repeat announcements
      setTimeout(() => {
        if (liveRegionRef.current) {
          liveRegionRef.current.textContent = ''
        }
      }, 1000)
    }
  }, [])

  return { announce }
}

/**
 * Generate unique IDs for accessibility attributes
 */
let idCounter = 0
export function useAccessibleId(prefix: string = 'accessible'): string {
  const [id] = useState(() => `${prefix}-${++idCounter}`)
  return id
}

// ==================== KEYBOARD NAVIGATION ====================

/**
 * Hook for handling arrow key navigation in lists/grids
 */
export function useArrowNavigation(
  itemCount: number,
  columns: number = 1,
  wrap: boolean = false
) {
  const [activeIndex, setActiveIndex] = useState(0)

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    let newIndex = activeIndex

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        newIndex = activeIndex + columns
        if (newIndex >= itemCount) {
          newIndex = wrap ? activeIndex % columns : activeIndex
        }
        break
      
      case 'ArrowUp':
        e.preventDefault()
        newIndex = activeIndex - columns
        if (newIndex < 0) {
          newIndex = wrap ? Math.floor((itemCount - 1) / columns) * columns + (activeIndex % columns) : activeIndex
        }
        break
      
      case 'ArrowRight':
        e.preventDefault()
        newIndex = activeIndex + 1
        if (newIndex >= itemCount) {
          newIndex = wrap ? 0 : activeIndex
        }
        break
      
      case 'ArrowLeft':
        e.preventDefault()
        newIndex = activeIndex - 1
        if (newIndex < 0) {
          newIndex = wrap ? itemCount - 1 : activeIndex
        }
        break
      
      case 'Home':
        e.preventDefault()
        newIndex = 0
        break
      
      case 'End':
        e.preventDefault()
        newIndex = itemCount - 1
        break
    }

    if (newIndex !== activeIndex) {
      setActiveIndex(newIndex)
    }
  }, [activeIndex, itemCount, columns, wrap])

  return { activeIndex, setActiveIndex, handleKeyDown }
}

// ==================== REDUCED MOTION ====================

/**
 * Hook for detecting user's motion preferences
 */
export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mediaQuery.matches)

    const handleChange = () => setPrefersReducedMotion(mediaQuery.matches)
    mediaQuery.addEventListener('change', handleChange)

    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  return prefersReducedMotion
}

// ==================== COLOR CONTRAST ====================

/**
 * Calculate color contrast ratio between two colors
 */
export function getContrastRatio(color1: string, color2: string): number {
  const getLuminance = (color: string): number => {
    // Convert hex to RGB
    const hex = color.replace('#', '')
    const r = parseInt(hex.substr(0, 2), 16) / 255
    const g = parseInt(hex.substr(2, 2), 16) / 255
    const b = parseInt(hex.substr(4, 2), 16) / 255

    // Calculate relative luminance
    const sRGB = [r, g, b].map(c => {
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
    })

    return 0.2126 * sRGB[0] + 0.7152 * sRGB[1] + 0.0722 * sRGB[2]
  }

  const lum1 = getLuminance(color1)
  const lum2 = getLuminance(color2)
  const brightest = Math.max(lum1, lum2)
  const darkest = Math.min(lum1, lum2)

  return (brightest + 0.05) / (darkest + 0.05)
}

/**
 * Check if color combination meets WCAG contrast requirements
 */
export function meetsContrastRequirement(
  foreground: string,
  background: string,
  level: 'AA' | 'AAA' = 'AA',
  size: 'normal' | 'large' = 'normal'
): boolean {
  const ratio = getContrastRatio(foreground, background)
  
  const requirements = {
    'AA': { normal: 4.5, large: 3 },
    'AAA': { normal: 7, large: 4.5 }
  }

  return ratio >= requirements[level][size]
}

// ==================== ARIA UTILITIES ====================

/**
 * Generate ARIA attributes for form controls
 */
export function getFormControlAria(
  id: string,
  isRequired: boolean = false,
  isInvalid: boolean = false,
  errorId?: string,
  describedById?: string
) {
  const aria: Record<string, any> = {
    id,
    'aria-required': isRequired,
    'aria-invalid': isInvalid,
  }

  if (isInvalid && errorId) {
    aria['aria-describedby'] = describedById ? `${describedById} ${errorId}` : errorId
  } else if (describedById) {
    aria['aria-describedby'] = describedById
  }

  return aria
}

/**
 * Generate ARIA attributes for disclosure widgets (accordions, dropdowns)
 */
export function getDisclosureAria(
  isExpanded: boolean,
  triggerId: string,
  contentId: string
) {
  return {
    trigger: {
      'aria-expanded': isExpanded,
      'aria-controls': contentId,
      id: triggerId,
    },
    content: {
      'aria-labelledby': triggerId,
      id: contentId,
      hidden: !isExpanded,
    }
  }
}

// ==================== SKIP LINKS ====================

/**
 * Component for skip navigation links
 */
export function createSkipLink(targetId: string, label: string) {
  return {
    href: `#${targetId}`,
    className: "sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-50 focus:p-4 focus:bg-primary focus:text-primary-foreground",
    children: label,
    onClick: (e: React.MouseEvent) => {
      e.preventDefault()
      const target = document.getElementById(targetId)
      if (target) {
        target.focus()
        target.scrollIntoView({ behavior: 'smooth' })
      }
    }
  }
}

// ==================== ACCESSIBILITY TESTING ====================

/**
 * Check for common accessibility issues
 */
export function checkAccessibility(element: HTMLElement): string[] {
  const issues: string[] = []

  // Check for missing alt text on images
  const images = element.querySelectorAll('img')
  images.forEach(img => {
    if (!img.alt && !img.getAttribute('aria-label')) {
      issues.push(`Image missing alt text: ${img.src}`)
    }
  })

  // Check for missing form labels
  const inputs = element.querySelectorAll('input, select, textarea')
  inputs.forEach(input => {
    const id = input.id
    const label = id ? element.querySelector(`label[for="${id}"]`) : null
    const ariaLabel = input.getAttribute('aria-label')
    const ariaLabelledBy = input.getAttribute('aria-labelledby')
    
    if (!label && !ariaLabel && !ariaLabelledBy) {
      issues.push(`Form control missing label: ${input.tagName}`)
    }
  })

  // Check for insufficient color contrast
  const textElements = element.querySelectorAll('*')
  textElements.forEach(el => {
    const styles = window.getComputedStyle(el)
    const color = styles.color
    const backgroundColor = styles.backgroundColor
    
    if (color && backgroundColor && color !== 'rgba(0, 0, 0, 0)' && backgroundColor !== 'rgba(0, 0, 0, 0)') {
      // Convert to hex for contrast checking (simplified)
      // In a real implementation, you'd want more robust color parsing
    }
  })

  // Check for missing headings hierarchy
  const headings = Array.from(element.querySelectorAll('h1, h2, h3, h4, h5, h6'))
  let previousLevel = 0
  headings.forEach(heading => {
    const level = parseInt(heading.tagName.charAt(1))
    if (level > previousLevel + 1) {
      issues.push(`Heading level skipped: ${heading.tagName} after h${previousLevel}`)
    }
    previousLevel = level
  })

  return issues
}

// ==================== EXPORTS ====================

export const accessibility = {
  useFocusTrap,
  useFocusRestore,
  useFocusVisible,
  useLiveRegion,
  useAccessibleId,
  useArrowNavigation,
  useReducedMotion,
  getContrastRatio,
  meetsContrastRequirement,
  getFormControlAria,
  getDisclosureAria,
  createSkipLink,
  checkAccessibility,
}

export default accessibility 