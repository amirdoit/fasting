// User Types
export interface User {
  id: number
  name: string
  email: string
  avatar?: string
  createdAt: string
}

// Fasting Types
export interface Fast {
  id: number
  userId: number
  startTime: string
  endTime: string | null
  targetHours: number
  protocol: string
  status: 'active' | 'completed' | 'cancelled'
  notes?: string
  mood?: string
  pausedAt?: string
  pausedDuration?: number
  createdAt: string
}

// Weight Types
export interface WeightEntry {
  id: number
  userId: number
  weight: number
  unit: 'kg' | 'lbs'
  bodyFat?: number
  muscleMass?: number
  waterPercentage?: number
  notes?: string
  photoUrl?: string
  date: string
  createdAt: string
}

// Hydration Types
export interface HydrationEntry {
  id: number
  userId: number
  amount: number
  drinkType: 'water' | 'tea' | 'coffee' | 'electrolyte' | 'other'
  date: string
  createdAt: string
}

// Mood Types
export interface MoodEntry {
  id: number
  userId: number
  mood: 'great' | 'good' | 'neutral' | 'bad' | 'terrible'
  energy: number // 1-10
  hunger: number // 1-10
  sleep?: number // 1-10
  stress?: number // 1-10
  notes?: string
  date: string
  createdAt: string
}

// Meal Types
export interface Meal {
  id: number
  userId: number
  name: string
  description?: string
  photoUrl?: string
  calories?: number
  protein?: number
  carbs?: number
  fat?: number
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'breaking_fast'
  date: string
  createdAt: string
}

// Achievement Types
export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  category: 'fasting' | 'hydration' | 'weight' | 'streak' | 'social' | 'special'
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond'
  points: number
  requirement: number
  progress: number
  unlockedAt?: string
}

// Challenge Types
export interface Challenge {
  id: number
  title: string
  name?: string  // Legacy support
  description: string
  type: 'daily' | 'weekly' | 'monthly' | 'special' | 'fasting' | 'hydration' | 'weight' | 'streak' | 'custom'
  target: number
  unit: string
  startDate?: string
  end_date: string
  endDate?: string
  goal?: number
  progress: number
  participants: number
  reward: number
  icon: string
  isJoined?: boolean
  status?: 'active' | 'completed' | 'failed'
}

// Leaderboard Types
export interface LeaderboardEntry {
  rank: number
  user_id: number
  name: string
  avatar: string
  streak: number
  totalHours: number
  points: number
  level: number
  isCurrentUser: boolean
}

// Circle Types (Group Fasting)
export interface Circle {
  id: number
  name: string
  description?: string
  owner_id: number
  invite_code: string
  member_count: number
  avatar_url?: string
  is_private: boolean
  is_member?: boolean
  is_owner?: boolean
  user_role?: string
  active_fasters?: number
  members?: CircleMember[]
  stats?: CircleStats
  created_at: string
  updated_at?: string
}

export interface CircleMember {
  id: number
  circle_id: number
  user_id: number
  role: 'owner' | 'admin' | 'member'
  name: string
  avatar: string
  streak: number
  is_fasting: boolean
  fast_duration?: number
  is_owner: boolean
  buddy_id?: number
  joined_at: string
}

export interface CircleStats {
  total_members: number
  active_fasters: number
  average_streak: number
  total_fasting_hours: number
}

export interface CircleActivity {
  id: number
  circle_id: number
  user_id: number
  user_name: string
  avatar: string
  activity_type: 'fast_completed' | 'streak_milestone' | 'freeze_earned' | 'challenge_joined' | 'challenge_completed' | 'member_joined' | 'member_left' | 'circle_created'
  activity_data?: Record<string, unknown>
  created_at: string
}

export interface CreateCircleData {
  name: string
  description?: string
  is_private?: boolean
  avatar_url?: string
}

