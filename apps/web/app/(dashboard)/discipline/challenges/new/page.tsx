'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import type { ChallengeFormData } from '@manifestation/shared';
import { PrizeExplanation } from '@/components/challenges/PrizeExplanation';
import { sendChallengeInvitation } from '@/lib/mailgun';
import { ActivityHierarchySelector } from '@/components/discipline/challenges/ActivityHierarchySelector';

export default function NewChallengePage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState<ChallengeFormData>({
    title: '',
    description: '',
    startDate: new Date(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    prizeAmount: 0,
    prizeCurrency: 'USD',
    isPublic: false,
    selectedActivityIds: [],
    participantEmails: [],
    accountabilityPartnerEmail: '',
  });

  const [urgencyLevel, setUrgencyLevel] = useState<'critical' | 'high' | 'medium'>('medium');
  const [failureConsequence, setFailureConsequence] = useState<'charity' | 'partner' | 'platform' | 'anti-charity'>('charity');
  const [termsAccepted, setTermsAccepted] = useState(false);

  const [emailInput, setEmailInput] = useState('');
  const [partnerEmailInput, setPartnerEmailInput] = useState('');

  const handleAddEmail = () => {
    if (emailInput.trim() && !formData.participantEmails.includes(emailInput.trim())) {
      setFormData({
        ...formData,
        participantEmails: [...formData.participantEmails, emailInput.trim()],
      });
      setEmailInput('');
    }
  };

  const handleRemoveEmail = (email: string) => {
    setFormData({
      ...formData,
      participantEmails: formData.participantEmails.filter(e => e !== email),
    });
  };

  const handleSetAccountabilityPartner = () => {
    if (partnerEmailInput.trim()) {
      setFormData({
        ...formData,
        accountabilityPartnerEmail: partnerEmailInput.trim(),
      });
      setPartnerEmailInput('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      alert('Please enter a challenge title');
      return;
    }

    if (formData.selectedActivityIds.length === 0) {
      alert('Please select at least one activity');
      return;
    }

    if (formData.startDate >= formData.endDate) {
      alert('End date must be after start date');
      return;
    }

    if (formData.prizeAmount > 0 && !termsAccepted) {
      alert('Please accept the terms and conditions to proceed with stake commitment');
      return;
    }

    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Create challenge
      const { data: challengeData, error: challengeError } = await supabase
        .from('challenges')
        .insert({
          creator_id: user.id,
          title: formData.title.trim(),
          description: formData.description?.trim() || null,
          start_date: formData.startDate.toISOString().split('T')[0],
          end_date: formData.endDate.toISOString().split('T')[0],
          status: 'draft',
          prize_amount: formData.prizeAmount,
          prize_currency: formData.prizeCurrency,
          is_public: formData.isPublic,
          urgency_level: urgencyLevel,
          failure_consequence: formData.prizeAmount > 0 ? failureConsequence : null,
        })
        .select()
        .single();

      if (challengeError) throw challengeError;

      const challengeId = challengeData.id;

      // Add creator as participant
      await supabase.from('challenge_participants').insert({
        challenge_id: challengeId,
        user_id: user.id,
        role: 'creator',
        status: 'accepted', // Fixed: DB enum uses 'accepted', not 'joined'
        joined_at: new Date().toISOString(),
      });

      // Add selected activities
      const activityInserts = formData.selectedActivityIds.map(activityId => ({
        challenge_id: challengeId,
        activity_id: activityId,
        is_required: true,
      }));

      await supabase.from('challenge_activities').insert(activityInserts);

      // Get current user's name for email personalization
      const { data: userData } = await supabase
        .from('users')
        .select('full_name, email')
        .eq('id', user.id)
        .single();

      const userName = userData?.full_name || userData?.email?.split('@')[0] || 'A user';

      // Invite participants via email
      if (formData.participantEmails.length > 0) {
        // Send invitation emails to all participants
        const invitationPromises = formData.participantEmails.map(email =>
          sendChallengeInvitation(
            email,
            email.split('@')[0], // Use email prefix as name fallback
            userName,
            formData.title,
            formData.description || 'Join this challenge to achieve your goals together!',
            challengeId,
            'participant'
          ).catch(err => {
            console.error(`Failed to send invitation to ${email}:`, err);
            // Continue even if email fails - don't block challenge creation
          })
        );
        await Promise.all(invitationPromises);
      }

      // Invite accountability partner via email
      if (formData.accountabilityPartnerEmail) {
        await sendChallengeInvitation(
          formData.accountabilityPartnerEmail,
          formData.accountabilityPartnerEmail.split('@')[0], // Use email prefix as name fallback
          userName,
          formData.title,
          formData.description || 'You have been invited as an accountability partner for this challenge.',
          challengeId,
          'accountability_partner'
        ).catch(err => {
          console.error(`Failed to send invitation to accountability partner:`, err);
          // Continue even if email fails
        });
      }

      // Navigate to payment page if prize amount > 0, otherwise go to detail page
      if (formData.prizeAmount > 0) {
        router.push(`/discipline/challenges/${challengeId}/payment`);
      } else {
        router.push(`/discipline/challenges/${challengeId}`);
      }
    } catch (error: any) {
      console.error('Failed to create challenge:', error);
      alert('Failed to create challenge: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Create New Challenge</h1>
        <p className="mt-1 text-sm md:text-base text-gray-600">
          Set up a challenge with stakes and accountability
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Basic Information</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Challenge Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="e.g., 30-Day Meditation Challenge"
                maxLength={100}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="What's this challenge about?"
                rows={3}
                maxLength={500}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date *
                </label>
                <input
                  type="date"
                  value={formData.startDate.toISOString().split('T')[0]}
                  onChange={(e) => setFormData({ ...formData, startDate: new Date(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date *
                </label>
                <input
                  type="date"
                  value={formData.endDate.toISOString().split('T')[0]}
                  onChange={(e) => setFormData({ ...formData, endDate: new Date(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                />
              </div>
            </div>
          </div>
        </div>

        {/* Activities */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Select Activities *</h2>
          <p className="text-sm text-gray-600 mb-4">
            Choose which activities are part of this challenge
          </p>

          <ActivityHierarchySelector
            selectedActivityIds={formData.selectedActivityIds}
            onSelectionChange={(activityIds) => {
              setFormData(prev => ({ ...prev, selectedActivityIds: activityIds }));
            }}
          />
        </div>

        {/* Stakes / Prize */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">💰 Stakes</h2>
          <p className="text-sm text-gray-600 mb-4">
            Put money on the line to increase motivation
          </p>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prize Amount
              </label>
              <input
                type="number"
                value={formData.prizeAmount}
                onChange={(e) => setFormData({ ...formData, prizeAmount: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                min="0"
                step="0.01"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Currency
              </label>
              <select
                value={formData.prizeCurrency}
                onChange={(e) => setFormData({ ...formData, prizeCurrency: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="INR">INR</option>
              </select>
            </div>
          </div>

          {/* Prize Explanation - Only show if prize amount is set */}
          {formData.prizeAmount > 0 && (
            <>
              <PrizeExplanation />

              {/* Failure Consequence */}
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  If I fail, my stake should go to:
                </label>
                <div className="space-y-3">
                  <label className="flex items-start p-4 border-2 border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors has-[:checked]:border-indigo-600 has-[:checked]:bg-indigo-50">
                    <input
                      type="radio"
                      name="consequence"
                      value="charity"
                      checked={failureConsequence === 'charity'}
                      onChange={(e) => setFailureConsequence(e.target.value as any)}
                      className="mt-0.5 w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                    />
                    <div className="ml-3 flex-1">
                      <p className="text-sm font-semibold text-gray-900">Charity (Recommended)</p>
                      <p className="text-xs text-gray-600 mt-1">
                        Your stake will be donated to a charitable cause, turning failure into positive impact.
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start p-4 border-2 border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors has-[:checked]:border-indigo-600 has-[:checked]:bg-indigo-50">
                    <input
                      type="radio"
                      name="consequence"
                      value="partner"
                      checked={failureConsequence === 'partner'}
                      onChange={(e) => setFailureConsequence(e.target.value as any)}
                      className="mt-0.5 w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                      disabled={!formData.accountabilityPartnerEmail}
                    />
                    <div className="ml-3 flex-1">
                      <p className="text-sm font-semibold text-gray-900">
                        Accountability Partner {!formData.accountabilityPartnerEmail && <span className="text-gray-400">(Set partner first)</span>}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        Your partner receives the stake, giving them extra motivation to help you succeed.
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start p-4 border-2 border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors has-[:checked]:border-indigo-600 has-[:checked]:bg-indigo-50">
                    <input
                      type="radio"
                      name="consequence"
                      value="platform"
                      checked={failureConsequence === 'platform'}
                      onChange={(e) => setFailureConsequence(e.target.value as any)}
                      className="mt-0.5 w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                    />
                    <div className="ml-3 flex-1">
                      <p className="text-sm font-semibold text-gray-900">Platform</p>
                      <p className="text-xs text-gray-600 mt-1">
                        Stake goes to the platform, helping maintain and improve the service for everyone.
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start p-4 border-2 border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors has-[:checked]:border-indigo-600 has-[:checked]:bg-indigo-50">
                    <input
                      type="radio"
                      name="consequence"
                      value="anti-charity"
                      checked={failureConsequence === 'anti-charity'}
                      onChange={(e) => setFailureConsequence(e.target.value as any)}
                      className="mt-0.5 w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                    />
                    <div className="ml-3 flex-1">
                      <p className="text-sm font-semibold text-gray-900">Anti-Charity</p>
                      <p className="text-xs text-gray-600 mt-1">
                        Stake goes to a cause you oppose, providing maximum motivation to succeed.
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Accountability Partner */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Accountability Partner</h2>
          <p className="text-sm text-gray-600 mb-4">
            Choose someone who will approve your activity completions
          </p>

          <div className="flex gap-2">
            <input
              type="email"
              value={partnerEmailInput}
              onChange={(e) => setPartnerEmailInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleSetAccountabilityPartner())}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="partner@example.com"
            />
            <button
              type="button"
              onClick={handleSetAccountabilityPartner}
              className="px-4 py-2 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Set Partner
            </button>
          </div>

          {formData.accountabilityPartnerEmail && (
            <div className="mt-3 flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-sm font-medium text-green-900">{formData.accountabilityPartnerEmail}</span>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, accountabilityPartnerEmail: '' })}
                className="ml-auto text-green-700 hover:text-green-900"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Participants */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Invite Participants (Optional)</h2>
          <p className="text-sm text-gray-600 mb-4">
            Invite friends to compete with you
          </p>

          <div className="flex gap-2 mb-3">
            <input
              type="email"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddEmail())}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="friend@example.com"
            />
            <button
              type="button"
              onClick={handleAddEmail}
              className="px-4 py-2 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Add
            </button>
          </div>

          {formData.participantEmails.length > 0 && (
            <div className="space-y-2">
              {formData.participantEmails.map((email, index) => (
                <div key={index} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-900">{email}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveEmail(email)}
                    className="ml-auto text-gray-500 hover:text-gray-700"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Urgency Level */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">⚡ Urgency Level</h2>
          <p className="text-sm text-gray-600 mb-4">
            How urgent is this challenge for you? This determines when the challenge locks and can no longer be edited.
          </p>

          <div className="space-y-3">
            <label className="flex items-start p-4 border-2 border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors has-[:checked]:border-indigo-600 has-[:checked]:bg-indigo-50">
              <input
                type="radio"
                name="urgency"
                value="critical"
                checked={urgencyLevel === 'critical'}
                onChange={(e) => setUrgencyLevel(e.target.value as any)}
                className="mt-0.5 w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
              />
              <div className="ml-3 flex-1">
                <p className="text-sm font-semibold text-gray-900">🔴 Critical - Lock Immediately</p>
                <p className="text-xs text-gray-600 mt-1">
                  This is extremely urgent. Challenge locks after creation and cannot be edited. Maximum commitment.
                </p>
              </div>
            </label>

            <label className="flex items-start p-4 border-2 border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors has-[:checked]:border-indigo-600 has-[:checked]:bg-indigo-50">
              <input
                type="radio"
                name="urgency"
                value="high"
                checked={urgencyLevel === 'high'}
                onChange={(e) => setUrgencyLevel(e.target.value as any)}
                className="mt-0.5 w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
              />
              <div className="ml-3 flex-1">
                <p className="text-sm font-semibold text-gray-900">🟡 High - Lock on Start Date (Recommended)</p>
                <p className="text-xs text-gray-600 mt-1">
                  Challenge can be edited until the start date. Locks when the challenge begins.
                </p>
              </div>
            </label>

            <label className="flex items-start p-4 border-2 border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors has-[:checked]:border-indigo-600 has-[:checked]:bg-indigo-50">
              <input
                type="radio"
                name="urgency"
                value="medium"
                checked={urgencyLevel === 'medium'}
                onChange={(e) => setUrgencyLevel(e.target.value as any)}
                className="mt-0.5 w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
              />
              <div className="ml-3 flex-1">
                <p className="text-sm font-semibold text-gray-900">🟢 Medium - Lock Day Before</p>
                <p className="text-xs text-gray-600 mt-1">
                  Challenge can be edited until one day before start date. Most flexibility for planning.
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Settings */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Settings</h2>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isPublic}
              onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
              className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
            />
            <div>
              <p className="text-sm font-medium text-gray-900">Make challenge public</p>
              <p className="text-xs text-gray-500">Anyone can see and join this challenge</p>
            </div>
          </label>
        </div>

        {/* Terms & Conditions - Only show if prize amount is set */}
        {formData.prizeAmount > 0 && (
          <div className="bg-red-50 border-2 border-red-300 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-red-900 mb-3">⚠️ Commitment Required</h3>

                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="mt-1 w-5 h-5 text-red-600 border-red-300 rounded focus:ring-red-500"
                    required
                  />
                  <div className="flex-1">
                    <p className="text-sm text-gray-900 leading-relaxed">
                      <span className="font-bold text-red-900">I understand and accept that I am committing {formData.prizeCurrency} {formData.prizeAmount.toFixed(2)} to this challenge.</span>
                      {' '}If I successfully complete all required activities within the challenge period and they are approved by my accountability partner, I will <span className="font-bold text-green-700">WIN BACK 100% of my stake</span>.
                    </p>
                    <p className="text-sm text-gray-900 leading-relaxed mt-3">
                      <span className="font-bold text-red-900">However, if I FAIL to complete the challenge</span> (by missing required activities or having activities rejected), I will <span className="font-bold text-red-900">LOSE this money entirely</span> and it will go to: <span className="font-semibold">{
                        failureConsequence === 'charity' ? 'a charitable organization' :
                        failureConsequence === 'partner' ? 'my accountability partner' :
                        failureConsequence === 'platform' ? 'the platform' :
                        'an anti-charity cause'
                      }</span>.
                    </p>
                    <p className="text-xs text-red-800 mt-3 italic">
                      This is a real commitment with real consequences. Only proceed if you are ready to hold yourself accountable.
                    </p>
                  </div>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 px-6 py-3 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
            disabled={submitting || formData.selectedActivityIds.length === 0 || (formData.prizeAmount > 0 && !termsAccepted)}
          >
            {submitting ? 'Creating...' : 'Create Challenge'}
          </button>
        </div>
      </form>
    </div>
  );
}
