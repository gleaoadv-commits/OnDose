
-- Allow primary users to view profiles of their linked caregivers
CREATE POLICY "Primary users can view linked caregiver profiles"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.family_links
    WHERE family_links.primary_user_id = auth.uid()
      AND family_links.caregiver_user_id = profiles.user_id
      AND family_links.status IN ('pending', 'active')
  )
);
