/**
 * ChallengeStatsCard Component
 *
 * Displays challenge statistics in a 2x2 grid
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ChallengeStats, Challenge } from '@manifestation/shared';

interface ChallengeStatsCardProps {
  challenge: Challenge;
  stats: ChallengeStats;
}

export function ChallengeStatsCard({ challenge, stats }: ChallengeStatsCardProps) {
  return (
    <View style={styles.container}>
      {/* Date Range and Prize */}
      <View style={styles.infoSection}>
        <View style={styles.infoRow}>
          <Ionicons name="calendar-outline" size={16} color="#64748b" />
          <Text style={styles.infoText}>
            {formatDate(challenge.startDate)} - {formatDate(challenge.endDate)}
          </Text>
        </View>
        {challenge.prizeAmount > 0 && (
          <View style={styles.prizeBox}>
            <Ionicons name="cash-outline" size={20} color="#10b981" />
            <Text style={styles.prizeAmount}>
              {challenge.prizeCurrency} {challenge.prizeAmount}
            </Text>
            <Text style={styles.prizeLabel}>at stake</Text>
          </View>
        )}
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        {/* Completion Rate */}
        <View style={styles.statCard}>
          <View style={[styles.statIconContainer, { backgroundColor: '#eef2ff' }]}>
            <Ionicons name="analytics-outline" size={24} color="#6366f1" />
          </View>
          <Text style={styles.statValue}>{stats.completionRate}%</Text>
          <Text style={styles.statLabel}>Completion</Text>
          <View style={styles.miniProgressBar}>
            <View style={[styles.miniProgressFill, { width: `${stats.completionRate}%` }]} />
          </View>
        </View>

        {/* Days Progress */}
        <View style={styles.statCard}>
          <View style={[styles.statIconContainer, { backgroundColor: '#f0fdf4' }]}>
            <Ionicons name="calendar-outline" size={24} color="#10b981" />
          </View>
          <Text style={styles.statValue}>
            {stats.daysTotal - stats.daysRemaining}/{stats.daysTotal}
          </Text>
          <Text style={styles.statLabel}>Days Done</Text>
          <View style={styles.miniProgressBar}>
            <View
              style={[
                styles.miniProgressFill,
                {
                  width: `${((stats.daysTotal - stats.daysRemaining) / stats.daysTotal) * 100}%`,
                  backgroundColor: '#10b981',
                },
              ]}
            />
          </View>
        </View>

        {/* Days Remaining */}
        <View style={styles.statCard}>
          <View style={[styles.statIconContainer, { backgroundColor: '#fef3c7' }]}>
            <Ionicons name="time-outline" size={24} color="#f59e0b" />
          </View>
          <Text style={styles.statValue}>{stats.daysRemaining}</Text>
          <Text style={styles.statLabel}>Days Left</Text>
        </View>

        {/* Participants */}
        <View style={styles.statCard}>
          <View style={[styles.statIconContainer, { backgroundColor: '#ede9fe' }]}>
            <Ionicons name="people-outline" size={24} color="#8b5cf6" />
          </View>
          <Text style={styles.statValue}>{getParticipantCount(stats)}</Text>
          <Text style={styles.statLabel}>Participants</Text>
        </View>
      </View>
    </View>
  );
}

function formatDate(date: Date): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getParticipantCount(stats: ChallengeStats): number {
  // This is a placeholder - we'll pass actual participant count from parent
  return 1;
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  infoSection: {
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  infoText: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },
  prizeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  prizeAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#10b981',
  },
  prizeLabel: {
    fontSize: 12,
    color: '#059669',
    marginLeft: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
    textAlign: 'center',
  },
  miniProgressBar: {
    width: '100%',
    height: 4,
    backgroundColor: '#e2e8f0',
    borderRadius: 2,
    marginTop: 8,
    overflow: 'hidden',
  },
  miniProgressFill: {
    height: '100%',
    backgroundColor: '#6366f1',
    borderRadius: 2,
  },
});
