
'use client'
export const dynamic = 'force-dynamic'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Bot, Sparkles, BrainCircuit, TrendingUp, Zap, Target } from 'lucide-react'

export default function AICopilotPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <Bot className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-2xl font-bold">AI LinkPilot Overview</h1>
          <p className="text-gray-600">Your intelligent bookmark management assistant</p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Smart Tags Generated</CardTitle>
            <Sparkles className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,247</div>
            <p className="text-xs text-muted-foreground">
              +12% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Accuracy</CardTitle>
            <Target className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">94%</div>
            <p className="text-xs text-muted-foreground">
              +2% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Predictions Made</CardTitle>
            <BrainCircuit className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">456</div>
            <p className="text-xs text-muted-foreground">
              +23% from last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* AI Features */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              <span>Smart Tagging</span>
            </CardTitle>
            <CardDescription>
              Automatically categorize and tag your bookmarks using AI
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Progress</span>
                <span className="text-sm font-medium">92%</span>
              </div>
              <Progress value={92} className="w-full" />
              <div className="flex justify-between text-sm text-gray-600">
                <span>1,147 tagged</span>
                <span>100 remaining</span>
              </div>
              <Button variant="outline" size="sm" className="w-full">
                View Smart Tags
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BrainCircuit className="h-5 w-5 text-blue-600" />
              <span>AI Filtering</span>
            </CardTitle>
            <CardDescription>
              Intelligent content filtering and recommendation system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Active Filters</span>
                <Badge variant="secondary">7</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Recommendations</span>
                <Badge variant="default">23 new</Badge>
              </div>
              <Button variant="outline" size="sm" className="w-full">
                Manage Filters
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent AI Activity</CardTitle>
          <CardDescription>
            Latest AI-powered actions on your bookmarks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { action: "Auto-tagged", item: "React Performance Guide", tags: ["react", "performance"], time: "2 minutes ago" },
              { action: "Predicted relevance", item: "Machine Learning Basics", score: "95%", time: "5 minutes ago" },
              { action: "Filtered content", item: "Design System Resources", reason: "High priority", time: "10 minutes ago" },
              { action: "Generated summary", item: "JavaScript Best Practices", length: "3 key points", time: "15 minutes ago" }
            ].map((activity, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div>
                    <p className="font-medium">{activity.action}</p>
                    <p className="text-sm text-gray-600">{activity.item}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center space-x-2">
                    {activity.tags && (
                      <div className="flex space-x-1">
                        {activity.tags.map((tag, tagIndex) => (
                          <Badge key={tagIndex} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                    {activity.score && <Badge variant="default">{activity.score}</Badge>}
                    {activity.reason && <Badge variant="outline">{activity.reason}</Badge>}
                    {activity.length && <Badge variant="secondary">{activity.length}</Badge>}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common AI-powered tasks you can perform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
              <Zap className="h-6 w-6 text-yellow-500" />
              <span>Retrain AI Model</span>
              <span className="text-xs text-gray-500">Update with recent data</span>
            </Button>
            
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
              <TrendingUp className="h-6 w-6 text-green-500" />
              <span>Generate Report</span>
              <span className="text-xs text-gray-500">AI insights summary</span>
            </Button>
            
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
              <Target className="h-6 w-6 text-blue-500" />
              <span>Optimize Settings</span>
              <span className="text-xs text-gray-500">Auto-tune AI parameters</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 