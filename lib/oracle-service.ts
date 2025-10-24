// @ts-nocheck
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/supabase'

type OracleConversation = Database['public']['Tables']['oracle_conversations']['Row']
type OracleMessage = Database['public']['Tables']['oracle_messages']['Row']
type OracleSettings = Database['public']['Tables']['oracle_settings']['Row']

type InsertOracleConversation = Database['public']['Tables']['oracle_conversations']['Insert']
type InsertOracleMessage = Database['public']['Tables']['oracle_messages']['Insert']
type InsertOracleSettings = Database['public']['Tables']['oracle_settings']['Insert']

export interface Message {
  id: string
  text: string
  isUser: boolean
  timestamp: Date
  audioUrl?: string
}

export interface ConversationSummary {
  id: string
  title: string
  lastMessage: string
  lastMessageAt: Date
  messageCount: number
  isActive: boolean
}

export class OracleService {
  private userId: string

  constructor(userId: string) {
    this.userId = userId
  }

  // Conversation Management
  async createConversation(title: string = 'New Conversation'): Promise<string> {
    const conversationData = {
      user_id: this.userId,
      title,
      is_active: true,
      metadata: {}
    }
    
    const { data, error } = await supabase
      .from('oracle_conversations')
      .insert(conversationData as any)
      .select('id')
      .single()

    if (error) {
      console.error('Error creating conversation:', error)
      throw new Error('Failed to create conversation')
    }

    return data?.id || ''
  }

  async getConversations(): Promise<ConversationSummary[]> {
    const { data, error } = await supabase
      .from('oracle_conversations_with_latest_message')
      .select('*')
      .eq('user_id', this.userId)
      .eq('is_active', true)
      .order('last_message_at', { ascending: false })

    if (error) {
      console.error('Error fetching conversations:', error)
      throw new Error('Failed to fetch conversations')
    }

    const conversations = data as any[] || [];
    return conversations.map((conv: any) => ({
      id: conv.id,
      title: conv.title,
      lastMessage: conv.latest_message_content || 'No messages yet',
      lastMessageAt: new Date(conv.last_message_at),
      messageCount: conv.message_count,
      isActive: conv.is_active
    }))
  }

  async getConversation(conversationId: string): Promise<OracleConversation | null> {
    const { data, error } = await supabase
      .from('oracle_conversations')
      .select('*')
      .eq('id', conversationId)
      .eq('user_id', this.userId)
      .single()

    if (error) {
      console.error('Error fetching conversation:', error)
      return null
    }

    return data
  }

  async updateConversationTitle(conversationId: string, title: string): Promise<void> {
    const { error } = await supabase
      .from('oracle_conversations')
      .update({ title })
      .eq('id', conversationId)
      .eq('user_id', this.userId)

    if (error) {
      console.error('Error updating conversation title:', error)
      throw new Error('Failed to update conversation title')
    }
  }

  async deleteConversation(conversationId: string): Promise<void> {
    const { error } = await supabase
      .from('oracle_conversations')
      .update({ is_active: false })
      .eq('id', conversationId)
      .eq('user_id', this.userId)

    if (error) {
      console.error('Error deleting conversation:', error)
      throw new Error('Failed to delete conversation')
    }
  }

  // Message Management
  async addMessage(
    conversationId: string,
    content: string,
    role: 'user' | 'assistant' | 'system',
    audioUrl?: string,
    metadata: Record<string, unknown> = {}
  ): Promise<OracleMessage> {
    const { data, error } = await supabase
      .from('oracle_messages')
      .insert({
        conversation_id: conversationId,
        user_id: this.userId,
        content,
        role,
        audio_url: audioUrl || null,
        metadata
      })
      .select()
      .single()

    if (error) {
      console.error('Error adding message:', error)
      throw new Error('Failed to add message')
    }

    return data
  }

  async getMessages(conversationId: string, limit: number = 50): Promise<Message[]> {
    const { data, error } = await supabase
      .rpc('get_conversation_history', {
        p_conversation_id: conversationId,
        p_user_id: this.userId,
        p_limit: limit
      })

    if (error) {
      console.error('Error fetching messages:', error)
      throw new Error('Failed to fetch messages')
    }

    return data.map(msg => ({
      id: msg.id,
      text: msg.content,
      isUser: msg.role === 'user',
      timestamp: new Date(msg.created_at),
      audioUrl: msg.audio_url || undefined
    }))
  }

