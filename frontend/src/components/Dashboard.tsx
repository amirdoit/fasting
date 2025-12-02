import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Flame, Clock, Trophy, Zap, Droplets, Plus, 
  TrendingUp, Calendar, ChevronRight, Sparkles,
  Brain, Camera, UtensilsCrossed, Users, Moon, Heart, Shield,
  Pill, Waves, Scan, Globe, Swords
} from 'lucide-react'
import { useAppStore } from '../stores/appStore'
import { useFastingStore, FASTING_ZONES } from '../stores/fastingStore'
import { api } from '../services/api'
import TimerRing from './Timer/TimerRing'
import StreakFreeze from './StreakFreeze'
import StreakFlameTrail from './StreakFlameTrail'
import Mascot from './Mascot'
import SupplementManager from './SupplementManager'
import UrgeSurfer from './UrgeSurfer'
import FastingScanner from './FastingScanner'
import LiveRooms from './LiveRooms'
import RPGCharacter, { RPGStatCard } from './RPGCharacter'

// Feature cards for discoverability
const discoverFeatures = [
  {
    id: 'brain-gym',
    icon: Brain,
    title: 'Brain Gym',
    description: 'Test cognitive performance while fasting',
    color: 'from-purple-500 to-indigo-600',
    tab: 'analytics' as const,
    badge: 'New'
  },
  {
    id: 'food-scanner',
    icon: Camera,
    title: 'AI Food Scanner',
    description: 'Scan meals to get nutrition info',
    color: 'from-emerald-500 to-teal-600',
    tab: 'tracking' as const,
    badge: 'AI'
  },
  {
    id: 'recipes',
    icon: UtensilsCrossed,
    title: 'Healthy Recipes',
    description: 'Fasting-friendly meal ideas',
    color: 'from-orange-500 to-red-500',
    tab: 'recipes' as const,
    badge: null
  },
  {
    id: 'challenges',
    icon: Users,
    title: 'Challenges',
    description: 'Compete with the community',
    color: 'from-blue-500 to-cyan-500',
    tab: 'social' as const,
    badge: null
  },
  {
    id: 'cycle-sync',
    icon: Moon,
    title: 'Cycle Sync',
    description: 'Adapt fasting to your cycle',
    color: 'from-pink-500 to-rose-500',
    tab: 'settings' as const,
    badge: 'Women'
  },
]

// New Phase 2 smart tools that open as modals
type SmartToolId = 'supplements' | 'scanner' | 'urge-surfer' | 'live-rooms' | 'rpg'

const smartTools: { 
  id: SmartToolId
  icon: typeof Pill
  title: string
  description: string
  color: string
  badge: string | null
}[] = [
  {
    id: 'supplements',
    icon: Pill,
    title: 'Supplement Guard',
    description: 'Smart timing for your supplements',
    color: 'from-purple-400 to-indigo-500',
    badge: 'New'
  },
  {
    id: 'scanner',
    icon: Scan,
    title: 'Fasting Scanner',
    description: 'Check if foods break your fast',
    color: 'from-cyan-500 to-blue-500',
    badge: 'New'
  },
  {
    id: 'urge-surfer',
    icon: Waves,
    title: 'Urge Surfer',
    description: 'CBT tool for hunger cravings',
    color: 'from-indigo-500 to-purple-600',
    badge: 'SOS'
  },
  {
    id: 'live-rooms',
    icon: Globe,
    title: 'Live Fasting',
    description: 'See who else is fasting now',
    color: 'from-violet-500 to-purple-600',
    badge: 'Live'
  },
  {
    id: 'rpg',
    icon: Swords,
    title: 'Fasting RPG',
    description: 'Level up your fasting character',
    color: 'from-amber-500 to-orange-600',
    badge: 'Game'
  },
]

