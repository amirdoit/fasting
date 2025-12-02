import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, ChevronRight, Sparkles, Target, Moon, Brain, Activity,
  Loader2, Zap, Shield
} from 'lucide-react'
import { useAppStore } from '../stores/appStore'
import { useFastingStore, PROTOCOLS, type FastingProtocol } from '../stores/fastingStore'
import { api } from '../services/api'

interface DailyCheckinProps {
  onClose: () => void
}

// Bio-Adaptive readiness types
type SleepQuality = 'poor' | 'average' | 'good'
type StressLevel = 'low' | 'medium' | 'high'
type Soreness = 'none' | 'mild' | 'severe'

interface CheckinData {
  // Bio-Adaptive readiness
  sleepQuality: SleepQuality | null
  stressLevel: StressLevel | null
  soreness: Soreness | null
  // Energy metrics
  energyLevel: number
  motivation: number
}

// Bio-Adaptive readiness options
const SLEEP_OPTIONS = [
  { id: 'poor', label: 'Poor', emoji: '😫', description: 'Restless or < 5 hours', color: 'from-red-400 to-pink-500' },
  { id: 'average', label: 'Average', emoji: '😐', description: '5-7 hours, okay quality', color: 'from-amber-400 to-orange-500' },
  { id: 'good', label: 'Good', emoji: '😊', description: '7+ hours, well rested', color: 'from-emerald-400 to-green-500' },
]

const STRESS_OPTIONS = [
  { id: 'low', label: 'Low', emoji: '😌', description: 'Calm and relaxed', color: 'from-emerald-400 to-green-500' },
  { id: 'medium', label: 'Medium', emoji: '😤', description: 'Some pressure', color: 'from-amber-400 to-orange-500' },
  { id: 'high', label: 'High', emoji: '🤯', description: 'Very stressed', color: 'from-red-400 to-pink-500' },
]

const SORENESS_OPTIONS = [
  { id: 'none', label: 'None', emoji: '💪', description: 'Feeling strong', color: 'from-emerald-400 to-green-500' },
  { id: 'mild', label: 'Mild', emoji: '🤕', description: 'A bit sore', color: 'from-amber-400 to-orange-500' },
  { id: 'severe', label: 'Severe', emoji: '😖', description: 'Very sore or injured', color: 'from-red-400 to-pink-500' },
]

// Fast type recommendations
const FAST_TYPES = {
  restorative: {
    name: 'Restorative Fast',
    protocol: '12:12' as FastingProtocol,
    message: 'Recovery mode activated. A shorter fast helps avoid cortisol spikes when your body needs rest.',
    icon: Shield,
    color: 'from-blue-400 to-cyan-500',
    bgColor: 'from-blue-50 to-cyan-50',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-700'
  },
  balanced: {
    name: 'Balanced Fast',
    protocol: '16:8' as FastingProtocol,
    message: 'Optimal balance today. This duration maximizes benefits while respecting your current state.',
    icon: Target,
    color: 'from-purple-400 to-indigo-500',
    bgColor: 'from-purple-50 to-indigo-50',
    borderColor: 'border-purple-200',
    textColor: 'text-purple-700'
  },
  challenge: {
    name: 'Challenge Fast',
    protocol: '18:6' as FastingProtocol,
    message: "You're primed for fat burning! Your body is ready to push deeper into autophagy.",
    icon: Zap,
    color: 'from-emerald-400 to-green-500',
    bgColor: 'from-emerald-50 to-green-50',
    borderColor: 'border-emerald-200',
    textColor: 'text-emerald-700'
  },
  warrior: {
    name: 'Warrior Fast',
    protocol: '20:4' as FastingProtocol,
    message: "Peak performance mode! You're in optimal condition for an extended fast.",
    icon: Sparkles,
    color: 'from-amber-400 to-orange-500',
    bgColor: 'from-amber-50 to-orange-50',
    borderColor: 'border-amber-200',
    textColor: 'text-amber-700'
  }
}

type FastType = keyof typeof FAST_TYPES

