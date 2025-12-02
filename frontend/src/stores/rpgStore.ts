import { create } from 'zustand'
import { api } from '../services/api'

export type RPGClass = 'monk' | 'warrior' | 'explorer'

export interface RPGCharacter {
  id?: number
  userId?: number
  class: RPGClass
  currentHp: number
  maxHp: number
  totalXp: number
  level: number
  cosmetics: string[]
  createdAt?: string
  updatedAt?: string
}

export interface RPGState {
  character: RPGCharacter | null
  isLoading: boolean
  error: string | null
  showClassSelection: boolean
  
  // Actions
  fetchCharacter: () => Promise<void>
  createCharacter: (characterClass: RPGClass) => Promise<void>
  updateCharacter: (updates: Partial<RPGCharacter>) => Promise<void>
  awardXp: (amount: number, reason: string) => Promise<void>
  takeDamage: (amount: number) => void
  heal: (amount: number) => void
  setClass: (characterClass: RPGClass) => void
  setShowClassSelection: (show: boolean) => void
}

// XP required for each level (exponential growth)
export const getXpForLevel = (level: number): number => {
  return Math.floor(100 * Math.pow(1.5, level - 1))
}

// Get total XP needed to reach a level
export const getTotalXpForLevel = (level: number): number => {
  let total = 0
  for (let i = 1; i < level; i++) {
    total += getXpForLevel(i)
  }
  return total
}

// Calculate level from total XP
export const getLevelFromXp = (totalXp: number): number => {
  let level = 1
  let xpNeeded = getXpForLevel(level)
  let xpAccumulated = 0
  
  while (xpAccumulated + xpNeeded <= totalXp) {
    xpAccumulated += xpNeeded
    level++
    xpNeeded = getXpForLevel(level)
  }
  
  return level
}

// Class bonuses
export const CLASS_INFO: Record<RPGClass, {
  name: string
  description: string
  bonus: string
  icon: string
  color: string
  xpMultiplier: (fastHours: number, isConsistent: boolean) => number
}> = {
  monk: {
    name: 'The Monk',
    description: 'Master of extended fasts',
    bonus: '+50% XP for 20h+ clean fasts',
    icon: '🧘',
    color: 'from-purple-400 to-indigo-600',
    xpMultiplier: (fastHours, _) => fastHours >= 20 ? 1.5 : 1.0
  },
  warrior: {
    name: 'The Warrior',
    description: 'Champion of consistency',
    bonus: '+50% XP for 7-day streaks',
    icon: '⚔️',
    color: 'from-red-400 to-orange-600',
    xpMultiplier: (_, isConsistent) => isConsistent ? 1.5 : 1.0
  },
  explorer: {
    name: 'The Explorer',
    description: 'Adventurer of protocols',
    bonus: '+50% XP for trying new protocols',
    icon: '🗺️',
    color: 'from-emerald-400 to-teal-600',
    xpMultiplier: () => 1.2 // Always gets a small bonus for variety
  }
}

export const useRPGStore = create<RPGState>((set, get) => ({
  character: null,
  isLoading: false,
  error: null,
  showClassSelection: false,

  fetchCharacter: async () => {
    set({ isLoading: true, error: null })
    try {
      const response = await api.getRPGCharacter()
      if (response.success && response.data) {
        set({ character: response.data, isLoading: false })
      } else if (!response.data) {
        // No character exists - show class selection
        set({ character: null, showClassSelection: true, isLoading: false })
      } else {
        set({ error: response.error || 'Failed to fetch character', isLoading: false })
      }
    } catch (error) {
      set({ error: 'Failed to fetch character', isLoading: false })
    }
  },

  createCharacter: async (characterClass: RPGClass) => {
    set({ isLoading: true, error: null })
    try {
      const response = await api.createRPGCharacter(characterClass)
      if (response.success && response.data) {
        set({ 
          character: response.data, 
          showClassSelection: false,
          isLoading: false 
        })
      } else {
        set({ error: response.error || 'Failed to create character', isLoading: false })
      }
    } catch (error) {
      set({ error: 'Failed to create character', isLoading: false })
    }
  },

  updateCharacter: async (updates: Partial<RPGCharacter>) => {
    const { character } = get()
    if (!character) return

    try {
      const response = await api.updateRPGCharacter(updates)
      if (response.success && response.data) {
        set({ character: response.data })
      }
    } catch (error) {
      console.error('Failed to update character:', error)
    }
  },

  awardXp: async (amount: number, reason: string) => {
    const { character } = get()
    if (!character) return

    const classInfo = CLASS_INFO[character.class]
    const multipliedAmount = Math.floor(amount * classInfo.xpMultiplier(0, false))
    
    const newTotalXp = character.totalXp + multipliedAmount
    const newLevel = getLevelFromXp(newTotalXp)
    const leveledUp = newLevel > character.level

    set({
      character: {
        ...character,
        totalXp: newTotalXp,
        level: newLevel,
        // Heal on level up
        currentHp: leveledUp ? character.maxHp : character.currentHp
      }
    })

    // Sync with backend
    try {
      await api.awardRPGXp(multipliedAmount, reason)
    } catch (e) {
      console.error('Failed to sync XP:', e)
    }
  },

  takeDamage: (amount: number) => {
    const { character } = get()
    if (!character) return

    const newHp = Math.max(0, character.currentHp - amount)
    set({ character: { ...character, currentHp: newHp } })
  },

  heal: (amount: number) => {
    const { character } = get()
    if (!character) return

    const newHp = Math.min(character.maxHp, character.currentHp + amount)
    set({ character: { ...character, currentHp: newHp } })
  },

  setClass: (characterClass: RPGClass) => {
    const { character } = get()
    if (!character) return

    set({ character: { ...character, class: characterClass } })
  },

  setShowClassSelection: (show: boolean) => {
    set({ showClassSelection: show })
  }
}))


