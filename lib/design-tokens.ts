/**
 * BookAIMark Design Tokens System
 * 
 * Centralized design tokens for consistent theming across the application.
 * These tokens define the visual language of the BookAIMark brand.
 */

// ==================== COLOR SYSTEM ====================

export const colors = {
  // Primary Brand Colors
  primary: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6', // Main brand color
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
    950: '#172554',
  },
  
  // Secondary Colors
  secondary: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
    950: '#020617',
  },
  
  // Accent Colors
  accent: {
    purple: {
      50: '#faf5ff',
      500: '#a855f7',
      600: '#9333ea',
    },
    emerald: {
      50: '#ecfdf5',
      500: '#10b981',
      600: '#059669',
    },
    amber: {
      50: '#fffbeb',
      500: '#f59e0b',
      600: '#d97706',
    },
    rose: {
      50: '#fff1f2',
      500: '#f43f5e',
      600: '#e11d48',
    },
  },
  
  // Semantic Colors
  semantic: {
    success: {
      50: '#f0fdf4',
      100: '#dcfce7',
      500: '#22c55e',
      600: '#16a34a',
      700: '#15803d',
    },
    warning: {
      50: '#fffbeb',
      100: '#fef3c7',
      500: '#f59e0b',
      600: '#d97706',
      700: '#b45309',
    },
    error: {
      50: '#fef2f2',
      100: '#fee2e2',
      500: '#ef4444',
      600: '#dc2626',
      700: '#b91c1c',
    },
    info: {
      50: '#eff6ff',
      100: '#dbeafe',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
    },
  },
  
  // Neutral Grays
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
    950: '#030712',
  },
  
  // Bookmark-specific colors
  bookmark: {
    category: {
      technology: '#3b82f6',
      design: '#8b5cf6',
      business: '#10b981',
      education: '#f59e0b',
      entertainment: '#f43f5e',
      news: '#06b6d4',
      tools: '#84cc16',
      research: '#ec4899',
    },
    priority: {
      high: '#ef4444',
      medium: '#f59e0b',
      low: '#22c55e',
    },
    status: {
      active: '#22c55e',
      archived: '#6b7280',
      broken: '#ef4444',
      pending: '#f59e0b',
    },
  },
} as const;

// ==================== TYPOGRAPHY SYSTEM ====================

export const typography = {
  fontFamily: {
    sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
    mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
    display: ['Cal Sans', 'Inter', 'system-ui', 'sans-serif'],
  },
  
  fontSize: {
    xs: ['0.75rem', { lineHeight: '1rem' }],
    sm: ['0.875rem', { lineHeight: '1.25rem' }],
    base: ['1rem', { lineHeight: '1.5rem' }],
    lg: ['1.125rem', { lineHeight: '1.75rem' }],
    xl: ['1.25rem', { lineHeight: '1.75rem' }],
    '2xl': ['1.5rem', { lineHeight: '2rem' }],
    '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
    '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
    '5xl': ['3rem', { lineHeight: '1' }],
    '6xl': ['3.75rem', { lineHeight: '1' }],
    '7xl': ['4.5rem', { lineHeight: '1' }],
    '8xl': ['6rem', { lineHeight: '1' }],
    '9xl': ['8rem', { lineHeight: '1' }],
  },
  
  fontWeight: {
    thin: '100',
    extralight: '200',
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
    black: '900',
  },
  
  lineHeight: {
    none: '1',
    tight: '1.25',
    snug: '1.375',
    normal: '1.5',
    relaxed: '1.625',
    loose: '2',
  },
  
  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0em',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },
} as const;

// ==================== SPACING SYSTEM ====================

export const spacing = {
  0: '0px',
  px: '1px',
  0.5: '0.125rem',
  1: '0.25rem',
  1.5: '0.375rem',
  2: '0.5rem',
  2.5: '0.625rem',
  3: '0.75rem',
  3.5: '0.875rem',
  4: '1rem',
  5: '1.25rem',
  6: '1.5rem',
  7: '1.75rem',
  8: '2rem',
  9: '2.25rem',
  10: '2.5rem',
  11: '2.75rem',
  12: '3rem',
  14: '3.5rem',
  16: '4rem',
  20: '5rem',
  24: '6rem',
  28: '7rem',
  32: '8rem',
  36: '9rem',
  40: '10rem',
  44: '11rem',
  48: '12rem',
  52: '13rem',
  56: '14rem',
  60: '15rem',
  64: '16rem',
  72: '18rem',
  80: '20rem',
  96: '24rem',
} as const;

// ==================== BORDER RADIUS SYSTEM ====================

