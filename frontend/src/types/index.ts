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
  creatorId?: number
  inviteCode?: string
  memberCount?: number
  members: number
  icon: string
  isPrivate?: boolean
  isJoined: boolean
  createdAt: string
}

export interface CircleMember {
  id: number
  circleId: number
  userId: number
  user: User
  joinedAt: string
  currentFast?: Fast
}

// Buddy Types
export interface Buddy {
  id: number
  userId: number
  buddyUserId: number
  buddy: User
  status: 'pending' | 'accepted' | 'declined'
  createdAt: string
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

