/**
 * Shared constants for Manifestation Platform
 */

import type { MoodLevel, ManifestationCategory, SoundType } from '../types';

// ============================================
// MOOD CONSTANTS
// ============================================

export const MOOD_LABELS: Record<MoodLevel, string> = {
  1: 'Very Low',
  2: 'Low',
  3: 'Neutral',
  4: 'Good',
  5: 'Excellent',
};

export const MOOD_EMOJIS: Record<MoodLevel, string> = {
  1: '😢',
  2: '😔',
  3: '😐',
  4: '🙂',
  5: '😄',
};

export const MOOD_COLORS: Record<MoodLevel, string> = {
  1: '#ef4444', // red-500
  2: '#f97316', // orange-500
  3: '#eab308', // yellow-500
  4: '#22c55e', // green-500
  5: '#10b981', // emerald-500
};

export const DEFAULT_MOOD_TAGS = [
  'Work',
  'Family',
  'Health',
  'Relationships',
  'Exercise',
  'Sleep',
  'Gratitude',
  'Stress',
  'Achievement',
  'Social',
];

// ============================================
// MANIFESTATION CONSTANTS
// ============================================

export const MANIFESTATION_CATEGORIES: ManifestationCategory[] = [
  'Personal',
  'Career',
  'Health',
  'Relationships',
  'Financial',
  'Spiritual',
];

export const CATEGORY_COLORS: Record<ManifestationCategory, string> = {
  Personal: '#6366f1',    // indigo-500
  Career: '#059669',      // emerald-600
  Health: '#dc2626',      // red-600
  Relationships: '#ea580c', // orange-600
  Financial: '#7c3aed',   // violet-600
  Spiritual: '#0891b2',   // cyan-600
};

export const CATEGORY_ICONS: Record<ManifestationCategory, string> = {
  Personal: 'person',
  Career: 'briefcase',
  Health: 'heart',
  Relationships: 'people',
  Financial: 'cash',
  Spiritual: 'sparkles',
};

// ============================================
// ALARM CONSTANTS
// ============================================

export const SOUND_TYPES: SoundType[] = [
  'default',
  'ambient-piano',
  'singing-bowl',
  'singing-bowl-hit',
  'tibetan-bowl-low',
  'calm-music',
  'relaxing-guitar',
];

export const SOUND_LABELS: Record<SoundType, string> = {
  'default': 'Default',
  'ambient-piano': 'Ambient Piano',
  'singing-bowl': 'Singing Bowl',
  'singing-bowl-hit': 'Singing Bowl Hit',
  'tibetan-bowl-low': 'Tibetan Bowl Low',
  'calm-music': 'Calm Music',
  'relaxing-guitar': 'Relaxing Guitar',
};

export const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const DAY_LABELS_FULL = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

export const DEFAULT_ALARM_START_TIME = '08:00';
export const DEFAULT_ALARM_END_TIME = '22:00';
export const DEFAULT_ALARM_INTERVAL_HOURS = 2;
export const DEFAULT_ALARM_INTERVAL_MINUTES = 0;
export const DEFAULT_ACTIVE_DAYS = [true, true, true, true, true, true, true];

export const TEST_MODE_MIN_INTERVAL = 1; // minutes
export const TEST_MODE_MAX_INTERVAL = 5; // minutes
export const TEST_MODE_DEFAULT_INTERVAL = 5; // minutes

// ============================================
// SUBSCRIPTION CONSTANTS
// ============================================

export const TRIAL_DURATION_DAYS = 14;

export const FREE_TIER_LIMITS = {
  MAX_ALARMS: 3,
  MAX_MANIFESTATIONS: 5,
  STATISTICS_DAYS: 7,
};

export const PREMIUM_FEATURES = [
  'Unlimited alarms',
  'Unlimited manifestations',
  'Advanced statistics',
  'Custom sounds',
  'Data export',
  'Priority support',
];

// ============================================
// APP CONSTANTS
// ============================================

export const APP_NAME = 'Manifestation Alarm';
export const APP_VERSION = '1.0.0';

export const STORAGE_KEYS = {
  USER_DATA: 'user_data',
  MOOD_ENTRIES: 'mood_entries',
  MANIFESTATION_ENTRIES: 'manifestation_entries',
  ALARMS: 'alarms',
  AUTH_SESSION: '@manifestation_auth_session',
  SYNC_QUEUE: '@manifestation_sync_queue',
  LAST_SYNC: '@manifestation_last_sync',
  INSTALL_DATE: '@manifestation_install_date',
  SUBSCRIPTION_TYPE: '@manifestation_subscription_type',
  SUBSCRIPTION_EXPIRY: '@manifestation_subscription_expiry',
  COUPON_CODE: '@manifestation_coupon_code',
  COUPON_ACTIVATION_DATE: '@manifestation_coupon_activation_date',
  COUPON_EXPIRY_DATE: '@manifestation_coupon_expiry_date',
  LIFETIME_ACCESS: '@manifestation_lifetime_access',
};

// ============================================
// SYNC CONSTANTS
// ============================================

export const SYNC_CONFIG = {
  MAX_RETRY_COUNT: 3,
  RETRY_DELAY_MS: 5000,
  BACKGROUND_SYNC_INTERVAL_MS: 5 * 60 * 1000, // 5 minutes
  BATCH_SIZE: 50,
};

// ============================================
// VALIDATION CONSTANTS
// ============================================

export const VALIDATION_LIMITS = {
  MOOD_NOTES_MAX_LENGTH: 1000,
  MANIFESTATION_TITLE_MAX_LENGTH: 200,
  MANIFESTATION_DESCRIPTION_MAX_LENGTH: 5000,
  MANIFESTATION_VISUALIZATION_MAX_LENGTH: 2000,
  AFFIRMATION_MAX_LENGTH: 500,
  MAX_AFFIRMATIONS: 10,
  MAX_MOOD_TAGS: 10,
  TAG_MAX_LENGTH: 50,
  ALARM_NAME_MAX_LENGTH: 100,
};
