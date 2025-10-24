
'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { 
  BookmarkIcon, 
  BrainIcon, 
  FolderIcon, 
  SearchIcon, 
  ZapIcon,
  ArrowRightIcon 
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const features = [
  {
    icon: BookmarkIcon,
    title: 'Smart Bookmark Management',
    description: 'Organize and manage your bookmarks with intelligent categorization and tagging.'
  },
  {
    icon: BrainIcon,
    title: 'AI-Powered Processing',
    description: 'Automatic content analysis, summarization, and intelligent recommendations.'
  },
  {
    icon: FolderIcon,
    title: 'Kanban Board Organization',
    description: 'Visual organization with drag-and-drop Kanban boards and folder hierarchies.'
  },
  {
    icon: SearchIcon,
    title: 'Advanced Search & Discovery',
    description: 'Powerful search capabilities with filters, tags, and related content suggestions.'
  },
  {
    icon: ZapIcon,
    title: 'Real-time Sync',
    description: 'Access your bookmarks across all devices with real-time synchronization.'
  }
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Header */}
      <header className="fixed top-0 w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <BookmarkIcon className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-slate-900 dark:text-white">BookmarkAI</span>
            </div>
            <div className="flex items-center space-x-4">
              <Button asChild variant="ghost">
                <Link href="/auth/signin">Sign In</Link>
              </Button>
              <Button asChild>
                <Link href="/auth/signup">Get Started</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-slate-900 dark:text-white mb-8">
              Organize Your Bookmarks with{' '}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                AI Power
              </span>
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-300 mb-8 max-w-3xl mx-auto">
              Transform the way you save, organize, and discover content. BookmarkAI uses artificial intelligence 
              to automatically categorize, summarize, and help you rediscover your saved content.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="text-lg px-8 py-3">
                <Link href="/auth/signup">
                  Start Organizing <ArrowRightIcon className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-lg px-8 py-3">
                <Link href="/auth/signin">Sign In</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white/50 dark:bg-slate-800/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Powerful Features
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300">
              Everything you need to manage your digital bookmarks efficiently
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <feature.icon className="h-12 w-12 text-blue-600 mb-4" />
                    <CardTitle>{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-8">
              Ready to Transform Your Bookmark Experience?
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300 mb-8">
              Join thousands of users who have revolutionized their content organization with BookmarkAI.
            </p>
            <Button asChild size="lg" className="text-lg px-8 py-3">
              <Link href="/auth/signup">
                Get Started Free <ArrowRightIcon className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 dark:bg-slate-950 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <BookmarkIcon className="h-8 w-8 text-blue-400" />
              <span className="text-xl font-bold">BookmarkAI</span>
            </div>
            <div className="flex items-center space-x-6">
              <Link href="/auth/signin" className="hover:text-blue-400 transition-colors">
                Sign In
              </Link>
              <Link href="/auth/signup" className="hover:text-blue-400 transition-colors">
                Sign Up
              </Link>
            </div>
          </div>
          <div className="border-t border-slate-700 mt-8 pt-8 text-center text-slate-400">
            <p>&copy; 2024 BookmarkAI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
