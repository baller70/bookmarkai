
'use client';
export const dynamic = 'force-dynamic'

import { Bot, Sparkles, MessageSquare, Code, FileText, Lightbulb } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default function AICopolilotPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Bot className="h-12 w-12 text-blue-600 mr-3" />
            <h1 className="text-4xl font-bold text-gray-900">AI-Copolit</h1>
            <Badge className="ml-3 bg-green-500">New</Badge>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Your intelligent coding companion powered by advanced AI. Get instant help with coding, debugging, and development tasks.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Code className="h-5 w-5 text-blue-600 mr-2" />
                Code Generation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Generate high-quality code snippets, functions, and entire components with natural language descriptions.
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageSquare className="h-5 w-5 text-green-600 mr-2" />
                Code Review
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Get instant feedback on your code quality, performance optimizations, and best practices.
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Lightbulb className="h-5 w-5 text-yellow-600 mr-2" />
                Smart Debugging
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Identify bugs and issues in your code with AI-powered analysis and get suggested fixes.
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 text-purple-600 mr-2" />
                Documentation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Automatically generate comprehensive documentation for your code and APIs.
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Sparkles className="h-5 w-5 text-pink-600 mr-2" />
                Code Optimization
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Optimize your code for better performance, readability, and maintainability.
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bot className="h-5 w-5 text-indigo-600 mr-2" />
                AI Chat Assistant
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Chat with your AI coding assistant for real-time help and programming guidance.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <Card className="max-w-2xl mx-auto bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold mb-4">Ready to boost your productivity?</h2>
              <p className="text-blue-100 mb-6">
                Start using AI-Copolit today and experience the future of coding assistance.
              </p>
              <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
                Get Started
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 