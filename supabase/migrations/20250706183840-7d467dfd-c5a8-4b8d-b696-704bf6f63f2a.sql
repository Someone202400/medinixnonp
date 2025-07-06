
-- Fix notification type constraint to include all types being used
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE public.notifications ADD CONSTRAINT notifications_type_check 
  CHECK (type IN ('medication', 'medication_reminder', 'medication_taken', 'missed_medication', 'caregiver_notification', 'missed_medication_caregiver', 'symptom', 'general', 'medication_changed', 'caregiver_welcome', 'system_test'));

-- Add index for better performance on notification processing
CREATE INDEX IF NOT EXISTS idx_notifications_status_scheduled ON public.notifications(status, scheduled_for) WHERE status = 'pending';

-- Ensure medication_logs can handle all statuses
ALTER TABLE public.medication_logs DROP CONSTRAINT IF EXISTS medication_logs_status_check;
ALTER TABLE public.medication_logs ADD CONSTRAINT medication_logs_status_check 
  CHECK (status IN ('pending', 'taken', 'missed', 'skipped', 'archived'));
