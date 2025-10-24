'use client'

import { ChatSidebar } from '@/components/dashboard/ChatSidebar'
import { ShadcnSidebar } from '@/components/dashboard/ShadcnSidebar'
import { DashboardProvider } from '@/components/dashboard/DashboardContext'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {

  return (
    <DashboardProvider>
        <div className="min-h-screen bg-transparent">
          <div className="flex h-screen">
            {/* Sidebar - Always Visible */}
            <div className="flex flex-col bg-transparent">
              <ShadcnSidebar />
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden bg-transparent">
              {/* Page Content */}
              <main className="flex-1 overflow-y-auto bg-transparent">
                {children}
              </main>
            </div>
          </div>

        {/* Chat Sidebar */}
        <ChatSidebar />
      </div>
    </DashboardProvider>
  )
} 