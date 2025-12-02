import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowLeft, Users, Crown, Clock, Flame, Copy, Check,
  Settings, UserMinus, LogOut, RefreshCw, Loader2,
  Activity, BarChart3, Trophy, ChevronRight, Link2, Globe, Lock
} from 'lucide-react'
import { useCirclesStore } from '../../stores/circlesStore'
import { useAppStore } from '../../stores/appStore'
import BuddyWidget from '../BuddyWidget'
import type { Circle, CircleMember, CircleActivity, CircleStats } from '../../types'

interface CircleDetailProps {
  circleId: number
  onBack: () => void
}

type TabType = 'members' | 'stats' | 'activity'

export default function CircleDetail({ circleId, onBack }: CircleDetailProps) {
  const {
    currentCircle,
    members,
    activities,
    isLoadingCircle,
    isLoadingMembers,
    isLoadingActivities,
    error,
    fetchCircleDetails,
    fetchCircleMembers,
    fetchCircleActivities,
    fetchCircleStats,
    leaveCircle,
    removeMember,
    regenerateInviteCode,
    clearCurrentCircle
  } = useCirclesStore()
  const { showToast } = useAppStore()
  
  const [activeTab, setActiveTab] = useState<TabType>('members')
  const [stats, setStats] = useState<CircleStats | null>(null)
  const [isLoadingStats, setIsLoadingStats] = useState(false)
  const [copiedCode, setCopiedCode] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [isLeaving, setIsLeaving] = useState(false)
  const [removingMemberId, setRemovingMemberId] = useState<number | null>(null)

  const currentUserId = window.fasttrackData?.current_user_id || 0
  const isOwner = currentCircle?.owner_id === currentUserId || currentCircle?.is_owner

  // Fetch circle data on mount
  useEffect(() => {
    fetchCircleDetails(circleId)
    fetchCircleMembers(circleId)
    
    return () => clearCurrentCircle()
  }, [circleId, fetchCircleDetails, fetchCircleMembers, clearCurrentCircle])

  // Fetch stats when stats tab is selected
  useEffect(() => {
    if (activeTab === 'stats' && !stats) {
      setIsLoadingStats(true)
      fetchCircleStats(circleId).then(data => {
        setStats(data)
        setIsLoadingStats(false)
      })
    }
  }, [activeTab, circleId, fetchCircleStats, stats])

  // Fetch activities when activity tab is selected
  useEffect(() => {
    if (activeTab === 'activity' && activities.length === 0) {
      fetchCircleActivities(circleId)
    }
  }, [activeTab, circleId, fetchCircleActivities, activities.length])

  const handleCopyInviteCode = useCallback(() => {
    if (currentCircle?.invite_code) {
      navigator.clipboard.writeText(currentCircle.invite_code)
      setCopiedCode(true)
      showToast('Invite code copied!', 'success')
      setTimeout(() => setCopiedCode(false), 2000)
    }
  }, [currentCircle?.invite_code, showToast])

  const handleRegenerateCode = async () => {
    if (!isOwner) return
    setIsRegenerating(true)
    const newCode = await regenerateInviteCode(circleId)
    setIsRegenerating(false)
    if (newCode) {
      showToast('New invite code generated!', 'success')
    }
  }

  const handleLeaveCircle = async () => {
    if (!confirm('Are you sure you want to leave this circle?')) return
    setIsLeaving(true)
    const success = await leaveCircle(circleId)
    setIsLeaving(false)
    if (success) {
      showToast('You have left the circle', 'success')
      onBack()
    }
  }

  const handleRemoveMember = async (userId: number, memberName: string) => {
    if (!isOwner) return
    if (!confirm(`Remove ${memberName} from this circle?`)) return
    setRemovingMemberId(userId)
    const success = await removeMember(circleId, userId)
    setRemovingMemberId(null)
    if (success) {
      showToast(`${memberName} has been removed`, 'success')
    }
  }

  const formatActivityTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    return date.toLocaleDateString()
  }

  const getActivityIcon = (type: CircleActivity['activity_type']) => {
    switch (type) {
      case 'fast_completed': return '🎯'
      case 'streak_milestone': return '🔥'
      case 'freeze_earned': return '❄️'
      case 'challenge_joined': return '🏆'
      case 'challenge_completed': return '🥇'
      case 'member_joined': return '👋'
      case 'member_left': return '👋'
      case 'circle_created': return '✨'
      default: return '📝'
    }
  }

  const getActivityMessage = (activity: CircleActivity) => {
    switch (activity.activity_type) {
      case 'fast_completed':
        return `completed a ${activity.activity_data?.hours || ''}h fast`
      case 'streak_milestone':
        return `reached a ${activity.activity_data?.days || ''}d streak!`
      case 'freeze_earned':
        return 'earned a streak freeze'
      case 'challenge_joined':
        return `joined ${activity.activity_data?.challenge_name || 'a challenge'}`
      case 'challenge_completed':
        return `completed ${activity.activity_data?.challenge_name || 'a challenge'}`
      case 'member_joined':
        return 'joined the circle'
      case 'member_left':
        return 'left the circle'
      case 'circle_created':
        return 'created this circle'
      default:
        return 'performed an action'
    }
  }

  if (isLoadingCircle && !currentCircle) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Loader2 className="w-10 h-10 text-primary-500 animate-spin mb-4" />
        <p className="text-slate-500">Loading circle...</p>
      </div>
    )
  }

  if (!currentCircle) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-500 mb-4">Circle not found</p>
        <button onClick={onBack} className="btn-primary">Go Back</button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onBack}
          className="p-2 hover:bg-slate-100 rounded-xl"
        >
          <ArrowLeft className="w-5 h-5 text-slate-500" />
        </motion.button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-800 truncate">{currentCircle.name}</h1>
            {currentCircle.is_private ? (
              <Lock className="w-4 h-4 text-purple-500" />
            ) : (
              <Globe className="w-4 h-4 text-emerald-500" />
            )}
          </div>
          <p className="text-sm text-slate-500 truncate">
            {currentCircle.description || 'No description'}
          </p>
        </div>
        {isOwner && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowSettingsModal(true)}
            className="p-2 hover:bg-slate-100 rounded-xl"
          >
            <Settings className="w-5 h-5 text-slate-500" />
          </motion.button>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* Quick Stats Bar */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-slate-800">{currentCircle.member_count}</div>
          <div className="text-xs text-slate-500">Members</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-emerald-600">{currentCircle.active_fasters || 0}</div>
          <div className="text-xs text-slate-500">Fasting Now</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-orange-500">{stats?.average_streak || '—'}</div>
          <div className="text-xs text-slate-500">Avg Streak</div>
        </div>
      </div>

      {/* Buddy Widget */}
      {members.length > 1 && (
        <BuddyWidget 
          circleId={circleId} 
          members={members}
          size="compact"
        />
      )}

      {/* Invite Code Section */}
      {(isOwner || currentCircle.invite_code) && (
        <div className="card-elevated p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Link2 className="w-5 h-5 text-primary-500" />
              <span className="font-medium text-slate-700">Invite Code</span>
            </div>
            {isOwner && (
              <button
                onClick={handleRegenerateCode}
                disabled={isRegenerating}
                className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
              >
                {isRegenerating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                Regenerate
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 p-3 bg-slate-100 rounded-xl font-mono text-lg text-center tracking-widest">
              {currentCircle.invite_code || '--------'}
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleCopyInviteCode}
              className="p-3 bg-primary-500 text-white rounded-xl"
            >
              {copiedCode ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
            </motion.button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 bg-slate-100 p-1 rounded-2xl">
        {[
          { id: 'members', label: 'Members', icon: Users },
          { id: 'stats', label: 'Stats', icon: BarChart3 },
          { id: 'activity', label: 'Activity', icon: Activity },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-white text-slate-800 shadow-md'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span className="text-sm">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {/* Members Tab */}
        {activeTab === 'members' && (
          <motion.div
            key="members"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-3"
          >
            {isLoadingMembers ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 text-primary-500 animate-spin" />
              </div>
            ) : members.length === 0 ? (
              <div className="card p-6 text-center text-slate-500">
                No members yet
              </div>
            ) : (
              members.map((member, index) => (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="card p-4"
                >
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-400 to-accent-500 flex items-center justify-center text-white font-bold overflow-hidden">
                      {member.avatar ? (
                        <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
                      ) : (
                        member.name?.charAt(0).toUpperCase() || '?'
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-800 truncate">{member.name}</span>
                        {member.is_owner && (
                          <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
                            <Crown className="w-3 h-3" /> Owner
                          </span>
                        )}
                        {member.user_id === currentUserId && (
                          <span className="px-2 py-0.5 bg-primary-100 text-primary-700 rounded-full text-xs font-medium">
                            You
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="flex items-center gap-1 text-xs text-slate-500">
                          <Flame className="w-3 h-3 text-orange-500" />
                          {member.streak}d streak
                        </span>
                        {member.is_fasting && (
                          <span className="flex items-center gap-1 text-xs text-emerald-600">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            Fasting ({Math.floor((member.fast_duration || 0) / 60)}h)
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    {isOwner && member.user_id !== currentUserId && !member.is_owner && (
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleRemoveMember(member.user_id, member.name)}
                        disabled={removingMemberId === member.user_id}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                      >
                        {removingMemberId === member.user_id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <UserMinus className="w-4 h-4" />
                        )}
                      </motion.button>
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </motion.div>
        )}

        {/* Stats Tab */}
        {activeTab === 'stats' && (
          <motion.div
            key="stats"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {isLoadingStats ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 text-primary-500 animate-spin" />
              </div>
            ) : stats ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="card-elevated p-5 text-center">
                    <Users className="w-8 h-8 text-primary-500 mx-auto mb-2" />
                    <div className="text-3xl font-bold text-slate-800">{stats.total_members}</div>
                    <div className="text-sm text-slate-500">Total Members</div>
                  </div>
                  <div className="card-elevated p-5 text-center">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-2">
                      <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                    </div>
                    <div className="text-3xl font-bold text-emerald-600">{stats.active_fasters}</div>
                    <div className="text-sm text-slate-500">Active Fasters</div>
                  </div>
                  <div className="card-elevated p-5 text-center">
                    <Flame className="w-8 h-8 text-orange-500 mx-auto mb-2" />
                    <div className="text-3xl font-bold text-orange-500">{stats.average_streak}</div>
                    <div className="text-sm text-slate-500">Avg Streak Days</div>
                  </div>
                  <div className="card-elevated p-5 text-center">
                    <Clock className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                    <div className="text-3xl font-bold text-blue-500">{Math.round(stats.total_fasting_hours)}</div>
                    <div className="text-sm text-slate-500">Total Fast Hours</div>
                  </div>
                </div>

                {/* Leaderboard Preview */}
                <div className="card-elevated p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Trophy className="w-5 h-5 text-amber-500" />
                    <span className="font-semibold text-slate-800">Circle Leaderboard</span>
                  </div>
                  <div className="space-y-2">
                    {members.slice(0, 5).sort((a, b) => b.streak - a.streak).map((member, idx) => (
                      <div key={member.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          idx === 0 ? 'bg-amber-100 text-amber-700' :
                          idx === 1 ? 'bg-slate-100 text-slate-600' :
                          idx === 2 ? 'bg-orange-100 text-orange-700' :
                          'bg-slate-50 text-slate-500'
                        }`}>
                          {idx + 1}
                        </span>
                        <span className="flex-1 font-medium text-slate-700">{member.name}</span>
                        <span className="flex items-center gap-1 text-sm text-orange-500">
                          <Flame className="w-4 h-4" />
                          {member.streak}d
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="card p-6 text-center text-slate-500">
                Unable to load stats
              </div>
            )}
          </motion.div>
        )}

        {/* Activity Tab */}
        {activeTab === 'activity' && (
          <motion.div
            key="activity"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-3"
          >
            {isLoadingActivities ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 text-primary-500 animate-spin" />
              </div>
            ) : activities.length === 0 ? (
              <div className="card p-6 text-center text-slate-500">
                No activity yet
              </div>
            ) : (
              activities.map((activity, index) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50"
                >
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-lg">
                    {getActivityIcon(activity.activity_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700">
                      <span className="font-semibold">{activity.user_name}</span>{' '}
                      {getActivityMessage(activity)}
                    </p>
                    <span className="text-xs text-slate-400">
                      {formatActivityTime(activity.created_at)}
                    </span>
                  </div>
                </motion.div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Leave Circle Button (for non-owners) */}
      {!isOwner && (
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={handleLeaveCircle}
          disabled={isLeaving}
          className="w-full py-3 bg-red-50 text-red-600 rounded-xl font-medium hover:bg-red-100 flex items-center justify-center gap-2"
        >
          {isLeaving ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <LogOut className="w-5 h-5" />
          )}
          Leave Circle
        </motion.button>
      )}
    </div>
  )
}

