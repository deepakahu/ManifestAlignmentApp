/**
 * GoalForm Component
 *
 * Form for creating or editing a goal with SMART framework
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import type { Goal } from '@manifestation/shared';
import { GoalSchema } from '@manifestation/shared';
import { SMARTSection } from './SMARTSection';
import { MaterialIcons } from '@expo/vector-icons';

interface GoalFormProps {
  initialData?: Partial<Goal>;
  categoryId?: string;
  categoryColor?: string;
  onSubmit: (data: GoalFormData) => void | Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
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
  manualProgressOverride?: number;
  useManualProgress: boolean;
}

export function GoalForm({
  initialData,
  categoryId,
  categoryColor = '#6366f1',
  onSubmit,
  onCancel,
  submitLabel = 'Save Goal',
}: GoalFormProps) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [specific, setSpecific] = useState(initialData?.specific || '');
  const [measurable, setMeasurable] = useState(initialData?.measurable || '');
  const [achievable, setAchievable] = useState(initialData?.achievable || '');
  const [relevant, setRelevant] = useState(initialData?.relevant || '');
  const [timeBound, setTimeBound] = useState(initialData?.timeBound || '');
  const [targetDate, setTargetDate] = useState<Date | undefined>(initialData?.targetDate);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [useManualProgress, setUseManualProgress] = useState(
    initialData?.useManualProgress || false
  );
  const [manualProgress, setManualProgress] = useState(
    initialData?.manualProgressOverride?.toString() || '0'
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    // Validate with Zod schema
    const result = GoalSchema.safeParse({
      categoryId: categoryId || initialData?.categoryId,
      title,
      description: description || undefined,
      specific: specific || undefined,
      measurable: measurable || undefined,
      achievable: achievable || undefined,
      relevant: relevant || undefined,
      timeBound: timeBound || undefined,
      targetDate,
      manualProgressOverride: useManualProgress ? parseInt(manualProgress, 10) : undefined,
      useManualProgress,
    });

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        categoryId: categoryId || initialData?.categoryId,
        title: title.trim(),
        description: description.trim() || undefined,
        specific: specific.trim() || undefined,
        measurable: measurable.trim() || undefined,
        achievable: achievable.trim() || undefined,
        relevant: relevant.trim() || undefined,
        timeBound: timeBound.trim() || undefined,
        targetDate,
        useManualProgress,
        manualProgressOverride: useManualProgress ? parseInt(manualProgress, 10) : undefined,
      });
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save goal');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Title Input */}
      <View style={styles.section}>
        <Text style={styles.label}>Goal Title *</Text>
        <TextInput
          style={[styles.input, errors.title && styles.inputError]}
          value={title}
          onChangeText={(text) => {
            setTitle(text);
            setErrors({ ...errors, title: '' });
          }}
          placeholder="e.g., Practice Meditation Daily"
          maxLength={100}
          autoFocus
        />
        {errors.title && <Text style={styles.errorText}>{errors.title}</Text>}
      </View>

      {/* Description Input */}
      <View style={styles.section}>
        <Text style={styles.label}>Description (Optional)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder="What is this goal about?"
          multiline
          numberOfLines={3}
          maxLength={500}
        />
        <Text style={styles.charCount}>{description.length}/500</Text>
      </View>

      {/* SMART Framework */}
      <View style={styles.section}>
        <View style={styles.smartHeader}>
          <MaterialIcons name="stars" size={24} color={categoryColor} />
          <View style={styles.smartHeaderText}>
            <Text style={styles.smartTitle}>SMART Framework</Text>
            <Text style={styles.smartSubtitle}>
              Optional but recommended for better goal clarity
            </Text>
          </View>
        </View>

        <SMARTSection
          letter="S"
          value={specific}
          onChangeValue={setSpecific}
          color={categoryColor}
        />
        <SMARTSection
          letter="M"
          value={measurable}
          onChangeValue={setMeasurable}
          color={categoryColor}
        />
        <SMARTSection
          letter="A"
          value={achievable}
          onChangeValue={setAchievable}
          color={categoryColor}
        />
        <SMARTSection
          letter="R"
          value={relevant}
          onChangeValue={setRelevant}
          color={categoryColor}
        />
        <SMARTSection
          letter="T"
          value={timeBound}
          onChangeValue={setTimeBound}
          color={categoryColor}
        />
      </View>

      {/* Target Date */}
      <View style={styles.section}>
        <Text style={styles.label}>Target Date (Optional)</Text>
        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => setShowDatePicker(true)}
        >
          <MaterialIcons name="event" size={20} color="#666" />
          <Text style={styles.dateButtonText}>
            {targetDate
              ? targetDate.toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })
              : 'Select target date'}
          </Text>
          {targetDate && (
            <TouchableOpacity
              onPress={() => setTargetDate(undefined)}
              style={styles.clearDateButton}
            >
              <MaterialIcons name="close" size={18} color="#999" />
            </TouchableOpacity>
          )}
        </TouchableOpacity>

        {showDatePicker && (
          <DateTimePicker
            value={targetDate || new Date()}
            mode="date"
            display={Platform.OS === 'ios' ? 'inline' : 'default'}
            onChange={(event, selectedDate) => {
              setShowDatePicker(Platform.OS === 'ios');
              if (selectedDate) {
                setTargetDate(selectedDate);
              }
            }}
            minimumDate={new Date()}
          />
        )}
      </View>

      {/* Manual Progress Toggle */}
      <View style={styles.section}>
        <View style={styles.switchContainer}>
          <View style={styles.switchLeft}>
            <MaterialIcons name="edit" size={20} color={categoryColor} />
            <View style={styles.switchText}>
              <Text style={styles.switchLabel}>Manual Progress</Text>
              <Text style={styles.switchDescription}>
                Set progress manually instead of auto-calculation
              </Text>
            </View>
          </View>
          <Switch
            value={useManualProgress}
            onValueChange={setUseManualProgress}
            trackColor={{ false: '#ccc', true: categoryColor + '60' }}
            thumbColor={useManualProgress ? categoryColor : '#f4f3f4'}
          />
        </View>

        {useManualProgress && (
          <View style={styles.progressInput}>
            <Text style={styles.label}>Progress Percentage</Text>
            <View style={styles.progressInputRow}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={manualProgress}
                onChangeText={(text) => {
                  const num = parseInt(text, 10);
                  if (!isNaN(num) && num >= 0 && num <= 100) {
                    setManualProgress(text);
                  } else if (text === '') {
                    setManualProgress('0');
                  }
                }}
                keyboardType="number-pad"
                maxLength={3}
              />
              <Text style={styles.percentSign}>%</Text>
            </View>
          </View>
        )}
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.button, styles.cancelButton]}
          onPress={onCancel}
          disabled={isSubmitting}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.button,
            styles.submitButton,
            { backgroundColor: categoryColor },
            isSubmitting && styles.buttonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={isSubmitting || !title.trim()}
        >
          <Text style={styles.submitButtonText}>
            {isSubmitting ? 'Saving...' : submitLabel}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 4,
  },
  charCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 4,
  },
  smartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  smartHeaderText: {
    flex: 1,
  },
  smartTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  smartSubtitle: {
    fontSize: 13,
    color: '#666',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  dateButtonText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  clearDateButton: {
    padding: 4,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  switchLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginRight: 12,
  },
  switchText: {
    flex: 1,
  },
  switchLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  switchDescription: {
    fontSize: 12,
    color: '#666',
  },
  progressInput: {
    marginTop: 12,
  },
  progressInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  percentSign: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    paddingBottom: 32,
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
  },
  submitButton: {
    backgroundColor: '#6366f1',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
