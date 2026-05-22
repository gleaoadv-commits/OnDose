
ALTER TABLE public.bug_reports ADD COLUMN IF NOT EXISTS screenshot_url TEXT;

INSERT INTO storage.buckets (id, name, public) VALUES ('bug-screenshots', 'bug-screenshots', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Bug screenshots are publicly viewable"
ON storage.objects FOR SELECT
USING (bucket_id = 'bug-screenshots');

CREATE POLICY "Beta users can upload bug screenshots"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'bug-screenshots'
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND (public.has_role(auth.uid(), 'beta'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role))
);

CREATE POLICY "Users can delete their own bug screenshots"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'bug-screenshots'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
