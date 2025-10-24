'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Clock, 
  Target, 
  TrendingUp, 
  Calendar,
  CheckCircle2,
  Zap,
  BarChart3,
  Award
} from 'lucide-react';

interface PomodoroAnalyticsProps {
  getAnalytics: () => any;
  sessions: any[];
  tasks: any[];
}

export default function PomodoroAnalytics({
  getAnalytics,
  sessions,
  tasks
}: PomodoroAnalyticsProps) {
  const analytics = getAnalytics();

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const getCompletionRate = () => {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.isCompleted).length;
    return totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  };

  const getAverageSessionsPerDay = () => {
    if (sessions.length === 0) return 0;
    
    const dates = sessions
      .filter(s => s.startTime && s.startTime instanceof Date)
      .map(s => s.startTime.toDateString());
    const uniqueDates = [...new Set(dates)];
    return Math.round(sessions.length / Math.max(uniqueDates.length, 1));
  };

  const getTodayStats = () => {
    const today = new Date().toDateString();
    const todaySessions = sessions.filter(s => 
      s.startTime && s.startTime instanceof Date && s.startTime.toDateString() === today
    );
    const todayFocusTime = todaySessions
      .filter(s => s.type === 'work' && s.isCompleted)
      .reduce((total, s) => total + s.duration, 0);
    
    return {
      sessions: todaySessions.length,
      focusTime: todayFocusTime
    };
  };

  const todayStats = getTodayStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">ANALYTICS</h2>
        <p className="text-gray-600">Track your productivity and progress</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">TOTAL SESSIONS</p>
                <p className="text-3xl font-bold text-blue-900">{analytics.totalSessions}</p>
              </div>
              <div className="bg-blue-500 p-3 rounded-full">
                <Clock className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">TASKS COMPLETED</p>
                <p className="text-3xl font-bold text-purple-900">{analytics.tasksCompleted}</p>
              </div>
              <div className="bg-purple-500 p-3 rounded-full">
                <CheckCircle2 className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600">STREAK DAYS</p>
                <p className="text-3xl font-bold text-orange-900">{analytics.streakDays}</p>
              </div>
              <div className="bg-orange-500 p-3 rounded-full">
                <Award className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>      {/* Today's Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="w-5 h-5" />
            <span>TODAY'S PERFORMANCE</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{todayStats.sessions}</div>
              <div className="text-sm text-gray-600">Sessions Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{formatTime(todayStats.focusTime)}</div>
              <div className="text-sm text-gray-600">Focus Time</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{analytics.productivityScore}%</div>
              <div className="text-sm text-gray-600">Productivity Score</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5" />
              <span>SESSION STATISTICS</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Completed Sessions</span>
              <Badge className="bg-green-100 text-green-800">
                {analytics.completedSessions}/{analytics.totalSessions}
              </Badge>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Average Session Length</span>
              <span className="font-semibold">{formatTime(analytics.averageSessionLength)}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Sessions per Day</span>
              <span className="font-semibold">{getAverageSessionsPerDay()}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Completion Rate</span>
              <Badge className={`${
                analytics.completedSessions / Math.max(analytics.totalSessions, 1) >= 0.8 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {Math.round((analytics.completedSessions / Math.max(analytics.totalSessions, 1)) * 100)}%
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="w-5 h-5" />
              <span>TASK PROGRESS</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Tasks</span>
              <span className="font-semibold">{tasks.length}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Completed Tasks</span>
              <Badge className="bg-green-100 text-green-800">
                {analytics.tasksCompleted}
              </Badge>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Active Tasks</span>
              <span className="font-semibold">{tasks.filter(t => !t.isCompleted).length}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Task Completion Rate</span>
              <Badge className={`${
                getCompletionRate() >= 70 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {getCompletionRate()}%
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>      {/* Recent Sessions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="w-5 h-5" />
            <span>RECENT SESSIONS</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sessions.length === 0 ? (
            <div className="text-center py-8">
              <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">No sessions yet</p>
              <p className="text-sm text-gray-500">
                Complete your first pomodoro session to see analytics
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.slice(0, 5).map((session, index) => (
                <div 
                  key={session.id} 
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      session.type === 'work' ? 'bg-red-500' : 'bg-green-500'
                    }`} />
                    <div>
                      <p className="font-medium text-sm">
                        {session.type === 'work' ? 'Work Session' : 
                         session.type === 'shortBreak' ? 'Short Break' : 'Long Break'}
                      </p>
                      {session.taskTitle && (
                        <p className="text-xs text-gray-600">{session.taskTitle}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-sm font-medium">{formatTime(session.duration)}</p>
                    <p className="text-xs text-gray-500">
                      {session.startTime && session.startTime instanceof Date 
                        ? session.startTime.toLocaleDateString()
                        : 'N/A'
                      }
                    </p>
                  </div>
                  
                  <Badge className={`${
                    session.isCompleted 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {session.isCompleted ? 'COMPLETED' : 'INTERRUPTED'}
                  </Badge>
                </div>
              ))}
              
              {sessions.length > 5 && (
                <div className="text-center pt-4">
                  <p className="text-sm text-gray-500">
                    Showing 5 of {sessions.length} sessions
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Achievements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Award className="w-5 h-5" />
            <span>ACHIEVEMENTS</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className={`p-4 rounded-lg border-2 ${
              analytics.streakDays >= 7 
                ? 'bg-yellow-50 border-yellow-200' 
                : 'bg-gray-50 border-gray-200'
            }`}>
              <div className="text-center">
                <Award className={`w-8 h-8 mx-auto mb-2 ${
                  analytics.streakDays >= 7 ? 'text-yellow-500' : 'text-gray-400'
                }`} />
                <h3 className="font-semibold text-sm">Week Warrior</h3>
                <p className="text-xs text-gray-600">7-day streak</p>
                <p className="text-xs mt-1">
                  {analytics.streakDays >= 7 ? '🎉 Unlocked!' : `${analytics.streakDays}/7 days`}
                </p>
              </div>
            </div>

            <div className={`p-4 rounded-lg border-2 ${
              analytics.totalSessions >= 50 
                ? 'bg-blue-50 border-blue-200' 
                : 'bg-gray-50 border-gray-200'
            }`}>
              <div className="text-center">
                <Clock className={`w-8 h-8 mx-auto mb-2 ${
                  analytics.totalSessions >= 50 ? 'text-blue-500' : 'text-gray-400'
                }`} />
                <h3 className="font-semibold text-sm">Session Master</h3>
                <p className="text-xs text-gray-600">50 sessions</p>
                <p className="text-xs mt-1">
                  {analytics.totalSessions >= 50 ? '🎉 Unlocked!' : `${analytics.totalSessions}/50 sessions`}
                </p>
              </div>
            </div>

            <div className={`p-4 rounded-lg border-2 ${
              analytics.tasksCompleted >= 20 
                ? 'bg-green-50 border-green-200' 
                : 'bg-gray-50 border-gray-200'
            }`}>
              <div className="text-center">
                <CheckCircle2 className={`w-8 h-8 mx-auto mb-2 ${
                  analytics.tasksCompleted >= 20 ? 'text-green-500' : 'text-gray-400'
                }`} />
                <h3 className="font-semibold text-sm">Task Crusher</h3>
                <p className="text-xs text-gray-600">20 tasks completed</p>
                <p className="text-xs mt-1">
                  {analytics.tasksCompleted >= 20 ? '🎉 Unlocked!' : `${analytics.tasksCompleted}/20 tasks`}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}