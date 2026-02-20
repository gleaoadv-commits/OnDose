
-- Table to track referrals (who referred whom)
CREATE TABLE public.referrals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_user_id UUID NOT NULL,
  referred_user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Unique constraint: one person can only be referred once
ALTER TABLE public.referrals ADD CONSTRAINT referrals_referred_unique UNIQUE (referred_user_id);

-- Enable RLS
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- Referrers can see their own referrals
CREATE POLICY "Users can view referrals they made"
  ON public.referrals FOR SELECT
  USING (auth.uid() = referrer_user_id);

-- Referred users can see their own referral record
CREATE POLICY "Users can view their own referral record"
  ON public.referrals FOR SELECT
  USING (auth.uid() = referred_user_id);

-- Service role inserts referrals (via trigger), but allow insert for the referred user
CREATE POLICY "Users can insert their own referral"
  ON public.referrals FOR INSERT
  WITH CHECK (auth.uid() = referred_user_id);

-- Table to track rewards (coupons earned)
CREATE TABLE public.referral_rewards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  reward_type TEXT NOT NULL DEFAULT 'coupon_5_percent',
  coupon_code TEXT,
  referral_count INTEGER NOT NULL DEFAULT 3,
  granted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  used BOOLEAN NOT NULL DEFAULT false,
  used_at TIMESTAMP WITH TIME ZONE,
  sent_whatsapp BOOLEAN NOT NULL DEFAULT false,
  sent_whatsapp_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.referral_rewards ENABLE ROW LEVEL SECURITY;

-- Users can view their own rewards
CREATE POLICY "Users can view their own rewards"
  ON public.referral_rewards FOR SELECT
  USING (auth.uid() = user_id);

-- Admin access via service role for management

-- Add referred_by column to profiles to store referrer's user_code
ALTER TABLE public.profiles ADD COLUMN referred_by TEXT;
