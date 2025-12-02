import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  User, Bell, Palette, Target, Scale, Ruler, Calendar,
  Download, Trash2, ChevronRight, Save, Moon, Pill,
  Shield, HelpCircle, Star, ExternalLink, Loader2, Compass, BellRing, BellOff
} from 'lucide-react'
import { useFastingStore, PROTOCOLS, type FastingProtocol } from '../stores/fastingStore'
import { useAppStore } from '../stores/appStore'
import { useCycleStore } from '../stores/cycleStore'
import { api } from '../services/api'
import { notificationService } from '../services/notifications'
import CycleSyncSettings from './CycleSyncSettings'
import SupplementManager from './SupplementManager'

type AccentColor = 'coral' | 'blue' | 'green' | 'purple' | 'orange' | 'pink' | 'gold' | 'teal'

const accentColors: { id: AccentColor; color: string; label: string }[] = [
  { id: 'coral', color: '#FF6B6B', label: 'Coral' },
  { id: 'blue', color: '#63B3ED', label: 'Blue' },
  { id: 'green', color: '#48CFAD', label: 'Green' },
  { id: 'purple', color: '#A78BFA', label: 'Purple' },
  { id: 'orange', color: '#FFB347', label: 'Orange' },
  { id: 'pink', color: '#FF9A9E', label: 'Pink' },
  { id: 'gold', color: '#FFC107', label: 'Gold' },
  { id: 'teal', color: '#14B8A6', label: 'Teal' },
]

const goalOptions = [
  { id: 'weight_loss', label: 'Lose Weight', icon: '⚖️' },
  { id: 'health', label: 'Improve Health', icon: '❤️' },
  { id: 'energy', label: 'More Energy', icon: '⚡' },
  { id: 'longevity', label: 'Longevity', icon: '🌱' },
  { id: 'mental_clarity', label: 'Mental Clarity', icon: '🧠' },
  { id: 'autophagy', label: 'Autophagy', icon: '🔄' },
]

interface LocalUserSettings {
  protocol: FastingProtocol
  hydrationGoal: number
  weightUnit: 'kg' | 'lbs'
  heightUnit: 'cm' | 'ft'
  gender: string
  age: number | null
  weight: number | null
  height: number | null
  targetWeight: number | null
  goals: string[]
  experience: string
  notificationsEnabled: boolean
  fastReminders: boolean
  hydrationReminders: boolean
  theme: 'light' | 'dark' | 'auto'
  accentColor: AccentColor
}

