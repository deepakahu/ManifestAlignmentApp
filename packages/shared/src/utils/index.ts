/**
 * Shared utility functions for Manifestation Platform
 */

import { z } from 'zod';
import type {
  MoodEntry,
  MoodEntryDB,
  ManifestationEntry,
  ManifestationEntryDB,
  Alarm,
  AlarmDB,
  User,
  ProfileDB,
  MoodLevel,
} from '../types';
import { VALIDATION_LIMITS } from '../constants';

// ============================================
// DATE UTILITIES
// ============================================

/**
 * Format a date to ISO string for database storage
 */
export function toISOString(date: Date | string | undefined | null): string | null {
  if (!date) return null;
  if (typeof date === 'string') return date;
  return date.toISOString();
}

/**
 * Parse an ISO string back to a Date object
 */
export function fromISOString(isoString: string | null | undefined): Date | undefined {
  if (!isoString) return undefined;
  return new Date(isoString);
}

/**
 * Format time as HH:MM
 */
export function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

/**
 * Format date as readable string
 */
export function formatDate(date: Date, options?: Intl.DateTimeFormatOptions): string {
  return date.toLocaleDateString('en-US', options ?? {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format date and time together
 */
export function formatDateTime(date: Date): string {
  return `${formatDate(date)} ${formatTime(date)}`;
}

/**
 * Get relative time string (e.g., "2 hours ago")
 */
export function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(date);
}

// ============================================
// ID GENERATION
// ============================================

/**
 * Generate a unique ID (compatible with existing mobile app pattern)
 */
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Check if a string is a valid UUID
 */
export function isUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

// ============================================
// DATA TRANSFORMERS (Local <-> Cloud)
// ============================================

/**
 * Transform local MoodEntry to database format
 */
export function moodEntryToDB(entry: MoodEntry, userId: string): Omit<MoodEntryDB, 'created_at' | 'updated_at'> {
  return {
    id: isUUID(entry.id) ? entry.id : crypto.randomUUID?.() ?? generateId(),
    user_id: userId,
    mood: entry.mood,
    notes: entry.notes,
    tags: entry.tags,
    timestamp: toISOString(entry.timestamp)!,
    alarm_id: entry.alarmId ?? null,
    alarm_name: entry.alarmName ?? null,
    manifestation_read: entry.manifestationRead ?? false,
    local_id: isUUID(entry.id) ? null : entry.id,
    deleted_at: null,
  };
}

/**
 * Transform database MoodEntry to local format
 */
export function moodEntryFromDB(db: MoodEntryDB): MoodEntry {
  return {
    id: db.local_id ?? db.id,
    mood: db.mood as MoodLevel,
    notes: db.notes,
    tags: db.tags,
    timestamp: new Date(db.timestamp),
    alarmId: db.alarm_id ?? undefined,
    alarmName: db.alarm_name ?? undefined,
    manifestationRead: db.manifestation_read,
  };
}

/**
 * Transform local ManifestationEntry to database format
 */
export function manifestationToDB(
  entry: ManifestationEntry,
  userId: string
): Omit<ManifestationEntryDB, 'created_at' | 'updated_at'> {
  return {
    id: isUUID(entry.id) ? entry.id : crypto.randomUUID?.() ?? generateId(),
    user_id: userId,
    title: entry.title,
    description: entry.description,
    category: entry.category,
    target_date: entry.targetDate ? toISOString(entry.targetDate) : null,
    is_completed: entry.isCompleted,
    completed_at: toISOString(entry.completedAt),
    visualization_notes: entry.visualizationNotes ?? null,
    affirmations: entry.affirmations ?? [],
    local_id: isUUID(entry.id) ? null : entry.id,
    deleted_at: null,
  };
}

/**
 * Transform database ManifestationEntry to local format
 */
export function manifestationFromDB(db: ManifestationEntryDB): ManifestationEntry {
  return {
    id: db.local_id ?? db.id,
    title: db.title,
    description: db.description,
    category: db.category,
    targetDate: fromISOString(db.target_date),
    isCompleted: db.is_completed,
    createdAt: new Date(db.created_at),
    completedAt: fromISOString(db.completed_at),
    visualizationNotes: db.visualization_notes ?? undefined,
    affirmations: db.affirmations,
    // Note: readHistory is fetched separately from manifestation_read_history table
  };
}

/**
 * Transform local Alarm to database format
 */
export function alarmToDB(alarm: Alarm, userId: string): Omit<AlarmDB, 'created_at' | 'updated_at'> {
  const isTestMode = alarm.interval === 'test_mode';
  return {
    id: isUUID(alarm.id) ? alarm.id : crypto.randomUUID?.() ?? generateId(),
    user_id: userId,
    name: alarm.name,
    interval_hours: isTestMode ? 0 : (alarm.interval as { hours: number; minutes: number }).hours,
    interval_minutes: isTestMode ? 0 : (alarm.interval as { hours: number; minutes: number }).minutes,
    is_test_mode: isTestMode,
    test_interval_minutes: alarm.testInterval ?? 5,
    day_start_time: alarm.dayStartTime,
    day_end_time: alarm.dayEndTime,
    active_days: alarm.activeDays,
    is_enabled: alarm.isEnabled,
    last_triggered_at: toISOString(alarm.lastTriggered),
    next_trigger_at: toISOString(alarm.nextTrigger),
    sound_type: alarm.soundType ?? 'default',
    local_id: isUUID(alarm.id) ? null : alarm.id,
    deleted_at: null,
  };
}

/**
 * Transform database Alarm to local format
 */
export function alarmFromDB(db: AlarmDB): Alarm {
  return {
    id: db.local_id ?? db.id,
    name: db.name,
    interval: db.is_test_mode
      ? 'test_mode'
      : { hours: db.interval_hours, minutes: db.interval_minutes },
    dayStartTime: db.day_start_time,
    dayEndTime: db.day_end_time,
    activeDays: db.active_days,
    isEnabled: db.is_enabled,
    createdAt: new Date(db.created_at),
    lastTriggered: fromISOString(db.last_triggered_at),
    nextTrigger: fromISOString(db.next_trigger_at),
    testInterval: db.test_interval_minutes,
    soundType: db.sound_type as Alarm['soundType'],
  };
}

/**
 * Transform database Profile to local User format
 */
export function userFromDB(db: ProfileDB): User {
  return {
    id: db.id,
    name: db.display_name ?? 'User',
    email: db.email ?? undefined,
    createdAt: new Date(db.created_at),
    preferences: {
      notificationsEnabled: db.notifications_enabled,
      soundEnabled: db.sound_enabled,
      theme: db.theme as 'light' | 'dark',
      reminderFrequency: db.reminder_frequency as User['preferences']['reminderFrequency'],
      reminderTime: db.reminder_time ?? undefined,
    },
  };
}

// ============================================
// VALIDATION SCHEMAS (Zod)
// ============================================

export const MoodEntrySchema = z.object({
  mood: z.number().min(1).max(5),
  notes: z.string().max(VALIDATION_LIMITS.MOOD_NOTES_MAX_LENGTH).optional().default(''),
  tags: z.array(z.string().max(VALIDATION_LIMITS.TAG_MAX_LENGTH))
    .max(VALIDATION_LIMITS.MAX_MOOD_TAGS)
    .optional()
    .default([]),
  alarmId: z.string().optional(),
  alarmName: z.string().optional(),
});

export const ManifestationSchema = z.object({
  title: z.string().min(1).max(VALIDATION_LIMITS.MANIFESTATION_TITLE_MAX_LENGTH),
  description: z.string().max(VALIDATION_LIMITS.MANIFESTATION_DESCRIPTION_MAX_LENGTH).default(''),
  category: z.string(),
  targetDate: z.date().optional(),
  visualizationNotes: z.string()
    .max(VALIDATION_LIMITS.MANIFESTATION_VISUALIZATION_MAX_LENGTH)
    .optional(),
  affirmations: z.array(z.string().max(VALIDATION_LIMITS.AFFIRMATION_MAX_LENGTH))
    .max(VALIDATION_LIMITS.MAX_AFFIRMATIONS)
    .optional()
    .default([]),
});

export const AlarmSchema = z.object({
  name: z.string().min(1).max(VALIDATION_LIMITS.ALARM_NAME_MAX_LENGTH),
  interval: z.union([
    z.object({
      hours: z.number().min(0).max(23),
      minutes: z.number().min(0).max(59),
    }),
    z.literal('test_mode'),
  ]),
  dayStartTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
  dayEndTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
  activeDays: z.array(z.boolean()).length(7),
  testInterval: z.number().min(1).max(5).optional(),
  soundType: z.string().optional(),
});

export const UserPreferencesSchema = z.object({
  notificationsEnabled: z.boolean(),
  soundEnabled: z.boolean(),
  theme: z.enum(['light', 'dark']),
  reminderFrequency: z.enum(['daily', 'weekly', 'custom']).optional(),
  reminderTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
});

// ============================================
// MOOD UTILITIES
// ============================================

/**
 * Calculate average mood from entries
 */
export function calculateAverageMood(entries: MoodEntry[]): number {
  if (entries.length === 0) return 0;
  const sum = entries.reduce((acc, entry) => acc + entry.mood, 0);
  return Math.round((sum / entries.length) * 10) / 10;
}

/**
 * Group mood entries by date
 */
export function groupMoodsByDate(entries: MoodEntry[]): Map<string, MoodEntry[]> {
  const grouped = new Map<string, MoodEntry[]>();
  entries.forEach(entry => {
    const dateKey = formatDate(entry.timestamp, { year: 'numeric', month: '2-digit', day: '2-digit' });
    const existing = grouped.get(dateKey) ?? [];
    grouped.set(dateKey, [...existing, entry]);
  });
  return grouped;
}

// ============================================
// ALARM UTILITIES
// ============================================

/**
 * Parse time string (HH:MM) to hours and minutes
 */
export function parseTimeString(timeStr: string): { hours: number; minutes: number } {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return { hours, minutes };
}

/**
 * Check if current time is within alarm's active window
 */
export function isWithinAlarmWindow(alarm: Alarm, now: Date = new Date()): boolean {
  const dayOfWeek = now.getDay();
  if (!alarm.activeDays[dayOfWeek]) return false;

  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const start = parseTimeString(alarm.dayStartTime);
  const end = parseTimeString(alarm.dayEndTime);
  const startMinutes = start.hours * 60 + start.minutes;
  const endMinutes = end.hours * 60 + end.minutes;

  // Handle crossing midnight
  if (endMinutes < startMinutes) {
    return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
  }

  return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
}

/**
 * Get alarm interval in minutes
 */
export function getAlarmIntervalMinutes(alarm: Alarm): number {
  if (alarm.interval === 'test_mode') {
    return alarm.testInterval ?? 5;
  }
  return alarm.interval.hours * 60 + alarm.interval.minutes;
}

// ============================================
// DISCIPLINE SYSTEM TRANSFORMERS (PHASE 2)
// ============================================

export * from './disciplineTransformers';
export * from './disciplineValidation';
