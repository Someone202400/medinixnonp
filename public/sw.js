// Service Worker for Medinix PWA
const CACHE_NAME = 'medinix-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png'
];

// Install service worker with skip waiting
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching files');
        return cache.addAll(urlsToCache).catch((error) => {
          console.log('Cache addAll error:', error);
        });
      })
      .then(() => self.skipWaiting())
  );
});

// Activate and clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('Service Worker: Clearing old cache');
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch with network-first strategy for API calls
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Network-first for API calls
  if (url.pathname.includes('/functions/') || url.pathname.includes('/rest/')) {
    event.respondWith(
      fetch(event.request)
        .catch(() => caches.match(event.request))
    );
    return;
  }
  
  // Cache-first for static assets
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        return response || fetch(event.request).then((fetchResponse) => {
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, fetchResponse.clone());
            return fetchResponse;
          });
        });
      })
      .catch(() => caches.match('/'))
  );
});

// Handle push notifications with proper mobile support
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Medinix Medication Reminder';
  const options = {
    body: data.body || 'Time to take your medication',
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    tag: data.tag || 'medication-reminder',
    requireInteraction: true,
    vibrate: [200, 100, 200],
    data: { 
      url: data.url || '/',
      medicationId: data.medicationId,
      timestamp: Date.now()
    },
    actions: [
      { action: 'taken', title: '✅ Mark as Taken', icon: '/icon-192x192.png' },
      { action: 'snooze', title: '⏰ Snooze 15min', icon: '/icon-192x192.png' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Handle notification click with mobile support
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const urlToOpen = event.notification.data?.url || '/';
  
  if (event.action === 'taken') {
    // Handle medication taken action
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then((clientList) => {
          // Focus existing window or open new one
          for (const client of clientList) {
            if (client.url.includes(urlToOpen) && 'focus' in client) {
              return client.focus();
            }
          }
          if (clients.openWindow) {
            return clients.openWindow(urlToOpen + '?action=mark-taken&id=' + event.notification.data?.medicationId);
          }
        })
    );
  } else if (event.action === 'snooze') {
    // Handle snooze action - reschedule for 15 minutes
    event.waitUntil(
      clients.openWindow(urlToOpen + '?action=snooze&id=' + event.notification.data?.medicationId)
    );
  } else {
    // Default action - open app
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then((clientList) => {
          for (const client of clientList) {
            if ('focus' in client) {
              return client.focus();
            }
          }
          if (clients.openWindow) {
            return clients.openWindow(urlToOpen);
          }
        })
    );
  }
});

// Background sync for offline medication tracking
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-medications') {
    event.waitUntil(syncMedications());
  }
});

async function syncMedications() {
  console.log('Syncing medications with server...');
  // Sync pending medication logs when back online
  try {
    const cache = await caches.open(CACHE_NAME);
    // Implementation would handle offline medication logs
  } catch (error) {
    console.error('Sync error:', error);
  }
}