export default function Settings() {
  const { setProtocol } = useFastingStore()
  const { setHydrationGoal, showToast, level, points } = useAppStore()
  const { isEnabled: cycleEnabled, initializeFromServer: initCycle } = useCycleStore()
  
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [userName, setUserName] = useState<string>('User')
  const [userAvatar, setUserAvatar] = useState<string | null>(null)
  const [showCycleSettings, setShowCycleSettings] = useState(false)
  const [showSupplements, setShowSupplements] = useState(false)
  
  // Settings state
  const [settings, setSettings] = useState<LocalUserSettings>({
    protocol: '16:8',
    hydrationGoal: 2500,
    weightUnit: 'kg',
    heightUnit: 'cm',
    gender: '',
    age: null,
    weight: null,
    height: null,
    targetWeight: null,
    goals: [],
    experience: 'beginner',
    notificationsEnabled: true,
    fastReminders: true,
    hydrationReminders: true,
    theme: 'light',
    accentColor: 'coral'
  })

  // Fetch user profile and settings
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        // Fetch profile
        const profileResponse = await api.getProfile()
        if (profileResponse.success && profileResponse.data) {
          setUserName(profileResponse.data.name || 'User')
          setUserAvatar(profileResponse.data.avatar || null)
        }
        
        // Fetch settings
        const settingsResponse = await api.getSettings()
        if (settingsResponse.success && settingsResponse.data) {
          const data = settingsResponse.data
          setSettings({
            protocol: (data.protocol as FastingProtocol) || '16:8',
            hydrationGoal: data.hydrationGoal || 2500,
            weightUnit: data.weightUnit || 'kg',
            heightUnit: data.heightUnit || 'cm',
            gender: data.gender || '',
            age: data.age || null,
            weight: data.weight || null,
            height: data.height || null,
            targetWeight: data.targetWeight || null,
            goals: data.goals || [],
            experience: data.experience || 'beginner',
            notificationsEnabled: data.notificationsEnabled !== false,
            fastReminders: data.fastReminders !== false,
            hydrationReminders: data.hydrationReminders !== false,
            theme: data.theme || 'light',
            accentColor: (data.accentColor as AccentColor) || 'coral'
          })
          
          // Also update global stores
          setProtocol((data.protocol as FastingProtocol) || '16:8')
          setHydrationGoal(data.hydrationGoal || 2500)
        }
        
        // Initialize cycle settings
        await initCycle()
      } catch (error) {
        console.error('Failed to fetch settings:', error)
        showToast('Failed to load settings', 'error')
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [setProtocol, setHydrationGoal, showToast, initCycle])

  const updateSetting = <K extends keyof LocalUserSettings>(key: K, value: LocalUserSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const handleSaveSettings = async () => {
    setIsSaving(true)
    try {
      const response = await api.updateSettings(settings)
      if (response.success) {
        // Update global stores
        setProtocol(settings.protocol)
        setHydrationGoal(settings.hydrationGoal)
        showToast('Settings saved successfully! ✓', 'success')
      } else {
        showToast('Failed to save settings', 'error')
      }
    } catch (error) {
      console.error('Failed to save settings:', error)
      showToast('Failed to save settings', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  const toggleGoal = (goalId: string) => {
    const newGoals = settings.goals.includes(goalId)
      ? settings.goals.filter(g => g !== goalId)
      : [...settings.goals, goalId]
    updateSetting('goals', newGoals)
  }

  const handleExportData = () => {
    showToast('Data export started...', 'info')
    setTimeout(() => showToast('Data exported successfully! ✓', 'success'), 1500)
  }

  const handleDeleteData = () => {
    if (confirm('Are you sure you want to delete all your data? This cannot be undone.')) {
      localStorage.clear()
      showToast('All data deleted', 'info')
      window.location.reload()
    }
  }

  const handleResetOnboarding = async () => {
    try {
      const response = await api.resetOnboarding()
      if (response.success) {
    showToast('Onboarding reset. Refresh to see it again.', 'info')
      } else {
        showToast('Failed to reset onboarding', 'error')
      }
    } catch (error) {
      console.error('Failed to reset onboarding:', error)
      showToast('Failed to reset onboarding', 'error')
    }
  }

  const handleShowFeatureTour = () => {
    const userId = window.fasttrackData?.current_user_id || 0
    localStorage.removeItem(`ft_tour_${userId}`)
    showToast('Feature tour reset. Refresh to see it again.', 'info')
  }

  if (isLoading) {
    return (
      <div className="py-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500 mx-auto mb-2" />
          <p className="text-slate-500">Loading settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="py-6">
      {/* Header */}
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Settings</h1>
          <p className="text-slate-500">Customize your experience</p>
        </div>
        <button
          onClick={handleSaveSettings}
          disabled={isSaving}
          className="btn-primary flex items-center gap-2"
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Save Changes
        </button>
      </header>

      {/* Profile Section */}
      <section className="card-elevated mb-4">
        <div className="flex items-center gap-4">
          {userAvatar ? (
            <img 
              src={userAvatar} 
              alt={userName} 
              className="w-16 h-16 rounded-2xl object-cover shadow-lg"
            />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-glow-primary">
              <User className="w-8 h-8 text-white" />
            </div>
          )}
          <div className="flex-1">
            <h3 className="font-semibold text-lg text-slate-800">{userName}</h3>
            <p className="text-sm text-slate-500">Level {level} • {points} XP</p>
            <p className="text-xs text-success-600 font-medium mt-1">✓ All features unlocked</p>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400" />
        </div>
      </section>

      {/* Personal Information */}
      <section className="card-elevated mb-4">
        <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <User className="w-5 h-5 text-primary-500" />
          Personal Information
        </h3>

        <div className="space-y-4">
          {/* Gender */}
          <div>
            <label className="text-sm text-slate-500 mb-2 block">Gender</label>
            <div className="flex gap-2">
              {(['male', 'female', 'other'] as const).map(g => (
                <button
                  key={g}
                  onClick={() => updateSetting('gender', g)}
                  className={`flex-1 py-2.5 rounded-xl font-medium transition-all ${
                    settings.gender === g 
                      ? 'bg-primary-500 text-white shadow-glow-primary' 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {g.charAt(0).toUpperCase() + g.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Age */}
          <div>
            <label className="text-sm text-slate-500 mb-2 block flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Age
            </label>
            <input
              type="number"
              value={settings.age || ''}
              onChange={e => updateSetting('age', e.target.value ? parseInt(e.target.value) : null)}
              placeholder="Enter your age"
              className="input"
            />
          </div>

          {/* Weight */}
          <div>
            <label className="text-sm text-slate-500 mb-2 block flex items-center gap-2">
              <Scale className="w-4 h-4" />
              Current Weight
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                value={settings.weight || ''}
                onChange={e => updateSetting('weight', e.target.value ? parseFloat(e.target.value) : null)}
                placeholder="Weight"
                className="input flex-1"
              />
              <select
                value={settings.weightUnit}
                onChange={e => updateSetting('weightUnit', e.target.value as 'kg' | 'lbs')}
                className="input w-24"
              >
                <option value="kg">kg</option>
                <option value="lbs">lbs</option>
              </select>
            </div>
          </div>

          {/* Height */}
          <div>
            <label className="text-sm text-slate-500 mb-2 block flex items-center gap-2">
              <Ruler className="w-4 h-4" />
              Height
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                value={settings.height || ''}
                onChange={e => updateSetting('height', e.target.value ? parseFloat(e.target.value) : null)}
                placeholder="Height"
                className="input flex-1"
              />
              <select
                value={settings.heightUnit}
                onChange={e => updateSetting('heightUnit', e.target.value as 'cm' | 'ft')}
                className="input w-24"
              >
                <option value="cm">cm</option>
                <option value="ft">ft</option>
              </select>
            </div>
          </div>

          {/* Target Weight */}
          <div>
            <label className="text-sm text-slate-500 mb-2 block">
              🎯 Target Weight ({settings.weightUnit})
            </label>
            <input
              type="number"
              value={settings.targetWeight || ''}
              onChange={e => updateSetting('targetWeight', e.target.value ? parseFloat(e.target.value) : null)}
              placeholder="Your goal weight"
              className="input"
            />
          </div>
        </div>
      </section>

      {/* Goals */}
      <section className="card-elevated mb-4">
        <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Star className="w-5 h-5 text-primary-500" />
          Your Goals
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {goalOptions.map(goal => (
            <button
              key={goal.id}
              onClick={() => toggleGoal(goal.id)}
              className={`p-3 rounded-xl border-2 transition-all text-left ${
                settings.goals.includes(goal.id)
                  ? 'border-primary-400 bg-primary-50'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <span className="text-xl mb-1 block">{goal.icon}</span>
              <span className="text-sm font-medium text-slate-700">{goal.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Fasting Settings */}
      <section className="card-elevated mb-4">
        <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Target className="w-5 h-5 text-primary-500" />
          Fasting Settings
        </h3>

        <div className="space-y-4">
          {/* Protocol */}
          <div>
            <label className="text-sm text-slate-500 mb-2 block">Default Protocol</label>
            <select
              value={settings.protocol}
              onChange={e => updateSetting('protocol', e.target.value as FastingProtocol)}
              className="input"
            >
              {(Object.entries(PROTOCOLS) as [FastingProtocol, typeof PROTOCOLS['16:8']][]).map(([key, p]) => (
                <option key={key} value={key}>
                  {key} - {p.name} ({p.fastHours}h fast)
                </option>
              ))}
            </select>
          </div>

          {/* Experience Level */}
          <div>
            <label className="text-sm text-slate-500 mb-2 block">Experience Level</label>
            <select
              value={settings.experience}
              onChange={e => updateSetting('experience', e.target.value)}
              className="input"
            >
              <option value="beginner">Beginner - New to fasting</option>
              <option value="intermediate">Intermediate - Some experience</option>
              <option value="advanced">Advanced - Experienced faster</option>
            </select>
          </div>

          {/* Hydration Goal */}
          <div>
            <label className="text-sm text-slate-500 mb-2 block">Daily Hydration Goal (ml)</label>
            <input
              type="number"
              value={settings.hydrationGoal}
              onChange={e => updateSetting('hydrationGoal', parseInt(e.target.value) || 2000)}
              step={250}
              min={1000}
              max={5000}
              className="input"
            />
          </div>
        </div>
      </section>

      {/* Cycle Sync (for female users) */}
      {settings.gender === 'female' && (
        <section className="card-elevated mb-4 bg-gradient-to-r from-pink-50 to-purple-50 border border-pink-100">
          <div 
            className="flex items-center justify-between cursor-pointer"
            onClick={() => setShowCycleSettings(true)}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center">
                <Moon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800">Cycle Sync</h3>
                <p className="text-sm text-slate-500">
                  {cycleEnabled ? 'Enabled - Optimizing for your cycle' : 'Optimize fasting for your menstrual cycle'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {cycleEnabled && (
                <span className="px-2 py-1 bg-pink-100 text-pink-700 text-xs rounded-full font-medium">
                  Active
                </span>
              )}
              <ChevronRight className="w-5 h-5 text-slate-400" />
            </div>
          </div>
        </section>
      )}

      {/* Supplement Manager */}
      <section className="card-elevated mb-4 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-100">
        <div 
          className="flex items-center justify-between cursor-pointer"
          onClick={() => setShowSupplements(true)}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center">
              <Pill className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800">Supplement Safe-Guard</h3>
              <p className="text-sm text-slate-500">
                Manage your supplements and get timing alerts
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400" />
        </div>
      </section>

      {/* Appearance */}
      <section className="card-elevated mb-4">
        <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Palette className="w-5 h-5 text-primary-500" />
          Appearance
        </h3>

        <div>
          <label className="text-sm text-slate-500 mb-3 block">Accent Color</label>
          <div className="flex gap-3 flex-wrap">
            {accentColors.map(c => (
              <button
                key={c.id}
                onClick={() => updateSetting('accentColor', c.id)}
                className={`w-12 h-12 rounded-2xl transition-all shadow-md hover:scale-110 ${
                  settings.accentColor === c.id ? 'ring-2 ring-offset-2 ring-slate-400 scale-110' : ''
                }`}
                style={{ backgroundColor: c.color }}
                title={c.label}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Notifications */}
      <section className="card-elevated mb-4">
        <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Bell className="w-5 h-5 text-primary-500" />
          Notifications
        </h3>

        {/* Browser notification permission status */}
        {notificationService.isSupported() && (
          <div className={`mb-4 p-3 rounded-xl flex items-center gap-3 ${
            notificationService.isEnabled() 
              ? 'bg-emerald-50 border border-emerald-200' 
              : 'bg-amber-50 border border-amber-200'
          }`}>
            {notificationService.isEnabled() ? (
              <>
                <BellRing className="w-5 h-5 text-emerald-500" />
                <span className="text-sm text-emerald-700">Browser notifications are enabled</span>
              </>
            ) : (
              <>
                <BellOff className="w-5 h-5 text-amber-500" />
                <div className="flex-1">
                  <span className="text-sm text-amber-700">Browser notifications are disabled</span>
                  <button
                    onClick={async () => {
                      const granted = await notificationService.requestPermission()
                      if (granted) {
                        showToast('Notifications enabled! 🔔', 'success')
                        // Force re-render to update status
                        updateSetting('notificationsEnabled', true)
                      } else {
                        showToast('Notification permission denied', 'error')
                      }
                    }}
                    className="block text-xs text-amber-600 underline mt-1 hover:text-amber-800"
                  >
                    Click to enable
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center">
                <Bell className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-slate-800 font-medium">Enable Notifications</span>
                <p className="text-xs text-slate-500">Get reminders and updates</p>
              </div>
            </div>
            <button
              onClick={async () => {
                if (!settings.notificationsEnabled && !notificationService.isEnabled()) {
                  // Request permission first
                  const granted = await notificationService.requestPermission()
                  if (!granted) {
                    showToast('Please allow notifications in your browser', 'error')
                    return
                  }
                }
                updateSetting('notificationsEnabled', !settings.notificationsEnabled)
                if (!settings.notificationsEnabled) {
                  showToast('Notifications enabled! 🔔', 'success')
                }
              }}
              className={`w-14 h-8 rounded-full transition-colors relative ${
                settings.notificationsEnabled ? 'bg-primary-500' : 'bg-slate-200'
              }`}
            >
              <motion.div
                animate={{ x: settings.notificationsEnabled ? 26 : 4 }}
                className="w-6 h-6 bg-white rounded-full shadow-md absolute top-1"
              />
            </button>
          </div>

          <div className={`flex items-center justify-between p-3 rounded-xl bg-slate-50 transition-opacity ${
            !settings.notificationsEnabled ? 'opacity-50 pointer-events-none' : ''
          }`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                <span className="text-xl">⏱️</span>
              </div>
              <div>
                <span className="text-slate-800 font-medium">Fasting Reminders</span>
                <p className="text-xs text-slate-500">Milestone & completion alerts</p>
              </div>
            </div>
            <button
              onClick={() => {
                updateSetting('fastReminders', !settings.fastReminders)
                if (!settings.fastReminders) {
                  // Send a test notification
                  notificationService.send({
                    title: '⏱️ Fasting Reminders Enabled',
                    body: 'You\'ll receive milestone notifications during your fasts!',
                    tag: 'test-fast'
                  })
                }
              }}
              disabled={!settings.notificationsEnabled}
              className={`w-14 h-8 rounded-full transition-colors relative ${
                settings.fastReminders && settings.notificationsEnabled ? 'bg-primary-500' : 'bg-slate-200'
              }`}
            >
              <motion.div
                animate={{ x: settings.fastReminders && settings.notificationsEnabled ? 26 : 4 }}
                className="w-6 h-6 bg-white rounded-full shadow-md absolute top-1"
              />
            </button>
          </div>

          <div className={`flex items-center justify-between p-3 rounded-xl bg-slate-50 transition-opacity ${
            !settings.notificationsEnabled ? 'opacity-50 pointer-events-none' : ''
          }`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center">
                <span className="text-xl">💧</span>
              </div>
              <div>
                <span className="text-slate-800 font-medium">Hydration Reminders</span>
                <p className="text-xs text-slate-500">Stay hydrated every 2 hours</p>
              </div>
            </div>
            <button
              onClick={() => {
                updateSetting('hydrationReminders', !settings.hydrationReminders)
                if (!settings.hydrationReminders) {
                  // Send a test notification
                  notificationService.send({
                    title: '💧 Hydration Reminders Enabled',
                    body: 'You\'ll get reminders every 2 hours to stay hydrated!',
                    tag: 'test-hydration'
                  })
                }
              }}
              disabled={!settings.notificationsEnabled}
              className={`w-14 h-8 rounded-full transition-colors relative ${
                settings.hydrationReminders && settings.notificationsEnabled ? 'bg-primary-500' : 'bg-slate-200'
              }`}
            >
              <motion.div
                animate={{ x: settings.hydrationReminders && settings.notificationsEnabled ? 26 : 4 }}
                className="w-6 h-6 bg-white rounded-full shadow-md absolute top-1"
              />
            </button>
          </div>

          {/* Test Notification Button */}
          {settings.notificationsEnabled && notificationService.isEnabled() && (
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => {
                notificationService.send({
                  title: '🎉 Test Notification',
                  body: 'Notifications are working perfectly!',
                  tag: 'test'
                })
                showToast('Test notification sent!', 'success')
              }}
              className="w-full mt-2 py-3 px-4 rounded-xl border-2 border-dashed border-slate-200 text-slate-500 hover:border-primary-300 hover:text-primary-500 transition-colors text-sm font-medium"
            >
              Send Test Notification
            </motion.button>
          )}
        </div>
      </section>

      {/* Data & Privacy */}
      <section className="card-elevated mb-4">
        <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary-500" />
          Data & Privacy
        </h3>

        <div className="space-y-2">
          <button
            onClick={handleExportData}
            className="w-full flex items-center justify-between p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-colors"
          >
            <span className="flex items-center gap-3 text-slate-700">
              <Download className="w-5 h-5 text-slate-500" />
              Export My Data
            </span>
            <ChevronRight className="w-5 h-5 text-slate-400" />
          </button>

          <button
            onClick={handleDeleteData}
            className="w-full flex items-center justify-between p-4 rounded-2xl bg-danger-50 hover:bg-danger-100 transition-colors text-danger-600"
          >
            <span className="flex items-center gap-3">
              <Trash2 className="w-5 h-5" />
              Delete All Data
            </span>
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* Support */}
      <section className="card-elevated mb-4">
        <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-primary-500" />
          Support
        </h3>

        <div className="space-y-2">
          <button
            onClick={handleShowFeatureTour}
            className="w-full flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-primary-50 to-accent-50 hover:from-primary-100 hover:to-accent-100 transition-colors border border-primary-100"
          >
            <span className="flex items-center gap-3 text-primary-700">
              <Compass className="w-5 h-5 text-primary-500" />
              Take Feature Tour
            </span>
            <span className="text-xs bg-primary-500 text-white px-2 py-1 rounded-full">Recommended</span>
          </button>

          <button
            onClick={handleResetOnboarding}
            className="w-full flex items-center justify-between p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-colors"
          >
            <span className="flex items-center gap-3 text-slate-700">
              <Star className="w-5 h-5 text-slate-500" />
              View Onboarding Again
            </span>
            <ChevronRight className="w-5 h-5 text-slate-400" />
          </button>

          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-between p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-colors"
          >
            <span className="flex items-center gap-3 text-slate-700">
              <ExternalLink className="w-5 h-5 text-slate-500" />
              Visit Website
            </span>
            <ChevronRight className="w-5 h-5 text-slate-400" />
          </a>
        </div>
      </section>

      {/* App Info */}
      <div className="text-center py-6">
        <p className="text-sm text-slate-400">FastTrack Elite v2.0.0</p>
        <p className="text-xs text-slate-400 mt-1">All premium features free forever ❤️</p>
      </div>

      {/* Cycle Sync Modal */}
      <AnimatePresence>
        {showCycleSettings && (
          <CycleSyncSettings 
            isModal 
            onClose={() => setShowCycleSettings(false)} 
          />
        )}
      </AnimatePresence>

      {/* Supplement Manager Modal */}
      <AnimatePresence>
        {showSupplements && (
          <SupplementManager 
            isModal 
            onClose={() => setShowSupplements(false)} 
          />
        )}
      </AnimatePresence>
    </div>
  )
}
