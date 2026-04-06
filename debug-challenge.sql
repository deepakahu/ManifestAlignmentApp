-- Debug script to check challenge setup
-- Run this in Supabase SQL Editor

-- 1. Check challenge status
SELECT id, title, status, start_date, end_date
FROM challenges
WHERE title = 'Daily 1500';

-- 2. Check challenge activities
SELECT
  ca.challenge_id,
  ca.activity_id,
  da.title as activity_title,
  da.frequency_type,
  da.frequency_config,
  da.is_active
FROM challenge_activities ca
JOIN discipline_activities da ON ca.activity_id = da.id
JOIN challenges c ON ca.challenge_id = c.id
WHERE c.title = 'Daily 1500';

-- 3. Check if any challenge_activity_logs exist
SELECT
  cal.*,
  al.log_date,
  al.status as log_status
FROM challenge_activity_logs cal
JOIN activity_logs al ON cal.activity_log_id = al.id
JOIN challenges c ON cal.challenge_id = c.id
WHERE c.title = 'Daily 1500'
ORDER BY al.log_date DESC;
