import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Flame, Shield, Zap, Gift, X, Check,
  Droplets, BookOpen, Target, AlertTriangle, Snowflake
} from 'lucide-react'
import { api } from '../services/api'
import { useAppStore } from '../stores/appStore'

interface StreakFreezeProps {
  onClose?: () => void
  isModal?: boolean
}

interface FreezeData {
  available: number
  used: number
  earnedToday: boolean
}

const EARN_ACTIVITIES = [
  { id: 'hydration', label: 'Log hydration 5 times', icon: Droplets, color: 'from-blue-400 to-cyan-500' },
  { id: 'article', label: 'Read an article', icon: BookOpen, color: 'from-purple-400 to-pink-500' },
  { id: 'challenge', label: 'Join a challenge', icon: Target, color: 'from-amber-400 to-orange-500' },
]

// Frost-Flame hybrid icon component
const FrostFlame = ({ className = "", isAvailable = true }: { className?: string, isAvailable?: boolean }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    {/* Flame base */}
    <path 
      d="M12 2C9 6 6 10 8 16C9 18 10 20 12 21C14 20 15 18 16 16C18 10 15 6 12 2Z" 
      fill={isAvailable ? "url(#frostFlameGradient)" : "#CBD5E1"}
      stroke={isAvailable ? "#0EA5E9" : "#94A3B8"}
      strokeWidth="1"
    />
    {/* Ice crystal overlay */}
    <path 
      d="M12 6L12 16M9 9L15 13M15 9L9 13" 
      stroke={isAvailable ? "#DBEAFE" : "#E2E8F0"}
      strokeWidth="1"
      strokeLinecap="round"
      opacity="0.8"
    />
    <defs>
      <linearGradient id="frostFlameGradient" x1="12" y1="2" x2="12" y2="21" gradientUnits="userSpaceOnUse">
        <stop stopColor="#60A5FA" />
        <stop offset="0.5" stopColor="#3B82F6" />
        <stop offset="1" stopColor="#1D4ED8" />
      </linearGradient>
    </defs>
  </svg>
)

