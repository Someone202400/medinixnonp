import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';
import { addMinutes, isAfter, isBefore } from 'https://esm.sh/date-fns@3.6.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Starting notification processing...');

    const now = new Date();
    const schedulingWindow = addMinutes(now, 5); // Process notifications due in next 5 minutes

    // Get pending notifications that are due
    const { data: pendingNotifications, error: notificationError } = await supabase
      .from('notifications')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_for', schedulingWindow.toISOString())
      .gte('scheduled_for', now.toISOString());

    if (notificationError) {
      throw notificationError;
    }

    console.log(`Found ${pendingNotifications?.length || 0} notifications to process`);

    const processedNotifications = [];
    const emailNotifications = [];
    const pushNotifications = [];

    for (const notification of pendingNotifications || []) {
      try {
        const channels = Array.isArray(notification.channels) 
          ? notification.channels 
          : typeof notification.channels === 'string'
            ? JSON.parse(notification.channels)
            : ['push'];

        console.log(`Processing notification ${notification.id} with channels:`, channels);

        // Prepare for push notifications
        if (channels.includes('push')) {
          pushNotifications.push(notification);
        }

        // Prepare for email notifications
        if (channels.includes('email')) {
          emailNotifications.push(notification);
        }

        processedNotifications.push(notification.id);

      } catch (error) {
        console.error(`Error processing notification ${notification.id}:`, error);
      }
    }

    // Send push notifications
    if (pushNotifications.length > 0) {
      try {
        const { error: pushError } = await supabase.functions.invoke('send-push-notifications', {
          body: { notifications: pushNotifications }
        });

        if (pushError) {
          console.error('Error sending push notifications:', pushError);
        } else {
          console.log(`Sent ${pushNotifications.length} push notifications`);
        }
      } catch (error) {
        console.error('Error invoking push notification function:', error);
      }
    }

    // Send email notifications
    if (emailNotifications.length > 0) {
      try {
        const { error: emailError } = await supabase.functions.invoke('send-notifications', {
          body: { notifications: emailNotifications }
        });

        if (emailError) {
          console.error('Error sending email notifications:', emailError);
        } else {
          console.log(`Sent ${emailNotifications.length} email notifications`);
        }
      } catch (error) {
        console.error('Error invoking email notification function:', error);
      }
    }

    // Update notification statuses
    if (processedNotifications.length > 0) {
      const { error: updateError } = await supabase
        .from('notifications')
        .update({ 
          status: 'sent',
          sent_at: new Date().toISOString()
        })
        .in('id', processedNotifications);

      if (updateError) {
        console.error('Error updating notification status:', updateError);
      }
    }

    // Schedule medication reminders for the next day
    await scheduleMedicationReminders(supabase);

    console.log(`Notification processing completed. Processed ${processedNotifications.length} notifications.`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: processedNotifications.length,
        pushSent: pushNotifications.length,
        emailSent: emailNotifications.length
      }),
      { 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        } 
      }
    );

  } catch (error) {
    console.error('Error in schedule-notifications function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        } 
      }
    );
  }
};

async function scheduleMedicationReminders(supabase: any) {
  console.log('Scheduling medication reminders...');
  
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const dayAfterTomorrow = new Date(tomorrow);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

    // Get active medications
    const { data: medications, error: medError } = await supabase
      .from('medications')
      .select('*')
      .eq('active', true)
      .lte('start_date', tomorrow.toISOString().split('T')[0])
      .or(`end_date.is.null,end_date.gte.${tomorrow.toISOString().split('T')[0]}`);

    if (medError) {
      console.error('Error fetching medications:', medError);
      return;
    }

    const remindersToCreate = [];

    for (const medication of medications || []) {
      try {
        const times = Array.isArray(medication.times) ? medication.times : [];
        
        for (const timeStr of times) {
          const scheduledTime = new Date(tomorrow);
          const [hours, minutes] = timeStr.split(':');
          scheduledTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

          // Check if reminder already exists
          const { data: existingReminder } = await supabase
            .from('notifications')
            .select('id')
            .eq('user_id', medication.user_id)
            .eq('type', 'medication_reminder')
            .eq('scheduled_for', scheduledTime.toISOString())
            .single();

          if (!existingReminder) {
            remindersToCreate.push({
              user_id: medication.user_id,
              title: '💊 Medication Reminder',
              message: `Time to take ${medication.name} (${medication.dosage})`,
              type: 'medication_reminder',
              scheduled_for: scheduledTime.toISOString(),
              channels: JSON.stringify(['push', 'email'])
            });
          }
        }
      } catch (error) {
        console.error(`Error processing medication ${medication.id}:`, error);
      }
    }

    // Insert new reminders
    if (remindersToCreate.length > 0) {
      const { error: insertError } = await supabase
        .from('notifications')
        .insert(remindersToCreate);

      if (insertError) {
        console.error('Error creating medication reminders:', insertError);
      } else {
        console.log(`Created ${remindersToCreate.length} medication reminders for tomorrow`);
      }
    }

  } catch (error) {
    console.error('Error scheduling medication reminders:', error);
  }
}

serve(handler);