  async deleteMessage(messageId: string): Promise<void> {
    const { error } = await supabase
      .from('oracle_messages')
      .delete()
      .eq('id', messageId)
      .eq('user_id', this.userId)

    if (error) {
      console.error('Error deleting message:', error)
      throw new Error('Failed to delete message')
    }
  }

  // Settings Management
  async saveSettings(
    settingType: 'appearance' | 'behavior' | 'voice' | 'context' | 'tools' | 'advanced',
    settings: Record<string, unknown>
  ): Promise<void> {
    const { error } = await supabase
      .from('oracle_settings')
      .upsert({
        user_id: this.userId,
        setting_type: settingType,
        settings_data: settings
      })

    if (error) {
      console.error('Error saving settings:', error)
      throw new Error('Failed to save settings')
    }
  }

  async getSettings(
    settingType: 'appearance' | 'behavior' | 'voice' | 'context' | 'tools' | 'advanced'
  ): Promise<Record<string, unknown> | null> {
    const { data, error } = await supabase
      .from('oracle_settings')
      .select('settings_data')
      .eq('user_id', this.userId)
      .eq('setting_type', settingType)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No data found
        return null
      }
      console.error('Error fetching settings:', error)
      throw new Error('Failed to fetch settings')
    }

    return data.settings_data as Record<string, unknown>
  }

  async getAllSettings(): Promise<Record<string, Record<string, unknown>>> {
    const { data, error } = await supabase
      .from('oracle_settings')
      .select('setting_type, settings_data')
      .eq('user_id', this.userId)

    if (error) {
      console.error('Error fetching all settings:', error)
      throw new Error('Failed to fetch settings')
    }

    const settings: Record<string, Record<string, unknown>> = {}
    data.forEach(setting => {
      settings[setting.setting_type] = setting.settings_data as Record<string, unknown>
    })

    return settings
  }

  // Migration helpers
  async migrateFromLocalStorage(): Promise<void> {
    try {
      // Migrate settings
      const settingTypes = ['appearance', 'behavior', 'voice', 'context', 'tools', 'advanced']
      
      for (const type of settingTypes) {
        const localKey = `oracle${type.charAt(0).toUpperCase() + type.slice(1)}Settings`
        const localData = localStorage.getItem(localKey)
        
        if (localData) {
          try {
            const settings = JSON.parse(localData)
            await this.saveSettings(type as any, settings)
            console.log(`✅ Migrated ${type} settings to Supabase`)
          } catch (parseError) {
            console.error(`Failed to parse ${type} settings:`, parseError)
          }
        }
      }

      // Create a default conversation if none exist
      const conversations = await this.getConversations()
      if (conversations.length === 0) {
        const conversationId = await this.createConversation('Welcome Conversation')
        await this.addMessage(
          conversationId,
          "Hello! I'm Oracle AI. I can communicate through text or voice. How can I assist you today?",
          'assistant'
        )
        console.log('✅ Created welcome conversation')
      }

      console.log('✅ Migration from localStorage completed successfully')
    } catch (error) {
      console.error('❌ Migration failed:', error)
      throw error
    }
  }

  // Utility methods
  async getActiveConversationId(): Promise<string> {
    const conversations = await this.getConversations()
    
    if (conversations.length === 0) {
      // Create a new conversation
      return await this.createConversation('New Conversation')
    }
    
    // Return the most recent conversation
    return conversations[0].id
  }

  async searchConversations(query: string): Promise<ConversationSummary[]> {
    const { data, error } = await supabase
      .from('oracle_conversations')
      .select('*')
      .eq('user_id', this.userId)
      .eq('is_active', true)
      .or(`title.ilike.%${query}%,metadata->>'description'.ilike.%${query}%`)
      .order('last_message_at', { ascending: false })

    if (error) {
      console.error('Error searching conversations:', error)
      throw new Error('Failed to search conversations')
    }

    return data.map(conv => ({
      id: conv.id,
      title: conv.title,
      lastMessage: 'Search result',
      lastMessageAt: new Date(conv.last_message_at),
      messageCount: conv.message_count,
      isActive: conv.is_active
    }))
  }

  async exportConversation(conversationId: string): Promise<{
    conversation: OracleConversation
    messages: Message[]
  }> {
    const [conversation, messages] = await Promise.all([
      this.getConversation(conversationId),
      this.getMessages(conversationId, 1000) // Export all messages
    ])

    if (!conversation) {
      throw new Error('Conversation not found')
    }

    return { conversation, messages }
  }
} 