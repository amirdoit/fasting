import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Users, Trophy, Target, Flame, Clock, Crown, Medal,
  Plus, Award, TrendingUp, TrendingDown,
  CheckCircle, Lock, Sparkles, Star, Loader2, AlertCircle,
  Calendar, Gift, Heart, UserPlus, Share2, Radio
} from 'lucide-react'
import { useAppStore } from '../stores/appStore'
import { useChallengesStore, type Challenge, type Circle } from '../stores/challengesStore'
import LiveRooms from './LiveRooms'

type TabType = 'challenges' | 'leaderboard' | 'circles'
type LeagueTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond'

interface League {
  tier: LeagueTier
  name: string
  icon: string
  color: string
  gradient: string
  minPoints: number
  maxPoints: number
  promoteCount: number
  demoteCount: number
}

const LEAGUES: League[] = [
  { tier: 'bronze', name: 'Bronze League', icon: '🥉', color: 'from-amber-600 to-amber-800', gradient: 'from-amber-600 via-orange-600 to-amber-800', minPoints: 0, maxPoints: 999, promoteCount: 10, demoteCount: 0 },
  { tier: 'silver', name: 'Silver League', icon: '🥈', color: 'from-slate-400 to-slate-600', gradient: 'from-slate-300 via-slate-400 to-slate-500', minPoints: 1000, maxPoints: 2999, promoteCount: 10, demoteCount: 5 },
  { tier: 'gold', name: 'Gold League', icon: '🥇', color: 'from-amber-400 to-amber-600', gradient: 'from-yellow-400 via-amber-500 to-orange-500', minPoints: 3000, maxPoints: 5999, promoteCount: 10, demoteCount: 5 },
  { tier: 'platinum', name: 'Platinum League', icon: '💎', color: 'from-cyan-400 to-blue-500', gradient: 'from-cyan-300 via-blue-400 to-indigo-500', minPoints: 6000, maxPoints: 9999, promoteCount: 5, demoteCount: 5 },
  { tier: 'diamond', name: 'Diamond League', icon: '👑', color: 'from-purple-400 to-pink-500', gradient: 'from-purple-400 via-fuchsia-500 to-pink-500', minPoints: 10000, maxPoints: Infinity, promoteCount: 0, demoteCount: 5 },
]

// Calculate current league based on points
const getCurrentLeague = (points: number): League => {
  for (let i = LEAGUES.length - 1; i >= 0; i--) {
    if (points >= LEAGUES[i].minPoints) {
      return LEAGUES[i]
    }
  }
  return LEAGUES[0]
}

// Calculate days until league reset (Sunday)
const getDaysUntilReset = (): number => {
  const now = new Date()
  const daysUntilSunday = (7 - now.getDay()) % 7
  return daysUntilSunday === 0 ? 7 : daysUntilSunday
}

// Calculate time remaining from end_date
const getTimeRemaining = (endDate: string): string => {
  const end = new Date(endDate)
  const now = new Date()
  const diff = end.getTime() - now.getTime()
  
  if (diff <= 0) return 'Ended'
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  
  if (days > 0) return `${days} day${days > 1 ? 's' : ''}`
  return `${hours} hour${hours > 1 ? 's' : ''}`
}

// Loading component
const LoadingState = ({ message }: { message: string }) => (
  <div className="flex flex-col items-center justify-center py-12">
    <Loader2 className="w-8 h-8 text-primary-500 animate-spin mb-3" />
    <p className="text-slate-500">{message}</p>
  </div>
)

// Error component
const ErrorState = ({ message, onRetry }: { message: string; onRetry: () => void }) => (
  <div className="flex flex-col items-center justify-center py-12">
    <AlertCircle className="w-12 h-12 text-red-400 mb-3" />
    <p className="text-slate-600 mb-4">{message}</p>
    <button onClick={onRetry} className="btn-primary">Try Again</button>
  </div>
)

// Empty state component
const EmptyState = ({ title, message, icon: Icon }: { title: string; message: string; icon: React.ElementType }) => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
      <Icon className="w-8 h-8 text-slate-400" />
    </div>
    <h3 className="font-semibold text-slate-800 mb-2">{title}</h3>
    <p className="text-slate-500 max-w-sm">{message}</p>
  </div>
)

