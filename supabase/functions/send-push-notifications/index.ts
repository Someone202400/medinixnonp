import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY');
const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY');

interface PushPayload {
  title: string;
  body: string;
  tag?: string;
  actions?: Array<{
    action: string;
    title: string;
  }>;
  data?: any;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { notifications } = await req.json();

    console.log('Processing push notifications:', notifications?.length || 0);

    for (const notification of notifications || []) {
      // Get user's push subscriptions
      const { data: subscriptions, error: subError } = await supabase
        .from('push_subscriptions')
        .select('*')
        .eq('user_id', notification.user_id);

      if (subError) {
        console.error('Error fetching subscriptions:', subError);
        continue;
      }

      if (!subscriptions || subscriptions.length === 0) {
        console.log('No push subscriptions found for user:', notification.user_id);
        continue;
      }

      // Send push notification to each subscription
      for (const subscription of subscriptions) {
        try {
          await sendPushNotification(subscription, {
            title: notification.title,
            body: notification.message,
            tag: notification.type,
            data: {
              notificationId: notification.id,
              type: notification.type,
              url: '/dashboard'
            }
          });

          console.log('Push notification sent successfully');
        } catch (error) {
          console.error('Error sending push notification:', error);
          
          // If subscription is invalid, remove it
          if (error.message.includes('invalid') || error.message.includes('expired')) {
            await supabase
              .from('push_subscriptions')
              .delete()
              .eq('id', subscription.id);
          }
        }
      }

      // Update notification status
      await supabase
        .from('notifications')
        .update({ 
          status: 'sent',
          sent_at: new Date().toISOString()
        })
        .eq('id', notification.id);
    }

    return new Response(
      JSON.stringify({ success: true, processed: notifications?.length || 0 }),
      { 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        } 
      }
    );

  } catch (error) {
    console.error('Error in send-push-notifications function:', error);
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

async function sendPushNotification(subscription: any, payload: PushPayload) {
  const webPushData = {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: subscription.p256dh,
      auth: subscription.auth
    }
  };

  // Create JWT token for VAPID
  const vapidHeaders = await createVapidHeaders(
    subscription.endpoint,
    'mailto:support@medcare.app'
  );

  const response = await fetch(subscription.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Encoding': 'aes128gcm',
      'TTL': '86400',
      ...vapidHeaders
    },
    body: await encryptPayload(payload, webPushData.keys)
  });

  if (!response.ok) {
    throw new Error(`Push notification failed: ${response.status} ${response.statusText}`);
  }

  return response;
}

async function createVapidHeaders(endpoint: string, subject: string) {
  const url = new URL(endpoint);
  const audience = `${url.protocol}//${url.hostname}`;
  
  const jwtHeader = {
    typ: 'JWT',
    alg: 'ES256'
  };

  const jwtPayload = {
    aud: audience,
    exp: Math.floor(Date.now() / 1000) + (12 * 60 * 60), // 12 hours
    sub: subject
  };

  // This is a simplified version - in production, you'd use proper JWT signing
  const token = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NiJ9.eyJhdWQiOiJodHRwczovL2ZjbS5nb29nbGVhcGlzLmNvbSIsImV4cCI6MTcwNjEzNjAwMCwic3ViIjoibWFpbHRvOnN1cHBvcnRAbWVkY2FyZS5hcHAifQ.signature';

  return {
    'Authorization': `vapid t=${token}, k=${VAPID_PUBLIC_KEY}`,
  };
}

async function encryptPayload(payload: PushPayload, keys: { p256dh: string; auth: string }) {
  // This is a simplified encryption - in production, you'd use proper Web Push encryption
  const jsonPayload = JSON.stringify(payload);
  return new TextEncoder().encode(jsonPayload);
}

serve(handler);