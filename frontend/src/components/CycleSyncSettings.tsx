import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Moon, Calendar, Info, ChevronRight, AlertTriangle,
  Check, X, Sparkles
} from 'lucide-react'
import { useCycleStore, CYCLE_PHASES, type CyclePhase } from '../stores/cycleStore'
import { useAppStore } from '../stores/appStore'

interface CycleSyncSettingsProps {
  onClose?: () => void
  isModal?: boolean
}

export default function CycleSyncSettings({ onClose, isModal = false }: CycleSyncSettingsProps) {
  const { 
    isEnabled, cycleLength, periodLength, lastPeriodStart,
    currentPhase, currentDay, nextPeriodDate,
    setEnabled, setCycleLength, setPeriodLength, setLastPeriodStart,
    getPhaseInfo, initializeFromServer, isInitialized, isLoading
  } = useCycleStore()
  const { showToast } = useAppStore()
  
  const [localEnabled, setLocalEnabled] = useState(isEnabled)
  const [localCycleLength, setLocalCycleLength] = useState(cycleLength.toString())
  const [localPeriodLength, setLocalPeriodLength] = useState(periodLength.toString())
  const [localLastPeriod, setLocalLastPeriod] = useState(lastPeriodStart || '')
  const [showInfo, setShowInfo] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Initialize from server on mount
  useEffect(() => {
    if (!isInitialized && !isLoading) {
      initializeFromServer()
    }
  }, [isInitialized, isLoading, initializeFromServer])

  useEffect(() => {
    setLocalEnabled(isEnabled)
    setLocalCycleLength(cycleLength.toString())
    setLocalPeriodLength(periodLength.toString())
    setLocalLastPeriod(lastPeriodStart || '')
  }, [isEnabled, cycleLength, periodLength, lastPeriodStart])

  const handleSave = async () => {
    setIsSaving(true)
    
    try {
      // Each setter now automatically saves to server
      await setEnabled(localEnabled)
      await setCycleLength(parseInt(localCycleLength) || 28)
      await setPeriodLength(parseInt(localPeriodLength) || 5)
      await setLastPeriodStart(localLastPeriod)
      
      showToast('Cycle settings saved!', 'success')
      
      if (onClose) onClose()
    } catch (error) {
      console.error('Failed to save cycle settings:', error)
      showToast('Failed to save settings', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  const phaseInfo = getPhaseInfo()

  const content = (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center shadow-lg">
            <Moon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Cycle Sync</h2>
            <p className="text-sm text-slate-500">Optimize fasting for your cycle</p>
          </div>
        </div>
        {isModal && onClose && (
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        )}
      </div>

      {/* Info Banner */}
      <div 
        className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-2xl p-4 border border-pink-100 cursor-pointer"
        onClick={() => setShowInfo(!showInfo)}
      >
        <div className="flex items-center gap-3">
          <Info className="w-5 h-5 text-pink-500 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-slate-700">
              Your menstrual cycle affects how your body responds to fasting. 
              Enable Cycle Sync to get personalized fasting recommendations.
            </p>
          </div>
          <ChevronRight className={`w-5 h-5 text-pink-400 transition-transform ${showInfo ? 'rotate-90' : ''}`} />
        </div>
        
        <AnimatePresence>
          {showInfo && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-4 pt-4 border-t border-pink-100 space-y-3">
                {(Object.entries(CYCLE_PHASES) as [CyclePhase, typeof CYCLE_PHASES['menstrual']][]).map(([key, phase]) => (
                  <div key={key} className="flex items-start gap-3">
                    <span className="text-xl">{phase.icon}</span>
                    <div>
                      <div className="font-medium text-slate-800">{phase.name}</div>
                      <div className="text-xs text-slate-500">{phase.days} • Max {phase.maxFastHours}h fast</div>
                      <div className="text-xs text-slate-600 mt-0.5">{phase.fastingAdvice}</div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Enable Toggle */}
      <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-200">
        <div className="flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-pink-500" />
          <div>
            <span className="font-medium text-slate-800">Enable Cycle Sync</span>
            <p className="text-xs text-slate-500">Adjust fasting goals based on your cycle</p>
          </div>
        </div>
        <button
          onClick={() => setLocalEnabled(!localEnabled)}
          className={`w-14 h-8 rounded-full transition-colors relative ${
            localEnabled ? 'bg-pink-500' : 'bg-slate-200'
          }`}
        >
          <motion.div
            animate={{ x: localEnabled ? 26 : 4 }}
            className="w-6 h-6 bg-white rounded-full shadow-md absolute top-1"
          />
        </button>
      </div>

      {/* Settings (only shown when enabled) */}
      <AnimatePresence>
        {localEnabled && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="space-y-4 overflow-hidden"
          >
            {/* Last Period Start */}
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-pink-500" />
                Last Period Start Date
              </label>
              <input
                type="date"
                value={localLastPeriod}
                onChange={(e) => setLocalLastPeriod(e.target.value)}
                className="input"
                max={new Date().toISOString().split('T')[0]}
              />
            </div>

            {/* Cycle Length */}
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">
                Average Cycle Length (days)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="21"
                  max="35"
                  value={localCycleLength}
                  onChange={(e) => setLocalCycleLength(e.target.value)}
                  className="flex-1 accent-pink-500"
                />
                <span className="w-12 text-center font-bold text-pink-600">{localCycleLength}</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">Typical range: 21-35 days (average 28)</p>
            </div>

            {/* Period Length */}
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">
                Average Period Length (days)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="3"
                  max="7"
                  value={localPeriodLength}
                  onChange={(e) => setLocalPeriodLength(e.target.value)}
                  className="flex-1 accent-pink-500"
                />
                <span className="w-12 text-center font-bold text-pink-600">{localPeriodLength}</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">Typical range: 3-7 days</p>
            </div>

            {/* Current Phase Display */}
            {currentPhase && phaseInfo && (
              <div 
                className="p-4 rounded-2xl border-2"
                style={{ 
                  backgroundColor: `${phaseInfo.color}10`,
                  borderColor: `${phaseInfo.color}40`
                }}
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">{phaseInfo.icon}</span>
                  <div>
                    <div className="font-bold text-slate-800">{phaseInfo.name}</div>
                    <div className="text-sm text-slate-600">Day {currentDay} of your cycle</div>
                  </div>
                </div>
                <p className="text-sm text-slate-700 mb-2">{phaseInfo.description}</p>
                <div className="flex items-center gap-2 text-sm">
                  <AlertTriangle className="w-4 h-4" style={{ color: phaseInfo.color }} />
                  <span style={{ color: phaseInfo.color }} className="font-medium">
                    Recommended max fast: {phaseInfo.maxFastHours} hours
                  </span>
                </div>
                {nextPeriodDate && (
                  <p className="text-xs text-slate-500 mt-2">
                    Next period expected: {new Date(nextPeriodDate).toLocaleDateString()}
                  </p>
                )}
              </div>
            )}

            {/* Warning for Luteal Phase */}
            {currentPhase === 'luteal' && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-medium text-amber-800">Gentle Phase Active</div>
                    <p className="text-sm text-amber-700 mt-1">
                      Your body is in the luteal phase. We've adjusted your fasting goals to be gentler. 
                      Focus on nourishing, nutrient-dense foods during your eating window.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={isSaving}
        className="btn-primary w-full flex items-center justify-center gap-2"
      >
        {isSaving ? (
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <Check className="w-5 h-5" />
        )}
        Save Settings
      </button>
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
          onClick={(e) => e.stopPropagation()}
        >
          {content}
        </motion.div>
      </motion.div>
    )
  }

  return <div className="card-elevated">{content}</div>
}


