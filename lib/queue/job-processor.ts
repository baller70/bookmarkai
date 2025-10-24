import { getCacheManager } from '../cache/redis-manager';
import { EventEmitter } from 'events';

export interface Job {
  id: string;
  type: string;
  data: any;
  priority: number; // Higher numbers = higher priority
  attempts: number;
  maxAttempts: number;
  delay?: number; // Delay in milliseconds
  createdAt: number;
  processedAt?: number;
  completedAt?: number;
  failedAt?: number;
  error?: string;
  result?: any;
  timeout?: number; // Job timeout in milliseconds
  retryDelay?: number; // Delay between retries
  backoffStrategy?: 'fixed' | 'exponential' | 'linear';
  tags?: string[]; // For job categorization
}

export interface JobOptions {
  priority?: number;
  maxAttempts?: number;
  delay?: number;
  timeout?: number;
  retryDelay?: number;
  backoffStrategy?: 'fixed' | 'exponential' | 'linear';
  tags?: string[];
}

export interface QueueConfig {
  name: string;
  concurrency?: number; // Number of concurrent jobs
  maxJobs?: number; // Maximum jobs in queue
  defaultJobOptions?: JobOptions;
  redis?: ReturnType<ReturnType<typeof getCacheManager>['getClient']>;
  cleanupInterval?: number; // Cleanup old jobs interval (ms)
  maxJobAge?: number; // Maximum age of completed jobs (ms)
  enableMetrics?: boolean;
  enableDeadLetterQueue?: boolean;
}

export interface QueueStats {
  name: string;
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  paused: boolean;
  totalProcessed: number;
  avgProcessingTime: number;
  throughput: number; // Jobs per minute
  errorRate: number;
  topJobTypes: Array<{ type: string; count: number }>;
}

export interface JobProcessor {
  (job: Job): Promise<any>;
}

export interface JobEvent {
  type: 'waiting' | 'active' | 'completed' | 'failed' | 'stalled' | 'progress';
  job: Job;
  data?: any;
}

export class JobQueue extends EventEmitter {
  private config: Required<QueueConfig>;
  private cacheManager: ReturnType<typeof getCacheManager>;
  private redis: ReturnType<ReturnType<typeof getCacheManager>['getClient']>;
  private processors: Map<string, JobProcessor> = new Map();
  private activeJobs: Map<string, Job> = new Map();
  private paused = false;
  private processing = false;
  private cleanupTimer?: NodeJS.Timeout;
  private stats: QueueStats;
  private metrics: Array<{
    timestamp: number;
    jobType: string;
    processingTime: number;
    success: boolean;
  }> = [];

  constructor(config: QueueConfig) {
    super();
    
    this.config = {
      name: config.name,
      concurrency: config.concurrency || 5,
      maxJobs: config.maxJobs || 1000,
      defaultJobOptions: config.defaultJobOptions || {
        priority: 0,
        maxAttempts: 3,
        timeout: 30000, // 30 seconds
        retryDelay: 5000, // 5 seconds
        backoffStrategy: 'exponential'
      },
      redis: config.redis || getCacheManager().getClient(),
      cleanupInterval: config.cleanupInterval || 60000, // 1 minute
      maxJobAge: config.maxJobAge || 24 * 60 * 60 * 1000, // 24 hours
      enableMetrics: config.enableMetrics !== false,
      enableDeadLetterQueue: config.enableDeadLetterQueue !== false
    };

    this.cacheManager = getCacheManager();
    this.redis = this.config.redis || this.cacheManager.getClient();
    this.stats = {
      name: config.name,
      waiting: 0,
      active: 0,
      completed: 0,
      failed: 0,
      delayed: 0,
      paused: false,
      totalProcessed: 0,
      avgProcessingTime: 0,
      throughput: 0,
      errorRate: 0,
      topJobTypes: []
    };

    this.startCleanupTimer();
  }

