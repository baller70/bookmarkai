'use client'

import { useState, useEffect } from 'react'
import { createDemoSupabaseClient, DEMO_USER_ID } from '../../../../lib/supabase-demo'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { HelpCircle, Save, ChevronRight, ChevronLeft, Brain, Lightbulb } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface InsightQuestion {
  id: string
  category: string
  question: string
  type: 'multiple_choice' | 'scale' | 'text' | 'boolean'
  options?: string[]
  description?: string
}

interface InsightResponse {
  question_id: string
  response: string | number
  category: string
}

interface InsightData {
  id?: string
  user_id?: string
  responses: InsightResponse[]
  insights_generated: Record<string, unknown>
  completion_percentage: number
  last_updated: string
}

const insightQuestions: InsightQuestion[] = [
  // Learning Style & Preferences
  {
    id: 'learning_motivation',
    category: 'Learning Style',
    question: 'What primarily motivates you to learn new things?',
    type: 'multiple_choice',
    options: [
      'Solving immediate work problems',
      'Personal curiosity and interest',
      'Career advancement opportunities',
      'Staying current with industry trends',
      'Building expertise in specific areas'
    ],
    description: 'Understanding your learning motivation helps us recommend the most relevant content'
  },
  {
    id: 'content_discovery',
    category: 'Learning Style',
    question: 'How do you prefer to discover new content?',
    type: 'multiple_choice',
    options: [
      'Recommended by colleagues or experts',
      'Trending topics and popular content',
      'Systematic exploration of topics',
      'Serendipitous discovery while browsing',
      'Curated lists and collections'
    ]
  },
  {
    id: 'learning_depth',
    category: 'Learning Style',
    question: 'When learning something new, do you prefer to:',
    type: 'multiple_choice',
    options: [
      'Get a broad overview first, then dive deeper',
      'Start with fundamentals and build systematically',
      'Jump into practical examples and learn by doing',
      'Focus on specific aspects that interest me most',
      'Learn through discussions and interactions'
    ]
  },
  
  // Information Processing
  {
    id: 'information_retention',
    category: 'Information Processing',
    question: 'What helps you retain information best?',
    type: 'multiple_choice',
    options: [
      'Taking detailed notes and highlights',
      'Discussing with others or teaching',
      'Practical application and practice',
      'Visual aids and diagrams',
      'Regular review and repetition'
    ]
  },
  {
    id: 'complexity_preference',
    category: 'Information Processing',
    question: 'How do you prefer complex topics to be presented?',
    type: 'scale',
    description: 'Rate from 1 (simplified summaries) to 5 (full technical detail)'
  },
  {
    id: 'multitasking_learning',
    category: 'Information Processing',
    question: 'Do you prefer to focus on one topic at a time or explore multiple related topics simultaneously?',
    type: 'multiple_choice',
    options: [
      'One topic at a time, deep focus',
      'Multiple related topics to see connections',
      'Mix of both depending on the subject',
      'Whatever matches my current mood',
      'Depends on time availability'
    ]
  },

  // Professional Goals
  {
    id: 'career_direction',
    category: 'Professional Goals',
    question: 'What best describes your current career direction?',
    type: 'multiple_choice',
    options: [
      'Deepening expertise in my current field',
      'Transitioning to a new field or role',
      'Building leadership and management skills',
      'Developing entrepreneurial capabilities',
      'Exploring multiple career paths'
    ]
  },
  {
    id: 'skill_priority',
    category: 'Professional Goals',
    question: 'Which type of skills are most important for your goals?',
    type: 'multiple_choice',
    options: [
      'Technical and specialized skills',
      'Leadership and people management',
      'Strategic thinking and planning',
      'Communication and presentation',
      'Creative and innovation skills'
    ]
  },
  {
    id: 'impact_preference',
    category: 'Professional Goals',
    question: 'What type of impact do you want to make in your work?',
    type: 'text',
    description: 'Describe the kind of impact or change you want to create through your work'
  },

  // Content Preferences
  {
    id: 'content_freshness',
    category: 'Content Preferences',
    question: 'How important is it that content is very recent?',
    type: 'scale',
    description: 'Rate from 1 (timeless content is fine) to 5 (must be very recent)'
  },
  {
    id: 'author_credibility',
    category: 'Content Preferences',
    question: 'What makes an author or source credible to you?',
    type: 'multiple_choice',
    options: [
      'Academic credentials and research',
      'Industry experience and track record',
      'Popular recognition and following',
      'Practical results and case studies',
      'Peer recommendations and reviews'
    ]
  },
  {
    id: 'content_format_preference',
    category: 'Content Preferences',
    question: 'Which content formats do you find most valuable?',
    type: 'multiple_choice',
    options: [
      'In-depth articles and research papers',
      'Practical tutorials and how-to guides',
      'Video content and presentations',
      'Interactive content and tools',
      'Podcasts and audio content'
    ]
  },

  // Challenges & Pain Points
  {
    id: 'learning_obstacles',
    category: 'Challenges',
    question: 'What are your biggest obstacles to learning?',
    type: 'multiple_choice',
    options: [
      'Limited time availability',
      'Information overload and too many options',
      'Difficulty finding relevant, quality content',
      'Lack of practical application opportunities',
      'Staying motivated and consistent'
    ]
  },
  {
    id: 'decision_difficulty',
    category: 'Challenges',
    question: 'What makes it hardest to decide what to learn next?',
    type: 'text',
    description: 'Describe the main challenges you face when choosing what to focus on learning'
  },
  {
    id: 'knowledge_gaps',
    category: 'Challenges',
    question: 'How do you typically identify gaps in your knowledge?',
    type: 'multiple_choice',
    options: [
      'Feedback from work situations or projects',
      'Comparing myself to others in my field',
      'Industry trends and job requirements',
      'Personal reflection and self-assessment',
      'Recommendations from mentors or peers'
    ]
  }
]

