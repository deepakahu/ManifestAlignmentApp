/**
 * ChallengeCard Component
 *
 * Displays a challenge in the list view with status, stats, and progress
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Challenge } from '@manifestation/shared';

interface ChallengeCardProps {
  challenge: Challenge;
  participantCount: number;
  activityCount: number;
  pendingApprovalCount: number;
  completionRate: number;
  onPress: () => void;
}

export function ChallengeCard({
  challenge,
  participantCount,
  activityCount,
  pendingApprovalCount,
  completionRate,
  onPress,
}: ChallengeCardProps) {
  // Calculate days remaining
  const now = new Date();
  const endDate = new Date(challenge.endDate);
  const daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

  // Get status badge styling
  const getStatusStyle = () => {
    switch (challenge.status) {
      case 'draft':
        return { backgroundColor: '#e2e8f0', color: '#64748b' };
      case 'active':
        return { backgroundColor: '#dcfce7', color: '#16a34a' };
      case 'completed':
        return { backgroundColor: '#dbeafe', color: '#2563eb' };
      case 'cancelled':
        return { backgroundColor: '#fee2e2', color: '#dc2626' };
      default:
        return { backgroundColor: '#e2e8f0', color: '#64748b' };
    }
  };

  const statusStyle = getStatusStyle();

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      {/* Header: Title and Status Badge */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Ionicons name="trophy" size={20} color="#f59e0b" style={styles.icon} />
          <Text style={styles.title} numberOfLines={1}>
            {challenge.title}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusStyle.backgroundColor }]}>
          <Text style={[styles.statusText, { color: statusStyle.color }]}>
            {challenge.status.charAt(0).toUpperCase() + challenge.status.slice(1)}
          </Text>
        </View>
      </View>

      {/* Description (if present) */}
      {challenge.description && (
        <Text style={styles.description} numberOfLines={2}>
          {challenge.description}
        </Text>
      )}

      {/* Date Range */}
      <View style={styles.dateRow}>
        <Ionicons name="calendar-outline" size={14} color="#64748b" />
        <Text style={styles.dateText}>
          {formatDate(challenge.startDate)} - {formatDate(challenge.endDate)}
        </Text>
        {daysRemaining > 0 && (
          <Text style={styles.daysRemaining}>• {daysRemaining}d remaining</Text>
        )}
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Ionicons name="fitness-outline" size={16} color="#6366f1" />
          <Text style={styles.statText}>{activityCount}</Text>
        </View>
        <View style={styles.stat}>
          <Ionicons name="people-outline" size={16} color="#6366f1" />
          <Text style={styles.statText}>{participantCount}</Text>
        </View>
        {challenge.prizeAmount > 0 && (
          <View style={styles.stat}>
            <Ionicons name="cash-outline" size={16} color="#10b981" />
            <Text style={styles.statText}>
              {challenge.prizeCurrency} {challenge.prizeAmount}
            </Text>
          </View>
        )}
        {pendingApprovalCount > 0 && (
          <View style={[styles.stat, styles.pendingBadge]}>
            <Ionicons name="alert-circle" size={16} color="#f59e0b" />
            <Text style={[styles.statText, { color: '#f59e0b' }]}>{pendingApprovalCount} pending</Text>
          </View>
        )}
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${completionRate}%` }]} />
        </View>
        <Text style={styles.progressText}>{completionRate}%</Text>
      </View>

      {/* Footer: View Details */}
      <View style={styles.footer}>
        <Text style={styles.viewDetails}>View Details</Text>
        <Ionicons name="chevron-forward" size={16} color="#6366f1" />
      </View>
    </TouchableOpacity>
  );
}

// Helper function to format dates
function formatDate(date: Date): string {
  const d = new Date(date);
  const month = d.toLocaleDateString('en-US', { month: 'short' });
  const day = d.getDate();
  return `${month} ${day}`;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  icon: {
    marginRight: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  description: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 12,
    lineHeight: 18,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateText: {
    fontSize: 12,
    color: '#64748b',
    marginLeft: 4,
  },
  daysRemaining: {
    fontSize: 12,
    color: '#f59e0b',
    fontWeight: '500',
    marginLeft: 4,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },
  pendingBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#e2e8f0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6366f1',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6366f1',
    minWidth: 35,
    textAlign: 'right',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  viewDetails: {
    fontSize: 13,
    color: '#6366f1',
    fontWeight: '500',
    marginRight: 4,
  },
});
