import { openai } from './openai-client';
import { logger } from '../logger';
// // import { performanceMonitor } from '../monitoring/performance-enhanced';

// Category hierarchy types
export interface CategoryHierarchy {
  id: string;
  name: string;
  parent?: string;
  children?: CategoryHierarchy[];
  level: number;
  description?: string;
  keywords: string[];
  patterns: string[];
  confidence: number;
}

export interface CategorySuggestion {
  category: string;
  confidence: number;
  reasoning: string;
  hierarchy: string[];
  alternativeCategories: string[];
  subcategories: string[];
}

export interface CategoryAnalysis {
  primaryCategory: CategorySuggestion;
  secondaryCategories: CategorySuggestion[];
  hierarchyPath: string[];
  confidence: number;
  reasoning: string;
  suggestedSubcategories: string[];
  relatedCategories: string[];
  categoryTags: string[];
}

export interface CategoryLearning {
  userCorrections: Record<string, string>;
  categoryPatterns: Record<string, string[]>;
  confidenceAdjustments: Record<string, number>;
  lastUpdated: string;
}

// Default category hierarchy
const DEFAULT_CATEGORIES: CategoryHierarchy[] = [
  {
    id: 'tech',
    name: 'Technology',
    level: 0,
    keywords: ['programming', 'software', 'code', 'development', 'tech', 'computer', 'digital'],
    patterns: ['github.com', 'stackoverflow.com', 'dev.to', 'medium.com/tech'],
    confidence: 0.9,
    children: [
      {
        id: 'web-dev',
        name: 'Web Development',
        parent: 'tech',
        level: 1,
        keywords: ['html', 'css', 'javascript', 'react', 'vue', 'angular', 'frontend', 'backend'],
        patterns: ['codepen.io', 'jsfiddle.net', 'codesandbox.io'],
        confidence: 0.85
      },
      {
        id: 'mobile-dev',
        name: 'Mobile Development',
        parent: 'tech',
        level: 1,
        keywords: ['ios', 'android', 'react native', 'flutter', 'swift', 'kotlin', 'mobile app'],
        patterns: ['developer.apple.com', 'developer.android.com'],
        confidence: 0.85
      },
      {
        id: 'ai-ml',
        name: 'AI & Machine Learning',
        parent: 'tech',
        level: 1,
        keywords: ['ai', 'machine learning', 'deep learning', 'neural networks', 'tensorflow', 'pytorch'],
        patterns: ['huggingface.co', 'kaggle.com', 'papers.arxiv.org'],
        confidence: 0.85
      }
    ]
  },
  {
    id: 'business',
    name: 'Business & Finance',
    level: 0,
    keywords: ['business', 'finance', 'marketing', 'startup', 'entrepreneurship', 'investment'],
    patterns: ['bloomberg.com', 'forbes.com', 'techcrunch.com'],
    confidence: 0.9,
    children: [
      {
        id: 'marketing',
        name: 'Marketing',
        parent: 'business',
        level: 1,
        keywords: ['marketing', 'advertising', 'branding', 'social media', 'content marketing'],
        patterns: ['hubspot.com', 'mailchimp.com', 'hootsuite.com'],
        confidence: 0.85
      },
      {
        id: 'finance',
        name: 'Finance',
        parent: 'business',
        level: 1,
        keywords: ['finance', 'investment', 'banking', 'cryptocurrency', 'stocks', 'trading'],
        patterns: ['coinbase.com', 'robinhood.com', 'etrade.com'],
        confidence: 0.85
      }
    ]
  },
  {
    id: 'education',
    name: 'Education & Learning',
    level: 0,
    keywords: ['education', 'learning', 'course', 'tutorial', 'university', 'school', 'training'],
    patterns: ['coursera.org', 'udemy.com', 'edx.org', 'khanacademy.org'],
    confidence: 0.9,
    children: [
      {
        id: 'online-courses',
        name: 'Online Courses',
        parent: 'education',
        level: 1,
        keywords: ['mooc', 'online course', 'certification', 'skill development'],
        patterns: ['coursera.org', 'udemy.com', 'pluralsight.com'],
        confidence: 0.85
      }
    ]
  },
  {
    id: 'design',
    name: 'Design & Creative',
    level: 0,
    keywords: ['design', 'ui', 'ux', 'graphics', 'creative', 'art', 'photography'],
    patterns: ['dribbble.com', 'behance.net', 'figma.com', 'adobe.com'],
    confidence: 0.9,
    children: [
      {
        id: 'ui-ux',
        name: 'UI/UX Design',
        parent: 'design',
        level: 1,
        keywords: ['ui design', 'ux design', 'user interface', 'user experience', 'wireframe', 'prototype'],
        patterns: ['figma.com', 'sketch.com', 'invisionapp.com'],
        confidence: 0.85
      }
    ]
  },
  {
    id: 'productivity',
    name: 'Productivity & Tools',
    level: 0,
    keywords: ['productivity', 'tools', 'workflow', 'automation', 'efficiency', 'organization'],
    patterns: ['notion.so', 'trello.com', 'slack.com', 'zapier.com'],
    confidence: 0.9
  },
  {
    id: 'news',
    name: 'News & Media',
    level: 0,
    keywords: ['news', 'media', 'journalism', 'current events', 'politics', 'world news'],
    patterns: ['cnn.com', 'bbc.com', 'reuters.com', 'npr.org'],
    confidence: 0.9
  },
  {
    id: 'entertainment',
    name: 'Entertainment',
    level: 0,
    keywords: ['entertainment', 'movies', 'music', 'games', 'sports', 'tv shows'],
    patterns: ['netflix.com', 'spotify.com', 'youtube.com', 'twitch.tv'],
    confidence: 0.9
  },
  {
    id: 'health',
    name: 'Health & Fitness',
    level: 0,
    keywords: ['health', 'fitness', 'wellness', 'medical', 'nutrition', 'exercise'],
    patterns: ['webmd.com', 'mayoclinic.org', 'healthline.com'],
    confidence: 0.9
  },
  {
    id: 'travel',
    name: 'Travel & Lifestyle',
    level: 0,
    keywords: ['travel', 'tourism', 'lifestyle', 'culture', 'food', 'adventure'],
    patterns: ['booking.com', 'tripadvisor.com', 'airbnb.com'],
    confidence: 0.9
  },
  {
    id: 'shopping',
    name: 'Shopping & E-commerce',
    level: 0,
    keywords: ['shopping', 'ecommerce', 'retail', 'products', 'deals', 'marketplace'],
    patterns: ['amazon.com', 'ebay.com', 'shopify.com', 'etsy.com'],
    confidence: 0.9
  }
];

