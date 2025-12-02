import { useEffect, useState, useCallback, lazy, Suspense, memo } from 'react'
import { AnimatePresence } from 'framer-motion'
import { LogIn, Sparkles, Loader2 } from 'lucide-react'
import { useAppStore } from './stores/appStore'
import { useFastingStore } from './stores/fastingStore'
import { api } from './services/api'

// Lazy load all tab components for code splitting
// These will be loaded as separate chunks when the tab is accessed
const Dashboard = lazy(() => import('./components/Dashboard'))
const Timer = lazy(() => import('./components/Timer/index'))
const Tracking = lazy(() => import('./components/Tracking'))
const Analytics = lazy(() => import('./components/Analytics'))
const Social = lazy(() => import('./components/Social'))
const Recipes = lazy(() => import('./components/Recipes'))
const Settings = lazy(() => import('./components/Settings'))

// Preload functions for predictive loading
const preloadTimer = () => import('./components/Timer/index')
const preloadTracking = () => import('./components/Tracking')
const preloadAnalytics = () => import('./components/Analytics')

// Eagerly loaded as they're always visible
import BottomNav from './components/BottomNav'
import DesktopLayout from './components/DesktopLayout'
import Toast from './components/Toast'

// Lazy load onboarding & feature tour (not needed for returning users)
const Onboarding = lazy(() => import('./components/Onboarding'))
const FeatureTour = lazy(() => import('./components/FeatureTour'))

// Loading fallback component for lazy-loaded tabs
const TabLoadingFallback = memo(function TabLoadingFallback() {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <Loader2 className="w-8 h-8 text-primary-500 animate-spin mb-3" />
      <p className="text-slate-500 text-sm">Loading...</p>
    </div>
  )
})

// Check if user is logged in via WordPress
const isUserLoggedIn = () => {
  return window.fasttrackData?.is_logged_in === true || (window.fasttrackData?.current_user_id ?? 0) > 0
}

const getLoginUrl = () => {
  const siteUrl = window.fasttrackData?.site_url || ''
  const currentUrl = window.location.href
  return `${siteUrl}/wp-login.php?redirect_to=${encodeURIComponent(currentUrl)}`
}

// Login Required Component
function LoginRequired() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-primary-50/30 to-secondary-50/30 flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-xl shadow-primary-500/30">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">FastTrack Elite</h1>
          <p className="text-slate-600">Your personal intermittent fasting companion</p>
        </div>

        <div className="card-elevated p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-100 flex items-center justify-center">
            <LogIn className="w-8 h-8 text-slate-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Login Required</h2>
          <p className="text-slate-600 mb-6">
            Please log in to your account to access your fasting tracker, view your progress, and sync your data.
          </p>
          <a
            href={getLoginUrl()}
            className="btn-primary inline-flex items-center gap-2 px-8 py-3"
          >
            <LogIn className="w-5 h-5" />
            Log In to Continue
          </a>
          <p className="mt-4 text-sm text-slate-500">
            Don't have an account?{' '}
            <a 
              href={`${window.fasttrackData?.site_url || ''}/wp-login.php?action=register`}
              className="text-primary-600 hover:underline"
            >
              Register here
            </a>
          </p>
        </div>

        <div className="mt-8 text-center text-sm text-slate-500">
          <p>Track your fasts • Monitor your progress • Achieve your goals</p>
        </div>
      </div>
    </div>
  )
}

