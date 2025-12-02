import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import CirclesList from './CirclesList'
import CircleDetail from './CircleDetail'
import type { Circle } from '../../types'

export default function CirclesView() {
  const [selectedCircle, setSelectedCircle] = useState<Circle | null>(null)

  const handleSelectCircle = (circle: Circle) => {
    setSelectedCircle(circle)
  }

  const handleBack = () => {
    setSelectedCircle(null)
  }

  return (
    <AnimatePresence mode="wait">
      {selectedCircle ? (
        <motion.div
          key="detail"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          <CircleDetail 
            circleId={selectedCircle.id} 
            onBack={handleBack} 
          />
        </motion.div>
      ) : (
        <motion.div
          key="list"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ duration: 0.2 }}
        >
          <CirclesList onSelectCircle={handleSelectCircle} />
        </motion.div>
      )}
    </AnimatePresence>
  )
}

