/**
 * Browser Notifications Service for FastTrack Elite
 * Handles push notifications for fasting reminders and hydration
 */

export interface NotificationOptions {
  title: string
  body: string
  icon?: string
  tag?: string
  requireInteraction?: boolean
  data?: Record<string, unknown>
}

export interface PushSubscriptionData {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
}

class NotificationService {
  private permission: NotificationPermission = 'default'
  private hydrationInterval: number | null = null
  private fastingCheckInterval: number | null = null
  private pushSubscription: PushSubscription | null = null
  private vapidPublicKey: string | null = null

  constructor() {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      this.permission = Notification.permission
    }
  }

  /**
   * Check if notifications are supported
   */
  isSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window
  }

  /**
   * Check if push notifications are supported
   */
  isPushSupported(): boolean {
    return typeof window !== 'undefined' &&
           'serviceWorker' in navigator &&
           'PushManager' in window
  }

  /**
   * Check if notifications are enabled
   */
  isEnabled(): boolean {
    return this.permission === 'granted'
  }

  /**
   * Check if push is subscribed
   */
  isPushSubscribed(): boolean {
    return this.pushSubscription !== null
  }

  /**
   * Request notification permission from user
   */
  async requestPermission(): Promise<boolean> {
    if (!this.isSupported()) {
      console.warn('Notifications not supported in this browser')
      return false
    }

    try {
      const result = await Notification.requestPermission()
      this.permission = result
      return result === 'granted'
    } catch (error) {
      console.error('Error requesting notification permission:', error)
      return false
    }
  }

  /**
   * Get VAPID public key from server
   */
  async getVapidPublicKey(): Promise<string | null> {
    if (this.vapidPublicKey) {
      return this.vapidPublicKey
    }

    try {
      // Get from WordPress data or fetch from API
      const wpData = (window as any).fasttrackData
      if (wpData?.vapidPublicKey) {
        this.vapidPublicKey = wpData.vapidPublicKey
        return this.vapidPublicKey
      }

      const response = await fetch('/wp-json/fasttrack/v1/push/vapid-key')
      const data = await response.json()
      if (data.publicKey) {
        this.vapidPublicKey = data.publicKey
        return this.vapidPublicKey
      }
    } catch (error) {
      console.error('Failed to get VAPID public key:', error)
    }
    return null
  }

  /**
   * Convert base64 URL-safe string to Uint8Array
   */
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/')
    
    const rawData = atob(base64)
    const buffer = new ArrayBuffer(rawData.length)
    const outputArray = new Uint8Array(buffer)
    
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    
    return outputArray
  }

  /**
   * Subscribe to push notifications
   */
  async subscribeToPush(): Promise<PushSubscription | null> {
    if (!this.isPushSupported()) {
      console.warn('Push notifications not supported')
      return null
    }

    // Request permission first
    const granted = await this.requestPermission()
    if (!granted) {
      console.warn('Notification permission not granted')
      return null
    }

    try {
      const registration = await navigator.serviceWorker.ready
      
      // Check for existing subscription
      let subscription = await registration.pushManager.getSubscription()
      
      if (!subscription) {
        // Get VAPID key
        const vapidKey = await this.getVapidPublicKey()
        if (!vapidKey) {
          console.error('VAPID public key not available')
          return null
        }

        // Subscribe to push
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array(vapidKey) as BufferSource
        })
      }

      this.pushSubscription = subscription

      // Send subscription to server
      await this.sendSubscriptionToServer(subscription)

      console.log('Push subscription successful:', subscription.endpoint)
      return subscription
    } catch (error) {
      console.error('Failed to subscribe to push:', error)
      return null
    }
  }

  /**
   * Send subscription to server
   */
  private async sendSubscriptionToServer(subscription: PushSubscription): Promise<boolean> {
    try {
      const wpData = (window as any).fasttrackData
      
      const response = await fetch(`${wpData?.apiUrl || '/wp-json/fasttrack/v1'}/push/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-WP-Nonce': wpData?.nonce || ''
        },
        body: JSON.stringify({
          subscription: subscription.toJSON()
        })
      })

      return response.ok
    } catch (error) {
      console.error('Failed to send subscription to server:', error)
      return false
    }
  }

  /**
   * Unsubscribe from push notifications
   */
  async unsubscribeFromPush(): Promise<boolean> {
    if (!this.pushSubscription) {
      // Try to get existing subscription
      try {
        const registration = await navigator.serviceWorker.ready
        this.pushSubscription = await registration.pushManager.getSubscription()
      } catch (error) {
        console.error('Failed to get subscription:', error)
        return false
      }
    }

    if (!this.pushSubscription) {
      return true // Already unsubscribed
    }

    try {
      // Unsubscribe from push
      const success = await this.pushSubscription.unsubscribe()
      
      if (success) {
        // Notify server
        const wpData = (window as any).fasttrackData
        await fetch(`${wpData?.apiUrl || '/wp-json/fasttrack/v1'}/push/unsubscribe`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-WP-Nonce': wpData?.nonce || ''
          },
          body: JSON.stringify({
            endpoint: this.pushSubscription.endpoint
          })
        })
        
        this.pushSubscription = null
      }

      return success
    } catch (error) {
      console.error('Failed to unsubscribe from push:', error)
      return false
    }
  }

  /**
   * Get current push subscription status
   */
  async getPushSubscriptionStatus(): Promise<{
    supported: boolean
    subscribed: boolean
    subscription: PushSubscription | null
  }> {
    const supported = this.isPushSupported()
    
    if (!supported) {
      return { supported: false, subscribed: false, subscription: null }
    }

    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()
      this.pushSubscription = subscription
      
      return {
        supported: true,
        subscribed: subscription !== null,
        subscription
      }
    } catch (error) {
      console.error('Failed to get push status:', error)
      return { supported: true, subscribed: false, subscription: null }
    }
  }

  /**
   * Send a browser notification
   */
  async send(options: NotificationOptions): Promise<boolean> {
    if (!this.isSupported() || !this.isEnabled()) {
      console.warn('Notifications not available or not permitted')
      return false
    }

    try {
      const notification = new Notification(options.title, {
        body: options.body,
        icon: options.icon || '/wp-content/plugins/fasting/frontend/dist/icons/icon-192x192.png',
        tag: options.tag,
        requireInteraction: options.requireInteraction || false,
        data: options.data
      })

      // Auto-close after 5 seconds unless requireInteraction is true
      if (!options.requireInteraction) {
        setTimeout(() => notification.close(), 5000)
      }

      notification.onclick = () => {
        window.focus()
        notification.close()
      }

      return true
    } catch (error) {
      console.error('Error sending notification:', error)
      return false
    }
  }

  /**
   * Send a fasting start notification
   */
  async notifyFastStart(protocol: string): Promise<boolean> {
    return this.send({
      title: '🚀 Fast Started!',
      body: `Your ${protocol} fast has begun. Stay strong!`,
      tag: 'fast-start',
      requireInteraction: false
    })
  }

  /**
   * Send a fasting end notification
   */
  async notifyFastComplete(hours: number): Promise<boolean> {
    return this.send({
      title: '🎉 Fast Complete!',
      body: `Congratulations! You completed a ${hours.toFixed(1)} hour fast!`,
      tag: 'fast-complete',
      requireInteraction: true
    })
  }

  /**
   * Send a fasting milestone notification
   */
  async notifyFastMilestone(hours: number, zone: string): Promise<boolean> {
    const milestoneMessages: Record<string, string> = {
      'fed': 'Your body is still processing food.',
      'early': 'Blood sugar is starting to drop. Stay hydrated!',
      'fasting': 'You\'re now in the fasting state! Fat burning begins.',
      'fat-burning': '🔥 Fat burning mode activated! Keep going!',
      'ketosis': '⚡ Entering ketosis! Your body is using fat for fuel.',
      'deep-ketosis': '🧠 Deep ketosis! Maximum mental clarity.',
      'autophagy': '🧬 Autophagy activated! Cellular renewal in progress.'
    }

    const message = milestoneMessages[zone] || `You've reached ${hours} hours!`

    return this.send({
      title: `⏱️ ${hours}h Milestone!`,
      body: message,
      tag: `milestone-${hours}`,
      requireInteraction: false
    })
  }

  /**
   * Send an achievement notification
   */
  async notifyAchievement(title: string, body: string): Promise<boolean> {
    return this.send({
      title,
      body,
      tag: 'achievement',
      requireInteraction: true
    })
  }

  /**
   * Send a hydration reminder
   */
  async notifyHydration(currentMl: number, goalMl: number): Promise<boolean> {
    const percentage = Math.round((currentMl / goalMl) * 100)
    const remaining = goalMl - currentMl
    
    let message: string
    let emoji: string
    
    if (percentage < 25) {
      emoji = '💧'
      message = `Time to drink some water! You're at ${percentage}% of your daily goal.`
    } else if (percentage < 50) {
      emoji = '💦'
      message = `Keep hydrating! ${remaining}ml to go.`
    } else if (percentage < 75) {
      emoji = '🌊'
      message = `Great progress! Only ${remaining}ml left to reach your goal.`
    } else {
      emoji = '✨'
      message = `Almost there! Just ${remaining}ml more to hit your goal!`
    }

    return this.send({
      title: `${emoji} Hydration Reminder`,
      body: message,
      tag: 'hydration-reminder',
      requireInteraction: false
    })
  }

  /**
   * Start hydration reminder interval
   * Reminds every 2 hours during active hours (8am - 10pm)
   */
  startHydrationReminders(
    getCurrentHydration: () => number,
    getHydrationGoal: () => number
  ): void {
    // Clear existing interval
    this.stopHydrationReminders()

    // Check every 30 minutes if we should send a reminder
    this.hydrationInterval = window.setInterval(() => {
      const hour = new Date().getHours()
      
      // Only send reminders during active hours (8am - 10pm)
      if (hour >= 8 && hour <= 22) {
        const current = getCurrentHydration()
        const goal = getHydrationGoal()
        
        // Only remind if under 80% of goal
        if (current < goal * 0.8) {
          this.notifyHydration(current, goal)
        }
      }
    }, 2 * 60 * 60 * 1000) // Every 2 hours

    console.log('Hydration reminders started')
  }

  /**
   * Stop hydration reminders
   */
  stopHydrationReminders(): void {
    if (this.hydrationInterval) {
      clearInterval(this.hydrationInterval)
      this.hydrationInterval = null
      console.log('Hydration reminders stopped')
    }
  }

  /**
   * Start fasting milestone checks
   * Checks every minute for milestone achievements
   */
  startFastingMilestoneChecks(
    getActiveFast: () => { startTime: string; targetHours: number } | null,
    onMilestone?: (hours: number, zone: string) => void
  ): void {
    // Clear existing interval
    this.stopFastingMilestoneChecks()

    const notifiedMilestones = new Set<number>()
    const milestones = [4, 8, 12, 14, 16, 18, 20, 24, 36, 48, 72]

    this.fastingCheckInterval = window.setInterval(() => {
      const activeFast = getActiveFast()
      if (!activeFast) {
        notifiedMilestones.clear()
        return
      }

      const elapsed = (Date.now() - new Date(activeFast.startTime).getTime()) / (1000 * 60 * 60)
      
      // Check for milestones
      for (const milestone of milestones) {
        if (elapsed >= milestone && !notifiedMilestones.has(milestone)) {
          notifiedMilestones.add(milestone)
          
          // Determine zone
          let zone = 'fed'
          if (elapsed >= 72) zone = 'autophagy'
          else if (elapsed >= 48) zone = 'deep-ketosis'
          else if (elapsed >= 24) zone = 'ketosis'
          else if (elapsed >= 16) zone = 'fat-burning'
          else if (elapsed >= 12) zone = 'fasting'
          else if (elapsed >= 4) zone = 'early'
          
          this.notifyFastMilestone(milestone, zone)
          onMilestone?.(milestone, zone)
        }
      }
    }, 60 * 1000) // Every minute

    console.log('Fasting milestone checks started')
  }

  /**
   * Stop fasting milestone checks
   */
  stopFastingMilestoneChecks(): void {
    if (this.fastingCheckInterval) {
      clearInterval(this.fastingCheckInterval)
      this.fastingCheckInterval = null
      console.log('Fasting milestone checks stopped')
    }
  }

  /**
   * Stop all notification intervals
   */
  stopAll(): void {
    this.stopHydrationReminders()
    this.stopFastingMilestoneChecks()
  }
}

// Export singleton instance
export const notificationService = new NotificationService()



