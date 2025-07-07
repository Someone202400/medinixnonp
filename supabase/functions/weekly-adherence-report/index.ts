import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';
import { startOfWeek, endOfWeek, format, subWeeks } from 'https://esm.sh/date-fns@3.6.0';

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

    console.log('Starting weekly adherence report generation...');

    // Get previous week dates
    const now = new Date();
    const lastWeekStart = startOfWeek(subWeeks(now, 1));
    const lastWeekEnd = endOfWeek(subWeeks(now, 1));

    console.log(`Generating reports for week: ${format(lastWeekStart, 'yyyy-MM-dd')} to ${format(lastWeekEnd, 'yyyy-MM-dd')}`);

    // Get all users with medications
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, email, full_name, weekly_reports_enabled')
      .eq('weekly_reports_enabled', true);

    if (usersError) {
      throw usersError;
    }

    console.log(`Found ${users?.length || 0} users with weekly reports enabled`);

    const reportsGenerated = [];

    for (const user of users || []) {
      try {
        // Get medication logs for the week
        const { data: logs, error: logsError } = await supabase
          .from('medication_logs')
          .select(`
            *,
            medications (name, dosage)
          `)
          .eq('user_id', user.id)
          .gte('scheduled_time', lastWeekStart.toISOString())
          .lte('scheduled_time', lastWeekEnd.toISOString());

        if (logsError) {
          console.error(`Error fetching logs for user ${user.id}:`, logsError);
          continue;
        }

        const totalMedications = logs?.length || 0;
        const medicationsTaken = logs?.filter(log => log.status === 'taken').length || 0;
        const adherencePercentage = totalMedications > 0 ? (medicationsTaken / totalMedications) * 100 : 0;

        // Calculate medication breakdown
        const medicationBreakdown = logs?.reduce((acc: any, log: any) => {
          const medName = log.medications?.name || 'Unknown';
          if (!acc[medName]) {
            acc[medName] = { total: 0, taken: 0, missed: 0 };
          }
          acc[medName].total += 1;
          if (log.status === 'taken') {
            acc[medName].taken += 1;
          } else if (log.status === 'missed') {
            acc[medName].missed += 1;
          }
          return acc;
        }, {}) || {};

        const reportData = {
          user_id: user.id,
          week_start: format(lastWeekStart, 'yyyy-MM-dd'),
          week_end: format(lastWeekEnd, 'yyyy-MM-dd'),
          total_medications: totalMedications,
          medications_taken: medicationsTaken,
          adherence_percentage: Math.round(adherencePercentage * 100) / 100,
          report_data: {
            medications: medicationBreakdown,
            week_summary: {
              start_date: format(lastWeekStart, 'yyyy-MM-dd'),
              end_date: format(lastWeekEnd, 'yyyy-MM-dd'),
              adherence_score: Math.round(adherencePercentage)
            }
          }
        };

        // Save weekly report
        const { error: reportError } = await supabase
          .from('weekly_reports')
          .upsert(reportData);

        if (reportError) {
          console.error(`Error saving report for user ${user.id}:`, reportError);
          continue;
        }

        // Get user's caregivers
        const { data: caregivers, error: caregiversError } = await supabase
          .from('caregivers')
          .select('*')
          .eq('user_id', user.id)
          .eq('notifications_enabled', true);

        if (caregiversError) {
          console.error(`Error fetching caregivers for user ${user.id}:`, caregiversError);
        }

        // Create notifications for patient and caregivers
        const notifications = [];

        // Patient notification
        const patientMessage = `Weekly Adherence Report: ${Math.round(adherencePercentage)}% adherence this week (${medicationsTaken}/${totalMedications} medications taken)`;
        
        notifications.push({
          user_id: user.id,
          title: '📊 Weekly Medication Report',
          message: patientMessage,
          type: 'weekly_report',
          scheduled_for: new Date().toISOString(),
          channels: JSON.stringify(['push', 'email'])
        });

        // Caregiver notifications
        for (const caregiver of caregivers || []) {
          const caregiverMessage = `Weekly report for ${user.full_name || user.email}: ${Math.round(adherencePercentage)}% medication adherence (${medicationsTaken}/${totalMedications} doses taken)`;
          
          notifications.push({
            user_id: user.id,
            title: '👥 Weekly Caregiver Report',
            message: caregiverMessage,
            type: 'weekly_caregiver_report',
            scheduled_for: new Date().toISOString(),
            channels: JSON.stringify(['email']),
            caregiver_id: caregiver.id
          });
        }

        // Insert all notifications
        if (notifications.length > 0) {
          const { error: notificationError } = await supabase
            .from('notifications')
            .insert(notifications);

          if (notificationError) {
            console.error(`Error creating notifications for user ${user.id}:`, notificationError);
          }
        }

        reportsGenerated.push({
          userId: user.id,
          email: user.email,
          adherencePercentage: Math.round(adherencePercentage),
          totalMedications,
          medicationsTaken,
          caregiversNotified: caregivers?.length || 0
        });

        console.log(`Report generated for user ${user.email}: ${Math.round(adherencePercentage)}% adherence`);

      } catch (error) {
        console.error(`Error processing user ${user.id}:`, error);
      }
    }

    // Send email notifications
    if (reportsGenerated.length > 0) {
      try {
        await supabase.functions.invoke('send-notifications', {
          body: {
            type: 'weekly_reports'
          }
        });
      } catch (error) {
        console.error('Error sending weekly report emails:', error);
      }
    }

    console.log(`Weekly adherence report generation completed. Generated ${reportsGenerated.length} reports.`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        reportsGenerated: reportsGenerated.length,
        reports: reportsGenerated 
      }),
      { 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        } 
      }
    );

  } catch (error) {
    console.error('Error in weekly-adherence-report function:', error);
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

serve(handler);