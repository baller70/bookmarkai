import { appLogger } from '../../lib/logger';
import { performance } from 'perf_hooks';

const logger = appLogger;

export interface LanguageDetectionResult {
  language: string;
  confidence: number;
  alternativeLanguages: Array<{
    language: string;
    confidence: number;
  }>;
}

export interface TranslationResult {
  originalText: string;
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  confidence: number;
  translatedAt: Date;
  provider: string;
}

export interface LocalizationData {
  language: string;
  region?: string;
  currency?: string;
  dateFormat: string;
  timeFormat: string;
  numberFormat: string;
  rtl: boolean;
  locale: string;
}

export interface LanguageProfile {
  code: string;
  name: string;
  nativeName: string;
  family: string;
  script: string;
  direction: 'ltr' | 'rtl';
  commonWords: string[];
  stopWords: string[];
  characterSets: string[];
}

export interface MultiLanguageContent {
  originalLanguage: string;
  translations: Map<string, {
    text: string;
    confidence: number;
    translatedAt: Date;
  }>;
  detectedLanguages: LanguageDetectionResult[];
  localizationData: LocalizationData;
}

export class LanguageProcessor {
  private supportedLanguages: Map<string, LanguageProfile> = new Map();
  private translationCache: Map<string, TranslationResult> = new Map();
  private detectionCache: Map<string, LanguageDetectionResult> = new Map();

  constructor() {
    this.initializeSupportedLanguages();
  }

  private initializeSupportedLanguages(): void {
    const languages: LanguageProfile[] = [
      {
        code: 'en',
        name: 'English',
        nativeName: 'English',
        family: 'Germanic',
        script: 'Latin',
        direction: 'ltr',
        commonWords: ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has'],
        stopWords: ['a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'],
        characterSets: ['basic-latin', 'latin-1-supplement']
      },
      {
        code: 'es',
        name: 'Spanish',
        nativeName: 'Español',
        family: 'Romance',
        script: 'Latin',
        direction: 'ltr',
        commonWords: ['el', 'la', 'de', 'que', 'y', 'en', 'un', 'es', 'se', 'no', 'te', 'lo', 'le', 'da', 'su', 'por', 'son', 'con', 'para', 'al'],
        stopWords: ['el', 'la', 'de', 'que', 'y', 'en', 'un', 'es', 'se', 'no'],
        characterSets: ['basic-latin', 'latin-1-supplement']
      },
      {
        code: 'fr',
        name: 'French',
        nativeName: 'Français',
        family: 'Romance',
        script: 'Latin',
        direction: 'ltr',
        commonWords: ['le', 'de', 'et', 'à', 'un', 'il', 'être', 'et', 'en', 'avoir', 'que', 'pour', 'dans', 'ce', 'son', 'une', 'sur', 'avec', 'ne', 'se'],
        stopWords: ['le', 'de', 'et', 'à', 'un', 'il', 'être', 'et', 'en', 'avoir'],
        characterSets: ['basic-latin', 'latin-1-supplement']
      },
      {
        code: 'de',
        name: 'German',
        nativeName: 'Deutsch',
        family: 'Germanic',
        script: 'Latin',
        direction: 'ltr',
        commonWords: ['der', 'die', 'und', 'in', 'den', 'von', 'zu', 'das', 'mit', 'sich', 'des', 'auf', 'für', 'ist', 'im', 'dem', 'nicht', 'ein', 'eine', 'als'],
        stopWords: ['der', 'die', 'und', 'in', 'den', 'von', 'zu', 'das', 'mit', 'sich'],
        characterSets: ['basic-latin', 'latin-1-supplement']
      },
      {
        code: 'it',
        name: 'Italian',
        nativeName: 'Italiano',
        family: 'Romance',
        script: 'Latin',
        direction: 'ltr',
        commonWords: ['il', 'di', 'che', 'e', 'la', 'per', 'un', 'in', 'con', 'del', 'da', 'a', 'al', 'le', 'si', 'dei', 'come', 'io', 'lo', 'tutto'],
        stopWords: ['il', 'di', 'che', 'e', 'la', 'per', 'un', 'in', 'con', 'del'],
        characterSets: ['basic-latin', 'latin-1-supplement']
      },
      {
        code: 'pt',
        name: 'Portuguese',
        nativeName: 'Português',
        family: 'Romance',
        script: 'Latin',
        direction: 'ltr',
        commonWords: ['o', 'a', 'de', 'e', 'do', 'da', 'em', 'um', 'para', 'é', 'com', 'não', 'uma', 'os', 'no', 'se', 'na', 'por', 'mais', 'as'],
        stopWords: ['o', 'a', 'de', 'e', 'do', 'da', 'em', 'um', 'para', 'é'],
        characterSets: ['basic-latin', 'latin-1-supplement']
      },
      {
        code: 'ru',
        name: 'Russian',
        nativeName: 'Русский',
        family: 'Slavic',
        script: 'Cyrillic',
        direction: 'ltr',
        commonWords: ['в', 'и', 'не', 'на', 'я', 'быть', 'он', 'с', 'что', 'а', 'по', 'это', 'она', 'этот', 'к', 'но', 'они', 'мы', 'как', 'из'],
        stopWords: ['в', 'и', 'не', 'на', 'я', 'быть', 'он', 'с', 'что', 'а'],
        characterSets: ['cyrillic']
      },
      {
        code: 'zh',
        name: 'Chinese',
        nativeName: '中文',
        family: 'Sino-Tibetan',
        script: 'Han',
        direction: 'ltr',
        commonWords: ['的', '一', '是', '在', '不', '了', '有', '和', '人', '这', '中', '大', '为', '上', '个', '国', '我', '以', '要', '他'],
        stopWords: ['的', '一', '是', '在', '不', '了', '有', '和', '人', '这'],
        characterSets: ['cjk-unified-ideographs']
      },
      {
        code: 'ja',
        name: 'Japanese',
        nativeName: '日本語',
        family: 'Japonic',
        script: 'Han, Hiragana, Katakana',
        direction: 'ltr',
        commonWords: ['の', 'に', 'は', 'を', 'た', 'が', 'で', 'て', 'と', 'し', 'れ', 'さ', 'ある', 'いる', 'も', 'する', 'から', 'な', 'こと', 'として'],
        stopWords: ['の', 'に', 'は', 'を', 'た', 'が', 'で', 'て', 'と', 'し'],
        characterSets: ['hiragana', 'katakana', 'cjk-unified-ideographs']
      },
      {
        code: 'ar',
        name: 'Arabic',
        nativeName: 'العربية',
        family: 'Semitic',
        script: 'Arabic',
        direction: 'rtl',
        commonWords: ['في', 'من', 'إلى', 'على', 'هذا', 'هذه', 'التي', 'الذي', 'كان', 'كانت', 'يكون', 'تكون', 'له', 'لها', 'بعد', 'قبل', 'عند', 'لدى', 'حول', 'خلال'],
        stopWords: ['في', 'من', 'إلى', 'على', 'هذا', 'هذه', 'التي', 'الذي', 'كان', 'كانت'],
        characterSets: ['arabic']
      }
    ];

    languages.forEach(lang => {
      this.supportedLanguages.set(lang.code, lang);
    });
  }

