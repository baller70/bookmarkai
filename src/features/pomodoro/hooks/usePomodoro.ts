'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  PomodoroTimer,
  Task,
  TaskList,
  PomodoroSession,
  PomodoroAnalytics,
  PomodoroSettings,
  TimerState,
  TimerAction,
  SnoozeOption,
  WeeklyData,
  MonthlyData,
  ListCreationData
} from '../types';

// Default settings
const DEFAULT_SETTINGS: PomodoroSettings = {
  workDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  longBreakInterval: 4,
  autoStartBreaks: true,
  autoStartWork: false,
  soundEnabled: true,
  notificationsEnabled: true,
  tickingSound: false,
  alarmSound: 'bell',
  alarmVolume: 0.7
};

// Snooze options
const SNOOZE_OPTIONS: SnoozeOption[] = [
  { id: '1', label: '1 minute', duration: 1 },
  { id: '5', label: '5 minutes', duration: 5 },
  { id: '10', label: '10 minutes', duration: 10 },
  { id: '15', label: '15 minutes', duration: 15 }
];

// Mock data for development
const MOCK_TASKS: Task[] = [
  {
    id: '1',
    title: 'Complete project documentation',
    description: 'Write comprehensive documentation for the new feature',
    priority: 'high',
    category: 'Work',
    tags: ['documentation', 'project'],
    isCompleted: false,
    estimatedPomodoros: 4,
    completedPomodoros: 2,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-16'),
    dueDate: new Date('2024-01-20')
  },
  {
    id: '2',
    title: 'Review pull requests',
    description: 'Review and approve pending pull requests',
    priority: 'medium',
    category: 'Development',
    tags: ['review', 'code'],
    isCompleted: false,
    estimatedPomodoros: 2,
    completedPomodoros: 0,
    createdAt: new Date('2024-01-16'),
    updatedAt: new Date('2024-01-16'),
    dueDate: new Date('2024-01-17')
  },
  {
    id: '3',
    title: 'Plan sprint goals',
    description: 'Define objectives and tasks for the upcoming sprint',
    priority: 'high',
    category: 'Planning',
    tags: ['sprint', 'planning'],
    isCompleted: true,
    estimatedPomodoros: 3,
    completedPomodoros: 3,
    createdAt: new Date('2024-01-14'),
    updatedAt: new Date('2024-01-15'),
    completedAt: new Date('2024-01-15')
  }
];

const MOCK_TASK_LISTS: TaskList[] = [];

