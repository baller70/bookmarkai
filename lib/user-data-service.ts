// @ts-nocheck
// Client-side service for user data persistence
import { 
  UserMediaFile, 
  UserDocument, 
  UserTask, 
  UserComment,
  CreateUserMediaFileInput,
  CreateUserDocumentInput,
  UpdateUserDocumentInput,
  CreateUserTaskInput,
  UpdateUserTaskInput,
  CreateUserCommentInput,
  ApiResponse,
  PaginatedResponse
} from '@/types/database';

class UserDataService {
  private baseUrl = '/api/user-data';

  // Media Files
  async uploadFile(file: File, type: 'image' | 'video' | 'document' | 'logo', tags?: string[]): Promise<UserMediaFile> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    if (tags && tags.length > 0) {
      formData.append('tags', tags.join(','));
    }

    const response = await fetch(`${this.baseUrl}/upload`, {
      method: 'POST',
      body: formData,
    });

    const result: ApiResponse<UserMediaFile> = await response.json();
    
    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to upload file');
    }

    return result.data;
  }

  async getMediaFiles(type?: string, page = 1, limit = 20): Promise<PaginatedResponse<UserMediaFile>> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (type) {
      params.append('type', type);
    }

    const response = await fetch(`${this.baseUrl}/media?${params}`);
    
    // Handle authentication errors specifically
    if (response.status === 401) {
      throw new Error('Unauthorized');
    }
    
    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch media files');
    }

    return result;
  }

  async updateMediaFile(id: string, updates: Partial<UserMediaFile>): Promise<UserMediaFile> {
    const response = await fetch(`${this.baseUrl}/media?id=${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });

    const result: ApiResponse<UserMediaFile> = await response.json();
    
    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to update media file');
    }

    return result.data;
  }

  async deleteMediaFile(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/media?id=${id}`, {
      method: 'DELETE',
    });

    const result: ApiResponse<void> = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to delete media file');
    }
  }

  // Documents
  async createDocument(data: CreateUserDocumentInput): Promise<UserDocument> {
    const response = await fetch(`${this.baseUrl}/documents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const result: ApiResponse<UserDocument> = await response.json();
    
    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to create document');
    }

    return result.data;
  }

  async getDocuments(page = 1, limit = 20): Promise<PaginatedResponse<UserDocument>> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    const response = await fetch(`${this.baseUrl}/documents?${params}`);
    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch documents');
    }

    return result;
  }

  async getDocument(id: string): Promise<UserDocument> {
    const response = await fetch(`${this.baseUrl}/documents/${id}`);
    const result: ApiResponse<UserDocument> = await response.json();
    
    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to fetch document');
    }

    return result.data;
  }

  async updateDocument(id: string, data: UpdateUserDocumentInput): Promise<UserDocument> {
    const response = await fetch(`${this.baseUrl}/documents/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const result: ApiResponse<UserDocument> = await response.json();
    
    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to update document');
    }

    return result.data;
  }

  async deleteDocument(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/documents/${id}`, {
      method: 'DELETE',
    });

    const result: ApiResponse<void> = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to delete document');
    }
  }

  // Tasks
  async createTask(data: CreateUserTaskInput): Promise<UserTask> {
    const response = await fetch(`${this.baseUrl}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const result: ApiResponse<UserTask> = await response.json();
    
    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to create task');
    }

    return result.data;
  }

  async getTasks(page = 1, limit = 20, completed?: boolean): Promise<PaginatedResponse<UserTask>> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (completed !== undefined) {
      params.append('completed', completed.toString());
    }

    const response = await fetch(`${this.baseUrl}/tasks?${params}`);
    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch tasks');
    }

    return result;
  }

  async updateTask(id: string, data: UpdateUserTaskInput): Promise<UserTask> {
    const response = await fetch(`${this.baseUrl}/tasks/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const result: ApiResponse<UserTask> = await response.json();
    
    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to update task');
    }

    return result.data;
  }

  async deleteTask(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/tasks/${id}`, {
      method: 'DELETE',
    });

    const result: ApiResponse<void> = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to delete task');
    }
  }

  // Comments
  async createComment(data: CreateUserCommentInput): Promise<UserComment> {
    const response = await fetch(`${this.baseUrl}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const result: ApiResponse<UserComment> = await response.json();
    
    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to create comment');
    }

    return result.data;
  }

  async getComments(entityType: string, entityId: string, page = 1, limit = 20): Promise<PaginatedResponse<UserComment>> {
    const params = new URLSearchParams({
      entityType,
      entityId,
      page: page.toString(),
      limit: limit.toString(),
    });

    const response = await fetch(`${this.baseUrl}/comments?${params}`);
    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch comments');
    }

    return result;
  }

  async updateComment(id: string, content: string): Promise<UserComment> {
    const response = await fetch(`${this.baseUrl}/comments/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content }),
    });

    const result: ApiResponse<UserComment> = await response.json();
    
    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to update comment');
    }

    return result.data;
  }

  async deleteComment(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/comments/${id}`, {
      method: 'DELETE',
    });

    const result: ApiResponse<void> = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to delete comment');
    }
  }

  // Utility method for handling errors
  private handleApiError(result: any, defaultMessage: string): never {
    throw new Error(result.error || defaultMessage);
  }
}

// Export a singleton instance
export const userDataService = new UserDataService();
export default userDataService; 