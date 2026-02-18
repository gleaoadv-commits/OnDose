
-- Allow caregivers to UPDATE medications for their linked primary user
CREATE POLICY "Caregivers can update medications for linked primary users"
  ON public.medications
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.family_links
      WHERE family_links.caregiver_user_id = auth.uid()
        AND family_links.primary_user_id = medications.user_id
        AND family_links.status = 'active'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.family_links
      WHERE family_links.caregiver_user_id = auth.uid()
        AND family_links.primary_user_id = medications.user_id
        AND family_links.status = 'active'
    )
  );
