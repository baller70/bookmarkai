// Connector String - SVG path connecting boards with draggable beads
'use client';

import React, { useCallback } from 'react';
import { ConnectorString as ConnectorStringType, TimelinePosition } from '../models/timeline.models';
import { useDragAndRoute } from '../hooks/useDragAndRoute';
import { ConnectorBead } from './ConnectorBead';

interface ConnectorStringProps {
  connector: ConnectorStringType;
  boardPositions: Map<string, TimelinePosition>;
  isEditing: boolean;
}

export const ConnectorString: React.FC<ConnectorStringProps> = ({
  connector,
  boardPositions,
  isEditing
}) => {
  const { generateSVGPath, connectorEditState } = useDragAndRoute();

  // Handle path click for editing
  const handlePathClick = useCallback((event: React.MouseEvent) => {
    if (!connectorEditState.isEditing) return;
    
    event.stopPropagation();
    // Add bead at click position
    const svg = event.currentTarget.closest('svg');
    if (svg) {
      const rect = svg.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      
      // This would trigger adding a bead at this position
      console.log('Add bead at:', { x, y });
    }
  }, [connectorEditState.isEditing]);

  const sourcePos = boardPositions.get(connector.fromBoardId);
  const targetPos = boardPositions.get(connector.toBoardId);

  // Don't render if board positions are missing
  if (!sourcePos || !targetPos) {
    return null;
  }

  // Generate the SVG path
  const pathData = generateSVGPath(connector, boardPositions);

  return (
    <g className="connector-string">
      {/* Main path */}
      <path
        d={pathData}
        stroke={connector.color}
        strokeWidth={connector.strokeWidth}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`
          transition-all duration-200
          ${isEditing ? 'stroke-blue-500 cursor-pointer' : 'hover:stroke-blue-400'}
          ${connectorEditState.isEditing ? 'pointer-events-auto' : 'pointer-events-none'}
        `}
        onClick={handlePathClick}
      />

      {/* Hover/selection outline */}
      {isEditing && (
        <path
          d={pathData}
          stroke="rgba(59, 130, 246, 0.3)"
          strokeWidth={connector.strokeWidth + 4}
          fill="none"
          className="pointer-events-none"
        />
      )}

      {/* Connection points at board centers */}
      <circle
        cx={sourcePos.x}
        cy={sourcePos.y}
        r="4"
        fill={connector.color}
        className="pointer-events-none"
      />
      <circle
        cx={targetPos.x}
        cy={targetPos.y}
        r="4"
        fill={connector.color}
        className="pointer-events-none"
      />

      {/* Draggable beads */}
      {connector.beads.map(bead => (
        <ConnectorBead
          key={bead.id}
          bead={bead}
          isEditing={isEditing}
        />
      ))}

      {/* Connector label (when editing) */}
      {isEditing && (
        <text
          x={(sourcePos.x + targetPos.x) / 2}
          y={(sourcePos.y + targetPos.y) / 2 - 10}
          textAnchor="middle"
          className="text-xs fill-gray-600 pointer-events-none"
          fontSize="12"
        >
          Connector #{connector.id.slice(-4)}
        </text>
      )}
    </g>
  );
};
