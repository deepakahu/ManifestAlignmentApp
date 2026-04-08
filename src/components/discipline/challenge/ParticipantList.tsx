/**
 * ParticipantList Component
 *
 * Displays list of challenge participants with roles
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ChallengeParticipant } from '@manifestation/shared';

interface ParticipantListProps {
  participants: ChallengeParticipant[];
  currentUserId: string;
}

export function ParticipantList({ participants, currentUserId }: ParticipantListProps) {
  if (participants.length === 0) {
    return null;
  }

  // Sort: current user first, then by role (creator, accountability_partner, participant)
  const sortedParticipants = [...participants].sort((a, b) => {
    if (a.userId === currentUserId) return -1;
    if (b.userId === currentUserId) return 1;

    const roleOrder = { creator: 1, accountability_partner: 2, participant: 3 };
    return roleOrder[a.role] - roleOrder[b.role];
  });

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Participants</Text>
      <View style={styles.participantsList}>
        {sortedParticipants.map((participant) => (
          <ParticipantItem
            key={participant.id}
            participant={participant}
            isCurrentUser={participant.userId === currentUserId}
          />
        ))}
      </View>
    </View>
  );
}

interface ParticipantItemProps {
  participant: ChallengeParticipant;
  isCurrentUser: boolean;
}

function ParticipantItem({ participant, isCurrentUser }: ParticipantItemProps) {
  const getRoleBadge = () => {
    switch (participant.role) {
      case 'creator':
        return { label: 'Creator', color: '#6366f1', bgColor: '#eef2ff' };
      case 'accountability_partner':
        return { label: 'Partner', color: '#8b5cf6', bgColor: '#f3e8ff' };
      case 'participant':
        return { label: 'Member', color: '#10b981', bgColor: '#d1fae5' };
      default:
        return { label: 'Member', color: '#64748b', bgColor: '#f1f5f9' };
    }
  };

  const getStatusIcon = () => {
    switch (participant.status) {
      case 'accepted':
        return <Ionicons name="checkmark-circle" size={16} color="#10b981" />;
      case 'invited':
        return <Ionicons name="mail-outline" size={16} color="#f59e0b" />;
      case 'declined':
        return <Ionicons name="close-circle" size={16} color="#ef4444" />;
      default:
        return null;
    }
  };

  const roleBadge = getRoleBadge();

  return (
    <View style={[styles.participantCard, isCurrentUser && styles.currentUserCard]}>
      <View style={styles.participantInfo}>
        <View style={styles.avatarCircle}>
          <Ionicons name="person" size={18} color="#64748b" />
        </View>
        <View style={styles.participantDetails}>
          <View style={styles.nameRow}>
            <Text style={styles.participantName}>
              {isCurrentUser ? 'You' : `User ${participant.userId.slice(0, 8)}`}
            </Text>
            {getStatusIcon()}
          </View>
          <View style={styles.badgesRow}>
            <View style={[styles.roleBadge, { backgroundColor: roleBadge.bgColor }]}>
              <Text style={[styles.roleBadgeText, { color: roleBadge.color }]}>
                {roleBadge.label}
              </Text>
            </View>
            {participant.status === 'accepted' && participant.joinedAt && (
              <Text style={styles.joinedText}>
                Joined {formatDate(participant.joinedAt)}
              </Text>
            )}
          </View>
        </View>
      </View>
    </View>
  );
}

function formatDate(date: Date): string {
  const d = new Date(date);
  const now = new Date();
  const diffInDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));

  if (diffInDays === 0) return 'today';
  if (diffInDays === 1) return 'yesterday';
  if (diffInDays < 7) return `${diffInDays}d ago`;
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)}w ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
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
  participantsList: {
    gap: 8,
  },
  participantCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  currentUserCard: {
    backgroundColor: '#f8fafc',
    borderColor: '#cbd5e1',
  },
  participantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  participantDetails: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  participantName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  joinedText: {
    fontSize: 11,
    color: '#64748b',
  },
});