// Buddy Types
export interface Buddy {
  id: number
  user_id: number
  circle_id: number
  name: string
  avatar: string
  streak: number
  is_fasting: boolean
  fast_duration?: number
  joined_at: string
}

// Notification Types
export interface Notification {
  id: number
  userId: number
  type: 'fast_reminder' | 'fast_complete' | 'achievement' | 'challenge' | 'buddy' | 'system'
  title: string
  message: string
  read: boolean
  data?: Record<string, unknown>
  createdAt: string
}

// Analytics Types
export interface DailyStats {
  date: string
  fastsCompleted: number
  totalFastingHours: number
  hydrationMl?: number
  totalHydration?: number
  hydrationGoal?: number
  avgMood?: number
  avgEnergy?: number
  weight?: number
  weightUnit?: 'kg' | 'lbs'
}

export interface WeeklyReport {
  weekStart: string
  weekEnd: string
  fastsCompleted: number
  totalHours: number
  avgDuration: number
  completionRate: number
  hydrationAvg: number
  weightChange?: number
  moodTrend: 'up' | 'down' | 'stable'
  achievements: Achievement[]
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  perPage: number
  totalPages: number
}

// Settings Types
export interface UserSettings {
  // Fasting settings
  protocol: string
  hydrationGoal: number
  
  // Units
  weightUnit: 'kg' | 'lbs'
  heightUnit: 'cm' | 'ft'
  
  // Profile data from onboarding
  gender?: string
  age?: number | null
  weight?: number | null
  height?: number | null
  targetWeight?: number | null
  goals?: string[]
  experience?: string
  
  // Notifications
  notificationsEnabled: boolean
  fastReminders?: boolean
  hydrationReminders?: boolean
  
  // Appearance
  theme: 'light' | 'dark' | 'auto'
  accentColor: string
  
  // Onboarding status
  onboardingCompleted?: boolean
}

// Fasting Score Types
export interface FastingScore {
  date: string
  score: number
  factors: {
    duration: number
    hydration: number
    consistency: number
    sleep: number
    mood: number
  }
  breakdown: string[]
}

// Breathing Session Types
export interface BreathingSession {
  id: number
  userId: number
  type: '4-7-8' | 'box' | 'calm' | 'energize'
  durationSeconds: number
  completedAt: string
}

// Recipe Types
export interface Recipe {
  id: number
  name: string
  description: string
  imageUrl?: string
  prepTime: number
  cookTime: number
  servings: number
  calories: number
  protein: number
  carbs: number
  fat: number
  ingredients: string[]
  instructions: string[]
  tags: string[]
  isBreakingFast: boolean
  rating: number
  reviews: number
}

// Comprehensive Analytics Types
export interface ComprehensiveAnalytics {
  user_id: number
  timeframe: '7days' | '30days' | '90days' | 'all'
  generated_at: string
  fasting: FastingAnalytics
  weight: WeightAnalytics
  hydration: HydrationAnalytics
  mood: MoodAnalytics
  streaks: StreakAnalytics
  adherence: AdherenceAnalytics
  cognitive: CognitiveAnalytics
  recommendations: Recommendation[]
}

export interface FastingAnalytics {
  total_fasts: number
  total_hours: number
  average_duration_hours: number
  longest_fast_hours: number
  shortest_fast_hours: number
  completion_rate: number
  by_weekday: Record<string, { count: number; average_hours: number }>
  by_protocol: Record<string, { count: number; total_hours: number }>
  trend: 'improving' | 'stable' | 'declining' | 'no_data'
  recent_fasts: {
    date: string
    duration_hours: number
    protocol: string
    target_hours: number
    achieved: boolean
  }[]
}

export interface WeightAnalytics {
  entries: number
  current_weight: number | null
  start_weight: number | null
  total_change: number | null
  rate_per_week: number | null
  trend: 'losing' | 'stable' | 'gaining' | 'no_data'
}

