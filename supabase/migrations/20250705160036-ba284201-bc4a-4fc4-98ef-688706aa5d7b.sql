
-- Fix the medication_logs status constraint to include all valid statuses
ALTER TABLE public.medication_logs DROP CONSTRAINT IF EXISTS medication_logs_status_check;
ALTER TABLE public.medication_logs ADD CONSTRAINT medication_logs_status_check 
  CHECK (status IN ('pending', 'taken', 'missed', 'skipped', 'archived'));

-- Add missing caregiver_id column to notifications table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'notifications' 
                 AND column_name = 'caregiver_id' 
                 AND table_schema = 'public') THEN
    ALTER TABLE public.notifications ADD COLUMN caregiver_id UUID;
  END IF;
END $$;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_medication_logs_user_scheduled ON public.medication_logs(user_id, scheduled_time);
CREATE INDEX IF NOT EXISTS idx_medication_logs_status ON public.medication_logs(status);
CREATE INDEX IF NOT EXISTS idx_notifications_user_scheduled ON public.notifications(user_id, scheduled_for);
CREATE INDEX IF NOT EXISTS idx_notifications_caregiver ON public.notifications(caregiver_id) WHERE caregiver_id IS NOT NULL;

-- Update notification status constraint to include all valid statuses
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_status_check;
ALTER TABLE public.notifications ADD CONSTRAINT notifications_status_check 
  CHECK (status IN ('pending', 'sent', 'failed', 'delivered'));

-- Update notification type constraint to include all valid types
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE public.notifications ADD CONSTRAINT notifications_type_check 
  CHECK (type IN ('medication', 'medication_reminder', 'medication_taken', 'missed_medication', 'caregiver_notification', 'missed_medication_caregiver', 'symptom', 'general'));