export default function DailyCheckin({ onClose }: DailyCheckinProps) {
  const { showToast } = useAppStore()
  const { setProtocol } = useFastingStore()
  
  const [step, setStep] = useState(1)
  const [checkinData, setCheckinData] = useState<CheckinData>({
    sleepQuality: null,
    stressLevel: null,
    soreness: null,
    energyLevel: 5,
    motivation: 5
  })
  const [recommendation, setRecommendation] = useState<{
    fastType: FastType
    readinessScore: number
    adjustment: 'increase' | 'decrease' | 'maintain'
  } | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // Calculate readiness score (0-100)
  const calculateReadinessScore = (): number => {
    const { sleepQuality, stressLevel, soreness, energyLevel, motivation } = checkinData
    
    let score = 50 // Base score
    
    // Sleep impacts (±20)
    if (sleepQuality === 'good') score += 20
    else if (sleepQuality === 'average') score += 5
    else if (sleepQuality === 'poor') score -= 20
    
    // Stress impacts (±15)
    if (stressLevel === 'low') score += 15
    else if (stressLevel === 'medium') score += 0
    else if (stressLevel === 'high') score -= 15
    
    // Soreness impacts (±10)
    if (soreness === 'none') score += 10
    else if (soreness === 'mild') score += 0
    else if (soreness === 'severe') score -= 15
    
    // Energy and motivation (±10 each)
    score += ((energyLevel - 5) / 5) * 10
    score += ((motivation - 5) / 5) * 10
    
    return Math.max(0, Math.min(100, Math.round(score)))
  }

  const generateRecommendation = () => {
    const { sleepQuality, stressLevel, soreness, energyLevel, motivation } = checkinData
    const readinessScore = calculateReadinessScore()
    
    let fastType: FastType
    let adjustment: 'increase' | 'decrease' | 'maintain'

    // Bio-Adaptive Logic
    const isLowRecovery = sleepQuality === 'poor' || stressLevel === 'high' || soreness === 'severe'
    const isHighPerformance = sleepQuality === 'good' && stressLevel === 'low' && soreness === 'none'
    const isVeryLow = energyLevel <= 3 || motivation <= 3

    if (isVeryLow) {
      // Override: Very low energy/motivation = restorative
      fastType = 'restorative'
      adjustment = 'decrease'
    } else if (isLowRecovery) {
      // Low recovery = restorative fast
      fastType = 'restorative'
      adjustment = 'decrease'
    } else if (isHighPerformance) {
      // High performance state
      if (energyLevel >= 8 && motivation >= 8) {
        fastType = 'warrior'
        adjustment = 'increase'
      } else if (energyLevel >= 6 && motivation >= 6) {
        fastType = 'challenge'
        adjustment = 'increase'
      } else {
        fastType = 'balanced'
        adjustment = 'maintain'
      }
    } else {
      // Middle ground - based on readiness score
      if (readinessScore >= 70) {
        fastType = 'challenge'
        adjustment = 'increase'
      } else if (readinessScore >= 50) {
        fastType = 'balanced'
        adjustment = 'maintain'
      } else {
        fastType = 'restorative'
        adjustment = 'decrease'
      }
    }

    setRecommendation({ fastType, readinessScore, adjustment })
  }

  const handleComplete = async () => {
    if (!recommendation) {
      onClose()
      return
    }
    
    setIsSaving(true)
    const fastConfig = FAST_TYPES[recommendation.fastType]
    
    try {
      // Save check-in to database via API
      const response = await api.saveCheckin({
        sleepQuality: checkinData.sleepQuality,
        stressLevel: checkinData.stressLevel,
        soreness: checkinData.soreness,
        energyLevel: checkinData.energyLevel,
        motivation: checkinData.motivation,
        readinessScore: recommendation.readinessScore,
        recommendedProtocol: fastConfig.protocol
      })
      
      if (response.success) {
        setProtocol(fastConfig.protocol)
        showToast(`${fastConfig.name}: ${fastConfig.protocol} fasting activated`, 'success')
      } else {
        console.error('Failed to save check-in:', response.error)
        setProtocol(fastConfig.protocol)
        showToast(`${fastConfig.name}: ${fastConfig.protocol} fasting activated`, 'success')
      }
    } catch (error) {
      console.error('Failed to save check-in:', error)
      setProtocol(fastConfig.protocol)
      showToast(`${fastConfig.name}: ${fastConfig.protocol} fasting activated`, 'success')
    } finally {
      setIsSaving(false)
      onClose()
    }
  }

  const renderStep = () => {
    switch (step) {
      // Step 1: Sleep Quality
      case 1:
        return (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center">
                <Moon className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-xl font-bold text-slate-800 mb-2">How did you sleep?</h2>
              <p className="text-slate-500">Sleep quality affects your fasting capacity</p>
            </div>

            <div className="space-y-3">
              {SLEEP_OPTIONS.map(option => (
                <motion.button
                  key={option.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setCheckinData(prev => ({ ...prev, sleepQuality: option.id as SleepQuality }))
                    setStep(2)
                  }}
                  className={`w-full p-4 rounded-2xl border-2 transition-all flex items-center gap-4 ${
                    checkinData.sleepQuality === option.id
                      ? 'border-primary-400 bg-primary-50'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${option.color} flex items-center justify-center text-2xl`}>
                    {option.emoji}
                  </div>
                  <div className="text-left flex-1">
                    <div className="font-semibold text-slate-800">{option.label}</div>
                    <div className="text-sm text-slate-500">{option.description}</div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400" />
                </motion.button>
              ))}
            </div>
          </motion.div>
        )

      // Step 2: Stress Level
      case 2:
        return (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-rose-400 to-red-500 flex items-center justify-center">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-xl font-bold text-slate-800 mb-2">What's your stress level?</h2>
              <p className="text-slate-500">High stress + long fasts = cortisol spikes</p>
            </div>

            <div className="space-y-3">
              {STRESS_OPTIONS.map(option => (
                <motion.button
                  key={option.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setCheckinData(prev => ({ ...prev, stressLevel: option.id as StressLevel }))
                    setStep(3)
                  }}
                  className={`w-full p-4 rounded-2xl border-2 transition-all flex items-center gap-4 ${
                    checkinData.stressLevel === option.id
                      ? 'border-primary-400 bg-primary-50'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${option.color} flex items-center justify-center text-2xl`}>
                    {option.emoji}
                  </div>
                  <div className="text-left flex-1">
                    <div className="font-semibold text-slate-800">{option.label}</div>
                    <div className="text-sm text-slate-500">{option.description}</div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400" />
                </motion.button>
              ))}
            </div>
          </motion.div>
        )

      // Step 3: Physical Soreness
      case 3:
        return (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center">
                <Activity className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-xl font-bold text-slate-800 mb-2">Any physical soreness?</h2>
              <p className="text-slate-500">Your body needs fuel to recover</p>
            </div>

            <div className="space-y-3">
              {SORENESS_OPTIONS.map(option => (
                <motion.button
                  key={option.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setCheckinData(prev => ({ ...prev, soreness: option.id as Soreness }))
                    setStep(4)
                  }}
                  className={`w-full p-4 rounded-2xl border-2 transition-all flex items-center gap-4 ${
                    checkinData.soreness === option.id
                      ? 'border-primary-400 bg-primary-50'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${option.color} flex items-center justify-center text-2xl`}>
                    {option.emoji}
                  </div>
                  <div className="text-left flex-1">
                    <div className="font-semibold text-slate-800">{option.label}</div>
                    <div className="text-sm text-slate-500">{option.description}</div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400" />
                </motion.button>
              ))}
            </div>
          </motion.div>
        )

      // Step 4: Energy & Motivation
      case 4:
        return (
          <motion.div
            key="step4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-xl font-bold text-slate-800 mb-2">Energy & Motivation</h2>
              <p className="text-slate-500">How are you feeling right now?</p>
            </div>

            <div className="space-y-6">
              {/* Energy Level */}
              <div className="bg-slate-50 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">⚡</span>
                    <span className="font-medium text-slate-700">Energy Level</span>
                  </div>
                  <span className={`text-lg font-bold ${
                    checkinData.energyLevel >= 7 ? 'text-emerald-500' :
                    checkinData.energyLevel >= 4 ? 'text-amber-500' : 'text-red-500'
                  }`}>{checkinData.energyLevel}/10</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={checkinData.energyLevel}
                  onChange={e => setCheckinData(prev => ({ ...prev, energyLevel: parseInt(e.target.value) }))}
                  className="w-full h-3 rounded-full appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, 
                      #ef4444 0%, #f59e0b 40%, #22c55e 100%)`
                  }}
                />
                <div className="flex justify-between text-xs text-slate-400 mt-2">
                  <span>Exhausted</span>
                  <span>Energized</span>
                </div>
              </div>

              {/* Motivation */}
              <div className="bg-slate-50 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🔥</span>
                    <span className="font-medium text-slate-700">Motivation</span>
                  </div>
                  <span className={`text-lg font-bold ${
                    checkinData.motivation >= 7 ? 'text-emerald-500' :
                    checkinData.motivation >= 4 ? 'text-amber-500' : 'text-red-500'
                  }`}>{checkinData.motivation}/10</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={checkinData.motivation}
                  onChange={e => setCheckinData(prev => ({ ...prev, motivation: parseInt(e.target.value) }))}
                  className="w-full h-3 rounded-full appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, 
                      #ef4444 0%, #f59e0b 40%, #22c55e 100%)`
                  }}
                />
                <div className="flex justify-between text-xs text-slate-400 mt-2">
                  <span>Not motivated</span>
                  <span>Highly motivated</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                generateRecommendation()
                setStep(5)
              }}
              className="w-full py-4 bg-gradient-to-r from-primary-500 to-accent-500 text-white rounded-2xl font-bold flex items-center justify-center gap-2"
            >
              <Sparkles className="w-5 h-5" />
              Get My Personalized Plan
            </button>
          </motion.div>
        )

      // Step 5: Recommendation
      case 5:
        const fastConfig = recommendation ? FAST_TYPES[recommendation.fastType] : null
        const FastIcon = fastConfig?.icon || Target
        
        return (
          <motion.div
            key="step5"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6"
          >
            {recommendation && fastConfig && (
              <>
                {/* Readiness Score */}
            <div className="text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200 }}
                    className="relative w-28 h-28 mx-auto mb-4"
                  >
                    <svg className="w-full h-full transform -rotate-90">
                      <circle
                        cx="56"
                        cy="56"
                        r="48"
                        fill="none"
                        stroke="#e2e8f0"
                        strokeWidth="8"
                      />
                      <motion.circle
                        cx="56"
                        cy="56"
                        r="48"
                        fill="none"
                        stroke={recommendation.readinessScore >= 70 ? '#22c55e' : 
                               recommendation.readinessScore >= 50 ? '#f59e0b' : '#ef4444'}
                        strokeWidth="8"
                        strokeLinecap="round"
                        initial={{ strokeDasharray: '0 302' }}
                        animate={{ 
                          strokeDasharray: `${(recommendation.readinessScore / 100) * 302} 302` 
                        }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-3xl font-bold text-slate-800">{recommendation.readinessScore}</span>
                      <span className="text-xs text-slate-500">Readiness</span>
                    </div>
              </motion.div>
                  <h2 className="text-xl font-bold text-slate-800">Your Bio-Adaptive Plan</h2>
            </div>

                {/* Recommendation Card */}
                <motion.div 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className={`p-6 rounded-2xl bg-gradient-to-br ${fastConfig.bgColor} border ${fastConfig.borderColor}`}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${fastConfig.color} flex items-center justify-center`}>
                      <FastIcon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className={`font-bold ${fastConfig.textColor}`}>{fastConfig.name}</div>
                      <div className="text-sm text-slate-500">
                      {recommendation.adjustment === 'increase' ? 'Challenge Mode' :
                         recommendation.adjustment === 'decrease' ? 'Recovery Mode' : 'Balanced Mode'}
                      </div>
                    </div>
                  </div>

                  <div className="text-center mb-4 py-4 bg-white/50 rounded-xl">
                    <div className="text-4xl font-bold text-slate-800 mb-1">
                      {fastConfig.protocol}
                    </div>
                    <div className="text-slate-500">
                      {PROTOCOLS[fastConfig.protocol].name} • {PROTOCOLS[fastConfig.protocol].fastHours}h fast
                    </div>
                  </div>

                  <p className="text-slate-600 text-center text-sm">{fastConfig.message}</p>
                </motion.div>

                {/* Readiness Factors */}
                <div className="bg-slate-50 rounded-2xl p-4">
                  <h3 className="font-semibold text-slate-700 mb-3">Your Readiness Factors</h3>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className={`p-2 rounded-xl ${
                      checkinData.sleepQuality === 'good' ? 'bg-emerald-100' :
                      checkinData.sleepQuality === 'average' ? 'bg-amber-100' : 'bg-red-100'
                    }`}>
                      <div className="text-lg mb-1">
                        {SLEEP_OPTIONS.find(o => o.id === checkinData.sleepQuality)?.emoji}
                      </div>
                      <div className="text-xs text-slate-600">Sleep</div>
                    </div>
                    <div className={`p-2 rounded-xl ${
                      checkinData.stressLevel === 'low' ? 'bg-emerald-100' :
                      checkinData.stressLevel === 'medium' ? 'bg-amber-100' : 'bg-red-100'
                    }`}>
                      <div className="text-lg mb-1">
                        {STRESS_OPTIONS.find(o => o.id === checkinData.stressLevel)?.emoji}
                      </div>
                      <div className="text-xs text-slate-600">Stress</div>
                    </div>
                    <div className={`p-2 rounded-xl ${
                      checkinData.soreness === 'none' ? 'bg-emerald-100' :
                      checkinData.soreness === 'mild' ? 'bg-amber-100' : 'bg-red-100'
                    }`}>
                      <div className="text-lg mb-1">
                        {SORENESS_OPTIONS.find(o => o.id === checkinData.soreness)?.emoji}
                      </div>
                      <div className="text-xs text-slate-600">Body</div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={onClose}
                    disabled={isSaving}
                    className="flex-1 py-4 bg-slate-100 text-slate-700 rounded-2xl font-medium disabled:opacity-50"
                  >
                    Skip
                  </button>
                  <button
                    onClick={handleComplete}
                    disabled={isSaving}
                    className={`flex-1 py-4 bg-gradient-to-r ${fastConfig.color} text-white rounded-2xl font-bold flex items-center justify-center gap-2 disabled:opacity-50`}
                  >
                    {isSaving ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                    <Sparkles className="w-5 h-5" />
                    )}
                    {isSaving ? 'Activating...' : 'Start Fast'}
                  </button>
                </div>
              </>
            )}
          </motion.div>
        )

      default:
        return null
    }
  }

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
        className="bg-white rounded-3xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto relative"
        onClick={e => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-xl z-10"
        >
          <X className="w-5 h-5 text-slate-400" />
        </button>

        {/* Progress indicator */}
        {step < 5 && (
          <div className="flex gap-2 mb-6">
            {[1, 2, 3, 4].map(s => (
              <div
                key={s}
                className={`flex-1 h-1.5 rounded-full transition-colors ${
                  s <= step ? 'bg-primary-500' : 'bg-slate-200'
                }`}
              />
            ))}
          </div>
        )}

        {/* Step Content */}
        <AnimatePresence mode="wait">
          {renderStep()}
        </AnimatePresence>

        {/* Back button */}
        {step > 1 && step < 5 && (
          <button
            onClick={() => setStep(step - 1)}
            className="mt-4 text-sm text-slate-500 hover:text-slate-700"
          >
            ← Back
          </button>
        )}
      </motion.div>
    </motion.div>
  )
}