export const borderRadius = {
  none: '0px',
  sm: '0.125rem',
  base: '0.25rem',
  md: '0.375rem',
  lg: '0.5rem',
  xl: '0.75rem',
  '2xl': '1rem',
  '3xl': '1.5rem',
  full: '9999px',
} as const;

// ==================== SHADOW SYSTEM ====================

export const shadows = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  base: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
  none: '0 0 #0000',
  
  // Colored shadows for brand elements
  brand: {
    sm: '0 1px 2px 0 rgb(59 130 246 / 0.15)',
    md: '0 4px 6px -1px rgb(59 130 246 / 0.15), 0 2px 4px -2px rgb(59 130 246 / 0.15)',
    lg: '0 10px 15px -3px rgb(59 130 246 / 0.15), 0 4px 6px -4px rgb(59 130 246 / 0.15)',
  },
  
  // Glow effects for interactive elements
  glow: {
    sm: '0 0 0 1px rgb(59 130 246 / 0.3), 0 1px 2px 0 rgb(59 130 246 / 0.15)',
    md: '0 0 0 1px rgb(59 130 246 / 0.3), 0 4px 6px -1px rgb(59 130 246 / 0.15)',
    lg: '0 0 0 1px rgb(59 130 246 / 0.3), 0 10px 15px -3px rgb(59 130 246 / 0.15)',
  },
} as const;

// ==================== ANIMATION SYSTEM ====================

export const animations = {
  duration: {
    75: '75ms',
    100: '100ms',
    150: '150ms',
    200: '200ms',
    300: '300ms',
    500: '500ms',
    700: '700ms',
    1000: '1000ms',
  },
  
  timing: {
    linear: 'linear',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  },
  
  keyframes: {
    fadeIn: {
      from: { opacity: '0' },
      to: { opacity: '1' },
    },
    fadeOut: {
      from: { opacity: '1' },
      to: { opacity: '0' },
    },
    slideInUp: {
      from: { transform: 'translateY(100%)', opacity: '0' },
      to: { transform: 'translateY(0)', opacity: '1' },
    },
    slideInDown: {
      from: { transform: 'translateY(-100%)', opacity: '0' },
      to: { transform: 'translateY(0)', opacity: '1' },
    },
    slideInLeft: {
      from: { transform: 'translateX(-100%)', opacity: '0' },
      to: { transform: 'translateX(0)', opacity: '1' },
    },
    slideInRight: {
      from: { transform: 'translateX(100%)', opacity: '0' },
      to: { transform: 'translateX(0)', opacity: '1' },
    },
    scaleIn: {
      from: { transform: 'scale(0.95)', opacity: '0' },
      to: { transform: 'scale(1)', opacity: '1' },
    },
    scaleOut: {
      from: { transform: 'scale(1)', opacity: '1' },
      to: { transform: 'scale(0.95)', opacity: '0' },
    },
    spin: {
      from: { transform: 'rotate(0deg)' },
      to: { transform: 'rotate(360deg)' },
    },
    pulse: {
      '0%, 100%': { opacity: '1' },
      '50%': { opacity: '0.5' },
    },
    bounce: {
      '0%, 100%': { transform: 'translateY(-25%)', animationTimingFunction: 'cubic-bezier(0.8, 0, 1, 1)' },
      '50%': { transform: 'translateY(0)', animationTimingFunction: 'cubic-bezier(0, 0, 0.2, 1)' },
    },
  },
} as const;

// ==================== BREAKPOINT SYSTEM ====================

export const breakpoints = {
  xs: '475px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
  '3xl': '1920px',
} as const;

// ==================== Z-INDEX SYSTEM ====================

export const zIndex = {
  auto: 'auto',
  0: '0',
  10: '10',
  20: '20',
  30: '30',
  40: '40',
  50: '50',
  
  // Semantic z-index values
  dropdown: '1000',
  sticky: '1020',
  fixed: '1030',
  modal: '1040',
  popover: '1050',
  tooltip: '1060',
  toast: '1070',
  overlay: '1080',
  maximum: '9999',
} as const;

// ==================== COMPONENT VARIANTS ====================

export const componentVariants = {
  size: {
    xs: 'xs',
    sm: 'sm',
    md: 'md',
    lg: 'lg',
    xl: 'xl',
  },
  
  variant: {
    default: 'default',
    primary: 'primary',
    secondary: 'secondary',
    outline: 'outline',
    ghost: 'ghost',
    link: 'link',
    destructive: 'destructive',
  },
  
  state: {
    default: 'default',
    hover: 'hover',
    active: 'active',
    focus: 'focus',
    disabled: 'disabled',
    loading: 'loading',
  },
} as const;

