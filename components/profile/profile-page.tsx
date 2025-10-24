
'use client'

import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { 
  ArrowLeftIcon, 
  UserIcon, 
  MailIcon,
  CalendarIcon,
  BookmarkIcon,
  FolderIcon,
  TagIcon,
  TrendingUpIcon
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { formatDistanceToNow } from 'date-fns'

export default function ProfilePage() {
  const { data: session } = useSession()

  const stats = [
    { label: 'Total Bookmarks', value: '42', icon: BookmarkIcon, color: 'text-blue-600' },
    { label: 'Folders Created', value: '8', icon: FolderIcon, color: 'text-green-600' },
    { label: 'Tags Used', value: '24', icon: TagIcon, color: 'text-purple-600' },
    { label: 'Active Days', value: '15', icon: TrendingUpIcon, color: 'text-orange-600' },
  ]

  const recentActivity = [
    { action: 'Created bookmark', item: 'Next.js Documentation', time: '2 hours ago' },
    { action: 'Added to folder', item: 'Development Resources', time: '5 hours ago' },
    { action: 'Tagged bookmark', item: '#javascript #tutorial', time: '1 day ago' },
    { action: 'Created folder', item: 'Learning Resources', time: '3 days ago' },
  ]

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-8">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard">
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Profile</h1>
            <p className="text-slate-600 dark:text-slate-400">
              Your BookmarkAI profile and activity
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="lg:col-span-1"
          >
            <Card>
              <CardHeader className="text-center">
                <Avatar className="h-24 w-24 mx-auto mb-4">
                  <AvatarImage src="" alt={session?.user?.name || ''} />
                  <AvatarFallback className="bg-blue-600 text-white text-2xl">
                    {session?.user?.name?.slice(0, 2)?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <CardTitle>{session?.user?.name || 'User'}</CardTitle>
                <CardDescription className="flex items-center justify-center">
                  <MailIcon className="h-4 w-4 mr-2" />
                  {session?.user?.email}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-400">Member since</span>
                    <Badge variant="secondary" className="flex items-center">
                      <CalendarIcon className="h-3 w-3 mr-1" />
                      {formatDistanceToNow(new Date('2024-01-01'), { addSuffix: true })}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-400">Account Type</span>
                    <Badge variant="outline">Free Plan</Badge>
                  </div>
                </div>
                
                <Button className="w-full mt-6" asChild>
                  <Link href="/settings">
                    <UserIcon className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Stats and Activity */}
          <div className="lg:col-span-2 space-y-6">
            {/* Statistics */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Your Statistics</CardTitle>
                  <CardDescription>
                    An overview of your bookmark activity
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    {stats.map((stat) => (
                      <div key={stat.label} className="flex items-center space-x-3">
                        <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                          <stat.icon className={`h-5 w-5 ${stat.color}`} />
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-slate-900 dark:text-white">
                            {stat.value}
                          </p>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            {stat.label}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Recent Activity */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>
                    Your latest bookmark actions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentActivity.map((activity, index) => (
                      <div key={index} className="flex items-start space-x-3 pb-3 border-b border-slate-200 dark:border-slate-700 last:border-b-0 last:pb-0">
                        <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-slate-900 dark:text-white">
                            <span className="font-medium">{activity.action}</span>
                            <span className="text-slate-600 dark:text-slate-400 ml-1">
                              {activity.item}
                            </span>
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            {activity.time}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}
