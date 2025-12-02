import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle, XCircle, Info } from 'lucide-react'
import { useAppStore } from '../stores/appStore'

export default function Toast() {
  const { toast, hideToast } = useAppStore()

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-success-500" />,
    error: <XCircle className="w-5 h-5 text-danger-500" />,
    info: <Info className="w-5 h-5 text-secondary-500" />,
  }

  const bgColors = {
    success: 'bg-success-50 border-success-200',
    error: 'bg-danger-50 border-danger-200',
    info: 'bg-secondary-50 border-secondary-200',
  }

  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: 20, x: '-50%' }}
          animate={{ opacity: 1, y: 0, x: '-50%' }}
          exit={{ opacity: 0, y: 20, x: '-50%' }}
          className={`fixed bottom-24 lg:bottom-8 left-1/2 lg:left-auto lg:right-8 lg:translate-x-0 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl border shadow-medium ${bgColors[toast.type]}`}
          onClick={hideToast}
        >
          {icons[toast.type]}
          <span className="font-medium text-slate-700">{toast.message}</span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
