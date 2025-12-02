import { create } from 'zustand'
import { useShallow } from 'zustand/react/shallow'
import { api } from '../services/api'
import { notificationService } from '../services/notifications'

export type FastingProtocol = '12:12' | '14:10' | '16:8' | '18:6' | '20:4' | '23:1' | '24h' | '36h' | '48h' | 'custom'

interface FastingZone {
  name: string
  startHour: number
  endHour: number
  color: string
  description: string
  benefits: string[]
}

export const FASTING_ZONES: FastingZone[] = [
  {
    name: 'Fed State',
    startHour: 0,
    endHour: 4,
    color: '#60A5FA',
    description: 'Digestion and nutrient absorption',
    benefits: ['Blood sugar elevated', 'Insulin active', 'Energy from food']
  },
  {
    name: 'Early Fasting',
    startHour: 4,
    endHour: 8,
    color: '#818CF8',
    description: 'Blood sugar normalizing',
    benefits: ['Insulin dropping', 'Glycogen being used', 'Body transitioning']
  },
  {
    name: 'Fasting State',
    startHour: 8,
    endHour: 12,
    color: '#A78BFA',
    description: 'Fat burning begins',
    benefits: ['Glycogen depleted', 'Fat oxidation starting', 'HGH increasing']
  },
  {
    name: 'Fat Burning',
    startHour: 12,
    endHour: 16,
    color: '#F59E0B',
    description: 'Peak fat oxidation',
    benefits: ['Ketones rising', 'Fat as primary fuel', 'Mental clarity']
  },
  {
    name: 'Ketosis',
    startHour: 16,
    endHour: 24,
    color: '#ECC94B',
    description: 'Deep ketosis & autophagy',
    benefits: ['Autophagy activated', 'Cellular repair', 'HGH peaks']
  },
  {
    name: 'Deep Autophagy',
    startHour: 24,
    endHour: 48,
    color: '#10B981',
    description: 'Maximum cellular renewal',
    benefits: ['Stem cell regeneration', 'Immune reset', 'Deep healing']
  }
]

export const PROTOCOLS: Record<FastingProtocol, { name: string; fastHours: number; eatHours: number; description: string }> = {
  '12:12': { name: 'Beginner', fastHours: 12, eatHours: 12, description: 'Great for starting out' },
  '14:10': { name: 'Light', fastHours: 14, eatHours: 10, description: 'Easy daily routine' },
  '16:8': { name: 'Leangains', fastHours: 16, eatHours: 8, description: 'Most popular protocol' },
  '18:6': { name: 'Moderate', fastHours: 18, eatHours: 6, description: 'Enhanced fat burning' },
  '20:4': { name: 'Warrior', fastHours: 20, eatHours: 4, description: 'One main meal' },
  '23:1': { name: 'OMAD', fastHours: 23, eatHours: 1, description: 'One meal a day' },
  '24h': { name: 'Full Day', fastHours: 24, eatHours: 0, description: 'Eat-Stop-Eat method' },
  '36h': { name: 'Extended', fastHours: 36, eatHours: 0, description: 'Deep autophagy' },
  '48h': { name: 'Monk Fast', fastHours: 48, eatHours: 0, description: 'Maximum benefits' },
  'custom': { name: 'Custom', fastHours: 16, eatHours: 8, description: 'Your own schedule' }
}

interface FastingState {
  // Current fast
  fastId: number | null
  isActive: boolean
  startTime: string | null // Store as ISO string
  targetHours: number
  protocol: FastingProtocol
  pausedAt: string | null
  pausedDuration: number
  
  // Loading & sync status
  isLoading: boolean
  isInitialized: boolean
  lastSyncTime: number | null
  
  // Actions
  initializeFromServer: () => Promise<void>
  syncWithServer: () => Promise<void>
  startFast: (protocol?: FastingProtocol, backdateMinutes?: number) => Promise<void>
  endFast: (notes?: string, mood?: string) => Promise<{ freezeEarned: boolean; streak: number }>
  pauseFast: () => Promise<void>
  resumeFast: () => Promise<void>
  setProtocol: (protocol: FastingProtocol) => void
  setCustomHours: (hours: number) => void
  resetState: () => void
  
  // Computed
  getCurrentZone: () => FastingZone | null
  getElapsedTime: () => number
  getProgress: () => number
}

