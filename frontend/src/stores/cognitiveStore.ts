import { create } from 'zustand'
import { api } from '../services/api'

export interface CognitiveResult {
  id: number
  testType: string
  score: number
  fastingState: 'fed' | 'fasted'
  fastingHours: number
  createdAt: string
}

interface CognitiveAverages {
  fedReactionTime: number
  fastedReactionTime: number
  improvement: number
}

interface CognitiveState {
  results: CognitiveResult[]
  averages: CognitiveAverages
  isLoading: boolean
  
  fetchResults: (days?: number) => Promise<void>
  saveResult: (data: {
    testType: string
    score: number
    fastingState: 'fed' | 'fasted'
    fastingHours: number
  }) => Promise<boolean>
  getImprovementMessage: () => string
}

export const useCognitiveStore = create<CognitiveState>((set, get) => ({
  results: [],
  averages: {
    fedReactionTime: 0,
    fastedReactionTime: 0,
    improvement: 0
  },
  isLoading: false,
  
  fetchResults: async (days = 30) => {
    set({ isLoading: true })
    try {
      const response = await api.getCognitiveResults(days)
      if (response.success && response.data) {
        set({
          results: response.data.results,
          averages: response.data.averages
        })
      }
    } catch (error) {
      console.error('Failed to fetch cognitive results:', error)
    } finally {
      set({ isLoading: false })
    }
  },
  
  saveResult: async (data) => {
    try {
      const response = await api.saveCognitiveResult(data)
      if (response.success) {
        // Refresh results
        await get().fetchResults()
        return true
      }
      return false
    } catch (error) {
      console.error('Failed to save cognitive result:', error)
      return false
    }
  },
  
  getImprovementMessage: () => {
    const { averages } = get()
    
    if (averages.fedReactionTime === 0 || averages.fastedReactionTime === 0) {
      return 'Complete tests in both fed and fasted states to see your improvement!'
    }
    
    if (averages.improvement > 0) {
      return `Your reaction time is ${Math.abs(averages.improvement).toFixed(1)}% faster when fasted! 🧠`
    } else if (averages.improvement < 0) {
      return `Your reaction time is ${Math.abs(averages.improvement).toFixed(1)}% slower when fasted. Keep practicing!`
    }
    
    return 'Your performance is similar in both states.'
  }
}))








