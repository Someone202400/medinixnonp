import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MedicationReminderRequest {
  userId: string;
  type: 'immediate' | 'missed' | 'upcoming';
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { userId, type }: MedicationReminderRequest = await req.json();

    console.log('Processing medication reminder:', { userId, type });

    const now = new Date();
    let notifications = [];

    if (type === 'immediate') {
      // Find medications due RIGHT NOW (within 2 minutes)
      const twoMinutesAgo = new Date(now.getTime() - 2 * 60 * 1000);
      const twoMinutesFromNow = new Date(now.getTime() + 2 * 60 * 1000);

      const { data: dueMeds, error: dueError } = await supabaseClient
        .from('medication_logs')
        .select(`
          id,
          scheduled_time,
          medications (name, dosage)
        `)
        .eq('user_id', userId)
        .eq('status', 'pending')
        .gte('scheduled_time', twoMinutesAgo.toISOString())
        .lte('scheduled_time', twoMinutesFromNow.toISOString());

      if (dueError) {
        throw new Error(`Error fetching due medications: ${dueError.message}`);
      }

      for (const med of dueMeds || []) {
        const medicationName = med.medications?.name || 'Medication';
        const dosage = med.medications?.dosage || '';
        
        notifications.push({
          user_id: userId,
          title: `⏰ Time to take ${medicationName}`,
          message: `Take ${dosage} now. Scheduled for ${new Date(med.scheduled_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
          type: 'medication_reminder',
          scheduled_for: now.toISOString(),
          channels: JSON.stringify(['push'])
        });
      }
    }

    if (type === 'missed') {
      // Find medications missed in the last 30 minutes
      const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);

      const { data: missedMeds, error: missedError } = await supabaseClient
        .from('medication_logs')
        .select(`
          id,
          scheduled_time,
          medications (name, dosage)
        `)
        .eq('user_id', userId)
        .eq('status', 'pending')
        .lt('scheduled_time', thirtyMinutesAgo.toISOString());

      if (missedError) {
        throw new Error(`Error fetching missed medications: ${missedError.message}`);
      }

      for (const med of missedMeds || []) {
        // Update to missed status
        await supabaseClient
          .from('medication_logs')
          .update({ status: 'missed' })
          .eq('id', med.id);

        const medicationName = med.medications?.name || 'Medication';
        const dosage = med.medications?.dosage || '';
        
        notifications.push({
          user_id: userId,
          title: `❌ Missed: ${medicationName}`,
          message: `You haven't taken your ${dosage} yet. It was scheduled for ${new Date(med.scheduled_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
          type: 'missed_medication',
          scheduled_for: now.toISOString(),
          channels: JSON.stringify(['push'])
        });
      }
    }

    if (type === 'upcoming') {
      // Find medications due in the next 15 minutes
      const fifteenMinutesFromNow = new Date(now.getTime() + 15 * 60 * 1000);
      const sixteenMinutesFromNow = new Date(now.getTime() + 16 * 60 * 1000);

      const { data: upcomingMeds, error: upcomingError } = await supabaseClient
        .from('medication_logs')
        .select(`
          id,
          scheduled_time,
          medications (name, dosage)
        `)
        .eq('user_id', userId)
        .eq('status', 'pending')
        .gte('scheduled_time', fifteenMinutesFromNow.toISOString())
        .lt('scheduled_time', sixteenMinutesFromNow.toISOString());

      if (upcomingError) {
        throw new Error(`Error fetching upcoming medications: ${upcomingError.message}`);
      }

      for (const med of upcomingMeds || []) {
        const medicationName = med.medications?.name || 'Medication';
        const dosage = med.medications?.dosage || '';
        
        notifications.push({
          user_id: userId,
          title: `🔔 Upcoming: ${medicationName}`,
          message: `Don't forget to take ${dosage} in 15 minutes at ${new Date(med.scheduled_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
          type: 'medication_reminder',
          scheduled_for: now.toISOString(),
          channels: JSON.stringify(['push'])
        });
      }
    }

    // Insert all notifications
    if (notifications.length > 0) {
      const { error: insertError } = await supabaseClient
        .from('notifications')
        .insert(notifications);

      if (insertError) {
        throw new Error(`Error inserting notifications: ${insertError.message}`);
      }

      console.log(`Created ${notifications.length} notifications for user ${userId}`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        notificationsCreated: notifications.length,
        type 
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );

  } catch (error: any) {
    console.error('Error in medication-reminder-notifications function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

serve(handler);