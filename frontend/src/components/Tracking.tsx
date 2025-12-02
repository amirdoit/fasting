import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Scale, Droplets, Smile, Utensils, Moon, Battery,
  Plus, X, Check, Camera, TrendingUp, TrendingDown, Minus, Loader2, Heart
} from 'lucide-react'
import { useAppStore } from '../stores/appStore'
import { api } from '../services/api'
import FoodScanner from './FoodScanner'
import FastingScanner from './FastingScanner'
import type { WeightEntry, Meal } from '../types'

type TrackingTab = 'weight' | 'hydration' | 'mood' | 'meals'

const moods = [
  { id: 'great', emoji: '🤩', label: 'Great', color: 'bg-success-100 border-success-300' },
  { id: 'good', emoji: '😊', label: 'Good', color: 'bg-success-50 border-success-200' },
  { id: 'okay', emoji: '😐', label: 'Okay', color: 'bg-warning-50 border-warning-200' },
  { id: 'bad', emoji: '😔', label: 'Bad', color: 'bg-orange-50 border-orange-200' },
  { id: 'terrible', emoji: '😫', label: 'Terrible', color: 'bg-danger-50 border-danger-200' },
]

const drinkTypes = [
  { id: 'water', emoji: '💧', label: 'Water', color: 'from-blue-400 to-cyan-400' },
  { id: 'tea', emoji: '🍵', label: 'Tea', color: 'from-green-400 to-emerald-400' },
  { id: 'coffee', emoji: '☕', label: 'Coffee', color: 'from-amber-500 to-orange-500' },
  { id: 'electrolyte', emoji: '⚡', label: 'Electrolyte', color: 'from-yellow-400 to-orange-400' },
]

