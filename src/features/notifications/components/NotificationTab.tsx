'use client'

import React, { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Bell, Settings, History, Users } from 'lucide-react'
import { NotificationScheduler } from './NotificationScheduler'
import { NotificationPreferences } from './NotificationPreferences'
import { useNotifications } from '../hooks/useNotifications'

interface NotificationTabProps {
  bookmarkId: string
  bookmarkTitle: string
}

export const NotificationTab: React.FC<NotificationTabProps> = ({ 
  bookmarkId, 
  bookmarkTitle 
}) => {
  const { notifications, history } = useNotifications(bookmarkId)
  const [activeTab, setActiveTab] = useState('scheduler')

  const tabs = [
    {
      id: 'scheduler',
      label: 'SCHEDULER',
      icon: Bell,
      badge: notifications.length > 0 ? notifications.length : null
    },
    {
      id: 'preferences',
      label: 'PREFERENCES',
      icon: Settings,
      badge: null
    },
    {
      id: 'history',
      label: 'HISTORY',
      icon: History,
      badge: history.length > 0 ? history.length : null
    },
    {
      id: 'team',
      label: 'TEAM',
      icon: Users,
      badge: 'Premium'
    }
  ]

  const renderTabContent = () => {
    switch (activeTab) {
      case 'scheduler':
        return (
          <NotificationScheduler 
            bookmarkId={bookmarkId} 
            bookmarkTitle={bookmarkTitle} 
          />
        )
      case 'preferences':
        return <NotificationPreferences />
      case 'history':
        return (
          <div className="text-center py-8">
            <History className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">NOTIFICATION HISTORY</h3>
            <p className="text-gray-600 mb-4">Track all sent notifications and their delivery status</p>
            <p className="text-sm text-gray-500">Coming soon - View detailed logs of all notifications</p>
          </div>
        )
      case 'team':
        return (
          <div className="text-center py-8">
            <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">TEAM NOTIFICATIONS</h3>
            <p className="text-gray-600 mb-4">Collaborate with team members on bookmark reminders</p>
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-lg border">
              <Badge className="mb-3">Premium Feature</Badge>
              <h4 className="font-semibold mb-2">Unlock Team Collaboration</h4>
              <ul className="text-sm text-gray-600 space-y-1 mb-4">
                <li>• Share reminders with team members</li>
                <li>• Assign bookmark responsibilities</li>
                <li>• Team notification dashboard</li>
                <li>• Advanced scheduling options</li>
              </ul>
              <button className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium">
                UPGRADE TO PREMIUM
              </button>
            </div>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="w-full">
      {/* Sidebar Layout */}
      <div className="flex gap-6 min-h-[600px]">
        {/* Left Sidebar Navigation */}
        <div className="w-64 flex-shrink-0">
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <h3 className="text-sm font-semibold text-gray-900 mb-4 px-2">NOTIFICATION SETTINGS</h3>
            {tabs.map((tab) => {
              const IconComponent = tab.icon
              const isActive = activeTab === tab.id
              
              return (
                <Button
                  key={tab.id}
                  variant={isActive ? 'default' : 'ghost'}
                  className={`w-full justify-start text-left h-auto py-3 px-3 ${
                    isActive 
                      ? 'bg-blue-600 text-white hover:bg-blue-700' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-3">
                      <IconComponent className="h-4 w-4" />
                      <span className="text-sm font-medium">{tab.label}</span>
                    </div>
                    {tab.badge && (
                      <Badge 
                        variant={isActive ? 'secondary' : 'outline'}
                        className={`text-xs ${
                          isActive 
                            ? 'bg-white/20 text-white border-white/30' 
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {tab.badge}
                      </Badge>
                    )}
                  </div>
                </Button>
              )
            })}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 bg-white rounded-lg border p-6">
          {renderTabContent()}
        </div>
      </div>
    </div>
  )
}