
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { notifications, caregivers } = await req.json()
    
    console.log('Received notifications request:', {
      notificationCount: notifications?.length,
      caregiverCount: caregivers?.length
    })

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    )

    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    if (!resendApiKey) {
      console.error('RESEND_API_KEY not configured')
      return new Response(
        JSON.stringify({ error: 'Email service not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get user profile for sender information
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', notifications[0]?.user_id)
      .single()

    const patientName = profile?.full_name || profile?.email || 'Patient'

    const results = []

    for (const notification of notifications) {
      const caregiver = caregivers.find(c => c.id === notification.caregiver_id)
      
      if (caregiver?.email) {
        console.log(`Sending email to caregiver: ${caregiver.email}`)
        
        const emailHtml = generateEmailTemplate(notification, caregiver, patientName)
        
        const emailPayload = {
          from: 'MedCare App <noreply@yourdomain.com>',
          to: [caregiver.email],
          subject: notification.title,
          html: emailHtml,
        }

        try {
          const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${resendApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(emailPayload),
          })

          if (response.ok) {
            const result = await response.json()
            console.log('Email sent successfully:', result.id)
            results.push({ success: true, caregiver: caregiver.email, messageId: result.id })
            
            // Update notification status
            await supabaseClient
              .from('notifications')
              .update({ 
                status: 'sent', 
                sent_at: new Date().toISOString() 
              })
              .eq('id', notification.id)
          } else {
            const errorText = await response.text()
            console.error('Failed to send email:', response.status, errorText)
            results.push({ success: false, caregiver: caregiver.email, error: errorText })
            
            // Update notification status
            await supabaseClient
              .from('notifications')
              .update({ status: 'failed' })
              .eq('id', notification.id)
          }
        } catch (error) {
          console.error('Error sending email:', error)
          results.push({ success: false, caregiver: caregiver.email, error: error.message })
          
          // Update notification status
          await supabaseClient
            .from('notifications')
            .update({ status: 'failed' })
            .eq('id', notification.id)
        }
      }
    }

    return new Response(
      JSON.stringify({ results }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } catch (error) {
    console.error('Error in send-notifications function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

function generateEmailTemplate(notification: any, caregiver: any, patientName: string): string {
  const isUrgent = notification.type.includes('missed')
  const urgencyColor = isUrgent ? '#dc2626' : '#059669'
  const urgencyBg = isUrgent ? '#fef2f2' : '#f0fdf4'
  
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${notification.title}</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">💊 MedCare Alert</h1>
        </div>
        
        <div style="background: ${urgencyBg}; border: 2px solid ${urgencyColor}; border-radius: 0 0 10px 10px; padding: 30px;">
            <div style="background: white; padding: 25px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <h2 style="color: ${urgencyColor}; margin-top: 0; font-size: 24px;">${notification.title}</h2>
                
                <p style="font-size: 16px; margin: 20px 0;">
                    Hello <strong>${caregiver.name}</strong>,
                </p>
                
                <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <p style="font-size: 18px; margin: 0; color: #1f2937;">
                        ${notification.message}
                    </p>
                </div>
                
                <div style="margin: 25px 0; padding: 15px; background: #e0f2fe; border-radius: 6px;">
                    <p style="margin: 0; color: #0369a1;">
                        <strong>Patient:</strong> ${patientName}<br>
                        <strong>Time:</strong> ${new Date().toLocaleString()}<br>
                        <strong>Your relationship:</strong> ${caregiver.relationship || 'Caregiver'}
                    </p>
                </div>
                
                ${isUrgent ? `
                <div style="background: #fef2f2; border: 1px solid #fecaca; padding: 15px; border-radius: 6px; margin: 20px 0;">
                    <p style="color: #dc2626; margin: 0; font-weight: bold;">
                        ⚠️ This is an urgent notification. Please check on ${patientName} when possible.
                    </p>
                </div>
                ` : ''}
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="https://yourapp.com/dashboard" 
                       style="display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 25px; font-weight: bold; font-size: 16px;">
                        View Dashboard
                    </a>
                </div>
                
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 25px 0;">
                
                <p style="font-size: 14px; color: #6b7280; text-align: center;">
                    You're receiving this because you're listed as a caregiver for ${patientName}.<br>
                    To unsubscribe from these notifications, please contact ${patientName} directly.
                </p>
            </div>
        </div>
        
        <div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px;">
            <p>Sent by MedCare App • Helping families stay connected</p>
        </div>
    </body>
    </html>
  `
}
