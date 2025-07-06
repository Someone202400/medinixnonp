import { supabase } from '@/integrations/supabase/client';
import { addDays, format, startOfDay, endOfDay, parseISO } from 'date-fns';
import { scheduleMedicationReminders } from './notificationService';

export interface MedicationScheduleEntry {
  medication_id: string;
  medication_name: string;
  dosage: string;
  scheduled_time: string;
  user_id: string;
}

export const cleanupOldMedicationLogs = async (userId: string) => {
  try {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    // Archive old taken/missed logs instead of deleting
    const { error } = await supabase
      .from('medication_logs')
      .update({ status: 'archived' })
      .eq('user_id', userId)
      .lt('scheduled_time', threeDaysAgo.toISOString())
      .in('status', ['taken', 'missed']);

    if (error) {
      console.error('Error archiving old medication logs:', error);
    } else {
      console.log('Successfully archived old medication logs');
    }
  } catch (error) {
    console.error('Error in cleanup process:', error);
  }
};

export const generateDailyMedicationSchedule = async (userId: string, targetDate = new Date()) => {
  try {
    console.log('Generating daily medication schedule for:', userId, targetDate);
    
    // Clean up old logs first
    await cleanupOldMedicationLogs(userId);

    // Get all active medications for the user
    const { data: medications, error: medError } = await supabase
      .from('medications')
      .select('*')
      .eq('user_id', userId)
      .eq('active', true);

    if (medError) {
      console.error('Error fetching medications:', medError);
      throw medError;
    }

    if (!medications || medications.length === 0) {
      console.log('No active medications found for user');
      return [];
    }

    console.log('Found medications:', medications.length);

    const scheduleEntries: MedicationScheduleEntry[] = [];
    const dayStart = startOfDay(targetDate);
    const dayEnd = endOfDay(targetDate);

    // Check if we already have logs for this day (excluding archived)
    const { data: existingLogs, error: logError } = await supabase
      .from('medication_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('scheduled_time', dayStart.toISOString())
      .lte('scheduled_time', dayEnd.toISOString())
      .neq('status', 'archived');

    if (logError) {
      console.error('Error fetching existing logs:', logError);
      throw logError;
    }

    console.log('Existing logs for the day:', existingLogs?.length || 0);

    medications.forEach((med) => {
      const times = med.times as string[];
      if (!times || !Array.isArray(times)) {
        console.warn(`Invalid times for medication ${med.name}:`, med.times);
        return;
      }

      console.log(`Processing medication ${med.name} with times:`, times);

      times.forEach((time) => {
        if (!time || typeof time !== 'string') {
          console.warn(`Invalid time format for medication ${med.name}:`, time);
          return;
        }

        const timeParts = time.split(':');
        if (timeParts.length !== 2) {
          console.warn(`Invalid time format for medication ${med.name}:`, time);
          return;
        }

        const [hours, minutes] = timeParts.map(Number);
        if (isNaN(hours) || isNaN(minutes)) {
          console.warn(`Invalid time values for medication ${med.name}:`, time);
          return;
        }

        const scheduledDateTime = new Date(targetDate);
        scheduledDateTime.setHours(hours, minutes, 0, 0);

        // Check if we already have a log for this medication at this time
        const existingLog = existingLogs?.find(log => 
          log.medication_id === med.id && 
          Math.abs(new Date(log.scheduled_time).getTime() - scheduledDateTime.getTime()) < 60000 // Within 1 minute
        );

        if (!existingLog) {
          console.log(`Creating schedule entry for ${med.name} at ${scheduledDateTime}`);
          scheduleEntries.push({
            medication_id: med.id,
            medication_name: med.name,
            dosage: med.dosage,
            scheduled_time: scheduledDateTime.toISOString(),
            user_id: userId
          });
        }
      });
    });

    // Insert new medication logs
    if (scheduleEntries.length > 0) {
      console.log(`Inserting ${scheduleEntries.length} new medication logs`);
      
      const { error: insertError } = await supabase
        .from('medication_logs')
        .insert(scheduleEntries.map(entry => ({
          medication_id: entry.medication_id,
          user_id: entry.user_id,
          scheduled_time: entry.scheduled_time,
          status: 'pending'
        })));

      if (insertError) {
        console.error('Error inserting medication logs:', insertError);
        throw insertError;
      }

      console.log(`Successfully generated ${scheduleEntries.length} medication schedule entries`);
      
      // Schedule notifications for upcoming medications - fix the function call
      await scheduleMedicationReminders(userId);
    } else {
      console.log('No new medication schedule entries needed');
    }

    return scheduleEntries;
  } catch (error) {
    console.error('Error generating daily medication schedule:', error);
    throw error;
  }
};

export const generateWeeklySchedule = async (userId: string) => {
  console.log('Generating weekly schedule for user:', userId);
  
  const promises = [];
  for (let i = 0; i < 7; i++) {
    const date = addDays(new Date(), i);
    promises.push(generateDailyMedicationSchedule(userId, date));
  }
  
  try {
    await Promise.all(promises);
    console.log('Weekly schedule generated successfully');
  } catch (error) {
    console.error('Error generating weekly schedule:', error);
    throw error;
  }
};

export const checkForMissedMedications = async (userId: string) => {
  try {
    const now = new Date();
    const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);

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
      title: '⚠️ Missed Medication',
      message: `You missed your ${medicationLog.medications?.name} (${medicationLog.medications?.dosage}) scheduled for ${new Date(medicationLog.scheduled_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
      type: 'missed_medication',
      scheduled_for: new Date().toISOString(),
      channels: JSON.stringify(['push', 'email'])
    };

    await supabase.from('notifications').insert([notification]);
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
      title: '🚨 Missed Medication Alert',
      message: `${patientName} missed their ${medicationName} (${medicationLog.medications?.dosage}) scheduled for ${scheduledTime}.`,
      type: 'missed_medication_caregiver',
      scheduled_for: new Date().toISOString(),
      channels: JSON.stringify(['push', 'email']),
      caregiver_id: caregiver.id
    }));

    await supabase.from('notifications').insert(notifications);

    // Send notifications via edge function
    await supabase.functions.invoke('send-notifications', {
      body: { notifications, caregivers }
    });
  } catch (error) {
    console.error('Error notifying caregivers about missed medication:', error);
  }
};
