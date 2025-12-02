/**
 * Open Food Facts API Service
 * Free, open-source food product database
 * API Docs: https://world.openfoodfacts.org/data
 */

export interface OpenFoodFactsProduct {
  code: string
  product_name?: string
  brands?: string
  image_url?: string
  image_small_url?: string
  ingredients_text?: string
  ingredients_text_en?: string
  nutriments?: {
    energy_100g?: number
    'energy-kcal_100g'?: number
    carbohydrates_100g?: number
    sugars_100g?: number
    fat_100g?: number
    'saturated-fat_100g'?: number
    proteins_100g?: number
    fiber_100g?: number
    sodium_100g?: number
    salt_100g?: number
  }
  nutrition_grades?: string
  nova_group?: number
  categories?: string
  categories_tags?: string[]
}

export interface FastingAnalysis {
  status: 'clean' | 'dirty' | 'breaks_fast' | 'unknown'
  statusLabel: string
  statusColor: string
  ingredients: string[]
  flaggedIngredients: FlaggedIngredient[]
  calories: number
  sugars: number
  message: string
  recommendation: string
}

export interface FlaggedIngredient {
  name: string
  type: 'breaks_fast' | 'dirty' | 'safe'
  reason: string
}

// Ingredients that definitively break a fast (spike insulin)
const FAST_BREAKING_INGREDIENTS = [
  'sugar', 'sucrose', 'glucose', 'fructose', 'dextrose', 'maltose', 'lactose',
  'corn syrup', 'high fructose corn syrup', 'hfcs', 'cane sugar', 'cane juice',
  'brown sugar', 'raw sugar', 'maple syrup', 'honey', 'agave',
  'maltodextrin', 'dextrin',
  'milk', 'cream', 'milk powder', 'skim milk', 'whole milk', 'nonfat milk',
  'whey', 'whey protein', 'casein', 'protein concentrate', 'protein isolate',
  'soy protein', 'pea protein',
  'flour', 'wheat flour', 'all-purpose flour', 'bread flour',
  'rice', 'oats', 'barley', 'corn', 'cornmeal', 'cornstarch'
]

// Ingredients that make a "dirty fast" (minimal insulin impact but may affect autophagy)
const DIRTY_FAST_INGREDIENTS = [
  'stevia', 'steviol', 'rebaudioside',
  'erythritol', 'xylitol', 'sorbitol', 'mannitol', 'maltitol', 'isomalt',
  'sucralose', 'splenda', 'aspartame', 'acesulfame', 'saccharin',
  'citric acid', 'natural flavors', 'natural flavor', 'artificial flavor',
  'monk fruit', 'lo han guo', 'luo han guo',
  'inulin', 'chicory root'
]

// Safe ingredients during a clean fast
const SAFE_INGREDIENTS = [
  'water', 'carbonated water', 'sparkling water', 'mineral water',
  'coffee', 'black coffee', 'espresso',
  'tea', 'green tea', 'black tea', 'herbal tea', 'chamomile',
  'salt', 'sodium chloride', 'sea salt', 'himalayan salt',
  'potassium', 'magnesium', 'electrolytes',
  'apple cider vinegar', 'vinegar',
  'caffeine', 'anhydrous caffeine'
]

class OpenFoodFactsService {
  private baseUrl = 'https://world.openfoodfacts.org/api/v2'
  
