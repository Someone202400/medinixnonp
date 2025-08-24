import OneSignal from 'onesignal-web-sdk';

interface MedicationNotificationOptions {
  title: string;
  message: string;
  medicationName?: string;
  dosage?: string;
  scheduledTime?: Date;
  urgency?: 'normal' | 'high' | 'critical';
  type?: 'reminder' | 'missed' | 'taken' | 'caregiver_alert';
}

class OneSignalService {
  private isInitialized = false;
  private appId = 'acc6f6c2-0509-44f7-ae38-44f89323561a';

  async initialize(): Promise<boolean> {
    if (this.isInitialized) {
      console.log('OneSignal already initialized');
      return true;
    }

    try {
      console.log('Initializing OneSignal...');
      
      await OneSignal.init({
        appId: this.appId,
        safari_web_id: 'web.onesignal.auto.18e69830-6d73-4375-be32-8f9d9e45158e',
        notifyButton: {
          enable: true,
        },
        allowLocalhostAsSecureOrigin: true,
        autoRegister: false, // We'll register manually
        autoResubscribe: true,
        persistNotification: false,
        promptOptions: {
          slidedown: {
            prompts: [
              {
                type: "push", // current types are "push" & "category"
                autoPrompt: true,
                text: {
                  actionMessage: "We'd like to send you medication reminders and important health notifications.",
                  acceptButton: "Allow",
                  cancelButton: "Cancel"
                },
                delay: {
                  pageViews: 1,
                  timeDelay: 20
                }
              }
            ]
          }
        }
      });

      this.isInitialized = true;
      console.log('OneSignal initialized successfully');
      
      // Set up notification click handlers
      this.setupEventHandlers();
      
      return true;
    } catch (error) {
      console.error('Failed to initialize OneSignal:', error);
      return false;
    }
  }

  private setupEventHandlers(): void {
    try {
      OneSignal.on('subscriptionChange', (isSubscribed) => {
        console.log('OneSignal subscription changed:', isSubscribed);
      });

      OneSignal.on('notificationPermissionChange', (permissionChange) => {
        console.log('OneSignal permission changed:', permissionChange);
      });

      OneSignal.on('notificationDisplay', (event) => {
        console.log('OneSignal notification displayed:', event);
      });

      OneSignal.on('notificationDismiss', (event) => {
        console.log('OneSignal notification dismissed:', event);
      });
    } catch (error) {
      console.error('Error setting up OneSignal event handlers:', error);
    }
  }

  async subscribeUser(userId?: string): Promise<boolean> {
    try {
      if (!this.isInitialized) {
        const initialized = await this.initialize();
        if (!initialized) return false;
      }

      // Check if we have permission
      const permission = await OneSignal.getNotificationPermission();
      if (permission !== 'granted') {
        console.log('Requesting notification permission...');
        const granted = await OneSignal.registerForPushNotifications();
        if (!granted) {
          console.log('User denied notification permission');
          return false;
        }
      }

      // Subscribe the user
      await OneSignal.showSlidedownPrompt();
      
      if (userId) {
        await OneSignal.setExternalUserId(userId);
        console.log('OneSignal external user ID set:', userId);
      }

      const subscriptionId = await OneSignal.getSubscription();
      console.log('OneSignal subscription successful:', subscriptionId);
      return true;
    } catch (error) {
      console.error('Error subscribing to OneSignal:', error);
      return false;
    }
  }

  async unsubscribeUser(): Promise<boolean> {
    try {
      if (!this.isInitialized) return true; // Already not subscribed
      
      await OneSignal.setSubscription(false);
      console.log('OneSignal unsubscribed successfully');
      return true;
    } catch (error) {
      console.error('Error unsubscribing from OneSignal:', error);
      return false;
    }
  }

