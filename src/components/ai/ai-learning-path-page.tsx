'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { DnaPageHeader } from '../dna-profile/dna-page-header';
import { 
  GraduationCap, 
  BookOpen, 
  CheckCircle, 
  Clock,
  Star,
  RefreshCw,
  Target,
  ArrowRight,
  PlayCircle
} from 'lucide-react';

interface LearningStep {
  id: string;
  title: string;
  description: string;
  bookmarkUrl: string;
  estimatedTime: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  isCompleted: boolean;
  prerequisiteIds: string[];
}

interface LearningPath {
  id: string;
  title: string;
  description: string;
  category: string;
  totalSteps: number;
  completedSteps: number;
  estimatedHours: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  steps: LearningStep[];
  tags: string[];
}

export default function AILearningPathPage() {
  const [learningPaths, setLearningPaths] = useState<LearningPath[]>([]);
  const [selectedPath, setSelectedPath] = useState<LearningPath | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    loadLearningPaths();
  }, []);

  const loadLearningPaths = async () => {
    // Mock learning paths data
    const mockPaths: LearningPath[] = [
      {
        id: '1',
        title: 'React Development Mastery',
        description: 'Complete path from React basics to advanced patterns and best practices',
        category: 'Web Development',
        totalSteps: 8,
        completedSteps: 3,
        estimatedHours: 24,
        difficulty: 'intermediate',
        tags: ['React', 'JavaScript', 'Frontend'],
        steps: [
          {
            id: '1-1',
            title: 'React Fundamentals',
            description: 'Learn the basics of React components, props, and state',
            bookmarkUrl: 'https://react.dev/learn',
            estimatedTime: '3 hours',
            difficulty: 'beginner',
            isCompleted: true,
            prerequisiteIds: []
          },
          {
            id: '1-2',
            title: 'Hooks Deep Dive',
            description: 'Master useState, useEffect, and custom hooks',
            bookmarkUrl: 'https://react.dev/reference/react',
            estimatedTime: '4 hours',
            difficulty: 'intermediate',
            isCompleted: true,
            prerequisiteIds: ['1-1']
          },
          {
            id: '1-3',
            title: 'State Management',
            description: 'Learn Context API and state management patterns',
            bookmarkUrl: 'https://react.dev/learn/managing-state',
            estimatedTime: '3 hours',
            difficulty: 'intermediate',
            isCompleted: true,
            prerequisiteIds: ['1-2']
          },
          {
            id: '1-4',
            title: 'Performance Optimization',
            description: 'React.memo, useMemo, useCallback, and performance best practices',
            bookmarkUrl: 'https://react.dev/learn/render-and-commit',
            estimatedTime: '3 hours',
            difficulty: 'advanced',
            isCompleted: false,
            prerequisiteIds: ['1-3']
          }
        ]
      },
      {
        id: '2',
        title: 'AI Tools for Developers',
        description: 'Comprehensive guide to integrating AI tools in your development workflow',
        category: 'AI & Productivity',
        totalSteps: 6,
        completedSteps: 1,
        estimatedHours: 18,
        difficulty: 'beginner',
        tags: ['AI', 'ChatGPT', 'Copilot', 'Productivity'],
        steps: [
          {
            id: '2-1',
            title: 'Introduction to AI Coding Assistants',
            description: 'Overview of GitHub Copilot, ChatGPT, and other AI tools',
            bookmarkUrl: 'https://github.com/features/copilot',
            estimatedTime: '2 hours',
            difficulty: 'beginner',
            isCompleted: true,
            prerequisiteIds: []
          },
          {
            id: '2-2',
            title: 'Prompt Engineering for Code',
            description: 'Learn effective prompting techniques for coding tasks',
            bookmarkUrl: 'https://openai.com/blog/chatgpt',
            estimatedTime: '3 hours',
            difficulty: 'beginner',
            isCompleted: false,
            prerequisiteIds: ['2-1']
          }
        ]
      },
      {
        id: '3',
        title: 'Design System Fundamentals',
        description: 'Build consistent and scalable design systems from scratch',
        category: 'Design',
        totalSteps: 5,
        completedSteps: 0,
        estimatedHours: 15,
        difficulty: 'intermediate',
        tags: ['Design Systems', 'Figma', 'Component Libraries'],
        steps: [
          {
            id: '3-1',
            title: 'Design Tokens',
            description: 'Create and manage design tokens for consistency',
            bookmarkUrl: 'https://figma.com',
            estimatedTime: '3 hours',
            difficulty: 'beginner',
            isCompleted: false,
            prerequisiteIds: []
          }
        ]
      }
    ];
    setLearningPaths(mockPaths);
  };

  const generateLearningPath = async () => {
    setIsGenerating(true);
    try {
      // Simulate AI path generation
      await new Promise(resolve => setTimeout(resolve, 3000));
      await loadLearningPaths();
    } catch (error) {
      console.error('Error generating learning path:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const markStepCompleted = (pathId: string, stepId: string) => {
    setLearningPaths(prev => prev.map(path => {
      if (path.id === pathId) {
        const updatedSteps = path.steps.map(step => 
          step.id === stepId ? { ...step, isCompleted: true } : step
        );
        const completedCount = updatedSteps.filter(step => step.isCompleted).length;
        return { ...path, steps: updatedSteps, completedSteps: completedCount };
      }
      return path;
    }));
    
    // Update selected path if it's the current one
    if (selectedPath && selectedPath.id === pathId) {
      const updatedPath = learningPaths.find(p => p.id === pathId);
      if (updatedPath) {
        setSelectedPath(updatedPath);
      }
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-100 text-green-800';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800';
      case 'advanced':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress === 100) return 'bg-green-500';
    if (progress >= 50) return 'bg-blue-500';
    return 'bg-gray-400';
  };

  if (selectedPath) {
    return (
      <div className="space-y-6">
        {/* Path Header */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => setSelectedPath(null)}
            className="flex items-center gap-2"
          >
            ← Back to Paths
          </Button>
          <div className="flex items-center gap-2">
            <Badge className={getDifficultyColor(selectedPath.difficulty)}>
              {selectedPath.difficulty}
            </Badge>
            <Badge variant="secondary">
              {selectedPath.completedSteps}/{selectedPath.totalSteps} Complete
            </Badge>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-6 w-6" />
              {selectedPath.title}
            </CardTitle>
            <p className="text-gray-600 dark:text-gray-400">
              {selectedPath.description}
            </p>
            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {selectedPath.estimatedHours} hours
              </span>
              <span className="flex items-center gap-1">
                <BookOpen className="h-4 w-4" />
                {selectedPath.category}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <div className="flex items-center justify-between text-sm mb-2">
                <span>Progress</span>
                <span>{Math.round((selectedPath.completedSteps / selectedPath.totalSteps) * 100)}%</span>
              </div>
              <Progress 
                value={(selectedPath.completedSteps / selectedPath.totalSteps) * 100} 
                className="h-3"
              />
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
              {selectedPath.tags.map((tag, index) => (
                <Badge key={index} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Learning Steps */}
        <div className="space-y-4">
          {selectedPath.steps.map((step, index) => {
            const canStart = step.prerequisiteIds.every(prereqId => 
              selectedPath.steps.find(s => s.id === prereqId)?.isCompleted
            );
            const isLocked = !canStart && step.prerequisiteIds.length > 0;

            return (
              <Card 
                key={step.id} 
                className={`transition-all ${
                  step.isCompleted 
                    ? 'bg-green-50 dark:bg-green-900/10 border-green-200' 
                    : isLocked 
                    ? 'opacity-60' 
                    : 'hover:shadow-md'
                }`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-semibold text-sm">
                          {index + 1}
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">{step.title}</h3>
                          <p className="text-gray-600 dark:text-gray-400 text-sm">
                            {step.description}
                          </p>
                        </div>
                      </div>
                      
                      <div className="ml-11 flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {step.estimatedTime}
                        </span>
                        <Badge className={getDifficultyColor(step.difficulty)}>
                          {step.difficulty}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {step.isCompleted ? (
                        <div className="flex items-center gap-2 text-green-600">
                          <CheckCircle className="h-5 w-5" />
                          <span className="text-sm font-medium">Completed</span>
                        </div>
                      ) : isLocked ? (
                        <Badge variant="secondary" className="text-xs">
                          Locked
                        </Badge>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(step.bookmarkUrl, '_blank')}
                            className="flex items-center gap-1"
                          >
                            <PlayCircle className="h-4 w-4" />
                            Start
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => markStepCompleted(selectedPath.id, step.id)}
                            className="flex items-center gap-1"
                          >
                            <CheckCircle className="h-4 w-4" />
                            Complete
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Standardized Header */}
      <DnaPageHeader 
        title="AI LEARNING PATH"
        description="AI-curated personalized learning journeys based on your bookmarks and interests"
      >
        <Button
          onClick={generateLearningPath}
          disabled={isGenerating}
          className="flex items-center gap-2"
        >
          {isGenerating ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <GraduationCap className="h-4 w-4" />
          )}
          {isGenerating ? 'Generating...' : 'Generate New Path'}
        </Button>
      </DnaPageHeader>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Paths</p>
                <p className="text-2xl font-bold">{learningPaths.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">In Progress</p>
                <p className="text-2xl font-bold">
                  {learningPaths.filter(p => p.completedSteps > 0 && p.completedSteps < p.totalSteps).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">
                  {learningPaths.filter(p => p.completedSteps === p.totalSteps).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Hours</p>
                <p className="text-2xl font-bold">
                  {learningPaths.reduce((sum, path) => sum + path.estimatedHours, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Learning Paths Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {learningPaths.map((path) => {
          const progressPercentage = (path.completedSteps / path.totalSteps) * 100;
          
          return (
            <Card 
              key={path.id} 
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setSelectedPath(path)}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <GraduationCap className="h-5 w-5" />
                    {path.title}
                  </CardTitle>
                  <Badge className={getDifficultyColor(path.difficulty)}>
                    {path.difficulty}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {path.description}
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Progress */}
                  <div>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span>Progress</span>
                      <span>{path.completedSteps}/{path.totalSteps} steps</span>
                    </div>
                    <Progress value={progressPercentage} className="h-2" />
                  </div>

                  {/* Metadata */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium text-gray-600 dark:text-gray-400">Category</p>
                      <p>{path.category}</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-600 dark:text-gray-400">Duration</p>
                      <p>{path.estimatedHours} hours</p>
                    </div>
                  </div>

                  {/* Tags */}
                  <div>
                    <div className="flex flex-wrap gap-1">
                      {path.tags.slice(0, 3).map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {path.tags.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{path.tags.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Action */}
                  <Button 
                    className="w-full flex items-center gap-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPath(path);
                    }}
                  >
                    {progressPercentage === 100 ? (
                      <>
                        <CheckCircle className="h-4 w-4" />
                        Review Path
                      </>
                    ) : progressPercentage > 0 ? (
                      <>
                        <PlayCircle className="h-4 w-4" />
                        Continue Learning
                      </>
                    ) : (
                      <>
                        <ArrowRight className="h-4 w-4" />
                        Start Learning
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {learningPaths.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <GraduationCap className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold mb-2">No Learning Paths Available</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {isGenerating 
                ? 'AI is analyzing your bookmarks to create personalized learning paths...' 
                : 'Generate AI-powered learning paths based on your bookmarks and interests.'
              }
            </p>
            {!isGenerating && (
              <Button onClick={generateLearningPath}>
                Generate Learning Paths
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
} 