-- Add plan_override column to profiles for testing purposes
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS plan_override text DEFAULT NULL;
