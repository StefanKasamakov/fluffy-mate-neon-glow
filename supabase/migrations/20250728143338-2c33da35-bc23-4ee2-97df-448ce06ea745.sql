-- Fix security issues in existing functions by setting search_path
-- Update the handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, avatar_url)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name', NEW.email),
    NEW.raw_user_meta_data ->> 'avatar_url'
  );
  RETURN NEW;
END;
$$;

-- Update the mark_message_as_read function
CREATE OR REPLACE FUNCTION public.mark_message_as_read(message_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.messages 
  SET is_read = true 
  WHERE id = message_id 
    AND EXISTS (
      SELECT 1 FROM matches 
      JOIN pets p1 ON p1.id = matches.pet1_id 
      JOIN pets p2 ON p2.id = matches.pet2_id
      WHERE matches.id = messages.match_id 
        AND (p1.user_id = auth.uid() OR p2.user_id = auth.uid())
        AND messages.sender_user_id != auth.uid()
    );
END;
$$;

-- Update the update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Update the create_match_on_mutual_like function
CREATE OR REPLACE FUNCTION public.create_match_on_mutual_like()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  -- Check if the liked pet also likes the liker pet
  IF EXISTS (
    SELECT 1 FROM likes 
    WHERE liker_pet_id = NEW.liked_pet_id 
    AND liked_pet_id = NEW.liker_pet_id
  ) THEN
    -- Create a match (ensuring consistent ordering)
    INSERT INTO matches (pet1_id, pet2_id)
    VALUES (
      LEAST(NEW.liker_pet_id, NEW.liked_pet_id),
      GREATEST(NEW.liker_pet_id, NEW.liked_pet_id)
    )
    ON CONFLICT (pet1_id, pet2_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create user subscription tracking table
CREATE TABLE IF NOT EXISTS public.user_subscription_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  subscription_tier TEXT NOT NULL DEFAULT 'free',
  subscription_status TEXT NOT NULL DEFAULT 'inactive',
  subscription_end TIMESTAMPTZ NULL,
  stripe_customer_id TEXT NULL,
  stripe_subscription_id TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on subscription status table
ALTER TABLE public.user_subscription_status ENABLE ROW LEVEL SECURITY;

-- Create policies for subscription status
CREATE POLICY "Users can view their own subscription status"
ON public.user_subscription_status
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can update their own subscription status"
ON public.user_subscription_status
FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own subscription status"
ON public.user_subscription_status
FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Add updated_at trigger for subscription status
CREATE TRIGGER update_user_subscription_status_updated_at
BEFORE UPDATE ON public.user_subscription_status
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to get user subscription tier
CREATE OR REPLACE FUNCTION public.get_user_subscription_tier(user_uuid UUID DEFAULT auth.uid())
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  user_tier TEXT := 'free';
BEGIN
  SELECT subscription_tier INTO user_tier
  FROM public.user_subscription_status
  WHERE user_id = user_uuid
    AND subscription_status = 'active'
    AND (subscription_end IS NULL OR subscription_end > now());
  
  RETURN COALESCE(user_tier, 'free');
END;
$$;

-- Create function to check if user has premium features
CREATE OR REPLACE FUNCTION public.has_premium_access(user_uuid UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  user_tier TEXT;
BEGIN
  user_tier := public.get_user_subscription_tier(user_uuid);
  RETURN user_tier IN ('plus', 'gold', 'platinum');
END;
$$;