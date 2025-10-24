// Timeline Service - API communication layer for infinite timeline
import { 
  TimelineData, 
  InfinityBoard, 
  BookmarkData, 
  ConnectorString, 
  TimelinePosition 
} from '../models/timeline.models';
import { appLogger } from '@/lib/logger';

const API_BASE = '/api/timeline';

// Mock data for development
const mockTimelineData: TimelineData = {
  boards: [
    {
      id: 'board-1',
      title: 'Welcome Board',
      position: { x: 200, y: 150 },
      timestamp: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'board-2', 
      title: 'Ideas & Research',
      position: { x: 600, y: 300 },
      timestamp: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ],
  bookmarks: [
    {
      id: 'bookmark-1',
      boardId: 'board-1',
      title: 'Getting Started',
      url: 'https://example.com',
      order: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'bookmark-2',
      boardId: 'board-2',
      title: 'Research Notes',
      url: 'https://research.example.com',
      order: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ],
  connectors: []
};

export class TimelineService {
  // Fetch all timeline data
  static async getTimelineData(): Promise<TimelineData> {
    try {
      // For now, return mock data instead of making API calls
      // TODO: Replace with real API calls when backend is ready
      return Promise.resolve(mockTimelineData);
    } catch (error) {
      appLogger.error('Error fetching timeline data', error);
      throw error;
    }
  }

  // Board operations
  static async createBoard(title: string, position: TimelinePosition): Promise<InfinityBoard> {
    try {
      // Mock implementation - create new board in memory
      const newBoard: InfinityBoard = {
        id: `board-${Date.now()}`,
        title,
        position,
        timestamp: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      mockTimelineData.boards.push(newBoard);
      return Promise.resolve(newBoard);
    } catch (error) {
      console.error('Error creating board:', error);
      throw error;
    }
  }

  static async updateBoard(boardId: string, updates: Partial<InfinityBoard>): Promise<InfinityBoard> {
    try {
      // Mock implementation - update board in memory
      const boardIndex = mockTimelineData.boards.findIndex(board => board.id === boardId);
      if (boardIndex === -1) {
        throw new Error(`Board with id ${boardId} not found`);
      }
      
      const updatedBoard = {
        ...mockTimelineData.boards[boardIndex],
        ...updates,
        updatedAt: new Date()
      };
      
      mockTimelineData.boards[boardIndex] = updatedBoard;
      return Promise.resolve(updatedBoard);
    } catch (error) {
      console.error('Error updating board:', error);
      throw error;
    }
  }

  static async deleteBoard(boardId: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE}/boards/${boardId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`Failed to delete board: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error deleting board:', error);
      throw error;
    }
  }

  // Bookmark operations
  static async createBookmark(boardId: string, title: string, url?: string): Promise<BookmarkData> {
    try {
      // Mock implementation - create new bookmark in memory
      const newBookmark: BookmarkData = {
        id: `bookmark-${Date.now()}`,
        boardId,
        title,
        url,
        order: mockTimelineData.bookmarks.filter(b => b.boardId === boardId).length,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      mockTimelineData.bookmarks.push(newBookmark);
      return Promise.resolve(newBookmark);
    } catch (error) {
      console.error('Error creating bookmark:', error);
      throw error;
    }
  }

  static async updateBookmark(bookmarkId: string, updates: Partial<BookmarkData>): Promise<BookmarkData> {
    try {
      const response = await fetch(`${API_BASE}/bookmarks/${bookmarkId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update bookmark: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error updating bookmark:', error);
      throw error;
    }
  }

  static async deleteBookmark(bookmarkId: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE}/bookmarks/${bookmarkId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`Failed to delete bookmark: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error deleting bookmark:', error);
      throw error;
    }
  }

  static async moveBookmark(bookmarkId: string, newBoardId: string, newOrder: number): Promise<BookmarkData> {
    try {
      const response = await fetch(`${API_BASE}/bookmarks/${bookmarkId}/move`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newBoardId, newOrder }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to move bookmark: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error moving bookmark:', error);
      throw error;
    }
  }

  // Connector operations
  static async createConnector(fromBoardId: string, toBoardId: string): Promise<ConnectorString> {
    try {
      // Mock implementation - create new connector in memory
      const newConnector: ConnectorString = {
        id: `connector-${Date.now()}`,
        fromBoardId,
        toBoardId,
        beads: [],
        color: '#3b82f6', // Blue color
        strokeWidth: 2,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      mockTimelineData.connectors.push(newConnector);
      return Promise.resolve(newConnector);
    } catch (error) {
      console.error('Error creating connector:', error);
      throw error;
    }
  }

  static async updateConnector(connectorId: string, updates: Partial<ConnectorString>): Promise<ConnectorString> {
    try {
      const response = await fetch(`${API_BASE}/connectors/${connectorId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update connector: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error updating connector:', error);
      throw error;
    }
  }

  static async deleteConnector(connectorId: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE}/connectors/${connectorId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`Failed to delete connector: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error deleting connector:', error);
      throw error;
    }
  }
} 