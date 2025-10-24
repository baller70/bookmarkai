// @ts-nocheck
// Timeline Canvas - Main infinite canvas component with pan/zoom
'use client';

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  ZoomIn, 
  ZoomOut, 
  Move, 
  Plus, 
  Link, 
  Hand,
  RotateCcw,
  Maximize2,
  Grid,
  AlignHorizontalJustifyCenter,
  AlignVerticalJustifyCenter,
  AlignHorizontalSpaceAround
} from 'lucide-react';
import { useTimelineData } from '../hooks/useTimelineData';
import { useDragAndRoute } from '../hooks/useDragAndRoute';
import { InfinityBoard } from './InfinityBoard';
import { ConnectorString } from './ConnectorString';
import { ConnectorEditor } from './ConnectorEditor';
import { TimelinePosition } from '../models/timeline.models';

interface TimelineCanvasProps {
  className?: string;
}

export const TimelineCanvas: React.FC<TimelineCanvasProps> = ({ className = '' }) => {
  const transformRef = useRef<any>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isPanMode, setIsPanMode] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [canvasSize, setCanvasSize] = useState({ width: 5000, height: 3000 });
  const gridSize = 12;
  
  const {
    timelineData,
    isLoading,
    error,
    createBoard,
    getBoardById,
    getBookmarksByBoard,
    createConnector,
    updateBoard
  } = useTimelineData();

  const {
    dragState,
    connectorEditState,
    startConnectorEdit,
    cancelConnectorEdit,
    generateSVGPath,
    selectSourceBoard,
    selectTargetBoard
  } = useDragAndRoute();

  // Handle connector creation when both boards are selected
  useEffect(() => {
    console.log('Connector edit state changed:', connectorEditState);
    
    if (connectorEditState.isEditing && 
        connectorEditState.sourceBoardId && 
        connectorEditState.targetBoardId) {
      console.log('Creating connector between:', {
        source: connectorEditState.sourceBoardId,
        target: connectorEditState.targetBoardId
      });
      
      // Create the connector
      createConnector(connectorEditState.sourceBoardId, connectorEditState.targetBoardId)
        .then(() => {
          console.log('Connector created successfully');
          // Reset connector edit state after successful creation
          cancelConnectorEdit();
        })
        .catch((error) => {
          console.error('Failed to create connector:', error);
        });
    }
  }, [connectorEditState.sourceBoardId, connectorEditState.targetBoardId, connectorEditState.isEditing, createConnector, cancelConnectorEdit]);

  // Snap position to grid with improved alignment
  const snapToGrid = useCallback((position: TimelinePosition): TimelinePosition => {
    if (!showGrid) return position;
    
    return {
      x: Math.round(position.x / gridSize) * gridSize,
      y: Math.round(position.y / gridSize) * gridSize
    };
  }, [showGrid, gridSize]);

  // Alignment helpers
  const alignBoardsHorizontally = useCallback(async () => {
    if (timelineData.boards.length < 2) return;
    
    // Get the first board as reference
    const referenceBoard = timelineData.boards[0];
    const referenceY = referenceBoard.position.y;
    
    // Align all other boards to the same Y position
    for (let i = 1; i < timelineData.boards.length; i++) {
      const board = timelineData.boards[i];
      if (board.position.y !== referenceY) {
        await updateBoard(board.id, { 
          position: { 
            x: board.position.x, 
            y: referenceY 
          } 
        });
      }
    }
  }, [timelineData.boards, updateBoard]);

  const alignBoardsVertically = useCallback(async () => {
    if (timelineData.boards.length < 2) return;
    
    // Get the first board as reference
    const referenceBoard = timelineData.boards[0];
    const referenceX = referenceBoard.position.x;
    
    // Align all other boards to the same X position
    for (let i = 1; i < timelineData.boards.length; i++) {
      const board = timelineData.boards[i];
      if (board.position.x !== referenceX) {
        await updateBoard(board.id, { 
          position: { 
            x: referenceX, 
            y: board.position.y 
          } 
        });
      }
    }
  }, [timelineData.boards, updateBoard]);

  const distributeHorizontally = useCallback(async () => {
    if (timelineData.boards.length < 2) return;
    
    const sortedBoards = [...timelineData.boards].sort((a, b) => a.position.x - b.position.x);
    const spacing = 420; // Board width + margin
    let currentX = sortedBoards[0].position.x;
    
    for (let i = 1; i < sortedBoards.length; i++) {
      currentX += spacing;
      await updateBoard(sortedBoards[i].id, { 
        position: { 
          x: currentX, 
          y: sortedBoards[i].position.y 
        } 
      });
    }
  }, [timelineData.boards, updateBoard]);

  // Handle canvas clicks
  const handleCanvasClick = useCallback((event: React.MouseEvent) => {
    // Only handle clicks if we're in connector mode and need to place beads
    if (connectorEditState.isEditing && connectorEditState.sourceBoardId && connectorEditState.targetBoardId) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        // Add routing bead at click position
        console.log('Add routing bead at:', { x, y });
      }
    }
    // Remove automatic board creation - only create boards via the Add Board button
  }, [connectorEditState]);

  // Create new board at position
  const handleCreateBoard = useCallback(async () => {
    try {
      // Create boards in a better aligned pattern with improved spacing
      const boardCount = timelineData.boards.length;
      const boardsPerRow = 3;
      const boardWidth = 320;
      const boardHeight = 400;
      const spacingX = 420; // Board width + margin
      const spacingY = 450; // Board height + margin
      
      const row = Math.floor(boardCount / boardsPerRow);
      const col = boardCount % boardsPerRow;
      
      const baseX = 100 + (col * spacingX);
      const baseY = 100 + (row * spacingY);
      
      const position = snapToGrid({ x: baseX, y: baseY });
      const title = `Board ${boardCount + 1}`;
      await createBoard(title, position);
    } catch (error) {
      console.error('Failed to create board:', error);
    }
  }, [createBoard, timelineData.boards.length, snapToGrid]);

  // Zoom controls
  const handleZoomIn = useCallback(() => {
    transformRef.current?.zoomIn(0.5);
  }, []);

  const handleZoomOut = useCallback(() => {
    transformRef.current?.zoomOut(0.5);
  }, []);

  const handleResetZoom = useCallback(() => {
    transformRef.current?.resetTransform();
  }, []);

  const handleFitToScreen = useCallback(() => {
    transformRef.current?.centerView();
  }, []);

  // Create board positions map for connectors
  const boardPositions = new Map<string, TimelinePosition>();
  timelineData.boards.forEach(board => {
    boardPositions.set(board.id, board.position);
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading timeline...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="p-6 max-w-md">
          <div className="text-center text-red-600">
            <p className="font-semibold mb-2">Error loading timeline</p>
            <p className="text-sm">{error}</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className={`relative w-full h-full bg-gray-50 ${className}`}>
      {/* Toolbar */}
      <div className="absolute top-4 left-4 z-50">
        <Card className="p-2">
          <div className="flex items-center space-x-2 flex-wrap">
            {/* Greeting */}
            <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-md text-sm font-medium">
              What's up now, boys? Check in.
            </div>
            
            {/* Simple Instructions */}
            <div className="px-3 py-1 bg-green-100 text-green-800 rounded-md text-xs">
              📋 Drag grip to move • Click blue nodes to connect • Use alignment buttons
            </div>
            
            {/* Zoom controls */}
            <div className="flex items-center space-x-1">
              <Button
                size="sm"
                variant="outline"
                onClick={handleZoomIn}
                title="Zoom In"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              
              <Button
                size="sm"
                variant="outline"
                onClick={handleZoomOut}
                title="Zoom Out"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              
              <Button
                size="sm"
                variant="outline"
                onClick={handleResetZoom}
                title="Reset Zoom"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
              
              <Button
                size="sm"
                variant="outline"
                onClick={handleFitToScreen}
                title="Fit to Screen"
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
            </div>

            {/* Controls */}
            <div className="flex items-center space-x-1">
              {/* Pan mode toggle */}
              <Button
                size="sm"
                variant={isPanMode ? "default" : "outline"}
                onClick={() => setIsPanMode(!isPanMode)}
                title="Pan Mode"
              >
                {isPanMode ? <Hand className="h-4 w-4" /> : <Move className="h-4 w-4" />}
              </Button>

              {/* Grid toggle */}
              <Button
                size="sm"
                variant={showGrid ? "default" : "outline"}
                onClick={() => setShowGrid(!showGrid)}
                title="Toggle Grid"
              >
                <Grid className="h-4 w-4" />
              </Button>

              {/* Add board button */}
              <Button
                size="sm"
                variant="outline"
                onClick={handleCreateBoard}
                title="Add Board"
              >
                <Plus className="h-4 w-4" />
                <span className="ml-1">Board</span>
              </Button>

              {/* Connector mode toggle */}
              <Button
                size="sm"
                variant={connectorEditState.isEditing ? "default" : "outline"}
                onClick={() => 
                  connectorEditState.isEditing 
                    ? cancelConnectorEdit() 
                    : startConnectorEdit('create')
                }
                title="Connector Mode"
              >
                <Link className="h-4 w-4" />
                <span className="ml-1">Connect</span>
              </Button>
            </div>

            {/* Alignment Controls */}
            <div className="flex items-center space-x-1 border-l pl-2 ml-2">
              <Button
                size="sm"
                variant="outline"
                onClick={alignBoardsHorizontally}
                title="Align Horizontally"
                disabled={timelineData.boards.length < 2}
              >
                <AlignHorizontalJustifyCenter className="h-4 w-4" />
              </Button>
              
              <Button
                size="sm"
                variant="outline"
                onClick={alignBoardsVertically}
                title="Align Vertically"
                disabled={timelineData.boards.length < 2}
              >
                <AlignVerticalJustifyCenter className="h-4 w-4" />
              </Button>
              
              <Button
                size="sm"
                variant="outline"
                onClick={distributeHorizontally}
                title="Distribute Horizontally"
                disabled={timelineData.boards.length < 2}
              >
                <AlignHorizontalSpaceAround className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Connector Editor Status */}
      {connectorEditState.isEditing && (
        <div className="absolute top-4 right-4 z-50">
          <Card className="p-3">
            <div className="text-sm">
              <p className="font-semibold text-blue-600">Connector Mode Active</p>
              <p className="text-gray-600">
                {!connectorEditState.sourceBoardId 
                  ? "Click a connection node to start"
                  : !connectorEditState.targetBoardId
                  ? "Click target connection node"
                  : "Click to add routing beads"
                }
              </p>
            </div>
          </Card>
        </div>
      )}

      {/* Main Canvas */}
      <TransformWrapper
        ref={transformRef}
        initialScale={0.5}
        minScale={0.1}
        maxScale={3}
        limitToBounds={false}
        centerOnInit={false}
        wheel={{ step: 0.1 }}
        pinch={{ step: 5 }}
        doubleClick={{ disabled: true }}
        panning={{ disabled: !isPanMode }}
      >
        <TransformComponent
          wrapperClass="w-full h-full"
          contentClass="w-full h-full"
        >
          <div 
            ref={canvasRef}
            className="timeline-canvas-background relative"
            style={{ 
              width: canvasSize.width, 
              height: canvasSize.height,
              backgroundImage: showGrid ? `
                radial-gradient(circle, #e5e7eb 1px, transparent 1px)
              ` : 'none',
              backgroundSize: `${gridSize}px ${gridSize}px`
            }}
            onClick={handleCanvasClick}
          >
            {/* SVG Layer for Connectors */}
            <svg 
              className="absolute inset-0 pointer-events-none" 
              width={canvasSize.width} 
              height={canvasSize.height}
            >
              {timelineData.connectors.map(connector => (
                <ConnectorString
                  key={connector.id}
                  connector={connector}
                  boardPositions={boardPositions}
                  isEditing={connectorEditState.selectedConnectorId === connector.id}
                />
              ))}
            </svg>

            {/* Boards Layer */}
            {timelineData.boards.map(board => (
              <InfinityBoard
                key={board.id}
                board={board}
                bookmarks={getBookmarksByBoard(board.id)}
                isConnectorMode={connectorEditState.isEditing}
                isSelected={
                  connectorEditState.sourceBoardId === board.id ||
                  connectorEditState.targetBoardId === board.id
                }
                gridSize={gridSize}
                snapToGrid={showGrid}
                connectorEditState={connectorEditState}
                onSelectSourceBoard={selectSourceBoard}
                onSelectTargetBoard={selectTargetBoard}
              />
            ))}

            {/* Connector Editor Overlay */}
            {connectorEditState.isEditing && (
              <ConnectorEditor
                editState={connectorEditState}
                boards={timelineData.boards}
                canvasSize={canvasSize}
              />
            )}
          </div>
        </TransformComponent>
      </TransformWrapper>
    </div>
  );
};
