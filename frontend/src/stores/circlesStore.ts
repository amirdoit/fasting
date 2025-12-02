import { create } from 'zustand'
import { api } from '../services/api'
import type { Circle, CircleMember, CircleActivity, CircleStats, CreateCircleData, Buddy } from '../types'

interface CirclesState {
  // State
  circles: Circle[]
  currentCircle: Circle | null
  members: CircleMember[]
  activities: CircleActivity[]
  publicCircles: Circle[]
  myBuddy: Buddy | null
  
  // Loading states
  isLoading: boolean
  isLoadingCircle: boolean
  isLoadingMembers: boolean
  isLoadingActivities: boolean
  isCreating: boolean
  isJoining: boolean
  
  // Error state
  error: string | null
  
  // Actions - List
  fetchCircles: (filter?: 'all' | 'owned' | 'joined') => Promise<void>
  fetchPublicCircles: (search?: string) => Promise<void>
  
  // Actions - CRUD
  createCircle: (data: CreateCircleData) => Promise<Circle | null>
  updateCircle: (circleId: number, data: Partial<CreateCircleData>) => Promise<boolean>
  deleteCircle: (circleId: number) => Promise<boolean>
  
  // Actions - Single Circle
  fetchCircleDetails: (circleId: number) => Promise<void>
  fetchCircleMembers: (circleId: number) => Promise<void>
  fetchCircleActivities: (circleId: number, limit?: number, offset?: number) => Promise<void>
  fetchCircleStats: (circleId: number) => Promise<CircleStats | null>
  
  // Actions - Membership
  joinCircle: (circleId: number, inviteCode?: string) => Promise<boolean>
  joinByInviteCode: (inviteCode: string) => Promise<Circle | null>
  leaveCircle: (circleId: number) => Promise<boolean>
  removeMember: (circleId: number, userId: number) => Promise<boolean>
  
  // Actions - Invite Code
  regenerateInviteCode: (circleId: number) => Promise<string | null>
  
  // Actions - Buddy
  fetchBuddy: (circleId: number) => Promise<void>
  setBuddy: (circleId: number, buddyUserId: number) => Promise<boolean>
  removeBuddy: (circleId: number) => Promise<boolean>
  
  // Actions - Utility
  clearCurrentCircle: () => void
  clearError: () => void
}

