import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Theme = 'light' | 'dark' | 'auto'
type AccentColor = 'pink' | 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'gold' | 'teal'

interface ThemeState {
  theme: Theme
  accentColor: AccentColor
  setTheme: (theme: Theme) => void
  setAccentColor: (color: AccentColor) => void
  initTheme: () => void
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'dark',
      accentColor: 'pink',
      
      setTheme: (theme) => {
        set({ theme })
        applyTheme(theme)
      },
      
      setAccentColor: (color) => {
        set({ accentColor: color })
        applyAccentColor(color)
      },
      
      initTheme: () => {
        const { theme, accentColor } = get()
        applyTheme(theme)
        applyAccentColor(accentColor)
      },
    }),
    {
      name: 'fasttrack-theme',
    }
  )
)

function applyTheme(theme: Theme) {
  const isDark = theme === 'dark' || 
    (theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  
  document.documentElement.classList.toggle('dark', isDark)
  
  // Update meta theme-color
  const metaThemeColor = document.querySelector('meta[name="theme-color"]')
  if (metaThemeColor) {
    metaThemeColor.setAttribute('content', isDark ? '#0A0A0A' : '#FFFFFF')
  }
}

function applyAccentColor(color: AccentColor) {
  const colors: Record<AccentColor, string> = {
    pink: '255 107 157',
    blue: '59 130 246',
    green: '72 187 120',
    purple: '139 92 246',
    orange: '249 115 22',
    red: '239 68 68',
    gold: '236 201 75',
    teal: '20 184 166',
  }
  
  document.documentElement.style.setProperty('--color-primary', colors[color])
}








