-- =====================================================
-- PHASE 2: DISCIPLINE TRACKING SYSTEM
-- Based on Atomic Habits principles
-- =====================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 0. UPDATE PROFILES TABLE FOR SUBSCRIPTION TIERS
-- =====================================================
DO $$
BEGIN
    -- Add subscription_tier column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'profiles' AND column_name = 'subscription_tier') THEN
        ALTER TABLE profiles ADD COLUMN subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro'));
    END IF;

    -- Add subscription_expires_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'profiles' AND column_name = 'subscription_expires_at') THEN
        ALTER TABLE profiles ADD COLUMN subscription_expires_at TIMESTAMPTZ;
    END IF;
END $$;

-- =====================================================
-- 1. CATEGORIES TABLE
-- Custom categories for organizing goals (Spiritual, Health, Career, etc.)
-- Free users: 5 categories max, Pro users: unlimited
-- =====================================================
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT, -- emoji or icon name
    color TEXT DEFAULT '#6366f1', -- hex color for theming
    order_index INTEGER DEFAULT 0,
    is_archived BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT unique_category_per_user UNIQUE(user_id, name)
);

-- Index for faster queries
CREATE INDEX idx_categories_user_id ON categories(user_id);
CREATE INDEX idx_categories_order ON categories(user_id, order_index) WHERE NOT is_archived;

-- RLS Policies
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own categories"
    ON categories FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own categories"
    ON categories FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own categories"
    ON categories FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own categories"
    ON categories FOR DELETE
    USING (auth.uid() = user_id);

-- =====================================================
-- 2. GOALS TABLE
-- SMART goals within categories
-- =====================================================
CREATE TYPE goal_status AS ENUM ('active', 'completed', 'paused', 'archived');

CREATE TABLE IF NOT EXISTS goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,

    -- Basic info
    title TEXT NOT NULL,
    description TEXT,

    -- SMART framework
    specific TEXT, -- What exactly do you want to achieve?
    measurable TEXT, -- How will you measure success?
    achievable TEXT, -- Is it realistic? What resources do you need?
    relevant TEXT, -- Why is this important? How does it align with your values?
    time_bound TEXT, -- When do you want to achieve this by?

    -- Dates and status
    target_date DATE,
    status goal_status DEFAULT 'active',
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    manual_progress_override INTEGER, -- Manual override for progress (0-100)
    use_manual_progress BOOLEAN DEFAULT false, -- If true, use manual override instead of auto-calculation

    -- Metadata
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,

    CONSTRAINT valid_completed_at CHECK (
        (status = 'completed' AND completed_at IS NOT NULL) OR
        (status != 'completed' AND completed_at IS NULL)
    )
);

-- Indexes
CREATE INDEX idx_goals_user_id ON goals(user_id);
CREATE INDEX idx_goals_category_id ON goals(category_id);
CREATE INDEX idx_goals_status ON goals(user_id, status);
CREATE INDEX idx_goals_target_date ON goals(user_id, target_date) WHERE status = 'active';

-- RLS Policies
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own goals"
    ON goals FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own goals"
    ON goals FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own goals"
    ON goals FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own goals"
    ON goals FOR DELETE
    USING (auth.uid() = user_id);

-- =====================================================
-- 3. DISCIPLINE ACTIVITIES TABLE
-- Daily habits/activities inspired by Atomic Habits
-- =====================================================
CREATE TYPE tracking_type AS ENUM ('boolean', 'number', 'multiselect', 'text');
CREATE TYPE frequency_type AS ENUM ('daily', 'specific_days', 'custom');

