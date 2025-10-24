
'use client'
export const dynamic = 'force-dynamic'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Sparkles, Tag, Zap, Brain } from 'lucide-react'

export default function SmartTagPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <Sparkles className="h-8 w-8 text-purple-600" />
        <div>
          <h1 className="text-2xl font-bold">Smart Tag</h1>
          <p className="text-gray-600">AI-powered automatic tagging for your bookmarks</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Tag className="h-5 w-5" />
              <span>Auto-Tagging</span>
            </CardTitle>
            <CardDescription>
              Automatically generate relevant tags based on content analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Status</span>
                <Badge variant="default">Active</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Accuracy</span>
                <span className="text-sm font-medium">92%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Tags Generated</span>
                <span className="text-sm font-medium">1,247</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Zap className="h-5 w-5" />
              <span>Smart Suggestions</span>
            </CardTitle>
            <CardDescription>
              Get intelligent tag suggestions while bookmarking
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Suggestions Made</span>
                <span className="text-sm font-medium">456</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Accepted</span>
                <span className="text-sm font-medium">89%</span>
              </div>
              <Button variant="outline" size="sm" className="w-full">
                Configure
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Brain className="h-5 w-5" />
              <span>Learning Model</span>
            </CardTitle>
            <CardDescription>
              AI model continuously learns from your tagging patterns
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Training Data</span>
                <span className="text-sm font-medium">2,341 tags</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Last Updated</span>
                <span className="text-sm font-medium">2 hours ago</span>
              </div>
              <Button variant="outline" size="sm" className="w-full">
                Retrain Model
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Auto-Tagged Bookmarks</CardTitle>
          <CardDescription>
            Latest bookmarks that received automatic tags
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { title: "React Performance Optimization", url: "react-perf.dev", tags: ["react", "performance", "optimization", "frontend"] },
              { title: "Machine Learning Fundamentals", url: "ml-basics.com", tags: ["machine-learning", "ai", "education", "python"] },
              { title: "Design System Guidelines", url: "design-sys.io", tags: ["design", "ui-ux", "guidelines", "components"] }
            ].map((bookmark, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <h4 className="font-medium">{bookmark.title}</h4>
                  <p className="text-sm text-gray-600">{bookmark.url}</p>
                </div>
                <div className="flex flex-wrap gap-1">
                  {bookmark.tags.map((tag, tagIndex) => (
                    <Badge key={tagIndex} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 