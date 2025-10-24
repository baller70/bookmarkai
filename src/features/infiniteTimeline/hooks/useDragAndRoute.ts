// Drag and Route Hook - Drag & drop functionality and SVG path routing
import { useState, useCallback, useRef } from 'react';
import { 
  DragState, 
  ConnectorEditState, 
  TimelinePosition, 
  ConnectorBead,
  ConnectorString 
} from '../models/timeline.models';

interface UseDragAndRouteReturn {
  // Drag state
  dragState: DragState;
  startDrag: (type: 'board' | 'bookmark' | 'bead', itemId: string, position: TimelinePosition) => void;
  updateDrag: (position: TimelinePosition) => void;
  endDrag: () => void;
  
  // Connector editing
  connectorEditState: ConnectorEditState;
  startConnectorEdit: (mode: 'create' | 'edit', connectorId?: string) => void;
  selectSourceBoard: (boardId: string) => void;
  selectTargetBoard: (boardId: string) => void;
  addTempBead: (position: TimelinePosition) => void;
  updateTempBead: (beadId: string, position: TimelinePosition) => void;
  removeTempBead: (beadId: string) => void;
  finishConnectorEdit: () => void;
  cancelConnectorEdit: () => void;
  
  // SVG path utilities
  generateSVGPath: (connector: ConnectorString, boardPositions: Map<string, TimelinePosition>) => string;
  calculateBeadPosition: (bead: ConnectorBead, connector: ConnectorString, boardPositions: Map<string, TimelinePosition>) => TimelinePosition;
  isNearPath: (point: TimelinePosition, path: string, threshold?: number) => boolean;
}

