import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock window.fasttrackData that WordPress injects
Object.defineProperty(window, 'fasttrackData', {
  writable: true,
  value: {
    apiUrl: 'http://localhost/wp-json/fasttrack/v1',
    nonce: 'test-nonce-12345',
    userId: 1,
    isLoggedIn: true,
    settings: {
      hydrationGoal: 2500,
      weightUnit: 'kg'
    }
  }
})

// Mock fetch globally
global.fetch = vi.fn()

// Mock notification API
Object.defineProperty(window, 'Notification', {
  writable: true,
  value: class MockNotification {
    static permission = 'granted'
    static requestPermission = vi.fn().mockResolvedValue('granted')
    constructor() {}
  }
})

// Reset all mocks before each test
beforeEach(() => {
  vi.clearAllMocks()
})

// Helper to mock successful API response
export function mockApiResponse<T>(data: T, success = true) {
  return vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ success, data })
  })
}

// Helper to mock API error
export function mockApiError(message: string, status = 400) {
  return vi.fn().mockResolvedValue({
    ok: false,
    status,
    json: () => Promise.resolve({ success: false, error: message })
  })
}