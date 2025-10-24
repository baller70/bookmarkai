import { enhancedOpenAI, MODEL_CONFIGS } from './openai-client';
import { appLogger } from '../logger';
import { withCache } from '../cache/api-cache';

// Create logger for embeddings
const logger = appLogger;

// Embedding interfaces
export interface EmbeddingRequest {
  text: string;
  metadata?: Record<string, any>;
  userId?: string;
}

export interface EmbeddingResult {
  embedding: number[];
  text: string;
  metadata?: Record<string, any>;
  timestamp: number;
  model: string;
}

export interface SemanticSearchRequest {
  query: string;
  embeddings: StoredEmbedding[];
  limit?: number;
  threshold?: number;
  filters?: Record<string, any>;
}

export interface StoredEmbedding {
  id: string;
  embedding: number[];
  text: string;
  metadata: Record<string, any>;
  timestamp: number;
}

export interface SemanticSearchResult {
  id: string;
  text: string;
  metadata: Record<string, any>;
  similarity: number;
  timestamp: number;
}

// Vector similarity utilities
export class VectorUtils {
  // Calculate cosine similarity between two vectors
  static cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Vectors must have the same length');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
    return magnitude === 0 ? 0 : dotProduct / magnitude;
  }

  // Calculate Euclidean distance between two vectors
  static euclideanDistance(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Vectors must have the same length');
    }

    let sum = 0;
    for (let i = 0; i < a.length; i++) {
      const diff = a[i] - b[i];
      sum += diff * diff;
    }

    return Math.sqrt(sum);
  }

  // Normalize vector to unit length
  static normalize(vector: number[]): number[] {
    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    return magnitude === 0 ? vector : vector.map(val => val / magnitude);
  }

  // Calculate vector magnitude
  static magnitude(vector: number[]): number {
    return Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  }

  // Find top K most similar vectors
  static findTopSimilar(
    queryVector: number[],
    vectors: { id: string; vector: number[]; metadata?: any }[],
    k: number = 10,
    threshold: number = 0.5
  ): Array<{ id: string; similarity: number; metadata?: any }> {
    const similarities = vectors.map(item => ({
      id: item.id,
      similarity: this.cosineSimilarity(queryVector, item.vector),
      metadata: item.metadata,
    }));

    return similarities
      .filter(item => item.similarity >= threshold)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, k);
  }
}

// Embedding storage interface
export interface EmbeddingStorage {
  store(id: string, embedding: StoredEmbedding): Promise<void>;
  get(id: string): Promise<StoredEmbedding | null>;
  search(query: SemanticSearchRequest): Promise<SemanticSearchResult[]>;
  delete(id: string): Promise<void>;
  list(filters?: Record<string, any>): Promise<StoredEmbedding[]>;
  clear(): Promise<void>;
}

// In-memory embedding storage (for development/testing)
export class MemoryEmbeddingStorage implements EmbeddingStorage {
  private embeddings = new Map<string, StoredEmbedding>();

  async store(id: string, embedding: StoredEmbedding): Promise<void> {
    this.embeddings.set(id, embedding);
    logger.debug('Stored embedding', { id, textLength: embedding.text.length });
  }

  async get(id: string): Promise<StoredEmbedding | null> {
    return this.embeddings.get(id) || null;
  }