  async detectLanguage(text: string): Promise<LanguageDetectionResult> {
    const startTime = performance.now();
    const cacheKey = this.generateCacheKey(text);

    // Check cache first
    if (this.detectionCache.has(cacheKey)) {
      return this.detectionCache.get(cacheKey)!;
    }

    try {
      logger.info('Starting language detection', { textLength: text.length });

      // Clean and prepare text
      const cleanText = this.cleanTextForAnalysis(text);
      
      // Multiple detection methods
      const results = [
        this.detectByCharacterSet(cleanText),
        this.detectByCommonWords(cleanText),
        this.detectByNGrams(cleanText),
        this.detectByStatisticalAnalysis(cleanText)
      ];

      // Combine results with weighted scoring
      const languageScores = new Map<string, number>();
      
      results.forEach((result, index) => {
        const weight = [0.3, 0.4, 0.2, 0.1][index]; // Weights for each method
        result.forEach(({ language, confidence }) => {
          const currentScore = languageScores.get(language) || 0;
          languageScores.set(language, currentScore + (confidence * weight));
        });
      });

      // Sort by confidence and create result
      const sortedResults = Array.from(languageScores.entries())
        .map(([language, confidence]) => ({ language, confidence }))
        .sort((a, b) => b.confidence - a.confidence);

      const result: LanguageDetectionResult = {
        language: sortedResults[0]?.language || 'unknown',
        confidence: sortedResults[0]?.confidence || 0,
        alternativeLanguages: sortedResults.slice(1, 4)
      };

      // Cache result
      this.detectionCache.set(cacheKey, result);

      const duration = performance.now() - startTime;
      logger.info('Language detection completed', { 
        detectedLanguage: result.language,
        confidence: result.confidence,
        duration: Math.round(duration)
      });

      return result;

    } catch (error) {
      const duration = performance.now() - startTime;
      logger.error('Language detection failed', error as Error, { 
        textLength: text.length,
        duration: Math.round(duration)
      });
      
      return {
        language: 'unknown',
        confidence: 0,
        alternativeLanguages: []
      };
    }
  }

