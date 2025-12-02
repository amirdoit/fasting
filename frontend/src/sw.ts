/// <reference lib="webworker" />
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching'
import { registerRoute } from 'workbox-routing'
import { NetworkFirst, CacheFirst, StaleWhileRevalidate } from 'workbox-strategies'
import { ExpirationPlugin } from 'workbox-expiration'
import { CacheableResponsePlugin } from 'workbox-cacheable-response'

declare let self: ServiceWorkerGlobalScope

// Extended type declarations for Service Worker APIs
interface NotificationActionDef {
  action: string
  title: string
  icon?: string
}

interface ExtendedNotificationOptions extends NotificationOptions {
  vibrate?: number[]
  actions?: NotificationActionDef[]
  requireInteraction?: boolean
}

interface SyncEvent extends ExtendableEvent {
  tag: string
}

interface PushSubscriptionChangeEvent extends ExtendableEvent {
  newSubscription?: PushSubscription
  oldSubscription?: PushSubscription
}

// Precache static assets
precacheAndRoute(self.__WB_MANIFEST)

// Clean old caches
cleanupOutdatedCaches()

// Cache Google Fonts
registerRoute(
  /^https:\/\/fonts\.googleapis\.com\/.*/i,
  new CacheFirst({
    cacheName: 'google-fonts-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 10,
        maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
      }),
      new CacheableResponsePlugin({
        statuses: [0, 200]
      })
    ]
  })
)

// Cache Google Fonts stylesheets
registerRoute(
  /^https:\/\/fonts\.gstatic\.com\/.*/i,
  new CacheFirst({
    cacheName: 'google-fonts-webfonts',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 30,
        maxAgeSeconds: 60 * 60 * 24 * 365
      }),
      new CacheableResponsePlugin({
        statuses: [0, 200]
      })
    ]
  })
)

// Cache API responses with NetworkFirst strategy
registerRoute(
  /\/wp-json\/fasttrack\/v1\/.*/i,
  new NetworkFirst({
    cacheName: 'api-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 60 * 60 * 24 // 24 hours
      })
    ],
    networkTimeoutSeconds: 10
  })
)

// Cache images
registerRoute(
  /\.(?:png|jpg|jpeg|svg|gif|webp)$/i,
  new StaleWhileRevalidate({
    cacheName: 'images-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
      })
    ]
  })
)

// Push notification handling
interface PushData {
  title: string
  body: string
  icon?: string
  badge?: string
  tag?: string
  data?: {
    url?: string
    action?: string
    fastId?: number
    type?: string
  }
}

self.addEventListener('push', (event: PushEvent) => {
  console.log('[SW] Push received:', event)
  
  let data: PushData = {
    title: 'FastTrack Elite',
    body: 'You have a new notification'
  }
  
  if (event.data) {
    try {
      data = event.data.json() as PushData
    } catch (e) {
      data.body = event.data.text()
    }
  }
  
  const options: ExtendedNotificationOptions = {
    body: data.body,
    icon: data.icon || '/wp-content/plugins/fasting/frontend/public/pwa-192x192.png',
    badge: data.badge || '/wp-content/plugins/fasting/frontend/public/pwa-192x192.png',
    tag: data.tag || 'fasttrack-notification',
    vibrate: [100, 50, 100],
    data: data.data || {},
    actions: getNotificationActions(data.data?.type),
    requireInteraction: data.data?.type === 'fast-complete'
  }
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  )
})

// Get notification actions based on type
function getNotificationActions(type?: string): NotificationActionDef[] {
  switch (type) {
    case 'fast-reminder':
      return [
        { action: 'end-fast', title: 'End Fast' },
        { action: 'continue', title: 'Keep Going!' }
      ]
    case 'hydration':
      return [
        { action: 'log-water', title: 'Log Water 💧' },
        { action: 'dismiss', title: 'Later' }
      ]
    case 'fast-complete':
      return [
        { action: 'view', title: 'View Results' },
        { action: 'start-new', title: 'Start New Fast' }
      ]
    default:
      return []
  }
}

