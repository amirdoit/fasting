import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, Timer, Droplets, Trophy, TrendingUp, Sparkles, User, Scale, Ruler, Calendar, Brain, Camera, UtensilsCrossed, Snowflake, Moon } from 'lucide-react'
import { useFastingStore, PROTOCOLS, type FastingProtocol } from '../stores/fastingStore'
import { useAppStore } from '../stores/appStore'
import { api } from '../services/api'

interface OnboardingProps {
  onComplete: () => void
}

const slides = [
  {
    icon: Sparkles,
    title: 'Welcome to FastTrack Elite',
    description: 'The most powerful intermittent fasting app with ALL premium features completely free.',
    gradient: 'from-primary-400 to-primary-500',
    bgGradient: 'from-primary-50 to-white',
  },
  {
    icon: Timer,
    title: 'Smart Fasting Timer',
    description: 'Track your fasts with beautiful animations, fasting zones, and real-time body state indicators.',
    gradient: 'from-secondary-400 to-secondary-500',
    bgGradient: 'from-secondary-50 to-white',
  },
  {
    icon: Droplets,
    title: 'Complete Health Tracking',
    description: 'Log weight, hydration, mood, energy, meals, and see how they correlate with your fasting.',
    gradient: 'from-success-400 to-success-500',
    bgGradient: 'from-success-50 to-white',
  },
  {
    icon: Trophy,
    title: 'Achievements & Challenges',
    description: 'Earn badges, maintain streaks, join challenges, and compete with friends.',
    gradient: 'from-warning-400 to-warning-500',
    bgGradient: 'from-warning-50 to-white',
  },
  {
    icon: TrendingUp,
    title: 'Powerful Analytics',
    description: 'See your progress with beautiful charts, insights, and personalized recommendations.',
    gradient: 'from-accent-400 to-accent-500',
    bgGradient: 'from-accent-50 to-white',
  },
]

// Premium features to showcase
const premiumFeatures = [
  { icon: Brain, label: 'Brain Gym', color: 'from-purple-500 to-indigo-600' },
  { icon: Camera, label: 'AI Food Scanner', color: 'from-emerald-500 to-teal-600' },
  { icon: UtensilsCrossed, label: 'Healthy Recipes', color: 'from-orange-500 to-red-500' },
  { icon: Snowflake, label: 'Streak Freezes', color: 'from-cyan-500 to-blue-600' },
  { icon: Moon, label: 'Cycle Sync', color: 'from-pink-500 to-rose-500' },
  { icon: Trophy, label: 'Weekly Leagues', color: 'from-amber-500 to-orange-500' },
]

const goals = [
  { id: 'weight_loss', label: 'Lose Weight', icon: '⚖️' },
  { id: 'health', label: 'Improve Health', icon: '❤️' },
  { id: 'energy', label: 'More Energy', icon: '⚡' },
  { id: 'longevity', label: 'Longevity', icon: '🌱' },
  { id: 'mental_clarity', label: 'Mental Clarity', icon: '🧠' },
  { id: 'autophagy', label: 'Autophagy', icon: '🔄' },
]

