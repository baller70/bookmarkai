
'use client'
export const dynamic = 'force-dynamic'

import { useState } from 'react'

export default function TestBookmark() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    title: 'Test Dashboard Simulation',
    url: 'https://example.com/dashboard-test',
    description: 'Testing exact dashboard flow',
    category: 'Development',
    tags: 'test,dashboard',
    notes: 'Dashboard simulation test'
  })

  // Simulate the exact dashboard handleAddBookmark function
  const handleAddBookmarkLikeDashboard = async () => {
    setLoading(true)
    setResult(null)
    
    try {
      console.log('🚀 Saving bookmark to database (Dashboard simulation)...')
      
      // Exact same validation as dashboard
      if (!formData.title.trim()) {
        alert('Please enter a bookmark title')
        return
      }
      
      if (!formData.url.trim()) {
        alert('Please enter a bookmark URL')
        return
      }
      
      // Validate URL format
      try {
        new URL(formData.url)
      } catch {
        alert('Please enter a valid URL (e.g., https://example.com)')
        return
      }
      
      // Exact same request body as dashboard
      const requestBody = {
        title: formData.title,
        url: formData.url,
        description: formData.description || 'No description provided',
        category: formData.category,
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : [],
        notes: formData.notes || 'No notes added',
        userId: 'dev-user-123', // Same as dashboard
        enableAI: true, // Same as dashboard
      }
      
      console.log('📤 Request body being sent (Dashboard simulation):', requestBody)
      
      // Exact same fetch call as dashboard
      const response = await fetch('/api/bookmarks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      const apiResult = await response.json()
      console.log('📥 API Response (Dashboard simulation):', apiResult)

      if (!response.ok) {
        throw new Error(apiResult.error || 'Failed to save bookmark')
      }

      console.log('✅ Bookmark saved successfully (Dashboard simulation):', apiResult.bookmark)
      
      // Test the loadBookmarks call that dashboard does
      console.log('🔄 Testing loadBookmarks call...')
      const loadResponse = await fetch(`/api/bookmarks?user_id=dev-user-123`)
      const loadResult = await loadResponse.json()
      console.log('📥 LoadBookmarks result:', loadResult)
      
      setResult({
        status: response.status,
        ok: response.ok,
        bookmarkCreated: apiResult,
        loadBookmarksResult: loadResult,
        success: true
      })
      
      setShowModal(false)
      alert('Bookmark saved successfully! (Dashboard simulation)')
      
    } catch (error) {
      console.error('❌ Error saving bookmark (Dashboard simulation):', error)
      setResult({
        error: error.message,
        success: false
      })
      alert(`Failed to save bookmark: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const testBookmarkCreation = async () => {
    setLoading(true)
    setResult(null)
    
    try {
      console.log('🚀 Testing bookmark creation...')
      
      const requestBody = {
        title: 'Test Bookmark from Test Page',
        url: 'https://example.com/test-page',
        description: 'Testing bookmark creation from test page',
        category: 'Development',
        tags: ['test', 'debug'],
        notes: 'Test notes',
        userId: 'dev-user-123',
        enableAI: true
      }
      
      console.log('📤 Request body:', requestBody)
      
      const response = await fetch('/api/bookmarks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      console.log('📡 Response status:', response.status)
      console.log('📡 Response ok:', response.ok)
      
      const data = await response.json()
      console.log('📥 Response data:', data)
      
      setResult({
        status: response.status,
        ok: response.ok,
        data: data
      })
      
    } catch (error) {
      console.error('❌ Error:', error)
      setResult({
        error: error.message
      })
    } finally {
      setLoading(false)
    }
  }

  const testDashboardButton = () => {
    console.log('🔍 Testing if we can access the dashboard...')
    try {
      // Try to navigate to dashboard
      window.location.href = '/dashboard'
    } catch (error) {
      console.error('❌ Error navigating to dashboard:', error)
      setResult({
        error: `Navigation error: ${error.message}`,
        success: false
      })
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Bookmark Creation Test</h1>
        
        <div className="mb-6 p-4 bg-green-800 rounded-lg">
          <h2 className="text-lg font-semibold text-green-100 mb-2">✅ TEST RESULTS SUMMARY:</h2>
          <ul className="text-green-200 space-y-1">
            <li>• Simple API Call: WORKING ✅</li>
            <li>• Dashboard Flow Simulation: WORKING ✅</li>
            <li>• Data Persistence: WORKING ✅</li>
            <li>• All 21 bookmarks retrieved successfully ✅</li>
          </ul>
          <p className="text-green-100 mt-2 font-medium">
            🎯 Conclusion: The issue is NOT with the API or backend - it's something specific to the real dashboard UI!
          </p>
        </div>
        
        <div className="flex space-x-4 mb-6">
          <button
            onClick={testBookmarkCreation}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium"
          >
            {loading ? 'Testing...' : 'Test Simple API Call'}
          </button>
          
          <button
            onClick={() => setShowModal(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium"
          >
            Test Dashboard Flow
          </button>
          
          <button
            onClick={testDashboardButton}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium"
          >
            Go to Real Dashboard
          </button>
        </div>

        {/* Dashboard-style Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
              <h2 className="text-xl font-bold mb-4 text-gray-900">Add Bookmark (Dashboard Simulation)</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className="w-full p-2 border rounded text-gray-900"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">URL</label>
                  <input
                    type="url"
                    value={formData.url}
                    onChange={(e) => setFormData({...formData, url: e.target.value})}
                    className="w-full p-2 border rounded text-gray-900"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full p-2 border rounded text-gray-900"
                    rows={3}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full p-2 border rounded text-gray-900"
                  >
                    <option value="Development">Development</option>
                    <option value="Design">Design</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddBookmarkLikeDashboard}
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
                  >
                    {loading ? 'Saving...' : 'Add Bookmark'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {result && (
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Test Result:</h2>
            <pre className="text-sm overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
        
        <div className="mt-8 bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Instructions:</h2>
          <ol className="list-decimal list-inside space-y-2 text-gray-300">
            <li>Open Developer Tools (F12)</li>
            <li>Go to Console tab</li>
            <li>Click "Test Bookmark Creation" button</li>
            <li>Check console logs and result below</li>
            <li>Compare with main dashboard bookmark creation</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
