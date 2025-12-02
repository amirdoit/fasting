import { useState } from 'react'
import { motion } from 'framer-motion'
import { X, Link2, Loader2, Users, CheckCircle } from 'lucide-react'
import { useCirclesStore } from '../../stores/circlesStore'
import type { Circle } from '../../types'

interface JoinCircleModalProps {
  onClose: () => void
  onSuccess?: (circle: Circle) => void
}

export default function JoinCircleModal({ onClose, onSuccess }: JoinCircleModalProps) {
  const { joinByInviteCode, isJoining, error, clearError } = useCirclesStore()
  
  const [inviteCode, setInviteCode] = useState('')
  const [localError, setLocalError] = useState<string | null>(null)
  const [joinedCircle, setJoinedCircle] = useState<Circle | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError(null)
    clearError()

    const cleanCode = inviteCode.trim().toUpperCase()

    if (!cleanCode) {
      setLocalError('Please enter an invite code')
      return
    }

    if (cleanCode.length < 6) {
      setLocalError('Invite code is too short')
      return
    }

    const circle = await joinByInviteCode(cleanCode)

    if (circle) {
      setJoinedCircle(circle)
      setTimeout(() => {
        if (onSuccess) {
          onSuccess(circle)
        }
      }, 1500)
    }
  }

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow alphanumeric characters and uppercase them
    const value = e.target.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase()
    setInviteCode(value)
  }

  // Success state
  if (joinedCircle) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-3xl p-8 max-w-md w-full text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
            className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4"
          >
            <CheckCircle className="w-10 h-10 text-emerald-500" />
          </motion.div>
          <h3 className="text-2xl font-bold text-slate-800 mb-2">Welcome!</h3>
          <p className="text-slate-500 mb-4">
            You've joined <span className="font-semibold text-slate-700">{joinedCircle.name}</span>
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
            <Users className="w-4 h-4" />
            <span>{joinedCircle.member_count} members</span>
          </div>
        </motion.div>
      </motion.div>
    )
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
        className="bg-white rounded-3xl p-6 max-w-md w-full relative"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center">
              <Link2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-800">Join Circle</h3>
              <p className="text-sm text-slate-500">Enter the invite code</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Error Display */}
        {(localError || error) && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-xl text-sm">
            {localError || error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Invite Code Input */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Invite Code
            </label>
            <input
              type="text"
              value={inviteCode}
              onChange={handleCodeChange}
              placeholder="e.g., ABC12345"
              className="w-full p-4 border-2 border-slate-200 rounded-2xl text-center text-2xl font-mono tracking-widest uppercase focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              maxLength={10}
              autoFocus
            />
            <p className="text-xs text-slate-400 text-center mt-2">
              Ask the circle owner for the invite code
            </p>
          </div>

          {/* Info */}
          <div className="p-4 bg-slate-50 rounded-xl">
            <div className="flex items-start gap-3">
              <Users className="w-5 h-5 text-slate-500 mt-0.5" />
              <div className="text-sm text-slate-600">
                <p className="font-medium mb-1">What you'll get:</p>
                <ul className="list-disc list-inside text-slate-500">
                  <li>Join group fasting challenges</li>
                  <li>See real-time fasting activity</li>
                  <li>Compare progress with members</li>
                  <li>Find an accountability buddy</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={isJoining || !inviteCode.trim()}
            className="w-full py-4 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-2xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isJoining ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Joining...
              </>
            ) : (
              <>
                <Link2 className="w-5 h-5" />
                Join Circle
              </>
            )}
          </motion.button>
        </form>

        {/* Bottom Info */}
        <p className="text-xs text-slate-400 text-center mt-4">
          Don't have a code? Ask a friend or explore public circles.
        </p>
      </motion.div>
    </motion.div>
  )
}

