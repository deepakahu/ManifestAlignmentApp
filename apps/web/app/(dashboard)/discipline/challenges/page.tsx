'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import type { Challenge } from '@manifestation/shared';
import { challengeFromDB } from '@manifestation/shared';
import Link from 'next/link';

interface ChallengeWithStats extends Challenge {
  participantCount: number;
  activityCount: number;
  approvalsPending: number;
}

export default function ChallengesPage() {
  const router = useRouter();
  const [challenges, setChallenges] = useState<ChallengeWithStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChallenges();
  }, []);

  const loadChallenges = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      // Load challenges where user is creator or participant
      // First get challenge IDs where user is a participant
      const { data: participantData } = await supabase
        .from('challenge_participants')
        .select('challenge_id')
        .eq('user_id', user.id);

      const participantChallengeIds = (participantData || []).map(p => p.challenge_id);

      // Then get all challenges where user is creator OR is in participant list
      let query = supabase
        .from('challenges')
        .select('*')
        .order('created_at', { ascending: false });

      if (participantChallengeIds.length > 0) {
        query = query.or(`user_id.eq.${user.id},id.in.(${participantChallengeIds.join(',')})`);
      } else {
        query = query.eq('user_id', user.id);
      }

      const { data: challengesData, error: challengesError } = await query;

      if (challengesError) throw challengesError;

      // Load stats for each challenge
      const challengesWithStats = await Promise.all(
        (challengesData || []).map(async (challengeData) => {
          // Transform to proper Challenge type
          const challenge: Challenge = {
            id: challengeData.id,
            userId: challengeData.user_id,
            title: challengeData.title,
            description: challengeData.description ?? undefined,
            startDate: new Date(challengeData.start_date),
            endDate: new Date(challengeData.end_date),
            status: challengeData.status,
            prizeAmount: challengeData.prize_amount,
            prizeCurrency: challengeData.prize_currency,
            isPublic: challengeData.is_public,
            createdAt: new Date(challengeData.created_at),
            updatedAt: new Date(challengeData.updated_at),
          };

          // Get participant count
          const { count: participantCount } = await supabase
            .from('challenge_participants')
            .select('*', { count: 'exact', head: true })
            .eq('challenge_id', challenge.id)
            .eq('status', 'accepted');

          // Get activity count
          const { count: activityCount } = await supabase
            .from('challenge_activities')
            .select('*', { count: 'exact', head: true })
            .eq('challenge_id', challenge.id);

          // Get pending approvals count
          const { count: approvalsPending } = await supabase
            .from('challenge_activity_logs')
            .select('*', { count: 'exact', head: true })
            .eq('challenge_id', challenge.id)
            .eq('approval_status', 'pending');

          return {
            ...challenge,
            participantCount: participantCount || 0,
            activityCount: activityCount || 0,
            approvalsPending: approvalsPending || 0,
          };
        })
      );

      setChallenges(challengesWithStats);
    } catch (error: any) {
      console.error('Failed to load challenges:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDaysRemaining = (endDate: Date) => {
    const now = new Date();
    const end = new Date(endDate);
    const diff = end.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Challenges</h1>
          <p className="mt-1 text-sm md:text-base text-gray-600">
            Compete with yourself and others with stakes on the line
          </p>
        </div>
        <Link
          href="/discipline/challenges/new"
          className="px-4 py-2 text-sm md:text-base text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors whitespace-nowrap text-center"
        >
          + New Challenge
        </Link>
      </div>

      {/* Challenges Grid */}
      {challenges.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No challenges yet</h3>
          <p className="text-gray-500 mb-6">
            Create your first challenge and put some stakes on the line!
          </p>
          <Link
            href="/discipline/challenges/new"
            className="inline-flex items-center px-6 py-3 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Create Challenge
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {challenges.map((challenge) => {
            const daysRemaining = getDaysRemaining(challenge.endDate);
            const isActive = challenge.status === 'active';
            const isDraft = challenge.status === 'draft';

            // Determine if challenge can be edited based on status and urgency
            const startDate = new Date(challenge.startDate);
            const oneDayBefore = new Date(startDate.getTime() - 24 * 60 * 60 * 1000);
            const now = new Date();

            let canEdit = false;
            if (isDraft) {
              // Draft challenges are always editable
              canEdit = true;
            } else if (isActive) {
              // Active challenges depend on urgency level (default to 'medium' if not set)
              const urgency = challenge.urgencyLevel || 'medium';
              if (urgency === 'critical') {
                canEdit = false; // Never editable after activation
              } else if (urgency === 'high') {
                canEdit = now < startDate; // Editable until start date
              } else { // medium
                canEdit = now < oneDayBefore; // Editable until 1 day before
              }
            }

            return (
              <div
                key={challenge.id}
                className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow relative"
              >
                {/* Edit Button for Draft */}
                {canEdit && (
                  <Link
                    href={`/discipline/challenges/${challenge.id}/edit`}
                    className="absolute top-4 right-4 p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    title="Edit Challenge"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </Link>
                )}

                {/* Header */}
                <Link href={`/discipline/challenges/${challenge.id}`} className="block">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 pr-12">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {challenge.title}
                    </h3>
                    {challenge.description && (
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {challenge.description}
                      </p>
                    )}
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(challenge.status)}`}>
                    {challenge.status.charAt(0).toUpperCase() + challenge.status.slice(1)}
                  </span>
                </div>

                {/* Prize */}
                {challenge.prizeAmount > 0 && (
                  <div className="flex items-center gap-2 mb-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
                    <span className="text-2xl">💰</span>
                    <div>
                      <p className="text-sm font-medium text-amber-900">
                        {challenge.prizeCurrency} {challenge.prizeAmount.toFixed(2)}
                      </p>
                      <p className="text-xs text-amber-700">Prize at stake</p>
                    </div>
                  </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4">
                  <div className="text-center p-2 sm:p-3 bg-gray-50 rounded-lg">
                    <p className="text-xl sm:text-2xl font-bold text-gray-900">{challenge.participantCount}</p>
                    <p className="text-xs text-gray-600">Participants</p>
                  </div>
                  <div className="text-center p-2 sm:p-3 bg-gray-50 rounded-lg">
                    <p className="text-xl sm:text-2xl font-bold text-gray-900">{challenge.activityCount}</p>
                    <p className="text-xs text-gray-600">Activities</p>
                  </div>
                  <div className="text-center p-2 sm:p-3 bg-gray-50 rounded-lg">
                    <p className="text-xl sm:text-2xl font-bold text-gray-900">
                      {isActive && daysRemaining > 0 ? daysRemaining : '—'}
                    </p>
                    <p className="text-xs text-gray-600">Days Left</p>
                  </div>
                </div>

                {/* Pending Approvals Alert */}
                {challenge.approvalsPending > 0 && (
                  <div className="flex items-center gap-2 p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm font-medium text-orange-900">
                      {challenge.approvalsPending} pending approval{challenge.approvalsPending > 1 ? 's' : ''}
                    </p>
                  </div>
                )}

                {/* Dates */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm text-gray-500">
                    <span className="break-all">
                      {new Date(challenge.startDate).toLocaleDateString()} - {new Date(challenge.endDate).toLocaleDateString()}
                    </span>
                    {challenge.isPublic && (
                      <span className="flex items-center gap-1 whitespace-nowrap">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                        Public
                      </span>
                    )}
                  </div>
                </div>
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
