'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import type { DisciplineActivity, ChallengeFormData } from '@manifestation/shared';
import { activityFromDB } from '@manifestation/shared';
import { PrizeExplanation } from '@/components/challenges/PrizeExplanation';
import Link from 'next/link';

export default function EditChallengePage() {
  const router = useRouter();
  const params = useParams();
  const challengeId = params.id as string;

  const [activities, setActivities] = useState<DisciplineActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [canEdit, setCanEdit] = useState(false);
  const [editMessage, setEditMessage] = useState('');

  const [formData, setFormData] = useState<ChallengeFormData>({
    title: '',
    description: '',
    startDate: new Date(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
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

  useEffect(() => {
    loadChallengeAndActivities();
  }, [challengeId]);

  const loadChallengeAndActivities = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      // Load challenge data
      const { data: challengeData, error: challengeError } = await supabase
        .from('challenges')
        .select('*, challenge_activities(activity_id)')
        .eq('id', challengeId)
        .single();

      if (challengeError) throw challengeError;

      // Check if user is the creator
      if (challengeData.creator_id !== user.id) {
        setEditMessage('You can only edit challenges you created.');
        setCanEdit(false);
        setLoading(false);
        return;
      }

      // Check if challenge can be edited based on status and urgency
      const status = challengeData.status;
      const urgency = challengeData.urgency_level || 'medium';
      const startDate = new Date(challengeData.start_date);
      const oneDayBefore = new Date(startDate.getTime() - 24 * 60 * 60 * 1000);
      const now = new Date();

      let canEditChallenge = false;
      let message = '';

      if (status === 'draft') {
        canEditChallenge = true;
        message = 'This challenge is in draft mode and can be edited.';
      } else if (status === 'active') {
        if (urgency === 'critical') {
          canEditChallenge = false;
          message = 'Critical urgency challenges cannot be edited after activation.';
        } else if (urgency === 'high') {
          if (now < startDate) {
            canEditChallenge = true;
            message = 'High urgency challenge - editable until start date.';
          } else {
            canEditChallenge = false;
            message = 'This challenge has started and can no longer be edited.';
          }
        } else { // medium
          if (now < oneDayBefore) {
            canEditChallenge = true;
            message = 'Medium urgency challenge - editable until 1 day before start date.';
          } else {
            canEditChallenge = false;
            message = 'This challenge is too close to start date and can no longer be edited.';
          }
        }
      } else {
        canEditChallenge = false;
        message = 'This challenge has ended and cannot be edited.';
      }

      setCanEdit(canEditChallenge);
      setEditMessage(message);

      if (!canEditChallenge) {
        setLoading(false);
        return;
      }

      // Load all activities
      const { data: activitiesData, error: activitiesError } = await supabase
        .from('discipline_activities')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('title', { ascending: true });

      if (activitiesError) throw activitiesError;
      setActivities((activitiesData || []).map(activityFromDB));

      // Populate form with existing challenge data
      setFormData({
        title: challengeData.title,
        description: challengeData.description || '',
        startDate: new Date(challengeData.start_date),
        endDate: new Date(challengeData.end_date),
        prizeAmount: challengeData.prize_amount || 0,
        prizeCurrency: challengeData.prize_currency || 'USD',
        isPublic: challengeData.is_public || false,
        selectedActivityIds: (challengeData.challenge_activities || []).map((ca: any) => ca.activity_id),
        participantEmails: [], // TODO: Load from challenge_participants
        accountabilityPartnerEmail: '', // TODO: Load from challenge_participants
      });

      setUrgencyLevel(urgency);
      setFailureConsequence(challengeData.failure_consequence || 'charity');
      setTermsAccepted(true); // Already accepted when created

    } catch (error: any) {
      console.error('Failed to load challenge:', error);
      setEditMessage('Failed to load challenge data.');
      setCanEdit(false);
    } finally {
      setLoading(false);
    }
  };

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

  const toggleActivity = (activityId: string) => {
    setFormData({
      ...formData,
      selectedActivityIds: formData.selectedActivityIds.includes(activityId)
        ? formData.selectedActivityIds.filter(id => id !== activityId)
        : [...formData.selectedActivityIds, activityId],
    });
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

    setSubmitting(true);
    try {
      // Update challenge
      const { error: challengeError } = await supabase
        .from('challenges')
        .update({
          title: formData.title.trim(),
          description: formData.description?.trim() || null,
          start_date: formData.startDate.toISOString().split('T')[0],
          end_date: formData.endDate.toISOString().split('T')[0],
          prize_amount: formData.prizeAmount,
          prize_currency: formData.prizeCurrency,
          is_public: formData.isPublic,
          urgency_level: urgencyLevel,
          failure_consequence: formData.prizeAmount > 0 ? failureConsequence : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', challengeId);

      if (challengeError) throw challengeError;

      // Delete existing activity associations
      await supabase
        .from('challenge_activities')
        .delete()
        .eq('challenge_id', challengeId);

      // Add updated activity selections
      const activityInserts = formData.selectedActivityIds.map(activityId => ({
        challenge_id: challengeId,
        activity_id: activityId,
        is_required: true,
      }));

      await supabase.from('challenge_activities').insert(activityInserts);

      // Navigate back to challenge detail page
      router.push(`/discipline/challenges/${challengeId}`);
    } catch (error: any) {
      console.error('Failed to update challenge:', error);
      alert('Failed to update challenge: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-600">Loading challenge...</div>
        </div>
      </div>
    );
  }

  if (!canEdit) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-red-50 border-2 border-red-300 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <svg className="w-8 h-8 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-red-900 mb-2">Cannot Edit Challenge</h3>
                <p className="text-sm text-red-800 mb-4">{editMessage}</p>
                <Link
                  href={`/discipline/challenges/${challengeId}`}
                  className="inline-block px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Back to Challenge
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <Link
            href={`/discipline/challenges/${challengeId}`}
            className="text-indigo-600 hover:text-indigo-700 mb-4 inline-flex items-center gap-2 text-sm md:text-base"
          >
            <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Challenge
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mt-4">Edit Challenge</h1>
          <p className="text-sm md:text-base text-gray-600 mt-2">{editMessage}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
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
                  placeholder="e.g., 30-Day Fitness Challenge"
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
                  rows={4}
                  placeholder="Describe what this challenge is about..."
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

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={formData.isPublic}
                  onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <label htmlFor="isPublic" className="ml-2 text-sm text-gray-700">
                  Make this challenge public (others can see and join)
                </label>
              </div>
            </div>
          </div>

          {/* Urgency Level */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">⚡ Urgency Level</h2>
            <p className="text-sm text-gray-600 mb-4">
              Choose how flexible you want to be with editing this challenge after activation
            </p>

            <div className="space-y-3">
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
                  <p className="text-sm font-semibold text-gray-900">Medium (Recommended)</p>
                  <p className="text-xs text-gray-600 mt-1">
                    Editable until 1 day before start date. Good balance of flexibility and commitment.
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
                  <p className="text-sm font-semibold text-gray-900">High</p>
                  <p className="text-xs text-gray-600 mt-1">
                    Editable until start date. More flexibility to adjust as needed.
                  </p>
                </div>
              </label>

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
                  <p className="text-sm font-semibold text-gray-900">Critical</p>
                  <p className="text-xs text-gray-600 mt-1">
                    Never editable after activation. Maximum commitment - no backing out!
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Activities Selection */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Select Activities *</h2>
            <p className="text-sm text-gray-600 mb-4">
              Choose which activities are part of this challenge
            </p>

            {activities.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No activities found. Create activities first.</p>
                <Link
                  href="/discipline"
                  className="text-indigo-600 hover:text-indigo-700 mt-2 inline-block"
                >
                  Go to Discipline Dashboard
                </Link>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {activities.map((activity) => (
                  <label
                    key={activity.id}
                    className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors has-[:checked]:bg-indigo-50 has-[:checked]:border-indigo-300"
                  >
                    <input
                      type="checkbox"
                      checked={formData.selectedActivityIds.includes(activity.id)}
                      onChange={() => toggleActivity(activity.id)}
                      className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    />
                    <div className="ml-3 flex-1">
                      <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                      <p className="text-xs text-gray-500">
                        {activity.trackingType} • {activity.frequencyType}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            )}

            {formData.selectedActivityIds.length > 0 && (
              <p className="text-sm text-gray-600 mt-3">
                {formData.selectedActivityIds.length} {formData.selectedActivityIds.length === 1 ? 'activity' : 'activities'} selected
              </p>
            )}
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

          {/* Submit Button */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Updating Challenge...' : 'Update Challenge'}
            </button>
            <Link
              href={`/discipline/challenges/${challengeId}`}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors text-center"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
