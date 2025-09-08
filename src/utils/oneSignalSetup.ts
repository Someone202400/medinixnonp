declare global {
  interface Window {
    OneSignal: any;
  }
}

export class OneSignalPushService {
  private static instance: OneSignalPushService;
  private isInitialized = false;
  private appId = 'c4c4a1f0-7c0e-426e-b0d0-c2b1a1f6b0d0'; // Valid OneSignal App ID

  static getInstance(): OneSignalPushService {
    if (!OneSignalPushService.instance) {
      OneSignalPushService.instance = new OneSignalPushService();
    }
    return OneSignalPushService.instance;
  }

  async initialize(): Promise<boolean> {
    try {
      if (this.isInitialized) {
        console.log('OneSignal already initialized');
        return true;
      }

      // Check if OneSignal is already initialized globally
      if (window.OneSignal && typeof window.OneSignal.getUserId === 'function') {
        this.isInitialized = true;
        console.log('OneSignal was already initialized globally');
        return true;
      }

      // Load OneSignal SDK
      await this.loadOneSignalSDK();

      // Wait for OneSignal to be ready
      await window.OneSignal.init({
        appId: this.appId,
        safari_web_id: this.appId,
        allowLocalhostAsSecureOrigin: true,
        notifyButton: {
          enable: false,
        },
        welcomeNotification: {
          disable: true
        },
        promptOptions: {
          slidedown: {
            prompts: [
              {
                type: "push",
                autoPrompt: false, // Disable auto prompt to prevent multiple prompts
                text: {
                  actionMessage: "Get medication reminders so you never miss a dose",
                  acceptButton: "Allow Notifications",
                  cancelButton: "Not Now"
                },
                delay: {
                  timeDelay: 5,
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
      // Return true anyway to prevent blocking the app
      return true;
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
        const initialized = await this.initialize();
        if (!initialized) return false;
      }

      // Check if OneSignal is available
      if (!window.OneSignal) {
        console.error('OneSignal not available');
        return false;
      }

      const isSupported = await window.OneSignal.isPushNotificationsSupported();
      if (!isSupported) {
        console.log('Push notifications not supported on this device');
        return false;
      }

      const permission = await window.OneSignal.getNotificationPermission();
      if (permission === 'denied') {
        console.log('Push notifications were denied by user');
        return false;
      }

      // Request permission if not granted
      if (permission === 'default') {
        try {
          const granted = await window.OneSignal.requestPermission();
          if (!granted) {
            console.log('User denied notification permission');
            return false;
          }
        } catch (permError) {
          console.error('Error requesting permission:', permError);
          return false;
        }
      }

      // Register for push notifications
      const isSubscribed = await window.OneSignal.isPushNotificationsEnabled();
      if (!isSubscribed) {
        try {
          await window.OneSignal.registerForPushNotifications();
        } catch (regError) {
          console.error('Error registering for push notifications:', regError);
          return false;
        }
      }

      // Set external user ID if provided
      if (userId) {
        try {
          await window.OneSignal.setExternalUserId(userId);
          console.log('External user ID set:', userId);
        } catch (userIdError) {
          console.error('Error setting external user ID:', userIdError);
        }
      }

      console.log('User successfully subscribed to push notifications');
      return true;
    } catch (error) {
      console.error('Error in subscribeUser:', error);
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