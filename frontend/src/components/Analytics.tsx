import { useState, useEffect, lazy, Suspense, memo } from 'react'
import { motion } from 'framer-motion'
import { 
  Clock, Flame, Target, TrendingUp,
  ChevronLeft, ChevronRight, Award, Droplets, Brain, AlertCircle, Loader2
} from 'lucide-react'
import { useAppStore } from '../stores/appStore'
import { api } from '../services/api'
import type { DailyStats } from '../types'

// Lazy load chart components - recharts is heavy
const FastingChart = lazy(() => import('./Charts/FastingChart'))
const WeightChart = lazy(() => import('./Charts/WeightChart'))
const HydrationChart = lazy(() => import('./Charts/HydrationChart'))
const MoodChart = lazy(() => import('./Charts/MoodChart'))

// Lazy load CognitiveTests - only needed when Brain Gym tab is active
const CognitiveTests = lazy(() => import('./CognitiveTests'))

// Chart loading skeleton
const ChartSkeleton = memo(() => (
  <div className="h-64 flex items-center justify-center bg-slate-50 rounded-xl animate-pulse">
    <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
  </div>
))

type TimeRange = '7d' | '30d' | '90d' | 'all'
type AnalyticsTab = 'charts' | 'cognitive'

export default function Analytics() {
  const { currentStreak, totalFasts, totalHours, level, isLoading: appLoading } = useAppStore()
  const [timeRange, setTimeRange] = useState<TimeRange>('7d')
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([])
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [activeChart, setActiveChart] = useState<'fasting' | 'weight' | 'hydration' | 'mood'>('fasting')
  const [activeTab, setActiveTab] = useState<AnalyticsTab>('charts')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch data from server
  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true)
      setError(null)
      
      try {
        const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365
        const response = await api.getDailyStats(days)
        
        if (response.success && response.data) {
          setDailyStats(response.data)
        } else {
          // If API fails, set empty array - no fake data
          setDailyStats([])
          if (response.error) {
            setError(response.error)
          }
        }
      } catch (err) {
        console.error('Failed to fetch stats:', err)
        setDailyStats([])
        setError('Failed to load analytics data')
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchStats()
  }, [timeRange])

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDay = firstDay.getDay()
    
    return { daysInMonth, startingDay }
  }

  const { daysInMonth, startingDay } = getDaysInMonth(currentMonth)

  const getActivityForDay = (day: number) => {
    const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    const stat = dailyStats.find(s => s.date === dateStr)
    if (!stat) return 0
    return stat.fastsCompleted > 0 ? stat.totalFastingHours : 0
  }

  const getHeatmapColor = (hours: number) => {
    if (hours === 0) return 'bg-slate-100'
    if (hours < 12) return 'bg-primary-100'
    if (hours < 16) return 'bg-primary-200'
    if (hours < 20) return 'bg-primary-300'
    return 'bg-primary-400'
  }

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))
  }

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))
  }

  const stats = [
    { label: 'Current Streak', value: currentStreak, suffix: 'days', icon: Flame, gradient: 'from-orange-400 to-red-500' },
    { label: 'Total Fasts', value: totalFasts, suffix: '', icon: Target, gradient: 'from-emerald-400 to-teal-500' },
    { label: 'Total Hours', value: totalHours, suffix: 'hrs', icon: Clock, gradient: 'from-blue-400 to-cyan-500' },
    { label: 'Level', value: level, suffix: '', icon: Award, gradient: 'from-amber-400 to-orange-500' },
  ]

  // Calculate averages from real data - ensure valid numbers
  const avgDuration = totalFasts > 0 ? (Number(totalHours) / Number(totalFasts)).toFixed(1) : '0'
  const completionRate = dailyStats.length > 0 
    ? Math.round((dailyStats.filter(s => (s.fastsCompleted || 0) > 0).length / dailyStats.length) * 100)
    : 0
  
  // Get last 7 days for weekly average
  const last7Days = dailyStats.slice(-7)
  const weeklyTotalHours = last7Days.reduce((acc, d) => acc + Math.max(0, Number(d.totalFastingHours) || 0), 0)
  const weeklyAvg = last7Days.length > 0 ? Math.round(weeklyTotalHours / last7Days.length) : 0

  // Prepare chart data from dailyStats - ensure valid numbers
  const fastingData = dailyStats.map(d => ({
    date: d.date,
    hours: Math.max(0, Number(d.totalFastingHours) || 0), // Ensure non-negative number
    completed: (d.fastsCompleted || 0) > 0
  }))

  const weightData = dailyStats
    .filter(d => d.weight)
    .map(d => ({
      date: d.date,
      weight: Number(d.weight) || 0,
      unit: (d.weightUnit || 'lbs') as 'kg' | 'lbs'
    }))

  const hydrationData = dailyStats.map(d => ({
    date: d.date,
    amount: d.totalHydration || 0,
    goal: d.hydrationGoal || 2500
  }))

  const moodData = {
    mood: dailyStats.length > 0 ? Math.round(dailyStats.reduce((acc, d) => acc + (d.avgMood || 0), 0) / dailyStats.length) : 0,
    energy: dailyStats.length > 0 ? Math.round(dailyStats.reduce((acc, d) => acc + (d.avgEnergy || 0), 0) / dailyStats.length) : 0,
    focus: 0,
    sleep: 0,
    stress: 0
  }

  const chartTabs = [
    { id: 'fasting', label: 'Fasting', icon: Clock },
    { id: 'weight', label: 'Weight', icon: TrendingUp },
    { id: 'hydration', label: 'Hydration', icon: Droplets },
    { id: 'mood', label: 'Wellness', icon: Brain },
  ]

  // Empty state component
  const EmptyState = ({ message }: { message: string }) => (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-16 h-16 mb-4 rounded-2xl bg-slate-100 flex items-center justify-center">
        <AlertCircle className="w-8 h-8 text-slate-400" />
      </div>
      <p className="text-slate-500">{message}</p>
    </div>
  )

  if (appLoading || isLoading) {
    return (
      <div className="py-6 space-y-6">
        <header>
          <h1 className="text-2xl font-bold text-slate-800">Analytics</h1>
          <p className="text-slate-500">Loading your data...</p>
        </header>
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-slate-200 rounded-2xl" />
          <div className="h-64 bg-slate-200 rounded-2xl" />
          <div className="h-48 bg-slate-200 rounded-2xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="py-6 space-y-6">
      {/* Header */}
      <header>
        <h1 className="text-2xl font-bold text-slate-800">Analytics</h1>
        <p className="text-slate-500">Track your fasting journey</p>
      </header>

      {/* Main Tab Selector */}
      <div className="flex gap-2 bg-slate-100 p-1 rounded-2xl">
        <button
          onClick={() => setActiveTab('charts')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all ${
            activeTab === 'charts'
              ? 'bg-white text-slate-800 shadow-md'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Charts & Stats</span>
        </button>
        <button
          onClick={() => setActiveTab('cognitive')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all ${
            activeTab === 'cognitive'
              ? 'bg-white text-slate-800 shadow-md'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Brain className="w-4 h-4" />
          <span>Brain Gym</span>
        </button>
      </div>

      {/* Cognitive Tests Tab - Lazy loaded */}
      {activeTab === 'cognitive' && (
        <Suspense fallback={<div className="py-12 text-center"><Loader2 className="w-8 h-8 text-primary-500 animate-spin mx-auto" /></div>}>
          <CognitiveTests />
        </Suspense>
      )}

      {/* Charts Tab */}
      {activeTab === 'charts' && (
        <>
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Time Range Selector */}
          <div className="flex gap-2">
            {(['7d', '30d', '90d', 'all'] as TimeRange[]).map(range => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  timeRange === range
                    ? 'bg-primary-500 text-white shadow-glow-primary'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {range === 'all' ? 'All Time' : range.replace('d', ' Days')}
              </button>
            ))}
          </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`stat-card bg-gradient-to-br ${stat.gradient} shadow-lg relative overflow-hidden`}
          >
            <stat.icon className="w-5 h-5 text-white/80 mb-2" />
            <div className="text-2xl font-bold text-white">
              {stat.value}
              {stat.suffix && <span className="text-sm ml-1">{stat.suffix}</span>}
            </div>
            <div className="text-sm text-white/80">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="card-elevated">
        {/* Chart Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {chartTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveChart(tab.id as typeof activeChart)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                activeChart === tab.id
                  ? 'bg-slate-800 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Chart Content - Lazy loaded charts */}
        <div className="h-64">
          <Suspense fallback={<ChartSkeleton />}>
            {activeChart === 'fasting' && (
              fastingData.length > 0 
                ? <FastingChart data={fastingData} type="bar" height={240} />
                : <EmptyState message="No fasting data yet. Start a fast to see your progress!" />
            )}
            {activeChart === 'weight' && (
              weightData.length > 0 
                ? <WeightChart data={weightData} goalWeight={70} height={240} />
                : <EmptyState message="No weight data yet. Log your weight to track your progress!" />
            )}
            {activeChart === 'hydration' && (
              hydrationData.some(d => d.amount > 0)
                ? <HydrationChart data={hydrationData} height={240} />
                : <EmptyState message="No hydration data yet. Log your water intake!" />
            )}
            {activeChart === 'mood' && (
              moodData.mood > 0 || moodData.energy > 0
                ? <MoodChart data={moodData} height={240} />
                : <EmptyState message="No wellness data yet. Log your mood to see trends!" />
            )}
          </Suspense>
        </div>

        {/* Chart Legend/Info */}
        {dailyStats.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-3 gap-4">
            {activeChart === 'fasting' && (
              <>
                <div className="text-center">
                  <div className="text-2xl font-bold text-slate-800">{weeklyAvg}h</div>
                  <div className="text-sm text-slate-500">Weekly Avg</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-slate-800">{completionRate}%</div>
                  <div className="text-sm text-slate-500">Completion</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-slate-800">{avgDuration}h</div>
                  <div className="text-sm text-slate-500">Avg Duration</div>
                </div>
              </>
            )}
            {activeChart === 'weight' && weightData.length > 0 && (() => {
              const latestWeight = weightData[weightData.length - 1]
              const firstWeight = weightData[0]
              const weightUnit = latestWeight?.unit || 'lbs'
              const weightChange = weightData.length >= 2 
                ? (firstWeight.weight - latestWeight.weight).toFixed(1)
                : null
              return (
              <>
                <div className="text-center">
                    <div className="text-2xl font-bold text-slate-800">
                      {latestWeight?.weight || '--'}{weightUnit}
                    </div>
                  <div className="text-sm text-slate-500">Current</div>
                </div>
                <div className="text-center">
                    <div className={`text-2xl font-bold ${
                      weightChange && Number(weightChange) > 0 ? 'text-red-500' : 
                      weightChange && Number(weightChange) < 0 ? 'text-emerald-500' : 'text-slate-800'
                    }`}>
                      {weightChange !== null 
                        ? `${Number(weightChange) > 0 ? '+' : ''}${weightChange}${weightUnit}`
                      : '--'}
                  </div>
                  <div className="text-sm text-slate-500">Change</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-slate-800">{weightData.length}</div>
                  <div className="text-sm text-slate-500">Entries</div>
                </div>
              </>
              )
            })()}
            {activeChart === 'hydration' && (
              <>
                <div className="text-center">
                  <div className="text-2xl font-bold text-slate-800">
                    {hydrationData.length > 0 ? `${(hydrationData[hydrationData.length - 1]?.amount / 1000).toFixed(1)}L` : '--'}
                  </div>
                  <div className="text-sm text-slate-500">Today</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-cyan-600">
                    {hydrationData.length > 0 
                      ? `${Math.round((hydrationData.reduce((acc, d) => acc + d.amount, 0) / hydrationData.reduce((acc, d) => acc + d.goal, 0)) * 100)}%`
                      : '--'}
                  </div>
                  <div className="text-sm text-slate-500">Avg Goal %</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-slate-800">
                    {hydrationData.filter(d => d.amount >= d.goal).length}
                  </div>
                  <div className="text-sm text-slate-500">Days on Track</div>
                </div>
              </>
            )}
            {activeChart === 'mood' && (
              <>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{moodData.mood || '--'}</div>
                  <div className="text-sm text-slate-500">Avg Mood</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-slate-800">{moodData.energy || '--'}</div>
                  <div className="text-sm text-slate-500">Avg Energy</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-slate-800">{dailyStats.filter(d => d.avgMood).length}</div>
                  <div className="text-sm text-slate-500">Entries</div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Fasting Calendar Heatmap */}
      <div className="card-elevated">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-800">Fasting Calendar</h3>
          <div className="flex items-center gap-2">
            <button onClick={prevMonth} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
              <ChevronLeft className="w-5 h-5 text-slate-600" />
            </button>
            <span className="text-sm font-medium text-slate-700 min-w-[120px] text-center">
              {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </span>
            <button onClick={nextMonth} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
              <ChevronRight className="w-5 h-5 text-slate-600" />
            </button>
          </div>
        </div>

        {/* Day labels */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
            <div key={i} className="text-center text-xs text-slate-400 py-1 font-medium">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {/* Empty cells for days before month starts */}
          {Array.from({ length: startingDay }).map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square" />
          ))}
          
          {/* Days of the month */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1
            const hours = getActivityForDay(day)
            const isToday = 
              day === new Date().getDate() && 
              currentMonth.getMonth() === new Date().getMonth() &&
              currentMonth.getFullYear() === new Date().getFullYear()
            
            return (
              <motion.div
                key={day}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: i * 0.01 }}
                className={`aspect-square rounded-lg flex items-center justify-center text-xs font-medium transition-colors cursor-pointer hover:ring-2 hover:ring-primary-300 ${
                  getHeatmapColor(hours)
                } ${isToday ? 'ring-2 ring-primary-500 ring-offset-1' : ''} ${
                  hours > 0 ? 'text-primary-700' : 'text-slate-500'
                }`}
                title={`${day}: ${hours}h fasted`}
              >
                {day}
              </motion.div>
            )
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-end gap-2 mt-4 text-xs text-slate-400">
          <span>Less</span>
          <div className="w-3 h-3 rounded bg-slate-100" />
          <div className="w-3 h-3 rounded bg-primary-100" />
          <div className="w-3 h-3 rounded bg-primary-200" />
          <div className="w-3 h-3 rounded bg-primary-300" />
          <div className="w-3 h-3 rounded bg-primary-400" />
          <span>More</span>
        </div>
      </div>

      {/* No Data Message */}
      {dailyStats.length === 0 && !isLoading && !error && (
        <div className="card-elevated text-center py-12">
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-slate-100 flex items-center justify-center">
            <Clock className="w-10 h-10 text-slate-400" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">No Data Yet</h3>
          <p className="text-slate-500 max-w-md mx-auto">
            Start tracking your fasts, weight, and hydration to see your analytics here. 
            Your journey begins with the first step!
          </p>
        </div>
      )}
        </>
      )}
    </div>
  )
}
