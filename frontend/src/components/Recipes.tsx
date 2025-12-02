import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ChefHat, Clock, Users, Flame, X, Search,
  Beef, Wheat, Droplets, Leaf, Star, ShoppingCart
} from 'lucide-react'
import { api } from '../services/api'
import { useAppStore } from '../stores/appStore'

interface Recipe {
  id: number
  name: string
  description: string
  imageUrl: string
  prepTime: number
  cookTime: number
  totalTime?: number
  timeCategory?: string
  servings: number
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber?: number
  ingredients: string[]
  instructions: string[]
  tags: string[]
  category?: string
  mealType?: string
  dietType?: string
  goalType?: string
  isBreakingFast: boolean
  isFeatured?: boolean
  difficulty?: string
  rating: number
}

type FilterType = 'all' | 'meal' | 'diet' | 'goal' | 'time'

const FILTER_TABS = [
  { id: 'all', label: 'All', icon: '🍽️' },
  { id: 'meal', label: 'Meal Type', icon: '🍳' },
  { id: 'diet', label: 'Diet', icon: '🥗' },
  { id: 'goal', label: 'Goal', icon: '🎯' },
  { id: 'time', label: 'Time', icon: '⏱️' },
]

const MEAL_TYPES = [
  { id: 'breakfast', label: 'Breakfast', icon: '🍳', color: 'from-amber-400 to-orange-400' },
  { id: 'lunch', label: 'Lunch', icon: '🥗', color: 'from-emerald-400 to-teal-400' },
  { id: 'dinner', label: 'Dinner', icon: '🍽️', color: 'from-indigo-400 to-purple-400' },
  { id: 'snack', label: 'Snacks', icon: '🥜', color: 'from-pink-400 to-rose-400' },
]

const DIET_TYPES = [
  { id: 'keto', label: 'Keto', icon: '🥑', color: 'from-lime-400 to-green-400' },
  { id: 'paleo', label: 'Paleo', icon: '🥩', color: 'from-orange-400 to-amber-400' },
  { id: 'vegan', label: 'Vegan', icon: '🌱', color: 'from-green-400 to-emerald-400' },
  { id: 'vegetarian', label: 'Vegetarian', icon: '🥕', color: 'from-orange-400 to-yellow-400' },
  { id: 'mediterranean', label: 'Mediterranean', icon: '🫒', color: 'from-cyan-400 to-blue-400' },
  { id: 'gluten-free', label: 'Gluten-Free', icon: '🌾', color: 'from-violet-400 to-purple-400' },
]

const GOAL_TYPES = [
  { id: 'weight-loss', label: 'Weight Loss', icon: '⚖️', color: 'from-teal-400 to-cyan-400' },
  { id: 'muscle-building', label: 'Muscle Building', icon: '💪', color: 'from-red-400 to-rose-400' },
  { id: 'energy-boost', label: 'Energy Boost', icon: '⚡', color: 'from-amber-400 to-yellow-400' },
  { id: 'gut-health', label: 'Gut Health', icon: '🦠', color: 'from-purple-400 to-violet-400' },
  { id: 'heart-health', label: 'Heart Health', icon: '❤️', color: 'from-pink-400 to-red-400' },
]

const TIME_CATEGORIES = [
  { id: 'quick', label: 'Quick (< 15 min)', icon: '⚡', color: 'from-emerald-400 to-green-400' },
  { id: 'medium', label: 'Medium (15-30 min)', icon: '🕐', color: 'from-amber-400 to-orange-400' },
  { id: 'long', label: 'Long (30+ min)', icon: '🍲', color: 'from-red-400 to-pink-400' },
]

const RECIPES_PER_PAGE = 12

