
import { supabase } from '@/integrations/supabase/client';
import { addDays, format, startOfDay, endOfDay, parseISO } from 'date-fns';

export interface MedicationScheduleEntry {
  medication_id: string;
  medication_name: string;
  dosage: string;
  scheduled_time: string;
  user_id: string;
}

export const cleanupOldMedicationLogs = async (userId: string) => {
  try {
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    // Update old taken/missed logs to archived status instead of deleting
    const { error } = await supabase
      .from('medication_logs')
      .update({ status: 'archived' })
      .eq('user_id', userId)
      .lt('scheduled_time', twoDaysAgo.toISOString())
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
    // Clean up old logs first
    await cleanupOldMedicationLogs(userId);

    // Get all active medications for the user
    const { data: medications, error: medError } = await supabase
      .from('medications')
      .select('*')
      .eq('user_id', userId)
      .eq('active', true);

    if (medError) throw medError;

    if (!medications || medications.length === 0) {
      console.log('No active medications found for user');
      return [];
    }

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

    if (logError) throw logError;

    medications.forEach((med) => {
      const times = med.times as string[];
      if (!times || !Array.isArray(times)) {
        console.warn(`Invalid times for medication ${med.name}:`, med.times);
        return;
      }

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
          new Date(log.scheduled_time).getTime() === scheduledDateTime.getTime()
        );

        if (!existingLog) {
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

      console.log(`Generated ${scheduleEntries.length} medication schedule entries`);
    }

    return scheduleEntries;
  } catch (error) {
    console.error('Error generating daily medication schedule:', error);
    throw error;
  }
};

export const generateWeeklySchedule = async (userId: string) => {
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
