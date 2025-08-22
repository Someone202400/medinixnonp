import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const resendApiKey = Deno.env.get('RESEND_API_KEY');

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error('Missing Supabase configuration');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
    const resend = resendApiKey ? new Resend(resendApiKey) : null;

    // Get current time
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
    const today = now.toISOString().split('T')[0]; // YYYY-MM-DD format

    console.log('Checking for medication reminders at:', currentTime);

    // Get all active medications that should trigger notifications now
    const { data: medications, error: medsError } = await supabase
      .from('medications')
      .select(`
        *,
        profiles!inner(id, email, full_name, push_notifications_enabled, weekly_reports_enabled),
        caregivers(id, email, name, notifications_enabled)
      `)
      .eq('active', true)
      .lte('start_date', today)
      .or(`end_date.is.null,end_date.gte.${today}`);

    if (medsError) {
      console.error('Error fetching medications:', medsError);
      throw medsError;
    }

    console.log(`Found ${medications?.length || 0} active medications`);

    const notifications = [];
    const emailsToSend = [];

    for (const medication of medications || []) {
      const times = medication.times as string[];
      
      // Check if current time matches any scheduled times
      for (const scheduledTime of times) {
        if (scheduledTime === currentTime) {
          console.log(`Creating notification for ${medication.name} at ${scheduledTime}`);
          
          // Create notification record
          const notification = {
            user_id: medication.user_id,
            type: 'medication_reminder',
            title: '💊 Medication Reminder',
            message: `Time to take ${medication.name} (${medication.dosage})`,
            scheduled_for: now.toISOString(),
            channels: JSON.stringify(['push', 'email'])
          };

          notifications.push(notification);

          // Prepare email for user if they have email notifications enabled
          if (medication.profiles?.email && resend) {
            const emailHtml = `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2563eb;">💊 Medication Reminder</h2>
                <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h3 style="margin: 0 0 10px 0;">Time to take your medication!</h3>
                  <p style="margin: 5px 0;"><strong>Medication:</strong> ${medication.name}</p>
                  <p style="margin: 5px 0;"><strong>Dosage:</strong> ${medication.dosage}</p>
                  <p style="margin: 5px 0;"><strong>Time:</strong> ${scheduledTime}</p>
                  ${medication.notes ? `<p style="margin: 5px 0;"><strong>Notes:</strong> ${medication.notes}</p>` : ''}
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${supabaseUrl.replace('.supabase.co', '')}.lovable.app/dashboard" 
                     style="background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                    Mark as Taken
                  </a>
                </div>
                
                <div style="background: #fef3c7; padding: 15px; border-radius: 6px; margin: 20px 0;">
                  <p style="margin: 0; font-size: 14px; color: #92400e;">
                    <strong>Important:</strong> Take your medication as prescribed. If you have any concerns, consult your healthcare provider.
                  </p>
                </div>
                
                <p style="font-size: 12px; color: #6b7280; text-align: center; margin-top: 30px;">
                  This is an automated reminder from MedCare. To adjust your notification preferences, visit your settings.
                </p>
              </div>
            `;

            emailsToSend.push({
              from: 'MedCare <noreply@medcare.app>',
              to: [medication.profiles.email],
              subject: `💊 Time to take ${medication.name}`,
              html: emailHtml,
            });
          }

          // Prepare emails for caregivers
          for (const caregiver of medication.caregivers || []) {
            if (caregiver.notifications_enabled && caregiver.email && resend) {
              const caregiverEmailHtml = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2 style="color: #2563eb;">📋 Patient Medication Alert</h2>
                  <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="margin: 0 0 10px 0;">Medication reminder sent to patient</h3>
                    <p style="margin: 5px 0;"><strong>Patient:</strong> ${medication.profiles?.full_name || 'Patient'}</p>
                    <p style="margin: 5px 0;"><strong>Medication:</strong> ${medication.name}</p>
                    <p style="margin: 5px 0;"><strong>Dosage:</strong> ${medication.dosage}</p>
                    <p style="margin: 5px 0;"><strong>Scheduled Time:</strong> ${scheduledTime}</p>
                  </div>
                  
                  <div style="background: #ecfdf5; padding: 15px; border-radius: 6px; margin: 20px 0;">
                    <p style="margin: 0; font-size: 14px; color: #065f46;">
                      The patient has been notified to take their medication. You'll receive another notification if they don't mark it as taken within 30 minutes.
                    </p>
                  </div>
                  
                  <p style="font-size: 12px; color: #6b7280; text-align: center; margin-top: 30px;">
                    You're receiving this as a designated caregiver. To modify your notification preferences, please contact the patient.
                  </p>
                </div>
              `;

              emailsToSend.push({
                from: 'MedCare Caregiver Alerts <caregivers@medcare.app>',
                to: [caregiver.email],
                subject: `📋 Medication reminder sent to ${medication.profiles?.full_name || 'patient'}`,
                html: caregiverEmailHtml,
              });
            }
          }
        }
      }
    }

    // Insert notifications into database
    if (notifications.length > 0) {
      const { error: notifError } = await supabase
        .from('notifications')
        .insert(notifications);

      if (notifError) {
        console.error('Error creating notifications:', notifError);
      } else {
        console.log(`Created ${notifications.length} notifications`);
      }
    }

    // Send emails
    if (emailsToSend.length > 0 && resend) {
      console.log(`Sending ${emailsToSend.length} emails`);
      
      for (const email of emailsToSend) {
        try {
          const { error: emailError } = await resend.emails.send(email);
          if (emailError) {
            console.error('Error sending email:', emailError);
          } else {
            console.log(`Email sent to ${email.to[0]}`);
          }
        } catch (emailError) {
          console.error('Error sending email:', emailError);
        }
      }
    }

    // Check for missed medications (30 minutes after scheduled time)
    const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);
    const missedTime = thirtyMinutesAgo.toTimeString().slice(0, 5);

    console.log('Checking for missed medications at:', missedTime);

    // Get medications that should have been taken 30 minutes ago but weren't
    const { data: missedMeds, error: missedError } = await supabase
      .from('medications')
      .select(`
        *,
        profiles!inner(id, email, full_name),
        caregivers(id, email, name, notifications_enabled),
        medication_logs!left(id, taken_at, status)
      `)
      .eq('active', true)
      .lte('start_date', today)
      .or(`end_date.is.null,end_date.gte.${today}`);

    if (!missedError && missedMeds) {
      const missedNotifications = [];
      const missedEmails = [];

      for (const medication of missedMeds) {
        const times = medication.times as string[];
        
        if (times.includes(missedTime)) {
          // Check if medication was taken today at this time
          const todayLogs = medication.medication_logs?.filter((log: any) => {
            const logDate = new Date(log.taken_at || log.scheduled_time);
            const logTime = logDate.toTimeString().slice(0, 5);
            const logDay = logDate.toISOString().split('T')[0];
            return logDay === today && logTime === missedTime && log.status === 'taken';
          }) || [];

          if (todayLogs.length === 0) {
            console.log(`Missed medication detected: ${medication.name} at ${missedTime}`);
            
            // Send alerts to caregivers about missed medication
            for (const caregiver of medication.caregivers || []) {
              if (caregiver.notifications_enabled && caregiver.email && resend) {
                const missedEmailHtml = `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #dc2626;">⚠️ Missed Medication Alert</h2>
                    <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
                      <h3 style="margin: 0 0 10px 0; color: #dc2626;">Patient missed scheduled medication</h3>
                      <p style="margin: 5px 0;"><strong>Patient:</strong> ${medication.profiles?.full_name || 'Patient'}</p>
                      <p style="margin: 5px 0;"><strong>Medication:</strong> ${medication.name}</p>
                      <p style="margin: 5px 0;"><strong>Dosage:</strong> ${medication.dosage}</p>
                      <p style="margin: 5px 0;"><strong>Scheduled Time:</strong> ${missedTime}</p>
                      <p style="margin: 5px 0;"><strong>Time Missed:</strong> ${currentTime}</p>
                    </div>
                    
                    <div style="background: #fffbeb; padding: 15px; border-radius: 6px; margin: 20px 0;">
                      <p style="margin: 0; font-size: 14px; color: #92400e;">
                        <strong>Action needed:</strong> Please check on the patient and remind them to take their medication if appropriate.
                      </p>
                    </div>
                    
                    <p style="font-size: 12px; color: #6b7280; text-align: center; margin-top: 30px;">
                      This is an automated alert from MedCare caregiver monitoring system.
                    </p>
                  </div>
                `;

                missedEmails.push({
                  from: 'MedCare Alerts <alerts@medcare.app>',
                  to: [caregiver.email],
                  subject: `⚠️ ${medication.profiles?.full_name || 'Patient'} missed ${medication.name}`,
                  html: missedEmailHtml,
                });
              }
            }
          }
        }
      }

      // Send missed medication emails
      if (missedEmails.length > 0 && resend) {
        console.log(`Sending ${missedEmails.length} missed medication alerts`);
        
        for (const email of missedEmails) {
          try {
            const { error: emailError } = await resend.emails.send(email);
            if (emailError) {
              console.error('Error sending missed medication email:', emailError);
            } else {
              console.log(`Missed medication alert sent to ${email.to[0]}`);
            }
          } catch (emailError) {
            console.error('Error sending missed medication email:', emailError);
          }
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        notificationsSent: notifications.length,
        emailsSent: emailsToSend.length,
        timestamp: now.toISOString()
      }),
      { 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        } 
      }
    );

  } catch (error) {
    console.error('Error in medication-notifications function:', error);
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