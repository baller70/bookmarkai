import OpenAI from 'openai';
import { appLogger } from '../logger';

// Create logger for OpenAI operations
const logger = appLogger;

// Environment validation (runtime check)
const isOpenAIAvailable = () => !!process.env.OPENAI_API_KEY;

// OpenAI client instance with enhanced configuration
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'dummy-key',
  timeout: 15000, // 15 seconds timeout for faster response
  maxRetries: 2, // Reduce retries for faster failure
});

// Model configurations for different use cases
export const MODEL_CONFIGS = {
  // Content analysis models
  CONTENT_ANALYSIS: {
    model: 'gpt-3.5-turbo', // Faster than GPT-4 for better performance
    temperature: 0.3,
    max_tokens: 1000, // Reduced for faster response
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
  },
  
  // Chat and conversation models
  CHAT: {
    model: 'gpt-4-turbo-preview',
    temperature: 0.7,
    max_tokens: 1000,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
  },
  
  // Creative content generation
  CREATIVE: {
    model: 'gpt-4-turbo-preview',
    temperature: 0.9,
    max_tokens: 1500,
    top_p: 0.95,
    frequency_penalty: 0.1,
    presence_penalty: 0.1,
  },
  
  // Fast processing for simple tasks
  FAST: {
    model: 'gpt-3.5-turbo',
    temperature: 0.5,
    max_tokens: 500,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
  },
  
  // Embeddings model
  EMBEDDINGS: {
    model: 'text-embedding-3-large',
    dimensions: 1536,
  },
  
  // Text-to-speech models
  TTS: {
    model: 'tts-1-hd',
    voice: 'nova' as const,
    response_format: 'mp3' as const,
  },
  
  // Speech-to-text models
  STT: {
    model: 'whisper-1',
    response_format: 'json' as const,
    language: 'en',
  },
} as const;

// Usage tracking interface
export interface OpenAIUsage {
  timestamp: number;
  model: string;
  operation: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  cost_estimate: number;
  duration: number;
  success: boolean;
  error?: string;
}

// Performance metrics tracking
class OpenAIMetrics {
  private usage: OpenAIUsage[] = [];
  private readonly MAX_HISTORY = 1000;

  // Track API usage
  trackUsage(usage: OpenAIUsage): void {
    this.usage.push(usage);
    
    // Keep only recent usage data
    if (this.usage.length > this.MAX_HISTORY) {
      this.usage = this.usage.slice(-this.MAX_HISTORY);
    }

    // Log usage for monitoring
    logger.info('OpenAI API Usage', {
      model: usage.model,
      operation: usage.operation,
      tokens: usage.total_tokens,
      cost: usage.cost_estimate,
      duration: usage.duration,
      success: usage.success,
    });
  }

  // Get usage statistics
  getUsageStats(timeRange: number = 3600000): {
    totalRequests: number;
    totalTokens: number;
    totalCost: number;
    averageResponseTime: number;
    successRate: number;
    modelUsage: Record<string, number>;
    operationUsage: Record<string, number>;
  } {
    const now = Date.now();
    const recentUsage = this.usage.filter(u => now - u.timestamp < timeRange);

    if (recentUsage.length === 0) {
      return {
        totalRequests: 0,
        totalTokens: 0,
        totalCost: 0,
        averageResponseTime: 0,
        successRate: 0,
        modelUsage: {},
        operationUsage: {},
      };
    }

    const totalTokens = recentUsage.reduce((sum, u) => sum + u.total_tokens, 0);
    const totalCost = recentUsage.reduce((sum, u) => sum + u.cost_estimate, 0);
    const averageResponseTime = recentUsage.reduce((sum, u) => sum + u.duration, 0) / recentUsage.length;
    const successfulRequests = recentUsage.filter(u => u.success).length;
    const successRate = (successfulRequests / recentUsage.length) * 100;

    // Model usage distribution
    const modelUsage: Record<string, number> = {};
    recentUsage.forEach(u => {
      modelUsage[u.model] = (modelUsage[u.model] || 0) + 1;
    });

    // Operation usage distribution
    const operationUsage: Record<string, number> = {};
    recentUsage.forEach(u => {
      operationUsage[u.operation] = (operationUsage[u.operation] || 0) + 1;
    });

    return {
      totalRequests: recentUsage.length,
      totalTokens,
      totalCost,
      averageResponseTime,
      successRate,
      modelUsage,
      operationUsage,
    };
  }

