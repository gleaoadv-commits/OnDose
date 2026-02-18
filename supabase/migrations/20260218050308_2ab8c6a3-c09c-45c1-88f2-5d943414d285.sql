-- 1. Vacation/pause mode: add pause_until to medications
ALTER TABLE public.medications ADD COLUMN IF NOT EXISTS pause_until date DEFAULT NULL;

-- 2. Exam reminders table (Premium feature)
CREATE TABLE IF NOT EXISTS public.exam_reminders (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  exam_name text NOT NULL,
  interval_months integer NOT NULL DEFAULT 6,
  last_exam_date date NOT NULL,
  next_reminder_date date NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.exam_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own reminders"
  ON public.exam_reminders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own reminders"
  ON public.exam_reminders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reminders"
  ON public.exam_reminders FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reminders"
  ON public.exam_reminders FOR DELETE
  USING (auth.uid() = user_id);

CREATE TRIGGER update_exam_reminders_updated_at
  BEFORE UPDATE ON public.exam_reminders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
