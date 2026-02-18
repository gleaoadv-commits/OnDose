
-- Add added_by columns to medications table for caregiver log
ALTER TABLE public.medications 
  ADD COLUMN IF NOT EXISTS added_by_user_id uuid,
  ADD COLUMN IF NOT EXISTS added_by_name text;

-- RLS: allow caregivers to INSERT medications for their linked primary user
CREATE POLICY "Caregivers can insert medications for linked primary users"
  ON public.medications
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.family_links
      WHERE family_links.caregiver_user_id = auth.uid()
        AND family_links.primary_user_id = medications.user_id
        AND family_links.status = 'active'
    )
  );

-- RLS: allow caregivers to insert schedule_events for linked primary user
CREATE POLICY "Caregivers can insert schedule events for linked primary users"
  ON public.schedule_events
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.family_links
      WHERE family_links.caregiver_user_id = auth.uid()
        AND family_links.primary_user_id = schedule_events.user_id
        AND family_links.status = 'active'
    )
  );
