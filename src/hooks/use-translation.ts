'use client'

import { useState, useEffect } from 'react'

// Simple translation dictionary
const translations: Record<string, Record<string, string>> = {
  en: {
    // Common
    'save': 'Save',
    'cancel': 'Cancel',
    'loading': 'Loading...',
    'error': 'Error',
    'success': 'Success',
    'settings': 'Settings',
    'language': 'Language',
    'enabled': 'Enabled',
    'disabled': 'Disabled',
    
    // AI Settings
    'ai_settings': 'AI Settings',
    'auto_processing': 'Auto Processing',
    'auto_processing_description': 'Automatically process bookmarks with AI recommendations',
    'processing_language': 'Processing Language',
    'processing_language_description': 'Language to use for AI processing and recommendations',
    'ai_model': 'AI Model',
    'ai_model_description': 'Select the AI model to use for processing',
    'enable_auto_processing': 'Enable Auto Processing',
    'processing_delay': 'Processing Delay',
    'processing_delay_description': 'Delay before processing new bookmarks (seconds)',
    
    // DNA Profile
    'dna_profile': 'DNA Profile',
    'about_you': 'About You',
    'favorites': 'Favorites',
    'analytics': 'Analytics',
    'search': 'Search',
    'playbooks': 'Playbooks',
    'time_capsule': 'Time Capsule',
  },
  es: {
    // Common
    'save': 'Guardar',
    'cancel': 'Cancelar',
    'loading': 'Cargando...',
    'error': 'Error',
    'success': 'Éxito',
    'settings': 'Configuración',
    'language': 'Idioma',
    'enabled': 'Habilitado',
    'disabled': 'Deshabilitado',
    
    // AI Settings
    'ai_settings': 'Configuración de IA',
    'auto_processing': 'Procesamiento Automático',
    'auto_processing_description': 'Procesar automáticamente marcadores con recomendaciones de IA',
    'processing_language': 'Idioma de Procesamiento',
    'processing_language_description': 'Idioma a usar para procesamiento y recomendaciones de IA',
    'ai_model': 'Modelo de IA',
    'ai_model_description': 'Seleccionar el modelo de IA para procesamiento',
    'enable_auto_processing': 'Habilitar Procesamiento Automático',
    'processing_delay': 'Retraso de Procesamiento',
    'processing_delay_description': 'Retraso antes de procesar nuevos marcadores (segundos)',
    
    // DNA Profile
    'dna_profile': 'Perfil ADN',
    'about_you': 'Acerca de Ti',
    'favorites': 'Favoritos',
    'analytics': 'Analíticas',
    'search': 'Buscar',
    'playbooks': 'Manuales',
    'time_capsule': 'Cápsula del Tiempo',
  },
  fr: {
    // Common
    'save': 'Sauvegarder',
    'cancel': 'Annuler',
    'loading': 'Chargement...',
    'error': 'Erreur',
    'success': 'Succès',
    'settings': 'Paramètres',
    'language': 'Langue',
    'enabled': 'Activé',
    'disabled': 'Désactivé',
    
    // AI Settings
    'ai_settings': 'Paramètres IA',
    'auto_processing': 'Traitement Automatique',
    'auto_processing_description': 'Traiter automatiquement les signets avec des recommandations IA',
    'processing_language': 'Langue de Traitement',
    'processing_language_description': 'Langue à utiliser pour le traitement et les recommandations IA',
    'ai_model': 'Modèle IA',
    'ai_model_description': 'Sélectionner le modèle IA pour le traitement',
    'enable_auto_processing': 'Activer le Traitement Automatique',
    'processing_delay': 'Délai de Traitement',
    'processing_delay_description': 'Délai avant de traiter les nouveaux signets (secondes)',
    
    // DNA Profile
    'dna_profile': 'Profil ADN',
    'about_you': 'À Propos de Vous',
    'favorites': 'Favoris',
    'analytics': 'Analytiques',
    'search': 'Rechercher',
    'playbooks': 'Guides',
    'time_capsule': 'Capsule Temporelle',
  }
}

export function useTranslation(initialLocale: string = 'en') {
  const [locale, setLocale] = useState(initialLocale)

  const t = (key: string, fallback?: string): string => {
    const translation = translations[locale]?.[key] || translations['en']?.[key] || fallback || key
    return translation
  }

  const changeLanguage = (newLocale: string) => {
    if (translations[newLocale]) {
      setLocale(newLocale)
      // Optionally store in localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('preferred-language', newLocale)
      }
    }
  }

  // Load saved language preference on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedLocale = localStorage.getItem('preferred-language')
      if (savedLocale && translations[savedLocale]) {
        setLocale(savedLocale)
      }
    }
  }, [])

  return {
    t,
    locale,
    changeLanguage,
    availableLocales: Object.keys(translations)
  }
}

export default useTranslation 