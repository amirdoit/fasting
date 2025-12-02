import { motion } from 'framer-motion'

interface TimerRingProps {
  progress: number // 0-100
  size?: number
  strokeWidth?: number
  color?: string
  showGlow?: boolean
  bgColor?: string
}

export default function TimerRing({ 
  progress, 
  size = 280, 
  strokeWidth = 12,
  color = '#FF6B6B',
  showGlow = true,
  bgColor = '#F1F5F9'
}: TimerRingProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (progress / 100) * circumference

  return (
    <svg 
      width={size} 
      height={size} 
      className={showGlow ? 'drop-shadow-lg' : ''}
    >
      {/* Background circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={bgColor}
        strokeWidth={strokeWidth}
      />
      
      {/* Progress circle */}
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={`url(#gradient-${size})`}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="progress-ring"
        style={{
          filter: showGlow ? `drop-shadow(0 4px 12px ${color}40)` : 'none'
        }}
      />
      
      {/* Gradient definition */}
      <defs>
        <linearGradient id={`gradient-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={color} />
          <stop offset="100%" stopColor={adjustColor(color, 30)} />
        </linearGradient>
      </defs>
    </svg>
  )
}

// Helper to lighten a color
function adjustColor(color: string, amount: number): string {
  const hex = color.replace('#', '')
  const r = Math.min(255, parseInt(hex.substring(0, 2), 16) + amount)
  const g = Math.min(255, parseInt(hex.substring(2, 4), 16) + amount)
  const b = Math.min(255, parseInt(hex.substring(4, 6), 16) + amount)
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}
