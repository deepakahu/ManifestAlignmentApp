/**
 * CreateChallengeScreen
 *
 * Multi-step wizard for creating new challenges
 */

import React, { useState } from 'react';
import { View, Alert, StyleSheet, SafeAreaView, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../types';
import { ChallengeWizard, ChallengeFormData } from '../../../components/discipline/challenge/ChallengeWizard';
import { BasicInfoStep } from '../../../components/discipline/challenge/BasicInfoStep';
import { ActivitySelectionStep } from '../../../components/discipline/challenge/ActivitySelectionStep';
import { PrizeStakeStep } from '../../../components/discipline/challenge/PrizeStakeStep';
import { ParticipantsStep } from '../../../components/discipline/challenge/ParticipantsStep';
import { challengeRepository } from '../../../repositories/ChallengeRepository';
import { supabase } from '../../../services/supabase/SupabaseClient';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'CreateChallenge'>;

export default function CreateChallengeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [creating, setCreating] = useState(false);

  /**
   * Handle wizard completion - create challenge
   */
  const handleComplete = async (formData: Partial<ChallengeFormData>) => {
    try {
      setCreating(true);

      // Validate required fields
      if (!formData.title || !formData.startDate || !formData.endDate) {
        Alert.alert('Error', 'Please fill in all required fields');
        setCreating(false);
        return;
      }

      if (!formData.selectedActivityIds || formData.selectedActivityIds.length === 0) {
        Alert.alert('Error', 'Please select at least one activity');
        setCreating(false);
        return;
      }

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'You must be logged in to create a challenge');
        setCreating(false);
        return;
      }

      // Create challenge
      const challenge = await challengeRepository.create({
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

      setCreating(false);

      // Show success message
      Alert.alert(
        'Challenge Created!',
        'Your challenge has been created successfully. ' +
          (formData.participantEmails && formData.participantEmails.length > 0
            ? 'Invitations will be sent to participants.'
            : ''),
        [
          {
            text: 'View Challenge',
            onPress: () => {
              // Navigate to challenge detail
              navigation.replace('ChallengeDetail', { challengeId: challenge.id });
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('Failed to create challenge:', error);
      setCreating(false);
      Alert.alert('Error', error.message || 'Failed to create challenge');
    }
  };

  /**
   * Handle wizard cancellation
   */
  const handleCancel = () => {
    Alert.alert(
      'Cancel Creation?',
      'Are you sure you want to cancel? Your progress will be lost.',
      [
        { text: 'Continue Editing', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: () => navigation.goBack(),
        },
      ]
    );
  };

  if (creating) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ChallengeWizard onComplete={handleComplete} onCancel={handleCancel}>
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
});
