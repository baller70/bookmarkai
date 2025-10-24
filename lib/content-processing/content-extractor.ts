import { JSDOM } from 'jsdom';
import fetch from 'node-fetch';
import { appLogger } from '../../lib/logger';
import { performance } from 'perf_hooks';
import { validateUrl } from '../security/url-validator';

const logger = appLogger;

export interface ExtractedContent {
  url: string;
  title: string;
  description: string;
  content: string;
  plainText: string;
  metadata: ContentMetadata;
  images: ExtractedImage[];
  links: ExtractedLink[];
  readingTime: number;
  wordCount: number;
  language: string;
  quality: ContentQuality;
  extractedAt: Date;
}

export interface ContentMetadata {
  author?: string;
  publishDate?: Date;
  lastModified?: Date;
  keywords: string[];
  tags: string[];
  category?: string;
  siteName?: string;
  favicon?: string;
  canonicalUrl?: string;
  openGraph: OpenGraphData;
  twitterCard: TwitterCardData;
  schema: SchemaData[];
}

export interface OpenGraphData {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
  siteName?: string;
}

export interface TwitterCardData {
  card?: string;
  title?: string;
  description?: string;
  image?: string;
  creator?: string;
}

export interface SchemaData {
  type: string;
  data: Record<string, any>;
}

export interface ExtractedImage {
  src: string;
  alt?: string;
  title?: string;
  width?: number;
  height?: number;
  size?: number;
}

export interface ExtractedLink {
  href: string;
  text: string;
  title?: string;
  rel?: string;
  type: 'internal' | 'external';
}

export interface ContentQuality {
  score: number; // 0-100
  factors: {
    textLength: number;
    imageCount: number;
    linkCount: number;
    headingStructure: number;
    readability: number;
    metadataCompleteness: number;
  };
  issues: string[];
  recommendations: string[];
}

export interface ExtractionOptions {
  timeout?: number;
  userAgent?: string;
  includeImages?: boolean;
  includeLinks?: boolean;
  maxContentLength?: number;
  followRedirects?: boolean;
  extractSchema?: boolean;
  qualityAnalysis?: boolean;
}

export class ContentExtractor {
  private defaultOptions: ExtractionOptions = {
    timeout: 10000,
    userAgent: 'BookAIMark Content Extractor 1.0',
    includeImages: true,
    includeLinks: true,
    maxContentLength: 50000,
    followRedirects: true,
    extractSchema: true,
    qualityAnalysis: true,
  };