  async translateText(
    text: string, 
    targetLanguage: string, 
    sourceLanguage?: string
  ): Promise<TranslationResult> {
    const startTime = performance.now();
    const cacheKey = `${sourceLanguage || 'auto'}-${targetLanguage}-${this.generateCacheKey(text)}`;

    // Check cache first
    if (this.translationCache.has(cacheKey)) {
      return this.translationCache.get(cacheKey)!;
    }

    try {
      logger.info('Starting translation', { 
        sourceLanguage: sourceLanguage || 'auto',
        targetLanguage,
        textLength: text.length 
      });

      // Detect source language if not provided
      let detectedSourceLanguage = sourceLanguage;
      if (!sourceLanguage) {
        const detection = await this.detectLanguage(text);
        detectedSourceLanguage = detection.language;
      }

      // For demo purposes, we'll simulate translation
      // In a real implementation, you'd integrate with Google Translate, DeepL, etc.
      const translatedText = await this.simulateTranslation(text, detectedSourceLanguage!, targetLanguage);

      const result: TranslationResult = {
        originalText: text,
        translatedText,
        sourceLanguage: detectedSourceLanguage!,
        targetLanguage,
        confidence: 0.85, // Simulated confidence
        translatedAt: new Date(),
        provider: 'BookAIMark-Translator'
      };

      // Cache result
      this.translationCache.set(cacheKey, result);

      const duration = performance.now() - startTime;
      logger.info('Translation completed', { 
        sourceLanguage: detectedSourceLanguage,
        targetLanguage,
        confidence: result.confidence,
        duration: Math.round(duration)
      });

      return result;

    } catch (error) {
      const duration = performance.now() - startTime;
      logger.error('Translation failed', error as Error, { 
        sourceLanguage: sourceLanguage || 'auto',
        targetLanguage,
        textLength: text.length,
        duration: Math.round(duration)
      });
      
      throw new Error(`Translation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  getLocalizationData(language: string, region?: string): LocalizationData {
    const languageProfile = this.supportedLanguages.get(language);
    
    const localizationMap: Record<string, Partial<LocalizationData>> = {
      'en': {
        currency: 'USD',
        dateFormat: 'MM/DD/YYYY',
        timeFormat: '12h',
        numberFormat: '1,234.56',
        locale: region ? `en-${region}` : 'en-US'
      },
      'es': {
        currency: 'EUR',
        dateFormat: 'DD/MM/YYYY',
        timeFormat: '24h',
        numberFormat: '1.234,56',
        locale: region ? `es-${region}` : 'es-ES'
      },
      'fr': {
        currency: 'EUR',
        dateFormat: 'DD/MM/YYYY',
        timeFormat: '24h',
        numberFormat: '1 234,56',
        locale: region ? `fr-${region}` : 'fr-FR'
      },
      'de': {
        currency: 'EUR',
        dateFormat: 'DD.MM.YYYY',
        timeFormat: '24h',
        numberFormat: '1.234,56',
        locale: region ? `de-${region}` : 'de-DE'
      },
      'zh': {
        currency: 'CNY',
        dateFormat: 'YYYY/MM/DD',
        timeFormat: '24h',
        numberFormat: '1,234.56',
        locale: region ? `zh-${region}` : 'zh-CN'
      },
      'ja': {
        currency: 'JPY',
        dateFormat: 'YYYY/MM/DD',
        timeFormat: '24h',
        numberFormat: '1,234',
        locale: region ? `ja-${region}` : 'ja-JP'
      },
      'ar': {
        currency: 'SAR',
        dateFormat: 'DD/MM/YYYY',
        timeFormat: '12h',
        numberFormat: '1,234.56',
        locale: region ? `ar-${region}` : 'ar-SA'
      }
    };

    const defaults = localizationMap[language] || localizationMap['en'];

    return {
      language,
      region,
      currency: defaults.currency || 'USD',
      dateFormat: defaults.dateFormat || 'MM/DD/YYYY',
      timeFormat: defaults.timeFormat || '12h',
      numberFormat: defaults.numberFormat || '1,234.56',
      rtl: languageProfile?.direction === 'rtl' || false,
      locale: defaults.locale || 'en-US'
    };
  }

  async processMultiLanguageContent(
    text: string,
    targetLanguages: string[] = ['en']
  ): Promise<MultiLanguageContent> {
    const detection = await this.detectLanguage(text);
    const translations = new Map();

    // Translate to each target language
    for (const targetLang of targetLanguages) {
      if (targetLang !== detection.language) {
        try {
          const translation = await this.translateText(text, targetLang, detection.language);
          translations.set(targetLang, {
            text: translation.translatedText,
            confidence: translation.confidence,
            translatedAt: translation.translatedAt
          });
        } catch (error) {
          logger.warn(`Failed to translate to ${targetLang}`, { error: error instanceof Error ? error.message : 'Unknown error' });
        }
      }
    }

    return {
      originalLanguage: detection.language,
      translations,
      detectedLanguages: [detection],
      localizationData: this.getLocalizationData(detection.language)
    };
  }

  // Helper methods for language detection
  private cleanTextForAnalysis(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 1000); // Limit to first 1000 characters for analysis
  }

  private detectByCharacterSet(text: string): Array<{language: string; confidence: number}> {
    const results: Array<{language: string; confidence: number}> = [];
    
    for (const [langCode, profile] of this.supportedLanguages) {
      let score = 0;
      const textLength = text.length;
      
      if (profile.script === 'Cyrillic' && /[\u0400-\u04FF]/.test(text)) {
        score = (text.match(/[\u0400-\u04FF]/g) || []).length / textLength;
      } else if (profile.script === 'Arabic' && /[\u0600-\u06FF]/.test(text)) {
        score = (text.match(/[\u0600-\u06FF]/g) || []).length / textLength;
      } else if (profile.characterSets.includes('cjk-unified-ideographs') && /[\u4E00-\u9FFF]/.test(text)) {
        score = (text.match(/[\u4E00-\u9FFF]/g) || []).length / textLength;
      } else if (profile.characterSets.includes('hiragana') && /[\u3040-\u309F]/.test(text)) {
        score = (text.match(/[\u3040-\u309F]/g) || []).length / textLength;
      } else if (profile.script === 'Latin') {
        score = (text.match(/[a-zA-Z]/g) || []).length / textLength;
      }
      
      if (score > 0.1) {
        results.push({ language: langCode, confidence: Math.min(score, 1) });
      }
    }
    
    return results.sort((a, b) => b.confidence - a.confidence);
  }

  private detectByCommonWords(text: string): Array<{language: string; confidence: number}> {
    const results: Array<{language: string; confidence: number}> = [];
    const words = text.split(/\s+/).slice(0, 100); // First 100 words
    
    for (const [langCode, profile] of this.supportedLanguages) {
      const matchCount = words.filter(word => 
        profile.commonWords.includes(word) || profile.stopWords.includes(word)
      ).length;
      
      const confidence = matchCount / Math.min(words.length, profile.commonWords.length);
      
      if (confidence > 0.05) {
        results.push({ language: langCode, confidence });
      }
    }
    
    return results.sort((a, b) => b.confidence - a.confidence);
  }

  private detectByNGrams(text: string): Array<{language: string; confidence: number}> {
    // Simple n-gram analysis (simplified for demo)
    const results: Array<{language: string; confidence: number}> = [];
    const trigrams = this.extractTrigrams(text);
    
    // Language-specific trigram patterns (simplified)
    const patterns: Record<string, string[]> = {
      'en': ['the', 'and', 'ing', 'ion', 'ent', 'tha', 'nth', 'her', 'for', 'ere'],
      'es': ['que', 'ent', 'ion', 'con', 'ado', 'est', 'par', 'aci', 'era', 'nte'],
      'fr': ['que', 'ent', 'ion', 'ait', 'eur', 'lle', 'ire', 'ant', 'our', 'tre'],
      'de': ['der', 'die', 'und', 'ich', 'sch', 'ein', 'ung', 'cht', 'gen', 'hen'],
      'it': ['che', 'ent', 'ion', 'nte', 'sta', 'lla', 'are', 'ere', 'ire', 'per']
    };
    
    for (const [langCode, langPatterns] of Object.entries(patterns)) {
      const matchCount = trigrams.filter(trigram => langPatterns.includes(trigram)).length;
      const confidence = matchCount / Math.min(trigrams.length, langPatterns.length);
      
      if (confidence > 0.1) {
        results.push({ language: langCode, confidence });
      }
    }
    
    return results.sort((a, b) => b.confidence - a.confidence);
  }

  private detectByStatisticalAnalysis(text: string): Array<{language: string; confidence: number}> {
    // Simple statistical analysis based on character frequency
    const results: Array<{language: string; confidence: number}> = [];
    const charFreq = this.calculateCharacterFrequency(text);
    
    // Simplified character frequency patterns for different languages
    const patterns: Record<string, Record<string, number>> = {
      'en': { 'e': 0.127, 't': 0.091, 'a': 0.082, 'o': 0.075, 'i': 0.070 },
      'es': { 'e': 0.137, 'a': 0.125, 'o': 0.087, 's': 0.080, 'r': 0.069 },
      'fr': { 'e': 0.146, 's': 0.081, 'a': 0.076, 'r': 0.066, 'n': 0.061 },
      'de': { 'e': 0.174, 'n': 0.097, 'i': 0.076, 's': 0.072, 'r': 0.070 },
      'it': { 'e': 0.118, 'a': 0.117, 'i': 0.113, 'o': 0.098, 'n': 0.069 }
    };
    
    for (const [langCode, langPattern] of Object.entries(patterns)) {
      let similarity = 0;
      let count = 0;
      
      for (const [char, expectedFreq] of Object.entries(langPattern)) {
        const actualFreq = charFreq.get(char) || 0;
        similarity += 1 - Math.abs(expectedFreq - actualFreq);
        count++;
      }
      
      const confidence = count > 0 ? similarity / count : 0;
      
      if (confidence > 0.5) {
        results.push({ language: langCode, confidence });
      }
    }
    
    return results.sort((a, b) => b.confidence - a.confidence);
  }

  private extractTrigrams(text: string): string[] {
    const trigrams: string[] = [];
    const cleanText = text.replace(/\s+/g, '').toLowerCase();
    
    for (let i = 0; i < cleanText.length - 2; i++) {
      trigrams.push(cleanText.substring(i, i + 3));
    }
    
    return trigrams;
  }

  private calculateCharacterFrequency(text: string): Map<string, number> {
    const freq = new Map<string, number>();
    const cleanText = text.toLowerCase().replace(/[^a-z]/g, '');
    const total = cleanText.length;
    
    for (const char of cleanText) {
      freq.set(char, (freq.get(char) || 0) + 1);
    }
    
    // Convert to relative frequencies
    for (const [char, count] of freq) {
      freq.set(char, count / total);
    }
    
    return freq;
  }

  private async simulateTranslation(text: string, sourceLanguage: string, targetLanguage: string): Promise<string> {
    // This is a simulation - in a real implementation, you'd call a translation API
    if (sourceLanguage === targetLanguage) {
      return text;
    }
    
    // Simple simulation based on language patterns
    const translations: Record<string, Record<string, string>> = {
      'en': {
        'es': 'Texto traducido al español',
        'fr': 'Texte traduit en français',
        'de': 'Ins Deutsche übersetzter Text',
        'it': 'Testo tradotto in italiano'
      },
      'es': {
        'en': 'Text translated to English',
        'fr': 'Texte traduit en français',
        'de': 'Ins Deutsche übersetzter Text'
      }
    };
    
    const translationMap = translations[sourceLanguage];
    if (translationMap && translationMap[targetLanguage]) {
      return `${translationMap[targetLanguage]} (${text.substring(0, 50)}...)`;
    }
    
    return `[Translated from ${sourceLanguage} to ${targetLanguage}] ${text}`;
  }

  private generateCacheKey(text: string): string {
    // Simple hash function for caching
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  // Utility methods
  getSupportedLanguages(): LanguageProfile[] {
    return Array.from(this.supportedLanguages.values());
  }

  isLanguageSupported(languageCode: string): boolean {
    return this.supportedLanguages.has(languageCode);
  }

  getLanguageProfile(languageCode: string): LanguageProfile | undefined {
    return this.supportedLanguages.get(languageCode);
  }

  clearCache(): void {
    this.translationCache.clear();
    this.detectionCache.clear();
    logger.info('Language processor cache cleared');
  }
}

// Export singleton instance
export const languageProcessor = new LanguageProcessor();  