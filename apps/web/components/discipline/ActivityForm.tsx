/**
 * ActivityForm Component (Web)
 *
 * Form for creating/editing discipline activities with all tracking types
 */

'use client';

import { useState, useEffect } from 'react';
import type {
  DisciplineActivity,
  TrackingType,
  FrequencyType,
  FrequencyConfig,
  TargetConfig,
  BooleanTargetConfig,
  NumberTargetConfig,
  MultiSelectTargetConfig,
  TextTargetConfig,
} from '@manifestation/shared';
import { ActivitySchema } from '@manifestation/shared';

export interface ActivityFormData {
  title: string;
  description?: string;
  trackingType: TrackingType;
  targetConfig: TargetConfig;
  frequencyType: FrequencyType;
  frequencyConfig: FrequencyConfig;
  reminderEnabled: boolean;
  reminderTime?: string;
}

interface ActivityFormProps {
  activity?: DisciplineActivity;
  goalColor?: string;
  onSubmit: (data: ActivityFormData) => Promise<void>;
  onCancel: () => void;
}

const TRACKING_TYPES: Array<{
  type: TrackingType;
  icon: string;
  label: string;
  description: string;
}> = [
  {
    type: 'boolean',
    icon: '✓',
    label: 'Yes/No',
    description: 'Simple completion tracking',
  },
  {
    type: 'number',
    icon: '1',
    label: 'Number',
    description: 'Track quantity (e.g., 4 rounds, 20 minutes)',
  },
  {
    type: 'multiselect',
    icon: '☰',
    label: 'Multi-select',
    description: 'Choose from multiple options',
  },
  {
    type: 'text',
    icon: '📝',
    label: 'Text',
    description: 'Free-form notes',
  },
];

const FREQUENCY_OPTIONS: Array<{
  type: FrequencyType;
  icon: string;
  label: string;
  description: string;
}> = [
  { type: 'daily', icon: '📅', label: 'Daily', description: 'Every day' },
  {
    type: 'specific_days',
    icon: '📆',
    label: 'Specific Days',
    description: 'Select days of week',
  },
  {
    type: 'custom',
    icon: '🗓️',
    label: 'Custom',
    description: 'Specific dates only',
  },
];

const DAYS_OF_WEEK = [
  { short: 'S', full: 'Sunday', value: 0 },
  { short: 'M', full: 'Monday', value: 1 },
  { short: 'T', full: 'Tuesday', value: 2 },
  { short: 'W', full: 'Wednesday', value: 3 },
  { short: 'T', full: 'Thursday', value: 4 },
  { short: 'F', full: 'Friday', value: 5 },
  { short: 'S', full: 'Saturday', value: 6 },
];

