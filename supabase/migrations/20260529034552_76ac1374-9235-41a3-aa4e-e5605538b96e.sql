-- 1) Restrict caregiver profile SELECT to active links only (was: pending OR active)
DROP POLICY IF EXISTS "Caregivers can view linked primary profile" ON public.profiles;
CREATE POLICY "Caregivers can view linked primary profile"
ON public.profiles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.family_links
    WHERE family_links.caregiver_user_id = auth.uid()
      AND family_links.primary_user_id = profiles.user_id
      AND family_links.status = 'active'
  )
);

DROP POLICY IF EXISTS "Primary users can view linked caregiver profiles" ON public.profiles;
CREATE POLICY "Primary users can view linked caregiver profiles"
ON public.profiles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.family_links
    WHERE family_links.primary_user_id = auth.uid()
      AND family_links.caregiver_user_id = profiles.user_id
      AND family_links.status = 'active'
  )
);

-- 2) Add UPDATE policy on exam-images bucket
CREATE POLICY "Users can update their own exam images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'exam-images' AND (auth.uid())::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'exam-images' AND (auth.uid())::text = (storage.foldername(name))[1]);

-- 3) Tighten public bucket listing: replace bucket-wide SELECT policies
-- with per-folder ownership for listing, while keeping public URL access
-- (public URLs do not rely on RLS).
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
CREATE POLICY "Avatars: owners can list, others use public URL"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'avatars'
  AND (
    auth.uid() IS NOT NULL
    AND (auth.uid())::text = (storage.foldername(name))[1]
  )
);

DROP POLICY IF EXISTS "Bug screenshots are publicly viewable" ON storage.objects;
CREATE POLICY "Bug screenshots: owners and admins can list"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'bug-screenshots'
  AND auth.uid() IS NOT NULL
  AND (
    (auth.uid())::text = (storage.foldername(name))[1]
    OR public.has_role(auth.uid(), 'admin'::app_role)
  )
);

-- 4) Lock down SECURITY DEFINER helper functions: revoke from anon/public,
-- grant only to authenticated roles.
REVOKE EXECUTE ON FUNCTION public.get_user_id_by_code(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_caregiver_id_by_code(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_user_id_by_code(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_caregiver_id_by_code(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;