  // Get recent errors
  getRecentErrors(limit: number = 10): OpenAIUsage[] {
    return this.usage
      .filter(u => !u.success)
      .slice(-limit)
      .reverse();
  }

  // Export usage data
  exportUsageData(): OpenAIUsage[] {
    return [...this.usage];
  }
}

// Global metrics instance
export const openaiMetrics = new OpenAIMetrics();

// Cost estimation (approximate rates as of 2024)
const TOKEN_COSTS = {
  'gpt-4-turbo-preview': { input: 0.01 / 1000, output: 0.03 / 1000 },
  'gpt-4': { input: 0.03 / 1000, output: 0.06 / 1000 },
  'gpt-3.5-turbo': { input: 0.0015 / 1000, output: 0.002 / 1000 },
  'text-embedding-3-large': { input: 0.00013 / 1000, output: 0 },
  'text-embedding-3-small': { input: 0.00002 / 1000, output: 0 },
  'whisper-1': { input: 0.006 / 60, output: 0 }, // per minute
  'tts-1': { input: 0.015 / 1000, output: 0 }, // per 1K characters
  'tts-1-hd': { input: 0.030 / 1000, output: 0 }, // per 1K characters
};

// Calculate cost estimate
export function calculateCost(model: string, promptTokens: number, completionTokens: number): number {
  const costs = TOKEN_COSTS[model as keyof typeof TOKEN_COSTS];
  if (!costs) return 0;
  
  return (promptTokens * costs.input) + (completionTokens * costs.output);
}

// Enhanced OpenAI wrapper with monitoring and error handling
export class EnhancedOpenAI {
  private client: OpenAI;

  constructor() {
    this.client = openai;
  }