export interface HydrationAnalytics {
  days_logged: number
  average_ml: number
  goal_ml: number
  goal_adherence: number
  best_day_ml: number
  trend: 'improving' | 'stable' | 'declining' | 'no_data'
}

export interface MoodAnalytics {
  entries: number
  average_mood: number | null
  average_energy: number | null
  mood_trend: 'improving' | 'stable' | 'declining' | 'no_data'
  low_days: number
  mood_distribution: {
    low: number
    medium: number
    high: number
  }
}

export interface StreakAnalytics {
  current_streak: number
  longest_streak: number
  total_fasts: number
  streak_freezes: number
  last_fast_date: string | null
}

export interface AdherenceAnalytics {
  fasting_days: number
  checkin_days: number
  total_days: number
  fasting_consistency: number
  checkin_consistency: number
  best_weekday: string | null
}

export interface CognitiveAnalytics {
  total_tests: number
  by_type: Record<string, {
    count: number
    average_score: number | null
    average_reaction_ms: number | null
  }>
}

export interface Recommendation {
  category: 'fasting' | 'hydration' | 'mood' | 'consistency' | 'pattern'
  priority: 'high' | 'medium' | 'low' | 'info'
  message: string
  data?: Record<string, unknown>
}

// Coach Report Types
export interface CoachSummary {
  id: number
  summary: string
  observations: string[]
  recommendations: string[]
  warnings: string[]
  created_at: string
  cached: boolean
}

export interface CoachTip {
  tip: string
}

export interface MealSuggestion {
  suggestions: Recipe[]
  reasoning: string
}

// Nutrition Types (USDA FoodData Central)
export interface NutritionSearchResult {
  totalHits: number
  foods: FoodItem[]
}

export interface FoodItem {
  fdcId: number
  description: string
  dataType: string
  brandOwner?: string | null
  brandName?: string | null
  servingSize?: number | null
  servingSizeUnit?: string | null
  nutrients: FoodNutrients
}

export interface FoodNutrients {
  calories?: number
  protein?: number
  carbs?: number
  fat?: number
  fiber?: number
  sodium?: number
  sugars?: number
  saturatedFat?: number
}

export interface FoodDetails extends FoodItem {
  category?: string | null
  ingredients?: string | null
  nutrients: DetailedNutrients
}

export interface DetailedNutrients {
  calories?: { value: number; unit: string }
  protein?: { value: number; unit: string }
  carbs?: { value: number; unit: string }
  fat?: { value: number; unit: string }
  fiber?: { value: number; unit: string }
  sodium?: { value: number; unit: string }
  sugars?: { value: number; unit: string }
  saturatedFat?: { value: number; unit: string }
  cholesterol?: { value: number; unit: string }
  calcium?: { value: number; unit: string }
  iron?: { value: number; unit: string }
  magnesium?: { value: number; unit: string }
  potassium?: { value: number; unit: string }
  vitaminA?: { value: number; unit: string }
  vitaminC?: { value: number; unit: string }
  vitaminD?: { value: number; unit: string }
}

export interface MealAnalysis {
  items: MealAnalysisItem[]
  totals: FoodNutrients
  parsed_description: string
}

export interface MealAnalysisItem {
  name: string
  quantity: number
  unit: string
  matched: boolean
  matched_name?: string
  fdc_id?: number
  nutrients: FoodNutrients | null
}

// Vision/Photo Scanning Types
export interface PhotoScanResult {
  foods: ScannedFood[]
  totals: FoodNutrients
  fastingStatus: FastingStatus
  notes?: string
  model: string
  analyzed_at: string
  error?: boolean
  raw_response?: string
  parse_error?: string
}

export interface ScannedFood {
  name: string
  portion: string
  confidence: number
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber: number
}

export interface FastingStatus {
  status: 'clean' | 'dirty' | 'breaks_fast' | 'unknown'
  label: string
  message: string
}

export interface AIConnectionTest {
  success: boolean
  message: string
  model?: string
}

