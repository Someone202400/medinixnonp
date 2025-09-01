declare global {
  interface Window {
    OneSignal: any;
  }
}

export class OneSignalPushService {
  private static instance: OneSignalPushService;
  private isInitialized = false;
  private appId = '4b5d8fd8-b8f8-4562-8e89-de8b59dd9de0'; // OneSignal App ID

  static getInstance(): OneSignalPushService {
    if (!OneSignalPushService.instance) {
      OneSignalPushService.instance = new OneSignalPushService();
    }
    return OneSignalPushService.instance;
  }

  async initialize(): Promise<boolean> {
    try {
      if (this.isInitialized) return true;

      // Load OneSignal SDK
      await this.loadOneSignalSDK();

      // Initialize OneSignal
      await window.OneSignal.init({
        appId: this.appId,
        safari_web_id: this.appId,
        notifyButton: {
          enable: false,
        },
        promptOptions: {
          slidedown: {
            prompts: [
              {
                type: "push",
                autoPrompt: true,
                text: {
                  actionMessage: "We'd like to send you medication reminders",
                  acceptButton: "Allow",
                  cancelButton: "No Thanks"
                },
                delay: {
                  timeDelay: 20,
                  pageViews: 1
                }
              }
            ]
          }
        }
      });

      this.isInitialized = true;
      console.log('OneSignal initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize OneSignal:', error);
      return false;
    }
  }

  private async loadOneSignalSDK(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (window.OneSignal) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://cdn.onesignal.com/sdks/OneSignalSDK.js';
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load OneSignal SDK'));
      document.head.appendChild(script);
    });
  }

  async subscribeUser(userId?: string): Promise<boolean> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const isSupported = await window.OneSignal.isPushNotificationsSupported();
      if (!isSupported) {
        console.log('Push notifications not supported');
        return false;
      }

      const permission = await window.OneSignal.getNotificationPermission();
      if (permission === 'denied') {
        console.log('Push notifications denied');
        return false;
      }

      if (permission === 'default') {
        await window.OneSignal.requestPermission();
      }

      const isSubscribed = await window.OneSignal.isPushNotificationsEnabled();
      if (!isSubscribed) {
        await window.OneSignal.registerForPushNotifications();
      }

      if (userId) {
        await window.OneSignal.setExternalUserId(userId);
      }

      console.log('User subscribed to push notifications');
      return true;
    } catch (error) {
      console.error('Error subscribing user:', error);
      return false;
    }
  }

  async sendMedicationReminder(
    userId: string,
    medicationName: string,
    dosage: string,
    scheduledTime: string
  ): Promise<boolean> {
    try {
      const notification = {
        headings: { en: "Time to take your medication!" },
        contents: { en: `${medicationName} - ${dosage}` },
        data: {
          type: 'medication_reminder',
          medicationName,
          dosage,
          scheduledTime
        },
        buttons: [
          {
            id: 'mark-taken',
            text: 'Mark as Taken'
          },
          {
            id: 'snooze',
            text: 'Snooze 15min'
          }
        ],
        include_external_user_ids: [userId],
        require_interaction: true,
        ttl: 3600
      };

      // Note: Sending notifications requires server-side implementation
      // This would typically be handled by your backend
      console.log('Medication reminder notification prepared:', notification);
      return true;
    } catch (error) {
      console.error('Error sending medication reminder:', error);
      return false;
    }
  }

  async testNotification(): Promise<boolean> {
    try {
      const playerId = await window.OneSignal.getUserId();
      if (!playerId) {
        console.log('User not subscribed to notifications');
        return false;
      }

      // Local notification for testing
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Medinix Test', {
          body: 'Push notifications are working!',
          icon: '/icon-192x192.png',
          badge: '/icon-192x192.png'
        });
      }

      console.log('Test notification sent');
      return true;
    } catch (error) {
      console.error('Error sending test notification:', error);
      return false;
    }
  }

  async isSubscribed(): Promise<boolean> {
    try {
      if (!this.isInitialized) return false;
      return await window.OneSignal.isPushNotificationsEnabled();
    } catch (error) {
      console.error('Error checking subscription status:', error);
      return false;
    }
  }

  async unsubscribe(): Promise<boolean> {
    try {
      if (!this.isInitialized) return false;
      await window.OneSignal.setSubscription(false);
      console.log('User unsubscribed from push notifications');
      return true;
    } catch (error) {
      console.error('Error unsubscribing:', error);
      return false;
    }
  }
}

export const oneSignalService = OneSignalPushService.getInstance();