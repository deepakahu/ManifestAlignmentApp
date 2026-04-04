/**
 * Shared types for Manifestation Platform
 * Used by both mobile (React Native) and web (Next.js) applications
 */

// ============================================
// MOOD TYPES
// ============================================

export type MoodLevel = 1 | 2 | 3 | 4 | 5;

export interface MoodEntry {
  id: string;
  mood: MoodLevel;
  notes: string;
  timestamp: Date;
  tags: string[];
  alarmId?: string;
  alarmName?: string;
  manifestationRead?: boolean;
}

/** Cloud representation with snake_case for Supabase */
export interface MoodEntryDB {
  id: string;
  user_id: string;
  mood: number;
  notes: string;
  tags: string[];
  timestamp: string; // ISO string
  alarm_id: string | null;
  alarm_name: string | null;
  manifestation_read: boolean;
  local_id: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

// ============================================
// MANIFESTATION TYPES
// ============================================

export type ManifestationCategory =
  | 'Personal'
  | 'Career'
  | 'Health'
  | 'Relationships'
  | 'Financial'
  | 'Spiritual';

export interface ManifestationReadEntry {
  readAt: Date;
  moodEntryId?: string;
  readDuration?: number; // in seconds
}

export interface ManifestationEntry {
  id: string;
  title: string;
  description: string;
  category: ManifestationCategory | string;
  targetDate?: Date;
  isCompleted: boolean;
  createdAt: Date;
  completedAt?: Date;
  visualizationNotes?: string;
  affirmations?: string[];
  readHistory?: ManifestationReadEntry[];
}

/** Cloud representation with snake_case for Supabase */
export interface ManifestationEntryDB {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category: string;
  target_date: string | null;
  is_completed: boolean;
  completed_at: string | null;
  visualization_notes: string | null;
  affirmations: string[];
  local_id: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface ManifestationReadHistoryDB {
  id: string;
  manifestation_id: string;
  user_id: string;
  read_at: string;
  mood_entry_id: string | null;
  read_duration_seconds: number | null;
  created_at: string;
}

// ============================================
// ALARM TYPES
// ============================================

export type SoundType =
  | 'default'
  | 'ambient-piano'
  | 'singing-bowl'
  | 'singing-bowl-hit'
  | 'tibetan-bowl-low'
  | 'calm-music'
  | 'relaxing-guitar';

export interface AlarmInterval {
  hours: number;
  minutes: number;
}

export interface Alarm {
  id: string;
  name: string;
  interval: AlarmInterval | 'test_mode';
  dayStartTime: string; // HH:MM format
  dayEndTime: string; // HH:MM format
  activeDays: boolean[]; // [Sun, Mon, Tue, Wed, Thu, Fri, Sat]
  isEnabled: boolean;
  createdAt: Date;
  lastTriggered?: Date;
  nextTrigger?: Date;
  testInterval?: number; // For test mode: 1-5 minutes
  soundType?: SoundType;
}

/** Cloud representation with snake_case for Supabase */
export interface AlarmDB {
  id: string;
  user_id: string;
  name: string;
  interval_hours: number;
  interval_minutes: number;
  is_test_mode: boolean;
  test_interval_minutes: number;
  day_start_time: string; // TIME format
  day_end_time: string;
  active_days: boolean[];
  is_enabled: boolean;
  last_triggered_at: string | null;
  next_trigger_at: string | null;
  sound_type: string;
  local_id: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

// ============================================
// USER TYPES
// ============================================

export type Theme = 'light' | 'dark';
export type ReminderFrequency = 'daily' | 'weekly' | 'custom';
export type SubscriptionStatus =
  | 'trial'
  | 'trial_expired'
  | 'active_monthly'
  | 'active_lifetime'
  | 'active_coupon'
  | 'expired';

export interface UserPreferences {
  notificationsEnabled: boolean;
  soundEnabled: boolean;
  theme: Theme;
  reminderFrequency?: ReminderFrequency;
  reminderTime?: string;
}

export interface User {
  id: string;
  name: string;
  email?: string;
  createdAt: Date;
  preferences: UserPreferences;
}

/** Cloud representation with snake_case for Supabase profiles table */
export interface ProfileDB {
  id: string;
  display_name: string | null;
  email: string | null;
  avatar_url: string | null;
  timezone: string;
  notifications_enabled: boolean;
  sound_enabled: boolean;
  theme: string;
  reminder_frequency: string | null;
  reminder_time: string | null;
  subscription_status: string;
  subscription_expiry: string | null;
  trial_start_date: string | null;
  trial_end_date: string | null;
  coupon_code: string | null;
  coupon_activation_date: string | null;
  coupon_expiry_date: string | null;
  has_lifetime_access: boolean;
  local_data_migrated: boolean;
  local_migration_date: string | null;
  created_at: string;
  updated_at: string;
  last_seen_at: string | null;
}

// ============================================
// APP STATE TYPES
// ============================================

export interface AppState {
  user: User | null;
  moodEntries: MoodEntry[];
  manifestationEntries: ManifestationEntry[];
  alarms: Alarm[];
  isLoading: boolean;
}

// ============================================
// SYNC TYPES
// ============================================

export type SyncOperation = 'INSERT' | 'UPDATE' | 'DELETE';
export type SyncStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface SyncQueueItem {
  id: string;
  tableName: string;
  recordId: string;
  operation: SyncOperation;
  payload: unknown;
  localTimestamp: Date;
  status: SyncStatus;
  retryCount: number;
  lastError?: string;
}

export interface SyncQueueItemDB {
  id: string;
  user_id: string;
  table_name: string;
  record_id: string;
  operation: string;
  payload: unknown;
  local_timestamp: string;
  status: string;
  retry_count: number;
  last_error: string | null;
  processed_at: string | null;
  created_at: string;
}

// ============================================
// MIGRATION TYPES
// ============================================

export interface MigrationResult {
  success: boolean;
  migratedCounts: {
    moodEntries: number;
    manifestations: number;
    alarms: number;
  };
  conflicts: MigrationConflict[];
  errors: string[];
}

export interface MigrationConflict {
  type: 'mood' | 'manifestation' | 'alarm';
  localItem: unknown;
  cloudItem: unknown;
  resolution?: 'keep_local' | 'keep_cloud' | 'merge';
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface ApiResponse<T> {
  data: T | null;
  error: ApiError | null;
}

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// ============================================
// DISCIPLINE SYSTEM TYPES (PHASE 2)
// ============================================

export * from './discipline';