export default function Tracking() {
  const { todayHydration, hydrationGoal, addHydration, showToast } = useAppStore()
  
  const [activeTab, setActiveTab] = useState<TrackingTab>('weight')
  const [showModal, setShowModal] = useState(false)
  const [showFoodScanner, setShowFoodScanner] = useState(false)
  const [showFastingScanner, setShowFastingScanner] = useState(false)
  
  // Weight state
  const [weight, setWeight] = useState('')
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lbs'>('lbs') // Default to lbs
  const [weightHistory, setWeightHistory] = useState<WeightEntry[]>([])
  const [isLoadingWeight, setIsLoadingWeight] = useState(false)
  const [isSavingWeight, setIsSavingWeight] = useState(false)
  
  // Hydration state
  const [customAmount, setCustomAmount] = useState('')
  const [selectedDrink, setSelectedDrink] = useState('water')
  
  // Mood state
  const [selectedMood, setSelectedMood] = useState('')
  const [energy, setEnergy] = useState(5)
  const [hunger, setHunger] = useState(3)
  const [sleep, setSleep] = useState(7)
  
  // Meal state
  const [mealName, setMealName] = useState('')
  const [mealType, setMealType] = useState('lunch')
  const [recentMeals, setRecentMeals] = useState<Meal[]>([])
  const [isLoadingMeals, setIsLoadingMeals] = useState(false)
  
  // Macro analysis state
  const [isAnalyzingMacros, setIsAnalyzingMacros] = useState(false)
  const [analyzedMacros, setAnalyzedMacros] = useState<{
    calories: number
    protein: number
    carbs: number
    fat: number
    fiber: number
  } | null>(null)

  // Fetch weight history
    const fetchWeightHistory = async () => {
      setIsLoadingWeight(true)
    try {
      const response = await api.getWeightHistory(7) // Last 7 days
      if (response.success && response.data) {
        setWeightHistory(response.data)
        // Set unit from last entry if available
        if (response.data.length > 0 && response.data[0].unit) {
          setWeightUnit(response.data[0].unit as 'kg' | 'lbs')
        }
      }
    } catch (error) {
      console.error('Error fetching weight history:', error)
      }
      setIsLoadingWeight(false)
    }

  // Fetch weight history on mount
  useEffect(() => {
    fetchWeightHistory()
  }, [])

  // Fetch recent meals on mount
  useEffect(() => {
    const fetchRecentMeals = async () => {
      setIsLoadingMeals(true)
      const response = await api.getMealHistory(7)
      if (response.success && response.data) {
        setRecentMeals(response.data.slice(0, 5)) // Last 5 meals
      }
      setIsLoadingMeals(false)
    }
    fetchRecentMeals()
  }, [])

  const tabs = [
    { id: 'weight', icon: Scale, label: 'Weight', color: 'text-success-500' },
    { id: 'hydration', icon: Droplets, label: 'Hydration', color: 'text-secondary-500' },
    { id: 'mood', icon: Smile, label: 'Mood', color: 'text-warning-500' },
    { id: 'meals', icon: Utensils, label: 'Meals', color: 'text-primary-500' },
  ]

  const handleLogWeight = async () => {
    if (!weight) {
      showToast('Please enter a weight value', 'error')
      return
    }
    
    const weightValue = parseFloat(weight)
    if (isNaN(weightValue) || weightValue <= 0) {
      showToast('Please enter a valid weight value', 'error')
      return
    }
    
    setIsSavingWeight(true)
    try {
    const response = await api.logWeight({ weight: weightValue, unit: weightUnit })
    if (response.success) {
      showToast(`Weight logged: ${weight} ${weightUnit} ✓`, 'success')
      setWeight('')
      setShowModal(false)
        // Refresh weight history immediately
        await fetchWeightHistory()
      } else {
        showToast(response.error || 'Failed to log weight. Please try again.', 'error')
      }
    } catch (error) {
      showToast('Failed to log weight. Please try again.', 'error')
    }
    setIsSavingWeight(false)
  }

  const handleLogHydration = async (amount: number) => {
    addHydration(amount)
    await api.logHydration({ amount, drinkType: selectedDrink })
    showToast(`+${amount}ml ${selectedDrink} logged! 💧`, 'success')
  }

  const handleLogMood = async () => {
    if (!selectedMood) return
    
    await api.logMood({ mood: selectedMood, energy, hunger, sleep })
    showToast('Mood logged successfully! ✓', 'success')
    setSelectedMood('')
    setShowModal(false)
  }

  const handleAnalyzeMacros = async () => {
    if (!mealName.trim()) {
      showToast('Enter what you ate first', 'error')
      return
    }
    
    setIsAnalyzingMacros(true)
    try {
      const response = await api.analyzeMealText(mealName)
      if (response.success && response.data) {
        setAnalyzedMacros({
          calories: response.data.totals.calories || 0,
          protein: response.data.totals.protein || 0,
          carbs: response.data.totals.carbs || 0,
          fat: response.data.totals.fat || 0,
          fiber: response.data.totals.fiber || 0,
        })
        showToast('Macros analyzed! ✓', 'success')
      } else {
        showToast(response.error || 'Failed to analyze', 'error')
      }
    } catch (error) {
      showToast('Analysis failed. Try again.', 'error')
    }
    setIsAnalyzingMacros(false)
  }

  const handleLogMeal = async () => {
    const trimmedMealName = mealName.trim()
    if (!trimmedMealName) return
    
    const mealData: { name: string; mealType: string; calories?: number; protein?: number; carbs?: number; fat?: number; fiber?: number } = { 
      name: trimmedMealName, 
      mealType 
    }
    
    // Include macros if analyzed
    if (analyzedMacros) {
      mealData.calories = analyzedMacros.calories
      mealData.protein = analyzedMacros.protein
      mealData.carbs = analyzedMacros.carbs
      mealData.fat = analyzedMacros.fat
      mealData.fiber = analyzedMacros.fiber
    }
    
    const response = await api.logMeal(mealData)
    if (response.success) {
      showToast('Meal logged! 🍽️', 'success')
      setMealName('')
      setAnalyzedMacros(null)
      setShowModal(false)
      // Refresh recent meals
      const mealsResponse = await api.getMealHistory(7)
      if (mealsResponse.success && mealsResponse.data) {
        setRecentMeals(mealsResponse.data.slice(0, 5))
      }
    } else {
      showToast('Failed to log meal', 'error')
    }
  }

  const hydrationPercent = Math.min((todayHydration / hydrationGoal) * 100, 100)

  // Calculate chart data - ensure all weights are numbers
  const getChartData = () => {
    if (weightHistory.length === 0) return { bars: [], minWeight: 0, maxWeight: 0, avgWeight: 0 }
    
    // Convert all weights to numbers to avoid string concatenation issues
    const weights = weightHistory.map(w => Number(w.weight))
    const minWeight = Math.min(...weights)
    const maxWeight = Math.max(...weights)
    const avgWeight = weights.reduce((acc, w) => acc + w, 0) / weights.length
    const range = maxWeight - minWeight || 1
    
    // Take last 7 entries and reverse for chronological order (oldest first)
    const recentEntries = weightHistory.slice(0, 7).reverse()
    
    const bars = recentEntries.map((entry, index) => {
      const weightNum = Number(entry.weight)
      const heightPercent = ((weightNum - minWeight) / range) * 60 + 40 // 40-100% range
      return {
        height: heightPercent,
        weight: weightNum,
        day: new Date(entry.date).toLocaleDateString('en', { weekday: 'short' }),
        date: entry.date,
        index
      }
    })
    
    return { bars, minWeight, maxWeight, avgWeight }
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'weight':
        // Get today's date in local timezone YYYY-MM-DD format
        const now = new Date()
        const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
        
        // Find today's weight entry (check if the most recent entry is from today)
        const latestWeight = weightHistory.length > 0 ? weightHistory[0] : null
        // Parse the date from the weight entry - handle both YYYY-MM-DD and datetime formats
        const latestDateStr = latestWeight?.date 
          ? (latestWeight.date.includes('T') 
              ? latestWeight.date.split('T')[0] 
              : latestWeight.date.split(' ')[0])
          : null
        const todayWeight = latestDateStr === today ? latestWeight : null
        
        // Get previous weight (the one before today's, or latest if no today entry)
        const previousWeight = todayWeight 
          ? (weightHistory.length > 1 ? weightHistory[1] : null)
          : latestWeight // If no today entry, use latest as reference
        
        // Ensure weights are numbers for calculation
        const displayWeight = todayWeight || latestWeight // Show today's or most recent
        const displayWeightNum = displayWeight ? Number(displayWeight.weight) : null
        const previousWeightNum = previousWeight ? Number(previousWeight.weight) : null
        const weightChange = displayWeightNum !== null && previousWeightNum !== null && displayWeight !== previousWeight
          ? displayWeightNum - previousWeightNum 
          : null
        const weightTrend = weightChange !== null 
          ? weightChange > 0 ? 'up' : weightChange < 0 ? 'down' : 'same' 
          : null
        
        const { bars, minWeight, maxWeight, avgWeight } = getChartData()
          
        return (
          <div className="space-y-4">
            <div className="card-elevated">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-800">
                  {todayWeight ? "Today's Weight" : "Latest Weight"}
                </h3>
                <button
                  onClick={() => setShowModal(true)}
                  className="btn-primary text-sm py-2"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Log Weight
                </button>
              </div>
              
              {isLoadingWeight ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-success flex items-center justify-center shadow-glow-success">
                    <Scale className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    {displayWeight && displayWeightNum !== null ? (
                      <>
                        <div className="text-3xl font-bold text-slate-800">
                          {displayWeightNum} {displayWeight.unit}
                        </div>
                        {weightChange !== null ? (
                          <div className={`text-sm flex items-center gap-1 ${
                            weightTrend === 'down' ? 'text-success-500' : 
                            weightTrend === 'up' ? 'text-danger-500' : 'text-slate-500'
                          }`}>
                            {weightTrend === 'down' && <TrendingDown className="w-4 h-4" />}
                            {weightTrend === 'up' && <TrendingUp className="w-4 h-4" />}
                            {weightTrend === 'same' && <Minus className="w-4 h-4" />}
                            {weightChange > 0 ? '+' : ''}{weightChange.toFixed(1)} {displayWeight.unit} from previous
                          </div>
                        ) : !todayWeight && displayWeight ? (
                          <div className="text-sm text-slate-500">
                            Last logged: {new Date(displayWeight.date).toLocaleDateString()}
                          </div>
                        ) : null}
                      </>
                    ) : (
                      <>
                        <div className="text-3xl font-bold text-slate-800">--</div>
                        <div className="text-slate-500 text-sm">No weight logged yet</div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Weight trend chart */}
            <div className="card-elevated">
              <h3 className="font-semibold text-slate-800 mb-4">7-Day Trend</h3>
              {isLoadingWeight ? (
                <div className="h-48 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-primary-500 animate-spin" />
                </div>
              ) : bars.length > 0 ? (
                <div className="space-y-4">
                  {/* Bar chart */}
                  <div className="flex items-end justify-between gap-2" style={{ height: '160px' }}>
                    {bars.map((bar) => (
                      <div key={bar.index} className="flex-1 flex flex-col items-center h-full">
                        <div className="flex-1 w-full flex items-end justify-center">
                          <motion.div 
                            initial={{ height: 0 }}
                            animate={{ height: `${bar.height}%` }}
                            transition={{ duration: 0.5, delay: bar.index * 0.1 }}
                            className="w-full max-w-[40px] bg-gradient-to-t from-emerald-500 to-teal-400 rounded-t-lg relative group cursor-pointer"
                          >
                            {/* Tooltip */}
                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                              {bar.weight} {todayWeight?.unit || 'lbs'}
                            </div>
                          </motion.div>
                        </div>
                        <span className="text-xs text-slate-400 mt-2">{bar.day}</span>
                      </div>
                    ))}
                  </div>
                  
                  {/* Summary stats */}
                  <div className="grid grid-cols-3 gap-2 pt-4 border-t border-slate-100">
                    <div className="text-center p-2 bg-slate-50 rounded-xl">
                      <div className="text-lg font-bold text-emerald-600">
                        {minWeight.toFixed(1)}
                      </div>
                      <div className="text-xs text-slate-500">Lowest</div>
                    </div>
                    <div className="text-center p-2 bg-slate-50 rounded-xl">
                      <div className="text-lg font-bold text-slate-700">
                        {avgWeight.toFixed(1)}
                      </div>
                      <div className="text-xs text-slate-500">Average</div>
                    </div>
                    <div className="text-center p-2 bg-slate-50 rounded-xl">
                      <div className="text-lg font-bold text-orange-500">
                        {maxWeight.toFixed(1)}
                      </div>
                      <div className="text-xs text-slate-500">Highest</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-48 flex flex-col items-center justify-center bg-slate-50 rounded-2xl">
                  <Scale className="w-12 h-12 text-slate-300 mb-2" />
                  <p className="text-slate-400">Log weight to see your trend</p>
                </div>
              )}
            </div>
          </div>
        )

      case 'hydration':
        return (
          <div className="space-y-4">
            <div className="card-elevated">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-800">Today's Hydration</h3>
                <span className="text-2xl font-bold text-secondary-500">
                  {Math.round(hydrationPercent)}%
                </span>
              </div>
              
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-500">{todayHydration} ml</span>
                  <span className="text-slate-500">{hydrationGoal} ml</span>
                </div>
                <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${hydrationPercent}%` }}
                    className="h-full bg-gradient-secondary rounded-full"
                  />
                </div>
              </div>

              {/* Drink type selector */}
              <div className="grid grid-cols-4 gap-2 mb-4">
                {drinkTypes.map(drink => (
                  <button
                    key={drink.id}
                    onClick={() => setSelectedDrink(drink.id)}
                    className={`py-3 rounded-2xl text-center transition-all ${
                      selectedDrink === drink.id
                        ? `bg-gradient-to-br ${drink.color} text-white shadow-md`
                        : 'bg-slate-50 hover:bg-slate-100'
                    }`}
                  >
                    <span className="text-xl block">{drink.emoji}</span>
                    <span className="text-xs mt-1 block">{drink.label}</span>
                  </button>
                ))}
              </div>

              {/* Quick add buttons */}
              <div className="grid grid-cols-4 gap-2">
                {[100, 250, 500, 750].map(amount => (
                  <button
                    key={amount}
                    onClick={() => handleLogHydration(amount)}
                    className="btn-secondary py-3 text-sm font-medium"
                  >
                    +{amount}
                  </button>
                ))}
              </div>

              {/* Custom amount */}
              <div className="flex gap-2 mt-4">
                <input
                  type="number"
                  value={customAmount}
                  onChange={e => setCustomAmount(e.target.value)}
                  placeholder="Custom ml"
                  className="input flex-1"
                />
                <button
                  onClick={() => {
                    if (customAmount) {
                      handleLogHydration(parseInt(customAmount))
                      setCustomAmount('')
                    }
                  }}
                  className="btn-primary"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        )

      case 'mood':
        const moodColors = {
          great: { bg: 'from-emerald-400 to-green-500', ring: 'ring-emerald-400', text: 'text-emerald-500' },
          good: { bg: 'from-lime-400 to-emerald-500', ring: 'ring-lime-400', text: 'text-lime-500' },
          okay: { bg: 'from-amber-400 to-yellow-500', ring: 'ring-amber-400', text: 'text-amber-500' },
          bad: { bg: 'from-orange-400 to-red-400', ring: 'ring-orange-400', text: 'text-orange-500' },
          terrible: { bg: 'from-red-400 to-rose-500', ring: 'ring-red-400', text: 'text-red-500' },
        }
        
        const getEnergyEmoji = (val: number) => val <= 3 ? '😴' : val <= 6 ? '😐' : '⚡'
        const getHungerEmoji = (val: number) => val <= 3 ? '😌' : val <= 6 ? '🤔' : '🍽️'
        const getSleepEmoji = (val: number) => val <= 3 ? '😫' : val <= 6 ? '😪' : '😴💤'
        
        return (
          <div className="space-y-4">
            {/* Mood Selection Card */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 p-[2px]">
              <div className="bg-white rounded-[22px] p-6 relative overflow-hidden">
                {/* Decorative elements */}
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-purple-100 to-fuchsia-50 rounded-full opacity-60" />
                <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-gradient-to-tr from-violet-100 to-purple-50 rounded-full opacity-40" />
                
                <div className="relative">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center">
                      <span className="text-xl">🎭</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800">How are you feeling?</h3>
                      <p className="text-sm text-slate-500">Tap to select your mood</p>
                    </div>
                  </div>
                  
                  {/* Mood Buttons - Horizontal scroll on mobile, grid on desktop */}
                  <div className="flex gap-3 overflow-x-auto pb-2 -mx-2 px-2 scrollbar-hide">
                    {moods.map((mood, index) => {
                      const colors = moodColors[mood.id as keyof typeof moodColors]
                      const isSelected = selectedMood === mood.id
                      return (
                        <motion.button
                    key={mood.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          whileHover={{ scale: 1.05, y: -4 }}
                          whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedMood(mood.id)}
                          className={`relative flex-shrink-0 min-w-[68px] py-3 px-2 rounded-2xl text-center transition-all ${
                            isSelected
                              ? `bg-gradient-to-br ${colors.bg} shadow-lg ring-4 ${colors.ring} ring-opacity-30`
                              : 'bg-slate-50 hover:bg-slate-100'
                    }`}
                  >
                          <motion.span 
                            className="text-3xl block mb-1"
                            animate={{ scale: isSelected ? [1, 1.2, 1] : 1 }}
                            transition={{ duration: 0.3 }}
                          >
                            {mood.emoji}
                          </motion.span>
                          <span className={`text-xs font-medium ${isSelected ? 'text-white' : 'text-slate-600'}`}>
                            {mood.label}
                          </span>
                          {isSelected && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="absolute -top-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-md"
                            >
                              <Check className="w-3 h-3 text-emerald-500" />
                            </motion.div>
                          )}
                        </motion.button>
                      )
                    })}
              </div>
                </div>
              </div>
              </div>

            {/* Metrics Cards */}
            <div className="grid grid-cols-1 gap-3">
              {/* Energy Level */}
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-4 border border-amber-100"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
                      <Battery className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <span className="font-semibold text-slate-800">Energy Level</span>
                      <p className="text-xs text-slate-500">How energetic do you feel?</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl">{getEnergyEmoji(energy)}</span>
                    <div className="text-lg font-bold text-amber-600">{energy}/10</div>
                  </div>
                </div>
                <div className="relative h-3 bg-amber-100 rounded-full overflow-hidden">
                  <motion.div 
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${energy * 10}%` }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              </div>
                <div className="flex justify-between mt-2">
                  {[1,2,3,4,5,6,7,8,9,10].map(val => (
                    <button 
                      key={val}
                      onClick={() => setEnergy(val)}
                      className={`w-7 h-7 rounded-lg text-xs font-medium transition-all ${
                        energy === val 
                          ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-md' 
                          : 'bg-white text-slate-400 hover:bg-amber-100 hover:text-amber-600'
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </motion.div>

              {/* Hunger Level */}
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-gradient-to-r from-rose-50 to-pink-50 rounded-2xl p-4 border border-rose-100"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center shadow-lg shadow-rose-500/30">
                      <Utensils className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <span className="font-semibold text-slate-800">Hunger Level</span>
                      <p className="text-xs text-slate-500">How hungry are you?</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl">{getHungerEmoji(hunger)}</span>
                    <div className="text-lg font-bold text-rose-600">{hunger}/10</div>
                  </div>
                </div>
                <div className="relative h-3 bg-rose-100 rounded-full overflow-hidden">
                  <motion.div 
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-rose-400 to-pink-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${hunger * 10}%` }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              </div>
                <div className="flex justify-between mt-2">
                  {[1,2,3,4,5,6,7,8,9,10].map(val => (
              <button
                      key={val}
                      onClick={() => setHunger(val)}
                      className={`w-7 h-7 rounded-lg text-xs font-medium transition-all ${
                        hunger === val 
                          ? 'bg-gradient-to-br from-rose-400 to-pink-500 text-white shadow-md' 
                          : 'bg-white text-slate-400 hover:bg-rose-100 hover:text-rose-600'
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </motion.div>

              {/* Sleep Quality */}
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-gradient-to-r from-indigo-50 to-violet-50 rounded-2xl p-4 border border-indigo-100"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                      <Moon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <span className="font-semibold text-slate-800">Sleep Quality</span>
                      <p className="text-xs text-slate-500">How well did you sleep?</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl">{getSleepEmoji(sleep)}</span>
                    <div className="text-lg font-bold text-indigo-600">{sleep}/10</div>
                  </div>
                </div>
                <div className="relative h-3 bg-indigo-100 rounded-full overflow-hidden">
                  <motion.div 
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-indigo-400 to-violet-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${sleep * 10}%` }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                </div>
                <div className="flex justify-between mt-2">
                  {[1,2,3,4,5,6,7,8,9,10].map(val => (
                    <button 
                      key={val}
                      onClick={() => setSleep(val)}
                      className={`w-7 h-7 rounded-lg text-xs font-medium transition-all ${
                        sleep === val 
                          ? 'bg-gradient-to-br from-indigo-400 to-violet-500 text-white shadow-md' 
                          : 'bg-white text-slate-400 hover:bg-indigo-100 hover:text-indigo-600'
                      }`}
                    >
                      {val}
              </button>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* Submit Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleLogMood}
              disabled={!selectedMood}
              className={`w-full py-4 rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-3 ${
                selectedMood 
                  ? 'bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 text-white shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40' 
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Heart className={`w-5 h-5 ${selectedMood ? 'text-white' : 'text-slate-400'}`} />
              {selectedMood ? 'Save Mood Entry' : 'Select a mood to continue'}
            </motion.button>
          </div>
        )

      case 'meals':
        return (
          <div className="space-y-4">
            {/* AI Food Scanner Card */}
            {/* Scanner Cards */}
            <div className="grid grid-cols-2 gap-3">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowFoodScanner(true)}
                className="card-elevated bg-gradient-to-br from-primary-500 to-primary-600 text-white cursor-pointer p-4"
            >
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center mb-3">
                  <Camera className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-bold text-sm">AI Food Scanner</h3>
                <p className="text-white/70 text-xs">Get nutrition info</p>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowFastingScanner(true)}
                className="card-elevated bg-gradient-to-br from-cyan-500 to-blue-600 text-white cursor-pointer p-4"
              >
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 7V5a2 2 0 0 1 2-2h2"/>
                    <path d="M17 3h2a2 2 0 0 1 2 2v2"/>
                    <path d="M21 17v2a2 2 0 0 1-2 2h-2"/>
                    <path d="M7 21H5a2 2 0 0 1-2-2v-2"/>
                    <rect x="7" y="7" width="10" height="10" rx="1"/>
                  </svg>
                </div>
                <h3 className="font-bold text-sm">Barcode Scanner</h3>
                <p className="text-white/70 text-xs">Breaks fast check</p>
              </motion.div>
              </div>

            <div className="card-elevated">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-800">Log a Meal</h3>
              </div>

              <div className="grid grid-cols-4 gap-2 mb-4">
                {['breakfast', 'lunch', 'dinner', 'snack'].map(type => (
                  <button
                    key={type}
                    onClick={() => setMealType(type)}
                    className={`py-2 rounded-xl text-sm capitalize transition-all ${
                      mealType === type
                        ? 'bg-primary-100 text-primary-600 font-medium'
                        : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>

              <input
                type="text"
                value={mealName}
                onChange={e => {
                  setMealName(e.target.value)
                  setAnalyzedMacros(null) // Reset macros when text changes
                }}
                placeholder="e.g., 2 eggs, 1 slice toast, coffee"
                className="input mb-3"
              />
              
              {/* Analyze Macros Button */}
              <button
                onClick={handleAnalyzeMacros}
                disabled={!mealName.trim() || isAnalyzingMacros}
                className="w-full py-2 mb-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium text-sm disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isAnalyzingMacros ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <span>✨</span>
                    Analyze Macros (USDA)
                  </>
                )}
              </button>
              
              {/* Analyzed Macros Display */}
              {analyzedMacros && (
                <div className="p-3 mb-3 bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-purple-700">Estimated Macros</span>
                    <button 
                      onClick={() => setAnalyzedMacros(null)}
                      className="text-purple-500 hover:text-purple-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-5 gap-2 text-center">
                    <div>
                      <div className="text-lg font-bold text-slate-800">{Math.round(analyzedMacros.calories)}</div>
                      <div className="text-xs text-slate-500">kcal</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-blue-600">{Math.round(analyzedMacros.protein)}g</div>
                      <div className="text-xs text-slate-500">Protein</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-amber-600">{Math.round(analyzedMacros.carbs)}g</div>
                      <div className="text-xs text-slate-500">Carbs</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-pink-600">{Math.round(analyzedMacros.fat)}g</div>
                      <div className="text-xs text-slate-500">Fat</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-green-600">{Math.round(analyzedMacros.fiber)}g</div>
                      <div className="text-xs text-slate-500">Fiber</div>
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={handleLogMeal}
                disabled={!mealName.trim()}
                className="btn-primary w-full disabled:opacity-50"
              >
                <Plus className="w-4 h-4 mr-2" />
                {analyzedMacros ? 'Log Meal with Macros' : 'Log Meal'}
              </button>
            </div>

            {/* Recent meals */}
            <div className="card-elevated">
              <h3 className="font-semibold text-slate-800 mb-4">Recent Meals</h3>
              {isLoadingMeals ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 text-primary-500 animate-spin" />
                </div>
              ) : recentMeals.length > 0 ? (
                <div className="space-y-3">
                  {recentMeals.map((meal, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                      <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
                        <span className="text-lg">
                          {meal.mealType === 'breakfast' ? '🌅' : 
                           meal.mealType === 'lunch' ? '☀️' : 
                           meal.mealType === 'dinner' ? '🌙' : '🍎'}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-slate-800">{meal.name}</div>
                        <div className="text-xs text-slate-500 capitalize">{meal.mealType}</div>
                      </div>
                      {meal.calories && (
                        <div className="text-sm text-slate-500">{meal.calories} kcal</div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-slate-100 flex items-center justify-center">
                    <Utensils className="w-8 h-8 text-slate-300" />
                  </div>
                  <p className="text-slate-400">No meals logged yet</p>
                </div>
              )}
            </div>
          </div>
        )
    }
  }

  return (
    <div className="py-6">
      {/* Header */}
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Health Tracking</h1>
        <p className="text-slate-500">Log your daily health metrics</p>
      </header>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide pb-2">
        {tabs.map(tab => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TrackingTab)}
              className={`flex items-center gap-2 px-4 py-2 rounded-2xl whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-white shadow-medium text-slate-800'
                  : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
              }`}
            >
              <Icon className={`w-4 h-4 ${activeTab === tab.id ? tab.color : ''}`} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
        >
          {renderContent()}
        </motion.div>
      </AnimatePresence>

      {/* Weight Modal - Fixed positioning for proper centering */}
      <AnimatePresence>
        {showModal && activeTab === 'weight' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="w-full max-w-md"
              onClick={e => e.stopPropagation()}
            >
              {/* Card with gradient border effect */}
              <div className="relative bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 p-[2px] rounded-[28px] shadow-2xl">
                <div className="bg-white rounded-[26px] p-6 relative overflow-hidden max-h-[90vh] overflow-y-auto">
                  {/* Decorative background elements */}
                  <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-emerald-100 to-teal-50 rounded-full opacity-50" />
                  <div className="absolute -bottom-16 -left-16 w-32 h-32 bg-gradient-to-tr from-cyan-100 to-emerald-50 rounded-full opacity-40" />
                  
                  <div className="relative">
                    {/* Header */}
              <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                          <Scale className="w-6 h-6 text-white" />
                        </div>
                        <div>
                <h2 className="text-xl font-bold text-slate-800">Log Weight</h2>
                          <p className="text-sm text-slate-500">Track your progress</p>
                        </div>
                      </div>
                      <motion.button 
                        whileHover={{ scale: 1.1, rotate: 90 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setShowModal(false)} 
                        className="p-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                      >
                        <X className="w-5 h-5 text-slate-500" />
                      </motion.button>
                    </div>

                    {/* Unit Toggle - More Prominent */}
                    <div className="mb-6">
                      <label className="text-sm font-medium text-slate-600 mb-2 block">Select Unit</label>
                      <div className="flex bg-slate-100 p-1.5 rounded-2xl">
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setWeightUnit('kg')}
                          className={`flex-1 py-3 px-4 rounded-xl font-semibold text-sm transition-all ${
                            weightUnit === 'kg' 
                              ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/30' 
                              : 'text-slate-500 hover:text-slate-700'
                          }`}
                        >
                          <span className="block text-lg mb-0.5">kg</span>
                          <span className={`text-xs ${weightUnit === 'kg' ? 'text-white/80' : 'text-slate-400'}`}>Kilograms</span>
                        </motion.button>
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setWeightUnit('lbs')}
                          className={`flex-1 py-3 px-4 rounded-xl font-semibold text-sm transition-all ${
                            weightUnit === 'lbs' 
                              ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/30' 
                              : 'text-slate-500 hover:text-slate-700'
                          }`}
                        >
                          <span className="block text-lg mb-0.5">lbs</span>
                          <span className={`text-xs ${weightUnit === 'lbs' ? 'text-white/80' : 'text-slate-400'}`}>Pounds</span>
                        </motion.button>
                      </div>
              </div>

                    {/* Weight Input - Large and Prominent */}
                    <div className="mb-6">
                      <label className="text-sm font-medium text-slate-600 mb-2 block">Enter Weight</label>
                      <div className="relative">
                <input
                  type="number"
                  value={weight}
                  onChange={e => setWeight(e.target.value)}
                          placeholder={weightUnit === 'kg' ? '70.0' : '154.0'}
                  step="0.1"
                          className="w-full text-4xl font-bold text-center py-5 px-4 bg-slate-50 border-2 border-slate-200 rounded-2xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 transition-all outline-none text-slate-800 placeholder:text-slate-300"
                />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xl font-semibold text-slate-400">
                          {weightUnit}
                        </div>
                      </div>
                    </div>

                    {/* Quick Presets */}
                    <div className="mb-6">
                      <label className="text-sm font-medium text-slate-600 mb-2 block">Quick Adjust</label>
                      <div className="flex gap-2">
                        {[-1, -0.5, +0.5, +1].map((delta) => (
                          <motion.button
                            key={delta}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                              const current = parseFloat(weight) || (weightUnit === 'kg' ? 70 : 154)
                              setWeight((current + delta).toFixed(1))
                            }}
                            className="flex-1 py-2.5 px-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 transition-colors"
                          >
                            {delta > 0 ? '+' : ''}{delta}
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    {/* Save Button */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleLogWeight}
                      disabled={!weight || isSavingWeight}
                      className="w-full py-4 px-6 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold rounded-2xl shadow-lg shadow-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                    >
                      {isSavingWeight ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Check className="w-5 h-5" />
                      )}
                      <span>{isSavingWeight ? 'Saving...' : 'Save Weight'}</span>
                    </motion.button>

                    {/* Previous Weight Reference */}
                    {weightHistory.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-slate-100">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-500">Last recorded:</span>
                          <span className="font-semibold text-slate-700">
                            {weightHistory[0].weight} {weightHistory[0].unit}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Food Scanner Modal */}
      <AnimatePresence>
        {showFoodScanner && (
          <FoodScanner onClose={() => setShowFoodScanner(false)} />
        )}
      </AnimatePresence>

      {/* Fasting Scanner Modal (Barcode) */}
      <AnimatePresence>
        {showFastingScanner && (
          <FastingScanner onClose={() => setShowFastingScanner(false)} />
        )}
      </AnimatePresence>
    </div>
  )
}
