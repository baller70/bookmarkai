import React, { useCallback, useEffect, useState, useMemo, useRef } from 'react';
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
  useReactFlow,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Button } from '@/components/ui/button';
import { BoardNode, BookmarkItem } from './BoardNode';
// Sentry removed

// ROBUST INITIAL DATA - GUARANTEED TO WORK
const ROBUST_INITIAL_NODES: Node[] = [
  {
    id: 'dev-1',
    position: { x: 100, y: 100 },
    data: { 
      label: '🚀 Development', 
      bookmarks: [
        { id: 'bm-1', title: 'GitHub', url: 'https://github.com' },
        { id: 'bm-2', title: 'Stack Overflow', url: 'https://stackoverflow.com' },
        { id: 'bm-3', title: 'MDN Docs', url: 'https://developer.mozilla.org' },
        { id: 'bm-4', title: 'React', url: 'https://react.dev' },
      ] 
    },
    type: 'board',
  },
  {
    id: 'design-2',
    position: { x: 450, y: 100 },
    data: { 
      label: '🎨 Design', 
      bookmarks: [
        { id: 'bm-5', title: 'Figma', url: 'https://figma.com' },
        { id: 'bm-6', title: 'Adobe XD', url: 'https://adobe.com/xd' },
        { id: 'bm-7', title: 'Dribbble', url: 'https://dribbble.com' },
      ] 
    },
    type: 'board',
  },
  {
    id: 'productivity-3',
    position: { x: 800, y: 100 },
    data: { 
      label: '⚡ Productivity', 
      bookmarks: [
        { id: 'bm-8', title: 'Notion', url: 'https://notion.so' },
        { id: 'bm-9', title: 'Trello', url: 'https://trello.com' },
        { id: 'bm-10', title: 'Slack', url: 'https://slack.com' },
      ] 
    },
    type: 'board',
  },
  {
    id: 'learning-4',
    position: { x: 275, y: 350 },
    data: { 
      label: '📚 Learning', 
      bookmarks: [
        { id: 'bm-11', title: 'YouTube', url: 'https://youtube.com' },
        { id: 'bm-12', title: 'Coursera', url: 'https://coursera.org' },
        { id: 'bm-13', title: 'Udemy', url: 'https://udemy.com' },
      ] 
    },
    type: 'board',
  },
  {
    id: 'social-5',
    position: { x: 625, y: 350 },
    data: { 
      label: '📱 Social Media', 
      bookmarks: [
        { id: 'bm-14', title: 'Twitter', url: 'https://twitter.com' },
        { id: 'bm-15', title: 'LinkedIn', url: 'https://linkedin.com' },
        { id: 'bm-16', title: 'Instagram', url: 'https://instagram.com' },
      ] 
    },
    type: 'board',
  }
];

const ROBUST_INITIAL_EDGES: Edge[] = [
  { id: 'edge-dev-design', source: 'dev-1', target: 'design-2', type: 'smoothstep' },
  { id: 'edge-design-productivity', source: 'design-2', target: 'productivity-3', type: 'smoothstep' },
  { id: 'edge-dev-learning', source: 'dev-1', target: 'learning-4', type: 'smoothstep' },
  { id: 'edge-design-social', source: 'design-2', target: 'social-5', type: 'smoothstep' },
];

interface SimpleBoardCanvasProps {
  onBookmarkClick?: (bookmark: BookmarkItem) => void;
}

