'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './dialog';
import { Button } from './button';
import { Input } from './input';
import { Textarea } from './textarea';
import { Label } from './label';

// Define the Folder type since we need it for the component
export interface Folder {
  id: string;
  name: string;
  description?: string;
  color?: string;
  created_at?: string;
  updated_at?: string;
  reminder_at?: string;
  deadline_date?: string;
  goal_type?: string;
  goal_description?: string;
  goal_status?: string;
  goal_priority?: string;
  goal_progress?: number;
  goal_notes?: string;
}

interface FolderFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folder?: Folder | null;
  onSubmit: (data: { name: string; description?: string; color?: string; reminder_at?: string | null }) => void;
}

const predefinedColors = [
  '#3b82f6', // Blue
  '#ef4444', // Red
  '#10b981', // Green
  '#f59e0b', // Yellow
  '#8b5cf6', // Purple
  '#f97316', // Orange
  '#06b6d4', // Cyan
  '#84cc16', // Lime
  '#ec4899', // Pink
  '#6b7280', // Gray
];

export function FolderFormDialog({
  open,
  onOpenChange,
  folder,
  onSubmit,
}: FolderFormDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#3b82f6',
    reminder_at: folder?.reminder_at ? folder.reminder_at.split('T')[0] : ''
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (folder) {
      setFormData({
        name: folder.name,
        description: folder.description || '',
        color: folder.color || '#3b82f6',
        reminder_at: folder.reminder_at ? folder.reminder_at.split('T')[0] : ''
      });
    } else {
      setFormData({
        name: '',
        description: '',
        color: '#3b82f6',
        reminder_at: ''
      });
    }
    setErrors({});
  }, [folder, open]);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Folder name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    onSubmit({
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      color: formData.color,
      reminder_at: formData.reminder_at ? new Date(formData.reminder_at).toISOString() : null
    });
    
    onOpenChange(false);
  };

  const isEditing = !!folder;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Folder' : 'Create New Folder'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name Field */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Folder Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              type="text"
              placeholder="Enter folder name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name}</p>
            )}
          </div>

          {/* Description Field */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              placeholder="Enter folder description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="resize-none"
            />
          </div>

          {/* Deadline & Goal Section */}
          <div className="space-y-4 border-t border-gray-200 dark:border-gray-700 pt-6 mt-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Deadline & Goal</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Deadline Date */}
              <div>
                <Label htmlFor="folder-deadline-date">Deadline Date</Label>
                <input
                  id="folder-deadline-date"
                  type="date"
                  className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  value={folder?.deadline_date ? new Date(folder.deadline_date).toISOString().split('T')[0] : ''}
                  readOnly
                />
              </div>
              {/* Goal Type */}
              <div>
                <Label htmlFor="folder-goal-type">Goal Type</Label>
                <select
                  id="folder-goal-type"
                  className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  value={folder?.goal_type || ''}
                  onChange={() => {}} // Read-only, no-op handler
                  disabled
                >
                  <option value="">Select type</option>
                  <option value="organize">Organize</option>
                  <option value="complete_all">Complete All</option>
                  <option value="review_all">Review All</option>
                  <option value="learn_category">Learn Category</option>
                  <option value="research_topic">Research Topic</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
              {/* Goal Description */}
              <div className="md:col-span-2">
                <Label htmlFor="folder-goal-description">Goal Description</Label>
                <Textarea
                  id="folder-goal-description"
                  className="w-full mt-1"
                  value={folder?.goal_description || ''}
                  onChange={() => {}} // Read-only, no-op handler
                  readOnly
                />
              </div>
              {/* Goal Status */}
              <div>
                <Label htmlFor="folder-goal-status">Goal Status</Label>
                <select
                  id="folder-goal-status"
                  className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  value={folder?.goal_status || ''}
                  onChange={() => {}} // Read-only, no-op handler
                  disabled
                >
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="overdue">Overdue</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              {/* Goal Priority */}
              <div>
                <Label htmlFor="folder-goal-priority">Goal Priority</Label>
                <select
                  id="folder-goal-priority"
                  className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  value={folder?.goal_priority || ''}
                  onChange={() => {}} // Read-only, no-op handler
                  disabled
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              {/* Goal Progress */}
              <div>
                <Label htmlFor="folder-goal-progress">Goal Progress (%)</Label>
                <input
                  id="folder-goal-progress"
                  type="number"
                  min={0}
                  max={100}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  value={folder?.goal_progress ?? 0}
                  readOnly
                />
              </div>
              {/* Goal Notes */}
              <div className="md:col-span-2">
                <Label htmlFor="folder-goal-notes">Goal Notes</Label>
                <Textarea
                  id="folder-goal-notes"
                  className="w-full mt-1"
                  value={folder?.goal_notes || ''}
                  onChange={() => {}} // Read-only, no-op handler
                  readOnly
                />
              </div>
            </div>
          </div>

          {/* Color Picker */}
          <div className="space-y-2">
            <Label>Folder Color</Label>
            <div className="flex flex-wrap gap-2">
              {predefinedColors.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={`
                    w-8 h-8 rounded-full border-2 transition-all duration-200
                    ${formData.color === color 
                      ? 'border-gray-900 dark:border-white scale-110' 
                      : 'border-gray-300 dark:border-gray-600 hover:scale-105'
                    }
                  `}
                  style={{ backgroundColor: color }}
                  onClick={() => setFormData({ ...formData, color })}
                  title={`Select ${color}`}
                />
              ))}
            </div>
            
            {/* Custom Color Input */}
            <div className="flex items-center space-x-2 mt-3">
              <input
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="w-8 h-8 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
              />
              <Label className="text-sm text-gray-600 dark:text-gray-400">
                Or choose custom color
              </Label>
            </div>
          </div>

          {/* Preview */}
          <div className="space-y-2">
            <Label>Preview</Label>
            <div className="flex items-center space-x-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: formData.color }}
              >
                <svg
                  className="w-6 h-6"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  style={{ 
                    color: getContrastColor(formData.color)
                  }}
                >
                  <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  {formData.name || 'Folder Name'}
                </p>
                {formData.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {formData.description}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Reminder Input */}
          <div className="space-y-2">
            <Label htmlFor="reminder_at">Reminder</Label>
            <Input
              id="reminder_at"
              type="date"
              value={formData.reminder_at}
              onChange={e => setFormData({ ...formData, reminder_at: e.target.value })}
            />
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">
              {isEditing ? 'Update Folder' : 'Create Folder'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Helper function to determine text color based on background
function getContrastColor(hexColor: string): string {
  // Convert hex to RGB
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);
  
  // Calculate relative luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  return luminance > 0.5 ? '#000000' : '#ffffff';
} 