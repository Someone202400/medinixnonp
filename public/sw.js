
// Service Worker for PWA with caching and push notifications
const CACHE_NAME = 'medcare-v1';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  '/favicon.ico'
];

self.addEventListener('install', event => {
  console.log('Service Worker installing');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  console.log('Service Worker activating');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event for caching strategy
self.addEventListener('fetch', event => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;
  
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) return;
  
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        
        // Clone the request because it's a stream
        const fetchRequest = event.request.clone();
        
        return fetch(fetchRequest).then(response => {
          // Check if we received a valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          // Clone the response because it's a stream
          const responseToCache = response.clone();
          
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });
          
          return response;
        }).catch(() => {
          // Return offline page or basic offline response
          if (event.request.destination === 'document') {
            return caches.match('/');
          }
        });
      })
  );
});

// Handle push notifications
self.addEventListener('push', event => {
  if (event.data) {
    const data = event.data.json();
    
    const options = {
      body: data.body || 'You have a new medication reminder',
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: data.tag || 'medication-reminder',
      requireInteraction: true,
      actions: [
        {
          action: 'taken',
          title: 'Mark as Taken'
        },
        {
          action: 'snooze',
          title: 'Snooze 15 mins'
        }
      ]
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'MedCare Reminder', options)
    );
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  event.notification.close();

  if (event.action === 'taken') {
    // Handle "Mark as Taken" action
    console.log('Medication marked as taken');
  } else if (event.action === 'snooze') {
    // Handle snooze action
    console.log('Notification snoozed for 15 minutes');
    
    // Schedule another notification in 15 minutes
    setTimeout(() => {
      self.registration.showNotification('Medication Reminder (Snoozed)', {
        body: 'Time to take your medication',
        icon: '/favicon.ico',
        tag: 'medication-reminder-snooze'
      });
    }, 15 * 60 * 1000); // 15 minutes
  } else {
    // Default action - open the app
    event.waitUntil(
      clients.openWindow('/dashboard')
    );
  }
});

// Handle background sync for offline functionality
self.addEventListener('sync', event => {
  if (event.tag === 'medication-sync') {
    event.waitUntil(syncMedicationData());
  }
});

async function syncMedicationData() {
  // Sync medication data when back online
  console.log('Syncing medication data...');
}
