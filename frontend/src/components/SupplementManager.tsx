import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, Plus, Pill, Clock, AlertTriangle, Check,
  Bell, BellOff, Trash2, Info, Search
} from 'lucide-react'
import { useFastingStore } from '../stores/fastingStore'
import { useAppStore } from '../stores/appStore'
import supplementsData from '../data/supplements.json'

interface SupplementManagerProps {
  onClose?: () => void
  isModal?: boolean
}

interface UserSupplement {
  id: string
  supplementId: string
  customName?: string
  reminderEnabled: boolean
  addedAt: string
}

type TimingType = 'with_meal' | 'with_fat' | 'anytime' | 'during_fast' | 'breaks_fast' | 'before_meal' | 'with_vitamin_c' | 'bedtime'

const TIMING_COLORS: Record<TimingType, { bg: string; text: string; border: string }> = {
  with_meal: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  with_fat: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  anytime: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  during_fast: { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200' },
  breaks_fast: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  before_meal: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  with_vitamin_c: { bg: 'bg-lime-50', text: 'text-lime-700', border: 'border-lime-200' },
  bedtime: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
}

export default function SupplementManager({ onClose, isModal = false }: SupplementManagerProps) {
  const { showToast } = useAppStore()
  const { isActive, getElapsedTime, targetHours } = useFastingStore()
  
  const [userSupplements, setUserSupplements] = useState<UserSupplement[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  // Load user supplements from localStorage (will be moved to API later)
  useEffect(() => {
    const saved = localStorage.getItem('fasttrack_user_supplements')
    if (saved) {
      setUserSupplements(JSON.parse(saved))
    }
  }, [])

  // Save user supplements
  const saveSupplements = (supplements: UserSupplement[]) => {
    setUserSupplements(supplements)
    localStorage.setItem('fasttrack_user_supplements', JSON.stringify(supplements))
  }

  // Get current fasting state for timing recommendations
  const getFastingState = () => {
    if (!isActive) return 'not_fasting'
    const elapsed = getElapsedTime()
    const hours = elapsed / (1000 * 60 * 60)
    const remaining = targetHours - hours
    if (remaining <= 1) return 'ending_soon'
    return 'fasting'
  }

  const fastingState = getFastingState()

  // Get supplement details
  const getSupplementInfo = (supplementId: string) => {
    return supplementsData.supplements.find(s => s.id === supplementId)
  }

  // Get timing recommendation for current state
  const getTimingRecommendation = (supplement: typeof supplementsData.supplements[0]) => {
    const timing = supplement.timing as TimingType
    
    if (fastingState === 'not_fasting') {
      if (timing === 'during_fast') {
        return { text: 'Best during fasting window', urgent: false }
      }
      return { text: 'Good time to take', urgent: false }
    }
    
    if (fastingState === 'fasting') {
      if (timing === 'during_fast' || timing === 'anytime') {
        return { text: '✓ Safe to take now', urgent: false }
      }
      if (timing === 'breaks_fast') {
        return { text: '⚠️ Will break your fast!', urgent: true }
      }
      if (supplement.requires_food) {
        return { text: `⏰ Wait for eating window`, urgent: false }
      }
    }
    
    if (fastingState === 'ending_soon') {
      if (timing === 'before_meal') {
        return { text: '⏰ Take now! 30 min before eating', urgent: true }
      }
      if (supplement.requires_food) {
        return { text: '⏰ Take soon with first meal', urgent: true }
      }
    }
    
    return { text: supplement.timing_label, urgent: false }
  }

  // Add supplement to user list
  const addSupplement = (supplementId: string) => {
    if (userSupplements.some(s => s.supplementId === supplementId)) {
      showToast('Already in your list', 'info')
      return
    }
    
    const newSupplement: UserSupplement = {
      id: `${supplementId}-${Date.now()}`,
      supplementId,
      reminderEnabled: true,
      addedAt: new Date().toISOString()
    }
    
    saveSupplements([...userSupplements, newSupplement])
    showToast('Supplement added!', 'success')
    setShowAddModal(false)
  }

  // Remove supplement from user list
  const removeSupplement = (id: string) => {
    saveSupplements(userSupplements.filter(s => s.id !== id))
    showToast('Supplement removed', 'info')
  }

  // Toggle reminder
  const toggleReminder = (id: string) => {
    saveSupplements(userSupplements.map(s => 
      s.id === id ? { ...s, reminderEnabled: !s.reminderEnabled } : s
    ))
  }

  // Filter supplements for add modal
  const filteredSupplements = supplementsData.supplements.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = !selectedCategory || s.category === selectedCategory
    const notAlreadyAdded = !userSupplements.some(us => us.supplementId === s.id)
    return matchesSearch && matchesCategory && notAlreadyAdded
  })

  // Group user supplements by timing category
  const groupedSupplements = {
    duringFast: userSupplements.filter(us => {
      const info = getSupplementInfo(us.supplementId)
      return info && (info.timing === 'during_fast' || info.timing === 'anytime')
    }),
    withMeal: userSupplements.filter(us => {
      const info = getSupplementInfo(us.supplementId)
      return info && (info.timing === 'with_meal' || info.timing === 'with_fat' || info.timing === 'with_vitamin_c')
    }),
    special: userSupplements.filter(us => {
      const info = getSupplementInfo(us.supplementId)
      return info && (info.timing === 'breaks_fast' || info.timing === 'before_meal' || info.timing === 'bedtime')
    })
  }

  const content = (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center">
            <Pill className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Supplement Guard</h2>
            <p className="text-sm text-slate-500">Smart timing for your supplements</p>
          </div>
        </div>
        {isModal && onClose && (
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        )}
      </div>

      {/* Current Status Banner */}
      <div className={`p-4 rounded-2xl ${
        fastingState === 'fasting' 
          ? 'bg-gradient-to-r from-emerald-50 to-cyan-50 border border-emerald-200'
          : fastingState === 'ending_soon'
          ? 'bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200'
          : 'bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-200'
      }`}>
        <div className="flex items-center gap-3">
          <Clock className={`w-5 h-5 ${
            fastingState === 'fasting' ? 'text-emerald-500' :
            fastingState === 'ending_soon' ? 'text-amber-500' : 'text-slate-500'
          }`} />
          <div>
            <p className={`font-medium ${
              fastingState === 'fasting' ? 'text-emerald-700' :
              fastingState === 'ending_soon' ? 'text-amber-700' : 'text-slate-700'
            }`}>
              {fastingState === 'fasting' ? 'Currently Fasting' :
               fastingState === 'ending_soon' ? 'Fast Ending Soon' :
               'Not Currently Fasting'}
            </p>
            <p className="text-sm text-slate-500">
              {fastingState === 'fasting' 
                ? 'Only take fasting-safe supplements'
                : fastingState === 'ending_soon'
                ? 'Prepare your supplements for your first meal'
                : 'You can take all supplements now'}
            </p>
          </div>
        </div>
      </div>

      {/* User Supplements */}
      {userSupplements.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
            <Pill className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="font-semibold text-slate-700 mb-2">No supplements added</h3>
          <p className="text-sm text-slate-500 mb-4">
            Add your supplements and we'll tell you when to take them
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-primary-500 text-white rounded-xl font-medium"
          >
            Add Supplements
          </button>
        </div>
      ) : (
        <>
          {/* Safe During Fast */}
          {groupedSupplements.duringFast.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-emerald-700 mb-3 flex items-center gap-2">
                <Check className="w-4 h-4" />
                Safe During Fast
              </h3>
              <div className="space-y-2">
                {groupedSupplements.duringFast.map(us => {
                  const info = getSupplementInfo(us.supplementId)
                  if (!info) return null
                  const timing = TIMING_COLORS[info.timing as TimingType] || TIMING_COLORS.anytime
                  const recommendation = getTimingRecommendation(info)
                  
                  return (
                    <motion.div
                      key={us.id}
                      layout
                      className={`p-4 rounded-xl border ${timing.border} ${timing.bg}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{info.icon}</span>
                          <div>
                            <p className="font-medium text-slate-800">{info.name}</p>
                            <p className={`text-sm ${recommendation.urgent ? 'font-semibold' : ''} ${timing.text}`}>
                              {recommendation.text}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleReminder(us.id)}
                            className={`p-2 rounded-lg ${us.reminderEnabled ? 'bg-primary-100 text-primary-600' : 'bg-slate-100 text-slate-400'}`}
                          >
                            {us.reminderEnabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => removeSupplement(us.id)}
                            className="p-2 rounded-lg bg-red-50 text-red-500 hover:bg-red-100"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Take With Meal */}
          {groupedSupplements.withMeal.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-amber-700 mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Take With Meal
              </h3>
              <div className="space-y-2">
                {groupedSupplements.withMeal.map(us => {
                  const info = getSupplementInfo(us.supplementId)
                  if (!info) return null
                  const timing = TIMING_COLORS[info.timing as TimingType] || TIMING_COLORS.with_meal
                  const recommendation = getTimingRecommendation(info)
                  
                  return (
                    <motion.div
                      key={us.id}
                      layout
                      className={`p-4 rounded-xl border ${timing.border} ${timing.bg}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{info.icon}</span>
                          <div>
                            <p className="font-medium text-slate-800">{info.name}</p>
                            <p className={`text-sm ${recommendation.urgent ? 'font-semibold' : ''} ${timing.text}`}>
                              {recommendation.text}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleReminder(us.id)}
                            className={`p-2 rounded-lg ${us.reminderEnabled ? 'bg-primary-100 text-primary-600' : 'bg-slate-100 text-slate-400'}`}
                          >
                            {us.reminderEnabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => removeSupplement(us.id)}
                            className="p-2 rounded-lg bg-red-50 text-red-500 hover:bg-red-100"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      {info.warning && (
                        <div className="mt-2 flex items-start gap-2 text-xs text-slate-600">
                          <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
                          {info.warning}
                        </div>
                      )}
                    </motion.div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Special Timing */}
          {groupedSupplements.special.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-purple-700 mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Special Timing
              </h3>
              <div className="space-y-2">
                {groupedSupplements.special.map(us => {
                  const info = getSupplementInfo(us.supplementId)
                  if (!info) return null
                  const timing = TIMING_COLORS[info.timing as TimingType] || TIMING_COLORS.anytime
                  const recommendation = getTimingRecommendation(info)
                  
                  return (
                    <motion.div
                      key={us.id}
                      layout
                      className={`p-4 rounded-xl border ${timing.border} ${timing.bg}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{info.icon}</span>
                          <div>
                            <p className="font-medium text-slate-800">{info.name}</p>
                            <p className={`text-sm ${recommendation.urgent ? 'font-semibold' : ''} ${timing.text}`}>
                              {recommendation.text}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleReminder(us.id)}
                            className={`p-2 rounded-lg ${us.reminderEnabled ? 'bg-primary-100 text-primary-600' : 'bg-slate-100 text-slate-400'}`}
                          >
                            {us.reminderEnabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => removeSupplement(us.id)}
                            className="p-2 rounded-lg bg-red-50 text-red-500 hover:bg-red-100"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      {info.warning && (
                        <div className="mt-2 flex items-start gap-2 text-xs text-slate-600">
                          <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                          {info.warning}
                        </div>
                      )}
                    </motion.div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Add More Button */}
          <button
            onClick={() => setShowAddModal(true)}
            className="w-full p-4 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 hover:border-primary-400 hover:text-primary-600 transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Supplement
          </button>
        </>
      )}

      {/* Add Supplement Modal */}
      <AnimatePresence>
        {showAddModal && (
            <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-white rounded-3xl w-full max-w-md max-h-[85vh] overflow-hidden flex flex-col shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              {/* Header with gradient */}
              <div className="bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500 p-6 text-white">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                      <Pill className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold">Add Supplement</h3>
                      <p className="text-white/80 text-sm">{filteredSupplements.length} available</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowAddModal(false)} 
                    className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search supplements..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 bg-white text-slate-800 rounded-2xl focus:ring-4 focus:ring-white/30 focus:outline-none shadow-lg placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* Category Pills */}
              <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedCategory(null)}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                      selectedCategory === null 
                        ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-lg shadow-purple-500/30' 
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    ✨ All
                  </motion.button>
                  {supplementsData.categories.map(cat => (
                    <motion.button
                      key={cat.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                        selectedCategory === cat.id 
                          ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-lg shadow-purple-500/30' 
                          : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                      }`}
                    >
                      <span>{cat.icon}</span>
                      <span>{cat.name}</span>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Supplement List */}
              <div className="flex-1 overflow-y-auto p-4">
                {filteredSupplements.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-100 flex items-center justify-center">
                      {searchQuery ? (
                        <Search className="w-8 h-8 text-slate-400" />
                      ) : (
                        <Check className="w-8 h-8 text-emerald-500" />
                      )}
                    </div>
                    <h4 className="font-semibold text-slate-700 mb-1">
                      {searchQuery ? 'No results found' : 'All caught up!'}
                    </h4>
                    <p className="text-sm text-slate-500">
                      {searchQuery 
                        ? `No supplements match "${searchQuery}"`
                        : "You've added all available supplements"}
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {filteredSupplements.map((supplement, index) => {
                      const timing = TIMING_COLORS[supplement.timing as TimingType] || TIMING_COLORS.anytime
                      const isFastingSafe = supplement.timing === 'during_fast' || supplement.timing === 'anytime'
                      
                      return (
                        <motion.div
                          key={supplement.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.03 }}
                          className={`group relative p-4 rounded-2xl border-2 transition-all hover:shadow-lg ${
                            isFastingSafe 
                              ? 'border-emerald-200 bg-gradient-to-br from-emerald-50 to-cyan-50 hover:border-emerald-300'
                              : `border-slate-200 bg-white hover:border-slate-300`
                          }`}
                        >
                          <div className="flex items-start gap-4">
                            {/* Icon */}
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0 ${
                              isFastingSafe 
                                ? 'bg-gradient-to-br from-emerald-400 to-cyan-400 shadow-lg shadow-emerald-500/20'
                                : 'bg-gradient-to-br from-slate-100 to-slate-200'
                            }`}>
                              {supplement.icon}
                            </div>
                            
                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <h4 className="font-bold text-slate-800 leading-tight">{supplement.name}</h4>
                                {isFastingSafe && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-white flex-shrink-0">
                                    FAST-SAFE
                                  </span>
                                )}
                              </div>
                              
                              {/* Timing Badge */}
                              <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium mb-2 ${timing.bg} ${timing.text} ${timing.border} border`}>
                                <Clock className="w-3 h-3" />
                                {supplement.timing_label}
                              </div>
                              
                              {/* Warning/Info */}
                              {supplement.warning && (
                                <p className="text-xs text-slate-500 line-clamp-2">{supplement.warning}</p>
                              )}
                            </div>
                          </div>
                          
                          {/* Add Button */}
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => addSupplement(supplement.id)}
                            className={`absolute right-3 top-3 w-10 h-10 rounded-xl flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 ${
                              isFastingSafe
                                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 hover:bg-emerald-600'
                                : 'bg-primary-500 text-white shadow-lg shadow-primary-500/30 hover:bg-primary-600'
                            }`}
                          >
                            <Plus className="w-5 h-5" />
                          </motion.button>
                          
                          {/* Mobile Add Button (always visible) */}
                          <button
                            onClick={() => addSupplement(supplement.id)}
                            className={`mt-3 w-full py-2.5 rounded-xl font-semibold text-sm transition-all md:hidden ${
                              isFastingSafe
                                ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                                : 'bg-primary-500 text-white hover:bg-primary-600'
                            }`}
                          >
                            <Plus className="w-4 h-4 inline mr-1" />
                            Add to My Supplements
                          </button>
                        </motion.div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-slate-100 bg-slate-50/50">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-slate-500">
                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                    <span>Fasting-safe supplements</span>
                  </div>
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 text-slate-600 hover:text-slate-800 font-medium"
                  >
                    Done
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


