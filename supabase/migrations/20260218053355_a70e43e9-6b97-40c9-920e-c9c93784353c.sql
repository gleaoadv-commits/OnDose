-- Function to look up any user (caregiver or primary) by their user_code
-- Used when primary user wants to link a caregiver by their code
CREATE OR REPLACE FUNCTION public.get_caregiver_id_by_code(p_user_code text)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT user_id FROM public.profiles
  WHERE user_code = UPPER(p_user_code)
    AND account_type = 'caregiver'
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_caregiver_id_by_code(text) TO anon;
GRANT EXECUTE ON FUNCTION public.get_caregiver_id_by_code(text) TO authenticated;

-- Also allow primary users to INSERT family_links (they initiate the link from their side)
-- The existing policy only allows caregiver_user_id = auth.uid()
-- We need to also allow primary_user_id = auth.uid() for when THEY initiate
DROP POLICY IF EXISTS "Authenticated users can create links" ON public.family_links;

CREATE POLICY "Caregiver can create own link requests"
  ON public.family_links
  FOR INSERT
  WITH CHECK (auth.uid() = caregiver_user_id);

CREATE POLICY "Primary user can create links by caregiver code"
  ON public.family_links
  FOR INSERT
  WITH CHECK (auth.uid() = primary_user_id);
