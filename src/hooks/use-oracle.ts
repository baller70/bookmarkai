import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { OracleService, type Message, type ConversationSummary } from '@/lib/oracle-service'
import { toast } from 'sonner'

export interface UseOracleOptions {
  autoMigrate?: boolean
  defaultConversationTitle?: string
}

export function useOracle(options: UseOracleOptions = {}) {
  const { data: session } = useSession() || {}
  const user = session?.user as any
  const [oracleService, setOracleService] = useState<OracleService | null>(null)
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [conversations, setConversations] = useState<ConversationSummary[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isMigrating, setIsMigrating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Initialize service when user is available
  useEffect(() => {
    if (user?.id) {
      const service = new OracleService(user.id)
      setOracleService(service)
      
      // Auto-migrate if enabled
      if (options.autoMigrate) {
        handleMigration(service)
      }
    }
  }, [user?.id, options.autoMigrate])

  // Load conversations when service is ready
  useEffect(() => {
    if (oracleService) {
      loadConversations()
    }
  }, [oracleService])

  // Load messages when conversation changes
  useEffect(() => {
    if (oracleService && currentConversationId) {
      loadMessages(currentConversationId)
    }
  }, [oracleService, currentConversationId])

  const handleMigration = async (service: OracleService) => {
    setIsMigrating(true)
    try {
      await service.migrateFromLocalStorage()
      toast.success('Successfully migrated Oracle data to cloud storage')
    } catch (error) {
      console.error('Migration failed:', error)
      toast.error('Failed to migrate Oracle data')
    } finally {
      setIsMigrating(false)
    }
  }

  const loadConversations = useCallback(async () => {
    if (!oracleService) return

    setIsLoading(true)
    setError(null)
    
    try {
      const convs = await oracleService.getConversations()
      setConversations(convs)
      
      // Set current conversation if none selected
      if (!currentConversationId && convs.length > 0) {
        setCurrentConversationId(convs[0].id)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load conversations'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [oracleService, currentConversationId])

  const loadMessages = useCallback(async (conversationId: string) => {
    if (!oracleService) return

    setIsLoading(true)
    setError(null)
    
    try {
      const msgs = await oracleService.getMessages(conversationId)
      setMessages(msgs)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load messages'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [oracleService])

  const createConversation = useCallback(async (title?: string) => {
    if (!oracleService) return null

    setIsLoading(true)
    setError(null)
    
    try {
      const conversationId = await oracleService.createConversation(
        title || options.defaultConversationTitle || 'New Conversation'
      )
      
      // Reload conversations
      await loadConversations()
      
      // Switch to new conversation
      setCurrentConversationId(conversationId)
      
      toast.success('New conversation created')
      return conversationId
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create conversation'
      setError(errorMessage)
      toast.error(errorMessage)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [oracleService, options.defaultConversationTitle, loadConversations])

  const addMessage = useCallback(async (
    content: string,
    role: 'user' | 'assistant' | 'system',
    audioUrl?: string,
    metadata?: Record<string, unknown>
  ) => {
    if (!oracleService) return null

    let conversationId = currentConversationId
    
    // Create conversation if none exists
    if (!conversationId) {
      conversationId = await createConversation()
      if (!conversationId) return null
    }

    setError(null)
    
    try {
      const message = await oracleService.addMessage(
        conversationId,
        content,
        role,
        audioUrl,
        metadata
      )
      
      // Add message to local state immediately
      const newMessage: Message = {
        id: message.id,
        text: message.content,
        isUser: message.role === 'user',
        timestamp: new Date(message.created_at),
        audioUrl: message.audio_url || undefined
      }
      
      setMessages(prev => [...prev, newMessage])
      
      // Reload conversations to update last message
      await loadConversations()
      
      return message
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add message'
      setError(errorMessage)
      toast.error(errorMessage)
      return null
    }
  }, [oracleService, currentConversationId, createConversation, loadConversations])

  const switchConversation = useCallback(async (conversationId: string) => {
    setCurrentConversationId(conversationId)
  }, [])

  const updateConversationTitle = useCallback(async (conversationId: string, title: string) => {
    if (!oracleService) return

    setError(null)
    
    try {
      await oracleService.updateConversationTitle(conversationId, title)
      await loadConversations()
      toast.success('Conversation title updated')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update title'
      setError(errorMessage)
      toast.error(errorMessage)
    }
  }, [oracleService, loadConversations])

  const deleteConversation = useCallback(async (conversationId: string) => {
    if (!oracleService) return

    setError(null)
    
    try {
      await oracleService.deleteConversation(conversationId)
      
      // If deleting current conversation, switch to another
      if (conversationId === currentConversationId) {
        setCurrentConversationId(null)
        setMessages([])
      }
      
      await loadConversations()
      toast.success('Conversation deleted')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete conversation'
      setError(errorMessage)
      toast.error(errorMessage)
    }
  }, [oracleService, currentConversationId, loadConversations])

  const saveSettings = useCallback(async (
    settingType: 'appearance' | 'behavior' | 'voice' | 'context' | 'tools' | 'advanced',
    settings: Record<string, unknown>
  ) => {
    if (!oracleService) return

    setError(null)
    
    try {
      await oracleService.saveSettings(settingType, settings)
      toast.success('Settings saved')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save settings'
      setError(errorMessage)
      toast.error(errorMessage)
    }
  }, [oracleService])

  const getSettings = useCallback(async (
    settingType: 'appearance' | 'behavior' | 'voice' | 'context' | 'tools' | 'advanced'
  ) => {
    if (!oracleService) return null

    setError(null)
    
    try {
      return await oracleService.getSettings(settingType)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load settings'
      setError(errorMessage)
      toast.error(errorMessage)
      return null
    }
  }, [oracleService])

  const getAllSettings = useCallback(async () => {
    if (!oracleService) return {}

    setError(null)
    
    try {
      return await oracleService.getAllSettings()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load all settings'
      setError(errorMessage)
      toast.error(errorMessage)
      return {}
    }
  }, [oracleService])

  const searchConversations = useCallback(async (query: string) => {
    if (!oracleService) return []

    setError(null)
    
    try {
      return await oracleService.searchConversations(query)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to search conversations'
      setError(errorMessage)
      toast.error(errorMessage)
      return []
    }
  }, [oracleService])

  const exportConversation = useCallback(async (conversationId: string) => {
    if (!oracleService) return null

    setError(null)
    
    try {
      const data = await oracleService.exportConversation(conversationId)
      toast.success('Conversation exported')
      return data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to export conversation'
      setError(errorMessage)
      toast.error(errorMessage)
      return null
    }
  }, [oracleService])

  return {
    // State
    currentConversationId,
    messages,
    conversations,
    isLoading,
    isMigrating,
    error,
    isReady: !!oracleService,

    // Actions
    createConversation,
    addMessage,
    switchConversation,
    updateConversationTitle,
    deleteConversation,
    loadConversations,
    loadMessages,

    // Settings
    saveSettings,
    getSettings,
    getAllSettings,

    // Utilities
    searchConversations,
    exportConversation,
  }
} 