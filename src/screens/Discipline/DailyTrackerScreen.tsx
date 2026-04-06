/**
 * DailyTrackerScreen
 *
 * Main screen for daily activity tracking
 * Shows hierarchical view of all activities due on selected date
 * Supports quick logging with challenge-awareness
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { RootStackParamList, MainTabParamList } from '../../types';
import type { DisciplineActivity, ActivityLog } from '@manifestation/shared';

import { activityRepository } from '../../repositories/ActivityRepository';
import { goalRepository } from '../../repositories/GoalRepository';
import { categoryRepository } from '../../repositories/CategoryRepository';
import { supabase } from '../../services/supabase/SupabaseClient';
import {
  buildDailyHierarchy,
  calculateCompletionStats,
  formatDateForDisplay,
  getPreviousDate,
  getNextDate,
  isToday as checkIsToday,
  type DailyTrackerHierarchy,
} from '../../utils/dailyTrackerUtils';
import { QuickLogModal } from '../../components/discipline/tracker/QuickLogModal';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'DailyTracker'>,
  NativeStackScreenProps<RootStackParamList>
>;

const COLLAPSED_CATEGORIES_KEY = '@daily_tracker_collapsed_categories';

export function DailyTrackerScreen({ navigation }: Props) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [hierarchy, setHierarchy] = useState<DailyTrackerHierarchy[]>([]);
  const [activitiesDueToday, setActivitiesDueToday] = useState<DisciplineActivity[]>([]);
  const [todayLogs, setTodayLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [showLogModal, setShowLogModal] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<DisciplineActivity | null>(null);

  // Load collapsed state from AsyncStorage
  useEffect(() => {
    loadCollapsedState();
  }, []);

  // Load data when date changes
  useEffect(() => {
    loadData();
  }, [selectedDate]);

  const loadCollapsedState = async () => {
    try {
      const stored = await AsyncStorage.getItem(COLLAPSED_CATEGORIES_KEY);
      if (stored) {
        const collapsed = JSON.parse(stored) as string[];
        // Invert: we store collapsed IDs, but state tracks expanded IDs
        // Start with all expanded, then remove collapsed ones
        setExpandedCategories(new Set());
      }
    } catch (error) {
      console.error('Failed to load collapsed state:', error);
    }
  };

  const saveCollapsedState = async (expanded: Set<string>, allCategoryIds: string[]) => {
    try {
      const collapsed = allCategoryIds.filter(id => !expanded.has(id));
      await AsyncStorage.setItem(COLLAPSED_CATEGORIES_KEY, JSON.stringify(collapsed));
    } catch (error) {
      console.error('Failed to save collapsed state:', error);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);

      // Step 1: Get activities due on selected date
      const activities = await activityRepository.getActivitiesDueOn(selectedDate);
      setActivitiesDueToday(activities);

      // Step 2: Load logs for selected date
      const logs = await activityRepository.getLogsByDate(selectedDate);
      setTodayLogs(logs);

      // Step 3: Get unique goal IDs
      const goalIds = [...new Set(activities.map(a => a.goalId))];

      // Step 4: Load all goals in parallel
      const goals = await Promise.all(
        goalIds.map(id => goalRepository.getById(id))
      );

      // Step 5: Get unique category IDs
      const categoryIds = [
        ...new Set(goals.map(g => g.categoryId).filter(Boolean) as string[]),
      ];

      // Step 6: Load all categories in parallel
      const categories = await Promise.all(
        categoryIds.map(id => categoryRepository.getById(id))
      );

      // Step 7: Load challenge information for activities
      const activityIds = activities.map(a => a.id);
      const { data: challengeActivitiesData } = await supabase
        .from('challenge_activities')
        .select('activity_id, challenge_id, challenges(title, status)')
        .in('activity_id', activityIds);

      // Create a map of activity ID to active challenge names (supports multiple challenges)
      const activityChallengeMap = new Map<string, string[]>();
      (challengeActivitiesData || []).forEach((ca: any) => {
        if (ca.challenges && ca.challenges.status === 'active') {
          const existingChallenges = activityChallengeMap.get(ca.activity_id) || [];
          activityChallengeMap.set(ca.activity_id, [...existingChallenges, ca.challenges.title]);
        }
      });

      // Step 8: Build hierarchy with challenge data
      const hierarchyData = buildDailyHierarchy(
        categories,
        goals,
        activities,
        logs,
        expandedCategories,
        activityChallengeMap
      );

      setHierarchy(hierarchyData);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load activities');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handlePrevious = () => {
    setSelectedDate(getPreviousDate(selectedDate));
  };

  const handleNext = () => {
    setSelectedDate(getNextDate(selectedDate));
  };

  const handleToday = () => {
    setSelectedDate(new Date());
  };

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }

      // Save to AsyncStorage
      const allCategoryIds = hierarchy.map(h => h.category.id);
      saveCollapsedState(newSet, allCategoryIds);

      return newSet;
    });
  };

  const expandAll = () => {
    const allIds = hierarchy.map(h => h.category.id);
    setExpandedCategories(new Set(allIds));
    saveCollapsedState(new Set(allIds), allIds);
  };

  const collapseAll = () => {
    setExpandedCategories(new Set());
    const allIds = hierarchy.map(h => h.category.id);
    saveCollapsedState(new Set(), allIds);
  };

  const handleLogActivity = (activity: DisciplineActivity) => {
    setSelectedActivity(activity);
    setShowLogModal(true);
  };

  const handleLogSubmit = async (log: Partial<ActivityLog>) => {
    try {
      if (!selectedActivity) return;

      // Prepare log data with correct date
      const logData = {
        ...log,
        activityId: selectedActivity.id,
        logDate: selectedDate, // Use selected date, not today
      };

      // Submit log (upsert)
      await activityRepository.logActivity(logData as any);

      // Close modal and refresh data
      setShowLogModal(false);
      setSelectedActivity(null);
      await loadData();

      // Show success feedback
      Alert.alert('Success', 'Activity logged successfully!');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to log activity');
    }
  };

  const handleCloseLogModal = () => {
    setShowLogModal(false);
    setSelectedActivity(null);
  };

  // Get existing log for selected activity
  const getExistingLog = (): ActivityLog | null => {
    if (!selectedActivity) return null;
    return todayLogs.find(log => log.activityId === selectedActivity.id) || null;
  };

  const stats = calculateCompletionStats(activitiesDueToday, todayLogs);
  const isToday = checkIsToday(selectedDate);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Date Selector Header */}
      <View style={styles.header}>
        <View style={styles.dateNavigation}>
          <TouchableOpacity onPress={handlePrevious} style={styles.navButton}>
            <MaterialIcons name="chevron-left" size={28} color="#6366f1" />
          </TouchableOpacity>

          <TouchableOpacity onPress={handleToday} style={styles.dateButton}>
            <MaterialIcons name="calendar-today" size={20} color="#6366f1" />
            <Text style={styles.dateText}>{formatDateForDisplay(selectedDate)}</Text>
            {!isToday && (
              <View style={styles.todayBadge}>
                <Text style={styles.todayBadgeText}>Go to Today</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={handleNext} style={styles.navButton}>
            <MaterialIcons name="chevron-right" size={28} color="#6366f1" />
          </TouchableOpacity>
        </View>

        {/* Collapse/Expand Actions */}
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={collapseAll} style={styles.actionButton}>
            <MaterialIcons name="unfold-less" size={20} color="#64748b" />
          </TouchableOpacity>
          <TouchableOpacity onPress={expandAll} style={styles.actionButton}>
            <MaterialIcons name="unfold-more" size={20} color="#64748b" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Completion Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {stats.logged}/{stats.total}
          </Text>
          <Text style={styles.statLabel}>Activities Logged</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.percentage}%</Text>
          <Text style={styles.statLabel}>Completion</Text>
        </View>
      </View>

      {/* Activity List */}
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading activities...</Text>
          </View>
        ) : hierarchy.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="check-circle-outline" size={64} color="#cbd5e1" />
            <Text style={styles.emptyTitle}>No Activities Due {isToday ? 'Today' : 'on This Date'}</Text>
            <Text style={styles.emptyText}>
              {isToday
                ? 'Great job! You have no activities scheduled for today.'
                : 'There are no activities scheduled for this date.'}
            </Text>
            {!isToday && (
              <TouchableOpacity onPress={handleToday} style={styles.goTodayButton}>
                <Text style={styles.goTodayButtonText}>Go to Today</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.hierarchyContainer}>
            {hierarchy.map(categorySection => {
              const isExpanded = expandedCategories.has(categorySection.category.id);
              const activityCount = categorySection.goals.reduce(
                (sum, g) => sum + g.activities.length,
                0
              );

              return (
                <View key={categorySection.category.id} style={styles.categorySection}>
                  {/* Category Header */}
                  <TouchableOpacity
                    onPress={() => toggleCategory(categorySection.category.id)}
                    style={[
                      styles.categoryHeader,
                      { borderLeftColor: categorySection.category.color },
                    ]}
                  >
                    <View style={styles.categoryHeaderLeft}>
                      <Text style={styles.categoryIcon}>{categorySection.category.icon}</Text>
                      <View>
                        <Text style={styles.categoryName}>{categorySection.category.name}</Text>
                        <Text style={styles.activityCount}>
                          {activityCount} {activityCount === 1 ? 'activity' : 'activities'}
                        </Text>
                      </View>
                    </View>
                    <MaterialIcons
                      name={isExpanded ? 'expand-less' : 'expand-more'}
                      size={24}
                      color="#64748b"
                    />
                  </TouchableOpacity>

                  {/* Category Content (Goals & Activities) */}
                  {isExpanded && (
                    <View style={styles.categoryContent}>
                      {categorySection.goals.map(goalSection => (
                        <View key={goalSection.goal.id} style={styles.goalSection}>
                          {/* Goal Header */}
                          <View style={styles.goalHeader}>
                            <Text style={styles.goalName}>{goalSection.goal.title}</Text>
                            <Text style={styles.goalProgress}>
                              {goalSection.goal.progressPercentage}% complete
                            </Text>
                          </View>

                          {/* Activities */}
                          {goalSection.activities.map(({ activity, log, challengeNames }) => (
                            <View key={activity.id} style={styles.activityCard}>
                              {/* Activity Header */}
                              <View style={styles.activityHeader}>
                                <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                  <Text style={styles.activityTitle}>{activity.title}</Text>
                                  {challengeNames && challengeNames.length > 0 && (
                                    <TouchableOpacity
                                      onPress={() => {
                                        Alert.alert(
                                          challengeNames.length === 1 ? 'Challenge' : 'Challenges',
                                          challengeNames.map((name, idx) =>
                                            challengeNames.length > 1 ? `${idx + 1}. ${name}` : name
                                          ).join('\n'),
                                          [{ text: 'OK' }]
                                        );
                                      }}
                                      style={styles.challengeBadge}
                                    >
                                      <MaterialIcons name="emoji-events" size={14} color="#9333ea" />
                                      {challengeNames.length > 1 && (
                                        <Text style={styles.challengeCount}>{challengeNames.length}</Text>
                                      )}
                                    </TouchableOpacity>
                                  )}
                                </View>
                                {log ? (
                                  <View style={[styles.statusBadge, styles.statusLogged]}>
                                    <MaterialIcons name="check" size={16} color="#fff" />
                                    <Text style={styles.statusBadgeText}>Logged</Text>
                                  </View>
                                ) : (
                                  <TouchableOpacity
                                    onPress={() => handleLogActivity(activity)}
                                    style={styles.logButton}
                                  >
                                    <Text style={styles.logButtonText}>Log Now</Text>
                                  </TouchableOpacity>
                                )}
                              </View>

                              {/* Activity Metadata */}
                              <View style={styles.activityMetadata}>
                                <View style={styles.metadataBadge}>
                                  <Text style={styles.metadataText}>
                                    {activity.trackingType === 'boolean' && '✓ Yes/No'}
                                    {activity.trackingType === 'number' && '# Number'}
                                    {activity.trackingType === 'multiselect' && '☰ Multi-select'}
                                    {activity.trackingType === 'text' && '📝 Text'}
                                  </Text>
                                </View>
                                <View style={styles.metadataBadge}>
                                  <Text style={styles.metadataText}>
                                    {activity.frequencyType === 'daily' && 'Daily'}
                                    {activity.frequencyType === 'specific_days' && 'Specific days'}
                                    {activity.frequencyType === 'custom' && 'Custom'}
                                  </Text>
                                </View>
                                {activity.currentStreak > 0 && (
                                  <View style={styles.metadataBadge}>
                                    <Text style={styles.metadataText}>
                                      🔥 {activity.currentStreak} day streak
                                    </Text>
                                  </View>
                                )}
                              </View>

                              {/* Logged Value Display */}
                              {log && (
                                <View style={styles.loggedInfo}>
                                  <Text style={styles.loggedLabel}>Logged:</Text>
                                  <Text style={styles.loggedValue}>
                                    {activity.trackingType === 'boolean' && 'Completed'}
                                    {activity.trackingType === 'number' &&
                                      `${(log.value as any).value} ${(log.value as any).unit}`}
                                    {activity.trackingType === 'multiselect' &&
                                      (log.value as any).selected?.join(', ')}
                                    {activity.trackingType === 'text' &&
                                      `"${(log.value as any).text?.substring(0, 50)}${
                                        (log.value as any).text?.length > 50 ? '...' : ''
                                      }"`}
                                  </Text>
                                  <View style={[styles.statusDot, getStatusDotStyle(log.status)]} />
                                </View>
                              )}
                            </View>
                          ))}
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* QuickLogModal */}
      <QuickLogModal
        visible={showLogModal}
        activity={selectedActivity}
        existingLog={getExistingLog()}
        onClose={handleCloseLogModal}
        onSubmit={handleLogSubmit}
      />
    </SafeAreaView>
  );
}

function getStatusDotStyle(status: string) {
  switch (status) {
    case 'good':
      return { backgroundColor: '#10b981' };
    case 'neutral':
      return { backgroundColor: '#3b82f6' };
    case 'bad':
      return { backgroundColor: '#ef4444' };
    case 'skipped':
      return { backgroundColor: '#94a3b8' };
    default:
      return { backgroundColor: '#cbd5e1' };
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  navButton: {
    padding: 4,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  todayBadge: {
    marginLeft: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: '#6366f1',
    borderRadius: 4,
  },
  todayBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6366f1',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    padding: 32,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#64748b',
  },
  emptyContainer: {
    padding: 48,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  goTodayButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#6366f1',
    borderRadius: 8,
  },
  goTodayButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  hierarchyContainer: {
    padding: 16,
    gap: 16,
  },
  categorySection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    overflow: 'hidden',
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderLeftWidth: 4,
  },
  categoryHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  categoryIcon: {
    fontSize: 28,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  activityCount: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  categoryContent: {
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  goalSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  goalName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    flex: 1,
  },
  goalProgress: {
    fontSize: 12,
    color: '#64748b',
  },
  activityCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  activityTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1e293b',
    flex: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusLogged: {
    backgroundColor: '#10b981',
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  logButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#6366f1',
    borderRadius: 6,
  },
  logButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  activityMetadata: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  metadataBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#fff',
    borderRadius: 4,
  },
  metadataText: {
    fontSize: 11,
    color: '#64748b',
  },
  loggedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  loggedLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  loggedValue: {
    fontSize: 12,
    color: '#1e293b',
    flex: 1,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  challengeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3e8ff',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    gap: 2,
  },
  challengeCount: {
    fontSize: 10,
    fontWeight: '600',
    color: '#9333ea',
  },
});
