import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { useFastingStore, PROTOCOLS, FASTING_ZONES } from './fastingStore'
import { api } from '../services/api'

// Mock the API service
vi.mock('../services/api', () => ({
  api: {
    getActiveFast: vi.fn(),
    startFast: vi.fn(),
    endFast: vi.fn(),
    pauseFast: vi.fn(),
    resumeFast: vi.fn()
  }
}))

// Mock notification service
vi.mock('../services/notifications', () => ({
  notificationService: {
    notifyFastStart: vi.fn(),
    notifyFastComplete: vi.fn()
  }
}))

describe('fastingStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useFastingStore.getState().resetState()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const state = useFastingStore.getState()
      
      expect(state.fastId).toBeNull()
      expect(state.isActive).toBe(false)
      expect(state.startTime).toBeNull()
      expect(state.targetHours).toBe(16)
      expect(state.protocol).toBe('16:8')
      expect(state.pausedAt).toBeNull()
      expect(state.pausedDuration).toBe(0)
      expect(state.isLoading).toBe(false)
      expect(state.isInitialized).toBe(false)
    })

    it('should reset state correctly', () => {
      const store = useFastingStore.getState()
      
      // Modify state
      useFastingStore.setState({
        fastId: 123,
        isActive: true,
        startTime: new Date().toISOString(),
        targetHours: 24
      })
      
      // Reset
      store.resetState()
      
      const state = useFastingStore.getState()
      expect(state.fastId).toBeNull()
      expect(state.isActive).toBe(false)
      expect(state.targetHours).toBe(16)
    })
  })

  describe('Protocol Management', () => {
    it('should set protocol and update target hours', () => {
      const { setProtocol } = useFastingStore.getState()
      
      setProtocol('20:4')
      
      const state = useFastingStore.getState()
      expect(state.protocol).toBe('20:4')
      expect(state.targetHours).toBe(20)
    })

    it('should set custom hours', () => {
      const { setCustomHours } = useFastingStore.getState()
      
      setCustomHours(18)
      
      const state = useFastingStore.getState()
      expect(state.targetHours).toBe(18)
    })

    it('should have all protocols defined correctly', () => {
      expect(PROTOCOLS['16:8'].fastHours).toBe(16)
      expect(PROTOCOLS['20:4'].fastHours).toBe(20)
      expect(PROTOCOLS['23:1'].fastHours).toBe(23)
      expect(PROTOCOLS['36h'].fastHours).toBe(36)
    })
  })

  describe('initializeFromServer', () => {
    it('should load active fast from server', async () => {
      const mockFast = {
        id: 123,
        startTime: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
        targetHours: 16,
        protocol: '16:8',
        pausedAt: null,
        pausedDuration: 0
      }
      
      vi.mocked(api.getActiveFast).mockResolvedValue({
        success: true,
        data: mockFast
      })
      
      const { initializeFromServer } = useFastingStore.getState()
      await initializeFromServer()
      
      const state = useFastingStore.getState()
      expect(state.fastId).toBe(123)
      expect(state.isActive).toBe(true)
      expect(state.isInitialized).toBe(true)
    })

    it('should handle no active fast', async () => {
      vi.mocked(api.getActiveFast).mockResolvedValue({
        success: true,
        data: null
      })
      
      const { initializeFromServer } = useFastingStore.getState()
      await initializeFromServer()
      
      const state = useFastingStore.getState()
      expect(state.fastId).toBeNull()
      expect(state.isActive).toBe(false)
      expect(state.isInitialized).toBe(true)
    })

    it('should handle API error', async () => {
      vi.mocked(api.getActiveFast).mockRejectedValue(new Error('Network error'))
      
      const { initializeFromServer } = useFastingStore.getState()
      await initializeFromServer()
      
      const state = useFastingStore.getState()
      expect(state.isInitialized).toBe(true)
      expect(state.isActive).toBe(false)
    })

    it('should auto-end stale fasts older than 7 days', async () => {
      const staleFast = {
        id: 999,
        startTime: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(), // 8 days ago
        targetHours: 16,
        protocol: '16:8'
      }
      
      vi.mocked(api.getActiveFast).mockResolvedValue({
        success: true,
        data: staleFast
      })
      vi.mocked(api.endFast).mockResolvedValue({ success: true })
      
      const { initializeFromServer } = useFastingStore.getState()
      await initializeFromServer()
      
      expect(api.endFast).toHaveBeenCalledWith(999, { notes: 'Auto-ended: stale fast data' })
      const state = useFastingStore.getState()
      expect(state.isActive).toBe(false)
    })
  })

  describe('startFast', () => {
    it('should start a fast with default protocol', async () => {
      const mockResponse = {
        id: 456,
        startTime: new Date().toISOString(),
        targetHours: 16,
        protocol: '16:8'
      }
      
      vi.mocked(api.startFast).mockResolvedValue({
        success: true,
        data: mockResponse
      })
      
      const { startFast } = useFastingStore.getState()
      await startFast()
      
      expect(api.startFast).toHaveBeenCalledWith({
        protocol: '16:8',
        targetHours: 16,
        backdateMinutes: 0
      })
      
      const state = useFastingStore.getState()
      expect(state.fastId).toBe(456)
      expect(state.isActive).toBe(true)
    })

    it('should start a fast with specified protocol', async () => {
      vi.mocked(api.startFast).mockResolvedValue({
        success: true,
        data: {
          id: 789,
          startTime: new Date().toISOString(),
          targetHours: 20,
          protocol: '20:4'
        }
      })
      
      const { startFast } = useFastingStore.getState()
      await startFast('20:4')
      
      expect(api.startFast).toHaveBeenCalledWith({
        protocol: '20:4',
        targetHours: 20,
        backdateMinutes: 0
      })
    })

    it('should support backdating', async () => {
      vi.mocked(api.startFast).mockResolvedValue({
        success: true,
        data: {
          id: 111,
          startTime: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
          targetHours: 16,
          protocol: '16:8'
        }
      })
      
      const { startFast } = useFastingStore.getState()
      await startFast('16:8', 60) // 60 minutes backdated
      
      expect(api.startFast).toHaveBeenCalledWith({
        protocol: '16:8',
        targetHours: 16,
        backdateMinutes: 60
      })
    })

    it('should throw error on API failure', async () => {
      vi.mocked(api.startFast).mockResolvedValue({
        success: false,
        error: 'You already have an active fast'
      })
      
      const { startFast } = useFastingStore.getState()
      
      await expect(startFast()).rejects.toThrow('You already have an active fast')
    })
  })

  describe('endFast', () => {
    beforeEach(() => {
      // Set up an active fast
      useFastingStore.setState({
        fastId: 123,
        isActive: true,
        startTime: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), // 8 hours ago
        targetHours: 16
      })
    })

    it('should end the current fast', async () => {
      vi.mocked(api.endFast).mockResolvedValue({ success: true })
      
      const { endFast } = useFastingStore.getState()
      await endFast()
      
      expect(api.endFast).toHaveBeenCalledWith(123, { notes: undefined, mood: undefined })
      
      const state = useFastingStore.getState()
      expect(state.fastId).toBeNull()
      expect(state.isActive).toBe(false)
    })

    it('should pass notes and mood to API', async () => {
      vi.mocked(api.endFast).mockResolvedValue({ success: true })
      
      const { endFast } = useFastingStore.getState()
      await endFast('Great fast!', 'happy')
      
      expect(api.endFast).toHaveBeenCalledWith(123, { notes: 'Great fast!', mood: 'happy' })
    })

    it('should reset state even when no fastId exists', async () => {
      useFastingStore.setState({ fastId: null, isActive: true })
      
      const { endFast } = useFastingStore.getState()
      await endFast()
      
      expect(api.endFast).not.toHaveBeenCalled()
      const state = useFastingStore.getState()
      expect(state.isActive).toBe(false)
    })
  })

  describe('pauseFast and resumeFast', () => {
    beforeEach(() => {
      useFastingStore.setState({
        fastId: 123,
        isActive: true,
        startTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        pausedAt: null,
        pausedDuration: 0
      })
    })

    it('should pause a fast', async () => {
      vi.mocked(api.pauseFast).mockResolvedValue({ success: true })
      
      const { pauseFast } = useFastingStore.getState()
      await pauseFast()
      
      expect(api.pauseFast).toHaveBeenCalledWith(123)
      
      const state = useFastingStore.getState()
      expect(state.pausedAt).not.toBeNull()
    })

    it('should resume a paused fast', async () => {
      // First pause
      const pauseTime = new Date(Date.now() - 30 * 60 * 1000).toISOString() // 30 min ago
      useFastingStore.setState({ pausedAt: pauseTime, pausedDuration: 0 })
      
      vi.mocked(api.resumeFast).mockResolvedValue({ success: true })
      
      const { resumeFast } = useFastingStore.getState()
      await resumeFast()
      
      expect(api.resumeFast).toHaveBeenCalledWith(123)
      
      const state = useFastingStore.getState()
      expect(state.pausedAt).toBeNull()
      expect(state.pausedDuration).toBeGreaterThan(0)
    })
  })

  describe('Computed Properties', () => {
    describe('getElapsedTime', () => {
      it('should return 0 when no active fast', () => {
        const { getElapsedTime } = useFastingStore.getState()
        expect(getElapsedTime()).toBe(0)
      })

      it('should calculate correct elapsed time', () => {
        const hoursAgo = 4
        useFastingStore.setState({
          isActive: true,
          startTime: new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toISOString()
        })
        
        const { getElapsedTime } = useFastingStore.getState()
        const elapsed = getElapsedTime()
        
        // Should be approximately 4 hours in milliseconds
        const expectedMs = hoursAgo * 60 * 60 * 1000
        expect(elapsed).toBeGreaterThan(expectedMs - 1000) // Within 1 second
        expect(elapsed).toBeLessThan(expectedMs + 1000)
      })

      it('should account for paused duration', () => {
        const startTime = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString() // 4 hours ago
        const pausedDuration = 1 * 60 * 60 * 1000 // 1 hour paused
        
        useFastingStore.setState({
          isActive: true,
          startTime,
          pausedAt: null,
          pausedDuration
        })
        
        const { getElapsedTime } = useFastingStore.getState()
        const elapsed = getElapsedTime()
        
        // Should be approximately 3 hours (4 hours - 1 hour paused)
        const expectedMs = 3 * 60 * 60 * 1000
        expect(elapsed).toBeGreaterThan(expectedMs - 1000)
        expect(elapsed).toBeLessThan(expectedMs + 1000)
      })

      it('should use pausedAt time when paused', () => {
        const startTime = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
        const pausedAt = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
        
        useFastingStore.setState({
          isActive: true,
          startTime,
          pausedAt,
          pausedDuration: 0
        })
        
        const { getElapsedTime } = useFastingStore.getState()
        const elapsed = getElapsedTime()
        
        // Should be 2 hours (time from start to pause)
        const expectedMs = 2 * 60 * 60 * 1000
        expect(elapsed).toBeGreaterThan(expectedMs - 1000)
        expect(elapsed).toBeLessThan(expectedMs + 1000)
      })
    })

    describe('getProgress', () => {
      it('should return 0 when no active fast', () => {
        const { getProgress } = useFastingStore.getState()
        expect(getProgress()).toBe(0)
      })

      it('should calculate correct progress percentage', () => {
        useFastingStore.setState({
          isActive: true,
          startTime: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
          targetHours: 16
        })
        
        const { getProgress } = useFastingStore.getState()
        const progress = getProgress()
        
        // 8 hours of 16 = 50%
        expect(progress).toBeGreaterThan(49)
        expect(progress).toBeLessThan(51)
      })

      it('should cap progress at 100%', () => {
        useFastingStore.setState({
          isActive: true,
          startTime: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(),
          targetHours: 16
        })
        
        const { getProgress } = useFastingStore.getState()
        expect(getProgress()).toBe(100)
      })
    })

    describe('getCurrentZone', () => {
      it('should return null when no active fast', () => {
        const { getCurrentZone } = useFastingStore.getState()
        expect(getCurrentZone()).toBeNull()
      })

      it('should return Fed State for 0-4 hours', () => {
        useFastingStore.setState({
          isActive: true,
          startTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
        })
        
        const { getCurrentZone } = useFastingStore.getState()
        const zone = getCurrentZone()
        
        expect(zone?.name).toBe('Fed State')
      })

      it('should return Ketosis for 16-24 hours', () => {
        useFastingStore.setState({
          isActive: true,
          startTime: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString()
        })
        
        const { getCurrentZone } = useFastingStore.getState()
        const zone = getCurrentZone()
        
        expect(zone?.name).toBe('Ketosis')
      })
    })
  })

  describe('FASTING_ZONES', () => {
    it('should have correct zones defined', () => {
      expect(FASTING_ZONES).toHaveLength(6)
      expect(FASTING_ZONES[0].name).toBe('Fed State')
      expect(FASTING_ZONES[1].name).toBe('Early Fasting')
      expect(FASTING_ZONES[4].name).toBe('Ketosis')
      expect(FASTING_ZONES[5].name).toBe('Deep Autophagy')
    })

    it('should have no gaps in hour ranges', () => {
      for (let i = 1; i < FASTING_ZONES.length; i++) {
        expect(FASTING_ZONES[i].startHour).toBe(FASTING_ZONES[i - 1].endHour)
      }
    })
  })
})