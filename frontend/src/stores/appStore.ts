import { create } from 'zustand'
import { useShallow } from 'zustand/react/shallow'
import { api } from '../services/api'

export type TabType = 'home' | 'timer' | 'tracking' | 'analytics' | 'social' | 'recipes' | 'settings'

interface AppState {
  // Navigation
  currentTab: TabType
  setCurrentTab: (tab: TabType) => void
  
  // Onboarding
  isOnboarding: boolean
  setOnboarding: (value: boolean) => void
  
  // Hydration (today's data)
  todayHydration: number
  hydrationGoal: number
  addHydration: (amount: number) => void
  setHydration: (amount: number) => void
  setHydrationGoal: (goal: number) => void
  
  // User Stats (from server)
  currentStreak: number
  totalFasts: number
  totalHours: number
  points: number
  level: number
  setStats: (stats: Partial<{
    currentStreak: number
    totalFasts: number
    totalHours: number
    points: number
    level: number
  }>) => void
  
  // Loading states
  isLoading: boolean
  setLoading: (loading: boolean) => void
  
  // Initialize from server
  initializeFromServer: () => Promise<void>
  
  // Toast
  toast: { message: string; type: 'success' | 'error' | 'info' } | null
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void
  hideToast: () => void
}

export const useAppStore = create<AppState>()((set) => ({
  // Navigation
  currentTab: 'home',
  setCurrentTab: (tab) => set({ currentTab: tab }),
  
  // Onboarding
  isOnboarding: false,
  setOnboarding: (value) => set({ isOnboarding: value }),
  
  // Hydration - starts at 0, fetched from server
  todayHydration: 0,
  hydrationGoal: 2500,
  addHydration: (amount) => set((state) => ({ 
    todayHydration: state.todayHydration + amount 
  })),
  setHydration: (amount) => set({ todayHydration: amount }),
  setHydrationGoal: (goal) => set({ hydrationGoal: goal }),
  
  // User Stats - all start at 0, fetched from server
  currentStreak: 0,
  totalFasts: 0,
  totalHours: 0,
  points: 0,
  level: 1,
  setStats: (stats) => set((state) => ({ 
    currentStreak: stats.currentStreak ?? state.currentStreak,
    totalFasts: stats.totalFasts ?? state.totalFasts,
    totalHours: stats.totalHours ?? state.totalHours,
    points: stats.points ?? state.points,
    level: stats.level ?? state.level,
  })),
  
  // Loading
  isLoading: true,
  setLoading: (loading) => set({ isLoading: loading }),
  
  // Initialize from server - fetch all user data
  initializeFromServer: async () => {
    set({ isLoading: true })
    
    try {
      // Fetch user insights/stats
      const insightsResponse = await api.getInsights()
      if (insightsResponse.success && insightsResponse.data) {
        set({
          currentStreak: insightsResponse.data.streak || 0,
          totalFasts: insightsResponse.data.totalFasts || 0,
          totalHours: insightsResponse.data.totalHours || 0,
          points: insightsResponse.data.points || 0,
          level: insightsResponse.data.level || 1,
        })
      }
      
      // Fetch today's hydration
      const hydrationResponse = await api.getTodayHydration()
      if (hydrationResponse.success && hydrationResponse.data) {
        set({ todayHydration: hydrationResponse.data.total || 0 })
      }
      
      // Fetch user settings
      const settingsResponse = await api.getSettings()
      if (settingsResponse.success && settingsResponse.data) {
        if (settingsResponse.data.hydrationGoal) {
          set({ hydrationGoal: settingsResponse.data.hydrationGoal })
        }
      }
    } catch (error) {
      console.error('Failed to initialize from server:', error)
    } finally {
      set({ isLoading: false })
    }
  },
  
  // Toast
  toast: null,
  showToast: (message, type = 'success') => {
    set({ toast: { message, type } })
    setTimeout(() => set({ toast: null }), 3000)
  },
  hideToast: () => set({ toast: null }),
}))

// Optimized selectors to prevent unnecessary re-renders
// Use these when you only need specific values from the store

// Navigation selector
export const useCurrentTab = () => useAppStore((state) => state.currentTab)
export const useSetCurrentTab = () => useAppStore((state) => state.setCurrentTab)

// Stats selector - only re-renders when stats change
export const useStats = () => useAppStore(
  useShallow((state) => ({
    currentStreak: state.currentStreak,
    totalFasts: state.totalFasts,
    totalHours: state.totalHours,
    points: state.points,
    level: state.level,
  }))
)

// Hydration selector
export const useHydration = () => useAppStore(
  useShallow((state) => ({
    todayHydration: state.todayHydration,
    hydrationGoal: state.hydrationGoal,
    addHydration: state.addHydration,
  }))
)

// Toast selector
export const useToast = () => useAppStore(
  useShallow((state) => ({
    toast: state.toast,
    showToast: state.showToast,
    hideToast: state.hideToast,
  }))
)

// Loading state selector
export const useIsLoading = () => useAppStore((state) => state.isLoading)
