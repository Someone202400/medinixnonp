
// Service Worker for push notifications
self.addEventListener('install', event => {
  console.log('Service Worker installing');
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  console.log('Service Worker activating');
  event.waitUntil(self.clients.claim());
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