export function ActivityForm({
  activity,
  goalColor = '#6366f1',
  onSubmit,
  onCancel,
}: ActivityFormProps) {
  const [title, setTitle] = useState(activity?.title || '');
  const [description, setDescription] = useState(activity?.description || '');
  const [trackingType, setTrackingType] = useState<TrackingType>(
    activity?.trackingType || 'boolean'
  );
  const [targetConfig, setTargetConfig] = useState<TargetConfig>(
    activity?.targetConfig || { target: true }
  );
  const [frequencyType, setFrequencyType] = useState<FrequencyType>(
    activity?.frequencyType || 'daily'
  );
  const [frequencyConfig, setFrequencyConfig] = useState<FrequencyConfig>(
    activity?.frequencyConfig || {}
  );
  const [reminderEnabled, setReminderEnabled] = useState(
    activity?.reminderEnabled || false
  );
  const [reminderTime, setReminderTime] = useState(
    activity?.reminderTime || '09:00:00'
  );
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Update target config when tracking type changes
  useEffect(() => {
    if (activity) return;

    switch (trackingType) {
      case 'boolean':
        setTargetConfig({ target: true } as BooleanTargetConfig);
        break;
      case 'number':
        setTargetConfig({
          target: 1,
          unit: 'times',
          min: 0,
        } as NumberTargetConfig);
        break;
      case 'multiselect':
        setTargetConfig({
          options: ['Option 1', 'Option 2'],
          minSelect: 1,
          maxSelect: 2,
        } as MultiSelectTargetConfig);
        break;
      case 'text':
        setTargetConfig({
          placeholder: 'Enter notes...',
          required: false,
        } as TextTargetConfig);
        break;
    }
  }, [trackingType, activity]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      setErrors({});

      // Validate
      const validation = ActivitySchema.safeParse({
        title,
        description,
        trackingType,
        targetConfig,
        frequencyType,
        frequencyConfig,
        reminderEnabled,
        reminderTime: reminderEnabled ? reminderTime : undefined,
      });

      if (!validation.success) {
        const newErrors: Record<string, string> = {};
        validation.error.errors.forEach((err) => {
          if (err.path.length > 0) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
        return;
      }

      await onSubmit({
        title,
        description: description || undefined,
        trackingType,
        targetConfig,
        frequencyType,
        frequencyConfig,
        reminderEnabled,
        reminderTime: reminderEnabled ? reminderTime : undefined,
      });
    } catch (error: any) {
      alert(error.message || 'Failed to save activity');
    } finally {
      setLoading(false);
    }
  };

  const handleDayToggle = (day: number) => {
    if (frequencyType !== 'specific_days') return;
    const days = (frequencyConfig as { days: number[] }).days || [];
    const newDays = days.includes(day)
      ? days.filter((d) => d !== day)
      : [...days, day].sort();
    setFrequencyConfig({ days: newDays });
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
      {/* Title */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">
          Activity Title <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., Morning meditation, Exercise, Read book"
          maxLength={100}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
        {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
        <p className="text-xs text-gray-500 mt-1">{title.length}/100</p>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">
          Description (Optional)
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Add details about this activity..."
          rows={3}
          maxLength={200}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
        <p className="text-xs text-gray-500 mt-1">{description.length}/200</p>
      </div>

      {/* Tracking Type */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-3">
          Tracking Type
        </label>
        <div className="grid grid-cols-2 gap-3">
          {TRACKING_TYPES.map((option) => {
            const isSelected = trackingType === option.type;
            return (
              <button
                key={option.type}
                type="button"
                onClick={() => setTrackingType(option.type)}
                className={`p-4 border-2 rounded-lg text-left transition-all ${
                  isSelected
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                }`}
                style={
                  isSelected
                    ? { borderColor: goalColor, backgroundColor: goalColor + '10' }
                    : {}
                }
              >
                <div className="text-2xl mb-2">{option.icon}</div>
                <div
                  className={`text-sm font-semibold mb-1 ${
                    isSelected ? 'text-gray-900' : 'text-gray-700'
                  }`}
                  style={isSelected ? { color: goalColor } : {}}
                >
                  {option.label}
                </div>
                <div className="text-xs text-gray-600">{option.description}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Target Configuration */}
      {trackingType === 'number' && (
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            Target Configuration <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-3">
            <input
              type="number"
              value={(targetConfig as NumberTargetConfig).target}
              onChange={(e) =>
                setTargetConfig({
                  ...(targetConfig as NumberTargetConfig),
                  target: parseInt(e.target.value) || 0,
                })
              }
              placeholder="Target"
              className="w-24 px-3 py-2 border border-gray-300 rounded-lg"
            />
            <input
              type="text"
              value={(targetConfig as NumberTargetConfig).unit}
              onChange={(e) =>
                setTargetConfig({
                  ...(targetConfig as NumberTargetConfig),
                  unit: e.target.value,
                })
              }
              placeholder="Unit (e.g., times, minutes, pages)"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
        </div>
      )}

      {trackingType === 'multiselect' && (
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            Options <span className="text-red-500">*</span>
          </label>
          <p className="text-xs text-gray-600 mb-2">
            Comma-separated (e.g., Morning, Afternoon, Evening)
          </p>
          <input
            type="text"
            value={(targetConfig as MultiSelectTargetConfig).options.join(', ')}
            onChange={(e) =>
              setTargetConfig({
                ...(targetConfig as MultiSelectTargetConfig),
                options: e.target.value
                  .split(',')
                  .map((s) => s.trim())
                  .filter(Boolean),
              })
            }
            placeholder="Option 1, Option 2, Option 3"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>
      )}

      {/* Frequency */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-3">
          Frequency
        </label>
        <div className="flex gap-3 mb-4">
          {FREQUENCY_OPTIONS.map((option) => {
            const isSelected = frequencyType === option.type;
            return (
              <button
                key={option.type}
                type="button"
                onClick={() => {
                  setFrequencyType(option.type);
                  if (option.type === 'daily') {
                    setFrequencyConfig({});
                  } else if (option.type === 'specific_days') {
                    setFrequencyConfig({ days: [1, 2, 3, 4, 5] });
                  } else {
                    setFrequencyConfig({ dates: [] });
                  }
                }}
                className={`flex-1 p-3 border-2 rounded-lg text-center transition-all ${
                  isSelected
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-200 bg-gray-50'
                }`}
                style={
                  isSelected
                    ? { borderColor: goalColor, backgroundColor: goalColor + '10' }
                    : {}
                }
              >
                <div className="text-xl mb-1">{option.icon}</div>
                <div
                  className={`text-xs font-semibold mb-0.5 ${
                    isSelected ? 'text-gray-900' : 'text-gray-700'
                  }`}
                  style={isSelected ? { color: goalColor } : {}}
                >
                  {option.label}
                </div>
                <div className="text-xs text-gray-600">{option.description}</div>
              </button>
            );
          })}
        </div>

        {/* Days of Week Picker */}
        {frequencyType === 'specific_days' && (
          <div>
            <p className="text-sm text-gray-700 mb-2">Select Days</p>
            <div className="flex gap-2 justify-between">
              {DAYS_OF_WEEK.map((day) => {
                const selectedDays = (frequencyConfig as { days: number[] }).days || [];
                const isSelected = selectedDays.includes(day.value);
                return (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => handleDayToggle(day.value)}
                    className={`w-11 h-11 rounded-full font-semibold text-sm transition-all ${
                      isSelected ? 'text-white' : 'text-gray-600 bg-gray-100'
                    }`}
                    style={isSelected ? { backgroundColor: goalColor } : {}}
                  >
                    {day.short}
                  </button>
                );
              })}
            </div>
            {((frequencyConfig as { days: number[] }).days || []).length === 0 && (
              <p className="text-xs text-red-500 mt-2">Select at least one day</p>
            )}
          </div>
        )}

        {frequencyType === 'custom' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-xs text-yellow-800 text-center">
              Custom dates can be added after creating the activity
            </p>
          </div>
        )}
      </div>

      {/* Reminder */}
      <div>
        <label className="flex items-center justify-between">
          <div>
            <span className="text-sm font-semibold text-gray-900">Enable Reminder</span>
            <p className="text-xs text-gray-600">Get notified to complete this activity</p>
          </div>
          <input
            type="checkbox"
            checked={reminderEnabled}
            onChange={(e) => setReminderEnabled(e.target.checked)}
            className="w-5 h-5 rounded"
            style={{ accentColor: goalColor }}
          />
        </label>
      </div>

      {reminderEnabled && (
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            Reminder Time
          </label>
          <input
            type="time"
            value={reminderTime.slice(0, 5)}
            onChange={(e) => setReminderTime(e.target.value + ':00')}
            className="px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 px-4 py-2 text-white rounded-lg hover:opacity-90 transition-opacity"
          style={{ backgroundColor: goalColor }}
        >
          {loading ? 'Saving...' : activity ? 'Update Activity' : 'Create Activity'}
        </button>
      </div>
    </form>
  );
}
