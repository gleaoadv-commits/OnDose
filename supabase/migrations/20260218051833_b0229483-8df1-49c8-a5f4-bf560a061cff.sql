-- Function to look up a primary user by their user_code during caregiver signup
-- Uses SECURITY DEFINER so it works without an authenticated session
CREATE OR REPLACE FUNCTION public.get_user_id_by_code(p_user_code text)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT user_id FROM public.profiles
  WHERE user_code = UPPER(p_user_code)
    AND account_type = 'primary'
  LIMIT 1;
$$;

-- Grant execute to anon and authenticated roles
GRANT EXECUTE ON FUNCTION public.get_user_id_by_code(text) TO anon;
GRANT EXECUTE ON FUNCTION public.get_user_id_by_code(text) TO authenticated;
