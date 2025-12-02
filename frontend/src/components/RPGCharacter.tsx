import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Heart, Zap, Star, Sparkles,
  ChevronRight
} from 'lucide-react'
import { useRPGStore, CLASS_INFO, getTotalXpForLevel, type RPGClass } from '../stores/rpgStore'
import { useFastingStore } from '../stores/fastingStore'

interface RPGCharacterProps {
  size?: 'sm' | 'md' | 'lg'
  showStats?: boolean
  showMessage?: boolean
  className?: string
}

// Character SVG based on class and state
function CharacterAvatar({ 
  characterClass, 
  level, 
  hpPercent, 
  isAnimated = true 
}: { 
  characterClass: RPGClass
  level: number
  hpPercent: number
  isAnimated?: boolean 
}) {
  const classInfo = CLASS_INFO[characterClass]
  
  // Determine visual state based on HP
  const getState = () => {
    if (hpPercent <= 20) return 'critical'
    if (hpPercent <= 50) return 'hurt'
    return 'healthy'
  }
  
  const state = getState()
  
  return (
    <motion.div
      animate={isAnimated ? { 
        y: state === 'critical' ? [0, 2, 0] : [0, -5, 0],
        rotate: state === 'critical' ? [-2, 2, -2] : 0
      } : {}}
      transition={{ 
        duration: state === 'critical' ? 0.5 : 2, 
        repeat: Infinity, 
        ease: 'easeInOut' 
      }}
      className="relative"
    >
      {/* Character Base */}
      <div className={`relative rounded-full bg-gradient-to-br ${classInfo.color} p-1`}>
        <div className="rounded-full bg-slate-900/20 p-4">
          <span className="text-4xl">{classInfo.icon}</span>
        </div>
        
        {/* Level Badge */}
        <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center text-xs font-bold text-white shadow-lg">
          {level}
        </div>
        
        {/* HP Warning Indicator */}
        {state === 'critical' && (
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [1, 0.5, 1] }}
            transition={{ duration: 0.5, repeat: Infinity }}
            className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500"
          />
        )}
      </div>
      
      {/* Aura Effect (based on level) */}
      {level >= 5 && (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-0 -m-2 rounded-full opacity-50 pointer-events-none"
          style={{
            background: `conic-gradient(from 0deg, transparent, ${
              characterClass === 'monk' ? '#818cf8' :
              characterClass === 'warrior' ? '#f97316' : '#34d399'
            }, transparent)`
          }}
        />
      )}
    </motion.div>
  )
}

