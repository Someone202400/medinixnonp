
import { supabase } from '@/integrations/supabase/client';
import { addMinutes, isAfter } from 'date-fns';

export const startMissedMedicationMonitor = () => {
  // Check every 5 minutes for missed medications
  const interval = setInterval(async () => {
    try {
      await checkAndProcessMissedMedications();
    } catch (error) {
      console.error('Error in missed medication monitor:', error);
    }
  }, 5 * 60 * 1000); // 5 minutes

  return () => clearInterval(interval);
};

const checkAndProcessMissedMedications = async () => {
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
      return;
    }

    const overdueLogs = overdueLogsData || [];
    console.log('Found overdue medications:', overdueLogs.length);

    // Process each missed medication
    for (const log of overdueLogs) {
      await processMissedMedication(log);
    }
  } catch (error) {
    console.error('Error in checkAndProcessMissedMedications:', error);
  }
};

const processMissedMedication = async (medicationLog: any) => {
  try {
    // Update status to missed
    const { error: updateError } = await supabase
      .from('medication_logs')
      .update({ status: 'missed' })
      .eq('id', medicationLog.id);

    if (updateError) {
      console.error('Error updating missed medication:', updateError);
      return;
    }

    console.log('Marked medication as missed:', medicationLog.id);

    // Create user notification for missed medication
    await createMissedMedicationNotification(medicationLog.user_id, medicationLog);

    // Notify caregivers about missed medication
    await notifyCaregiversAboutMissedMedication(medicationLog.user_id, medicationLog);
  } catch (error) {
    console.error('Error processing missed medication:', error);
  }
};

const createMissedMedicationNotification = async (userId: string, medicationLog: any) => {
  try {
    const notification = {
      user_id: userId,
      title: 'Missed Medication Alert',
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
    } else {
      console.log('Created missed medication notification for user:', userId);
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
      channels: JSON.stringify(['email']),
      caregiver_id: caregiver.id
    }));

    const { error: notifError } = await supabase
      .from('notifications')
      .insert(notifications);

    if (notifError) {
      console.error('Error creating caregiver missed medication notifications:', notifError);
    } else {
      console.log('Created caregiver missed medication notifications:', notifications.length);
      
      // Send email notifications
      try {
        await supabase.functions.invoke('send-notifications', {
          body: {
            notifications,
            caregivers
          }
        });
      } catch (edgeError) {
        console.error('Error calling send-notifications edge function:', edgeError);
      }
    }
  } catch (error) {
    console.error('Error notifying caregivers about missed medication:', error);
  }
};
