import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { subscribeToPushNotifications, isPushNotificationSupported } from '@/utils/pushNotificationService';

interface NotificationManagerProps {
  children: React.ReactNode;
}

const NotificationManager: React.FC<NotificationManagerProps> = ({ children }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [pushSubscriptionStatus, setPushSubscriptionStatus] = useState<string>('unknown');

  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  useEffect(() => {
    if (!user) return;

    // Request notification permission
    const requestNotificationPermission = async () => {
      if ('Notification' in window && Notification.permission === 'default') {
        const permission = await Notification.requestPermission();
        setNotificationPermission(permission);
        
        if (permission === 'granted') {
          toast({
            title: "Notifications Enabled",
            description: "You'll now receive medication reminders and health updates.",
          });
        }
      }
    };

    requestNotificationPermission();
    setupPushNotifications();

    // Register service worker for push notifications
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registered:', registration);
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error);
        });
    }

    // Set up real-time notification listener for user notifications
    const userNotificationChannel = supabase
      .channel('user-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const notification = payload.new as any;
          console.log('New notification received:', notification);
          
          // Show browser notification if permission granted
          if (notificationPermission === 'granted') {
            try {
              new Notification(notification.title, {
                body: notification.message,
                icon: '/favicon.ico',
                tag: notification.id,
                requireInteraction: true
              });
            } catch (error) {
              console.error('Error showing browser notification:', error);
            }
          }
          
          // Show toast notification
          toast({
            title: notification.title,
            description: notification.message,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(userNotificationChannel);
    };
  }, [user, notificationPermission, toast]);

  const setupPushNotifications = async () => {
    if (!user?.id) return;

    try {
      if (!isPushNotificationSupported()) {
        setPushSubscriptionStatus('not_supported');
        console.log('Push notifications not supported on this device');
        return;
      }

      const success = await subscribeToPushNotifications(user.id);
      setPushSubscriptionStatus(success ? 'subscribed' : 'failed');

      if (success) {
        console.log('Push notifications set up successfully');
        toast({
          title: "Push Notifications Ready! 📱",
          description: "You'll receive medication reminders even when the app is closed.",
        });
      }
    } catch (error) {
      console.error('Error setting up push notifications:', error);
      setPushSubscriptionStatus('error');
    }
  };

  // Listen for service worker messages
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        console.log('Received message from service worker:', event.data);
        
        if (event.data.type === 'MEDICATION_TAKEN') {
          // Handle medication taken from notification
          toast({
            title: "Medication Marked as Taken 💊",
            description: "Your medication has been marked as taken from the notification.",
          });
          
          // Refresh the app or trigger relevant updates
          window.location.reload();
        }
      });
    }
  }, [toast]);

  return <>{children}</>;
};

export default NotificationManager;