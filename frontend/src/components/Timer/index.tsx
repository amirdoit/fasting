import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Play, Pause, Square, RotateCcw, Clock, 
  ChevronDown, Sparkles, Wind, AlertTriangle, Target, Timer as TimerIcon,
  Waves, Pill, Scan
} from 'lucide-react'
import { useFastingStore, FASTING_ZONES, PROTOCOLS, type FastingProtocol } from '../../stores/fastingStore'
import { useAppStore } from '../../stores/appStore'
import { useCycleStore } from '../../stores/cycleStore'
import { api } from '../../services/api'
import TimerRing from './TimerRing'
import BreathingExercise from './BreathingExercise'
import Mascot from '../Mascot'
import UrgeSurfer from '../UrgeSurfer'
import SupplementManager from '../SupplementManager'
import FastingScanner from '../FastingScanner'

export default function Timer() {
  const { 
    isActive, targetHours, protocol, pausedAt,
    startFast, endFast, pauseFast, resumeFast, setProtocol,
    getElapsedTime, getProgress, getCurrentZone, initializeFromServer
  } = useFastingStore()
  const { showToast, setStats } = useAppStore()
  const { isEnabled: cycleEnabled, currentPhase, getPhaseInfo, getRecommendedMaxFast } = useCycleStore()
  
  const [, setTick] = useState(0)
  const [showProtocolPicker, setShowProtocolPicker] = useState(false)
  const [showBreathing, setShowBreathing] = useState(false)
  const [backdateMinutes, setBackdateMinutes] = useState(0)
  const [showUrgeSurfer, setShowUrgeSurfer] = useState(false)
  const [showSupplements, setShowSupplements] = useState(false)
  const [showScanner, setShowScanner] = useState(false)
  
  const cyclePhaseInfo = getPhaseInfo()
  const recommendedMaxFast = getRecommendedMaxFast()

  // Initialize from server on mount
  useEffect(() => {
    initializeFromServer()
  }, [initializeFromServer])

  // Update every second when active
  useEffect(() => {
    if (!isActive || pausedAt) return
    const interval = setInterval(() => setTick(t => t + 1), 1000)
    return () => clearInterval(interval)
  }, [isActive, pausedAt])

  const formatTime = (ms: number) => {
    // Handle invalid values
    if (!ms || isNaN(ms) || ms < 0) {
      return { hours: '00', minutes: '00', seconds: '00' }
    }
    
    const hours = Math.floor(ms / (1000 * 60 * 60))
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((ms % (1000 * 60)) / 1000)
    return {
      hours: hours.toString().padStart(2, '0'),
      minutes: minutes.toString().padStart(2, '0'),
      seconds: seconds.toString().padStart(2, '0')
    }
  }

  const formatTimeRemaining = (ms: number) => {
    // Handle invalid values
    if (!ms || isNaN(ms) || ms < 0) {
      return 'Starting...'
    }
    
    const remaining = (targetHours * 60 * 60 * 1000) - ms
    if (remaining <= 0) return 'Goal reached! 🎉'
    
    const hours = Math.floor(remaining / (1000 * 60 * 60))
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60))
    
    if (hours > 0) return `${hours}h ${minutes}m remaining`
    return `${minutes}m remaining`
  }

  const handleStart = async () => {
    await startFast(protocol, backdateMinutes)
    showToast('Fast started! You got this! 💪', 'success')
    setBackdateMinutes(0)
  }

  const handleEnd = async () => {
    const elapsed = getElapsedTime()
    const hours = elapsed / (1000 * 60 * 60)
    
    await endFast('', 'good')
    showToast(`Fast completed! ${hours.toFixed(1)} hours 🎉`, 'success')
    
    // Refresh stats from server
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

  const handlePauseResume = () => {
    if (pausedAt) {
      resumeFast()
      showToast('Fast resumed', 'info')
    } else {
      pauseFast()
      showToast('Fast paused', 'info')
    }
  }

  const elapsed = getElapsedTime()
  const progress = getProgress()
  const currentZone = getCurrentZone()
  const time = formatTime(elapsed)
  const isComplete = progress >= 100

  return (
    <div className="py-6">
      {/* Cycle Phase Banner */}
      {cycleEnabled && cyclePhaseInfo && !isActive && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mb-4 p-4 rounded-2xl border ${
            currentPhase === 'luteal' || currentPhase === 'menstrual' 
              ? 'bg-amber-50 border-amber-200' 
              : 'bg-emerald-50 border-emerald-200'
          }`}
        >
          <div className="flex items-start gap-3">
            <span className="text-2xl">{cyclePhaseInfo.icon}</span>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-800">{cyclePhaseInfo.name}</span>
                {(currentPhase === 'luteal' || currentPhase === 'menstrual') && (
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                )}
              </div>
              <p className="text-sm text-slate-600 mt-0.5">{cyclePhaseInfo.fastingAdvice}</p>
              <p className="text-xs text-slate-500 mt-1">
                Recommended max fast: <span className="font-medium">{recommendedMaxFast} hours</span>
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Header */}
      <header className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Fasting Timer</h1>
          <p className="text-slate-500">
            {isActive ? (pausedAt ? 'Paused' : 'In progress') : 'Ready to start'}
          </p>
        </div>
        
        {/* Breathing exercise button */}
        <button
          onClick={() => setShowBreathing(true)}
          className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-105 transition-all"
          title="Breathing Exercise"
          aria-label="Open breathing exercise"
        >
          <Wind className="w-6 h-6 text-white" />
        </button>
      </header>

      {/* Active Protocol Badge - Shown during fasting */}
      {isActive && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="bg-gradient-to-r from-primary-500/10 via-primary-500/5 to-transparent rounded-2xl p-4 border border-primary-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center shadow-lg">
                  <TimerIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-slate-800">{protocol}</span>
                    <span className="text-slate-400">|</span>
                    <span className="text-slate-600 font-medium">{PROTOCOLS[protocol].name}</span>
                  </div>
                  <p className="text-sm text-slate-500">{PROTOCOLS[protocol].description}</p>
                </div>
              </div>
              <div className="text-right hidden sm:block">
                <div className="flex items-center gap-1 text-primary-600">
                  <Target className="w-4 h-4" />
                  <span className="font-semibold">{targetHours}h goal</span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  {PROTOCOLS[protocol].fastHours}h fast : {PROTOCOLS[protocol].eatHours}h eat
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Main Timer */}
      <div className="flex flex-col items-center mb-8">
        <div className="relative mb-6">
          <TimerRing 
            progress={progress} 
            size={280} 
            strokeWidth={16}
            color={currentZone?.color || '#FF6B6B'}
            showGlow={isActive && !pausedAt}
            bgColor="#F1F5F9"
          />
          
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              {isActive ? (
                <>
                  <div className="sm:hidden mb-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-100 text-primary-700 text-sm font-semibold">
                      <TimerIcon className="w-3.5 h-3.5" />
                      {protocol}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-5xl font-bold text-slate-800 tabular-nums">{time.hours}</span>
                    <span className="text-2xl text-slate-400">:</span>
                    <span className="text-5xl font-bold text-slate-800 tabular-nums">{time.minutes}</span>
                    <span className="text-2xl text-slate-400">:</span>
                    <span className="text-3xl font-bold text-slate-500 tabular-nums">{time.seconds}</span>
                  </div>
                  <p className="text-slate-500 mt-2">{formatTimeRemaining(elapsed)}</p>
                </>
              ) : (
                <>
                  <div className="text-5xl font-bold gradient-text">{protocol}</div>
                  <p className="text-slate-500 mt-2">{PROTOCOLS[protocol].name}</p>
                  <p className="text-xs text-slate-400 mt-1">{targetHours}h fasting goal</p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Current Zone */}
        {isActive && currentZone && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-6"
          >
            <div 
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full"
              style={{ backgroundColor: `${currentZone.color}15` }}
            >
              <Sparkles className="w-4 h-4" style={{ color: currentZone.color }} />
              <span className="font-semibold" style={{ color: currentZone.color }}>
                {currentZone.name}
              </span>
            </div>
            <p className="text-slate-500 text-sm mt-2">{currentZone.description}</p>
          </motion.div>
        )}

        {/* Complete celebration with mascot */}
        {isComplete && isActive && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="text-center mb-6"
          >
            <Mascot phase="inferno" size="md" showMessage={false} />
            <h2 className="text-xl font-bold text-success-500 mt-2">Goal Reached!</h2>
            <p className="text-slate-500">You can continue or end your fast</p>
          </motion.div>
        )}
        
        {/* Mascot companion (when not complete) */}
        {isActive && !isComplete && (
          <div className="hidden lg:block absolute right-8 top-1/2 -translate-y-1/2">
            <Mascot size="sm" showMessage />
          </div>
        )}

        {/* Control Buttons */}
        <div className="flex items-center gap-4">
          {!isActive ? (
            <>
              {/* Protocol selector */}
              <button
                onClick={() => setShowProtocolPicker(true)}
                className="btn-secondary flex items-center gap-2"
              >
                <Clock className="w-4 h-4" />
                {protocol}
                <ChevronDown className="w-4 h-4" />
              </button>
              
              {/* Start button */}
              <button
                onClick={handleStart}
                className="w-16 h-16 rounded-full bg-gradient-primary flex items-center justify-center shadow-glow-primary hover:scale-105 transition-transform"
              >
                <Play className="w-8 h-8 text-white ml-1" />
              </button>
            </>
          ) : (
            <>
              {/* Pause/Resume */}
              <button
                onClick={handlePauseResume}
                className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"
              >
                {pausedAt ? (
                  <Play className="w-6 h-6 text-slate-700 ml-0.5" />
                ) : (
                  <Pause className="w-6 h-6 text-slate-700" />
                )}
              </button>
              
              {/* End */}
              <button
                onClick={handleEnd}
                className="w-16 h-16 rounded-full bg-gradient-to-br from-red-400 to-red-500 flex items-center justify-center shadow-lg hover:scale-105 transition-transform"
              >
                <Square className="w-7 h-7 text-white" />
              </button>
              
              {/* Reset (only when paused) */}
              {pausedAt && (
                <button
                  onClick={() => {
                    endFast()
                    showToast('Fast cancelled', 'info')
                  }}
                  className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"
                >
                  <RotateCcw className="w-6 h-6 text-slate-500" />
                </button>
              )}
            </>
          )}
        </div>

        {/* Backdate option (when not active) */}
        {!isActive && (
          <div className="mt-6 text-center">
            <p className="text-sm text-slate-500 mb-2">Started earlier?</p>
            <div className="flex items-center justify-center gap-2">
              {[30, 60, 120].map(mins => (
                <button
                  key={mins}
                  onClick={() => setBackdateMinutes(mins)}
                  className={`px-3 py-1.5 rounded-xl text-sm transition-all ${
                    backdateMinutes === mins
                      ? 'bg-primary-100 text-primary-600 font-medium'
                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  }`}
                >
                  -{mins}m
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Fasting Zones Timeline */}
      <div className="card-elevated">
        <h3 className="font-semibold text-slate-800 mb-4">Fasting Zones</h3>
        <div className="space-y-3">
          {FASTING_ZONES.slice(0, 5).map((zone) => {
            const elapsedHours = elapsed / (1000 * 60 * 60)
            const isCurrentZone = elapsedHours >= zone.startHour && elapsedHours < zone.endHour
            const isPast = elapsedHours >= zone.endHour
            
            return (
              <div
                key={zone.name}
                className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                  isCurrentZone 
                    ? 'bg-white ring-2 shadow-md'
                    : isPast 
                      ? 'opacity-50'
                      : 'bg-slate-50'
                }`}
                style={{
                  '--tw-ring-color': isCurrentZone ? zone.color : 'transparent'
                } as React.CSSProperties}
              >
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: zone.color }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-700">{zone.name}</span>
                    <span className="text-sm text-slate-400">
                      {zone.startHour}-{zone.endHour}h
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 truncate">{zone.description}</p>
                </div>
                {isCurrentZone && (
                  <Sparkles className="w-4 h-4 flex-shrink-0" style={{ color: zone.color }} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Quick Tools - When Fasting */}
      {isActive && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-elevated mt-6"
        >
          <h3 className="font-semibold text-slate-800 mb-4">Quick Tools</h3>
          <div className="grid grid-cols-3 gap-3">
            {/* Urge Surfer - SOS Button */}
            <button
              onClick={() => setShowUrgeSurfer(true)}
              className="p-4 rounded-2xl bg-gradient-to-br from-red-50 to-pink-50 border border-red-200 text-center hover:shadow-lg transition-all group"
            >
              <div className="w-12 h-12 mx-auto mb-2 rounded-xl bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Waves className="w-6 h-6 text-white" />
              </div>
              <span className="text-sm font-medium text-red-700">Urge SOS</span>
              <p className="text-[10px] text-red-500 mt-0.5">Feeling hungry?</p>
            </button>

            {/* Supplements */}
            <button
              onClick={() => setShowSupplements(true)}
              className="p-4 rounded-2xl bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 text-center hover:shadow-lg transition-all group"
            >
              <div className="w-12 h-12 mx-auto mb-2 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Pill className="w-6 h-6 text-white" />
              </div>
              <span className="text-sm font-medium text-purple-700">Supplements</span>
              <p className="text-[10px] text-purple-500 mt-0.5">When to take</p>
            </button>

            {/* Food Scanner */}
            <button
              onClick={() => setShowScanner(true)}
              className="p-4 rounded-2xl bg-gradient-to-br from-cyan-50 to-blue-50 border border-cyan-200 text-center hover:shadow-lg transition-all group"
            >
              <div className="w-12 h-12 mx-auto mb-2 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Scan className="w-6 h-6 text-white" />
              </div>
              <span className="text-sm font-medium text-cyan-700">Scan Food</span>
              <p className="text-[10px] text-cyan-500 mt-0.5">Breaks fast?</p>
            </button>
          </div>
        </motion.div>
      )}

      {/* Protocol Picker Modal */}
      <AnimatePresence>
        {showProtocolPicker && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-backdrop"
            onClick={() => setShowProtocolPicker(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
              className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl p-6 max-h-[70vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto mb-6" />
              <h2 className="text-xl font-bold text-slate-800 mb-4">Select Protocol</h2>
              
              <div className="space-y-2">
                {(Object.entries(PROTOCOLS) as [FastingProtocol, typeof PROTOCOLS['16:8']][])
                  .filter(([key]) => key !== 'custom')
                  .map(([key, proto]) => (
                    <button
                      key={key}
                      onClick={() => {
                        setProtocol(key)
                        setShowProtocolPicker(false)
                      }}
                      className={`w-full p-4 rounded-2xl text-left transition-all ${
                        protocol === key
                          ? 'bg-primary-50 ring-2 ring-primary-500'
                          : 'bg-slate-50 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-bold text-lg text-slate-800">{key}</span>
                          <span className="text-slate-500 ml-2">{proto.name}</span>
                        </div>
                        <div className="text-right">
                          <div className="text-primary-500 font-semibold">{proto.fastHours}h</div>
                        </div>
                      </div>
                      <p className="text-sm text-slate-500 mt-1">{proto.description}</p>
                    </button>
                  ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Breathing Exercise Modal */}
      <AnimatePresence>
        {showBreathing && (
          <BreathingExercise onClose={() => setShowBreathing(false)} />
        )}
      </AnimatePresence>

      {/* Urge Surfer Modal */}
      <AnimatePresence>
        {showUrgeSurfer && (
          <UrgeSurfer 
            onClose={() => setShowUrgeSurfer(false)} 
            onConfirmEndFast={handleEnd}
          />
        )}
      </AnimatePresence>

      {/* Supplements Modal */}
      <AnimatePresence>
        {showSupplements && (
          <SupplementManager isModal onClose={() => setShowSupplements(false)} />
        )}
      </AnimatePresence>

      {/* Food Scanner Modal */}
      <AnimatePresence>
        {showScanner && (
          <FastingScanner onClose={() => setShowScanner(false)} />
        )}
      </AnimatePresence>
    </div>
  )
}

export { default as TimerRing } from './TimerRing'
