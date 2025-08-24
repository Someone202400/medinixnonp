import { supabase } from '@/integrations/supabase/client';
import { addMinutes, isAfter } from 'date-fns';

// Start the missed medication monitor
let missedMedicationInterval: NodeJS.Timeout | null = null;

export const startNotificationServices = () => {
  // Start missed medication monitoring
  if (!missedMedicationInterval) {
    missedMedicationInterval = setInterval(async () => {
      try {
        await checkForMissedMedications();
        await sendPendingNotifications();
      } catch (error) {
        console.error('Error in notification services:', error);
      }
    }, 2 * 60 * 1000); // Check every 2 minutes
  }
};

export const stopNotificationServices = () => {
  if (missedMedicationInterval) {
    clearInterval(missedMedicationInterval);
    missedMedicationInterval = null;
  }
};

export const checkForMissedMedications = async () => {
  try {
    const now = new Date();
    const thirtyMinutesAgo = addMinutes(now, -30);

    // Find medications that are overdue (scheduled more than 30 minutes ago and still pending)
    const { data: overdueLogsData, error: overdueError } = await supabase
      .from('medication_logs')
      .select(`
        *,
        medications (name, dosage)
      `)
      .eq('status', 'pending')
      .lt('scheduled_time', thirtyMinutesAgo.toISOString());

    if (overdueError) {
      console.error('Error checking for missed medications:', overdueError);
      return 0;
    }

    const overdueLogs = overdueLogsData || [];
    console.log('Found overdue medications:', overdueLogs.length);

    // Mark as missed and create notifications
    for (const log of overdueLogs) {
      // Update status to missed
      const { error: updateError } = await supabase
        .from('medication_logs')
        .update({ status: 'missed' })
        .eq('id', log.id);

      if (updateError) {
        console.error('Error updating missed medication:', updateError);
        continue;
      }

      // Create user notification for missed medication
      await createMissedMedicationNotification(log.user_id, log);
    }

    return overdueLogs.length;
  } catch (error) {
    console.error('Error in checkForMissedMedications:', error);
    return 0;
  }
};