export const useFastingStore = create<FastingState>()((set, get) => ({
  // Initial state - NO localStorage, server is source of truth
  fastId: null,
  isActive: false,
  startTime: null,
  targetHours: 16,
  protocol: '16:8',
  pausedAt: null,
  pausedDuration: 0,
  isLoading: false,
  isInitialized: false,
  lastSyncTime: null,
  
  // Reset state
  resetState: () => {
    set({
      fastId: null,
      isActive: false,
      startTime: null,
      targetHours: 16,
      protocol: '16:8',
      pausedAt: null,
      pausedDuration: 0,
      isLoading: false,
      isInitialized: false,
      lastSyncTime: null
    })
  },
  
  // Initialize from server - THIS IS THE SOURCE OF TRUTH
  initializeFromServer: async () => {
    // Prevent multiple simultaneous initializations
    if (get().isLoading) return
    
    console.log('[FastingStore] initializeFromServer called')
    set({ isLoading: true })
    
    try {
      console.log('[FastingStore] Fetching active fast from server...')
      const response = await api.getActiveFast()
      console.log('[FastingStore] getActiveFast response:', response)
      
      if (response.success && response.data) {
        const fast = response.data
        console.log('[FastingStore] Active fast found:', fast)
        
        // Validate the fast data
        const startDate = new Date(fast.startTime)
        const elapsed = Date.now() - startDate.getTime()
        const maxFastDuration = 7 * 24 * 60 * 60 * 1000 // 7 days max
        
        if (isNaN(startDate.getTime()) || elapsed > maxFastDuration) {
          console.warn('[FastingStore] Server returned stale/invalid fast data - auto-ending')
          
          // End the stale fast on server
          if (fast.id) {
            try {
              await api.endFast(fast.id, { notes: 'Auto-ended: stale fast data' })
            } catch (e) {
              console.error('[FastingStore] Failed to end stale fast:', e)
            }
          }
          
          set({
            fastId: null,
            isActive: false,
            startTime: null,
            pausedAt: null,
            pausedDuration: 0,
            isInitialized: true,
            lastSyncTime: Date.now()
          })
        } else {
          // Valid active fast from server
          console.log('[FastingStore] Setting active fast state:', {
            id: fast.id,
            startTime: fast.startTime,
            status: fast.status
          })
          set({
            fastId: fast.id,
            isActive: true,
            startTime: fast.startTime,
            targetHours: fast.targetHours || 16,
            protocol: (fast.protocol as FastingProtocol) || '16:8',
            pausedAt: fast.pausedAt || null,
            pausedDuration: fast.pausedDuration || 0,
            isInitialized: true,
            lastSyncTime: Date.now()
          })
        }
      } else {
        // No active fast on server
        console.log('[FastingStore] No active fast found on server')
        set({
          fastId: null,
          isActive: false,
          startTime: null,
          pausedAt: null,
          pausedDuration: 0,
          isInitialized: true,
          lastSyncTime: Date.now()
        })
      }
    } catch (error) {
      console.error('[FastingStore] Failed to fetch active fast from server:', error)
      // On error, mark as initialized but with no active fast
      set({
        fastId: null,
        isActive: false,
        startTime: null,
        pausedAt: null,
        pausedDuration: 0,
        isInitialized: true,
        lastSyncTime: Date.now()
      })
    } finally {
      set({ isLoading: false })
    }
  },
  
  // Sync with server (for periodic refresh)
  syncWithServer: async () => {
    // Don't sync if we synced recently (within 5 seconds)
    const lastSync = get().lastSyncTime
    if (lastSync && Date.now() - lastSync < 5000) return
    
    await get().initializeFromServer()
  },
  
  // Start a new fast - server first, then update local
  startFast: async (protocol, backdateMinutes = 0) => {
    const selectedProtocol = protocol || get().protocol
    const targetHours = PROTOCOLS[selectedProtocol].fastHours
    
    set({ isLoading: true })
    
    try {
      const response = await api.startFast({
        protocol: selectedProtocol,
        targetHours,
        backdateMinutes
      })
      
      if (response.success && response.data) {
        const fast = response.data
        set({
          fastId: fast.id,
          isActive: true,
          startTime: fast.startTime,
          targetHours: fast.targetHours || targetHours,
          protocol: selectedProtocol,
          pausedAt: null,
          pausedDuration: 0,
          lastSyncTime: Date.now()
        })
        
        // Send notification if enabled
        notificationService.notifyFastStart(selectedProtocol)
      } else {
        console.error('Failed to start fast on server:', response.error)
        throw new Error(response.error || 'Failed to start fast')
      }
    } catch (error) {
      console.error('Failed to start fast:', error)
      throw error
    } finally {
      set({ isLoading: false })
    }
  },
  
  // End the current fast - server first
  endFast: async (notes, mood) => {
    const { fastId } = get()
    
    console.log('[FastingStore] endFast called with fastId:', fastId)
    
    if (!fastId) {
      console.log('[FastingStore] No fastId, resetting state locally')
      // No fast to end, just reset state
      set({
        fastId: null,
        isActive: false,
        startTime: null,
        pausedAt: null,
        pausedDuration: 0
      })
      return { freezeEarned: false, streak: 0 }
    }
    
    set({ isLoading: true })
    
    // Calculate elapsed hours before resetting state (getElapsedTime returns ms)
    const elapsedHours = get().getElapsedTime() / (1000 * 60 * 60)
    
    try {
      console.log('[FastingStore] Calling api.endFast with id:', fastId)
      const response = await api.endFast(fastId, { notes, mood })
      console.log('[FastingStore] api.endFast response:', response)
      
      if (!response.success) {
        console.error('[FastingStore] API returned error:', response.error)
        throw new Error(response.error || 'Failed to end fast')
      }
      
      // Extract streak and freeze info from response (extended by end_fast endpoint)
      const responseData = response.data as { freeze_earned?: boolean; streak?: number }
      const freezeEarned = responseData?.freeze_earned || false
      const streak = responseData?.streak || 0
      
      // Send completion notification
      if (elapsedHours > 0) {
        notificationService.notifyFastComplete(elapsedHours)
      }
      
      // Notify about streak freeze if earned (7-day milestone)
      if (freezeEarned) {
        notificationService.notifyAchievement(
          '🎁 Streak Freeze Earned!', 
          `You hit a ${streak}-day milestone! A Streak Freeze has been added to your collection.`
        )
      }
      
      console.log('[FastingStore] Fast ended successfully, resetting state')
      // Reset local state after successful server update
      set({
        fastId: null,
        isActive: false,
        startTime: null,
        pausedAt: null,
        pausedDuration: 0,
        lastSyncTime: Date.now()
      })
      
      return { freezeEarned, streak }
    } catch (error) {
      console.error('[FastingStore] Failed to end fast on server:', error)
      // Still reset local state - server might have already ended it
      set({
        fastId: null,
        isActive: false,
        startTime: null,
        pausedAt: null,
        pausedDuration: 0
      })
      return { freezeEarned: false, streak: 0 }
    } finally {
      set({ isLoading: false })
    }
  },
  
  // Pause the fast - sync with server
  pauseFast: async () => {
    const { fastId } = get()
    const pausedAt = new Date().toISOString()
    
    // Update local state immediately for responsive UI
    set({ pausedAt })
    
    if (fastId) {
      try {
        await api.pauseFast(fastId)
      } catch (error) {
        console.error('Failed to pause fast on server:', error)
      }
    }
  },
  
  // Resume the fast - sync with server
  resumeFast: async () => {
    const { fastId, pausedAt, pausedDuration } = get()
    
    if (pausedAt) {
      const additionalPause = Date.now() - new Date(pausedAt).getTime()
      const newPausedDuration = pausedDuration + additionalPause
      
      // Update local state immediately
      set({
        pausedAt: null,
        pausedDuration: newPausedDuration
      })
      
      if (fastId) {
        try {
          await api.resumeFast(fastId)
        } catch (error) {
          console.error('Failed to resume fast on server:', error)
        }
      }
    }
  },
  
  setProtocol: (protocol) => {
    set({
      protocol,
      targetHours: PROTOCOLS[protocol].fastHours
    })
  },
  
  setCustomHours: (hours) => {
    set({ targetHours: hours })
  },
  
  getCurrentZone: () => {
    const elapsed = get().getElapsedTime()
    if (elapsed <= 0) return null
    
    const elapsedHours = elapsed / (1000 * 60 * 60)
    return FASTING_ZONES.find(
      zone => elapsedHours >= zone.startHour && elapsedHours < zone.endHour
    ) || FASTING_ZONES[FASTING_ZONES.length - 1] // Return last zone if beyond all
  },
  
  getElapsedTime: () => {
    const { isActive, startTime, pausedAt, pausedDuration } = get()
    if (!isActive || !startTime) return 0
    
    try {
      const start = new Date(startTime).getTime()
      if (isNaN(start)) return 0
      
      const now = pausedAt ? new Date(pausedAt).getTime() : Date.now()
      if (isNaN(now)) return 0
      
      const elapsed = now - start - pausedDuration
      return elapsed > 0 ? elapsed : 0
    } catch {
      return 0
    }
  },
  
  getProgress: () => {
    const { targetHours } = get()
    const elapsed = get().getElapsedTime()
    if (elapsed <= 0 || targetHours <= 0) return 0
    
    const target = targetHours * 60 * 60 * 1000
    return Math.min((elapsed / target) * 100, 100)
  }
}))