// Class Selection Modal
function ClassSelectionModal({ onSelect }: { onSelect: (c: RPGClass) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-6 max-w-md w-full text-white"
      >
        <div className="text-center mb-6">
          <Star className="w-12 h-12 mx-auto text-amber-400 mb-3" />
          <h2 className="text-2xl font-bold">Choose Your Class</h2>
          <p className="text-slate-400 text-sm mt-2">
            Your class determines your bonus XP rewards
          </p>
        </div>

        <div className="space-y-3">
          {(Object.keys(CLASS_INFO) as RPGClass[]).map(classKey => {
            const info = CLASS_INFO[classKey]
            return (
              <motion.button
                key={classKey}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onSelect(classKey)}
                className="w-full p-4 rounded-2xl bg-slate-800/50 border border-slate-700 hover:border-slate-500 transition-colors text-left"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${info.color} flex items-center justify-center text-2xl`}>
                    {info.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-white">{info.name}</h3>
                    <p className="text-slate-400 text-sm">{info.description}</p>
                    <p className="text-emerald-400 text-xs mt-1">{info.bonus}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-500" />
                </div>
              </motion.button>
            )
          })}
        </div>
      </motion.div>
    </motion.div>
  )
}

export default function RPGCharacter({ 
  size = 'md', 
  showStats = true, 
  showMessage = false,
  className = ''
}: RPGCharacterProps) {
  const { 
    character, 
    isLoading, 
    showClassSelection, 
    fetchCharacter, 
    createCharacter 
  } = useRPGStore()
  const { isActive, getElapsedTime } = useFastingStore()
  
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetchCharacter()
  }, [fetchCharacter])

  useEffect(() => {
    if (!character || !showMessage) return
    
    const messages = getMessages()
    setMessage(messages[Math.floor(Math.random() * messages.length)])
    
    const interval = setInterval(() => {
      setMessage(messages[Math.floor(Math.random() * messages.length)])
    }, 30000)
    
    return () => clearInterval(interval)
  }, [character, showMessage, isActive])

  const getMessages = () => {
    if (!character) return ['Loading...']
    
    const hpPercent = (character.currentHp / character.maxHp) * 100
    const classInfo = CLASS_INFO[character.class]
    
    if (hpPercent <= 20) {
      return [
        "I need rest... my HP is critical!",
        "Please complete a fast to heal me!",
        "Running on fumes here..."
      ]
    }
    
    if (isActive) {
      const hours = getElapsedTime() / (1000 * 60 * 60)
      if (hours >= 16) {
        return [
          "Incredible dedication! XP incoming!",
          "You're in the zone! Keep going!",
          "Fat burning mode: ACTIVATED! 🔥"
        ]
      }
      return [
        "Fasting in progress... stay strong!",
        "Every minute counts toward XP!",
        `${classInfo.name} powers activating...`
      ]
    }
    
    return [
      "Ready for your next fast!",
      "Let's earn some XP today!",
      `${classInfo.name} reporting for duty!`
    ]
  }

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <div className="w-12 h-12 rounded-full border-4 border-primary-500 border-t-transparent animate-spin" />
      </div>
    )
  }

  if (showClassSelection) {
    return (
      <AnimatePresence>
        <ClassSelectionModal onSelect={createCharacter} />
      </AnimatePresence>
    )
  }

  if (!character) return null

  const hpPercent = (character.currentHp / character.maxHp) * 100
  const currentLevelXp = getTotalXpForLevel(character.level)
  const nextLevelXp = getTotalXpForLevel(character.level + 1)
  const xpProgress = ((character.totalXp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100
  const classInfo = CLASS_INFO[character.class]

  const sizeClasses = {
    sm: 'scale-75',
    md: 'scale-100',
    lg: 'scale-125'
  }

  return (
    <div className={`${className}`}>
      <div className={`flex flex-col items-center ${sizeClasses[size]}`}>
        {/* Character Avatar */}
        <CharacterAvatar 
          characterClass={character.class}
          level={character.level}
          hpPercent={hpPercent}
        />

        {/* Stats */}
        {showStats && (
          <div className="mt-4 w-full max-w-xs space-y-2">
            {/* HP Bar */}
            <div className="flex items-center gap-2">
              <Heart className={`w-4 h-4 ${hpPercent <= 20 ? 'text-red-500' : 'text-pink-500'}`} />
              <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${hpPercent}%` }}
                  className={`h-full rounded-full ${
                    hpPercent <= 20 ? 'bg-red-500' :
                    hpPercent <= 50 ? 'bg-amber-500' : 'bg-pink-500'
                  }`}
                />
              </div>
              <span className="text-xs text-slate-500 w-12 text-right">
                {character.currentHp}/{character.maxHp}
              </span>
            </div>

            {/* XP Bar */}
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${xpProgress}%` }}
                  className="h-full rounded-full bg-gradient-to-r from-amber-400 to-yellow-500"
                />
              </div>
              <span className="text-xs text-slate-500 w-16 text-right">
                Lv.{character.level}
              </span>
            </div>

            {/* Class Badge */}
            <div className="flex items-center justify-center gap-2 mt-2">
              <div className={`px-3 py-1 rounded-full bg-gradient-to-r ${classInfo.color} text-white text-xs font-medium flex items-center gap-1`}>
                <span>{classInfo.icon}</span>
                <span>{classInfo.name}</span>
              </div>
            </div>
          </div>
        )}

        {/* Message Bubble */}
        {showMessage && message && (
          <motion.div
            key={message}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 bg-white rounded-2xl px-4 py-2 shadow-lg relative max-w-[200px]"
          >
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-b-8 border-l-transparent border-r-transparent border-b-white" />
            <p className="text-sm text-slate-700 text-center">{message}</p>
          </motion.div>
        )}
      </div>
    </div>
  )
}

// Compact stat card for dashboard
export function RPGStatCard() {
  const { character } = useRPGStore()
  
  if (!character) return null
  
  const hpPercent = (character.currentHp / character.maxHp) * 100
  const classInfo = CLASS_INFO[character.class]
  
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="p-4 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 text-white"
    >
      <div className="flex items-center gap-3">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${classInfo.color} flex items-center justify-center text-xl`}>
          {classInfo.icon}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-bold">Lv.{character.level}</span>
            <span className="text-slate-400 text-sm">{classInfo.name}</span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <Heart className="w-3 h-3 text-pink-400" />
            <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full ${hpPercent <= 20 ? 'bg-red-500' : 'bg-pink-500'}`}
                style={{ width: `${hpPercent}%` }}
              />
            </div>
            <span className="text-xs text-slate-400">{Math.round(hpPercent)}%</span>
          </div>
        </div>
      </div>
      <div className="mt-3 text-xs text-emerald-400 flex items-center gap-1">
        <Sparkles className="w-3 h-3" />
        {character.totalXp.toLocaleString()} XP earned
      </div>
    </motion.div>
  )
}

