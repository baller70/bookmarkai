 // Goal and Goal Folder API service
// TODO: Migrate to PostgreSQL/Prisma for goal management
// This service currently has Supabase dependencies removed
// Need to implement with Prisma client and NextAuth session

export interface GoalFolder {
  id: string
  name: string
  description?: string
  color: string
  goal_count?: number
  created_at?: string
  updated_at?: string
}

export interface Goal {
  id: string
  name: string
  description?: string
  color: string
  deadline_date?: string
  goal_type: 'organize' | 'complete_all' | 'review_all' | 'learn_category' | 'research_topic' | 'custom'
  goal_description?: string
  goal_status: 'not_started' | 'in_progress' | 'completed' | 'on_hold' | 'cancelled'
  goal_priority: 'low' | 'medium' | 'high' | 'urgent'
  goal_progress: number
  connected_bookmarks?: string[]
  tags?: string[]
  notes?: string
  folder_id?: string
  created_at?: string
  updated_at?: string
  goal_folders?: {
    id: string
    name: string
    color: string
  }
}

class GoalService {
  private async getCurrentUserId(): Promise<string | null> {
    // TODO: Implement with NextAuth session
    console.warn('[goalService] getCurrentUserId not yet implemented with NextAuth')
    return null
  }

  // Goal Folders API
  async getGoalFolders(): Promise<GoalFolder[]> {
    try {
      console.log('🎯 getGoalFolders: Starting...')
      const userId = await this.getCurrentUserId()
      console.log('🎯 getGoalFolders: userId =', userId)

      if (!userId) {
        console.warn('❌ getGoalFolders: No user ID available, returning empty goal folders')
        return []
      }

      const url = `/api/goal-folders?user_id=${userId}`
      console.log('🎯 getGoalFolders: Fetching from', url)

      const response = await fetch(url)
      console.log('🎯 getGoalFolders: Response status =', response.status)
      console.log('🎯 getGoalFolders: Response headers =', Object.fromEntries(response.headers.entries()))

      if (!response.ok) {
        console.error('❌ getGoalFolders: HTTP error:', response.status, response.statusText)
        return []
      }

      const data = await response.json()
      console.log('🎯 getGoalFolders: Response data =', JSON.stringify(data, null, 2))

      if (!data.success) {
        console.error('❌ getGoalFolders: API returned error:', data.error)
        return []
      }

      const folders = data.data || []
      console.log('✅ getGoalFolders: Success, returning', folders.length, 'folders:', folders.map(f => f.name))
      return folders
    } catch (error) {
      console.error('❌ getGoalFolders: Exception caught:', error)
      console.error('❌ getGoalFolders: Error message:', error.message)
      console.error('❌ getGoalFolders: Error stack:', error.stack)
      return []
    }
  }

