-- Migration: Add urgency_level and failure_consequence columns to challenges table
-- Date: 2026-04-05
-- Purpose: Support challenge editing restrictions and failure handling

-- Add urgency_level column (critical, high, medium)
ALTER TABLE challenges
ADD COLUMN urgency_level TEXT CHECK (urgency_level IN ('critical', 'high', 'medium')) DEFAULT 'medium';

-- Add failure_consequence column (charity, partner, platform, anti-charity)
ALTER TABLE challenges
ADD COLUMN failure_consequence TEXT CHECK (failure_consequence IN ('charity', 'partner', 'platform', 'anti-charity'));

-- Add comment to explain the columns
COMMENT ON COLUMN challenges.urgency_level IS 'Determines when challenge can be edited: critical (never after creation), high (until start date), medium (until 1 day before start)';
COMMENT ON COLUMN challenges.failure_consequence IS 'What happens to the stake if challenge fails: charity (donate to charity), partner (goes to accountability partner), platform (goes to platform), anti-charity (goes to opposed cause)';

-- Update existing challenges to have default medium urgency
UPDATE challenges
SET urgency_level = 'medium'
WHERE urgency_level IS NULL;

-- Verify the changes
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'challenges'
  AND column_name IN ('urgency_level', 'failure_consequence');
