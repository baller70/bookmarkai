'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Settings, Edit2, Check, X, Crown, Users, User, GripVertical } from 'lucide-react';
// Using simplified folder type since we're working with categories
interface SimpleFolder {
  id: string;
  name: string;
  color?: string;
  bookmark_count?: number;
}
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  Active,
  Over,
  useDroppable,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export type HierarchyLevel = 'director' | 'teams' | 'collaborators';

export interface FolderHierarchyAssignment {
  folderId: string;
  level: HierarchyLevel;
  order: number;
}

export interface HierarchySection {
  id: HierarchyLevel;
  title: string;
  icon: React.ComponentType<any>;
  color: string;
  gradient: string;
}

interface FolderHierarchyManagerProps {
  folders: SimpleFolder[];
  assignments: FolderHierarchyAssignment[];
  onAssignmentsChange: (assignments: FolderHierarchyAssignment[]) => void;
  isOpen: boolean;
  onToggle: () => void;
}

// Sortable Folder Item Component
function SortableFolderItem({ folder, level, onAssignToLevel, showLevelSelector = false }: { 
  folder: SimpleFolder; 
  level: HierarchyLevel;
  onAssignToLevel?: (folderId: string, level: HierarchyLevel) => void;
  showLevelSelector?: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: folder.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const hierarchyLevels = [
    { id: 'director' as HierarchyLevel, title: 'DIRECTOR', icon: Crown },
    { id: 'teams' as HierarchyLevel, title: 'TEAMS', icon: Users },
    { id: 'collaborators' as HierarchyLevel, title: 'COLLABORATORS', icon: User },
  ];

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`
        flex items-center gap-3 p-3 rounded-lg border bg-white dark:bg-slate-800 
        cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md transition-all
        ${isDragging ? 'scale-105 z-50' : ''}
      `}
    >
      <GripVertical className="w-4 h-4 text-gray-400" />
      <div
        className="w-4 h-4 rounded-full"
        style={{ backgroundColor: folder.color || '#6b7280' }}
      />
      <span className="text-sm font-medium text-gray-900 dark:text-white">
        {folder.name}
      </span>
      <Badge variant="outline" className="text-xs">
        {(folder as any).bookmark_count || 0}
      </Badge>
      
      {showLevelSelector && onAssignToLevel && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="ml-auto text-xs">
              Assign Level
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {hierarchyLevels.map((hierarchyLevel) => (
              <DropdownMenuItem
                key={hierarchyLevel.id}
                onClick={() => onAssignToLevel(folder.id, hierarchyLevel.id)}
                className="flex items-center gap-2"
              >
                <hierarchyLevel.icon className="w-4 h-4" />
                {hierarchyLevel.title}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}

// Droppable Section Component
function DroppableSection({ 
  section, 
  folders, 
  isEditing, 
  onEditToggle, 
  onTitleChange, 
  editingTitle, 
  onEditingTitleChange 
}: {
  section: HierarchySection;
  folders: SimpleFolder[];
  isEditing: boolean;
  onEditToggle: () => void;
  onTitleChange: (newTitle: string) => void;
  editingTitle: string;
  onEditingTitleChange: (title: string) => void;
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: section.id,
  });

  const style = {
    backgroundColor: isOver ? 'rgba(59, 130, 246, 0.1)' : undefined,
    borderColor: isOver ? '#3b82f6' : undefined,
  };

  return (
    <Card className="mb-4" style={style}>
      <CardHeader className={`pb-3 ${section.gradient} text-white`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <section.icon className="w-5 h-5" />
            {isEditing ? (
              <div className="flex items-center gap-2">
                <Input
                  value={editingTitle}
                  onChange={(e) => onEditingTitleChange(e.target.value)}
                  className="text-white bg-white/20 border-white/30 placeholder-white/70 text-sm py-1 px-2 h-auto"
                  placeholder="Section title"
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onTitleChange(editingTitle)}
                  className="text-white hover:bg-white/20 p-1 h-auto"
                >
                  <Check className="w-3 h-3" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onEditToggle}
                  className="text-white hover:bg-white/20 p-1 h-auto"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ) : (
              <>
                <CardTitle className="text-sm font-bold tracking-wider">
                  {section.title}
                </CardTitle>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onEditToggle}
                  className="text-white hover:bg-white/20 p-1 h-auto ml-2"
                >
                  <Edit2 className="w-3 h-3" />
                </Button>
              </>
            )}
          </div>
          <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
            {folders.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent 
        ref={setNodeRef}
        className={`p-4 min-h-[120px] bg-gray-50/50 dark:bg-slate-900/50 transition-all duration-200 ${
          isOver ? 'bg-blue-50/80 border-blue-300' : ''
        }`}
      >
        {folders.length === 0 ? (
          <div className="flex items-center justify-center h-20 text-gray-500 dark:text-gray-400 text-sm">
            Drop folders here
          </div>
        ) : (
          <SortableContext items={folders.map(f => f.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {folders.map((folder) => (
                <SortableFolderItem key={folder.id} folder={folder} level={section.id} />
              ))}
            </div>
          </SortableContext>
        )}
      </CardContent>
    </Card>
  );
}

export function FolderHierarchyManager({
  folders,
  assignments,
  onAssignmentsChange,
  isOpen,
  onToggle,
}: FolderHierarchyManagerProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [hierarchySections, setHierarchySections] = useState<HierarchySection[]>([
    {
      id: 'director',
      title: 'DIRECTOR',
      icon: Crown,
      color: 'purple',
      gradient: 'bg-gradient-to-r from-purple-600 to-blue-600',
    },
    {
      id: 'teams',
      title: 'TEAMS',
      icon: Users,
      color: 'emerald',
      gradient: 'bg-gradient-to-r from-emerald-600 to-teal-600',
    },
    {
      id: 'collaborators',
      title: 'COLLABORATORS',
      icon: User,
      color: 'orange',
      gradient: 'bg-gradient-to-r from-orange-600 to-red-600',
    },
  ]);
  
  const [editingSectionId, setEditingSectionId] = useState<HierarchyLevel | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Get folders for each hierarchy level
  const getFoldersForLevel = (level: HierarchyLevel): SimpleFolder[] => {
    const assignedFolderIds = assignments
      .filter(a => a.level === level)
      .sort((a, b) => a.order - b.order)
      .map(a => a.folderId);
    
    return assignedFolderIds
      .map(id => folders.find(f => f.id === id))
      .filter(Boolean) as SimpleFolder[];
  };

  // Get unassigned folders
  const getUnassignedFolders = (): SimpleFolder[] => {
    const assignedIds = new Set(assignments.map(a => a.folderId));
    return folders.filter(f => !assignedIds.has(f.id));
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Check if dropping on a section
    const targetLevel = hierarchySections.find(s => s.id === overId)?.id;
    if (targetLevel) {
      // Remove from current assignment
      const newAssignments = assignments.filter(a => a.folderId !== activeId);
      
      // Add to new level
      const existingInLevel = newAssignments.filter(a => a.level === targetLevel);
      const newOrder = Math.max(0, ...existingInLevel.map(a => a.order), -1) + 1;
      
      newAssignments.push({
        folderId: activeId,
        level: targetLevel,
        order: newOrder,
      });
      
      onAssignmentsChange(newAssignments);
      return;
    }

    // Handle reordering within same level
    const activeAssignment = assignments.find(a => a.folderId === activeId);
    const overAssignment = assignments.find(a => a.folderId === overId);
    
    if (activeAssignment && overAssignment && activeAssignment.level === overAssignment.level) {
      const level = activeAssignment.level;
      const levelAssignments = assignments.filter(a => a.level === level);
      const oldIndex = levelAssignments.findIndex(a => a.folderId === activeId);
      const newIndex = levelAssignments.findIndex(a => a.folderId === overId);
      
      const reorderedAssignments = arrayMove(levelAssignments, oldIndex, newIndex);
      
      // Update orders
      const updatedLevelAssignments = reorderedAssignments.map((assignment, index) => ({
        ...assignment,
        order: index,
      }));
      
      // Replace assignments for this level
      const otherLevelAssignments = assignments.filter(a => a.level !== level);
      onAssignmentsChange([...otherLevelAssignments, ...updatedLevelAssignments]);
    }
  };

  const handleSectionEdit = (sectionId: HierarchyLevel) => {
    const section = hierarchySections.find(s => s.id === sectionId);
    if (section) {
      setEditingSectionId(sectionId);
      setEditingTitle(section.title);
    }
  };

  const handleSectionTitleChange = (sectionId: HierarchyLevel, newTitle: string) => {
    setHierarchySections(prev => 
      prev.map(section => 
        section.id === sectionId 
          ? { ...section, title: newTitle }
          : section
      )
    );
    setEditingSectionId(null);
    setEditingTitle('');
  };

  const handleAssignToLevel = (folderId: string, level: HierarchyLevel) => {
    // Remove from current assignment if exists
    const newAssignments = assignments.filter(a => a.folderId !== folderId);
    
    // Add to new level
    const existingInLevel = newAssignments.filter(a => a.level === level);
    const newOrder = Math.max(0, ...existingInLevel.map(a => a.order), -1) + 1;
    
    newAssignments.push({
      folderId,
      level,
      order: newOrder,
    });
    
    onAssignmentsChange(newAssignments);
  };

  const activeFolder = activeId ? folders.find(f => f.id === activeId) : null;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Settings className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Hierarchy Management
              </h2>
            </div>
            <Button onClick={onToggle} variant="outline">
              Close
            </Button>
          </div>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Hierarchy Sections */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Organizational Levels
                </h3>
                {hierarchySections.map((section) => (
                  <SortableContext 
                    key={section.id} 
                    items={[section.id, ...getFoldersForLevel(section.id).map(f => f.id)]}
                    strategy={verticalListSortingStrategy}
                  >
                    <div
                      data-id={section.id}
                      className="min-h-[140px] border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-1"
                    >
                      <DroppableSection
                        section={section}
                        folders={getFoldersForLevel(section.id)}
                        isEditing={editingSectionId === section.id}
                        onEditToggle={() => handleSectionEdit(section.id)}
                        onTitleChange={(title) => handleSectionTitleChange(section.id, title)}
                        editingTitle={editingTitle}
                        onEditingTitleChange={setEditingTitle}
                      />
                    </div>
                  </SortableContext>
                ))}
              </div>

              {/* Unassigned Folders */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Unassigned Folders
                </h3>
                <Card>
                  <CardContent className="p-4 min-h-[400px]">
                    {getUnassignedFolders().length === 0 ? (
                      <div className="flex items-center justify-center h-40 text-gray-500 dark:text-gray-400">
                        All folders are assigned
                      </div>
                    ) : (
                      <SortableContext 
                        items={getUnassignedFolders().map(f => f.id)} 
                        strategy={verticalListSortingStrategy}
                      >
                        <div className="space-y-2">
                          {getUnassignedFolders().map((folder) => (
                            <SortableFolderItem 
                              key={folder.id} 
                              folder={folder} 
                              level={'teams' as HierarchyLevel}
                              onAssignToLevel={handleAssignToLevel}
                              showLevelSelector={true}
                            />
                          ))}
                        </div>
                      </SortableContext>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>

            <DragOverlay>
              {activeFolder ? (
                <div className="flex items-center gap-3 p-3 rounded-lg border bg-white dark:bg-slate-800 shadow-lg">
                  <GripVertical className="w-4 h-4 text-gray-400" />
                                     <div
                     className="w-4 h-4 rounded-full"
                     style={{ backgroundColor: activeFolder.color || '#6b7280' }}
                   />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {activeFolder.name}
                  </span>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>

          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Instructions:</strong> Use the "Assign Level" dropdown on unassigned folders to choose their hierarchy level, 
              or drag folders between sections to organize your hierarchy. 
              Click the edit icon to rename section titles. Folders in higher levels will appear above 
              those in lower levels in the organizational chart.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 