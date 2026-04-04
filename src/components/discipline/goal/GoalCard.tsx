/**
 * GoalCard Component
 *
 * Displays a single goal with progress, status, and SMART framework indicators
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import type { Goal } from '@manifestation/shared';
import { MaterialIcons } from '@expo/vector-icons';
import { formatDate } from '@manifestation/shared';

interface GoalCardProps {
  goal: Goal;
  categoryColor?: string;
  onPress?: (goal: Goal) => void;
  onLongPress?: (goal: Goal) => void;
  showCategory?: boolean;
  categoryName?: string;
  activityCount?: number;
}

export function GoalCard({
  goal,
  categoryColor = '#6366f1',
  onPress,
  onLongPress,
  showCategory = false,
  categoryName,
  activityCount = 0,
}: GoalCardProps) {
  const getStatusColor = () => {
    switch (goal.status) {
      case 'completed': return '#10b981';
      case 'active': return '#6366f1';
      case 'paused': return '#f59e0b';
      case 'archived': return '#999';
      default: return '#666';
    }
  };

  const getStatusIcon = () => {
    switch (goal.status) {
      case 'completed': return 'check-circle';
      case 'active': return 'flag';
      case 'paused': return 'pause-circle-filled';
      case 'archived': return 'archive';
      default: return 'flag';
    }
  };

  // Count how many SMART fields are filled
  const smartFieldsCount = [
    goal.specific,
    goal.measurable,
    goal.achievable,
    goal.relevant,
    goal.timeBound,
  ].filter(Boolean).length;

  return (
    <Pressable
      onPress={() => onPress?.(goal)}
      onLongPress={() => onLongPress?.(goal)}
      style={({ pressed }) => [
        styles.container,
        pressed && styles.pressed,
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <MaterialIcons
            name={getStatusIcon()}
            size={20}
            color={getStatusColor()}
          />
          <Text style={styles.title} numberOfLines={2}>
            {goal.title}
          </Text>
        </View>
        <View style={styles.headerRight}>
          <MaterialIcons name="chevron-right" size={24} color="#999" />
        </View>
      </View>

      {/* Description */}
      {goal.description && (
        <Text style={styles.description} numberOfLines={2}>
          {goal.description}
        </Text>
      )}

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${goal.progressPercentage}%`, backgroundColor: categoryColor },
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          {goal.progressPercentage}%
        </Text>
      </View>

      {/* Footer Info */}
      <View style={styles.footer}>
        <View style={styles.footerLeft}>
          {/* SMART Indicator */}
          {smartFieldsCount > 0 && (
            <View style={styles.badge}>
              <MaterialIcons name="stars" size={12} color="#f59e0b" />
              <Text style={styles.badgeText}>
                SMART {smartFieldsCount}/5
              </Text>
            </View>
          )}

          {/* Activity Count */}
          {activityCount > 0 && (
            <View style={styles.badge}>
              <MaterialIcons name="check-circle" size={12} color="#10b981" />
              <Text style={styles.badgeText}>
                {activityCount} {activityCount === 1 ? 'activity' : 'activities'}
              </Text>
            </View>
          )}

          {/* Category Name */}
          {showCategory && categoryName && (
            <View style={[styles.badge, { backgroundColor: categoryColor + '20' }]}>
              <Text style={[styles.badgeText, { color: categoryColor }]}>
                {categoryName}
              </Text>
            </View>
          )}
        </View>

        {/* Target Date */}
        {goal.targetDate && (
          <Text style={styles.targetDate}>
            <MaterialIcons name="event" size={12} color="#999" />
            {' '}{formatDate(goal.targetDate, { month: 'short', day: 'numeric' })}
          </Text>
        )}
      </View>

      {/* Manual Progress Indicator */}
      {goal.useManualProgress && (
        <View style={styles.manualBadge}>
          <MaterialIcons name="edit" size={10} color="#fff" />
          <Text style={styles.manualText}>Manual</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  pressed: {
    opacity: 0.7,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  headerRight: {
    marginLeft: 8,
  },
  title: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    minWidth: 35,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerLeft: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    flex: 1,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 11,
    color: '#666',
  },
  targetDate: {
    fontSize: 12,
    color: '#999',
    flexDirection: 'row',
    alignItems: 'center',
  },
  manualBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#6366f1',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  manualText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#fff',
  },
});
