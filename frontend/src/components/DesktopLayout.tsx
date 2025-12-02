import { useEffect, useState, useRef } from 'react'
import { 
  Home, Timer, TrendingUp, BarChart3, Users, Settings, UtensilsCrossed,
  Sparkles, Flame, Zap, Trophy, Bell, User, ChevronDown,
  Target, Calendar, Award, Heart, LogOut, UserCircle, HelpCircle
} from 'lucide-react'
import { useAppStore, type TabType } from '../stores/appStore'
import { useFastingStore } from '../stores/fastingStore'
import { api } from '../services/api'

const tabs: { id: TabType; icon: typeof Home; label: string; description: string }[] = [
  { id: 'home', icon: Home, label: 'Dashboard', description: 'Overview & Quick Actions' },
  { id: 'timer', icon: Timer, label: 'Fasting Timer', description: 'Track Your Fast' },
  { id: 'tracking', icon: TrendingUp, label: 'Health Tracking', description: 'Weight, Water & Mood' },
  { id: 'analytics', icon: BarChart3, label: 'Analytics', description: 'Insights & Reports' },
  { id: 'social', icon: Users, label: 'Community', description: 'Challenges & Friends' },
  { id: 'recipes', icon: UtensilsCrossed, label: 'Recipes', description: 'Healthy Meal Ideas' },
  { id: 'settings', icon: Settings, label: 'Settings', description: 'Preferences' },
]

interface DesktopLayoutProps {
  children: React.ReactNode
}

interface Notification {
  id: number
  type: string
  title: string
  message: string
  isRead: boolean
  createdAt: string
}

