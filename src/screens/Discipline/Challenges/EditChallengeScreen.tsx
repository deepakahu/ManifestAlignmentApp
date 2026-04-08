/**
 * EditChallengeScreen
 *
 * Edit existing challenge with urgency-based edit locks
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Alert,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Modal,
  Text,
  TouchableOpacity,
} from 'react-native';
import { useRoute, RouteProp, useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../../types';
import { ChallengeWizard, ChallengeFormData } from '../../../components/discipline/challenge/ChallengeWizard';
import { BasicInfoStep } from '../../../components/discipline/challenge/BasicInfoStep';
import { ActivitySelectionStep } from '../../../components/discipline/challenge/ActivitySelectionStep';
import { PrizeStakeStep } from '../../../components/discipline/challenge/PrizeStakeStep';
import { ParticipantsStep } from '../../../components/discipline/challenge/ParticipantsStep';
import { challengeRepository } from '../../../repositories/ChallengeRepository';
import type { Challenge, ChallengeParticipant } from '@manifestation/shared';

type EditChallengeRouteProp = RouteProp<RootStackParamList, 'EditChallenge'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'EditChallenge'>;

export default function EditChallengeScreen() {
  const route = useRoute<EditChallengeRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const { challengeId } = route.params;

  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [initialFormData, setInitialFormData] = useState<Partial<ChallengeFormData> | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [editLockMessage, setEditLockMessage] = useState<string | null>(null);

  /**
   * Load challenge data
   */
  const loadChallenge = useCallback(async () => {
    try {
      setLoading(true);

      // Check if challenge can be edited
      const editCheck = await challengeRepository.canEdit(challengeId);
      if (!editCheck.canEdit) {
        setEditLockMessage(editCheck.message);
        setLoading(false);
        return;
      }

      // Load challenge
      const challengeData = await challengeRepository.getById(challengeId);
      if (!challengeData) {
        Alert.alert('Error', 'Challenge not found');
        navigation.goBack();
        return;
      }

      setChallenge(challengeData);

      // Load participants and activities
      const participants = await challengeRepository.getParticipants(challengeId);
      const activities = await challengeRepository.getChallengeActivities(challengeId);

      // Find accountability partner
      const accountabilityPartner = participants.find(
        (p: ChallengeParticipant) => p.role === 'accountability_partner'
      );

      // Find other participants (not creator, not accountability partner)
      const otherParticipants = participants.filter(
        (p: ChallengeParticipant) =>
          p.role === 'participant' && p.userId !== challengeData.creatorId
      );

      // Prepare form data
      const formData: Partial<ChallengeFormData> = {
        title: challengeData.title,
        description: challengeData.description,
        startDate: new Date(challengeData.startDate),
        endDate: new Date(challengeData.endDate),
        selectedActivityIds: activities.map((a) => a.activityId),
        prizeAmount: challengeData.prizeAmount,
        prizeCurrency: challengeData.prizeCurrency || 'USD',
        urgencyLevel: challengeData.urgencyLevel || 'medium',
        failureConsequence: challengeData.failureConsequence as any,
        participantEmails: otherParticipants.map((p) => p.userId), // Note: using userId as placeholder
        accountabilityPartnerEmail: accountabilityPartner?.userId, // Note: using userId as placeholder
      };

      setInitialFormData(formData);
    } catch (error: any) {
      console.error('Failed to load challenge:', error);
      Alert.alert('Error', error.message || 'Failed to load challenge');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }, [challengeId, navigation]);

  // Load challenge on mount
  useFocusEffect(
    useCallback(() => {
      loadChallenge();
    }, [loadChallenge])
  );

  /**
   * Handle wizard completion - update challenge
   */
  const handleComplete = async (formData: Partial<ChallengeFormData>) => {
    try {
      setUpdating(true);

      // Validate required fields
      if (!formData.title || !formData.startDate || !formData.endDate) {
        Alert.alert('Error', 'Please fill in all required fields');
        setUpdating(false);
        return;
      }

      if (!formData.selectedActivityIds || formData.selectedActivityIds.length === 0) {
        Alert.alert('Error', 'Please select at least one activity');
        setUpdating(false);
        return;
      }

      // Update challenge
      await challengeRepository.update(challengeId, {
        title: formData.title,
        description: formData.description,
        startDate: formData.startDate,
        endDate: formData.endDate,
        selectedActivityIds: formData.selectedActivityIds,
        prizeAmount: formData.prizeAmount || 0,
        prizeCurrency: formData.prizeCurrency || 'USD',
        isPublic: false,
        urgencyLevel: formData.urgencyLevel || 'medium',
        failureConsequence: formData.failureConsequence,
        participantEmails: formData.participantEmails || [],
        accountabilityPartnerEmail: formData.accountabilityPartnerEmail,
      });

      setUpdating(false);

      // Show success message
      Alert.alert('Success', 'Challenge updated successfully', [
        {
          text: 'OK',
          onPress: () => {
            // Navigate back to challenge detail
            navigation.replace('ChallengeDetail', { challengeId });
          },
        },
      ]);
    } catch (error: any) {
      console.error('Failed to update challenge:', error);
      setUpdating(false);
      Alert.alert('Error', error.message || 'Failed to update challenge');
    }
  };

  /**
   * Handle wizard cancellation
   */
  const handleCancel = () => {
    Alert.alert(
      'Discard Changes?',
      'Are you sure you want to discard your changes?',
      [
        { text: 'Continue Editing', style: 'cancel' },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: () => navigation.goBack(),
        },
      ]
    );
  };

  /**
   * Render edit lock modal
   */
  if (editLockMessage) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.lockContainer}>
          <Ionicons name="lock-closed" size={64} color="#ef4444" />
          <Text style={styles.lockTitle}>Cannot Edit Challenge</Text>
          <Text style={styles.lockMessage}>{editLockMessage}</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (loading || !initialFormData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
        </View>
      </SafeAreaView>
    );
  }

  if (updating) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.updatingText}>Updating challenge...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ChallengeWizard
        initialData={initialFormData}
        onComplete={handleComplete}
        onCancel={handleCancel}
      >
        <BasicInfoStep />
        <ActivitySelectionStep />
        <PrizeStakeStep />
        <ParticipantsStep />
      </ChallengeWizard>
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
  updatingText: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 12,
  },
  lockContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  lockTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  lockMessage: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  backButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
