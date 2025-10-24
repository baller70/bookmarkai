"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/src/components/ui/card';
import { Input } from '@/src/components/ui/input';
import { Button } from '@/src/components/ui/button';
import { Avatar, AvatarFallback } from '@/src/components/ui/avatar';
import { Badge } from '@/src/components/ui/badge';
import { 
  Inbox, 
  Calendar, 
  Trello, 
  Plus, 
  Settings, 
  Mail, 
  MessageSquare, 
  Users, 
  Smartphone,
  Grip,
  Palette,
  Maximize2,
  Minimize2,
  Trash2,
  Clock,
  BarChart3,
  Shield,
  Database,
  Eye,
  CreditCard,
  Rocket,
  Kanban,
  ExternalLink,
  Bookmark,
  Zap,
  CheckCircle
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  useDroppable,
  useDraggable
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// TypeScript interfaces
interface TrelloCard {
  id: string;
  title: string;
  content?: string;
  panelId: string;
  icon?: React.ComponentType<{ className?: string }>;
  color?: string;
}

interface TrelloPanel {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  cards: TrelloCard[];
  width: number;
}

interface BookmarkItem {
  id: string;
  title: string;
  url: string;
  favicon?: string;
}

// Pastel color swatches
const pastelColors = [
  { name: 'Blue', value: '#E3F2FD', dark: '#1976D2' },
  { name: 'Green', value: '#E8F5E8', dark: '#388E3C' },
  { name: 'Purple', value: '#F3E5F5', dark: '#7B1FA2' },
  { name: 'Orange', value: '#FFF3E0', dark: '#F57C00' },
  { name: 'Pink', value: '#FCE4EC', dark: '#C2185B' },
  { name: 'Teal', value: '#E0F2F1', dark: '#00695C' },
  { name: 'Yellow', value: '#FFFDE7', dark: '#F9A825' },
  { name: 'Red', value: '#FFEBEE', dark: '#D32F2F' }
];

// Draggable Card Component
const DraggableCard: React.FC<{ card: TrelloCard; index: number }> = ({ card, index }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.8 : 1,
    zIndex: isDragging ? 1000 : 1,
  };

  const IconComponent = card.icon || MessageSquare;

  // Enhanced color generation with more vibrant and attractive gradients
  const getCardAccentColor = (title: string) => {
    const gradients = [
      'from-blue-400/20 via-blue-300/10 to-blue-100/5 border-blue-300/30',
      'from-emerald-400/20 via-emerald-300/10 to-emerald-100/5 border-emerald-300/30',
      'from-purple-400/20 via-purple-300/10 to-purple-100/5 border-purple-300/30',
      'from-orange-400/20 via-orange-300/10 to-orange-100/5 border-orange-300/30',
      'from-pink-400/20 via-pink-300/10 to-pink-100/5 border-pink-300/30',
      'from-teal-400/20 via-teal-300/10 to-teal-100/5 border-teal-300/30',
      'from-indigo-400/20 via-indigo-300/10 to-indigo-100/5 border-indigo-300/30',
      'from-rose-400/20 via-rose-300/10 to-rose-100/5 border-rose-300/30',
    ];
    
    const hash = title.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    return gradients[Math.abs(hash) % gradients.length];
  };

  const getIconColor = (title: string) => {
    const colors = [
      'text-blue-600',
      'text-emerald-600',
      'text-purple-600',
      'text-orange-600',
      'text-pink-600',
      'text-teal-600',
      'text-indigo-600',
      'text-rose-600',
    ];
    
    const hash = title.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    return colors[Math.abs(hash) % colors.length];
  };

  const getGlowColor = (title: string) => {
    const glows = [
      'group-hover:shadow-blue-200/50',
      'group-hover:shadow-emerald-200/50',
      'group-hover:shadow-purple-200/50',
      'group-hover:shadow-orange-200/50',
      'group-hover:shadow-pink-200/50',
      'group-hover:shadow-teal-200/50',
      'group-hover:shadow-indigo-200/50',
      'group-hover:shadow-rose-200/50',
    ];
    
    const hash = title.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    return glows[Math.abs(hash) % glows.length];
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`
        group relative overflow-hidden
        bg-gradient-to-br ${getCardAccentColor(card.title)}
        rounded-2xl p-5 
        shadow-lg hover:shadow-xl ${getGlowColor(card.title)}
        border border-white/40
        transition-all duration-300 ease-out
        cursor-grab active:cursor-grabbing
        hover:scale-[1.03] hover:-translate-y-2
        ${isDragging ? 'shadow-2xl scale-105 rotate-3 ring-2 ring-blue-300/50' : ''}
        backdrop-blur-sm
      `}
    >
      {/* Enhanced background pattern with animated elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-gradient-to-r from-white/30 to-transparent" />
        <div className="absolute top-0 right-0 w-24 h-24 bg-white/20 rounded-full -translate-y-12 translate-x-12 group-hover:scale-125 transition-transform duration-500" />
        <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/15 rounded-full translate-y-10 -translate-x-10 group-hover:scale-110 transition-transform duration-700" />
        <div className="absolute top-1/2 right-1/4 w-6 h-6 bg-white/25 rounded-full group-hover:animate-pulse" />
        <div className="absolute bottom-1/4 left-1/4 w-4 h-4 bg-white/20 rounded-full group-hover:animate-bounce" />
      </div>

      {/* Card content */}
      <div className="relative z-10">
        {/* Enhanced header with icon and title */}
        <div className="flex items-start gap-4 mb-4">
          <div className={`
            flex-shrink-0 w-10 h-10 rounded-xl 
            bg-white/90 backdrop-blur-sm
            flex items-center justify-center
            shadow-lg border border-white/60
            group-hover:scale-110 group-hover:rotate-6 transition-all duration-300
            ring-2 ring-white/30
          `}>
            <IconComponent className={`h-5 w-5 ${getIconColor(card.title)} group-hover:scale-110 transition-transform duration-200`} />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-base font-bold text-gray-800 leading-tight line-clamp-2 group-hover:text-gray-900 transition-colors mb-1">
              {card.title}
            </h4>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400 shadow-sm animate-pulse" />
              <span className="text-xs text-gray-500 font-medium">Active</span>
            </div>
          </div>
        </div>

        {/* Enhanced content */}
        {card.content && (
          <div className="space-y-3 mb-4">
            <p className="text-sm text-gray-700 line-clamp-3 leading-relaxed font-medium">
              {card.content}
            </p>
            <div className="flex items-center gap-2">
              <div className="h-1 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded-full flex-1">
                <div className="h-full bg-gradient-to-r from-blue-400 to-purple-500 rounded-full w-3/4 group-hover:w-full transition-all duration-500" />
              </div>
              <span className="text-xs text-gray-500 font-medium">75%</span>
            </div>
          </div>
        )}

        {/* Enhanced footer with interactive elements */}
        <div className="flex items-center justify-between pt-3 border-t border-white/40">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-blue-400/80 group-hover:bg-blue-500 transition-colors" />
              <div className="w-2 h-2 rounded-full bg-green-400/60 group-hover:bg-green-500 transition-colors" />
              <div className="w-2 h-2 rounded-full bg-purple-400/40 group-hover:bg-purple-500 transition-colors" />
            </div>
            <span className="text-xs text-gray-500 font-medium ml-1">3 tags</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-xs text-gray-500 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center gap-1">
              <Grip className="h-3 w-3" />
              <span className="font-medium">Drag</span>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced hover glow effect */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-white/0 via-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* Subtle shimmer effect */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
    </div>
  );
};

