
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationPayload {
  notifications: Array<{
    id?: string;
    user_id: string;
    title: string;
    message: string;
    type: string;
    channels: string;
    caregiver_id?: string;
  }>;
  caregivers: Array<{
    id: string;
    user_id: string;
    name: string;
    email?: string;
    phone_number?: string;
    notifications_enabled: boolean;
  }>;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload: NotificationPayload = await req.json();
    const { notifications, caregivers } = payload;
    
    console.log('Processing notifications:', notifications.length);
    console.log('For caregivers:', caregivers.length);

    const results = {
      sent: 0,
      failed: 0,
      errors: [] as string[]
    };

    // Process each notification
    for (const notification of notifications) {
      try {
        const channels = JSON.parse(notification.channels || '[]');
        
        // Find corresponding caregiver
        const caregiver = caregivers.find(c => c.id === notification.caregiver_id);
        
        if (!caregiver && notification.type === 'caregiver_notification') {
          console.warn('No caregiver found for notification:', notification.id);
          continue;
        }

        let notificationSent = false;

        // Send Email notifications
        if (channels.includes('email') && caregiver?.email) {
          try {
            await sendEmailNotification(caregiver.email, notification.title, notification.message);
            console.log(`Email sent to ${caregiver.email}`);
            notificationSent = true;
          } catch (error) {
            console.error('Email sending failed:', error);
            results.errors.push(`Email to ${caregiver.email}: ${error.message}`);
          }
        }

        // Send SMS notifications
        if (channels.includes('sms') && caregiver?.phone_number) {
          try {
            await sendSMSNotification(caregiver.phone_number, notification.message);
            console.log(`SMS sent to ${caregiver.phone_number}`);
            notificationSent = true;
          } catch (error) {
            console.error('SMS sending failed:', error);
            results.errors.push(`SMS to ${caregiver.phone_number}: ${error.message}`);
          }
        }

        // Send Push notifications
        if (channels.includes('push')) {
          try {
            await sendPushNotification(notification.title, notification.message);
            console.log(`Push notification sent: ${notification.title}`);
            notificationSent = true;
          } catch (error) {
            console.error('Push notification failed:', error);
            results.errors.push(`Push notification: ${error.message}`);
          }
        }

        if (notificationSent) {
          results.sent++;
        } else {
          results.failed++;
        }

      } catch (error) {
        console.error('Error processing notification:', error);
        results.failed++;
        results.errors.push(`Processing error: ${error.message}`);
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      processed: notifications.length,
      results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in send-notifications function:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to process notifications',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function sendEmailNotification(email: string, title: string, message: string) {
  const resendApiKey = Deno.env.get('RESEND_API_KEY');
  
  if (!resendApiKey) {
    console.log('RESEND_API_KEY not configured, skipping email notification');
    return;
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Health Sync <notifications@resend.dev>',
      to: [email],
      subject: title,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">${title}</h2>
          <p style="font-size: 16px; line-height: 1.5;">${message}</p>
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="font-size: 14px; color: #6b7280;">
            This notification was sent from your Health Sync medication tracking app.
          </p>
        </div>
      `,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Email API error: ${error}`);
  }
}

async function sendSMSNotification(phoneNumber: string, message: string) {
  const twilioSid = Deno.env.get('TWILIO_ACCOUNT_SID');
  const twilioToken = Deno.env.get('TWILIO_AUTH_TOKEN');
  const twilioFromNumber = Deno.env.get('TWILIO_FROM_NUMBER');
  
  if (!twilioSid || !twilioToken || !twilioFromNumber) {
    console.log('Twilio credentials not configured, skipping SMS notification');
    return;
  }

  const auth = btoa(`${twilioSid}:${twilioToken}`);
  
  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      To: phoneNumber,
      From: twilioFromNumber,
      Body: `Health Sync: ${message}`,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`SMS API error: ${error}`);
  }
}

async function sendPushNotification(title: string, message: string) {
  // Web Push API implementation would go here
  // For now, we'll log it as this requires more complex setup
  console.log(`Push notification: ${title} - ${message}`);
  
  // In a real implementation, you would:
  // 1. Store push subscription endpoints in the database
  // 2. Use web-push library to send notifications
  // 3. Handle VAPID keys for authentication
  
  return Promise.resolve();
}
