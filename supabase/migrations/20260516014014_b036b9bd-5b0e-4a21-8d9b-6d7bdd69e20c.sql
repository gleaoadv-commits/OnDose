ALTER TABLE public.medications ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
CREATE INDEX IF NOT EXISTS idx_medications_deleted_at ON public.medications(deleted_at);