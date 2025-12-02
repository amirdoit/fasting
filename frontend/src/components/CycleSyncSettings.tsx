import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Moon, Calendar, Info, Loader2, CheckCircle, X } from 'lucide-react'
import { useCycleStore } from '../stores/cycleStore'
import { useAppStore } from '../stores/appStore'

interface CycleSyncSettingsProps {
  isModal?: boolean
  onClose?: () => void
}

export default function CycleSyncSettings({ isModal = false, onClose }: CycleSyncSettingsProps) {
  const { 
    isEnabled: storeEnabled, 
    cycleLength: storeCycleLength, 
    periodLength: storePeriodLength, 
    lastPeriodStart: storeLastPeriodStart,
    isLoading, 
    error, 
    fetchCycleData, 
    saveCycleData, 
    clearError,
    getPhaseInfo
  } = useCycleStore()
  const { showToast } = useAppStore()
  
  const [isEnabled, setIsEnabled] = useState(storeEnabled)
  const [cycleLength, setCycleLength] = useState(storeCycleLength)
  const [periodLength, setPeriodLength] = useState(storePeriodLength)
  const [lastPeriodStart, setLastPeriodStart] = useState(storeLastPeriodStart || '')
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  
  // Use ref to prevent infinite API calls - fetch only once on mount
  const isInitialized = useRef(false)

  useEffect(() => {
    if (!isInitialized.current) {
      isInitialized.current = true
      fetchCycleData()
    }
    return () => clearError()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    setIsEnabled(storeEnabled)
    setCycleLength(storeCycleLength)
    setPeriodLength(storePeriodLength)
    setLastPeriodStart(storeLastPeriodStart || '')
  }, [storeEnabled, storeCycleLength, storePeriodLength, storeLastPeriodStart])

  const handleSave = async () => {
    const success = await saveCycleData({
      isEnabled,
      cycleLength,
      periodLength,
      lastPeriodStart: lastPeriodStart || null,
    })
    
    if (success) {
      showToast('Cycle settings saved!', 'success')
      setHasUnsavedChanges(false)
      if (onClose) onClose()
    } else {
      showToast('Failed to save settings', 'error')
    }
  }

  const handleChange = <T,>(setter: (value: T) => void) => (value: T) => {
    setter(value)
    setHasUnsavedChanges(true)
  }

  // Calculate current phase if enabled
  const phaseInfo = getPhaseInfo()

  const content = (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center">
            <Moon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">Cycle Sync</h3>
            <p className="text-sm text-slate-500">Optimize fasting with your cycle</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-3 bg-red-50 text-red-700 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* Enable/Disable Toggle */}
      <div className="p-4 bg-slate-50 rounded-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              isEnabled ? 'bg-pink-100 text-pink-600' : 'bg-slate-200 text-slate-500'
            }`}>
              <Moon className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-medium text-slate-800">Enable Cycle Sync</h4>
              <p className="text-sm text-slate-500">Get personalized recommendations</p>
            </div>
          </div>
          <button
            onClick={() => handleChange(setIsEnabled)(!isEnabled)}
            className={`relative w-14 h-8 rounded-full transition-colors ${
              isEnabled ? 'bg-pink-500' : 'bg-slate-300'
            }`}
          >
            <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-transform shadow ${
              isEnabled ? 'left-7' : 'left-1'
            }`} />
          </button>
        </div>
      </div>

      {isEnabled && (
        <>
          {/* Current Phase Display */}
          {phaseInfo && (
            <div className={`p-4 rounded-xl ${phaseInfo.bgColor} ${phaseInfo.color}`}>
              <div className="flex items-center gap-2 mb-2">
                <Moon className="w-5 h-5" />
                <span className="font-bold">Current Phase: {phaseInfo.name}</span>
              </div>
              <p className="text-sm opacity-80">{phaseInfo.fastingTip}</p>
              <p className="text-xs mt-2 opacity-70">{phaseInfo.daysRemaining} days remaining</p>
            </div>
          )}

          {/* Cycle Length */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Average Cycle Length
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="21"
                max="35"
                value={cycleLength}
                onChange={(e) => handleChange(setCycleLength)(parseInt(e.target.value))}
                className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-pink-500"
              />
              <span className="w-16 text-center font-bold text-slate-800">{cycleLength} days</span>
            </div>
          </div>

          {/* Period Length */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Average Period Length
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="3"
                max="7"
                value={periodLength}
                onChange={(e) => handleChange(setPeriodLength)(parseInt(e.target.value))}
                className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-pink-500"
              />
              <span className="w-16 text-center font-bold text-slate-800">{periodLength} days</span>
            </div>
          </div>

          {/* Last Period Start */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Last Period Start Date
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="date"
                value={lastPeriodStart}
                onChange={(e) => handleChange(setLastPeriodStart)(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Info Box */}
          <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-700">
                <p className="font-medium mb-1">How Cycle Sync Works</p>
                <p>We'll suggest modified fasting schedules based on your cycle phase to help you fast more comfortably and effectively.</p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Save Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleSave}
        disabled={isLoading || !hasUnsavedChanges}
        className="w-full py-4 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-2xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Saving...
          </>
        ) : hasUnsavedChanges ? (
          <>
            <CheckCircle className="w-5 h-5" />
            Save Changes
          </>
        ) : (
          'No Changes'
        )}
      </motion.button>
    </div>
  )

  // If modal mode, wrap in modal overlay
  if (isModal) {
    return (
      <AnimatePresence>
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
      </AnimatePresence>
    )
  }

  return content
}