class SmartCategorizationEngine {
  private categories: CategoryHierarchy[] = DEFAULT_CATEGORIES;
  private learning: CategoryLearning = {
    userCorrections: {},
    categoryPatterns: {},
    confidenceAdjustments: {},
    lastUpdated: new Date().toISOString()
  };

  constructor() {
    this.loadLearningData();
  }

  // Main categorization method
  async categorizeContent(
    title: string,
    url: string,
    content?: string,
    description?: string,
    tags?: string[]
  ): Promise<CategoryAnalysis> {
    const startTime = Date.now();
    
    try {
      logger.info('Starting smart categorization', { title, url });

      // Combine all text for analysis
      const fullText = [title, description, content, tags?.join(' ')].filter(Boolean).join(' ');

      // Get AI-powered categorization
      const aiAnalysis = await this.getAICategorization(fullText, url);
      
      // Get pattern-based categorization
      const patternAnalysis = this.getPatternBasedCategorization(url, fullText);
      
      // Combine and score results
      const finalAnalysis = this.combineAnalyses(aiAnalysis, patternAnalysis);
      
      // Apply learning adjustments
      const adjustedAnalysis = this.applyLearningAdjustments(finalAnalysis);
      
      // Track performance
//       performanceMonitor.recordMetric('smart_categorization_duration', Date.now() - startTime);
//       performanceMonitor.recordMetric('categorization_confidence', adjustedAnalysis.confidence);
      
      logger.info('Smart categorization completed', {
        primaryCategory: adjustedAnalysis.primaryCategory.category,
        confidence: adjustedAnalysis.confidence,
        duration: Date.now() - startTime
      });

      return adjustedAnalysis;
      
    } catch (error) {
      logger.error('Smart categorization failed', error as Error, { title, url });
      
      // Fallback to pattern-based categorization
      const fallbackAnalysis = this.getPatternBasedCategorization(url, title);
      return this.formatAsFallback(fallbackAnalysis);
    }
  }

