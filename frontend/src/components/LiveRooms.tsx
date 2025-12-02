import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Users, Globe, Clock, Copy, Check, Share2,
  Trophy, Flame, AlertTriangle, X, UserPlus
} from 'lucide-react'
import { useAppStore } from '../stores/appStore'
import { useFastingStore } from '../stores/fastingStore'
import { api } from '../services/api'

interface LiveRoomsProps {
  isModal?: boolean
  onClose?: () => void
}

interface LiveFasterStats {
  total: number
  by_duration: {
    '4h+': number
    '8h+': number
    '12h+': number
    '16h+': number
    '20h+': number
  }
}

interface Commitment {
  id: string
  userId: number
  targetTime: string
  targetHours: number
  witnessEmail?: string
  witnessName?: string
  status: 'active' | 'completed' | 'failed'
  shareLink: string
  createdAt: string
}

export default function LiveRooms({ isModal = false, onClose }: LiveRoomsProps) {
  const { showToast } = useAppStore()
  const { isActive, getElapsedTime, targetHours } = useFastingStore()
  
  const [liveFasters, setLiveFasters] = useState<LiveFasterStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showCommitmentModal, setShowCommitmentModal] = useState(false)
  const [activeCommitment, setActiveCommitment] = useState<Commitment | null>(null)
  const [copied, setCopied] = useState(false)
  
  // Commitment form state
  const [commitmentHours, setCommitmentHours] = useState(16)
  const [witnessEmail, setWitnessEmail] = useState('')
  const [witnessName, setWitnessName] = useState('')

  // Fetch live fasters count
  useEffect(() => {
    fetchLiveFasters()
    const interval = setInterval(fetchLiveFasters, 60000) // Update every minute
    return () => clearInterval(interval)
  }, [])

  // Load active commitment
  useEffect(() => {
    loadActiveCommitment()
  }, [])

  const fetchLiveFasters = async () => {
    try {
      const response = await api.getLiveFasters()
      if (response.success && response.data) {
        setLiveFasters(response.data)
      }
    } catch (error) {
      console.error('Failed to fetch live fasters:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadActiveCommitment = () => {
    const saved = localStorage.getItem('fasttrack_active_commitment')
    if (saved) {
      const commitment = JSON.parse(saved) as Commitment
      // Check if commitment is still valid
      if (commitment.status === 'active') {
        const targetTime = new Date(commitment.targetTime)
        if (targetTime > new Date()) {
          setActiveCommitment(commitment)
        } else {
          // Commitment expired - mark as failed
          const updated = { ...commitment, status: 'failed' as const }
          localStorage.setItem('fasttrack_active_commitment', JSON.stringify(updated))
          setActiveCommitment(updated)
        }
      }
    }
  }

  const createCommitment = async () => {
    if (!isActive) {
      showToast('Start a fast first before creating a commitment', 'error')
      return
    }

    const targetTime = new Date()
    targetTime.setHours(targetTime.getHours() + commitmentHours)
    
    const commitment: Commitment = {
      id: `commitment-${Date.now()}`,
      userId: 0, // Will be set by backend
      targetTime: targetTime.toISOString(),
      targetHours: commitmentHours,
      witnessEmail: witnessEmail || undefined,
      witnessName: witnessName || undefined,
      status: 'active',
      shareLink: `${window.location.origin}/commitment/${Date.now()}`,
      createdAt: new Date().toISOString()
    }

    // Save locally
    localStorage.setItem('fasttrack_active_commitment', JSON.stringify(commitment))
    setActiveCommitment(commitment)
    setShowCommitmentModal(false)
    
    showToast('Commitment created! Share with your accountability partner.', 'success')

    // Try to save to backend (optional)
    try {
      await api.createCommitment({
        targetHours: commitmentHours,
        witnessEmail,
        witnessName
      })
    } catch (e) {
      // Silently fail - local commitment still works
    }
  }

  const copyShareLink = async () => {
    if (!activeCommitment) return
    
    const message = `I've committed to fasting for ${activeCommitment.targetHours} hours! Track my progress: ${activeCommitment.shareLink}`
    
    try {
      await navigator.clipboard.writeText(message)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      showToast('Link copied to clipboard!', 'success')
    } catch (e) {
      showToast('Failed to copy link', 'error')
    }
  }

  const shareCommitment = async () => {
    if (!activeCommitment) return
    
    const message = `I've committed to fasting for ${activeCommitment.targetHours} hours! Hold me accountable! 💪`
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My Fasting Commitment',
          text: message,
          url: activeCommitment.shareLink
        })
      } catch (e) {
        // User cancelled or error - that's okay
      }
    } else {
      copyShareLink()
    }
  }

  const getCurrentDurationBucket = () => {
    if (!isActive) return null
    const hours = getElapsedTime() / (1000 * 60 * 60)
    if (hours >= 20) return '20h+'
    if (hours >= 16) return '16h+'
    if (hours >= 12) return '12h+'
    if (hours >= 8) return '8h+'
    if (hours >= 4) return '4h+'
    return null
  }

  const content = (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
            <Globe className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Live Fasting</h2>
            <p className="text-sm text-slate-500">See who's fasting right now</p>
          </div>
        </div>
        {isModal && onClose && (
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        )}
      </div>

      {/* Global Counter */}
      <div className="bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl p-6 text-white">
        <div className="text-center">
          <motion.div
            key={liveFasters?.total}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-5xl font-bold mb-2"
          >
            {isLoading ? '...' : (liveFasters?.total || 0).toLocaleString()}
          </motion.div>
          <p className="text-white/80 flex items-center justify-center gap-2">
            <Users className="w-4 h-4" />
            people fasting right now
          </p>
        </div>

        {/* Duration Breakdown */}
        {liveFasters && (
          <div className="mt-6 grid grid-cols-5 gap-2">
            {Object.entries(liveFasters.by_duration).map(([duration, count]) => {
              const isCurrentBucket = duration === getCurrentDurationBucket()
              return (
                <div 
                  key={duration}
                  className={`text-center p-2 rounded-xl ${
                    isCurrentBucket 
                      ? 'bg-white/30 ring-2 ring-white' 
                      : 'bg-white/10'
                  }`}
                >
                  <div className="text-lg font-bold">{count}</div>
                  <div className="text-xs text-white/70">{duration}</div>
                </div>
              )
            })}
          </div>
        )}

        {isActive && (
          <div className="mt-4 text-center text-sm text-white/80">
            <Flame className="w-4 h-4 inline mr-1" />
            You're one of them!
          </div>
        )}
      </div>

      {/* Your Status */}
      {isActive && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center">
              <Flame className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-emerald-800">You're Fasting!</p>
              <p className="text-sm text-emerald-600">
                {Math.floor(getElapsedTime() / (1000 * 60 * 60))} hours into your {targetHours}h fast
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Commitment Contract */}
      <div className="border border-slate-200 rounded-2xl overflow-hidden">
        <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
          <h3 className="font-semibold text-slate-800 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-500" />
            Commitment Contract
          </h3>
        </div>
        
        <div className="p-4">
          {activeCommitment ? (
            <div className="space-y-4">
              <div className={`p-4 rounded-xl ${
                activeCommitment.status === 'active' 
                  ? 'bg-amber-50 border border-amber-200'
                  : activeCommitment.status === 'completed'
                  ? 'bg-emerald-50 border border-emerald-200'
                  : 'bg-red-50 border border-red-200'
              }`}>
                <div className="flex items-center gap-3">
                  <Clock className={`w-5 h-5 ${
                    activeCommitment.status === 'active' ? 'text-amber-500' :
                    activeCommitment.status === 'completed' ? 'text-emerald-500' : 'text-red-500'
                  }`} />
                  <div className="flex-1">
                    <p className={`font-medium ${
                      activeCommitment.status === 'active' ? 'text-amber-800' :
                      activeCommitment.status === 'completed' ? 'text-emerald-800' : 'text-red-800'
                    }`}>
                      {activeCommitment.status === 'active' 
                        ? `Committed to ${activeCommitment.targetHours}h fast`
                        : activeCommitment.status === 'completed'
                        ? 'Commitment completed! 🎉'
                        : 'Commitment ended early'}
                    </p>
                    {activeCommitment.witnessName && (
                      <p className="text-sm text-slate-600">
                        Accountability partner: {activeCommitment.witnessName}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {activeCommitment.status === 'active' && (
                <div className="flex gap-2">
                  <button
                    onClick={copyShareLink}
                    className="flex-1 py-3 bg-slate-100 rounded-xl text-slate-700 font-medium flex items-center justify-center gap-2"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'Copied!' : 'Copy Link'}
                  </button>
                  <button
                    onClick={shareCommitment}
                    className="flex-1 py-3 bg-primary-500 rounded-xl text-white font-medium flex items-center justify-center gap-2"
                  >
                    <Share2 className="w-4 h-4" />
                    Share
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-slate-600 mb-4">
                Create a commitment and share it with a friend to stay accountable!
              </p>
              <button
                onClick={() => setShowCommitmentModal(true)}
                className="px-6 py-3 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl font-medium flex items-center justify-center gap-2 mx-auto"
              >
                <UserPlus className="w-5 h-5" />
                Create Commitment
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Motivation */}
      <div className="bg-slate-50 rounded-2xl p-4 text-center">
        <p className="text-slate-600 text-sm">
          "When we commit publicly, we're 65% more likely to succeed."
        </p>
        <p className="text-slate-400 text-xs mt-1">— Behavioral Psychology Research</p>
      </div>

      {/* Commitment Modal */}
      <AnimatePresence>
        {showCommitmentModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowCommitmentModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-6 max-w-sm w-full"
              onClick={e => e.stopPropagation()}
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mb-4">
                  <Trophy className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-800">Make a Commitment</h3>
                <p className="text-slate-500 text-sm mt-1">
                  Set a goal and optionally share with someone
                </p>
              </div>

              <div className="space-y-4">
                {/* Hours Selection */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    I commit to fasting for
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[12, 16, 18, 24].map(hours => (
                      <button
                        key={hours}
                        onClick={() => setCommitmentHours(hours)}
                        className={`py-2 rounded-xl font-medium transition-colors ${
                          commitmentHours === hours
                            ? 'bg-violet-500 text-white'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {hours}h
                      </button>
                    ))}
                  </div>
                </div>

                {/* Witness (Optional) */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Accountability Partner (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="Their name"
                    value={witnessName}
                    onChange={e => setWitnessName(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  />
                  <input
                    type="email"
                    placeholder="Their email (for notifications)"
                    value={witnessEmail}
                    onChange={e => setWitnessEmail(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl mt-2 focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  />
                  <p className="text-xs text-slate-400 mt-1">
                    They'll be notified if you break your commitment early
                  </p>
                </div>

                {/* Warning */}
                {!isActive && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-amber-700">
                      Start a fast first to create a commitment
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setShowCommitmentModal(false)}
                    className="flex-1 py-3 bg-slate-100 rounded-xl text-slate-700 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={createCommitment}
                    disabled={!isActive}
                    className="flex-1 py-3 bg-gradient-to-r from-violet-500 to-purple-600 rounded-xl text-white font-medium disabled:opacity-50"
                  >
                    Create
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
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
          className="bg-white rounded-3xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto"
          onClick={e => e.stopPropagation()}
        >
          {content}
        </motion.div>
      </motion.div>
    )
  }

  return <div className="card-elevated">{content}</div>
}

