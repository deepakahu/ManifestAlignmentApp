/**
 * ActivityProgressList Component
 *
 * Displays activities with progress for a challenge
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { DisciplineActivity } from '@manifestation/shared';

interface ActivityProgress {
  activity: DisciplineActivity;
  expected: number;
  logged: number;
  approved: number;
  pending: number;
  rejected: number;
}

interface ActivityProgressListProps {
  activities: ActivityProgress[];
  onQuickLog?: (activity: DisciplineActivity) => void;
}

export function ActivityProgressList({ activities, onQuickLog }: ActivityProgressListProps) {
  if (activities.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="fitness-outline" size={48} color="#cbd5e1" />
        <Text style={styles.emptyText}>No activities in this challenge</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Activity Progress</Text>
      {activities.map((item) => (
        <ActivityProgressItem
          key={item.activity.id}
          activity={item.activity}
          expected={item.expected}
          logged={item.logged}
          approved={item.approved}
          pending={item.pending}
          rejected={item.rejected}
          onQuickLog={onQuickLog}
        />
      ))}
    </View>
  );
}

interface ActivityProgressItemProps {
  activity: DisciplineActivity;
  expected: number;
  logged: number;
  approved: number;
  pending: number;
  rejected: number;
  onQuickLog?: (activity: DisciplineActivity) => void;
}

function ActivityProgressItem({
  activity,
  expected,
  logged,
  approved,
  pending,
  rejected,
  onQuickLog,
}: ActivityProgressItemProps) {
  const completionRate = expected > 0 ? Math.round((approved / expected) * 100) : 0;

  return (
    <View style={styles.activityCard}>
      {/* Header */}
      <View style={styles.activityHeader}>
        <View style={styles.activityTitleRow}>
          <Ionicons name="fitness" size={18} color="#6366f1" />
          <Text style={styles.activityTitle} numberOfLines={1}>
            {activity.title}
          </Text>
        </View>
        {onQuickLog && (
          <TouchableOpacity
            style={styles.logButton}
            onPress={() => onQuickLog(activity)}
            activeOpacity={0.7}
          >
            <Ionicons name="add-circle" size={20} color="#6366f1" />
            <Text style={styles.logButtonText}>Log</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Description */}
      {activity.description && (
        <Text style={styles.activityDescription} numberOfLines={2}>
          {activity.description}
        </Text>
      )}

      {/* Progress */}
      <View style={styles.progressRow}>
        <Text style={styles.progressText}>
          {approved}/{expected} completed
        </Text>
        <Text style={styles.percentageText}>{completionRate}%</Text>
      </View>
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${Math.min(100, completionRate)}%` }]} />
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{expected}</Text>
          <Text style={styles.statLabel}>Expected</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{logged}</Text>
          <Text style={styles.statLabel}>Logged</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: '#10b981' }]}>{approved}</Text>
          <Text style={styles.statLabel}>Approved</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: '#f59e0b' }]}>{pending}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: '#ef4444' }]}>{rejected}</Text>
          <Text style={styles.statLabel}>Rejected</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  emptyText: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 12,
  },
  activityCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  activityTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  activityTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
    flex: 1,
  },
  logButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#eef2ff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  logButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6366f1',
  },
  activityDescription: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 12,
    lineHeight: 16,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  progressText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#475569',
  },
  percentageText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6366f1',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#e2e8f0',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6366f1',
    borderRadius: 3,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    paddingVertical: 8,
    borderRadius: 6,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '500',
  },
});