export default function StreakFreeze({ onClose, isModal = false }: StreakFreezeProps) {
  const { showToast, currentStreak } = useAppStore()
  
  const [freezeData, setFreezeData] = useState<FreezeData>({
    available: 0,
    used: 0,
    earnedToday: false
  })
  const [isEarning, setIsEarning] = useState(false)
  const [isUsing, setIsUsing] = useState(false)
  const [showConfirmUse, setShowConfirmUse] = useState(false)

  useEffect(() => {
    fetchFreezeData()
  }, [])

  const fetchFreezeData = async () => {
    try {
      const response = await api.getStreakFreezes()
      if (response.success && response.data) {
        setFreezeData(response.data)
      }
    } catch (error) {
      console.error('Failed to fetch freeze data:', error)
    }
  }

  const handleEarnFreeze = async (activity: string) => {
    if (freezeData.earnedToday) {
      showToast('You already earned a freeze today!', 'info')
      return
    }
    
    setIsEarning(true)
    try {
      const response = await api.earnStreakFreeze(activity)
      if (response.success && response.data) {
        setFreezeData(prev => ({
          ...prev,
          available: response.data!.total,
          earnedToday: true
        }))
        showToast('Streak Freeze earned! 🔥❄️', 'success')
      } else {
        showToast(response.error || 'Failed to earn freeze', 'error')
      }
    } catch (error) {
      console.error('Failed to earn freeze:', error)
      showToast('Failed to earn freeze', 'error')
    } finally {
      setIsEarning(false)
    }
  }

  const handleUseFreeze = async () => {
    if (freezeData.available <= 0) {
      showToast('No freezes available!', 'error')
      return
    }
    
    setIsUsing(true)
    try {
      const response = await api.useStreakFreeze()
      if (response.success && response.data) {
        setFreezeData(prev => ({
          ...prev,
          available: response.data!.remaining,
          used: prev.used + 1
        }))
        showToast('Streak protected! Your flame lives on 🔥🛡️', 'success')
        setShowConfirmUse(false)
      } else {
        showToast(response.error || 'Failed to use freeze', 'error')
      }
    } catch (error) {
      console.error('Failed to use freeze:', error)
      showToast('Failed to use freeze', 'error')
    } finally {
      setIsUsing(false)
    }
  }

  // Calculate days to next 7-day milestone
  const nextMilestone = Math.ceil((currentStreak + 1) / 7) * 7
  const daysToMilestone = nextMilestone - currentStreak
  const milestoneProgress = ((7 - daysToMilestone) / 7) * 100

  const content = (
    <div className="space-y-6">
      {/* Header with flame theme */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <motion.div 
            className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-400 via-red-500 to-blue-500 flex items-center justify-center shadow-lg"
            animate={{ 
              boxShadow: ['0 4px 6px rgba(249, 115, 22, 0.3)', '0 8px 12px rgba(59, 130, 246, 0.4)', '0 4px 6px rgba(249, 115, 22, 0.3)']
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <div className="relative">
              <Flame className="w-6 h-6 text-orange-200" />
              <Snowflake className="w-3 h-3 text-blue-200 absolute -bottom-1 -right-1" />
          </div>
          </motion.div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Streak Freezes</h2>
            <p className="text-sm text-slate-500">Protect your flame on tough days</p>
          </div>
        </div>
        {isModal && onClose && (
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        )}
      </div>

      {/* Current Streak with flame animation */}
      <motion.div 
        className="bg-gradient-to-r from-orange-500 via-red-500 to-orange-600 rounded-2xl p-4 text-white relative overflow-hidden"
        animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
        style={{ backgroundSize: '200% 200%' }}
      >
        {/* Animated flame particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 rounded-full bg-yellow-300/50"
              style={{ left: `${15 + i * 15}%`, bottom: 0 }}
              animate={{
                y: [-10, -60],
                x: [0, (Math.random() - 0.5) * 20],
                opacity: [0.8, 0],
                scale: [1, 0.5],
              }}
              transition={{
                duration: 1.5 + Math.random(),
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>
        
        <div className="flex items-center justify-between relative z-10">
          <div>
            <p className="text-white/80 text-sm">Current Streak</p>
            <p className="text-3xl font-bold">{currentStreak} days</p>
          </div>
          <motion.div 
            className="text-5xl"
            animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            🔥
          </motion.div>
        </div>
      </motion.div>

      {/* Milestone Progress */}
      <div className="bg-gradient-to-r from-slate-50 to-orange-50 rounded-2xl p-4 border border-orange-100">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-orange-500" />
            <span className="font-medium text-slate-800">Next Freeze Reward</span>
          </div>
          <span className="text-sm text-orange-600 font-bold">Day {nextMilestone}</span>
        </div>
        
        <div className="h-3 bg-slate-200 rounded-full overflow-hidden mb-2">
          <motion.div
            className="h-full bg-gradient-to-r from-orange-400 via-red-500 to-orange-400 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${milestoneProgress}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            style={{ backgroundSize: '200% 100%' }}
          />
        </div>
        
        <p className="text-xs text-slate-600 text-center">
          {daysToMilestone === 0 
            ? "🎉 Milestone reached! Complete today's fast to earn a freeze!"
            : `${daysToMilestone} day${daysToMilestone > 1 ? 's' : ''} until your next free Streak Freeze!`
          }
        </p>
      </div>

      {/* Freeze Balance with frost-flame icons */}
      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-blue-500" />
            <div>
              <p className="font-bold text-slate-800">Available Freezes</p>
              <p className="text-sm text-slate-500">Max 5 freezes</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  i < freezeData.available
                    ? 'bg-gradient-to-br from-blue-400 to-cyan-500'
                    : 'bg-slate-200'
                }`}
                animate={i < freezeData.available ? {
                  scale: [1, 1.05, 1],
                } : {}}
                transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
              >
                <FrostFlame className="w-5 h-5" isAvailable={i < freezeData.available} />
              </motion.div>
            ))}
          </div>
        </div>
        
        {freezeData.available > 0 ? (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowConfirmUse(true)}
            className="w-full py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-xl font-medium transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-200"
          >
            <Shield className="w-5 h-5" />
            Use Freeze (Protect Today)
          </motion.button>
        ) : (
          <p className="text-center text-slate-500 text-sm py-2">
            No freezes available. Earn more below or reach a 7-day milestone!
          </p>
        )}
      </div>

      {/* Confirm Use Modal */}
      <AnimatePresence>
        {showConfirmUse && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowConfirmUse(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-6 max-w-sm w-full"
              onClick={e => e.stopPropagation()}
            >
              <div className="text-center mb-6">
                <motion.div 
                  className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center"
                  animate={{ 
                    boxShadow: ['0 0 20px rgba(59, 130, 246, 0.3)', '0 0 40px rgba(6, 182, 212, 0.5)', '0 0 20px rgba(59, 130, 246, 0.3)']
                  }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <Shield className="w-8 h-8 text-white" />
                </motion.div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">Use Streak Freeze?</h3>
                <p className="text-slate-500">
                  This will protect your <span className="text-orange-500 font-bold">{currentStreak}-day</span> flame if you don't complete a fast today.
                </p>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirmUse(false)}
                  className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleUseFreeze}
                  disabled={isUsing}
                  className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-bold flex items-center justify-center gap-2"
                >
                  {isUsing ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Check className="w-5 h-5" />
                      Use Freeze
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Earn Freezes */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-5 h-5 text-amber-500" />
          <h3 className="font-bold text-slate-800">Earn Freezes</h3>
          {freezeData.earnedToday && (
            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs rounded-full font-medium">
              Earned today ✓
            </span>
          )}
        </div>
        
        <p className="text-sm text-slate-500 mb-4">
          Complete activities or reach 7-day milestones to earn freezes!
        </p>
        
        <div className="space-y-3">
          {EARN_ACTIVITIES.map(activity => (
            <motion.button
              key={activity.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleEarnFreeze(activity.id)}
              disabled={freezeData.earnedToday || isEarning || freezeData.available >= 5}
              className={`w-full p-4 rounded-2xl border-2 transition-all flex items-center gap-4 ${
                freezeData.earnedToday || freezeData.available >= 5
                  ? 'border-slate-200 bg-slate-50 opacity-50 cursor-not-allowed'
                  : 'border-slate-200 bg-white hover:border-orange-300 hover:bg-orange-50 cursor-pointer'
              }`}
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${activity.color} flex items-center justify-center`}>
                <activity.icon className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-medium text-slate-800">{activity.label}</p>
                <p className="text-sm text-slate-500">+1 Streak Freeze</p>
              </div>
              {!freezeData.earnedToday && freezeData.available < 5 && (
                <Zap className="w-5 h-5 text-amber-500" />
              )}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Info with flame theme */}
      <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-2xl p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-orange-800 mb-1">How Streak Freezes Work</p>
            <ul className="text-sm text-orange-700 space-y-1">
              <li>• Use a freeze to protect your flame for one day</li>
              <li>• <span className="font-medium">Auto-earn</span> a freeze at every 7-day milestone! 🎁</li>
              <li>• Earn up to 1 freeze per day through activities</li>
              <li>• Maximum of 5 freezes can be stored</li>
              <li>• Freezes don't expire - save them for emergencies!</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center justify-center gap-8 py-4 border-t border-slate-100">
        <div className="text-center">
          <p className="text-2xl font-bold text-blue-600">{freezeData.available}</p>
          <p className="text-xs text-slate-500">Available</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-slate-600">{freezeData.used}</p>
          <p className="text-xs text-slate-500">Used Total</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-orange-500">{currentStreak}</p>
          <p className="text-xs text-slate-500">Current Streak</p>
        </div>
      </div>
    </div>
  )

  if (isModal) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-3xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto"
          onClick={e => e.stopPropagation()}
        >
          {content}
        </motion.div>
      </motion.div>
    )
  }

  return <div className="card-elevated">{content}</div>
}