  async createGoalFolder(folder: Omit<GoalFolder, 'id' | 'created_at' | 'updated_at'>): Promise<GoalFolder> {
    try {
      console.log('🎯 createGoalFolder: Starting with folder data:', folder)
      const userId = await this.getCurrentUserId()
      console.log('🎯 createGoalFolder: userId =', userId)

      const requestBody = {
        user_id: userId,
        ...folder
      }
      console.log('🎯 createGoalFolder: Request body =', JSON.stringify(requestBody, null, 2))

      const response = await fetch('/api/goal-folders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      console.log('🎯 createGoalFolder: Response status =', response.status)
      const data = await response.json()
      console.log('🎯 createGoalFolder: Response data =', JSON.stringify(data, null, 2))

      if (!data.success) {
        console.error('❌ createGoalFolder: API returned error:', data.error)
        throw new Error(data.error || 'Failed to create goal folder')
      }

      console.log('✅ createGoalFolder: Success, created folder:', data.data.name)
      return data.data
    } catch (error) {
      console.error('❌ createGoalFolder: Error:', error)
      throw error
    }
  }

  async updateGoalFolder(id: string, updates: Partial<GoalFolder>): Promise<GoalFolder> {
    try {
      const userId = await this.getCurrentUserId()

      const response = await fetch('/api/goal-folders', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id,
          user_id: userId,
          ...updates
        }),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to update goal folder')
      }

      return data.data
    } catch (error) {
      console.error('Error updating goal folder:', error)
      throw error
    }
  }

  async deleteGoalFolder(id: string, handleGoals: 'unassign' | 'delete' = 'unassign'): Promise<void> {
    try {
      const userId = await this.getCurrentUserId()

      const response = await fetch(`/api/goal-folders?id=${id}&user_id=${userId}&handle_goals=${handleGoals}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to delete goal folder')
      }
    } catch (error) {
      console.error('Error deleting goal folder:', error)
      throw error
    }
  }

  // Goals API
  async getGoals(folderId?: string): Promise<Goal[]> {
    try {
      console.log('🎯 getGoals: Starting...')
      const userId = await this.getCurrentUserId()
      console.log('🎯 getGoals: userId =', userId)

      if (!userId) {
        console.warn('No user ID available, returning empty goals')
        return []
      }

      let url = `/api/goals?user_id=${userId}`
      if (folderId) {
        url += `&folder_id=${folderId}`
      }
      console.log('🎯 getGoals: Fetching from', url)

      const response = await fetch(url)
      console.log('🎯 getGoals: Response status =', response.status)

      const data = await response.json()
      console.log('🎯 getGoals: Response data =', data)

      if (!data.success) {
        console.error('❌ getGoals: API returned error:', data.error)
        return []
      }

      console.log('✅ getGoals: Success, returning', data.data?.length || 0, 'goals')
      return data.data || []
    } catch (error) {
      console.error('❌ getGoals: Exception caught:', error)
      console.error('❌ getGoals: Error message:', error.message)
      console.error('❌ getGoals: Error stack:', error.stack)
      return []
    }
  }

  async createGoal(goal: Omit<Goal, 'id' | 'created_at' | 'updated_at'>): Promise<Goal> {
    try {
      const userId = await this.getCurrentUserId()
      console.log('🎯 Creating goal with userId:', userId)
      console.log('🎯 Goal data:', goal)

      const requestBody = {
        user_id: userId,
        ...goal
      }
      console.log('🎯 Request body:', requestBody)

      const response = await fetch('/api/goals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      console.log('🎯 Response status:', response.status)
      const data = await response.json()
      console.log('🎯 Response data:', data)

      if (!data.success) {
        console.error('❌ API returned error:', data.error)
        throw new Error(data.error || 'Failed to create goal')
      }

      console.log('✅ Goal created successfully:', data.data)
      return data.data
    } catch (error) {
      console.error('❌ Error creating goal:', error)
      throw error
    }
  }

  async updateGoal(id: string, updates: Partial<Goal>): Promise<Goal> {
    try {
      const userId = await this.getCurrentUserId()
      console.log('🎯 updateGoal: Updating goal', id, 'with updates:', updates);
      console.log('🎯 updateGoal: User ID:', userId);

      const requestBody = {
        id,
        user_id: userId,
        ...updates
      };
      console.log('🎯 updateGoal: Request body:', requestBody);

      const response = await fetch('/api/goals', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      console.log('🎯 updateGoal: Response status:', response.status);
      const data = await response.json()
      console.log('🎯 updateGoal: Response data:', data);

      if (!data.success) {
        console.error('❌ updateGoal: API returned error:', data.error);
        throw new Error(data.error || 'Failed to update goal')
      }

      console.log('✅ updateGoal: Goal updated successfully');
      return data.data
    } catch (error) {
      console.error('❌ updateGoal: Error updating goal:', error)
      throw error
    }
  }

  async deleteGoal(id: string): Promise<void> {
    try {
      const userId = await this.getCurrentUserId()

      const response = await fetch(`/api/goals?id=${id}&user_id=${userId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to delete goal')
      }
    } catch (error) {
      console.error('Error deleting goal:', error)
      throw error
    }
  }

  async moveGoalToFolder(goalId: string, folderId: string | null): Promise<Goal> {
    try {
      console.log('🎯 moveGoalToFolder: Moving goal', goalId, 'to folder', folderId);
      const result = await this.updateGoal(goalId, { folder_id: folderId || undefined });
      console.log('✅ moveGoalToFolder: Successfully moved goal');
      return result;
    } catch (error) {
      console.error('❌ moveGoalToFolder: Error moving goal to folder:', error);
      console.error('❌ moveGoalToFolder: Error details:', error.message);
      throw error;
    }
  }
}

export const goalService = new GoalService()
