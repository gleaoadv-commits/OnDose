
-- Allow caregivers to read the profile of the primary user they are linked to
-- This is needed so caregivers can see who they're linked to
CREATE POLICY "Caregivers can view linked primary profile"
  ON public.profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.family_links
      WHERE caregiver_user_id = auth.uid()
        AND primary_user_id = profiles.user_id
        AND status IN ('pending', 'active')
    )
  );
