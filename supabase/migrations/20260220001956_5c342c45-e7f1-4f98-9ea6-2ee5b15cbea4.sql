
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_referral_code TEXT;
  v_account_type TEXT;
  v_referrer_user_id UUID;
  v_referral_count INTEGER;
BEGIN
  v_referral_code := NEW.raw_user_meta_data->>'referred_by';
  v_account_type := COALESCE(NEW.raw_user_meta_data->>'account_type', 'primary');
  
  INSERT INTO public.profiles (user_id, display_name, user_code, account_type, referred_by)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'DC-' || UPPER(SUBSTRING(REPLACE(gen_random_uuid()::text, '-', ''), 1, 6)),
    v_account_type,
    v_referral_code
  );

  -- Only process referrals for PRIMARY accounts (not caregivers)
  IF v_account_type = 'primary' AND v_referral_code IS NOT NULL AND v_referral_code != '' THEN
    SELECT user_id INTO v_referrer_user_id
    FROM public.profiles
    WHERE user_code = UPPER(v_referral_code)
    LIMIT 1;

    IF v_referrer_user_id IS NOT NULL THEN
      INSERT INTO public.referrals (referrer_user_id, referred_user_id)
      VALUES (v_referrer_user_id, NEW.id)
      ON CONFLICT (referred_user_id) DO NOTHING;

      SELECT COUNT(*) INTO v_referral_count
      FROM public.referrals
      WHERE referrer_user_id = v_referrer_user_id;

      IF v_referral_count >= 3 THEN
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
