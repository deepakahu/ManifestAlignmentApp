/**
 * ActivityList Component
 *
 * Displays a list of activities with tracking status
 * Groups by active/inactive status
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
} from 'react-native';
import type { DisciplineActivity, ActivityLog } from '@manifestation/shared';
import { ActivityCard } from './ActivityCard';

interface ActivityListProps {
  activities: DisciplineActivity[];
  todayLogs?: ActivityLog[];
  goalColor?: string;
  showInactive?: boolean;
  loading?: boolean;
  onRefresh?: () => void;
  onPress?: (activity: DisciplineActivity) => void;
  onQuickLog?: (activity: DisciplineActivity) => void;
  onEdit?: (activity: DisciplineActivity) => void;
  onDelete?: (activity: DisciplineActivity) => void;
  onToggleActive?: (activity: DisciplineActivity) => void;
}

export function ActivityList({
  activities,
  todayLogs = [],
  goalColor = '#6366f1',
  showInactive = false,
  loading = false,
  onRefresh,
  onPress,
  onQuickLog,
  onEdit,
  onDelete,
  onToggleActive,
}: ActivityListProps) {
  const activeActivities = activities.filter((a) => a.isActive);
  const inactiveActivities = activities.filter((a) => !a.isActive);

  const getTodayLog = (activityId: string) => {
    return todayLogs.find((log) => log.activityId === activityId);
  };

  const isDueToday = (activity: DisciplineActivity): boolean => {
    const today = new Date().getDay(); // 0 = Sunday, 6 = Saturday

    if (activity.frequencyType === 'daily') {
      return true;
    }

    if (activity.frequencyType === 'specific_days') {
      const config = activity.frequencyConfig as { days: number[] };
      return config.days?.includes(today) || false;
    }

    // For custom frequency, check if today's date is in the dates array
    if (activity.frequencyType === 'custom') {
      const config = activity.frequencyConfig as { dates: string[] };
      const todayStr = new Date().toISOString().split('T')[0];
      return config.dates?.includes(todayStr) || false;
    }

    return false;
  };

  const renderActivity = ({ item }: { item: DisciplineActivity }) => (
    <ActivityCard
      activity={item}
      goalColor={goalColor}
      todayLog={getTodayLog(item.id)}
      isDueToday={isDueToday(item)}
      onPress={onPress}
      onQuickLog={onQuickLog}
      onEdit={onEdit}
      onDelete={onDelete}
      onToggleActive={onToggleActive}
    />
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>No activities yet</Text>
      <Text style={styles.emptySubtext}>
        Add your first activity to start tracking
      </Text>
    </View>
  );

  if (activities.length === 0) {
    return renderEmpty();
  }

  return (
    <View style={styles.container}>
      {/* Active Activities */}
      {activeActivities.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Active Activities ({activeActivities.length})
          </Text>
          <FlatList
            data={activeActivities}
            renderItem={renderActivity}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            scrollEnabled={false}
            refreshControl={
              onRefresh ? (
                <RefreshControl
                  refreshing={loading}
                  onRefresh={onRefresh}
                  tintColor={goalColor}
                />
              ) : undefined
            }
          />
        </View>
      )}

      {/* Inactive Activities */}
      {showInactive && inactiveActivities.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, styles.inactiveTitle]}>
            Inactive Activities ({inactiveActivities.length})
          </Text>
          <FlatList
            data={inactiveActivities}
            renderItem={renderActivity}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            scrollEnabled={false}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  inactiveTitle: {
    color: '#64748b',
  },
  list: {
    gap: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
  },
});