  async search(request: SemanticSearchRequest): Promise<SemanticSearchResult[]> {
    const { query, limit = 10, threshold = 0.5, filters } = request;

    // Get query embedding
    const queryEmbedding = await embeddingService.createEmbedding({ text: query });

    // Filter embeddings based on filters
    let candidateEmbeddings = Array.from(this.embeddings.values());
    
    if (filters) {
      candidateEmbeddings = candidateEmbeddings.filter(embedding => {
        return Object.entries(filters).every(([key, value]) => {
          return embedding.metadata[key] === value;
        });
      });
    }

    // Calculate similarities
    const similarities = candidateEmbeddings.map(embedding => ({
      id: embedding.id,
      text: embedding.text,
      metadata: embedding.metadata,
      similarity: VectorUtils.cosineSimilarity(queryEmbedding.embedding, embedding.embedding),
      timestamp: embedding.timestamp,
    }));

    // Filter by threshold and sort by similarity
    return similarities
      .filter(item => item.similarity >= threshold)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);
  }

  async delete(id: string): Promise<void> {
    this.embeddings.delete(id);
    logger.debug('Deleted embedding', { id });
  }

  async list(filters?: Record<string, any>): Promise<StoredEmbedding[]> {
    let embeddings = Array.from(this.embeddings.values());
    
    if (filters) {
      embeddings = embeddings.filter(embedding => {
        return Object.entries(filters).every(([key, value]) => {
          return embedding.metadata[key] === value;
        });
      });
    }

    return embeddings;
  }

  async clear(): Promise<void> {
    this.embeddings.clear();
    logger.info('Cleared all embeddings');
  }

  // Get storage statistics
  getStats(): {
    totalEmbeddings: number;
    memoryUsage: number;
    oldestEmbedding?: number;
    newestEmbedding?: number;
  } {
    const embeddings = Array.from(this.embeddings.values());
    const timestamps = embeddings.map(e => e.timestamp);
    
    return {
      totalEmbeddings: embeddings.length,
      memoryUsage: embeddings.reduce((sum, e) => sum + e.embedding.length * 8, 0), // Approximate bytes
      oldestEmbedding: timestamps.length > 0 ? Math.min(...timestamps) : undefined,
      newestEmbedding: timestamps.length > 0 ? Math.max(...timestamps) : undefined,
    };
  }
}

// Main embedding service
export class EmbeddingService {
  private storage: EmbeddingStorage;

  constructor(storage?: EmbeddingStorage) {
    this.storage = storage || new MemoryEmbeddingStorage();
  }

  // Create embedding for text with caching
  async createEmbedding(request: EmbeddingRequest): Promise<EmbeddingResult> {
    return this.generateEmbedding(request);
  }

  // Generate embedding using OpenAI
  private async generateEmbedding(request: EmbeddingRequest): Promise<EmbeddingResult> {
    const startTime = Date.now();
    
    try {
      logger.debug('Generating embedding', { 
        textLength: request.text.length,
        userId: request.userId 
      });

      // Truncate text if too long (OpenAI has token limits)
      const maxLength = 8000; // Conservative limit
      const text = request.text.length > maxLength 
        ? request.text.substring(0, maxLength) + '...'
        : request.text;

      const response = await enhancedOpenAI.createEmbeddings(text, {
        model: MODEL_CONFIGS.EMBEDDINGS.model,
        dimensions: MODEL_CONFIGS.EMBEDDINGS.dimensions,
      });

      const embedding = response.data[0].embedding;
      const processingTime = Date.now() - startTime;

      logger.info('Embedding generated', {
        textLength: text.length,
        embeddingDimensions: embedding.length,
        processingTime,
        userId: request.userId,
      });

      return {
        embedding,
        text: request.text,
        metadata: request.metadata,
        timestamp: Date.now(),
        model: MODEL_CONFIGS.EMBEDDINGS.model,
      };
    } catch (error) {
      logger.error('Failed to generate embedding', error instanceof Error ? error : new Error(String(error)), {
        textLength: request.text.length,
        userId: request.userId,
        processingTime: Date.now() - startTime,
      });
      throw error;
    }
  }

  // Store embedding for later retrieval
  async storeEmbedding(
    id: string,
    text: string,
    metadata: Record<string, any> = {},
    userId?: string
  ): Promise<void> {
    try {
      // Generate embedding
      const embeddingResult = await this.createEmbedding({ text, metadata, userId });

      // Store in storage
      const storedEmbedding: StoredEmbedding = {
        id,
        embedding: embeddingResult.embedding,
        text,
        metadata: {
          ...metadata,
          userId,
          model: embeddingResult.model,
          createdAt: embeddingResult.timestamp,
        },
        timestamp: embeddingResult.timestamp,
      };

      await this.storage.store(id, storedEmbedding);

      logger.info('Embedding stored', { id, textLength: text.length, userId });
    } catch (error) {
      logger.error('Failed to store embedding', error instanceof Error ? error : new Error(String(error)), {
        id,
        textLength: text.length,
        userId,
      });
      throw error;
    }
  }