// ==================== ACCESSIBILITY TOKENS ====================

export const accessibility = {
  // Focus ring styles
  focusRing: {
    width: '2px',
    style: 'solid',
    color: colors.primary[500],
    offset: '2px',
  },
  
  // High contrast mode support
  highContrast: {
    border: '1px solid ButtonText',
    background: 'ButtonFace',
    color: 'ButtonText',
  },
  
  // Reduced motion preferences
  reducedMotion: {
    duration: '0.01ms',
    timing: 'linear',
  },
  
  // Touch target sizes (minimum 44px for accessibility)
  touchTarget: {
    minimum: '44px',
    comfortable: '48px',
    spacious: '56px',
  },
  
  // Color contrast ratios
  contrast: {
    aa: '4.5:1',
    aaa: '7:1',
    aaLarge: '3:1',
    aaaLarge: '4.5:1',
  },
} as const;

// ==================== THEME CONFIGURATION ====================

export const themes = {
  light: {
    background: colors.gray[50],
    foreground: colors.gray[900],
    card: '#ffffff',
    cardForeground: colors.gray[900],
    popover: '#ffffff',
    popoverForeground: colors.gray[900],
    primary: colors.primary[500],
    primaryForeground: '#ffffff',
    secondary: colors.gray[100],
    secondaryForeground: colors.gray[900],
    muted: colors.gray[100],
    mutedForeground: colors.gray[500],
    accent: colors.gray[100],
    accentForeground: colors.gray[900],
    destructive: colors.semantic.error[500],
    destructiveForeground: '#ffffff',
    border: colors.gray[200],
    input: colors.gray[200],
    ring: colors.primary[500],
  },
  
  dark: {
    background: colors.gray[950],
    foreground: colors.gray[50],
    card: colors.gray[900],
    cardForeground: colors.gray[50],
    popover: colors.gray[900],
    popoverForeground: colors.gray[50],
    primary: colors.primary[400],
    primaryForeground: colors.gray[900],
    secondary: colors.gray[800],
    secondaryForeground: colors.gray[50],
    muted: colors.gray[800],
    mutedForeground: colors.gray[400],
    accent: colors.gray[800],
    accentForeground: colors.gray[50],
    destructive: colors.semantic.error[500],
    destructiveForeground: '#ffffff',
    border: colors.gray[800],
    input: colors.gray[800],
    ring: colors.primary[400],
  },
} as const;

// ==================== UTILITY FUNCTIONS ====================

/**
 * Get a color value from the design tokens
 */
export function getColor(path: string): string {
  const keys = path.split('.');
  let current: any = colors;
  
  for (const key of keys) {
    if (current[key] === undefined) {
      console.warn(`Color token "${path}" not found`);
      return colors.gray[500];
    }
    current = current[key];
  }
  
  return current;
}

/**
 * Get spacing value with units
 */
export function getSpacing(value: keyof typeof spacing): string {
  return spacing[value];
}

/**
 * Get responsive breakpoint media query
 */
export function getBreakpoint(size: keyof typeof breakpoints): string {
  return `@media (min-width: ${breakpoints[size]})`;
}

/**
 * Create CSS custom properties from design tokens
 */
export function createCSSVariables(theme: 'light' | 'dark' = 'light') {
  const themeTokens = themes[theme];
  const cssVars: Record<string, string> = {};
  
  // Add theme colors
  Object.entries(themeTokens).forEach(([key, value]) => {
    cssVars[`--${key}`] = value;
  });
  
  // Add semantic colors
  Object.entries(colors.semantic).forEach(([category, shades]) => {
    Object.entries(shades).forEach(([shade, value]) => {
      cssVars[`--${category}-${shade}`] = value;
    });
  });
  
  return cssVars;
}

// ==================== TYPE EXPORTS ====================

export type ColorToken = keyof typeof colors;
export type SpacingToken = keyof typeof spacing;
export type TypographyToken = keyof typeof typography;
export type ShadowToken = keyof typeof shadows;
export type AnimationToken = keyof typeof animations;
export type BreakpointToken = keyof typeof breakpoints;
export type ZIndexToken = keyof typeof zIndex;
export type ThemeToken = keyof typeof themes;

// Default export for easy access
export const designTokens = {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  animations,
  breakpoints,
  zIndex,
  componentVariants,
  accessibility,
  themes,
  getColor,
  getSpacing,
  getBreakpoint,
  createCSSVariables,
} as const;

export default designTokens; 