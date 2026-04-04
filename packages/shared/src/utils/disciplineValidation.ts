/**
 * Zod Validation Schemas for Discipline System
 */

import { z } from 'zod';

// =====================================================
// CATEGORY VALIDATION
// =====================================================

export const CategorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(50, 'Category name too long'),
  description: z.string().max(200, 'Description too long').optional(),
  icon: z.string().max(10).optional(),
  color: z.string().regex(/^#([0-9A-F]{3}){1,2}$/i, 'Invalid hex color'),
});

// =====================================================
// GOAL VALIDATION (SMART Framework)
// =====================================================

export const GoalSchema = z.object({
  categoryId: z.string().uuid().optional(),
  title: z.string().min(1, 'Goal title is required').max(100, 'Title too long'),
  description: z.string().max(500, 'Description too long').optional(),
  specific: z.string().max(500).optional(),
  measurable: z.string().max(500).optional(),
  achievable: z.string().max(500).optional(),
  relevant: z.string().max(500).optional(),
  timeBound: z.string().max(500).optional(),
  targetDate: z.date().optional(),
  manualProgressOverride: z.number().min(0).max(100).optional(),
  useManualProgress: z.boolean().optional().default(false),
});

// =====================================================
// TRACKING TYPE CONFIG VALIDATION
// =====================================================

export const BooleanTargetConfigSchema = z.object({
  target: z.boolean(),
});

export const NumberTargetConfigSchema = z.object({
  target: z.number().min(0),
  unit: z.string().min(1).max(20),
  min: z.number().optional(),
  max: z.number().optional(),
});

export const MultiSelectTargetConfigSchema = z.object({
  options: z.array(z.string().min(1).max(50)).min(2).max(10),
  minSelect: z.number().min(1),
  maxSelect: z.number().min(1),
}).refine(data => data.maxSelect >= data.minSelect, {
  message: 'Max select must be >= min select',
}).refine(data => data.maxSelect <= data.options.length, {
  message: 'Max select cannot exceed number of options',
});

export const TextTargetConfigSchema = z.object({
  placeholder: z.string().max(100),
  required: z.boolean(),
});

export const TargetConfigSchema = z.union([
  BooleanTargetConfigSchema,
  NumberTargetConfigSchema,
  MultiSelectTargetConfigSchema,
  TextTargetConfigSchema,
]);

// =====================================================
// FREQUENCY CONFIG VALIDATION
// =====================================================

export const DailyFrequencyConfigSchema = z.object({});

export const SpecificDaysFrequencyConfigSchema = z.object({
  days: z.array(z.number().min(0).max(6)).min(1).max(7),
});

export const CustomFrequencyConfigSchema = z.object({
  dates: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).min(1),
});

export const FrequencyConfigSchema = z.union([
  DailyFrequencyConfigSchema,
  SpecificDaysFrequencyConfigSchema,
  CustomFrequencyConfigSchema,
]);

// =====================================================
// REMINDER CHANNELS VALIDATION
// =====================================================

export const ReminderChannelsSchema = z.object({
  push: z.boolean(),
  alarm: z.boolean(),
  sms: z.boolean(),
  email: z.boolean(),
}).refine(data => data.push || data.alarm || data.sms || data.email, {
  message: 'At least one reminder channel must be enabled',
});

// =====================================================
// DISCIPLINE ACTIVITY VALIDATION
// =====================================================

export const DisciplineActivitySchema = z.object({
  goalId: z.string().uuid('Invalid goal ID'),
  title: z.string().min(1, 'Activity title is required').max(100, 'Title too long'),
  description: z.string().max(300, 'Description too long').optional(),
  trackingType: z.enum(['boolean', 'number', 'multiselect', 'text']),
  targetConfig: TargetConfigSchema,
  frequencyType: z.enum(['daily', 'specific_days', 'custom']),
  frequencyConfig: FrequencyConfigSchema,
  reminderEnabled: z.boolean().default(false),
  reminderTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/).optional(),
  reminderChannels: ReminderChannelsSchema.optional(),
});

// =====================================================
// LOG VALUE VALIDATION
// =====================================================

export const BooleanLogValueSchema = z.object({
  completed: z.boolean(),
});

