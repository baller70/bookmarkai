'use client'

import React from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select'
import { Label } from './label'

interface Language {
  code: string
  name: string
  flag: string
}

const languages: Language[] = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'pt', name: 'Português', flag: '🇵🇹' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'ko', name: '한국어', flag: '🇰🇷' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
]

interface LanguageSelectorProps {
  value?: string
  onValueChange?: (value: string) => void
  label?: string
  description?: string
  className?: string
}

export function LanguageSelector({ 
  value = 'en', 
  onValueChange, 
  label = 'Language',
  description,
  className 
}: LanguageSelectorProps) {
  return (
    <div className={className}>
      {label && (
        <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {label}
        </Label>
      )}
      {description && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
          {description}
        </p>
      )}
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select language" />
        </SelectTrigger>
        <SelectContent>
          {languages.map((language) => (
            <SelectItem key={language.code} value={language.code}>
              <div className="flex items-center space-x-2">
                <span>{language.flag}</span>
                <span>{language.name}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

export default LanguageSelector 