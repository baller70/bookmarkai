import React, { useCallback, useEffect, useState } from 'react';
import ReactFlow, {
  ReactFlowProvider,
  addEdge,
  Background,
  Controls,
  MiniMap,
  useEdgesState,
  useNodesState,
  Connection,
  Edge,
  Node,
  NodeTypes,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Button } from '@/components/ui/button';
import { BoardNode } from './BoardNode';

// Comprehensive initial data with proper typing
const initialNodes: Node[] = [
  {
    id: '1',
    position: { x: 100, y: 100 },
    data: { 
      label: 'Development', 
      bookmarks: [
        { id: 'b1', title: 'GitHub', url: 'https://github.com' },
        { id: 'b2', title: 'Stack Overflow', url: 'https://stackoverflow.com' },
        { id: 'b3', title: 'MDN Web Docs', url: 'https://developer.mozilla.org' },
        { id: 'b4', title: 'React Docs', url: 'https://react.dev' },
      ] 
    },
    type: 'board',
  },
  {
    id: '2',
    position: { x: 450, y: 100 },
    data: { 
      label: 'Design', 
      bookmarks: [
        { id: 'b5', title: 'Figma', url: 'https://figma.com' },
        { id: 'b6', title: 'Adobe XD', url: 'https://adobe.com/xd' },
        { id: 'b7', title: 'Dribbble', url: 'https://dribbble.com' },
      ] 
    },
    type: 'board',
  },
  {
    id: '3',
    position: { x: 800, y: 100 },
    data: { 
      label: 'Productivity', 
      bookmarks: [
        { id: 'b8', title: 'Notion', url: 'https://notion.so' },
        { id: 'b9', title: 'Trello', url: 'https://trello.com' },
        { id: 'b10', title: 'Slack', url: 'https://slack.com' },
      ] 
    },
    type: 'board',
  },
  {
    id: '4',
    position: { x: 275, y: 350 },
    data: { 
      label: 'Learning', 
      bookmarks: [
        { id: 'b11', title: 'YouTube', url: 'https://youtube.com' },
        { id: 'b12', title: 'Coursera', url: 'https://coursera.org' },
        { id: 'b13', title: 'Udemy', url: 'https://udemy.com' },
      ] 
    },
    type: 'board',
  },
  {
    id: '5',
    position: { x: 625, y: 350 },
    data: { 
      label: 'Social Media', 
      bookmarks: [
        { id: 'b14', title: 'Twitter', url: 'https://twitter.com' },
        { id: 'b15', title: 'LinkedIn', url: 'https://linkedin.com' },
        { id: 'b16', title: 'Instagram', url: 'https://instagram.com' },
      ] 
    },
    type: 'board',
  }
];

const initialEdges: Edge[] = [
  { id: 'e1-2', source: '1', target: '2', type: 'smoothstep' },
  { id: 'e2-3', source: '2', target: '3', type: 'smoothstep' },
  { id: 'e1-4', source: '1', target: '4', type: 'smoothstep' },
  { id: 'e2-5', source: '2', target: '5', type: 'smoothstep' },
];

interface SimpleBoardCanvasProps {
  onBookmarkClick?: (bookmark: any) => void;
}

/**
 * Enhanced board canvas with comprehensive drag & drop functionality
 * - Node dragging via React Flow
 * - Bookmark sorting via DnD Kit
 * - Connection creation with large handles
 * - Debug information overlay
 */
