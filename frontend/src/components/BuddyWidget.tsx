import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Users, Flame, Clock, UserPlus, X, Check, 
  MessageCircle, Heart, ChevronRight, Loader2, UserMinus
} from 'lucide-react'
import { api } from '../services/api'
import { useAppStore } from '../stores/appStore'
import type { Buddy, CircleMember } from '../types'

interface BuddyWidgetProps {
  circleId: number
  members: CircleMember[]
  size?: 'compact' | 'full'
  onBuddyChange?: (buddy: Buddy | null) => void
}

export default function BuddyWidget({ circleId, members, size = 'compact', onBuddyChange }: BuddyWidgetProps) {
  const { showToast } = useAppStore()
  const [buddy, setBuddy] = useState<Buddy | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showSelectModal, setShowSelectModal] = useState(false)
  const [isSettingBuddy, setIsSettingBuddy] = useState(false)
  const [isRemovingBuddy, setIsRemovingBuddy] = useState(false)

  const currentUserId = window.fasttrackData?.current_user_id || 0

  // Fetch current buddy on mount
  useEffect(() => {
    fetchBuddy()
  }, [circleId])

  const fetchBuddy = async () => {
    setIsLoading(true)
    try {
      const response = await api.getCircleBuddy(circleId)
      if (response.success) {
        setBuddy(response.data || null)
        onBuddyChange?.(response.data || null)
      }
    } catch (error) {
      console.error('Failed to fetch buddy:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSetBuddy = async (buddyUserId: number) => {
    setIsSettingBuddy(true)
    try {
      const response = await api.setCircleBuddy(circleId, buddyUserId)
      if (response.success && response.data) {
        setBuddy(response.data)
        onBuddyChange?.(response.data)
        showToast('Buddy set successfully! 🤝', 'success')
        setShowSelectModal(false)
      } else {
        showToast(response.error || 'Failed to set buddy', 'error')
      }
    } catch (error) {
      showToast('Failed to set buddy', 'error')
    } finally {
      setIsSettingBuddy(false)
    }
  }

  const handleRemoveBuddy = async () => {
    if (!buddy) return
    if (!confirm('Remove your accountability buddy?')) return
    
    setIsRemovingBuddy(true)
    try {
      const response = await api.removeCircleBuddy(circleId)
      if (response.success) {
        setBuddy(null)
        onBuddyChange?.(null)
        showToast('Buddy removed', 'success')
      } else {
        showToast(response.error || 'Failed to remove buddy', 'error')
      }
    } catch (error) {
      showToast('Failed to remove buddy', 'error')
    } finally {
      setIsRemovingBuddy(false)
    }
  }

  const formatFastDuration = (minutes?: number) => {
    if (!minutes) return ''
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  }

  // Available members (excluding current user and current buddy)
  const availableMembers = members.filter(m => 
    m.user_id !== currentUserId && m.user_id !== buddy?.user_id
  )

  if (isLoading) {
    return (
      <div className={`card p-4 ${size === 'compact' ? 'flex items-center gap-3' : ''}`}>
        <Loader2 className="w-5 h-5 text-primary-500 animate-spin" />
        <span className="text-sm text-slate-500">Loading buddy...</span>
      </div>
    )
  }

  // Compact view - for dashboard or sidebar
  if (size === 'compact') {
    if (!buddy) {
      return (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowSelectModal(true)}
          className="w-full card p-4 border-2 border-dashed border-slate-200 hover:border-primary-400 hover:bg-primary-50 transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
              <UserPlus className="w-6 h-6 text-slate-400" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-slate-700">Find a Buddy</p>
              <p className="text-sm text-slate-500">Get accountability support</p>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-300 ml-auto" />
          </div>
        </motion.button>
      )
    }

    return (
      <>
        <motion.div 
          className="card-elevated p-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-3">
            {/* Buddy Avatar */}
            <div className="relative">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-400 to-accent-500 flex items-center justify-center text-white font-bold overflow-hidden">
                {buddy.avatar ? (
                  <img src={buddy.avatar} alt={buddy.name} className="w-full h-full object-cover" />
                ) : (
                  buddy.name?.charAt(0).toUpperCase() || '?'
                )}
              </div>
              {/* Fasting indicator */}
              {buddy.is_fasting && (
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                </div>
              )}
            </div>

            {/* Buddy Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-800 truncate">{buddy.name}</span>
                <Heart className="w-4 h-4 text-pink-500 fill-pink-500" />
              </div>
              <div className="flex items-center gap-3 text-sm">
                <span className="flex items-center gap-1 text-orange-500">
                  <Flame className="w-3 h-3" />
                  {buddy.streak}d
                </span>
                {buddy.is_fasting && (
                  <span className="flex items-center gap-1 text-emerald-600">
                    <Clock className="w-3 h-3" />
                    {formatFastDuration(buddy.fast_duration)}
                  </span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="p-2 text-slate-400 hover:text-primary-500 hover:bg-primary-50 rounded-lg"
                title="Send encouragement"
              >
                <MessageCircle className="w-5 h-5" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleRemoveBuddy}
                disabled={isRemovingBuddy}
                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                title="Remove buddy"
              >
                {isRemovingBuddy ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <UserMinus className="w-5 h-5" />
                )}
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Select Modal */}
        <AnimatePresence>
          {showSelectModal && (
            <BuddySelectModal
              members={availableMembers}
              isLoading={isSettingBuddy}
              onSelect={handleSetBuddy}
              onClose={() => setShowSelectModal(false)}
            />
          )}
        </AnimatePresence>
      </>
    )
  }

  // Full view - for circle detail page
  return (
    <>
      <div className="card-elevated p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary-500" />
            <h3 className="font-semibold text-slate-800">Accountability Buddy</h3>
          </div>
          {buddy && (
            <button
              onClick={() => setShowSelectModal(true)}
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              Change
            </button>
          )}
        </div>

        {buddy ? (
          <div className="space-y-4">
            {/* Buddy Card */}
            <div className="flex items-center gap-4 p-4 bg-gradient-to-br from-primary-50 to-accent-50 rounded-2xl">
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-400 to-accent-500 flex items-center justify-center text-white text-xl font-bold overflow-hidden">
                  {buddy.avatar ? (
                    <img src={buddy.avatar} alt={buddy.name} className="w-full h-full object-cover" />
                  ) : (
                    buddy.name?.charAt(0).toUpperCase() || '?'
                  )}
                </div>
                {buddy.is_fasting && (
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center">
                    <div className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
                  </div>
                )}
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-bold text-slate-800 text-lg">{buddy.name}</h4>
                  <Heart className="w-5 h-5 text-pink-500 fill-pink-500" />
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="flex items-center gap-1 px-2 py-1 bg-white rounded-lg text-sm font-medium text-orange-600">
                    <Flame className="w-4 h-4" />
                    {buddy.streak} day streak
                  </span>
                  {buddy.is_fasting ? (
                    <span className="flex items-center gap-1 px-2 py-1 bg-emerald-100 rounded-lg text-sm font-medium text-emerald-700">
                      <Clock className="w-4 h-4" />
                      Fasting: {formatFastDuration(buddy.fast_duration)}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 px-2 py-1 bg-slate-100 rounded-lg text-sm font-medium text-slate-600">
                      Not fasting
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center justify-center gap-2 p-3 bg-primary-500 text-white rounded-xl font-medium"
              >
                <MessageCircle className="w-5 h-5" />
                Send Cheer
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleRemoveBuddy}
                disabled={isRemovingBuddy}
                className="flex items-center justify-center gap-2 p-3 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-red-50 hover:text-red-600 transition-colors"
              >
                {isRemovingBuddy ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <UserMinus className="w-5 h-5" />
                    Remove
                  </>
                )}
              </motion.button>
            </div>
          </div>
        ) : (
          <div className="text-center py-6">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-slate-400" />
            </div>
            <h4 className="font-semibold text-slate-700 mb-2">No Buddy Yet</h4>
            <p className="text-sm text-slate-500 mb-4">
              Pick an accountability buddy to stay motivated together!
            </p>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowSelectModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-primary-500 to-accent-500 text-white rounded-xl font-medium"
            >
              <UserPlus className="w-5 h-5 inline mr-2" />
              Find a Buddy
            </motion.button>
          </div>
        )}
      </div>

      {/* Select Modal */}
      <AnimatePresence>
        {showSelectModal && (
          <BuddySelectModal
            members={availableMembers}
            isLoading={isSettingBuddy}
            onSelect={handleSetBuddy}
            onClose={() => setShowSelectModal(false)}
          />
        )}
      </AnimatePresence>
    </>
  )
}

