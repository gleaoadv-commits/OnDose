-- Remove execute for PUBLIC/anon/authenticated on trigger-only and definer functions
-- that are not meant to be invoked from the Data API.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;