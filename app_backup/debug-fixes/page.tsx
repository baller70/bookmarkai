
'use client'
export const dynamic = 'force-dynamic'

import { useState, useRef, useEffect } from 'react'

export default function DebugFixes() {
  const [selectedItems, setSelectedItems] = useState<number[]>([])
  const scrollPositionRef = useRef({ x: 0, y: 0 })

  // Monitor selectedItems changes and restore scroll position
  useEffect(() => {
    console.log('📋 Selected items changed:', selectedItems.length)
    
    // Restore scroll position after state update
    const restorePosition = () => {
      const { x, y } = scrollPositionRef.current
      if (y > 0 || x > 0) {
        window.scrollTo({
          left: x,
          top: y,
          behavior: 'auto'
        })
      }
    }
    
    // Multiple restoration attempts to handle React timing
    restorePosition()
    requestAnimationFrame(restorePosition)
    setTimeout(restorePosition, 0)
    setTimeout(restorePosition, 10)
  }, [selectedItems])

  const handleItemSelect = (itemId: number) => {
    // Store current scroll position in ref before state update
    scrollPositionRef.current = {
      x: window.scrollX,
      y: window.scrollY
    }
    
    console.log('📍 Storing scroll position:', scrollPositionRef.current)
    
    // Update state - the useEffect will handle scroll restoration
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    )
  }

  const handleBulkDelete = async () => {
    if (selectedItems.length === 0) {
      alert('No items selected')
      return
    }

    try {
      const response = await fetch('/api/bookmarks/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'delete',
          bookmark_ids: selectedItems
        })
      })

      const data = await response.json()
      
      if (response.ok) {
        alert(`Success: ${JSON.stringify(data)}`)
        setSelectedItems([])
      } else {
        alert(`Error: ${data.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Bulk delete error:', error)
      alert(`Network error: ${error}`)
    }
  }

  // Create some dummy items to test scroll
  const items = Array.from({ length: 50 }, (_, i) => ({
    id: i + 1,
    title: `Test Item ${i + 1}`,
    description: `This is test item number ${i + 1} for testing scroll behavior`
  }))

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Debug Fixes Test Page</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Results</h2>
          <div className="space-y-2">
            <p><strong>Selected Items:</strong> {selectedItems.length}</p>
            <p><strong>Selected IDs:</strong> {selectedItems.join(', ')}</p>
            <p><strong>Scroll Position:</strong> x: {scrollPositionRef.current.x}, y: {scrollPositionRef.current.y}</p>
          </div>
          
          {selectedItems.length > 0 && (
            <button
              onClick={handleBulkDelete}
              className="mt-4 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              Bulk Delete ({selectedItems.length} items)
            </button>
          )}
        </div>

        <div className="space-y-4">
          {items.map((item) => (
            <div
              key={item.id}
              className={`bg-white rounded-lg shadow p-4 border-2 ${
                selectedItems.includes(item.id) ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
              }`}
            >
              <div className="flex items-center space-x-4">
                <input
                  type="checkbox"
                  checked={selectedItems.includes(item.id)}
                  onChange={() => handleItemSelect(item.id)}
                  className="w-5 h-5 text-blue-600"
                />
                <div>
                  <h3 className="font-semibold">{item.title}</h3>
                  <p className="text-gray-600">{item.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