export default function Recipes() {
  const { showToast } = useAppStore()
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeFilterTab, setActiveFilterTab] = useState<FilterType>('all')
  const [selectedFilter, setSelectedFilter] = useState<string>('')
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showFeaturedOnly, setShowFeaturedOnly] = useState(false)
  const [showBreakingFastOnly, setShowBreakingFastOnly] = useState(false)
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [totalRecipes, setTotalRecipes] = useState(0)
  const totalPages = Math.ceil(totalRecipes / RECIPES_PER_PAGE)

  useEffect(() => {
    fetchRecipes()
  }, [selectedFilter, activeFilterTab, showFeaturedOnly, showBreakingFastOnly, currentPage])

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [selectedFilter, activeFilterTab, showFeaturedOnly, showBreakingFastOnly])

  const fetchRecipes = async () => {
    setIsLoading(true)
    try {
      // Build filter params based on active tab and selection
      let filterParam = ''
      if (activeFilterTab === 'meal' && selectedFilter) {
        filterParam = `meal_type=${selectedFilter}`
      } else if (activeFilterTab === 'diet' && selectedFilter) {
        filterParam = `diet_type=${selectedFilter}`
      } else if (activeFilterTab === 'goal' && selectedFilter) {
        filterParam = `goal_type=${selectedFilter}`
      } else if (activeFilterTab === 'time' && selectedFilter) {
        filterParam = `time=${selectedFilter}`
      }
      
      if (showFeaturedOnly) {
        filterParam += (filterParam ? '&' : '') + 'is_featured=1'
      }
      if (showBreakingFastOnly) {
        filterParam += (filterParam ? '&' : '') + 'is_breaking_fast=1'
      }
      
      // Add pagination params
      const offset = (currentPage - 1) * RECIPES_PER_PAGE
      filterParam += (filterParam ? '&' : '') + `limit=${RECIPES_PER_PAGE}&offset=${offset}`
      
      const response = await api.getRecipes(filterParam || undefined)
      if (response.success && response.data) {
        setRecipes(response.data.recipes || [])
        setTotalRecipes(response.data.total || 0)
      }
    } catch (error) {
      console.error('Failed to fetch recipes:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFilterTabChange = (tab: FilterType) => {
    setActiveFilterTab(tab)
    setSelectedFilter('')
  }

  const handleFilterSelect = (filterId: string) => {
    setSelectedFilter(selectedFilter === filterId ? '' : filterId)
  }

  const filteredRecipes = recipes.filter(recipe => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      recipe.name.toLowerCase().includes(query) ||
      recipe.description.toLowerCase().includes(query) ||
      recipe.tags.some(tag => tag.toLowerCase().includes(query))
    )
  })

  const handleAddToShoppingList = (recipe: Recipe) => {
    showToast(`${recipe.ingredients.length} ingredients added to shopping list! 🛒`, 'success')
  }

  const getFilterOptions = () => {
    switch (activeFilterTab) {
      case 'meal': return MEAL_TYPES
      case 'diet': return DIET_TYPES
      case 'goal': return GOAL_TYPES
      case 'time': return TIME_CATEGORIES
      default: return []
    }
  }

  const getDifficultyBadge = (difficulty?: string) => {
    const colors = {
      easy: 'bg-green-100 text-green-700',
      medium: 'bg-amber-100 text-amber-700',
      hard: 'bg-red-100 text-red-700',
    }
    return colors[difficulty as keyof typeof colors] || colors.medium
  }

  const renderRecipeCard = (recipe: Recipe, index: number) => (
    <motion.div
      key={recipe.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => setSelectedRecipe(recipe)}
      className="card-elevated cursor-pointer overflow-hidden group"
    >
      {/* Image */}
      <div className="relative h-44 -mx-6 -mt-6 mb-4 overflow-hidden">
        <img
          src={recipe.imageUrl}
          alt={recipe.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-2">
        {recipe.isBreakingFast && (
            <span className="px-2 py-1 bg-amber-500 text-white text-xs font-bold rounded-lg shadow-lg">
              🌅 Break Fast
            </span>
          )}
          {recipe.isFeatured && (
            <span className="px-2 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold rounded-lg shadow-lg">
              ⭐ Featured
            </span>
          )}
          </div>
        
        <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 bg-black/50 backdrop-blur-sm text-white text-xs rounded-lg">
          <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
          {recipe.rating.toFixed(1)}
        </div>
        
        {/* Bottom info on image */}
        <div className="absolute bottom-3 left-3 right-3 flex justify-between items-center">
          {recipe.mealType && (
            <span className="px-2 py-1 bg-white/90 backdrop-blur-sm text-slate-700 text-xs font-medium rounded-lg capitalize">
              {recipe.mealType}
            </span>
          )}
          {recipe.difficulty && (
            <span className={`px-2 py-1 text-xs font-medium rounded-lg capitalize ${getDifficultyBadge(recipe.difficulty)}`}>
              {recipe.difficulty}
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <h3 className="font-semibold text-sm text-slate-800 mb-1 line-clamp-2">{recipe.name}</h3>
      <p className="text-xs text-slate-500 mb-3 line-clamp-2">{recipe.description}</p>

      {/* Meta */}
      <div className="flex items-center gap-4 text-xs text-slate-500 mb-3">
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {recipe.prepTime + recipe.cookTime}m
        </span>
        <span className="flex items-center gap-1">
          <Users className="w-3 h-3" />
          {recipe.servings}
        </span>
        <span className="flex items-center gap-1">
          <Flame className="w-3 h-3 text-orange-500" />
          {recipe.calories} cal
        </span>
      </div>

      {/* Macros */}
      <div className="flex gap-2">
        <span className="px-2 py-1 bg-red-50 text-red-600 text-xs rounded-lg font-medium">
          {recipe.protein}g P
        </span>
        <span className="px-2 py-1 bg-amber-50 text-amber-600 text-xs rounded-lg font-medium">
          {recipe.carbs}g C
        </span>
        <span className="px-2 py-1 bg-yellow-50 text-yellow-600 text-xs rounded-lg font-medium">
          {recipe.fat}g F
        </span>
      </div>
    </motion.div>
  )

  const renderRecipeDetail = () => {
    if (!selectedRecipe) return null

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 overflow-y-auto"
        onClick={() => setSelectedRecipe(null)}
      >
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="min-h-screen pt-10 pb-8 px-4"
          onClick={e => e.stopPropagation()}
        >
          <div className="max-w-2xl mx-auto bg-white rounded-3xl overflow-hidden shadow-2xl">
            {/* Header Image */}
            <div className="relative h-72">
              <img
                src={selectedRecipe.imageUrl}
                alt={selectedRecipe.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <button
                onClick={() => setSelectedRecipe(null)}
                className="absolute top-4 right-4 w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
              
              {/* Title overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <div className="flex flex-wrap gap-2 mb-3">
              {selectedRecipe.isBreakingFast && (
                    <span className="px-3 py-1 bg-amber-500 text-white text-sm font-bold rounded-xl">
                      🌅 Perfect for Breaking Fast
                    </span>
                  )}
                  {selectedRecipe.dietType && (
                    <span className="px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-sm font-medium rounded-xl capitalize">
                      {selectedRecipe.dietType}
                    </span>
                  )}
                  {selectedRecipe.goalType && (
                    <span className="px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-sm font-medium rounded-xl capitalize">
                      {selectedRecipe.goalType.replace('-', ' ')}
                    </span>
                  )}
                </div>
                <h2 className="text-2xl font-bold text-white">{selectedRecipe.name}</h2>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Rating & Description */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-700 rounded-xl">
                    <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                    <span className="font-bold">{selectedRecipe.rating.toFixed(1)}</span>
                  </div>
                  {selectedRecipe.difficulty && (
                    <span className={`px-3 py-1 rounded-xl text-sm font-medium capitalize ${getDifficultyBadge(selectedRecipe.difficulty)}`}>
                      {selectedRecipe.difficulty}
                    </span>
                  )}
                </div>
                <p className="text-slate-600">{selectedRecipe.description}</p>
              </div>

              {/* Quick Info */}
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-4 bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl">
                  <Clock className="w-6 h-6 mx-auto mb-2 text-primary-500" />
                  <div className="font-bold text-slate-800">{selectedRecipe.prepTime + selectedRecipe.cookTime}m</div>
                  <div className="text-xs text-slate-500">Total Time</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl">
                  <Users className="w-6 h-6 mx-auto mb-2 text-primary-500" />
                  <div className="font-bold text-slate-800">{selectedRecipe.servings}</div>
                  <div className="text-xs text-slate-500">Servings</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl">
                  <Flame className="w-6 h-6 mx-auto mb-2 text-orange-500" />
                  <div className="font-bold text-slate-800">{selectedRecipe.calories}</div>
                  <div className="text-xs text-slate-500">Calories</div>
                </div>
              </div>

              {/* Macros */}
              <div className="grid grid-cols-4 gap-2">
                <div className="text-center p-3 bg-gradient-to-br from-red-50 to-rose-50 rounded-2xl">
                  <Beef className="w-5 h-5 mx-auto mb-1 text-red-500" />
                  <div className="font-bold text-slate-800">{selectedRecipe.protein}g</div>
                  <div className="text-xs text-slate-500">Protein</div>
                </div>
                <div className="text-center p-3 bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl">
                  <Wheat className="w-5 h-5 mx-auto mb-1 text-amber-500" />
                  <div className="font-bold text-slate-800">{selectedRecipe.carbs}g</div>
                  <div className="text-xs text-slate-500">Carbs</div>
                </div>
                <div className="text-center p-3 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl">
                  <Droplets className="w-5 h-5 mx-auto mb-1 text-yellow-600" />
                  <div className="font-bold text-slate-800">{selectedRecipe.fat}g</div>
                  <div className="text-xs text-slate-500">Fat</div>
                </div>
                <div className="text-center p-3 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl">
                  <Leaf className="w-5 h-5 mx-auto mb-1 text-green-500" />
                  <div className="font-bold text-slate-800">{selectedRecipe.fiber || 0}g</div>
                  <div className="text-xs text-slate-500">Fiber</div>
                </div>
              </div>

              {/* Tags */}
              {selectedRecipe.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedRecipe.tags.map(tag => (
                  <span 
                    key={tag}
                    className="px-3 py-1 bg-slate-100 text-slate-600 text-sm rounded-full"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
              )}

              {/* Ingredients */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <ChefHat className="w-5 h-5 text-primary-500" />
                    Ingredients
                  </h3>
                  <button
                    onClick={() => handleAddToShoppingList(selectedRecipe)}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl text-sm font-medium hover:shadow-lg transition-all"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    Add to Cart
                  </button>
                </div>
                <ul className="space-y-2">
                  {selectedRecipe.ingredients.map((ingredient, i) => (
                    <li key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary-400 to-primary-500 text-white flex items-center justify-center text-xs font-bold">
                        {i + 1}
                      </div>
                      <span className="text-slate-700">{ingredient}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Instructions */}
              <div>
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-400 to-teal-400 flex items-center justify-center text-white text-xs">✓</span>
                  Instructions
                </h3>
                <ol className="space-y-4">
                  {selectedRecipe.instructions.map((instruction, i) => (
                    <li key={i} className="flex gap-4 group">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-500 text-white flex items-center justify-center font-bold text-sm group-hover:scale-110 transition-transform">
                        {i + 1}
                      </div>
                      <p className="text-slate-700 pt-1">{instruction}</p>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Close Button */}
              <button
                onClick={() => setSelectedRecipe(null)}
                className="w-full py-4 bg-slate-100 text-slate-700 rounded-2xl font-medium hover:bg-slate-200 transition-colors"
              >
                Close Recipe
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    )
  }

  return (
    <div className="py-6 space-y-6">
      {/* Header */}
      <header>
        <h1 className="text-2xl font-bold text-slate-800">Recipes</h1>
        <p className="text-slate-500">Delicious meals for your fasting journey</p>
      </header>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          placeholder="Search recipes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>

      {/* Quick Filters */}
      <div className="flex gap-2">
        <button
          onClick={() => setShowBreakingFastOnly(!showBreakingFastOnly)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            showBreakingFastOnly
              ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30'
              : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
          }`}
        >
          🌅 Breaking Fast
        </button>
        <button
          onClick={() => setShowFeaturedOnly(!showFeaturedOnly)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            showFeaturedOnly
              ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/30'
              : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
          }`}
        >
          ⭐ Featured
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {FILTER_TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => handleFilterTabChange(tab.id as FilterType)}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl whitespace-nowrap transition-all ${
              activeFilterTab === tab.id
                ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <span>{tab.icon}</span>
            <span className="text-sm font-medium">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Category Filter Options */}
      {activeFilterTab !== 'all' && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="grid grid-cols-2 sm:grid-cols-3 gap-2"
        >
          {getFilterOptions().map(option => (
            <button
              key={option.id}
              onClick={() => handleFilterSelect(option.id)}
              className={`flex items-center gap-2 p-3 rounded-xl text-left transition-all ${
                selectedFilter === option.id
                  ? `bg-gradient-to-r ${option.color} text-white shadow-lg`
                  : 'bg-white border border-slate-200 text-slate-700 hover:border-slate-300 hover:shadow-md'
              }`}
            >
              <span className="text-xl">{option.icon}</span>
              <span className="text-sm font-medium">{option.label}</span>
            </button>
          ))}
        </motion.div>
      )}

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          {filteredRecipes.length} recipe{filteredRecipes.length !== 1 ? 's' : ''} found
        </p>
        {selectedFilter && (
          <button
            onClick={() => setSelectedFilter('')}
            className="text-sm text-primary-500 hover:text-primary-600 font-medium"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Recipes Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="card-elevated animate-pulse">
              <div className="h-44 -mx-6 -mt-6 mb-4 bg-slate-200 rounded-t-2xl" />
              <div className="h-5 bg-slate-200 rounded mb-2" />
              <div className="h-4 bg-slate-200 rounded w-2/3 mb-3" />
              <div className="flex gap-2">
                <div className="h-6 w-16 bg-slate-200 rounded-lg" />
                <div className="h-6 w-16 bg-slate-200 rounded-lg" />
                <div className="h-6 w-16 bg-slate-200 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredRecipes.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-slate-100 flex items-center justify-center">
            <ChefHat className="w-10 h-10 text-slate-400" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">No Recipes Found</h3>
          <p className="text-slate-500 mb-4">Try adjusting your filters or search query</p>
          <button
            onClick={() => {
              setSelectedFilter('')
              setSearchQuery('')
              setShowFeaturedOnly(false)
              setShowBreakingFastOnly(false)
            }}
            className="px-6 py-2 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 transition-colors"
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        <>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRecipes.map((recipe, index) => renderRecipeCard(recipe, index))}
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  let pageNum: number
                  if (totalPages <= 7) {
                    pageNum = i + 1
                  } else if (currentPage <= 4) {
                    pageNum = i + 1
                  } else if (currentPage >= totalPages - 3) {
                    pageNum = totalPages - 6 + i
                  } else {
                    pageNum = currentPage - 3 + i
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-10 h-10 rounded-xl font-medium transition-all ${
                        currentPage === pageNum
                          ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30'
                          : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  )
                })}
              </div>
              
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
        </div>
          )}
          
          {/* Total count */}
          <p className="text-center text-sm text-slate-500 mt-4">
            Showing {((currentPage - 1) * RECIPES_PER_PAGE) + 1}-{Math.min(currentPage * RECIPES_PER_PAGE, totalRecipes)} of {totalRecipes} recipes
          </p>
        </>
      )}

      {/* Recipe Detail Modal */}
      <AnimatePresence>
        {selectedRecipe && renderRecipeDetail()}
      </AnimatePresence>
    </div>
  )
}
