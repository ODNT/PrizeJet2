/*
  # PrizeJet Database Schema

  1. New Tables
    - `campaigns` - Stores campaign configuration and details
    - `campaign_entries` - Stores participant entries and referral data
    - `subscriptions` - Tracks user subscription status for pro features
  
  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    - Add policies for public access to active campaigns
*/

-- Create campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  featured_image TEXT,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'ended')),
  prize_title TEXT NOT NULL,
  prize_description TEXT,
  num_winners INTEGER NOT NULL DEFAULT 1,
  slug TEXT UNIQUE,
  entry_options JSONB NOT NULL DEFAULT '{"email_opt_in": true, "referral_enabled": true, "bonus_actions": []}',
  points_config JSONB NOT NULL DEFAULT '{"referral_points": 10}',
  pro_features JSONB NOT NULL DEFAULT '{"autoresponder_integration": {"enabled": false, "provider": "none"}, "webhook_url": null}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create campaign entries table
CREATE TABLE IF NOT EXISTS campaign_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  referral_code TEXT NOT NULL UNIQUE,
  referrer_id UUID REFERENCES campaign_entries(id),
  points INTEGER NOT NULL DEFAULT 1,
  ip_address TEXT,
  bonus_actions_completed JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create index on campaign_id for faster lookups
CREATE INDEX IF NOT EXISTS campaign_entries_campaign_id_idx ON campaign_entries(campaign_id);

-- Create index on referrer_id for faster referral lookups
CREATE INDEX IF NOT EXISTS campaign_entries_referrer_id_idx ON campaign_entries(referrer_id);

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  status TEXT NOT NULL CHECK (status IN ('active', 'canceled', 'past_due', 'trialing')),
  plan_id TEXT NOT NULL,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create function to increment points for referrals
CREATE OR REPLACE FUNCTION increment_points(entry_id UUID, points_to_add INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE campaign_entries
  SET points = points + points_to_add
  WHERE id = entry_id;
END;
$$ LANGUAGE plpgsql;

-- Enable Row Level Security
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Policies for campaigns table
CREATE POLICY "Users can create campaigns"
  ON campaigns
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own campaigns"
  ON campaigns
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own campaigns"
  ON campaigns
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own campaigns"
  ON campaigns
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Public can view active campaigns by slug"
  ON campaigns
  FOR SELECT
  TO anon
  USING (status = 'active' AND slug IS NOT NULL);

-- Policies for campaign_entries table
CREATE POLICY "Anyone can create entries"
  ON campaign_entries
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Campaign owners can view entries"
  ON campaign_entries
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM campaigns
    WHERE campaigns.id = campaign_entries.campaign_id
    AND campaigns.user_id = auth.uid()
  ));

CREATE POLICY "Public can view their own entries"
  ON campaign_entries
  FOR SELECT
  TO anon, authenticated
  USING (id::text = coalesce(current_setting('request.headers.x-entry-id', true), ''));

-- Policies for subscriptions table
CREATE POLICY "Users can view their own subscriptions"
  ON subscriptions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can manage subscriptions"
  ON subscriptions
  FOR ALL
  TO service_role
  USING (true);