export default function InsightQuestionsPage() {
  const [responses, setResponses] = useState<{ [key: string]: string | number }>({})
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [insights, setInsights] = useState<any>(null)
  
  const supabase = createDemoSupabaseClient()
  const currentQuestion = insightQuestions[currentQuestionIndex]

  useEffect(() => {
    loadInsights()
  }, [])

  const loadInsights = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('dna_insights')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (data) {
        setInsights(data)
        // Convert responses array to object for easier handling
        const responseObj: { [key: string]: string | number } = {}
        data.responses.forEach((resp: InsightResponse) => {
          responseObj[resp.question_id] = resp.response
        })
        setResponses(responseObj)
        
        // Find the first unanswered question
        const firstUnanswered = insightQuestions.findIndex(q => !responseObj[q.id])
        if (firstUnanswered !== -1) {
          setCurrentQuestionIndex(firstUnanswered)
        }
      }
    } catch (error) {
      console.error('Error loading insights:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveInsights = async () => {
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Convert responses object to array format
      const responsesArray: InsightResponse[] = Object.entries(responses).map(([question_id, response]) => {
        const question = insightQuestions.find(q => q.id === question_id)
        return {
          question_id,
          response,
          category: question?.category || 'Unknown'
        }
      })

      const completionPercentage = (Object.keys(responses).length / insightQuestions.length) * 100

      const insightData: InsightData = {
        user_id: user.id,
        responses: responsesArray,
        insights_generated: {}, // This would be populated by AI analysis
        completion_percentage: completionPercentage,
        last_updated: new Date().toISOString()
      }

      const { error } = await supabase
        .from('dna_insights')
        .upsert(insightData)

      if (error) throw error

      setInsights(insightData)
      
      toast({
        title: "Insights saved successfully!",
        description: `${Math.round(completionPercentage)}% complete`,
      })
    } catch (error) {
      console.error('Error saving insights:', error)
      toast({
        title: "Error saving insights",
        description: "Please try again later.",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  const handleResponse = (value: string | number) => {
    setResponses(prev => ({
      ...prev,
      [currentQuestion.id]: value
    }))
  }

  const nextQuestion = () => {
    if (currentQuestionIndex < insightQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
    }
  }

  const prevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1)
    }
  }

  const goToQuestion = (index: number) => {
    setCurrentQuestionIndex(index)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  const answeredQuestions = Object.keys(responses).length
  const completionPercentage = (answeredQuestions / insightQuestions.length) * 100

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Insight Questions</h2>
          <p className="text-gray-600 mt-2">Help us understand your learning preferences and goals</p>
        </div>
        <Button onClick={saveInsights} disabled={saving} className="flex items-center gap-2">
          {saving ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          ) : (
            <Save className="h-4 w-4" />
          )}
          {saving ? 'Saving...' : 'Save Progress'}
        </Button>
      </div>

      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Progress Overview
          </CardTitle>
          <CardDescription>
            {answeredQuestions} of {insightQuestions.length} questions completed
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Progress value={completionPercentage} className="flex-1" />
            <span className="text-sm font-medium">{Math.round(completionPercentage)}%</span>
          </div>
          
          {/* Category Progress */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from(new Set(insightQuestions.map(q => q.category))).map(category => {
              const categoryQuestions = insightQuestions.filter(q => q.category === category)
              const categoryAnswered = categoryQuestions.filter(q => responses[q.id]).length
              const categoryProgress = (categoryAnswered / categoryQuestions.length) * 100
              
              return (
                <div key={category} className="text-center">
                  <div className="text-sm font-medium text-gray-700">{category}</div>
                  <div className="text-xs text-gray-500">
                    {categoryAnswered}/{categoryQuestions.length}
                  </div>
                  <Progress value={categoryProgress} className="h-2 mt-1" />
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Current Question */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="outline">{currentQuestion.category}</Badge>
              <span className="text-sm text-gray-500">
                Question {currentQuestionIndex + 1} of {insightQuestions.length}
              </span>
            </div>
            <HelpCircle className="h-5 w-5 text-gray-400" />
          </div>
          <CardTitle className="text-xl">{currentQuestion.question}</CardTitle>
          {currentQuestion.description && (
            <CardDescription>{currentQuestion.description}</CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Question Input */}
          {currentQuestion.type === 'multiple_choice' && (
            <RadioGroup
              value={responses[currentQuestion.id]?.toString()}
              onValueChange={handleResponse}
            >
              {currentQuestion.options?.map((option, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <RadioGroupItem value={option} id={`option-${index}`} />
                  <Label htmlFor={`option-${index}`} className="cursor-pointer">
                    {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          )}

          {currentQuestion.type === 'scale' && (
            <div className="space-y-4">
              <div className="flex justify-between text-sm text-gray-600">
                <span>1</span>
                <span>2</span>
                <span>3</span>
                <span>4</span>
                <span>5</span>
              </div>
              <RadioGroup
                value={responses[currentQuestion.id]?.toString()}
                onValueChange={(value) => handleResponse(parseInt(value))}
                className="flex justify-between"
              >
                {[1, 2, 3, 4, 5].map((value) => (
                  <div key={value} className="flex flex-col items-center">
                    <RadioGroupItem value={value.toString()} id={`scale-${value}`} />
                    <Label htmlFor={`scale-${value}`} className="cursor-pointer text-xs mt-1">
                      {value}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          )}

          {currentQuestion.type === 'text' && (
            <Textarea
              value={responses[currentQuestion.id]?.toString() || ''}
              onChange={(e) => handleResponse(e.target.value)}
              placeholder="Share your thoughts..."
              rows={4}
            />
          )}

          {currentQuestion.type === 'boolean' && (
            <RadioGroup
              value={responses[currentQuestion.id]?.toString()}
              onValueChange={handleResponse}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yes" id="yes" />
                <Label htmlFor="yes" className="cursor-pointer">Yes</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id="no" />
                <Label htmlFor="no" className="cursor-pointer">No</Label>
              </div>
            </RadioGroup>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between pt-6 border-t">
            <Button
              variant="outline"
              onClick={prevQuestion}
              disabled={currentQuestionIndex === 0}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>

            <div className="flex gap-2">
              {insightQuestions.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToQuestion(index)}
                  className={`w-3 h-3 rounded-full border-2 transition-colors ${
                    index === currentQuestionIndex
                      ? 'bg-primary border-primary'
                      : responses[insightQuestions[index].id]
                      ? 'bg-green-500 border-green-500'
                      : 'bg-gray-200 border-gray-300'
                  }`}
                />
              ))}
            </div>

            <Button
              onClick={nextQuestion}
              disabled={currentQuestionIndex === insightQuestions.length - 1}
              className="flex items-center gap-2"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Insights Preview */}
      {answeredQuestions > 5 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5" />
              Your Learning Insights
            </CardTitle>
            <CardDescription>
              Based on your responses, here's what we're learning about you
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-blue-900">Learning Style</h4>
                <p className="text-sm text-blue-700 mt-1">
                  {responses['learning_motivation'] && `Motivated by ${responses['learning_motivation']}`}
                </p>
              </div>
              
              <div className="p-4 bg-green-50 rounded-lg">
                <h4 className="font-semibold text-green-900">Content Preference</h4>
                <p className="text-sm text-green-700 mt-1">
                  {responses['content_format_preference'] && `Prefers ${responses['content_format_preference']}`}
                </p>
              </div>
              
              <div className="p-4 bg-purple-50 rounded-lg">
                <h4 className="font-semibold text-purple-900">Career Focus</h4>
                <p className="text-sm text-purple-700 mt-1">
                  {responses['career_direction'] && `Direction: ${responses['career_direction']}`}
                </p>
              </div>
              
              <div className="p-4 bg-orange-50 rounded-lg">
                <h4 className="font-semibold text-orange-900">Learning Challenge</h4>
                <p className="text-sm text-orange-700 mt-1">
                  {responses['learning_obstacles'] && `Main obstacle: ${responses['learning_obstacles']}`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={saveInsights} disabled={saving} size="lg" className="flex items-center gap-2">
          {saving ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          ) : (
            <Save className="h-4 w-4" />
          )}
          {saving ? 'Saving Insights...' : 'Save & Continue'}
        </Button>
      </div>
    </div>
  )
}
