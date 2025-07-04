
import { supabase } from '@/integrations/supabase/client';
import { addDays, format, startOfDay, endOfDay, parseISO } from 'date-fns';

export interface MedicationScheduleEntry {
  medication_id: string;
  medication_name: string;
  dosage: string;
  scheduled_time: string;
  user_id: string;
}

export const generateDailyMedicationSchedule = async (userId: string, targetDate = new Date()) => {
  try {
    // Get all active medications for the user
    const { data: medications, error: medError } = await supabase
      .from('medications')
      .select('*')
      .eq('user_id', userId)
      .eq('active', true);

    if (medError) throw medError;

    const scheduleEntries: MedicationScheduleEntry[] = [];
    const dayStart = startOfDay(targetDate);
    const dayEnd = endOfDay(targetDate);

    // Check if we already have logs for this day
    const { data: existingLogs, error: logError } = await supabase
      .from('medication_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('scheduled_time', dayStart.toISOString())
      .lte('scheduled_time', dayEnd.toISOString());

    if (logError) throw logError;

    medications?.forEach((med) => {
      const times = med.times as string[];
      times.forEach((time) => {
        const [hours, minutes] = time.split(':').map(Number);
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

      if (insertError) throw insertError;
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
  } catch (error) {
    console.error('Error generating weekly schedule:', error);
    throw error;
  }
};
