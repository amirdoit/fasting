import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { useFastingStore } from '../stores/fastingStore'

// Fasting phase states based on elapsed hours
type FlamePhase = 'resting' | 'warming' | 'burning' | 'inferno'

interface MascotProps {
  phase?: FlamePhase
  size?: 'sm' | 'md' | 'lg'
  showMessage?: boolean
  className?: string
}

const FLAME_MESSAGES: Record<FlamePhase, string[]> = {
  resting: [
    "Ready when you are! 🔥",
    "Let's light this up!",
    "Time to spark something great?",
    "Feeling a little cold here...",
  ],
  warming: [
    "Getting warmer! 💪",
    "The fire is building...",
    "Your metabolism is waking up!",
    "Keep feeding the flame!",
    "Glycogen reserves depleting...",
  ],
  burning: [
    "FAT BURN MODE! 🏋️",
    "You're on fire now!",
    "Ketones are flowing!",
    "Peak fat oxidation!",
    "Your body is a furnace!",
    "Stay strong, warrior!",
  ],
  inferno: [
    "AUTOPHAGY ACTIVATED! 🔥🔥🔥",
    "UNSTOPPABLE!",
    "Cellular cleanup in progress!",
    "You're LEGENDARY!",
    "Maximum power achieved!",
    "Super Saiyan mode!",
  ],
}

