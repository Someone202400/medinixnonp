import { supabase } from '@/integrations/supabase/client';

export const triggerMedicationReminders = async (userId: string, type: 'immediate' | 'missed' | 'upcoming' = 'immediate') => {
  try {
    console.log(`Triggering ${type} medication reminders for user:`, userId);
    
    const { data, error } = await supabase.functions.invoke('medication-reminder-notifications', {
      body: { userId, type }
    });

    if (error) {
      console.error('Error triggering medication reminders:', error);
      return false;
    }

    console.log('Medication reminders triggered successfully:', data);
    return true;
  } catch (error) {
    console.error('Error in triggerMedicationReminders:', error);
    return false;
  }
};

export const startMedicationReminderService = (userId: string) => {
  // Check for immediate reminders every minute
  const immediateInterval = setInterval(async () => {
    await triggerMedicationReminders(userId, 'immediate');
  }, 60 * 1000); // 1 minute

  // Check for missed medications every 5 minutes
  const missedInterval = setInterval(async () => {
    await triggerMedicationReminders(userId, 'missed');
  }, 5 * 60 * 1000); // 5 minutes

  // Check for upcoming medications every 10 minutes
  const upcomingInterval = setInterval(async () => {
    await triggerMedicationReminders(userId, 'upcoming');
  }, 10 * 60 * 1000); // 10 minutes

  return () => {
    clearInterval(immediateInterval);
    clearInterval(missedInterval);
    clearInterval(upcomingInterval);
  };
};