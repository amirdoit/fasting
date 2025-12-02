import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, Camera, Scan, AlertTriangle, CheckCircle, XCircle,
  HelpCircle, RefreshCw, Search, Package, Info, ImageIcon, Sparkles, Loader2
} from 'lucide-react'
import { useAppStore } from '../stores/appStore'
import { 
  openFoodFactsService, 
  type OpenFoodFactsProduct, 
  type FastingAnalysis 
} from '../services/openFoodFacts'
import { api } from '../services/api'
import type { PhotoScanResult, FastingStatus } from '../types'

interface FastingScannerProps {
  onClose: () => void
}

type ScannerMode = 'barcode' | 'photo'
type ScannerState = 'idle' | 'scanning' | 'analyzing' | 'result' | 'manual' | 'error' | 'photo-capture' | 'photo-result'

// States where mode tabs should be visible (allows switching modes)
const SWITCHABLE_STATES: ScannerState[] = ['idle', 'scanning', 'photo-capture', 'manual', 'error']

export default function FastingScanner({ onClose }: FastingScannerProps) {
  const { showToast } = useAppStore()
  
  const [mode, setMode] = useState<ScannerMode>('barcode')
  const [state, setState] = useState<ScannerState>('idle')
  const [product, setProduct] = useState<OpenFoodFactsProduct | null>(null)
  const [analysis, setAnalysis] = useState<FastingAnalysis | null>(null)
  const [photoResult, setPhotoResult] = useState<PhotoScanResult | null>(null)
  const [manualBarcode, setManualBarcode] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [, setCameraPermission] = useState<'granted' | 'denied' | 'unknown'>('unknown')
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  
  const scannerRef = useRef<HTMLDivElement>(null)
  const html5QrCodeRef = useRef<any>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Check camera permission on mount
  useEffect(() => {
    checkCameraPermission()
    return () => {
      stopScanner()
      stopPhotoCamera()
    }
  }, [])

  const checkCameraPermission = async () => {
    try {
      const result = await navigator.permissions.query({ name: 'camera' as PermissionName })
      setCameraPermission(result.state === 'granted' ? 'granted' : result.state === 'denied' ? 'denied' : 'unknown')
    } catch {
      setCameraPermission('unknown')
    }
  }

  const startScanner = async () => {
    try {
      setState('scanning')
      
      // Dynamically import html5-qrcode to avoid SSR issues
      const { Html5Qrcode } = await import('html5-qrcode')
      
      if (!scannerRef.current) return
      
      const scanner = new Html5Qrcode('qr-reader')
      html5QrCodeRef.current = scanner
      
      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 150 },
          aspectRatio: 1.777778
        },
        async (decodedText) => {
          // Stop scanner immediately after successful scan
          await stopScanner()
          handleBarcodeDetected(decodedText)
        },
        () => {} // Ignore scan errors (no QR in view)
      )
      
      setCameraPermission('granted')
    } catch (error: any) {
      console.error('Scanner error:', error)
      if (error.name === 'NotAllowedError') {
        setCameraPermission('denied')
        setErrorMessage('Camera access denied. Please enable camera permissions.')
      } else {
        setErrorMessage('Failed to start camera. Try entering barcode manually.')
      }
      setState('error')
    }
  }

  const stopScanner = async () => {
    if (html5QrCodeRef.current) {
      try {
        await html5QrCodeRef.current.stop()
        html5QrCodeRef.current = null
      } catch (e) {
        // Ignore stop errors
      }
    }
  }

  // Photo camera functions
  const startPhotoCamera = async () => {
    try {
      setState('photo-capture')
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setCameraPermission('granted')
    } catch (error: any) {
      console.error('Camera error:', error)
      if (error.name === 'NotAllowedError') {
        setCameraPermission('denied')
        setErrorMessage('Camera access denied. Please enable camera permissions.')
      } else {
        setErrorMessage('Failed to start camera. Try uploading a photo instead.')
      }
      setState('error')
    }
  }

  const stopPhotoCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
  }

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return
    
    const video = videoRef.current
    const canvas = canvasRef.current
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    ctx.drawImage(video, 0, 0)
    const imageData = canvas.toDataURL('image/jpeg', 0.8)
    setCapturedImage(imageData)
    stopPhotoCamera()
    
    // Analyze the captured image
    analyzePhoto(imageData)
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    
    const reader = new FileReader()
    reader.onload = (e) => {
      const imageData = e.target?.result as string
      setCapturedImage(imageData)
      analyzePhoto(imageData)
    }
    reader.readAsDataURL(file)
  }

  const analyzePhoto = async (imageData: string) => {
    setState('analyzing')
    
    try {
      // Extract base64 data (remove data:image/...;base64, prefix)
      const base64Data = imageData.includes('base64,') 
        ? imageData.split('base64,')[1] 
        : imageData
      
      const response = await api.scanFoodPhoto(base64Data, 'base64')
      
      if (!response.success || response.error) {
        setErrorMessage(response.error || 'Failed to analyze photo. Please try again.')
        setState('error')
        return
      }
      
      if (response.data?.error) {
        setErrorMessage(response.data.fastingStatus?.message || 'Could not identify food in this image.')
        setState('error')
        return
      }
      
      setPhotoResult(response.data!)
      setState('photo-result')
    } catch (error) {
      console.error('Photo analysis error:', error)
      setErrorMessage('Failed to analyze photo. Make sure AI is configured in settings.')
      setState('error')
    }
  }

  const handleBarcodeDetected = async (barcode: string) => {
    setState('analyzing')
    setManualBarcode('')
    
    try {
      const productData = await openFoodFactsService.getProduct(barcode)
      
      if (!productData) {
        setErrorMessage('Product not found in database. Try a different product or enter details manually.')
        setState('error')
        return
      }
      
      setProduct(productData)
      const fastingAnalysis = openFoodFactsService.analyzeForFasting(productData)
      setAnalysis(fastingAnalysis)
      setState('result')
    } catch (error) {
      console.error('Analysis error:', error)
      setErrorMessage('Failed to analyze product. Please try again.')
      setState('error')
    }
  }

  const handleManualSubmit = async () => {
    const barcode = manualBarcode.trim()
    if (!barcode) {
      showToast('Please enter a barcode', 'error')
      return
    }
    
    handleBarcodeDetected(barcode)
  }

  const handleRetry = () => {
    setProduct(null)
    setAnalysis(null)
    setPhotoResult(null)
    setCapturedImage(null)
    setErrorMessage('')
    setState('idle')
  }

  // Handle mode switching - properly cleanup current mode before switching
  const handleModeSwitch = useCallback(async (newMode: ScannerMode) => {
    if (newMode === mode) return
    
    // Stop any active cameras/scanners
    await stopScanner()
    stopPhotoCamera()
    
    // Reset state
    setProduct(null)
    setAnalysis(null)
    setPhotoResult(null)
    setCapturedImage(null)
    setErrorMessage('')
    setManualBarcode('')
    
    // Switch mode and reset to idle
    setMode(newMode)
    setState('idle')
  }, [mode])

  const getStatusIcon = (status: FastingAnalysis['status'] | FastingStatus['status']) => {
    switch (status) {
      case 'clean':
        return <CheckCircle className="w-16 h-16 text-emerald-500" />
      case 'dirty':
        return <AlertTriangle className="w-16 h-16 text-amber-500" />
      case 'breaks_fast':
        return <XCircle className="w-16 h-16 text-red-500" />
      default:
        return <HelpCircle className="w-16 h-16 text-slate-400" />
    }
  }

  const getStatusBgColor = (status: FastingAnalysis['status'] | FastingStatus['status']) => {
    switch (status) {
      case 'clean':
        return 'from-emerald-50 to-green-50 border-emerald-200'
      case 'dirty':
        return 'from-amber-50 to-yellow-50 border-amber-200'
      case 'breaks_fast':
        return 'from-red-50 to-pink-50 border-red-200'
      default:
        return 'from-slate-50 to-gray-50 border-slate-200'
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/90 z-50 flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 text-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
            <Scan className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg">Fasting Scanner</h1>
            <p className="text-xs text-white/60">Check if products break your fast</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl">
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Mode Tabs - visible in switchable states so users can change modes */}
      {SWITCHABLE_STATES.includes(state) && (
        <div className="flex justify-center gap-2 px-4 mb-4">
          <button
            onClick={() => handleModeSwitch('barcode')}
            className={`px-4 py-2 rounded-xl font-medium transition-colors flex items-center gap-2 ${
              mode === 'barcode' 
                ? 'bg-cyan-500 text-white' 
                : 'bg-white/10 text-white/70 hover:bg-white/20'
            }`}
          >
            <Scan className="w-4 h-4" />
            Barcode
          </button>
          <button
            onClick={() => handleModeSwitch('photo')}
            className={`px-4 py-2 rounded-xl font-medium transition-colors flex items-center gap-2 ${
              mode === 'photo' 
                ? 'bg-purple-500 text-white' 
                : 'bg-white/10 text-white/70 hover:bg-white/20'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            AI Photo
          </button>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <AnimatePresence mode="wait">
          {/* Idle State */}
          {state === 'idle' && mode === 'barcode' && (
            <motion.div
              key="idle-barcode"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center space-y-6 max-w-sm"
            >
              <div className="w-24 h-24 mx-auto rounded-3xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                <Package className="w-12 h-12 text-white" />
              </div>
              
              <div className="text-white">
                <h2 className="text-2xl font-bold mb-2">Scan a Barcode</h2>
                <p className="text-white/70">
                  Scan any food or drink barcode to check if it's safe during your fast
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={startScanner}
                  className="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-2xl font-bold text-white flex items-center justify-center gap-2"
                >
                  <Camera className="w-5 h-5" />
                  Scan Barcode
                </button>
                
                <button
                  onClick={() => setState('manual')}
                  className="w-full py-3 bg-white/10 rounded-xl text-white/80 hover:bg-white/20 transition-colors"
                >
                  Enter Barcode Manually
                </button>
              </div>

              <div className="flex items-center gap-4 text-sm text-white/50">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span>Clean Fast</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-amber-500" />
                  <span>Dirty Fast</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span>Breaks Fast</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* Photo Mode Idle */}
          {state === 'idle' && mode === 'photo' && (
            <motion.div
              key="idle-photo"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center space-y-6 max-w-sm"
            >
              <div className="w-24 h-24 mx-auto rounded-3xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                <Sparkles className="w-12 h-12 text-white" />
              </div>
              
              <div className="text-white">
                <h2 className="text-2xl font-bold mb-2">AI Food Scanner</h2>
                <p className="text-white/70">
                  Take a photo of your meal and AI will identify foods and estimate macros
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={startPhotoCamera}
                  className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl font-bold text-white flex items-center justify-center gap-2"
                >
                  <Camera className="w-5 h-5" />
                  Take Photo
                </button>
                
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-3 bg-white/10 rounded-xl text-white/80 hover:bg-white/20 transition-colors flex items-center justify-center gap-2"
                >
                  <ImageIcon className="w-5 h-5" />
                  Upload Photo
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>

              <div className="bg-white/10 rounded-xl p-4 text-left">
                <p className="text-white/60 text-sm">
                  <span className="text-purple-400 font-medium">Powered by GPT-5 Nano</span>
                  <br />
                  AI estimates portions and macros from your food photos. Works best with clear, well-lit photos of plated meals.
                </p>
              </div>
            </motion.div>
          )}

          {/* Photo Capture State */}
          {state === 'photo-capture' && (
            <motion.div
              key="photo-capture"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md"
            >
              <div className="relative rounded-2xl overflow-hidden bg-black">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full aspect-[4/3] object-cover"
                />
                <canvas ref={canvasRef} className="hidden" />
                
                {/* Capture button overlay */}
                <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                  <button
                    onClick={capturePhoto}
                    className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-lg hover:scale-105 transition-transform"
                  >
                    <div className="w-12 h-12 rounded-full border-4 border-purple-500" />
                  </button>
                </div>
              </div>
              
              <div className="mt-4 text-center text-white/70">
                <p>Point camera at your meal and tap to capture</p>
              </div>

              <button
                onClick={() => { stopPhotoCamera(); setState('idle') }}
                className="mt-4 w-full py-3 bg-white/10 rounded-xl text-white/80"
              >
                Cancel
              </button>
            </motion.div>
          )}

          {/* Scanning State */}
          {state === 'scanning' && (
            <motion.div
              key="scanning"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md"
            >
              <div 
                id="qr-reader" 
                ref={scannerRef}
                className="rounded-2xl overflow-hidden bg-black"
              />
              
              <div className="mt-4 text-center text-white/70">
                <p className="flex items-center justify-center gap-2">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  >
                    <Scan className="w-5 h-5" />
                  </motion.div>
                  Point camera at barcode
                </p>
              </div>

              <button
                onClick={() => { stopScanner(); setState('idle') }}
                className="mt-4 w-full py-3 bg-white/10 rounded-xl text-white/80"
              >
                Cancel
              </button>
            </motion.div>
          )}

          {/* Manual Entry State */}
          {state === 'manual' && (
            <motion.div
              key="manual"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-sm text-center space-y-6"
            >
              <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                <Search className="w-8 h-8 text-white" />
              </div>
              
              <div className="text-white">
                <h2 className="text-xl font-bold mb-2">Enter Barcode</h2>
                <p className="text-white/70 text-sm">
                  Type the barcode number found on the product packaging
                </p>
              </div>

              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="e.g., 5449000000996"
                  value={manualBarcode}
                  onChange={e => setManualBarcode(e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 text-center text-lg tracking-wider focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  autoFocus
                />
                
                <button
                  onClick={handleManualSubmit}
                  disabled={!manualBarcode.trim()}
                  className="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-2xl font-bold text-white disabled:opacity-50"
                >
                  Check Product
                </button>
                
                <button
                  onClick={() => setState('idle')}
                  className="w-full py-3 bg-white/10 rounded-xl text-white/80"
                >
                  Back
                </button>
              </div>
            </motion.div>
          )}

          {/* Analyzing State */}
          {state === 'analyzing' && (
            <motion.div
              key="analyzing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center text-white"
            >
              {capturedImage && (
                <div className="w-32 h-32 mx-auto mb-4 rounded-2xl overflow-hidden">
                  <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
                </div>
              )}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="w-16 h-16 mx-auto mb-4 rounded-full border-4 border-purple-500 border-t-transparent"
              />
              <p className="text-lg font-medium flex items-center justify-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                {mode === 'photo' ? 'AI analyzing your meal...' : 'Analyzing product...'}
              </p>
              <p className="text-white/60 text-sm mt-2">
                {mode === 'photo' ? 'Identifying foods and estimating macros' : 'Checking ingredients database'}
              </p>
            </motion.div>
          )}

          {/* Barcode Result State */}
          {state === 'result' && product && analysis && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-md bg-white rounded-3xl p-6 max-h-[80vh] overflow-y-auto"
            >
              {/* Status Badge */}
              <div className="text-center mb-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200 }}
                >
                  {getStatusIcon(analysis.status)}
                </motion.div>
                <h2 className={`text-2xl font-bold mt-4 ${
                  analysis.status === 'clean' ? 'text-emerald-600' :
                  analysis.status === 'dirty' ? 'text-amber-600' :
                  analysis.status === 'breaks_fast' ? 'text-red-600' : 'text-slate-600'
                }`}>
                  {analysis.statusLabel}
                </h2>
              </div>

              {/* Product Info */}
              <div className={`p-4 rounded-2xl border bg-gradient-to-br ${getStatusBgColor(analysis.status)} mb-4`}>
                <div className="flex gap-4">
                  {product.image_small_url && (
                    <img 
                      src={product.image_small_url} 
                      alt={product.product_name || 'Product'}
                      className="w-16 h-16 rounded-xl object-cover"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-800 truncate">
                      {product.product_name || 'Unknown Product'}
                    </h3>
                    {product.brands && (
                      <p className="text-sm text-slate-500">{product.brands}</p>
                    )}
                    {analysis.calories > 0 && (
                      <p className="text-xs text-slate-500 mt-1">
                        {analysis.calories} kcal per 100g • {analysis.sugars}g sugar
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Analysis Message */}
              <div className="bg-slate-50 rounded-xl p-4 mb-4">
                <p className="text-slate-700 text-sm">{analysis.message}</p>
                <p className="text-slate-500 text-xs mt-2 flex items-start gap-1">
                  <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
                  {analysis.recommendation}
                </p>
              </div>

              {/* Flagged Ingredients */}
              {analysis.flaggedIngredients.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-slate-700 mb-2">
                    Key Ingredients
                  </h4>
                  <div className="space-y-2">
                    {analysis.flaggedIngredients.slice(0, 5).map((item, idx) => (
                      <div 
                        key={idx}
                        className={`p-3 rounded-xl text-sm flex items-start gap-2 ${
                          item.type === 'breaks_fast' ? 'bg-red-50 text-red-700' :
                          item.type === 'dirty' ? 'bg-amber-50 text-amber-700' :
                          'bg-emerald-50 text-emerald-700'
                        }`}
                      >
                        <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                          item.type === 'breaks_fast' ? 'bg-red-500' :
                          item.type === 'dirty' ? 'bg-amber-500' : 'bg-emerald-500'
                        }`} />
                        <div>
                          <span className="font-medium">{item.name}</span>
                          <p className="text-xs opacity-80">{item.reason}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={handleRetry}
                  className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-medium flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Scan Another
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl font-medium"
                >
                  Done
                </button>
              </div>
            </motion.div>
          )}

          {/* Photo Result State */}
          {state === 'photo-result' && photoResult && (
            <motion.div
              key="photo-result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-md bg-white rounded-3xl p-6 max-h-[80vh] overflow-y-auto"
            >
              {/* Status Badge */}
              <div className="text-center mb-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200 }}
                >
                  {getStatusIcon(photoResult.fastingStatus.status)}
                </motion.div>
                <h2 className={`text-2xl font-bold mt-4 ${
                  photoResult.fastingStatus.status === 'clean' ? 'text-emerald-600' :
                  photoResult.fastingStatus.status === 'dirty' ? 'text-amber-600' :
                  photoResult.fastingStatus.status === 'breaks_fast' ? 'text-red-600' : 'text-slate-600'
                }`}>
                  {photoResult.fastingStatus.label}
                </h2>
              </div>

              {/* Captured Image & Totals */}
              <div className={`p-4 rounded-2xl border bg-gradient-to-br ${getStatusBgColor(photoResult.fastingStatus.status)} mb-4`}>
                <div className="flex gap-4">
                  {capturedImage && (
                    <img 
                      src={capturedImage} 
                      alt="Meal"
                      className="w-20 h-20 rounded-xl object-cover"
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-800 mb-2">Meal Totals</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Calories:</span>
                        <span className="font-medium text-slate-700">{photoResult.totals.calories || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Protein:</span>
                        <span className="font-medium text-slate-700">{photoResult.totals.protein || 0}g</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Carbs:</span>
                        <span className="font-medium text-slate-700">{photoResult.totals.carbs || 0}g</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Fat:</span>
                        <span className="font-medium text-slate-700">{photoResult.totals.fat || 0}g</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Fasting Message */}
              <div className="bg-slate-50 rounded-xl p-4 mb-4">
                <p className="text-slate-700 text-sm">{photoResult.fastingStatus.message}</p>
                {photoResult.notes && (
                  <p className="text-slate-500 text-xs mt-2 flex items-start gap-1">
                    <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    {photoResult.notes}
                  </p>
                )}
              </div>

              {/* Identified Foods */}
              {photoResult.foods.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-slate-700 mb-2">
                    Identified Foods
                  </h4>
                  <div className="space-y-2">
                    {photoResult.foods.map((food, idx) => (
                      <div 
                        key={idx}
                        className="p-3 rounded-xl bg-slate-50 text-sm"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="font-medium text-slate-800">{food.name}</span>
                            <p className="text-xs text-slate-500">{food.portion}</p>
                          </div>
                          <div className="text-right">
                            <span className="font-medium text-slate-700">{food.calories} kcal</span>
                            <p className="text-xs text-slate-500">
                              {Math.round(food.confidence * 100)}% confident
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-3 mt-2 text-xs text-slate-500">
                          <span>P: {food.protein}g</span>
                          <span>C: {food.carbs}g</span>
                          <span>F: {food.fat}g</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Badge */}
              <div className="text-center text-xs text-slate-400 mb-4 flex items-center justify-center gap-1">
                <Sparkles className="w-3 h-3" />
                Analyzed by {photoResult.model}
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={handleRetry}
                  className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-medium flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Scan Another
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium"
                >
                  Done
                </button>
              </div>
            </motion.div>
          )}

          {/* Error State */}
          {state === 'error' && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center space-y-6 max-w-sm"
            >
              <div className="w-20 h-20 mx-auto rounded-full bg-red-500/20 flex items-center justify-center">
                <AlertTriangle className="w-10 h-10 text-red-400" />
              </div>
              
              <div className="text-white">
                <h2 className="text-xl font-bold mb-2">Oops!</h2>
                <p className="text-white/70">{errorMessage}</p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleRetry}
                  className="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-2xl font-bold text-white flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-5 h-5" />
                  Try Again
                </button>
                
                {mode === 'barcode' && (
                  <button
                    onClick={() => setState('manual')}
                    className="w-full py-3 bg-white/10 rounded-xl text-white/80"
                  >
                    Enter Barcode Manually
                  </button>
                )}
                
                {mode === 'photo' && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-3 bg-white/10 rounded-xl text-white/80"
                  >
                    Upload Photo Instead
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="p-4 text-center">
        <p className="text-white/40 text-xs">
          {mode === 'barcode' 
            ? 'Powered by Open Food Facts • Data may vary by region'
            : 'Powered by GPT-5 Nano via OpenRouter • AI estimates may vary'
          }
        </p>
      </div>
    </motion.div>
  )
}
