'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import type { Challenge, ChallengeParticipant, DisciplineActivity, ActivityLog } from '@manifestation/shared';
import { activityFromDB, activityLogFromDB } from '@manifestation/shared';
import Link from 'next/link';

interface ChallengeData {
  challenge: Challenge;
  participants: ChallengeParticipant[];
  activities: DisciplineActivity[];
  myRole: string;
  isAccountabilityPartner: boolean;
}

interface ActivityProgress {
  activity: DisciplineActivity;
  totalExpected: number;
  completed: number;
  pending: number;
  approved: number;
  rejected: number;
}

export default function ChallengeDetailPage() {
  const router = useRouter();
  const params = useParams();
  const challengeId = params.id as string;

  const [data, setData] = useState<ChallengeData | null>(null);
  const [progress, setProgress] = useState<ActivityProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingApprovals, setPendingApprovals] = useState(0);
  const [activating, setActivating] = useState(false);

  useEffect(() => {
    loadChallengeData();
  }, [challengeId]);

  const loadChallengeData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      // Load challenge
      const { data: challengeData, error: challengeError } = await supabase
        .from('challenges')
        .select('*')
        .eq('id', challengeId)
        .single();

      if (challengeError) throw challengeError;

      // Transform challenge data
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

      // Load participants
      const { data: participantsData, error: participantsError } = await supabase
        .from('challenge_participants')
        .select('*')
        .eq('challenge_id', challengeId);

      if (participantsError) throw participantsError;

      // Transform participants
      const participants: ChallengeParticipant[] = (participantsData || []).map(p => ({
        id: p.id,
        challengeId: p.challenge_id,
        userId: p.user_id,
        role: p.role,
        status: p.status,
        joinedAt: p.joined_at ? new Date(p.joined_at) : undefined,
        createdAt: new Date(p.created_at),
        updatedAt: new Date(p.updated_at),
      }));

      // Find my role
      const myParticipant = participants.find(p => p.userId === user.id);
      const myRole = myParticipant?.role || 'none';
      const isAccountabilityPartner = myRole === 'accountability_partner';

      // Load challenge activities
      const { data: challengeActivitiesData, error: activitiesError } = await supabase
        .from('challenge_activities')
        .select('activity_id')
        .eq('challenge_id', challengeId);

      if (activitiesError) throw activitiesError;

      const activityIds = (challengeActivitiesData || []).map(ca => ca.activity_id);

      // Load activity details
      const { data: activitiesData, error: activitiesDetailError } = await supabase
        .from('discipline_activities')
        .select('*')
        .in('id', activityIds);

      if (activitiesDetailError) throw activitiesDetailError;
      const activities = (activitiesData || []).map(activityFromDB);

      setData({
        challenge,
        participants,
        activities,
        myRole,
        isAccountabilityPartner,
      });

      // Calculate progress for each activity
      await loadProgress(challenge, activities, user.id);

      // Count pending approvals
      if (isAccountabilityPartner) {
        const { count } = await supabase
          .from('challenge_activity_logs')
          .select('*', { count: 'exact', head: true })
          .eq('challenge_id', challengeId)
          .eq('approval_status', 'pending');

        setPendingApprovals(count || 0);
      }
    } catch (error: any) {
      console.error('Failed to load challenge:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProgress = async (challenge: Challenge, activities: DisciplineActivity[], userId: string) => {
    const start = new Date(challenge.startDate);
    const end = new Date(challenge.endDate);
    const now = new Date();
    const currentEnd = now < end ? now : end;

    const progressData: ActivityProgress[] = [];

    for (const activity of activities) {
      // Calculate expected completions based on frequency
      let totalExpected = 0;
      let current = new Date(start);

      while (current <= currentEnd) {
        if (activity.frequencyType === 'daily') {
          totalExpected++;
        } else if (activity.frequencyType === 'specific_days') {
          const dayOfWeek = current.getDay();
          const config = activity.frequencyConfig as { days: number[] };
          if (config?.days?.includes(dayOfWeek)) {
            totalExpected++;
          }
        }
        current.setDate(current.getDate() + 1);
      }

      // Get actual logs
      const { data: logsData } = await supabase
        .from('activity_logs')
        .select('id')
        .eq('activity_id', activity.id)
        .eq('user_id', userId)
        .gte('log_date', challenge.startDate.toISOString().split('T')[0])
        .lte('log_date', currentEnd.toISOString().split('T')[0]);

      const logIds = (logsData || []).map(l => l.id);

      // Get approval statuses
      let approved = 0;
      let pending = 0;
      let rejected = 0;

      if (logIds.length > 0) {
        const { data: approvalData } = await supabase
          .from('challenge_activity_logs')
          .select('approval_status')
          .eq('challenge_id', challengeId)
          .in('activity_log_id', logIds);

        (approvalData || []).forEach(a => {
          if (a.approval_status === 'approved') approved++;
          else if (a.approval_status === 'pending') pending++;
          else if (a.approval_status === 'rejected') rejected++;
        });
      }

      progressData.push({
        activity,
        totalExpected,
        completed: logsData?.length || 0,
        pending,
        approved,
        rejected,
      });
    }

    setProgress(progressData);
  };

  const getDaysRemaining = () => {
    if (!data) return 0;
    const now = new Date();
    const end = new Date(data.challenge.endDate);
    const diff = end.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const getDaysElapsed = () => {
    if (!data) return 0;
    const now = new Date();
    const start = new Date(data.challenge.startDate);
    const end = new Date(data.challenge.endDate);
    const current = now < end ? now : end;
    const diff = current.getTime() - start.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const getTotalDays = () => {
    if (!data) return 0;
    const start = new Date(data.challenge.startDate);
    const end = new Date(data.challenge.endDate);
    const diff = end.getTime() - start.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const getOverallCompletionRate = () => {
    if (progress.length === 0) return 0;
    const totalExpected = progress.reduce((sum, p) => sum + p.totalExpected, 0);
    const totalApproved = progress.reduce((sum, p) => sum + p.approved, 0);
    return totalExpected > 0 ? Math.round((totalApproved / totalExpected) * 100) : 0;
  };

  const handleActivateChallenge = async () => {
    if (!data) return;

    const confirmed = confirm(
      `Are you ready to activate "${data.challenge.title}"?\n\n` +
      `Once activated, the challenge will begin and you'll need to complete all activities to win back your stake.`
    );

    if (!confirmed) return;

    setActivating(true);
    try {
      const { error } = await supabase
        .from('challenges')
        .update({
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', challengeId);

      if (error) throw error;

      // Reload challenge data
      await loadChallengeData();

      alert('Challenge activated successfully! Good luck!');
    } catch (error: any) {
      console.error('Failed to activate challenge:', error);
      alert('Failed to activate challenge: ' + error.message);
    } finally {
      setActivating(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
        </div>
      </div>
    );
  }

  const { challenge, participants, activities, myRole, isAccountabilityPartner } = data;
  const daysRemaining = getDaysRemaining();
  const daysElapsed = getDaysElapsed();
  const totalDays = getTotalDays();
  const completionRate = getOverallCompletionRate();

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col gap-4 mb-4">
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{challenge.title}</h1>
            {challenge.description && (
              <p className="mt-2 text-sm md:text-base text-gray-600">{challenge.description}</p>
            )}
          </div>
          <div className="flex flex-wrap gap-2 md:gap-3">
            {/* Track Activities Button - Show for active challenges */}
            {challenge.status === 'active' && (
              <Link
                href="/discipline/tracker"
                className="px-3 md:px-4 py-2 text-sm md:text-base text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 whitespace-nowrap"
              >
                <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                <span className="hidden sm:inline">Track Activities</span>
                <span className="sm:hidden">Track</span>
              </Link>
            )}
            {/* Activate Button - Only show for draft challenges created by user */}
            {challenge.status === 'draft' && myRole === 'creator' && (
              <button
                onClick={handleActivateChallenge}
                disabled={activating}
                className="px-3 md:px-4 py-2 text-sm md:text-base text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
              >
                <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="hidden sm:inline">{activating ? 'Activating...' : 'Activate Challenge'}</span>
                <span className="sm:hidden">{activating ? 'Activating...' : 'Activate'}</span>
              </button>
            )}
            {isAccountabilityPartner && pendingApprovals > 0 && (
              <Link
                href={`/discipline/challenges/${challengeId}/approvals`}
                className="px-3 md:px-4 py-2 text-sm md:text-base text-white bg-orange-600 rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2 whitespace-nowrap"
              >
                <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {pendingApprovals} Pending
              </Link>
            )}
            <button
              onClick={() => router.back()}
              className="px-3 md:px-4 py-2 text-sm md:text-base text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap"
            >
              Back
            </button>
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            challenge.status === 'active' ? 'bg-green-100 text-green-800' :
            challenge.status === 'completed' ? 'bg-blue-100 text-blue-800' :
            challenge.status === 'draft' ? 'bg-gray-100 text-gray-800' :
            'bg-red-100 text-red-800'
          }`}>
            {challenge.status.charAt(0).toUpperCase() + challenge.status.slice(1)}
          </span>
          {myRole && (
            <span className="px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
              {myRole === 'creator' ? 'Creator' : myRole === 'accountability_partner' ? 'Accountability Partner' : 'Participant'}
            </span>
          )}
        </div>
      </div>

      {/* Draft Notice */}
      {challenge.status === 'draft' && myRole === 'creator' && (
        <div className="bg-blue-50 border-2 border-blue-300 rounded-xl p-6 mb-8">
          <div className="flex items-start gap-4">
            <svg className="w-8 h-8 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-blue-900 mb-2">📝 Challenge is in Draft Mode</h3>
              <p className="text-sm text-blue-800 mb-3">
                This challenge has not been activated yet. You can still edit the challenge details, activities, and settings.
              </p>
              <p className="text-sm text-blue-800">
                <span className="font-semibold">When you're ready:</span> Click the "Activate Challenge" button above to start the challenge. Once activated, the challenge will begin according to your start date.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6 text-center">
          <p className="text-3xl md:text-4xl font-bold text-indigo-600">{completionRate}%</p>
          <p className="text-xs md:text-sm text-gray-600 mt-1">Completion Rate</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6 text-center">
          <p className="text-3xl md:text-4xl font-bold text-gray-900">{daysElapsed}/{totalDays}</p>
          <p className="text-xs md:text-sm text-gray-600 mt-1">Days Progress</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6 text-center">
          <p className="text-3xl md:text-4xl font-bold text-gray-900">{daysRemaining}</p>
          <p className="text-xs md:text-sm text-gray-600 mt-1">Days Remaining</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6 text-center">
          <p className="text-3xl md:text-4xl font-bold text-gray-900">{participants.filter(p => p.status === 'joined').length}</p>
          <p className="text-xs md:text-sm text-gray-600 mt-1">Participants</p>
        </div>
      </div>

      {/* Prize */}
      {challenge.prizeAmount > 0 && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200 p-4 md:p-6 mb-8">
          <div className="flex items-center gap-3 md:gap-4">
            <span className="text-4xl md:text-5xl">💰</span>
            <div>
              <p className="text-xl md:text-2xl font-bold text-amber-900">
                {challenge.prizeCurrency} {challenge.prizeAmount.toFixed(2)}
              </p>
              <p className="text-xs md:text-sm text-amber-700">at stake - Complete the challenge to win!</p>
            </div>
          </div>
        </div>
      )}

      {/* Activity Progress */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Activity Progress</h2>

        <div className="space-y-4">
          {progress.map(({ activity, totalExpected, completed, pending, approved, rejected }) => {
            const activityCompletionRate = totalExpected > 0 ? Math.round((approved / totalExpected) * 100) : 0;

            return (
              <div key={activity.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">{activity.title}</h3>
                  <span className="text-2xl font-bold text-indigo-600">{activityCompletionRate}%</span>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden mb-3">
                  <div
                    className="h-full bg-indigo-600 rounded-full transition-all"
                    style={{ width: `${activityCompletionRate}%` }}
                  />
                </div>

                {/* Stats */}
                <div className="grid grid-cols-5 gap-2 text-center">
                  <div className="p-2 bg-gray-50 rounded">
                    <p className="text-lg font-bold text-gray-900">{totalExpected}</p>
                    <p className="text-xs text-gray-600">Expected</p>
                  </div>
                  <div className="p-2 bg-blue-50 rounded">
                    <p className="text-lg font-bold text-blue-900">{completed}</p>
                    <p className="text-xs text-blue-600">Logged</p>
                  </div>
                  <div className="p-2 bg-green-50 rounded">
                    <p className="text-lg font-bold text-green-900">{approved}</p>
                    <p className="text-xs text-green-600">Approved</p>
                  </div>
                  <div className="p-2 bg-orange-50 rounded">
                    <p className="text-lg font-bold text-orange-900">{pending}</p>
                    <p className="text-xs text-orange-600">Pending</p>
                  </div>
                  <div className="p-2 bg-red-50 rounded">
                    <p className="text-lg font-bold text-red-900">{rejected}</p>
                    <p className="text-xs text-red-600">Rejected</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Participants */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Participants</h2>

        <div className="space-y-3">
          {participants.filter(p => p.status === 'joined').map((participant) => (
            <div key={participant.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">User {participant.userId.slice(0, 8)}</p>
                  <p className="text-xs text-gray-500">
                    {participant.role === 'creator' ? 'Challenge Creator' :
                     participant.role === 'accountability_partner' ? 'Accountability Partner' :
                     'Participant'}
                  </p>
                </div>
              </div>
              {participant.joinedAt && (
                <p className="text-xs text-gray-500">
                  Joined {new Date(participant.joinedAt).toLocaleDateString()}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