const createMissedMedicationNotification = async (userId: string, medicationLog: any) => {
  try {
    // Safely convert medication data to strings
    const medicationName = String(medicationLog.medications?.name || 'medication');
    const medicationDosage = String(medicationLog.medications?.dosage || '');
    
    const notification = {
      user_id: userId,
      title: 'Missed Medication',
      message: `You missed your ${medicationName} (${medicationDosage}) scheduled for ${new Date(medicationLog.scheduled_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
      type: 'missed_medication',
      scheduled_for: new Date().toISOString(),
      channels: JSON.stringify(['push'])
    };

    const { error } = await supabase
      .from('notifications')
      .insert([notification]);

    if (error) {
      console.error('Error creating missed medication notification:', error);
    }
  } catch (error) {
    console.error('Error creating missed medication notification:', error);
  }
};

export const notifyMedicationTaken = async (
  userId: string,
  medicationName: string,
  dosage: string,
  takenAt: Date
) => {
  try {
    // Only notify the patient - no caregiver notifications
    console.log(`Medication taken for user ${userId}:`, medicationName);

    // Create user notification
    const userNotification = {
      user_id: userId,
      title: 'Medication Taken ✅',
      message: `Great job! You took your ${medicationName} (${dosage}) at ${takenAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}. Keep up the good work!`,
      type: 'medication_taken',
      scheduled_for: new Date().toISOString(),
      channels: JSON.stringify(['push'])
    };

    // Insert notification
    const { error: insertError } = await supabase
      .from('notifications')
      .insert([userNotification]);

    if (insertError) {
      console.error('Error creating medication taken notification:', insertError);
      return;
    }

    console.log('Created medication taken notification');
  } catch (error) {
    console.error('Error in notifyMedicationTaken:', error);
  }
};

export const notifyMedicationChanged = async (
  userId: string,
  action: 'added' | 'updated' | 'deleted',
  medicationName: string,
  details?: string
) => {
  try {
    let actionText = '';
    switch (action) {
      case 'added':
        actionText = 'added a new medication';
        break;
      case 'updated':
        actionText = 'updated their medication';
        break;
      case 'deleted':
        actionText = 'removed a medication';
        break;
    }

    const message = `You ${actionText}: ${medicationName}${details ? `. ${details}` : '.'}`;

    // Create user notification only
    const notification = {
      user_id: userId,
      title: 'Medication Schedule Updated',
      message,
      type: 'medication_changed',
      scheduled_for: new Date().toISOString(),
      channels: JSON.stringify(['push'])
    };

    const { error: notifError } = await supabase
      .from('notifications')
      .insert([notification]);

    if (notifError) {
      console.error('Error creating medication change notification:', notifError);
    } else {
      console.log('Created medication change notification');
    }
  } catch (error) {
    console.error('Error in notifyMedicationChanged:', error);
  }
};

export const scheduleMedicationReminders = async (userId: string) => {
  try {
    const now = new Date();
    const nextTwoHours = addMinutes(now, 120);

    // Find medications due in the next 2 hours
    const { data: upcomingLogs, error } = await supabase
      .from('medication_logs')
      .select(`
        *,
        medications (name, dosage)
      `)
      .eq('user_id', userId)
      .eq('status', 'pending')
      .gte('scheduled_time', now.toISOString())
      .lte('scheduled_time', nextTwoHours.toISOString());

    if (error) {
      console.error('Error fetching upcoming medications:', error);
      return;
    }

    // Create reminder notifications for medications due soon
    for (const log of upcomingLogs || []) {
      const scheduledTime = new Date(log.scheduled_time);
      const reminderTime = addMinutes(scheduledTime, -15); // Remind 15 minutes before

      if (isAfter(reminderTime, now)) {
        // Fix: Convert JSON values to strings safely
        const medicationName = String(log.medications?.name || 'medication');
        const medicationDosage = String(log.medications?.dosage || '');
        
        const notification = {
          user_id: userId,
          title: 'Medication Reminder',
          message: `Don't forget to take your ${medicationName} (${medicationDosage}) in 15 minutes at ${scheduledTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
          type: 'medication_reminder',
          scheduled_for: reminderTime.toISOString(),
          channels: JSON.stringify(['push'])
        };

        await supabase.from('notifications').insert([notification]);
      }
    }
  } catch (error) {
    console.error('Error scheduling medication reminders:', error);
  }
};

export const sendPendingNotifications = async () => {
  try {
    const now = new Date();
    
    // Get pending notifications that are due
    const { data: pendingNotifications, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_for', now.toISOString())
      .order('scheduled_for', { ascending: true })
      .limit(50);

    if (error) {
      console.error('Error fetching pending notifications:', error);
      return;
    }

    if (!pendingNotifications || pendingNotifications.length === 0) {
      return;
    }

    console.log('Found pending notifications to send:', pendingNotifications.length);

    // Process push notifications (browser notifications)
    for (const notification of pendingNotifications) {
      try {
        // Update status to sent
        await supabase
          .from('notifications')
          .update({ 
            status: 'sent', 
            sent_at: new Date().toISOString() 
          })
          .eq('id', notification.id);

        console.log('Processed push notification:', notification.id);
      } catch (error) {
        console.error('Error processing push notification:', error);
      }
    }
  } catch (error) {
    console.error('Error in sendPendingNotifications:', error);
  }
};

export const cleanupOldNotifications = async (userId: string) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('user_id', userId)
      .lt('created_at', thirtyDaysAgo.toISOString());

    if (error) {
      console.error('Error cleaning up old notifications:', error);
    } else {
      console.log('Cleaned up old notifications for user:', userId);
    }
  } catch (error) {
    console.error('Error in cleanupOldNotifications:', error);
  }
};