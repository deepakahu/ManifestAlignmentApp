-- Migration: Add activity_logs unique constraint and create challenges tables
-- Date: 2026-04-04

-- ============================================================================
-- PART 1: Fix activity_logs table to support upsert
-- ============================================================================

-- Add unique constraint to activity_logs to enable proper upserts
-- This allows one log per user per activity per date
ALTER TABLE public.activity_logs
ADD CONSTRAINT activity_logs_user_activity_date_unique
UNIQUE (user_id, activity_id, log_date);

-- ============================================================================
-- PART 2: Create Challenges System Tables
-- ============================================================================

-- Create challenge_status enum
CREATE TYPE challenge_status AS ENUM ('draft', 'active', 'completed', 'abandoned');

-- Create challenge_participant_status enum
CREATE TYPE challenge_participant_status AS ENUM ('invited', 'accepted', 'declined');

-- Create challenge_log_approval_status enum
CREATE TYPE challenge_log_approval_status AS ENUM ('pending', 'approved', 'rejected');

-- Main challenges table
CREATE TABLE public.challenges (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  start_date date NOT NULL,
  end_date date NOT NULL,
  status challenge_status DEFAULT 'draft',
  prize_amount decimal(10,2) DEFAULT 0.00,
  prize_currency text DEFAULT 'USD',
  is_public boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT challenges_pkey PRIMARY KEY (id),
  CONSTRAINT challenges_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT challenges_date_range_check CHECK (end_date >= start_date)
);

-- Challenge participants (accountability partners)
CREATE TABLE public.challenge_participants (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  challenge_id uuid NOT NULL,
  user_id uuid NOT NULL,
  role text NOT NULL CHECK (role IN ('creator', 'participant', 'accountability_partner')),
  status challenge_participant_status DEFAULT 'invited',
  joined_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT challenge_participants_pkey PRIMARY KEY (id),
  CONSTRAINT challenge_participants_challenge_id_fkey FOREIGN KEY (challenge_id) REFERENCES public.challenges(id) ON DELETE CASCADE,
  CONSTRAINT challenge_participants_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT challenge_participants_unique UNIQUE (challenge_id, user_id)
);

-- Challenge activities (which activities are part of this challenge)
CREATE TABLE public.challenge_activities (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  challenge_id uuid NOT NULL,
  activity_id uuid NOT NULL,
  is_required boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT challenge_activities_pkey PRIMARY KEY (id),
  CONSTRAINT challenge_activities_challenge_id_fkey FOREIGN KEY (challenge_id) REFERENCES public.challenges(id) ON DELETE CASCADE,
  CONSTRAINT challenge_activities_activity_id_fkey FOREIGN KEY (activity_id) REFERENCES public.discipline_activities(id) ON DELETE CASCADE,
  CONSTRAINT challenge_activities_unique UNIQUE (challenge_id, activity_id)
);

-- Challenge activity logs (separate from regular activity logs, with approval workflow)
CREATE TABLE public.challenge_activity_logs (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  challenge_id uuid NOT NULL,
  activity_log_id uuid NOT NULL,
  approval_status challenge_log_approval_status DEFAULT 'pending',
  approved_by uuid,
  approved_at timestamp with time zone,
  rejection_reason text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT challenge_activity_logs_pkey PRIMARY KEY (id),
  CONSTRAINT challenge_activity_logs_challenge_id_fkey FOREIGN KEY (challenge_id) REFERENCES public.challenges(id) ON DELETE CASCADE,
  CONSTRAINT challenge_activity_logs_activity_log_id_fkey FOREIGN KEY (activity_log_id) REFERENCES public.activity_logs(id) ON DELETE CASCADE,
  CONSTRAINT challenge_activity_logs_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES auth.users(id),
  CONSTRAINT challenge_activity_logs_unique UNIQUE (challenge_id, activity_log_id)
);

-- ============================================================================
-- PART 3: Create indexes for performance
-- ============================================================================

-- Challenges indexes
CREATE INDEX idx_challenges_user_id ON public.challenges(user_id);
CREATE INDEX idx_challenges_status ON public.challenges(status);
CREATE INDEX idx_challenges_dates ON public.challenges(start_date, end_date);

-- Challenge participants indexes
CREATE INDEX idx_challenge_participants_challenge_id ON public.challenge_participants(challenge_id);
CREATE INDEX idx_challenge_participants_user_id ON public.challenge_participants(user_id);

-- Challenge activities indexes
CREATE INDEX idx_challenge_activities_challenge_id ON public.challenge_activities(challenge_id);
CREATE INDEX idx_challenge_activities_activity_id ON public.challenge_activities(activity_id);

-- Challenge activity logs indexes
CREATE INDEX idx_challenge_activity_logs_challenge_id ON public.challenge_activity_logs(challenge_id);
CREATE INDEX idx_challenge_activity_logs_activity_log_id ON public.challenge_activity_logs(activity_log_id);
CREATE INDEX idx_challenge_activity_logs_approval_status ON public.challenge_activity_logs(approval_status);

-- ============================================================================
-- PART 4: Row Level Security (RLS) Policies
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_activity_logs ENABLE ROW LEVEL SECURITY;

-- Challenges policies
CREATE POLICY "Users can view their own challenges" ON public.challenges
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view public challenges" ON public.challenges
  FOR SELECT USING (is_public = true);

CREATE POLICY "Users can create challenges" ON public.challenges
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own challenges" ON public.challenges
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own challenges" ON public.challenges
  FOR DELETE USING (auth.uid() = user_id);

-- Challenge participants policies
CREATE POLICY "Participants can view their participations" ON public.challenge_participants
  FOR SELECT USING (
    auth.uid() = user_id OR
    EXISTS (SELECT 1 FROM public.challenges WHERE id = challenge_id AND user_id = auth.uid())
  );

CREATE POLICY "Challenge creators can add participants" ON public.challenge_participants
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.challenges WHERE id = challenge_id AND user_id = auth.uid())
  );

CREATE POLICY "Participants can update their own status" ON public.challenge_participants
  FOR UPDATE USING (auth.uid() = user_id);

-- Challenge activities policies
CREATE POLICY "Users can view challenge activities if they're participants" ON public.challenge_activities
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.challenge_participants
      WHERE challenge_id = challenge_activities.challenge_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Challenge creators can manage activities" ON public.challenge_activities
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.challenges WHERE id = challenge_id AND user_id = auth.uid())
  );

-- Challenge activity logs policies
CREATE POLICY "Users can view their challenge logs" ON public.challenge_activity_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.activity_logs
      WHERE id = activity_log_id AND user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.challenge_participants
      WHERE challenge_id = challenge_activity_logs.challenge_id
      AND user_id = auth.uid()
      AND role = 'accountability_partner'
    )
  );

CREATE POLICY "Users can create challenge logs for their activities" ON public.challenge_activity_logs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.activity_logs
      WHERE id = activity_log_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Accountability partners can update approval status" ON public.challenge_activity_logs
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.challenge_participants
      WHERE challenge_id = challenge_activity_logs.challenge_id
      AND user_id = auth.uid()
      AND role = 'accountability_partner'
    )
  );

-- ============================================================================
-- PART 5: Comments
-- ============================================================================

COMMENT ON TABLE public.challenges IS 'User-created challenges with commitment and accountability';
COMMENT ON TABLE public.challenge_participants IS 'Users participating in challenges, including accountability partners';
COMMENT ON TABLE public.challenge_activities IS 'Activities that are part of a challenge';
COMMENT ON TABLE public.challenge_activity_logs IS 'Activity logs submitted for challenges, requiring approval';