  // Perform semantic search
  async semanticSearch(request: SemanticSearchRequest): Promise<SemanticSearchResult[]> {
    const startTime = Date.now();
    
    try {
      logger.debug('Performing semantic search', {
        query: request.query.substring(0, 100),
        limit: request.limit,
        threshold: request.threshold,
        filters: request.filters,
      });

      const results = await this.storage.search(request);
      const processingTime = Date.now() - startTime;

      logger.info('Semantic search completed', {
        query: request.query.substring(0, 100),
        resultsCount: results.length,
        processingTime,
      });

      return results;
    } catch (error) {
      logger.error('Semantic search failed', error instanceof Error ? error : new Error(String(error)), {
        query: request.query.substring(0, 100),
        processingTime: Date.now() - startTime,
      });
      throw error;
    }
  }

  // Find similar content
  async findSimilar(
    text: string,
    options: {
      limit?: number;
      threshold?: number;
      filters?: Record<string, any>;
      excludeId?: string;
    } = {}
  ): Promise<SemanticSearchResult[]> {
    const { limit = 5, threshold = 0.7, filters, excludeId } = options;

    // Get all stored embeddings
    const allEmbeddings = await this.storage.list(filters);

    // Filter out the excluded ID
    const candidateEmbeddings = excludeId 
      ? allEmbeddings.filter(e => e.id !== excludeId)
      : allEmbeddings;

    // Perform search
    return this.semanticSearch({
      query: text,
      embeddings: candidateEmbeddings,
      limit,
      threshold,
      filters,
    });
  }

  // Batch process multiple texts
  async batchCreateEmbeddings(
    requests: EmbeddingRequest[]
  ): Promise<EmbeddingResult[]> {
    logger.info('Starting batch embedding generation', { count: requests.length });

    const results = await Promise.allSettled(
      requests.map(request => this.createEmbedding(request))
    );

    const successful = results
      .filter((result): result is PromiseFulfilledResult<EmbeddingResult> => 
        result.status === 'fulfilled'
      )
      .map(result => result.value);

    const failed = results.filter(result => result.status === 'rejected').length;

    logger.info('Batch embedding generation completed', {
      total: requests.length,
      successful: successful.length,
      failed,
    });

    return successful;
  }

  // Update embedding metadata
  async updateEmbeddingMetadata(
    id: string,
    metadata: Record<string, any>
  ): Promise<void> {
    const existing = await this.storage.get(id);
    if (!existing) {
      throw new Error(`Embedding with id ${id} not found`);
    }

    const updated: StoredEmbedding = {
      ...existing,
      metadata: { ...existing.metadata, ...metadata },
    };

    await this.storage.store(id, updated);
    logger.info('Embedding metadata updated', { id, metadata });
  }

  // Delete embedding
  async deleteEmbedding(id: string): Promise<void> {
    await this.storage.delete(id);
    logger.info('Embedding deleted', { id });
  }

  // Get embedding by ID
  async getEmbedding(id: string): Promise<StoredEmbedding | null> {
    return this.storage.get(id);
  }

  // List embeddings with filters
  async listEmbeddings(filters?: Record<string, any>): Promise<StoredEmbedding[]> {
    return this.storage.list(filters);
  }

  // Clear all embeddings
  async clearEmbeddings(): Promise<void> {
    await this.storage.clear();
    logger.info('All embeddings cleared');
  }

  // Get storage statistics
  getStorageStats(): any {
    if (this.storage instanceof MemoryEmbeddingStorage) {
      return this.storage.getStats();
    }
    return null;
  }

