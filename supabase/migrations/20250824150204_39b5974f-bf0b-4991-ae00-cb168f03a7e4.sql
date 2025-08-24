-- Remove caregiver system tables and references

-- Drop caregiver-related tables
DROP TABLE IF EXISTS public.caregivers CASCADE;

-- Remove caregiver columns from notifications table if they exist
ALTER TABLE public.notifications DROP COLUMN IF EXISTS caregiver_id;