import { create } from 'zustand'
import { api } from '../services/api'
import type { Challenge, LeaderboardEntry, Circle } from '../types'

// Re-export types for convenience
export type { Challenge, LeaderboardEntry, Circle }

interface ChallengesState {
  challenges: Challenge[]
  userChallenges: Challenge[]
  leaderboard: LeaderboardEntry[]
  circles: Circle[]
  isLoading: boolean
  error: string | null
  
  // Actions
  fetchChallenges: () => Promise<void>
  fetchUserChallenges: () => Promise<void>
  fetchLeaderboard: () => Promise<void>
  fetchCircles: () => Promise<void>
  joinChallenge: (challenge: Challenge) => Promise<boolean>
  initialize: () => Promise<void>
}

export const useChallengesStore = create<ChallengesState>((set, get) => ({
  challenges: [],
  userChallenges: [],
  leaderboard: [],
  circles: [],
  isLoading: false,
  error: null,
  
  fetchChallenges: async () => {
    set({ isLoading: true, error: null })
    const response = await api.getChallenges()
    if (response.success && response.data) {
      set({ challenges: response.data, isLoading: false })
    } else {
      set({ error: response.error || 'Failed to fetch challenges', isLoading: false })
    }
  },
  
  fetchUserChallenges: async () => {
    const response = await api.getActiveChallenges()
    if (response.success && response.data) {
      set({ userChallenges: response.data })
    }
  },
  
  fetchLeaderboard: async () => {
    set({ isLoading: true, error: null })
    const response = await api.getLeaderboard()
    if (response.success && response.data) {
      set({ leaderboard: response.data, isLoading: false })
    } else {
      set({ error: response.error || 'Failed to fetch leaderboard', isLoading: false })
    }
  },
  
  fetchCircles: async () => {
    const response = await api.getCircles()
    if (response.success && response.data) {
      set({ circles: response.data })
    }
  },
  
  joinChallenge: async (challenge: Challenge) => {
    const response = await api.joinChallenge({
      challengeId: challenge.id,
      title: challenge.title,
      type: challenge.type,
      target: challenge.target
    })
    
    if (response.success) {
      // Update local state to reflect joined challenge
      set(state => ({
        challenges: state.challenges.map(c => 
          c.id === challenge.id 
            ? { ...c, isJoined: true, participants: (c.participants || 0) + 1 }
            : c
        )
      }))
      // Refresh user challenges
      get().fetchUserChallenges()
      return true
    }
    return false
  },
  
  initialize: async () => {
    const { fetchChallenges, fetchLeaderboard, fetchCircles, fetchUserChallenges } = get()
    await Promise.all([
      fetchChallenges(),
      fetchLeaderboard(),
      fetchCircles(),
      fetchUserChallenges()
    ])
  }
}))