CREATE TABLE IF NOT EXISTS discipline_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    goal_id UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,

    -- Basic info
    title TEXT NOT NULL,
    description TEXT,

    -- Tracking configuration
    tracking_type tracking_type NOT NULL DEFAULT 'boolean',
    target_config JSONB NOT NULL DEFAULT '{}', -- Target configuration based on tracking_type
    /*
        Examples:
        boolean: { "target": true }
        number: { "target": 4, "unit": "rounds", "min": 0, "max": 10 }
        multiselect: { "options": ["Morning", "Afternoon", "Evening"], "minSelect": 1, "maxSelect": 3 }
        text: { "placeholder": "What did you learn today?", "required": false }
    */

    -- Frequency configuration
    frequency_type frequency_type DEFAULT 'daily',
    frequency_config JSONB DEFAULT '{}', -- Days of week: [0,1,2,3,4,5,6] or custom schedule
    /*
        Examples:
        daily: {}
        specific_days: { "days": [1, 2, 3, 4, 5] } // Mon-Fri
        custom: { "dates": ["2024-01-01", "2024-01-15"] }
    */

    -- Reminder configuration
    reminder_enabled BOOLEAN DEFAULT false,
    reminder_time TIME, -- Time of day for reminder
    reminder_channels JSONB DEFAULT '{"push": true, "alarm": false, "sms": false, "email": false}', -- Which channels to use
    /*
        Example:
        {
            "push": true,      // Push notification
            "alarm": false,    // System alarm
            "sms": false,      // SMS message
            "email": false     // Email reminder
        }
    */

    -- Streak tracking
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    streak_freeze_available BOOLEAN DEFAULT true, -- Can use 1-day forgiveness
    last_freeze_used_at DATE, -- When freeze was last used

    -- Metadata
    is_active BOOLEAN DEFAULT true,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_activities_user_id ON discipline_activities(user_id);
CREATE INDEX idx_activities_goal_id ON discipline_activities(goal_id);
CREATE INDEX idx_activities_active ON discipline_activities(user_id, is_active);

-- RLS Policies
ALTER TABLE discipline_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own activities"
    ON discipline_activities FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own activities"
    ON discipline_activities FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own activities"
    ON discipline_activities FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own activities"
    ON discipline_activities FOR DELETE
    USING (auth.uid() = user_id);

-- =====================================================
-- 4. ACTIVITY LOGS TABLE
-- Daily tracking of activity completion
-- =====================================================
CREATE TYPE activity_status AS ENUM ('good', 'neutral', 'bad', 'skipped');

CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    activity_id UUID NOT NULL REFERENCES discipline_activities(id) ON DELETE CASCADE,

    -- Log data
    log_date DATE NOT NULL,
    status activity_status NOT NULL,
    value JSONB DEFAULT '{}', -- Actual value logged based on tracking_type
    /*
        Examples:
        boolean: { "completed": true }
        number: { "value": 4, "unit": "rounds" }
        multiselect: { "selected": ["Morning", "Afternoon"] }
        text: { "text": "Had a great meditation session focusing on breath" }
    */
    notes TEXT, -- Optional user notes

    -- Metadata
    logged_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT unique_log_per_day UNIQUE(user_id, activity_id, log_date)
);

-- Indexes
CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_activity_id ON activity_logs(activity_id);
CREATE INDEX idx_activity_logs_date ON activity_logs(user_id, log_date DESC);
CREATE INDEX idx_activity_logs_date_range ON activity_logs(user_id, log_date);

-- RLS Policies
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own logs"
    ON activity_logs FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own logs"
    ON activity_logs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own logs"
    ON activity_logs FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own logs"
    ON activity_logs FOR DELETE
    USING (auth.uid() = user_id);

-- =====================================================
-- 5. SOCIAL FEATURES
-- =====================================================

-- Friends/Connections table
CREATE TABLE IF NOT EXISTS discipline_friends (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    friend_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT unique_friendship UNIQUE(user_id, friend_id),
    CONSTRAINT no_self_friendship CHECK (user_id != friend_id)
);

CREATE INDEX idx_friends_user_id ON discipline_friends(user_id);
CREATE INDEX idx_friends_friend_id ON discipline_friends(friend_id);
CREATE INDEX idx_friends_status ON discipline_friends(user_id, status);

-- RLS Policies
ALTER TABLE discipline_friends ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own friendships"
    ON discipline_friends FOR SELECT
    USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can create friendships"
    ON discipline_friends FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own friendships"
    ON discipline_friends FOR UPDATE
    USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can delete own friendships"
    ON discipline_friends FOR DELETE
    USING (auth.uid() = user_id);

-- Shared Progress table (for sharing stats with friends)
CREATE TABLE IF NOT EXISTS shared_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    shared_with TEXT DEFAULT 'friends' CHECK (shared_with IN ('public', 'friends', 'private')),

    -- What to share
    share_categories BOOLEAN DEFAULT true,
    share_goals BOOLEAN DEFAULT true,
    share_completion_rate BOOLEAN DEFAULT true,
    share_streaks BOOLEAN DEFAULT true,
    share_activity_names BOOLEAN DEFAULT false, -- Privacy: don't show activity details by default

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT one_setting_per_user UNIQUE(user_id)
);