export const SimpleBoardCanvasV2: React.FC<SimpleBoardCanvasProps> = ({ onBookmarkClick }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [debugMode, setDebugMode] = useState(true);

  // Debug logging
  useEffect(() => {
    console.log('📊 SimpleBoardCanvas State:', {
      nodesCount: nodes.length,
      edgesCount: edges.length,
      nodes: nodes.map(n => ({ id: n.id, label: n.data.label, bookmarks: n.data.bookmarks?.length })),
      edges: edges.map(e => ({ id: e.id, from: e.source, to: e.target }))
    });
  }, [nodes, edges]);

  // Helper to update node bookmarks
  const updateNodeBookmarks = useCallback((nodeId: string, items: any[]) => {
    console.log('🔄 Updating bookmarks for node:', nodeId, items);
    setNodes((nds) =>
      nds.map((n) =>
        n.id === nodeId ? { ...n, data: { ...n.data, bookmarks: items } } : n
      )
    );
  }, [setNodes]);

  // Node types with enhanced props
  const nodeTypes: NodeTypes = {
    board: (props) => {
      console.log('🎯 Rendering BoardNode:', props.id, props.data);
      return (
        <BoardNode
          {...props}
          data={{
            ...props.data,
            updateBookmarks: (items: any[]) => updateNodeBookmarks(props.id, items),
            onBookmarkClick,
          }}
        />
      );
    },
  };

  // Create edge on connection
  const handleConnect = useCallback(
    (params: Edge | Connection) => {
      console.log('🔗 Creating connection:', params);
      setEdges((eds) => addEdge(params, eds));
    },
    [setEdges]
  );

  // Add new node
  const handleAddNode = useCallback(() => {
    const id = (nodes.length + 1).toString();
    const newNode: Node = {
      id,
      position: { x: Math.random() * 400 + 50, y: Math.random() * 400 + 50 },
      data: { label: `Board ${id}`, bookmarks: [] },
      type: 'board',
    };
    console.log('➕ Adding new node:', newNode);
    setNodes((nds) => [...nds, newNode]);
  }, [nodes.length, setNodes]);

  return (
    <div className="w-full h-full relative">
      {/* Enhanced Debug Info */}
      {debugMode && (
        <div className="absolute top-4 right-4 z-50 bg-white/95 backdrop-blur-sm p-4 rounded-lg shadow-lg max-w-sm border">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-sm">🔧 Debug Panel</h3>
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={() => setDebugMode(false)}
              className="h-6 w-6 p-0"
            >
              ×
            </Button>
          </div>
          <div className="text-xs space-y-1">
            <div><strong>Nodes:</strong> {nodes.length}</div>
            <div><strong>Edges:</strong> {edges.length}</div>
            <div><strong>onBookmarkClick:</strong> {onBookmarkClick ? '✅' : '❌'}</div>
            <div className="mt-2">
              <strong>Nodes:</strong>
              <ul className="ml-2 max-h-32 overflow-y-auto">
                {nodes.map(node => (
                  <li key={node.id} className="text-xs">
                    <span className="font-mono">{node.id}</span>: {node.data.label} 
                    <span className="text-gray-500">({node.data.bookmarks?.length || 0})</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-2">
              <strong>Connections:</strong>
              <ul className="ml-2">
                {edges.map(edge => (
                  <li key={edge.id} className="text-xs">
                    <span className="font-mono">{edge.source} → {edge.target}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="absolute top-4 left-4 z-50 space-x-2">
        <Button size="sm" onClick={handleAddNode}>
          ➕ Add Board
        </Button>
        {!debugMode && (
          <Button size="sm" variant="outline" onClick={() => setDebugMode(true)}>
            🔧 Debug
          </Button>
        )}
      </div>

      <ReactFlowProvider>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={handleConnect}
          nodeTypes={nodeTypes}
          fitView
          attributionPosition="bottom-left"
          className="bg-gray-50"
          nodesDraggable={true}
          nodesConnectable={true}
          elementsSelectable={true}
          selectNodesOnDrag={false}
          panOnDrag={true}
          zoomOnScroll={true}
          zoomOnPinch={true}
          panOnScroll={false}
          preventScrolling={false}
          defaultViewport={{ x: 0, y: 0, zoom: 1 }}
          minZoom={0.1}
          maxZoom={2}
          onError={(error) => console.error('❌ React Flow Error:', error)}
        >
          <Background gap={12} color="#e5e7eb" />
          <MiniMap />
          <Controls position="bottom-right" />
        </ReactFlow>
      </ReactFlowProvider>
    </div>
  );
}; 