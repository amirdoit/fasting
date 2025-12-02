import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Sparkles, RefreshCw, ChevronDown, ChevronUp, 
  Lightbulb, AlertTriangle, Eye, Clock, Loader2, Brain
} from 'lucide-react'
import { api } from '../services/api'
import { useAppStore } from '../stores/appStore'
import type { CoachSummary } from '../types'

interface CoachReportProps {
  variant?: 'card' | 'full'
  defaultExpanded?: boolean
}

export default function CoachReport({ variant = 'card', defaultExpanded = false }: CoachReportProps) {
  const { showToast } = useAppStore()
  const [summary, setSummary] = useState<CoachSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [timeframe, setTimeframe] = useState<'7days' | '30days' | '90days'>('7days')
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  useEffect(() => {
    fetchSummary()
  }, [timeframe])

  const fetchSummary = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await api.getCoachSummary(timeframe)
      if (response.success && response.data) {
        setSummary(response.data)
      } else {
        setError(response.error || 'Failed to load coach summary')
      }
    } catch (err) {
      setError('Failed to load coach summary')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegenerate = async () => {
    setIsRegenerating(true)
    try {
      const response = await api.regenerateCoachSummary(timeframe)
      if (response.success && response.data) {
        setSummary(response.data)
        showToast('Coach report regenerated!', 'success')
      } else {
        showToast(response.error || 'Failed to regenerate', 'error')
      }
    } catch (err) {
      showToast('Failed to regenerate report', 'error')
    } finally {
      setIsRegenerating(false)
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`
    return date.toLocaleDateString()
  }

  if (isLoading) {
    return (
      <div className={`card-elevated p-6 ${variant === 'card' ? '' : 'min-h-[300px]'}`}>
        <div className="flex flex-col items-center justify-center py-8">
          <Loader2 className="w-8 h-8 text-primary-500 animate-spin mb-3" />
          <p className="text-slate-500 text-sm">Analyzing your progress...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="card-elevated p-6">
        <div className="text-center py-4">
          <p className="text-red-500 mb-3">{error}</p>
          <button 
            onClick={fetchSummary}
            className="text-sm text-primary-600 hover:text-primary-700"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (!summary) return null

  // Card variant (compact, for Dashboard)
  if (variant === 'card') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-elevated overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-violet-500 to-purple-600 p-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5" />
              <h3 className="font-semibold">Coach Insights</h3>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value as typeof timeframe)}
                className="bg-white/20 text-white text-xs rounded-lg px-2 py-1 border-0 focus:ring-1 focus:ring-white/50"
              >
                <option value="7days">7 Days</option>
                <option value="30days">30 Days</option>
                <option value="90days">90 Days</option>
              </select>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleRegenerate}
                disabled={isRegenerating}
                className="p-1.5 bg-white/20 rounded-lg hover:bg-white/30"
                title="Regenerate"
              >
                <RefreshCw className={`w-4 h-4 ${isRegenerating ? 'animate-spin' : ''}`} />
              </motion.button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Summary */}
          <p className="text-slate-700 text-sm mb-4 leading-relaxed">
            {summary.summary}
          </p>

          {/* Warnings */}
          {summary.warnings.length > 0 && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-amber-700">{summary.warnings[0]}</p>
              </div>
            </div>
          )}

          {/* Expandable sections */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full flex items-center justify-between py-2 text-sm text-slate-500 hover:text-slate-700"
          >
            <span>{isExpanded ? 'Show less' : 'Show details'}</span>
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                {/* Observations */}
                {summary.observations.length > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Eye className="w-4 h-4 text-blue-500" />
                      <h4 className="text-sm font-medium text-slate-700">Observations</h4>
                    </div>
                    <ul className="space-y-1.5">
                      {summary.observations.map((obs, i) => (
                        <li key={i} className="text-sm text-slate-600 pl-6 relative">
                          <span className="absolute left-2 top-2 w-1.5 h-1.5 bg-blue-400 rounded-full" />
                          {obs}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Recommendations */}
                {summary.recommendations.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Lightbulb className="w-4 h-4 text-amber-500" />
                      <h4 className="text-sm font-medium text-slate-700">Recommendations</h4>
                    </div>
                    <ul className="space-y-1.5">
                      {summary.recommendations.map((rec, i) => (
                        <li key={i} className="text-sm text-slate-600 pl-6 relative">
                          <span className="absolute left-2 top-2 w-1.5 h-1.5 bg-amber-400 rounded-full" />
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Footer */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {summary.cached ? 'Cached' : 'Fresh'} • {formatTimestamp(summary.created_at)}
            </div>
            <div className="flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              AI-powered
            </div>
          </div>
        </div>
      </motion.div>
    )
  }

  // Full variant
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Your Coach Report</h2>
            <p className="text-sm text-slate-500">AI-powered insights for your fasting journey</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value as typeof timeframe)}
            className="px-3 py-2 bg-slate-100 rounded-xl border-0 text-sm"
          >
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="90days">Last 90 Days</option>
          </select>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleRegenerate}
            disabled={isRegenerating}
            className="px-4 py-2 bg-violet-500 text-white rounded-xl text-sm font-medium flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isRegenerating ? 'animate-spin' : ''}`} />
            Regenerate
          </motion.button>
        </div>
      </div>

      {/* Summary Card */}
      <div className="card-elevated p-6 bg-gradient-to-br from-violet-50 to-purple-50">
        <p className="text-lg text-slate-700 leading-relaxed">
          {summary.summary}
        </p>
      </div>

      {/* Warnings */}
      {summary.warnings.length > 0 && (
        <div className="card p-4 border-l-4 border-amber-500 bg-amber-50">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-amber-800 mb-2">Important Notice</h3>
              <ul className="space-y-1">
                {summary.warnings.map((warning, i) => (
                  <li key={i} className="text-amber-700">{warning}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Observations */}
        <div className="card-elevated p-6">
          <div className="flex items-center gap-2 mb-4">
            <Eye className="w-5 h-5 text-blue-500" />
            <h3 className="font-semibold text-slate-800">Key Observations</h3>
          </div>
          <ul className="space-y-3">
            {summary.observations.map((obs, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-start gap-3"
              >
                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-blue-600">{i + 1}</span>
                </div>
                <p className="text-slate-600">{obs}</p>
              </motion.li>
            ))}
          </ul>
        </div>

        {/* Recommendations */}
        <div className="card-elevated p-6">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="w-5 h-5 text-amber-500" />
            <h3 className="font-semibold text-slate-800">Recommendations</h3>
          </div>
          <ul className="space-y-3">
            {summary.recommendations.map((rec, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-start gap-3"
              >
                <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Sparkles className="w-3 h-3 text-amber-600" />
                </div>
                <p className="text-slate-600">{rec}</p>
              </motion.li>
            ))}
          </ul>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-sm text-slate-400 flex items-center justify-center gap-2">
        <Clock className="w-4 h-4" />
        Last updated {formatTimestamp(summary.created_at)}
        {summary.cached && <span className="px-2 py-0.5 bg-slate-100 rounded-full text-xs">Cached</span>}
      </div>
    </div>
  )
}

