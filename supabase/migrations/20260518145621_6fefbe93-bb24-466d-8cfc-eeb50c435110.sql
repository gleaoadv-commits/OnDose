CREATE TABLE public.bug_reports (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  page text,
  severity text NOT NULL DEFAULT 'medium',
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.bug_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Beta users can view own bug reports"
ON public.bug_reports FOR SELECT
USING (auth.uid() = user_id AND public.has_role(auth.uid(), 'beta'));

CREATE POLICY "Beta users can insert own bug reports"
ON public.bug_reports FOR INSERT
WITH CHECK (auth.uid() = user_id AND public.has_role(auth.uid(), 'beta'));

CREATE POLICY "Beta users can update own bug reports"
ON public.bug_reports FOR UPDATE
USING (auth.uid() = user_id AND public.has_role(auth.uid(), 'beta'));

CREATE POLICY "Beta users can delete own bug reports"
ON public.bug_reports FOR DELETE
USING (auth.uid() = user_id AND public.has_role(auth.uid(), 'beta'));

CREATE TRIGGER update_bug_reports_updated_at
BEFORE UPDATE ON public.bug_reports
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Grant beta role to Marcos
INSERT INTO public.user_roles (user_id, role)
VALUES ('bf3d72ee-f9b9-4e53-9647-18fc9ea45a68', 'beta')
ON CONFLICT DO NOTHING;