  /**
   * Add a job to the queue
   */
  async add(
    type: string,
    data: any,
    options: JobOptions = {}
  ): Promise<string> {
    const jobOptions = { ...this.config.defaultJobOptions, ...options };
    const jobId = `${this.config.name}:${type}:${Date.now()}:${Math.random().toString(36).substr(2, 9)}`;
    
    const job: Job = {
      id: jobId,
      type,
      data,
      priority: jobOptions.priority!,
      attempts: 0,
      maxAttempts: jobOptions.maxAttempts!,
      delay: jobOptions.delay,
      createdAt: Date.now(),
      timeout: jobOptions.timeout,
      retryDelay: jobOptions.retryDelay,
      backoffStrategy: jobOptions.backoffStrategy,
      tags: jobOptions.tags
    };

    // Check queue size limit
    const queueSize = await this.getWaitingCount();
    if (queueSize >= this.config.maxJobs) {
      throw new Error(`Queue ${this.config.name} is full (${this.config.maxJobs} jobs)`);
    }

    if (job.delay && job.delay > 0) {
      // Add to delayed queue
      const delayedUntil = Date.now() + job.delay;
      await this.redis.zAdd(
        `${this.config.name}:delayed`,
        { score: delayedUntil, value: JSON.stringify(job) }
      );
      this.stats.delayed++;
    } else {
      // Add to waiting queue with priority
      await this.redis.zAdd(
        `${this.config.name}:waiting`,
        { score: -job.priority, value: JSON.stringify(job) }
      );
      this.stats.waiting++;
    }

    this.emit('job:added', job);
    console.log(`📋 Added job ${jobId} of type ${type} to queue ${this.config.name}`);

    // Start processing if not already running
    if (!this.processing && !this.paused) {
      this.startProcessing();
    }

    return jobId;
  }

  /**
   * Register a job processor
   */
  process(type: string, processor: JobProcessor): void {
    this.processors.set(type, processor);
    console.log(`🔧 Registered processor for job type: ${type}`);
  }

  /**
   * Start processing jobs
   */
  private async startProcessing(): Promise<void> {
    if (this.processing || this.paused) return;
    
    this.processing = true;
    console.log(`🚀 Started processing jobs for queue: ${this.config.name}`);

    // Process delayed jobs
    this.processDelayedJobs();

    // Process waiting jobs
    while (this.processing && !this.paused) {
      try {
        if (this.activeJobs.size >= this.config.concurrency) {
          await new Promise(resolve => setTimeout(resolve, 100));
          continue;
        }

        const job = await this.getNextJob();
        if (!job) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          continue;
        }

        this.processJob(job);
      } catch (error) {
        console.error('Error in job processing loop:', error);
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
  }

  /**
   * Get next job from waiting queue
   */
  private async getNextJob(): Promise<Job | null> {
    try {
      // Get highest priority job
      const result = await this.redis.zPopMin(`${this.config.name}:waiting`);
      
      if (!result || (Array.isArray(result) && result.length === 0)) {
        return null;
      }

      const jobData = result[0];
      const job: Job = JSON.parse(jobData);
      
      this.stats.waiting--;
      return job;
    } catch (error) {
      console.error('Error getting next job:', error);
      return null;
    }
  }

  /**
   * Process a single job
   */
  private async processJob(job: Job): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Move to active queue
      this.activeJobs.set(job.id, job);
      job.processedAt = startTime;
      job.attempts++;
      this.stats.active++;

      await this.redis.hSet(
        `${this.config.name}:active`,
        job.id,
        JSON.stringify(job)
      );

      this.emit('job:active', job);
      console.log(`🔄 Processing job ${job.id} (attempt ${job.attempts}/${job.maxAttempts})`);

      // Get processor
      const processor = this.processors.get(job.type);
      if (!processor) {
        throw new Error(`No processor registered for job type: ${job.type}`);
      }

      // Set timeout
      const timeoutPromise = job.timeout 
        ? new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Job timeout')), job.timeout)
          )
        : null;

      // Process job
      const processingPromise = processor(job);
      const result = timeoutPromise
        ? await Promise.race([processingPromise, timeoutPromise])
        : await processingPromise;

      // Job completed successfully
      job.result = result;
      job.completedAt = Date.now();
      
