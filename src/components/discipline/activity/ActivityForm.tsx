/**
 * ActivityForm Component
 *
 * Form for creating/editing discipline activities
 * Handles all tracking types with appropriate configuration
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
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
import { TrackingTypeSelector } from './TrackingTypeSelector';
import { FrequencyPicker } from './FrequencyPicker';

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
    if (activity) return; // Don't reset if editing

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

  const handleSubmit = async () => {
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
      Alert.alert('Error', error.message || 'Failed to save activity');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Title */}
      <View style={styles.field}>
        <Text style={styles.label}>
          Activity Title <Text style={styles.required}>*</Text>
        </Text>
        <TextInput
          style={[styles.input, errors.title && styles.inputError]}
          value={title}
          onChangeText={setTitle}
          placeholder="e.g., Morning meditation, Exercise, Read book"
          maxLength={100}
          placeholderTextColor="#94a3b8"
        />
        {errors.title && <Text style={styles.errorText}>{errors.title}</Text>}
        <Text style={styles.helperText}>{title.length}/100</Text>
      </View>

      {/* Description */}
      <View style={styles.field}>
        <Text style={styles.label}>Description (Optional)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder="Add details about this activity..."
          multiline
          numberOfLines={3}
          maxLength={200}
          placeholderTextColor="#94a3b8"
        />
        <Text style={styles.helperText}>{description.length}/200</Text>
      </View>

      {/* Tracking Type */}
      <TrackingTypeSelector
        value={trackingType}
        onChange={setTrackingType}
        color={goalColor}
      />

      {/* Target Configuration */}
      {trackingType === 'number' && (
        <View style={styles.field}>
          <Text style={styles.label}>
            Target Configuration <Text style={styles.required}>*</Text>
          </Text>
          <View style={styles.row}>
            <TextInput
              style={[styles.input, styles.numberInput]}
              value={String((targetConfig as NumberTargetConfig).target)}
              onChangeText={(val) =>
                setTargetConfig({
                  ...(targetConfig as NumberTargetConfig),
                  target: parseInt(val) || 0,
                })
              }
              placeholder="Target"
              keyboardType="numeric"
              placeholderTextColor="#94a3b8"
            />
            <TextInput
              style={[styles.input, styles.flex1]}
              value={(targetConfig as NumberTargetConfig).unit}
              onChangeText={(val) =>
                setTargetConfig({
                  ...(targetConfig as NumberTargetConfig),
                  unit: val,
                })
              }
              placeholder="Unit (e.g., times, minutes, pages)"
              placeholderTextColor="#94a3b8"
            />
          </View>
        </View>
      )}

      {trackingType === 'multiselect' && (
        <View style={styles.field}>
          <Text style={styles.label}>
            Options <Text style={styles.required}>*</Text>
          </Text>
          <Text style={styles.helperText}>
            Comma-separated (e.g., Morning, Afternoon, Evening)
          </Text>
          <TextInput
            style={styles.input}
            value={(targetConfig as MultiSelectTargetConfig).options.join(', ')}
            onChangeText={(val) =>
              setTargetConfig({
                ...(targetConfig as MultiSelectTargetConfig),
                options: val.split(',').map((s) => s.trim()).filter(Boolean),
              })
            }
            placeholder="Option 1, Option 2, Option 3"
            placeholderTextColor="#94a3b8"
          />
        </View>
      )}

      {/* Frequency */}
      <FrequencyPicker
        frequencyType={frequencyType}
        frequencyConfig={frequencyConfig}
        onChange={(type, config) => {
          setFrequencyType(type);
          setFrequencyConfig(config);
        }}
        color={goalColor}
      />

      {/* Reminder */}
      <View style={styles.field}>
        <View style={styles.switchRow}>
          <View style={styles.flex1}>
            <Text style={styles.label}>Enable Reminder</Text>
            <Text style={styles.helperText}>
              Get notified to complete this activity
            </Text>
          </View>
          <Switch
            value={reminderEnabled}
            onValueChange={setReminderEnabled}
            trackColor={{ true: goalColor, false: '#cbd5e1' }}
            thumbColor="#ffffff"
          />
        </View>
      </View>

      {reminderEnabled && (
        <View style={styles.field}>
          <Text style={styles.label}>Reminder Time</Text>
          <Text style={styles.helperText}>
            Time picker will be added in next update
          </Text>
          <TextInput
            style={styles.input}
            value={reminderTime}
            onChangeText={setReminderTime}
            placeholder="HH:MM:SS"
            placeholderTextColor="#94a3b8"
          />
        </View>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.button, styles.cancelButton]}
          onPress={onCancel}
          disabled={loading}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.submitButton, { backgroundColor: goalColor }]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.submitButtonText}>
            {loading ? 'Saving...' : activity ? 'Update' : 'Create Activity'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  field: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  required: {
    color: '#ef4444',
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    color: '#1e293b',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  helperText: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4,
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  numberInput: {
    width: 100,
  },
  flex1: {
    flex: 1,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    marginBottom: 40,
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f1f5f9',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
  },
  submitButton: {
    backgroundColor: '#6366f1',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});