  // Change storage backend
  setStorage(storage: EmbeddingStorage): void {
    this.storage = storage;
    logger.info('Embedding storage backend changed');
  }
}

// Bookmark-specific embedding utilities
export class BookmarkEmbeddingService extends EmbeddingService {
  // Create embedding for bookmark content
  async embedBookmark(bookmark: {
    id: string;
    title: string;
    description?: string;
    content?: string;
    url: string;
    category?: string;
    tags?: string[];
    userId: string;
  }): Promise<void> {
    // Combine all text content
    const textContent = [
      bookmark.title,
      bookmark.description || '',
      bookmark.content || '',
      bookmark.category || '',
      ...(bookmark.tags || []),
    ].filter(Boolean).join(' ');

    const metadata = {
      type: 'bookmark',
      url: bookmark.url,
      category: bookmark.category,
      tags: bookmark.tags || [],
      userId: bookmark.userId,
      title: bookmark.title,
      description: bookmark.description,
    };

    await this.storeEmbedding(bookmark.id, textContent, metadata, bookmark.userId);
  }

  // Search bookmarks semantically
  async searchBookmarks(
    query: string,
    userId: string,
    options: {
      limit?: number;
      threshold?: number;
      category?: string;
      tags?: string[];
    } = {}
  ): Promise<SemanticSearchResult[]> {
    const { limit = 10, threshold = 0.5, category, tags } = options;

    const filters: Record<string, any> = {
      type: 'bookmark',
      userId,
    };

    if (category) {
      filters.category = category;
    }

    // For tags, we'd need more sophisticated filtering
    // This is a simplified version
    if (tags && tags.length > 0) {
      // In a real implementation, you'd want to check if any of the tags match
      filters.tags = tags;
    }

    return this.semanticSearch({
      query,
      embeddings: await this.listEmbeddings(filters),
      limit,
      threshold,
      filters,
    });
  }

  // Find similar bookmarks
  async findSimilarBookmarks(
    bookmarkId: string,
    userId: string,
    limit: number = 5
  ): Promise<SemanticSearchResult[]> {
    const bookmark = await this.getEmbedding(bookmarkId);
    if (!bookmark) {
      throw new Error(`Bookmark embedding ${bookmarkId} not found`);
    }

    return this.findSimilar(bookmark.text, {
      limit,
      threshold: 0.6,
      filters: { type: 'bookmark', userId },
      excludeId: bookmarkId,
    });
  }

  // Get bookmark recommendations based on user's bookmarks
  async getBookmarkRecommendations(
    userId: string,
    options: {
      limit?: number;
      threshold?: number;
      basedOnRecent?: boolean;
      recentCount?: number;
    } = {}
  ): Promise<SemanticSearchResult[]> {
    const { limit = 10, threshold = 0.6, basedOnRecent = true, recentCount = 10 } = options;

    // Get user's bookmarks
    const userBookmarks = await this.listEmbeddings({
      type: 'bookmark',
      userId,
    });

    if (userBookmarks.length === 0) {
      return [];
    }

    // Use recent bookmarks as basis for recommendations
    const basisBookmarks = basedOnRecent
      ? userBookmarks
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, recentCount)
      : userBookmarks;

    // Create a combined query from basis bookmarks
    const combinedText = basisBookmarks
      .map(b => b.text)
      .join(' ')
      .substring(0, 2000); // Limit length

    // Find similar content (excluding user's own bookmarks)
    const allEmbeddings = await this.listEmbeddings({ type: 'bookmark' });
    const otherUsersEmbeddings = allEmbeddings.filter(e => e.metadata.userId !== userId);

    return this.semanticSearch({
      query: combinedText,
      embeddings: otherUsersEmbeddings,
      limit,
      threshold,
    });
  }
}

// Export singleton instances
export const embeddingService = new EmbeddingService();
export const bookmarkEmbeddingService = new BookmarkEmbeddingService();     