  async extractContent(url: string, options?: ExtractionOptions): Promise<ExtractedContent> {
    const startTime = performance.now();
    const opts = { ...this.defaultOptions, ...options };

    try {
      logger.info('Starting content extraction', { url, options: opts });

      // Fetch the webpage
      const html = await this.fetchWebpage(url, opts);

      // Parse HTML
      const dom = new JSDOM(html);
      const document = dom.window.document;

      // Extract all components
      const rawTitle = this.extractTitle(document);
      const description = this.extractDescription(document);
      const content = this.extractMainContent(document);
      const plainText = this.extractPlainText(content);
      const metadata = this.extractMetadata(document, url);
      const title = this.cleanTitle(rawTitle, metadata, url);
      const images = opts.includeImages ? this.extractImages(document, url) : [];
      const links = opts.includeLinks ? this.extractLinks(document, url) : [];
      const readingTime = this.calculateReadingTime(plainText);
      const wordCount = this.calculateWordCount(plainText);
      const language = this.detectLanguage(plainText);
      const quality = opts.qualityAnalysis ? this.analyzeQuality(document, plainText, metadata) : this.getDefaultQuality();

      const extractedContent: ExtractedContent = {
        url,
        title,
        description,
        content,
        plainText: plainText.substring(0, opts.maxContentLength || 50000),
        metadata,
        images,
        links,
        readingTime,
        wordCount,
        language,
        quality,
        extractedAt: new Date(),
      };

      const duration = performance.now() - startTime;
      logger.info('Content extraction completed', {
        url,
        duration: Math.round(duration),
        wordCount,
        quality: quality.score
      });

      return extractedContent;

    } catch (error) {
      const duration = performance.now() - startTime;
      logger.error('Content extraction failed', error as Error, {
        url,
        duration: Math.round(duration)
      });
      throw new Error(`Failed to extract content from ${url}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async fetchWebpage(url: string, options: ExtractionOptions): Promise<string> {
    // Validate URL to prevent SSRF
    const validation = validateUrl(url);
    if (!validation.isValid) {
      throw new Error(`URL validation failed: ${validation.error}`);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), options.timeout || 10000);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': options.userAgent || this.defaultOptions.userAgent!,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'DNT': '1',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
        },
        redirect: options.followRedirects ? 'follow' : 'manual',
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('text/html')) {
        throw new Error(`Invalid content type: ${contentType}`);
      }

      return await response.text();
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  private extractTitle(document: Document): string {
    // Try multiple sources for title
    const sources = [
      () => document.querySelector('meta[property="og:title"]')?.getAttribute('content'),
      () => document.querySelector('meta[name="twitter:title"]')?.getAttribute('content'),
      () => document.querySelector('title')?.textContent,
      () => document.querySelector('h1')?.textContent,
    ];

    for (const source of sources) {
      const title = source()?.trim();
      if (title && title.length > 0) {
        return title;
      }
    }

    return 'Untitled';

  }


  private cleanTitle(rawTitle: string, metadata: any, url: string): string {
    try {
      const original = (rawTitle || '').trim();
      if (!original) return 'Untitled';

      const siteName: string = (metadata?.siteName || metadata?.openGraph?.site_name || '').toString().trim();
      let hostname = '';
      try { hostname = new URL(url).hostname.replace(/^www\./, ''); } catch {}
      const brandFromHost = hostname.split('.')[0]?.replace(/[-_]/g, ' ') || '';

      // Split by common separators and trim
      const candidates = original
        .split(/\s*[-–—|:•·]\s+/g)
        .map(s => s.trim())
        .filter(s => s.length > 0);

      // Score segments: prefer ones matching site/brand, penalize marketing taglines, prefer shorter segments
      const lcSite = siteName.toLowerCase();
      const lcBrand = brandFromHost.toLowerCase();
      const scored = candidates.map(seg => {
        const l = seg.toLowerCase();
        let score = 0;
        if (lcSite && (l === lcSite || l.includes(lcSite))) score += 3;
        if (lcBrand && (l === lcBrand || l.includes(lcBrand))) score += 3;
        if (/(world|leading|official|platform|homepage|home|welcome|learn more|documentation|docs|blog|news)/i.test(seg)) score -= 2;
        // prefer concise names (<= 3 words)
        const words = seg.split(/\s+/).length;
        if (words <= 3) score += 2; else if (words <= 5) score += 1;
        return { seg, score, words };
      });

      scored.sort((a, b) => b.score - a.score || a.words - b.words || a.seg.length - b.seg.length);
      const best = (scored[0]?.seg || candidates[0] || original).trim();
      return best;
    } catch {
      return rawTitle?.trim() || 'Untitled';
    }
  }

  private extractDescription(document: Document): string {
    // Try multiple sources for description
    const sources = [
      () => document.querySelector('meta[property="og:description"]')?.getAttribute('content'),
      () => document.querySelector('meta[name="twitter:description"]')?.getAttribute('content'),
      () => document.querySelector('meta[name="description"]')?.getAttribute('content'),
      () => document.querySelector('meta[name="summary"]')?.getAttribute('content'),
    ];

    for (const source of sources) {
      const description = source()?.trim();
      if (description && description.length > 0) {
        return description;
      }
    }

    return '';
  }

  private extractMainContent(document: Document): string {
    // Remove unwanted elements
    const unwantedSelectors = [
      'script', 'style', 'nav', 'header', 'footer', 'aside',
      '.sidebar', '.navigation', '.menu', '.ads', '.advertisement',
      '.social-share', '.comments', '.related-posts'
    ];

    unwantedSelectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(el => el.remove());
    });

    // Try to find main content area
    const contentSelectors = [
      'article',
      'main',
      '[role="main"]',
      '.content',
      '.post-content',
      '.entry-content',
      '.article-content',
      '#content',
      '#main',
    ];

    for (const selector of contentSelectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent && element.textContent.trim().length > 100) {
        return element.innerHTML;
      }
    }

    // Fallback to body content
    const body = document.querySelector('body');
    return body?.innerHTML || '';
  }

  private extractPlainText(html: string): string {
    const dom = new JSDOM(html);
    const text = dom.window.document.body?.textContent || '';

    // Clean up whitespace
    return text
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n')
      .trim();
  }

  private extractMetadata(document: Document, url: string): ContentMetadata {
    const metadata: ContentMetadata = {
      keywords: [],
      tags: [],
      openGraph: {},
      twitterCard: {},
      schema: [],
    };

    // Basic metadata
    metadata.author = document.querySelector('meta[name="author"]')?.getAttribute('content') || undefined;
    metadata.siteName = document.querySelector('meta[property="og:site_name"]')?.getAttribute('content') || undefined;
    metadata.canonicalUrl = document.querySelector('link[rel="canonical"]')?.getAttribute('href') || undefined;
    metadata.favicon = document.querySelector('link[rel="icon"]')?.getAttribute('href') ||
                      document.querySelector('link[rel="shortcut icon"]')?.getAttribute('href') || undefined;

    // Keywords and tags
    const keywordsContent = document.querySelector('meta[name="keywords"]')?.getAttribute('content');
    if (keywordsContent) {
      metadata.keywords = keywordsContent.split(',').map(k => k.trim()).filter(k => k.length > 0);
    }

    // Date parsing
    const publishDateStr = document.querySelector('meta[property="article:published_time"]')?.getAttribute('content') ||
                          document.querySelector('meta[name="date"]')?.getAttribute('content');
    if (publishDateStr) {
      metadata.publishDate = new Date(publishDateStr);
    }

    const modifiedDateStr = document.querySelector('meta[property="article:modified_time"]')?.getAttribute('content') ||
                           document.querySelector('meta[name="last-modified"]')?.getAttribute('content');
    if (modifiedDateStr) {
      metadata.lastModified = new Date(modifiedDateStr);
    }

    // Open Graph
    document.querySelectorAll('meta[property^="og:"]').forEach(meta => {
      const property = meta.getAttribute('property')?.replace('og:', '');
      const content = meta.getAttribute('content');
      if (property && content) {
        (metadata.openGraph as any)[property] = content;
      }
    });

    // Twitter Card
    document.querySelectorAll('meta[name^="twitter:"]').forEach(meta => {
      const name = meta.getAttribute('name')?.replace('twitter:', '');
      const content = meta.getAttribute('content');
      if (name && content) {
        (metadata.twitterCard as any)[name] = content;
      }
    });

    // Schema.org structured data
    document.querySelectorAll('script[type="application/ld+json"]').forEach(script => {
      try {
        const data = JSON.parse(script.textContent || '');
        if (data['@type']) {
          metadata.schema.push({
            type: data['@type'],
            data: data,
          });
        }
      } catch (error) {
        logger.warn('Failed to parse schema data', { error: error instanceof Error ? error.message : 'Unknown error' });
      }
    });

    return metadata;
  }

  private extractImages(document: Document, baseUrl: string): ExtractedImage[] {
    const images: ExtractedImage[] = [];

    document.querySelectorAll('img').forEach(img => {
      const src = img.getAttribute('src');
      if (src) {
        const absoluteSrc = this.resolveUrl(src, baseUrl);
        images.push({
          src: absoluteSrc,
          alt: img.getAttribute('alt') || undefined,
          title: img.getAttribute('title') || undefined,
          width: img.width || undefined,
          height: img.height || undefined,
        });
      }
    });

    return images.slice(0, 50); // Limit to 50 images
  }

  private extractLinks(document: Document, baseUrl: string): ExtractedLink[] {
    const links: ExtractedLink[] = [];
    const baseDomain = new URL(baseUrl).hostname;

    document.querySelectorAll('a[href]').forEach(link => {
      const href = link.getAttribute('href');
      if (href && !href.startsWith('#') && !href.startsWith('mailto:') && !href.startsWith('tel:')) {
        const absoluteHref = this.resolveUrl(href, baseUrl);
        const linkDomain = new URL(absoluteHref).hostname;

        links.push({
          href: absoluteHref,
          text: link.textContent?.trim() || '',
          title: link.getAttribute('title') || undefined,
          rel: link.getAttribute('rel') || undefined,
          type: linkDomain === baseDomain ? 'internal' : 'external',
        });
      }
    });

    return links.slice(0, 100); // Limit to 100 links
  }

  private resolveUrl(url: string, baseUrl: string): string {
    try {
      return new URL(url, baseUrl).href;
    } catch {
      return url;
    }
  }

  private calculateReadingTime(text: string): number {
    const wordsPerMinute = 200;
    const wordCount = text.split(/\s+/).length;
    return Math.ceil(wordCount / wordsPerMinute);
  }

  private calculateWordCount(text: string): number {
    return text.split(/\s+/).filter(word => word.length > 0).length;
  }

  private detectLanguage(text: string): string {
    // Simple language detection based on common words
    // In a real implementation, you'd use a proper language detection library
    const commonEnglishWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
    const words = text.toLowerCase().split(/\s+/).slice(0, 100);

    const englishWordCount = words.filter(word => commonEnglishWords.includes(word)).length;
    const englishRatio = englishWordCount / Math.min(words.length, 100);

    if (englishRatio > 0.1) {
      return 'en';
    }

    return 'unknown';
  }

  private analyzeQuality(document: Document, plainText: string, metadata: ContentMetadata): ContentQuality {
    const factors = {
      textLength: 0,
      imageCount: 0,
      linkCount: 0,
      headingStructure: 0,
      readability: 0,
      metadataCompleteness: 0,
    };

    const issues: string[] = [];
    const recommendations: string[] = [];

    // Text length analysis
    const wordCount = this.calculateWordCount(plainText);
    if (wordCount < 100) {
      factors.textLength = 20;
      issues.push('Very short content');
      recommendations.push('Add more detailed content');
    } else if (wordCount < 300) {
      factors.textLength = 50;
      issues.push('Short content');
      recommendations.push('Consider expanding the content');
    } else if (wordCount < 1000) {
      factors.textLength = 80;
    } else {
      factors.textLength = 100;
    }

    // Image analysis
    const images = document.querySelectorAll('img').length;
    factors.imageCount = Math.min(images * 10, 100);
    if (images === 0) {
      recommendations.push('Consider adding relevant images');
    }

    // Link analysis
    const links = document.querySelectorAll('a[href]').length;
    factors.linkCount = Math.min(links * 5, 100);

    // Heading structure
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6').length;
    factors.headingStructure = Math.min(headings * 15, 100);
    if (headings === 0) {
      issues.push('No heading structure');
      recommendations.push('Add proper heading structure');
    }

    // Readability (simple analysis)
    const sentences = plainText.split(/[.!?]+/).length;
    const avgWordsPerSentence = wordCount / sentences;
    if (avgWordsPerSentence < 10) {
      factors.readability = 100;
    } else if (avgWordsPerSentence < 20) {
      factors.readability = 80;
    } else if (avgWordsPerSentence < 30) {
      factors.readability = 60;
    } else {
      factors.readability = 40;
      issues.push('Long sentences may affect readability');
      recommendations.push('Consider shorter sentences');
    }

    // Metadata completeness
    let metadataScore = 0;
    if (metadata.author) metadataScore += 20;
    if (metadata.publishDate) metadataScore += 20;
    if (metadata.keywords.length > 0) metadataScore += 20;
    if (metadata.openGraph.title) metadataScore += 20;
    if (metadata.openGraph.description) metadataScore += 20;
    factors.metadataCompleteness = metadataScore;

    if (metadataScore < 60) {
      issues.push('Incomplete metadata');
      recommendations.push('Add missing meta tags for better SEO');
    }

    // Calculate overall score
    const score = Math.round(
      (factors.textLength * 0.3 +
       factors.imageCount * 0.1 +
       factors.linkCount * 0.1 +
       factors.headingStructure * 0.2 +
       factors.readability * 0.2 +
       factors.metadataCompleteness * 0.1)
    );

    return {
      score: Math.min(score, 100),
      factors,
      issues,
      recommendations,
    };
  }

  private getDefaultQuality(): ContentQuality {
    return {
      score: 50,
      factors: {
        textLength: 50,
        imageCount: 50,
        linkCount: 50,
        headingStructure: 50,
        readability: 50,
        metadataCompleteness: 50,
      },
      issues: [],
      recommendations: [],
    };
  }

  // Batch extraction for multiple URLs
  async extractMultiple(urls: string[], options?: ExtractionOptions): Promise<ExtractedContent[]> {
    const results = await Promise.allSettled(
      urls.map(url => this.extractContent(url, options))
    );

    return results
      .filter((result): result is PromiseFulfilledResult<ExtractedContent> => result.status === 'fulfilled')
      .map(result => result.value);
  }

  // Extract content summary for quick preview
  async extractSummary(url: string): Promise<{
    title: string;
    description: string;
    image?: string;
    siteName?: string;
    readingTime: number;
  }> {
    const content = await this.extractContent(url, {
      includeImages: false,
      includeLinks: false,
      qualityAnalysis: false,
      maxContentLength: 1000,
    });

    return {
      title: content.title,
      description: content.description,
      image: content.metadata.openGraph.image,
      siteName: content.metadata.siteName,
      readingTime: content.readingTime,
    };
  }
}

// Export singleton instance
export const contentExtractor = new ContentExtractor();