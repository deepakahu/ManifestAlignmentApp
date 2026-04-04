/**
 * ActivityCard Component
 *
 * Displays a single activity with tracking type, streak, and quick log button
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable, TouchableOpacity } from 'react-native';
import type { DisciplineActivity, TrackingType, ActivityStatus } from '@manifestation/shared';
import { MaterialIcons } from '@expo/vector-icons';

interface ActivityCardProps {
  activity: DisciplineActivity;
  goalColor?: string;
  onPress?: (activity: DisciplineActivity) => void;
  onLongPress?: (activity: DisciplineActivity) => void;
  onQuickLog?: (activity: DisciplineActivity) => void;
  todayLog?: { status: ActivityStatus; value: any } | null;
  isDueToday?: boolean;
}

export function ActivityCard({
  activity,
  goalColor = '#6366f1',
  onPress,
  onLongPress,
  onQuickLog,
  todayLog,
  isDueToday = true,
}: ActivityCardProps) {
  const getTrackingTypeIcon = (type: TrackingType) => {
    switch (type) {
      case 'boolean': return 'check-circle';
      case 'number': return 'looks-one';
      case 'multiselect': return 'list';
      case 'text': return 'notes';
      default: return 'flag';
    }
  };

  const getTrackingTypeLabel = (type: TrackingType) => {
    switch (type) {
      case 'boolean': return 'Yes/No';
      case 'number': return 'Number';
      case 'multiselect': return 'Multi-select';
      case 'text': return 'Text';
      default: return type;
    }
  };

  const getFrequencyLabel = () => {
    switch (activity.frequencyType) {
      case 'daily': return 'Daily';
      case 'specific_days': {
        const config = activity.frequencyConfig as { days: number[] };
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        return config.days?.map(d => dayNames[d]).join(', ') || 'Specific days';
      }
      case 'custom': return 'Custom dates';
      default: return 'Unknown';
    }
  };

  const getStatusColor = (status: ActivityStatus) => {
    switch (status) {
      case 'good': return '#10b981';
      case 'neutral': return '#6366f1';
      case 'bad': return '#ef4444';
      case 'skipped': return '#999';
      default: return '#666';
    }
  };

  const hasLoggedToday = !!todayLog;

  return (
    <Pressable
      onPress={() => onPress?.(activity)}
      onLongPress={() => onLongPress?.(activity)}
      style={({ pressed }) => [
        styles.container,
        pressed && styles.pressed,
        hasLoggedToday && styles.logged,
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <MaterialIcons
            name={getTrackingTypeIcon(activity.trackingType)}
            size={20}
            color={goalColor}
          />
          <Text style={styles.title} numberOfLines={1}>
            {activity.title}
          </Text>
        </View>
        {hasLoggedToday && (
          <View style={[styles.statusDot, { backgroundColor: getStatusColor(todayLog.status) }]} />
        )}
      </View>

      {/* Description */}
      {activity.description && (
        <Text style={styles.description} numberOfLines={2}>
          {activity.description}
        </Text>
      )}

      {/* Info Row */}
      <View style={styles.infoRow}>
        <View style={styles.infoLeft}>
          {/* Tracking Type */}
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {getTrackingTypeLabel(activity.trackingType)}
            </Text>
          </View>

          {/* Frequency */}
          <View style={styles.badge}>
            <MaterialIcons name="event" size={10} color="#666" />
            <Text style={styles.badgeText}>{getFrequencyLabel()}</Text>
          </View>

          {/* Streak */}
          {activity.currentStreak > 0 && (
            <View style={[styles.badge, styles.streakBadge]}>
              <MaterialIcons name="local-fire-department" size={12} color="#f59e0b" />
              <Text style={[styles.badgeText, { color: '#f59e0b' }]}>
                {activity.currentStreak} day{activity.currentStreak !== 1 ? 's' : ''}
              </Text>
            </View>
          )}
        </View>

        {/* Quick Log Button */}
        {isDueToday && !hasLoggedToday && onQuickLog && (
          <TouchableOpacity
            style={[styles.quickLogButton, { backgroundColor: goalColor }]}
            onPress={() => onQuickLog(activity)}
          >
            <MaterialIcons name="add" size={16} color="#fff" />
            <Text style={styles.quickLogText}>Log</Text>
          </TouchableOpacity>
        )}

        {hasLoggedToday && (
          <View style={styles.loggedBadge}>
            <MaterialIcons name="check" size={14} color="#10b981" />
            <Text style={styles.loggedText}>Logged</Text>
          </View>
        )}
      </View>

      {/* Reminder Indicator */}
      {activity.reminderEnabled && (
        <View style={styles.reminderIndicator}>
          <MaterialIcons name="notifications-active" size={10} color="#666" />
          <Text style={styles.reminderText}>
            {activity.reminderTime || 'Reminder set'}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  pressed: {
    opacity: 0.7,
  },
  logged: {
    borderColor: '#10b981',
    borderWidth: 1.5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  description: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
    lineHeight: 18,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLeft: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    flex: 1,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 10,
    color: '#666',
  },
  streakBadge: {
    backgroundColor: '#fef3c7',
  },
  quickLogButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  quickLogText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  loggedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#d1fae5',
    borderRadius: 6,
  },
  loggedText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#10b981',
  },
  reminderIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  reminderText: {
    fontSize: 10,
    color: '#666',
  },
});
