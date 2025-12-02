import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Camera, X, Loader2, Zap, AlertTriangle, CheckCircle,
  Beef, Wheat, Droplets, Leaf, RotateCcw
} from 'lucide-react'
import { api } from '../services/api'
import { useAppStore } from '../stores/appStore'

interface ScanResult {
  name: string
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber: number
  glycemicLoad: 'low' | 'medium' | 'high'
  fastingScore: number
  suggestions: string[]
}

interface FoodScannerProps {
  onClose?: () => void
  onScanComplete?: (result: ScanResult) => void
}

export default function FoodScanner({ onClose, onScanComplete }: FoodScannerProps) {
  const { showToast } = useAppStore()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  
  const [mode, setMode] = useState<'select' | 'camera' | 'preview' | 'scanning' | 'result'>('select')
  const [imageData, setImageData] = useState<string | null>(null)
  const [result, setResult] = useState<ScanResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      })
      setStream(mediaStream)
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }
      setMode('camera')
    } catch (err) {
      console.error('Camera error:', err)
      setError('Could not access camera. Please use file upload instead.')
      setMode('select')
    }
  }, [])

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
  }, [stream])

  const capturePhoto = useCallback(() => {
    if (!videoRef.current) return
    
    const canvas = document.createElement('canvas')
    canvas.width = videoRef.current.videoWidth
    canvas.height = videoRef.current.videoHeight
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0)
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8)
      setImageData(dataUrl)
      stopCamera()
      setMode('preview')
    }
  }, [stopCamera])

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }
    
    const reader = new FileReader()
    reader.onload = (e) => {
      setImageData(e.target?.result as string)
      setMode('preview')
    }
    reader.readAsDataURL(file)
  }, [])

  const analyzeImage = useCallback(async () => {
    if (!imageData) return
    
    setMode('scanning')
    setError(null)
    
    try {
      // Extract base64 data (remove data URL prefix)
      const base64 = imageData.split(',')[1]
      
      const response = await api.scanFood(base64)
      
      if (response.success && response.data) {
        setResult(response.data)
        setMode('result')
        if (onScanComplete) {
          onScanComplete(response.data)
        }
      } else {
        throw new Error(response.error || 'Failed to analyze image')
      }
    } catch (err) {
      console.error('Scan error:', err)
      setError('Failed to analyze the image. Please try again.')
      setMode('preview')
    }
  }, [imageData, onScanComplete])

  const reset = useCallback(() => {
    setImageData(null)
    setResult(null)
    setError(null)
    setMode('select')
    stopCamera()
  }, [stopCamera])

  const handleClose = useCallback(() => {
    stopCamera()
    if (onClose) onClose()
  }, [stopCamera, onClose])

  const getGlycemicColor = (gl: 'low' | 'medium' | 'high') => {
    switch (gl) {
      case 'low': return 'text-emerald-600 bg-emerald-100'
      case 'medium': return 'text-amber-600 bg-amber-100'
      case 'high': return 'text-red-600 bg-red-100'
    }
  }

  const getFastingScoreColor = (score: number) => {
    if (score >= 80) return 'from-emerald-400 to-green-500'
    if (score >= 60) return 'from-amber-400 to-yellow-500'
    return 'from-red-400 to-orange-500'
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-slate-900 z-50 flex flex-col"
    >
      {/* Header */}
      <div className="p-4 flex items-center justify-between bg-slate-800">
        <h2 className="text-white font-bold text-lg flex items-center gap-2">
          <Camera className="w-5 h-5" />
          Food Scanner
        </h2>
        <button 
          onClick={handleClose}
          className="p-2 hover:bg-white/10 rounded-xl"
        >
          <X className="w-6 h-6 text-white" />
        </button>
      </div>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-red-500 text-white px-4 py-3 flex items-center gap-2"
          >
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
            <button onClick={() => setError(null)} className="ml-auto">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 overflow-y-auto">
        {/* Selection Mode */}
        {mode === 'select' && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center max-w-sm"
          >
            <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-lg">
              <Camera className="w-12 h-12 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Scan Your Food</h3>
            <p className="text-white/70 mb-8">
              Take a photo or upload an image to instantly get nutritional information
            </p>
            
            <div className="space-y-4">
              <button
                onClick={startCamera}
                className="w-full py-4 bg-gradient-to-r from-primary-400 to-primary-500 text-white rounded-2xl font-bold text-lg flex items-center justify-center gap-2 shadow-lg"
              >
                <Camera className="w-5 h-5" />
                Take Photo
              </button>
              
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-4 bg-white/10 text-white rounded-2xl font-medium flex items-center justify-center gap-2"
              >
                <Zap className="w-5 h-5" />
                Upload Image
              </button>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          </motion.div>
        )}

        {/* Camera Mode */}
        {mode === 'camera' && (
          <div className="relative w-full max-w-md">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full rounded-2xl overflow-hidden"
            />
            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
              <button
                onClick={reset}
                className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center"
              >
                <X className="w-6 h-6 text-white" />
              </button>
              <button
                onClick={capturePhoto}
                className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg"
              >
                <div className="w-16 h-16 bg-primary-500 rounded-full" />
              </button>
              <div className="w-14" /> {/* Spacer for alignment */}
            </div>
          </div>
        )}

        {/* Preview Mode */}
        {mode === 'preview' && imageData && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md"
          >
            <img
              src={imageData}
              alt="Food preview"
              className="w-full rounded-2xl mb-6"
            />
            <div className="flex gap-4">
              <button
                onClick={reset}
                className="flex-1 py-4 bg-white/10 text-white rounded-2xl font-medium flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-5 h-5" />
                Retake
              </button>
              <button
                onClick={analyzeImage}
                className="flex-1 py-4 bg-gradient-to-r from-primary-400 to-primary-500 text-white rounded-2xl font-bold flex items-center justify-center gap-2"
              >
                <Zap className="w-5 h-5" />
                Analyze
              </button>
            </div>
          </motion.div>
        )}

        {/* Scanning Mode */}
        {mode === 'scanning' && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center"
          >
            <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-lg">
              <Loader2 className="w-12 h-12 text-white animate-spin" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Analyzing...</h3>
            <p className="text-white/70">
              Our AI is identifying the food and calculating nutrition
            </p>
          </motion.div>
        )}

        {/* Result Mode */}
        {mode === 'result' && result && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md space-y-4"
          >
            {/* Food Name & Score */}
            <div className="bg-white rounded-3xl p-6 text-center">
              <h3 className="text-2xl font-bold text-slate-800 mb-2">{result.name}</h3>
              
              <div className="flex items-center justify-center gap-4 mb-4">
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${getGlycemicColor(result.glycemicLoad)}`}>
                  {result.glycemicLoad.toUpperCase()} GI
                </div>
              </div>
              
              {/* Fasting Score */}
              <div className="mb-4">
                <p className="text-sm text-slate-500 mb-2">Fasting Quality Score</p>
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r ${getFastingScoreColor(result.fastingScore)} text-white font-bold`}>
                  <CheckCircle className="w-5 h-5" />
                  {result.fastingScore}/100
                </div>
              </div>
            </div>

            {/* Macros */}
            <div className="bg-white rounded-3xl p-6">
              <h4 className="font-bold text-slate-800 mb-4 text-center">Nutritional Info</h4>
              
              <div className="flex items-center justify-center mb-6">
                <div className="text-center">
                  <div className="text-4xl font-bold text-slate-800">{result.calories}</div>
                  <div className="text-sm text-slate-500">calories</div>
                </div>
              </div>
              
              <div className="grid grid-cols-4 gap-2">
                <div className="text-center p-3 bg-red-50 rounded-2xl">
                  <Beef className="w-5 h-5 mx-auto mb-1 text-red-500" />
                  <div className="font-bold text-slate-800">{result.protein}g</div>
                  <div className="text-xs text-slate-500">Protein</div>
                </div>
                <div className="text-center p-3 bg-amber-50 rounded-2xl">
                  <Wheat className="w-5 h-5 mx-auto mb-1 text-amber-500" />
                  <div className="font-bold text-slate-800">{result.carbs}g</div>
                  <div className="text-xs text-slate-500">Carbs</div>
                </div>
                <div className="text-center p-3 bg-yellow-50 rounded-2xl">
                  <Droplets className="w-5 h-5 mx-auto mb-1 text-yellow-500" />
                  <div className="font-bold text-slate-800">{result.fat}g</div>
                  <div className="text-xs text-slate-500">Fat</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-2xl">
                  <Leaf className="w-5 h-5 mx-auto mb-1 text-green-500" />
                  <div className="font-bold text-slate-800">{result.fiber}g</div>
                  <div className="text-xs text-slate-500">Fiber</div>
                </div>
              </div>
            </div>

            {/* Suggestions */}
            {result.suggestions.length > 0 && (
              <div className="bg-white rounded-3xl p-6">
                <h4 className="font-bold text-slate-800 mb-3">Tips</h4>
                <ul className="space-y-2">
                  {result.suggestions.map((tip, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                      <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-4">
              <button
                onClick={reset}
                className="flex-1 py-4 bg-white text-slate-800 rounded-2xl font-medium flex items-center justify-center gap-2"
              >
                <Camera className="w-5 h-5" />
                Scan Another
              </button>
              <button
                onClick={() => {
                  showToast('Meal logged! 🍽️', 'success')
                  handleClose()
                }}
                className="flex-1 py-4 bg-gradient-to-r from-primary-400 to-primary-500 text-white rounded-2xl font-bold flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-5 h-5" />
                Log Meal
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}