export const useCirclesStore = create<CirclesState>((set, get) => ({
  // Initial State
  circles: [],
  currentCircle: null,
  members: [],
  activities: [],
  publicCircles: [],
  myBuddy: null,
  
  isLoading: false,
  isLoadingCircle: false,
  isLoadingMembers: false,
  isLoadingActivities: false,
  isCreating: false,
  isJoining: false,
  
  error: null,
  
  // Fetch user's circles
  fetchCircles: async (filter = 'all') => {
    set({ isLoading: true, error: null })
    try {
      const response = await api.getCircles(filter)
      if (response.success && response.data) {
        set({ circles: response.data, isLoading: false })
      } else {
        set({ error: response.error || 'Failed to fetch circles', isLoading: false })
      }
    } catch (error) {
      set({ error: 'Failed to fetch circles', isLoading: false })
    }
  },
  
  // Fetch public circles for discovery
  fetchPublicCircles: async (search = '') => {
    set({ isLoading: true, error: null })
    try {
      const response = await api.getPublicCircles(search)
      if (response.success && response.data) {
        set({ publicCircles: response.data, isLoading: false })
      } else {
        set({ error: response.error || 'Failed to fetch public circles', isLoading: false })
      }
    } catch (error) {
      set({ error: 'Failed to fetch public circles', isLoading: false })
    }
  },
  
  // Create a new circle
  createCircle: async (data) => {
    set({ isCreating: true, error: null })
    try {
      const response = await api.createCircle(data)
      if (response.success && response.data) {
        const newCircle = response.data
        set(state => ({
          circles: [newCircle, ...state.circles],
          isCreating: false
        }))
        return newCircle
      } else {
        set({ error: response.error || 'Failed to create circle', isCreating: false })
        return null
      }
    } catch (error) {
      set({ error: 'Failed to create circle', isCreating: false })
      return null
    }
  },
  
  // Update a circle
  updateCircle: async (circleId, data) => {
    set({ error: null })
    try {
      const response = await api.updateCircle(circleId, data)
      if (response.success && response.data) {
        set(state => ({
          circles: state.circles.map(c => c.id === circleId ? { ...c, ...response.data } : c),
          currentCircle: state.currentCircle?.id === circleId ? { ...state.currentCircle, ...response.data } : state.currentCircle
        }))
        return true
      } else {
        set({ error: response.error || 'Failed to update circle' })
        return false
      }
    } catch (error) {
      set({ error: 'Failed to update circle' })
      return false
    }
  },
  
  // Delete a circle
  deleteCircle: async (circleId) => {
    set({ error: null })
    try {
      const response = await api.deleteCircle(circleId)
      if (response.success) {
        set(state => ({
          circles: state.circles.filter(c => c.id !== circleId),
          currentCircle: state.currentCircle?.id === circleId ? null : state.currentCircle
        }))
        return true
      } else {
        set({ error: response.error || 'Failed to delete circle' })
        return false
      }
    } catch (error) {
      set({ error: 'Failed to delete circle' })
      return false
    }
  },
  
  // Fetch single circle details
  fetchCircleDetails: async (circleId) => {
    set({ isLoadingCircle: true, error: null })
    try {
      const response = await api.getCircle(circleId)
      if (response.success && response.data) {
        const circle = response.data
        set({
          currentCircle: circle,
          members: circle.members || [],
          isLoadingCircle: false
        })
      } else {
        set({ error: response.error || 'Failed to fetch circle', isLoadingCircle: false })
      }
    } catch (error) {
      set({ error: 'Failed to fetch circle', isLoadingCircle: false })
    }
  },
  
  // Fetch circle members
  fetchCircleMembers: async (circleId) => {
    set({ isLoadingMembers: true, error: null })
    try {
      const response = await api.getCircleMembers(circleId)
      if (response.success && response.data) {
        set({ members: response.data, isLoadingMembers: false })
      } else {
        set({ error: response.error || 'Failed to fetch members', isLoadingMembers: false })
      }
    } catch (error) {
      set({ error: 'Failed to fetch members', isLoadingMembers: false })
    }
  },
  
  // Fetch circle activity feed
  fetchCircleActivities: async (circleId, limit = 20, offset = 0) => {
    set({ isLoadingActivities: true, error: null })
    try {
      const response = await api.getCircleActivity(circleId, limit, offset)
      if (response.success && response.data) {
        if (offset === 0) {
          set({ activities: response.data, isLoadingActivities: false })
        } else {
          set(state => ({
            activities: [...state.activities, ...response.data!],
            isLoadingActivities: false
          }))
        }
      } else {
        set({ error: response.error || 'Failed to fetch activities', isLoadingActivities: false })
      }
    } catch (error) {
      set({ error: 'Failed to fetch activities', isLoadingActivities: false })
    }
  },
  
  // Fetch circle stats
  fetchCircleStats: async (circleId) => {
    try {
      const response = await api.getCircleStats(circleId)
      if (response.success && response.data) {
        return response.data
      }
      return null
    } catch (error) {
      return null
    }
  },
  
  // Join a circle
  joinCircle: async (circleId, inviteCode) => {
    set({ isJoining: true, error: null })
    try {
      const response = await api.joinCircle(circleId, inviteCode)
      if (response.success && response.data) {
        // Refresh circles list
        get().fetchCircles()
        set({ isJoining: false })
        return true
      } else {
        set({ error: response.error || 'Failed to join circle', isJoining: false })
        return false
      }
    } catch (error) {
      set({ error: 'Failed to join circle', isJoining: false })
      return false
    }
  },
  
  // Join by invite code
  joinByInviteCode: async (inviteCode) => {
    set({ isJoining: true, error: null })
    try {
      const response = await api.joinCircleByCode(inviteCode)
      if (response.success && response.data) {
        const circle = response.data
        set(state => ({
          circles: [circle, ...state.circles],
          isJoining: false
        }))
        return circle
      } else {
        set({ error: response.error || 'Invalid invite code', isJoining: false })
        return null
      }
    } catch (error) {
      set({ error: 'Failed to join circle', isJoining: false })
      return null
    }
  },
  
  // Leave a circle
  leaveCircle: async (circleId) => {
    set({ error: null })
    try {
      const response = await api.leaveCircle(circleId)
      if (response.success) {
        set(state => ({
          circles: state.circles.filter(c => c.id !== circleId),
          currentCircle: state.currentCircle?.id === circleId ? null : state.currentCircle
        }))
        return true
      } else {
        set({ error: response.error || 'Failed to leave circle' })
        return false
      }
    } catch (error) {
      set({ error: 'Failed to leave circle' })
      return false
    }
  },
  
  // Remove a member (owner only)
  removeMember: async (circleId, userId) => {
    set({ error: null })
    try {
      const response = await api.removeCircleMember(circleId, userId)
      if (response.success) {
        set(state => ({
          members: state.members.filter(m => m.user_id !== userId)
        }))
        return true
      } else {
        set({ error: response.error || 'Failed to remove member' })
        return false
      }
    } catch (error) {
      set({ error: 'Failed to remove member' })
      return false
    }
  },
  
  // Regenerate invite code
  regenerateInviteCode: async (circleId) => {
    set({ error: null })
    try {
      const response = await api.regenerateCircleInviteCode(circleId)
      if (response.success && response.data?.invite_code) {
        const newCode = response.data.invite_code
        set(state => ({
          currentCircle: state.currentCircle?.id === circleId
            ? { ...state.currentCircle, invite_code: newCode }
            : state.currentCircle,
          circles: state.circles.map(c =>
            c.id === circleId ? { ...c, invite_code: newCode } : c
          )
        }))
        return newCode
      } else {
        set({ error: response.error || 'Failed to regenerate code' })
        return null
      }
    } catch (error) {
      set({ error: 'Failed to regenerate code' })
      return null
    }
  },
  
  // Fetch buddy
  fetchBuddy: async (circleId) => {
    try {
      const response = await api.getCircleBuddy(circleId)
      if (response.success) {
        set({ myBuddy: response.data || null })
      }
    } catch (error) {
      // Silent fail for buddy fetch
    }
  },
  
  // Set buddy
  setBuddy: async (circleId, buddyUserId) => {
    set({ error: null })
    try {
      const response = await api.setCircleBuddy(circleId, buddyUserId)
      if (response.success && response.data) {
        set({ myBuddy: response.data })
        return true
      } else {
        set({ error: response.error || 'Failed to set buddy' })
        return false
      }
    } catch (error) {
      set({ error: 'Failed to set buddy' })
      return false
    }
  },
  
  // Remove buddy
  removeBuddy: async (circleId) => {
    set({ error: null })
    try {
      const response = await api.removeCircleBuddy(circleId)
      if (response.success) {
        set({ myBuddy: null })
        return true
      } else {
        set({ error: response.error || 'Failed to remove buddy' })
        return false
      }
    } catch (error) {
      set({ error: 'Failed to remove buddy' })
      return false
    }
  },
  
  // Clear current circle
  clearCurrentCircle: () => {
    set({
      currentCircle: null,
      members: [],
      activities: [],
      myBuddy: null
    })
  },
  
  // Clear error
  clearError: () => {
    set({ error: null })
  }
}))

