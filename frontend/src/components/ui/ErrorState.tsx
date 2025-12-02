import { motion } from 'framer-motion'
import { AlertCircle, RefreshCw } from 'lucide-react'

interface ErrorStateProps {
  title?: string
  message: string
  onRetry?: () => void
}

export default function ErrorState({ 
  title = 'Something went wrong',
  message, 
  onRetry 
}: ErrorStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-12 px-6 text-center"
    >
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-400 to-red-500 flex items-center justify-center mb-4 shadow-lg">
        <AlertCircle className="w-8 h-8 text-white" />
      </div>
      <h3 className="text-lg font-semibold text-slate-800 mb-2">{title}</h3>
      <p className="text-slate-500 max-w-sm mb-6">{message}</p>
      {onRetry && (
        <button 
          onClick={onRetry} 
          className="flex items-center gap-2 btn-secondary"
        >
          <RefreshCw className="w-4 h-4" />
          Try Again
        </button>
      )}
    </motion.div>
  )
}






