/**
 * ChallengeWizard Component
 *
 * Multi-step wizard container for creating/editing challenges
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface ChallengeFormData {
  // Step 1: Basic Info
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;

  // Step 2: Activities
  selectedActivityIds: string[];

  // Step 3: Prize & Stakes
  prizeAmount: number;
  prizeCurrency: string;
  urgencyLevel: 'critical' | 'high' | 'medium';
  failureConsequence?: 'charity' | 'partner' | 'platform' | 'anti-charity';

  // Step 4: Participants
  participantEmails: string[];
  accountabilityPartnerEmail?: string;
}

interface ChallengeWizardProps {
  initialData?: Partial<ChallengeFormData>;
  onComplete: (data: ChallengeFormData) => void;
  onCancel: () => void;
  children: React.ReactNode[];
}

export function ChallengeWizard({ initialData, onComplete, onCancel, children }: ChallengeWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<Partial<ChallengeFormData>>(
    initialData || {
      title: '',
      description: '',
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      selectedActivityIds: [],
      prizeAmount: 0,
      prizeCurrency: 'USD',
      urgencyLevel: 'medium',
      failureConsequence: undefined,
      participantEmails: [],
      accountabilityPartnerEmail: undefined,
    }
  );

  const totalSteps = React.Children.count(children);

  /**
   * Update form data
   */
  const updateFormData = (updates: Partial<ChallengeFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  /**
   * Go to next step
   */
  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Final step - submit
      onComplete(formData as ChallengeFormData);
    }
  };

  /**
   * Go to previous step
   */
  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      onCancel();
    }
  };

  /**
   * Render current step with props
   */
  const renderStep = () => {
    const step = React.Children.toArray(children)[currentStep];
    if (React.isValidElement(step)) {
      return React.cloneElement(step, {
        formData,
        updateFormData,
        onNext: handleNext,
        onBack: handleBack,
      } as any);
    }
    return null;
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        <View style={styles.progressDots}>
          {Array.from({ length: totalSteps }).map((_, index) => (
            <View
              key={index}
              style={[
                styles.progressDot,
                index === currentStep && styles.progressDotActive,
                index < currentStep && styles.progressDotCompleted,
              ]}
            />
          ))}
        </View>
        <Text style={styles.progressText}>
          Step {currentStep + 1} of {totalSteps}
        </Text>
      </View>

      {/* Current Step Content */}
      <View style={styles.stepContainer}>{renderStep()}</View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  progressContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    alignItems: 'center',
  },
  progressDots: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#cbd5e1',
  },
  progressDotActive: {
    backgroundColor: '#6366f1',
    width: 24,
  },
  progressDotCompleted: {
    backgroundColor: '#10b981',
  },
  progressText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  stepContainer: {
    flex: 1,
  },
});
