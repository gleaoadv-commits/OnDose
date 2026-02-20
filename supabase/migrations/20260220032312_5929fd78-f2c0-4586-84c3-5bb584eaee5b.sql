ALTER TABLE public.profiles
  ADD COLUMN signup_city TEXT,
  ADD COLUMN signup_region TEXT,
  ADD COLUMN signup_country TEXT,
  ADD COLUMN signup_device TEXT,
  ADD COLUMN signup_ip TEXT;