import { NextRequest, NextResponse } from 'next/server';
import { writeFile, readFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';
import OpenAI from 'openai';
import { authenticateUser, createUnauthorizedResponse } from '@/lib/auth-utils';

// File-based storage for persistent data
const PROCESSING_JOBS_FILE = join(process.cwd(), 'data', 'processing_jobs.json');
const PROCESSING_FEEDBACK_FILE = join(process.cwd(), 'data', 'processing_feedback.json');
const BOOKMARKS_FILE = join(process.cwd(), 'data', 'bookmarks.json');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface ProcessingJob {
  id: string;
  user_id: string;
  type: 'single' | 'batch';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  created_at: string;
  updated_at: string;
  started_at?: string;
  completed_at?: string;
  progress: {
    total: number;
    processed: number;
    failed: number;
    current_item?: string;
  };
  input: {
    items: ProcessingItem[];
    settings: ProcessingSettings;
  };
  output?: {
    results: ProcessingResult[];
    summary: ProcessingSummary;
  };
  error?: string;
  estimated_duration?: number;
  actual_duration?: number;
}

interface ProcessingItem {
  id: string;
  url: string;
  title?: string;
  content?: string;
  description?: string;
  existing_tags?: string[];
  existing_category?: string;
}

interface ProcessingSettings {
  auto_categorize?: boolean;
  auto_tag?: boolean;
  extract_content?: boolean;
  generate_summary?: boolean;
  detect_language?: boolean;
  quality_score?: boolean;
  duplicate_detection?: boolean;
  sentiment_analysis?: boolean;
  keyword_extraction?: boolean;
  content_enhancement?: boolean;
  confidence_threshold?: number;
  max_tags?: number;
  max_summary_length?: number;
  language_preference?: string;
  custom_prompts?: {
    categorization?: string;
    tagging?: string;
    summary?: string;
  };
}

interface ProcessingResult {
  item_id: string;
  status: 'success' | 'failed' | 'skipped';
  original_url: string;
  processed_url?: string;
  extracted_content?: {
    title?: string;
    description?: string;
    text_content?: string;
    meta_description?: string;
    author?: string;
    publish_date?: string;
    word_count?: number;
    reading_time?: number;
  };
  ai_analysis?: {
    category?: {
      name: string;
      confidence: number;
      reasoning: string;
    };
    tags?: {
      name: string;
      confidence: number;
      reasoning: string;
    }[];
    summary?: {
      text: string;
      key_points: string[];
      confidence: number;
    };
    language?: {
      detected: string;
      confidence: number;
    };
    quality_score?: {
      score: number;
      factors: {
        content_depth: number;
        readability: number;
        authority: number;
        freshness: number;
      };
      reasoning: string;
    };
    sentiment?: {
      score: number;
      label: 'positive' | 'negative' | 'neutral';
      confidence: number;
    };
    keywords?: {
      primary: string[];
      secondary: string[];
      entities: string[];
    };
    content_type?: {
      type: 'article' | 'tutorial' | 'documentation' | 'news' | 'blog' | 'reference' | 'other';
      confidence: number;
    };
  };
  duplicate_check?: {
    status: 'unique' | 'duplicate' | 'similar';
    matches?: {
      bookmark_id: number;
      similarity_score: number;
      match_type: 'url' | 'content' | 'title';
    }[];
  };
  processing_time_ms: number;
  error?: string;
  warnings?: string[];
}

interface ProcessingSummary {
  total_items: number;
  successful: number;
  failed: number;
  skipped: number;
  processing_time_ms: number;
  categories_found: { [key: string]: number };
  tags_generated: { [key: string]: number };
  languages_detected: { [key: string]: number };
  quality_distribution: {
    high: number;
    medium: number;
    low: number;
  };
  duplicates_found: number;
  content_types: { [key: string]: number };
}

interface ProcessingFeedback {
  id: string;
  user_id: string;
  job_id: string;
  item_id?: string;
  feedback_type: 'accuracy' | 'relevance' | 'completeness' | 'suggestion' | 'error_report';
  rating: 1 | 2 | 3 | 4 | 5;
  category_feedback?: {
    suggested_category: string;
    was_correct: boolean;
    confidence_rating: number;
  };
  tag_feedback?: {
    correct_tags: string[];
    incorrect_tags: string[];
    missing_tags: string[];
  };
  summary_feedback?: {
    accuracy_rating: number;
    completeness_rating: number;
    suggested_improvements: string;
  };
  comments?: string;
  created_at: string;
}

// Ensure data directory exists
async function ensureDataDirectory() {
  const dataDir = join(process.cwd(), 'data');
  if (!existsSync(dataDir)) {
    await mkdir(dataDir, { recursive: true });
  }
}

// Load data from JSON files
async function loadProcessingJobs(): Promise<ProcessingJob[]> {
  try {
    await ensureDataDirectory();
    if (!existsSync(PROCESSING_JOBS_FILE)) return [];
    const data = await readFile(PROCESSING_JOBS_FILE, 'utf-8');
    return JSON.parse(data) as ProcessingJob[];
  } catch (error) {
    console.error('Error loading processing jobs:', error);
    return [];
  }
}

async function loadProcessingFeedback(): Promise<ProcessingFeedback[]> {
  try {
    await ensureDataDirectory();
    if (!existsSync(PROCESSING_FEEDBACK_FILE)) return [];
    const data = await readFile(PROCESSING_FEEDBACK_FILE, 'utf-8');
    return JSON.parse(data) as ProcessingFeedback[];
  } catch (error) {
    console.error('Error loading processing feedback:', error);
    return [];
  }
}

async function loadBookmarks(): Promise<any[]> {
  try {
    await ensureDataDirectory();
    if (!existsSync(BOOKMARKS_FILE)) return [];
    const data = await readFile(BOOKMARKS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading bookmarks:', error);
    return [];
  }
}

// Save data to JSON files
async function saveProcessingJobs(jobs: ProcessingJob[]): Promise<void> {
  try {
    await ensureDataDirectory();
    await writeFile(PROCESSING_JOBS_FILE, JSON.stringify(jobs, null, 2));
  } catch (error) {
    console.error('Error saving processing jobs:', error);
    throw error;
  }
}

async function saveProcessingFeedback(feedback: ProcessingFeedback[]): Promise<void> {
  try {
    await ensureDataDirectory();
    await writeFile(PROCESSING_FEEDBACK_FILE, JSON.stringify(feedback, null, 2));
  } catch (error) {
    console.error('Error saving processing feedback:', error);
    throw error;
  }
}

// AI Processing Functions
async function extractContentFromUrl(url: string): Promise<any> {
  // Simulate content extraction - in production, use a service like Puppeteer or Mercury
  try {

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; BookAIMark/1.0; +https://bookaimark.com)'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const html = await response.text();
    
    // Basic HTML parsing - in production, use a proper HTML parser
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const descriptionMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
    const textContent = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    
    return {
      title: titleMatch ? titleMatch[1].trim() : '',
      description: descriptionMatch ? descriptionMatch[1].trim() : '',
      text_content: textContent.substring(0, 5000), // Limit content
      word_count: textContent.split(/\s+/).length,
      reading_time: Math.ceil(textContent.split(/\s+/).length / 200), // 200 WPM
      author: '',
      publish_date: '',
      meta_description: descriptionMatch ? descriptionMatch[1].trim() : ''
    };
  } catch (error) {
    console.error('Content extraction failed:', error);
    return {
      title: '',
      description: '',
      text_content: '',
      word_count: 0,
      reading_time: 0,
      error: (error as Error).message
    };
  }
}

async function analyzeContentWithAI(content: any, settings: ProcessingSettings): Promise<any> {
  try {
    const prompt = `Analyze the following web content and provide a comprehensive analysis:

Title: ${content.title}
Description: ${content.description}
Content: ${content.text_content?.substring(0, 2000)}

Please provide:
1. Category (choose the most appropriate single category)
2. Tags (3-8 relevant tags)
3. Summary (2-3 sentences)
4. Language detection
5. Quality score (1-100)
6. Content type classification
7. Sentiment analysis
8. Key topics and entities

Respond in JSON format with the following structure:
{
  "category": {"name": "string", "confidence": 0-1, "reasoning": "string"},
  "tags": [{"name": "string", "confidence": 0-1, "reasoning": "string"}],
  "summary": {"text": "string", "key_points": ["string"], "confidence": 0-1},
  "language": {"detected": "string", "confidence": 0-1},
  "quality_score": {"score": 0-100, "factors": {"content_depth": 0-1, "readability": 0-1, "authority": 0-1, "freshness": 0-1}, "reasoning": "string"},
  "sentiment": {"score": -1 to 1, "label": "positive/negative/neutral", "confidence": 0-1},
  "keywords": {"primary": ["string"], "secondary": ["string"], "entities": ["string"]},
  "content_type": {"type": "article/tutorial/documentation/news/blog/reference/other", "confidence": 0-1}
}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 1500
    });

    const aiResponse = response.choices[0].message.content;
    if (!aiResponse) {
      throw new Error('No response from AI');
    }

    // Parse JSON response
    const analysis = JSON.parse(aiResponse);
    
    // Apply confidence threshold filtering
    const threshold = settings.confidence_threshold || 0.5;
    
    if (analysis.tags) {
      analysis.tags = analysis.tags.filter((tag: any) => tag.confidence >= threshold);
    }
    
    // Limit number of tags
    if (settings.max_tags && analysis.tags) {
      analysis.tags = analysis.tags.slice(0, settings.max_tags);
    }
    
    return analysis;
  } catch (error) {
    console.error('AI analysis failed:', error);
    
    // Fallback analysis
    return {
      category: { name: 'General', confidence: 0.1, reasoning: 'Fallback due to AI failure' },
      tags: [{ name: 'unprocessed', confidence: 0.1, reasoning: 'Fallback tag' }],
      summary: { text: 'Content analysis failed', key_points: [], confidence: 0.1 },
      language: { detected: 'en', confidence: 0.5 },
      quality_score: { score: 50, factors: { content_depth: 0.5, readability: 0.5, authority: 0.5, freshness: 0.5 }, reasoning: 'Default score' },
      sentiment: { score: 0, label: 'neutral', confidence: 0.5 },
      keywords: { primary: [], secondary: [], entities: [] },
      content_type: { type: 'other', confidence: 0.1 }
    };
  }
}

async function checkForDuplicates(url: string, content: any): Promise<any> {
  try {
    const bookmarks = await loadBookmarks();
    const matches = [];
    
    for (const bookmark of bookmarks) {
      let similarity_score = 0;
      let match_type = '';
      
      // URL similarity
      if (bookmark.url === url) {
        similarity_score = 1.0;
        match_type = 'url';
      } else if (bookmark.url.includes(new URL(url).hostname)) {
        similarity_score = 0.8;
        match_type = 'url';
      }
      
      // Title similarity (basic)
      if (content.title && bookmark.title) {
        const titleSimilarity = calculateStringSimilarity(content.title, bookmark.title);
        if (titleSimilarity > similarity_score) {
          similarity_score = titleSimilarity;
          match_type = 'title';
        }
      }
      
      if (similarity_score > 0.7) {
        matches.push({
          bookmark_id: bookmark.id,
          similarity_score,
          match_type
        });
      }
    }
    
    let status = 'unique';
    if (matches.length > 0) {
      const maxScore = Math.max(...matches.map(m => m.similarity_score));
      status = maxScore > 0.9 ? 'duplicate' : 'similar';
    }
    
    return { status, matches };
  } catch (error) {
    console.error('Duplicate check failed:', error);
    return { status: 'unique', matches: [] };
  }
}

function calculateStringSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

async function processItem(item: ProcessingItem, settings: ProcessingSettings): Promise<ProcessingResult> {
  const startTime = Date.now();
  const result: ProcessingResult = {
    item_id: item.id,
    status: 'success',
    original_url: item.url,
    processing_time_ms: 0,
    warnings: []
  };
  
  try {
    // Step 1: Extract content if requested
    if (settings.extract_content) {
      console.log(`📄 Extracting content from: ${item.url}`);
      result.extracted_content = await extractContentFromUrl(item.url);
      
      if ('error' in result.extracted_content && result.extracted_content.error) {
        result.warnings?.push(`Content extraction failed: ${result.extracted_content.error}`);
      }
    }
    
    // Step 2: AI Analysis
    const contentForAnalysis = {
      title: item.title || result.extracted_content?.title || '',
      description: item.description || result.extracted_content?.description || '',
      text_content: item.content || result.extracted_content?.text_content || ''
    };
    
    if (contentForAnalysis.title || contentForAnalysis.text_content) {
      console.log(`🤖 Performing AI analysis for: ${item.id}`);
      result.ai_analysis = await analyzeContentWithAI(contentForAnalysis, settings);
    }
    
    // Step 3: Duplicate detection
    if (settings.duplicate_detection) {
      console.log(`🔍 Checking for duplicates: ${item.id}`);
      result.duplicate_check = await checkForDuplicates(item.url, contentForAnalysis);
    }
    
    result.processing_time_ms = Date.now() - startTime;
    console.log(`✅ Successfully processed item ${item.id} in ${result.processing_time_ms}ms`);
    
  } catch (error) {
    console.error('Failed to process item:', { itemId: item.id, error });
    result.status = 'failed';
    result.error = (error as Error).message;
    result.processing_time_ms = Date.now() - startTime;
  }
  
  return result;
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const authResult = await authenticateUser(request);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const userId = authResult.userId!;

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const jobId = searchParams.get('job_id');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    if (action === 'status' && jobId) {
      console.log(`📊 Getting status for job: ${jobId}`);
      
      const jobs = await loadProcessingJobs();
      const job = jobs.find(j => j.id === jobId && j.user_id === userId);
      
      if (!job) {
        return NextResponse.json(
          { error: 'Job not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json({
        success: true,
        job: {
          id: job.id,
          status: job.status,
          progress: job.progress,
          created_at: job.created_at,
          started_at: job.started_at,
          completed_at: job.completed_at,
          estimated_duration: job.estimated_duration,
          actual_duration: job.actual_duration,
          error: job.error
        },
        processing_time_ms: Date.now() - startTime
      });
    }
    
    if (action === 'jobs') {
      console.log(`📋 Getting jobs for user: ${userId}`);
      
      const jobs = await loadProcessingJobs();
      let userJobs = jobs.filter(j => j.user_id === userId);
      
      if (status) {
        userJobs = userJobs.filter(j => j.status === status);
      }
      
      // Sort by creation date (newest first)
      userJobs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      // Apply pagination
      const paginatedJobs = userJobs.slice(offset, offset + limit);
      
      return NextResponse.json({
        success: true,
        jobs: paginatedJobs.map(job => ({
          id: job.id,
          type: job.type,
          status: job.status,
          priority: job.priority,
          progress: job.progress,
          created_at: job.created_at,
          completed_at: job.completed_at,
          estimated_duration: job.estimated_duration,
          actual_duration: job.actual_duration,
          input_count: job.input.items.length,
          success_count: job.output?.results.filter(r => r.status === 'success').length || 0,
          error: job.error
        })),
        pagination: {
          total: userJobs.length,
          limit,
          offset,
          has_more: offset + limit < userJobs.length
        },
        processing_time_ms: Date.now() - startTime
      });
    }
    
    if (action === 'results' && jobId) {
      console.log(`📊 Getting results for job: ${jobId}`);
      
      const jobs = await loadProcessingJobs();
      const job = jobs.find(j => j.id === jobId && j.user_id === userId);
      
      if (!job) {
        return NextResponse.json(
          { error: 'Job not found' },
          { status: 404 }
        );
      }
      
      if (job.status !== 'completed') {
        return NextResponse.json(
          { error: 'Job not completed yet' },
          { status: 400 }
        );
      }
      
      return NextResponse.json({
        success: true,
        job_id: job.id,
        results: job.output?.results || [],
        summary: job.output?.summary,
        processing_time_ms: Date.now() - startTime
      });
    }
    
    if (action === 'queue') {
      console.log(`🔄 Getting queue status`);
      
      const jobs = await loadProcessingJobs();
      const queueStats = {
        pending: jobs.filter(j => j.status === 'pending').length,
        processing: jobs.filter(j => j.status === 'processing').length,
        completed: jobs.filter(j => j.status === 'completed').length,
        failed: jobs.filter(j => j.status === 'failed').length,
        total_jobs: jobs.length,
        average_processing_time: jobs
          .filter(j => j.actual_duration)
          .reduce((acc, j) => acc + (j.actual_duration || 0), 0) / 
          Math.max(1, jobs.filter(j => j.actual_duration).length),
        queue_by_priority: {
          urgent: jobs.filter(j => j.status === 'pending' && j.priority === 'urgent').length,
          high: jobs.filter(j => j.status === 'pending' && j.priority === 'high').length,
          normal: jobs.filter(j => j.status === 'pending' && j.priority === 'normal').length,
          low: jobs.filter(j => j.status === 'pending' && j.priority === 'low').length
        }
      };
      
      return NextResponse.json({
        success: true,
        queue_stats: queueStats,
        processing_time_ms: Date.now() - startTime
      });
    }
    
    return NextResponse.json(
      { 
        error: 'Invalid action',
        available_actions: ['status', 'jobs', 'results', 'queue']
      },
      { status: 400 }
    );
    
  } catch (error) {
    console.error('Processing API error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: (error as Error).message,
        processing_time_ms: Date.now() - startTime
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const authResult = await authenticateUser(request);
    if (!authResult.success) {
      return createUnauthorizedResponse(authResult.error);
    }
    
    const userId = authResult.userId!;
    const body = await request.json();
    const { action, items, settings, priority, job_id } = body;
    
    if (action === 'create-job') {
      console.log(`🚀 Creating processing job for user: ${userId}`);
      
      if (!items || !Array.isArray(items) || items.length === 0) {
        return NextResponse.json(
          { error: 'Items array is required' },
          { status: 400 }
        );
      }
      
      if (items.length > 100) {
        return NextResponse.json(
          { error: 'Maximum 100 items per job' },
          { status: 400 }
        );
      }
      
      // Create processing items with IDs
      const processingItems: ProcessingItem[] = items.map((item: any) => ({
        id: randomUUID(),
        url: item.url,
        title: item.title,
        content: item.content,
        description: item.description,
        existing_tags: item.existing_tags,
        existing_category: item.existing_category
      }));
      
      // Default settings
      const defaultSettings: ProcessingSettings = {
        auto_categorize: true,
        auto_tag: true,
        extract_content: true,
        generate_summary: true,
        detect_language: true,
        quality_score: true,
        duplicate_detection: true,
        sentiment_analysis: false,
        keyword_extraction: true,
        content_enhancement: false,
        confidence_threshold: 0.5,
        max_tags: 8,
        max_summary_length: 300,
        language_preference: 'en',
        ...settings
      };
      
      const job: ProcessingJob = {
        id: randomUUID(),
        user_id: userId,
        type: processingItems.length === 1 ? 'single' : 'batch',
        status: 'pending',
        priority: priority || 'normal',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        progress: {
          total: processingItems.length,
          processed: 0,
          failed: 0
        },
        input: {
          items: processingItems,
          settings: defaultSettings
        },
        estimated_duration: processingItems.length * 5000 // 5 seconds per item estimate
      };
      
      const jobs = await loadProcessingJobs();
      jobs.push(job);
      await saveProcessingJobs(jobs);
      
      // Start processing immediately (in production, this would be queued)
      processJobAsync(job.id);
      
      return NextResponse.json({
        success: true,
        job_id: job.id,
        status: job.status,
        estimated_duration: job.estimated_duration,
        items_count: processingItems.length,
        message: 'Processing job created and started',
        processing_time_ms: Date.now() - startTime
      });
    }
    
    if (action === 'cancel-job') {
      console.log(`🛑 Cancelling job: ${job_id}`);
      
      const jobs = await loadProcessingJobs();
      const jobIndex = jobs.findIndex(j => j.id === job_id && j.user_id === userId);
      
      if (jobIndex === -1) {
        return NextResponse.json(
          { error: 'Job not found' },
          { status: 404 }
        );
      }
      
      const job = jobs[jobIndex];
      
      if (job.status === 'completed' || job.status === 'failed') {
        return NextResponse.json(
          { error: 'Cannot cancel completed or failed job' },
          { status: 400 }
        );
      }
      
      job.status = 'cancelled';
      job.updated_at = new Date().toISOString();
      job.completed_at = new Date().toISOString();
      
      await saveProcessingJobs(jobs);
      
      return NextResponse.json({
        success: true,
        message: 'Job cancelled successfully',
        processing_time_ms: Date.now() - startTime
      });
    }
    
    return NextResponse.json(
      { 
        error: 'Invalid action',
        available_actions: ['create-job', 'cancel-job']
      },
      { status: 400 }
    );
    
  } catch (error) {
    console.error('Processing API error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: (error as Error).message,
        processing_time_ms: Date.now() - startTime
      },
      { status: 500 }
    );
  }
}

// Async job processing function
async function processJobAsync(jobId: string) {
  try {
    const jobs = await loadProcessingJobs();
    const jobIndex = jobs.findIndex(j => j.id === jobId);
    
    if (jobIndex === -1) {
      console.error('Job not found:', { jobId });
      return;
    }
    
    const job = jobs[jobIndex];
    
    if (job.status !== 'pending') {
      console.log(`Job ${jobId} is not pending, skipping`);
      return;
    }
    
    // Update job status to processing
    job.status = 'processing';
    job.started_at = new Date().toISOString();
    job.updated_at = new Date().toISOString();
    await saveProcessingJobs(jobs);
    
    console.log(`🔄 Started processing job ${jobId} with ${job.input.items.length} items`);
    
    const results: ProcessingResult[] = [];
    const startTime = Date.now();
    
    for (let i = 0; i < job.input.items.length; i++) {
      const item = job.input.items[i];
      
      // Update progress
      job.progress.current_item = item.url;
      job.updated_at = new Date().toISOString();
      await saveProcessingJobs(jobs);
      
      try {
        const result = await processItem(item, job.input.settings);
        results.push(result);
        
        if (result.status === 'success') {
          job.progress.processed++;
        } else {
          job.progress.failed++;
        }
        
      } catch (error) {
        console.error('Failed to process item:', { itemId: item.id, error });
        results.push({
          item_id: item.id,
          status: 'failed',
          original_url: item.url,
          error: (error as Error).message,
          processing_time_ms: 0
        });
        job.progress.failed++;
      }
      
      // Update progress
      await saveProcessingJobs(jobs);
    }
    
    // Generate summary
    const summary: ProcessingSummary = {
      total_items: job.input.items.length,
      successful: results.filter(r => r.status === 'success').length,
      failed: results.filter(r => r.status === 'failed').length,
      skipped: results.filter(r => r.status === 'skipped').length,
      processing_time_ms: Date.now() - startTime,
      categories_found: {},
      tags_generated: {},
      languages_detected: {},
      quality_distribution: { high: 0, medium: 0, low: 0 },
      duplicates_found: 0,
      content_types: {}
    };
    
    // Aggregate statistics
    results.forEach(result => {
      if (result.ai_analysis) {
        // Categories
        if (result.ai_analysis.category) {
          const cat = result.ai_analysis.category.name;
          summary.categories_found[cat] = (summary.categories_found[cat] || 0) + 1;
        }
        
        // Tags
        if (result.ai_analysis.tags) {
          result.ai_analysis.tags.forEach(tag => {
            summary.tags_generated[tag.name] = (summary.tags_generated[tag.name] || 0) + 1;
          });
        }
        
        // Languages
        if (result.ai_analysis.language) {
          const lang = result.ai_analysis.language.detected;
          summary.languages_detected[lang] = (summary.languages_detected[lang] || 0) + 1;
        }
        
        // Quality distribution
        if (result.ai_analysis.quality_score) {
          const score = result.ai_analysis.quality_score.score;
          if (score >= 80) summary.quality_distribution.high++;
          else if (score >= 50) summary.quality_distribution.medium++;
          else summary.quality_distribution.low++;
        }
        
        // Content types
        if (result.ai_analysis.content_type) {
          const type = result.ai_analysis.content_type.type;
          summary.content_types[type] = (summary.content_types[type] || 0) + 1;
        }
      }
      
      // Duplicates
      if (result.duplicate_check && result.duplicate_check.status !== 'unique') {
        summary.duplicates_found++;
      }
    });
    
    // Complete the job
    job.status = 'completed';
    job.completed_at = new Date().toISOString();
    job.updated_at = new Date().toISOString();
    job.actual_duration = Date.now() - startTime;
    job.output = { results, summary };
    job.progress.current_item = undefined;
    
    await saveProcessingJobs(jobs);
    
    console.log(`✅ Completed processing job ${jobId} in ${job.actual_duration}ms`);
    
  } catch (error) {
    console.error('Job failed:', { jobId, error });
    
    // Mark job as failed
    const jobs = await loadProcessingJobs();
    const jobIndex = jobs.findIndex(j => j.id === jobId);
    
    if (jobIndex !== -1) {
      jobs[jobIndex].status = 'failed';
      jobs[jobIndex].error = (error as Error).message;
      jobs[jobIndex].completed_at = new Date().toISOString();
      jobs[jobIndex].updated_at = new Date().toISOString();
      await saveProcessingJobs(jobs);
    }
  }
}                    