/**
 * ActivitySelectionStep Component
 *
 * Step 2 of challenge wizard: Select activities
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { DisciplineActivity } from '@manifestation/shared';
import type { ChallengeFormData } from './ChallengeWizard';
import { ActivityHierarchySelector } from './ActivityHierarchySelector';
import { activityRepository } from '../../../repositories/ActivityRepository';

interface ActivitySelectionStepProps {
  formData?: Partial<ChallengeFormData>;
  updateFormData?: (data: Partial<ChallengeFormData>) => void;
  onNext?: () => void;
  onBack?: () => void;
}

export function ActivitySelectionStep({
  formData,
  updateFormData,
  onNext,
  onBack,
}: ActivitySelectionStepProps) {
  const [showSelector, setShowSelector] = useState(false);
  const [activities, setActivities] = useState<DisciplineActivity[]>([]);
  const [selectedActivities, setSelectedActivities] = useState<DisciplineActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const selectedIds = formData?.selectedActivityIds || [];

  /**
   * Load activities
   */
  useEffect(() => {
    loadActivities();
  }, []);

  const loadActivities = async () => {
    try {
      setLoading(true);
      const data = await activityRepository.getAll();
      setActivities(data);

      // Pre-select activities from formData
      const selected = data.filter((a) => selectedIds.includes(a.id));
      setSelectedActivities(selected);
    } catch (error: any) {
      console.error('Failed to load activities:', error);
      Alert.alert('Error', 'Failed to load activities');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle selection change
   */
  const handleSelectionChange = (activityIds: string[]) => {
    const selected = activities.filter((a) => activityIds.includes(a.id));
    setSelectedActivities(selected);
    updateFormData?.({ selectedActivityIds: activityIds });
    setShowSelector(false);
  };

  /**
   * Remove activity
   */
  const handleRemove = (activityId: string) => {
    const newIds = selectedIds.filter((id) => id !== activityId);
    const selected = activities.filter((a) => newIds.includes(a.id));
    setSelectedActivities(selected);
    updateFormData?.({ selectedActivityIds: newIds });
  };

  /**
   * Validate
   */
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (selectedIds.length === 0) {
      newErrors.activities = 'Please select at least one activity';
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <Text style={styles.stepTitle}>Select Activities</Text>
        <Text style={styles.stepSubtitle}>
          Choose the activities you want to track in this challenge
        </Text>

        {/* Select Button */}
        <TouchableOpacity
          style={styles.selectButton}
          onPress={() => setShowSelector(true)}
        >
          <Ionicons name="add-circle-outline" size={24} color="#6366f1" />
          <Text style={styles.selectButtonText}>
            {selectedIds.length > 0 ? 'Change Selection' : 'Select Activities'}
          </Text>
        </TouchableOpacity>

        {/* Error */}
        {errors.activities && (
          <Text style={styles.errorText}>{errors.activities}</Text>
        )}

        {/* Selected Activities */}
        {selectedActivities.length > 0 && (
          <View style={styles.selectedSection}>
            <View style={styles.selectedHeader}>
              <Text style={styles.selectedTitle}>
                Selected Activities ({selectedActivities.length})
              </Text>
            </View>

            <View style={styles.selectedList}>
              {selectedActivities.map((activity) => (
                <View key={activity.id} style={styles.activityChip}>
                  <View style={styles.activityChipContent}>
                    <Ionicons name="fitness" size={16} color="#6366f1" />
                    <Text style={styles.activityChipText} numberOfLines={1}>
                      {activity.title}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleRemove(activity.id)}
                    hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
                  >
                    <Ionicons name="close-circle" size={20} color="#94a3b8" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={20} color="#6366f1" />
          <Text style={styles.infoText}>
            Selected activities will be tracked daily throughout the challenge duration
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

      {/* Activity Selector Modal */}
      <ActivityHierarchySelector
        visible={showSelector}
        activities={activities}
        selectedIds={selectedIds}
        onClose={() => setShowSelector(false)}
        onConfirm={handleSelectionChange}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#6366f1',
    borderRadius: 8,
    paddingVertical: 16,
    marginBottom: 8,
  },
  selectButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6366f1',
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: 4,
    marginBottom: 12,
  },
  selectedSection: {
    marginTop: 16,
  },
  selectedHeader: {
    marginBottom: 12,
  },
  selectedTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  selectedList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  activityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eef2ff',
    paddingLeft: 12,
    paddingRight: 8,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  activityChipContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    maxWidth: 200,
  },
  activityChipText: {
    fontSize: 14,
    color: '#4f46e5',
    fontWeight: '500',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#eef2ff',
    padding: 12,
    borderRadius: 8,
    marginTop: 24,
  },
  infoText: {
    fontSize: 13,
    color: '#4f46e5',
    fontWeight: '500',
    flex: 1,
    lineHeight: 18,
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
