/**
 * ChallengesListScreen
 *
 * Displays list of all challenges user is involved in (creator or participant)
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../../types';
import { challengeRepository, ChallengeWithStats } from '../../../repositories/ChallengeRepository';
import { ChallengeCard } from '../../../components/discipline/challenge/ChallengeCard';
import { supabase } from '../../../services/supabase/SupabaseClient';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'ChallengesList'>;

export default function ChallengesListScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [challenges, setChallenges] = useState<ChallengeWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [totalPendingApprovals, setTotalPendingApprovals] = useState(0);
  const [isAccountabilityPartner, setIsAccountabilityPartner] = useState(false);

  /**
   * Load challenges from repository
   */
  const loadChallenges = useCallback(async () => {
    try {
      const data = await challengeRepository.getAll();
      setChallenges(data);

      // Calculate total pending approvals and check if user is accountability partner
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let totalPending = 0;
      let hasPartnerRole = false;

      for (const challenge of data) {
        totalPending += challenge.pendingApprovalCount;

        // Check if user is accountability partner for any challenge
        const participants = await challengeRepository.getParticipants(challenge.id);
        const userParticipant = participants.find(p => p.userId === user.id);
        if (userParticipant && userParticipant.role === 'accountability_partner') {
          hasPartnerRole = true;
        }
      }

      setTotalPendingApprovals(totalPending);
      setIsAccountabilityPartner(hasPartnerRole);
    } catch (error: any) {
      console.error('Failed to load challenges:', error);
      Alert.alert('Error', error.message || 'Failed to load challenges');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Load challenges on mount and when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadChallenges();
    }, [loadChallenges])
  );

  /**
   * Handle pull-to-refresh
   */
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadChallenges();
  }, [loadChallenges]);

  /**
   * Navigate to create challenge screen
   */
  const handleCreate = () => {
    navigation.navigate('CreateChallenge');
  };

  /**
   * Navigate to challenge detail screen
   */
  const handleChallengePress = (challengeId: string) => {
    navigation.navigate('ChallengeDetail', { challengeId });
  };

  /**
   * Navigate to approvals screen (first challenge with pending approvals)
   */
  const handleViewApprovals = () => {
    const challengeWithPending = challenges.find(c => c.pendingApprovalCount > 0);
    if (challengeWithPending) {
      navigation.navigate('Approvals', { challengeId: challengeWithPending.id });
    }
  };

  /**
   * Render empty state
   */
  const renderEmptyState = () => {
    if (loading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="trophy-outline" size={64} color="#cbd5e1" />
        <Text style={styles.emptyTitle}>No Challenges Yet</Text>
        <Text style={styles.emptySubtitle}>
          Create your first challenge to start tracking your goals with accountability
        </Text>
        <TouchableOpacity style={styles.createButton} onPress={handleCreate}>
          <Ionicons name="add-circle" size={20} color="#fff" />
          <Text style={styles.createButtonText}>Create Challenge</Text>
        </TouchableOpacity>
      </View>
    );
  };

  /**
   * Render challenge item
   */
  const renderChallenge = ({ item }: { item: ChallengeWithStats }) => (
    <ChallengeCard
      challenge={item}
      participantCount={item.participantCount}
      activityCount={item.activityCount}
      pendingApprovalCount={item.pendingApprovalCount}
      completionRate={item.completionRate}
      onPress={() => handleChallengePress(item.id)}
    />
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Challenges</Text>
        <TouchableOpacity style={styles.createIconButton} onPress={handleCreate}>
          <Ionicons name="add-circle" size={28} color="#6366f1" />
        </TouchableOpacity>
      </View>

      {/* Alert Banner for Pending Approvals */}
      {isAccountabilityPartner && totalPendingApprovals > 0 && (
        <TouchableOpacity style={styles.alertBanner} onPress={handleViewApprovals}>
          <View style={styles.alertContent}>
            <Ionicons name="alert-circle" size={20} color="#f59e0b" />
            <Text style={styles.alertText}>
              {totalPendingApprovals} activity log{totalPendingApprovals > 1 ? 's' : ''} pending your approval
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#f59e0b" />
        </TouchableOpacity>
      )}

      {/* Challenges List */}
      <FlatList
        data={challenges}
        renderItem={renderChallenge}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#6366f1"
            colors={['#6366f1']}
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
  },
  createIconButton: {
    padding: 4,
  },
  alertBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#fde68a',
  },
  alertContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  alertText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#92400e',
    flex: 1,
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1e293b',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6366f1',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  createButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
});
