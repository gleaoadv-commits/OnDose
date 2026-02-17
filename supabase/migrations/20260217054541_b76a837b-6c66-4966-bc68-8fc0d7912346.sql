
-- Add user_code to profiles for unique shareable ID
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS user_code TEXT UNIQUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS account_type TEXT NOT NULL DEFAULT 'primary';

-- Generate user_code for existing profiles
UPDATE public.profiles SET user_code = 'DC-' || UPPER(SUBSTRING(REPLACE(gen_random_uuid()::text, '-', ''), 1, 6)) WHERE user_code IS NULL;

-- Make user_code NOT NULL after backfill
ALTER TABLE public.profiles ALTER COLUMN user_code SET NOT NULL;

-- Update handle_new_user to generate user_code
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, user_code, account_type)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'DC-' || UPPER(SUBSTRING(REPLACE(gen_random_uuid()::text, '-', ''), 1, 6)),
    COALESCE(NEW.raw_user_meta_data->>'account_type', 'primary')
  );
  RETURN NEW;
END;
$function$;

-- Create family_links table
CREATE TABLE public.family_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  primary_user_id UUID NOT NULL,
  caregiver_user_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(primary_user_id, caregiver_user_id)
);

-- Enable RLS
ALTER TABLE public.family_links ENABLE ROW LEVEL SECURITY;

-- Primary user can see and manage their links
CREATE POLICY "Primary user can view their links"
ON public.family_links FOR SELECT
USING (auth.uid() = primary_user_id);

CREATE POLICY "Primary user can update their links"
ON public.family_links FOR UPDATE
USING (auth.uid() = primary_user_id);

CREATE POLICY "Primary user can delete their links"
ON public.family_links FOR DELETE
USING (auth.uid() = primary_user_id);

-- Caregiver can see their own links
CREATE POLICY "Caregiver can view their links"
ON public.family_links FOR SELECT
USING (auth.uid() = caregiver_user_id);

-- Anyone authenticated can request a link (insert)
CREATE POLICY "Authenticated users can create links"
ON public.family_links FOR INSERT
WITH CHECK (auth.uid() = caregiver_user_id);

-- Trigger for updated_at
CREATE TRIGGER update_family_links_updated_at
BEFORE UPDATE ON public.family_links
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
