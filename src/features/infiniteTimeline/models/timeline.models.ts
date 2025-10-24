// Timeline Models - Core data structures for the infinite timeline board
export interface TimelinePosition {
  x: number;
  y: number;
}

export interface InfinityBoard {
  id: string;
  title: string;
  position: TimelinePosition;
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface BookmarkData {
  id: string;
  boardId: string;
  title: string;
  url?: string;
  description?: string;
  icon?: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConnectorBead {
  id: string;
  x: number;
  y: number;
  order: number;
}

export interface ConnectorString {
  id: string;
  fromBoardId: string;
  toBoardId: string;
  beads: ConnectorBead[];
  color: string;
  strokeWidth: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface TimelineData {
  boards: InfinityBoard[];
  bookmarks: BookmarkData[];
  connectors: ConnectorString[];
}

export interface ViewportState {
  scale: number;
  x: number;
  y: number;
}

export interface DragState {
  isDragging: boolean;
  dragType: 'board' | 'bookmark' | 'bead' | null;
  dragItemId: string | null;
  startPosition: TimelinePosition | null;
  currentPosition: TimelinePosition | null;
}

export interface ConnectorEditState {
  isEditing: boolean;
  mode: 'create' | 'edit' | null;
  selectedConnectorId: string | null;
  sourceBoardId: string | null;
  targetBoardId: string | null;
  tempBeads: ConnectorBead[];
}

export type TimelineEvent = 
  | { type: 'BOARD_CREATED'; payload: InfinityBoard }
  | { type: 'BOARD_UPDATED'; payload: InfinityBoard }
  | { type: 'BOARD_DELETED'; payload: string }
  | { type: 'BOOKMARK_CREATED'; payload: BookmarkData }
  | { type: 'BOOKMARK_UPDATED'; payload: BookmarkData }
  | { type: 'BOOKMARK_DELETED'; payload: string }
  | { type: 'BOOKMARK_MOVED'; payload: { bookmarkId: string; newBoardId: string; newOrder: number } }
  | { type: 'CONNECTOR_CREATED'; payload: ConnectorString }
  | { type: 'CONNECTOR_UPDATED'; payload: ConnectorString }
  | { type: 'CONNECTOR_DELETED'; payload: string }
  | { type: 'VIEWPORT_CHANGED'; payload: ViewportState }; 