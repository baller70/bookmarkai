import { NextRequest, NextResponse } from 'next/server';
import { writeFile, readFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { authenticateUser, createUnauthorizedResponse } from '@/lib/auth-utils';

// File-based storage for persistent data
const PROCESSING_JOBS_FILE = join(process.cwd(), 'data', 'processing_jobs.json');
const QUEUE_CONFIG_FILE = join(process.cwd(), 'data', 'queue_config.json');
const QUEUE_METRICS_FILE = join(process.cwd(), 'data', 'queue_metrics.json');

interface QueueConfig {
  max_concurrent_jobs: number;
  max_queue_size: number;
  priority_weights: {
    urgent: number;
    high: number;
    normal: number;
    low: number;
  };
  processing_limits: {
    single_job_timeout: number; // milliseconds
    batch_job_timeout: number;
    max_items_per_batch: number;
    retry_attempts: number;
    retry_delay: number;
  };
  resource_allocation: {
    cpu_limit_percent: number;
    memory_limit_mb: number;
    api_rate_limit_per_minute: number;
  };
  auto_scaling: {
    enabled: boolean;
    scale_up_threshold: number;
    scale_down_threshold: number;
    min_workers: number;
    max_workers: number;
  };
  maintenance: {
    cleanup_completed_jobs_after_days: number;
    cleanup_failed_jobs_after_days: number;
    max_log_entries: number;
  };
}

interface QueueMetrics {
  id: string;
  timestamp: string;
  queue_stats: {
    total_jobs: number;
    pending_jobs: number;
    processing_jobs: number;
    completed_jobs: number;
    failed_jobs: number;
    cancelled_jobs: number;
  };
  priority_distribution: {
    urgent: number;
    high: number;
    normal: number;
    low: number;
  };
  performance_metrics: {
    average_processing_time: number;
    average_queue_wait_time: number;
    throughput_per_hour: number;
    success_rate: number;
    error_rate: number;
  };
  resource_usage: {
    cpu_usage_percent: number;
    memory_usage_mb: number;
    api_calls_per_minute: number;
    active_workers: number;
  };
  bottlenecks: {
    queue_full: boolean;
    high_cpu_usage: boolean;
    high_memory_usage: boolean;
    api_rate_limited: boolean;
    slow_processing: boolean;
  };
}

interface ProcessingJob {
  id: string;
  user_id: string;
  type: 'single' | 'batch';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'paused';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  created_at: string;
  updated_at: string;
  started_at?: string;
  completed_at?: string;
  queue_position?: number;
  estimated_start_time?: string;
  progress: {
    total: number;
    processed: number;
    failed: number;
    current_item?: string;
  };
  retry_count?: number;
  last_error?: string;
  worker_id?: string;
  resource_usage?: {
    cpu_time: number;
    memory_peak: number;
    api_calls: number;
  };
}

interface QueueOperation {
  operation: 'pause' | 'resume' | 'cancel' | 'prioritize' | 'reschedule';
  job_ids: string[];
  new_priority?: 'low' | 'normal' | 'high' | 'urgent';
  scheduled_time?: string;
  reason?: string;
}

// Default queue configuration
const DEFAULT_QUEUE_CONFIG: QueueConfig = {
  max_concurrent_jobs: 5,
  max_queue_size: 100,
  priority_weights: {
    urgent: 4,
    high: 3,
    normal: 2,
    low: 1
  },
  processing_limits: {
    single_job_timeout: 300000, // 5 minutes
    batch_job_timeout: 1800000, // 30 minutes
    max_items_per_batch: 100,
    retry_attempts: 3,
    retry_delay: 5000 // 5 seconds
  },
  resource_allocation: {
    cpu_limit_percent: 80,
    memory_limit_mb: 2048,
    api_rate_limit_per_minute: 100
  },
  auto_scaling: {
    enabled: false,
    scale_up_threshold: 0.8,
    scale_down_threshold: 0.3,
    min_workers: 1,
    max_workers: 10
  },
  maintenance: {
    cleanup_completed_jobs_after_days: 7,
    cleanup_failed_jobs_after_days: 30,
    max_log_entries: 10000
  }
};

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

async function loadQueueConfig(): Promise<QueueConfig> {
  try {
    await ensureDataDirectory();
    if (!existsSync(QUEUE_CONFIG_FILE)) {
      await saveQueueConfig(DEFAULT_QUEUE_CONFIG);
      return DEFAULT_QUEUE_CONFIG;
    }
    const data = await readFile(QUEUE_CONFIG_FILE, 'utf-8');
    return { ...DEFAULT_QUEUE_CONFIG, ...JSON.parse(data) };
  } catch (error) {
    console.error('Error loading queue config:', error);
    return DEFAULT_QUEUE_CONFIG;
  }
}

async function loadQueueMetrics(): Promise<QueueMetrics[]> {
  try {
    await ensureDataDirectory();
    if (!existsSync(QUEUE_METRICS_FILE)) return [];
    const data = await readFile(QUEUE_METRICS_FILE, 'utf-8');
    return JSON.parse(data) as QueueMetrics[];
  } catch (error) {
    console.error('Error loading queue metrics:', error);
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

async function saveQueueConfig(config: QueueConfig): Promise<void> {
  try {
    await ensureDataDirectory();
    await writeFile(QUEUE_CONFIG_FILE, JSON.stringify(config, null, 2));
  } catch (error) {
    console.error('Error saving queue config:', error);
    throw error;
  }
}

async function saveQueueMetrics(metrics: QueueMetrics[]): Promise<void> {
  try {
    await ensureDataDirectory();
    await writeFile(QUEUE_METRICS_FILE, JSON.stringify(metrics, null, 2));
  } catch (error) {
    console.error('Error saving queue metrics:', error);
    throw error;
  }
}

// Queue management functions
function calculateQueuePosition(jobs: ProcessingJob[], config: QueueConfig): ProcessingJob[] {
  const pendingJobs = jobs.filter(job => job.status === 'pending');
  
  // Sort by priority weight (higher weight = higher priority) and creation time
  pendingJobs.sort((a, b) => {
    const priorityDiff = config.priority_weights[b.priority] - config.priority_weights[a.priority];
    if (priorityDiff !== 0) return priorityDiff;
    
    // If same priority, sort by creation time (FIFO)
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  });
  
  // Assign queue positions
  pendingJobs.forEach((job, index) => {
    job.queue_position = index + 1;
  });
  
  return jobs;
}

function estimateProcessingTimes(jobs: ProcessingJob[], config: QueueConfig): ProcessingJob[] {
  const pendingJobs = jobs.filter(job => job.status === 'pending');
  const processingJobs = jobs.filter(job => job.status === 'processing');
  
  // Estimate based on job type and size
  const avgSingleJobTime = 30000; // 30 seconds
  const avgBatchItemTime = 5000; // 5 seconds per item
  
  let cumulativeTime = 0;
  const availableSlots = config.max_concurrent_jobs - processingJobs.length;
  
  pendingJobs.forEach((job, index) => {
    let estimatedJobTime;
    if (job.type === 'single') {
      estimatedJobTime = avgSingleJobTime;
    } else {
      estimatedJobTime = job.progress.total * avgBatchItemTime;
    }
    
    if (index < availableSlots) {
      // Job can start immediately
      job.estimated_start_time = new Date().toISOString();
    } else {
      // Job must wait in queue
      const queueIndex = index - availableSlots;
      const startTime = new Date(Date.now() + cumulativeTime);
      job.estimated_start_time = startTime.toISOString();
    }
    
    if (index >= availableSlots) {
      cumulativeTime += estimatedJobTime;
    }
  });
  
  return jobs;
}

function generateQueueMetrics(jobs: ProcessingJob[]): QueueMetrics {
  const now = new Date();
  const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  
  const recentJobs = jobs.filter(job => new Date(job.created_at) >= last24Hours);
  const completedJobs = recentJobs.filter(job => job.status === 'completed');
  
  // Calculate performance metrics
  const processingTimes = completedJobs
    .filter(job => job.started_at && job.completed_at)
    .map(job => new Date(job.completed_at!).getTime() - new Date(job.started_at!).getTime());
  
  const queueWaitTimes = completedJobs
    .filter(job => job.started_at)
    .map(job => new Date(job.started_at!).getTime() - new Date(job.created_at).getTime());
  
  const metrics: QueueMetrics = {
    id: randomUUID(),
    timestamp: now.toISOString(),
    queue_stats: {
      total_jobs: jobs.length,
      pending_jobs: jobs.filter(job => job.status === 'pending').length,
      processing_jobs: jobs.filter(job => job.status === 'processing').length,
      completed_jobs: jobs.filter(job => job.status === 'completed').length,
      failed_jobs: jobs.filter(job => job.status === 'failed').length,
      cancelled_jobs: jobs.filter(job => job.status === 'cancelled').length
    },
    priority_distribution: {
      urgent: jobs.filter(job => job.priority === 'urgent').length,
      high: jobs.filter(job => job.priority === 'high').length,
      normal: jobs.filter(job => job.priority === 'normal').length,
      low: jobs.filter(job => job.priority === 'low').length
    },
    performance_metrics: {
      average_processing_time: processingTimes.length > 0 ? 
        processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length : 0,
      average_queue_wait_time: queueWaitTimes.length > 0 ? 
        queueWaitTimes.reduce((sum, time) => sum + time, 0) / queueWaitTimes.length : 0,
      throughput_per_hour: (completedJobs.length / 24) * 60 * 60 * 1000,
      success_rate: recentJobs.length > 0 ? 
        (completedJobs.length / recentJobs.length) * 100 : 0,
      error_rate: recentJobs.length > 0 ? 
        (recentJobs.filter(job => job.status === 'failed').length / recentJobs.length) * 100 : 0
    },
    resource_usage: {
      cpu_usage_percent: Math.random() * 100, // Simulated - would be real metrics in production
      memory_usage_mb: Math.random() * 2048,
      api_calls_per_minute: Math.random() * 100,
      active_workers: jobs.filter(job => job.status === 'processing').length
    },
    bottlenecks: {
      queue_full: jobs.filter(job => job.status === 'pending').length > 50,
      high_cpu_usage: false, // Would be calculated from real metrics
      high_memory_usage: false,
      api_rate_limited: false,
      slow_processing: processingTimes.length > 0 && 
        (processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length) > 60000
    }
  };
  
  return metrics;
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const userId = searchParams.get('user_id');
    const jobId = searchParams.get('job_id');
    const priority = searchParams.get('priority');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    if (action === 'status') {
      console.log(`📊 Getting queue status`);
      
      const jobs = await loadProcessingJobs();
      const config = await loadQueueConfig();
      
      // Update queue positions and estimates
      const updatedJobs = estimateProcessingTimes(calculateQueuePosition(jobs, config), config);
      await saveProcessingJobs(updatedJobs);
      
      const queueStatus = {
        total_jobs: jobs.length,
        queue_stats: {
          pending: jobs.filter(job => job.status === 'pending').length,
          processing: jobs.filter(job => job.status === 'processing').length,
          completed: jobs.filter(job => job.status === 'completed').length,
          failed: jobs.filter(job => job.status === 'failed').length,
          cancelled: jobs.filter(job => job.status === 'cancelled').length,
          paused: jobs.filter(job => job.status === 'paused').length
        },
        priority_queue: {
          urgent: jobs.filter(job => job.status === 'pending' && job.priority === 'urgent').length,
          high: jobs.filter(job => job.status === 'pending' && job.priority === 'high').length,
          normal: jobs.filter(job => job.status === 'pending' && job.priority === 'normal').length,
          low: jobs.filter(job => job.status === 'pending' && job.priority === 'low').length
        },
        capacity: {
          max_concurrent: config.max_concurrent_jobs,
          current_processing: jobs.filter(job => job.status === 'processing').length,
          available_slots: Math.max(0, config.max_concurrent_jobs - jobs.filter(job => job.status === 'processing').length),
          queue_utilization: jobs.filter(job => job.status === 'pending').length / config.max_queue_size
        },
        estimated_wait_times: {
          urgent: '< 1 minute',
          high: '< 5 minutes',
          normal: '< 15 minutes',
          low: '< 1 hour'
        }
      };
      
      return NextResponse.json({
        success: true,
        queue_status: queueStatus,
        config: {
          max_concurrent_jobs: config.max_concurrent_jobs,
          max_queue_size: config.max_queue_size,
          auto_scaling_enabled: config.auto_scaling.enabled
        },
        processing_time_ms: Date.now() - startTime
      });
    }
    
    if (action === 'jobs') {
      console.log(`📋 Getting queue jobs`);
      
      const jobs = await loadProcessingJobs();
      let filteredJobs = jobs;
      
      // Apply filters
      if (userId) {
        filteredJobs = filteredJobs.filter(job => job.user_id === userId);
      }
      
      if (priority) {
        filteredJobs = filteredJobs.filter(job => job.priority === priority);
      }
      
      if (status) {
        filteredJobs = filteredJobs.filter(job => job.status === status);
      }
      
      // Sort by queue position for pending jobs, creation time for others
      filteredJobs.sort((a, b) => {
        if (a.status === 'pending' && b.status === 'pending') {
          return (a.queue_position || 0) - (b.queue_position || 0);
        }
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
      
      // Apply pagination
      const paginatedJobs = filteredJobs.slice(offset, offset + limit);
      
      return NextResponse.json({
        success: true,
        jobs: paginatedJobs.map(job => ({
          id: job.id,
          user_id: job.user_id,
          type: job.type,
          status: job.status,
          priority: job.priority,
          queue_position: job.queue_position,
          estimated_start_time: job.estimated_start_time,
          progress: job.progress,
          created_at: job.created_at,
          started_at: job.started_at,
          completed_at: job.completed_at,
          retry_count: job.retry_count,
          worker_id: job.worker_id,
          resource_usage: job.resource_usage
        })),
        pagination: {
          total: filteredJobs.length,
          limit,
          offset,
          has_more: offset + limit < filteredJobs.length
        },
        processing_time_ms: Date.now() - startTime
      });
    }
    
    if (action === 'metrics') {
      console.log(`📈 Getting queue metrics`);
      
      const jobs = await loadProcessingJobs();
      const metrics = await loadQueueMetrics();
      
      // Generate current metrics
      const currentMetrics = generateQueueMetrics(jobs);
      
      // Save current metrics
      metrics.push(currentMetrics);
      
      // Keep only last 100 metrics entries
      if (metrics.length > 100) {
        metrics.splice(0, metrics.length - 100);
      }
      
      await saveQueueMetrics(metrics);
      
      return NextResponse.json({
        success: true,
        current_metrics: currentMetrics,
        historical_metrics: metrics.slice(-24), // Last 24 entries
        processing_time_ms: Date.now() - startTime
      });
    }
    
    if (action === 'config') {
      console.log(`⚙️ Getting queue configuration`);
      
      const config = await loadQueueConfig();
      
      return NextResponse.json({
        success: true,
        config,
        processing_time_ms: Date.now() - startTime
      });
    }
    
    if (action === 'position' && jobId) {
      console.log(`📍 Getting position for job: ${jobId}`);
      
      const jobs = await loadProcessingJobs();
      const job = jobs.find(j => j.id === jobId);
      
      if (!job) {
        return NextResponse.json(
          { error: 'Job not found' },
          { status: 404 }
        );
      }
      
      const config = await loadQueueConfig();
      const updatedJobs = calculateQueuePosition(jobs, config);
      const updatedJob = updatedJobs.find(j => j.id === jobId);
      
      return NextResponse.json({
        success: true,
        job_id: jobId,
        current_status: updatedJob?.status,
        queue_position: updatedJob?.queue_position,
        estimated_start_time: updatedJob?.estimated_start_time,
        jobs_ahead: (updatedJob?.queue_position || 1) - 1,
        processing_time_ms: Date.now() - startTime
      });
    }
    
    return NextResponse.json(
      { 
        error: 'Invalid action',
        available_actions: ['status', 'jobs', 'metrics', 'config', 'position']
      },
      { status: 400 }
    );
    
  } catch (error) {
    console.error('Queue API error:', error);
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
    
    if (action === 'manage-jobs') {
      console.log(`🔧 Managing jobs for user: ${userId}`);
      
      const { operation, job_ids, new_priority, scheduled_time, reason }: QueueOperation = body;
      
      if (!operation || !job_ids || !Array.isArray(job_ids)) {
        return NextResponse.json(
          { error: 'operation and job_ids array are required' },
          { status: 400 }
        );
      }
      
      const jobs = await loadProcessingJobs();
      const config = await loadQueueConfig();
      const affectedJobs: ProcessingJob[] = [];
      const errors: string[] = [];
      
      for (const jobId of job_ids) {
        const jobIndex = jobs.findIndex(j => j.id === jobId);
        
        if (jobIndex === -1) {
          errors.push(`Job ${jobId} not found`);
          continue;
        }
        
        const job = jobs[jobIndex];
        
        // Verify user has permission to modify this job
        if (job.user_id !== userId) {
          errors.push(`Access denied for job ${jobId}`);
          continue;
        }
        
        switch (operation) {
          case 'pause':
            if (job.status === 'pending' || job.status === 'processing') {
              job.status = 'paused';
              job.updated_at = new Date().toISOString();
              affectedJobs.push(job);
            } else {
              errors.push(`Cannot pause job ${jobId} with status ${job.status}`);
            }
            break;
            
          case 'resume':
            if (job.status === 'paused') {
              job.status = 'pending';
              job.updated_at = new Date().toISOString();
              affectedJobs.push(job);
            } else {
              errors.push(`Cannot resume job ${jobId} with status ${job.status}`);
            }
            break;
            
          case 'cancel':
            if (['pending', 'processing', 'paused'].includes(job.status)) {
              job.status = 'cancelled';
              job.completed_at = new Date().toISOString();
              job.updated_at = new Date().toISOString();
              affectedJobs.push(job);
            } else {
              errors.push(`Cannot cancel job ${jobId} with status ${job.status}`);
            }
            break;
            
          case 'prioritize':
            if (job.status === 'pending' && new_priority) {
              job.priority = new_priority;
              job.updated_at = new Date().toISOString();
              affectedJobs.push(job);
            } else {
              errors.push(`Cannot change priority for job ${jobId} with status ${job.status}`);
            }
            break;
            
          case 'reschedule':
            if (job.status === 'pending' && scheduled_time) {
              // In a real implementation, this would schedule the job for later
              job.updated_at = new Date().toISOString();
              affectedJobs.push(job);
            } else {
              errors.push(`Cannot reschedule job ${jobId}`);
            }
            break;
            
          default:
            errors.push(`Invalid operation: ${operation}`);
        }
      }
      
      // Recalculate queue positions after changes
      if (affectedJobs.length > 0) {
        const updatedJobs = calculateQueuePosition(jobs, config);
        await saveProcessingJobs(updatedJobs);
      }
      
      return NextResponse.json({
        success: true,
        operation,
        affected_jobs: affectedJobs.length,
        failed_operations: errors.length,
        errors,
        affected_job_ids: affectedJobs.map(j => j.id),
        message: `${operation} operation completed: ${affectedJobs.length} successful, ${errors.length} failed`,
        processing_time_ms: Date.now() - startTime
      });
    }
    
    if (action === 'update-config') {
      console.log(`⚙️ Updating queue configuration`);
      
      const { config_updates } = body;
      
      if (!config_updates || typeof config_updates !== 'object') {
        return NextResponse.json(
          { error: 'config_updates object is required' },
          { status: 400 }
        );
      }
      
      const currentConfig = await loadQueueConfig();
      const newConfig = { ...currentConfig, ...config_updates };
      
      // Validate configuration values
      if (newConfig.max_concurrent_jobs < 1 || newConfig.max_concurrent_jobs > 50) {
        return NextResponse.json(
          { error: 'max_concurrent_jobs must be between 1 and 50' },
          { status: 400 }
        );
      }
      
      if (newConfig.max_queue_size < 10 || newConfig.max_queue_size > 1000) {
        return NextResponse.json(
          { error: 'max_queue_size must be between 10 and 1000' },
          { status: 400 }
        );
      }
      
      await saveQueueConfig(newConfig);
      
      return NextResponse.json({
        success: true,
        updated_config: newConfig,
        message: 'Queue configuration updated successfully',
        processing_time_ms: Date.now() - startTime
      });
    }
    
    if (action === 'cleanup') {
      console.log(`🧹 Performing queue cleanup`);
      
      const { cleanup_type, older_than_days } = body;
      
      const jobs = await loadProcessingJobs();
      const config = await loadQueueConfig();
      const now = new Date();
      let removedJobs = 0;
      
      const filteredJobs = jobs.filter(job => {
        const jobDate = new Date(job.completed_at || job.created_at);
        const daysDiff = (now.getTime() - jobDate.getTime()) / (1000 * 60 * 60 * 24);
        
        if (cleanup_type === 'completed' && job.status === 'completed') {
          const threshold = older_than_days || config.maintenance.cleanup_completed_jobs_after_days;
          if (daysDiff > threshold) {
            removedJobs++;
            return false;
          }
        }
        
        if (cleanup_type === 'failed' && job.status === 'failed') {
          const threshold = older_than_days || config.maintenance.cleanup_failed_jobs_after_days;
          if (daysDiff > threshold) {
            removedJobs++;
            return false;
          }
        }
        
        if (cleanup_type === 'all') {
          if ((job.status === 'completed' && daysDiff > config.maintenance.cleanup_completed_jobs_after_days) ||
              (job.status === 'failed' && daysDiff > config.maintenance.cleanup_failed_jobs_after_days)) {
            removedJobs++;
            return false;
          }
        }
        
        return true;
      });
      
      await saveProcessingJobs(filteredJobs);
      
      return NextResponse.json({
        success: true,
        cleanup_type,
        jobs_removed: removedJobs,
        remaining_jobs: filteredJobs.length,
        message: `Cleanup completed: ${removedJobs} jobs removed`,
        processing_time_ms: Date.now() - startTime
      });
    }
    
    return NextResponse.json(
      { 
        error: 'Invalid action',
        available_actions: ['manage-jobs', 'update-config', 'cleanup']
      },
      { status: 400 }
    );
    
  } catch (error) {
    console.error('Queue management error:', error);
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