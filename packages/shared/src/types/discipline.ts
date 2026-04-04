/**
 * Discipline System Types
 * Phase 2: Categories, Goals, Activities, Logs, Social Features
 */

// =====================================================
// SUBSCRIPTION TIERS
// =====================================================
export type SubscriptionTier = 'free' | 'pro';

export interface SubscriptionInfo {
  tier: SubscriptionTier;
  expiresAt?: Date;
}

// =====================================================
// CATEGORY
// =====================================================
export interface Category {
  id: string;
  userId: string;
  name: string;
  description?: string;
  icon?: string; // emoji or icon name
  color: string;
  orderIndex: number;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CategoryDB {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  icon?: string;
  color: string;
  order_index: number;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

// =====================================================
// GOAL (SMART Framework)
// =====================================================
export type GoalStatus = 'active' | 'completed' | 'paused' | 'archived';

export interface Goal {
  id: string;
  userId: string;
  categoryId?: string;
  title: string;
  description?: string;

  // SMART framework
  specific?: string;
  measurable?: string;
  achievable?: string;
  relevant?: string;
  timeBound?: string;

  // Progress
  targetDate?: Date;
  status: GoalStatus;
  progressPercentage: number;
  manualProgressOverride?: number;
  useManualProgress: boolean;

  // Metadata
  orderIndex: number;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export interface GoalDB {
  id: string;
  user_id: string;
  category_id?: string | null;
  title: string;
  description?: string | null;
  specific?: string | null;
  measurable?: string | null;
  achievable?: string | null;
  relevant?: string | null;
  time_bound?: string | null;
  target_date?: string | null;
  status: GoalStatus;
  progress_percentage: number;
  manual_progress_override?: number | null;
  use_manual_progress: boolean;
  order_index: number;
  created_at: string;
  updated_at: string;
  completed_at?: string | null;
}

// =====================================================
// DISCIPLINE ACTIVITY
// =====================================================
export type TrackingType = 'boolean' | 'number' | 'multiselect' | 'text';
export type FrequencyType = 'daily' | 'specific_days' | 'custom';

// Target configurations for different tracking types
export type BooleanTargetConfig = {
  target: boolean;
};

export type NumberTargetConfig = {
  target: number;
  unit: string;
  min?: number;
  max?: number;
};

export type MultiSelectTargetConfig = {
  options: string[];
  minSelect: number;
  maxSelect: number;
};

export type TextTargetConfig = {
  placeholder: string;
  required: boolean;
};

export type TargetConfig =
  | BooleanTargetConfig
  | NumberTargetConfig
  | MultiSelectTargetConfig
  | TextTargetConfig;

// Frequency configurations
export type DailyFrequencyConfig = Record<string, never>; // Empty object

export type SpecificDaysFrequencyConfig = {
  days: number[]; // 0=Sunday, 6=Saturday
};

export type CustomFrequencyConfig = {
  dates: string[]; // ISO date strings
};

export type FrequencyConfig =
  | DailyFrequencyConfig
  | SpecificDaysFrequencyConfig
  | CustomFrequencyConfig;

// Reminder channels
export interface ReminderChannels {
  push: boolean;
  alarm: boolean;
  sms: boolean;
  email: boolean;
}

export interface DisciplineActivity {
  id: string;
  userId: string;
  goalId: string;
  title: string;
  description?: string;

  // Tracking configuration
  trackingType: TrackingType;
  targetConfig: TargetConfig;
  frequencyType: FrequencyType;
  frequencyConfig: FrequencyConfig;

  // Reminders
  reminderEnabled: boolean;
  reminderTime?: string; // HH:MM:SS format
  reminderChannels: ReminderChannels;

  // Streak tracking
  currentStreak: number;
  longestStreak: number;
  streakFreezeAvailable: boolean;
  lastFreezeUsedAt?: Date;

  // Metadata
  isActive: boolean;
  orderIndex: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface DisciplineActivityDB {
  id: string;
  user_id: string;
  goal_id: string;
  title: string;
  description?: string | null;
  tracking_type: TrackingType;
  target_config: TargetConfig;
  frequency_type: FrequencyType;
  frequency_config: FrequencyConfig;
  reminder_enabled: boolean;
  reminder_time?: string | null;
  reminder_channels: ReminderChannels;
  current_streak: number;
  longest_streak: number;
  streak_freeze_available: boolean;
  last_freeze_used_at?: string | null;
  is_active: boolean;
  order_index: number;
  created_at: string;
  updated_at: string;
}

// =====================================================
// ACTIVITY LOG
// =====================================================
export type ActivityStatus = 'good' | 'neutral' | 'bad' | 'skipped';

// Log values for different tracking types
export type BooleanLogValue = {
  completed: boolean;
};

export type NumberLogValue = {
  value: number;
  unit: string;
};

export type MultiSelectLogValue = {
  selected: string[];
};

export type TextLogValue = {
  text: string;
};

export type LogValue =
  | BooleanLogValue
  | NumberLogValue
  | MultiSelectLogValue
  | TextLogValue;

export interface ActivityLog {
  id: string;
  userId: string;
  activityId: string;
  logDate: Date;
  status: ActivityStatus;
  value: LogValue;
  notes?: string;
  loggedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ActivityLogDB {
  id: string;
  user_id: string;
  activity_id: string;
  log_date: string;
  status: ActivityStatus;
  value: LogValue;
  notes?: string;
  logged_at: string;
  created_at: string;
  updated_at: string;
}

// =====================================================
// DAILY REMINDERS (Global)
// =====================================================
export interface DailyReminder {
  id: string;
  userId: string;
  isEnabled: boolean;
  reminderTime: string; // HH:MM:SS format
  reminderChannels: ReminderChannels;
  reminderDays: number[]; // 0=Sunday, 6=Saturday
  customMessage: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DailyReminderDB {
  id: string;
  user_id: string;
  is_enabled: boolean;
  reminder_time: string;
  reminder_channels: ReminderChannels;
  reminder_days: number[];
  custom_message: string;
  created_at: string;
  updated_at: string;
}

// =====================================================
// SOCIAL FEATURES
// =====================================================
export type FriendshipStatus = 'pending' | 'accepted' | 'blocked';

export interface DisciplineFriend {
  id: string;
  userId: string;
  friendId: string;
  status: FriendshipStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface DisciplineFriendDB {
  id: string;
  user_id: string;
  friend_id: string;
  status: FriendshipStatus;
  created_at: string;
  updated_at: string;
}

export type SharingLevel = 'public' | 'friends' | 'private';

export interface SharedProgress {
  id: string;
  userId: string;
  sharedWith: SharingLevel;
  shareCategories: boolean;
  shareGoals: boolean;
  shareCompletionRate: boolean;
  shareStreaks: boolean;
  shareActivityNames: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SharedProgressDB {
  id: string;
  user_id: string;
  shared_with: SharingLevel;
  share_categories: boolean;
  share_goals: boolean;
  share_completion_rate: boolean;
  share_streaks: boolean;
  share_activity_names: boolean;
  created_at: string;
  updated_at: string;
}

export type CompetitionType =
  | 'completion_rate'
  | 'streak'
  | 'total_activities'
  | 'category_specific';

export interface DisciplineCompetition {
  id: string;
  createdBy: string;
  name: string;
  description?: string;
  competitionType: CompetitionType;
  categoryId?: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface DisciplineCompetitionDB {
  id: string;
  created_by: string;
  name: string;
  description?: string | null;
  competition_type: CompetitionType;
  category_id?: string | null;
  start_date: string;
  end_date: string;
  is_active: boolean;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface CompetitionParticipant {
  id: string;
  competitionId: string;
  userId: string;
  currentScore: number;
  rank?: number;
  lastUpdatedAt: Date;
  joinedAt: Date;
}

export interface CompetitionParticipantDB {
  id: string;
  competition_id: string;
  user_id: string;
  current_score: number;
  rank?: number;
  last_updated_at: string;
  joined_at: string;
}

// =====================================================
// ANALYTICS & STATISTICS
// =====================================================
export interface DisciplineStats {
  totalCategories: number;
  totalGoals: number;
  activeGoals: number;
  completedGoals: number;
  totalActivities: number;
  activeActivities: number;
  todayCompletionRate: number;
  weekCompletionRate: number;
  monthCompletionRate: number;
  longestStreak: number;
  currentStreak: number;
}

export interface WeeklyStats {
  date: Date;
  totalActivities: number;
  completedActivities: number;
  completionRate: number;
}

export interface CategoryProgress {
  categoryId: string;
  categoryName: string;
  goalCount: number;
  activityCount: number;
  completionRate: number;
  averageStreak: number;
}

export interface ActivityStreak {
  activityId: string;
  activityName: string;
  currentStreak: number;
  longestStreak: number;
  lastLoggedAt?: Date;
}

// =====================================================
// FORMS & UI HELPERS
// =====================================================
export interface CategoryFormData {
  name: string;
  description?: string;
  icon?: string;
  color: string;
}

export interface GoalFormData {
  categoryId?: string;
  title: string;
  description?: string;
  specific?: string;
  measurable?: string;
  achievable?: string;
  relevant?: string;
  timeBound?: string;
  targetDate?: Date;
}

export interface ActivityFormData {
  goalId: string;
  title: string;
  description?: string;
  trackingType: TrackingType;
  targetConfig: TargetConfig;
  frequencyType: FrequencyType;
  frequencyConfig: FrequencyConfig;
  reminderEnabled: boolean;
  reminderTime?: string;
  reminderChannels: ReminderChannels;
}

export interface ActivityLogFormData {
  activityId: string;
  logDate: Date;
  status: ActivityStatus;
  value: LogValue;
  notes?: string;
}

// =====================================================
// TYPE GUARDS
// =====================================================
export function isBooleanTarget(config: TargetConfig): config is BooleanTargetConfig {
  return 'target' in config && typeof config.target === 'boolean';
}

export function isNumberTarget(config: TargetConfig): config is NumberTargetConfig {
  return 'target' in config && typeof config.target === 'number' && 'unit' in config;
}

export function isMultiSelectTarget(config: TargetConfig): config is MultiSelectTargetConfig {
  return 'options' in config && Array.isArray(config.options);
}

export function isTextTarget(config: TargetConfig): config is TextTargetConfig {
  return 'placeholder' in config && typeof config.placeholder === 'string';
}

export function isBooleanLog(value: LogValue): value is BooleanLogValue {
  return 'completed' in value && typeof value.completed === 'boolean';
}

export function isNumberLog(value: LogValue): value is NumberLogValue {
  return 'value' in value && typeof value.value === 'number' && 'unit' in value;
}

export function isMultiSelectLog(value: LogValue): value is MultiSelectLogValue {
  return 'selected' in value && Array.isArray(value.selected);
}

export function isTextLog(value: LogValue): value is TextLogValue {
  return 'text' in value && typeof value.text === 'string';
}
