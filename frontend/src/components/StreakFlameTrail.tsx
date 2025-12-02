import { motion } from 'framer-motion'
import { Snowflake } from 'lucide-react'

interface StreakFlameTrailProps {
  currentStreak: number
  longestStreak?: number
  frozenDays?: number[]  // Indices of days that used a freeze
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

// Get intensity level based on streak length
const getIntensityLevel = (streak: number): 'low' | 'medium' | 'high' | 'inferno' => {
  if (streak >= 15) return 'inferno'
  if (streak >= 8) return 'high'
  if (streak >= 4) return 'medium'
  return 'low'
}

// Individual flame component
const FlameIcon = ({ 
  intensity, 
  isActive, 
  isFrozen, 
  isCurrent,
  size 
}: { 
  intensity: 'low' | 'medium' | 'high' | 'inferno'
  isActive: boolean
  isFrozen: boolean
  isCurrent: boolean
  size: number
}) => {
  // Color based on intensity and state
  const getColors = () => {
    if (isFrozen) {
      return {
        outer: '#60A5FA',
        middle: '#93C5FD',
        inner: '#DBEAFE',
        glow: 'rgba(96, 165, 250, 0.4)',
      }
    }
    if (!isActive) {
      return {
        outer: '#CBD5E1',
        middle: '#E2E8F0',
        inner: '#F1F5F9',
        glow: 'rgba(148, 163, 184, 0.2)',
      }
    }
    switch (intensity) {
      case 'low':
        return {
          outer: '#FF8C42',
          middle: '#FFB366',
          inner: '#FFD699',
          glow: 'rgba(255, 140, 66, 0.4)',
        }
      case 'medium':
        return {
          outer: '#FF6B35',
          middle: '#FF9F1C',
          inner: '#FFE66D',
          glow: 'rgba(255, 159, 28, 0.5)',
        }
      case 'high':
        return {
          outer: '#FF4500',
          middle: '#FF8C00',
          inner: '#FFD700',
          glow: 'rgba(255, 140, 0, 0.6)',
        }
      case 'inferno':
        return {
          outer: '#FF1744',
          middle: '#FF9100',
          inner: '#FFEA00',
          glow: 'rgba(255, 234, 0, 0.7)',
        }
    }
  }

  const colors = getColors()
  const flameScale = isCurrent ? 1.3 : isActive ? 1 : 0.8

  return (
    <motion.div
      className="relative"
      animate={isCurrent && isActive ? {
        scale: [1, 1.1, 1],
        y: [0, -2, 0],
      } : {}}
      transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut' }}
    >
      <svg 
        width={size * flameScale} 
        height={size * 1.2 * flameScale} 
        viewBox="0 0 24 32"
        className="drop-shadow-sm"
      >
        {/* Glow effect */}
        <defs>
          <filter id={`glow-${isActive}-${isFrozen}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Glow base */}
        {isActive && (
          <ellipse 
            cx="12" 
            cy="28" 
            rx="6" 
            ry="2" 
            fill={colors.glow}
          />
        )}

        {/* Flame body */}
        <motion.path
          d="M12 2 C8 8, 4 14, 6 22 Q8 28, 12 30 Q16 28, 18 22 C20 14, 16 8, 12 2"
          fill={colors.outer}
          filter={isActive ? `url(#glow-${isActive}-${isFrozen})` : undefined}
          animate={isActive && !isFrozen ? {
            d: [
              "M12 2 C8 8, 4 14, 6 22 Q8 28, 12 30 Q16 28, 18 22 C20 14, 16 8, 12 2",
              "M12 3 C7 9, 3 15, 5 22 Q8 28, 12 30 Q16 28, 19 22 C21 15, 17 9, 12 3",
              "M12 2 C8 8, 4 14, 6 22 Q8 28, 12 30 Q16 28, 18 22 C20 14, 16 8, 12 2",
            ]
          } : {}}
          transition={{ duration: 0.6, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Middle layer */}
        <path
          d="M12 6 C9 10, 6 15, 8 21 Q10 26, 12 27 Q14 26, 16 21 C18 15, 15 10, 12 6"
          fill={colors.middle}
        />

        {/* Inner core */}
        <path
          d="M12 10 C10 13, 8 17, 9 21 Q11 24, 12 24 Q13 24, 15 21 C16 17, 14 13, 12 10"
          fill={colors.inner}
        />

        {/* Frozen overlay */}
        {isFrozen && (
          <>
            <path
              d="M12 4 L12 26 M6 10 L18 20 M18 10 L6 20"
              stroke="#DBEAFE"
              strokeWidth="1"
              opacity="0.6"
            />
          </>
        )}
      </svg>

      {/* Frozen badge */}
      {isFrozen && (
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
          <Snowflake className="w-2.5 h-2.5 text-white" />
        </div>
      )}
    </motion.div>
  )
}

// Ember trail connecting flames
const EmberTrail = ({ isActive, intensity }: { isActive: boolean, intensity: string }) => {
  const getTrailColor = () => {
    if (!isActive) return '#E2E8F0'
    switch (intensity) {
      case 'inferno': return '#FF9100'
      case 'high': return '#FF8C00'
      case 'medium': return '#FFB366'
      default: return '#FBBF24'
    }
  }

  return (
    <div className="flex items-center mx-0.5">
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={i}
          className="w-1 h-1 rounded-full mx-px"
          style={{ backgroundColor: getTrailColor() }}
          animate={isActive ? {
            opacity: [0.4, 1, 0.4],
            scale: [0.8, 1.2, 0.8],
          } : {}}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            delay: i * 0.15,
          }}
        />
      ))}
    </div>
  )
}