// Error Boundary for React Flow
class ReactFlowErrorBoundary extends React.Component<
  { children: React.ReactNode; onError?: (error: Error) => void },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode; onError?: (error: Error) => void }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('🚨 React Flow Error Boundary caught error:', error);
    console.error('Error Info:', errorInfo);
    
    console.error(error, {
      tags: { component: 'ReactFlowErrorBoundary' },
      extra: { errorInfo }
    });
    
    if (this.props.onError) {
      this.props.onError(error);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-red-50 border border-red-200 rounded-lg">
          <div className="text-center p-8">
            <h3 className="text-lg font-semibold text-red-800 mb-2">React Flow Error</h3>
            <p className="text-red-600 mb-4">
              {this.state.error?.message || 'An error occurred in the React Flow component'}
            </p>
            <button
              onClick={() => this.setState({ hasError: false, error: undefined })}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * ROBUST SimpleBoardCanvas with comprehensive debugging and drag-and-drop
 * ✅ Node dragging (React Flow)
 * ✅ Bookmark sorting (DnD Kit) 
 * ✅ Connection creation (Large handles)
 * ✅ Bookmark clicking (Modal)
 * ✅ Debug information
 */
export const SimpleBoardCanvas: React.FC<SimpleBoardCanvasProps> = ({ onBookmarkClick }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState(ROBUST_INITIAL_NODES);
  const [edges, setEdges, onEdgesChange] = useEdgesState(ROBUST_INITIAL_EDGES);
  const [debugMode, setDebugMode] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Ensure component is mounted
  useEffect(() => {
    setMounted(true);
    console.log('🎯 SimpleBoardCanvas mounted with:', {
      nodes: ROBUST_INITIAL_NODES.length,
      edges: ROBUST_INITIAL_EDGES.length,
      onBookmarkClick: !!onBookmarkClick
    });
  }, []);

  // Debug state changes
  useEffect(() => {
    if (mounted) {
      console.log('📊 State Update:', {
        nodesCount: nodes.length,
        edgesCount: edges.length,
        nodeLabels: nodes.map(n => n.data.label),
        connections: edges.map(e => `${e.source} → ${e.target}`)
      });
    }
  }, [nodes, edges, mounted]);

  // Update node bookmarks with error handling
  const updateNodeBookmarks = useCallback((nodeId: string, items: BookmarkItem[]) => {
    console.log('🔄 Updating bookmarks for node:', nodeId, 'items:', items.length);
    try {
      setNodes((nds) =>
        nds.map((n) =>
          n.id === nodeId ? { ...n, data: { ...n.data, bookmarks: items } } : n
        )
      );
    } catch (error) {
      console.error('❌ Error updating bookmarks:', error);
    }
  }, [setNodes]);

  // Robust node types
  const nodeTypes: NodeTypes = {
    board: (props) => {
      try {
        return (
          <BoardNode
            {...props}
            data={{
              ...props.data,
              updateBookmarks: (items: BookmarkItem[]) => updateNodeBookmarks(props.id, items),
              onBookmarkClick,
            }}
          />
        );
      } catch (error) {
        console.error('❌ Error rendering BoardNode:', error);
        console.error(error, {
          tags: { component: 'BoardNode', nodeId: props.id }
        });
        return <div className="p-4 bg-red-100 border border-red-300 rounded">Error rendering node {props.id}</div>;
      }
    },
  };

  // Handle connections
  const handleConnect = useCallback(
    (params: Edge | Connection) => {
      console.log('🔗 Creating connection:', params);
      try {
        setEdges((eds) => addEdge(params, eds));
      } catch (error) {
        console.error('❌ Error creating connection:', error);
      }
    },
    [setEdges]
  );

  // Add new node
  const handleAddNode = useCallback(() => {
    const id = `new-board-${Date.now()}`;
    const newNode: Node = {
      id,
      position: { x: Math.random() * 400 + 50, y: Math.random() * 400 + 50 },
      data: { 
        label: `🆕 New Board ${nodes.length + 1}`, 
        bookmarks: [
          { id: `${id}-bm-1`, title: 'Example Bookmark', url: 'https://example.com' }
        ] 
      },
      type: 'board',
    };
    console.log('➕ Adding new node:', newNode);
    setNodes((nds) => [...nds, newNode]);
  }, [nodes.length, setNodes]);

  if (!mounted) {
    return <div className="w-full h-full flex items-center justify-center">Loading...</div>;
  }

  // Safety check for nodeTypes
  if (!nodeTypes || Object.keys(nodeTypes).length === 0) {
    console.error('❌ NodeTypes not properly defined:', nodeTypes);
    return <div className="w-full h-full flex items-center justify-center text-red-500">Error: NodeTypes not defined</div>;
  }

  // Validate nodes have valid types
  const invalidNodes = nodes.filter(node => !nodeTypes[node.type || 'default']);
  if (invalidNodes.length > 0) {
    console.error('❌ Invalid node types found:', invalidNodes.map(n => ({ id: n.id, type: n.type })));
    return <div className="w-full h-full flex items-center justify-center text-red-500">Error: Invalid node types detected</div>;
  }

  return (
    <div className="w-full h-full relative">
      {/* ENHANCED DEBUG PANEL */}
      {debugMode && (
        <div className="absolute top-4 right-4 z-50 bg-white/95 backdrop-blur-sm p-4 rounded-lg shadow-xl max-w-sm border-2 border-blue-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-sm text-blue-800">🔧 Drag & Drop Debug</h3>
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={() => setDebugMode(false)}
              className="h-6 w-6 p-0 hover:bg-red-100"
            >
              ×
            </Button>
          </div>
          <div className="text-xs space-y-2">
            <div className="flex justify-between">
              <span><strong>Nodes:</strong></span>
              <span className="font-mono text-green-600">{nodes.length}</span>
            </div>
            <div className="flex justify-between">
              <span><strong>Edges:</strong></span>
              <span className="font-mono text-blue-600">{edges.length}</span>
            </div>
            <div className="flex justify-between">
              <span><strong>Click Handler:</strong></span>
              <span className="font-mono">{onBookmarkClick ? '✅' : '❌'}</span>
            </div>
            
            <div className="border-t pt-2 mt-2">
              <strong className="text-blue-700">Available Nodes:</strong>
              <ul className="ml-2 max-h-32 overflow-y-auto space-y-1">
                {nodes.map(node => (
                  <li key={node.id} className="text-xs bg-gray-50 p-1 rounded">
                    <div className="font-mono text-blue-600">{node.id}</div>
                    <div className="text-gray-700">{node.data.label}</div>
                    <div className="text-gray-500">📚 {node.data.bookmarks?.length || 0} bookmarks</div>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="border-t pt-2 mt-2">
              <strong className="text-green-700">Active Connections:</strong>
              <ul className="ml-2">
                {edges.map(edge => (
                  <li key={edge.id} className="text-xs bg-green-50 p-1 rounded mb-1">
                    <span className="font-mono">{edge.source} → {edge.target}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* TOOLBAR */}
      <div className="absolute top-4 left-4 z-50 space-x-2">
        <Button size="sm" onClick={handleAddNode} className="bg-green-600 hover:bg-green-700">
          ➕ Add Board
        </Button>
        {!debugMode && (
          <Button size="sm" variant="outline" onClick={() => setDebugMode(true)}>
            🔧 Debug
          </Button>
        )}
      </div>

      {/* REACT FLOW CANVAS */}
      <ReactFlowProvider>
        <ReactFlowErrorBoundary 
          onError={(error) => {
            console.error('❌ React Flow Error Boundary caught:', error);
          }}
        >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={handleConnect}
            nodeTypes={nodeTypes}
            fitView
            attributionPosition="bottom-left"
            className="bg-gradient-to-br from-gray-50 to-gray-100"
            nodesDraggable={true}
            nodesConnectable={true}
            elementsSelectable={true}
            selectNodesOnDrag={false}
            panOnDrag={true}
            zoomOnScroll={true}
            zoomOnPinch={true}
            panOnScroll={false}
            preventScrolling={false}
            defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
            minZoom={0.1}
            maxZoom={2}
            onError={(error) => {
              console.error('❌ React Flow Error:', error);
              console.error('❌ Error details:');
              console.error(error, {
                tags: { component: 'SimpleBoardCanvas', action: 'react_flow_error' },
                extra: {
                  nodeTypes: Object.keys(nodeTypes),
                  nodesCount: nodes.length,
                  edgesCount: edges.length
                }
              });
            }}
            onInit={() => console.log('✅ React Flow initialized successfully')}
          >
            <Background gap={16} color="#e5e7eb" />
            <MiniMap 
              nodeColor="#3b82f6"
              maskColor="rgba(0,0,0,0.1)"
              position="bottom-left"
            />
            <Controls position="bottom-right" />
          </ReactFlow>
        </ReactFlowErrorBoundary>
      </ReactFlowProvider>
    </div>
  );
}; 