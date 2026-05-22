CREATE POLICY "Admins can view all bug reports"
ON public.bug_reports FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));