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

      // Notify caregivers about missed medication
      await notifyCaregiversAboutMissedMedication(log.user_id, log);
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
    // Safely convert medication data to strings
    const medicationName = String(medicationLog.medications?.name || 'medication');
    const medicationDosage = String(medicationLog.medications?.dosage || '');
    const scheduledTime = new Date(medicationLog.scheduled_time).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    // Create caregiver notifications
    const notifications = caregivers.map(caregiver => ({
      user_id: userId,
      title: 'Missed Medication Alert',
      message: `${patientName} missed their ${medicationName} (${medicationDosage}) scheduled for ${scheduledTime}.`,
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

export const notifyMedicationTaken = async (
  userId: string,
  medicationName: string,
  dosage: string,
  takenAt: Date
) => {
  try {
    // Get caregivers with notifications enabled
    const { data: caregivers, error: caregiversError } = await supabase
      .from('caregivers')
      .select('*')
      .eq('user_id', userId)
      .eq('notifications_enabled', true);

    if (caregiversError) {
      console.error('Error fetching caregivers:', caregiversError);
      return;
    }

    if (!caregivers || caregivers.length === 0) {
      console.log('No caregivers found for medication taken notification');
      return;
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    const patientName = profile?.full_name || profile?.email || 'Patient';
    const timeString = takenAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Create user notification
    const userNotification = {
      user_id: userId,
      title: 'Medication Taken ✅',
      message: `Great job! You took your ${medicationName} (${dosage}) at ${timeString}. Keep up the good work!`,
      type: 'medication_taken',
      scheduled_for: new Date().toISOString(),
      channels: JSON.stringify(['push'])
    };

    // Create caregiver notifications
    const caregiverNotifications = caregivers.map(caregiver => ({
      user_id: userId,
      title: 'Medication Taken',
      message: `${patientName} successfully took their ${medicationName} (${dosage}) at ${timeString}.`,
      type: 'medication_taken',
      scheduled_for: new Date().toISOString(),
      channels: JSON.stringify(['email']),
      caregiver_id: caregiver.id
    }));

    // Insert all notifications
    const allNotifications = [userNotification, ...caregiverNotifications];
    const { error: insertError } = await supabase
      .from('notifications')
      .insert(allNotifications);

    if (insertError) {
      console.error('Error creating medication taken notifications:', insertError);
      return;
    }

    console.log('Created medication taken notifications:', allNotifications.length);

    // Send email notifications to caregivers
    if (caregiverNotifications.length > 0) {
      try {
        await supabase.functions.invoke('send-notifications', {
          body: {
            notifications: caregiverNotifications,
            caregivers
          }
        });
      } catch (edgeError) {
        console.error('Error sending caregiver email notifications:', edgeError);
      }
    }
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

    const message = `${patientName} ${actionText}: ${medicationName}${details ? `. ${details}` : '.'}`;

    // Create caregiver notifications
    const notifications = caregivers.map(caregiver => ({
      user_id: userId,
      title: 'Medication Schedule Updated',
      message,
      type: 'medication_changed',
      scheduled_for: new Date().toISOString(),
      channels: JSON.stringify(['email']),
      caregiver_id: caregiver.id
    }));

    const { error: notifError } = await supabase
      .from('notifications')
      .insert(notifications);

    if (notifError) {
      console.error('Error creating medication change notifications:', notifError);
    } else {
      console.log('Created medication change notifications:', notifications.length);
      
      // Send email notifications
      try {
        await supabase.functions.invoke('send-notifications', {
          body: {
            notifications,
            caregivers
          }
        });
      } catch (edgeError) {
        console.error('Error sending medication change notifications:', edgeError);
      }
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

    // Group notifications by type for processing
    const pushNotifications = pendingNotifications.filter(n => 
      n.channels && JSON.parse(String(n.channels)).includes('push')
    );
    
    const emailNotifications = pendingNotifications.filter(n => 
      n.channels && JSON.parse(String(n.channels)).includes('email') && n.caregiver_id
    );

    // Send push notifications (browser notifications)
    for (const notification of pushNotifications) {
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

    // Send email notifications
    if (emailNotifications.length > 0) {
      try {
        // Get unique caregiver IDs
        const caregiverIds = [...new Set(emailNotifications.map(n => n.caregiver_id).filter(Boolean))];
        
        // Get caregiver details
        const { data: caregivers } = await supabase
          .from('caregivers')
          .select('*')
          .in('id', caregiverIds);

        if (caregivers && caregivers.length > 0) {
          await supabase.functions.invoke('send-notifications', {
            body: {
              notifications: emailNotifications,
              caregivers
            }
          });

          // Update email notification statuses
          const emailIds = emailNotifications.map(n => n.id);
          await supabase
            .from('notifications')
            .update({ 
              status: 'sent', 
              sent_at: new Date().toISOString() 
            })
            .in('id', emailIds);

          console.log('Processed email notifications:', emailNotifications.length);
        }
      } catch (error) {
        console.error('Error processing email notifications:', error);
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

export const sendCaregiverWelcomeNotification = async (caregiver: any, patientName: string) => {
  try {
    const notification = {
      user_id: caregiver.user_id,
      title: 'Welcome as a Caregiver',
      message: `You have been added as a caregiver for ${patientName}. You will now receive medication and health updates.`,
      type: 'caregiver_welcome',
      scheduled_for: new Date().toISOString(),
      channels: JSON.stringify(['email']),
      caregiver_id: caregiver.id
    };

    const { error } = await supabase
      .from('notifications')
      .insert([notification]);

    if (error) {
      console.error('Error creating caregiver welcome notification:', error);
      return;
    }

    // Send immediate email
    try {
      await supabase.functions.invoke('send-notifications', {
        body: {
          notifications: [notification],
          caregivers: [caregiver]
        }
      });
    } catch (edgeError) {
      console.error('Error sending caregiver welcome email:', edgeError);
    }
  } catch (error) {
    console.error('Error in sendCaregiverWelcomeNotification:', error);
  }
};
