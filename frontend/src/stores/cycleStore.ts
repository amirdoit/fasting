import { create } from 'zustand'
import { api } from '../services/api'

export type CyclePhase = 'menstrual' | 'follicular' | 'ovulation' | 'luteal'

export interface CyclePhaseInfo {
  name: string
  days: string
  description: string
  fastingAdvice: string
  maxFastHours: number
  color: string
  icon: string
}

export const CYCLE_PHASES: Record<CyclePhase, CyclePhaseInfo> = {
  menstrual: {
    name: 'Menstrual Phase',
    days: 'Days 1-5',
    description: 'Your period has started. Energy may be lower.',
    fastingAdvice: 'Gentle fasting recommended. Listen to your body.',
    maxFastHours: 14,
    color: '#EC4899',
    icon: '🌸'
  },
  follicular: {
    name: 'Follicular Phase',
    days: 'Days 6-12',
    description: 'Estrogen is building. Energy and resilience are increasing.',
    fastingAdvice: 'Great time for longer fasts! Your body can handle more.',
    maxFastHours: 20,
    color: '#8B5CF6',
    icon: '🌱'
  },
  ovulation: {
    name: 'Ovulation Phase',
    days: 'Days 13-15',
    description: 'Peak energy and estrogen. Highest resilience.',
    fastingAdvice: 'Optimal window for challenging fasts or extended fasts.',
    maxFastHours: 24,
    color: '#10B981',
    icon: '🌟'
  },
  luteal: {
    name: 'Luteal Phase',
    days: 'Days 16-28',
    description: 'Progesterone rises. Body needs more nourishment.',
    fastingAdvice: 'Shorter fasts recommended. Focus on nutrient-dense foods.',
    maxFastHours: 13,
    color: '#F59E0B',
    icon: '🍂'
  }
}

interface CycleState {
  // Settings
  isEnabled: boolean
  cycleLength: number // Default 28 days
  periodLength: number // Default 5 days
  lastPeriodStart: string | null // ISO date string
  
  // Computed
  currentPhase: CyclePhase | null
  currentDay: number | null
  nextPeriodDate: string | null
  
  // Loading state
  isLoading: boolean
  isInitialized: boolean
  
  // Actions
  setEnabled: (enabled: boolean) => Promise<void>
  setCycleLength: (days: number) => Promise<void>
  setPeriodLength: (days: number) => Promise<void>
  setLastPeriodStart: (date: string) => Promise<void>
  calculatePhase: () => void
  getRecommendedMaxFast: () => number
  getPhaseInfo: () => CyclePhaseInfo | null
  initializeFromServer: () => Promise<void>
  saveToServer: () => Promise<void>
}

export const useCycleStore = create<CycleState>()((set, get) => ({
  // Initial state - server is source of truth, no localStorage
      isEnabled: false,
      cycleLength: 28,
      periodLength: 5,
      lastPeriodStart: null,
      currentPhase: null,
      currentDay: null,
      nextPeriodDate: null,
  isLoading: false,
  isInitialized: false,
      
  setEnabled: async (enabled) => {
        set({ isEnabled: enabled })
        if (enabled) {
          get().calculatePhase()
        } else {
          set({ currentPhase: null, currentDay: null, nextPeriodDate: null })
        }
    // Save to server immediately
    await get().saveToServer()
      },
      
  setCycleLength: async (days) => {
        set({ cycleLength: days })
        get().calculatePhase()
    await get().saveToServer()
      },
      
  setPeriodLength: async (days) => {
        set({ periodLength: days })
        get().calculatePhase()
    await get().saveToServer()
      },
      
  setLastPeriodStart: async (date) => {
        set({ lastPeriodStart: date })
        get().calculatePhase()
    await get().saveToServer()
      },
      
      calculatePhase: () => {
        const { isEnabled, lastPeriodStart, cycleLength, periodLength } = get()
        
        if (!isEnabled || !lastPeriodStart) {
          set({ currentPhase: null, currentDay: null, nextPeriodDate: null })
          return
        }
        
        const startDate = new Date(lastPeriodStart)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        
        // Calculate days since last period start
        const diffTime = today.getTime() - startDate.getTime()
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
        
        // Calculate current day in cycle (1-indexed)
        const currentDay = (diffDays % cycleLength) + 1
        
        // Calculate next period date
        const cyclesSinceLast = Math.floor(diffDays / cycleLength)
        const nextPeriodDate = new Date(startDate)
        nextPeriodDate.setDate(nextPeriodDate.getDate() + (cyclesSinceLast + 1) * cycleLength)
        
        // Determine phase based on day
        let phase: CyclePhase
        
        if (currentDay <= periodLength) {
          phase = 'menstrual'
        } else if (currentDay <= 12) {
          phase = 'follicular'
        } else if (currentDay <= 15) {
          phase = 'ovulation'
        } else {
          phase = 'luteal'
        }
        
        set({
          currentPhase: phase,
          currentDay,
          nextPeriodDate: nextPeriodDate.toISOString().split('T')[0]
        })
      },
      
      getRecommendedMaxFast: () => {
        const { isEnabled, currentPhase } = get()
        
        if (!isEnabled || !currentPhase) {
          return 24 // Default max if cycle sync not enabled
        }
        
        return CYCLE_PHASES[currentPhase].maxFastHours
      },
      
      getPhaseInfo: () => {
        const { currentPhase } = get()
        if (!currentPhase) return null
        return CYCLE_PHASES[currentPhase]
      },
      
      initializeFromServer: async () => {
    // Prevent multiple simultaneous initializations
    if (get().isLoading || get().isInitialized) return
    
    set({ isLoading: true })
    
        try {
          const response = await api.getCycleSettings()
          if (response.success && response.data) {
            const data = response.data
            set({
              isEnabled: data.isEnabled || false,
              cycleLength: data.cycleLength || 28,
              periodLength: data.periodLength || 5,
          lastPeriodStart: data.lastPeriodStart || null,
          isInitialized: true
            })
            get().calculatePhase()
      } else {
        set({ isInitialized: true })
          }
        } catch (error) {
          console.error('Failed to load cycle settings:', error)
      set({ isInitialized: true })
    } finally {
      set({ isLoading: false })
        }
      },
      
      saveToServer: async () => {
        const { isEnabled, cycleLength, periodLength, lastPeriodStart } = get()
        try {
          await api.updateCycleSettings({
            isEnabled,
            cycleLength,
            periodLength,
            lastPeriodStart
          })
        } catch (error) {
          console.error('Failed to save cycle settings:', error)
        }
      }
}))
