'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Tabs, TabsContent } from '@/src/components/ui/tabs'
import { Button } from '@/src/components/ui/button'
import { Input } from '@/src/components/ui/input'
import { Badge } from '@/src/components/ui/badge'
import { Switch } from '@/src/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/src/components/ui/select'
import { Checkbox } from '@/src/components/ui/checkbox'
import { Progress } from '@/src/components/ui/progress'
import { 
  Sparkles, Tags, FileText, Copy, ThumbsUp, 
  FolderPlus, Mic, TrendingUp, Bot, Shield, Users, 
  Eye, Camera
} from 'lucide-react'

export default function AICopilot3() {
  const [activeTab, setActiveTab] = useState('smart-tagging')
  const [voiceListening, setVoiceListening] = useState(false)
  
  // Mock data
  const mockBookmarks = [
    { id: '1', title: 'React Documentation', url: 'https://reactjs.org', tags: ['react', 'docs'] },
    { id: '2', title: 'Next.js Guide', url: 'https://nextjs.org', tags: ['nextjs', 'tutorial'] },
    { id: '3', title: 'TypeScript Handbook', url: 'https://typescriptlang.org', tags: ['typescript'] }
  ]

  const aiFeatures = [
    { id: 'smart-tagging', name: 'AI Smart Tagging', icon: Tags, color: 'bg-blue-500' },
    { id: 'summarization', name: 'Content Summarization', icon: FileText, color: 'bg-green-500' },
    { id: 'duplicate-detection', name: 'Duplicate Detection', icon: Copy, color: 'bg-yellow-500' },
    { id: 'recommendations', name: 'Personalized Recommendations', icon: ThumbsUp, color: 'bg-purple-500' },
    { id: 'auto-categories', name: 'Automated Categories', icon: FolderPlus, color: 'bg-indigo-500' },
    { id: 'voice-search', name: 'Voice Search', icon: Mic, color: 'bg-red-500' },
    { id: 'trend-detection', name: 'Trend Detection', icon: TrendingUp, color: 'bg-orange-500' },
    { id: 'smart-folders', name: 'Smart Folder Organization', icon: FolderPlus, color: 'bg-teal-500' },
    { id: 'chat-assistant', name: 'AI Chat Assistant', icon: Bot, color: 'bg-cyan-500' },
    { id: 'health-checker', name: 'Bookmark Health Checker', icon: Shield, color: 'bg-emerald-500' },
    { id: 'collaboration', name: 'Collaborative Annotation', icon: Users, color: 'bg-pink-500' },
    { id: 'paywall-detection', name: 'Paywall Detection', icon: Eye, color: 'bg-amber-500' },
    { id: 'screenshots', name: 'AI Screenshots', icon: Camera, color: 'bg-violet-500' }
  ]

  return (
    <div className="w-full min-h-screen p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            AI-Copilot 3.0
          </h1>
          <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">Ultimate</Badge>
        </div>
        <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
          Advanced AI-powered bookmark management with 13 comprehensive features
        </p>
      </div>

      {/* Feature Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
        {aiFeatures.map((feature) => {
          const Icon = feature.icon
          return (
            <Card 
              key={feature.id} 
              className={`cursor-pointer transition-all hover:scale-105 ${activeTab === feature.id ? 'ring-2 ring-purple-500' : ''}`}
              onClick={() => setActiveTab(feature.id)}
            >
              <CardContent className="p-4 text-center">
                <div className={`p-3 rounded-full ${feature.color} mx-auto mb-3 w-fit`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold text-sm">{feature.name}</h3>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        {/* AI Smart Tagging */}
        <TabsContent value="smart-tagging">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tags className="h-5 w-5" />
                AI Smart Tagging
              </CardTitle>
              <CardDescription>
                Automatically label and organize bookmarks at scale with AI-powered analysis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Selection Panel */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Select Bookmarks</h3>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">Select All</Button>
                    <Button variant="outline" size="sm">Invert</Button>
                    <Button variant="outline" size="sm">Clear</Button>
                  </div>
                </div>
                <div className="space-y-2">
                  {mockBookmarks.map((bookmark) => (
                    <div key={bookmark.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                      <Checkbox />
                      <div className="flex-1">
                        <p className="font-medium">{bookmark.title}</p>
                        <p className="text-sm text-slate-500">{bookmark.url}</p>
                      </div>
                      <div className="flex gap-1">
                        {bookmark.tags.map((tag) => (
                          <Badge key={tag} variant="secondary">{tag}</Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Suggestions */}
              <div className="space-y-4">
                <h3 className="font-semibold">AI Tag Suggestions</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {['frontend', 'documentation', 'javascript', 'tutorial', 'framework'].map((tag, index) => (
                    <div key={tag} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Badge>{tag}</Badge>
                        <Progress value={95 - index * 5} className="w-24" />
                        <span className="text-sm text-slate-500">{95 - index * 5}%</span>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">✓</Button>
                        <Button size="sm" variant="outline">✕</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-4">
                <Button className="bg-gradient-to-r from-blue-500 to-purple-500">
                  Apply All Tags
                </Button>
                <Button variant="outline">Custom Tag Input</Button>
                <Button variant="outline">Move to Folder</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Content Summarization */}
        <TabsContent value="summarization">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                AI-Powered Content Summarization
              </CardTitle>
              <CardDescription>
                Create concise overviews of saved pages with key takeaways
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select bookmarks to summarize" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockBookmarks.map((bookmark) => (
                      <SelectItem key={bookmark.id} value={bookmark.id}>
                        {bookmark.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <div className="flex gap-4">
                  <Button>Generate Summary</Button>
                  <Button variant="outline">Full Summary (5-7 sentences)</Button>
                </div>
              </div>

              <Card className="bg-slate-50 dark:bg-slate-800">
                <CardContent className="p-4">
                  <h4 className="font-semibold mb-2">AI Summary</h4>
                  <p className="text-sm mb-4">
                    React is a JavaScript library for building user interfaces, particularly web applications. 
                    It allows developers to create reusable UI components and manage application state efficiently.
                  </p>
                  <div className="space-y-2">
                    <h5 className="font-medium">Key Takeaways:</h5>
                    <ul className="text-sm space-y-1 list-disc list-inside">
                      <li>Component-based architecture</li>
                      <li>Virtual DOM for performance</li>
                      <li>Declarative programming model</li>
                    </ul>
                  </div>
                  <div className="flex justify-between items-center mt-4">
                    <span className="text-xs text-slate-500">Reading time: 3 min</span>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">Edit</Button>
                      <Button size="sm" variant="outline">Export</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Voice Search */}
        <TabsContent value="voice-search">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mic className="h-5 w-5" />
                Voice Search & Commands
              </CardTitle>
              <CardDescription>
                Hands-free control with custom voice commands
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center space-y-4">
                <div className={`p-8 rounded-full mx-auto w-fit transition-all ${voiceListening ? 'bg-red-500 animate-pulse' : 'bg-slate-200'}`}>
                  <Mic className={`h-12 w-12 ${voiceListening ? 'text-white' : 'text-slate-600'}`} />
                </div>
                <Button 
                  onClick={() => setVoiceListening(!voiceListening)}
                  className={voiceListening ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'}
                >
                  {voiceListening ? 'Stop Listening' : 'Start Voice Search'}
                </Button>
                {voiceListening && (
                  <p className="text-sm text-slate-500">Listening for commands...</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Voice Commands</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div>&quot;Find bookmarks about React&quot;</div>
                    <div>&quot;Add bookmark to Development folder&quot;</div>
                    <div>&quot;Show me trending topics&quot;</div>
                    <div>&quot;Summarize this page&quot;</div>
                    <div>&quot;Check for duplicates&quot;</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Voice Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Voice Recognition</span>
                      <Switch />
                    </div>
                    <div className="space-y-2">
                      <span className="text-sm">Language</span>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="English (US)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en-us">English (US)</SelectItem>
                          <SelectItem value="en-uk">English (UK)</SelectItem>
                          <SelectItem value="es">Spanish</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Chat Assistant */}
        <TabsContent value="chat-assistant">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                AI Chat Assistant
              </CardTitle>
              <CardDescription>
                Natural language queries about your bookmarks
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="h-96 border rounded-lg p-4 space-y-4 overflow-y-auto bg-slate-50 dark:bg-slate-800">
                <div className="flex gap-3">
                  <div className="p-2 bg-blue-500 rounded-full">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                  <div className="bg-white dark:bg-slate-700 p-3 rounded-lg max-w-xs">
                    <p className="text-sm">Hello! I can help you find, organize, and manage your bookmarks. What would you like to know?</p>
                  </div>
                </div>
                
                <div className="flex gap-3 justify-end">
                  <div className="bg-blue-500 text-white p-3 rounded-lg max-w-xs">
                    <p className="text-sm">Show me all bookmarks about JavaScript</p>
                  </div>
                  <div className="p-2 bg-slate-300 rounded-full">
                    <span className="text-xs">You</span>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <div className="p-2 bg-blue-500 rounded-full">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                  <div className="bg-white dark:bg-slate-700 p-3 rounded-lg max-w-xs">
                    <p className="text-sm">I found 12 bookmarks related to JavaScript. Here are the most relevant ones:</p>
                    <div className="mt-2 space-y-1">
                      <div className="text-xs p-2 bg-slate-100 dark:bg-slate-600 rounded">React Documentation</div>
                      <div className="text-xs p-2 bg-slate-100 dark:bg-slate-600 rounded">JavaScript ES6 Guide</div>
                      <div className="text-xs p-2 bg-slate-100 dark:bg-slate-600 rounded">Node.js Tutorial</div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Input placeholder="Ask me anything about your bookmarks..." className="flex-1" />
                <Button>Send</Button>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm">Find duplicates</Button>
                <Button variant="outline" size="sm">Suggest categories</Button>
                <Button variant="outline" size="sm">Show trending topics</Button>
                <Button variant="outline" size="sm">Health check</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Additional tabs would continue here for the remaining features */}
      </Tabs>

      {/* Usage Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Usage Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-500">247</div>
              <div className="text-sm text-slate-500">Tags Generated</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-500">89</div>
              <div className="text-sm text-slate-500">Summaries Created</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-500">12</div>
              <div className="text-sm text-slate-500">Duplicates Found</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-500">156</div>
              <div className="text-sm text-slate-500">Voice Commands</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 