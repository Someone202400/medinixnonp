
-- Create a table for caregivers
CREATE TABLE public.caregivers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone_number TEXT,
  relationship TEXT,
  notifications_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT caregiver_contact_check CHECK (email IS NOT NULL OR phone_number IS NOT NULL)
);

-- Add Row Level Security (RLS)
ALTER TABLE public.caregivers ENABLE ROW LEVEL SECURITY;

-- Create policies for caregivers
CREATE POLICY "Users can view their own caregivers" 
  ON public.caregivers 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own caregivers" 
  ON public.caregivers 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own caregivers" 
  ON public.caregivers 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own caregivers" 
  ON public.caregivers 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER caregivers_updated_at
  BEFORE UPDATE ON public.caregivers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
