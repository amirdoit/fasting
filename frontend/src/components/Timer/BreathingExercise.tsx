import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Play, Pause } from 'lucide-react'

interface BreathingExerciseProps {
  onClose: () => void
}

type BreathingType = '4-7-8' | 'box' | 'calm'

const BREATHING_PATTERNS: Record<BreathingType, {
  name: string
  description: string
  inhale: number
  hold1: number
  exhale: number
  hold2: number
}> = {
  '4-7-8': {
    name: '4-7-8 Relaxing',
    description: 'Reduces anxiety and helps you sleep',
    inhale: 4,
    hold1: 7,
    exhale: 8,
    hold2: 0
  },
  'box': {
    name: 'Box Breathing',
    description: 'Navy SEAL technique for focus',
    inhale: 4,
    hold1: 4,
    exhale: 4,
    hold2: 4
  },
  'calm': {
    name: 'Calming Breath',
    description: 'Simple pattern for hunger pangs',
    inhale: 4,
    hold1: 2,
    exhale: 6,
    hold2: 0
  }
}

export default function BreathingExercise({ onClose }: BreathingExerciseProps) {
  const [selectedPattern, setSelectedPattern] = useState<BreathingType>('calm')
  const [isPlaying, setIsPlaying] = useState(false)
  const [phase, setPhase] = useState<'inhale' | 'hold1' | 'exhale' | 'hold2'>('inhale')
  const [countdown, setCountdown] = useState(0)
  const [cycles, setCycles] = useState(0)

  const pattern = BREATHING_PATTERNS[selectedPattern]

  useEffect(() => {
    if (!isPlaying) return

    const phaseDurations = {
      inhale: pattern.inhale,
      hold1: pattern.hold1,
      exhale: pattern.exhale,
      hold2: pattern.hold2
    }

    const currentDuration = phaseDurations[phase]
    setCountdown(currentDuration)

    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          // Move to next phase
          const phases: typeof phase[] = ['inhale', 'hold1', 'exhale', 'hold2']
          const currentIndex = phases.indexOf(phase)
          let nextIndex = (currentIndex + 1) % 4
          
          // Skip hold2 if duration is 0
          if (phases[nextIndex] === 'hold2' && pattern.hold2 === 0) {
            nextIndex = 0
            setCycles(c => c + 1)
          }
          if (phases[nextIndex] === 'inhale') {
            setCycles(c => c + 1)
          }
          
          setPhase(phases[nextIndex])
          return phaseDurations[phases[nextIndex]]
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isPlaying, phase, pattern])

  const getPhaseText = () => {
    switch (phase) {
      case 'inhale': return 'Breathe In'
      case 'hold1': return 'Hold'
      case 'exhale': return 'Breathe Out'
      case 'hold2': return 'Hold'
    }
  }

  const getCircleScale = () => {
    if (!isPlaying) return 1
    switch (phase) {
      case 'inhale': return 1.5
      case 'hold1': return 1.5
      case 'exhale': return 1
      case 'hold2': return 1
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"
        style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center z-10 transition-colors"
        >
          <X className="w-6 h-6 text-white" />
        </button>

        <div className="h-full flex flex-col items-center justify-center px-6">
          {/* Pattern selector */}
          {!isPlaying && (
            <div className="flex flex-wrap justify-center gap-2 mb-12">
              {(Object.entries(BREATHING_PATTERNS) as [BreathingType, typeof BREATHING_PATTERNS['4-7-8']][]).map(([key, p]) => (
                <button
                  key={key}
                  onClick={() => setSelectedPattern(key)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    selectedPattern === key
                      ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30'
                      : 'bg-white/10 text-white/70 hover:bg-white/20'
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>
          )}

          {/* Breathing circle */}
          <div className="relative mb-8">
            <motion.div
              animate={{ scale: getCircleScale() }}
              transition={{ duration: isPlaying ? (phase === 'inhale' ? pattern.inhale : pattern.exhale) : 0.3, ease: 'easeInOut' }}
              className="w-48 h-48 rounded-full bg-gradient-to-br from-primary-400/40 to-primary-600/20 flex items-center justify-center backdrop-blur-sm"
            >
              <motion.div
                animate={{ scale: getCircleScale() * 0.7 }}
                transition={{ duration: isPlaying ? (phase === 'inhale' ? pattern.inhale : pattern.exhale) : 0.3, ease: 'easeInOut' }}
                className="w-32 h-32 rounded-full bg-gradient-to-br from-primary-400/60 to-primary-500/30 flex items-center justify-center"
              >
                <div className="text-center text-white">
                  {isPlaying ? (
                    <>
                      <div className="text-5xl font-bold">{countdown}</div>
                      <div className="text-sm text-white/70 mt-1">{getPhaseText()}</div>
                    </>
                  ) : (
                    <div className="text-white/60 font-medium">Ready</div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          </div>

          {/* Info */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">{pattern.name}</h2>
            <p className="text-white/60">{pattern.description}</p>
            {isPlaying && (
              <p className="text-sm text-white/40 mt-2">Cycles completed: {cycles}</p>
            )}
          </div>

          {/* Controls */}
          <button
            onClick={() => {
              setIsPlaying(!isPlaying)
              if (!isPlaying) {
                setPhase('inhale')
                setCycles(0)
              }
            }}
            className="w-20 h-20 rounded-full bg-gradient-to-r from-primary-400 to-primary-500 flex items-center justify-center shadow-xl shadow-primary-500/40 hover:scale-105 transition-transform"
          >
            {isPlaying ? (
              <Pause className="w-10 h-10 text-white" />
            ) : (
              <Play className="w-10 h-10 text-white ml-1" />
            )}
          </button>

          {/* Pattern info */}
          {!isPlaying && (
            <div className="mt-8 flex items-center gap-4 text-sm text-white/50">
              <span className="px-3 py-1 bg-white/10 rounded-lg">In: {pattern.inhale}s</span>
              {pattern.hold1 > 0 && <span className="px-3 py-1 bg-white/10 rounded-lg">Hold: {pattern.hold1}s</span>}
              <span className="px-3 py-1 bg-white/10 rounded-lg">Out: {pattern.exhale}s</span>
              {pattern.hold2 > 0 && <span className="px-3 py-1 bg-white/10 rounded-lg">Hold: {pattern.hold2}s</span>}
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