export default function DesktopLayout({ children }: DesktopLayoutProps) {
  const { currentTab, setCurrentTab, currentStreak, level, points, totalFasts, todayHydration, hydrationGoal } = useAppStore()
  const { isActive, getElapsedTime, targetHours, pausedAt } = useFastingStore()
  const [userName, setUserName] = useState<string>('User')
  const [userAvatar, setUserAvatar] = useState<string | null>(null)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [, setTick] = useState(0) // Force re-render for timer
  const userMenuRef = useRef<HTMLDivElement>(null)
  const notifMenuRef = useRef<HTMLDivElement>(null)

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false)
      }
      if (notifMenuRef.current && !notifMenuRef.current.contains(event.target as Node)) {
        setShowNotifications(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Update timer every second when fasting is active
  useEffect(() => {
    if (!isActive || pausedAt) return
    const interval = setInterval(() => setTick(t => t + 1), 1000)
    return () => clearInterval(interval)
  }, [isActive, pausedAt])

  // Fetch user profile
  useEffect(() => {
    const fetchProfile = async () => {
      const response = await api.getProfile()
      if (response.success && response.data) {
        setUserName(response.data.name || 'User')
        setUserAvatar(response.data.avatar || null)
      }
    }
    fetchProfile()
  }, [])

  // Fetch notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      const response = await api.getNotifications()
      if (response.success && response.data) {
        setNotifications(response.data)
      }
    }
    fetchNotifications()
    // Refresh notifications every 5 minutes
    const interval = setInterval(fetchNotifications, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const unreadCount = notifications.filter(n => !n.isRead).length

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'achievement': return '🎉'
      case 'milestone': return '🔥'
      case 'streak': return '⭐'
      case 'level': return '⬆️'
      case 'reminder': return '💧'
      case 'tip': return '💡'
      default: return '📣'
    }
  }

  const handleMarkAsRead = async (id: number) => {
    await api.markNotificationRead(id)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n))
  }

  const elapsed = getElapsedTime() // Returns milliseconds
  const hours = Math.floor(elapsed / (1000 * 60 * 60))
  const minutes = Math.floor((elapsed % (1000 * 60 * 60)) / (1000 * 60))

  return (
    <div className="desktop-layout min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-slate-200 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo & Brand */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/30">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-slate-800">FastTrack Elite</h1>
                  <p className="text-xs text-slate-500">Intermittent Fasting Companion</p>
                </div>
              </div>
            </div>

            {/* Quick Stats Bar */}
            <div className="hidden xl:flex items-center gap-6">
              {/* Current Fast Status */}
              {isActive && (
                <div className="flex items-center gap-3 px-4 py-2 bg-primary-50 rounded-xl border border-primary-100">
                  <div className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
                  <div>
                    <div className="text-xs text-primary-600 font-medium">Fasting Now</div>
                    <div className="text-sm font-bold text-primary-700">
                      {hours}h {minutes}m / {targetHours}h
                    </div>
                  </div>
                </div>
              )}

              {/* Stats Pills */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-50 rounded-full border border-orange-100">
                  <Flame className="w-4 h-4 text-orange-500" />
                  <span className="text-sm font-semibold text-orange-700">{currentStreak} day streak</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-full border border-emerald-100">
                  <Trophy className="w-4 h-4 text-emerald-500" />
                  <span className="text-sm font-semibold text-emerald-700">{totalFasts} fasts</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-full border border-blue-100">
                  <Zap className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-semibold text-blue-700">Level {level}</span>
                </div>
              </div>
            </div>

            {/* User Menu */}
            <div className="flex items-center gap-3">
              {/* Notifications */}
              <div className="relative" ref={notifMenuRef}>
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2.5 rounded-xl hover:bg-slate-100 transition-colors"
                  title="Notifications"
                >
                  <Bell className="w-5 h-5 text-slate-600" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-primary-500 text-white text-xs font-bold flex items-center justify-center ring-2 ring-white">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
                
                {/* Notifications Dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-96 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-50">
                    <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-primary-50 to-white">
                      <h3 className="font-semibold text-slate-800">Notifications</h3>
                      {unreadCount > 0 && (
                        <span className="text-xs text-primary-600 font-medium bg-primary-100 px-2 py-0.5 rounded-full">
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length === 0 ? (
                      <div className="px-4 py-8 text-center text-slate-400">
                        <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No notifications yet</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-slate-100">
                          {notifications.map(notif => (
                            <div 
                              key={notif.id}
                              onClick={() => handleMarkAsRead(notif.id)}
                              className={`px-4 py-3 hover:bg-slate-50 cursor-pointer transition-colors ${
                                !notif.isRead ? 'bg-primary-50/50' : ''
                              }`}
                            >
                              <div className="flex gap-3">
                                <div className="text-2xl flex-shrink-0">
                                  {getNotificationIcon(notif.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-2">
                                    <h4 className={`text-sm font-medium truncate ${
                                      !notif.isRead ? 'text-slate-900' : 'text-slate-700'
                                    }`}>
                                      {notif.title}
                                    </h4>
                                    {!notif.isRead && (
                                      <span className="w-2 h-2 rounded-full bg-primary-500 flex-shrink-0" />
                                    )}
                                  </div>
                                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                                    {notif.message}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                      )}
                    </div>
                    {notifications.length > 0 && (
                      <div className="px-4 py-2 border-t border-slate-100 bg-slate-50">
                        <button 
                          onClick={() => setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))}
                          className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                        >
                          Mark all as read
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* User Dropdown */}
              <div className="relative" ref={userMenuRef}>
                <button 
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-100 transition-colors"
                >
                  {userAvatar ? (
                    <img 
                      src={userAvatar} 
                      alt={userName} 
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <span className="text-sm font-medium text-slate-700">{userName}</span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
                </button>
                
                {/* User Dropdown Menu */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50">
                    {/* User Info */}
                    <div className="px-4 py-3 border-b border-slate-100">
                      <div className="flex items-center gap-3">
                        {userAvatar ? (
                          <img src={userAvatar} alt={userName} className="w-10 h-10 rounded-full" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
                            <User className="w-5 h-5 text-white" />
                          </div>
                        )}
                        <div>
                          <div className="font-semibold text-slate-800">{userName}</div>
                          <div className="text-xs text-slate-500">Level {level} • {points} XP</div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Menu Items */}
                    <div className="py-1">
                      <button
                        onClick={() => {
                          setCurrentTab('settings')
                          setShowUserMenu(false)
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        <UserCircle className="w-4 h-4 text-slate-500" />
                        <span>My Profile</span>
                      </button>
                      <button
                        onClick={() => {
                          setCurrentTab('settings')
                          setShowUserMenu(false)
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        <Settings className="w-4 h-4 text-slate-500" />
                        <span>Settings</span>
                      </button>
                      <button
                        onClick={() => {
                          // Reset feature tour
                          const userId = window.fasttrackData?.current_user_id || 0
                          localStorage.removeItem(`ft_tour_${userId}`)
                          window.location.reload()
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        <HelpCircle className="w-4 h-4 text-slate-500" />
                        <span>Feature Tour</span>
                      </button>
                    </div>
                    
                    {/* Logout */}
                    <div className="border-t border-slate-100 pt-1 mt-1">
                      <a
                        href={`${window.fasttrackData?.site_url || ''}/wp-login.php?action=logout`}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Log Out</span>
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Tab Navigation - Clean white background */}
      <nav 
        className="sticky top-16 z-40 overflow-x-auto scrollbar-hide"
        style={{ backgroundColor: 'white', borderBottom: '1px solid #E2E8F0' }}
      >
        <div className="max-w-[1600px] mx-auto px-6">
          <div className="flex items-center gap-2 py-3">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActiveTab = currentTab === tab.id
              const showPulse = tab.id === 'timer' && isActive
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setCurrentTab(tab.id)}
                  className="relative flex items-center gap-2.5 px-4 py-2.5 rounded-xl transition-colors duration-150 whitespace-nowrap"
                  style={{
                    backgroundColor: isActiveTab ? '#FFF1F0' : 'transparent',
                    color: isActiveTab ? '#DC2626' : '#64748B',
                    border: isActiveTab ? '1px solid #FECACA' : '1px solid transparent'
                  }}
                >
                  <Icon 
                    className="w-5 h-5" 
                    style={{ color: isActiveTab ? '#DC2626' : '#94A3B8' }}
                  />
                  <span 
                    className="text-sm font-medium"
                    style={{ color: isActiveTab ? '#DC2626' : '#64748B' }}
                  >
                    {tab.label}
                  </span>
                  
                  {/* Pulse indicator for active fast */}
                  {showPulse && !isActiveTab && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-primary-500 animate-pulse ring-2 ring-white" />
                  )}
                  
                  {/* Active indicator dot */}
                  {isActiveTab && (
                    <span 
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: '#DC2626' }}
                    />
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </nav>

      {/* Main Content Area with Sidebar */}
      <div className="max-w-[1600px] mx-auto px-6 py-6">
        <div className="flex gap-6">
          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {children}
          </main>

          {/* Right Sidebar - Quick Info Panel */}
          <aside className="hidden 2xl:block w-80 flex-shrink-0">
            <div className="sticky top-36 space-y-4">
              {/* Today's Progress */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <Target className="w-4 h-4 text-primary-500" />
                  Today's Progress
                </h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-600">Fasting Goal</span>
                      <span className="font-medium text-slate-800">{isActive ? `${hours}h ${minutes}m / ${targetHours}h` : 'Not started'}</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-primary-400 to-primary-600 rounded-full transition-all duration-500"
                        style={{ width: isActive ? `${Math.min((elapsed / (targetHours * 60 * 60 * 1000)) * 100, 100)}%` : '0%' }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-600">Hydration</span>
                      <span className="font-medium text-slate-800">{todayHydration} / {hydrationGoal}ml</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-cyan-400 to-cyan-600 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min((todayHydration / hydrationGoal) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-600">Daily XP</span>
                      <span className="font-medium text-slate-800">{points} / 100</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-amber-400 to-amber-600 rounded-full transition-all"
                        style={{ width: `${Math.min(points, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Upcoming */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-500" />
                  Upcoming
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      <Timer className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-slate-800">Next Fast</div>
                      <div className="text-xs text-slate-500">Tomorrow, 8:00 PM</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-xl">
                    <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                      <Trophy className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-slate-800">Weekly Challenge</div>
                      <div className="text-xs text-slate-500">3 days remaining</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Achievements Preview */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-500" />
                  Recent Achievements
                </h3>
                <div className="flex flex-wrap gap-2">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
                    <span className="text-xl">🌟</span>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                    <span className="text-xl">🔥</span>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                    <span className="text-xl">💧</span>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center">
                    <span className="text-slate-400 text-lg">+5</span>
                  </div>
                </div>
              </div>

              {/* Health Tip */}
              <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl p-5 text-white shadow-lg shadow-primary-500/30">
                <div className="flex items-center gap-2 mb-3">
                  <Heart className="w-4 h-4" />
                  <h3 className="text-sm font-semibold">Health Tip</h3>
                </div>
                <p className="text-sm text-white/90 leading-relaxed">
                  Drinking water during your fast helps suppress hunger and keeps your metabolism active. Aim for 8 glasses daily!
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}