-- RLS Policies
ALTER TABLE shared_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sharing settings"
    ON shared_progress FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own sharing settings"
    ON shared_progress FOR ALL
    USING (auth.uid() = user_id);

-- Leaderboard/Competition table
CREATE TABLE IF NOT EXISTS discipline_competitions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,

    -- Competition settings
    competition_type TEXT DEFAULT 'completion_rate' CHECK (
        competition_type IN ('completion_rate', 'streak', 'total_activities', 'category_specific')
    ),
    category_id UUID REFERENCES categories(id) ON DELETE CASCADE, -- For category-specific competitions
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,

    -- Status
    is_active BOOLEAN DEFAULT true,
    is_public BOOLEAN DEFAULT false, -- Public leaderboard or private among friends

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT valid_date_range CHECK (end_date > start_date)
);

CREATE INDEX idx_competitions_created_by ON discipline_competitions(created_by);
CREATE INDEX idx_competitions_dates ON discipline_competitions(start_date, end_date) WHERE is_active;

-- RLS Policies
ALTER TABLE discipline_competitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view public competitions"
    ON discipline_competitions FOR SELECT
    USING (is_public = true OR created_by = auth.uid());

CREATE POLICY "Users can create competitions"
    ON discipline_competitions FOR INSERT
    WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own competitions"
    ON discipline_competitions FOR UPDATE
    USING (auth.uid() = created_by);

-- Competition participants
CREATE TABLE IF NOT EXISTS competition_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    competition_id UUID NOT NULL REFERENCES discipline_competitions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Stats (calculated daily)
    current_score NUMERIC DEFAULT 0,
    rank INTEGER,
    last_updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Metadata
    joined_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT unique_participant UNIQUE(competition_id, user_id)
);

CREATE INDEX idx_participants_competition ON competition_participants(competition_id);
CREATE INDEX idx_participants_rank ON competition_participants(competition_id, rank);

-- RLS Policies
ALTER TABLE competition_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view competition participants"
    ON competition_participants FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM discipline_competitions
            WHERE id = competition_id AND (is_public = true OR created_by = auth.uid())
        )
        OR user_id = auth.uid()
    );

CREATE POLICY "Users can join competitions"
    ON competition_participants FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- 6. DAILY REMINDERS (Global setting)
-- =====================================================
CREATE TABLE IF NOT EXISTS daily_reminders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Reminder configuration
    is_enabled BOOLEAN DEFAULT true,
    reminder_time TIME NOT NULL DEFAULT '20:00:00', -- Default: 8 PM
    reminder_channels JSONB DEFAULT '{"push": true, "alarm": false, "sms": false, "email": false}',
    reminder_days INTEGER[] DEFAULT ARRAY[0,1,2,3,4,5,6], -- Days of week (0=Sun, 6=Sat)

    -- Message customization
    custom_message TEXT DEFAULT 'Time to track your daily activities!',

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT one_reminder_per_user UNIQUE(user_id)
);

-- RLS Policies
ALTER TABLE daily_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own reminders"
    ON daily_reminders FOR ALL
    USING (auth.uid() = user_id);

-- =====================================================
-- 7. HELPER FUNCTIONS
-- =====================================================

