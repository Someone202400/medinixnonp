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
  private serviceWorkerRegistration: ServiceWorkerRegistration | null = null;

  async initialize(): Promise<boolean> {
    if (this.isInitialized) {
      console.log('Push notification service already initialized');
      return true;
    }

    try {
      console.log('Initializing push notification service...');
      
      // Register service worker
      if ('serviceWorker' in navigator) {
        this.serviceWorkerRegistration = await navigator.serviceWorker.register('/OneSignalSDKWorker.js');
        console.log('Service Worker registered successfully');
      }

      this.isInitialized = true;
      console.log('Push notification service initialized successfully');
      
      return true;
    } catch (error) {
      console.error('Failed to initialize push notification service:', error);
      return false;
    }
  }

  private setupEventHandlers(): void {
    try {
      // Set up notification click handlers
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.addEventListener('message', (event) => {
          console.log('Received message from service worker:', event.data);
        });
      }
    } catch (error) {
      console.error('Error setting up notification event handlers:', error);
    }
  }

  async subscribeUser(userId?: string): Promise<boolean> {
    try {
      if (!this.isInitialized) {
        const initialized = await this.initialize();
        if (!initialized) return false;
      }

      // Check if we have permission
      if (Notification.permission !== 'granted') {
        console.log('Requesting notification permission...');
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          console.log('User denied notification permission');
          return false;
        }
      }

      console.log('Push notification subscription successful for user:', userId);
      return true;
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      return false;
    }
  }

  async unsubscribeUser(): Promise<boolean> {
    try {
      if (!this.isInitialized) return true; // Already not subscribed
      
      console.log('Push notifications unsubscribed successfully');
      return true;
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
      return false;
    }
  }

  async sendNotification(options: MedicationNotificationOptions): Promise<void> {
    if (!this.isInitialized) {
      console.log('Push service not initialized, falling back to browser notifications');
      await this.sendLocalNotification(options);
      return;
    }

    try {
      console.log('Sending push notification:', options);
      await this.sendLocalNotification(options);
    } catch (error) {
      console.error('Error sending push notification:', error);
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
    // For browser notifications, we don't have external user IDs
    return null;
  }

  async isSubscribed(): Promise<boolean> {
    try {
      return this.isInitialized && Notification.permission === 'granted';
    } catch (error) {
      console.error('Error checking subscription status:', error);
      return false;
    }
  }

  async getSubscriptionId(): Promise<string | null> {
    // For browser notifications, we don't have subscription IDs
    return null;
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