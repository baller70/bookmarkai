// Timeline Data Hook - State management for infinite timeline
import { useState, useEffect, useCallback } from 'react';
import { 
  TimelineData, 
  InfinityBoard, 
  BookmarkData, 
  ConnectorString, 
  TimelinePosition,
  TimelineEvent 
} from '../models/timeline.models';
import { TimelineService } from '../services/timeline.service';

interface UseTimelineDataReturn {
  // Data state
  timelineData: TimelineData;
  isLoading: boolean;
  error: string | null;
  
  // Board operations
  createBoard: (title: string, position: TimelinePosition) => Promise<void>;
  updateBoard: (boardId: string, updates: Partial<InfinityBoard>) => Promise<void>;
  deleteBoard: (boardId: string) => Promise<void>;
  
  // Bookmark operations
  createBookmark: (boardId: string, title: string, url?: string) => Promise<void>;
  updateBookmark: (bookmarkId: string, updates: Partial<BookmarkData>) => Promise<void>;
  deleteBookmark: (bookmarkId: string) => Promise<void>;
  moveBookmark: (bookmarkId: string, newBoardId: string, newOrder: number) => Promise<void>;
  
  // Connector operations
  createConnector: (fromBoardId: string, toBoardId: string) => Promise<void>;
  updateConnector: (connectorId: string, updates: Partial<ConnectorString>) => Promise<void>;
  deleteConnector: (connectorId: string) => Promise<void>;
  
  // Utility functions
  getBoardById: (boardId: string) => InfinityBoard | undefined;
  getBookmarksByBoard: (boardId: string) => BookmarkData[];
  getConnectorsByBoard: (boardId: string) => ConnectorString[];
  refreshData: () => Promise<void>;
}

export const useTimelineData = (): UseTimelineDataReturn => {
  const [timelineData, setTimelineData] = useState<TimelineData>({
    boards: [],
    bookmarks: [],
    connectors: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load initial data
  const loadTimelineData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await TimelineService.getTimelineData();
      setTimelineData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load timeline data');
      console.error('Error loading timeline data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Refresh data
  const refreshData = useCallback(async () => {
    await loadTimelineData();
  }, [loadTimelineData]);

  // Load data on mount
  useEffect(() => {
    loadTimelineData();
  }, [loadTimelineData]);

  // Board operations
  const createBoard = useCallback(async (title: string, position: TimelinePosition) => {
    try {
      const newBoard = await TimelineService.createBoard(title, position);
      setTimelineData(prev => ({
        ...prev,
        boards: [...prev.boards, newBoard]
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create board');
      throw err;
    }
  }, []);

  const updateBoard = useCallback(async (boardId: string, updates: Partial<InfinityBoard>) => {
    try {
      const updatedBoard = await TimelineService.updateBoard(boardId, updates);
      setTimelineData(prev => ({
        ...prev,
        boards: prev.boards.map(board => 
          board.id === boardId ? updatedBoard : board
        )
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update board');
      throw err;
    }
  }, []);

  const deleteBoard = useCallback(async (boardId: string) => {
    try {
      await TimelineService.deleteBoard(boardId);
      setTimelineData(prev => ({
        ...prev,
        boards: prev.boards.filter(board => board.id !== boardId),
        bookmarks: prev.bookmarks.filter(bookmark => bookmark.boardId !== boardId),
        connectors: prev.connectors.filter(connector => 
          connector.fromBoardId !== boardId && connector.toBoardId !== boardId
        )
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete board');
      throw err;
    }
  }, []);

  // Bookmark operations
  const createBookmark = useCallback(async (boardId: string, title: string, url?: string) => {
    try {
      const newBookmark = await TimelineService.createBookmark(boardId, title, url);
      setTimelineData(prev => ({
        ...prev,
        bookmarks: [...prev.bookmarks, newBookmark]
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create bookmark');
      throw err;
    }
  }, []);

  const updateBookmark = useCallback(async (bookmarkId: string, updates: Partial<BookmarkData>) => {
    try {
      const updatedBookmark = await TimelineService.updateBookmark(bookmarkId, updates);
      setTimelineData(prev => ({
        ...prev,
        bookmarks: prev.bookmarks.map(bookmark => 
          bookmark.id === bookmarkId ? updatedBookmark : bookmark
        )
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update bookmark');
      throw err;
    }
  }, []);

  const deleteBookmark = useCallback(async (bookmarkId: string) => {
    try {
      await TimelineService.deleteBookmark(bookmarkId);
      setTimelineData(prev => ({
        ...prev,
        bookmarks: prev.bookmarks.filter(bookmark => bookmark.id !== bookmarkId)
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete bookmark');
      throw err;
    }
  }, []);

  const moveBookmark = useCallback(async (bookmarkId: string, newBoardId: string, newOrder: number) => {
    try {
      const movedBookmark = await TimelineService.moveBookmark(bookmarkId, newBoardId, newOrder);
      setTimelineData(prev => ({
        ...prev,
        bookmarks: prev.bookmarks.map(bookmark => 
          bookmark.id === bookmarkId ? movedBookmark : bookmark
        )
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to move bookmark');
      throw err;
    }
  }, []);

  // Connector operations
  const createConnector = useCallback(async (fromBoardId: string, toBoardId: string) => {
    try {
      const newConnector = await TimelineService.createConnector(fromBoardId, toBoardId);
      setTimelineData(prev => ({
        ...prev,
        connectors: [...prev.connectors, newConnector]
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create connector');
      throw err;
    }
  }, []);

  const updateConnector = useCallback(async (connectorId: string, updates: Partial<ConnectorString>) => {
    try {
      const updatedConnector = await TimelineService.updateConnector(connectorId, updates);
      setTimelineData(prev => ({
        ...prev,
        connectors: prev.connectors.map(connector => 
          connector.id === connectorId ? updatedConnector : connector
        )
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update connector');
      throw err;
    }
  }, []);

  const deleteConnector = useCallback(async (connectorId: string) => {
    try {
      await TimelineService.deleteConnector(connectorId);
      setTimelineData(prev => ({
        ...prev,
        connectors: prev.connectors.filter(connector => connector.id !== connectorId)
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete connector');
      throw err;
    }
  }, []);

  // Utility functions
  const getBoardById = useCallback((boardId: string) => {
    return timelineData.boards.find(board => board.id === boardId);
  }, [timelineData.boards]);

  const getBookmarksByBoard = useCallback((boardId: string) => {
    return timelineData.bookmarks
      .filter(bookmark => bookmark.boardId === boardId)
      .sort((a, b) => a.order - b.order);
  }, [timelineData.bookmarks]);

  const getConnectorsByBoard = useCallback((boardId: string) => {
    return timelineData.connectors.filter(connector => 
      connector.fromBoardId === boardId || connector.toBoardId === boardId
    );
  }, [timelineData.connectors]);

  return {
    timelineData,
    isLoading,
    error,
    createBoard,
    updateBoard,
    deleteBoard,
    createBookmark,
    updateBookmark,
    deleteBookmark,
    moveBookmark,
    createConnector,
    updateConnector,
    deleteConnector,
    getBoardById,
    getBookmarksByBoard,
    getConnectorsByBoard,
    refreshData
  };
}; 