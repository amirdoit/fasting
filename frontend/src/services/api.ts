import type { 
  Fast, 
  WeightEntry, 
  HydrationEntry, 
  MoodEntry, 
  Meal,
  Achievement,
  Challenge,
  Circle,
  LeaderboardEntry,
  UserSettings,
  ApiResponse,
  DailyStats,
  WeeklyReport,
  FastingScore
} from '../types'

// Get WordPress data from global variable (injected by PHP)
declare global {
  interface Window {
    fasttrackData?: {
      api_url: string
      nonce: string
      current_user_id: number
      protocol_hours: number
      user_settings: UserSettings
      site_url: string
      is_logged_in: boolean
    }
  }
}

const getApiUrl = () => {
  if (window.fasttrackData?.api_url) {
    return window.fasttrackData.api_url
  }
  // Fallback for development
  return '/wp-json/fasttrack/v1'
}

const getNonce = () => {
  return window.fasttrackData?.nonce || ''
}

class ApiService {
  private baseUrl: string
  
  constructor() {
    this.baseUrl = getApiUrl()
  }
  
  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'X-WP-Nonce': getNonce(),
          ...options.headers,
        },
        credentials: 'same-origin',
      })
      
      // Handle empty responses (e.g., null returns from API)
      const text = await response.text()
      let data: T | null = null
      
      if (text && text.trim()) {
        try {
          data = JSON.parse(text)
        } catch {
          // If JSON parsing fails but response is OK, return null
          if (response.ok) {
            return { success: true, data: null as T }
          }
          return { success: false, error: 'Invalid server response' }
        }
      }
      
      // Check for WordPress REST API error format
      if (!response.ok) {
        // WordPress REST API returns errors in { code, message, data } format
        const errorMessage = (data as { message?: string; error?: string })?.message || 
                            (data as { message?: string; error?: string })?.error || 
                            `HTTP error! status: ${response.status}`
        return { success: false, error: errorMessage }
      }
      
      // Check if the response itself indicates an error
      if (data && typeof data === 'object' && 'code' in data && 'message' in data) {
        return { success: false, error: (data as { message: string }).message }
      }
      
      return { success: true, data: data as T }
    } catch (error) {
      console.error('API Error:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Network error. Please check your connection.' 
      }
    }
  }
  
  // ============ FASTING ============
  
  async getActiveFast(): Promise<ApiResponse<Fast | null>> {
    return this.request<Fast | null>('/fasts/active')
  }
  
  async startFast(data: { 
    protocol: string
    targetHours: number
    backdateMinutes?: number 
  }): Promise<ApiResponse<Fast>> {
    return this.request<Fast>('/fasts', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }
  
  async endFast(fastId: number, data?: { 
    notes?: string
    mood?: string 
  }): Promise<ApiResponse<Fast>> {
    return this.request<Fast>(`/fasts/${fastId}/end`, {
      method: 'POST',
      body: JSON.stringify(data || {})
    })
  }

  async pauseFast(fastId: number): Promise<ApiResponse<Fast>> {
    return this.request<Fast>(`/fasts/${fastId}/pause`, {
      method: 'POST'
    })
  }

  async resumeFast(fastId: number): Promise<ApiResponse<Fast>> {
    return this.request<Fast>(`/fasts/${fastId}/resume`, {
      method: 'POST'
    })
  }
  
  async getFastHistory(params?: { 
    page?: number
    perPage?: number 
  }): Promise<ApiResponse<Fast[]>> {
    const query = new URLSearchParams()
    if (params?.page) query.set('page', params.page.toString())
    if (params?.perPage) query.set('per_page', params.perPage.toString())
    return this.request<Fast[]>(`/fasts?${query}`)
  }
  
  // ============ WEIGHT ============
  
  async logWeight(data: {
    weight: number
    unit: 'kg' | 'lbs'
    bodyFat?: number
    notes?: string
  }): Promise<ApiResponse<WeightEntry>> {
    return this.request<WeightEntry>('/weight', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }
  
  async getWeightHistory(days?: number): Promise<ApiResponse<WeightEntry[]>> {
    const query = days ? `?days=${days}` : ''
    return this.request<WeightEntry[]>(`/weight${query}`)
  }
  
  // ============ HYDRATION ============
  
  async logHydration(data: {
    amount: number
    drinkType?: string
  }): Promise<ApiResponse<HydrationEntry>> {
    return this.request<HydrationEntry>('/hydration', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }
  
  async getTodayHydration(): Promise<ApiResponse<{ total: number; entries: HydrationEntry[] }>> {
    return this.request<{ total: number; entries: HydrationEntry[] }>('/hydration/today')
  }
  
  // ============ MOOD ============
  
  async logMood(data: {
    mood: string
    energy: number
    hunger?: number
    sleep?: number
    notes?: string
  }): Promise<ApiResponse<MoodEntry>> {
    return this.request<MoodEntry>('/mood', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }
  
  async getMoodHistory(days?: number): Promise<ApiResponse<MoodEntry[]>> {
    const query = days ? `?days=${days}` : ''
    return this.request<MoodEntry[]>(`/mood${query}`)
  }
  
  // ============ MEALS ============
  
  async logMeal(data: {
    name: string
    description?: string
    mealType: string
    calories?: number
    protein?: number
    carbs?: number
    fat?: number
  }): Promise<ApiResponse<Meal>> {
    return this.request<Meal>('/meals', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }
  
  async getMealHistory(days?: number): Promise<ApiResponse<Meal[]>> {
    const query = days ? `?days=${days}` : ''
    return this.request<Meal[]>(`/meals${query}`)
  }
  
  // ============ ACHIEVEMENTS ============
  
  async getAchievements(): Promise<ApiResponse<Achievement[]>> {
    return this.request<Achievement[]>('/achievements')
  }
  
  async unlockAchievement(achievementId: string): Promise<ApiResponse<Achievement>> {
    return this.request<Achievement>(`/achievements/${achievementId}/unlock`, {
      method: 'POST'
    })
  }
  
  // ============ CHALLENGES ============
  
  async getChallenges(): Promise<ApiResponse<Challenge[]>> {
    return this.request<Challenge[]>('/challenges')
  }
  
  async getActiveChallenges(): Promise<ApiResponse<Challenge[]>> {
    return this.request<Challenge[]>('/challenges/active')
  }
  
  async joinChallenge(data: {
    challengeId: number
    title: string
    type: string
    target: number
  }): Promise<ApiResponse<{ success: boolean; id: number }>> {
    return this.request<{ success: boolean; id: number }>('/challenges/join', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }
  
  async getLeaderboard(limit?: number): Promise<ApiResponse<LeaderboardEntry[]>> {
    const query = limit ? `?limit=${limit}` : ''
    return this.request<LeaderboardEntry[]>(`/leaderboard${query}`)
  }
  
  // ============ CIRCLES ============
  
  async getCircles(filter?: 'all' | 'owned' | 'joined'): Promise<ApiResponse<Circle[]>> {
    const query = filter ? `?filter=${filter}` : ''
    return this.request<Circle[]>(`/circles${query}`)
  }
  
  async getPublicCircles(search?: string, limit?: number, offset?: number): Promise<ApiResponse<Circle[]>> {
    const params = new URLSearchParams()
    if (search) params.append('search', search)
    if (limit) params.append('limit', String(limit))
    if (offset) params.append('offset', String(offset))
    const query = params.toString() ? `?${params.toString()}` : ''
    return this.request<Circle[]>(`/circles/public${query}`)
  }
  
  async getCircle(circleId: number): Promise<ApiResponse<Circle>> {
    return this.request<Circle>(`/circles/${circleId}`)
  }
  
  async createCircle(data: {
    name: string
    description?: string
    is_private?: boolean
    avatar_url?: string
  }): Promise<ApiResponse<Circle>> {
    return this.request<Circle>('/circles', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }
  
  async updateCircle(circleId: number, data: {
    name?: string
    description?: string
    is_private?: boolean
    avatar_url?: string
  }): Promise<ApiResponse<Circle>> {
    return this.request<Circle>(`/circles/${circleId}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  }
  
  async deleteCircle(circleId: number): Promise<ApiResponse<{ success: boolean }>> {
    return this.request<{ success: boolean }>(`/circles/${circleId}`, {
      method: 'DELETE'
    })
  }
  
  async joinCircle(circleId: number, inviteCode?: string): Promise<ApiResponse<Circle>> {
    return this.request<Circle>(`/circles/${circleId}/join`, {
      method: 'POST',
      body: JSON.stringify({ invite_code: inviteCode })
    })
  }
  
  async joinCircleByCode(inviteCode: string): Promise<ApiResponse<Circle>> {
    return this.request<Circle>('/circles/join', {
      method: 'POST',
      body: JSON.stringify({ invite_code: inviteCode })
    })
  }
  
  async leaveCircle(circleId: number): Promise<ApiResponse<{ success: boolean }>> {
    return this.request<{ success: boolean }>(`/circles/${circleId}/leave`, {
      method: 'POST'
    })
  }
  
  async getCircleMembers(circleId: number): Promise<ApiResponse<import('../types').CircleMember[]>> {
    return this.request<import('../types').CircleMember[]>(`/circles/${circleId}/members`)
  }
  
  async removeCircleMember(circleId: number, userId: number): Promise<ApiResponse<{ success: boolean }>> {
    return this.request<{ success: boolean }>(`/circles/${circleId}/members/${userId}`, {
      method: 'DELETE'
    })
  }
  
  async getCircleActivity(circleId: number, limit?: number, offset?: number): Promise<ApiResponse<import('../types').CircleActivity[]>> {
    const params = new URLSearchParams()
    if (limit) params.append('limit', String(limit))
    if (offset) params.append('offset', String(offset))
    const query = params.toString() ? `?${params.toString()}` : ''
    return this.request<import('../types').CircleActivity[]>(`/circles/${circleId}/activity${query}`)
  }
  
  async getCircleStats(circleId: number): Promise<ApiResponse<import('../types').CircleStats>> {
    return this.request<import('../types').CircleStats>(`/circles/${circleId}/stats`)
  }
  
  async regenerateCircleInviteCode(circleId: number): Promise<ApiResponse<{ invite_code: string }>> {
    return this.request<{ invite_code: string }>(`/circles/${circleId}/invite-code`, {
      method: 'POST'
    })
  }
  
  async getCircleBuddy(circleId: number): Promise<ApiResponse<import('../types').Buddy | null>> {
    return this.request<import('../types').Buddy | null>(`/circles/${circleId}/buddy`)
  }
  
  async setCircleBuddy(circleId: number, buddyUserId: number): Promise<ApiResponse<import('../types').Buddy>> {
    return this.request<import('../types').Buddy>(`/circles/${circleId}/buddy`, {
      method: 'POST',
      body: JSON.stringify({ buddy_id: buddyUserId })
    })
  }
  
  async removeCircleBuddy(circleId: number): Promise<ApiResponse<{ success: boolean }>> {
    return this.request<{ success: boolean }>(`/circles/${circleId}/buddy`, {
      method: 'DELETE'
    })
  }
  
  // ============ ANALYTICS ============
  
  async getDailyStats(days?: number): Promise<ApiResponse<DailyStats[]>> {
    const query = days ? `?days=${days}` : ''
    return this.request<DailyStats[]>(`/analytics/daily${query}`)
  }
  
  async getWeeklyReport(): Promise<ApiResponse<WeeklyReport>> {
    return this.request<WeeklyReport>('/analytics/weekly')
  }
  
  async getComprehensiveAnalytics(timeframe: '7days' | '30days' | '90days' | 'all' = '30days'): Promise<ApiResponse<import('../types').ComprehensiveAnalytics>> {
    return this.request<import('../types').ComprehensiveAnalytics>(`/analytics/comprehensive?timeframe=${timeframe}`)
  }
  
  // ============ COACH ============
  
  async getCoachSummary(timeframe: '7days' | '30days' | '90days' = '7days'): Promise<ApiResponse<import('../types').CoachSummary>> {
    return this.request<import('../types').CoachSummary>(`/coach/summary?timeframe=${timeframe}`)
  }
  
  async regenerateCoachSummary(timeframe: '7days' | '30days' | '90days' = '7days'): Promise<ApiResponse<import('../types').CoachSummary>> {
    return this.request<import('../types').CoachSummary>(`/coach/summary?timeframe=${timeframe}`, {
      method: 'POST'
    })
  }
  
  async getCoachTip(context: string = 'general'): Promise<ApiResponse<import('../types').CoachTip>> {
    return this.request<import('../types').CoachTip>(`/coach/tip?context=${context}`)
  }
  
  async getMealSuggestion(lastFastHours?: number, goal?: string): Promise<ApiResponse<import('../types').MealSuggestion>> {
    return this.request<import('../types').MealSuggestion>('/coach/meal-suggestion', {
      method: 'POST',
      body: JSON.stringify({ last_fast_hours: lastFastHours, goal })
    })
  }

  // Nutrition API (USDA FoodData Central)
  async searchFoods(query: string, limit: number = 25, dataType?: string): Promise<ApiResponse<import('../types').NutritionSearchResult>> {
    const params = new URLSearchParams({ query, limit: limit.toString() })
    if (dataType) params.append('data_type', dataType)
    return this.request<import('../types').NutritionSearchResult>(`/nutrition/search?${params}`)
  }

  async getFoodDetails(fdcId: number): Promise<ApiResponse<import('../types').FoodDetails>> {
    return this.request<import('../types').FoodDetails>(`/nutrition/food/${fdcId}`)
  }

  async analyzeMealText(description: string): Promise<ApiResponse<import('../types').MealAnalysis>> {
    return this.request<import('../types').MealAnalysis>('/nutrition/analyze', {
      method: 'POST',
      body: JSON.stringify({ description })
    })
  }

  // Vision/Photo Scanning API
  async scanFoodPhoto(image: string, imageType: 'base64' | 'url' = 'base64', context?: string): Promise<ApiResponse<import('../types').PhotoScanResult>> {
    return this.request<import('../types').PhotoScanResult>('/meals/scan-photo', {
      method: 'POST',
      body: JSON.stringify({ image, image_type: imageType, context })
    })
  }

  async testAIConnection(): Promise<ApiResponse<import('../types').AIConnectionTest>> {
    return this.request<import('../types').AIConnectionTest>('/ai/test')
  }
  
  async getFastingScore(): Promise<ApiResponse<FastingScore>> {
    return this.request<FastingScore>('/analytics/fasting-score')
  }
  
  async getInsights(): Promise<ApiResponse<{
    streak: number
    totalFasts: number
    totalHours: number
    avgDuration: number
    completionRate: number
    bestDay: string
    points: number
    level: number
  }>> {
    return this.request('/insights')
  }
  
  // ============ SETTINGS ============
  
  async getSettings(): Promise<ApiResponse<UserSettings>> {
    return this.request<UserSettings>('/settings')
  }
  
  async updateSettings(data: Partial<UserSettings>): Promise<ApiResponse<UserSettings>> {
    return this.request<UserSettings>('/settings', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }
  
  // ============ USER ============
  
  async getProfile(): Promise<ApiResponse<{
    id: number
    name: string
    email: string
    avatar?: string
    stats: {
      streak: number
      totalFasts: number
      totalHours: number
      points: number
      level: number
    }
  }>> {
    return this.request('/profile')
  }
  
  // ============ ONBOARDING ============
  
  async saveOnboarding(data: {
    goals: string[]
    experience: string
    protocol: string
    gender?: string
    age?: number
    weight?: number
    weightUnit?: string
    height?: number
    heightUnit?: string
    targetWeight?: number
  }): Promise<ApiResponse<{ success: boolean }>> {
    return this.request<{ success: boolean }>('/onboarding', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }
  
  async checkOnboardingStatus(): Promise<ApiResponse<{ completed: boolean; completedAt?: string }>> {
    return this.request<{ completed: boolean; completedAt?: string }>('/onboarding/status')
  }
  
  // ============ CYCLE SYNC ============
  
  async getCycleSettings(): Promise<ApiResponse<{
    isEnabled: boolean
    cycleLength: number
    periodLength: number
    lastPeriodStart: string | null
  }>> {
    return this.request('/cycle')
  }
  
  async updateCycleSettings(data: {
    isEnabled: boolean
    cycleLength: number
    periodLength: number
    lastPeriodStart: string | null
  }): Promise<ApiResponse<{ success: boolean }>> {
    return this.request<{ success: boolean }>('/cycle', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }
  
  // ============ COGNITIVE TESTS ============
  
  async getCognitiveResults(days?: number): Promise<ApiResponse<{
    results: Array<{
      id: number
      testType: string
      score: number
      fastingState: 'fed' | 'fasted'
      fastingHours: number
      createdAt: string
    }>
    averages: {
      fedReactionTime: number
      fastedReactionTime: number
      improvement: number
    }
  }>> {
    const params = days ? `?days=${days}` : ''
    return this.request(`/cognitive${params}`)
  }
  
  async saveCognitiveResult(data: {
    testType: string
    score: number
    fastingState: 'fed' | 'fasted'
    fastingHours: number
  }): Promise<ApiResponse<{ id: number }>> {
    return this.request<{ id: number }>('/cognitive', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }
  
  // ============ FOOD SCANNER ============
  
  async scanFood(imageBase64: string): Promise<ApiResponse<{
    name: string
    calories: number
    protein: number
    carbs: number
    fat: number
    fiber: number
    glycemicLoad: 'low' | 'medium' | 'high'
    fastingScore: number
    suggestions: string[]
  }>> {
    return this.request('/meals/scan', {
      method: 'POST',
      body: JSON.stringify({ image: imageBase64 })
    })
  }
  
  // ============ STREAK FREEZES ============
  
  async getStreakFreezes(): Promise<ApiResponse<{
    available: number
    used: number
    earnedToday: boolean
  }>> {
    return this.request('/streak-freezes')
  }
  
  async useStreakFreeze(): Promise<ApiResponse<{ success: boolean; remaining: number }>> {
    return this.request<{ success: boolean; remaining: number }>('/streak-freezes/use', {
      method: 'POST'
    })
  }
  
  async earnStreakFreeze(activity: string): Promise<ApiResponse<{ success: boolean; total: number }>> {
    return this.request<{ success: boolean; total: number }>('/streak-freezes/earn', {
      method: 'POST',
      body: JSON.stringify({ activity })
    })
  }
  
  // ============ RECIPES ============
  
  async getRecipes(filterParams?: string): Promise<ApiResponse<{
    recipes: Array<{
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
    }>
    total: number
    limit: number
    offset: number
  }>> {
    const params = filterParams ? `?${filterParams}` : ''
    return this.request(`/recipes${params}`)
  }
  
  async getRecipe(id: number): Promise<ApiResponse<{
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
  }>> {
    return this.request(`/recipes/${id}`)
  }
  
  async toggleRecipeFavorite(recipeId: number): Promise<ApiResponse<{ isFavorite: boolean }>> {
    return this.request(`/recipes/${recipeId}/favorite`, {
      method: 'POST'
    })
  }
  
  async getRecipeFavorites(): Promise<ApiResponse<Array<any>>> {
    return this.request('/recipes/favorites')
  }

  // ============ GAMIFICATION ============

  async awardPoints(points: number, reason: string): Promise<ApiResponse<{ success: boolean; totalPoints: number }>> {
    return this.request('/points/award', {
      method: 'POST',
      body: JSON.stringify({ points, reason })
    })
  }

  // ============ RPG CHARACTER ============

  async getRPGCharacter(): Promise<ApiResponse<{
    id: number
    userId: number
    class: 'monk' | 'warrior' | 'explorer'
    currentHp: number
    maxHp: number
    totalXp: number
    level: number
    cosmetics: string[]
    createdAt: string
    updatedAt: string
  } | null>> {
    return this.request('/rpg/character')
  }

  async createRPGCharacter(characterClass: 'monk' | 'warrior' | 'explorer'): Promise<ApiResponse<{
    id: number
    userId: number
    class: 'monk' | 'warrior' | 'explorer'
    currentHp: number
    maxHp: number
    totalXp: number
    level: number
    cosmetics: string[]
    createdAt: string
    updatedAt: string
  }>> {
    return this.request('/rpg/character', {
      method: 'POST',
      body: JSON.stringify({ class: characterClass })
    })
  }

  async updateRPGCharacter(updates: {
    class?: 'monk' | 'warrior' | 'explorer'
    currentHp?: number
    cosmetics?: string[]
  }): Promise<ApiResponse<{
    id: number
    class: 'monk' | 'warrior' | 'explorer'
    currentHp: number
    maxHp: number
    totalXp: number
    level: number
    cosmetics: string[]
  }>> {
    return this.request('/rpg/character', {
      method: 'PUT',
      body: JSON.stringify(updates)
    })
  }

  async awardRPGXp(amount: number, reason: string): Promise<ApiResponse<{
    success: boolean
    newTotalXp: number
    newLevel: number
    leveledUp: boolean
  }>> {
    return this.request('/rpg/xp', {
      method: 'POST',
      body: JSON.stringify({ amount, reason })
    })
  }

  // ============ LIVE ROOMS ============

  async getLiveFasters(): Promise<ApiResponse<{
    total: number
    by_duration: {
      '4h+': number
      '8h+': number
      '12h+': number
      '16h+': number
      '20h+': number
    }
  }>> {
    return this.request('/live-fasters')
  }

  async createCommitment(data: {
    targetHours: number
    witnessEmail?: string
    witnessName?: string
  }): Promise<ApiResponse<{
    id: number
    shareLink: string
  }>> {
    return this.request('/commitments', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }
  
  // ============ NOTIFICATIONS ============
  
  async getNotifications(): Promise<ApiResponse<Array<{
    id: number
    type: string
    title: string
    message: string
    isRead: boolean
    createdAt: string
  }>>> {
    return this.request('/notifications')
  }
  
  async markNotificationRead(notificationId: number): Promise<ApiResponse<{ success: boolean }>> {
    return this.request(`/notifications/${notificationId}/read`, {
      method: 'POST'
    })
  }
  
  // ============ DAILY CHECK-INS ============
  
  async saveCheckin(data: {
    // Bio-Adaptive readiness fields
    sleepQuality?: string | null
    stressLevel?: string | null
    soreness?: string | null
    readinessScore?: number | null
    // Legacy fields
    yesterdayFeeling?: string | null
    todayOutlook?: string | null
    // Energy metrics
    energyLevel: number
    motivation: number
    // Recommendation
    recommendedProtocol: string | null
  }): Promise<ApiResponse<{ success: boolean; id: number }>> {
    return this.request<{ success: boolean; id: number }>('/checkins', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }
  
  async getTodayCheckin(): Promise<ApiResponse<{
    id: number
    checkinDate: string
    yesterdayFeeling: string | null
    todayOutlook: string | null
    energyLevel: number | null
    motivation: number | null
    recommendedProtocol: string | null
    createdAt: string
  } | null>> {
    return this.request('/checkins/today')
  }
  
  // ============ ONBOARDING RESET ============
  
  async resetOnboarding(): Promise<ApiResponse<{ success: boolean }>> {
    return this.request<{ success: boolean }>('/onboarding', {
      method: 'DELETE'
    })
  }
}

export const api = new ApiService()

