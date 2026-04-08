'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import type { Challenge, ChallengeActivityLog, ActivityLog, DisciplineActivity } from '@manifestation/shared';
import { activityLogFromDB, activityFromDB } from '@manifestation/shared';

interface ApprovalItem {
  challengeActivityLog: ChallengeActivityLog;
  activityLog: ActivityLog;
  activity: DisciplineActivity;
}

export default function ChallengeApprovalsPage() {
  const router = useRouter();
  const params = useParams();
  const challengeId = params.id as string;

  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [pendingApprovals, setPendingApprovals] = useState<ApprovalItem[]>([]);
  const [approvedItems, setApprovedItems] = useState<ApprovalItem[]>([]);
  const [rejectedItems, setRejectedItems] = useState<ApprovalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    loadApprovals();
  }, [challengeId]);

  const loadApprovals = async () => {
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
        userId: challengeData.creator_id,
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

      setChallenge(challenge);

      // Load all challenge activity logs
      const { data: logsData, error: logsError } = await supabase
        .from('challenge_activity_logs')
        .select('*')
        .eq('challenge_id', challengeId)
        .order('created_at', { ascending: false });

      if (logsError) throw logsError;

      // Load related activity logs and activities
      const approvalItems: ApprovalItem[] = [];

      for (const logDB of logsData || []) {
        // Load activity log
        const { data: activityLogData } = await supabase
          .from('activity_logs')
          .select('*')
          .eq('id', logDB.activity_log_id)
          .single();

        if (!activityLogData) continue;

        // Load activity details
        const { data: activityData } = await supabase
          .from('discipline_activities')
          .select('*')
          .eq('id', activityLogData.activity_id)
          .single();

        if (!activityData) continue;

        approvalItems.push({
          challengeActivityLog: {
            id: logDB.id,
            challengeId: logDB.challenge_id,
            activityLogId: logDB.activity_log_id,
            approvalStatus: logDB.approval_status,
            approvedBy: logDB.approved_by ?? undefined,
            approvedAt: logDB.approved_at ? new Date(logDB.approved_at) : undefined,
            rejectionReason: logDB.rejection_reason ?? undefined,
            createdAt: new Date(logDB.created_at),
            updatedAt: new Date(logDB.updated_at),
          },
          activityLog: activityLogFromDB(activityLogData),
          activity: activityFromDB(activityData),
        });
      }

      // Group by approval status
      setPendingApprovals(approvalItems.filter(item => item.challengeActivityLog.approvalStatus === 'pending'));
      setApprovedItems(approvalItems.filter(item => item.challengeActivityLog.approvalStatus === 'approved'));
      setRejectedItems(approvalItems.filter(item => item.challengeActivityLog.approvalStatus === 'rejected'));
    } catch (error: any) {
      console.error('Failed to load approvals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (item: ApprovalItem) => {
    try {
      setProcessingId(item.challengeActivityLog.id);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('challenge_activity_logs')
        .update({
          approval_status: 'approved',
          approved_by: user.id,
          approved_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', item.challengeActivityLog.id);

      if (error) throw error;

      // Reload approvals to update UI
      await loadApprovals();
    } catch (error: any) {
      console.error('Failed to approve:', error);
      alert('Failed to approve activity log');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (item: ApprovalItem) => {
    try {
      setProcessingId(item.challengeActivityLog.id);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const reason = rejectionReason[item.challengeActivityLog.id]?.trim();
      if (!reason) {
        alert('Please provide a rejection reason');
        setProcessingId(null);
        return;
      }

      const { error } = await supabase
        .from('challenge_activity_logs')
        .update({
          approval_status: 'rejected',
          approved_by: user.id,
          approved_at: new Date().toISOString(),
          rejection_reason: reason,
          updated_at: new Date().toISOString(),
        })
        .eq('id', item.challengeActivityLog.id);

      if (error) throw error;

      // Clear rejection reason input
      setRejectionReason(prev => {
        const newReasons = { ...prev };
        delete newReasons[item.challengeActivityLog.id];
        return newReasons;
      });

      // Reload approvals to update UI
      await loadApprovals();
    } catch (error: any) {
      console.error('Failed to reject:', error);
      alert('Failed to reject activity log');
    } finally {
      setProcessingId(null);
    }
  };

  const formatLogValue = (activityLog: ActivityLog) => {
    const value = activityLog.value;

    if ('completed' in value) {
      return value.completed ? 'Completed' : 'Not completed';
    }

    if ('value' in value && 'unit' in value) {
      return `${value.value} ${value.unit}`;
    }

    if ('selected' in value) {
      return value.selected.join(', ');
    }

    if ('text' in value) {
      return value.text;
    }

    return 'No value';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'text-green-700 bg-green-50';
      case 'neutral': return 'text-blue-700 bg-blue-50';
      case 'bad': return 'text-red-700 bg-red-50';
      case 'skipped': return 'text-gray-700 bg-gray-50';
      default: return 'text-gray-700 bg-gray-50';
    }
  };

  if (loading || !challenge) {
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
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Approval Queue</h1>
            <p className="mt-1 text-gray-600">Review and approve activity logs for: {challenge.title}</p>
          </div>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Back to Challenge
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-orange-50 rounded-lg border border-orange-200 p-4 text-center">
            <p className="text-3xl font-bold text-orange-900">{pendingApprovals.length}</p>
            <p className="text-sm text-orange-700">Pending Review</p>
          </div>
          <div className="bg-green-50 rounded-lg border border-green-200 p-4 text-center">
            <p className="text-3xl font-bold text-green-900">{approvedItems.length}</p>
            <p className="text-sm text-green-700">Approved</p>
          </div>
          <div className="bg-red-50 rounded-lg border border-red-200 p-4 text-center">
            <p className="text-3xl font-bold text-red-900">{rejectedItems.length}</p>
            <p className="text-sm text-red-700">Rejected</p>
          </div>
        </div>
      </div>

      {/* Pending Approvals */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Pending Approvals</h2>

        {pendingApprovals.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">All caught up!</h3>
            <p className="text-gray-500">No pending approvals at the moment.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingApprovals.map((item) => (
              <div key={item.challengeActivityLog.id} className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">{item.activity.title}</h3>
                    {item.activity.description && (
                      <p className="text-sm text-gray-600 mt-1">{item.activity.description}</p>
                    )}
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(item.activityLog.status)}`}>
                    {item.activityLog.status.charAt(0).toUpperCase() + item.activityLog.status.slice(1)}
                  </span>
                </div>

                {/* Log Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Date Logged</p>
                    <p className="font-medium text-gray-900">
                      {new Date(item.activityLog.logDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Value</p>
                    <p className="font-medium text-gray-900">{formatLogValue(item.activityLog)}</p>
                  </div>
                  {item.activityLog.notes && (
                    <div className="md:col-span-2">
                      <p className="text-xs text-gray-500 mb-1">Notes</p>
                      <p className="text-sm text-gray-900">{item.activityLog.notes}</p>
                    </div>
                  )}
                </div>

                {/* Rejection Reason Input */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rejection Reason (required if rejecting)
                  </label>
                  <textarea
                    value={rejectionReason[item.challengeActivityLog.id] || ''}
                    onChange={(e) => setRejectionReason(prev => ({
                      ...prev,
                      [item.challengeActivityLog.id]: e.target.value
                    }))}
                    placeholder="Explain why this log is being rejected..."
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => handleApprove(item)}
                    disabled={processingId === item.challengeActivityLog.id}
                    className="flex-1 px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {processingId === item.challengeActivityLog.id ? 'Processing...' : 'Approve'}
                  </button>
                  <button
                    onClick={() => handleReject(item)}
                    disabled={processingId === item.challengeActivityLog.id}
                    className="flex-1 px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {processingId === item.challengeActivityLog.id ? 'Processing...' : 'Reject'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Approved Items */}
      {approvedItems.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Approved</h2>
          <div className="space-y-3">
            {approvedItems.map((item) => (
              <div key={item.challengeActivityLog.id} className="bg-green-50 rounded-lg border border-green-200 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{item.activity.title}</h3>
                    <p className="text-sm text-gray-600">
                      {new Date(item.activityLog.logDate).toLocaleDateString()} - {formatLogValue(item.activityLog)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-green-700">
                      Approved {item.challengeActivityLog.approvedAt ? new Date(item.challengeActivityLog.approvedAt).toLocaleDateString() : ''}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rejected Items */}
      {rejectedItems.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Rejected</h2>
          <div className="space-y-3">
            {rejectedItems.map((item) => (
              <div key={item.challengeActivityLog.id} className="bg-red-50 rounded-lg border border-red-200 p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{item.activity.title}</h3>
                    <p className="text-sm text-gray-600">
                      {new Date(item.activityLog.logDate).toLocaleDateString()} - {formatLogValue(item.activityLog)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-red-700">
                      Rejected {item.challengeActivityLog.approvedAt ? new Date(item.challengeActivityLog.approvedAt).toLocaleDateString() : ''}
                    </p>
                  </div>
                </div>
                {item.challengeActivityLog.rejectionReason && (
                  <div className="mt-2 p-2 bg-white rounded border border-red-300">
                    <p className="text-xs text-red-700 font-medium mb-1">Rejection Reason:</p>
                    <p className="text-sm text-gray-900">{item.challengeActivityLog.rejectionReason}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
