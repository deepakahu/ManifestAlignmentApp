-- Add payment-related fields to challenges table
ALTER TABLE public.challenges
ADD COLUMN IF NOT EXISTS payment_intent_id text,
ADD COLUMN IF NOT EXISTS payment_status text CHECK (payment_status IN ('pending', 'paid', 'failed', 'canceled', 'refunded')),
ADD COLUMN IF NOT EXISTS started_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS completed_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS failed_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS urgency_level text CHECK (urgency_level IN ('critical', 'high', 'medium')) DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS failure_consequence text CHECK (failure_consequence IN ('charity', 'partner', 'platform', 'anti-charity'));

-- Rename user_id to creator_id for clarity
ALTER TABLE public.challenges
RENAME COLUMN user_id TO creator_id;

-- Create payment_transactions table for audit trail
CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  challenge_id uuid NOT NULL,
  payment_intent_id text NOT NULL,
  amount integer NOT NULL, -- Amount in cents
  platform_fee integer, -- Platform fee in cents
  currency text NOT NULL DEFAULT 'USD',
  status text NOT NULL CHECK (status IN ('pending', 'paid', 'refunded', 'transferred')),
  transfer_id text, -- Stripe transfer ID if transferred to charity/partner
  completed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT payment_transactions_pkey PRIMARY KEY (id),
  CONSTRAINT payment_transactions_challenge_id_fkey FOREIGN KEY (challenge_id) REFERENCES public.challenges(id) ON DELETE CASCADE
);

-- Create index on payment_intent_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_challenges_payment_intent_id ON public.challenges(payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_challenge_id ON public.payment_transactions(challenge_id);

-- Add comment to explain payment flow
COMMENT ON COLUMN public.challenges.payment_intent_id IS 'Stripe Payment Intent ID for holding funds in escrow';
COMMENT ON COLUMN public.challenges.payment_status IS 'Status of payment: pending (not paid), paid (captured), failed (payment failed), canceled (user canceled), refunded (challenge completed successfully)';
COMMENT ON COLUMN public.challenges.urgency_level IS 'Edit lock rules: critical (no edits after creation), high (no edits after start), medium (no edits 1 day before start)';
COMMENT ON COLUMN public.challenges.failure_consequence IS 'Where stake goes if user fails: charity, partner (accountability partner), platform, anti-charity';
