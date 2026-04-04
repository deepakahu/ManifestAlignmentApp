/**
 * GoalDetailScreen
 *
 * Shows goal details with SMART framework and activities
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActionSheetIOS,
  Platform,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import type { Goal, Category, DisciplineActivity, ActivityLog } from '@manifestation/shared';
import { formatDate } from '@manifestation/shared';
import { goalRepository } from '../../repositories/GoalRepository';
import { categoryRepository } from '../../repositories/CategoryRepository';
import { activityRepository } from '../../repositories/ActivityRepository';
import { ActivityList } from '../../components/discipline/activity/ActivityList';
import { ActivityForm, ActivityFormData } from '../../components/discipline/activity/ActivityForm';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

type Props = NativeStackScreenProps<any, 'GoalDetail'>;

export function GoalDetailScreen({ navigation, route }: Props) {
  const { goalId } = route.params as { goalId: string };
  const [goal, setGoal] = useState<Goal | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState<DisciplineActivity[]>([]);
  const [todayLogs, setTodayLogs] = useState<ActivityLog[]>([]);
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [editingActivity, setEditingActivity] = useState<DisciplineActivity | null>(null);

  // Load goal, category, and activities
  const loadData = useCallback(async () => {
    try {
      const goalData = await goalRepository.getById(goalId);
      if (!goalData) {
        Alert.alert('Error', 'Goal not found');
        navigation.goBack();
        return;
      }

      setGoal(goalData);

      if (goalData.categoryId) {
        const categoryData = await categoryRepository.getById(goalData.categoryId);
        setCategory(categoryData);
      }

      // Load activities for this goal
      const activitiesData = await activityRepository.getByGoal(goalId);
      setActivities(activitiesData);

      // Load today's logs for quick status display
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const logsData = await activityRepository.getLogsByDate(today);
      setTodayLogs(logsData);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load goal');
    } finally {
      setLoading(false);
    }
  }, [goalId, navigation]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleMenuPress = () => {
    if (!goal) return;

    const options = goal.status === 'completed'
      ? ['Edit', 'Archive', 'Cancel']
      : ['Edit', 'Complete', 'Archive', 'Cancel'];

    const destructiveButtonIndex = goal.status === 'completed' ? 1 : 2;
    const cancelButtonIndex = options.length - 1;

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          destructiveButtonIndex,
          cancelButtonIndex,
        },
        (buttonIndex) => {
          if (goal.status === 'completed') {
            if (buttonIndex === 0) navigation.navigate('EditGoal', { goalId: goal.id });
            if (buttonIndex === 1) handleArchive();
          } else {
            if (buttonIndex === 0) navigation.navigate('EditGoal', { goalId: goal.id });
            if (buttonIndex === 1) handleComplete();
            if (buttonIndex === 2) handleArchive();
          }
        }
      );
    } else {
      const alertOptions = goal.status === 'completed'
        ? [
            { text: 'Edit', onPress: () => navigation.navigate('EditGoal', { goalId: goal.id }) },
            { text: 'Archive', onPress: handleArchive, style: 'destructive' },
            { text: 'Cancel', style: 'cancel' },
          ]
        : [
            { text: 'Edit', onPress: () => navigation.navigate('EditGoal', { goalId: goal.id }) },
            { text: 'Complete', onPress: handleComplete },
            { text: 'Archive', onPress: handleArchive, style: 'destructive' },
            { text: 'Cancel', style: 'cancel' },
          ];

      Alert.alert('Goal Actions', 'Choose an action', alertOptions);
    }
  };

  const handleComplete = async () => {
    if (!goal) return;

    Alert.alert(
      'Complete Goal',
      `Mark "${goal.title}" as completed?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          onPress: async () => {
            try {
              await goalRepository.complete(goal.id);
              loadData();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to complete goal');
            }
          },
        },
      ]
    );
  };

  const handleArchive = async () => {
    if (!goal) return;

    Alert.alert(
      'Archive Goal',
      `Are you sure you want to archive "${goal.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Archive',
          style: 'destructive',
          onPress: async () => {
            try {
              await goalRepository.archive(goal.id);
              navigation.goBack();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to archive goal');
            }
          },
        },
      ]
    );
  };

  // Activity handlers
  const handleAddActivity = () => {
    setEditingActivity(null);
    setShowActivityForm(true);
  };

  const handleEditActivity = (activity: DisciplineActivity) => {
    setEditingActivity(activity);
    setShowActivityForm(true);
  };

  const handleDeleteActivity = async (activity: DisciplineActivity) => {
    Alert.alert(
      'Delete Activity',
      `Are you sure you want to delete "${activity.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await activityRepository.delete(activity.id);
              loadData();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete activity');
            }
          },
        },
      ]
    );
  };

  const handleToggleActive = async (activity: DisciplineActivity) => {
    try {
      await activityRepository.update(activity.id, {
        isActive: !activity.isActive,
      });
      loadData();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update activity');
    }
  };

  const handleActivitySubmit = async (data: ActivityFormData) => {
    if (!goal) return;

    try {
      if (editingActivity) {
        await activityRepository.update(editingActivity.id, {
          ...data,
          isActive: editingActivity.isActive,
          orderIndex: editingActivity.orderIndex,
        });
      } else {
        await activityRepository.create({
          goalId: goal.id,
          ...data,
          reminderChannels: {
            push: true,
            alarm: false,
            sms: false,
            email: false,
          },
          isActive: true,
          orderIndex: 0,
        });
      }
      setShowActivityForm(false);
      setEditingActivity(null);
      loadData();
    } catch (error: any) {
      throw error; // Let form handle the error
    }
  };

  if (loading || !goal) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <Text>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const color = category?.color || '#6366f1';
  const smartFieldsCount = [
    goal.specific,
    goal.measurable,
    goal.achievable,
    goal.relevant,
    goal.timeBound,
  ].filter(Boolean).length;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: color + '15' }]}>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={navigation.goBack}>
              <MaterialIcons name="arrow-back" size={24} color="#000" />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleMenuPress}>
              <MaterialIcons name="more-vert" size={24} color="#000" />
            </TouchableOpacity>
          </View>

          <View style={styles.headerContent}>
            <Text style={styles.title}>{goal.title}</Text>
            {goal.description && (
              <Text style={styles.description}>{goal.description}</Text>
            )}

            {/* Status Badge */}
            <View style={styles.badges}>
              <View style={[styles.statusBadge, { backgroundColor: color }]}>
                <MaterialIcons
                  name={goal.status === 'completed' ? 'check-circle' : 'flag'}
                  size={14}
                  color="#fff"
                />
                <Text style={styles.statusText}>
                  {goal.status.charAt(0).toUpperCase() + goal.status.slice(1)}
                </Text>
              </View>
              {category && (
                <View style={[styles.categoryBadge, { backgroundColor: color + '30' }]}>
                  <Text style={[styles.categoryText, { color }]}>
                    {category.name}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Progress */}
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Progress</Text>
              <Text style={styles.progressValue}>{goal.progressPercentage}%</Text>
            </View>
            <View style={styles.progressBar}>
              <View
                style={[styles.progressFill, { width: `${goal.progressPercentage}%`, backgroundColor: color }]}
              />
            </View>
            {goal.useManualProgress && (
              <Text style={styles.manualNote}>
                <MaterialIcons name="edit" size={12} color="#666" />
                {' '}Manual progress tracking enabled
              </Text>
            )}
          </View>
        </View>

        {/* SMART Framework */}
        {smartFieldsCount > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="stars" size={20} color={color} />
              <Text style={styles.sectionTitle}>SMART Framework</Text>
              <Text style={styles.sectionCount}>({smartFieldsCount}/5)</Text>
            </View>

            {goal.specific && (
              <View style={styles.smartField}>
                <View style={[styles.smartLetter, { backgroundColor: color }]}>
                  <Text style={styles.smartLetterText}>S</Text>
                </View>
                <View style={styles.smartContent}>
                  <Text style={styles.smartTitle}>Specific</Text>
                  <Text style={styles.smartText}>{goal.specific}</Text>
                </View>
              </View>
            )}

            {goal.measurable && (
              <View style={styles.smartField}>
                <View style={[styles.smartLetter, { backgroundColor: color }]}>
                  <Text style={styles.smartLetterText}>M</Text>
                </View>
                <View style={styles.smartContent}>
                  <Text style={styles.smartTitle}>Measurable</Text>
                  <Text style={styles.smartText}>{goal.measurable}</Text>
                </View>
              </View>
            )}

            {goal.achievable && (
              <View style={styles.smartField}>
                <View style={[styles.smartLetter, { backgroundColor: color }]}>
                  <Text style={styles.smartLetterText}>A</Text>
                </View>
                <View style={styles.smartContent}>
                  <Text style={styles.smartTitle}>Achievable</Text>
                  <Text style={styles.smartText}>{goal.achievable}</Text>
                </View>
              </View>
            )}

            {goal.relevant && (
              <View style={styles.smartField}>
                <View style={[styles.smartLetter, { backgroundColor: color }]}>
                  <Text style={styles.smartLetterText}>R</Text>
                </View>
                <View style={styles.smartContent}>
                  <Text style={styles.smartTitle}>Relevant</Text>
                  <Text style={styles.smartText}>{goal.relevant}</Text>
                </View>
              </View>
            )}

            {goal.timeBound && (
              <View style={styles.smartField}>
                <View style={[styles.smartLetter, { backgroundColor: color }]}>
                  <Text style={styles.smartLetterText}>T</Text>
                </View>
                <View style={styles.smartContent}>
                  <Text style={styles.smartTitle}>Time-bound</Text>
                  <Text style={styles.smartText}>{goal.timeBound}</Text>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Target Date */}
        {goal.targetDate && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="event" size={20} color={color} />
              <Text style={styles.sectionTitle}>Target Date</Text>
            </View>
            <Text style={styles.dateText}>
              {formatDate(goal.targetDate, { year: 'numeric', month: 'long', day: 'numeric' })}
            </Text>
          </View>
        )}

        {/* Activities */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="check-circle" size={20} color={color} />
            <Text style={styles.sectionTitle}>Activities</Text>
            <Text style={styles.sectionCount}>({activities.length})</Text>
          </View>

          {activities.length === 0 ? (
            <View style={styles.placeholder}>
              <MaterialIcons name="add-circle-outline" size={48} color="#ccc" />
              <Text style={styles.placeholderText}>
                No activities yet. Add your first activity to start tracking!
              </Text>
              <TouchableOpacity
                style={[styles.placeholderButton, { backgroundColor: color }]}
                onPress={handleAddActivity}
              >
                <MaterialIcons name="add" size={20} color="#fff" />
                <Text style={styles.placeholderButtonText}>Add Activity</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <ActivityList
                activities={activities}
                todayLogs={todayLogs}
                goalColor={color}
                showInactive={false}
                onEdit={handleEditActivity}
                onDelete={handleDeleteActivity}
                onToggleActive={handleToggleActive}
              />
              <TouchableOpacity
                style={[styles.addButton, { backgroundColor: color }]}
                onPress={handleAddActivity}
              >
                <MaterialIcons name="add" size={20} color="#fff" />
                <Text style={styles.addButtonText}>Add Activity</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>

      {/* Activity Form Modal */}
      <Modal
        visible={showActivityForm}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setShowActivityForm(false);
          setEditingActivity(null);
        }}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {editingActivity ? 'Edit Activity' : 'New Activity'}
            </Text>
            <TouchableOpacity
              onPress={() => {
                setShowActivityForm(false);
                setEditingActivity(null);
              }}
            >
              <MaterialIcons name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>
          <ActivityForm
            activity={editingActivity || undefined}
            goalColor={color}
            onSubmit={handleActivitySubmit}
            onCancel={() => {
              setShowActivityForm(false);
              setEditingActivity(null);
            }}
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 16,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerContent: {
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
    marginBottom: 12,
  },
  badges: {
    flexDirection: 'row',
    gap: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
  },
  progressSection: {
    marginTop: 8,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  progressValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  progressBar: {
    height: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 5,
  },
  manualNote: {
    fontSize: 11,
    color: '#666',
    marginTop: 6,
    fontStyle: 'italic',
  },
  section: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  sectionCount: {
    fontSize: 14,
    color: '#999',
  },
  smartField: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 12,
  },
  smartLetter: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  smartLetterText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  smartContent: {
    flex: 1,
  },
  smartTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  smartText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  dateText: {
    fontSize: 16,
    color: '#000',
  },
  placeholder: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  placeholderText: {
    fontSize: 14,
    color: '#999',
    marginTop: 12,
    marginBottom: 16,
    textAlign: 'center',
  },
  placeholderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  placeholderButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#6366f1',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  addButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
  },
});
