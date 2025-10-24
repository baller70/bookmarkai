// Pomodoro Timer Types
export interface PomodoroTimer {
  id: string;
  duration: number; // in minutes
  remainingTime: number; // in seconds
  isActive: boolean;
  isPaused: boolean;
  type: 'work' | 'shortBreak' | 'longBreak';
  sessionCount: number;
  startTime?: Date;
  endTime?: Date;
}

// Task Types
export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  tags: string[];
  isCompleted: boolean;
  estimatedPomodoros: number;
  completedPomodoros: number;
  duration?: number; // Duration in minutes for how long the task will take
  createdAt: Date;
  updatedAt: Date;
  dueDate?: Date;
  completedAt?: Date;
  notes?: string;
  subtasks?: SubTask[];
}

export interface SubTask {
  id: string;
  title: string;
  isCompleted: boolean;
  createdAt: Date;
  completedAt?: Date;
}

// Task List Types - Collections of 4-5 focused items for timer sessions
export interface TaskList {
  id: string;
  name: string;
  description?: string;
  color: string;
  taskIds: string[]; // References to Task IDs (max 5 items)
  createdAt: Date;
  updatedAt: Date;
  isArchived: boolean;
  isActiveList: boolean; // Currently selected list for timer
  estimatedDuration: number; // Total estimated pomodoros for the list
  completedTasks: number; // Number of completed tasks in this list
}

// Pomodoro Session Types
export interface PomodoroSession {
  id: string;
  taskId?: string;
  taskTitle?: string;
  startTime: Date;
  endTime?: Date;
  duration: number; // in minutes
  type: 'work' | 'shortBreak' | 'longBreak';
  isCompleted: boolean;
  wasInterrupted: boolean;
  interruptionReason?: string;
  notes?: string;
}

// Analytics Types
export interface PomodoroAnalytics {
  totalSessions: number;
  completedSessions: number;
  totalFocusTime: number; // in minutes
  averageSessionLength: number; // in minutes
  tasksCompleted: number;
  streakDays: number;
  bestStreak: number;
  weeklyData: WeeklyData[];
  monthlyData: MonthlyData[];
  productivityScore: number;
}

export interface WeeklyData {
  week: string;
  sessions: number;
  focusTime: number;
  tasksCompleted: number;
}

export interface MonthlyData {
  month: string;
  sessions: number;
  focusTime: number;
  tasksCompleted: number;
}

// Settings Types
export interface PomodoroSettings {
  workDuration: number; // in minutes
  shortBreakDuration: number; // in minutes
  longBreakDuration: number; // in minutes
  longBreakInterval: number; // after how many work sessions
  autoStartBreaks: boolean;
  autoStartWork: boolean;
  soundEnabled: boolean;
  notificationsEnabled: boolean;
  tickingSound: boolean;
  alarmSound: string;
  alarmVolume: number;
}

// Snooze Types
export interface SnoozeOption {
  id: string;
  label: string;
  duration: number; // in minutes
}

// Timer State Types
export interface TimerState {
  timer: PomodoroTimer;
  currentTask?: Task;
  settings: PomodoroSettings;
  isBreakTime: boolean;
  canSnooze: boolean;
  snoozeCount: number;
  maxSnoozeCount: number;
}

// Action Types for Timer Control
export type TimerAction = 
  | 'START'
  | 'PAUSE'
  | 'RESUME'
  | 'STOP'
  | 'RESET'
  | 'COMPLETE'
  | 'SNOOZE'
  | 'SKIP_BREAK'
  | 'SWITCH_TASK';

// List Management Types
export interface ListCreationData {
  name: string;
  description?: string;
  color: string;
  selectedTaskIds: string[];
}

// Scheduling Queue Types
export interface ScheduledItem {
  id: string;
  type: 'task' | 'list';
  taskId?: string; // For individual tasks
  listId?: string; // For task lists
  order: number;
  estimatedDuration: number; // in minutes
  createdAt: Date;
}

export interface ScheduleQueue {
  items: ScheduledItem[];
  currentIndex: number;
  isActive: boolean;
}

export interface TaskWithDetails extends Task {
  isInActiveList?: boolean;
  listIds: string[]; // Which lists contain this task
}

// Tab Types for Sidebar Navigation
export type PomodoroTab = 'TIMER' | 'TASKS' | 'LISTS' | 'ANALYTICS' | 'SETTINGS';

export interface PomodoroTabConfig {
  id: PomodoroTab;
  label: string;
  icon: string;
  badge?: number;
  isPremium?: boolean;
}