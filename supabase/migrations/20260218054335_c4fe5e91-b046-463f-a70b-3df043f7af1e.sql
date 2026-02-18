
-- Allow caregivers to view medications of their linked primary user
CREATE POLICY "Caregivers can view linked primary medications"
ON public.medications
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.family_links
    WHERE family_links.caregiver_user_id = auth.uid()
      AND family_links.primary_user_id = medications.user_id
      AND family_links.status = 'active'
  )
);

-- Allow caregivers to view schedule_events of their linked primary user
CREATE POLICY "Caregivers can view linked primary schedule events"
ON public.schedule_events
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.family_links
    WHERE family_links.caregiver_user_id = auth.uid()
      AND family_links.primary_user_id = schedule_events.user_id
      AND family_links.status = 'active'
  )
);

-- Allow caregivers to view exam_results of their linked primary user
CREATE POLICY "Caregivers can view linked primary exam results"
ON public.exam_results
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.family_links
    WHERE family_links.caregiver_user_id = auth.uid()
      AND family_links.primary_user_id = exam_results.user_id
      AND family_links.status = 'active'
  )
);

-- Allow caregivers to view exam_indicators of their linked primary user
CREATE POLICY "Caregivers can view linked primary exam indicators"
ON public.exam_indicators
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.family_links
    WHERE family_links.caregiver_user_id = auth.uid()
      AND family_links.primary_user_id = exam_indicators.user_id
      AND family_links.status = 'active'
  )
);
