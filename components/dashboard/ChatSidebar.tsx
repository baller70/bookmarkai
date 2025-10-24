'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

// Custom SVG component to prevent hydration errors
const SendIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
  </svg>
)

interface Message {
  id: string
  content: string
  isUser: boolean
  timestamp: Date
}

export function ChatSidebar() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: "Hello! I'm your AI assistant. How can I help you today?",
      isUser: false,
      timestamp: new Date(Date.now() - 300000) // 5 minutes ago
    },
    {
      id: '2',
      content: "Can you help me understand my dashboard metrics?",
      isUser: true,
      timestamp: new Date(Date.now() - 240000) // 4 minutes ago
    },
    {
      id: '3',
      content: "Absolutely! Your dashboard shows great performance with 1,250 total credits, 347 messages processed, and a 98.5% success rate. You've created 12 apps this period, which is excellent progress!",
      isUser: false,
      timestamp: new Date(Date.now() - 180000) // 3 minutes ago
    }
  ])
  const [newMessage, setNewMessage] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (isOpen && inputRef.current) {
      // Focus input when sidebar opens
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  const handleSendMessage = () => {
    if (!newMessage.trim()) return

    const now = new Date()
    const userMessage: Message = {
      id: `msg-${now.getTime()}`,
      content: newMessage.trim(),
      isUser: true,
      timestamp: now
    }

    setMessages(prev => [...prev, userMessage])
    setNewMessage('')

    // Simulate AI response
    setTimeout(() => {
      const responseTime = new Date()
      const aiResponse: Message = {
        id: `msg-${responseTime.getTime()}`,
        content: "Thanks for your message! I'm here to help you with any questions about your dashboard, analytics, or account management.",
        isUser: false,
        timestamp: responseTime
      }
      setMessages(prev => [...prev, aiResponse])
    }, 1000)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  const formatTime = (date: Date) => {
    // Prevent hydration mismatch by only showing time on client
    if (!isClient) {
      return ''
    }
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    })
  }

  return (
    <>
      {/* Toggle Button - Fixed on right edge with arrow */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        variant="ghost"
        size="sm"
        className="fixed right-0 top-1/2 -translate-y-1/2 z-40 h-12 w-8 rounded-l-lg rounded-r-none border-l border-t border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-lg hover:bg-slate-50 dark:hover:bg-slate-900 transition-all duration-200"
      >
        <svg
          className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
      </Button>

      {/* Chat Panel - Slide from right WITHOUT backdrop overlay */}
      <div
        className={cn(
          "fixed top-0 right-0 h-full w-80 bg-white dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800 shadow-xl z-30 flex flex-col transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-blue-500 text-white text-xs">AI</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-left text-lg font-semibold text-slate-900 dark:text-slate-100">AI Assistant</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Chat for help and guidance
              </p>
            </div>
          </div>
        </div>

        {/* Messages Container */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex items-start space-x-3 ${
                  message.isUser ? 'justify-end' : 'justify-start'
                }`}
              >
                {!message.isUser && (
                  <Avatar className="w-7 h-7 mt-1">
                    <AvatarFallback className="bg-blue-500 text-white text-xs">AI</AvatarFallback>
                  </Avatar>
                )}
                
                <div
                  className={`max-w-[240px] rounded-lg p-3 ${
                    message.isUser
                      ? 'bg-blue-500 text-white ml-auto'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100'
                  }`}
                >
                  <p className="text-sm leading-relaxed">{message.content}</p>
                  {isClient && (
                    <p className={`text-xs mt-1 ${
                      message.isUser 
                        ? 'text-blue-100' 
                        : 'text-slate-500 dark:text-slate-400'
                    }`}>
                      {formatTime(message.timestamp)}
                    </p>
                  )}
                </div>

                {message.isUser && (
                  <Avatar className="w-7 h-7 mt-1">
                    <AvatarFallback className="bg-slate-500 text-white text-xs">You</AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}

            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <Separator />

        {/* Input Area */}
        <div className="p-4">
          <div className="flex space-x-2">
            <Input
              ref={inputRef}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message here..."
              className="flex-1"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!newMessage.trim()}
              size="icon"
              className="bg-blue-600 hover:bg-blue-700"
            >
              <SendIcon className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            Press Enter to send • Shift+Enter for new line
          </p>
        </div>
      </div>
    </>
  )
} 