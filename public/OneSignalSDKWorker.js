// Push Notification Service Worker for Medication Reminders

self.addEventListener('push', function(event) {
  console.log('Push message received:', event);
  
  let notificationData = {
    title: 'Medication Reminder',
    body: 'Time to take your medication',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    requireInteraction: true
  };
  
  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = {
        ...notificationData,
        ...data
      };
    } catch (e) {
      console.error('Error parsing push data:', e);
    }
  }
  
  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      requireInteraction: notificationData.requireInteraction,
      actions: [
        {
          action: 'mark-taken',
          title: 'Mark as Taken'
        },
        {
          action: 'snooze',
          title: 'Snooze 15min'
        },
        {
          action: 'skip',
          title: 'Skip Today'
        }
      ],
      data: notificationData.data
    })
  );
});

self.addEventListener('notificationclick', function(event) {
  console.log('Notification clicked:', event);
  
  event.notification.close();
  
  if (event.action === 'mark-taken') {
    // Handle mark as taken
    console.log('User marked medication as taken');
    // Send message to main thread
    event.waitUntil(
      clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'MEDICATION_TAKEN',
            medicationId: event.notification.data?.medicationId,
            scheduledTime: event.notification.data?.scheduledTime
          });
        });
      })
    );
  } else if (event.action === 'snooze') {
    // Handle snooze
    console.log('User snoozed medication reminder');
  } else if (event.action === 'skip') {
    // Handle skip
    console.log('User skipped medication');
  } else {
    // Default action - open the app
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

self.addEventListener('notificationclose', function(event) {
  console.log('Notification closed:', event);
});