const experienceLevels = [
  { id: 'beginner', label: 'New to Fasting', description: 'I\'ve never tried intermittent fasting', icon: '🌱' },
  { id: 'intermediate', label: 'Some Experience', description: 'I\'ve tried fasting a few times', icon: '🌿' },
  { id: 'advanced', label: 'Experienced Faster', description: 'I fast regularly', icon: '🌳' },
]

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(0)
  const [selectedGoals, setSelectedGoals] = useState<string[]>([])
  const [selectedProtocol, setSelectedProtocol] = useState<FastingProtocol>('16:8')
  const [experience, setExperience] = useState<string>('beginner')
  const [isSaving, setIsSaving] = useState(false)
  
  // User profile data
  const [userData, setUserData] = useState({
    gender: '' as '' | 'male' | 'female' | 'other',
    age: '',
    weight: '',
    weightUnit: 'kg' as 'kg' | 'lbs',
    height: '',
    heightUnit: 'cm' as 'cm' | 'ft',
    targetWeight: '',
  })
  
  const { setProtocol } = useFastingStore()
  const { setHydrationGoal, showToast } = useAppStore()

  // Steps: slides (5) + premium features (1) + goals (1) + experience (1) + profile (1) + protocol (1) = 10
  const totalSteps = slides.length + 5

  const handleNext = async () => {
    if (step < totalSteps - 1) {
      setStep(step + 1)
    } else {
      // Save all data to backend
      setIsSaving(true)
      try {
        // Save onboarding data
        const response = await api.saveOnboarding({
          goals: selectedGoals,
          experience,
          protocol: selectedProtocol,
          gender: userData.gender,
          age: userData.age ? parseInt(userData.age) : undefined,
          weight: userData.weight ? parseFloat(userData.weight) : undefined,
          weightUnit: userData.weightUnit,
          height: userData.height ? parseFloat(userData.height) : undefined,
          heightUnit: userData.heightUnit,
          targetWeight: userData.targetWeight ? parseFloat(userData.targetWeight) : undefined,
        })
        
        if (response.success) {
          // Set local state
          setProtocol(selectedProtocol)
          setHydrationGoal(userData.weightUnit === 'kg' 
            ? Math.round((parseFloat(userData.weight) || 70) * 35) // 35ml per kg
            : Math.round((parseFloat(userData.weight) || 154) * 0.5 * 29.5735) // 0.5 oz per lb
          )
          
          showToast('Welcome to FastTrack Elite! 🎉', 'success')
          onComplete()
        } else {
          showToast('Failed to save settings. Please try again.', 'error')
        }
      } catch (error) {
        console.error('Onboarding save error:', error)
        // Still complete onboarding even if API fails
        setProtocol(selectedProtocol)
        setHydrationGoal(2500)
        onComplete()
      } finally {
        setIsSaving(false)
      }
    }
  }

  const toggleGoal = (goalId: string) => {
    setSelectedGoals(prev => 
      prev.includes(goalId) 
        ? prev.filter(g => g !== goalId)
        : [...prev, goalId]
    )
  }

  const updateUserData = (field: keyof typeof userData, value: string) => {
    setUserData(prev => ({ ...prev, [field]: value }))
  }

  const renderSlide = () => {
    // Intro slides
    if (step < slides.length) {
      const slide = slides[step]
      const Icon = slide.icon
      
      return (
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          className="flex flex-col items-center text-center px-8"
        >
          <div className={`w-24 h-24 rounded-3xl bg-gradient-to-br ${slide.gradient} flex items-center justify-center mb-8 shadow-lg`}>
            <Icon className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-4">{slide.title}</h1>
          <p className="text-slate-500 text-lg">{slide.description}</p>
        </motion.div>
      )
    }
    
    // Premium features showcase
    if (step === slides.length) {
      return (
        <motion.div
          key="premium"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          className="px-6"
        >
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-500 to-accent-500 text-white rounded-full text-sm font-bold mb-4">
              <Sparkles className="w-4 h-4" />
              ALL FEATURES FREE
            </div>
            <h1 className="text-2xl font-bold text-slate-800 mb-2">Premium Features Included</h1>
            <p className="text-slate-500">Everything you need, no subscription required</p>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            {premiumFeatures.map((feature, index) => (
              <motion.div
                key={feature.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-3 shadow-lg`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <span className="font-medium text-slate-700 text-sm">{feature.label}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )
    }
    
    // Goals selection
    if (step === slides.length + 1) {
      return (
        <motion.div
          key="goals"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          className="px-6"
        >
          <h1 className="text-2xl font-bold text-slate-800 mb-2 text-center">What are your goals?</h1>
          <p className="text-slate-500 text-center mb-8">Select all that apply</p>
          
          <div className="grid grid-cols-2 gap-3">
            {goals.map(goal => (
              <button
                key={goal.id}
                onClick={() => toggleGoal(goal.id)}
                className={`p-4 rounded-2xl border-2 transition-all ${
                  selectedGoals.includes(goal.id)
                    ? 'border-primary-400 bg-primary-50'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <span className="text-2xl mb-2 block">{goal.icon}</span>
                <span className="font-medium text-slate-700">{goal.label}</span>
              </button>
            ))}
          </div>
        </motion.div>
      )
    }
    
    // Experience level
    if (step === slides.length + 2) {
      return (
        <motion.div
          key="experience"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          className="px-6"
        >
          <h1 className="text-2xl font-bold text-slate-800 mb-2 text-center">Your fasting experience</h1>
          <p className="text-slate-500 text-center mb-8">This helps us personalize your journey</p>
          
          <div className="space-y-3">
            {experienceLevels.map(level => (
              <button
                key={level.id}
                onClick={() => setExperience(level.id)}
                className={`w-full p-4 rounded-2xl border-2 text-left transition-all ${
                  experience === level.id
                    ? 'border-primary-400 bg-primary-50'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-4">
                  <span className="text-3xl">{level.icon}</span>
                  <div>
                    <div className="font-bold text-slate-800">{level.label}</div>
                    <div className="text-sm text-slate-500">{level.description}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </motion.div>
      )
    }
    
    // User profile data
    if (step === slides.length + 3) {
      return (
        <motion.div
          key="profile"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          className="px-6"
        >
          <h1 className="text-2xl font-bold text-slate-800 mb-2 text-center">Tell us about yourself</h1>
          <p className="text-slate-500 text-center mb-6">This helps track your progress (optional)</p>
          
          <div className="space-y-4">
            {/* Gender */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <User className="w-4 h-4 inline mr-2" />
                Gender
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['male', 'female', 'other'] as const).map(g => (
                  <button
                    key={g}
                    onClick={() => updateUserData('gender', g)}
                    className={`py-2 px-4 rounded-xl border-2 text-sm font-medium transition-all ${
                      userData.gender === g
                        ? 'border-primary-400 bg-primary-50 text-primary-600'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {g.charAt(0).toUpperCase() + g.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Age */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-2" />
                Age
              </label>
              <input
                type="number"
                value={userData.age}
                onChange={(e) => updateUserData('age', e.target.value)}
                placeholder="Enter your age"
                className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-primary-400 focus:outline-none transition-colors"
              />
            </div>
            
            {/* Weight */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <Scale className="w-4 h-4 inline mr-2" />
                Current Weight
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={userData.weight}
                  onChange={(e) => updateUserData('weight', e.target.value)}
                  placeholder="Weight"
                  className="flex-1 px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-primary-400 focus:outline-none transition-colors"
                />
                <select
                  value={userData.weightUnit}
                  onChange={(e) => updateUserData('weightUnit', e.target.value)}
                  className="px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-primary-400 focus:outline-none transition-colors bg-white"
                >
                  <option value="kg">kg</option>
                  <option value="lbs">lbs</option>
                </select>
              </div>
            </div>
            
            {/* Height */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <Ruler className="w-4 h-4 inline mr-2" />
                Height
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={userData.height}
                  onChange={(e) => updateUserData('height', e.target.value)}
                  placeholder="Height"
                  className="flex-1 px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-primary-400 focus:outline-none transition-colors"
                />
                <select
                  value={userData.heightUnit}
                  onChange={(e) => updateUserData('heightUnit', e.target.value)}
                  className="px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-primary-400 focus:outline-none transition-colors bg-white"
                >
                  <option value="cm">cm</option>
                  <option value="ft">ft</option>
                </select>
              </div>
            </div>
            
            {/* Target Weight */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                🎯 Target Weight ({userData.weightUnit})
              </label>
              <input
                type="number"
                value={userData.targetWeight}
                onChange={(e) => updateUserData('targetWeight', e.target.value)}
                placeholder="Your goal weight"
                className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-primary-400 focus:outline-none transition-colors"
              />
            </div>
          </div>
        </motion.div>
      )
    }
    
    // Protocol selection
    return (
      <motion.div
        key="protocol"
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -50 }}
        className="px-6"
      >
        <h1 className="text-2xl font-bold text-slate-800 mb-2 text-center">Choose your protocol</h1>
        <p className="text-slate-500 text-center mb-6">
          {experience === 'beginner' 
            ? 'We recommend starting with 12:12 or 14:10'
            : experience === 'intermediate'
              ? '16:8 is great for building consistency'
              : 'Choose any protocol that fits your lifestyle'
          }
        </p>
        
        <div className="space-y-3 max-h-[350px] overflow-y-auto scrollbar-hide">
          {(Object.entries(PROTOCOLS) as [FastingProtocol, typeof PROTOCOLS['16:8']][])
            .filter(([key]) => key !== 'custom')
            .map(([key, protocol]) => {
              const isRecommended = (experience === 'beginner' && ['12:12', '14:10'].includes(key)) ||
                                   (experience === 'intermediate' && key === '16:8')
              
              return (
                <button
                  key={key}
                  onClick={() => setSelectedProtocol(key)}
                  className={`w-full p-4 rounded-2xl border-2 text-left transition-all ${
                    selectedProtocol === key
                      ? 'border-primary-400 bg-primary-50'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-lg text-slate-800">{key}</span>
                        {isRecommended && (
                          <span className="text-xs bg-success-100 text-success-600 px-2 py-0.5 rounded-full">
                            Recommended
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-slate-500">{protocol.name}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-primary-500 font-semibold">{protocol.fastHours}h fast</div>
                      <div className="text-xs text-slate-400">{protocol.eatHours}h eat</div>
                    </div>
                  </div>
                  <p className="text-sm text-slate-500 mt-2">{protocol.description}</p>
                </button>
              )
            })}
        </div>
      </motion.div>
    )
  }

  const currentBg = step < slides.length ? slides[step].bgGradient : 'from-white to-slate-50'
  
  const canProceed = () => {
    if (step === slides.length + 1 && selectedGoals.length === 0) return false
    return true
  }

  return (
    <div className={`min-h-screen bg-gradient-to-b ${currentBg} flex flex-col`}>
      {/* Progress dots */}
      <div className="flex justify-center gap-2 pt-12 pb-8">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div
            key={i}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === step 
                ? 'w-8 bg-primary-500' 
                : i < step 
                  ? 'w-2 bg-primary-300'
                  : 'w-2 bg-slate-200'
            }`}
          />
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center overflow-y-auto">
        <AnimatePresence mode="wait">
          {renderSlide()}
        </AnimatePresence>
      </div>

      {/* Bottom actions */}
      <div className="p-6 pb-12">
        <button
          onClick={handleNext}
          disabled={!canProceed() || isSaving}
          className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Saving...
            </>
          ) : (
            <>
              {step === totalSteps - 1 ? 'Get Started' : 'Continue'}
              <ChevronRight className="w-5 h-5" />
            </>
          )}
        </button>
        
        {step > 0 && step <= slides.length && (
          <button
            onClick={() => setStep(slides.length + 1)}
            className="w-full mt-3 text-slate-500 hover:text-slate-700 transition-colors"
          >
            Skip intro
          </button>
        )}
        
        {step >= slides.length + 3 && step < totalSteps - 1 && (
          <button
            onClick={handleNext}
            className="w-full mt-3 text-slate-500 hover:text-slate-700 transition-colors"
          >
            Skip for now
          </button>
        )}
      </div>
    </div>
  )
}
