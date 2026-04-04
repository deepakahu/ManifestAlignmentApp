-- ============================================
-- Manifestation Platform - Initial Schema
-- Migration: 001_initial_schema
-- Created: 2026-04-03
-- ============================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- PROFILES TABLE (extends auth.users)
-- ============================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  email TEXT UNIQUE,
  avatar_url TEXT,
  timezone TEXT DEFAULT 'UTC',

  -- Preferences (migrated from local User.preferences)
  notifications_enabled BOOLEAN DEFAULT true,
  sound_enabled BOOLEAN DEFAULT true,
  theme TEXT DEFAULT 'light' CHECK (theme IN ('light', 'dark')),
  reminder_frequency TEXT CHECK (reminder_frequency IN ('daily', 'weekly', 'custom')),
  reminder_time TIME,

  -- Subscription tracking
  subscription_status TEXT DEFAULT 'trial' CHECK (subscription_status IN (
    'trial', 'trial_expired', 'active_monthly', 'active_lifetime', 'active_coupon', 'expired'
  )),
  subscription_expiry TIMESTAMPTZ,
  trial_start_date TIMESTAMPTZ,
  trial_end_date TIMESTAMPTZ,
  coupon_code TEXT,
  coupon_activation_date TIMESTAMPTZ,
  coupon_expiry_date TIMESTAMPTZ,
  has_lifetime_access BOOLEAN DEFAULT false,

  -- Migration tracking
  local_data_migrated BOOLEAN DEFAULT false,
  local_migration_date TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- ============================================
-- ALARMS TABLE (created first due to FK references)
-- ============================================

CREATE TABLE IF NOT EXISTS public.alarms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- Core alarm data
  name TEXT NOT NULL,
  interval_hours INTEGER DEFAULT 0 CHECK (interval_hours >= 0 AND interval_hours <= 23),
  interval_minutes INTEGER DEFAULT 0 CHECK (interval_minutes >= 0 AND interval_minutes <= 59),
  is_test_mode BOOLEAN DEFAULT false,
  test_interval_minutes INTEGER DEFAULT 5 CHECK (test_interval_minutes >= 1 AND test_interval_minutes <= 5),

  -- Time window
  day_start_time TIME NOT NULL DEFAULT '08:00',
  day_end_time TIME NOT NULL DEFAULT '22:00',
  active_days BOOLEAN[] NOT NULL DEFAULT '{true,true,true,true,true,true,true}',

  -- Status
  is_enabled BOOLEAN DEFAULT true,
  last_triggered_at TIMESTAMPTZ,
  next_trigger_at TIMESTAMPTZ,

  -- Sound
  sound_type TEXT DEFAULT 'default',

  -- Migration tracking
  local_id TEXT,
  migrated_from_local BOOLEAN DEFAULT false,

  -- Sync tracking
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  synced_at TIMESTAMPTZ,

  -- Soft delete
  deleted_at TIMESTAMPTZ,

  -- Constraint: active_days must have exactly 7 elements
  CONSTRAINT active_days_length CHECK (array_length(active_days, 1) = 7)
);

CREATE INDEX IF NOT EXISTS idx_alarms_user_id ON public.alarms(user_id);
CREATE INDEX IF NOT EXISTS idx_alarms_enabled ON public.alarms(is_enabled) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_alarms_local_id ON public.alarms(local_id) WHERE local_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_alarms_next_trigger ON public.alarms(next_trigger_at) WHERE is_enabled = true AND deleted_at IS NULL;

