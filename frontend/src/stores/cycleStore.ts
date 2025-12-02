import { create } from 'zustand'
import { api } from '../services/api'

export interface CycleData {
  isEnabled: boolean
  cycleLength: number
  periodLength: number
  lastPeriodStart: string | null
}

export type CyclePhase = 'menstrual' | 'follicular' | 'ovulation' | 'luteal'

export interface PhaseInfo {
  phase: CyclePhase
  name: string
  color: string
  bgColor: string
  icon: string
  description: string
  fastingTip: string
  fastingAdvice: string
  recommendedMaxFast: number
  daysRemaining: number
}

interface CycleState {
  // State
  isEnabled: boolean
  cycleLength: number
  periodLength: number
  lastPeriodStart: string | null
  currentPhase: CyclePhase | null
  isLoading: boolean
  error: string | null
  
  // Actions
  initializeFromServer: () => Promise<void>
  fetchCycleData: () => Promise<void>
  saveCycleData: (data: Partial<CycleData>) => Promise<boolean>
  setEnabled: (enabled: boolean) => void
  clearError: () => void
  
  // Computed methods
  getPhaseInfo: () => PhaseInfo | null
  getRecommendedMaxFast: () => number
  getDayInCycle: () => number
}

const PHASE_INFO: Record<CyclePhase, Omit<PhaseInfo, 'phase' | 'daysRemaining'>> = {
  menstrual: {
    name: 'Menstrual',
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    icon: '🩸',
    description: 'Your period has started. Energy may be lower.',
    fastingTip: 'Consider lighter fasting (12-14 hours) and prioritize iron-rich foods.',
    fastingAdvice: 'Shorter fasts recommended. Focus on rest and nutrition.',
    recommendedMaxFast: 14,
  },
  follicular: {
    name: 'Follicular',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    icon: '🌱',
    description: 'Energy is rising. Your body is preparing for ovulation.',
    fastingTip: 'Great time for longer fasts (16-20 hours) and high-intensity workouts!',
    fastingAdvice: 'Ideal time for extended fasting and challenging goals.',
    recommendedMaxFast: 20,
  },
  ovulation: {
    name: 'Ovulation',
    color: 'text-pink-600',
    bgColor: 'bg-pink-100',
    icon: '✨',
    description: 'Peak energy and metabolism. Ovulation is occurring.',
    fastingTip: 'Optimal for challenging fasting goals and peak performance.',
    fastingAdvice: 'Your body is at peak performance. Go for longer fasts!',
    recommendedMaxFast: 24,
  },
  luteal: {
    name: 'Luteal',
    color: 'text-amber-600',
    bgColor: 'bg-amber-100',
    icon: '🌙',
    description: 'PMS symptoms may appear. Cravings are normal.',
    fastingTip: 'Consider shorter fasts (12-16 hours) and prioritize nutrition and rest.',
    fastingAdvice: 'Moderate fasting. Listen to your body and avoid stress.',
    recommendedMaxFast: 16,
  },
}

