/**
 * ParticipantsStep Component
 *
 * Step 4 of challenge wizard: Add participants and accountability partner
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ChallengeFormData } from './ChallengeWizard';

interface ParticipantsStepProps {
  formData?: Partial<ChallengeFormData>;
  updateFormData?: (data: Partial<ChallengeFormData>) => void;
  onNext?: () => void;
  onBack?: () => void;
}

export function ParticipantsStep({
  formData,
  updateFormData,
  onNext,
  onBack,
}: ParticipantsStepProps) {
  const [participantEmail, setParticipantEmail] = useState('');
  const [participantEmails, setParticipantEmails] = useState<string[]>(
    formData?.participantEmails || []
  );
  const [accountabilityPartnerEmail, setAccountabilityPartnerEmail] = useState(
    formData?.accountabilityPartnerEmail || ''
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Update form data when values change
  useEffect(() => {
    updateFormData?.({
      participantEmails,
      accountabilityPartnerEmail: accountabilityPartnerEmail || undefined,
    });
  }, [participantEmails, accountabilityPartnerEmail]);

  /**
   * Validate email format
   */
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  };

  /**
   * Add participant
   */
  const handleAddParticipant = () => {
    const email = participantEmail.trim();

    if (!email) {
      setErrors({ ...errors, participant: 'Please enter an email address' });
      return;
    }

    if (!isValidEmail(email)) {
      setErrors({ ...errors, participant: 'Please enter a valid email address' });
      return;
    }

    if (participantEmails.includes(email)) {
      setErrors({ ...errors, participant: 'This email is already added' });
      return;
    }

    if (email === accountabilityPartnerEmail) {
      setErrors({
        ...errors,
        participant: 'This email is already set as accountability partner',
      });
      return;
    }

    setParticipantEmails([...participantEmails, email]);
    setParticipantEmail('');
    setErrors({ ...errors, participant: '' });
  };

  /**
   * Remove participant
   */
  const handleRemoveParticipant = (email: string) => {
    setParticipantEmails(participantEmails.filter((e) => e !== email));
  };

  /**
   * Set accountability partner
   */
  const handleSetAccountabilityPartner = () => {
    const email = accountabilityPartnerEmail.trim();

    if (!email) {
      // Allow clearing the accountability partner
      setAccountabilityPartnerEmail('');
      setErrors({ ...errors, partner: '' });
      return;
    }

    if (!isValidEmail(email)) {
      setErrors({ ...errors, partner: 'Please enter a valid email address' });
      return;
    }

    if (participantEmails.includes(email)) {
      setErrors({
        ...errors,
        partner: 'This email is already added as a participant',
      });
      return;
    }

    setErrors({ ...errors, partner: '' });
  };

  /**
   * Validate
   */
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Accountability partner is optional, but if provided, must be valid
    if (accountabilityPartnerEmail && !isValidEmail(accountabilityPartnerEmail)) {
      newErrors.partner = 'Please enter a valid email address';
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

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <Text style={styles.stepTitle}>Participants</Text>
        <Text style={styles.stepSubtitle}>
          Invite others to join your challenge (optional)
        </Text>

        {/* Invite Participants Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Invite Participants</Text>
          <Text style={styles.sectionSubtitle}>
            Add people who will participate in this challenge with you
          </Text>

          <View style={styles.inputRow}>
            <TextInput
              style={styles.emailInput}
              placeholder="participant@example.com"
              value={participantEmail}
              onChangeText={(text) => {
                setParticipantEmail(text);
                setErrors({ ...errors, participant: '' });
              }}
              onSubmitEditing={handleAddParticipant}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              placeholderTextColor="#94a3b8"
            />
            <TouchableOpacity
              style={styles.addButton}
              onPress={handleAddParticipant}
              activeOpacity={0.7}
            >
              <Ionicons name="add-circle" size={28} color="#6366f1" />
            </TouchableOpacity>
          </View>

          {errors.participant && (
            <Text style={styles.errorText}>{errors.participant}</Text>
          )}

          {/* Participant Chips */}
          {participantEmails.length > 0 && (
            <View style={styles.chipsContainer}>
              {participantEmails.map((email) => (
                <View key={email} style={styles.chip}>
                  <Ionicons name="person" size={14} color="#6366f1" />
                  <Text style={styles.chipText} numberOfLines={1}>
                    {email}
                  </Text>
                  <TouchableOpacity
                    onPress={() => handleRemoveParticipant(email)}
                    hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
                  >
                    <Ionicons name="close-circle" size={18} color="#94a3b8" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {participantEmails.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={32} color="#cbd5e1" />
              <Text style={styles.emptyText}>No participants added yet</Text>
            </View>
          )}
        </View>

        {/* Accountability Partner Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Accountability Partner</Text>
            <View style={styles.optionalBadge}>
              <Text style={styles.optionalText}>Optional</Text>
            </View>
          </View>
          <Text style={styles.sectionSubtitle}>
            This person will approve or reject your activity logs
          </Text>

          <View style={styles.partnerInputContainer}>
            <Ionicons name="shield-checkmark" size={20} color="#8b5cf6" />
            <TextInput
              style={styles.partnerInput}
              placeholder="partner@example.com"
              value={accountabilityPartnerEmail}
              onChangeText={(text) => {
                setAccountabilityPartnerEmail(text);
                setErrors({ ...errors, partner: '' });
              }}
              onBlur={handleSetAccountabilityPartner}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              placeholderTextColor="#94a3b8"
            />
            {accountabilityPartnerEmail && (
              <TouchableOpacity
                onPress={() => {
                  setAccountabilityPartnerEmail('');
                  setErrors({ ...errors, partner: '' });
                }}
                hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
              >
                <Ionicons name="close-circle" size={20} color="#94a3b8" />
              </TouchableOpacity>
            )}
          </View>

          {errors.partner && <Text style={styles.errorText}>{errors.partner}</Text>}

          {/* Partner Info Box */}
          <View style={styles.infoBox}>
            <Ionicons name="information-circle-outline" size={16} color="#8b5cf6" />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoText}>
                Your accountability partner will receive notifications to approve your daily
                activity logs. Choose someone who will hold you accountable.
              </Text>
              {accountabilityPartnerEmail && (
                <Text style={[styles.infoText, { marginTop: 8, fontWeight: '600' }]}>
                  ✓ {accountabilityPartnerEmail}
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Summary */}
        {(participantEmails.length > 0 || accountabilityPartnerEmail) && (
          <View style={styles.summaryBox}>
            <Text style={styles.summaryTitle}>Who's Involved</Text>
            <View style={styles.summaryRow}>
              <Ionicons name="person" size={16} color="#64748b" />
              <Text style={styles.summaryLabel}>You (Creator)</Text>
            </View>
            {accountabilityPartnerEmail && (
              <View style={styles.summaryRow}>
                <Ionicons name="shield-checkmark" size={16} color="#8b5cf6" />
                <Text style={styles.summaryLabel}>
                  {accountabilityPartnerEmail} (Partner)
                </Text>
              </View>
            )}
            {participantEmails.map((email) => (
              <View key={email} style={styles.summaryRow}>
                <Ionicons name="person-outline" size={16} color="#64748b" />
                <Text style={styles.summaryLabel}>{email} (Participant)</Text>
              </View>
            ))}
          </View>
        )}

        {/* Note about invitations */}
        <View style={styles.noteBox}>
          <Ionicons name="mail-outline" size={18} color="#6366f1" />
          <Text style={styles.noteText}>
            Invitations will be sent to all participants and your accountability partner once
            you create the challenge.
          </Text>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionBar}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Ionicons name="arrow-back" size={20} color="#64748b" />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
          <Text style={styles.nextButtonText}>Create</Text>
          <Ionicons name="checkmark-circle" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 12,
  },
  optionalBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  optionalText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748b',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  emailInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#1e293b',
  },
  addButton: {
    padding: 4,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#eef2ff',
    paddingLeft: 10,
    paddingRight: 8,
    paddingVertical: 8,
    borderRadius: 20,
    maxWidth: '100%',
  },
  chipText: {
    fontSize: 13,
    color: '#4f46e5',
    fontWeight: '500',
    maxWidth: 200,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    marginTop: 12,
  },
  emptyText: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 8,
  },
  partnerInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  partnerInput: {
    flex: 1,
    fontSize: 15,
    color: '#1e293b',
    padding: 0,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#f5f3ff',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoText: {
    fontSize: 12,
    color: '#6b21a8',
    lineHeight: 16,
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
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 13,
    color: '#475569',
    flex: 1,
  },
  noteBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#eef2ff',
    padding: 12,
    borderRadius: 8,
  },
  noteText: {
    fontSize: 12,
    color: '#4f46e5',
    lineHeight: 16,
    flex: 1,
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
    backgroundColor: '#10b981',
  },
  nextButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
});
