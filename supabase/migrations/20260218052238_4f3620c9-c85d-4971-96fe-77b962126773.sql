-- Register the email hook so Supabase Auth uses our custom template
-- This hooks into the "send_email" auth hook
DO $$
BEGIN
  -- Check if the hook already exists and remove it first to avoid duplicates
  DELETE FROM auth.hooks WHERE hook_name = 'send_email' AND hook_function_url LIKE '%email-hook%';
EXCEPTION WHEN undefined_table THEN NULL;
END $$;