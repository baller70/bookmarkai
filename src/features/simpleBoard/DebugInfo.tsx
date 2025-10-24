import React from 'react';
import { Card } from '@/components/ui/card';

interface DebugInfoProps {
  nodes: any[];
  edges: any[];
}

export const DebugInfo: React.FC<DebugInfoProps> = ({ nodes, edges }) => {
  return (
    <Card className="absolute top-4 right-4 z-50 p-4 bg-white/90 backdrop-blur-sm max-w-xs">
      <h3 className="font-bold text-sm mb-2">Debug Info</h3>
      <div className="text-xs space-y-1">
        <div><strong>Nodes:</strong> {nodes.length}</div>
        <div><strong>Edges:</strong> {edges.length}</div>
        <div className="mt-2">
          <strong>Node List:</strong>
          <ul className="ml-2">
            {nodes.map(node => (
              <li key={node.id}>
                {node.data.label} ({node.data.bookmarks?.length || 0} bookmarks)
              </li>
            ))}
          </ul>
        </div>
        <div className="mt-2">
          <strong>Connections:</strong>
          <ul className="ml-2">
            {edges.map(edge => (
              <li key={edge.id}>
                {edge.source} → {edge.target}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Card>
  );
}; 