import { useState } from 'react'
import { motion } from 'framer-motion'
import { X, Users, Lock, Globe, Loader2, Sparkles } from 'lucide-react'
import { useCirclesStore } from '../../stores/circlesStore'
import type { Circle } from '../../types'

interface CreateCircleModalProps {
  onClose: () => void
  onSuccess?: (circle: Circle) => void
}

export default function CreateCircleModal({ onClose, onSuccess }: CreateCircleModalProps) {
  const { createCircle, isCreating, error, clearError } = useCirclesStore()
  
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isPrivate, setIsPrivate] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError(null)
    clearError()

    if (!name.trim()) {
      setLocalError('Circle name is required')
      return
    }

    if (name.length < 3) {
      setLocalError('Circle name must be at least 3 characters')
      return
    }

    if (name.length > 50) {
      setLocalError('Circle name must be less than 50 characters')
      return
    }

    const circle = await createCircle({
      name: name.trim(),
      description: description.trim() || undefined,
      is_private: isPrivate,
    })

    if (circle && onSuccess) {
      onSuccess(circle)
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
        className="bg-white rounded-3xl p-6 max-w-md w-full relative"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-400 to-accent-500 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-800">Create Circle</h3>
              <p className="text-sm text-slate-500">Start a fasting community</p>
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
          {/* Circle Name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Circle Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Morning Fasters, Keto Warriors"
              className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              maxLength={50}
            />
            <div className="flex justify-end mt-1">
              <span className="text-xs text-slate-400">{name.length}/50</span>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's your circle about?"
              rows={3}
              className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              maxLength={500}
            />
            <div className="flex justify-end mt-1">
              <span className="text-xs text-slate-400">{description.length}/500</span>
            </div>
          </div>

          {/* Privacy Toggle */}
          <div className="p-4 bg-slate-50 rounded-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  isPrivate ? 'bg-purple-100 text-purple-600' : 'bg-emerald-100 text-emerald-600'
                }`}>
                  {isPrivate ? <Lock className="w-5 h-5" /> : <Globe className="w-5 h-5" />}
                </div>
                <div>
                  <h4 className="font-medium text-slate-800">
                    {isPrivate ? 'Private Circle' : 'Public Circle'}
                  </h4>
                  <p className="text-sm text-slate-500">
                    {isPrivate 
                      ? 'Only people with invite code can join'
                      : 'Anyone can find and join this circle'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPrivate(!isPrivate)}
                className={`relative w-14 h-8 rounded-full transition-colors ${
                  isPrivate ? 'bg-purple-500' : 'bg-emerald-500'
                }`}
              >
                <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-transform ${
                  isPrivate ? 'left-7' : 'left-1'
                }`} />
              </button>
            </div>
          </div>

          {/* Info Card */}
          <div className="p-4 bg-primary-50 rounded-xl border border-primary-100">
            <div className="flex items-start gap-3">
              <Users className="w-5 h-5 text-primary-600 mt-0.5" />
              <div>
                <p className="text-sm text-primary-700">
                  As the circle owner, you'll be able to:
                </p>
                <ul className="text-sm text-primary-600 mt-1 list-disc list-inside">
                  <li>Invite and remove members</li>
                  <li>Create circle challenges</li>
                  <li>Manage circle settings</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={isCreating || !name.trim()}
            className="w-full py-4 bg-gradient-to-r from-primary-500 to-accent-500 text-white rounded-2xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCreating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Create Circle
              </>
            )}
          </motion.button>
        </form>
      </motion.div>
    </motion.div>
  )
}