  // AI-powered categorization using GPT-4
  private async getAICategorization(text: string, url: string): Promise<CategoryAnalysis> {
    const availableCategories = this.getFlatCategoryList();
    
    const prompt = `
Analyze the following content and categorize it intelligently:

Content: "${text}"
URL: "${url}"

Available categories: ${availableCategories.map(c => `${c.name} (${c.id})`).join(', ')}

Please provide a detailed categorization analysis in the following JSON format:
{
  "primaryCategory": {
    "category": "category_id",
    "confidence": 0.95,
    "reasoning": "Detailed explanation of why this category was chosen",
    "hierarchy": ["parent_category", "subcategory"],
    "alternativeCategories": ["alt1", "alt2"],
    "subcategories": ["sub1", "sub2"]
  },
  "secondaryCategories": [
    {
      "category": "category_id",
      "confidence": 0.75,
      "reasoning": "Why this is a secondary match",
      "hierarchy": ["parent"],
      "alternativeCategories": [],
      "subcategories": []
    }
  ],
  "hierarchyPath": ["root", "parent", "child"],
  "confidence": 0.95,
  "reasoning": "Overall categorization reasoning",
  "suggestedSubcategories": ["new_sub1", "new_sub2"],
  "relatedCategories": ["related1", "related2"],
  "categoryTags": ["tag1", "tag2", "tag3"]
}

Focus on accuracy, provide confidence scores, and suggest new subcategories if the content doesn't fit existing ones perfectly.
`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert content categorization system. Analyze content and provide structured categorization with high accuracy and detailed reasoning.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.1,
      max_tokens: 1000
    });

    try {
      const analysis = JSON.parse(response.choices[0].message.content);
      return this.validateAndNormalizeAnalysis(analysis);
    } catch (parseError: any) {
      logger.error('Failed to parse AI categorization response', parseError as Error);
      throw new Error('AI categorization parsing failed');
    }
  }

  // Pattern-based categorization using URL patterns and keywords
  private getPatternBasedCategorization(url: string, text: string): Partial<CategoryAnalysis> {
    const matches: Array<{ category: CategoryHierarchy; score: number; reason: string }> = [];
    
    // Check URL patterns
    for (const category of this.getFlatCategoryList()) {
      let score = 0;
      const reasons: string[] = [];
      
      // URL pattern matching
      for (const pattern of category.patterns || []) {
        if (url.includes(pattern)) {
          score += 0.4;
          reasons.push(`URL matches pattern: ${pattern}`);
        }
      }
      
      // Keyword matching in text
      const textLower = text.toLowerCase();
      for (const keyword of category.keywords || []) {
        if (textLower.includes(keyword.toLowerCase())) {
          score += 0.3;
          reasons.push(`Content contains keyword: ${keyword}`);
        }
      }
      
      if (score > 0) {
        matches.push({
          category,
          score: Math.min(score, 1.0),
          reason: reasons.join(', ')
        });
      }
    }
    
    // Sort by score
    matches.sort((a, b) => b.score - a.score);
    
    if (matches.length === 0) {
      return {
        primaryCategory: {
          category: 'uncategorized',
          confidence: 0.1,
          reasoning: 'No clear pattern or keyword matches found',
          hierarchy: [],
          alternativeCategories: [],
          subcategories: []
        },
        confidence: 0.1
      };
    }
    
    const primary = matches[0];
    const secondary = matches.slice(1, 3);
    
    return {
      primaryCategory: {
        category: primary.category.id,
        confidence: primary.score,
        reasoning: primary.reason,
        hierarchy: this.getCategoryHierarchy(primary.category.id),
        alternativeCategories: secondary.map(m => m.category.id),
        subcategories: primary.category.children?.map(c => c.id) || []
      },
      secondaryCategories: secondary.map(m => ({
        category: m.category.id,
        confidence: m.score,
        reasoning: m.reason,
        hierarchy: this.getCategoryHierarchy(m.category.id),
        alternativeCategories: [],
        subcategories: []
      })),
      confidence: primary.score
    };
  }

  // Combine AI and pattern-based analyses
  private combineAnalyses(aiAnalysis: CategoryAnalysis, patternAnalysis: Partial<CategoryAnalysis>): CategoryAnalysis {
    // If AI analysis has high confidence, use it primarily
    if (aiAnalysis.confidence > 0.8) {
      return {
        ...aiAnalysis,
        // Boost confidence if pattern analysis agrees
        confidence: patternAnalysis.primaryCategory?.category === aiAnalysis.primaryCategory.category
          ? Math.min(aiAnalysis.confidence + 0.1, 1.0)
          : aiAnalysis.confidence
      };
    }
    
    // If pattern analysis has higher confidence, prefer it
    if (patternAnalysis.confidence && patternAnalysis.confidence > aiAnalysis.confidence) {
      return {
        primaryCategory: patternAnalysis.primaryCategory!,
        secondaryCategories: [
          ...(patternAnalysis.secondaryCategories || []),
          aiAnalysis.primaryCategory
        ],
        hierarchyPath: this.getCategoryHierarchy(patternAnalysis.primaryCategory!.category),
        confidence: patternAnalysis.confidence,
        reasoning: `Pattern-based analysis (${patternAnalysis.confidence.toFixed(2)}) preferred over AI analysis (${aiAnalysis.confidence.toFixed(2)})`,
        suggestedSubcategories: aiAnalysis.suggestedSubcategories,
        relatedCategories: aiAnalysis.relatedCategories,
        categoryTags: aiAnalysis.categoryTags
      };
    }
    
    // Combine both analyses
    return {
      ...aiAnalysis,
      secondaryCategories: [
        ...aiAnalysis.secondaryCategories,
        ...(patternAnalysis.secondaryCategories || [])
      ].slice(0, 3), // Limit to top 3 secondary categories
      confidence: (aiAnalysis.confidence + (patternAnalysis.confidence || 0)) / 2
    };
  }

  // Apply learning adjustments based on user corrections
  private applyLearningAdjustments(analysis: CategoryAnalysis): CategoryAnalysis {
    const adjustedAnalysis = { ...analysis };
    
    // Apply confidence adjustments
    const categoryId = analysis.primaryCategory.category;
    if (this.learning.confidenceAdjustments[categoryId]) {
      adjustedAnalysis.confidence = Math.max(
        0.1,
        Math.min(1.0, adjustedAnalysis.confidence + this.learning.confidenceAdjustments[categoryId])
      );
      adjustedAnalysis.primaryCategory.confidence = adjustedAnalysis.confidence;
    }
    
    return adjustedAnalysis;
  }

  // Get category hierarchy path
  private getCategoryHierarchy(categoryId: string): string[] {
    const category = this.findCategoryById(categoryId);
    if (!category) return [];
    
    const hierarchy = [category.name];
    let current = category;
    
    while (current.parent) {
      const parent = this.findCategoryById(current.parent);
      if (parent) {
        hierarchy.unshift(parent.name);
        current = parent;
      } else {
        break;
      }
    }
    
    return hierarchy;
  }

  // Find category by ID
  private findCategoryById(id: string): CategoryHierarchy | null {
    const findInCategories = (categories: CategoryHierarchy[]): CategoryHierarchy | null => {
      for (const category of categories) {
        if (category.id === id) return category;
        if (category.children) {
          const found = findInCategories(category.children);
          if (found) return found;
        }
      }
      return null;
    };
    
    return findInCategories(this.categories);
  }

  // Get flat list of all categories
  private getFlatCategoryList(): CategoryHierarchy[] {
    const flatList: CategoryHierarchy[] = [];
    
    const addToList = (categories: CategoryHierarchy[]) => {
      for (const category of categories) {
        flatList.push(category);
        if (category.children) {
          addToList(category.children);
        }
      }
    };
    
    addToList(this.categories);
    return flatList;
  }

  // Validate and normalize AI analysis
  private validateAndNormalizeAnalysis(analysis: any): CategoryAnalysis {
    // Ensure all required fields exist with defaults
    return {
      primaryCategory: {
        category: analysis.primaryCategory?.category || 'uncategorized',
        confidence: Math.max(0.1, Math.min(1.0, analysis.primaryCategory?.confidence || 0.5)),
        reasoning: analysis.primaryCategory?.reasoning || 'No reasoning provided',
        hierarchy: analysis.primaryCategory?.hierarchy || [],
        alternativeCategories: analysis.primaryCategory?.alternativeCategories || [],
        subcategories: analysis.primaryCategory?.subcategories || []
      },
      secondaryCategories: (analysis.secondaryCategories || []).slice(0, 3),
      hierarchyPath: analysis.hierarchyPath || [],
      confidence: Math.max(0.1, Math.min(1.0, analysis.confidence || 0.5)),
      reasoning: analysis.reasoning || 'No reasoning provided',
      suggestedSubcategories: analysis.suggestedSubcategories || [],
      relatedCategories: analysis.relatedCategories || [],
      categoryTags: analysis.categoryTags || []
    };
  }

  // Format pattern analysis as fallback
  private formatAsFallback(patternAnalysis: Partial<CategoryAnalysis>): CategoryAnalysis {
    return {
      primaryCategory: patternAnalysis.primaryCategory || {
        category: 'uncategorized',
        confidence: 0.1,
        reasoning: 'Fallback categorization - no clear matches found',
        hierarchy: [],
        alternativeCategories: [],
        subcategories: []
      },
      secondaryCategories: patternAnalysis.secondaryCategories || [],
      hierarchyPath: patternAnalysis.hierarchyPath || [],
      confidence: patternAnalysis.confidence || 0.1,
      reasoning: 'Fallback to pattern-based categorization due to AI analysis failure',
      suggestedSubcategories: [],
      relatedCategories: [],
      categoryTags: []
    };
  }

  // Learn from user corrections
  public learnFromCorrection(
    originalCategory: string,
    correctedCategory: string,
    content: string,
    url: string
  ): void {
    // Store user correction
    this.learning.userCorrections[`${originalCategory}->${correctedCategory}`] = correctedCategory;
    
    // Extract patterns from corrected content
    if (!this.learning.categoryPatterns[correctedCategory]) {
      this.learning.categoryPatterns[correctedCategory] = [];
    }
    
    // Add URL pattern if not already present
    const urlPattern = this.extractUrlPattern(url);
    if (urlPattern && !this.learning.categoryPatterns[correctedCategory].includes(urlPattern)) {
      this.learning.categoryPatterns[correctedCategory].push(urlPattern);
    }
    
    // Adjust confidence for the corrected category
    this.learning.confidenceAdjustments[correctedCategory] = 
      (this.learning.confidenceAdjustments[correctedCategory] || 0) + 0.1;
    
    // Decrease confidence for the original incorrect category
    this.learning.confidenceAdjustments[originalCategory] = 
      (this.learning.confidenceAdjustments[originalCategory] || 0) - 0.1;
    
    this.learning.lastUpdated = new Date().toISOString();
    this.saveLearningData();
    
    logger.info('Learning from user correction', {
      originalCategory,
      correctedCategory,
      url: urlPattern
    });
  }

  // Extract URL pattern for learning
  private extractUrlPattern(url: string): string | null {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace('www.', '');
    } catch {
      return null;
    }
  }

  // Load learning data from storage
  private loadLearningData(): void {
    // This would load from a persistent storage in a real implementation
    // For now, we'll use in-memory storage
    logger.info('Loading categorization learning data');
  }

  // Save learning data to storage
  private saveLearningData(): void {
    // This would save to persistent storage in a real implementation
    logger.info('Saving categorization learning data', {
      corrections: Object.keys(this.learning.userCorrections).length,
      patterns: Object.keys(this.learning.categoryPatterns).length,
      adjustments: Object.keys(this.learning.confidenceAdjustments).length
    });
  }

  // Get category suggestions for a given text
  public async getCategorySuggestions(text: string, limit: number = 5): Promise<CategorySuggestion[]> {
    try {
      const analysis = await this.categorizeContent(text, '');
      
      const suggestions: CategorySuggestion[] = [analysis.primaryCategory];
      
      // Add secondary categories
      suggestions.push(...analysis.secondaryCategories.slice(0, limit - 1));
      
      return suggestions.slice(0, limit);
      
    } catch (error: any) {
      logger.error('Failed to get category suggestions', error as Error);
      return [];
    }
  }

  // Get category hierarchy for display
  public getCategoryHierarchyTree(): CategoryHierarchy[] {
    return this.categories;
  }

  // Get category statistics
  public getCategoryStats(): Record<string, any> {
    const stats = {
      totalCategories: this.getFlatCategoryList().length,
      topLevelCategories: this.categories.length,
      learningData: {
        corrections: Object.keys(this.learning.userCorrections).length,
        patterns: Object.keys(this.learning.categoryPatterns).length,
        confidenceAdjustments: Object.keys(this.learning.confidenceAdjustments).length,
        lastUpdated: this.learning.lastUpdated
      },
      categoryDistribution: this.categories.map(cat => ({
        id: cat.id,
        name: cat.name,
        subcategories: cat.children?.length || 0
      }))
    };
    
    return stats;
  }
}

// Export singleton instance
export const smartCategorization = new SmartCategorizationEngine();

// Types are already exported at their declaration 