export default function StreakFlameTrail({
  currentStreak,
  longestStreak = 0,
  frozenDays = [],
  showLabel = true,
  size = 'md',
  className = ''
}: StreakFlameTrailProps) {
  const intensity = getIntensityLevel(currentStreak)
  const displayDays = Math.min(Math.max(currentStreak, 7), 14) // Show 7-14 flames
  
  const sizeMap = {
    sm: 16,
    md: 24,
    lg: 32
  }
  const flameSize = sizeMap[size]

  // Calculate days to next milestone
  const nextMilestone = Math.ceil((currentStreak + 1) / 7) * 7
  const daysToMilestone = nextMilestone - currentStreak

  return (
    <div className={`${className}`}>
      {/* Header with streak info */}
      {showLabel && (
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🔥</span>
            <div>
              <p className="text-lg font-bold text-slate-800">{currentStreak} Day Streak</p>
              {longestStreak > currentStreak && (
                <p className="text-xs text-slate-500">Best: {longestStreak} days</p>
              )}
            </div>
          </div>
          
          {/* Intensity badge */}
          <div className={`px-3 py-1 rounded-full text-xs font-bold ${
            intensity === 'inferno' 
              ? 'bg-gradient-to-r from-red-500 to-yellow-500 text-white animate-pulse'
              : intensity === 'high'
              ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white'
              : intensity === 'medium'
              ? 'bg-gradient-to-r from-yellow-400 to-orange-400 text-slate-900'
              : 'bg-orange-100 text-orange-700'
          }`}>
            {intensity === 'inferno' ? '🔥 UNSTOPPABLE!' : 
             intensity === 'high' ? '🔥 On Fire!' :
             intensity === 'medium' ? 'Burning Bright' : 'Getting Started'}
          </div>
        </div>
      )}

      {/* Flame trail visualization */}
      <div className="bg-gradient-to-r from-slate-50 to-orange-50 rounded-2xl p-4 border border-orange-100">
        <div className="flex items-end justify-center gap-0.5 mb-3">
          {[...Array(displayDays)].map((_, index) => {
            const dayNumber = index + 1
            const isActive = dayNumber <= currentStreak
            const isCurrent = dayNumber === currentStreak
            const isFrozen = frozenDays.includes(dayNumber)
            
            return (
              <div key={index} className="flex items-end">
                {index > 0 && (
                  <EmberTrail isActive={isActive} intensity={intensity} />
                )}
                <FlameIcon
                  intensity={intensity}
                  isActive={isActive}
                  isFrozen={isFrozen}
                  isCurrent={isCurrent}
                  size={flameSize}
                />
              </div>
            )
          })}
          
          {/* Show more indicator */}
          {currentStreak > 14 && (
            <div className="ml-2 flex items-center text-orange-500 font-bold text-sm">
              +{currentStreak - 14}
            </div>
          )}
        </div>

        {/* Milestone progress */}
        <div className="mt-4 pt-3 border-t border-orange-100">
          <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
            <span>Next Freeze Reward</span>
            <span className="font-medium">{daysToMilestone} days to go</span>
          </div>
          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-orange-400 to-red-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${((7 - daysToMilestone) / 7) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <p className="text-xs text-slate-500 mt-1 text-center">
            🎁 Earn a Streak Freeze at Day {nextMilestone}!
          </p>
        </div>
      </div>

      {/* Particle effects for high streaks */}
      {intensity === 'inferno' && (
        <div className="relative h-0">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 rounded-full"
              style={{
                background: i % 2 === 0 ? '#FF9100' : '#FFEA00',
                left: `${20 + Math.random() * 60}%`,
                bottom: 0,
              }}
              animate={{
                y: [-10, -40 - Math.random() * 30],
                x: [(Math.random() - 0.5) * 30, (Math.random() - 0.5) * 60],
                opacity: [1, 0],
                scale: [1, 0.3],
              }}
              transition={{
                duration: 1.5 + Math.random(),
                repeat: Infinity,
                delay: Math.random() * 2,
                ease: 'easeOut',
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

