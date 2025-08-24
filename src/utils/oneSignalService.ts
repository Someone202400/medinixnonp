// OneSignal Service for Push Notifications
// Using dynamic import to handle missing types

interface OneSignalSDK {
  init: (config: any) => Promise<void>;
  getNotificationPermission: () => Promise<string>;
  showSlidedownPrompt: () => Promise<void>;
  getPlayerId: () => Promise<string | null>;
  setExternalUserId: (userId: string) => Promise<void>;
  sendTags: (tags: any) => Promise<void>;
  setSubscription: (enabled: boolean) => Promise<void>;
  isPushNotificationsEnabled: () => Promise<boolean>;
  on: (event: string, callback: Function) => void;
}

declare global {
  interface Window {
    OneSignal?: OneSignalSDK;
  }
  
  interface ServiceWorkerGlobalScope {
    clients: {
      matchAll(): Promise<Array<{ postMessage: (data: any) => void }>>;
      openWindow(url: string): Promise<any>;
    };
  }
}

const ONESIGNAL_APP_ID = 'acc6f6c2-0509-44f7-ae38-44f89323561a';

interface NotificationOptions {
  title: string;
  message: string;
  medicationName?: string;
  dosage?: string;
  scheduledTime?: Date;
  type: 'medication_reminder' | 'missed_medication' | 'adherence_report' | 'emergency';
  actions?: Array<{
    id: string;
    title: string;
    icon?: string;
  }>;
  urgency?: 'low' | 'normal' | 'high' | 'critical';
}

class OneSignalService {
  private isInitialized = false;
  private initPromise: Promise<void> | null = null;
  private oneSignal: OneSignalSDK | null = null;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    if (this.initPromise) return this.initPromise;