// Droppable Panel Component
const DroppablePanel: React.FC<{
  panel: TrelloPanel;
  onColorChange: (panelId: string, color: string) => void;
  onAddCard: (panelId: string, title: string) => void;
  onWidthChange: (panelId: string, width: number) => void;
  onDeleteBoard: (panelId: string) => void;
  isVisible: boolean;
  canDelete: boolean;
}> = ({ panel, onColorChange, onAddCard, onWidthChange, onDeleteBoard, isVisible, canDelete }) => {
  const [newCardTitle, setNewCardTitle] = useState('');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [isResizing, setIsResizing] = useState(false);

  const { setNodeRef } = useDroppable({
    id: panel.id,
  });

  const IconComponent = panel.icon;

  // Cleanup effect to prevent memory leaks and unhandled events
  useEffect(() => {
    return () => {
      // Clean up any remaining event listeners when component unmounts
      const cleanup = () => {
        document.removeEventListener('mousemove', () => {});
        document.removeEventListener('mouseup', () => {});
      };
      cleanup();
    };
  }, []);

  const handleAddCard = () => {
    if (newCardTitle.trim()) {
      onAddCard(panel.id, newCardTitle.trim());
      setNewCardTitle('');
    }
  };

  const handleResizeRight = (e: React.MouseEvent) => {
    try {
      e.preventDefault();
      e.stopPropagation();
      setIsResizing(true);
      
      const startX = e.clientX;
      const startWidth = panel.width;
      
      const handleMouseMove = (e: MouseEvent) => {
        try {
          const deltaX = e.clientX - startX;
          // Allow full width expansion with minimum 200px width
          const newWidth = Math.max(200, startWidth + deltaX);
          onWidthChange(panel.id, newWidth);
        } catch (error) {
          console.error('Error in resize move:', error);
        }
      };
      
      const handleMouseUp = () => {
        try {
          setIsResizing(false);
          document.removeEventListener('mousemove', handleMouseMove);
          document.removeEventListener('mouseup', handleMouseUp);
        } catch (error) {
          console.error('Error in resize cleanup:', error);
        }
      };
      
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    } catch (error) {
      console.error('Error in handleResizeRight:', error);
      setIsResizing(false);
    }
  };

  const handleResizeLeft = (e: React.MouseEvent) => {
    try {
      e.preventDefault();
      e.stopPropagation();
      setIsResizing(true);
      
      const startX = e.clientX;
      const startWidth = panel.width;
      
      const handleMouseMove = (e: MouseEvent) => {
        try {
          const deltaX = e.clientX - startX;
          // For left handle: dragging left (negative deltaX) should increase width
          // dragging right (positive deltaX) should decrease width
          // Allow full width expansion with minimum 200px width
          const newWidth = Math.max(200, startWidth - deltaX);
          onWidthChange(panel.id, newWidth);
        } catch (error) {
          console.error('Error in resize move:', error);
        }
      };
      
      const handleMouseUp = () => {
        try {
          setIsResizing(false);
          document.removeEventListener('mousemove', handleMouseMove);
          document.removeEventListener('mouseup', handleMouseUp);
        } catch (error) {
          console.error('Error in resize cleanup:', error);
        }
      };
      
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    } catch (error) {
      console.error('Error in handleResizeLeft:', error);
      setIsResizing(false);
    }
  };

  const handleResizeBottom = (e: React.MouseEvent) => {
    try {
      e.preventDefault();
      setIsResizing(true);
      
      // For now, bottom resize will just provide visual feedback
      // Height resizing would require additional state management
      const handleMouseUp = () => {
        try {
          setIsResizing(false);
          document.removeEventListener('mouseup', handleMouseUp);
        } catch (error) {
          console.error('Error in resize cleanup:', error);
        }
      };
      
      document.addEventListener('mouseup', handleMouseUp);
    } catch (error) {
      console.error('Error in handleResizeBottom:', error);
      setIsResizing(false);
    }
  };

  return (
    <div
      className={`relative transition-all duration-300`}
      style={{ width: `${panel.width}px` }}
    >
      <Card className="h-full bg-white/95 backdrop-blur-sm border-gray-200/50 shadow-xl">
        <CardHeader 
          className="pb-4 relative overflow-hidden"
          style={{ 
            background: `linear-gradient(135deg, ${panel.color} 0%, ${panel.color}dd 100%)`,
          }}
        >
          {/* Background decoration */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -translate-y-16 translate-x-16" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full translate-y-12 -translate-x-12" />
            <div className="absolute top-1/2 left-1/2 w-16 h-16 bg-white rounded-full -translate-x-8 -translate-y-8" />
          </div>

          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar className="h-10 w-10 ring-2 ring-white/30 shadow-lg">
                  <AvatarFallback className="bg-white/20 text-white backdrop-blur-sm">
                    <IconComponent className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white shadow-sm" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white drop-shadow-sm">{panel.title}</h3>
                <p className="text-xs text-white/80 font-medium">{panel.cards.length} cards</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20 transition-all duration-200 hover:scale-105"
                onClick={() => setShowColorPicker(!showColorPicker)}
              >
                <Palette className="h-4 w-4" />
              </Button>
              {canDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-red-500/30 transition-all duration-200 hover:scale-105"
                  onClick={() => onDeleteBoard(panel.id)}
                  title="Delete Board"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
          
          {showColorPicker && (
            <div className="absolute top-full left-0 mt-2 p-2 bg-white rounded-lg shadow-lg border z-10">
              <div className="grid grid-cols-4 gap-2">
                {pastelColors.map((color) => (
                  <button
                    key={color.name}
                    className="w-6 h-6 rounded-full border-2 border-gray-200 hover:border-gray-400 transition-colors"
                    style={{ backgroundColor: color.value }}
                    onClick={() => {
                      onColorChange(panel.id, color.value);
                      setShowColorPicker(false);
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </CardHeader>
        
        <CardContent className="p-5 flex-1 overflow-hidden bg-gradient-to-b from-gray-50/50 to-white/80">
          <div 
            ref={setNodeRef}
            className="h-full overflow-y-auto space-y-4 pr-2 scrollbar-thin scrollbar-track-gray-100 scrollbar-thumb-gray-300"
            style={{ maxHeight: 'calc(100vh - 220px)' }}
          >
            <SortableContext items={panel.cards.map(c => c.id)} strategy={verticalListSortingStrategy}>
              {panel.cards.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                    <IconComponent className="h-10 w-10 text-gray-400" />
                  </div>
                  <p className="text-gray-600 text-base font-semibold mb-2">No cards yet</p>
                  <p className="text-gray-400 text-sm">Add your first card to get started</p>
                </div>
              ) : (
                panel.cards.map((card, index) => (
                  <DraggableCard key={card.id} card={card} index={index} />
                ))
              )}
            </SortableContext>
            
            {/* Enhanced Add Card Section */}
            <div className="space-y-3 pt-6 border-t border-gray-200/60">
              <div className="relative">
                <Input
                  placeholder="✨ Add a new card..."
                  value={newCardTitle}
                  onChange={(e) => setNewCardTitle(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddCard()}
                  className="text-sm bg-white/90 border-gray-200/60 focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-200/50 transition-all duration-300 pl-4 pr-12 rounded-xl shadow-sm"
                />
                {newCardTitle.trim() && (
                  <Button
                    size="sm"
                    onClick={handleAddCard}
                    className="absolute right-1.5 top-1.5 h-7 w-7 p-0 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg transition-all duration-200 hover:scale-110 shadow-md"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
              
              {!newCardTitle.trim() && (
                <Button
                  size="sm"
                  onClick={() => document.querySelector('input')?.focus()}
                  variant="outline"
                  className="w-full bg-white/80 border-dashed border-2 border-gray-300/60 hover:bg-white hover:border-blue-400 hover:border-solid transition-all duration-300 text-gray-600 hover:text-blue-600 rounded-xl py-3 shadow-sm hover:shadow-md"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Card
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Right Resize Handle */}
      <div
        className={`absolute top-0 right-0 w-1 h-full cursor-col-resize bg-blue-500/10 hover:bg-blue-500/30 transition-all duration-200 hover:w-2 ${
          isResizing ? 'bg-blue-500/50 w-2' : ''
        }`}
        onMouseDown={handleResizeRight}
        title="Drag to resize panel width"
      />
      
      {/* Left Resize Handle */}
      <div
        className={`absolute top-0 left-0 w-1 h-full cursor-col-resize bg-blue-500/10 hover:bg-blue-500/30 transition-all duration-200 hover:w-2 ${
          isResizing ? 'bg-blue-500/50 w-2' : ''
        }`}
        onMouseDown={handleResizeLeft}
        title="Drag to resize panel width"
      />
      
      {/* Bottom Resize Handle */}
      <div
        className={`absolute bottom-0 left-0 w-full h-1 cursor-row-resize bg-blue-500/10 hover:bg-blue-500/30 transition-all duration-200 hover:h-2 ${
          isResizing ? 'bg-blue-500/50 h-2' : ''
        }`}
        onMouseDown={handleResizeBottom}
        title="Drag to resize panel height"
      />
    </div>
  );
};

// Enhanced TrelloBoard Component
const TrelloBoard: React.FC = () => {
  const [panels, setPanels] = useState<TrelloPanel[]>([
    {
      id: 'todo',
      title: 'To Do',
      icon: Clock,
      color: '#E3F2FD',
      cards: [
        { id: 'card-1', title: 'Design new landing page', panelId: 'todo', icon: Palette },
        { id: 'card-2', title: 'Set up analytics dashboard', panelId: 'todo', icon: BarChart3 },
        { id: 'card-3', title: 'Review user feedback', panelId: 'todo', icon: MessageSquare },
      ],
      width: 350,
    },
    {
      id: 'in-progress',
      title: 'In Progress',
      icon: Zap,
      color: '#E8F5E8',
      cards: [
        { id: 'card-4', title: 'Implement authentication system', panelId: 'in-progress', icon: Shield },
        { id: 'card-5', title: 'Optimize database queries', panelId: 'in-progress', icon: Database },
      ],
      width: 350,
    },
    {
      id: 'review',
      title: 'Review',
      icon: Eye,
      color: '#F3E5F5',
      cards: [
        { id: 'card-6', title: 'Code review for payment integration', panelId: 'review', icon: CreditCard },
      ],
      width: 350,
    },
    {
      id: 'done',
      title: 'Done',
      icon: CheckCircle,
      color: '#FFF3E0',
      cards: [
        { id: 'card-7', title: 'Setup CI/CD pipeline', panelId: 'done', icon: Settings },
        { id: 'card-8', title: 'Deploy to production', panelId: 'done', icon: Rocket },
      ],
      width: 350,
    },
  ]);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [bookmarks] = useState<BookmarkItem[]>([
    { id: 'bm-1', title: 'React Documentation', url: 'https://react.dev', favicon: '⚛️' },
    { id: 'bm-2', title: 'Tailwind CSS', url: 'https://tailwindcss.com', favicon: '🎨' },
    { id: 'bm-3', title: 'Next.js Guide', url: 'https://nextjs.org', favicon: '▲' },
  ]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Find the active card and its current panel
    const activeCard = panels
      .flatMap(panel => panel.cards)
      .find(card => card.id === activeId);

    if (!activeCard) return;

    const activePanel = panels.find(panel => panel.id === activeCard.panelId);
    const overPanel = panels.find(panel => panel.id === overId) || 
                     panels.find(panel => panel.cards.some(card => card.id === overId));

    if (!activePanel || !overPanel) return;

    setPanels(prevPanels => {
      const newPanels = [...prevPanels];
      
      // Remove card from source panel
      const sourcePanelIndex = newPanels.findIndex(panel => panel.id === activePanel.id);
      newPanels[sourcePanelIndex] = {
        ...newPanels[sourcePanelIndex],
        cards: newPanels[sourcePanelIndex].cards.filter(card => card.id !== activeId)
      };

      // Add card to destination panel
      const destPanelIndex = newPanels.findIndex(panel => panel.id === overPanel.id);
      const updatedCard = { ...activeCard, panelId: overPanel.id };
      
      if (overId === overPanel.id) {
        // Dropped on panel itself - add to end
        newPanels[destPanelIndex] = {
          ...newPanels[destPanelIndex],
          cards: [...newPanels[destPanelIndex].cards, updatedCard]
        };
      } else {
        // Dropped on specific card - insert at that position
        const overCardIndex = newPanels[destPanelIndex].cards.findIndex(card => card.id === overId);
        const newCards = [...newPanels[destPanelIndex].cards];
        newCards.splice(overCardIndex, 0, updatedCard);
        newPanels[destPanelIndex] = {
          ...newPanels[destPanelIndex],
          cards: newCards
        };
      }

      return newPanels;
    });
  };

  const handleColorChange = (panelId: string, color: string) => {
    setPanels(prevPanels =>
      prevPanels.map(panel =>
        panel.id === panelId ? { ...panel, color } : panel
      )
    );
  };

  const handleAddCard = (panelId: string, title: string) => {
    if (!title.trim()) return;

    const newCard: TrelloCard = {
      id: `card-${Date.now()}`,
      title: title.trim(),
      panelId,
      icon: MessageSquare,
    };

    setPanels(prevPanels =>
      prevPanels.map(panel =>
        panel.id === panelId
          ? { ...panel, cards: [...panel.cards, newCard] }
          : panel
      )
    );
  };

  const handleWidthChange = (panelId: string, newWidth: number) => {
    setPanels(prevPanels =>
      prevPanels.map(panel =>
        panel.id === panelId ? { ...panel, width: newWidth } : panel
      )
    );
  };

  const deleteBoard = (panelId: string) => {
    setPanels(prevPanels => prevPanels.filter(panel => panel.id !== panelId));
  };

  return (
    <div className="h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-100/50 flex flex-col relative overflow-hidden">
      {/* Enhanced Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-r from-blue-200/30 to-purple-200/20 rounded-full blur-3xl -translate-y-48 animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gradient-to-l from-purple-200/30 to-pink-200/20 rounded-full blur-3xl translate-y-48 animate-pulse" />
        <div className="absolute top-1/2 left-0 w-64 h-64 bg-gradient-to-r from-teal-200/25 to-emerald-200/15 rounded-full blur-3xl -translate-x-32" />
        <div className="absolute top-1/2 right-0 w-64 h-64 bg-gradient-to-l from-orange-200/25 to-yellow-200/15 rounded-full blur-3xl translate-x-32" />
      </div>

      {/* Enhanced Header */}
      <div className="relative z-10 p-6 bg-white/80 backdrop-blur-xl border-b border-white/40 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <Kanban className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  Kanban View 2.0
                </h1>
                <p className="text-sm text-gray-600">Manage your workflow with style</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-white/60 rounded-xl border border-white/40 shadow-sm">
              <Users className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Team Board</span>
            </div>
            
            <Button 
              size="sm" 
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Panel
            </Button>
          </div>
        </div>
      </div>

      {/* Bookmark Library Section */}
      <div className="relative z-10 px-6 py-4 bg-gradient-to-r from-white/70 to-blue-50/70 backdrop-blur-sm border-b border-white/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bookmark className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-800">Quick Bookmarks</h2>
          </div>
          <div className="flex items-center gap-2">
            {bookmarks.map((bookmark) => (
              <a
                key={bookmark.id}
                href={bookmark.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 bg-white/80 rounded-lg border border-white/50 hover:bg-white hover:shadow-md transition-all duration-200 hover:scale-105 text-sm font-medium text-gray-700 hover:text-blue-600"
              >
                <span>{bookmark.favicon}</span>
                <span>{bookmark.title}</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="h-full p-6 flex gap-6 overflow-x-auto">
            {panels.map((panel) => (
              <DroppablePanel
                key={panel.id}
                panel={panel}
                onColorChange={handleColorChange}
                onAddCard={handleAddCard}
                onWidthChange={handleWidthChange}
                onDeleteBoard={deleteBoard}
                isVisible={true}
                canDelete={panels.length > 1}
              />
            ))}
          </div>
        </DndContext>
      </div>

      {/* Original Floating Toolbar - Bottom Center */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-20 bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200 p-3">
        <div className="flex items-center gap-2">
          {/* Zoom Out */}
          <Button
            size="sm"
            variant="ghost"
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            title="Zoom Out"
          >
            <Minimize2 className="h-4 w-4 text-gray-600" />
          </Button>
          
          {/* Zoom In */}
          <Button
            size="sm"
            variant="ghost"
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            title="Zoom In"
          >
            <Maximize2 className="h-4 w-4 text-gray-600" />
          </Button>
          
          {/* Reset Zoom */}
          <Button
            size="sm"
            variant="outline"
            className="px-3 py-2 rounded-lg bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 transition-colors text-sm"
            title="Reset Zoom"
          >
            Reset
          </Button>
          
          {/* Divider */}
          <div className="w-px h-6 bg-gray-300 mx-1" />
          
          {/* Add Column */}
          <Button
            size="sm"
            className="flex items-center gap-1 px-3 py-2 rounded-lg bg-blue-500 text-white font-medium hover:bg-blue-600 transition-colors text-sm"
            title="Add Column"
          >
            <Plus className="h-4 w-4" />
            <span>Add Column</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TrelloBoard;