import { Home, Timer, TrendingUp, BarChart3, Users, Settings, UtensilsCrossed, MoreHorizontal } from 'lucide-react'
import { useState } from 'react'
import { useAppStore, type TabType } from '../stores/appStore'
import { useFastingStore } from '../stores/fastingStore'

const mainTabs: { id: TabType; icon: typeof Home; label: string }[] = [
  { id: 'home', icon: Home, label: 'Home' },
  { id: 'timer', icon: Timer, label: 'Timer' },
  { id: 'tracking', icon: TrendingUp, label: 'Track' },
  { id: 'analytics', icon: BarChart3, label: 'Stats' },
  { id: 'social', icon: Users, label: 'Social' },
]

const moreTabs: { id: TabType; icon: typeof Home; label: string }[] = [
  { id: 'recipes', icon: UtensilsCrossed, label: 'Recipes' },
  { id: 'settings', icon: Settings, label: 'Settings' },
]

export default function BottomNav() {
  const { currentTab, setCurrentTab } = useAppStore()
  const { isActive } = useFastingStore()
  const [showMore, setShowMore] = useState(false)

  const isMoreActive = moreTabs.some(t => t.id === currentTab)

  return (
    <>
      {/* More Menu Popup */}
      {showMore && (
        <div 
          className="fixed inset-0 z-40"
          onClick={() => setShowMore(false)}
        >
          <div 
            className="absolute bottom-24 left-1/2 -translate-x-1/2 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 min-w-[180px]"
            onClick={(e) => e.stopPropagation()}
          >
            {moreTabs.map((tab) => {
              const Icon = tab.icon
              const isActiveTab = currentTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setCurrentTab(tab.id)
                    setShowMore(false)
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                    isActiveTab 
                      ? 'bg-primary-50 text-primary-600' 
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium text-sm">{tab.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 px-4 pb-4 pt-2" style={{ background: 'transparent' }}>
        <div className="max-w-lg mx-auto">
          <div 
            className="flex items-center justify-around rounded-2xl shadow-lg px-2 py-2"
            style={{ backgroundColor: 'white', border: '1px solid #E2E8F0' }}
          >
            {mainTabs.map((tab) => {
              const Icon = tab.icon
              const isActiveTab = currentTab === tab.id
              const showPulse = tab.id === 'timer' && isActive && !isActiveTab
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setCurrentTab(tab.id)}
                  className="relative flex flex-col items-center justify-center w-14 h-14 rounded-xl transition-colors"
                  style={{
                    backgroundColor: isActiveTab ? '#FFF1F0' : 'transparent',
                    color: isActiveTab ? '#DC2626' : '#94A3B8'
                  }}
                >
                  {showPulse && (
                    <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
                  )}
                  <Icon 
                    className="w-5 h-5" 
                    style={{ color: isActiveTab ? '#DC2626' : '#94A3B8' }}
                  />
                  <span 
                    className="text-[10px] mt-1 font-medium"
                    style={{ color: isActiveTab ? '#DC2626' : '#94A3B8' }}
                  >
                    {tab.label}
                  </span>
                </button>
              )
            })}

            {/* More button */}
            <button
              onClick={() => setShowMore(!showMore)}
              className="relative flex flex-col items-center justify-center w-14 h-14 rounded-xl transition-colors"
              style={{
                backgroundColor: (isMoreActive || showMore) ? '#FFF1F0' : 'transparent',
                color: (isMoreActive || showMore) ? '#DC2626' : '#94A3B8'
              }}
            >
              <MoreHorizontal 
                className="w-5 h-5" 
                style={{ color: (isMoreActive || showMore) ? '#DC2626' : '#94A3B8' }}
              />
              <span 
                className="text-[10px] mt-1 font-medium"
                style={{ color: (isMoreActive || showMore) ? '#DC2626' : '#94A3B8' }}
              >
                More
              </span>
            </button>
          </div>
        </div>
      </nav>
    </>
  )
}
