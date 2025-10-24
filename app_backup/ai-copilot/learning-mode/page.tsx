
'use client'
export const dynamic = 'force-dynamic'

import React, { useState, useEffect } from 'react'
import { Brain, TrendingUp, Target, BookOpen, Lightbulb, BarChart3, Settings, Play, Pause, RotateCcw, Award, Users, Clock } from 'lucide-react'
import { useTranslation } from '@/hooks/use-translation'

interface LearningProgress {
  totalSessions: number
  hoursLearned: number
  accuracy: number
  streak: number
  level: number
  xp: number
  xpToNext: number
}

interface LearningSession {
  id: string
  title: string
  description: string
  category: 'patterns' | 'preferences' | 'behavior' | 'content'
  duration: number
  progress: number
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  isActive: boolean
  lastAccessed?: Date
  completedLessons: number
  totalLessons: number
}

interface Insight {
  id: string
  title: string
  description: string
  type: 'discovery' | 'improvement' | 'achievement' | 'recommendation'
  confidence: number
  impact: 'low' | 'medium' | 'high'
  date: Date
}

export default function LearningModePage() {
  const { t } = useTranslation()
  const [learningProgress, setLearningProgress] = useState<LearningProgress>({
    totalSessions: 0,
    hoursLearned: 0,
    accuracy: 0,
    streak: 0,
    level: 1,
    xp: 0,
    xpToNext: 100
  })
  
  const [learningSessions, setLearningSessions] = useState<LearningSession[]>([])
  const [insights, setInsights] = useState<Insight[]>([])
  const [isLearningActive, setIsLearningActive] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [learningSettings, setLearningSettings] = useState({
    autoLearn: true,
    adaptiveSpeed: true,
    privacyMode: false,
    shareInsights: true,
    notificationFrequency: 'daily'
  })

  // Initialize learning data
  useEffect(() => {
    const initializeLearningData = async () => {
      // Simulate loading from API
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const mockProgress: LearningProgress = {
        totalSessions: 47,
        hoursLearned: 23.5,
        accuracy: 0.87,
        streak: 12,
        level: 5,
        xp: 1250,
        xpToNext: 350
      }
      
      const mockSessions: LearningSession[] = [
        {
          id: '1',
          title: 'Bookmark Pattern Recognition',
          description: 'Learn to identify and categorize your browsing patterns for better bookmark organization',
          category: 'patterns',
          duration: 45,
          progress: 0.75,
          difficulty: 'intermediate',
          isActive: true,
          lastAccessed: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          completedLessons: 6,
          totalLessons: 8
        },
        {
          id: '2',
          title: 'Personal Preference Analysis',
          description: 'Understand your content preferences to improve AI recommendations',
          category: 'preferences',
          duration: 30,
          progress: 1.0,
          difficulty: 'beginner',
          isActive: false,
          lastAccessed: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          completedLessons: 5,
          totalLessons: 5
        },
        {
          id: '3',
          title: 'Behavioral Learning Optimization',
          description: 'Advanced techniques for optimizing AI behavior based on your usage patterns',
          category: 'behavior',
          duration: 60,
          progress: 0.40,
          difficulty: 'advanced',
          isActive: false,
          lastAccessed: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          completedLessons: 3,
          totalLessons: 10
        },
        {
          id: '4',
          title: 'Content Quality Assessment',
          description: 'Train the AI to better understand and evaluate content quality',
          category: 'content',
          duration: 35,
          progress: 0.20,
          difficulty: 'intermediate',
          isActive: false,
          lastAccessed: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          completedLessons: 2,
          totalLessons: 7
        },
        {
          id: '5',
          title: 'Smart Tagging Mastery',
          description: 'Master the art of AI-powered smart tagging for maximum efficiency',
          category: 'patterns',
          duration: 40,
          progress: 0.60,
          difficulty: 'advanced',
          isActive: true,
          lastAccessed: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          completedLessons: 4,
          totalLessons: 6
        }
      ]
      
      const mockInsights: Insight[] = [
        {
          id: '1',
          title: 'Improved Pattern Recognition',
          description: 'Your AI has learned to recognize your work-related bookmarks with 94% accuracy',
          type: 'achievement',
          confidence: 0.94,
          impact: 'high',
          date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
        },
        {
          id: '2',
          title: 'New Content Category Discovered',
          description: 'AI identified a new interest in sustainable technology based on recent bookmarks',
          type: 'discovery',
          confidence: 0.82,
          impact: 'medium',
          date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
        },
        {
          id: '3',
          title: 'Tagging Efficiency Boost',
          description: 'Smart tagging speed improved by 35% after completing preference analysis',
          type: 'improvement',
          confidence: 0.91,
          impact: 'high',
          date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
        },
        {
          id: '4',
          title: 'Personalized Learning Path',
          description: 'Consider focusing on advanced behavioral patterns for maximum impact',
          type: 'recommendation',
          confidence: 0.78,
          impact: 'medium',
          date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)
        }
      ]
      
      setLearningProgress(mockProgress)
      setLearningSessions(mockSessions)
      setInsights(mockInsights)
      setIsLearningActive(mockSessions.some(session => session.isActive))
    }

    initializeLearningData()
  }, [])

  const startLearningSession = (sessionId: string) => {
    setLearningSessions(sessions =>
      sessions.map(session =>
        session.id === sessionId
          ? { ...session, isActive: true, lastAccessed: new Date() }
          : session
      )
    )
    setIsLearningActive(true)
  }

  const pauseLearningSession = (sessionId: string) => {
    setLearningSessions(sessions =>
      sessions.map(session =>
        session.id === sessionId
          ? { ...session, isActive: false }
          : session
      )
    )
    setIsLearningActive(learningSessions.some(s => s.isActive && s.id !== sessionId))
  }

  const resetProgress = () => {
    if (confirm('Are you sure you want to reset all learning progress? This action cannot be undone.')) {
      setLearningProgress({
        totalSessions: 0,
        hoursLearned: 0,
        accuracy: 0,
        streak: 0,
        level: 1,
        xp: 0,
        xpToNext: 100
      })
      setLearningSessions(sessions =>
        sessions.map(session => ({ ...session, progress: 0, completedLessons: 0, isActive: false }))
      )
    }
  }

  const filteredSessions = selectedCategory === 'all'
    ? learningSessions
    : learningSessions.filter(session => session.category === selectedCategory)

  const categories = ['all', 'patterns', 'preferences', 'behavior', 'content']

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'discovery': return <Lightbulb className="w-5 h-5 text-yellow-500" />
      case 'improvement': return <TrendingUp className="w-5 h-5 text-green-500" />
      case 'achievement': return <Award className="w-5 h-5 text-purple-500" />
      case 'recommendation': return <Target className="w-5 h-5 text-blue-500" />
      default: return <Brain className="w-5 h-5 text-gray-500" />
    }
  }

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-200'
      case 'medium': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-200'
      case 'low': return 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-200'
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-300'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-500 to-blue-500 rounded-lg p-6 text-white">
        <div className="flex items-center space-x-3 mb-4">
          <Brain className="w-8 h-8" />
          <div>
            <h1 className="text-2xl font-bold">{t('aiLinkPilot.learningMode')}</h1>
            <p className="text-green-100">Adaptive AI that learns from your behavior</p>
          </div>
        </div>
        
        {/* Progress Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-white/10 rounded-lg p-3">
            <div className="text-2xl font-bold">{learningProgress.totalSessions}</div>
            <div className="text-sm text-green-100">Sessions</div>
          </div>
          <div className="bg-white/10 rounded-lg p-3">
            <div className="text-2xl font-bold">{learningProgress.hoursLearned}h</div>
            <div className="text-sm text-green-100">Hours Learned</div>
          </div>
          <div className="bg-white/10 rounded-lg p-3">
            <div className="text-2xl font-bold">{Math.round(learningProgress.accuracy * 100)}%</div>
            <div className="text-sm text-green-100">Accuracy</div>
          </div>
          <div className="bg-white/10 rounded-lg p-3">
            <div className="text-2xl font-bold">Lv.{learningProgress.level}</div>
            <div className="text-sm text-green-100">Level</div>
          </div>
        </div>
        
        {/* XP Progress */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm text-green-100 mb-2">
            <span>Experience Points</span>
            <span>{learningProgress.xp} / {learningProgress.xp + learningProgress.xpToNext} XP</span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-2">
            <div 
              className="bg-white rounded-full h-2 transition-all duration-300"
              style={{ width: `${(learningProgress.xp / (learningProgress.xp + learningProgress.xpToNext)) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${isLearningActive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
            <span className="text-sm font-medium">
              Learning Status: {isLearningActive ? 'Active' : 'Inactive'}
            </span>
          </div>
          
          <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
            <Users className="w-4 h-4" />
            <span>Community Rank: #247</span>
          </div>
          
          <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
            <Clock className="w-4 h-4" />
            <span>Streak: {learningProgress.streak} days</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={resetProgress}
            className="flex items-center space-x-2 px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset Progress</span>
          </button>
        </div>
      </div>

      {/* Session Categories */}
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedCategory === category
                ? 'bg-green-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </button>
        ))}
      </div>

      {/* Learning Sessions */}
      <div className="grid gap-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center space-x-2">
          <BookOpen className="w-5 h-5" />
          <span>Learning Sessions ({filteredSessions.length})</span>
        </h2>
        
        {filteredSessions.map((session) => (
          <div key={session.id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {session.title}
                    </h3>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      session.isActive
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                    }`}>
                      {session.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      session.difficulty === 'beginner' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                      session.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                      'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}>
                      {session.difficulty}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {session.description}
                  </p>
                  
                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                      <span>Progress: {session.completedLessons}/{session.totalLessons} lessons</span>
                      <span>{Math.round(session.progress * 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-green-500 rounded-full h-2 transition-all duration-300"
                        style={{ width: `${session.progress * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                    <span>{session.duration} min duration</span>
                    {session.lastAccessed && (
                      <>
                        <span>•</span>
                        <span>Last accessed: {session.lastAccessed.toLocaleDateString()}</span>
                      </>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {session.progress < 1.0 && (
                    <button
                      onClick={() => session.isActive ? pauseLearningSession(session.id) : startLearningSession(session.id)}
                      className={`flex items-center space-x-2 px-4 py-2 text-sm rounded-lg transition-colors ${
                        session.isActive
                          ? 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900 dark:text-red-200'
                          : 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900 dark:text-green-200'
                      }`}
                    >
                      {session.isActive ? (
                        <>
                          <Pause className="w-4 h-4" />
                          <span>Pause</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4" />
                          <span>Continue</span>
                        </>
                      )}
                    </button>
                  )}
                  
                  {session.progress === 1.0 && (
                    <div className="flex items-center space-x-2 px-4 py-2 bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200 rounded-lg">
                      <Award className="w-4 h-4" />
                      <span>Completed</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* AI Insights */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center space-x-2">
            <BarChart3 className="w-5 h-5" />
            <span>AI Insights</span>
          </h2>
        </div>
        
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {insights.map((insight) => (
            <div key={insight.id} className="p-6">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  {getInsightIcon(insight.type)}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="font-medium text-gray-900 dark:text-gray-100">
                      {insight.title}
                    </h3>
                    <span className={`px-2 py-1 text-xs rounded-full ${getImpactColor(insight.impact)}`}>
                      {insight.impact} impact
                    </span>
                  </div>
                  
                  <p className="text-gray-600 dark:text-gray-400 mb-2">
                    {insight.description}
                  </p>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                    <span>Confidence: {Math.round(insight.confidence * 100)}%</span>
                    <span>•</span>
                    <span>{insight.date.toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Learning Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center space-x-2">
          <Settings className="w-5 h-5" />
          <span>Learning Settings</span>
        </h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <input 
                type="checkbox" 
                id="auto-learn"
                checked={learningSettings.autoLearn}
                onChange={(e) => setLearningSettings(prev => ({ ...prev, autoLearn: e.target.checked }))}
                className="rounded" 
              />
              <label htmlFor="auto-learn" className="text-sm text-gray-600 dark:text-gray-400">
                Enable automatic learning from browsing behavior
              </label>
            </div>
            
            <div className="flex items-center space-x-2">
              <input 
                type="checkbox" 
                id="adaptive-speed"
                checked={learningSettings.adaptiveSpeed}
                onChange={(e) => setLearningSettings(prev => ({ ...prev, adaptiveSpeed: e.target.checked }))}
                className="rounded" 
              />
              <label htmlFor="adaptive-speed" className="text-sm text-gray-600 dark:text-gray-400">
                Adaptive learning speed based on performance
              </label>
            </div>
            
            <div className="flex items-center space-x-2">
              <input 
                type="checkbox" 
                id="privacy-mode"
                checked={learningSettings.privacyMode}
                onChange={(e) => setLearningSettings(prev => ({ ...prev, privacyMode: e.target.checked }))}
                className="rounded" 
              />
              <label htmlFor="privacy-mode" className="text-sm text-gray-600 dark:text-gray-400">
                Privacy mode (local learning only)
              </label>
            </div>
            
            <div className="flex items-center space-x-2">
              <input 
                type="checkbox" 
                id="share-insights"
                checked={learningSettings.shareInsights}
                onChange={(e) => setLearningSettings(prev => ({ ...prev, shareInsights: e.target.checked }))}
                className="rounded" 
              />
              <label htmlFor="share-insights" className="text-sm text-gray-600 dark:text-gray-400">
                Share anonymized insights to improve AI for everyone
              </label>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Notification Frequency
            </label>
            <select 
              value={learningSettings.notificationFrequency}
              onChange={(e) => setLearningSettings(prev => ({ ...prev, notificationFrequency: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
            >
              <option value="never">Never</option>
              <option value="weekly">Weekly</option>
              <option value="daily">Daily</option>
              <option value="real-time">Real-time</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  )
} 