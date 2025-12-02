/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary - Coral/Salmon (Warm & Energetic)
        primary: {
          50: '#FFF5F5',
          100: '#FFE3E3',
          200: '#FFC9C9',
          300: '#FFA8A8',
          400: '#FF8E8E',
          500: '#FF6B6B',
          600: '#FA5252',
          700: '#F03E3E',
          800: '#E03131',
          900: '#C92A2A',
          DEFAULT: '#FF6B6B',
        },
        // Secondary - Sky Blue (Calm)
        secondary: {
          50: '#EBF8FF',
          100: '#BEE3F8',
          200: '#90CDF4',
          300: '#63B3ED',
          400: '#4299E1',
          500: '#3182CE',
          600: '#2B6CB0',
          700: '#2C5282',
          800: '#2A4365',
          900: '#1A365D',
          DEFAULT: '#63B3ED',
        },
        // Success - Mint Green (Fresh)
        success: {
          50: '#F0FDF4',
          100: '#DCFCE7',
          200: '#BBF7D0',
          300: '#81E6CC',
          400: '#48CFAD',
          500: '#22C55E',
          600: '#16A34A',
          700: '#15803D',
          800: '#166534',
          900: '#14532D',
          DEFAULT: '#48CFAD',
        },
        // Warning - Sunny Yellow
        warning: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706',
          700: '#B45309',
          800: '#92400E',
          900: '#78350F',
          DEFAULT: '#FFC107',
        },
        // Accent - Soft Purple
        accent: {
          50: '#FAF5FF',
          100: '#F3E8FF',
          200: '#E9D5FF',
          300: '#D8B4FE',
          400: '#C084FC',
          500: '#A78BFA',
          600: '#9333EA',
          700: '#7E22CE',
          800: '#6B21A8',
          900: '#581C87',
          DEFAULT: '#A78BFA',
        },
        // Danger - Soft Red
        danger: {
          50: '#FEF2F2',
          100: '#FEE2E2',
          200: '#FECACA',
          300: '#FCA5A5',
          400: '#F87171',
          500: '#EF4444',
          600: '#DC2626',
          700: '#B91C1C',
          800: '#991B1B',
          900: '#7F1D1D',
          DEFAULT: '#F87171',
        },
        // Neutral - Slate
        slate: {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A',
        }
      },
      fontFamily: {
        sans: [
          'SF Pro Display',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'sans-serif'
        ],
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      boxShadow: {
        'soft': '0 4px 20px rgba(0, 0, 0, 0.05)',
        'medium': '0 10px 40px rgba(0, 0, 0, 0.08)',
        'strong': '0 20px 60px rgba(0, 0, 0, 0.12)',
        'glow-primary': '0 8px 24px rgba(255, 107, 107, 0.35)',
        'glow-secondary': '0 8px 24px rgba(99, 179, 237, 0.35)',
        'glow-success': '0 8px 24px rgba(72, 207, 173, 0.35)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'bounce-soft': 'bounceSoft 2s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        bounceSoft: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        }
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #FF6B6B 0%, #FF8E8E 50%, #FFA8A8 100%)',
        'gradient-secondary': 'linear-gradient(135deg, #63B3ED 0%, #90CDF4 100%)',
        'gradient-success': 'linear-gradient(135deg, #48CFAD 0%, #81E6CC 100%)',
        'gradient-warning': 'linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)',
        'gradient-accent': 'linear-gradient(135deg, #A78BFA 0%, #C4B5FD 100%)',
        'gradient-warm': 'linear-gradient(135deg, #FF6B6B 0%, #FFB347 100%)',
        'gradient-cool': 'linear-gradient(135deg, #667EEA 0%, #764BA2 100%)',
        'gradient-fresh': 'linear-gradient(135deg, #11998E 0%, #38EF7D 100%)',
        'gradient-sunset': 'linear-gradient(135deg, #FA709A 0%, #FEE140 100%)',
        'gradient-ocean': 'linear-gradient(135deg, #2193B0 0%, #6DD5ED 100%)',
        'gradient-candy': 'linear-gradient(135deg, #FF9A9E 0%, #FECFEF 50%, #FECFEF 100%)',
      }
    },
  },
  plugins: [],
}