-- ============================================
-- MOOD ENTRIES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.mood_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- Core mood data
  mood INTEGER NOT NULL CHECK (mood >= 1 AND mood <= 5),
  notes TEXT DEFAULT '',
  tags TEXT[] DEFAULT '{}',
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Alarm association
  alarm_id UUID REFERENCES public.alarms(id) ON DELETE SET NULL,
  alarm_name TEXT,

  -- Manifestation reading tracking
  manifestation_read BOOLEAN DEFAULT false,

  -- Migration tracking
  local_id TEXT,
  migrated_from_local BOOLEAN DEFAULT false,

  -- Sync tracking
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  synced_at TIMESTAMPTZ,

  -- Soft delete
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_mood_entries_user_id ON public.mood_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_mood_entries_timestamp ON public.mood_entries(timestamp DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_mood_entries_alarm_id ON public.mood_entries(alarm_id) WHERE alarm_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_mood_entries_local_id ON public.mood_entries(local_id) WHERE local_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_mood_entries_user_timestamp ON public.mood_entries(user_id, timestamp DESC) WHERE deleted_at IS NULL;

-- ============================================
-- MANIFESTATION ENTRIES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.manifestation_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- Core manifestation data
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'Personal',
  target_date DATE,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  visualization_notes TEXT,
  affirmations TEXT[] DEFAULT '{}',

  -- Migration tracking
  local_id TEXT,
  migrated_from_local BOOLEAN DEFAULT false,

  -- Sync tracking
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  synced_at TIMESTAMPTZ,

  -- Soft delete
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_manifestation_entries_user_id ON public.manifestation_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_manifestation_entries_category ON public.manifestation_entries(category) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_manifestation_entries_completed ON public.manifestation_entries(is_completed) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_manifestation_entries_local_id ON public.manifestation_entries(local_id) WHERE local_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_manifestation_entries_user_created ON public.manifestation_entries(user_id, created_at DESC) WHERE deleted_at IS NULL;

-- ============================================
-- MANIFESTATION READ HISTORY TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.manifestation_read_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  manifestation_id UUID NOT NULL REFERENCES public.manifestation_entries(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  mood_entry_id UUID REFERENCES public.mood_entries(id) ON DELETE SET NULL,
  read_duration_seconds INTEGER CHECK (read_duration_seconds IS NULL OR read_duration_seconds >= 0),

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_manifestation_read_history_manifestation_id ON public.manifestation_read_history(manifestation_id);
CREATE INDEX IF NOT EXISTS idx_manifestation_read_history_user_id ON public.manifestation_read_history(user_id);
CREATE INDEX IF NOT EXISTS idx_manifestation_read_history_read_at ON public.manifestation_read_history(read_at DESC);

-- ============================================
-- SYNC QUEUE TABLE (for offline-first sync)
-- ============================================

CREATE TABLE IF NOT EXISTS public.sync_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  operation TEXT NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
  payload JSONB,
  local_timestamp TIMESTAMPTZ NOT NULL,

  -- Processing status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  retry_count INTEGER DEFAULT 0,
  last_error TEXT,
  processed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sync_queue_user_id ON public.sync_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_sync_queue_status ON public.sync_queue(status) WHERE status IN ('pending', 'processing');
CREATE INDEX IF NOT EXISTS idx_sync_queue_created ON public.sync_queue(created_at);

-- ============================================
-- CATEGORIES TABLE (future-ready for Phase 2)
-- ============================================

CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  color TEXT DEFAULT '#6366f1',
  icon TEXT,
  is_system BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- User-created categories must have user_id, system categories must not
  CONSTRAINT category_user_constraint CHECK (
    (is_system = true AND user_id IS NULL) OR
    (is_system = false AND user_id IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_categories_user_id ON public.categories(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_categories_system ON public.categories(is_system) WHERE is_system = true;

-- Insert default system categories
INSERT INTO public.categories (id, name, color, icon, is_system) VALUES
  ('10000000-0000-0000-0000-000000000001', 'Personal', '#6366f1', 'person', true),
  ('10000000-0000-0000-0000-000000000002', 'Career', '#059669', 'briefcase', true),
  ('10000000-0000-0000-0000-000000000003', 'Health', '#dc2626', 'heart', true),
  ('10000000-0000-0000-0000-000000000004', 'Relationships', '#ea580c', 'people', true),
  ('10000000-0000-0000-0000-000000000005', 'Financial', '#7c3aed', 'cash', true),
  ('10000000-0000-0000-0000-000000000006', 'Spiritual', '#0891b2', 'sparkles', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mood_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manifestation_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manifestation_read_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alarms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES - Profiles
-- ============================================

CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- ============================================
-- RLS POLICIES - Mood Entries
-- ============================================

CREATE POLICY "Users can view own mood entries" ON public.mood_entries
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own mood entries" ON public.mood_entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own mood entries" ON public.mood_entries
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own mood entries" ON public.mood_entries
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- RLS POLICIES - Manifestation Entries
-- ============================================

CREATE POLICY "Users can view own manifestations" ON public.manifestation_entries
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own manifestations" ON public.manifestation_entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own manifestations" ON public.manifestation_entries
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own manifestations" ON public.manifestation_entries
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- RLS POLICIES - Manifestation Read History
-- ============================================

CREATE POLICY "Users can view own read history" ON public.manifestation_read_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own read history" ON public.manifestation_read_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own read history" ON public.manifestation_read_history
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- RLS POLICIES - Alarms
-- ============================================

CREATE POLICY "Users can view own alarms" ON public.alarms
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own alarms" ON public.alarms
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own alarms" ON public.alarms
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own alarms" ON public.alarms
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- RLS POLICIES - Sync Queue
-- ============================================

CREATE POLICY "Users can view own sync queue" ON public.sync_queue
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert to own sync queue" ON public.sync_queue
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sync queue" ON public.sync_queue
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sync queue" ON public.sync_queue
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- RLS POLICIES - Categories
-- ============================================

CREATE POLICY "Users can view system and own categories" ON public.categories
  FOR SELECT USING (is_system = true OR auth.uid() = user_id);

CREATE POLICY "Users can insert own categories" ON public.categories
  FOR INSERT WITH CHECK (auth.uid() = user_id AND is_system = false);

CREATE POLICY "Users can update own categories" ON public.categories
  FOR UPDATE USING (auth.uid() = user_id AND is_system = false);

CREATE POLICY "Users can delete own categories" ON public.categories
  FOR DELETE USING (auth.uid() = user_id AND is_system = false);

-- ============================================
-- TRIGGERS & FUNCTIONS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all relevant tables
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_mood_entries_updated_at ON public.mood_entries;
CREATE TRIGGER update_mood_entries_updated_at
  BEFORE UPDATE ON public.mood_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_manifestation_entries_updated_at ON public.manifestation_entries;
CREATE TRIGGER update_manifestation_entries_updated_at
  BEFORE UPDATE ON public.manifestation_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_alarms_updated_at ON public.alarms;
CREATE TRIGGER update_alarms_updated_at
  BEFORE UPDATE ON public.alarms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_categories_updated_at ON public.categories;
CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- AUTO-CREATE PROFILE ON USER SIGNUP
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  trial_end TIMESTAMPTZ;
BEGIN
  trial_end := NOW() + INTERVAL '14 days';

  INSERT INTO public.profiles (
    id,
    email,
    display_name,
    trial_start_date,
    trial_end_date,
    subscription_status
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NOW(),
    trial_end,
    'trial'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to get user's mood statistics for a date range
CREATE OR REPLACE FUNCTION get_mood_stats(
  p_user_id UUID,
  p_start_date TIMESTAMPTZ,
  p_end_date TIMESTAMPTZ
)
RETURNS TABLE (
  total_entries BIGINT,
  average_mood NUMERIC,
  mood_distribution JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT as total_entries,
    ROUND(AVG(mood)::NUMERIC, 2) as average_mood,
    jsonb_object_agg(mood::TEXT, count) as mood_distribution
  FROM (
    SELECT mood, COUNT(*) as count
    FROM public.mood_entries
    WHERE user_id = p_user_id
      AND timestamp >= p_start_date
      AND timestamp <= p_end_date
      AND deleted_at IS NULL
    GROUP BY mood
  ) mood_counts;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to soft delete an entry (instead of hard delete)
CREATE OR REPLACE FUNCTION soft_delete_record(
  p_table_name TEXT,
  p_record_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_sql TEXT;
BEGIN
  v_sql := format('UPDATE public.%I SET deleted_at = NOW() WHERE id = %L', p_table_name, p_record_id);
  EXECUTE v_sql;
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- MIGRATION COMPLETE
-- ============================================

COMMENT ON TABLE public.profiles IS 'User profiles extending Supabase auth.users';
COMMENT ON TABLE public.mood_entries IS 'User mood tracking entries';
COMMENT ON TABLE public.manifestation_entries IS 'User manifestation/goal entries';
COMMENT ON TABLE public.manifestation_read_history IS 'Tracking when manifestations are read';
COMMENT ON TABLE public.alarms IS 'User alarm configurations';
COMMENT ON TABLE public.sync_queue IS 'Offline-first sync queue for mobile app';
COMMENT ON TABLE public.categories IS 'Manifestation categories (system and user-defined)';