// Handle notification click
self.addEventListener('notificationclick', (event: NotificationEvent) => {
  console.log('[SW] Notification clicked:', event)
  
  event.notification.close()
  
  const action = event.action
  const data = event.notification.data || {}
  
  let urlToOpen = '/'
  
  // Handle different actions
  switch (action) {
    case 'end-fast':
      urlToOpen = '/?action=end-fast'
      break
    case 'log-water':
      urlToOpen = '/?tab=tracking&action=log-water'
      break
    case 'view':
    case 'start-new':
      urlToOpen = '/?tab=timer'
      break
    default:
      urlToOpen = data.url || '/'
  }
  
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clients) => {
        // Check if there's already an open window
        for (const client of clients) {
          if ('focus' in client) {
            client.focus()
            client.postMessage({
              type: 'NOTIFICATION_CLICK',
              action,
              data
            })
            return
          }
        }
        // Open new window if none exists
        return self.clients.openWindow(urlToOpen)
      })
  )
})

// Handle notification close
self.addEventListener('notificationclose', (event: NotificationEvent) => {
  console.log('[SW] Notification closed:', event.notification.tag)
})

// Handle push subscription change
self.addEventListener('pushsubscriptionchange', ((event: ExtendableEvent) => {
  console.log('[SW] Push subscription changed')

  // Re-subscribe and update server
  event.waitUntil(
    (async () => {
      try {
        const vapidKey = await getVapidKey()
        const subscription = await self.registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: vapidKey as BufferSource | null
        })
        
        // Send new subscription to server
        await fetch('/wp-json/fasttrack/v1/push/subscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            subscription: subscription.toJSON()
          })
        })
      } catch (error) {
        console.error('[SW] Failed to re-subscribe:', error)
      }
    })()
  )
}) as EventListener)

// Get VAPID public key from server
async function getVapidKey(): Promise<Uint8Array | null> {
  try {
    const response = await fetch('/wp-json/fasttrack/v1/push/vapid-key')
    const data = await response.json()
    if (data.publicKey) {
      return urlBase64ToUint8Array(data.publicKey)
    }
  } catch (error) {
    console.error('[SW] Failed to get VAPID key:', error)
  }
  return null
}

// Convert base64 URL-safe string to Uint8Array
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/')
  
  const rawData = atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  
  return outputArray
}

// Background sync for offline actions
self.addEventListener('sync', ((event: SyncEvent) => {
  console.log('[SW] Background sync:', event.tag)
  
  if (event.tag === 'sync-fasting-data') {
    event.waitUntil(syncFastingData())
  } else if (event.tag === 'sync-hydration') {
    event.waitUntil(syncHydration())
  }
}) as EventListener)

// Sync fasting data when back online
async function syncFastingData(): Promise<void> {
  try {
    const cache = await caches.open('offline-actions')
    const requests = await cache.keys()
    
    for (const request of requests) {
      if (request.url.includes('/fasts')) {
        const response = await cache.match(request)
        if (response) {
          const data = await response.json()
          await fetch(request.url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
          })
          await cache.delete(request)
        }
      }
    }
  } catch (error) {
    console.error('[SW] Sync fasting data failed:', error)
  }
}

// Sync hydration data when back online
async function syncHydration(): Promise<void> {
  try {
    const cache = await caches.open('offline-actions')
    const requests = await cache.keys()
    
    for (const request of requests) {
      if (request.url.includes('/hydration')) {
        const response = await cache.match(request)
        if (response) {
          const data = await response.json()
          await fetch(request.url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
          })
          await cache.delete(request)
        }
      }
    }
  } catch (error) {
    console.error('[SW] Sync hydration failed:', error)
  }
}

// Listen for messages from the main app
self.addEventListener('message', (event: ExtendableMessageEvent) => {
  console.log('[SW] Message received:', event.data)
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
  
  if (event.data && event.data.type === 'CACHE_OFFLINE_ACTION') {
    event.waitUntil(
      caches.open('offline-actions').then((cache) => {
        return cache.put(event.data.request, new Response(JSON.stringify(event.data.body)))
      })
    )
  }
})

// Activate event - claim clients immediately
self.addEventListener('activate', (event: ExtendableEvent) => {
  event.waitUntil(self.clients.claim())
})

export {}