// Buddy Selection Modal
interface BuddySelectModalProps {
  members: CircleMember[]
  isLoading: boolean
  onSelect: (userId: number) => void
  onClose: () => void
}

function BuddySelectModal({ members, isLoading, onSelect, onClose }: BuddySelectModalProps) {
  const [selectedId, setSelectedId] = useState<number | null>(null)

  const handleConfirm = () => {
    if (selectedId) {
      onSelect(selectedId)
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
        className="bg-white rounded-3xl p-6 max-w-md w-full max-h-[80vh] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-400 to-accent-500 flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-800">Choose Your Buddy</h3>
              <p className="text-sm text-slate-500">Select an accountability partner</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-xl"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Member List */}
        <div className="flex-1 overflow-y-auto space-y-2 mb-4">
          {members.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              No available members to select as a buddy
            </div>
          ) : (
            members.map(member => (
              <motion.button
                key={member.id}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => setSelectedId(member.user_id)}
                className={`w-full p-4 rounded-xl text-left transition-all ${
                  selectedId === member.user_id
                    ? 'bg-primary-50 border-2 border-primary-400'
                    : 'bg-slate-50 border-2 border-transparent hover:border-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-300 to-slate-400 flex items-center justify-center text-white font-bold overflow-hidden">
                    {member.avatar ? (
                      <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
                    ) : (
                      member.name?.charAt(0).toUpperCase() || '?'
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-800">{member.name}</p>
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <span className="flex items-center gap-1">
                        <Flame className="w-3 h-3 text-orange-500" />
                        {member.streak}d streak
                      </span>
                      {member.is_fasting && (
                        <span className="text-emerald-600">• Fasting now</span>
                      )}
                    </div>
                  </div>
                  {selectedId === member.user_id && (
                    <div className="w-6 h-6 rounded-full bg-primary-500 flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
              </motion.button>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200"
          >
            Cancel
          </button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleConfirm}
            disabled={!selectedId || isLoading}
            className="flex-1 py-3 bg-gradient-to-r from-primary-500 to-accent-500 text-white rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Check className="w-5 h-5" />
                Confirm Buddy
              </>
            )}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  )
}