export default function Social() {
  const [activeTab, setActiveTab] = useState<TabType>('challenges')
  const [showLiveRooms, setShowLiveRooms] = useState(false)
  const { showToast, points } = useAppStore()
  const { 
    challenges, 
    leaderboard, 
    circles,
    isLoading, 
    error, 
    fetchChallenges, 
    fetchLeaderboard,
    fetchCircles,
    joinChallenge 
  } = useChallengesStore()
  
  const currentLeague = getCurrentLeague(points)
  const daysUntilReset = getDaysUntilReset()

  // Fetch data on mount
  useEffect(() => {
    fetchChallenges()
    fetchLeaderboard()
    fetchCircles()
  }, [fetchChallenges, fetchLeaderboard, fetchCircles])

  const handleJoinChallenge = async (challenge: Challenge) => {
    const success = await joinChallenge(challenge)
    if (success) {
      showToast(`Joined "${challenge.title}"! 🎯`, 'success')
    } else {
      showToast('Failed to join challenge. You may have already joined.', 'error')
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'daily': return 'bg-emerald-100 text-emerald-700'
      case 'weekly': return 'bg-blue-100 text-blue-700'
      case 'monthly': return 'bg-purple-100 text-purple-700'
      case 'special': return 'bg-amber-100 text-amber-700'
      default: return 'bg-slate-100 text-slate-700'
    }
  }

  const tabs = [
    { id: 'challenges', label: 'Challenges', icon: Target },
    { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
    { id: 'circles', label: 'Circles', icon: Users },
  ]

  // Find current user in leaderboard
  const currentUserEntry = leaderboard.find(u => u.isCurrentUser)
  const currentUserRank = currentUserEntry?.rank || 0
  const nextUserPoints = currentUserRank > 1 
    ? leaderboard.find(u => u.rank === currentUserRank - 1)?.points || 0
    : 0
  const pointsToNextRank = nextUserPoints > 0 ? nextUserPoints - (currentUserEntry?.points || 0) : 0

  return (
    <div className="py-6 space-y-6">
      {/* Header */}
      <header className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Community</h1>
          <p className="text-slate-500">Compete, connect, and celebrate together</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowLiveRooms(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl shadow-lg shadow-blue-500/30 font-medium text-sm"
        >
          <Radio className="w-4 h-4" />
          <span>Live Rooms</span>
          <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
        </motion.button>
      </header>

      {/* Tabs */}
      <div className="flex gap-2 bg-slate-100 p-1 rounded-2xl">
        {tabs.map(tab => (
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

      {/* Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'challenges' && (
          <motion.div
            key="challenges"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {isLoading ? (
              <LoadingState message="Loading challenges..." />
            ) : error ? (
              <ErrorState message={error} onRetry={fetchChallenges} />
            ) : challenges.length === 0 ? (
              <EmptyState 
                title="No Challenges Available" 
                message="Check back soon for new challenges to join!"
                icon={Target}
              />
            ) : (
              <>
                {/* Stats Banner */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-gradient-to-br from-orange-400 to-red-500 rounded-2xl p-4 text-white text-center">
                    <div className="text-2xl font-bold">{challenges.filter(c => c.isJoined).length}</div>
                    <div className="text-xs text-white/80">Joined</div>
                  </div>
                  <div className="bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl p-4 text-white text-center">
                    <div className="text-2xl font-bold">{challenges.filter(c => (c.progress || 0) >= c.target).length}</div>
                    <div className="text-xs text-white/80">Completed</div>
                  </div>
                  <div className="bg-gradient-to-br from-purple-400 to-pink-500 rounded-2xl p-4 text-white text-center">
                    <div className="text-2xl font-bold">
                      {challenges.reduce((acc, c) => acc + (c.reward || 0), 0).toLocaleString()}
                    </div>
                    <div className="text-xs text-white/80">Total XP</div>
                  </div>
                </div>

                {/* Active Challenges Header */}
                <div className="flex items-center justify-between">
                  <h2 className="font-bold text-lg text-slate-800">🎯 Active Challenges</h2>
                  <span className="px-3 py-1 bg-primary-100 text-primary-700 text-sm rounded-full font-medium">
                    {challenges.length} available
                  </span>
                </div>

                {challenges.map((challenge, index) => {
                  const progress = challenge.progress || 0
                  const target = challenge.target
                  const isCompleted = progress >= target
                  const progressPercent = Math.min((progress / target) * 100, 100)
                  const timeRemaining = getTimeRemaining(challenge.end_date)
                  
                  // Dynamic gradient based on challenge type
                  const getGradient = () => {
                    switch (challenge.type) {
                      case 'daily': return 'from-emerald-500 to-teal-500'
                      case 'weekly': return 'from-blue-500 to-indigo-500'
                      case 'monthly': return 'from-purple-500 to-pink-500'
                      case 'special': return 'from-amber-500 to-orange-500'
                      default: return 'from-slate-500 to-slate-600'
                    }
                  }
                  
                  return (
                    <motion.div
                      key={challenge.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="relative overflow-hidden"
                    >
                      {/* Gradient Border Container */}
                      <div className={`relative bg-gradient-to-br ${getGradient()} p-[2px] rounded-[24px] shadow-lg ${
                        isCompleted ? 'shadow-emerald-500/30' : ''
                      }`}>
                        <div className={`bg-white rounded-[22px] p-5 relative ${
                          isCompleted ? 'bg-gradient-to-br from-emerald-50 to-white' : ''
                        }`}>
                          {/* Completed Badge */}
                          {isCompleted && (
                            <div className="absolute top-3 right-3">
                              <div className="bg-emerald-500 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" />
                                COMPLETED
                              </div>
                            </div>
                          )}
                          
                      <div className="flex items-start gap-4">
                            {/* Challenge Icon */}
                            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${getGradient()} flex items-center justify-center text-2xl shadow-lg`}>
                              {challenge.icon}
                            </div>
                            
                        <div className="flex-1 min-w-0">
                              {/* Title & Type */}
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <h3 className="font-bold text-slate-800 text-lg">{challenge.title}</h3>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide ${getTypeColor(challenge.type)}`}>
                              {challenge.type}
                            </span>
                          </div>
                              
                              <p className="text-sm text-slate-500 mb-4">{challenge.description}</p>
                          
                              {/* Progress Bar */}
                              <div className="mb-3">
                                <div className="flex justify-between text-sm mb-2">
                                  <span className="text-slate-600 font-medium">
                                {progress} / {target} {challenge.unit}
                              </span>
                                  <span className={`font-bold ${isCompleted ? 'text-emerald-600' : 'text-primary-600'}`}>
                                    {Math.round(progressPercent)}%
                              </span>
                            </div>
                                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                    animate={{ width: `${progressPercent}%` }}
                                    transition={{ duration: 0.8, ease: "easeOut" }}
                                    className={`h-full rounded-full ${isCompleted 
                                      ? 'bg-gradient-to-r from-emerald-400 to-emerald-600' 
                                      : `bg-gradient-to-r ${getGradient()}`
                                    }`}
                              />
                            </div>
                          </div>

                              {/* Footer Stats */}
                          <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                  <span className="flex items-center gap-1.5 text-slate-500 text-sm">
                                    <Users className="w-4 h-4" />
                                    <span className="font-medium">{(challenge.participants || 0).toLocaleString()}</span>
                              </span>
                                  <span className="flex items-center gap-1.5 text-slate-500 text-sm">
                                    <Calendar className="w-4 h-4" />
                                    <span className="font-medium">{timeRemaining}</span>
                              </span>
                            </div>
                                <div className="flex items-center gap-3">
                                  <span className="flex items-center gap-1 bg-amber-100 text-amber-700 px-2.5 py-1 rounded-lg text-sm font-bold">
                                    <Gift className="w-4 h-4" />
                                +{challenge.reward} XP
                              </span>
                                  {!challenge.isJoined && !isCompleted && (
                                    <motion.button
                                      whileHover={{ scale: 1.05 }}
                                      whileTap={{ scale: 0.95 }}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleJoinChallenge(challenge)
                                  }}
                                      className={`bg-gradient-to-r ${getGradient()} text-white py-2 px-4 rounded-xl text-sm font-bold shadow-md`}
                                >
                                      Join Now
                                    </motion.button>
                              )}
                                  {challenge.isJoined && !isCompleted && (
                                    <span className="text-primary-600 text-sm font-medium flex items-center gap-1">
                                      <CheckCircle className="w-4 h-4" />
                                      Joined
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}

                {/* Create Challenge */}
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="w-full relative bg-gradient-to-br from-slate-100 via-white to-slate-100 border-2 border-dashed border-slate-300 hover:border-primary-400 hover:from-primary-50 hover:to-white rounded-2xl py-8 transition-all group"
                >
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-200 to-slate-300 group-hover:from-primary-400 group-hover:to-primary-500 flex items-center justify-center transition-all">
                      <Plus className="w-7 h-7 text-slate-500 group-hover:text-white transition-colors" />
                    </div>
                    <div>
                      <span className="font-bold text-slate-600 group-hover:text-primary-600 transition-colors block">Create Custom Challenge</span>
                      <span className="text-sm text-slate-400">Challenge yourself or invite friends</span>
                    </div>
                  </div>
                </motion.button>
              </>
            )}
          </motion.div>
        )}

        {activeTab === 'leaderboard' && (
          <motion.div
            key="leaderboard"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {isLoading ? (
              <LoadingState message="Loading leaderboard..." />
            ) : error ? (
              <ErrorState message={error} onRetry={fetchLeaderboard} />
            ) : leaderboard.length === 0 ? (
              <EmptyState 
                title="No Rankings Yet" 
                message="Start fasting to appear on the leaderboard!"
                icon={Trophy}
              />
            ) : (
              <>
                {/* Current League Banner - Enhanced */}
                <div className={`relative overflow-hidden rounded-[28px] bg-gradient-to-br ${currentLeague.gradient} p-[2px] shadow-2xl`}>
                  <div className="bg-gradient-to-br from-black/20 to-transparent rounded-[26px] p-6 text-white relative">
                    {/* Background decoration */}
                    <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/10 rounded-full blur-2xl" />
                    
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                          <motion.div 
                            className="text-6xl"
                            animate={{ rotate: [0, 5, -5, 0], scale: [1, 1.1, 1] }}
                            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                          >
                            {currentLeague.icon}
                          </motion.div>
                      <div>
                            <h3 className="font-black text-2xl tracking-tight">{currentLeague.name}</h3>
                            <p className="text-white/80 font-medium">
                              <span className="text-2xl font-bold text-white">{points.toLocaleString()}</span> XP this week
                        </p>
                      </div>
                    </div>
                        <div className="text-right bg-white/20 backdrop-blur-sm rounded-2xl px-4 py-2">
                          <div className="flex items-center gap-2 text-sm font-medium">
                        <Clock className="w-4 h-4" />
                            <span>{daysUntilReset} days left</span>
                      </div>
                          <div className="text-xs text-white/70">until reset</div>
                    </div>
                  </div>
                  
                  {/* Promotion/Demotion Info */}
                      <div className="flex items-center justify-between bg-black/20 backdrop-blur-sm rounded-xl px-4 py-3">
                        {currentLeague.promoteCount > 0 ? (
                      <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-emerald-500/30 flex items-center justify-center">
                        <TrendingUp className="w-4 h-4 text-emerald-300" />
                            </div>
                            <div>
                              <span className="font-semibold">Top {currentLeague.promoteCount}</span>
                              <span className="text-white/70 text-sm ml-1">promote</span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-amber-500/30 flex items-center justify-center">
                              <Crown className="w-4 h-4 text-amber-300" />
                            </div>
                            <span className="font-semibold">You're at the top! 👑</span>
                      </div>
                    )}
                    {currentLeague.demoteCount > 0 && (
                      <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-red-500/30 flex items-center justify-center">
                        <TrendingDown className="w-4 h-4 text-red-300" />
                            </div>
                            <div>
                              <span className="font-semibold">Bottom {currentLeague.demoteCount}</span>
                              <span className="text-white/70 text-sm ml-1">demote</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* League Tiers - Enhanced */}
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  {LEAGUES.map((league, idx) => {
                    const isCurrentLeague = league.tier === currentLeague.tier
                    const isPastLeague = LEAGUES.findIndex(l => l.tier === currentLeague.tier) > idx
                    
                    return (
                      <motion.div 
                      key={league.tier}
                        whileHover={{ scale: 1.02 }}
                        className={`flex-shrink-0 px-4 py-3 rounded-2xl border-2 flex items-center gap-2 transition-all ${
                          isCurrentLeague
                            ? `border-transparent bg-gradient-to-br ${league.gradient} text-white shadow-lg`
                            : isPastLeague
                            ? 'border-emerald-200 bg-emerald-50'
                          : 'border-slate-200 bg-white'
                      }`}
                    >
                        <span className="text-2xl">{league.icon}</span>
                        <span className={`text-sm font-bold ${
                          isCurrentLeague ? 'text-white' : isPastLeague ? 'text-emerald-700' : 'text-slate-600'
                      }`}>
                        {league.name.replace(' League', '')}
                      </span>
                        {isCurrentLeague && (
                          <Star className="w-4 h-4 text-white fill-white" />
                        )}
                        {isPastLeague && (
                          <CheckCircle className="w-4 h-4 text-emerald-500" />
                      )}
                      </motion.div>
                    )
                  })}
                </div>

                {/* Top 3 Podium - Enhanced */}
                {leaderboard.length >= 3 && (
                  <div className="relative bg-gradient-to-br from-amber-100 via-yellow-50 to-orange-100 rounded-[28px] p-6 border border-amber-200/50 overflow-hidden">
                    {/* Decorative elements */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-amber-400/20 rounded-full blur-3xl" />
                    <Sparkles className="absolute top-4 left-4 w-6 h-6 text-amber-400/50" />
                    <Sparkles className="absolute top-8 right-8 w-4 h-4 text-amber-500/50" />
                    
                    <div className="relative z-10 flex items-end justify-center gap-3 pt-4 pb-2">
                      {/* 2nd Place */}
                      <motion.div 
                        className="flex flex-col items-center"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                      >
                        <div className="relative mb-3">
                          <div className="w-18 h-18 rounded-full bg-gradient-to-br from-slate-200 via-slate-300 to-slate-400 p-[3px] shadow-xl">
                            <div className="w-full h-full rounded-full overflow-hidden bg-white flex items-center justify-center">
                          {leaderboard[1]?.avatar ? (
                                <img src={leaderboard[1].avatar} alt="" className="w-16 h-16 object-cover" />
                              ) : <span className="text-3xl">🥈</span>}
                            </div>
                          </div>
                          <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-slate-400 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">
                            2
                          </div>
                        </div>
                        <span className="font-bold text-slate-700 text-sm truncate max-w-[80px]">{leaderboard[1]?.name}</span>
                        <span className="text-xs text-slate-500 font-medium">{leaderboard[1]?.points?.toLocaleString()} XP</span>
                        <div className="mt-3 h-20 w-24 bg-gradient-to-b from-slate-300 to-slate-400 rounded-t-2xl flex items-center justify-center shadow-inner">
                          <Medal className="w-8 h-8 text-white/80" />
                        </div>
                      </motion.div>

                      {/* 1st Place */}
                      <motion.div 
                        className="flex flex-col items-center -mt-8"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                      >
                        <motion.div 
                          className="relative mb-3"
                          animate={{ y: [0, -4, 0] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          <Crown className="absolute -top-5 left-1/2 -translate-x-1/2 w-8 h-8 text-amber-500" />
                          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-yellow-300 via-amber-400 to-orange-500 p-[4px] shadow-2xl ring-4 ring-amber-200/50">
                            <div className="w-full h-full rounded-full overflow-hidden bg-white flex items-center justify-center">
                            {leaderboard[0]?.avatar ? (
                                <img src={leaderboard[0].avatar} alt="" className="w-20 h-20 object-cover" />
                              ) : <span className="text-4xl">👑</span>}
                            </div>
                          </div>
                          <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                            1
                        </div>
                        </motion.div>
                        <span className="font-black text-slate-800 truncate max-w-[100px]">{leaderboard[0]?.name}</span>
                        <span className="text-sm text-amber-600 font-bold">{leaderboard[0]?.points?.toLocaleString()} XP</span>
                        <div className="mt-3 h-28 w-28 bg-gradient-to-b from-amber-400 via-amber-500 to-orange-500 rounded-t-2xl flex items-center justify-center shadow-lg">
                          <Trophy className="w-10 h-10 text-white" />
                        </div>
                      </motion.div>

                      {/* 3rd Place */}
                      <motion.div 
                        className="flex flex-col items-center"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                      >
                        <div className="relative mb-3">
                          <div className="w-18 h-18 rounded-full bg-gradient-to-br from-amber-500 via-amber-600 to-amber-800 p-[3px] shadow-xl">
                            <div className="w-full h-full rounded-full overflow-hidden bg-white flex items-center justify-center">
                          {leaderboard[2]?.avatar ? (
                                <img src={leaderboard[2].avatar} alt="" className="w-16 h-16 object-cover" />
                              ) : <span className="text-3xl">🥉</span>}
                            </div>
                          </div>
                          <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-amber-700 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">
                            3
                          </div>
                        </div>
                        <span className="font-bold text-slate-700 text-sm truncate max-w-[80px]">{leaderboard[2]?.name}</span>
                        <span className="text-xs text-slate-500 font-medium">{leaderboard[2]?.points?.toLocaleString()} XP</span>
                        <div className="mt-3 h-16 w-24 bg-gradient-to-b from-amber-600 to-amber-800 rounded-t-2xl flex items-center justify-center shadow-inner">
                          <Medal className="w-7 h-7 text-amber-200/80" />
                        </div>
                      </motion.div>
                    </div>
                  </div>
                )}

                {/* Leaderboard List - Enhanced */}
                <div className="bg-white rounded-[24px] shadow-lg border border-slate-100 overflow-hidden">
                  <div className="p-4 bg-slate-50 border-b border-slate-100">
                    <h3 className="font-bold text-slate-800">🏅 Rankings</h3>
                  </div>
                  <div className="divide-y divide-slate-100">
                  {leaderboard.slice(3).map((user, index) => (
                    <motion.div
                      key={user.rank}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className={`flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors ${
                          user.isCurrentUser ? 'bg-gradient-to-r from-primary-50 to-white border-l-4 border-primary-500' : ''
                      }`}
                    >
                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-slate-600">
                          {user.rank}
                      </div>
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-lg overflow-hidden shadow-md">
                        {user.avatar ? (
                          <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                          ) : <span className="font-bold text-slate-600">{user.name.charAt(0)}</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <span className={`font-bold ${user.isCurrentUser ? 'text-primary-700' : 'text-slate-800'}`}>
                            {user.name}
                          </span>
                          {user.isCurrentUser && (
                              <span className="px-2 py-0.5 bg-primary-500 text-white text-xs rounded-full font-bold">
                                YOU
                            </span>
                          )}
                        </div>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="flex items-center gap-1 text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">
                              <Flame className="w-3 h-3" />
                              {user.streak}d
                          </span>
                            <span className="flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                              <Clock className="w-3 h-3" />
                            {user.totalHours}h
                          </span>
                            <span className="flex items-center gap-1 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">
                              <Award className="w-3 h-3" />
                            Lv.{user.level}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                          <div className="font-black text-lg text-slate-800">{user.points?.toLocaleString()}</div>
                          <div className="text-xs text-slate-500 font-medium">XP</div>
                      </div>
                    </motion.div>
                  ))}
                  </div>
                </div>

                {/* Your Rank Card - Enhanced */}
                {currentUserEntry && (
                  <div className="relative bg-gradient-to-br from-primary-500 via-primary-600 to-indigo-600 rounded-[24px] p-6 text-white overflow-hidden shadow-xl">
                    {/* Background decoration */}
                    <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full blur-2xl" />
                    
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-4">
                      <div>
                          <p className="text-white/70 text-sm font-medium">Your Current Rank</p>
                          <div className="flex items-baseline gap-1">
                            <span className="text-5xl font-black">#{currentUserRank}</span>
                            <span className="text-white/60 text-sm">of {leaderboard.length}</span>
                          </div>
                      </div>
                      <div className="text-right">
                          <p className="text-white/70 text-sm font-medium">Points to rank up</p>
                          <p className="text-3xl font-black">{pointsToNextRank > 0 ? pointsToNextRank.toLocaleString() : '—'}</p>
                          <p className="text-xs text-white/60">XP needed</p>
                        </div>
                      </div>
                      
                      {pointsToNextRank > 0 && (
                        <div>
                          <div className="flex justify-between text-xs text-white/70 mb-2">
                            <span>{currentUserEntry.points.toLocaleString()} XP</span>
                            <span>{nextUserPoints.toLocaleString()} XP</span>
                    </div>
                          <div className="h-3 bg-white/20 rounded-full overflow-hidden">
                            <motion.div 
                              className="h-full bg-gradient-to-r from-white to-amber-200 rounded-full"
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.min(((currentUserEntry.points) / nextUserPoints) * 100, 100)}%` }}
                              transition={{ duration: 1, ease: "easeOut" }}
                            />
                          </div>
                        </div>
                      )}
                      
                      {pointsToNextRank <= 0 && (
                        <div className="flex items-center gap-2 bg-white/20 rounded-xl px-4 py-2">
                          <Crown className="w-5 h-5 text-amber-300" />
                          <span className="font-bold">You're #1! Keep dominating! 👑</span>
                      </div>
                    )}
                    </div>
                  </div>
                )}
              </>
            )}
          </motion.div>
        )}

        {activeTab === 'circles' && (
          <motion.div
            key="circles"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {isLoading ? (
              <LoadingState message="Loading circles..." />
            ) : circles.length === 0 ? (
              <>
                {/* Coming Soon - Enhanced */}
                <div className="relative bg-gradient-to-br from-purple-500 via-fuchsia-500 to-pink-500 rounded-[28px] p-[2px] shadow-2xl overflow-hidden">
                  <div className="bg-gradient-to-br from-purple-50 via-white to-fuchsia-50 rounded-[26px] py-12 px-6 text-center relative">
                    {/* Background decoration */}
                    <div className="absolute top-0 left-1/4 w-32 h-32 bg-purple-200/50 rounded-full blur-3xl" />
                    <div className="absolute bottom-0 right-1/4 w-40 h-40 bg-pink-200/50 rounded-full blur-3xl" />
                    
                    <div className="relative z-10">
                      <motion.div 
                        className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-purple-500 via-fuchsia-500 to-pink-500 flex items-center justify-center shadow-xl shadow-purple-500/30"
                        animate={{ rotate: [0, 5, -5, 0], scale: [1, 1.05, 1] }}
                        transition={{ duration: 4, repeat: Infinity }}
                      >
                        <Heart className="w-10 h-10 text-white" />
                      </motion.div>
                      
                      <h3 className="text-2xl font-black text-slate-800 mb-3">Fasting Circles</h3>
                      <p className="text-slate-600 max-w-md mx-auto mb-8 leading-relaxed">
                        Create private groups with friends and family to fast together, share your progress, and motivate each other on the journey!
                  </p>
                      
                      <div className="flex flex-wrap justify-center gap-3 mb-8">
                        {[
                          { icon: Users, label: 'Private groups', color: 'from-purple-500 to-purple-600' },
                          { icon: Target, label: 'Group challenges', color: 'from-fuchsia-500 to-fuchsia-600' },
                          { icon: Trophy, label: 'Shared leaderboard', color: 'from-pink-500 to-pink-600' },
                          { icon: Share2, label: 'Progress sharing', color: 'from-violet-500 to-violet-600' },
                        ].map((feature, idx) => (
                          <motion.div 
                            key={feature.label}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="flex items-center gap-2 px-4 py-2.5 bg-white rounded-xl shadow-md border border-slate-100"
                          >
                            <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${feature.color} flex items-center justify-center`}>
                              <feature.icon className="w-4 h-4 text-white" />
                    </div>
                            <span className="text-sm font-semibold text-slate-700">{feature.label}</span>
                          </motion.div>
                        ))}
                    </div>
                      
                      <motion.button 
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="bg-gradient-to-r from-purple-500 via-fuchsia-500 to-pink-500 text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-xl shadow-purple-500/30 flex items-center gap-2 mx-auto"
                      >
                        <span>🔔</span>
                        <span>Notify Me When Ready</span>
                      </motion.button>
                    </div>
                  </div>
                </div>

                {/* Preview Cards - Enhanced */}
                <h3 className="font-bold text-slate-700 mt-6 mb-3 flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Coming Soon Preview
                </h3>
                <div className="grid grid-cols-1 gap-4 opacity-60">
                  {[
                    { name: 'Family Fasters', members: 5, icon: '👨‍👩‍👧‍👦', gradient: 'from-blue-400 to-indigo-500', streak: 12 },
                    { name: 'Gym Buddies', members: 12, icon: '💪', gradient: 'from-emerald-400 to-teal-500', streak: 8 },
                    { name: 'Office Warriors', members: 8, icon: '🏢', gradient: 'from-orange-400 to-red-500', streak: 15 },
                  ].map((circle, idx) => (
                    <div key={idx} className={`bg-gradient-to-br ${circle.gradient} p-[2px] rounded-2xl`}>
                      <div className="bg-white rounded-[14px] p-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${circle.gradient} flex items-center justify-center text-2xl shadow-lg`}>
                            {circle.icon}
                      </div>
                          <div className="flex-1">
                            <h3 className="font-bold text-slate-800">{circle.name}</h3>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="flex items-center gap-1 text-xs text-slate-500">
                                <Users className="w-3 h-3" />
                                {circle.members} members
                              </span>
                              <span className="flex items-center gap-1 text-xs text-orange-500">
                                <Flame className="w-3 h-3" />
                                {circle.streak} day streak
                              </span>
                    </div>
                  </div>
                          <Lock className="w-5 h-5 text-slate-300" />
                      </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              /* Real circles when available */
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-bold text-lg text-slate-800">👥 Your Circles</h2>
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 text-white py-2 px-4 rounded-xl text-sm font-bold shadow-lg shadow-purple-500/20 flex items-center gap-1"
                  >
                    <UserPlus className="w-4 h-4" />
                    Create Circle
                  </motion.button>
                </div>
                {circles.map((circle: Circle, idx) => (
                  <motion.div 
                    key={circle.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="bg-gradient-to-br from-purple-500 to-pink-500 p-[2px] rounded-2xl shadow-lg"
                  >
                    <div className="bg-white rounded-[14px] p-4">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-2xl shadow-lg">
                        {circle.icon}
                      </div>
                      <div className="flex-1">
                          <h3 className="font-bold text-slate-800 text-lg">{circle.name}</h3>
                        <p className="text-sm text-slate-500">{circle.members} members</p>
                      </div>
                      {circle.isJoined ? (
                          <span className="px-4 py-2 bg-emerald-100 text-emerald-700 text-sm rounded-xl font-bold flex items-center gap-1">
                            <CheckCircle className="w-4 h-4" />
                          Joined
                        </span>
                      ) : (
                          <motion.button 
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="bg-gradient-to-r from-purple-500 to-pink-500 text-white py-2 px-4 rounded-xl text-sm font-bold"
                          >
                            Join
                          </motion.button>
                        )}
                      </div>
                      {circle.description && (
                        <p className="mt-3 text-sm text-slate-500 pl-[72px]">{circle.description}</p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Live Rooms Modal */}
      <AnimatePresence>
        {showLiveRooms && (
          <LiveRooms onClose={() => setShowLiveRooms(false)} />
        )}
      </AnimatePresence>
    </div>
  )
}