  async sendNotification(options: MedicationNotificationOptions): Promise<void> {
    if (!this.isInitialized) {
      console.log('OneSignal not initialized, falling back to browser notifications');
      await this.sendLocalNotification(options);
      return;
    }

    try {
      // OneSignal notifications are sent from the server
      // This method would be used to trigger server-side notifications
      console.log('OneSignal notification request:', options);
      
      // For now, we'll use local notifications as fallback
      await this.sendLocalNotification(options);
    } catch (error) {
      console.error('Error sending OneSignal notification:', error);
      // Fallback to local notification
      await this.sendLocalNotification(options);
    }
  }

  private async sendLocalNotification(options: MedicationNotificationOptions): Promise<void> {
    // Request permission if needed
    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.log('Notification permission denied');
        return;
      }
    }

    if (Notification.permission === 'granted') {
      try {
        // For browsers that support service workers
        if ('serviceWorker' in navigator) {
          const registration = await navigator.serviceWorker.ready;
          
          await registration.showNotification(options.title, {
            body: options.message,
            icon: '/favicon.ico',
            badge: '/favicon.ico',
            tag: `medication-${options.medicationName?.replace(/\s+/g, '-').toLowerCase()}`,
            requireInteraction: options.urgency === 'critical',
            data: {
              type: options.type,
              medicationName: options.medicationName,
              dosage: options.dosage,
              scheduledTime: options.scheduledTime?.toISOString(),
              urgency: options.urgency || 'normal'
            }
          });
        } else {
          // Fallback for browsers without service worker support
          new Notification(options.title, {
            body: options.message,
            icon: '/favicon.ico',
            tag: `medication-${options.medicationName?.replace(/\s+/g, '-').toLowerCase()}`,
          });
        }

        console.log('Local notification sent:', options.title);
      } catch (error) {
        console.error('Error sending local notification:', error);
      }
    }
  }

  async getUserId(): Promise<string | null> {
    try {
      if (!this.isInitialized) return null;
      return await OneSignal.getExternalUserId();
    } catch (error) {
      console.error('Error getting OneSignal user ID:', error);
      return null;
    }
  }

  async isSubscribed(): Promise<boolean> {
    try {
      if (!this.isInitialized) return false;
      const subscription = await OneSignal.getSubscription();
      return subscription !== null;
    } catch (error) {
      console.error('Error checking OneSignal subscription status:', error);
      return false;
    }
  }

  async getSubscriptionId(): Promise<string | null> {
    try {
      if (!this.isInitialized) return null;
      const subscription = await OneSignal.getSubscription();
      return subscription?.id || null;
    } catch (error) {
      console.error('Error getting OneSignal subscription ID:', error);
      return null;
    }
  }

  // Medication-specific notification methods
  async sendMedicationReminder(medicationName: string, dosage: string, scheduledTime: Date): Promise<void> {
    await this.sendNotification({
      title: `Time to take ${medicationName}`,
      message: `Take ${dosage} now. Scheduled for ${scheduledTime.toLocaleTimeString()}`,
      medicationName,
      dosage,
      scheduledTime,
      urgency: 'normal',
      type: 'reminder'
    });
  }

  async sendMissedMedicationAlert(medicationName: string, dosage: string, scheduledTime: Date): Promise<void> {
    await this.sendNotification({
      title: `Missed: ${medicationName}`,
      message: `You haven't taken your ${dosage} yet. It was scheduled for ${scheduledTime.toLocaleTimeString()}`,
      medicationName,
      dosage,
      scheduledTime,
      urgency: 'high',
      type: 'missed'
    });
  }

  async sendCriticalMedicationAlert(medicationName: string, dosage: string): Promise<void> {
    await this.sendNotification({
      title: `⚠️ Critical: ${medicationName}`,
      message: `This is a critical medication (${dosage}). Please take it immediately and contact your healthcare provider if needed.`,
      medicationName,
      dosage,
      urgency: 'critical',
      type: 'reminder'
    });
  }

  // Utility methods
  async testNotification(): Promise<void> {
    await this.sendNotification({
      title: 'Test Notification',
      message: 'MedCare notifications are working correctly! 💊',
      urgency: 'normal',
      type: 'reminder'
    });
  }
}

// Export singleton instance
export const oneSignalService = new OneSignalService();

// Export class for testing
export { OneSignalService };
export type { MedicationNotificationOptions };