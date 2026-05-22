-- Allow admins to update any bug report (e.g., mark as resolved)
CREATE POLICY "Admins can update any bug reports"
ON public.bug_reports
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));