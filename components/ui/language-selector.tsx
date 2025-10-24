'use client'

import React, { useState } from 'react'
import { Check, ChevronDown, Globe, Languages } from 'lucide-react'
import { useTranslation, type SupportedLanguage, SUPPORTED_LANGUAGES } from '@/hooks/use-translation'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface LanguageSelectorProps {
  variant?: 'default' | 'compact' | 'minimal' | 'flag-only'
  showFlag?: boolean
  className?: string
  buttonClassName?: string
  menuClassName?: string
  placement?: 'bottom' | 'top' | 'left' | 'right'
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function LanguageSelector({
  variant = 'default',
  showFlag = true,
  className,
  buttonClassName,
  menuClassName,
  placement = 'bottom',
  disabled = false,
  size = 'md'
}: LanguageSelectorProps) {
  const { language, setLanguage, t, availableLanguages } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)

  const currentLangInfo = availableLanguages[language]
  const supportedLanguagesArray = Object.entries(availableLanguages).map(([code, info]) => ({
    code: code as SupportedLanguage,
    ...info
  }))

  const handleLanguageChange = (languageCode: SupportedLanguage) => {
    setIsOpen(false)
    setLanguage(languageCode)
  }

  const sizeClasses = {
    sm: 'h-8 px-2 text-xs',
    md: 'h-9 px-3 text-sm',
    lg: 'h-10 px-4 text-base'
  }

  const renderButtonContent = () => {
    switch (variant) {
      case 'flag-only':
        return (
          <span className="text-lg" title={currentLangInfo.name}>
            {currentLangInfo.flag}
          </span>
        )
      
      case 'minimal':
        return (
          <div className="flex items-center gap-1">
            {showFlag && <span className="text-sm">{currentLangInfo.flag}</span>}
            <span className="font-medium uppercase tracking-wide">
              {language}
            </span>
          </div>
        )
      
      case 'compact':
        return (
          <div className="flex items-center gap-2">
            {showFlag && <span>{currentLangInfo.flag}</span>}
            <span className="font-medium">{currentLangInfo.name}</span>
          </div>
        )
      
      default:
        return (
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            {showFlag && <span>{currentLangInfo.flag}</span>}
            <span className="font-medium">{currentLangInfo.name}</span>
          </div>
        )
    }
  }

  const getDropdownItemContent = (lang: typeof supportedLanguagesArray[0]) => {
    const isSelected = lang.code === language
    
    return (
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-3">
          <span className="text-lg" role="img" aria-label={lang.name}>
            {lang.flag}
          </span>
          <div className="flex flex-col">
            <span className="font-medium">{lang.name}</span>
            <span className="text-xs text-muted-foreground uppercase">
              {lang.code}
            </span>
          </div>
        </div>
        {isSelected && (
          <Check className="h-4 w-4 text-primary" />
        )}
      </div>
    )
  }

  return (
    <div className={cn('relative', className)}>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            disabled={disabled}
            className={cn(
              'justify-between',
              sizeClasses[size],
              variant === 'flag-only' && 'w-10 p-0',
              buttonClassName
            )}
          >
            {renderButtonContent()}
            {variant !== 'flag-only' && (
              <ChevronDown className="h-4 w-4 opacity-50" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          className={cn('w-56 max-h-80 overflow-y-auto', menuClassName)}
          align={placement === 'left' ? 'start' : placement === 'right' ? 'end' : 'center'}
          side={placement === 'top' ? 'top' : 'bottom'}
        >
          {supportedLanguagesArray.map((lang) => (
            <DropdownMenuItem
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              className="cursor-pointer"
            >
              {getDropdownItemContent(lang)}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

// Export variant components for convenience
export function CompactLanguageSelector(props: Omit<LanguageSelectorProps, 'variant'>) {
  return <LanguageSelector {...props} variant="compact" />
}

export function MinimalLanguageSelector(props: Omit<LanguageSelectorProps, 'variant'>) {
  return <LanguageSelector {...props} variant="minimal" />
}

export function FlagLanguageSelector(props: Omit<LanguageSelectorProps, 'variant'>) {
  return <LanguageSelector {...props} variant="flag-only" />
}

interface PopularLanguagesSelectorProps extends LanguageSelectorProps {
  popularLanguages?: SupportedLanguage[]
}

export function PopularLanguagesSelector({
  popularLanguages = ['en', 'es', 'fr', 'de', 'it', 'pt', 'ja', 'ko', 'zh'],
  ...props
}: PopularLanguagesSelectorProps) {
  const { language, setLanguage, availableLanguages } = useTranslation()

  const popularLangsData = popularLanguages
    .map(code => ({ code, ...availableLanguages[code] }))
    .filter(Boolean)

  const handleLanguageChange = (languageCode: SupportedLanguage) => {
    setLanguage(languageCode)
  }

  return (
    <div className="flex items-center gap-2">
      {popularLangsData.map((lang) => (
        <Button
          key={lang.code}
          variant={language === lang.code ? "default" : "outline"}
          size="sm"
          onClick={() => handleLanguageChange(lang.code)}
          className="h-8 px-2"
        >
          <span className="mr-1">{lang.flag}</span>
          <span className="text-xs uppercase">{lang.code}</span>
        </Button>
      ))}
      <LanguageSelector {...props} variant="minimal" />
    </div>
  )
}

interface LanguageGridProps {
  className?: string
  columns?: number
  showSearch?: boolean
}

export function LanguageGrid({ 
  className, 
  columns = 4,
  showSearch = true 
}: LanguageGridProps) {
  const { language, setLanguage, availableLanguages } = useTranslation()
  const [searchQuery, setSearchQuery] = useState('')

  const supportedLanguagesArray = Object.entries(availableLanguages).map(([code, info]) => ({
    code: code as SupportedLanguage,
    ...info
  }))

  const filteredLanguages = supportedLanguagesArray.filter(lang =>
    lang.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lang.code.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleLanguageChange = (languageCode: SupportedLanguage) => {
    setLanguage(languageCode)
  }

  return (
    <div className={cn('space-y-4', className)}>
      {showSearch && (
        <div className="relative">
          <input
            type="text"
            placeholder="Search languages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm"
          />
          <Languages className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
        </div>
      )}
      
      <div 
        className={`grid gap-2`}
        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      >
        {filteredLanguages.map((lang) => (
          <Button
            key={lang.code}
            variant={language === lang.code ? "default" : "outline"}
            onClick={() => handleLanguageChange(lang.code)}
            className="h-auto p-3 flex flex-col items-center gap-1 relative"
          >
            {language === lang.code && (
              <Check className="absolute top-1 right-1 h-3 w-3" />
            )}
            <span className="text-lg">{lang.flag}</span>
            <span className="text-xs font-medium">{lang.name}</span>
            <span className="text-xs text-muted-foreground uppercase">{lang.code}</span>
          </Button>
        ))}
      </div>
      
      {filteredLanguages.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <Languages className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No languages found matching "{searchQuery}"</p>
        </div>
      )}
    </div>
  )
} 