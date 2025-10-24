// @ts-nocheck
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Clock,
  List,
  BarChart3,
  Settings,
  Timer as TimerIcon,
  Play,
  Pause,
  Square,
  RotateCcw,
  Coffee,
  Zap,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { PomodoroTab, PomodoroTabConfig } from '../types';
import usePomodoro from '../hooks/usePomodoro';
import PomodoroTimer from './PomodoroTimer';
import TaskManager from './TaskManager';
import ListManager from './ListManager';
import PomodoroAnalytics from './PomodoroAnalytics';
import PomodoroSettings from './PomodoroSettings';

const TAB_CONFIG: PomodoroTabConfig[] = [
  { id: 'TIMER', label: 'TIMER', icon: 'Clock' },
  { id: 'TASKS', label: 'TASKS', icon: 'List' },
  { id: 'LISTS', label: 'LISTS', icon: 'List' },
  { id: 'ANALYTICS', label: 'ANALYTICS', icon: 'BarChart3' },
  { id: 'SETTINGS', label: 'SETTINGS', icon: 'Settings' }
];

export default function TimerTab({ bookmarkId }: { bookmarkId?: string }) {
  const [activeTab, setActiveTab] = useState<PomodoroTab>('TIMER');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pomodoroHook = usePomodoro({ bookmarkId });
  const { timer, tasks, currentTask } = pomodoroHook;

  // Deep-link handler for TipTap "Open in Tasks"
  useEffect(() => {
    const openFromStorage = () => {
      try {
        const raw = localStorage.getItem('pomodoro.open');
        if (!raw) return;
        const detail = JSON.parse(raw || '{}');
        if (detail?.tab === 'TASKS') setActiveTab('TASKS');
        if (detail?.focusTaskId) {
          const t = pomodoroHook.tasks.find(t => t.id === detail.focusTaskId);
          if (t) pomodoroHook.selectTask(t);
        }
        if (detail?.focusListId) {
          pomodoroHook.setActiveList(detail.focusListId);
        }
        localStorage.removeItem('pomodoro.open');
      } catch {}
    };

    // Handle queued intent (from localStorage) on mount
    openFromStorage();

    // Handle real-time event
    const handler = (ev: CustomEvent<any>) => {
      const d = ev?.detail || {};
      if (d.tab === 'TASKS') setActiveTab('TASKS');
      if (d.focusTaskId) {
        const t = pomodoroHook.tasks.find(x => x.id === d.focusTaskId);
        if (t) pomodoroHook.selectTask(t);
      }
      if (d.focusListId) {
        pomodoroHook.setActiveList(d.focusListId);
      }
    };

    window.addEventListener('pomodoro:open' as any, handler as any);
    return () => window.removeEventListener('pomodoro:open' as any, handler as any);
  }, [pomodoroHook.tasks, pomodoroHook.selectTask, pomodoroHook.setActiveList]);

  const getTabBadge = (tabId: PomodoroTab): number | undefined => {
    switch (tabId) {
      case 'TASKS':
        return tasks.filter(task => !task.isCompleted).length;
      case 'LISTS':
        return pomodoroHook.taskLists.length;
      default:
        return undefined;
    }
  };

  const getTabIcon = (iconName: string) => {
    const iconProps = { size: 16 };
    switch (iconName) {
      case 'Clock': return <Clock {...iconProps} />;
      case 'List': return <List {...iconProps} />;
      case 'BarChart3': return <BarChart3 {...iconProps} />;
      case 'Settings': return <Settings {...iconProps} />;
      default: return <Clock {...iconProps} />;
    }
  };

  const renderTabContent = () => {
    // Add missing props for compatibility
    const extendedProps = {
      ...pomodoroHook,
      skipBreak: () => {}, // Placeholder - would need implementation
      canSnooze: pomodoroHook.snoozeCount < 3,
      maxSnoozeCount: 3,
      addTask: pomodoroHook.createTask, // Map createTask to addTask
      completeTask: (taskId: string) => {
        pomodoroHook.updateTask(taskId, {
          isCompleted: true,
          completedAt: new Date()
        });
      },
      defaultSettings: {
        workDuration: 25,
        shortBreakDuration: 5,
        longBreakDuration: 15,
        longBreakInterval: 4,
        autoStartBreaks: false,
        autoStartWork: false,
        soundEnabled: true,
        notificationsEnabled: true,
        tickingSound: false,
        alarmSound: 'bell',
        alarmVolume: 0.7
      }
    };

    switch (activeTab) {
      case 'TIMER':
        return <PomodoroTimer {...extendedProps} taskLists={pomodoroHook.taskLists} getTasksForList={pomodoroHook.getTasksForList} />;
      case 'TASKS':
        return <TaskManager {...extendedProps} />;
      case 'LISTS':
        return <ListManager {...pomodoroHook} />;
      case 'ANALYTICS':
        return <PomodoroAnalytics {...extendedProps} />;
      case 'SETTINGS':
        return <PomodoroSettings {...extendedProps} />;
      default:
        return <PomodoroTimer {...extendedProps} />;
    }
  };

  return (
    <div className="flex h-full bg-white rounded-lg shadow-sm border">
      {/* Sidebar Navigation */}
      <div className={`${isCollapsed ? 'w-16' : 'w-64'} bg-gray-50 border-r border-gray-200 p-4 transition-all duration-300 relative`}>
        {/* Collapse/Expand Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-4 bg-white border border-gray-200 rounded-full p-1 shadow-md hover:shadow-lg transition-all duration-200 z-10"
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4 text-gray-600" />
          ) : (
            <ChevronLeft className="w-4 h-4 text-gray-600" />
          )}
        </button>

        <div className="space-y-2">
          {TAB_CONFIG.map((tab) => {
            const badge = getTabBadge(tab.id);
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center ${isCollapsed ? 'justify-center px-2' : 'justify-between px-4'} py-3 rounded-lg text-left transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-500 text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
                title={isCollapsed ? tab.label : undefined}
              >
                <div className={`flex items-center ${isCollapsed ? '' : 'space-x-3'}`}>
                  {getTabIcon(tab.icon)}
                  {!isCollapsed && (
                    <span className="font-medium text-sm">{tab.label}</span>
                  )}
                </div>
                {!isCollapsed && badge !== undefined && (
                  <Badge
                    variant={isActive ? "secondary" : "default"}
                    className={`text-xs ${isActive ? 'bg-white/20 text-white' : ''}`}
                  >
                    {badge}
                  </Badge>
                )}
              </button>
            );
          })}
        </div>

        {/* Timer Status in Sidebar - Only show when expanded */}
        {!isCollapsed && (
          <div className="mt-6 p-4 bg-white rounded-lg border">
            <div className="text-center">
              <div className="flex items-center justify-center space-x-2 mb-2">
                {timer.type === 'work' ? (
                  <Zap className="w-4 h-4 text-red-500" />
                ) : (
                  <Coffee className="w-4 h-4 text-green-500" />
                )}
                <span className="text-sm font-medium text-gray-600">
                  {timer.type === 'work' ? 'WORK' :
                   timer.type === 'shortBreak' ? 'SHORT BREAK' : 'LONG BREAK'}
                </span>
              </div>

              {/* Current Task Title in Sidebar */}
              {timer.type === 'work' && currentTask && (
                <div className="mb-2">
                  <div className="text-xs text-gray-400 uppercase tracking-wide">CURRENT TASK</div>
                  <div className="text-sm font-medium text-gray-700 truncate">
                    {currentTask.title}
                  </div>
                </div>
              )}

              <div className="text-2xl font-bold text-gray-900 mb-2">
                {Math.floor(timer.remainingTime / 60).toString().padStart(2, '0')}:
                {(timer.remainingTime % 60).toString().padStart(2, '0')}
              </div>
              <div className="text-xs text-gray-500">
                Session {timer.sessionCount + 1}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="flex-1 p-6 bg-white overflow-auto">
        {renderTabContent()}
      </div>
    </div>
  );
}