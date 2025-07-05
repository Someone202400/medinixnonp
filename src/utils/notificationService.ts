
import { supabase } from '@/integrations/supabase/client';
import { addMinutes, isAfter, isBefore } from 'date-fns';

export interface NotificationData {
  user_id: string;
  title: string;
  message: string;
  type: string;
  scheduled_for: string;
  channels: string[];
  caregiver_id?: string;
}

export const scheduleNotification = async (notificationData: NotificationData) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .insert([{
        ...notificationData,
        channels: JSON.stringify(notificationData.channels)
      }]);

    if (error) throw error;
    console.log('Notification scheduled successfully');
  } catch (error) {
    console.error('Error scheduling notification:', error);
  }
};

export const scheduleMedicationReminders = async (userId: string) => {
  try {
    const now = new Date();
    const nextDay = new Date(now);
    nextDay.setDate(nextDay.getDate() + 1);
    nextDay.setHours(23, 59, 59, 999);

    // Get upcoming medications for today and tomorrow
    const { data: upcomingMeds, error } = await supabase
      .from('medication_logs')
      .select(`
        *,
        medications (name, dosage)
      `)
      .eq('user_id', userId)
      .eq('status', 'pending')
      .gte('scheduled_time', now.toISOString())
      .lte('scheduled_time', nextDay.toISOString());

    if (error) throw error;

    // Get user profile for notifications
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    // Get caregivers for notifications
    const { data: caregivers } = await supabase
      .from('caregivers')
      .select('*')
      .eq('user_id', userId)
      .eq('notifications_enabled', true);

    for (const med of upcomingMeds || []) {
      const scheduledTime = new Date(med.scheduled_time);
      const reminderTime = addMinutes(scheduledTime, -15); // 15 minutes before

      // Schedule user reminder if it's in the future
      if (isAfter(reminderTime, now)) {
        await scheduleNotification({
          user_id: userId,
          title: '🔔 Medication Reminder',
          message: `Time to take your ${med.medications?.name} (${med.medications?.dosage}) in 15 minutes!`,
          type: 'medication_reminder',
          scheduled_for: reminderTime.toISOString(),
          channels: ['push', 'email']
        });
      }

      // Schedule exact time notification
      if (isAfter(scheduledTime, now)) {
        await scheduleNotification({
          user_id: userId,
          title: '💊 Time for Medication',
          message: `It's time to take your ${med.medications?.name} (${med.medications?.dosage})!`,
          type: 'medication',
          scheduled_for: scheduledTime.toISOString(),
          channels: ['push', 'email']
        });

        // Schedule caregiver notifications
        if (caregivers && caregivers.length > 0) {
          const patientName = profile?.full_name || profile?.email || 'Patient';
          
          for (const caregiver of caregivers) {
            await scheduleNotification({
              user_id: userId,
              title: '⏰ Medication Time Alert',
              message: `${patientName} should take their ${med.medications?.name} (${med.medications?.dosage}) now.`,
              type: 'caregiver_notification',
              scheduled_for: scheduledTime.toISOString(),
              channels: ['push', 'email'],
              caregiver_id: caregiver.id
            });
          }
        }
      }
    }

    console.log('Medication reminders scheduled successfully');
  } catch (error) {
    console.error('Error scheduling medication reminders:', error);
  }
};

export const sendPendingNotifications = async () => {
  try {
    const now = new Date();
    const twoMinutesAgo = addMinutes(now, -2);

    // Get pending notifications that should be sent
    const { data: pendingNotifications, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_for', now.toISOString())
      .gte('scheduled_for', twoMinutesAgo.toISOString());

    if (error) throw error;

    for (const notification of pendingNotifications || []) {
      // Send push notification
      if (notification.channels && JSON.parse(notification.channels).includes('push')) {
        await sendPushNotification(notification);
      }

      // Send email notification if it includes caregiver
      if (notification.channels && JSON.parse(notification.channels).includes('email') && notification.caregiver_id) {
        await sendEmailNotification(notification);
      }

      // Mark as sent
      await supabase
        .from('notifications')
        .update({ 
          status: 'sent', 
          sent_at: now.toISOString() 
        })
        .eq('id', notification.id);
    }
  } catch (error) {
    console.error('Error sending pending notifications:', error);
  }
};

const sendPushNotification = async (notification: any) => {
  try {
    // Show browser notification
    if ('Notification' in window && Notification.permission === 'granted') {
      const browserNotification = new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        tag: `medication-${notification.id}`,
        requireInteraction: true
      });

      // Play sound
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMcBjiN2/LNeSsFJHbE8d2UQgwaXbXq66hWFAlFnt/yv2UdBzl+1vLLfCwGI3zE7+OZRAY7gdf0xH4xBiV+yOvXfzIIIYDJ7+CWQAofWaTg7qtqMgAucK' + '0BAD4AAABMZmFjdAAAAAAAFAAAAA==');
      audio.volume = 0.3;
      audio.play().catch(e => console.log('Audio play failed:', e));

      browserNotification.onclick = () => {
        window.focus();
        browserNotification.close();
      };

      // Auto-close after 10 seconds
      setTimeout(() => {
        browserNotification.close();
      }, 10000);
    }
  } catch (error) {
    console.error('Error sending push notification:', error);
  }
};

const sendEmailNotification = async (notification: any) => {
  try {
    // Get caregiver details
    const { data: caregiver } = await supabase
      .from('caregivers')
      .select('*')
      .eq('id', notification.caregiver_id)
      .single();

    if (caregiver?.email) {
      // Send via edge function
      await supabase.functions.invoke('send-notifications', {
        body: {
          notifications: [notification],
          caregivers: [caregiver]
        }
      });
    }
  } catch (error) {
    console.error('Error sending email notification:', error);
  }
};

// Initialize notification permissions
export const initializeNotifications = async () => {
  if ('Notification' in window) {
    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      console.log('Notification permission:', permission);
    }
  }
};