      await this.completeJob(job, startTime);

    } catch (error) {
      console.error(`❌ Job ${job.id} failed:`, error);
      await this.failJob(job, error as Error, startTime);
    }
  }

  /**
   * Complete a job successfully
   */
  private async completeJob(job: Job, startTime: number): Promise<void> {
    const processingTime = Date.now() - startTime;
    
    // Remove from active
    this.activeJobs.delete(job.id);
    await this.redis.hDel(`${this.config.name}:active`, job.id);
    this.stats.active--;

    // Add to completed
    await this.redis.hSet(
      `${this.config.name}:completed`,
      job.id,
      JSON.stringify(job)
    );
    this.stats.completed++;
    this.stats.totalProcessed++;

    // Record metrics
    if (this.config.enableMetrics) {
      this.recordMetric({
        timestamp: Date.now(),
        jobType: job.type,
        processingTime,
        success: true
      });
    }

    this.emit('job:completed', job);
    console.log(`✅ Job ${job.id} completed in ${processingTime}ms`);
  }

  /**
   * Handle job failure
   */
  private async failJob(job: Job, error: Error, startTime: number): Promise<void> {
    const processingTime = Date.now() - startTime;
    job.error = error.message;
    job.failedAt = Date.now();

    // Remove from active
    this.activeJobs.delete(job.id);
    await this.redis.hDel(`${this.config.name}:active`, job.id);
    this.stats.active--;

    // Record metrics
    if (this.config.enableMetrics) {
      this.recordMetric({
        timestamp: Date.now(),
        jobType: job.type,
        processingTime,
        success: false
      });
    }

    // Check if we should retry
    if (job.attempts < job.maxAttempts) {
      const retryDelay = this.calculateRetryDelay(job);
      console.log(`🔄 Retrying job ${job.id} in ${retryDelay}ms (attempt ${job.attempts + 1}/${job.maxAttempts})`);
      
      // Add back to delayed queue for retry
      const delayedUntil = Date.now() + retryDelay;
      await this.redis.zAdd(
        `${this.config.name}:delayed`,
        { score: delayedUntil, value: JSON.stringify(job) }
      );
      this.stats.delayed++;

      this.emit('job:retry', job);
    } else {
      // Job failed permanently
      if (this.config.enableDeadLetterQueue) {
        await this.redis.hSet(
          `${this.config.name}:failed`,
          job.id,
          JSON.stringify(job)
        );
      }
      
      this.stats.failed++;
      this.emit('job:failed', job);
      console.log(`💀 Job ${job.id} failed permanently after ${job.attempts} attempts`);
    }
  }

  /**
   * Calculate retry delay based on backoff strategy
   */
  private calculateRetryDelay(job: Job): number {
    const baseDelay = job.retryDelay || 5000;
    const attempt = job.attempts;

    switch (job.backoffStrategy) {
      case 'fixed':
        return baseDelay;
      case 'linear':
        return baseDelay * attempt;
      case 'exponential':
      default:
        return baseDelay * Math.pow(2, attempt - 1);
    }
  }

  /**
   * Process delayed jobs
   */
  private async processDelayedJobs(): Promise<void> {
    setInterval(async () => {
      try {
        const now = Date.now();
        
        // Get jobs that should be processed now
        const delayedJobs = await this.redis.zRangeByScore(
          `${this.config.name}:delayed`,
          0,
          now
        );

        for (const jobData of delayedJobs) {
          try {
            const job: Job = JSON.parse(jobData as string);
            
            // Remove from delayed queue
            await this.redis.zRem(`${this.config.name}:delayed`, jobData);
            this.stats.delayed--;

            // Add to waiting queue
            await this.redis.zAdd(
              `${this.config.name}:waiting`,
              { score: -job.priority, value: JSON.stringify(job) }
            );
            this.stats.waiting++;

            console.log(`⏰ Moved delayed job ${job.id} to waiting queue`);
          } catch (error) {
            console.error('Error processing delayed job:', error);
          }
        }
      } catch (error) {
        console.error('Error in delayed job processing:', error);
      }
    }, 5000); // Check every 5 seconds
  }

  /**
   * Record performance metric
   */
  private recordMetric(metric: {
    timestamp: number;
    jobType: string;
    processingTime: number;
    success: boolean;
  }): void {
    this.metrics.push(metric);

    // Keep only last 1000 metrics
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }

    // Update stats
    if (this.metrics.length > 0) {
      const totalTime = this.metrics.reduce((sum, m) => sum + m.processingTime, 0);
      this.stats.avgProcessingTime = totalTime / this.metrics.length;

      const recentMetrics = this.metrics.filter(m => m.timestamp > Date.now() - 60000);
      this.stats.throughput = recentMetrics.length;

      const failures = this.metrics.filter(m => !m.success).length;
      this.stats.errorRate = failures / this.metrics.length;

      // Calculate top job types
      const jobTypeCounts: Record<string, number> = {};
      this.metrics.forEach(m => {
        jobTypeCounts[m.jobType] = (jobTypeCounts[m.jobType] || 0) + 1;
      });

      this.stats.topJobTypes = Object.entries(jobTypeCounts)
        .map(([type, count]) => ({ type, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
    }
  }

  /**
   * Get queue statistics
   */
  async getStats(): Promise<QueueStats> {
    try {
      this.stats.waiting = await this.redis.zCard(`${this.config.name}:waiting`);
      this.stats.active = await this.redis.hLen(`${this.config.name}:active`);
      this.stats.completed = await this.redis.hLen(`${this.config.name}:completed`);
      this.stats.failed = await this.redis.hLen(`${this.config.name}:failed`);
      this.stats.delayed = await this.redis.zCard(`${this.config.name}:delayed`);
      this.stats.paused = this.paused;
    } catch (error) {
      console.error('Error getting queue stats:', error);
    }

    return { ...this.stats };
  }

  /**
   * Get waiting job count
   */
  private async getWaitingCount(): Promise<number> {
    return this.redis.zCard(`${this.config.name}:waiting`);
  }

  /**
   * Pause the queue
   */
  pause(): void {
    this.paused = true;
    this.processing = false;
    console.log(`⏸️  Paused queue: ${this.config.name}`);
  }

  /**
   * Resume the queue
   */
  resume(): void {
    this.paused = false;
    this.startProcessing();
    console.log(`▶️  Resumed queue: ${this.config.name}`);
  }

  /**
   * Clear all jobs from queue
   */
  async clear(): Promise<number> {
    const keys = [
      `${this.config.name}:waiting`,
      `${this.config.name}:delayed`,
      `${this.config.name}:active`,
      `${this.config.name}:completed`,
      `${this.config.name}:failed`
    ];

    let totalCleared = 0;
    for (const key of keys) {
      const count = await this.redis.del(key);
      totalCleared += count;
    }

    // Reset stats
    this.stats.waiting = 0;
    this.stats.active = 0;
    this.stats.completed = 0;
    this.stats.failed = 0;
    this.stats.delayed = 0;

    console.log(`🗑️  Cleared ${totalCleared} jobs from queue: ${this.config.name}`);
    return totalCleared;
  }

  /**
   * Get job by ID
   */
  async getJob(jobId: string): Promise<Job | null> {
    const queues = ['active', 'waiting', 'completed', 'failed'];
    
    for (const queue of queues) {
      try {
        if (queue === 'waiting' || queue === 'delayed') {
          // For sorted sets, we need to scan
          const jobs = await this.redis.zRange(`${this.config.name}:${queue}`, 0, -1);
          for (const jobData of jobs) {
            const job: Job = JSON.parse(jobData as string);
            if (job.id === jobId) {
              return job;
            }
          }
        } else {
          // For hashes
          const jobData = await this.redis.hGet(`${this.config.name}:${queue}`, jobId);
          if (jobData) {
            return JSON.parse(jobData);
          }
        }
      } catch (error) {
        console.error(`Error checking ${queue} queue:`, error);
      }
    }

    return null;
  }

  /**
   * Remove job by ID
   */
  async removeJob(jobId: string): Promise<boolean> {
    const queues = ['waiting', 'delayed', 'active', 'completed', 'failed'];
    let removed = false;

    for (const queue of queues) {
      try {
        if (queue === 'waiting' || queue === 'delayed') {
          // For sorted sets, find and remove
          const jobs = await this.redis.zRange(`${this.config.name}:${queue}`, 0, -1);
          for (const jobData of jobs) {
            const job: Job = JSON.parse(jobData as string);
            if (job.id === jobId) {
              await this.redis.zRem(`${this.config.name}:${queue}`, jobData);
              removed = true;
              break;
            }
          }
        } else {
          // For hashes
          const result = await this.redis.hDel(`${this.config.name}:${queue}`, jobId);
          if (result > 0) {
            removed = true;
          }
        }
      } catch (error) {
        console.error(`Error removing job from ${queue}:`, error);
      }
    }

    if (removed) {
      console.log(`🗑️  Removed job ${jobId} from queue: ${this.config.name}`);
    }

    return removed;
  }

  /**
   * Start cleanup timer
   */
  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(async () => {
      await this.cleanup();
    }, this.config.cleanupInterval);
  }

  /**
   * Cleanup old jobs
   */
  private async cleanup(): Promise<void> {
    try {
      const cutoffTime = Date.now() - this.config.maxJobAge;
      let cleanedCount = 0;

      // Clean completed jobs
      const completedJobs = await this.redis.hGetAll(`${this.config.name}:completed`);
      for (const [jobId, jobData] of Object.entries(completedJobs)) {
        try {
          const job: Job = JSON.parse(jobData as string);
          if (job.completedAt && job.completedAt < cutoffTime) {
            await this.redis.hDel(`${this.config.name}:completed`, jobId);
            cleanedCount++;
          }
        } catch (error) {
          // Remove invalid job data
          await this.redis.hDel(`${this.config.name}:completed`, jobId);
          cleanedCount++;
        }
      }

      // Clean failed jobs
      const failedJobs = await this.redis.hGetAll(`${this.config.name}:failed`);
      for (const [jobId, jobData] of Object.entries(failedJobs)) {
        try {
          const job: Job = JSON.parse(jobData as string);
          if (job.failedAt && job.failedAt < cutoffTime) {
            await this.redis.hDel(`${this.config.name}:failed`, jobId);
            cleanedCount++;
          }
        } catch (error) {
          // Remove invalid job data
          await this.redis.hDel(`${this.config.name}:failed`, jobId);
          cleanedCount++;
        }
      }

      if (cleanedCount > 0) {
        console.log(`🧹 Cleaned up ${cleanedCount} old jobs from queue: ${this.config.name}`);
      }
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }

  /**
   * Shutdown the queue
   */
  async shutdown(): Promise<void> {
    console.log(`🛑 Shutting down queue: ${this.config.name}`);
    
    this.paused = true;
    this.processing = false;

    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }

    // Wait for active jobs to complete (with timeout)
    const shutdownTimeout = 30000; // 30 seconds
    const startTime = Date.now();

    while (this.activeJobs.size > 0 && Date.now() - startTime < shutdownTimeout) {
      console.log(`⏳ Waiting for ${this.activeJobs.size} active jobs to complete...`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    if (this.activeJobs.size > 0) {
      console.warn(`⚠️  Forcefully shutting down with ${this.activeJobs.size} active jobs`);
    }

    console.log(`✅ Queue ${this.config.name} shut down`);
  }
}

// Job queue manager for multiple queues
export class JobQueueManager {
  private queues: Map<string, JobQueue> = new Map();
  private cacheManager: ReturnType<typeof getCacheManager>;
  private redis: ReturnType<ReturnType<typeof getCacheManager>['getClient']>;

  constructor(redis?: ReturnType<ReturnType<typeof getCacheManager>['getClient']>) {
    this.cacheManager = getCacheManager();
    this.redis = redis || this.cacheManager.getClient();
  }

  /**
   * Create or get a queue
   */
  queue(name: string, config?: Partial<QueueConfig>): JobQueue {
    if (!this.queues.has(name)) {
      const queueConfig: QueueConfig = {
        name,
        redis: this.redis,
        ...config
      };
      
      const queue = new JobQueue(queueConfig);
      this.queues.set(name, queue);
      console.log(`📋 Created queue: ${name}`);
    }

    return this.queues.get(name)!;
  }

  /**
   * Get all queue statistics
   */
  async getAllStats(): Promise<Record<string, QueueStats>> {
    const stats: Record<string, QueueStats> = {};
    
    for (const [name, queue] of this.queues.entries()) {
      stats[name] = await queue.getStats();
    }

    return stats;
  }

  /**
   * Shutdown all queues
   */
  async shutdown(): Promise<void> {
    console.log('🛑 Shutting down all queues...');
    
    const shutdownPromises = Array.from(this.queues.values()).map(queue => 
      queue.shutdown()
    );
    
    await Promise.all(shutdownPromises);
    this.queues.clear();
    
    console.log('✅ All queues shut down');
  }
}

// Export singleton instance
export const jobQueueManager = new JobQueueManager();

// Helper functions for common job types
export const addAIProcessingJob = async (
  type: 'categorization' | 'tagging' | 'content-analysis' | 'recommendations',
  data: any,
  options?: JobOptions
) => {
  const queue = jobQueueManager.queue('ai-processing', {
    concurrency: 3, // Limit AI operations
    defaultJobOptions: {
      priority: 5,
      maxAttempts: 3,
      timeout: 60000, // 1 minute for AI operations
      retryDelay: 10000,
      backoffStrategy: 'exponential'
    }
  });

  return queue.add(type, data, options);
};

export const addUserActionJob = async (
  type: string,
  data: any,
  options?: JobOptions
) => {
  const queue = jobQueueManager.queue('user-actions', {
    concurrency: 10,
    defaultJobOptions: {
      priority: 3,
      maxAttempts: 2,
      timeout: 30000
    }
  });

  return queue.add(type, data, options);
};

export const addEmailJob = async (
  type: 'notification' | 'digest' | 'welcome',
  data: any,
  options?: JobOptions
) => {
  const queue = jobQueueManager.queue('email', {
    concurrency: 5,
    defaultJobOptions: {
      priority: 2,
      maxAttempts: 5,
      timeout: 30000,
      retryDelay: 30000, // 30 seconds between email retries
      backoffStrategy: 'exponential'
    }
  });

  return queue.add(type, data, options);
};                        