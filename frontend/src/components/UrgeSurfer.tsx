import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, Waves, Heart, Timer, Check, AlertTriangle, Wind,
  Sparkles, ChevronRight
} from 'lucide-react'
import { useAppStore } from '../stores/appStore'
import { useFastingStore } from '../stores/fastingStore'
import { api } from '../services/api'

interface UrgeSurferProps {
  onClose: () => void
  onConfirmEndFast?: () => void
}

type Phase = 'initial' | 'breathing' | 'education' | 'decision'

const BREATHING_DURATION = 120 // 2 minutes in seconds

const GHRELIN_FACTS = [
  "Ghrelin, the 'hunger hormone', spikes in waves that typically last only 15-20 minutes.",
  "Your body releases ghrelin at times when you usually eat - it's a habit, not true hunger.",
  "After 2-3 days of fasting, ghrelin levels actually DECREASE significantly.",
  "Drinking water can help reduce ghrelin spikes temporarily.",
  "The urge you're feeling right now will pass. Your body is adapting.",
  "Ghrelin peaks are strongest in the morning and decrease throughout the day.",
  "True hunger builds slowly. Sudden hunger is usually just a ghrelin wave.",
]

const MOTIVATION_QUOTES = [
  "You didn't come this far to only come this far.",
  "The discomfort you feel now is the fat leaving your body.",
  "Every minute of fasting is a minute of healing.",
  "Your future self will thank you for staying strong.",
  "This moment of weakness is temporary. Your strength is permanent.",
]

