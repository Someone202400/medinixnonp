import { supabase } from '@/integrations/supabase/client';

const VAPID_PUBLIC_KEY = 'BO7EJ9rVaGvhD1YGnBlN51V-f6v1adyU8zJ2-fnUfdb38hcY2y22Y85TUGWs13eiwzuVvtBlOEZ7RLTsBzCX7Kk';

export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export const isPushNotificationSupported = () => {
  return 'serviceWorker' in navigator && 'PushManager' in window;
};

export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  if (!('Notification' in window)) {
    throw new Error('Notifications not supported');
  }

  const permission = await Notification.requestPermission();
  return permission;
};

export const subscribeToPushNotifications = async (userId: string): Promise<boolean> => {
  try {
    if (!isPushNotificationSupported()) {
      console.log('Push notifications not supported');
      return false;
    }

    const permission = await requestNotificationPermission();
    if (permission !== 'granted') {
      console.log('Notification permission denied');
      return false;
    }

    const registration = await navigator.serviceWorker.ready;
    
    // Check if already subscribed
    let subscription = await registration.pushManager.getSubscription();
    
    if (!subscription) {
      // Create new subscription
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });
    }

    // Save subscription to database
    const subscriptionJson = subscription.toJSON();
    
    const { error } = await supabase
      .from('push_subscriptions')
      .upsert({
        user_id: userId,
        endpoint: subscriptionJson.endpoint!,
        p256dh: subscriptionJson.keys!.p256dh!,
        auth: subscriptionJson.keys!.auth!,
        user_agent: navigator.userAgent
      });

    if (error) {
      console.error('Error saving push subscription:', error);
      return false;
    }

    console.log('Push notification subscription successful');
    return true;

  } catch (error) {
    console.error('Error subscribing to push notifications:', error);
    return false;
  }
};

export const unsubscribeFromPushNotifications = async (userId: string): Promise<boolean> => {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      await subscription.unsubscribe();
    }

    // Remove from database
    const { error } = await supabase
      .from('push_subscriptions')
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.error('Error removing push subscription:', error);
      return false;
    }

    console.log('Push notification unsubscription successful');
    return true;

  } catch (error) {
    console.error('Error unsubscribing from push notifications:', error);
    return false;
  }
};

export const sendTestNotification = async (title: string, body: string, tag?: string) => {
  if ('serviceWorker' in navigator && 'Notification' in window) {
    try {
      const registration = await navigator.serviceWorker.ready;
      
      const options = {
        body,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: tag || 'test-notification',
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
      } as NotificationOptions & { actions: Array<{ action: string; title: string }> };

      await registration.showNotification(title, options);
    } catch (error) {
      console.error('Error showing test notification:', error);
    }
  }
};

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export const scheduleMedicationReminder = async (
  medicationName: string,
  scheduledTime: Date,
  dosage: string,
  userId: string
) => {
  try {
    // Create notification in database for scheduling
    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        title: '💊 Medication Reminder',
        message: `Time to take ${medicationName} (${dosage})`,
        type: 'medication_reminder',
        scheduled_for: scheduledTime.toISOString(),
        channels: JSON.stringify(['push', 'email'])
      });

    if (error) {
      console.error('Error scheduling medication reminder:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error scheduling medication reminder:', error);
    return false;
  }
};
