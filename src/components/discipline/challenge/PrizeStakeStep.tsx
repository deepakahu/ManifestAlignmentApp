/**
 * PrizeStakeStep Component
 *
 * Step 3 of challenge wizard: Set prize/stake, failure consequence, and urgency level
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
  ActionSheetIOS,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ChallengeFormData } from './ChallengeWizard';
import { PrizeExplanationModal } from './PrizeExplanationModal';

interface PrizeStakeStepProps {
  formData?: Partial<ChallengeFormData>;
  updateFormData?: (data: Partial<ChallengeFormData>) => void;
  onNext?: () => void;
  onBack?: () => void;
}

const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
];

const FAILURE_CONSEQUENCES = [
  {
    value: 'charity' as const,
    label: 'Charity',
    description: 'Your stake goes to a charity of your choice',
    recommended: true,
  },
  {
    value: 'partner' as const,
    label: 'Accountability Partner',
    description: 'Your accountability partner receives the stake',
    recommended: false,
  },
  {
    value: 'platform' as const,
    label: 'Platform',
    description: 'Stake goes to the platform to support development',
    recommended: false,
  },
  {
    value: 'anti-charity' as const,
    label: 'Anti-Charity',
    description: 'Stake goes to a cause you disagree with (maximum motivation)',
    recommended: false,
  },
];

const URGENCY_LEVELS = [
  {
    value: 'critical' as const,
    label: 'Critical',
    icon: '🔴',
    description: 'No edits allowed after creation. Maximum commitment.',
    editRule: 'Locked immediately after creation',
  },
  {
    value: 'high' as const,
    label: 'High',
    icon: '🟡',
    description: 'Editable until challenge starts. Strong commitment.',
    editRule: 'Editable until start date',
  },
  {
    value: 'medium' as const,
    label: 'Medium',
    icon: '🟢',
    description: 'Editable until 1 day before start. Balanced approach.',
    editRule: 'Editable until 1 day before start',
    default: true,
  },
];

export function PrizeStakeStep({
  formData,
  updateFormData,
  onNext,
  onBack,
}: PrizeStakeStepProps) {
  const [prizeAmount, setPrizeAmount] = useState(
    formData?.prizeAmount?.toString() || ''
  );
  const [prizeCurrency, setPrizeCurrency] = useState(
    formData?.prizeCurrency || 'USD'
  );
  const [failureConsequence, setFailureConsequence] = useState<
    'charity' | 'partner' | 'platform' | 'anti-charity' | undefined
  >(formData?.failureConsequence);
  const [urgencyLevel, setUrgencyLevel] = useState<'critical' | 'high' | 'medium'>(
    formData?.urgencyLevel || 'medium'
  );
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const hasPrize = parseFloat(prizeAmount) > 0;

  // Update form data when values change
  useEffect(() => {
    const amount = parseFloat(prizeAmount) || 0;
    updateFormData?.({
      prizeAmount: amount,
      prizeCurrency,
      failureConsequence: hasPrize ? failureConsequence : undefined,
      urgencyLevel,
    });
  }, [prizeAmount, prizeCurrency, failureConsequence, urgencyLevel]);

  /**
   * Show currency picker
   */
  const showCurrencyPicker = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: [...CURRENCIES.map((c) => `${c.symbol} ${c.name}`), 'Cancel'],
          cancelButtonIndex: CURRENCIES.length,
        },
        (buttonIndex) => {
          if (buttonIndex < CURRENCIES.length) {
            setPrizeCurrency(CURRENCIES[buttonIndex].code);
          }
        }
      );
    } else {
      Alert.alert(
        'Select Currency',
        '',
        CURRENCIES.map((currency) => ({
          text: `${currency.symbol} ${currency.name}`,
          onPress: () => setPrizeCurrency(currency.code),
        })).concat({ text: 'Cancel', style: 'cancel' })
      );
    }
  };

  /**
   * Validate
   */
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    const amount = parseFloat(prizeAmount);
    if (prizeAmount && isNaN(amount)) {
      newErrors.prizeAmount = 'Invalid amount';
    }

    if (hasPrize) {
      if (!failureConsequence) {
        newErrors.failureConsequence = 'Please select where your stake goes if you fail';
      }
      if (!termsAccepted) {
        newErrors.terms = 'You must accept the terms to set a stake';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle next
   */
  const handleNext = () => {
    if (validate() && onNext) {
      onNext();
    }
  };

  const selectedCurrency = CURRENCIES.find((c) => c.code === prizeCurrency);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <Text style={styles.stepTitle}>Prize & Stakes</Text>
        <Text style={styles.stepSubtitle}>
          Optional: Put money on the line to increase commitment
        </Text>

        {/* Prize Amount */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Prize Amount (Optional)</Text>
            <TouchableOpacity onPress={() => setShowExplanation(true)}>
              <Ionicons name="help-circle-outline" size={20} color="#6366f1" />
            </TouchableOpacity>
          </View>

          <View style={styles.prizeInputRow}>
            <TouchableOpacity style={styles.currencyButton} onPress={showCurrencyPicker}>
              <Text style={styles.currencySymbol}>{selectedCurrency?.symbol}</Text>
              <Text style={styles.currencyCode}>{selectedCurrency?.code}</Text>
              <Ionicons name="chevron-down" size={16} color="#64748b" />
            </TouchableOpacity>

            <TextInput
              style={styles.prizeInput}
              placeholder="0"
              value={prizeAmount}
              onChangeText={setPrizeAmount}
              keyboardType="decimal-pad"
              placeholderTextColor="#cbd5e1"
            />
          </View>

          {errors.prizeAmount && (
            <Text style={styles.errorText}>{errors.prizeAmount}</Text>
          )}

          <View style={styles.infoBox}>
            <Ionicons name="information-circle-outline" size={16} color="#6366f1" />
            <Text style={styles.infoText}>
              Setting a stake increases commitment but is completely optional
            </Text>
          </View>
        </View>

        {/* Failure Consequence (only if prize > 0) */}
        {hasPrize && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>If I Fail, My Stake Goes To...</Text>
            <View style={styles.radioGroup}>
              {FAILURE_CONSEQUENCES.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.radioOption,
                    failureConsequence === option.value && styles.radioOptionSelected,
                  ]}
                  onPress={() => setFailureConsequence(option.value)}
                  activeOpacity={0.7}
                >
                  <View style={styles.radioOptionHeader}>
                    <View style={styles.radioCircle}>
                      {failureConsequence === option.value && (
                        <View style={styles.radioCircleInner} />
                      )}
                    </View>
                    <Text style={styles.radioLabel}>{option.label}</Text>
                    {option.recommended && (
                      <View style={styles.recommendedBadge}>
                        <Text style={styles.recommendedText}>Recommended</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.radioDescription}>{option.description}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {errors.failureConsequence && (
              <Text style={styles.errorText}>{errors.failureConsequence}</Text>
            )}
          </View>
        )}

        {/* Urgency Level (always shown) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Urgency Level</Text>
          <Text style={styles.sectionSubtitle}>
            Controls when you can edit this challenge
          </Text>

          <View style={styles.radioGroup}>
            {URGENCY_LEVELS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.radioOption,
                  urgencyLevel === option.value && styles.radioOptionSelected,
                ]}
                onPress={() => setUrgencyLevel(option.value)}
                activeOpacity={0.7}
              >
                <View style={styles.radioOptionHeader}>
                  <View style={styles.radioCircle}>
                    {urgencyLevel === option.value && (
                      <View style={styles.radioCircleInner} />
                    )}
                  </View>
                  <Text style={styles.radioLabel}>
                    {option.icon} {option.label}
                  </Text>
                  {option.default && (
                    <View style={styles.defaultBadge}>
                      <Text style={styles.defaultText}>Default</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.radioDescription}>{option.description}</Text>
                <Text style={styles.editRuleText}>{option.editRule}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Terms Checkbox (only if prize > 0) */}
        {hasPrize && (
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => setTermsAccepted(!termsAccepted)}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, termsAccepted && styles.checkboxChecked]}>
                {termsAccepted && <Ionicons name="checkmark" size={16} color="#fff" />}
              </View>
              <Text style={styles.checkboxLabel}>
                I understand my stake is at risk if I fail to complete this challenge
              </Text>
            </TouchableOpacity>
            {errors.terms && <Text style={styles.errorText}>{errors.terms}</Text>}
          </View>
        )}

        {/* Summary Box */}
        {hasPrize && (
          <View style={styles.summaryBox}>
            <Text style={styles.summaryTitle}>Summary</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Stake:</Text>
              <Text style={styles.summaryValue}>
                {selectedCurrency?.symbol}
                {prizeAmount} {selectedCurrency?.code}
              </Text>
            </View>
            {failureConsequence && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>On Failure:</Text>
                <Text style={styles.summaryValue}>
                  {FAILURE_CONSEQUENCES.find((c) => c.value === failureConsequence)?.label}
                </Text>
              </View>
            )}
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Urgency:</Text>
              <Text style={styles.summaryValue}>
                {URGENCY_LEVELS.find((u) => u.value === urgencyLevel)?.label}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionBar}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Ionicons name="arrow-back" size={20} color="#64748b" />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
          <Text style={styles.nextButtonText}>Next</Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Prize Explanation Modal */}
      <PrizeExplanationModal
        visible={showExplanation}
        onClose={() => setShowExplanation(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 4,
    marginBottom: 12,
  },
  prizeInputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  currencyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  currencyCode: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
  },
  prizeInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1e293b',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#eef2ff',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  infoText: {
    fontSize: 12,
    color: '#4f46e5',
    fontWeight: '500',
    flex: 1,
    lineHeight: 16,
  },
  radioGroup: {
    gap: 12,
  },
  radioOption: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 14,
  },
  radioOptionSelected: {
    borderColor: '#6366f1',
    backgroundColor: '#eef2ff',
  },
  radioOptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioCircleInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#6366f1',
  },
  radioLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
    flex: 1,
  },
  recommendedBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  recommendedText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#15803d',
  },
  defaultBadge: {
    backgroundColor: '#e0e7ff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  defaultText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#4f46e5',
  },
  radioDescription: {
    fontSize: 13,
    color: '#64748b',
    marginLeft: 30,
    lineHeight: 18,
  },
  editRuleText: {
    fontSize: 11,
    color: '#6366f1',
    fontWeight: '500',
    marginLeft: 30,
    marginTop: 4,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
  },
  summaryBox: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 16,
  },
  summaryTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: 4,
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  backButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#64748b',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#6366f1',
  },
  nextButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
});
