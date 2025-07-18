
import { supabase } from '@/integrations/supabase/client';
import { addMinutes, isAfter } from 'date-fns';

export const checkForMissedMedications = async (userId: string) => {
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
      .eq('user_id', userId)
      .eq('status', 'pending')
      .lt('scheduled_time', thirtyMinutesAgo.toISOString());

    if (overdueError) {
      console.error('Error checking for missed medications:', overdueError);
      return;
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
      await createMissedMedicationNotification(userId, log);

      // Notify caregivers about missed medication
      await notifyCaregiversAboutMissedMedication(userId, log);
    }

    return overdueLogs.length;
  } catch (error) {
    console.error('Error in checkForMissedMedications:', error);
    return 0;
  }
};

const createMissedMedicationNotification = async (userId: string, medicationLog: any) => {
  try {
    const notification = {
      user_id: userId,
      title: 'Missed Medication',
      message: `You missed your ${medicationLog.medications?.name} (${medicationLog.medications?.dosage}) scheduled for ${new Date(medicationLog.scheduled_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
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

const notifyCaregiversAboutMissedMedication = async (userId: string, medicationLog: any) => {
  try {
    // Get caregivers with notifications enabled
    const { data: caregivers, error: caregiversError } = await supabase
      .from('caregivers')
      .select('*')
      .eq('user_id', userId)
      .eq('notifications_enabled', true);

    if (caregiversError || !caregivers || caregivers.length === 0) {
      return;
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    const patientName = profile?.full_name || profile?.email || 'Patient';
    const medicationName = medicationLog.medications?.name || 'medication';
    const scheduledTime = new Date(medicationLog.scheduled_time).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    // Create caregiver notifications
    const notifications = caregivers.map(caregiver => ({
      user_id: userId,
      title: 'Missed Medication Alert',
      message: `${patientName} missed their ${medicationName} (${medicationLog.medications?.dosage}) scheduled for ${scheduledTime}.`,
      type: 'missed_medication_caregiver',
      scheduled_for: new Date().toISOString(),
      channels: JSON.stringify(['push', 'email', 'sms']),
      caregiver_id: caregiver.id
    }));

    const { error: notifError } = await supabase
      .from('notifications')
      .insert(notifications);

    if (notifError) {
      console.error('Error creating caregiver missed medication notifications:', notifError);
    } else {
      // Send notifications
      await supabase.functions.invoke('send-notifications', {
        body: {
          notifications,
          caregivers
        }
      });
    }
  } catch (error) {
    console.error('Error notifying caregivers about missed medication:', error);
  }
};

export const scheduleUpcomingMedicationReminders = async (userId: string) => {
  try {
    const now = new Date();
    const nextHour = addMinutes(now, 60);

    // Find medications due in the next hour
    const { data: upcomingLogs, error } = await supabase
      .from('medication_logs')
      .select(`
        *,
        medications (name, dosage)
      `)
      .eq('user_id', userId)
      .eq('status', 'pending')
      .gte('scheduled_time', now.toISOString())
      .lte('scheduled_time', nextHour.toISOString());

    if (error) {
      console.error('Error fetching upcoming medications:', error);
      return;
    }

    // Create reminder notifications for medications due soon
    for (const log of upcomingLogs || []) {
      const scheduledTime = new Date(log.scheduled_time);
      const reminderTime = addMinutes(scheduledTime, -15); // Remind 15 minutes before

      if (isAfter(reminderTime, now)) {
        const notification = {
          user_id: userId,
          title: 'Medication Reminder',
          message: `Don't forget to take your ${log.medications?.name} (${log.medications?.dosage}) in 15 minutes at ${scheduledTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
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
