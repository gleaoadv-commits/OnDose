
-- Add stock tracking columns to medications
ALTER TABLE public.medications 
  ADD COLUMN stock_total integer DEFAULT NULL,
  ADD COLUMN stock_current integer DEFAULT NULL;
