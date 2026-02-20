
-- Update handle_new_user to save referred_by and create referral record
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_referral_code TEXT;
  v_referrer_user_id UUID;
  v_referral_count INTEGER;
BEGIN
  v_referral_code := NEW.raw_user_meta_data->>'referred_by';
  
  INSERT INTO public.profiles (user_id, display_name, user_code, account_type, referred_by)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'DC-' || UPPER(SUBSTRING(REPLACE(gen_random_uuid()::text, '-', ''), 1, 6)),
    COALESCE(NEW.raw_user_meta_data->>'account_type', 'primary'),
    v_referral_code
  );

  -- If there's a referral code, create a referral record
  IF v_referral_code IS NOT NULL AND v_referral_code != '' THEN
    SELECT user_id INTO v_referrer_user_id
    FROM public.profiles
    WHERE user_code = UPPER(v_referral_code)
    LIMIT 1;

    IF v_referrer_user_id IS NOT NULL THEN
      INSERT INTO public.referrals (referrer_user_id, referred_user_id)
      VALUES (v_referrer_user_id, NEW.id)
      ON CONFLICT (referred_user_id) DO NOTHING;

      -- Check if referrer now has 3 referrals and hasn't been rewarded yet
      SELECT COUNT(*) INTO v_referral_count
      FROM public.referrals
      WHERE referrer_user_id = v_referrer_user_id;

      IF v_referral_count >= 3 THEN
        -- Check if reward already exists
        IF NOT EXISTS (
          SELECT 1 FROM public.referral_rewards
          WHERE user_id = v_referrer_user_id AND reward_type = 'coupon_5_percent'
        ) THEN
          INSERT INTO public.referral_rewards (user_id, reward_type, referral_count, expires_at)
          VALUES (
            v_referrer_user_id,
            'coupon_5_percent',
            v_referral_count,
            now() + INTERVAL '30 days'
          );
        END IF;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
