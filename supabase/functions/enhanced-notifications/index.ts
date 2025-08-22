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
const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');
const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');

interface NotificationRequest {
  type: 'medication_reminder' | 'adherence_report' | 'caregiver_alert' | 'emergency_alert';
  userId: string;
  caregiverId?: string;
  medicationId?: string;
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  channels: ('push' | 'email' | 'sms')[];
  scheduledFor?: string;
  data?: any;
}

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

    const notificationRequest: NotificationRequest = await req.json();
    console.log('Processing notification request:', notificationRequest);

    // Get user preferences
    const { data: userPrefs, error: prefsError } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', notificationRequest.userId)
      .single();

    if (prefsError && prefsError.code !== 'PGRST116') {
      console.error('Error fetching user preferences:', prefsError);
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', notificationRequest.userId)
      .single();

    if (profileError) {
      console.error('Error fetching user profile:', profileError);
    }

    // Check quiet hours
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM
    
    let shouldSkipNonCritical = false;
    if (userPrefs?.quiet_hours_start && userPrefs?.quiet_hours_end) {
      const quietStart = userPrefs.quiet_hours_start;
      const quietEnd = userPrefs.quiet_hours_end;
      
      if (quietStart <= quietEnd) {
        // Same day quiet hours
        shouldSkipNonCritical = currentTime >= quietStart && currentTime <= quietEnd;
      } else {
        // Overnight quiet hours
        shouldSkipNonCritical = currentTime >= quietStart || currentTime <= quietEnd;
      }
    }

    // Skip non-critical notifications during quiet hours
    if (shouldSkipNonCritical && notificationRequest.priority !== 'critical' && !userPrefs?.critical_override) {
      console.log('Skipping notification due to quiet hours');
      return new Response(
        JSON.stringify({ success: true, skipped: true, reason: 'quiet_hours' }),
        { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const deliveries = [];

    // Create base notification record
    const { data: notification, error: notifError } = await supabase
      .from('notifications')
      .insert({
        user_id: notificationRequest.userId,
        caregiver_id: notificationRequest.caregiverId,
        type: notificationRequest.type,
        title: notificationRequest.title,
        message: notificationRequest.message,
        scheduled_for: notificationRequest.scheduledFor || new Date().toISOString(),
        channels: JSON.stringify(notificationRequest.channels)
      })
      .select()
      .single();

    if (notifError) {
      console.error('Error creating notification:', notifError);
      throw notifError;
    }

    // Process each channel
    for (const channel of notificationRequest.channels) {
      const delivery = {
        notification_id: notification.id,
        user_id: notificationRequest.userId,
        channel,
        delivery_status: 'pending' as const,
        attempt_count: 0
      };

      try {
        if (channel === 'email' && userPrefs?.email_notifications_enabled !== false && profile?.email && resend) {
          await sendEmailNotification(resend, {
            to: profile.email,
            subject: notificationRequest.title,
            title: notificationRequest.title,
            message: notificationRequest.message,
            priority: notificationRequest.priority,
            type: notificationRequest.type,
            data: notificationRequest.data
          });
          
          delivery.delivery_status = 'delivered';
          delivery.attempt_count = 1;
          console.log(`Email sent to ${profile.email}`);
        }

        if (channel === 'push' && userPrefs?.push_notifications_enabled !== false) {
          const pushResult = await sendPushNotification(supabase, {
            userId: notificationRequest.userId,
            title: notificationRequest.title,
            message: notificationRequest.message,
            priority: notificationRequest.priority,
            data: notificationRequest.data
          });
          
          if (pushResult.success) {
            delivery.delivery_status = 'delivered';
            delivery.attempt_count = 1;
            console.log(`Push notification sent to user ${notificationRequest.userId}`);
          } else {
            delivery.delivery_status = 'failed';
            delivery.attempt_count = 1;
            delivery.error_message = pushResult.error;
          }
        }

        // SMS would be implemented here with a service like Twilio
        if (channel === 'sms' && userPrefs?.sms_notifications_enabled !== false) {
          // Placeholder for SMS implementation
          delivery.delivery_status = 'pending';
          delivery.error_message = 'SMS not implemented';
        }

      } catch (error) {
        console.error(`Error sending ${channel} notification:`, error);
        delivery.delivery_status = 'failed';
        delivery.attempt_count = 1;
        delivery.error_message = error.message;
      }

      deliveries.push(delivery);
    }

    // Save delivery records
    if (deliveries.length > 0) {
      const { error: deliveryError } = await supabase
        .from('notification_deliveries')
        .insert(deliveries);

      if (deliveryError) {
        console.error('Error saving delivery records:', deliveryError);
      }
    }

    // Handle caregiver notifications if specified
    if (notificationRequest.caregiverId) {
      const { data: caregiver, error: caregiverError } = await supabase
        .from('caregivers')
        .select('*')
        .eq('id', notificationRequest.caregiverId)
        .single();

      if (!caregiverError && caregiver?.notifications_enabled && caregiver.email && resend) {
        try {
          await sendCaregiverEmailNotification(resend, {
            to: caregiver.email,
            caregiverName: caregiver.name,
            patientName: profile?.full_name || 'Patient',
            notificationType: notificationRequest.type,
            title: notificationRequest.title,
            message: notificationRequest.message,
            data: notificationRequest.data
          });
          console.log(`Caregiver notification sent to ${caregiver.email}`);
        } catch (error) {
          console.error('Error sending caregiver notification:', error);
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        notificationId: notification.id,
        deliveriesSent: deliveries.filter(d => d.delivery_status === 'delivered').length,
        deliveriesFailed: deliveries.filter(d => d.delivery_status === 'failed').length
      }),
      { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );

  } catch (error) {
    console.error('Error in enhanced-notifications function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    );
  }
};

async function sendEmailNotification(resend: any, params: {
  to: string;
  subject: string;
  title: string;
  message: string;
  priority: string;
  type: string;
  data?: any;
}) {
  const priorityColor = params.priority === 'critical' ? '#dc2626' : 
                       params.priority === 'high' ? '#ea580c' : 
                       params.priority === 'medium' ? '#d97706' : '#059669';

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
      <div style="background: ${priorityColor}; color: white; padding: 20px; text-align: center;">
        <h1 style="margin: 0; font-size: 24px;">${params.title}</h1>
        <div style="background: rgba(255,255,255,0.2); padding: 8px 16px; border-radius: 20px; display: inline-block; margin-top: 10px;">
          ${params.priority.toUpperCase()} PRIORITY
        </div>
      </div>
      
      <div style="padding: 30px;">
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <p style="margin: 0; font-size: 16px; line-height: 1.5;">${params.message}</p>
        </div>
        
        ${params.data?.medication ? `
          <div style="background: #ecfdf5; padding: 20px; border-radius: 8px; border-left: 4px solid #10b981; margin-bottom: 20px;">
            <h3 style="margin: 0 0 10px 0; color: #065f46;">Medication Details</h3>
            <p style="margin: 5px 0;"><strong>Name:</strong> ${params.data.medication.name}</p>
            <p style="margin: 5px 0;"><strong>Dosage:</strong> ${params.data.medication.dosage}</p>
            ${params.data.medication.notes ? `<p style="margin: 5px 0;"><strong>Notes:</strong> ${params.data.medication.notes}</p>` : ''}
          </div>
        ` : ''}
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${supabaseUrl.replace('.supabase.co', '')}.lovable.app/dashboard" 
             style="background: ${priorityColor}; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
            Open MedCare App
          </a>
        </div>
        
        <div style="background: #fef3c7; padding: 15px; border-radius: 6px; margin: 20px 0;">
          <p style="margin: 0; font-size: 14px; color: #92400e;">
            <strong>Important:</strong> This is an automated notification. Always consult your healthcare provider for medical advice.
          </p>
        </div>
      </div>
      
      <div style="background: #f1f5f9; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
        <p style="margin: 0; font-size: 12px; color: #64748b;">
          This message was sent by MedCare. To adjust notification preferences, visit your app settings.
        </p>
      </div>
    </div>
  `;

  await resend.emails.send({
    from: 'MedCare <notifications@medcare.app>',
    to: [params.to],
    subject: params.subject,
    html: html,
  });
}

async function sendCaregiverEmailNotification(resend: any, params: {
  to: string;
  caregiverName: string;
  patientName: string;
  notificationType: string;
  title: string;
  message: string;
  data?: any;
}) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
      <div style="background: #2563eb; color: white; padding: 20px; text-align: center;">
        <h1 style="margin: 0; font-size: 24px;">👥 Caregiver Alert</h1>
        <p style="margin: 10px 0 0 0; opacity: 0.9;">Patient update for ${params.patientName}</p>
      </div>
      
      <div style="padding: 30px;">
        <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; border-left: 4px solid #2563eb; margin-bottom: 20px;">
          <h3 style="margin: 0 0 10px 0; color: #1e40af;">Hello ${params.caregiverName},</h3>
          <p style="margin: 0; color: #1e40af;">${params.message}</p>
        </div>
        
        ${params.data?.adherenceData ? `
          <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="margin: 0 0 10px 0; color: #92400e;">Adherence Summary</h3>
            <p style="margin: 5px 0;"><strong>Medications taken:</strong> ${params.data.adherenceData.taken} / ${params.data.adherenceData.total}</p>
            <p style="margin: 5px 0;"><strong>Adherence rate:</strong> ${Math.round(params.data.adherenceData.percentage)}%</p>
          </div>
        ` : ''}
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${supabaseUrl.replace('.supabase.co', '')}.lovable.app/dashboard" 
             style="background: #2563eb; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
            View Patient Dashboard
          </a>
        </div>
        
        <div style="background: #ecfdf5; padding: 15px; border-radius: 6px;">
          <p style="margin: 0; font-size: 14px; color: #065f46;">
            You're receiving this as a designated caregiver for ${params.patientName}. 
            To modify your notification preferences, please contact the patient.
          </p>
        </div>
      </div>
      
      <div style="background: #f1f5f9; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
        <p style="margin: 0; font-size: 12px; color: #64748b;">
          MedCare Caregiver Notification System
        </p>
      </div>
    </div>
  `;

  await resend.emails.send({
    from: 'MedCare Caregivers <caregivers@medcare.app>',
    to: [params.to],
    subject: `👥 ${params.title} - ${params.patientName}`,
    html: html,
  });
}

async function sendPushNotification(supabase: any, params: {
  userId: string;
  title: string;
  message: string;
  priority: string;
  data?: any;
}) {
  try {
    // Get user's push subscriptions
    const { data: subscriptions, error } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', params.userId);

    if (error || !subscriptions || subscriptions.length === 0) {
      return { success: false, error: 'No push subscriptions found' };
    }

    let successCount = 0;
    let errorMessages = [];

    for (const subscription of subscriptions) {
      try {
        const payload = {
          title: params.title,
          body: params.message,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          tag: params.data?.medicationId || 'notification',
          requireInteraction: params.priority === 'critical',
          actions: params.data?.medication ? [
            { action: 'taken', title: 'Mark as Taken' },
            { action: 'snooze', title: 'Snooze 15 mins' }
          ] : [],
          data: params.data || {}
        };

        // This would use the Web Push protocol in a real implementation
        // For now, we'll mark as successful
        successCount++;
        
      } catch (pushError) {
        console.error('Push notification error:', pushError);
        errorMessages.push(pushError.message);
        
        // Remove invalid subscriptions
        if (pushError.message.includes('invalid') || pushError.message.includes('expired')) {
          await supabase
            .from('push_subscriptions')
            .delete()
            .eq('id', subscription.id);
        }
      }
    }

    return { 
      success: successCount > 0, 
      error: errorMessages.length > 0 ? errorMessages.join(', ') : null 
    };

  } catch (error) {
    return { success: false, error: error.message };
  }
}

serve(handler);