-- Enhanced symptom checker tables
CREATE TABLE IF NOT EXISTS public.symptom_questionnaires (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  session_id UUID NOT NULL,
  age INTEGER,
  gender TEXT,
  primary_symptom_location TEXT,
  severity_rating INTEGER CHECK (severity_rating >= 1 AND severity_rating <= 10),
  pain_type TEXT[], -- sharp, dull, throbbing, burning
  pain_radiation BOOLEAN DEFAULT false,
  symptom_duration TEXT,
  symptom_progression TEXT, -- getting better, worse, same
  associated_symptoms TEXT[],
  activity_limitations TEXT[],
  medical_history JSONB,
  recent_events TEXT[],
  questionnaire_data JSONB,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enhanced notification preferences
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  caregiver_id UUID,
  push_notifications_enabled BOOLEAN DEFAULT true,
  email_notifications_enabled BOOLEAN DEFAULT true,
  sms_notifications_enabled BOOLEAN DEFAULT false,
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  critical_override BOOLEAN DEFAULT true,
  notification_frequency TEXT DEFAULT 'standard', -- minimal, standard, frequent
  preferred_channels JSONB DEFAULT '["push", "email"]'::jsonb,
  medication_reminders BOOLEAN DEFAULT true,
  adherence_reports BOOLEAN DEFAULT true,
  emergency_alerts BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Notification delivery tracking
CREATE TABLE IF NOT EXISTS public.notification_deliveries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  notification_id UUID NOT NULL,
  user_id UUID NOT NULL,
  channel TEXT NOT NULL, -- push, email, sms
  delivery_status TEXT NOT NULL DEFAULT 'pending', -- pending, sent, delivered, failed, opened, clicked
  attempt_count INTEGER DEFAULT 0,
  last_attempt_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enhanced medication logs with priority levels
ALTER TABLE public.medication_logs 
ADD COLUMN IF NOT EXISTS priority_level TEXT DEFAULT 'standard',
ADD COLUMN IF NOT EXISTS special_instructions TEXT,
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Enable RLS
ALTER TABLE public.symptom_questionnaires ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;  
ALTER TABLE public.notification_deliveries ENABLE ROW LEVEL SECURITY;

-- RLS policies for symptom questionnaires
CREATE POLICY "Users can manage their own questionnaires" 
ON public.symptom_questionnaires 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- RLS policies for notification preferences
CREATE POLICY "Users can manage their own notification preferences" 
ON public.notification_preferences 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- RLS policies for notification deliveries
CREATE POLICY "Users can view their own notification deliveries" 
ON public.notification_deliveries 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Service can manage notification deliveries" 
ON public.notification_deliveries 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Service can update notification deliveries" 
ON public.notification_deliveries 
FOR UPDATE 
USING (true);

-- Triggers for updated_at
CREATE TRIGGER update_symptom_questionnaires_updated_at
BEFORE UPDATE ON public.symptom_questionnaires
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_notification_preferences_updated_at
BEFORE UPDATE ON public.notification_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();