-- Function to get activity streak (with 1-day freeze support)
CREATE OR REPLACE FUNCTION get_activity_streak(activity_uuid UUID, user_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
    streak INTEGER := 0;
    check_date DATE := CURRENT_DATE;
    freeze_used BOOLEAN := false;
    da_record RECORD;
BEGIN
    -- Get activity record to check freeze availability
    SELECT * INTO da_record
    FROM discipline_activities
    WHERE id = activity_uuid AND user_id = user_uuid;

    IF NOT FOUND THEN
        RETURN 0;
    END IF;

    LOOP
        -- Check if log exists for this date with good/neutral status
        IF EXISTS (
            SELECT 1 FROM activity_logs
            WHERE activity_id = activity_uuid
            AND user_id = user_uuid
            AND log_date = check_date
            AND status IN ('good', 'neutral')
        ) THEN
            streak := streak + 1;
            check_date := check_date - INTERVAL '1 day';
        ELSE
            -- No log for this date
            -- Check if we can use freeze (1-day forgiveness)
            IF NOT freeze_used AND da_record.streak_freeze_available THEN
                -- Use freeze and continue
                freeze_used := true;
                check_date := check_date - INTERVAL '1 day';
            ELSE
                -- No freeze available or already used, break streak
                EXIT;
            END IF;
        END IF;
    END LOOP;

    RETURN streak;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can create more categories (tier limits)
CREATE OR REPLACE FUNCTION can_create_category(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    user_tier TEXT;
    category_count INTEGER;
BEGIN
    -- Get user's subscription tier
    SELECT subscription_tier INTO user_tier
    FROM profiles
    WHERE id = user_uuid;

    -- Count active (non-archived) categories
    SELECT COUNT(*) INTO category_count
    FROM categories
    WHERE user_id = user_uuid AND NOT is_archived;

    -- Free tier: max 5 categories
    IF user_tier = 'free' AND category_count >= 5 THEN
        RETURN false;
    END IF;

    -- Pro tier: unlimited
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate goal progress based on activity completion
CREATE OR REPLACE FUNCTION calculate_goal_progress(goal_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
    goal_record RECORD;
    total_activities INTEGER;
    completed_activities INTEGER;
    progress INTEGER;
BEGIN
    -- Get goal record
    SELECT * INTO goal_record
    FROM goals
    WHERE id = goal_uuid;

    IF NOT FOUND THEN
        RETURN 0;
    END IF;

    -- If manual override is enabled, return manual progress
    IF goal_record.use_manual_progress THEN
        RETURN COALESCE(goal_record.manual_progress_override, 0);
    END IF;

    -- Otherwise, auto-calculate from activities
    -- Count total active activities for this goal
    SELECT COUNT(*) INTO total_activities
    FROM discipline_activities
    WHERE goal_id = goal_uuid AND is_active = true;

    -- If no activities, return 0
    IF total_activities = 0 THEN
        RETURN 0;
    END IF;

    -- Count activities logged today with good/neutral status
    SELECT COUNT(DISTINCT al.activity_id) INTO completed_activities
    FROM activity_logs al
    JOIN discipline_activities da ON da.id = al.activity_id
    WHERE da.goal_id = goal_uuid
    AND da.is_active = true
    AND al.log_date = CURRENT_DATE
    AND al.status IN ('good', 'neutral');

    -- Calculate percentage
    progress := (completed_activities * 100) / total_activities;

    RETURN progress;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get weekly completion stats
CREATE OR REPLACE FUNCTION get_weekly_stats(user_uuid UUID, start_date DATE, end_date DATE)
RETURNS TABLE (
    date DATE,
    total_activities BIGINT,
    completed_activities BIGINT,
    completion_rate NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        d.date,
        COUNT(DISTINCT da.id) as total_activities,
        COUNT(DISTINCT CASE WHEN al.status IN ('good', 'neutral') THEN al.activity_id END) as completed_activities,
        ROUND(
            (COUNT(DISTINCT CASE WHEN al.status IN ('good', 'neutral') THEN al.activity_id END)::NUMERIC /
            NULLIF(COUNT(DISTINCT da.id), 0) * 100),
            1
        ) as completion_rate
    FROM generate_series(start_date, end_date, '1 day'::interval) d(date)
    CROSS JOIN discipline_activities da
    LEFT JOIN activity_logs al ON al.activity_id = da.id AND al.log_date = d.date
    WHERE da.user_id = user_uuid AND da.is_active = true
    GROUP BY d.date
    ORDER BY d.date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 8. TRIGGERS
-- =====================================================

-- Trigger to enforce category limit based on subscription tier
CREATE OR REPLACE FUNCTION check_category_limit()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT can_create_category(NEW.user_id) THEN
        RAISE EXCEPTION 'Category limit reached. Upgrade to Pro for unlimited categories.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_category_limit
    BEFORE INSERT ON categories
    FOR EACH ROW
    WHEN (NEW.is_archived = false)
    EXECUTE FUNCTION check_category_limit();

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_goals_updated_at BEFORE UPDATE ON goals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_activities_updated_at BEFORE UPDATE ON discipline_activities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_logs_updated_at BEFORE UPDATE ON activity_logs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-update goal completed_at when status changes to completed
CREATE OR REPLACE FUNCTION update_goal_completed_at()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        NEW.completed_at = NOW();
    ELSIF NEW.status != 'completed' THEN
        NEW.completed_at = NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_goal_completed_at BEFORE UPDATE ON goals
    FOR EACH ROW EXECUTE FUNCTION update_goal_completed_at();

-- Update activity streaks when logs are created/updated
CREATE OR REPLACE FUNCTION update_activity_streaks()
RETURNS TRIGGER AS $$
DECLARE
    new_streak INTEGER;
BEGIN
    -- Calculate current streak
    new_streak := get_activity_streak(NEW.activity_id, NEW.user_id);

    -- Update current_streak in discipline_activities
    UPDATE discipline_activities
    SET
        current_streak = new_streak,
        longest_streak = GREATEST(longest_streak, new_streak),
        updated_at = NOW()
    WHERE id = NEW.activity_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_streaks_on_log
    AFTER INSERT OR UPDATE ON activity_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_activity_streaks();

-- Update daily reminders trigger
CREATE TRIGGER update_daily_reminders_updated_at BEFORE UPDATE ON daily_reminders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update social tables triggers
CREATE TRIGGER update_friends_updated_at BEFORE UPDATE ON discipline_friends
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shared_progress_updated_at BEFORE UPDATE ON shared_progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_competitions_updated_at BEFORE UPDATE ON discipline_competitions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 9. INITIAL DATA (Optional - Default Categories)
-- =====================================================

-- Function to create default categories for new users
CREATE OR REPLACE FUNCTION create_default_categories(user_uuid UUID)
RETURNS VOID AS $$
BEGIN
    INSERT INTO categories (user_id, name, description, icon, color, order_index)
    VALUES
        (user_uuid, 'Spiritual', 'Spiritual growth and mindfulness practices', '🙏', '#9333ea', 0),
        (user_uuid, 'Health', 'Physical health and fitness', '💪', '#10b981', 1),
        (user_uuid, 'Career', 'Professional development and work', '💼', '#3b82f6', 2),
        (user_uuid, 'Finance', 'Money management and investments', '💰', '#f59e0b', 3),
        (user_uuid, 'Relationships', 'Family, friends, and connections', '❤️', '#ef4444', 4)
    ON CONFLICT (user_id, name) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create default categories when profile is created
CREATE OR REPLACE FUNCTION handle_new_user_discipline()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM create_default_categories(NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Only create trigger if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created_discipline'
    ) THEN
        CREATE TRIGGER on_auth_user_created_discipline
            AFTER INSERT ON profiles
            FOR EACH ROW EXECUTE FUNCTION handle_new_user_discipline();
    END IF;
END
$$;

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE categories IS 'Custom categories for organizing goals (e.g., Spiritual, Health, Career)';
COMMENT ON TABLE goals IS 'SMART goals within categories';
COMMENT ON TABLE discipline_activities IS 'Daily discipline activities inspired by Atomic Habits';
COMMENT ON TABLE activity_logs IS 'Daily tracking logs for activities';

COMMENT ON COLUMN discipline_activities.tracking_type IS 'Type of tracking: boolean (yes/no), number (quantity), multiselect (multiple options), text (notes)';
COMMENT ON COLUMN activity_logs.status IS 'Quality of completion: good (exceeded target), neutral (met target), bad (below target), skipped (not done)';
COMMENT ON COLUMN discipline_activities.streak_freeze_available IS '1-day forgiveness: allows one missed day without breaking streak';
COMMENT ON COLUMN goals.use_manual_progress IS 'If true, use manual_progress_override instead of auto-calculation from activities';
COMMENT ON TABLE daily_reminders IS 'Global daily reminder settings per user (push, alarm, SMS, email)';
COMMENT ON TABLE discipline_friends IS 'Friend connections for social features';
COMMENT ON TABLE shared_progress IS 'Privacy settings for sharing progress with friends';
COMMENT ON TABLE discipline_competitions IS 'Competitions and leaderboards among friends';

-- =====================================================
-- MIGRATION COMPLETE
-- Phase 2 features:
-- ✅ Categories with tier limits (Free: 5, Pro: unlimited)
-- ✅ SMART Goals with manual progress override
-- ✅ Activities with 4 tracking types
-- ✅ Activity logs with 4 status levels
-- ✅ Streak tracking with 1-day freeze
-- ✅ Multi-channel reminders (push, alarm, SMS, email)
-- ✅ Daily reminders (global setting)
-- ✅ Social features (friends, sharing, competitions)
-- =====================================================