  // Enhanced chat completion with monitoring
  async chatCompletion(
    messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[],
    options: Partial<OpenAI.Chat.Completions.ChatCompletionCreateParams> = {},
    operation: string = 'chat'
  ): Promise<OpenAI.Chat.Completions.ChatCompletion> {
    const startTime = Date.now();
    const model = options.model || MODEL_CONFIGS.CHAT.model;

    try {
      if (!isOpenAIAvailable()) {
        throw new Error('OPENAI_API_KEY not configured');
      }
      const completion = await this.client.chat.completions.create({
        ...MODEL_CONFIGS.CHAT,
        ...options,
        messages,
      });

      const duration = Date.now() - startTime;
      const usage = 'usage' in completion ? completion.usage : null;

      if (usage) {
        openaiMetrics.trackUsage({
          timestamp: startTime,
          model,
          operation,
          prompt_tokens: usage.prompt_tokens,
          completion_tokens: usage.completion_tokens,
          total_tokens: usage.total_tokens,
          cost_estimate: calculateCost(model, usage.prompt_tokens, usage.completion_tokens),
          duration,
          success: true,
        });
      }

      return completion as any;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      openaiMetrics.trackUsage({
        timestamp: startTime,
        model,
        operation,
        prompt_tokens: 0,
        completion_tokens: 0,
        total_tokens: 0,
        cost_estimate: 0,
        duration,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      logger.error('OpenAI Chat Completion Error', error instanceof Error ? error : new Error(String(error)), {
        model,
        operation,
        duration,
      });

      throw error;
    }
  }

  // Enhanced embeddings with monitoring
  async createEmbeddings(
    input: string | string[],
    options: Partial<OpenAI.Embeddings.EmbeddingCreateParams> = {}
  ): Promise<OpenAI.Embeddings.CreateEmbeddingResponse> {
    const startTime = Date.now();
    const model = options.model || MODEL_CONFIGS.EMBEDDINGS.model;

    try {
      if (!isOpenAIAvailable()) {
        throw new Error('OPENAI_API_KEY not configured');
      }
      const embeddings = await this.client.embeddings.create({
        ...MODEL_CONFIGS.EMBEDDINGS,
        ...options,
        input,
      });

      const duration = Date.now() - startTime;
      const usage = embeddings.usage;

      openaiMetrics.trackUsage({
        timestamp: startTime,
        model,
        operation: 'embeddings',
        prompt_tokens: usage.prompt_tokens,
        completion_tokens: 0,
        total_tokens: usage.total_tokens,
        cost_estimate: calculateCost(model, usage.prompt_tokens, 0),
        duration,
        success: true,
      });

      return embeddings;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      openaiMetrics.trackUsage({
        timestamp: startTime,
        model,
        operation: 'embeddings',
        prompt_tokens: 0,
        completion_tokens: 0,
        total_tokens: 0,
        cost_estimate: 0,
        duration,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      logger.error('OpenAI Embeddings Error', error instanceof Error ? error : new Error(String(error)), {
        model,
        operation: 'embeddings',
        duration,
      });

      throw error;
    }
  }

  // Enhanced speech-to-text with monitoring
  async speechToText(
    file: File | Buffer,
    options: Partial<OpenAI.Audio.Transcriptions.TranscriptionCreateParams> = {}
  ): Promise<OpenAI.Audio.Transcriptions.Transcription> {
    const startTime = Date.now();
    const model = options.model || MODEL_CONFIGS.STT.model;

    try {
      if (!isOpenAIAvailable()) {
        throw new Error('OPENAI_API_KEY not configured');
      }
      const transcription = await this.client.audio.transcriptions.create({
        ...MODEL_CONFIGS.STT,
        ...options,
        file,
      } as any);

      const duration = Date.now() - startTime;

      openaiMetrics.trackUsage({
        timestamp: startTime,
        model,
        operation: 'speech-to-text',
        prompt_tokens: 0,
        completion_tokens: 0,
        total_tokens: 0,
        cost_estimate: 0, // Cost calculation for audio is different
        duration,
        success: true,
      });

      return transcription;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      openaiMetrics.trackUsage({
        timestamp: startTime,
        model,
        operation: 'speech-to-text',
        prompt_tokens: 0,
        completion_tokens: 0,
        total_tokens: 0,
        cost_estimate: 0,
        duration,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      logger.error('OpenAI Speech-to-Text Error', error instanceof Error ? error : new Error(String(error)), {
        model,
        operation: 'speech-to-text',
        duration,
      });

      throw error;
    }
  }

  // Enhanced text-to-speech with monitoring
  async textToSpeech(
    input: string,
    options: Partial<OpenAI.Audio.Speech.SpeechCreateParams> = {}
  ): Promise<Response> {
    const startTime = Date.now();
    const model = options.model || MODEL_CONFIGS.TTS.model;

    try {
      if (!isOpenAIAvailable()) {
        throw new Error('OPENAI_API_KEY not configured');
      }
      const speech = await this.client.audio.speech.create({
        ...MODEL_CONFIGS.TTS,
        ...options,
        input,
      });

      const duration = Date.now() - startTime;

      openaiMetrics.trackUsage({
        timestamp: startTime,
        model,
        operation: 'text-to-speech',
        prompt_tokens: input.length,
        completion_tokens: 0,
        total_tokens: input.length,
        cost_estimate: calculateCost(model, input.length, 0),
        duration,
        success: true,
      });

      return speech;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      openaiMetrics.trackUsage({
        timestamp: startTime,
        model,
        operation: 'text-to-speech',
        prompt_tokens: 0,
        completion_tokens: 0,
        total_tokens: 0,
        cost_estimate: 0,
        duration,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      logger.error('OpenAI Text-to-Speech Error', error instanceof Error ? error : new Error(String(error)), {
        model,
        operation: 'text-to-speech',
        duration,
      });

      throw error;
    }
  }

  // Get performance metrics
  getMetrics() {
    return openaiMetrics.getUsageStats();
  }

  // Get recent errors
  getRecentErrors() {
    return openaiMetrics.getRecentErrors();
  }
}

// Export enhanced client instance
export const enhancedOpenAI = new EnhancedOpenAI();

// Export original client for backward compatibility
export { openai as default };        