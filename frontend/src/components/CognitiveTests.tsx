import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Brain, Zap, Target, Trophy, X,
  Clock, TrendingUp, AlertCircle, CheckCircle
} from 'lucide-react'
import { useCognitiveStore } from '../stores/cognitiveStore'
import { useFastingStore } from '../stores/fastingStore'
import { useAppStore } from '../stores/appStore'

type TestType = 'reaction' | 'stroop' | null
type StroopColor = 'red' | 'blue' | 'green' | 'yellow'

interface ReactionTestState {
  phase: 'waiting' | 'ready' | 'go' | 'result' | 'early'
  startTime: number
  reactionTime: number
  attempts: number[]
}

interface StroopTestState {
  phase: 'intro' | 'playing' | 'result'
  currentWord: string
  currentColor: StroopColor
  score: number
  total: number
  startTime: number
  timeLeft: number
}

const STROOP_WORDS: StroopColor[] = ['red', 'blue', 'green', 'yellow']
const STROOP_COLORS: Record<StroopColor, string> = {
  red: '#EF4444',
  blue: '#3B82F6',
  green: '#22C55E',
  yellow: '#EAB308'
}

export default function CognitiveTests() {
  const { results, averages, fetchResults, saveResult, getImprovementMessage } = useCognitiveStore()
  const { isActive, getElapsedTime } = useFastingStore()
  const { showToast } = useAppStore()
  
  const [activeTest, setActiveTest] = useState<TestType>(null)
  const [showHistory, setShowHistory] = useState(false)
  
  // Reaction test state
  const [reactionState, setReactionState] = useState<ReactionTestState>({
    phase: 'waiting',
    startTime: 0,
    reactionTime: 0,
    attempts: []
  })
  
  // Stroop test state
  const [stroopState, setStroopState] = useState<StroopTestState>({
    phase: 'intro',
    currentWord: 'red',
    currentColor: 'blue',
    score: 0,
    total: 0,
    startTime: 0,
    timeLeft: 30
  })
  
  const timerRef = useRef<number | null>(null)
  const stroopTimerRef = useRef<number | null>(null)

  useEffect(() => {
    fetchResults()
  }, [fetchResults])

  // Determine fasting state
  const fastingHours = isActive ? getElapsedTime() / (1000 * 60 * 60) : 0
  const fastingState: 'fed' | 'fasted' = fastingHours >= 12 ? 'fasted' : 'fed'

  // Reaction Test Logic
  const startReactionTest = useCallback(() => {
    setReactionState({
      phase: 'waiting',
      startTime: 0,
      reactionTime: 0,
      attempts: []
    })
    
    // Random delay between 2-5 seconds
    const delay = 2000 + Math.random() * 3000
    
    timerRef.current = window.setTimeout(() => {
      setReactionState(prev => ({
        ...prev,
        phase: 'go',
        startTime: Date.now()
      }))
    }, delay)
  }, [])

  const handleReactionClick = useCallback(() => {
    const { phase, startTime, attempts } = reactionState
    
    if (phase === 'waiting') {
      // Clicked too early
      if (timerRef.current) clearTimeout(timerRef.current)
      setReactionState(prev => ({ ...prev, phase: 'early' }))
      return
    }
    
    if (phase === 'go') {
      const reactionTime = Date.now() - startTime
      const newAttempts = [...attempts, reactionTime]
      
      if (newAttempts.length >= 5) {
        // Test complete
        const avgTime = newAttempts.reduce((a, b) => a + b, 0) / newAttempts.length
        setReactionState(prev => ({
          ...prev,
          phase: 'result',
          reactionTime: avgTime,
          attempts: newAttempts
        }))
      } else {
        // Next attempt
        setReactionState(prev => ({
          ...prev,
          phase: 'waiting',
          attempts: newAttempts
        }))
        
        const delay = 2000 + Math.random() * 3000
        timerRef.current = window.setTimeout(() => {
          setReactionState(prev => ({
            ...prev,
            phase: 'go',
            startTime: Date.now()
          }))
        }, delay)
      }
    }
  }, [reactionState])

  const saveReactionResult = async () => {
    const success = await saveResult({
      testType: 'reaction',
      score: reactionState.reactionTime,
      fastingState,
      fastingHours
    })
    
    if (success) {
      showToast('Result saved! 🧠', 'success')
      setActiveTest(null)
    } else {
      showToast('Failed to save result', 'error')
    }
  }

  // Stroop Test Logic
  const generateStroopQuestion = useCallback(() => {
    const word = STROOP_WORDS[Math.floor(Math.random() * STROOP_WORDS.length)]
    let color = STROOP_WORDS[Math.floor(Math.random() * STROOP_WORDS.length)]
    // Make sure color is different from word 50% of the time
    if (Math.random() > 0.5) {
      while (color === word) {
        color = STROOP_WORDS[Math.floor(Math.random() * STROOP_WORDS.length)]
      }
    }
    return { word, color: color as StroopColor }
  }, [])

  const startStroopTest = useCallback(() => {
    const { word, color } = generateStroopQuestion()
    setStroopState({
      phase: 'playing',
      currentWord: word,
      currentColor: color,
      score: 0,
      total: 0,
      startTime: Date.now(),
      timeLeft: 30
    })
    
    // Start countdown
    stroopTimerRef.current = window.setInterval(() => {
      setStroopState(prev => {
        if (prev.timeLeft <= 1) {
          if (stroopTimerRef.current) clearInterval(stroopTimerRef.current)
          return { ...prev, phase: 'result', timeLeft: 0 }
        }
        return { ...prev, timeLeft: prev.timeLeft - 1 }
      })
    }, 1000)
  }, [generateStroopQuestion])

  const handleStroopAnswer = (answer: StroopColor) => {
    if (stroopState.phase !== 'playing') return
    
    const isCorrect = answer === stroopState.currentColor
    const { word, color } = generateStroopQuestion()
    
    setStroopState(prev => ({
      ...prev,
      currentWord: word,
      currentColor: color,
      score: isCorrect ? prev.score + 1 : prev.score,
      total: prev.total + 1
    }))
  }

  const saveStroopResult = async () => {
    const accuracy = stroopState.total > 0 ? (stroopState.score / stroopState.total) * 100 : 0
    const success = await saveResult({
      testType: 'stroop',
      score: accuracy,
      fastingState,
      fastingHours
    })
    
    if (success) {
      showToast('Result saved! 🧠', 'success')
      setActiveTest(null)
    } else {
      showToast('Failed to save result', 'error')
    }
  }

  // Cleanup
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      if (stroopTimerRef.current) clearInterval(stroopTimerRef.current)
    }
  }, [])

  const renderReactionTest = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-slate-900 z-50 flex flex-col"
    >
      <div className="p-4 flex items-center justify-between">
        <h2 className="text-white font-bold text-lg">Reaction Time Test</h2>
        <button 
          onClick={() => {
            if (timerRef.current) clearTimeout(timerRef.current)
            setActiveTest(null)
          }}
          className="p-2 hover:bg-white/10 rounded-xl"
        >
          <X className="w-6 h-6 text-white" />
        </button>
      </div>
      
      <div 
        className={`flex-1 flex items-center justify-center cursor-pointer transition-colors ${
          reactionState.phase === 'waiting' ? 'bg-red-500' :
          reactionState.phase === 'go' ? 'bg-green-500' :
          reactionState.phase === 'early' ? 'bg-orange-500' :
          'bg-slate-800'
        }`}
        onClick={reactionState.phase !== 'result' ? handleReactionClick : undefined}
      >
        <div className="text-center text-white p-8">
          {reactionState.phase === 'waiting' && (
            <>
              <div className="text-6xl mb-4">🛑</div>
              <h3 className="text-2xl font-bold mb-2">Wait for green...</h3>
              <p className="text-white/70">Attempt {reactionState.attempts.length + 1} of 5</p>
            </>
          )}
          
          {reactionState.phase === 'go' && (
            <>
              <div className="text-6xl mb-4">👆</div>
              <h3 className="text-3xl font-bold">TAP NOW!</h3>
            </>
          )}
          
          {reactionState.phase === 'early' && (
            <>
              <div className="text-6xl mb-4">⚡</div>
              <h3 className="text-2xl font-bold mb-2">Too early!</h3>
              <p className="text-white/70 mb-4">Wait for the green screen</p>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  startReactionTest()
                }}
                className="px-6 py-3 bg-white text-orange-500 rounded-xl font-bold"
              >
                Try Again
              </button>
            </>
          )}
          
          {reactionState.phase === 'result' && (
            <div className="max-w-sm mx-auto">
              <div className="text-6xl mb-4">🎯</div>
              <h3 className="text-2xl font-bold mb-2">Test Complete!</h3>
              <div className="bg-white/10 rounded-2xl p-6 mb-6">
                <div className="text-5xl font-bold mb-2">
                  {Math.round(reactionState.reactionTime)}
                  <span className="text-2xl">ms</span>
                </div>
                <p className="text-white/70">Average reaction time</p>
              </div>
              <div className="text-sm text-white/60 mb-6">
                {reactionState.attempts.map((t, i) => (
                  <span key={i} className="inline-block mx-1">{Math.round(t)}ms</span>
                ))}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => startReactionTest()}
                  className="flex-1 px-4 py-3 bg-white/10 text-white rounded-xl font-medium"
                >
                  Try Again
                </button>
                <button
                  onClick={saveReactionResult}
                  className="flex-1 px-4 py-3 bg-white text-slate-900 rounded-xl font-bold"
                >
                  Save Result
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )

  const renderStroopTest = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-slate-900 z-50 flex flex-col"
    >
      <div className="p-4 flex items-center justify-between">
        <h2 className="text-white font-bold text-lg">Stroop Test</h2>
        <button 
          onClick={() => {
            if (stroopTimerRef.current) clearInterval(stroopTimerRef.current)
            setActiveTest(null)
          }}
          className="p-2 hover:bg-white/10 rounded-xl"
        >
          <X className="w-6 h-6 text-white" />
        </button>
      </div>
      
      {stroopState.phase === 'intro' && (
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center text-white max-w-md">
            <div className="text-6xl mb-6">🎨</div>
            <h3 className="text-2xl font-bold mb-4">Color Recognition Test</h3>
            <p className="text-white/70 mb-6">
              You'll see color words displayed in different colors. 
              Tap the button matching the <strong>COLOR</strong> of the text, 
              not the word itself!
            </p>
            <div className="bg-white/10 rounded-2xl p-4 mb-6">
              <p className="text-sm text-white/60 mb-2">Example:</p>
              <p className="text-3xl font-bold" style={{ color: STROOP_COLORS.blue }}>RED</p>
              <p className="text-sm text-white/60 mt-2">Answer: BLUE (the color, not the word)</p>
            </div>
            <button
              onClick={startStroopTest}
              className="w-full px-6 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-bold text-lg"
            >
              Start Test (30 seconds)
            </button>
          </div>
        </div>
      )}
      
      {stroopState.phase === 'playing' && (
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="text-white/70">
                <Clock className="w-5 h-5 inline mr-1" />
                {stroopState.timeLeft}s
              </div>
              <div className="text-white/70">
                Score: {stroopState.score}/{stroopState.total}
              </div>
            </div>
            <div 
              className="text-6xl font-bold uppercase"
              style={{ color: STROOP_COLORS[stroopState.currentColor] }}
            >
              {stroopState.currentWord}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
            {STROOP_WORDS.map(color => (
              <button
                key={color}
                onClick={() => handleStroopAnswer(color)}
                className="py-6 rounded-2xl font-bold text-white text-lg uppercase transition-transform active:scale-95"
                style={{ backgroundColor: STROOP_COLORS[color] }}
              >
                {color}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {stroopState.phase === 'result' && (
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center text-white max-w-sm">
            <div className="text-6xl mb-4">🏆</div>
            <h3 className="text-2xl font-bold mb-2">Test Complete!</h3>
            <div className="bg-white/10 rounded-2xl p-6 mb-6">
              <div className="text-5xl font-bold mb-2">
                {stroopState.total > 0 ? Math.round((stroopState.score / stroopState.total) * 100) : 0}%
              </div>
              <p className="text-white/70">Accuracy</p>
              <p className="text-sm text-white/50 mt-2">
                {stroopState.score} correct out of {stroopState.total}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setStroopState(prev => ({ ...prev, phase: 'intro' }))}
                className="flex-1 px-4 py-3 bg-white/10 text-white rounded-xl font-medium"
              >
                Try Again
              </button>
              <button
                onClick={saveStroopResult}
                className="flex-1 px-4 py-3 bg-white text-slate-900 rounded-xl font-bold"
              >
                Save Result
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center shadow-lg">
          <Brain className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800">Brain Gym</h2>
          <p className="text-sm text-slate-500">Test your cognitive performance</p>
        </div>
      </div>

      {/* Current State */}
      <div className={`p-4 rounded-2xl border ${
        fastingState === 'fasted' 
          ? 'bg-emerald-50 border-emerald-200' 
          : 'bg-amber-50 border-amber-200'
      }`}>
        <div className="flex items-center gap-2">
          {fastingState === 'fasted' ? (
            <CheckCircle className="w-5 h-5 text-emerald-500" />
          ) : (
            <AlertCircle className="w-5 h-5 text-amber-500" />
          )}
          <span className={`font-medium ${
            fastingState === 'fasted' ? 'text-emerald-700' : 'text-amber-700'
          }`}>
            {fastingState === 'fasted' 
              ? `Fasted State (${fastingHours.toFixed(1)}h)` 
              : 'Fed State'}
          </span>
        </div>
        <p className="text-sm text-slate-600 mt-1">
          {fastingState === 'fasted' 
            ? 'Your brain may be running on ketones - great for cognitive tests!'
            : 'Test now to establish your baseline, then compare when fasted.'}
        </p>
      </div>

      {/* Test Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Reaction Time Test */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            setActiveTest('reaction')
            startReactionTest()
          }}
          className="card-elevated cursor-pointer hover:shadow-strong transition-shadow"
        >
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-lg">
              <Zap className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-slate-800 mb-1">Reaction Time</h3>
              <p className="text-sm text-slate-500 mb-3">
                Measure how quickly you can respond to visual stimuli
              </p>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Clock className="w-3 h-3" />
                ~30 seconds
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stroop Test */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setActiveTest('stroop')}
          className="card-elevated cursor-pointer hover:shadow-strong transition-shadow"
        >
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center shadow-lg">
              <Target className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-slate-800 mb-1">Stroop Test</h3>
              <p className="text-sm text-slate-500 mb-3">
                Test your focus and cognitive flexibility
              </p>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Clock className="w-3 h-3" />
                30 seconds
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Results Summary */}
      {(averages.fedReactionTime > 0 || averages.fastedReactionTime > 0) && (
        <div className="card-elevated bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-100">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-purple-500" />
            <h3 className="font-bold text-slate-800">Your Improvement</h3>
          </div>
          
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-600">
                {averages.fedReactionTime > 0 ? `${Math.round(averages.fedReactionTime)}ms` : '--'}
              </div>
              <div className="text-xs text-slate-500">Fed State</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-600">
                {averages.fastedReactionTime > 0 ? `${Math.round(averages.fastedReactionTime)}ms` : '--'}
              </div>
              <div className="text-xs text-slate-500">Fasted State</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${
                averages.improvement > 0 ? 'text-emerald-600' : 
                averages.improvement < 0 ? 'text-red-500' : 'text-slate-600'
              }`}>
                {averages.improvement !== 0 ? `${averages.improvement > 0 ? '+' : ''}${averages.improvement.toFixed(1)}%` : '--'}
              </div>
              <div className="text-xs text-slate-500">Improvement</div>
            </div>
          </div>
          
          <p className="text-sm text-purple-700 text-center font-medium">
            {getImprovementMessage()}
          </p>
        </div>
      )}

      {/* Recent Results */}
      {results.length > 0 && (
        <div>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-800 mb-3"
          >
            <Trophy className="w-4 h-4" />
            Recent Results ({results.length})
          </button>
          
          <AnimatePresence>
            {showHistory && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="space-y-2">
                  {results.slice(0, 10).map((result) => (
                    <div 
                      key={result.id}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-xl"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          result.testType === 'reaction' 
                            ? 'bg-green-100 text-green-600' 
                            : 'bg-purple-100 text-purple-600'
                        }`}>
                          {result.testType === 'reaction' ? <Zap className="w-4 h-4" /> : <Target className="w-4 h-4" />}
                        </div>
                        <div>
                          <div className="font-medium text-slate-800 text-sm">
                            {result.testType === 'reaction' ? 'Reaction Time' : 'Stroop Test'}
                          </div>
                          <div className="text-xs text-slate-500">
                            {result.fastingState === 'fasted' ? `Fasted (${result.fastingHours.toFixed(1)}h)` : 'Fed'}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-slate-800">
                          {result.testType === 'reaction' 
                            ? `${Math.round(result.score)}ms` 
                            : `${Math.round(result.score)}%`}
                        </div>
                        <div className="text-xs text-slate-500">
                          {new Date(result.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Test Modals */}
      <AnimatePresence>
        {activeTest === 'reaction' && renderReactionTest()}
        {activeTest === 'stroop' && renderStroopTest()}
      </AnimatePresence>
    </div>
  )
}

