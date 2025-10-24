"use client"

import { Button } from '../ui/button'
import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface DnaPageHeaderProps {
  title: string
  description?: string
  children?: React.ReactNode
}

export function DnaPageHeader({ title, description, children }: DnaPageHeaderProps) {
  const router = useRouter()

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6 py-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/dashboard')}
            className="flex items-center space-x-2 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Dashboard</span>
          </Button>
          <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white uppercase">
              {title}
            </h1>
            {description && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {description}
              </p>
            )}
          </div>
        </div>
        
        {children && (
          <div className="flex items-center space-x-2">
            {children}
          </div>
        )}
      </div>
    </header>
  )
} 