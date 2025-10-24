'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { 
  Plus, 
  List,
  Clock,
  CheckCircle2,
  Circle,
  Edit3,
  Trash2,
  Users,
  Play
} from 'lucide-react';
import { Task, TaskList, ListCreationData } from '../types';

interface ListManagerProps {
  tasks: Task[];
  taskLists: TaskList[];
  currentList?: TaskList;
  createList: (listData: ListCreationData) => Promise<TaskList>;
  updateList: (listId: string, updates: Partial<TaskList>) => Promise<void>;
  deleteList: (listId: string) => Promise<void>;
  setActiveList: (listId: string) => void;
  getTasksForList: (listId: string) => Task[];
  selectTask: (task: Task) => void;
  startTimer: () => void;
}

const LIST_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Yellow
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#F97316', // Orange
  '#06B6D4', // Cyan
  '#84CC16'  // Lime
];

export default function ListManager({
  tasks,
  taskLists,
  currentList,
  createList,
  updateList,
  deleteList,
  setActiveList,
  getTasksForList,
  selectTask,
  startTimer
}: ListManagerProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingList, setEditingList] = useState<TaskList | null>(null);
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [newList, setNewList] = useState({
    name: '',
    description: '',
    color: LIST_COLORS[0]
  });
  const [editList, setEditList] = useState({
    name: '',
    description: '',
    color: LIST_COLORS[0],
    selectedTaskIds: [] as string[]
  });

  const availableTasks = tasks.filter(task => !task.isCompleted);
  const maxListSize = 5;

  const handleCreateList = async () => {
    if (!newList.name.trim() || selectedTasks.length === 0) return;

    try {
      await createList({
        name: newList.name,
        description: newList.description,
        color: newList.color,
        selectedTaskIds: selectedTasks
      });

      toast.success(`List "${newList.name}" created successfully with ${selectedTasks.length} tasks!`);

      // Reset form
      setNewList({ name: '', description: '', color: LIST_COLORS[0] });
      setSelectedTasks([]);
      setShowCreateForm(false);
    } catch (error) {
      console.error('Error creating list:', error);
      toast.error('Failed to create list. Please try again.');
    }
  };

  const handleTaskToggle = (taskId: string) => {
    setSelectedTasks(prev => {
      if (prev.includes(taskId)) {
        return prev.filter(id => id !== taskId);
      } else if (prev.length < maxListSize) {
        return [...prev, taskId];
      }
      return prev;
    });
  };

  const handleStartList = (list: TaskList) => {
    const listTasks = getTasksForList(list.id);
    const activeTasks = listTasks.filter(task => !task.isCompleted);
    
    if (activeTasks.length === 0) {
      toast.error('No active tasks in this list to start!');
      return;
    }

    // Set this list as active
    setActiveList(list.id);
    
    // Select the first active task
    const firstTask = activeTasks[0];
    selectTask(firstTask);
    
    // Start the timer
    startTimer();
    
    toast.success(`Started "${list.name}" with task: "${firstTask.title}"`, {
      description: `${activeTasks.length} tasks remaining in this list`
    });
  };

  const handleEditList = (list: TaskList) => {
    setEditingList(list);
    setEditList({
      name: list.name,
      description: list.description || '',
      color: list.color,
      selectedTaskIds: [...list.taskIds]
    });
    setShowCreateForm(false); // Close create form if open
  };

  const handleUpdateList = async () => {
    if (!editingList || !editList.name.trim()) return;

    try {
      await updateList(editingList.id, {
        name: editList.name,
        description: editList.description,
        color: editList.color,
        taskIds: editList.selectedTaskIds,
        updatedAt: new Date()
      });

      toast.success(`List "${editList.name}" updated successfully!`, {
        description: `${editList.selectedTaskIds.length} tasks in list`
      });

      // Reset edit form
      setEditingList(null);
      setEditList({
        name: '',
        description: '',
        color: LIST_COLORS[0],
        selectedTaskIds: []
      });
    } catch (error) {
      console.error('Error updating list:', error);
      toast.error('Failed to update list. Please try again.');
    }
  };

  const handleCancelEdit = () => {
    setEditingList(null);
    setEditList({
      name: '',
      description: '',
      color: LIST_COLORS[0],
      selectedTaskIds: []
    });
  };

  const handleEditTaskToggle = (taskId: string) => {
    setEditList(prev => ({
      ...prev,
      selectedTaskIds: prev.selectedTaskIds.includes(taskId)
        ? prev.selectedTaskIds.filter(id => id !== taskId)
        : prev.selectedTaskIds.length < maxListSize
        ? [...prev.selectedTaskIds, taskId]
        : prev.selectedTaskIds
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">LIST MANAGER</h2>
          <p className="text-gray-600">Create focused lists of 4-5 tasks for timer sessions</p>
        </div>
        <Button 
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="bg-blue-500 hover:bg-blue-600"
        >
          <Plus className="w-4 h-4 mr-2" />
          CREATE LIST
        </Button>
      </div>

      {/* Create List Form */}
      {showCreateForm && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle>CREATE NEW LIST</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  List Name *
                </label>
                <Input
                  value={newList.name}
                  onChange={(e) => setNewList(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Morning Focus, Project Alpha..."
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Color
                </label>
                <div className="flex space-x-2">
                  {LIST_COLORS.map(color => (
                    <button
                      key={color}
                      onClick={() => setNewList(prev => ({ ...prev, color }))}
                      className={`w-8 h-8 rounded-full border-2 ${
                        newList.color === color ? 'border-gray-400' : 'border-gray-200'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <Textarea
                value={newList.description}
                onChange={(e) => setNewList(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Optional description for this list..."
                rows={2}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Tasks ({selectedTasks.length}/{maxListSize})
              </label>
              <div className="max-h-64 overflow-y-auto border rounded-lg p-3 bg-white">
                {availableTasks.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">
                    No available tasks. Create some tasks first.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {availableTasks.map(task => (
                      <div
                        key={task.id}
                        className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                          selectedTasks.includes(task.id)
                            ? 'bg-blue-50 border-blue-200'
                            : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                        }`}
                        onClick={() => handleTaskToggle(task.id)}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                            selectedTasks.includes(task.id)
                              ? 'bg-blue-500 border-blue-500'
                              : 'border-gray-300'
                          }`}>
                            {selectedTasks.includes(task.id) && (
                              <CheckCircle2 className="w-3 h-3 text-white" />
                            )}
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">{task.title}</h4>
                            <div className="flex items-center space-x-2 text-sm text-gray-500">
                              <Clock className="w-3 h-3" />
                              <span>{task.estimatedPomodoros} pomodoros</span>
                              <Badge className={`text-xs ${
                                task.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                                task.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                                task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-green-100 text-green-800'
                              }`}>
                                {task.priority}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex space-x-3">
              <Button 
                onClick={handleCreateList} 
                className="bg-green-500 hover:bg-green-600"
                disabled={!newList.name.trim() || selectedTasks.length === 0}
              >
                <List className="w-4 h-4 mr-2" />
                CREATE LIST
              </Button>
              <Button 
                onClick={() => setShowCreateForm(false)}
                variant="outline"
              >
                CANCEL
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit List Form */}
      {editingList && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle>EDIT LIST: {editingList.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                List Name *
              </label>
              <Input
                value={editList.name}
                onChange={(e) => setEditList(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter list name..."
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description (Optional)
              </label>
              <Textarea
                value={editList.description}
                onChange={(e) => setEditList(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe this list..."
                className="w-full h-20 resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Color Theme
              </label>
              <div className="flex space-x-2">
                {LIST_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setEditList(prev => ({ ...prev, color }))}
                    className={`w-8 h-8 rounded-full border-2 ${
                      editList.color === color ? 'border-gray-800' : 'border-gray-300'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Tasks ({editList.selectedTaskIds.length}/{maxListSize})
              </label>
              <div className="max-h-48 overflow-y-auto space-y-2">
                {availableTasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => handleEditTaskToggle(task.id)}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      editList.selectedTaskIds.includes(task.id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    } ${
                      !editList.selectedTaskIds.includes(task.id) && 
                      editList.selectedTaskIds.length >= maxListSize
                        ? 'opacity-50 cursor-not-allowed'
                        : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{task.title}</h4>
                        <div className="flex items-center space-x-3 text-sm text-gray-600 mt-1">
                          <span>{task.category}</span>
                          <div className="flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>{task.estimatedPomodoros} pomodoros</span>
                            <Badge className={`text-xs ${
                              task.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                              task.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                              task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {task.priority}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      {editList.selectedTaskIds.includes(task.id) && (
                        <CheckCircle2 className="w-5 h-5 text-blue-500" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex space-x-3">
              <Button 
                onClick={handleUpdateList} 
                className="bg-orange-500 hover:bg-orange-600"
                disabled={!editList.name.trim() || editList.selectedTaskIds.length === 0}
              >
                <Edit3 className="w-4 h-4 mr-2" />
                UPDATE LIST
              </Button>
              <Button 
                onClick={handleCancelEdit}
                variant="outline"
              >
                CANCEL
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Existing Lists */}
      {taskLists.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Your Task Lists</h3>
          <div className="grid gap-4">
            {taskLists.map((list) => {
              const listTasks = getTasksForList(list.id);
              const completedTasks = listTasks.filter(task => task.isCompleted).length;
              const progress = listTasks.length > 0 ? (completedTasks / listTasks.length) * 100 : 0;

              return (
                <Card key={list.id} className="border-l-4" style={{ borderLeftColor: list.color }}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <div 
                            className="w-4 h-4 rounded-full flex-shrink-0"
                            style={{ backgroundColor: list.color }}
                          />
                          <h4 className="font-semibold text-lg text-gray-900">{list.name}</h4>
                          <Badge variant="outline" className="text-xs">
                            {listTasks.length} tasks
                          </Badge>
                        </div>
                        {list.description && (
                          <p className="text-gray-600 text-sm mb-3">{list.description}</p>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          onClick={() => handleStartList(list)}
                          className="bg-green-500 hover:bg-green-600 text-white"
                        >
                          <Play className="w-4 h-4 mr-1" />
                          START
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setActiveList(list.id)}
                          className={currentList?.id === list.id ? 'bg-blue-100 border-blue-300' : ''}
                        >
                          {currentList?.id === list.id ? 'ACTIVE' : 'SET ACTIVE'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditList(list)}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        >
                          <Edit3 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            try {
                              await deleteList(list.id);
                              toast.success(`List "${list.name}" deleted successfully`);
                            } catch (error) {
                              console.error('Error deleting list:', error);
                              toast.error('Failed to delete list. Please try again.');
                            }
                          }}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-3">
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>Progress</span>
                        <span>{completedTasks}/{listTasks.length} completed ({Math.round(progress)}%)</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="h-2 rounded-full transition-all duration-300"
                          style={{ 
                            width: `${progress}%`,
                            backgroundColor: list.color 
                          }}
                        />
                      </div>
                    </div>

                    {/* Task Preview */}
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-gray-700">Tasks in this list:</div>
                      <div className="grid gap-2 max-h-40 overflow-y-auto">
                        {listTasks.map((task) => (
                          <div key={task.id} className="flex items-center space-x-2 p-2 bg-gray-50 rounded text-sm">
                            {task.isCompleted ? (
                              <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                            ) : (
                              <Circle className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            )}
                            <span className={`flex-1 ${task.isCompleted ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                              {task.title}
                            </span>
                            <div className="flex items-center space-x-2 text-xs text-gray-500">
                              <Clock className="w-3 h-3" />
                              <span>{task.estimatedPomodoros}p</span>
                              {task.duration && (
                                <>
                                  <span>•</span>
                                  <span>
                                    {task.duration < 60 
                                      ? `${task.duration}m` 
                                      : `${Math.floor(task.duration / 60)}h ${task.duration % 60 > 0 ? `${task.duration % 60}m` : ''}`
                                    }
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {taskLists.length === 0 && !showCreateForm && (
        <Card className="border-dashed border-2 border-gray-300">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <List className="w-12 h-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Lists Created</h3>
            <p className="text-gray-600 text-center mb-4">
              Create your first focused task list to get started with organized pomodoro sessions.
            </p>
            <Button 
              onClick={() => setShowCreateForm(true)}
              className="bg-blue-500 hover:bg-blue-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              CREATE YOUR FIRST LIST
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 