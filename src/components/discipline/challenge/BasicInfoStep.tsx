/**
 * BasicInfoStep Component
 *
 * Step 1 of challenge wizard: Title, description, and dates
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import type { ChallengeFormData } from './ChallengeWizard';

interface BasicInfoStepProps {
  formData?: Partial<ChallengeFormData>;
  updateFormData?: (data: Partial<ChallengeFormData>) => void;
  onNext?: () => void;
  onBack?: () => void;
}

export function BasicInfoStep({ formData, updateFormData, onNext, onBack }: BasicInfoStepProps) {
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const title = formData?.title || '';
  const description = formData?.description || '';
  const startDate = formData?.startDate || new Date();
  const endDate = formData?.endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  /**
   * Validate form
   */
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = 'Title is required';
    } else if (title.length > 100) {
      newErrors.title = 'Title must be 100 characters or less';
    }

    if (description && description.length > 500) {
      newErrors.description = 'Description must be 500 characters or less';
    }

    if (endDate <= startDate) {
      newErrors.endDate = 'End date must be after start date';
    }

    if (startDate < new Date(Date.now() - 24 * 60 * 60 * 1000)) {
      newErrors.startDate = 'Start date cannot be in the past';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle next
   */
  const handleNext = () => {
    if (validate() && onNext) {
      onNext();
    }
  };

  /**
   * Handle date change
   */
  const handleStartDateChange = (event: any, selectedDate?: Date) => {
    setShowStartPicker(Platform.OS === 'ios');
    if (selectedDate && updateFormData) {
      updateFormData({ startDate: selectedDate });
    }
  };

  const handleEndDateChange = (event: any, selectedDate?: Date) => {
    setShowEndPicker(Platform.OS === 'ios');
    if (selectedDate && updateFormData) {
      updateFormData({ endDate: selectedDate });
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <Text style={styles.stepTitle}>Basic Information</Text>
        <Text style={styles.stepSubtitle}>
          Tell us about your challenge
        </Text>

        {/* Title */}
        <View style={styles.field}>
          <Text style={styles.label}>
            Challenge Title <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={[styles.input, errors.title && styles.inputError]}
            value={title}
            onChangeText={(text) => updateFormData?.({ title: text })}
            placeholder="e.g., 30-Day Meditation Challenge"
            maxLength={100}
            autoCapitalize="words"
          />
          {errors.title ? (
            <Text style={styles.errorText}>{errors.title}</Text>
          ) : (
            <Text style={styles.helperText}>{title.length}/100 characters</Text>
          )}
        </View>

        {/* Description */}
        <View style={styles.field}>
          <Text style={styles.label}>Description (optional)</Text>
          <TextInput
            style={[styles.textarea, errors.description && styles.inputError]}
            value={description}
            onChangeText={(text) => updateFormData?.({ description: text })}
            placeholder="Describe what this challenge is about..."
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            maxLength={500}
          />
          {errors.description ? (
            <Text style={styles.errorText}>{errors.description}</Text>
          ) : (
            <Text style={styles.helperText}>{(description || '').length}/500 characters</Text>
          )}
        </View>

        {/* Start Date */}
        <View style={styles.field}>
          <Text style={styles.label}>
            Start Date <Text style={styles.required}>*</Text>
          </Text>
          <TouchableOpacity
            style={[styles.dateButton, errors.startDate && styles.inputError]}
            onPress={() => setShowStartPicker(true)}
          >
            <Ionicons name="calendar-outline" size={20} color="#6366f1" />
            <Text style={styles.dateText}>{startDate.toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}</Text>
          </TouchableOpacity>
          {errors.startDate && <Text style={styles.errorText}>{errors.startDate}</Text>}

          {showStartPicker && (
            <DateTimePicker
              value={startDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleStartDateChange}
              minimumDate={new Date()}
            />
          )}
        </View>

        {/* End Date */}
        <View style={styles.field}>
          <Text style={styles.label}>
            End Date <Text style={styles.required}>*</Text>
          </Text>
          <TouchableOpacity
            style={[styles.dateButton, errors.endDate && styles.inputError]}
            onPress={() => setShowEndPicker(true)}
          >
            <Ionicons name="calendar-outline" size={20} color="#6366f1" />
            <Text style={styles.dateText}>{endDate.toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}</Text>
          </TouchableOpacity>
          {errors.endDate && <Text style={styles.errorText}>{errors.endDate}</Text>}

          {showEndPicker && (
            <DateTimePicker
              value={endDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleEndDateChange}
              minimumDate={startDate}
            />
          )}
        </View>

        {/* Duration Info */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={20} color="#6366f1" />
          <Text style={styles.infoText}>
            Duration: {Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))} days
          </Text>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionBar}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Ionicons name="arrow-back" size={20} color="#64748b" />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
          <Text style={styles.nextButtonText}>Next</Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 24,
  },
  field: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  required: {
    color: '#ef4444',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1e293b',
  },
  textarea: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1e293b',
    minHeight: 100,
  },
  inputError: {
    borderColor: '#ef4444',
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
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  dateText: {
    fontSize: 15,
    color: '#1e293b',
    fontWeight: '500',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#eef2ff',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  infoText: {
    fontSize: 13,
    color: '#4f46e5',
    fontWeight: '500',
    flex: 1,
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  backButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#64748b',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#6366f1',
  },
  nextButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
});
