import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Users, Search, Globe, Lock, Crown, ChevronRight, Loader2 } from 'lucide-react'
import { useCirclesStore } from '../../stores/circlesStore'
import CreateCircleModal from './CreateCircleModal'
import JoinCircleModal from './JoinCircleModal'
import type { Circle } from '../../types'

interface CirclesListProps {
  onSelectCircle?: (circle: Circle) => void
}

export default function CirclesList({ onSelectCircle }: CirclesListProps) {
  const { 
    circles, 
    fetchCircles, 
    isLoading, 
    error,
    clearError 
  } = useCirclesStore()
  
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showJoinModal, setShowJoinModal] = useState(false)
  const [filter, setFilter] = useState<'all' | 'owned' | 'joined'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Fetch circles on mount and when filter changes
  useEffect(() => {
    fetchCircles(filter)
  }, [fetchCircles, filter])

  // Clear error on unmount
  useEffect(() => {
    return () => clearError()
  }, [clearError])

  // Memoized filter function for search
  const filteredCircles = circles.filter(circle => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      circle.name.toLowerCase().includes(query) ||
      (circle.description?.toLowerCase().includes(query) ?? false)
    )
  })

  // Get current user ID from WordPress
  const currentUserId = window.fasttrackData?.current_user_id || 0

  const handleCreateSuccess = useCallback((circle: Circle) => {
    setShowCreateModal(false)
    if (onSelectCircle) {
      onSelectCircle(circle)
    }
  }, [onSelectCircle])

  const handleJoinSuccess = useCallback((circle: Circle) => {
    setShowJoinModal(false)
    if (onSelectCircle) {
      onSelectCircle(circle)
    }
  }, [onSelectCircle])

  const handleSelectCircle = (circle: Circle) => {
    if (onSelectCircle) {
      onSelectCircle(circle)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">My Circles</h2>
          <p className="text-sm text-slate-500">Fast together, succeed together</p>
        </div>
        <div className="flex gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowCreateModal(true)}
            className="btn-primary py-2 px-4 text-sm flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Create
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowJoinModal(true)}
            className="btn-secondary py-2 px-4 text-sm flex items-center gap-2"
          >
            <Users className="w-4 h-4" /> Join
          </motion.button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search circles..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              filter === 'all' 
                ? 'bg-primary-500 text-white' 
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('owned')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              filter === 'owned' 
                ? 'bg-primary-500 text-white' 
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            My Circles
          </button>
          <button
            onClick={() => setFilter('joined')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              filter === 'joined' 
                ? 'bg-primary-500 text-white' 
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Joined
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* Loading State */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-primary-500 animate-spin mb-4" />
          <p className="text-slate-500">Loading your circles...</p>
        </div>
      ) : filteredCircles.length === 0 ? (
        // Empty State
        <div className="card p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="font-semibold text-slate-800 mb-2">
            {searchQuery ? 'No circles found' : 'No circles yet'}
          </h3>
          <p className="text-slate-500 mb-4">
            {searchQuery 
              ? 'Try a different search term' 
              : 'Create a new circle or join an existing one to start fasting together'
            }
          </p>
          {!searchQuery && (
            <div className="flex justify-center gap-3">
              <button
                onClick={() => setShowCreateModal(true)}
                className="btn-primary py-2 px-4 text-sm"
              >
                Create Circle
              </button>
              <button
                onClick={() => setShowJoinModal(true)}
                className="btn-secondary py-2 px-4 text-sm"
              >
                Join Circle
              </button>
            </div>
          )}
        </div>
      ) : (
        // Circles Grid
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredCircles.map(circle => {
            const isOwner = circle.owner_id === currentUserId || circle.is_owner
            
            return (
              <motion.div
                key={circle.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                layout
                className="card-elevated p-4 cursor-pointer hover:shadow-lg transition-all group"
                onClick={() => handleSelectCircle(circle)}
              >
                <div className="flex items-start gap-3">
                  {/* Avatar/Icon */}
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    circle.is_private 
                      ? 'bg-purple-100 text-purple-600' 
                      : 'bg-emerald-100 text-emerald-600'
                  }`}>
                    {circle.is_private ? (
                      <Lock className="w-6 h-6" />
                    ) : (
                      <Globe className="w-6 h-6" />
                    )}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-800 truncate">{circle.name}</h3>
                      {isOwner && (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
                          <Crown className="w-3 h-3" /> Owner
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-500 mt-0.5 line-clamp-1">
                      {circle.description || 'No description'}
                    </p>
                    
                    {/* Stats */}
                    <div className="flex items-center gap-4 mt-2">
                      <div className="flex items-center gap-1 text-sm text-slate-600">
                        <Users className="w-4 h-4" />
                        <span>{circle.member_count}</span>
                      </div>
                      {typeof circle.active_fasters === 'number' && circle.active_fasters > 0 && (
                        <div className="flex items-center gap-1 text-sm text-emerald-600">
                          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          <span>{circle.active_fasters} fasting</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Arrow */}
                  <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-slate-500 transition-colors flex-shrink-0 mt-1" />
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateCircleModal 
            onClose={() => setShowCreateModal(false)} 
            onSuccess={handleCreateSuccess}
          />
        )}
        {showJoinModal && (
          <JoinCircleModal 
            onClose={() => setShowJoinModal(false)} 
            onSuccess={handleJoinSuccess}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