export const NumberLogValueSchema = z.object({
  value: z.number(),
  unit: z.string().min(1).max(20),
});

export const MultiSelectLogValueSchema = z.object({
  selected: z.array(z.string()).min(0),
});

export const TextLogValueSchema = z.object({
  text: z.string().max(1000),
});

export const LogValueSchema = z.union([
  BooleanLogValueSchema,
  NumberLogValueSchema,
  MultiSelectLogValueSchema,
  TextLogValueSchema,
]);

// =====================================================
// ACTIVITY LOG VALIDATION
// =====================================================

export const ActivityLogSchema = z.object({
  activityId: z.string().uuid('Invalid activity ID'),
  logDate: z.date(),
  status: z.enum(['good', 'neutral', 'bad', 'skipped']),
  value: LogValueSchema,
  notes: z.string().max(500, 'Notes too long').optional(),
});

// =====================================================
// DAILY REMINDER VALIDATION
// =====================================================

export const DailyReminderSchema = z.object({
  isEnabled: z.boolean(),
  reminderTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/),
  reminderChannels: ReminderChannelsSchema,
  reminderDays: z.array(z.number().min(0).max(6)).min(1).max(7),
  customMessage: z.string().max(200),
});

// =====================================================
// SOCIAL FEATURES VALIDATION
// =====================================================

export const SharedProgressSchema = z.object({
  sharedWith: z.enum(['public', 'friends', 'private']),
  shareCategories: z.boolean(),
  shareGoals: z.boolean(),
  shareCompletionRate: z.boolean(),
  shareStreaks: z.boolean(),
  shareActivityNames: z.boolean(),
});

export const CompetitionSchema = z.object({
  name: z.string().min(1, 'Competition name is required').max(100, 'Name too long'),
  description: z.string().max(500, 'Description too long').optional(),
  competitionType: z.enum(['completion_rate', 'streak', 'total_activities', 'category_specific']),
  categoryId: z.string().uuid().optional(),
  startDate: z.date(),
  endDate: z.date(),
  isPublic: z.boolean().default(false),
}).refine(data => data.endDate > data.startDate, {
  message: 'End date must be after start date',
}).refine(data => {
  if (data.competitionType === 'category_specific') {
    return !!data.categoryId;
  }
  return true;
}, {
  message: 'Category ID required for category-specific competitions',
});

// =====================================================
// VALIDATION HELPERS
// =====================================================

/**
 * Validate tracking config matches tracking type
 */
export function validateTrackingConfig(
  trackingType: 'boolean' | 'number' | 'multiselect' | 'text',
  config: unknown
): boolean {
  try {
    switch (trackingType) {
      case 'boolean':
        BooleanTargetConfigSchema.parse(config);
        return true;
      case 'number':
        NumberTargetConfigSchema.parse(config);
        return true;
      case 'multiselect':
        MultiSelectTargetConfigSchema.parse(config);
        return true;
      case 'text':
        TextTargetConfigSchema.parse(config);
        return true;
      default:
        return false;
    }
  } catch {
    return false;
  }
}

/**
 * Validate log value matches tracking type
 */
export function validateLogValue(
  trackingType: 'boolean' | 'number' | 'multiselect' | 'text',
  value: unknown
): boolean {
  try {
    switch (trackingType) {
      case 'boolean':
        BooleanLogValueSchema.parse(value);
        return true;
      case 'number':
        NumberLogValueSchema.parse(value);
        return true;
      case 'multiselect':
        MultiSelectLogValueSchema.parse(value);
        return true;
      case 'text':
        TextLogValueSchema.parse(value);
        return true;
      default:
        return false;
    }
  } catch {
    return false;
  }
}

/**
 * Validate frequency config matches frequency type
 */
export function validateFrequencyConfig(
  frequencyType: 'daily' | 'specific_days' | 'custom',
  config: unknown
): boolean {
  try {
    switch (frequencyType) {
      case 'daily':
        DailyFrequencyConfigSchema.parse(config);
        return true;
      case 'specific_days':
        SpecificDaysFrequencyConfigSchema.parse(config);
        return true;
      case 'custom':
        CustomFrequencyConfigSchema.parse(config);
        return true;
      default:
        return false;
    }
  } catch {
    return false;
  }
}
