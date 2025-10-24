"use client"
import { ThemeProvider as NextThemeProvider } from "next-themes"
import { ReactNode } from "react"
import React, { useEffect } from 'react';

interface Props {
  children: ReactNode
  defaultTheme?: string
  enableSystem?: boolean
  attribute?: string
}

export function ThemeProvider({
  children,
  defaultTheme = "system",
  enableSystem = true,
  attribute = "class",
}: Props) {
  return (
    <NextThemeProvider
      defaultTheme={defaultTheme}
      enableSystem={enableSystem}
      attribute={attribute as any}
    >
      {children}
    </NextThemeProvider>
  )
}

// Global settings provider that applies user settings across all pages
export function GlobalSettingsProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Load settings from localStorage and apply background pattern
    const loadAndApplySettings = () => {
      if (typeof window === 'undefined') return;
      
      try {
        const savedSettings = localStorage.getItem('userSettings');
        console.log('Raw saved settings:', savedSettings);
        
        if (savedSettings) {
          const settings = JSON.parse(savedSettings);
          console.log('Parsed settings:', settings);
          
          const root = window.document.documentElement;
          console.log('Current HTML classes before:', root.className);
          
          // Remove all existing pattern classes
          const patternClasses = ['bg-pattern-dots', 'bg-pattern-grid', 'bg-pattern-waves', 'bg-pattern-geometric', 'bg-pattern-none'];
          patternClasses.forEach(cls => {
            root.classList.remove(cls);
          });
          console.log('Classes after removal:', root.className);
          
          // Apply the selected background pattern
          const pattern = settings.appearance?.backgroundPattern;
          console.log('Background pattern from settings:', pattern);
          
          if (pattern && pattern !== 'none') {
            const className = `bg-pattern-${pattern}`;
            root.classList.add(className);
            console.log('Applied class:', className);
            console.log('Final HTML classes:', root.className);
            console.log('Class exists on HTML:', root.classList.contains(className));
            
            // Also update CSS custom properties directly for immediate effect
            const patternMap = {
              'dots': {
                pattern: 'radial-gradient(circle, #d1d5db 1.5px, transparent 1.5px)',
                size: '24px 24px'
              },
              'grid': {
                pattern: 'linear-gradient(to right, #e5e7eb 1px, transparent 1px), linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)',
                size: '32px 32px'
              },
              'waves': {
                pattern: 'repeating-linear-gradient(135deg, #a5b4fc 0 2px, transparent 2px 20px), repeating-linear-gradient(-135deg, #a5b4fc 0 2px, transparent 2px 20px)',
                size: '40px 40px'
              },
              'geometric': {
                pattern: 'repeating-linear-gradient(45deg, #fbbf24 0 10px, transparent 10px 20px), repeating-linear-gradient(-45deg, #6366f1 0 10px, transparent 10px 20px)',
                size: '48px 48px'
              }
            };
            
            if (patternMap[pattern]) {
              root.style.setProperty('--active-pattern', patternMap[pattern].pattern);
              root.style.setProperty('--pattern-size', patternMap[pattern].size);
              console.log('Updated CSS custom properties for pattern:', pattern);
            }
          } else if (pattern === 'none') {
            root.classList.add('bg-pattern-none');
            console.log('Applied bg-pattern-none to hide pattern');
          } else {
            console.log('No pattern specified, using default dots');
          }
        } else {
          console.log('No saved settings found');
        }
      } catch (error) {
        console.error('Failed to load user settings:', error);
      }
    };
    
    // Apply settings on mount
    console.log('GlobalSettingsProvider mounting, loading settings...');
    loadAndApplySettings();
    
    // Listen for storage changes (when settings are updated on settings page)
    const handleStorageChange = (e: StorageEvent) => {
      console.log('Storage change detected:', e.key);
      if (e.key === 'userSettings') {
        loadAndApplySettings();
      }
    };
    
    // Listen for custom event for same-window updates
    const handleSettingsUpdate = () => {
      console.log('Custom settings update event received');
      loadAndApplySettings();
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('userSettingsUpdated', handleSettingsUpdate);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('userSettingsUpdated', handleSettingsUpdate);
    };
  }, []);
  
  return <>{children}</>;
} 