'use client'

import React, { useState } from 'react'
import { Sparkles, ArrowRight, Plus, BookOpen, Star, Filter, Brain } from 'lucide-react'
import { TypewriterEffect } from '../ui/typewriter-effect'

export default function Oracle() {
  const [query, setQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isFocused, setIsFocused] = useState(false)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return
    
    setIsLoading(true)
    // TODO: Implement Oracle search functionality
    console.log('Oracle search:', query)
    
    // Simulate search delay
    setTimeout(() => {
      setIsLoading(false)
    }, 1000)
  }

  const suggestions = [
    { icon: Plus, text: "Create a new bookmark" },
    { icon: BookOpen, text: "Find bookmarks about AI" },
    { icon: Star, text: "Show my favorite bookmarks" },
    { icon: Filter, text: "Filter by category" }
  ]

  return (
    <div className="w-full max-w-7xl mx-auto mb-8 px-4">
      <style jsx>{`
        .card {
          width: 100%;
          height: auto;
          background: #212121;
          border-radius: 1rem;
          position: relative;
          overflow: hidden;
        }

        .bg {
          position: absolute;
          top: 2px;
          left: 2px;
          width: calc(100% - 4px);
          height: calc(100% - 4px);
          background: #ffffff;
          border-radius: calc(1rem - 2px);
          z-index: 1;
        }

        .blob {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(45deg, #4facfe, #00f2fe);
          z-index: 0;
        }

        .card-info {
          position: relative;
          z-index: 2;
          color: #181818;
          display: flex;
          justify-content: center;
          align-items: center;
          width: 100%;
          height: 100%;
          overflow: visible;
          border-radius: .7rem;
        }

        .card .title {
          font-weight: bold;
          letter-spacing: .1em;
        }

        .input-container {
          border: 2px solid #4facfe;
          border-radius: 2rem;
        }
      `}</style>
      <div className="card">
        <div className="bg"></div>
        <div className="blob"></div>
        <div className="card-info">
          <div className="w-full h-full p-12 relative overflow-hidden">
            {/* Subtle background animation */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-50/30 via-transparent to-purple-50/30 animate-pulse opacity-50"></div>
        
        {/* Header */}
        <div className="relative z-10 text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Brain className="w-8 h-8 text-blue-500" />
            <TypewriterEffect 
              words={[
                { text: "WELCOME" },
                { text: "TOM," },
                { text: "HOW" },
                { text: "CAN" },
                { text: "THE" },
                { text: "ORACLE", className: "text-blue-500 dark:text-blue-500" },
                { text: "HELP" },
                { text: "YOU?" }
              ]}
              className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 whitespace-nowrap"
            />
          </div>
          <p className="text-gray-600 text-lg">
            Ask me anything about your bookmarks, or let me help you manage them
          </p>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="relative z-10 mb-8">
          <div className={`relative transition-all duration-300 ${isFocused ? 'transform scale-[1.02]' : ''}`}>
            <div className="input-container flex items-center bg-white rounded-3xl transition-colors duration-200 px-6 py-4">
              <svg
                className="w-8 h-8 text-gray-400 mr-4"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M11.5 6C11.3949 6.00006 11.2925 5.96705 11.2073 5.90565C11.1221 5.84425 11.0583 5.75758 11.0251 5.65792L10.7623 4.86908C10.6623 4.57101 10.4288 4.33629 10.13 4.23693L9.34102 3.97354C9.24166 3.94019 9.1553 3.87649 9.09411 3.79142C9.03292 3.70635 9 3.60421 9 3.49943C9 3.39465 9.03292 3.29252 9.09411 3.20745C9.1553 3.12238 9.24166 3.05867 9.34102 3.02532L10.13 2.76193C10.4282 2.66191 10.663 2.42852 10.7623 2.12979L11.0258 1.34094C11.0591 1.24161 11.1229 1.15526 11.2079 1.09409C11.293 1.03291 11.3952 1 11.5 1C11.6048 1 11.707 1.03291 11.7921 1.09409C11.8771 1.15526 11.9409 1.24161 11.9742 1.34094L12.2377 2.12979C12.2868 2.27697 12.3695 2.4107 12.4792 2.52041C12.589 2.63013 12.7227 2.71281 12.87 2.76193L13.659 3.02532C13.7583 3.05867 13.8447 3.12238 13.9059 3.20745C13.9671 3.29252 14 3.39465 14 3.49943C14 3.60421 13.9671 3.70635 13.9059 3.79142C13.8447 3.87649 13.7583 3.94019 13.659 3.97354L12.87 4.23693C12.5718 4.33696 12.337 4.57034 12.2377 4.86908L11.9742 5.65792C11.9411 5.75747 11.8774 5.84406 11.7923 5.90545C11.7072 5.96684 11.6049 5.99992 11.5 6Z"
                  fill="currentColor"
                />
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M6 13C5.85133 13.0001 5.7069 12.9504 5.58969 12.859C5.47247 12.7675 5.38921 12.6395 5.35313 12.4952L5.12388 11.5745C4.91418 10.7391 4.26198 10.0868 3.42674 9.87703L2.50619 9.64774C2.36169 9.61194 2.23333 9.52878 2.14159 9.41151C2.04985 9.29425 2 9.14964 2 9.00075C2 8.85185 2.04985 8.70724 2.14159 8.58998C2.23333 8.47272 2.36169 8.38955 2.50619 8.35376L3.42674 8.12446C4.26198 7.91473 4.91418 7.2624 5.12388 6.427L5.35313 5.50629C5.38892 5.36176 5.47207 5.23338 5.58931 5.14162C5.70655 5.04986 5.85113 5 6 5C6.14887 5 6.29345 5.04986 6.41069 5.14162C6.52793 5.23338 6.61108 5.36176 6.64687 5.50629L6.87612 6.427C6.97865 6.83721 7.19071 7.21184 7.48965 7.51082C7.78858 7.80981 8.16313 8.02192 8.57326 8.12446L9.49381 8.35376C9.63831 8.38955 9.76667 8.47272 9.85841 8.58998C9.95015 8.70724 10 8.85185 10 9.00075C10 9.14964 9.95015 9.29425 9.85841 9.41151C9.76667 9.52878 9.63831 9.61194 9.49381 9.64774L8.57326 9.87703C8.16313 9.97957 7.78858 10.1917 7.48965 10.4907C7.19071 10.7897 6.97865 11.1643 6.87612 11.5745L6.64687 12.4952C6.61079 12.6395 6.52753 12.7675 6.41031 12.859C6.2931 12.9504 6.14867 13.0001 6 13Z"
                  fill="currentColor"
                />
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M13.5005 23C13.3376 23 13.1791 22.9469 13.049 22.8487C12.9189 22.7505 12.8243 22.6127 12.7795 22.456L11.9665 19.61C11.7915 18.9971 11.4631 18.4389 11.0124 17.9882C10.5616 17.5374 10.0035 17.209 9.39054 17.034L6.54454 16.221C6.38795 16.1761 6.25021 16.0815 6.15216 15.9514C6.05411 15.8214 6.00108 15.6629 6.00108 15.5C6.00108 15.3371 6.05411 15.1786 6.15216 15.0486C6.25021 14.9185 6.38795 14.8239 6.54454 14.779L9.39054 13.966C10.0035 13.791 10.5616 13.4626 11.0124 13.0118C11.4631 12.5611 11.7915 12.0029 11.9665 11.39L12.7795 8.544C12.8244 8.38741 12.919 8.24967 13.0491 8.15162C13.1792 8.05357 13.3376 8.00054 13.5005 8.00054C13.6634 8.00054 13.8219 8.05357 13.952 8.15162C14.0821 8.24967 14.1767 8.38741 14.2215 8.544L15.0345 11.39C15.2096 12.0029 15.538 12.5611 15.9887 13.0118C16.4394 13.4626 16.9976 13.791 17.6105 13.966L20.4565 14.779C20.6131 14.8239 20.7509 14.9185 20.8489 15.0486C20.947 15.1786 21 15.3371 21 15.5C21 15.6629 20.947 15.8214 20.8489 15.9514C20.7509 16.0815 20.6131 16.1761 20.4565 16.221L17.6105 17.034C16.9976 17.209 16.4394 17.5374 15.9887 17.9882C15.538 18.4389 15.2096 18.9971 15.0345 19.61L14.2215 22.456C14.1768 22.6127 14.0822 22.7505 13.9521 22.8487C13.822 22.9469 13.6635 23 13.5005 23Z"
                  fill="currentColor"
                />
              </svg>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder="What can I help you with?"
                className="flex-1 px-4 py-6 text-2xl bg-transparent border-none outline-none text-gray-900 placeholder-gray-500 min-w-0"
              />
              <button
                type="submit"
                disabled={!query.trim() || isLoading}
                className="ml-4 px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2 text-lg font-medium shadow-lg hover:shadow-xl"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Search</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        {/* Quick Actions */}
        <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => setQuery(suggestion.text)}
              className="flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all duration-200 text-left group border border-gray-200 hover:border-gray-300"
            >
              <div className="p-2 bg-white rounded-lg shadow-sm group-hover:shadow-md transition-shadow duration-200">
                <suggestion.icon className="w-5 h-5 text-gray-600" />
              </div>
              <span className="text-gray-700 font-medium">{suggestion.text}</span>
            </button>
          ))}
        </div>

                {/* Powered by AI badge */}
        <div className="relative z-10 flex justify-center">
          <div className="outer-cont flex px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full text-sm text-white items-center gap-2 shadow-lg">
            <svg
              viewBox="0 0 24 24"
              height="24"
              width="24"
              xmlns="http://www.w3.org/2000/svg"
              className="w-4 h-4 text-white"
            >
              <g fill="none">
                <path
                  d="m12.594 23.258l-.012.002l-.071.035l-.02.004l-.014-.004l-.071-.036q-.016-.004-.024.006l-.004.01l-.017.428l.005.02l.01.013l.104.074l.015.004l.012-.004l.104-.074l.012-.016l.004-.017l-.017-.427q-.004-.016-.016-.018m.264-.113l-.014.002l-.184.093l-.01.01l-.003.011l.018.43l.005.012l.008.008l.201.092q.019.005.029-.008l.004-.014l-.034-.614q-.005-.019-.02-.022m-.715.002a.02.02 0 0 0-.027.006l-.006.014l-.034.614q.001.018.017.024l.015-.002l.201-.093l.01-.008l.003-.011l.018-.43l-.003-.012l-.01-.01z"
                ></path>
                <path
                  d="M9.107 5.448c.598-1.75 3.016-1.803 3.725-.159l.06.16l.807 2.36a4 4 0 0 0 2.276 2.411l.217.081l2.36.806c1.75.598 1.803 3.016.16 3.725l-.16.06l-2.36.807a4 4 0 0 0-2.412 2.276l-.081.216l-.806 2.361c-.598 1.75-3.016 1.803-3.724.16l-.062-.16l-.806-2.36a4 4 0 0 0-2.276-2.412l-.216-.081l-2.36-.806c-1.751-.598-1.804-3.016-.16-3.724l.16-.062l2.36-.806A4 4 0 0 0 8.22 8.025l.081-.216zM11 6.094l-.806 2.36a6 6 0 0 1-3.49 3.649l-.25.091l-2.36.806l2.36.806a6 6 0 0 1 3.649 3.49l.091.25l.806 2.36l.806-2.36a6 6 0 0 1 3.49-3.649l.25-.09l2.36-.807l-2.36-.806a6 6 0 0 1-3.649-3.49l-.09-.25zM19 2a1 1 0 0 1 .898.56l.048.117l.35 1.026l1.027.35a1 1 0 0 1 .118 1.845l-.118.048l-1.026.35l-.35 1.027a1 1 0 0 1-1.845.117l-.048-.117l-.35-1.026l-1.027-.35a1 1 0 0 1-.118-1.845l.118-.048l1.026-.35l.35-1.027A1 1 0 0 1 19 2"
                  fill="currentColor"
                ></path>
              </g>
            </svg>
            <span>Powered by AI</span>
          </div>
        </div>
          </div>
        </div>
      </div>
    </div>
  )
} 