export default function Dashboard() {
  const { 
    currentStreak, totalFasts, totalHours, points, level,
    todayHydration, hydrationGoal, addHydration, setStats, showToast, setCurrentTab
  } = useAppStore()
  const { isActive, getElapsedTime, getProgress, getCurrentZone, startFast, protocol } = useFastingStore()
  
  const [, setTick] = useState(0)
  const [showStreakFreeze, setShowStreakFreeze] = useState(false)
  const [activeSmartTool, setActiveSmartTool] = useState<SmartToolId | null>(null)

  // Update timer every second
  useEffect(() => {
    if (!isActive) return
    const interval = setInterval(() => setTick(t => t + 1), 1000)
    return () => clearInterval(interval)
  }, [isActive])

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      const response = await api.getInsights()
      if (response.success && response.data) {
        setStats({
          currentStreak: response.data.streak,
          totalFasts: response.data.totalFasts,
          totalHours: response.data.totalHours,
          points: response.data.points,
          level: response.data.level
        })
      }
    }
    fetchData()
  }, [setStats])

  const formatTime = (ms: number) => {
    const hours = Math.floor(ms / (1000 * 60 * 60))
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((ms % (1000 * 60)) / 1000)
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  const handleQuickWater = async (amount: number) => {
    addHydration(amount)
    showToast(`+${amount}ml water logged! 💧`, 'success')
    await api.logHydration({ amount, drinkType: 'water' })
  }

  const handleStartFast = () => {
    startFast()
    showToast('Fast started! You got this! 💪', 'success')
  }

  const currentZone = getCurrentZone()
  const elapsed = getElapsedTime()
  const progress = getProgress()
  const hydrationPercent = Math.min((todayHydration / hydrationGoal) * 100, 100)

  const statCards = [
    { 
      icon: Flame, 
      label: 'Streak', 
      value: `${currentStreak}`, 
      suffix: 'days',
      gradient: 'bg-gradient-to-br from-orange-400 to-red-500',
      shadow: 'shadow-orange-200'
    },
    { 
      icon: Clock, 
      label: 'Total Hours', 
      value: `${totalHours}`, 
      suffix: 'hrs',
      gradient: 'bg-gradient-to-br from-blue-400 to-cyan-500',
      shadow: 'shadow-blue-200'
    },
    { 
      icon: Trophy, 
      label: 'Fasts', 
      value: `${totalFasts}`, 
      suffix: '',
      gradient: 'bg-gradient-to-br from-emerald-400 to-teal-500',
      shadow: 'shadow-emerald-200'
    },
    { 
      icon: Zap, 
      label: 'Level', 
      value: `${level}`, 
      suffix: `${points} XP`,
      gradient: 'bg-gradient-to-br from-amber-400 to-orange-500',
      shadow: 'shadow-amber-200'
    },
  ]

  return (
    <div className="py-6">
      {/* Header - Mobile only */}
      <header className="flex items-center justify-between mb-6 lg:hidden">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">FastTrack Elite</h1>
          <p className="text-slate-500">
            {isActive ? 'Currently fasting' : 'Ready to start'}
          </p>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-glow-primary">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
      </header>

      {/* Desktop Welcome Message */}
      <div className="hidden lg:flex lg:items-center lg:justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}! 👋
          </h2>
          <p className="text-slate-500">
            {isActive ? "You're doing great! Keep going!" : "Ready to start your fasting journey?"}
          </p>
        </div>
        {!isActive && (
          <button onClick={handleStartFast} className="btn-primary px-8">
            Start Fasting
          </button>
        )}
      </div>

      {/* Stats Grid */}
      <div className="stats-grid mb-6">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`stat-card ${stat.gradient} shadow-lg ${stat.shadow}`}
          >
            <stat.icon className="w-5 h-5 text-white/80 mb-2" />
            <div className="text-2xl font-bold text-white">{stat.value}</div>
            <div className="text-white/80 text-sm">
              {stat.suffix && <span className="mr-1">{stat.suffix}</span>}
              {stat.label}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="content-grid">
        {/* Timer Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="card-elevated mb-6 lg:mb-0 cursor-pointer hover:shadow-strong transition-shadow"
          onClick={() => setCurrentTab('timer')}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-800">Fasting Timer</h2>
            <ChevronRight className="w-5 h-5 text-slate-400" />
          </div>
          
          <div className="flex items-center gap-6">
            <div className="relative">
              <TimerRing 
                progress={progress} 
                size={120} 
                strokeWidth={8}
                color={currentZone?.color || '#FF6B6B'}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  {isActive ? (
                    <>
                      <div className="text-xl font-bold text-slate-800">{formatTime(elapsed)}</div>
                      <div className="text-xs text-slate-500">{Math.round(progress)}%</div>
                    </>
                  ) : (
                    <>
                      <div className="text-xl font-bold text-slate-800">{protocol}</div>
                      <div className="text-xs text-slate-500">Ready</div>
                    </>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex-1">
              {isActive && currentZone ? (
                <div>
                  <div className="text-sm text-slate-500 mb-1">Current Zone</div>
                  <div 
                    className="text-lg font-semibold mb-2"
                    style={{ color: currentZone.color }}
                  >
                    {currentZone.name}
                  </div>
                  <p className="text-sm text-slate-500">{currentZone.description}</p>
                </div>
              ) : (
                <div>
                  <div className="text-sm text-slate-500 mb-1">Protocol</div>
                  <div className="text-lg font-semibold text-slate-800 mb-2">{protocol}</div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleStartFast()
                    }}
                    className="btn-primary text-sm py-2 lg:hidden"
                  >
                    Start Fast
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Fasting Zones Preview */}
          {isActive && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <div className="flex gap-1">
                {FASTING_ZONES.slice(0, 5).map((zone) => {
                  const elapsedHours = elapsed / (1000 * 60 * 60)
                  const isCurrentZone = elapsedHours >= zone.startHour && elapsedHours < zone.endHour
                  const isPast = elapsedHours >= zone.endHour
                  
                  return (
                    <div
                      key={zone.name}
                      className="flex-1 h-2 rounded-full transition-all"
                      style={{
                        backgroundColor: isPast || isCurrentZone ? zone.color : '#E2E8F0',
                        opacity: isPast ? 0.5 : 1
                      }}
                    />
                  )
                })}
              </div>
            </div>
          )}
        </motion.div>

        {/* Hydration Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card-elevated mb-6 lg:mb-0"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-secondary flex items-center justify-center shadow-glow-secondary">
                <Droplets className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="font-semibold text-slate-800">Hydration</h2>
                <p className="text-sm text-slate-500">{todayHydration} / {hydrationGoal} ml</p>
              </div>
            </div>
            <div className="text-2xl font-bold text-secondary-500">
              {Math.round(hydrationPercent)}%
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="h-3 bg-slate-100 rounded-full overflow-hidden mb-4">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${hydrationPercent}%` }}
              className="h-full bg-gradient-secondary rounded-full"
            />
          </div>
          
          {/* Quick add buttons */}
          <div className="flex gap-2">
            {[100, 250, 500].map(amount => (
              <button
                key={amount}
                onClick={() => handleQuickWater(amount)}
                className="flex-1 btn-secondary py-2 text-sm flex items-center justify-center gap-1 hover:bg-secondary-50 hover:text-secondary-600 transition-colors"
              >
                <Plus className="w-4 h-4" />
                {amount}ml
              </button>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mt-6"
      >
        <h2 className="text-lg font-semibold text-slate-800 mb-3">Quick Actions</h2>
        <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
          <button 
            onClick={() => setCurrentTab('tracking')}
            className="card p-4 text-center hover:shadow-medium transition-shadow"
          >
            <div className="w-12 h-12 mx-auto mb-2 rounded-2xl bg-gradient-success flex items-center justify-center shadow-glow-success">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <span className="text-sm font-medium text-slate-700">Log Weight</span>
          </button>
          <button 
            onClick={() => setCurrentTab('tracking')}
            className="card p-4 text-center hover:shadow-medium transition-shadow"
          >
            <div className="w-12 h-12 mx-auto mb-2 rounded-2xl bg-gradient-warning flex items-center justify-center">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <span className="text-sm font-medium text-slate-700">Log Mood</span>
          </button>
          <button 
            onClick={() => setCurrentTab('analytics')}
            className="card p-4 text-center hover:shadow-medium transition-shadow"
          >
            <div className="w-12 h-12 mx-auto mb-2 rounded-2xl bg-gradient-accent flex items-center justify-center">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <span className="text-sm font-medium text-slate-700">View Stats</span>
          </button>
          {/* Desktop additional actions */}
          <button 
            onClick={() => setCurrentTab('tracking')}
            className="hidden lg:block card p-4 text-center hover:shadow-medium transition-shadow"
          >
            <div className="w-12 h-12 mx-auto mb-2 rounded-2xl bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center">
              <Droplets className="w-6 h-6 text-white" />
            </div>
            <span className="text-sm font-medium text-slate-700">Hydration</span>
          </button>
          <button 
            onClick={() => setCurrentTab('social')}
            className="hidden lg:block card p-4 text-center hover:shadow-medium transition-shadow"
          >
            <div className="w-12 h-12 mx-auto mb-2 rounded-2xl bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <span className="text-sm font-medium text-slate-700">Challenges</span>
          </button>
          <button 
            onClick={() => setCurrentTab('timer')}
            className="hidden lg:block card p-4 text-center hover:shadow-medium transition-shadow"
          >
            <div className="w-12 h-12 mx-auto mb-2 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <span className="text-sm font-medium text-slate-700">Timer</span>
          </button>
        </div>
      </motion.div>

      {/* Smart Tools Section - Phase 2 Features */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className="mt-6"
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-slate-800">Smart Tools</h2>
          <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-gradient-to-r from-violet-500 to-purple-600 text-white">
            New
          </span>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {smartTools.map((tool, index) => (
            <motion.button
              key={tool.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.45 + index * 0.05 }}
              onClick={() => setActiveSmartTool(tool.id)}
              className="relative card p-4 text-left hover:shadow-lg transition-all group overflow-hidden"
            >
              {/* Badge */}
              {tool.badge && (
                <span className={`absolute top-2 right-2 px-2 py-0.5 text-[10px] font-bold rounded-full text-white ${
                  tool.badge === 'SOS' ? 'bg-gradient-to-r from-red-500 to-pink-500' :
                  tool.badge === 'Live' ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                  'bg-gradient-to-r from-violet-500 to-purple-600'
                }`}>
                  {tool.badge}
                </span>
              )}
              
              {/* Icon */}
              <div className={`w-12 h-12 mb-3 rounded-xl bg-gradient-to-br ${tool.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                <tool.icon className="w-6 h-6 text-white" />
              </div>
              
              {/* Content */}
              <h3 className="font-semibold text-slate-800 text-sm mb-1">{tool.title}</h3>
              <p className="text-xs text-slate-500 line-clamp-2">{tool.description}</p>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* RPG Character Card - Show if character exists */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.48 }}
        className="mt-6"
      >
        <RPGStatCard />
      </motion.div>

      {/* Streak Flame Trail & Mascot Section */}
      {currentStreak > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-6"
        >
          <StreakFlameTrail 
            currentStreak={currentStreak} 
            showLabel={true}
            size="md"
          />
          
          {/* Streak Freeze Button */}
          <motion.div
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => setShowStreakFreeze(true)}
            className="mt-4 card bg-gradient-to-r from-orange-50 via-red-50 to-blue-50 border border-orange-200 cursor-pointer hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-400 via-red-500 to-blue-500 flex items-center justify-center shadow-lg relative overflow-hidden">
                <motion.div
                  className="absolute inset-0 bg-gradient-to-t from-transparent to-white/20"
                  animate={{ y: ['100%', '-100%'] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <div className="relative">
                  <Flame className="w-6 h-6 text-orange-200" />
                  <Shield className="w-3 h-3 text-blue-200 absolute -bottom-1 -right-1" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-800">Streak Protection</h3>
                <p className="text-slate-600 text-sm">
                  Protect your {currentStreak}-day flame on tough days
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-orange-500" />
            </div>
          </motion.div>
        </motion.div>
      )}
      
      {/* Flame Mascot - When Fasting */}
      {isActive && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.52 }}
          className="mt-6"
        >
          <div className="card-elevated text-center py-6">
            <Mascot size="lg" showMessage={true} />
          </div>
        </motion.div>
      )}

      {/* Discover Features Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55 }}
        className="mt-6"
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-slate-800">Discover Features</h2>
          <span className="text-sm text-slate-500">Explore all tools</span>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {discoverFeatures.map((feature, index) => (
            <motion.button
              key={feature.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.55 + index * 0.05 }}
              onClick={() => setCurrentTab(feature.tab)}
              className="relative card p-4 text-left hover:shadow-lg transition-all group overflow-hidden"
            >
              {/* Badge */}
              {feature.badge && (
                <span className="absolute top-2 right-2 px-2 py-0.5 text-[10px] font-bold rounded-full bg-gradient-to-r from-primary-500 to-accent-500 text-white">
                  {feature.badge}
                </span>
              )}
              
              {/* Icon */}
              <div className={`w-12 h-12 mb-3 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              
              {/* Content */}
              <h3 className="font-semibold text-slate-800 text-sm mb-1">{feature.title}</h3>
              <p className="text-xs text-slate-500 line-clamp-2">{feature.description}</p>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Motivational Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="mt-6"
      >
        <div className="card bg-gradient-to-r from-primary-50 via-accent-50 to-secondary-50 border border-primary-100">
          <div className="flex items-center gap-4">
            <div className="text-4xl">🌟</div>
            <div>
              <h3 className="font-semibold text-slate-800">Keep up the great work!</h3>
              <p className="text-slate-600">
                {currentStreak > 0 
                  ? `You're on a ${currentStreak} day streak. Every fast brings you closer to your goals!`
                  : "Start your first fast today and begin your journey to better health!"}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Streak Freeze Modal */}
      <AnimatePresence>
        {showStreakFreeze && (
          <StreakFreeze isModal onClose={() => setShowStreakFreeze(false)} />
        )}
      </AnimatePresence>

      {/* Smart Tool Modals */}
      <AnimatePresence>
        {activeSmartTool === 'supplements' && (
          <SupplementManager isModal onClose={() => setActiveSmartTool(null)} />
        )}
        {activeSmartTool === 'scanner' && (
          <FastingScanner onClose={() => setActiveSmartTool(null)} />
        )}
        {activeSmartTool === 'urge-surfer' && (
          <UrgeSurfer onClose={() => setActiveSmartTool(null)} />
        )}
        {activeSmartTool === 'live-rooms' && (
          <LiveRooms isModal onClose={() => setActiveSmartTool(null)} />
        )}
        {activeSmartTool === 'rpg' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setActiveSmartTool(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <RPGCharacter size="lg" showStats showMessage />
              <button
                onClick={() => setActiveSmartTool(null)}
                className="mt-6 w-full py-3 bg-slate-100 rounded-xl text-slate-700 font-medium"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
