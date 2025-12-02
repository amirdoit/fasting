import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, ChevronRight, ChevronLeft, Timer, TrendingUp, BarChart3, 
  Users, UtensilsCrossed, Brain, Camera, Snowflake, 
  Moon, Trophy, Sparkles
} from 'lucide-react'
import { useAppStore } from '../stores/appStore'

interface FeatureTourProps {
  onComplete: () => void
}

const tourSteps = [
  {
    id: 'welcome',
    title: 'Welcome to FastTrack Elite! 🎉',
    description: 'Your all-in-one intermittent fasting companion. Let\'s take a quick tour of all the amazing features available to you.',
    icon: Sparkles,
    color: 'from-primary-500 to-accent-500',
  },
  {
    id: 'timer',
    title: 'Fasting Timer',
    description: 'Track your fasts with our beautiful timer. See your progress through different fasting zones - from Fed State to Deep Ketosis. Pause and resume anytime!',
    icon: Timer,
    color: 'from-orange-500 to-red-500',
    tab: 'timer' as const,
  },
  {
    id: 'tracking',
    title: 'Health Tracking',
    description: 'Log your weight, water intake, mood, energy levels, and meals. Track everything in one place with beautiful charts and trends.',
    icon: TrendingUp,
    color: 'from-emerald-500 to-teal-500',
    tab: 'tracking' as const,
  },
  {
    id: 'food-scanner',
    title: 'AI Food Scanner 📸',
    description: 'Take a photo of your meal and get instant nutritional information, macros, and a "fasting quality" score. Found in the Tracking → Meals section.',
    icon: Camera,
    color: 'from-cyan-500 to-blue-500',
    badge: 'AI Powered',
  },
  {
    id: 'analytics',
    title: 'Analytics & Insights',
    description: 'View detailed charts of your fasting history, weight trends, hydration patterns, and wellness scores. See how you\'re improving over time!',
    icon: BarChart3,
    color: 'from-purple-500 to-indigo-500',
    tab: 'analytics' as const,
  },
  {
    id: 'brain-gym',
    title: 'Brain Gym 🧠',
    description: 'Test your cognitive performance with reaction time and Stroop tests. Compare your mental clarity when fasted vs fed. Found in Analytics → Brain Gym tab.',
    icon: Brain,
    color: 'from-violet-500 to-purple-600',
    badge: 'Unique Feature',
  },
  {
    id: 'social',
    title: 'Community & Challenges',
    description: 'Join challenges, compete on leaderboards, and connect with other fasters. Earn XP and climb the ranks!',
    icon: Users,
    color: 'from-blue-500 to-cyan-500',
    tab: 'social' as const,
  },
  {
    id: 'streak-freeze',
    title: 'Streak Freezes ❄️',
    description: 'Life happens! Earn streak freezes by completing activities, and use them to protect your streak on tough days. Found on the Dashboard.',
    icon: Snowflake,
    color: 'from-cyan-400 to-blue-500',
  },
  {
    id: 'recipes',
    title: 'Healthy Recipes',
    description: 'Browse fasting-friendly recipes with nutritional info. Filter by category and add ingredients to your shopping list.',
    icon: UtensilsCrossed,
    color: 'from-orange-500 to-amber-500',
    tab: 'recipes' as const,
  },
  {
    id: 'cycle-sync',
    title: 'Cycle Sync (For Women)',
    description: 'Sync your fasting with your menstrual cycle for optimal results. Get phase-specific recommendations and warnings. Enable in Settings.',
    icon: Moon,
    color: 'from-pink-500 to-rose-500',
    tab: 'settings' as const,
  },
  {
    id: 'complete',
    title: 'You\'re All Set! 🚀',
    description: 'Start exploring and make fasting work for you. Remember: consistency beats perfection. We\'re here to support your journey!',
    icon: Trophy,
    color: 'from-amber-500 to-orange-500',
  },
]

export default function FeatureTour({ onComplete }: FeatureTourProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const { setCurrentTab } = useAppStore()
  
  const step = tourSteps[currentStep]
  const isFirst = currentStep === 0
  const isLast = currentStep === tourSteps.length - 1
  const progress = ((currentStep + 1) / tourSteps.length) * 100

  const handleNext = () => {
    if (isLast) {
      onComplete()
    } else {
      setCurrentStep(prev => prev + 1)
    }
  }

  const handlePrev = () => {
    if (!isFirst) {
      setCurrentStep(prev => prev - 1)
    }
  }

  const handleSkip = () => {
    onComplete()
  }

  const handleGoToTab = () => {
    if ('tab' in step && step.tab) {
      setCurrentTab(step.tab)
      onComplete()
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
      >
        {/* Progress bar */}
        <div className="h-1 bg-slate-100">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            className="h-full bg-gradient-to-r from-primary-500 to-accent-500"
          />
        </div>

        {/* Skip button */}
        {!isLast && (
          <button
            onClick={handleSkip}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 transition-colors z-10"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        )}

        {/* Content */}
        <div className="p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {/* Icon */}
              <div className="flex justify-center mb-6">
                <div className={`w-20 h-20 rounded-3xl bg-gradient-to-br ${step.color} flex items-center justify-center shadow-xl`}>
                  <step.icon className="w-10 h-10 text-white" />
                </div>
              </div>

              {/* Badge */}
              {'badge' in step && step.badge && (
                <div className="flex justify-center mb-3">
                  <span className="px-3 py-1 text-xs font-bold rounded-full bg-gradient-to-r from-primary-500 to-accent-500 text-white">
                    {step.badge}
                  </span>
                </div>
              )}

              {/* Title */}
              <h2 className="text-2xl font-bold text-slate-800 text-center mb-3">
                {step.title}
              </h2>

              {/* Description */}
              <p className="text-slate-600 text-center leading-relaxed mb-6">
                {step.description}
              </p>

              {/* Try it button for tabs */}
              {'tab' in step && step.tab && (
                <button
                  onClick={handleGoToTab}
                  className="w-full mb-4 py-3 px-4 rounded-xl border-2 border-primary-200 text-primary-600 font-medium hover:bg-primary-50 transition-colors flex items-center justify-center gap-2"
                >
                  <step.icon className="w-5 h-5" />
                  Try it now
                </button>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <div className="px-8 pb-8">
          <div className="flex items-center justify-between gap-4">
            {/* Back button */}
            <button
              onClick={handlePrev}
              disabled={isFirst}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-colors ${
                isFirst 
                  ? 'text-slate-300 cursor-not-allowed' 
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <ChevronLeft className="w-5 h-5" />
              Back
            </button>

            {/* Step indicators */}
            <div className="flex gap-1.5">
              {tourSteps.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentStep(index)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentStep 
                      ? 'w-6 bg-primary-500' 
                      : index < currentStep
                        ? 'bg-primary-300'
                        : 'bg-slate-200'
                  }`}
                />
              ))}
            </div>

            {/* Next button */}
            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-6 py-2 rounded-xl bg-gradient-to-r from-primary-500 to-accent-500 text-white font-medium shadow-lg shadow-primary-500/30 hover:shadow-xl transition-shadow"
            >
              {isLast ? 'Get Started' : 'Next'}
              {!isLast && <ChevronRight className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Step counter */}
        <div className="text-center pb-4 text-sm text-slate-400">
          {currentStep + 1} of {tourSteps.length}
        </div>
      </motion.div>
    </motion.div>
  )
}

