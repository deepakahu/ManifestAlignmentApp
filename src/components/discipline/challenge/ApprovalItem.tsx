/**
 * ApprovalItem Component
 *
 * Single approval item card for activity log approval/rejection
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { DisciplineActivity } from '@manifestation/shared';

interface ApprovalItemProps {
  log: {
    id: string;
    activityId: string;
    logDate: string;
    value: any;
    status: string;
    notes?: string;
  };
  activity: DisciplineActivity;
  userName: string;
  onApprove: (logId: string) => void;
  onReject: (logId: string) => void;
}

export function ApprovalItem({
  log,
  activity,
  userName,
  onApprove,
  onReject,
}: ApprovalItemProps) {
  /**
   * Format value based on tracking type
   */
  const formatValue = () => {
    if (!log.value) return 'No data';

    switch (activity.trackingType) {
      case 'boolean':
        return log.value ? '✓ Completed' : '✗ Not completed';
      case 'number':
        return `${log.value} ${activity.unit || ''}`.trim();
      case 'duration':
        const minutes = Math.floor(log.value / 60);
        const seconds = log.value % 60;
        return `${minutes}m ${seconds}s`;
      case 'text':
        return log.value;
      case 'mood':
        return `${log.value}/10`;
      default:
        return String(log.value);
    }
  };

  /**
   * Get status badge
   */
  const getStatusBadge = () => {
    switch (log.status) {
      case 'good':
        return { label: 'Good', color: '#10b981', bgColor: '#d1fae5' };
      case 'neutral':
        return { label: 'Neutral', color: '#6366f1', bgColor: '#e0e7ff' };
      case 'bad':
        return { label: 'Bad', color: '#ef4444', bgColor: '#fee2e2' };
      case 'skipped':
        return { label: 'Skipped', color: '#64748b', bgColor: '#f1f5f9' };
      default:
        return { label: 'Logged', color: '#64748b', bgColor: '#f1f5f9' };
    }
  };

  /**
   * Format date
   */
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  const statusBadge = getStatusBadge();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.activityInfo}>
          <Ionicons name="fitness" size={18} color="#6366f1" />
          <Text style={styles.activityTitle} numberOfLines={1}>
            {activity.title}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusBadge.bgColor }]}>
          <Text style={[styles.statusText, { color: statusBadge.color }]}>
            {statusBadge.label}
          </Text>
        </View>
      </View>

      {/* User and Date */}
      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <Ionicons name="person-outline" size={14} color="#64748b" />
          <Text style={styles.metaText}>{userName}</Text>
        </View>
        <View style={styles.metaItem}>
          <Ionicons name="calendar-outline" size={14} color="#64748b" />
          <Text style={styles.metaText}>{formatDate(log.logDate)}</Text>
        </View>
      </View>

      {/* Value */}
      <View style={styles.valueContainer}>
        <Text style={styles.valueLabel}>Logged Value:</Text>
        <Text style={styles.valueText}>{formatValue()}</Text>
      </View>

      {/* Notes */}
      {log.notes && (
        <View style={styles.notesContainer}>
          <Ionicons name="document-text-outline" size={14} color="#64748b" />
          <Text style={styles.notesText}>{log.notes}</Text>
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={styles.rejectButton}
          onPress={() => onReject(log.id)}
          activeOpacity={0.7}
        >
          <Ionicons name="close-circle" size={20} color="#ef4444" />
          <Text style={styles.rejectButtonText}>Reject</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.approveButton}
          onPress={() => onApprove(log.id)}
          activeOpacity={0.7}
        >
          <Ionicons name="checkmark-circle" size={20} color="#fff" />
          <Text style={styles.approveButtonText}>Approve</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  activityInfo: {
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
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#64748b',
  },
  valueContainer: {
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  valueLabel: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 4,
    fontWeight: '500',
  },
  valueText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  notesContainer: {
    flexDirection: 'row',
    gap: 6,
    backgroundColor: '#fffbeb',
    padding: 10,
    borderRadius: 6,
    marginBottom: 12,
  },
  notesText: {
    fontSize: 12,
    color: '#92400e',
    flex: 1,
    lineHeight: 16,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  rejectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#ef4444',
    paddingVertical: 10,
    borderRadius: 8,
  },
  rejectButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ef4444',
  },
  approveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#10b981',
    paddingVertical: 10,
    borderRadius: 8,
  },
  approveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});
