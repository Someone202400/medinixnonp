import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { oneSignalService } from '@/utils/oneSignalService';
import { startMedicationReminderService } from '@/utils/notificationTrigger';

interface EnhancedNotificationManagerProps {
  children: React.ReactNode;
}

const EnhancedNotificationManager: React.FC<EnhancedNotificationManagerProps> = ({ children }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  useEffect(() => {
    if (!user) return;

    const initializeNotifications = async () => {
      try {
        // Initialize the push notification service
        await oneSignalService.initialize();
        
        // Subscribe the user to notifications
        const subscribed = await oneSignalService.subscribeUser(user.id);
        
        if (subscribed) {
          toast({
            title: "Notifications Ready! 🔔",
            description: "You'll receive medication reminders even when the app is closed.",
          });
        }

        // Start the medication reminder service
        const stopReminderService = startMedicationReminderService(user.id);
        
        return stopReminderService;
      } catch (error) {
        console.error('Error initializing notifications:', error);
      }
    };

    let cleanupReminderService: (() => void) | undefined;
    
    initializeNotifications().then((cleanup) => {
      cleanupReminderService = cleanup;
    });

    // Set up real-time notification listener
    const notificationChannel = supabase
      .channel('user-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        async (payload) => {
          const notification = payload.new as any;
          console.log('New notification received:', notification);
          
          // Send push notification
          await oneSignalService.sendNotification({
            title: notification.title,
            message: notification.message,
            type: notification.type,
            urgency: notification.type.includes('missed') ? 'high' : 'normal'
          });
          
          // Show toast notification
          toast({
            title: notification.title,
            description: notification.message,
          });
        }
      )
      .subscribe();

    // Listen for service worker messages
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        console.log('Received message from service worker:', event.data);
        
        if (event.data.type === 'MEDICATION_TAKEN') {
          toast({
            title: "Medication Marked as Taken 💊",
            description: "Your medication has been marked as taken.",
          });
          
          // Trigger a page refresh to update medication status
          window.location.reload();
        }
      });
    }

    return () => {
      supabase.removeChannel(notificationChannel);
      if (cleanupReminderService) {
        cleanupReminderService();
      }
    };
  }, [user, toast]);

  return <>{children}</>;
};

export default EnhancedNotificationManager;