export const useCycleStore = create<CycleState>((set, get) => ({
  // Initial State
  isEnabled: false,
  cycleLength: 28,
  periodLength: 5,
  lastPeriodStart: null,
  currentPhase: null,
  isLoading: false,
  error: null,
  
  initializeFromServer: async () => {
    await get().fetchCycleData()
  },
  
  fetchCycleData: async () => {
    set({ isLoading: true, error: null })
    try {
      const response = await api.getCycleSettings()
      if (response.success && response.data) {
        const dayInCycle = calculateDayInCycle(
          response.data.lastPeriodStart,
          response.data.cycleLength
        )
        const phase = calculatePhase(
          dayInCycle,
          response.data.periodLength,
          response.data.cycleLength
        )
        
        set({ 
          isEnabled: response.data.isEnabled,
          cycleLength: response.data.cycleLength,
          periodLength: response.data.periodLength,
          lastPeriodStart: response.data.lastPeriodStart,
          currentPhase: response.data.isEnabled ? phase : null,
          isLoading: false 
        })
      } else {
        set({ error: response.error || 'Failed to fetch cycle data', isLoading: false })
      }
    } catch (error) {
      set({ error: 'Failed to fetch cycle data', isLoading: false })
    }
  },
  
  saveCycleData: async (data) => {
    set({ isLoading: true, error: null })
    try {
      const state = get()
      const payload = {
        isEnabled: data.isEnabled ?? state.isEnabled,
        cycleLength: data.cycleLength ?? state.cycleLength,
        periodLength: data.periodLength ?? state.periodLength,
        lastPeriodStart: data.lastPeriodStart ?? state.lastPeriodStart,
      }
      
      const response = await api.updateCycleSettings(payload)
      if (response.success) {
        const dayInCycle = calculateDayInCycle(payload.lastPeriodStart, payload.cycleLength)
        const phase = calculatePhase(dayInCycle, payload.periodLength, payload.cycleLength)
        
        set({
          ...payload,
          currentPhase: payload.isEnabled ? phase : null,
          isLoading: false
        })
        return true
      } else {
        set({ error: response.error || 'Failed to save cycle data', isLoading: false })
        return false
      }
    } catch (error) {
      set({ error: 'Failed to save cycle data', isLoading: false })
      return false
    }
  },
  
  setEnabled: (enabled) => {
    set({ isEnabled: enabled })
  },
  
  clearError: () => set({ error: null }),
  
  getPhaseInfo: () => {
    const state = get()
    if (!state.isEnabled || !state.currentPhase || !state.lastPeriodStart) return null
    
    const dayInCycle = calculateDayInCycle(state.lastPeriodStart, state.cycleLength)
    const phaseDaysRemaining = calculatePhaseDaysRemaining(
      dayInCycle,
      state.currentPhase,
      state.periodLength,
      state.cycleLength
    )
    
    return {
      phase: state.currentPhase,
      ...PHASE_INFO[state.currentPhase],
      daysRemaining: phaseDaysRemaining,
    }
  },
  
  getRecommendedMaxFast: () => {
    const state = get()
    if (!state.isEnabled || !state.currentPhase) return 24 // Default max
    return PHASE_INFO[state.currentPhase].recommendedMaxFast
  },
  
  getDayInCycle: () => {
    const state = get()
    if (!state.lastPeriodStart) return 1
    return calculateDayInCycle(state.lastPeriodStart, state.cycleLength)
  },
}))

// Helper functions
function calculateDayInCycle(lastPeriodStart: string | null, cycleLength: number): number {
  if (!lastPeriodStart) return 1
  const today = new Date()
  const lastPeriod = new Date(lastPeriodStart)
  const diffTime = today.getTime() - lastPeriod.getTime()
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
  return (diffDays % cycleLength) + 1
}

function calculatePhase(
  dayInCycle: number,
  periodLength: number,
  cycleLength: number
): CyclePhase {
  const ovulationDay = Math.floor(cycleLength / 2)
  
  if (dayInCycle <= periodLength) {
    return 'menstrual'
  } else if (dayInCycle <= ovulationDay - 2) {
    return 'follicular'
  } else if (dayInCycle <= ovulationDay + 2) {
    return 'ovulation'
  } else {
    return 'luteal'
  }
}

function calculatePhaseDaysRemaining(
  dayInCycle: number,
  phase: CyclePhase,
  periodLength: number,
  cycleLength: number
): number {
  const ovulationDay = Math.floor(cycleLength / 2)
  
  switch (phase) {
    case 'menstrual':
      return periodLength - dayInCycle + 1
    case 'follicular':
      return (ovulationDay - 2) - dayInCycle + 1
    case 'ovulation':
      return (ovulationDay + 2) - dayInCycle + 1
    case 'luteal':
      return cycleLength - dayInCycle + 1
    default:
      return 1
  }
}
