
import { supabase } from '@/integrations/supabase/client';

let notificationsEnabled = false;

export const initializeNotifications = async () => {
  try {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      notificationsEnabled = permission === 'granted';
      console.log('Notifications enabled:', notificationsEnabled);
    }
  } catch (error) {
    console.error('Error initializing notifications:', error);
  }
};

export const sendNotification = (title: string, body: string, options: NotificationOptions = {}) => {
  if (!notificationsEnabled) return;
  
  try {
    const notification = new Notification(title, {
      body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      requireInteraction: true,
      ...options
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    // Auto close after 10 seconds
    setTimeout(() => notification.close(), 10000);
  } catch (error) {
    console.error('Error sending notification:', error);
  }
};

export const scheduleNotification = async (
  userId: string,
  title: string,
  message: string,
  scheduledFor: Date,
  type: string = 'medication',
  caregiverId?: string
) => {
  try {
    const notification = {
      user_id: userId,
      title,
      message,
      type,
      scheduled_for: scheduledFor.toISOString(),
      status: 'pending',
      channels: JSON.stringify(['push', 'email']),
      ...(caregiverId && { caregiver_id: caregiverId })
    };

    const { error } = await supabase
      .from('notifications')
      .insert([notification]);

    if (error) {
      console.error('Error scheduling notification:', error);
      return false;
    }

    console.log('Notification scheduled successfully');
    return true;
  } catch (error) {
    console.error('Error in scheduleNotification:', error);
    return false;
  }
};

export const sendPendingNotifications = async () => {
  try {
    const now = new Date();
    const { data: pendingNotifications, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_for', now.toISOString());

    if (error) {
      console.error('Error fetching pending notifications:', error);
      return;
    }

    for (const notification of pendingNotifications || []) {
      // Send browser notification
      sendNotification(notification.title, notification.message);
      
      // Play notification sound
      playNotificationSound();

      // Send email/push via edge function
      try {
        await supabase.functions.invoke('send-notifications', {
          body: { 
            notifications: [notification],
            immediate: true 
          }
        });
      } catch (error) {
        console.error('Error calling send-notifications function:', error);
      }

      // Mark as sent
      await supabase
        .from('notifications')
        .update({ 
          status: 'sent', 
          sent_at: new Date().toISOString() 
        })
        .eq('id', notification.id);
    }
  } catch (error) {
    console.error('Error sending pending notifications:', error);
  }
};

export const scheduleMedicationReminders = async (
  userId: string,
  medicationName: string,
  dosage: string,
  scheduledTimes: string[],
  startDate: Date,
  endDate?: Date
) => {
  try {
    const notifications = [];
    const currentDate = new Date(startDate);
    const finalDate = endDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

    // Get caregivers for this user
    const { data: caregivers } = await supabase
      .from('caregivers')
      .select('*')
      .eq('user_id', userId)
      .eq('notifications_enabled', true);

    while (currentDate <= finalDate) {
      for (const timeStr of scheduledTimes) {
        const [hours, minutes] = timeStr.split(':').map(Number);
        const reminderTime = new Date(currentDate);
        reminderTime.setHours(hours, minutes, 0, 0);

        // Skip past dates
        if (reminderTime <= new Date()) {
          continue;
        }

        // Create reminder 15 minutes before medication time
        const reminderDate = new Date(reminderTime.getTime() - 15 * 60 * 1000);
        
        // User reminder
        notifications.push({
          user_id: userId,
          title: '💊 Medication Reminder',
          message: `Time to take your ${medicationName} (${dosage}) in 15 minutes!`,
          type: 'medication_reminder',
          scheduled_for: reminderDate.toISOString(),
          status: 'pending',
          channels: JSON.stringify(['push', 'email'])
        });

        // Medication time notification
        notifications.push({
          user_id: userId,
          title: '🕐 Medication Time',
          message: `It's time to take your ${medicationName} (${dosage})!`,
          type: 'medication',
          scheduled_for: reminderTime.toISOString(),
          status: 'pending',
          channels: JSON.stringify(['push', 'email'])
        });

        // Caregiver notifications
        if (caregivers && caregivers.length > 0) {
          for (const caregiver of caregivers) {
            notifications.push({
              user_id: userId,
              title: '👥 Patient Medication Reminder',
              message: `${caregiver.name} should take ${medicationName} (${dosage}) at ${timeStr}`,
              type: 'caregiver_notification',
              scheduled_for: reminderTime.toISOString(),
              status: 'pending',
              channels: JSON.stringify(['push', 'email']),
              caregiver_id: caregiver.id
            });
          }
        }
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Insert all notifications in batches
    const batchSize = 100;
    for (let i = 0; i < notifications.length; i += batchSize) {
      const batch = notifications.slice(i, i + batchSize);
      const { error } = await supabase
        .from('notifications')
        .insert(batch);

      if (error) {
        console.error('Error inserting notification batch:', error);
      }
    }

    console.log(`Scheduled ${notifications.length} medication reminders`);
    return true;
  } catch (error) {
    console.error('Error scheduling medication reminders:', error);
    return false;
  }
};

export const notifyMedicationTaken = async (
  userId: string,
  medicationName: string,
  dosage: string,
  takenAt: Date
) => {
  try {
    // Get user profile and caregivers
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    const { data: caregivers } = await supabase
      .from('caregivers')
      .select('*')
      .eq('user_id', userId)
      .eq('notifications_enabled', true);

    const notifications = [];

    // User confirmation notification
    notifications.push({
      user_id: userId,
      title: '✅ Medication Taken',
      message: `Great! You've taken your ${medicationName} (${dosage}) at ${takenAt.toLocaleTimeString()}.`,
      type: 'medication_taken',
      scheduled_for: new Date().toISOString(),
      status: 'pending',
      channels: JSON.stringify(['push'])
    });

    // Caregiver notifications
    if (caregivers && caregivers.length > 0) {
      const patientName = profile?.full_name || profile?.email || 'Patient';
      
      for (const caregiver of caregivers) {
        notifications.push({
          user_id: userId,
          title: '✅ Medication Taken',
          message: `${patientName} has taken their ${medicationName} (${dosage}) at ${takenAt.toLocaleTimeString()}.`,
          type: 'caregiver_notification',
          scheduled_for: new Date().toISOString(),
          status: 'pending',
          channels: JSON.stringify(['push', 'email']),
          caregiver_id: caregiver.id
        });
      }
    }

    // Insert notifications
    const { error } = await supabase
      .from('notifications')
      .insert(notifications);

    if (error) {
      console.error('Error creating medication taken notifications:', error);
      return false;
    }

    // Send immediately
    await sendPendingNotifications();
    return true;
  } catch (error) {
    console.error('Error in notifyMedicationTaken:', error);
    return false;
  }
};

export const notifyMissedMedication = async (
  userId: string,
  medicationName: string,
  dosage: string,
  scheduledTime: Date
) => {
  try {
    // Get user profile and caregivers
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    const { data: caregivers } = await supabase
      .from('caregivers')
      .select('*')
      .eq('user_id', userId)
      .eq('notifications_enabled', true);

    const notifications = [];

    // User missed medication alert
    notifications.push({
      user_id: userId,
      title: '⚠️ Missed Medication',
      message: `You missed your ${medicationName} (${dosage}) scheduled for ${scheduledTime.toLocaleTimeString()}. Please take it when possible.`,
      type: 'missed_medication',
      scheduled_for: new Date().toISOString(),
      status: 'pending',
      channels: JSON.stringify(['push', 'email'])
    });

    // Caregiver notifications for missed medications
    if (caregivers && caregivers.length > 0) {
      const patientName = profile?.full_name || profile?.email || 'Patient';
      
      for (const caregiver of caregivers) {
        notifications.push({
          user_id: userId,
          title: '⚠️ Missed Medication Alert',
          message: `${patientName} missed their ${medicationName} (${dosage}) scheduled for ${scheduledTime.toLocaleTimeString()}.`,
          type: 'missed_medication_caregiver',
          scheduled_for: new Date().toISOString(),
          status: 'pending',
          channels: JSON.stringify(['push', 'email']),
          caregiver_id: caregiver.id
        });
      }
    }

    // Insert notifications
    const { error } = await supabase
      .from('notifications')
      .insert(notifications);

    if (error) {
      console.error('Error creating missed medication notifications:', error);
      return false;
    }

    // Send immediately
    await sendPendingNotifications();
    return true;
  } catch (error) {
    console.error('Error in notifyMissedMedication:', error);
    return false;
  }
};

const playNotificationSound = () => {
  try {
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMcBziN2/LNeSsFJHbE8d2UQgwaXbXq66hWFAlFnt/yv2UdBzl+1vLLfCwGI3zE7+OZRAo7gdf0xH4xBiV+yOvXfzIIIYDJ7+CWQAofWaTg7qtqMgAucKvt1H8xBiWAyeriw2UcBziE2/LNeSsFJHzA7+CZREY6gNf0x4A0CtjrxmUcBziN2/L');
    audio.volume = 0.3;
    audio.play().catch(e => console.log('Audio play failed:', e));
  } catch (error) {
    console.log('Could not play notification sound:', error);
  }
};