// SVG Flame Mascot - Transforms through fasting phases
const FlameSVG = ({ phase, size }: { phase: FlamePhase; size: number }) => {
  // Color configurations for each phase
  const getColors = () => {
    switch (phase) {
      case 'resting':
        return {
          outer: '#FF8C42',
          middle: '#FFB366',
          inner: '#FFD699',
          glow: 'rgba(255, 140, 66, 0.3)',
          eye: '#4A3728',
        }
      case 'warming':
        return {
          outer: '#FF6B35',
          middle: '#FF9F1C',
          inner: '#FFE66D',
          glow: 'rgba(255, 159, 28, 0.4)',
          eye: '#4A3728',
        }
      case 'burning':
        return {
          outer: '#FF4500',
          middle: '#FF8C00',
          inner: '#FFD700',
          glow: 'rgba(255, 140, 0, 0.5)',
          eye: '#2D1810',
        }
      case 'inferno':
        return {
          outer: '#FF1744',
          middle: '#FF9100',
          inner: '#FFEA00',
          glow: 'rgba(255, 234, 0, 0.6)',
          eye: '#1A0A05',
          aura: '#00E5FF',
        }
    }
  }

  const colors = getColors()

  // Animation variants for each phase
  const getFlameAnimation = () => {
    switch (phase) {
      case 'resting':
        return {
          scale: [1, 1.02, 1],
          y: [0, -1, 0],
          transition: { duration: 3, repeat: Infinity, ease: 'easeInOut' }
        }
      case 'warming':
        return {
          scale: [1, 1.05, 1],
          y: [0, -3, 0],
          rotate: [-1, 1, -1],
          transition: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' }
        }
      case 'burning':
        return {
          scale: [1, 1.08, 1.03, 1.08, 1],
          y: [0, -5, -2, -5, 0],
          rotate: [-2, 2, -2],
          transition: { duration: 0.8, repeat: Infinity, ease: 'easeInOut' }
        }
      case 'inferno':
        return {
          scale: [1, 1.12, 1.05, 1.12, 1],
          y: [0, -8, -3, -8, 0],
          rotate: [-3, 3, -3],
          transition: { duration: 0.5, repeat: Infinity, ease: 'easeInOut' }
    }
  }
  }

  // Eye expressions based on phase
  const getEyeExpression = () => {
    switch (phase) {
      case 'resting':
        // Sleepy half-closed eyes
        return (
          <>
            <path d="M32 45 Q37 42 42 45" fill="none" stroke={colors.eye} strokeWidth="2.5" strokeLinecap="round" />
            <path d="M58 45 Q63 42 68 45" fill="none" stroke={colors.eye} strokeWidth="2.5" strokeLinecap="round" />
          </>
        )
      case 'warming':
        // Eyes opening
        return (
          <>
            <ellipse cx="37" cy="44" rx="4" ry="5" fill={colors.eye} />
            <ellipse cx="63" cy="44" rx="4" ry="5" fill={colors.eye} />
            <circle cx="38" cy="43" r="1.5" fill="white" />
            <circle cx="64" cy="43" r="1.5" fill="white" />
          </>
        )
      case 'burning':
        // Determined eyes with headband
  return (
          <>
            {/* Headband */}
            <rect x="25" y="32" width="50" height="6" rx="2" fill="#E53935" />
            <path d="M75 32 L85 28 L83 38 L75 38 Z" fill="#E53935" />
            <path d="M76 28 L86 24 L84 34 L76 34 Z" fill="#C62828" />
            {/* Intense eyes */}
            <ellipse cx="37" cy="44" rx="5" ry="6" fill={colors.eye} />
            <ellipse cx="63" cy="44" rx="5" ry="6" fill={colors.eye} />
            <circle cx="38" cy="42" r="2" fill="white" />
            <circle cx="64" cy="42" r="2" fill="white" />
            {/* Determined eyebrows */}
            <path d="M30 38 L44 40" stroke={colors.eye} strokeWidth="2" strokeLinecap="round" />
            <path d="M70 38 L56 40" stroke={colors.eye} strokeWidth="2" strokeLinecap="round" />
          </>
        )
      case 'inferno':
        // Super Saiyan glowing eyes
        return (
          <>
            {/* Aura headband */}
            <motion.rect 
              x="20" y="30" width="60" height="8" rx="3" 
              fill="url(#auraGradient)"
              animate={{ opacity: [0.8, 1, 0.8] }}
              transition={{ duration: 0.3, repeat: Infinity }}
            />
            {/* Glowing eyes */}
            <motion.ellipse 
              cx="37" cy="44" rx="6" ry="7" 
              fill="#00E5FF"
              animate={{ opacity: [0.8, 1, 0.8] }}
              transition={{ duration: 0.2, repeat: Infinity }}
            />
            <motion.ellipse 
              cx="63" cy="44" rx="6" ry="7" 
              fill="#00E5FF"
              animate={{ opacity: [0.8, 1, 0.8] }}
              transition={{ duration: 0.2, repeat: Infinity, delay: 0.1 }}
            />
            <circle cx="37" cy="44" r="3" fill="white" />
            <circle cx="63" cy="44" r="3" fill="white" />
            {/* Power eyebrows */}
            <motion.path 
              d="M28 36 L46 40" 
              stroke="#00E5FF" 
              strokeWidth="3" 
              strokeLinecap="round"
              animate={{ strokeWidth: [3, 4, 3] }}
              transition={{ duration: 0.3, repeat: Infinity }}
            />
            <motion.path 
              d="M72 36 L54 40" 
              stroke="#00E5FF" 
              strokeWidth="3" 
              strokeLinecap="round"
              animate={{ strokeWidth: [3, 4, 3] }}
              transition={{ duration: 0.3, repeat: Infinity }}
            />
          </>
        )
    }
  }

  // Mouth based on phase
  const getMouth = () => {
    switch (phase) {
      case 'resting':
        return <path d="M42 55 Q50 58 58 55" fill="none" stroke={colors.eye} strokeWidth="2" strokeLinecap="round" />
      case 'warming':
        return <path d="M40 54 Q50 62 60 54" fill="none" stroke={colors.eye} strokeWidth="2" strokeLinecap="round" />
      case 'burning':
        return (
          <path d="M38 52 Q50 68 62 52" fill="none" stroke={colors.eye} strokeWidth="2.5" strokeLinecap="round" />
        )
      case 'inferno':
        return (
          <motion.path 
            d="M35 50 Q50 72 65 50" 
            fill="none" 
            stroke="#00E5FF" 
            strokeWidth="3" 
            strokeLinecap="round"
            animate={{ d: ["M35 50 Q50 72 65 50", "M35 48 Q50 75 65 48", "M35 50 Q50 72 65 50"] }}
            transition={{ duration: 0.3, repeat: Infinity }}
          />
        )
    }
  }

  // Height multiplier based on phase
  const getFlameHeight = () => {
    switch (phase) {
      case 'resting': return 0.7
      case 'warming': return 0.85
      case 'burning': return 1.0
      case 'inferno': return 1.2
    }
  }

  const flameHeight = getFlameHeight()

  return (
    <motion.svg
      width={size}
      height={size * flameHeight}
      viewBox={`0 0 100 ${100 * flameHeight}`}
      animate={getFlameAnimation()}
    >
      <defs>
        {/* Glow filter */}
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        
        {/* Aura gradient for inferno */}
        <linearGradient id="auraGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#00E5FF" />
          <stop offset="50%" stopColor="#FFEA00" />
          <stop offset="100%" stopColor="#00E5FF" />
        </linearGradient>

        {/* Flame gradient */}
        <radialGradient id="flameGradient" cx="50%" cy="70%" r="60%">
          <stop offset="0%" stopColor={colors.inner} />
          <stop offset="50%" stopColor={colors.middle} />
          <stop offset="100%" stopColor={colors.outer} />
        </radialGradient>
      </defs>

      {/* Aura effect for inferno */}
      {phase === 'inferno' && (
        <>
          <motion.ellipse
            cx="50"
            cy="55"
            rx="45"
            ry="50"
            fill="none"
            stroke="#00E5FF"
            strokeWidth="2"
            opacity="0.5"
            animate={{ 
              rx: [45, 50, 45],
              ry: [50, 55, 50],
              opacity: [0.3, 0.6, 0.3]
            }}
            transition={{ duration: 0.5, repeat: Infinity }}
          />
          <motion.ellipse
            cx="50"
            cy="55"
            rx="40"
            ry="45"
            fill="none"
            stroke="#FFEA00"
            strokeWidth="1.5"
            opacity="0.4"
            animate={{ 
              rx: [40, 44, 40],
              ry: [45, 49, 45],
              opacity: [0.2, 0.5, 0.2]
            }}
            transition={{ duration: 0.4, repeat: Infinity, delay: 0.1 }}
          />
        </>
      )}
      
      {/* Glow base */}
      <ellipse 
        cx="50" 
        cy={85 * flameHeight} 
        rx="25" 
        ry="8" 
        fill={colors.glow}
        filter="url(#glow)"
      />

      {/* Main flame body - outer */}
      <motion.path
        d={`
          M50 ${10 * flameHeight}
          C30 ${30 * flameHeight}, 15 ${50 * flameHeight}, 20 ${70 * flameHeight}
          Q25 ${85 * flameHeight}, 50 ${90 * flameHeight}
          Q75 ${85 * flameHeight}, 80 ${70 * flameHeight}
          C85 ${50 * flameHeight}, 70 ${30 * flameHeight}, 50 ${10 * flameHeight}
        `}
        fill={colors.outer}
        filter="url(#glow)"
      />

      {/* Middle flame layer */}
      <motion.path
        d={`
          M50 ${18 * flameHeight}
          C35 ${35 * flameHeight}, 25 ${50 * flameHeight}, 28 ${65 * flameHeight}
          Q35 ${78 * flameHeight}, 50 ${82 * flameHeight}
          Q65 ${78 * flameHeight}, 72 ${65 * flameHeight}
          C75 ${50 * flameHeight}, 65 ${35 * flameHeight}, 50 ${18 * flameHeight}
        `}
        fill={colors.middle}
      />

      {/* Inner flame core */}
      <motion.path
        d={`
          M50 ${28 * flameHeight}
          C40 ${42 * flameHeight}, 35 ${55 * flameHeight}, 38 ${65 * flameHeight}
          Q42 ${72 * flameHeight}, 50 ${75 * flameHeight}
          Q58 ${72 * flameHeight}, 62 ${65 * flameHeight}
          C65 ${55 * flameHeight}, 60 ${42 * flameHeight}, 50 ${28 * flameHeight}
        `}
        fill={colors.inner}
      />

      {/* Face container - position based on flame height */}
      <g transform={`translate(0, ${(flameHeight - 0.7) * 15})`}>
        {/* Eyes */}
        {getEyeExpression()}
        
        {/* Mouth */}
        {getMouth()}
      </g>

      {/* Spark particles for burning and inferno */}
      {(phase === 'burning' || phase === 'inferno') && (
        <>
          {[...Array(phase === 'inferno' ? 8 : 4)].map((_, i) => (
            <motion.circle
              key={i}
              cx={30 + Math.random() * 40}
              cy={20 + Math.random() * 30}
              r={phase === 'inferno' ? 2 : 1.5}
              fill={phase === 'inferno' ? '#00E5FF' : '#FFD700'}
              animate={{
                y: [-10, -30 - Math.random() * 20],
                x: [(Math.random() - 0.5) * 20, (Math.random() - 0.5) * 40],
                opacity: [1, 0],
                scale: [1, 0.5],
              }}
              transition={{
                duration: 0.8 + Math.random() * 0.5,
                repeat: Infinity,
                delay: Math.random() * 0.5,
                ease: 'easeOut',
              }}
            />
          ))}
        </>
      )}
      
      {/* Extra flames on sides for inferno */}
      {phase === 'inferno' && (
        <>
          <motion.path
            d="M15 50 C10 40, 20 30, 25 45 C30 55, 20 60, 15 50"
            fill="#FF9100"
            animate={{ 
              d: [
                "M15 50 C10 40, 20 30, 25 45 C30 55, 20 60, 15 50",
                "M12 48 C7 38, 17 28, 22 43 C27 53, 17 58, 12 48",
                "M15 50 C10 40, 20 30, 25 45 C30 55, 20 60, 15 50"
              ]
            }}
            transition={{ duration: 0.4, repeat: Infinity }}
          />
          <motion.path
            d="M85 50 C90 40, 80 30, 75 45 C70 55, 80 60, 85 50"
            fill="#FF9100"
            animate={{ 
              d: [
                "M85 50 C90 40, 80 30, 75 45 C70 55, 80 60, 85 50",
                "M88 48 C93 38, 83 28, 78 43 C73 53, 83 58, 88 48",
                "M85 50 C90 40, 80 30, 75 45 C70 55, 80 60, 85 50"
              ]
            }}
            transition={{ duration: 0.4, repeat: Infinity, delay: 0.2 }}
          />
        </>
      )}
    </motion.svg>
  )
}

