'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Play, 
  Pause, 
  Square, 
  RotateCcw, 
  SkipForward,
  Coffee,
  Zap,
  Clock,
  Target,
  CheckCircle2,
  Calendar,
  List,
  Plus,
  GripVertical,
  Trash2,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { Task, TaskList, ScheduledItem, ScheduleQueue } from '../types';

interface PomodoroTimerProps {
  timer: any;
  currentTask?: Task;
  startTimer: () => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  stopTimer: () => void;
  resetTimer: () => void;
  skipBreak: () => void;
  snoozeTimer: (duration: number) => void;
  canSnooze: boolean;
  snoozeCount: number;
  maxSnoozeCount: number;
  snoozeOptions: any[];
  tasks: Task[];
  taskLists: TaskList[];
  selectTask: (task: Task) => void;
  getTasksForList: (listId: string) => Task[];
}

export default function PomodoroTimer({
  timer,
  currentTask,
  startTimer,
  pauseTimer,
  resumeTimer,
  stopTimer,
  resetTimer,
  skipBreak,
  snoozeTimer,
  canSnooze,
  snoozeCount,
  maxSnoozeCount,
  snoozeOptions,
  tasks,
  taskLists,
  selectTask,
  getTasksForList
}: PomodoroTimerProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgress = () => {
    const totalTime = timer.duration * 60;
    const elapsed = totalTime - timer.remainingTime;
    return (elapsed / totalTime) * 100;
  };

  const getTimerColor = () => {
    switch (timer.type) {
      case 'work': return 'text-red-600';
      case 'shortBreak': return 'text-green-600';
      case 'longBreak': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  const getProgressColor = () => {
    switch (timer.type) {
      case 'work': return 'bg-red-500';
      case 'shortBreak': return 'bg-green-500';
      case 'longBreak': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const activeTasks = tasks.filter(task => !task.isCompleted);

  // Scheduling Queue State
  const [scheduleQueue, setScheduleQueue] = useState<ScheduledItem[]>([]);
  const [showScheduler, setShowScheduler] = useState(false);

  // Scheduling Functions
  const addTaskToSchedule = (task: Task) => {
    const newItem: ScheduledItem = {
      id: `schedule-${Date.now()}`,
      type: 'task',
      taskId: task.id,
      order: scheduleQueue.length,
      estimatedDuration: task.duration || task.estimatedPomodoros * 25,
      createdAt: new Date()
    };
    setScheduleQueue(prev => [...prev, newItem]);
  };

  const addListToSchedule = (list: TaskList) => {
    const listTasks = getTasksForList(list.id);
    const totalDuration = listTasks.reduce((sum, task) => 
      sum + (task.duration || task.estimatedPomodoros * 25), 0
    );
    
    const newItem: ScheduledItem = {
      id: `schedule-${Date.now()}`,
      type: 'list',
      listId: list.id,
      order: scheduleQueue.length,
      estimatedDuration: totalDuration,
      createdAt: new Date()
    };
    setScheduleQueue(prev => [...prev, newItem]);
  };

  const removeFromSchedule = (itemId: string) => {
    setScheduleQueue(prev => prev.filter(item => item.id !== itemId));
  };

  const moveScheduleItem = (itemId: string, direction: 'up' | 'down') => {
    setScheduleQueue(prev => {
      const items = [...prev];
      const index = items.findIndex(item => item.id === itemId);
      
      if (index === -1) return prev;
      
      const newIndex = direction === 'up' ? index - 1 : index + 1;
      
      if (newIndex < 0 || newIndex >= items.length) return prev;
      
      // Swap items
      [items[index], items[newIndex]] = [items[newIndex], items[index]];
      
      // Update order values
      items.forEach((item, idx) => {
        item.order = idx;
      });
      
      return items;
    });
  };

  const startScheduledSession = () => {
    if (scheduleQueue.length === 0) return;
    
    const firstItem = scheduleQueue[0];
    
    if (firstItem.type === 'task' && firstItem.taskId) {
      const task = tasks.find(t => t.id === firstItem.taskId);
      if (task) {
        selectTask(task);
        startTimer();
      }
    } else if (firstItem.type === 'list' && firstItem.listId) {
      const listTasks = getTasksForList(firstItem.listId);
      const firstActiveTask = listTasks.find(t => !t.isCompleted);
      if (firstActiveTask) {
        selectTask(firstActiveTask);
        startTimer();
      }
    }
  };

  const getScheduleItemDetails = (item: ScheduledItem) => {
    if (item.type === 'task' && item.taskId) {
      const task = tasks.find(t => t.id === item.taskId);
      return {
        title: task?.title || 'Unknown Task',
        subtitle: task?.category || '',
        color: 'bg-blue-100 text-blue-800'
      };
    } else if (item.type === 'list' && item.listId) {
      const list = taskLists.find(l => l.id === item.listId);
      const listTasks = getTasksForList(item.listId);
      return {
        title: list?.name || 'Unknown List',
        subtitle: `${listTasks.length} tasks`,
        color: 'bg-purple-100 text-purple-800'
      };
    }
    return { title: 'Unknown Item', subtitle: '', color: 'bg-gray-100 text-gray-800' };
  };

  return (
    <div className="space-y-6">
      {/* Main Timer Display */}
      <Card className="bg-gradient-to-br from-white to-gray-50 border-2">
        <CardContent className="p-8">
          <div className="text-center space-y-6">
            {/* Timer Type Badge */}
            <div className="flex items-center justify-center space-x-2">
              {timer.type === 'work' ? (
                <Zap className="w-6 h-6 text-red-500" />
              ) : (
                <Coffee className="w-6 h-6 text-green-500" />
              )}
              <Badge 
                variant="outline" 
                className={`text-lg px-4 py-2 ${
                  timer.type === 'work' ? 'border-red-200 text-red-700' : 'border-green-200 text-green-700'
                }`}
              >
                {timer.type === 'work' ? 'WORK SESSION' : 
                 timer.type === 'shortBreak' ? 'SHORT BREAK' : 'LONG BREAK'}
              </Badge>
            </div>

            {/* Current Task Title - Only show during work sessions */}
            {timer.type === 'work' && currentTask && (
              <div className="text-center space-y-2">
                <div className="text-sm text-gray-500 uppercase tracking-wide">CURRENT TASK</div>
                <div className="text-xl font-semibold text-gray-800 max-w-md mx-auto">
                  {currentTask.title}
                </div>
                {currentTask.description && (
                  <div className="text-sm text-gray-600 max-w-md mx-auto">
                    {currentTask.description}
                  </div>
                )}
                {currentTask.duration && (
                  <div className="text-sm text-blue-600 flex items-center justify-center space-x-1">
                    <Clock className="w-4 h-4" />
                    <span>
                      {currentTask.duration < 60 
                        ? `${currentTask.duration}m` 
                        : `${Math.floor(currentTask.duration / 60)}h ${currentTask.duration % 60 > 0 ? `${currentTask.duration % 60}m` : ''}`
                      }
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Time Display */}
            <div className={`text-8xl font-bold ${getTimerColor()}`}>
              {formatTime(timer.remainingTime)}
            </div>

            {/* Progress Bar */}
            <div className="w-full max-w-md mx-auto">
              <Progress 
                value={getProgress()} 
                className="h-3"
              />
              <div className="flex justify-between text-sm text-gray-500 mt-2">
                <span>0:00</span>
                <span>{formatTime(timer.duration * 60)}</span>
              </div>
            </div>

            {/* Session Counter */}
            <div className="text-gray-600">
              <span className="text-sm">Session </span>
              <span className="text-lg font-semibold">{timer.sessionCount + 1}</span>
            </div>
          </div>
        </CardContent>
      </Card>      {/* Timer Controls */}
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-center space-x-4">
            {!timer.isActive ? (
              <Button 
                onClick={startTimer}
                size="lg"
                className="bg-green-500 hover:bg-green-600 text-white px-8"
              >
                <Play className="w-5 h-5 mr-2" />
                START
              </Button>
            ) : timer.isPaused ? (
              <Button 
                onClick={resumeTimer}
                size="lg"
                className="bg-blue-500 hover:bg-blue-600 text-white px-8"
              >
                <Play className="w-5 h-5 mr-2" />
                RESUME
              </Button>
            ) : (
              <Button 
                onClick={pauseTimer}
                size="lg"
                className="bg-yellow-500 hover:bg-yellow-600 text-white px-8"
              >
                <Pause className="w-5 h-5 mr-2" />
                PAUSE
              </Button>
            )}

            <Button 
              onClick={stopTimer}
              variant="outline"
              size="lg"
              className="px-8"
            >
              <Square className="w-5 h-5 mr-2" />
              STOP
            </Button>

            <Button 
              onClick={resetTimer}
              variant="outline"
              size="lg"
              className="px-8"
            >
              <RotateCcw className="w-5 h-5 mr-2" />
              RESET
            </Button>

            {timer.type !== 'work' && (
              <Button 
                onClick={skipBreak}
                variant="outline"
                size="lg"
                className="px-8"
              >
                <SkipForward className="w-5 h-5 mr-2" />
                SKIP BREAK
              </Button>
            )}
          </div>

          {/* Snooze Options */}
          {canSnooze && timer.remainingTime <= 60 && (
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600 mb-3">
                Snooze timer ({snoozeCount}/{maxSnoozeCount} used)
              </p>
              <div className="flex justify-center space-x-2">
                {snoozeOptions.map((option) => (
                  <Button
                    key={option.id}
                    onClick={() => snoozeTimer(option.duration)}
                    variant="outline"
                    size="sm"
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>      {/* Current Task */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="w-5 h-5" />
            <span>CURRENT TASK</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {currentTask ? (
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{currentTask.title}</h3>
                  {currentTask.description && (
                    <p className="text-gray-600 mt-1">{currentTask.description}</p>
                  )}
                </div>
                <Badge className={`
                  ${currentTask.priority === 'urgent' ? 'bg-red-100 text-red-800' : ''}
                  ${currentTask.priority === 'high' ? 'bg-orange-100 text-orange-800' : ''}
                  ${currentTask.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' : ''}
                  ${currentTask.priority === 'low' ? 'bg-green-100 text-green-800' : ''}
                `}>
                  {currentTask.priority.toUpperCase()}
                </Badge>
              </div>
              
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span>Progress: {currentTask.completedPomodoros}/{currentTask.estimatedPomodoros} pomodoros</span>
                <span>Category: {currentTask.category}</span>
              </div>

              <Progress 
                value={(currentTask.completedPomodoros / currentTask.estimatedPomodoros) * 100}
                className="h-2"
              />
            </div>
          ) : (
            <div className="text-center py-8">
              <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">No task selected</p>
              {activeTasks.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-sm text-gray-500 mb-3">Quick select:</p>
                  {activeTasks.slice(0, 3).map((task) => (
                    <Button
                      key={task.id}
                      variant="outline"
                      size="sm"
                      onClick={() => selectTask(task)}
                      className="w-full text-left justify-start"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      {task.title}
                    </Button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">
                  Go to Tasks tab to create your first task
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Scheduling Queue */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="w-5 h-5" />
              <span>SCHEDULE QUEUE</span>
              {scheduleQueue.length > 0 && (
                <Badge variant="outline">{scheduleQueue.length}</Badge>
              )}
            </CardTitle>
            <Button
              onClick={() => setShowScheduler(!showScheduler)}
              variant="outline"
              size="sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              {showScheduler ? 'HIDE' : 'ADD ITEMS'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Add Items Section */}
          {showScheduler && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="space-y-4">
                {/* Add Tasks */}
                <div>
                  <h4 className="font-medium text-sm text-gray-700 mb-2">Add Tasks:</h4>
                  <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto">
                    {activeTasks.map((task) => (
                      <Button
                        key={task.id}
                        variant="outline"
                        size="sm"
                        onClick={() => addTaskToSchedule(task)}
                        className="justify-start text-left"
                        disabled={scheduleQueue.some(item => item.taskId === task.id)}
                      >
                        <Target className="w-4 h-4 mr-2" />
                        <div className="flex-1">
                          <div className="font-medium">{task.title}</div>
                          <div className="text-xs text-gray-500">
                            {task.duration ? `${task.duration}m` : `${task.estimatedPomodoros * 25}m`}
                          </div>
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Add Lists */}
                <div>
                  <h4 className="font-medium text-sm text-gray-700 mb-2">Add Lists:</h4>
                  <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto">
                    {taskLists.map((list) => {
                      const listTasks = getTasksForList(list.id);
                      const activeTasks = listTasks.filter(t => !t.isCompleted);
                      return (
                        <Button
                          key={list.id}
                          variant="outline"
                          size="sm"
                          onClick={() => addListToSchedule(list)}
                          className="justify-start text-left"
                          disabled={scheduleQueue.some(item => item.listId === list.id) || activeTasks.length === 0}
                        >
                          <List className="w-4 h-4 mr-2" />
                          <div className="flex-1">
                            <div className="font-medium">{list.name}</div>
                            <div className="text-xs text-gray-500">
                              {activeTasks.length} active tasks
                            </div>
                          </div>
                        </Button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Scheduled Items */}
          {scheduleQueue.length > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Total estimated time: {Math.round(scheduleQueue.reduce((sum, item) => sum + item.estimatedDuration, 0))} minutes
                </p>
                <Button
                  onClick={startScheduledSession}
                  className="bg-green-500 hover:bg-green-600"
                  size="sm"
                >
                  <Play className="w-4 h-4 mr-2" />
                  START QUEUE
                </Button>
              </div>

              <div className="space-y-2">
                {scheduleQueue.map((item, index) => {
                  const details = getScheduleItemDetails(item);
                  return (
                    <div
                      key={item.id}
                      className="flex items-center space-x-3 p-3 bg-white border rounded-lg"
                    >
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="text-xs">
                          #{index + 1}
                        </Badge>
                        <Badge className={details.color}>
                          {item.type.toUpperCase()}
                        </Badge>
                      </div>

                      <div className="flex-1">
                        <div className="font-medium text-sm">{details.title}</div>
                        <div className="text-xs text-gray-500">
                          {details.subtitle} • {item.estimatedDuration}m
                        </div>
                      </div>

                      <div className="flex items-center space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => moveScheduleItem(item.id, 'up')}
                          disabled={index === 0}
                        >
                          <ArrowUp className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => moveScheduleItem(item.id, 'down')}
                          disabled={index === scheduleQueue.length - 1}
                        >
                          <ArrowDown className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFromSchedule(item.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">No items scheduled</p>
              <p className="text-sm text-gray-500">
                Add tasks or lists to create a focused work session
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}