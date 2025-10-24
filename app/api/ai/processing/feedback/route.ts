import { NextRequest, NextResponse } from 'next/server';
import { writeFile, readFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { authenticateUser, createUnauthorizedResponse } from '@/lib/auth-utils';

// File-based storage for persistent data
const PROCESSING_FEEDBACK_FILE = join(process.cwd(), 'data', 'processing_feedback.json');
const PROCESSING_JOBS_FILE = join(process.cwd(), 'data', 'processing_jobs.json');
const AI_ACCURACY_METRICS_FILE = join(process.cwd(), 'data', 'ai_accuracy_metrics.json');

interface ProcessingFeedback {
  id: string;
  user_id: string;
  job_id: string;
  item_id?: string;
  feedback_type: 'accuracy' | 'relevance' | 'completeness' | 'suggestion' | 'error_report';
  rating: 1 | 2 | 3 | 4 | 5;
  category_feedback?: {
    original_category: string;
    suggested_category: string;
    was_correct: boolean;
    confidence_rating: number;
  };
  tag_feedback?: {
    original_tags: string[];
    correct_tags: string[];
    incorrect_tags: string[];
    missing_tags: string[];
    overall_accuracy: number;
  };
  summary_feedback?: {
    original_summary: string;
    accuracy_rating: number;
    completeness_rating: number;
    clarity_rating: number;
    suggested_improvements: string;
  };
  quality_score_feedback?: {
    original_score: number;
    user_score: number;
    reasoning: string;
  };
  content_type_feedback?: {
    original_type: string;
    correct_type: string;
    was_correct: boolean;
  };
  duplicate_detection_feedback?: {
    original_status: string;
    correct_status: string;
    was_correct: boolean;
    missed_duplicates?: string[];
    false_positives?: string[];
  };
  comments?: string;
  created_at: string;
  ip_address?: string;
  user_agent?: string;
}

interface AccuracyMetrics {
  id: string;
  metric_type: 'category' | 'tags' | 'summary' | 'quality' | 'content_type' | 'duplicates' | 'overall';
  time_period: string; // ISO date
  total_feedback: number;
  accuracy_scores: {
    excellent: number; // 5 stars
    good: number;      // 4 stars
    average: number;   // 3 stars
    poor: number;      // 2 stars
    very_poor: number; // 1 star
  };
  average_rating: number;
  improvement_areas: {
    area: string;
    frequency: number;
    examples: string[];
  }[];
  top_issues: {
    issue: string;
    count: number;
    severity: 'low' | 'medium' | 'high' | 'critical';
  }[];
  trends: {
    improving: boolean;
    change_percentage: number;
    period_comparison: string;
  };
  created_at: string;
  updated_at: string;
}

interface FeedbackAnalysis {
  overall_satisfaction: number;
  category_accuracy: number;
  tag_accuracy: number;
  summary_quality: number;
  content_type_accuracy: number;
  duplicate_detection_accuracy: number;
  total_feedback_count: number;
  recent_feedback_count: number;
  improvement_suggestions: string[];
  critical_issues: string[];
  user_engagement: {
    active_feedback_users: number;
    average_feedback_per_user: number;
    feedback_frequency: string;
  };
}

// Ensure data directory exists
async function ensureDataDirectory() {
  const dataDir = join(process.cwd(), 'data');
  if (!existsSync(dataDir)) {
    await mkdir(dataDir, { recursive: true });
  }
}

// Load data from JSON files
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

async function loadAccuracyMetrics(): Promise<AccuracyMetrics[]> {
  try {
    await ensureDataDirectory();
    if (!existsSync(AI_ACCURACY_METRICS_FILE)) return [];
    const data = await readFile(AI_ACCURACY_METRICS_FILE, 'utf-8');
    return JSON.parse(data) as AccuracyMetrics[];
  } catch (error) {
    console.error('Error loading accuracy metrics:', error);
    return [];
  }
}

async function loadProcessingJobs(): Promise<any[]> {
  try {
    await ensureDataDirectory();
    if (!existsSync(PROCESSING_JOBS_FILE)) return [];
    const data = await readFile(PROCESSING_JOBS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading processing jobs:', error);
    return [];
  }
}

// Save data to JSON files
async function saveProcessingFeedback(feedback: ProcessingFeedback[]): Promise<void> {
  try {
    await ensureDataDirectory();
    await writeFile(PROCESSING_FEEDBACK_FILE, JSON.stringify(feedback, null, 2));
  } catch (error) {
    console.error('Error saving processing feedback:', error);
    throw error;
  }
}

async function saveAccuracyMetrics(metrics: AccuracyMetrics[]): Promise<void> {
  try {
    await ensureDataDirectory();
    await writeFile(AI_ACCURACY_METRICS_FILE, JSON.stringify(metrics, null, 2));
  } catch (error) {
    console.error('Error saving accuracy metrics:', error);
    throw error;
  }
}

// Analysis functions
function calculateOverallAccuracy(feedback: ProcessingFeedback[]): number {
  if (feedback.length === 0) return 0;
  
  const totalRating = feedback.reduce((sum, f) => sum + f.rating, 0);
  return (totalRating / (feedback.length * 5)) * 100; // Convert to percentage
}

function analyzeCategoryAccuracy(feedback: ProcessingFeedback[]): number {
  const categoryFeedback = feedback.filter(f => f.category_feedback);
  if (categoryFeedback.length === 0) return 0;
  
  const correctPredictions = categoryFeedback.filter(f => f.category_feedback?.was_correct).length;
  return (correctPredictions / categoryFeedback.length) * 100;
}

function analyzeTagAccuracy(feedback: ProcessingFeedback[]): number {
  const tagFeedback = feedback.filter(f => f.tag_feedback);
  if (tagFeedback.length === 0) return 0;
  
  const totalAccuracy = tagFeedback.reduce((sum, f) => sum + (f.tag_feedback?.overall_accuracy || 0), 0);
  return totalAccuracy / tagFeedback.length;
}

function generateImprovementSuggestions(feedback: ProcessingFeedback[]): string[] {
  const suggestions = new Set<string>();
  
  // Analyze common issues
  const commonIssues = new Map<string, number>();
  
  feedback.forEach(f => {
    if (f.comments) {
      // Simple keyword analysis
      const keywords = ['accuracy', 'relevance', 'missing', 'incorrect', 'wrong', 'better', 'improve'];
      keywords.forEach(keyword => {
        if (f.comments!.toLowerCase().includes(keyword)) {
          commonIssues.set(keyword, (commonIssues.get(keyword) || 0) + 1);
        }
      });
    }
    
    // Category-specific suggestions
    if (f.category_feedback && !f.category_feedback.was_correct) {
      suggestions.add('Improve category classification accuracy');
    }
    
    // Tag-specific suggestions
    if (f.tag_feedback && f.tag_feedback.overall_accuracy < 70) {
      suggestions.add('Enhance tag generation algorithms');
    }
    
    // Summary-specific suggestions
    if (f.summary_feedback && f.summary_feedback.accuracy_rating < 3) {
      suggestions.add('Improve content summarization quality');
    }
  });
  
  // Add suggestions based on common issues
  const sortedIssues = Array.from(commonIssues.entries()).sort((a, b) => b[1] - a[1]);
  sortedIssues.slice(0, 3).forEach(([issue]) => {
    switch (issue) {
      case 'accuracy':
        suggestions.add('Focus on improving overall prediction accuracy');
        break;
      case 'relevance':
        suggestions.add('Enhance relevance scoring algorithms');
        break;
      case 'missing':
        suggestions.add('Reduce false negatives in content detection');
        break;
    }
  });
  
  return Array.from(suggestions);
}

function identifyCriticalIssues(feedback: ProcessingFeedback[]): string[] {
  const criticalIssues: string[] = [];
  
  // Low rating threshold (1-2 stars)
  const lowRatingCount = feedback.filter(f => f.rating <= 2).length;
  if (lowRatingCount > feedback.length * 0.2) { // More than 20% low ratings
    criticalIssues.push('High volume of low satisfaction ratings');
  }
  
  // Category accuracy issues
  const categoryFeedback = feedback.filter(f => f.category_feedback);
  const categoryAccuracy = analyzeCategoryAccuracy(feedback);
  if (categoryAccuracy < 60) {
    criticalIssues.push('Category classification accuracy below acceptable threshold');
  }
  
  // Tag accuracy issues
  const tagAccuracy = analyzeTagAccuracy(feedback);
  if (tagAccuracy < 50) {
    criticalIssues.push('Tag generation accuracy significantly below expectations');
  }
  
  // Error reports
  const errorReports = feedback.filter(f => f.feedback_type === 'error_report').length;
  if (errorReports > feedback.length * 0.1) { // More than 10% error reports
    criticalIssues.push('High frequency of error reports');
  }
  
  return criticalIssues;
}

async function updateAccuracyMetrics(feedback: ProcessingFeedback[]): Promise<void> {
  try {
    const metrics = await loadAccuracyMetrics();
    const now = new Date();
    const currentPeriod = now.toISOString().split('T')[0]; // YYYY-MM-DD
    
    // Calculate current metrics
    const recentFeedback = feedback.filter(f => {
      const feedbackDate = new Date(f.created_at);
      const daysDiff = (now.getTime() - feedbackDate.getTime()) / (1000 * 60 * 60 * 24);
      return daysDiff <= 30; // Last 30 days
    });
    
    const overallMetric: AccuracyMetrics = {
      id: randomUUID(),
      metric_type: 'overall',
      time_period: currentPeriod,
      total_feedback: recentFeedback.length,
      accuracy_scores: {
        excellent: recentFeedback.filter(f => f.rating === 5).length,
        good: recentFeedback.filter(f => f.rating === 4).length,
        average: recentFeedback.filter(f => f.rating === 3).length,
        poor: recentFeedback.filter(f => f.rating === 2).length,
        very_poor: recentFeedback.filter(f => f.rating === 1).length
      },
      average_rating: recentFeedback.length > 0 ? 
        recentFeedback.reduce((sum, f) => sum + f.rating, 0) / recentFeedback.length : 0,
      improvement_areas: [],
      top_issues: [],
      trends: {
        improving: true, // Would need historical data to calculate
        change_percentage: 0,
        period_comparison: 'previous_month'
      },
      created_at: now.toISOString(),
      updated_at: now.toISOString()
    };
    
    // Remove old metrics for the same period and type
    const filteredMetrics = metrics.filter(m => 
      !(m.metric_type === 'overall' && m.time_period === currentPeriod)
    );
    
    filteredMetrics.push(overallMetric);
    await saveAccuracyMetrics(filteredMetrics);
    
  } catch (error) {
    console.error('Error updating accuracy metrics:', error);
  }
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const authResult = await authenticateUser(request);
    if (!authResult.success) {
      return createUnauthorizedResponse(authResult.error);
    }
    const userId = authResult.userId!;
    
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const jobId = searchParams.get('job_id');
    const metricType = searchParams.get('metric_type');
    const timePeriod = searchParams.get('time_period') || '30'; // days
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    if (action === 'feedback') {
      console.log(`📊 Getting feedback for user: ${userId}`);
      
      const feedback = await loadProcessingFeedback();
      let userFeedback = feedback.filter(f => f.user_id === userId);
      
      if (jobId) {
        userFeedback = userFeedback.filter(f => f.job_id === jobId);
      }
      
      // Sort by creation date (newest first)
      userFeedback.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      // Apply pagination
      const paginatedFeedback = userFeedback.slice(offset, offset + limit);
      
      return NextResponse.json({
        success: true,
        feedback: paginatedFeedback,
        pagination: {
          total: userFeedback.length,
          limit,
          offset,
          has_more: offset + limit < userFeedback.length
        },
        processing_time_ms: Date.now() - startTime
      });
    }
    
    if (action === 'analytics') {
      console.log(`📈 Getting feedback analytics`);
      
      const feedback = await loadProcessingFeedback();
      const now = new Date();
      const daysBack = parseInt(timePeriod);
      
      // Filter feedback by time period
      const recentFeedback = feedback.filter(f => {
        const feedbackDate = new Date(f.created_at);
        const daysDiff = (now.getTime() - feedbackDate.getTime()) / (1000 * 60 * 60 * 24);
        return daysDiff <= daysBack;
      });
      
      const analysis: FeedbackAnalysis = {
        overall_satisfaction: calculateOverallAccuracy(recentFeedback),
        category_accuracy: analyzeCategoryAccuracy(recentFeedback),
        tag_accuracy: analyzeTagAccuracy(recentFeedback),
        summary_quality: recentFeedback.filter(f => f.summary_feedback)
          .reduce((sum, f) => sum + (f.summary_feedback?.accuracy_rating || 0), 0) / 
          Math.max(1, recentFeedback.filter(f => f.summary_feedback).length) * 20, // Convert to percentage
        content_type_accuracy: recentFeedback.filter(f => f.content_type_feedback)
          .filter(f => f.content_type_feedback?.was_correct).length / 
          Math.max(1, recentFeedback.filter(f => f.content_type_feedback).length) * 100,
        duplicate_detection_accuracy: recentFeedback.filter(f => f.duplicate_detection_feedback)
          .filter(f => f.duplicate_detection_feedback?.was_correct).length / 
          Math.max(1, recentFeedback.filter(f => f.duplicate_detection_feedback).length) * 100,
        total_feedback_count: feedback.length,
        recent_feedback_count: recentFeedback.length,
        improvement_suggestions: generateImprovementSuggestions(recentFeedback),
        critical_issues: identifyCriticalIssues(recentFeedback),
        user_engagement: {
          active_feedback_users: new Set(recentFeedback.map(f => f.user_id)).size,
          average_feedback_per_user: recentFeedback.length / Math.max(1, new Set(recentFeedback.map(f => f.user_id)).size),
          feedback_frequency: recentFeedback.length > 0 ? 
            `${(recentFeedback.length / daysBack).toFixed(1)} per day` : '0 per day'
        }
      };
      
      return NextResponse.json({
        success: true,
        analytics: analysis,
        time_period_days: daysBack,
        processing_time_ms: Date.now() - startTime
      });
    }
    
    if (action === 'metrics') {
      console.log(`📊 Getting accuracy metrics`);
      
      const metrics = await loadAccuracyMetrics();
      let filteredMetrics = metrics;
      
      if (metricType) {
        filteredMetrics = metrics.filter(m => m.metric_type === metricType);
      }
      
      // Sort by time period (newest first)
      filteredMetrics.sort((a, b) => new Date(b.time_period).getTime() - new Date(a.time_period).getTime());
      
      return NextResponse.json({
        success: true,
        metrics: filteredMetrics.slice(0, limit),
        total: filteredMetrics.length,
        processing_time_ms: Date.now() - startTime
      });
    }
    
    if (action === 'job-feedback' && jobId) {
      console.log(`📋 Getting feedback for job: ${jobId}`);
      
      const feedback = await loadProcessingFeedback();
      const jobFeedback = feedback.filter(f => f.job_id === jobId);
      
      // Aggregate job feedback statistics
      const stats = {
        total_feedback: jobFeedback.length,
        average_rating: jobFeedback.length > 0 ? 
          jobFeedback.reduce((sum, f) => sum + f.rating, 0) / jobFeedback.length : 0,
        feedback_by_type: {
          accuracy: jobFeedback.filter(f => f.feedback_type === 'accuracy').length,
          relevance: jobFeedback.filter(f => f.feedback_type === 'relevance').length,
          completeness: jobFeedback.filter(f => f.feedback_type === 'completeness').length,
          suggestion: jobFeedback.filter(f => f.feedback_type === 'suggestion').length,
          error_report: jobFeedback.filter(f => f.feedback_type === 'error_report').length
        },
        category_accuracy: analyzeCategoryAccuracy(jobFeedback),
        tag_accuracy: analyzeTagAccuracy(jobFeedback),
        recent_feedback: jobFeedback.slice(0, 10) // Last 10 feedback items
      };
      
      return NextResponse.json({
        success: true,
        job_id: jobId,
        feedback_stats: stats,
        processing_time_ms: Date.now() - startTime
      });
    }
    
    return NextResponse.json(
      { 
        error: 'Invalid action',
        available_actions: ['feedback', 'analytics', 'metrics', 'job-feedback']
      },
      { status: 400 }
    );
    
  } catch (error) {
    console.error('Feedback API error:', error);
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
    const { action } = body;
    
    if (action === 'submit-feedback') {
      console.log(`📝 Submitting feedback from user: ${userId}`);
      
      const {
        job_id,
        item_id,
        feedback_type,
        rating,
        category_feedback,
        tag_feedback,
        summary_feedback,
        quality_score_feedback,
        content_type_feedback,
        duplicate_detection_feedback,
        comments
      } = body;
      
      // Validate required fields
      if (!job_id || !feedback_type || !rating) {
        return NextResponse.json(
          { error: 'job_id, feedback_type, and rating are required' },
          { status: 400 }
        );
      }
      
      if (rating < 1 || rating > 5) {
        return NextResponse.json(
          { error: 'Rating must be between 1 and 5' },
          { status: 400 }
        );
      }
      
      // Verify job exists
      const jobs = await loadProcessingJobs();
      const job = jobs.find(j => j.id === job_id && j.user_id === userId);
      
      if (!job) {
        return NextResponse.json(
          { error: 'Job not found or access denied' },
          { status: 404 }
        );
      }
      
      const feedback: ProcessingFeedback = {
        id: randomUUID(),
        user_id: userId,
        job_id,
        item_id,
        feedback_type,
        rating,
        category_feedback,
        tag_feedback,
        summary_feedback,
        quality_score_feedback,
        content_type_feedback,
        duplicate_detection_feedback,
        comments,
        created_at: new Date().toISOString()
      };
      
      const allFeedback = await loadProcessingFeedback();
      allFeedback.push(feedback);
      await saveProcessingFeedback(allFeedback);
      
      // Update accuracy metrics
      await updateAccuracyMetrics(allFeedback);
      
      return NextResponse.json({
        success: true,
        feedback_id: feedback.id,
        message: 'Feedback submitted successfully',
        processing_time_ms: Date.now() - startTime
      });
    }
    
    if (action === 'bulk-feedback') {
      console.log(`📝 Submitting bulk feedback from user: ${userId}`);
      
      const { feedback_items } = body;
      
      if (!feedback_items || !Array.isArray(feedback_items)) {
        return NextResponse.json(
          { error: 'feedback_items array is required' },
          { status: 400 }
        );
      }
      
      if (feedback_items.length > 50) {
        return NextResponse.json(
          { error: 'Maximum 50 feedback items per request' },
          { status: 400 }
        );
      }
      
      const allFeedback = await loadProcessingFeedback();
      const newFeedback: ProcessingFeedback[] = [];
      const errors: string[] = [];
      
      for (let i = 0; i < feedback_items.length; i++) {
        const item = feedback_items[i];
        
        try {
          // Validate each feedback item
          if (!item.job_id || !item.feedback_type || !item.rating) {
            errors.push(`Item ${i + 1}: job_id, feedback_type, and rating are required`);
            continue;
          }
          
          if (item.rating < 1 || item.rating > 5) {
            errors.push(`Item ${i + 1}: Rating must be between 1 and 5`);
            continue;
          }
          
          const feedback: ProcessingFeedback = {
            id: randomUUID(),
            user_id: userId,
            job_id: item.job_id,
            item_id: item.item_id,
            feedback_type: item.feedback_type,
            rating: item.rating,
            category_feedback: item.category_feedback,
            tag_feedback: item.tag_feedback,
            summary_feedback: item.summary_feedback,
            quality_score_feedback: item.quality_score_feedback,
            content_type_feedback: item.content_type_feedback,
            duplicate_detection_feedback: item.duplicate_detection_feedback,
            comments: item.comments,
            created_at: new Date().toISOString()
          };
          
          newFeedback.push(feedback);
          
        } catch (error) {
          errors.push(`Item ${i + 1}: ${(error as Error).message}`);
        }
      }
      
      // Save valid feedback
      allFeedback.push(...newFeedback);
      await saveProcessingFeedback(allFeedback);
      
      // Update accuracy metrics
      if (newFeedback.length > 0) {
        await updateAccuracyMetrics(allFeedback);
      }
      
      return NextResponse.json({
        success: true,
        submitted: newFeedback.length,
        failed: errors.length,
        errors,
        feedback_ids: newFeedback.map(f => f.id),
        message: `Bulk feedback submitted: ${newFeedback.length} successful, ${errors.length} failed`,
        processing_time_ms: Date.now() - startTime
      });
    }
    
    return NextResponse.json(
      { 
        error: 'Invalid action',
        available_actions: ['submit-feedback', 'bulk-feedback']
      },
      { status: 400 }
    );
    
  } catch (error) {
    console.error('Feedback API error:', error);
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