import React from 'react'
// Temporarily disabled Supabase to show dashboard
// import { createClientComponentClient } from '@/lib/supabase'
// import Chat from '@/components/dashboard/Chat'

export default function Dashboard() {
  // const supabase = createClientComponentClient()

  // Removed Supabase authentication for demo

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">🚀 AI-Powered Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Welcome Card */}
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <h2 className="text-xl font-semibold mb-4">Welcome!</h2>
            <p className="text-gray-400 mb-4">
              Your AI-powered SaaS dashboard is ready to use.
            </p>
            <div className="space-y-2 text-sm text-gray-300">
              <div>✅ Next.js 15 Ready</div>
              <div>✅ TypeScript Support</div>
              <div>✅ Tailwind CSS</div>
              <div>✅ AI Integration Ready</div>
            </div>
          </div>

          {/* Stats Card */}
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <h2 className="text-xl font-semibold mb-4">📊 Stats</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">Credits</span>
                <span className="text-yellow-400 font-bold">25</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Messages</span>
                <span className="text-green-400 font-bold">12</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Apps</span>
                <span className="text-blue-400 font-bold">3</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <h2 className="text-xl font-semibold mb-4">⚡ Quick Actions</h2>
            <div className="space-y-3">
              <div className="w-full bg-yellow-600 hover:bg-yellow-700 text-black font-medium py-2 px-4 rounded transition-colors text-center">
                💳 Get Credits
              </div>
              <div className="w-full bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded transition-colors text-center">
                👤 Profile
              </div>
              <div className="w-full bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded transition-colors text-center">
                📚 Docs
              </div>
            </div>
          </div>

          {/* AI Chat Demo */}
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800 md:col-span-2 lg:col-span-3">
            <h2 className="text-xl font-semibold mb-4">💬 AI Chat Interface</h2>
            <div className="bg-black rounded-lg p-4 min-h-[200px] mb-4">
              <div className="space-y-3">
                <div className="bg-gray-800 rounded-lg p-3">
                  <p className="text-sm">
                    <strong className="text-blue-400">You:</strong> Hello! How can I build an AI app?
                  </p>
                </div>
                <div className="bg-yellow-900/30 rounded-lg p-3">
                  <p className="text-sm">
                    <strong className="text-yellow-400">AI:</strong> Great question! With this SaaS kit, you can:
                    <br />• Build chat interfaces with GPT-4
                    <br />• Handle user authentication
                    <br />• Process payments with Stripe
                    <br />• Deploy with Vercel or Netlify
                  </p>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder="Type your message..." 
                className="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white placeholder-gray-400"
                disabled
              />
              <div 
                className="bg-yellow-600 text-black px-4 py-2 rounded font-medium opacity-50 cursor-not-allowed"
              >
                Send
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Demo mode - Connect your API keys to enable full functionality
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 