export default function Mascot({ 
  phase: propPhase, 
  size = 'md', 
  showMessage = true,
  className = ''
}: MascotProps) {
  const { isActive, getElapsedTime } = useFastingStore()
  const [currentMessage, setCurrentMessage] = useState<string>('')
  const lastPhaseRef = useRef<FlamePhase | null>(null)
  
  // Auto-determine phase based on fasting hours
  const getAutoPhase = (): FlamePhase => {
    if (propPhase) return propPhase
    
    if (!isActive) return 'resting'
    
    const elapsed = getElapsedTime()
    const hours = elapsed / (1000 * 60 * 60)
    
    if (hours >= 16) return 'inferno'      // Autophagy mode
    if (hours >= 12) return 'burning'      // Fat burn mode
    if (hours > 0) return 'warming'        // Early fasting
    
    return 'resting'
  }
  
  const currentPhase = getAutoPhase()
  const messages = FLAME_MESSAGES[currentPhase]
  
  // Update message when phase changes or every 30 seconds
  useEffect(() => {
    if (lastPhaseRef.current !== currentPhase) {
      lastPhaseRef.current = currentPhase
      setCurrentMessage(messages[Math.floor(Math.random() * messages.length)])
    }
    
    const interval = setInterval(() => {
      setCurrentMessage(messages[Math.floor(Math.random() * messages.length)])
    }, 30000)
    
    return () => clearInterval(interval)
  }, [currentPhase, messages])
  
  // Set initial message on mount
  useEffect(() => {
    if (!currentMessage) {
      setCurrentMessage(messages[Math.floor(Math.random() * messages.length)])
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  
  const sizeMap = {
    sm: 60,
    md: 100,
    lg: 150
  }

  // Phase indicator text
  const getPhaseLabel = () => {
    switch (currentPhase) {
      case 'resting': return null
      case 'warming': return 'Warming Up'
      case 'burning': return 'Fat Burn!'
      case 'inferno': return 'AUTOPHAGY!'
    }
  }

  const phaseLabel = getPhaseLabel()

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200 }}
        className="relative"
      >
        <FlameSVG phase={currentPhase} size={sizeMap[size]} />
        
        {/* Phase badge */}
        {phaseLabel && (
          <motion.div
            initial={{ scale: 0, y: 10 }}
            animate={{ scale: 1, y: 0 }}
            className={`absolute -bottom-1 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-xs font-bold whitespace-nowrap ${
              currentPhase === 'inferno' 
                ? 'bg-gradient-to-r from-cyan-400 to-yellow-400 text-slate-900'
                : currentPhase === 'burning'
                ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white'
                : 'bg-gradient-to-r from-yellow-400 to-orange-400 text-slate-900'
            }`}
          >
            {phaseLabel}
          </motion.div>
        )}
      </motion.div>
      
      {showMessage && currentMessage && (
        <motion.div
          key={currentMessage}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mt-3 px-4 py-2 rounded-2xl shadow-md text-center ${
            currentPhase === 'inferno'
              ? 'bg-gradient-to-r from-cyan-500/20 to-yellow-500/20 border border-cyan-400/30'
              : 'bg-white'
          }`}
        >
          <p className={`text-sm font-medium ${
            currentPhase === 'inferno' ? 'text-cyan-600' : 'text-slate-700'
          }`}>
            {currentMessage}
          </p>
        </motion.div>
      )}
    </div>
  )
}