    this.initPromise = this._initialize();
    return this.initPromise;
  }

  private async _initialize(): Promise<void> {
    try {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.warn('Push messaging is not supported');
        return;
      }

      // Load OneSignal dynamically
      if (!window.OneSignal) {
        const script = document.createElement('script');
        script.src = 'https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js';
        document.head.appendChild(script);
        
        await new Promise((resolve) => {
          script.onload = resolve;
        });
      }

      this.oneSignal = window.OneSignal!;

      await this.oneSignal.init({
        appId: ONESIGNAL_APP_ID,
        safari_web_id: 'web.onesignal.auto.acc6f6c2-0509-44f7-ae38-44f89323561a',
        notifyButton: {
          enable: false
        },
        allowLocalhostAsSecureOrigin: true,
        serviceWorkerParam: {
          scope: '/'
        },
        serviceWorkerPath: 'OneSignalSDKWorker.js',
        welcomeNotification: {
          disable: true
        },
        promptOptions: {
          slidedown: {
            prompts: [
              {
                type: 'push',
                autoPrompt: false,
                text: {
                  actionMessage: 'We\'d like to send you medication reminders',
                  acceptButton: 'Allow',
                  cancelButton: 'No Thanks'
                }
              }
            ]
          }
        }
      });

      // Set up notification click handlers
      this.oneSignal.on('notificationClick', this.handleNotificationClick);
      
      this.isInitialized = true;
      console.log('OneSignal initialized successfully');
    } catch (error) {
      console.error('Error initializing OneSignal:', error);
      throw error;
    }
  }

  async requestPermission(): Promise<boolean> {
    try {
      await this.initialize();
      if (!this.oneSignal) return false;
      
      const permission = await this.oneSignal.getNotificationPermission();
      if (permission === 'granted') {
        return true;
      }

      if (permission === 'default') {
        await this.oneSignal.showSlidedownPrompt();
        const newPermission = await this.oneSignal.getNotificationPermission();
        return newPermission === 'granted';
      }

      return false;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  async subscribeUser(userId: string): Promise<boolean> {
    try {
      await this.initialize();
      if (!this.oneSignal) return false;
      
      const hasPermission = await this.requestPermission();
      if (!hasPermission) {
        console.log('Notification permission not granted');
        return false;
      }

      const playerId = await this.oneSignal.getPlayerId();
      if (!playerId) {
        console.error('Failed to get OneSignal player ID');
        return false;
      }

      // Set external user ID for targeting
      await this.oneSignal.setExternalUserId(userId);
      
      // Add tags for better targeting
      await this.oneSignal.sendTags({
        user_id: userId,
        app_type: 'medication_manager',
        subscription_date: new Date().toISOString()
      });

      console.log('User subscribed to OneSignal successfully:', playerId);
      return true;
    } catch (error) {
      console.error('Error subscribing user to OneSignal:', error);
      return false;
    }
  }

  async unsubscribeUser(): Promise<boolean> {
    try {
      await this.initialize();
      if (!this.oneSignal) return false;
      
      await this.oneSignal.setSubscription(false);
      console.log('User unsubscribed from OneSignal');
      return true;
    } catch (error) {
      console.error('Error unsubscribing user from OneSignal:', error);
      return false;
    }
  }

  async sendMedicationReminder(options: NotificationOptions): Promise<void> {
    try {
      await this.initialize();

      const actions = options.actions || [
        { id: 'take', title: 'Mark as Taken' },
        { id: 'snooze', title: 'Snooze 15min' },
        { id: 'skip', title: 'Skip Today' }
      ];

      const notificationData = {
        headings: { en: options.title },
        contents: { en: options.message },
        data: {
          type: options.type,
          medicationName: options.medicationName,
          dosage: options.dosage,
          scheduledTime: options.scheduledTime?.toISOString(),
          urgency: options.urgency || 'normal'
        },
        web_buttons: actions.map(action => ({
          id: action.id,
          text: action.title,
          icon: action.icon || 'https://via.placeholder.com/16x16'
        })),
        chrome_web_icon: '/favicon.ico',
        chrome_web_badge: '/favicon.ico',
        require_interaction: options.urgency === 'critical',
        priority: this.getPriority(options.urgency || 'normal'),
        ttl: options.urgency === 'critical' ? 3600 : 1800, // Critical: 1 hour, Normal: 30 minutes
      };

      // This would typically be sent from the backend
      console.log('Medication reminder data prepared:', notificationData);
    } catch (error) {
      console.error('Error sending medication reminder:', error);
    }
  }

  async sendLocalNotification(options: NotificationOptions): Promise<void> {
    try {
      if (!('Notification' in window)) {
        console.warn('This browser does not support notifications');
        return;
      }

      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.warn('Notification permission not granted');
        return;
      }

      const actions = options.actions || [
        { id: 'take', title: 'Mark as Taken' },
        { id: 'snooze', title: 'Snooze 15min' }
      ];

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
          },
          vibrate: options.urgency === 'critical' ? [200, 100, 200, 100, 200] : [200, 100, 200]
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

  private handleNotificationClick = (event: any) => {
    console.log('Notification clicked:', event);
    
    const { actionId, data } = event;
    
    if (actionId === 'take') {
      // Handle "Mark as Taken" action
      this.handleMedicationTaken(data);
    } else if (actionId === 'snooze') {
      // Handle "Snooze" action
      this.handleMedicationSnooze(data);
    } else if (actionId === 'skip') {
      // Handle "Skip" action
      this.handleMedicationSkip(data);
    } else {
      // Default action - open app
      this.openApp();
    }
  };

  private async handleMedicationTaken(data: any) {
    try {
      // Send message to main app
      if ('serviceWorker' in navigator) {
        const clients = await (self as any).clients?.matchAll() || [];
        clients.forEach((client: any) => {
          client.postMessage({
            type: 'MEDICATION_TAKEN',
            data: {
              medicationName: data.medicationName,
              dosage: data.dosage,
              takenAt: new Date().toISOString()
            }
          });
        });
      }
      
      console.log('Medication marked as taken from notification');
    } catch (error) {
      console.error('Error handling medication taken:', error);
    }
  }

  private async handleMedicationSnooze(data: any) {
    try {
      // Reschedule notification for 15 minutes later
      setTimeout(() => {
        this.sendLocalNotification({
          title: `Reminder: ${data.medicationName}`,
          message: `Time to take your ${data.medicationName} (${data.dosage}) - Snoozed reminder`,
          medicationName: data.medicationName,
          dosage: data.dosage,
          type: 'medication_reminder',
          urgency: 'high'
        });
      }, 15 * 60 * 1000); // 15 minutes
      
      console.log('Medication reminder snoozed for 15 minutes');
    } catch (error) {
      console.error('Error handling medication snooze:', error);
    }
  }

  private async handleMedicationSkip(data: any) {
    try {
      // Send message to main app to mark as skipped
      if ('serviceWorker' in navigator) {
        const clients = await (self as any).clients?.matchAll() || [];
        clients.forEach((client: any) => {
          client.postMessage({
            type: 'MEDICATION_SKIPPED',
            data: {
              medicationName: data.medicationName,
              dosage: data.dosage,
              skippedAt: new Date().toISOString()
            }
          });
        });
      }
      
      console.log('Medication marked as skipped from notification');
    } catch (error) {
      console.error('Error handling medication skip:', error);
    }
  }

  private openApp() {
    try {
      // Try to focus existing window or open new one
      if (typeof window !== 'undefined') {
        window.focus();
      } else {
        // From service worker context
        (self as any).clients?.openWindow('/dashboard');
      }
    } catch (error) {
      console.error('Error opening app:', error);
    }
  }

  private getPriority(urgency: string): number {
    switch (urgency) {
      case 'critical': return 10;
      case 'high': return 7;
      case 'normal': return 5;
      case 'low': return 3;
      default: return 5;
    }
  }

  async isSubscribed(): Promise<boolean> {
    try {
      await this.initialize();
      if (!this.oneSignal) return false;
      return await this.oneSignal.isPushNotificationsEnabled();
    } catch (error) {
      console.error('Error checking subscription status:', error);
      return false;
    }
  }

  async getPlayerId(): Promise<string | null> {
    try {
      await this.initialize();
      if (!this.oneSignal) return null;
      return await this.oneSignal.getPlayerId();
    } catch (error) {
      console.error('Error getting player ID:', error);
      return null;
    }
  }
}

export const oneSignalService = new OneSignalService();
export default oneSignalService;