function App() {
  const { currentTab, isOnboarding, setOnboarding, initializeFromServer } = useAppStore()
  const [isDesktop, setIsDesktop] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null) // null = checking
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(true)
  const [showFeatureTour, setShowFeatureTour] = useState(false)

  // Check login status
  useEffect(() => {
    // Wait a moment for WordPress data to be available
    const checkLogin = () => {
      if (window.fasttrackData !== undefined) {
        setIsLoggedIn(isUserLoggedIn())
      } else {
        // Retry after a short delay
        setTimeout(checkLogin, 100)
      }
    }
    checkLogin()
  }, [])

  // Check onboarding status from database when logged in
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (!isLoggedIn) {
        setIsCheckingOnboarding(false)
        return
      }
      
      try {
        const response = await api.checkOnboardingStatus()
        if (response.success && response.data) {
          if (!response.data.completed) {
            // User hasn't completed onboarding
            setOnboarding(true)
          } else {
            setOnboarding(false)
          }
        } else {
          // API failed - show onboarding as safe default for new users
          console.warn('Failed to check onboarding status, showing onboarding')
            setOnboarding(true)
        }
      } catch (error) {
        console.error('Failed to check onboarding status:', error)
        // On error, show onboarding as safe default
          setOnboarding(true)
      } finally {
        setIsCheckingOnboarding(false)
      }
    }
    
    if (isLoggedIn !== null) {
      checkOnboardingStatus()
    }
  }, [isLoggedIn, setOnboarding])

  // Get fasting store initialization and sync
  const { 
    initializeFromServer: initFasting, 
    isInitialized: fastingInitialized,
    syncWithServer: syncFasting 
  } = useFastingStore()

  // Initialize data from server when logged in and onboarding is done
  useEffect(() => {
    if (isLoggedIn && !isOnboarding && !isCheckingOnboarding) {
      // Initialize app store (stats, etc.)
      if (initializeFromServer) {
        initializeFromServer()
      }
      // Initialize fasting store (active fast sync)
      if (!fastingInitialized) {
        initFasting()
      }
    }
  }, [isLoggedIn, isOnboarding, isCheckingOnboarding, initializeFromServer, initFasting, fastingInitialized])

  // Sync fasting state when tab becomes visible (user returns to tab)
  useEffect(() => {
    if (!isLoggedIn || isOnboarding || isCheckingOnboarding) return

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // User returned to the tab - sync with server
        syncFasting()
      }
    }

    // Also sync periodically (every 30 seconds) to catch changes from other devices
    const syncInterval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        syncFasting()
      }
    }, 30000)

    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      clearInterval(syncInterval)
    }
  }, [isLoggedIn, isOnboarding, isCheckingOnboarding, syncFasting])

  useEffect(() => {
    // Use matchMedia for better responsive detection
    const mediaQuery = window.matchMedia('(min-width: 1024px)')
    
    const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
      setIsDesktop(e.matches)
    }
    
    // Check initial state
    handleChange(mediaQuery)
    
    // Listen for changes
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])
  
  // Predictive preloading: load likely-needed tabs after initial render
  useEffect(() => {
    if (!isLoggedIn || isOnboarding || isCheckingOnboarding) return
    
    // Use requestIdleCallback or setTimeout to avoid blocking main thread
    const preloadNextTabs = () => {
      // Preload Timer (most common second tab after Dashboard)
      preloadTimer()
      // Preload Tracking after a delay
      setTimeout(() => preloadTracking(), 1000)
      // Preload Analytics after longer delay
      setTimeout(() => preloadAnalytics(), 2000)
    }
    
    if ('requestIdleCallback' in window) {
      (window as typeof window & { requestIdleCallback: (cb: () => void) => number }).requestIdleCallback(preloadNextTabs)
    } else {
      setTimeout(preloadNextTabs, 1000)
    }
  }, [isLoggedIn, isOnboarding, isCheckingOnboarding])

  // Dynamic tab title with timer - Desktop HUD feature
  const { isActive, getElapsedTime, targetHours } = useFastingStore()
  
  const formatTimeForTitle = useCallback((ms: number) => {
    if (!ms || isNaN(ms) || ms < 0) return '00:00'
    const hours = Math.floor(ms / (1000 * 60 * 60))
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60))
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
  }, [])

  useEffect(() => {
    if (!isActive) {
      document.title = 'FastTrack Elite'
      return
    }

    const updateTitle = () => {
      const elapsed = getElapsedTime()
      const remaining = (targetHours * 60 * 60 * 1000) - elapsed
      const progress = Math.min((elapsed / (targetHours * 60 * 60 * 1000)) * 100, 100)
      
      if (remaining <= 0) {
        document.title = '🎉 Goal Reached! - FastTrack'
      } else if (progress >= 75) {
        document.title = `🔥 ${formatTimeForTitle(elapsed)} - Almost there!`
      } else if (progress >= 50) {
        document.title = `⚡ ${formatTimeForTitle(elapsed)} - Halfway!`
      } else {
        document.title = `🕐 ${formatTimeForTitle(elapsed)} - Fasting`
      }
    }

    updateTitle()
    const interval = setInterval(updateTitle, 60000) // Update every minute

    return () => {
      clearInterval(interval)
      document.title = 'FastTrack Elite'
    }
  }, [isActive, getElapsedTime, targetHours, formatTimeForTitle])

  // Show loading state while checking login or onboarding
  if (isLoggedIn === null || (isLoggedIn && isCheckingOnboarding)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-primary-50/30 to-secondary-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center animate-pulse">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <p className="text-slate-600">Loading FastTrack...</p>
        </div>
      </div>
    )
  }

  // Show login prompt if not logged in
  if (!isLoggedIn) {
    return <LoginRequired />
  }

  const renderCurrentTab = () => {
    const getTabComponent = () => {
      switch (currentTab) {
        case 'home':
          return <Dashboard />
        case 'timer':
          return <Timer />
        case 'tracking':
          return <Tracking />
        case 'analytics':
          return <Analytics />
        case 'social':
          return <Social />
        case 'recipes':
          return <Recipes />
        case 'settings':
          return <Settings />
        default:
          return <Dashboard />
      }
    }
    
    return (
      <Suspense fallback={<TabLoadingFallback />}>
        {getTabComponent()}
      </Suspense>
    )
  }

  if (isOnboarding) {
    return (
      <Suspense fallback={
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-primary-50/30 to-secondary-50/30 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
        </div>
      }>
        <Onboarding onComplete={() => {
          setOnboarding(false)
          // Onboarding component saves to API - no localStorage backup needed
          // Show feature tour after onboarding (ft_tour_* is a UI preference, acceptable in localStorage)
          const userId = window.fasttrackData?.current_user_id || 0
          const hasSeenTour = localStorage.getItem(`ft_tour_${userId}`)
          if (!hasSeenTour) {
            setShowFeatureTour(true)
          }
        }} />
      </Suspense>
    )
  }

  const handleTourComplete = () => {
    setShowFeatureTour(false)
    const userId = window.fasttrackData?.current_user_id || 0
    localStorage.setItem(`ft_tour_${userId}`, 'true')
  }

  // Desktop Layout
  if (isDesktop) {
    return (
      <>
        <DesktopLayout>
          <AnimatePresence mode="wait">
            <div key={currentTab} className="animate-in">
              {renderCurrentTab()}
            </div>
          </AnimatePresence>
        </DesktopLayout>
        <Toast />
        <AnimatePresence>
          {showFeatureTour && (
            <Suspense fallback={null}>
              <FeatureTour onComplete={handleTourComplete} />
            </Suspense>
          )}
        </AnimatePresence>
      </>
    )
  }

  // Mobile Layout
  return (
    <div className="app-container">
      {/* Main Content */}
      <main className="main-content">
        <AnimatePresence mode="wait">
          <div key={currentTab} className="animate-in">
            {renderCurrentTab()}
          </div>
        </AnimatePresence>
      </main>
      
      {/* Floating Navigation */}
      <BottomNav />
      
      {/* Toast Notifications */}
      <Toast />
      
      {/* Feature Tour */}
      <AnimatePresence>
        {showFeatureTour && (
          <Suspense fallback={null}>
            <FeatureTour onComplete={handleTourComplete} />
          </Suspense>
        )}
      </AnimatePresence>
    </div>
  )
}

export default App
