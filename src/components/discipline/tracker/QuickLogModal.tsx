/**
 * QuickLogModal
 *
 * Modal for quickly logging activity completion
 * Supports all tracking types: boolean, number, multiselect, text
 * Includes status selection and optional notes
 * Challenge-ready with dual logging capability (placeholder for future)
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import type { DisciplineActivity, ActivityLog } from '@manifestation/shared';
import { TrackingInputs } from './TrackingInputs';
import { StatusSelector } from './StatusSelector';

interface QuickLogModalProps {
  visible: boolean;
  activity: DisciplineActivity | null;
  existingLog: ActivityLog | null;
  onClose: () => void;
  onSubmit: (log: Partial<ActivityLog>) => Promise<void>;
}

export function QuickLogModal({
  visible,
  activity,
  existingLog,
  onClose,
  onSubmit,
}: QuickLogModalProps) {
  // Form state
  const [value, setValue] = useState<any>(null);
  const [status, setStatus] = useState<'good' | 'neutral' | 'bad' | 'skipped'>('good');
  const [notes, setNotes] = useState('');
  const [showNotes, setShowNotes] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Initialize form with existing log data
  useEffect(() => {
    if (existingLog) {
      setValue(existingLog.value);
      setStatus(existingLog.status);
      setNotes(existingLog.notes || '');
      setShowNotes(!!existingLog.notes);
    } else {
      // Reset form for new log
      setValue(getDefaultValue());
      setStatus('good');
      setNotes('');
      setShowNotes(false);
    }
  }, [existingLog, activity]);

  // Get default value based on tracking type
  const getDefaultValue = () => {
    if (!activity) return null;

    switch (activity.trackingType) {
      case 'boolean':
        return false;
      case 'number':
        return '';
      case 'multiselect':
        return [];
      case 'text':
        return '';
      default:
        return null;
    }
  };

  // Handle value change from tracking inputs
  const handleValueChange = (newValue: any) => {
    setValue(newValue);

    // Auto-suggest status based on value
    if (activity) {
      const suggestedStatus = getSuggestedStatus(newValue);
      setStatus(suggestedStatus);
    }
  };

  // Suggest status based on value and target
  const getSuggestedStatus = (val: any): 'good' | 'neutral' | 'bad' | 'skipped' => {
    if (!activity) return 'good';

    switch (activity.trackingType) {
      case 'boolean':
        return val ? 'good' : 'neutral';

      case 'number': {
        const numValue = parseFloat(val);
        if (isNaN(numValue)) return 'neutral';

        const config = activity.targetConfig as { target?: number; min?: number; max?: number };
        const target = config.target || 0;

        if (numValue >= target) return 'good';
        if (numValue >= target * 0.7) return 'neutral';
        return 'bad';
      }

      case 'multiselect': {
        const config = activity.targetConfig as { minSelect?: number };
        const minSelect = config.minSelect || 1;
        return Array.isArray(val) && val.length >= minSelect ? 'good' : 'neutral';
      }

      case 'text':
        return val && val.trim().length > 0 ? 'good' : 'neutral';

      default:
        return 'good';
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    if (!activity) return false;

    switch (activity.trackingType) {
      case 'boolean':
        return true; // Always valid

      case 'number': {
        if (!value || value.trim() === '') {
          Alert.alert('Missing Value', 'Please enter a number');
          return false;
        }
        const numValue = parseFloat(value);
        if (isNaN(numValue)) {
          Alert.alert('Invalid Number', 'Please enter a valid number');
          return false;
        }
        const config = activity.targetConfig as { min?: number; max?: number };
        if (config.min !== undefined && numValue < config.min) {
          Alert.alert('Out of Range', `Value must be at least ${config.min}`);
          return false;
        }
        if (config.max !== undefined && numValue > config.max) {
          Alert.alert('Out of Range', `Value must be at most ${config.max}`);
          return false;
        }
        return true;
      }

      case 'multiselect': {
        const config = activity.targetConfig as { minSelect?: number; maxSelect?: number };
        if (config.minSelect && (!Array.isArray(value) || value.length < config.minSelect)) {
          Alert.alert('Selection Required', `Please select at least ${config.minSelect} option(s)`);
          return false;
        }
        return true;
      }

      case 'text': {
        const config = activity.targetConfig as { required?: boolean };
        if (config.required && (!value || value.trim() === '')) {
          Alert.alert('Text Required', 'Please enter some text');
          return false;
        }
        return true;
      }

      default:
        return true;
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const log: Partial<ActivityLog> = {
        activityId: activity!.id,
        logDate: new Date(),
        status,
        value,
        notes: notes.trim() || undefined,
      };

      await onSubmit(log);
      onClose();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save log');
    } finally {
      setSubmitting(false);
    }
  };

  if (!activity) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>{activity.title}</Text>
            {activity.description && (
              <Text style={styles.headerDescription}>{activity.description}</Text>
            )}
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <MaterialIcons name="close" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Tracking Input */}
          <View style={styles.section}>
            <TrackingInputs
              trackingType={activity.trackingType}
              targetConfig={activity.targetConfig}
              value={value}
              onChange={handleValueChange}
            />
          </View>

          {/* Status Selector */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>How did it go?</Text>
            <StatusSelector value={status} onChange={setStatus} />
          </View>

          {/* Notes (Collapsible) */}
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.notesToggle}
              onPress={() => setShowNotes(!showNotes)}
            >
              <Text style={styles.notesToggleText}>
                {showNotes ? '▼' : '▶'} Add notes (optional)
              </Text>
            </TouchableOpacity>

            {showNotes && (
              <TextInput
                style={styles.notesInput}
                placeholder="Add any notes or reflections..."
                placeholderTextColor="#999"
                multiline
                numberOfLines={4}
                value={notes}
                onChangeText={setNotes}
                textAlignVertical="top"
              />
            )}
          </View>

          {/* Challenge Context (Future) */}
          {/* Will display challenge badges and dual logging options here */}
        </ScrollView>

        {/* Footer Actions */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onClose}
            disabled={submitting}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            <Text style={styles.submitButtonText}>
              {submitting ? 'Logging...' : existingLog ? 'Update Log' : 'Log Activity'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerContent: {
    flex: 1,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  headerDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {
    marginTop: 24,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  notesToggle: {
    paddingVertical: 8,
  },
  notesToggleText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6366f1',
  },
  notesInput: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    fontSize: 14,
    color: '#000',
    minHeight: 100,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  submitButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: '#6366f1',
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#cbd5e1',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
