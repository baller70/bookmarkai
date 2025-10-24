// Connector Editor - Overlay component for managing connector creation and editing
'use client';

import React, { useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { X, Check, Trash2 } from 'lucide-react';
import { ConnectorEditState, InfinityBoard } from '../models/timeline.models';

interface ConnectorEditorProps {
  editState: ConnectorEditState;
  boards: InfinityBoard[];
  canvasSize: { width: number; height: number };
  onFinishConnector?: () => void;
  onCancelConnector?: () => void;
  onDeleteConnector?: (connectorId: string) => void;
}

export const ConnectorEditor: React.FC<ConnectorEditorProps> = ({
  editState,
  boards,
  canvasSize,
  onFinishConnector,
  onCancelConnector,
  onDeleteConnector
}) => {
  const sourceBoard = boards.find(board => board.id === editState.sourceBoardId);
  const targetBoard = boards.find(board => board.id === editState.targetBoardId);

  const handleFinish = useCallback(() => {
    if (editState.sourceBoardId && editState.targetBoardId) {
      onFinishConnector?.();
    }
  }, [editState.sourceBoardId, editState.targetBoardId, onFinishConnector]);

  const handleCancel = useCallback(() => {
    onCancelConnector?.();
  }, [onCancelConnector]);

  const handleDelete = useCallback(() => {
    if (editState.selectedConnectorId) {
      onDeleteConnector?.(editState.selectedConnectorId);
    }
  }, [editState.selectedConnectorId, onDeleteConnector]);

  const canFinish = editState.sourceBoardId && editState.targetBoardId;

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Instructions overlay */}
      <div className="absolute top-20 left-1/2 transform -translate-x-1/2 pointer-events-auto z-50">
        <Card className="p-4 bg-white/95 backdrop-blur-sm border shadow-lg">
          <div className="text-center space-y-3">
            <h3 className="font-semibold text-gray-900">
              {editState.mode === 'create' ? 'Create Connector' : 'Edit Connector'}
            </h3>
            
            {!editState.sourceBoardId && (
              <p className="text-sm text-gray-600">
                Click on a board to start the connection
              </p>
            )}
            
            {editState.sourceBoardId && !editState.targetBoardId && (
              <div className="space-y-2">
                <p className="text-sm text-green-600">
                  ✓ Source: {sourceBoard?.title}
                </p>
                <p className="text-sm text-gray-600">
                  Now click on the target board
                </p>
              </div>
            )}
            
            {editState.sourceBoardId && editState.targetBoardId && (
              <div className="space-y-2">
                <p className="text-sm text-green-600">
                  ✓ Source: {sourceBoard?.title}
                </p>
                <p className="text-sm text-green-600">
                  ✓ Target: {targetBoard?.title}
                </p>
                <p className="text-sm text-blue-600">
                  Click anywhere to add routing beads, or finish the connection
                </p>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex items-center justify-center space-x-2 pt-2">
              {canFinish && (
                <Button
                  size="sm"
                  onClick={handleFinish}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Check className="h-4 w-4 mr-1" />
                  Finish
                </Button>
              )}
              
              {editState.mode === 'edit' && editState.selectedConnectorId && (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleDelete}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              )}
              
              <Button
                size="sm"
                variant="outline"
                onClick={handleCancel}
              >
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Visual connection line preview */}
      {editState.sourceBoardId && editState.targetBoardId && sourceBoard && targetBoard && (
        <svg className="absolute inset-0 pointer-events-none" width={canvasSize.width} height={canvasSize.height}>
          <line
            x1={sourceBoard.position.x + 150} // Center of board
            y1={sourceBoard.position.y + 100}
            x2={targetBoard.position.x + 150}
            y2={targetBoard.position.y + 100}
            stroke="#3b82f6"
            strokeWidth={3}
            strokeDasharray="5,5"
            opacity={0.6}
          />
        </svg>
      )}
    </div>
  );
}; 