export const usePomodoro = ({ bookmarkId }: { bookmarkId?: string } = {}) => {
  // State management
  const [timer, setTimer] = useState<PomodoroTimer>({
    id: '1',
    duration: 25,
    remainingTime: 25 * 60,
    isActive: false,
    isPaused: false,
    type: 'work',
    sessionCount: 0
  });

  const [currentTask, setCurrentTask] = useState<Task | undefined>();
  const [settings, setSettings] = useState<PomodoroSettings>(DEFAULT_SETTINGS);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskLists, setTaskLists] = useState<TaskList[]>([]);
  const [sessions, setSessions] = useState<PomodoroSession[]>([]);
  const [snoozeCount, setSnoozeCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Refs for timer functionality
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // API functions for persistence
  const loadPomodoroData = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/pomodoro${bookmarkId ? `?bookmarkId=${encodeURIComponent(bookmarkId)}` : ''}`, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });

      if (response.ok) {
        const data = await response.json();

        // Convert date strings back to Date objects with null checks
        const tasksWithDates = (data.tasks || []).map((task: any) => ({
          ...task,
          createdAt: task.createdAt ? new Date(task.createdAt) : new Date(),
          updatedAt: task.updatedAt ? new Date(task.updatedAt) : new Date(),
          completedAt: task.completedAt ? new Date(task.completedAt) : undefined,
          dueDate: task.dueDate ? new Date(task.dueDate) : undefined
        }));

        const sessionsWithDates = (data.sessions || []).map((session: any) => ({
          ...session,
          startTime: session.startTime ? new Date(session.startTime) : new Date(),
          endTime: session.endTime ? new Date(session.endTime) : undefined
        }));

        const taskListsWithDates = (data.taskLists || []).map((taskList: any) => ({
          ...taskList,
          createdAt: taskList.createdAt ? new Date(taskList.createdAt) : new Date(),
          updatedAt: taskList.updatedAt ? new Date(taskList.updatedAt) : new Date()
        }));

        setTasks(tasksWithDates);
        setTaskLists(taskListsWithDates);
        setSessions(sessionsWithDates);
        setSettings(data.settings || DEFAULT_SETTINGS);
      }
    } catch (error) {
      console.error('Error loading pomodoro data:', error);
      // Fall back to mock data on error
      setTasks(MOCK_TASKS);
      setTaskLists(MOCK_TASK_LISTS);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveToAPI = useCallback(async (type: string, action: string, data: any) => {
    try {
      const response = await fetch(`/api/pomodoro${bookmarkId ? `?bookmarkId=${encodeURIComponent(bookmarkId)}` : ''}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ type, action, data: { ...data, bookmarkId } })
      });

      if (!response.ok) {
        throw new Error('Failed to save to API');
      }

      return await response.json();
    } catch (error) {
      console.error(`Error saving ${type}:`, error);
      throw error;
    }
  }, []);

  // Load data on mount
  useEffect(() => {
    loadPomodoroData();
  }, [loadPomodoroData]);

  // Timer control functions
  const startTimer = useCallback(() => {
    setTimer(prev => ({
      ...prev,
      isActive: true,
      isPaused: false,
      startTime: new Date()
    }));
  }, []);

  const pauseTimer = useCallback(() => {
    setTimer(prev => ({
      ...prev,
      isPaused: true
    }));
  }, []);

  const resumeTimer = useCallback(() => {
    setTimer(prev => ({
      ...prev,
      isPaused: false
    }));
  }, []);

  const stopTimer = useCallback(() => {
    setTimer(prev => ({
      ...prev,
      isActive: false,
      isPaused: false,
      remainingTime: prev.duration * 60,
      endTime: new Date()
    }));
    setSnoozeCount(0);
  }, []);

  const resetTimer = useCallback(() => {
    setTimer(prev => ({
      ...prev,
      remainingTime: prev.duration * 60,
      isActive: false,
      isPaused: false,
      sessionCount: 0
    }));
    setSnoozeCount(0);
  }, []);

  // Move updateTask above completeSession to avoid TDZ in dependency array
  const updateTask = useCallback(async (taskId: string, updates: Partial<Task>) => {
    const updatedTask = { ...updates, id: taskId, updatedAt: new Date() };
    try {
      // Optimistically update UI
      setTasks(prev => prev.map(task =>
        task.id === taskId
          ? { ...task, ...updates, updatedAt: new Date() }
          : task
      ));
      // Save to API
      await saveToAPI('task', 'update', updatedTask);
    } catch (error) {
      // Revert optimistic update on error
      loadPomodoroData();
      throw error;
    }
  }, [saveToAPI, loadPomodoroData]);

  const completeSession = useCallback(() => {
    const newSession: PomodoroSession = {
      id: Date.now().toString(),
      taskId: currentTask?.id,
      taskTitle: currentTask?.title,
      startTime: (timer.startTime && timer.startTime instanceof Date) ? timer.startTime : new Date(),
      endTime: new Date(),
      duration: timer.duration,
      type: timer.type,
      isCompleted: true,
      wasInterrupted: false
    };

    // Optimistically update UI first
    setSessions(prev => [newSession, ...prev]);

    // Persist session to API (fire-and-forget)
    (async () => {
      try {
        await saveToAPI('session', 'create', newSession);
      } catch (err) {
        console.error('Failed to persist pomodoro session', err);
        // Optional: we could reload sessions to reflect server state
      }
    })();

    // Update task progress if there's a current task
    if (currentTask && timer.type === 'work') {
      const nextCompleted = (currentTask.completedPomodoros || 0) + 1;
      setTasks(prev => prev.map(task =>
        task.id === currentTask.id
          ? { ...task, completedPomodoros: nextCompleted }
          : task
      ));
      // Persist task progress increment
      (async () => {
        try {
          await updateTask(currentTask.id, { completedPomodoros: nextCompleted });
        } catch (err) {
          console.error('Failed to persist task progress', err);
        }
      })();
    }

    // Move to next session type
    const nextSessionCount = timer.sessionCount + 1;
    const isLongBreakTime = nextSessionCount % settings.longBreakInterval === 0;

    let nextType: 'work' | 'shortBreak' | 'longBreak' = 'work';
    let nextDuration = settings.workDuration;

    if (timer.type === 'work') {
      nextType = isLongBreakTime ? 'longBreak' : 'shortBreak';
      nextDuration = isLongBreakTime ? settings.longBreakDuration : settings.shortBreakDuration;
    } else {
      nextType = 'work';
      nextDuration = settings.workDuration;
    }

    setTimer(prev => ({
      ...prev,
      type: nextType,
      duration: nextDuration,
      remainingTime: nextDuration * 60,
      sessionCount: nextSessionCount,
      isActive: false,
      isPaused: false
    }));
  }, [currentTask, timer, settings, saveToAPI, updateTask]);

  const snoozeTimer = useCallback((minutes: number) => {
    setTimer(prev => ({
      ...prev,
      remainingTime: prev.remainingTime + (minutes * 60),
      isPaused: false
    }));
    setSnoozeCount(prev => prev + 1);
  }, []);

  // Timer effect
  useEffect(() => {
    if (timer.isActive && !timer.isPaused) {
      intervalRef.current = setInterval(() => {
        setTimer(prev => {
          if (prev.remainingTime <= 1) {
            // Timer completed
            completeSession();
            return prev;
          }
          return {
            ...prev,
            remainingTime: prev.remainingTime - 1
          };
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [timer.isActive, timer.isPaused, completeSession]);

  // Task management functions
  const createTask = useCallback(async (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newTask: Task = {
      ...taskData,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    try {
      // Optimistically update UI
      setTasks(prev => [newTask, ...prev]);

      // Save to API
      await saveToAPI('task', 'create', newTask);

      return newTask;
    } catch (error) {
      // Revert optimistic update on error
      setTasks(prev => prev.filter(task => task.id !== newTask.id));
      throw error;
    }
  }, [saveToAPI]);



  const deleteTask = useCallback(async (taskId: string) => {
    const taskToDelete = tasks.find(task => task.id === taskId);

    try {
      // Optimistically update UI
      setTasks(prev => prev.filter(task => task.id !== taskId));
      if (currentTask?.id === taskId) {
        setCurrentTask(undefined);
      }

      // Save to API
      await saveToAPI('task', 'delete', { id: taskId });
    } catch (error) {
      // Revert optimistic update on error
      if (taskToDelete) {
        setTasks(prev => [...prev, taskToDelete]);
      }
      loadPomodoroData();
      throw error;
    }
  }, [currentTask, tasks, saveToAPI, loadPomodoroData]);

  const selectTask = useCallback((task: Task) => {
    setCurrentTask(task);

    // Update timer duration to match task duration if task has duration
    if (task.duration && task.duration > 0) {
      setTimer(prev => ({
        ...prev,
        duration: task.duration,
        remainingTime: task.duration * 60, // Convert minutes to seconds
        // Reset timer state when switching tasks
        isActive: false,
        isPaused: false
      }));
    }
  }, []);

  // Task list management
  const createList = useCallback(async (listData: ListCreationData) => {
    const newList: TaskList = {
      id: Date.now().toString(),
      name: listData.name,
      description: listData.description,
      color: listData.color,
      taskIds: listData.selectedTaskIds,
      createdAt: new Date(),
      updatedAt: new Date(),
      isArchived: false,
      isActiveList: false,
      estimatedDuration: listData.selectedTaskIds.reduce((total, taskId) => {
        const task = tasks.find(t => t.id === taskId);
        return total + (task?.estimatedPomodoros || 0);
      }, 0),
      completedTasks: 0
    };

    // Optimistic update
    setTaskLists(prev => [newList, ...prev]);

    try {
      await saveToAPI('taskList', 'create', newList);
      return newList;
    } catch (error) {
      console.error('Error creating task list:', error);
      // Rollback on error
      setTaskLists(prev => prev.filter(list => list.id !== newList.id));
      await loadPomodoroData(); // Reload to get fresh state
      throw error;
    }
  }, [tasks, saveToAPI, loadPomodoroData]);

  const updateList = useCallback(async (listId: string, updates: Partial<TaskList>) => {
    const updatedData = { ...updates, updatedAt: new Date() };

    // Optimistic update
    setTaskLists(prev => prev.map(list =>
      list.id === listId
        ? { ...list, ...updatedData }
        : list
    ));

    try {
      await saveToAPI('taskList', 'update', { id: listId, ...updatedData });
    } catch (error) {
      console.error('Error updating task list:', error);
      await loadPomodoroData(); // Reload to get fresh state
      throw error;
    }
  }, [saveToAPI, loadPomodoroData]);

  const deleteList = useCallback(async (listId: string) => {
    const originalLists = [...taskLists];

    // Optimistic update
    setTaskLists(prev => prev.filter(list => list.id !== listId));

    try {
      await saveToAPI('taskList', 'delete', { id: listId });
    } catch (error) {
      console.error('Error deleting task list:', error);
      // Rollback on error
      setTaskLists(originalLists);
      throw error;
    }
  }, [saveToAPI, taskLists]);

  const setActiveList = useCallback((listId: string) => {
    setTaskLists(prev => prev.map(list => ({
      ...list,
      isActiveList: list.id === listId
    })));
  }, []);

  const getTasksForList = useCallback((listId: string): Task[] => {
    const list = taskLists.find(l => l.id === listId);
    if (!list) return [];
    return list.taskIds.map(taskId => tasks.find(t => t.id === taskId)).filter(Boolean) as Task[];
  }, [taskLists, tasks]);

  const getCurrentList = useCallback((): TaskList | undefined => {
    return taskLists.find(list => list.isActiveList);
  }, [taskLists]);

  // Settings management
  const updateSettings = useCallback(async (newSettings: Partial<PomodoroSettings>) => {
    const updatedSettings = { ...settings, ...newSettings };

    // Update local state immediately (optimistic update)
    setSettings(updatedSettings);

    // Update timer duration if not active
    if (!timer.isActive && newSettings.workDuration && timer.type === 'work') {
      setTimer(prev => ({
        ...prev,
        duration: newSettings.workDuration!,
        remainingTime: newSettings.workDuration! * 60
      }));
    }

    // Persist to database
    try {
      await saveToAPI('settings', 'update', updatedSettings);
    } catch (error) {
      console.error('Error updating settings:', error);
      // Revert optimistic update on error
      await loadPomodoroData();
      throw error;
    }
  }, [settings, timer.isActive, timer.type, saveToAPI, loadPomodoroData]);

  // Analytics functions
  const getAnalytics = useCallback((): PomodoroAnalytics => {
    const completedTasks = tasks.filter(task => task.isCompleted);
    const completedSessions = sessions.filter(s => s.isCompleted);
    const workSessions = completedSessions.filter(s => s.type === 'work');
    const totalFocusTime = workSessions.reduce((sum, session) => sum + session.duration, 0);

    // Calculate weekly data
    const weeklyData: WeeklyData[] = [];
    const today = new Date();
    for (let i = 0; i < 4; i++) {
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - (today.getDay() + (i * 7)));
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);

      const weekSessions = completedSessions.filter(session =>
        session.startTime && session.startTime >= weekStart && session.startTime <= weekEnd
      );

      weeklyData.push({
        week: `Week ${i + 1}`,
        sessions: weekSessions.length,
        focusTime: weekSessions.reduce((sum, session) => sum + session.duration, 0),
        tasksCompleted: completedTasks.filter(task =>
          task.completedAt && task.completedAt >= weekStart && task.completedAt <= weekEnd
        ).length
      });
    }

    // Calculate monthly data
    const monthlyData: MonthlyData[] = [];
    for (let i = 0; i < 6; i++) {
      const monthStart = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthEnd = new Date(today.getFullYear(), today.getMonth() - i + 1, 0);

      const monthSessions = completedSessions.filter(session =>
        session.startTime && session.startTime >= monthStart && session.startTime <= monthEnd
      );

      monthlyData.push({
        month: monthStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        sessions: monthSessions.length,
        focusTime: monthSessions.reduce((sum, session) => sum + session.duration, 0),
        tasksCompleted: completedTasks.filter(task =>
          task.completedAt && task.completedAt >= monthStart && task.completedAt <= monthEnd
        ).length
      });
    }

    // Calculate streak (simplified)
    let streakDays = 0;
    let bestStreak = 0;
    const currentStreak = 0;

    // This would need more complex logic for accurate streak calculation
    const recentSessions = completedSessions.slice(0, 7);
    if (recentSessions.length > 0) {
      streakDays = Math.min(recentSessions.length, 7);
      bestStreak = streakDays;
    }

    // Calculate productivity score
    const totalEstimatedPomodoros = tasks.reduce((sum, task) => sum + task.estimatedPomodoros, 0);
    const totalCompletedPomodoros = tasks.reduce((sum, task) => sum + task.completedPomodoros, 0);
    const productivityScore = totalEstimatedPomodoros > 0
      ? Math.round((totalCompletedPomodoros / totalEstimatedPomodoros) * 100)
      : 0;

    return {
      totalSessions: sessions.length,
      completedSessions: completedSessions.length,
      totalFocusTime,
      averageSessionLength: completedSessions.length > 0 ? totalFocusTime / completedSessions.length : 0,
      tasksCompleted: completedTasks.length,
      streakDays,
      bestStreak,
      weeklyData,
      monthlyData,
      productivityScore
    };
  }, [sessions, tasks]);

  // Utility functions
  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const getTimerProgress = useCallback((): number => {
    const totalTime = timer.duration * 60;
    const elapsed = totalTime - timer.remainingTime;
    return (elapsed / totalTime) * 100;
  }, [timer.duration, timer.remainingTime]);

  const getNextSessionType = useCallback((): 'work' | 'shortBreak' | 'longBreak' => {
    if (timer.type === 'work') {
      const nextSessionCount = timer.sessionCount + 1;
      return nextSessionCount % settings.longBreakInterval === 0 ? 'longBreak' : 'shortBreak';
    }
    return 'work';
  }, [timer.type, timer.sessionCount, settings.longBreakInterval]);

  return {
    // State
    timer,
    currentTask,
    tasks,
    taskLists,
    sessions,
    settings,
    snoozeCount,
    isLoading,
    snoozeOptions: SNOOZE_OPTIONS,

    // Timer controls
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    resetTimer,
    snoozeTimer,

    // Task management
    createTask,
    updateTask,
    deleteTask,
    selectTask,

    // Task list management
    createList,
    updateList,
    deleteList,
    setActiveList,
    getTasksForList,
    getCurrentList,

    // Settings
    updateSettings,

    // Analytics
    getAnalytics,

    // Utilities
    formatTime,
    getTimerProgress,
    getNextSessionType
  };
};

export default usePomodoro;