// Optimized selectors to prevent unnecessary re-renders

// Basic fasting state
export const useIsFasting = () => useFastingStore((state) => state.isActive)
export const useFastingProtocol = () => useFastingStore((state) => state.protocol)
export const useTargetHours = () => useFastingStore((state) => state.targetHours)

// Timer state selector - groups related timer values
export const useTimerState = () => useFastingStore(
  useShallow((state) => ({
    isActive: state.isActive,
    startTime: state.startTime,
    targetHours: state.targetHours,
    pausedAt: state.pausedAt,
    pausedDuration: state.pausedDuration,
    protocol: state.protocol,
  }))
)

// Timer actions selector
export const useTimerActions = () => useFastingStore(
  useShallow((state) => ({
    startFast: state.startFast,
    endFast: state.endFast,
    pauseFast: state.pauseFast,
    resumeFast: state.resumeFast,
    setProtocol: state.setProtocol,
  }))
)

// Computed values (these are functions, so they don't cause re-renders on their own)
export const useTimerComputeds = () => useFastingStore(
  useShallow((state) => ({
    getElapsedTime: state.getElapsedTime,
    getProgress: state.getProgress,
    getCurrentZone: state.getCurrentZone,
  }))
)

// Initialization state
export const useFastingInit = () => useFastingStore(
  useShallow((state) => ({
    isInitialized: state.isInitialized,
    isLoading: state.isLoading,
    initializeFromServer: state.initializeFromServer,
    syncWithServer: state.syncWithServer,
  }))
)