export const useDragAndRoute = (): UseDragAndRouteReturn => {
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    dragType: null,
    dragItemId: null,
    startPosition: null,
    currentPosition: null
  });

  const [connectorEditState, setConnectorEditState] = useState<ConnectorEditState>({
    isEditing: false,
    mode: null,
    selectedConnectorId: null,
    sourceBoardId: null,
    targetBoardId: null,
    tempBeads: []
  });

  const dragStartTime = useRef<number>(0);
  const isDraggingRef = useRef<boolean>(false);

  // Drag operations
  const startDrag = useCallback((type: 'board' | 'bookmark' | 'bead', itemId: string, position: TimelinePosition) => {
    dragStartTime.current = Date.now();
    isDraggingRef.current = true;
    
    setDragState({
      isDragging: true,
      dragType: type,
      dragItemId: itemId,
      startPosition: position,
      currentPosition: position
    });
  }, []);

  const updateDrag = useCallback((position: TimelinePosition) => {
    if (!isDraggingRef.current) return;
    
    setDragState(prev => ({
      ...prev,
      currentPosition: position
    }));
  }, []);

  const endDrag = useCallback(() => {
    isDraggingRef.current = false;
    
    setDragState({
      isDragging: false,
      dragType: null,
      dragItemId: null,
      startPosition: null,
      currentPosition: null
    });
  }, []);

  // Connector editing operations
  const startConnectorEdit = useCallback((mode: 'create' | 'edit', connectorId?: string) => {
    setConnectorEditState({
      isEditing: true,
      mode,
      selectedConnectorId: connectorId || null,
      sourceBoardId: null,
      targetBoardId: null,
      tempBeads: []
    });
  }, []);

  const selectSourceBoard = useCallback((boardId: string) => {
    setConnectorEditState(prev => ({
      ...prev,
      sourceBoardId: boardId,
      targetBoardId: null // Reset target when selecting new source
    }));
  }, []);

  const selectTargetBoard = useCallback((boardId: string) => {
    setConnectorEditState(prev => {
      // Only set target if we have a source and it's different
      if (prev.sourceBoardId && prev.sourceBoardId !== boardId) {
        return {
          ...prev,
          targetBoardId: boardId
        };
      }
      return prev;
    });
  }, []);

  const addTempBead = useCallback((position: TimelinePosition) => {
    const newBead: ConnectorBead = {
      id: `temp-${Date.now()}`,
      x: position.x,
      y: position.y,
      order: connectorEditState.tempBeads.length
    };

    setConnectorEditState(prev => ({
      ...prev,
      tempBeads: [...prev.tempBeads, newBead]
    }));
  }, [connectorEditState.tempBeads.length]);

  const updateTempBead = useCallback((beadId: string, position: TimelinePosition) => {
    setConnectorEditState(prev => ({
      ...prev,
      tempBeads: prev.tempBeads.map(bead =>
        bead.id === beadId ? { ...bead, x: position.x, y: position.y } : bead
      )
    }));
  }, []);

  const removeTempBead = useCallback((beadId: string) => {
    setConnectorEditState(prev => ({
      ...prev,
      tempBeads: prev.tempBeads.filter(bead => bead.id !== beadId)
    }));
  }, []);

  const finishConnectorEdit = useCallback(() => {
    setConnectorEditState({
      isEditing: false,
      mode: null,
      selectedConnectorId: null,
      sourceBoardId: null,
      targetBoardId: null,
      tempBeads: []
    });
  }, []);

  const cancelConnectorEdit = useCallback(() => {
    setConnectorEditState({
      isEditing: false,
      mode: null,
      selectedConnectorId: null,
      sourceBoardId: null,
      targetBoardId: null,
      tempBeads: []
    });
  }, []);

  // SVG path utilities
  const generateSVGPath = useCallback((connector: ConnectorString, boardPositions: Map<string, TimelinePosition>): string => {
    const sourcePos = boardPositions.get(connector.fromBoardId);
    const targetPos = boardPositions.get(connector.toBoardId);

    if (!sourcePos || !targetPos) {
      return '';
    }

    // Calculate connection points (center of boards)
    const sourceCenterX = sourcePos.x + 160; // Half of board width (320/2)
    const sourceCenterY = sourcePos.y + 200; // Approximate center height
    const targetCenterX = targetPos.x + 160;
    const targetCenterY = targetPos.y + 200;

    // Start with source board center
    let pathData = `M ${sourceCenterX} ${sourceCenterY}`;

    // Add intermediate beads as curve control points
    if (connector.beads.length > 0) {
      const sortedBeads = connector.beads.sort((a, b) => a.order - b.order);
      
      for (let i = 0; i < sortedBeads.length; i++) {
        const bead = sortedBeads[i];
        
        if (i === 0) {
          // First bead - smooth curve from source
          const midX = (sourceCenterX + bead.x) / 2;
          const midY = (sourceCenterY + bead.y) / 2;
          pathData += ` Q ${midX} ${midY} ${bead.x} ${bead.y}`;
        } else {
          // Subsequent beads - smooth curves
          pathData += ` L ${bead.x} ${bead.y}`;
        }
      }
      
      // Final curve to target
      const lastBead = sortedBeads[sortedBeads.length - 1];
      const midX = (lastBead.x + targetCenterX) / 2;
      const midY = (lastBead.y + targetCenterY) / 2;
      pathData += ` Q ${midX} ${midY} ${targetCenterX} ${targetCenterY}`;
    } else {
      // Direct line with slight curve for aesthetics
      const midX = (sourceCenterX + targetCenterX) / 2;
      const midY = (sourceCenterY + targetCenterY) / 2;
      const controlOffset = Math.abs(targetCenterX - sourceCenterX) * 0.2;
      pathData += ` Q ${midX} ${midY - controlOffset} ${targetCenterX} ${targetCenterY}`;
    }

    return pathData;
  }, []);

  const calculateBeadPosition = useCallback((
    bead: ConnectorBead, 
    connector: ConnectorString, 
    boardPositions: Map<string, TimelinePosition>
  ): TimelinePosition => {
    // For now, return the bead's stored position
    // In the future, this could calculate position based on path percentage
    return { x: bead.x, y: bead.y };
  }, []);

  const isNearPath = useCallback((point: TimelinePosition, path: string, threshold: number = 10): boolean => {
    // Simple distance check - in a real implementation, you'd use proper path distance calculation
    // This is a placeholder for more sophisticated path proximity detection
    return false;
  }, []);

  return {
    dragState,
    startDrag,
    updateDrag,
    endDrag,
    connectorEditState,
    startConnectorEdit,
    selectSourceBoard,
    selectTargetBoard,
    addTempBead,
    updateTempBead,
    removeTempBead,
    finishConnectorEdit,
    cancelConnectorEdit,
    generateSVGPath,
    calculateBeadPosition,
    isNearPath
  };
}; 