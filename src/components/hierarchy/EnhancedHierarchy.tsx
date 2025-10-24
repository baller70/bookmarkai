'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '../ui/dropdown-menu';
import { 
  Settings, 
  Edit2, 
  Check, 
  X, 
  Crown, 
  Users, 
  User, 
  GripVertical, 
  Plus,
  Trash2,
  MoreHorizontal,
  Target,
  Star,
  Building,
  Lightbulb,
  Zap,
  Briefcase,
  Shield,
  Globe,
  Rocket,
  Heart,
  Trophy,
  Diamond,
  Flame,
  Leaf,
  Mountain,
  Sun,
  Moon,
  Coffee,
  Palette
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  useDroppable,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Types
export type HierarchyLevel = string;

export interface FolderHierarchyAssignment {
  folderId: string;
  level: HierarchyLevel;
  order: number;
}

export interface SimpleFolder {
  id: string;
  name: string;
  color?: string;
  created_at?: string;
}

export interface HierarchySection {
  id: HierarchyLevel;
  title: string;
  // Prefer iconName (string) and derive the icon component internally. "icon" kept optional for backward compatibility.
  iconName?: string;
  icon?: React.ComponentType<any>;
  color: string;
  // Optional; when missing, derive from color
  gradient?: string;
}

interface FolderHierarchyManagerProps {
  folders: SimpleFolder[];
  assignments: FolderHierarchyAssignment[];
  onAssignmentsChange: (assignments: FolderHierarchyAssignment[]) => void;
  hierarchySections?: HierarchySection[];
  onHierarchySectionsChange?: (sections: HierarchySection[]) => void;
  isOpen: boolean;
  onToggle: () => void;
}

// Available icons for hierarchy sections
const availableIcons = [
  { name: 'Crown', icon: Crown, color: 'purple' },
  { name: 'Users', icon: Users, color: 'emerald' },
  { name: 'User', icon: User, color: 'orange' },
  { name: 'Target', icon: Target, color: 'blue' },
  { name: 'Star', icon: Star, color: 'yellow' },
  { name: 'Building', icon: Building, color: 'gray' },
  { name: 'Lightbulb', icon: Lightbulb, color: 'amber' },
  { name: 'Zap', icon: Zap, color: 'indigo' },
  { name: 'Briefcase', icon: Briefcase, color: 'slate' },
  { name: 'Shield', icon: Shield, color: 'green' },
  { name: 'Globe', icon: Globe, color: 'cyan' },
  { name: 'Rocket', icon: Rocket, color: 'red' },
  { name: 'Heart', icon: Heart, color: 'pink' },
  { name: 'Trophy', icon: Trophy, color: 'gold' },
  { name: 'Diamond', icon: Diamond, color: 'violet' },
  { name: 'Flame', icon: Flame, color: 'orange' },
  { name: 'Leaf', icon: Leaf, color: 'lime' },
  { name: 'Mountain', icon: Mountain, color: 'stone' },
  { name: 'Sun', icon: Sun, color: 'yellow' },
  { name: 'Moon', icon: Moon, color: 'slate' },
  { name: 'Coffee', icon: Coffee, color: 'amber' },
  { name: 'Palette', icon: Palette, color: 'rose' }
];

// Color gradients for sections
const colorGradients = {
  purple: 'bg-gradient-to-r from-purple-600 to-blue-600',
  emerald: 'bg-gradient-to-r from-emerald-600 to-teal-600',
  orange: 'bg-gradient-to-r from-orange-600 to-red-600',
  blue: 'bg-gradient-to-r from-blue-600 to-indigo-600',
  yellow: 'bg-gradient-to-r from-yellow-500 to-orange-500',
  gray: 'bg-gradient-to-r from-gray-600 to-slate-600',
  amber: 'bg-gradient-to-r from-amber-500 to-yellow-500',
  indigo: 'bg-gradient-to-r from-indigo-600 to-purple-600',
  slate: 'bg-gradient-to-r from-slate-600 to-gray-600',
  green: 'bg-gradient-to-r from-green-600 to-emerald-600',
  cyan: 'bg-gradient-to-r from-cyan-600 to-blue-600',
  red: 'bg-gradient-to-r from-red-600 to-pink-600',
  pink: 'bg-gradient-to-r from-pink-600 to-rose-600',
  gold: 'bg-gradient-to-r from-yellow-600 to-amber-600',
  violet: 'bg-gradient-to-r from-violet-600 to-purple-600',
  lime: 'bg-gradient-to-r from-lime-600 to-green-600',
  stone: 'bg-gradient-to-r from-stone-600 to-gray-600',
  rose: 'bg-gradient-to-r from-rose-600 to-pink-600',
};

// Enhanced Sortable Folder Item Component
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={`group relative ${isDragging ? 'z-50' : ''}`}
    >
      <Card className="hover:shadow-lg transition-all duration-300 border-l-4 hover:scale-[1.02] bg-gradient-to-r from-white to-gray-50/50"
            style={{ borderLeftColor: folder.color || '#6b7280' }}>
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            {/* Drag Handle */}
            <div {...listeners} className="cursor-grab hover:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity">
              <GripVertical className="h-4 w-4 text-gray-400 hover:text-gray-600" />
            </div>

            {/* Folder Avatar */}
            <Avatar className="h-10 w-10 border-2 border-white shadow-sm" style={{ borderColor: folder.color || '#6b7280' }}>
              <AvatarFallback 
                className="text-white font-semibold text-sm"
                style={{ backgroundColor: folder.color || '#6b7280' }}
              >
                {folder.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            {/* Folder Info */}
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-gray-900 truncate">{folder.name}</h4>
              <div className="flex items-center space-x-2 mt-1">
                <Badge variant="secondary" className="text-xs">
                  Level: {level.toUpperCase()}
                </Badge>
                {folder.created_at && (
                  <span className="text-xs text-gray-500">
                    Created {new Date(folder.created_at).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => {
                    console.log('Edit folder:', folder.name);
                    alert(`Edit folder: ${folder.name}`);
                  }}>
                    <Edit2 className="h-4 w-4 mr-2" />
                    Edit Folder
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => {
                    console.log('Configure folder:', folder.name);
                    alert(`Configure folder: ${folder.name}`);
                  }}>
                    <Settings className="h-4 w-4 mr-2" />
                    Configure
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-red-600"
                    onClick={() => {
                      console.log('Remove folder:', folder.name);
                      if (confirm(`Are you sure you want to remove ${folder.name}?`)) {
                        alert(`Remove folder: ${folder.name}`);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remove
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Progress indicator (optional) */}
          <div className="mt-3 space-y-1">
            <div className="flex justify-between items-center text-xs text-gray-500">
              <span>Progress</span>
              <span>75%</span>
            </div>
            <Progress value={75} className="h-1" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Enhanced Droppable Section Component
function DroppableSection({ 
  section, 
  folders, 
  isEditing, 
  onEditToggle, 
  onTitleChange, 
  editingTitle, 
  onEditingTitleChange,
  onDeleteSection 
}: {
  section: HierarchySection;
  folders: SimpleFolder[];
  isEditing: boolean;
  onEditToggle: () => void;
  onTitleChange: (newTitle: string) => void;
  editingTitle: string;
  onEditingTitleChange: (title: string) => void;
  onDeleteSection: (sectionId: HierarchyLevel) => void;
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: section.id,
  });

  // Resolve icon component and gradient class from provided data (iconName/icon, color)
  const resolveIcon = (sec: HierarchySection) => {
    if (sec.icon) return sec.icon;
    const iconKey = (sec as any).iconName || (typeof (sec as any).icon === 'string' ? (sec as any).icon : undefined);
    if (iconKey) {
      const match = availableIcons.find(i => i.name === iconKey);
      if (match) return match.icon;
    }
    return Users;
  };
  const resolveGradient = (sec: HierarchySection) => {
    if (sec.gradient) return sec.gradient;
    const key = sec.color as keyof typeof colorGradients;
    return colorGradients[key] || colorGradients.gray;
  };

  const IconComponent = resolveIcon(section);
  const headerGradient = resolveGradient(section);

  return (
    <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300">
      <CardHeader className={`${headerGradient} text-white relative`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <IconComponent className="h-5 w-5" />
            </div>
            <div className="flex-1">
              {isEditing ? (
                <div className="flex items-center space-x-2">
                  <Input
                    value={editingTitle}
                    onChange={(e) => onEditingTitleChange(e.target.value)}
                    className="bg-white/20 border-white/30 text-white placeholder:text-white/70"
                    placeholder="Section title..."
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onTitleChange(editingTitle)}
                    className="text-white hover:bg-white/20"
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={onEditToggle}
                    className="text-white hover:bg-white/20"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <CardTitle className="text-lg font-bold">{section.title}</CardTitle>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
              {folders.length} {folders.length === 1 ? 'folder' : 'folders'}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onEditToggle}>
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit Title
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  console.log('Configure section:', section.title);
                  alert(`Configure section: ${section.title}`);
                }}>
                  <Settings className="h-4 w-4 mr-2" />
                  Configure
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onDeleteSection(section.id)}
                  className="text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Section
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      
      <CardContent 
        ref={setNodeRef}
        className={`p-6 min-h-[140px] bg-gradient-to-br from-gray-50/50 to-white transition-all duration-200 ${
          isOver ? 'bg-blue-50/80 border-blue-300 shadow-inner' : ''
        }`}
      >
        {folders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-24 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
            <div className="text-center">
              <div className="mb-2">
                <IconComponent className="h-8 w-8 mx-auto text-gray-400" />
              </div>
              <p className="text-sm font-medium">No folders assigned</p>
              <p className="text-xs">Drag folders here to organize</p>
            </div>
          </div>
        ) : (
          <SortableContext items={folders.map(f => f.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
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

// Add Section Dialog
function AddSectionDialog({ 
  isOpen, 
  onOpenChange, 
  onAddSection 
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onAddSection: (section: Omit<HierarchySection, 'id'>) => void;
}) {
  const [title, setTitle] = useState('');
  const [selectedIcon, setSelectedIcon] = useState(availableIcons[0]);

  const handleSubmit = () => {
    if (title.trim()) {
      onAddSection({
        title: title.trim().toUpperCase(),
        icon: selectedIcon.icon,
        color: selectedIcon.color,
        gradient: colorGradients[selectedIcon.color as keyof typeof colorGradients] || colorGradients.gray,
      });
      setTitle('');
      setSelectedIcon(availableIcons[0]);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Section</DialogTitle>
          <DialogDescription>
            Create a new hierarchy section to organize your folders.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Section Title</Label>
            <Input
              id="title"
              placeholder="e.g., MANAGERS, CLIENTS, PROJECTS"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="icon">Icon & Color</Label>
            <Select value={selectedIcon.name} onValueChange={(value) => {
              const icon = availableIcons.find(i => i.name === value);
              if (icon) setSelectedIcon(icon);
            }}>
              <SelectTrigger>
                <SelectValue>
                  <div className="flex items-center space-x-2">
                    <selectedIcon.icon className="h-4 w-4" />
                    <span>{selectedIcon.name}</span>
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {availableIcons.map((icon) => (
                  <SelectItem key={icon.name} value={icon.name}>
                    <div className="flex items-center space-x-2">
                      <icon.icon className="h-4 w-4" />
                      <span>{icon.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Preview */}
          <div className="space-y-2">
            <Label>Preview</Label>
            <div className={`p-3 rounded-lg ${colorGradients[selectedIcon.color as keyof typeof colorGradients]} text-white`}>
              <div className="flex items-center space-x-2">
                <selectedIcon.icon className="h-5 w-5" />
                <span className="font-bold">{title.toUpperCase() || 'SECTION TITLE'}</span>
              </div>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!title.trim()}>
            Add Section
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Default hierarchy sections
const defaultHierarchySections: HierarchySection[] = [
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
];

// Main Enhanced Folder Hierarchy Manager
export function EnhancedFolderHierarchyManager({
  folders,
  assignments,
  onAssignmentsChange,
  hierarchySections: propHierarchySections,
  onHierarchySectionsChange,
  isOpen,
  onToggle,
}: FolderHierarchyManagerProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  
  // Load hierarchy sections from localStorage or use defaults
  const [internalHierarchySections, setInternalHierarchySections] = useState<HierarchySection[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('hierarchy-sections');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.warn('Failed to parse saved hierarchy sections:', e);
        }
      }
    }
    return defaultHierarchySections;
  });

  // Use prop sections if provided, otherwise use internal state
  const hierarchySections = propHierarchySections || internalHierarchySections;
  const setHierarchySections = onHierarchySectionsChange || ((sections: HierarchySection[]) => {
    setInternalHierarchySections(sections);
    // Save to localStorage when using internal state
    if (typeof window !== 'undefined') {
      localStorage.setItem('hierarchy-sections', JSON.stringify(sections));
    }
  });
  
  const [editingSectionId, setEditingSectionId] = useState<HierarchyLevel | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [isAddSectionOpen, setIsAddSectionOpen] = useState(false);

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
    } else {
      // Reordering within the same level
      const activeAssignment = assignments.find(a => a.folderId === activeId);
      if (activeAssignment) {
        const levelAssignments = assignments.filter(a => a.level === activeAssignment.level);
        const otherLevelAssignments = assignments.filter(a => a.level !== activeAssignment.level);
        
        const oldIndex = levelAssignments.findIndex(a => a.folderId === activeId);
        const newIndex = levelAssignments.findIndex(a => a.folderId === overId);
        
        if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
          const reorderedAssignments = arrayMove(levelAssignments, oldIndex, newIndex);
          const updatedLevelAssignments = reorderedAssignments.map((assignment, index) => ({
            ...assignment,
            order: index,
          }));
          
          onAssignmentsChange([...otherLevelAssignments, ...updatedLevelAssignments]);
        }
      }
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
    const updatedSections = hierarchySections.map(section => 
      section.id === sectionId 
        ? { ...section, title: newTitle.toUpperCase() }
        : section
    );
    
    setHierarchySections(updatedSections);
    setEditingSectionId(null);
    setEditingTitle('');
    
    // Show success feedback
    console.log(`Hierarchy section "${sectionId}" title updated to "${newTitle.toUpperCase()}"`);
  };

  const handleAddSection = (sectionData: Omit<HierarchySection, 'id'>) => {
    const newId = `section_${Date.now()}`;
    const newSection: HierarchySection = {
      ...sectionData,
      id: newId,
    };
    const updatedSections = [...hierarchySections, newSection];
    setHierarchySections(updatedSections);
    console.log(`New hierarchy section "${newSection.title}" added`);
  };

  const handleDeleteSection = (sectionId: HierarchyLevel) => {
    // Remove section
    const updatedSections = hierarchySections.filter(s => s.id !== sectionId);
    setHierarchySections(updatedSections);
    
    // Remove all assignments for this section
    const newAssignments = assignments.filter(a => a.level !== sectionId);
    onAssignmentsChange(newAssignments);
    
    console.log(`Hierarchy section "${sectionId}" deleted`);
  };

  const activeFolder = folders.find(f => f.id === activeId);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-7xl w-full max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Enhanced Hierarchy Manager</h2>
              <p className="text-blue-100 mt-1">Organize your folders into hierarchical levels</p>
            </div>
            <div className="flex items-center space-x-2">
              <Button 
                variant="ghost" 
                onClick={() => setIsAddSectionOpen(true)}
                className="text-white hover:bg-white/20"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Section
              </Button>
              <Button variant="ghost" onClick={onToggle} className="text-white hover:bg-white/20">
                <X className="h-6 w-6" />
              </Button>
            </div>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Hierarchy Sections */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-gray-900">
                    Organizational Levels
                  </h3>
                  <Badge variant="secondary">
                    {hierarchySections.length} {hierarchySections.length === 1 ? 'section' : 'sections'}
                  </Badge>
                </div>
                
                {hierarchySections.map((section) => (
                  <SortableContext 
                    key={section.id} 
                    items={[section.id, ...getFoldersForLevel(section.id).map(f => f.id)]}
                    strategy={verticalListSortingStrategy}
                  >
                    <DroppableSection
                      section={section}
                      folders={getFoldersForLevel(section.id)}
                      isEditing={editingSectionId === section.id}
                      onEditToggle={() => handleSectionEdit(section.id)}
                      onTitleChange={(newTitle) => handleSectionTitleChange(section.id, newTitle)}
                      editingTitle={editingTitle}
                      onEditingTitleChange={setEditingTitle}
                      onDeleteSection={handleDeleteSection}
                    />
                  </SortableContext>
                ))}
              </div>

              {/* Unassigned Folders */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-gray-900">
                    Unassigned Folders
                  </h3>
                  <Badge variant="outline">
                    {getUnassignedFolders().length} folders
                  </Badge>
                </div>
                
                <Card className="border-2 border-dashed">
                  <CardContent className="p-6 min-h-[400px]">
                    {getUnassignedFolders().length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-40 text-gray-500">
                        <Trophy className="h-12 w-12 text-gray-400 mb-3" />
                        <p className="text-lg font-medium">All folders are organized!</p>
                        <p className="text-sm">Every folder has been assigned to a hierarchy level.</p>
                      </div>
                    ) : (
                      <SortableContext 
                        items={getUnassignedFolders().map(f => f.id)} 
                        strategy={verticalListSortingStrategy}
                      >
                        <div className="space-y-3">
                          {getUnassignedFolders().map((folder) => (
                            <SortableFolderItem 
                              key={folder.id} 
                              folder={folder} 
                              level={'unassigned'}
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
                <Card className="shadow-2xl border-2 border-blue-300 bg-white scale-105">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <GripVertical className="h-4 w-4 text-gray-400" />
                      <Avatar className="h-10 w-10 border-2 border-white shadow-sm" style={{ borderColor: activeFolder.color || '#6b7280' }}>
                        <AvatarFallback 
                          className="text-white font-semibold text-sm"
                          style={{ backgroundColor: activeFolder.color || '#6b7280' }}
                        >
                          {activeFolder.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-semibold text-gray-900">{activeFolder.name}</h4>
                        <Badge variant="secondary" className="text-xs">
                          Moving...
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>
      </div>

      {/* Add Section Dialog */}
      <AddSectionDialog
        isOpen={isAddSectionOpen}
        onOpenChange={setIsAddSectionOpen}
        onAddSection={handleAddSection}
      />
    </div>
  );
}
