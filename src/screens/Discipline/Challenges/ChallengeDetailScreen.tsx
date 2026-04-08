/**
 * ChallengeDetailScreen
 *
 * View challenge details, stats, activity progress, and participants
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  ActionSheetIOS,
  Platform,
} from 'react-native';
import { useNavigation, useRoute, useFocusEffect, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import type { Challenge, ChallengeStats, ChallengeParticipant, DisciplineActivity } from '@manifestation/shared';
import { RootStackParamList } from '../../../types';
import { challengeRepository } from '../../../repositories/ChallengeRepository';
import { ChallengeStatsCard } from '../../../components/discipline/challenge/ChallengeStatsCard';
import { ActivityProgressList } from '../../../components/discipline/challenge/ActivityProgressList';
import { ParticipantList } from '../../../components/discipline/challenge/ParticipantList';
import { supabase } from '../../../services/supabase/SupabaseClient';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'ChallengeDetail'>;
type ScreenRouteProp = RouteProp<RootStackParamList, 'ChallengeDetail'>;

interface ActivityProgress {
  activity: DisciplineActivity;
  expected: number;
  logged: number;
  approved: number;
  pending: number;
  rejected: number;
}

export default function ChallengeDetailScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ScreenRouteProp>();
  const { challengeId } = route.params;

  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [stats, setStats] = useState<ChallengeStats | null>(null);
  const [participants, setParticipants] = useState<ChallengeParticipant[]>([]);
  const [activityProgress, setActivityProgress] = useState<ActivityProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [userRole, setUserRole] = useState<'creator' | 'participant' | 'accountability_partner' | null>(null);

  /**
   * Load challenge data
   */
  const loadChallenge = useCallback(async () => {
    try {
      setLoading(true);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      setCurrentUserId(user.id);

      // Load challenge
      const challengeData = await challengeRepository.getById(challengeId);
      if (!challengeData) throw new Error('Challenge not found');
      setChallenge(challengeData);

      // Load stats
      const statsData = await challengeRepository.getStats(challengeId);
      setStats(statsData);

      // Load participants
      const participantsData = await challengeRepository.getParticipants(challengeId);
      setParticipants(participantsData);

      // Determine user role
      const userParticipant = participantsData.find(p => p.userId === user.id);
      setUserRole(userParticipant?.role || null);

      // Load activities with progress
      const activities = await challengeRepository.getChallengeActivities(challengeId);

      // Calculate progress for each activity (simplified - would need actual log data)
      const progressData: ActivityProgress[] = activities.map(activity => ({
        activity,
        expected: statsData.daysTotal, // Simplified: assume daily
        logged: 0, // TODO: Calculate from actual logs
        approved: 0, // TODO: Calculate from actual logs
        pending: 0, // TODO: Calculate from actual logs
        rejected: 0, // TODO: Calculate from actual logs
      }));

      setActivityProgress(progressData);
    } catch (error: any) {
      console.error('Failed to load challenge:', error);
      Alert.alert('Error', error.message || 'Failed to load challenge');
    } finally {
      setLoading(false);
    }
  }, [challengeId]);

  useFocusEffect(
    useCallback(() => {
      loadChallenge();
    }, [loadChallenge])
  );

  /**
   * Show action menu
   */
  const showActionMenu = () => {
    if (!challenge || !userRole) return;

    const canEdit = userRole === 'creator';
    const canActivate = userRole === 'creator' && challenge.status === 'draft';
    const canCancel = userRole === 'creator' && challenge.status === 'active';
    const canDelete = userRole === 'creator' && challenge.status === 'draft';

    const options = [];
    const callbacks: (() => void)[] = [];

    if (canEdit) {
      options.push('Edit Challenge');
      callbacks.push(handleEdit);
    }

    if (canActivate) {
      options.push('Activate Challenge');
      callbacks.push(handleActivate);
    }

    if (canCancel) {
      options.push('Cancel Challenge');
      callbacks.push(handleCancel);
    }

    if (canDelete) {
      options.push('Delete Challenge');
      callbacks.push(handleDelete);
    }

    options.push('Cancel');

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          destructiveButtonIndex: canDelete ? options.length - 2 : undefined,
          cancelButtonIndex: options.length - 1,
        },
        (buttonIndex) => {
          if (buttonIndex < callbacks.length) {
            callbacks[buttonIndex]();
          }
        }
      );
    } else {
      // For Android, show simple alert with options
      Alert.alert(
        'Challenge Actions',
        'Choose an action',
        options.map((option, index) => ({
          text: option,
          onPress: index < callbacks.length ? callbacks[index] : undefined,
          style: option === 'Delete Challenge' ? 'destructive' : 'default',
        }))
      );
    }
  };

  /**
   * Handle edit
   */
  const handleEdit = () => {
    if (!challenge) return;
    navigation.navigate('EditChallenge', { challengeId: challenge.id });
  };

  /**
   * Handle activate
   */
  const handleActivate = async () => {
    if (!challenge) return;

    Alert.alert(
      'Activate Challenge',
      'Once activated, editing restrictions will apply based on urgency level. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Activate',
          style: 'default',
          onPress: async () => {
            try {
              await challengeRepository.activate(challenge.id);
              Alert.alert('Success', 'Challenge activated!');
              loadChallenge();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to activate challenge');
            }
          },
        },
      ]
    );
  };

  /**
   * Handle cancel
   */
  const handleCancel = () => {
    if (!challenge) return;

    Alert.alert(
      'Cancel Challenge',
      'Are you sure you want to cancel this challenge? This cannot be undone.',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await challengeRepository.cancel(challenge.id);
              Alert.alert('Success', 'Challenge cancelled');
              navigation.goBack();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to cancel challenge');
            }
          },
        },
      ]
    );
  };

  /**
   * Handle delete
   */
  const handleDelete = () => {
    if (!challenge) return;

    Alert.alert(
      'Delete Challenge',
      'Are you sure you want to delete this challenge? This cannot be undone.',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await challengeRepository.delete(challenge.id);
              Alert.alert('Success', 'Challenge deleted');
              navigation.goBack();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete challenge');
            }
          },
        },
      ]
    );
  };

  /**
   * Handle quick log
   */
  const handleQuickLog = (activity: DisciplineActivity) => {
    Alert.alert('Quick Log', `Quick logging for ${activity.title} - Coming soon!`);
    // TODO: Open QuickLogModal
  };

  /**
   * Navigate to approvals
   */
  const handleViewApprovals = () => {
    navigation.navigate('Approvals', { challengeId });
  };

  if (loading || !challenge || !stats) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
        </View>
      </SafeAreaView>
    );
  }

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
  const isAccountabilityPartner = userRole === 'accountability_partner';
  const hasPendingApprovals = stats.pendingApprovals > 0;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1e293b" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {challenge.title}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: statusStyle.backgroundColor }]}>
            <Text style={[styles.statusText, { color: statusStyle.color }]}>
              {challenge.status.charAt(0).toUpperCase() + challenge.status.slice(1)}
            </Text>
          </View>
        </View>
        <TouchableOpacity onPress={showActionMenu} style={styles.menuButton}>
          <Ionicons name="ellipsis-vertical" size={24} color="#1e293b" />
        </TouchableOpacity>
      </View>

      {/* Draft Notice */}
      {challenge.status === 'draft' && (
        <View style={styles.draftNotice}>
          <Ionicons name="information-circle" size={20} color="#3b82f6" />
          <Text style={styles.draftNoticeText}>
            This challenge is in draft mode. Activate it to start tracking.
          </Text>
        </View>
      )}

      {/* Content */}
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Description */}
        {challenge.description && (
          <View style={styles.descriptionCard}>
            <Text style={styles.description}>{challenge.description}</Text>
          </View>
        )}

        {/* Stats Card */}
        <ChallengeStatsCard challenge={challenge} stats={stats} />

        {/* Activity Progress */}
        <ActivityProgressList
          activities={activityProgress}
          onQuickLog={challenge.status === 'active' ? handleQuickLog : undefined}
        />

        {/* Participants */}
        <ParticipantList participants={participants} currentUserId={currentUserId} />
      </ScrollView>

      {/* Bottom Action Button */}
      {isAccountabilityPartner && hasPendingApprovals && (
        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.approvalsButton} onPress={handleViewApprovals}>
            <Ionicons name="alert-circle" size={20} color="#fff" />
            <Text style={styles.approvalsButtonText}>
              View {stats.pendingApprovals} Pending Approval{stats.pendingApprovals > 1 ? 's' : ''}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    gap: 12,
  },
  backButton: {
    padding: 4,
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
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
  menuButton: {
    padding: 4,
  },
  draftNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#dbeafe',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#93c5fd',
  },
  draftNoticeText: {
    flex: 1,
    fontSize: 13,
    color: '#1e40af',
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  descriptionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  description: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
  },
  bottomBar: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  approvalsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#f59e0b',
    paddingVertical: 14,
    borderRadius: 8,
  },
  approvalsButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
});