export default function UrgeSurfer({ onClose, onConfirmEndFast }: UrgeSurferProps) {
  const { showToast } = useAppStore()
  const { getElapsedTime } = useFastingStore()
  
  const [phase, setPhase] = useState<Phase>('initial')
  const [timeRemaining, setTimeRemaining] = useState(BREATHING_DURATION)
  const [breathPhase, setBreathPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale')
  const [breathCount, setBreathCount] = useState(4)
  const [cycleCount, setCycleCount] = useState(0)
  const [currentFact, setCurrentFact] = useState(0)
  const [urgesSurfed, setUrgesSurfed] = useState(0)

  // Load urges surfed count
  useEffect(() => {
    const saved = localStorage.getItem('fasttrack_urges_surfed')
    if (saved) {
      setUrgesSurfed(parseInt(saved) || 0)
    }
  }, [])

  // Breathing timer
  useEffect(() => {
    if (phase !== 'breathing') return

    const breathTimer = setInterval(() => {
      setBreathCount(prev => {
        if (prev <= 1) {
          // Move to next phase
          if (breathPhase === 'inhale') {
            setBreathPhase('hold')
            return 7 // Hold for 7 seconds
          } else if (breathPhase === 'hold') {
            setBreathPhase('exhale')
            return 8 // Exhale for 8 seconds
          } else {
            setBreathPhase('inhale')
            setCycleCount(c => c + 1)
            return 4 // Inhale for 4 seconds
          }
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(breathTimer)
  }, [phase, breathPhase])

  // Main countdown timer
  useEffect(() => {
    if (phase !== 'breathing') return

    const mainTimer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          setPhase('education')
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(mainTimer)
  }, [phase])

  // Rotate facts during breathing
  useEffect(() => {
    if (phase !== 'breathing') return

    const factTimer = setInterval(() => {
      setCurrentFact(prev => (prev + 1) % GHRELIN_FACTS.length)
    }, 10000) // Change fact every 10 seconds

    return () => clearInterval(factTimer)
  }, [phase])

  const handleStartBreathing = () => {
    setPhase('breathing')
  }

  const handleContinueFasting = async () => {
    // Record successful urge surf
    const newCount = urgesSurfed + 1
    setUrgesSurfed(newCount)
    localStorage.setItem('fasttrack_urges_surfed', newCount.toString())
    
    // Award XP for surfing urge (optional - can be integrated with backend)
    try {
      await api.awardPoints(20, 'Surfed hunger urge')
    } catch (e) {
      // Silently fail - points are a bonus
    }
    
    showToast('Amazing! You surfed that urge! 🌊 +20 XP', 'success')
    onClose()
  }

  const handleEndFast = () => {
    setPhase('decision')
  }

  const handleConfirmEnd = () => {
    if (onConfirmEndFast) {
      onConfirmEndFast()
    }
    onClose()
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getElapsedHours = () => {
    const elapsed = getElapsedTime()
    return Math.floor(elapsed / (1000 * 60 * 60))
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-gradient-to-b from-indigo-900 to-slate-900 z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 max-w-md w-full text-white"
      >
        <AnimatePresence mode="wait">
          {/* Initial Phase */}
          {phase === 'initial' && (
            <motion.div
              key="initial"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center space-y-6"
            >
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                <Waves className="w-16 h-16 mx-auto text-cyan-400" />
              </motion.div>
              
              <div>
                <h2 className="text-2xl font-bold mb-2">Urge Surfer</h2>
                <p className="text-white/70">
                  Feeling the urge to break your fast after {getElapsedHours()} hours?
                </p>
              </div>

              <div className="bg-white/10 rounded-2xl p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-white/80 text-left">
                    Hunger comes in waves. This urge will pass in about 15-20 minutes. 
                    Let's ride it out together with a 2-minute breathing exercise.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleStartBreathing}
                  className="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-2xl font-bold text-lg flex items-center justify-center gap-2"
                >
                  <Wind className="w-5 h-5" />
                  Start 2-Min Breathing
                </button>
                <button
                  onClick={onClose}
                  className="w-full py-3 bg-white/10 rounded-xl text-white/70 hover:bg-white/20 transition-colors"
                >
                  I'm okay, just checking
                </button>
              </div>

              {urgesSurfed > 0 && (
                <p className="text-sm text-cyan-300">
                  🌊 You've successfully surfed {urgesSurfed} urge{urgesSurfed > 1 ? 's' : ''} before!
                </p>
              )}
            </motion.div>
          )}

          {/* Breathing Phase */}
          {phase === 'breathing' && (
            <motion.div
              key="breathing"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center space-y-6"
            >
              {/* Timer */}
              <div className="flex items-center justify-center gap-2 text-white/60">
                <Timer className="w-4 h-4" />
                <span>{formatTime(timeRemaining)} remaining</span>
              </div>

              {/* Breathing Circle */}
              <div className="relative w-48 h-48 mx-auto">
                <motion.div
                  className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 opacity-30"
                  animate={{
                    scale: breathPhase === 'inhale' ? [0.6, 1] : 
                           breathPhase === 'hold' ? 1 : [1, 0.6]
                  }}
                  transition={{
                    duration: breathPhase === 'inhale' ? 4 : 
                              breathPhase === 'hold' ? 7 : 8,
                    ease: 'easeInOut'
                  }}
                />
                <motion.div
                  className="absolute inset-4 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center"
                  animate={{
                    scale: breathPhase === 'inhale' ? [0.7, 1] : 
                           breathPhase === 'hold' ? 1 : [1, 0.7]
                  }}
                  transition={{
                    duration: breathPhase === 'inhale' ? 4 : 
                              breathPhase === 'hold' ? 7 : 8,
                    ease: 'easeInOut'
                  }}
                >
                  <div className="text-center">
                    <p className="text-3xl font-bold">{breathCount}</p>
                    <p className="text-sm uppercase tracking-wider opacity-80">
                      {breathPhase === 'inhale' ? 'Breathe In' :
                       breathPhase === 'hold' ? 'Hold' : 'Breathe Out'}
                    </p>
                  </div>
                </motion.div>
              </div>

              {/* Cycle Counter */}
              <div className="flex justify-center gap-1">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      i < cycleCount ? 'bg-cyan-400' : 'bg-white/20'
                    }`}
                  />
                ))}
              </div>

              {/* Ghrelin Fact */}
              <motion.div
                key={currentFact}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-white/10 rounded-2xl p-4"
              >
                <p className="text-sm text-white/80 italic">
                  "{GHRELIN_FACTS[currentFact]}"
                </p>
              </motion.div>

              {/* Skip Option (disabled until 30 seconds) */}
              {timeRemaining < 90 && (
                <button
                  onClick={() => setPhase('education')}
                  className="text-sm text-white/40 hover:text-white/60 transition-colors"
                >
                  I'm feeling better, skip ahead →
                </button>
              )}
            </motion.div>
          )}

          {/* Education / Decision Phase */}
          {phase === 'education' && (
            <motion.div
              key="education"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center space-y-6"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200 }}
              >
                <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center">
                  <Check className="w-10 h-10 text-white" />
                </div>
              </motion.div>

              <div>
                <h2 className="text-2xl font-bold mb-2">Great Job!</h2>
                <p className="text-white/70">
                  You completed the breathing exercise. How do you feel now?
                </p>
              </div>

              {/* Motivation Quote */}
              <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-2xl p-4 border border-purple-500/30">
                <Sparkles className="w-5 h-5 text-purple-300 mx-auto mb-2" />
                <p className="text-sm text-white/90 italic">
                  "{MOTIVATION_QUOTES[Math.floor(Math.random() * MOTIVATION_QUOTES.length)]}"
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleContinueFasting}
                  className="w-full py-4 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-2xl font-bold text-lg flex items-center justify-center gap-2"
                >
                  <Heart className="w-5 h-5" />
                  I'll Keep Fasting! 🌊
                </button>
                <button
                  onClick={handleEndFast}
                  className="w-full py-3 bg-white/10 rounded-xl text-white/70 hover:bg-white/20 transition-colors"
                >
                  I still want to end my fast
                </button>
              </div>

              <p className="text-xs text-white/40">
                Most people feel better after the breathing exercise!
              </p>
            </motion.div>
          )}

          {/* Final Decision Phase */}
          {phase === 'decision' && (
            <motion.div
              key="decision"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center space-y-6"
            >
              <div className="w-16 h-16 mx-auto rounded-full bg-amber-500/20 flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-amber-400" />
              </div>

              <div>
                <h2 className="text-xl font-bold mb-2">Are you sure?</h2>
                <p className="text-white/70">
                  You've fasted for {getElapsedHours()} hours. That's still an achievement!
                </p>
              </div>

              <div className="bg-white/10 rounded-2xl p-4">
                <p className="text-sm text-white/80">
                  Remember: It's okay to end your fast if you truly need to. 
                  Listen to your body, but also recognize the difference between 
                  genuine hunger and a passing urge.
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleContinueFasting}
                  className="w-full py-4 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-2xl font-bold flex items-center justify-center gap-2"
                >
                  <ChevronRight className="w-5 h-5" />
                  Give me 10 more minutes
                </button>
                <button
                  onClick={handleConfirmEnd}
                  className="w-full py-3 bg-red-500/20 border border-red-500/50 rounded-xl text-red-300 hover:bg-red-500/30 transition-colors"
                >
                  End Fast Now
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Close button (always visible) */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-xl transition-colors"
        >
          <X className="w-5 h-5 text-white/60" />
        </button>
      </motion.div>
    </motion.div>
  )
}

