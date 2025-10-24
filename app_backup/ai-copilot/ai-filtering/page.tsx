
'use client'
export const dynamic = 'force-dynamic'

import React, { useState, useEffect } from 'react'
import { Filter, Search, Tag, Brain, Zap, Settings, Save, RotateCcw, Eye, EyeOff, TrendingUp, Target, Sparkles } from 'lucide-react'
import { useTranslation } from '@/hooks/use-translation'

interface FilterRule {
  id: string
  name: string
  description: string
  enabled: boolean
  priority: number
  conditions: FilterCondition[]
  actions: FilterAction[]
  stats: {
    applied: number
    blocked: number
    accuracy: number
  }
}

interface FilterCondition {
  id: string
  type: 'content' | 'domain' | 'category' | 'sentiment' | 'language' | 'keywords'
  operator: 'contains' | 'equals' | 'matches' | 'greater_than' | 'less_than'
  value: string
  confidence: number
}

interface FilterAction {
  id: string
  type: 'block' | 'tag' | 'categorize' | 'priority' | 'notify'
  value: string
}

export default function AIFilteringPage() {
  const { t } = useTranslation()
  const [filterRules, setFilterRules] = useState<FilterRule[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedRule, setSelectedRule] = useState<FilterRule | null>(null)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [filterStats, setFilterStats] = useState({
    totalFiltered: 0,
    accuracyRate: 0,
    activeRules: 0,
    processedToday: 0
  })

  // Initialize with default filter rules
  useEffect(() => {
    const initializeFilters = async () => {
      setIsLoading(true)
      
      // Simulate loading from API
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const defaultRules: FilterRule[] = [
        {
          id: '1',
          name: 'Spam Content Filter',
          description: 'Automatically filter out spam and low-quality content',
          enabled: true,
          priority: 1,
          conditions: [
            {
              id: 'c1',
              type: 'content',
              operator: 'contains',
              value: 'spam, advertisement, clickbait',
              confidence: 0.85
            }
          ],
          actions: [
            {
              id: 'a1',
              type: 'block',
              value: 'true'
            }
          ],
          stats: {
            applied: 1247,
            blocked: 892,
            accuracy: 0.92
          }
        },
        {
          id: '2',
          name: 'Technical Content Enhancer',
          description: 'Prioritize and categorize technical documentation and tutorials',
          enabled: true,
          priority: 2,
          conditions: [
            {
              id: 'c2',
              type: 'category',
              operator: 'equals',
              value: 'programming, development, tutorial',
              confidence: 0.80
            }
          ],
          actions: [
            {
              id: 'a2',
              type: 'tag',
              value: 'technical'
            },
            {
              id: 'a3',
              type: 'priority',
              value: 'high'
            }
          ],
          stats: {
            applied: 567,
            blocked: 0,
            accuracy: 0.88
          }
        },
        {
          id: '3',
          name: 'Language Filter',
          description: 'Filter content based on language preferences',
          enabled: false,
          priority: 3,
          conditions: [
            {
              id: 'c3',
              type: 'language',
              operator: 'equals',
              value: 'en',
              confidence: 0.95
            }
          ],
          actions: [
            {
              id: 'a4',
              type: 'categorize',
              value: 'english-content'
            }
          ],
          stats: {
            applied: 234,
            blocked: 45,
            accuracy: 0.95
          }
        }
      ]
      
      setFilterRules(defaultRules)
      setFilterStats({
        totalFiltered: defaultRules.reduce((sum, rule) => sum + rule.stats.applied, 0),
        accuracyRate: defaultRules.reduce((sum, rule) => sum + rule.stats.accuracy, 0) / defaultRules.length,
        activeRules: defaultRules.filter(rule => rule.enabled).length,
        processedToday: 156
      })
      setIsLoading(false)
    }

    initializeFilters()
  }, [])

  const handleToggleRule = (ruleId: string) => {
    setFilterRules(rules => 
      rules.map(rule => 
        rule.id === ruleId 
          ? { ...rule, enabled: !rule.enabled }
          : rule
      )
    )
  }

  const handleSaveSettings = async () => {
    // Simulate API save
    console.log('Saving filter settings...', filterRules)
    // In production, this would save to your backend
  }

  const handleResetFilters = () => {
    if (confirm('Are you sure you want to reset all filters to default settings?')) {
      // Reset logic here
      window.location.reload()
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading AI Filtering settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg p-6 text-white">
        <div className="flex items-center space-x-3 mb-4">
          <Filter className="w-8 h-8" />
          <div>
            <h1 className="text-2xl font-bold">{t('aiLinkPilot.aiFiltering')}</h1>
            <p className="text-purple-100">Intelligent content filtering powered by AI</p>
          </div>
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-white/10 rounded-lg p-3">
            <div className="text-2xl font-bold">{filterStats.totalFiltered.toLocaleString()}</div>
            <div className="text-sm text-purple-100">Total Filtered</div>
          </div>
          <div className="bg-white/10 rounded-lg p-3">
            <div className="text-2xl font-bold">{Math.round(filterStats.accuracyRate * 100)}%</div>
            <div className="text-sm text-purple-100">Accuracy Rate</div>
          </div>
          <div className="bg-white/10 rounded-lg p-3">
            <div className="text-2xl font-bold">{filterStats.activeRules}</div>
            <div className="text-sm text-purple-100">Active Rules</div>
          </div>
          <div className="bg-white/10 rounded-lg p-3">
            <div className="text-2xl font-bold">{filterStats.processedToday}</div>
            <div className="text-sm text-purple-100">Processed Today</div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center space-x-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <Settings className="w-4 h-4" />
            <span>Advanced Settings</span>
            {showAdvanced ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
          
          <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
            <Brain className="w-4 h-4" />
            <span>AI Engine: Active</span>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={handleResetFilters}
            className="flex items-center space-x-2 px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset</span>
          </button>
          
          <button
            onClick={handleSaveSettings}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>Save Changes</span>
          </button>
        </div>
      </div>

      {/* Filter Rules */}
      <div className="grid gap-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center space-x-2">
          <Target className="w-5 h-5" />
          <span>Filter Rules</span>
        </h2>
        
        {filterRules.map((rule) => (
          <div key={rule.id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {rule.name}
                    </h3>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      rule.enabled 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                    }`}>
                      {rule.enabled ? 'Active' : 'Inactive'}
                    </span>
                    <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full">
                      Priority {rule.priority}
                    </span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {rule.description}
                  </p>
                  
                  {/* Rule Stats */}
                  <div className="flex items-center space-x-6 text-sm">
                    <div className="flex items-center space-x-1">
                      <TrendingUp className="w-4 h-4 text-green-500" />
                      <span className="text-gray-600 dark:text-gray-400">
                        {rule.stats.applied} applied
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Filter className="w-4 h-4 text-red-500" />
                      <span className="text-gray-600 dark:text-gray-400">
                        {rule.stats.blocked} blocked
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Sparkles className="w-4 h-4 text-blue-500" />
                      <span className="text-gray-600 dark:text-gray-400">
                        {Math.round(rule.stats.accuracy * 100)}% accuracy
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setSelectedRule(selectedRule?.id === rule.id ? null : rule)}
                    className="px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    {selectedRule?.id === rule.id ? 'Hide Details' : 'View Details'}
                  </button>
                  
                  <button
                    onClick={() => handleToggleRule(rule.id)}
                    className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                      rule.enabled
                        ? 'bg-green-500 text-white hover:bg-green-600'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500'
                    }`}
                  >
                    {rule.enabled ? 'Disable' : 'Enable'}
                  </button>
                </div>
              </div>
              
              {/* Expanded Details */}
              {selectedRule?.id === rule.id && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Conditions */}
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3 flex items-center space-x-2">
                        <Search className="w-4 h-4" />
                        <span>Conditions</span>
                      </h4>
                      <div className="space-y-2">
                        {rule.conditions.map((condition) => (
                          <div key={condition.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium capitalize">
                                {condition.type.replace('_', ' ')}
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {Math.round(condition.confidence * 100)}% confidence
                              </span>
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {condition.operator} "{condition.value}"
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3 flex items-center space-x-2">
                        <Zap className="w-4 h-4" />
                        <span>Actions</span>
                      </h4>
                      <div className="space-y-2">
                        {rule.actions.map((action) => (
                          <div key={action.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                            <div className="text-sm font-medium capitalize mb-1">
                              {action.type.replace('_', ' ')}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {action.value}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Advanced Settings */}
      {showAdvanced && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center space-x-2">
            <Settings className="w-5 h-5" />
            <span>Advanced AI Settings</span>
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                AI Confidence Threshold
              </label>
              <input
                type="range"
                min="0.5"
                max="1.0"
                step="0.05"
                defaultValue="0.8"
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Processing Speed
              </label>
              <select className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700">
                <option value="fast">Fast (Lower Accuracy)</option>
                <option value="balanced" selected>Balanced</option>
                <option value="accurate">Accurate (Slower)</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Learning Mode
              </label>
              <div className="flex items-center space-x-2">
                <input type="checkbox" id="learning-mode" className="rounded" defaultChecked />
                <label htmlFor="learning-mode" className="text-sm text-gray-600 dark:text-gray-400">
                  Enable continuous learning from user feedback
                </label>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Auto-Update Rules
              </label>
              <div className="flex items-center space-x-2">
                <input type="checkbox" id="auto-update" className="rounded" />
                <label htmlFor="auto-update" className="text-sm text-gray-600 dark:text-gray-400">
                  Automatically update filter rules based on AI improvements
                </label>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 