  async getProduct(barcode: string): Promise<OpenFoodFactsProduct | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/product/${barcode}.json`,
        {
          headers: {
            'User-Agent': 'FastTrackElite/2.0 (Intermittent Fasting App)'
          }
        }
      )
      
      if (!response.ok) {
        console.error('Open Food Facts API error:', response.status)
        return null
      }
      
      const data = await response.json()
      
      if (data.status !== 1 || !data.product) {
        return null
      }
      
      return data.product as OpenFoodFactsProduct
    } catch (error) {
      console.error('Failed to fetch product:', error)
      return null
    }
  }
  
  analyzeForFasting(product: OpenFoodFactsProduct): FastingAnalysis {
    const ingredients = this.parseIngredients(product)
    const flaggedIngredients: FlaggedIngredient[] = []
    
    // Check each ingredient against our lists
    for (const ingredient of ingredients) {
      const lowerIngredient = ingredient.toLowerCase()
      
      // Check for fast-breaking ingredients
      for (const breaker of FAST_BREAKING_INGREDIENTS) {
        if (lowerIngredient.includes(breaker)) {
          flaggedIngredients.push({
            name: ingredient,
            type: 'breaks_fast',
            reason: this.getIngredientReason(breaker, 'breaks_fast')
          })
          break
        }
      }
      
      // Check for dirty fast ingredients (if not already flagged)
      if (!flaggedIngredients.some(f => f.name === ingredient)) {
        for (const dirty of DIRTY_FAST_INGREDIENTS) {
          if (lowerIngredient.includes(dirty)) {
            flaggedIngredients.push({
              name: ingredient,
              type: 'dirty',
              reason: this.getIngredientReason(dirty, 'dirty')
            })
            break
          }
        }
      }
      
      // Mark safe ingredients
      if (!flaggedIngredients.some(f => f.name === ingredient)) {
        for (const safe of SAFE_INGREDIENTS) {
          if (lowerIngredient.includes(safe)) {
            flaggedIngredients.push({
              name: ingredient,
              type: 'safe',
              reason: 'Safe during fasting'
            })
            break
          }
        }
      }
    }
    
    // Get nutrition info
    const calories = product.nutriments?.['energy-kcal_100g'] || product.nutriments?.energy_100g || 0
    const sugars = product.nutriments?.sugars_100g || 0
    
    // Determine overall status
    const hasBreakingIngredients = flaggedIngredients.some(f => f.type === 'breaks_fast')
    const hasDirtyIngredients = flaggedIngredients.some(f => f.type === 'dirty')
    
    // Also check calories and sugars
    const highCalories = calories > 10 // More than 10 kcal per 100g
    const highSugars = sugars > 1 // More than 1g sugar per 100g
    
    let status: FastingAnalysis['status']
    let statusLabel: string
    let statusColor: string
    let message: string
    let recommendation: string
    
    if (hasBreakingIngredients || highCalories || highSugars) {
      status = 'breaks_fast'
      statusLabel = 'BREAKS FAST'
      statusColor = 'red'
      message = `This product contains ${
        hasBreakingIngredients ? 'ingredients that spike insulin' : 
        highCalories ? `${Math.round(calories)} kcal per 100g` :
        `${sugars}g sugar per 100g`
      }.`
      recommendation = 'Consume only during your eating window.'
    } else if (hasDirtyIngredients) {
      status = 'dirty'
      statusLabel = 'DIRTY FAST OK'
      statusColor = 'yellow'
      message = 'Contains sweeteners or additives that may affect autophagy but won\'t spike insulin significantly.'
      recommendation = 'Safe for a "dirty fast" but may trigger hunger in some people.'
    } else if (flaggedIngredients.some(f => f.type === 'safe')) {
      status = 'clean'
      statusLabel = 'CLEAN FAST'
      statusColor = 'green'
      message = 'This product appears safe during fasting.'
      recommendation = 'You can consume this during your fasting window.'
    } else {
      status = 'unknown'
      statusLabel = 'UNKNOWN'
      statusColor = 'gray'
      message = 'Unable to determine fasting safety. Check ingredients manually.'
      recommendation = 'When in doubt, save it for your eating window.'
    }
    
    return {
      status,
      statusLabel,
      statusColor,
      ingredients,
      flaggedIngredients,
      calories: Math.round(calories),
      sugars,
      message,
      recommendation
    }
  }
  
  private parseIngredients(product: OpenFoodFactsProduct): string[] {
    const ingredientsText = product.ingredients_text_en || product.ingredients_text || ''
    
    if (!ingredientsText) {
      return []
    }
    
    // Split by common separators and clean up
    return ingredientsText
      .split(/[,;.]/)
      .map(i => i.trim())
      .filter(i => i.length > 0)
      .map(i => {
        // Remove percentage and parenthetical info
        return i.replace(/\([^)]*\)/g, '').replace(/\d+(\.\d+)?%/g, '').trim()
      })
      .filter(i => i.length > 1)
  }
  
  private getIngredientReason(ingredient: string, type: 'breaks_fast' | 'dirty'): string {
    const reasons: Record<string, string> = {
      // Fast breakers
      'sugar': 'Spikes insulin and blood glucose',
      'sucrose': 'Table sugar - spikes insulin',
      'glucose': 'Direct blood sugar spike',
      'fructose': 'Metabolized by liver, can affect fasting',
      'dextrose': 'Fast-acting sugar',
      'maltose': 'Breaks down to glucose',
      'corn syrup': 'High glycemic sweetener',
      'high fructose corn syrup': 'Highly processed, spikes insulin',
      'hfcs': 'Highly processed, spikes insulin',
      'maltodextrin': 'High glycemic carbohydrate',
      'milk': 'Contains lactose and protein',
      'cream': 'Contains calories and milk sugars',
      'whey': 'Protein triggers insulin response',
      'casein': 'Protein triggers insulin response',
      'protein': 'Protein triggers insulin response',
      'flour': 'Carbohydrate, spikes blood sugar',
      // Dirty fast
      'stevia': 'May trigger cephalic insulin response',
      'erythritol': 'Sugar alcohol - minimal impact',
      'sucralose': 'Artificial sweetener - may affect gut bacteria',
      'aspartame': 'Artificial sweetener - may trigger hunger',
      'citric acid': 'May stimulate digestion',
      'natural flavors': 'Unknown composition, potential calories',
      'monk fruit': 'Natural sweetener - generally safe'
    }
    
    for (const [key, value] of Object.entries(reasons)) {
      if (ingredient.toLowerCase().includes(key)) {
        return value
      }
    }
    
    return type === 'breaks_fast' 
      ? 'Contains calories or causes insulin response'
      : 'May have minor impact on fasting benefits'
  }
}

export const openFoodFactsService = new OpenFoodFactsService()


