'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

// Deletes all user data in FK-safe order.
// challenges.creator_id (not user_id), and child tables must precede parents.
async function deleteAllUserData(userId: string): Promise<void> {
  // Fetch IDs needed to clean up junction tables that lack a direct user_id column.
  const [{ data: challengeRows }, { data: activityLogRows }, { data: activityRows }] =
    await Promise.all([
      supabase.from('challenges').select('id').eq('creator_id', userId),
      supabase.from('activity_logs').select('id').eq('user_id', userId),
      supabase.from('discipline_activities').select('id').eq('user_id', userId),
    ]);

  const challengeIds = challengeRows?.map((r) => r.id) ?? [];
  const activityLogIds = activityLogRows?.map((r) => r.id) ?? [];
  const activityIds = activityRows?.map((r) => r.id) ?? [];

  // 1. challenge_activity_logs — references both challenges and activity_logs.
  //    Delete where user created the challenge OR submitted the log.
  if (challengeIds.length > 0) {
    await supabase.from('challenge_activity_logs').delete().in('challenge_id', challengeIds);
  }
  if (activityLogIds.length > 0) {
    await supabase.from('challenge_activity_logs').delete().in('activity_log_id', activityLogIds);
  }

  // 2. challenge_activities — references challenges and discipline_activities.
  if (challengeIds.length > 0) {
    await supabase.from('challenge_activities').delete().in('challenge_id', challengeIds);
  }
  // Also cover activities used in other users' challenges.
  if (activityIds.length > 0) {
    await supabase.from('challenge_activities').delete().in('activity_id', activityIds);
  }

  // 3. challenge_participants — user's participation in any challenge.
  await supabase.from('challenge_participants').delete().eq('user_id', userId);

  // 4. challenges — uses creator_id, not user_id.
  await supabase.from('challenges').delete().eq('creator_id', userId);

  // 5. activity_logs — now safe (challenge_activity_logs removed above).
  await supabase.from('activity_logs').delete().eq('user_id', userId);

  // 6. discipline_activities — now safe (challenge_activities removed above).
  //    References goals, so must precede goals.
  await supabase.from('discipline_activities').delete().eq('user_id', userId);

  // 7. Everything else — no remaining FK dependencies between these.
  await Promise.all([
    supabase.from('manifestation_entries').delete().eq('user_id', userId),
    supabase.from('manifestation_read_history').delete().eq('user_id', userId),
    supabase.from('mood_entries').delete().eq('user_id', userId),
    supabase.from('goals').delete().eq('user_id', userId),
    supabase.from('categories').delete().eq('user_id', userId),
  ]);
}

export function DangerZoneActions() {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  const handleDeleteAllData = async () => {
    const confirmed = window.confirm(
      '⚠️ WARNING: This will permanently delete ALL your data including:\n\n' +
      '• All categories, goals, and activities\n' +
      '• All activity logs and tracking data\n' +
      '• All challenges and participation history\n\n' +
      'Your account will remain active, but all data will be gone.\n\n' +
      'Type "DELETE" to confirm:'
    );

    if (!confirmed) return;

    const confirmText = prompt('Please type "DELETE" to confirm:');
    if (confirmText !== 'DELETE') {
      alert('Deletion cancelled. You must type "DELETE" exactly.');
      return;
    }

    try {
      setDeleting(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('You must be logged in');
        return;
      }

      await deleteAllUserData(user.id);

      alert('All your data has been deleted successfully.');
      router.refresh();
    } catch (error: any) {
      console.error('Delete data failed:', error);
      alert('Failed to delete data: ' + error.message);
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      '🚨 CRITICAL WARNING: This will permanently delete your ENTIRE ACCOUNT!\n\n' +
      '• Your account will be completely removed\n' +
      '• All your data will be permanently deleted\n' +
      '• You will be logged out immediately\n' +
      '• This action CANNOT be undone\n\n' +
      'Are you absolutely sure?'
    );

    if (!confirmed) return;

    const confirmText = prompt('Please type "DELETE MY ACCOUNT" to confirm:');
    if (confirmText !== 'DELETE MY ACCOUNT') {
      alert('Account deletion cancelled. You must type "DELETE MY ACCOUNT" exactly.');
      return;
    }

    try {
      setDeletingAccount(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('You must be logged in');
        return;
      }

      await deleteAllUserData(user.id);
      await supabase.from('profiles').delete().eq('id', user.id);

      // Delete the auth user (this requires RPC function or admin API)
      // For now, we'll sign out and show a message
      await supabase.auth.signOut();

      alert(
        'Your data has been deleted and you have been logged out.\n\n' +
        'To complete account deletion, please contact support with your email address.\n' +
        'We will remove your authentication account within 24 hours.'
      );

      router.push('/login');
    } catch (error: any) {
      console.error('Delete account failed:', error);
      alert('Failed to delete account: ' + error.message);
    } finally {
      setDeletingAccount(false);
    }
  };

  return (
    <>
      <button
        onClick={handleDeleteAllData}
        disabled={deleting}
        className="w-full text-left px-4 py-3 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <p className="text-sm font-medium text-red-900">
          {deleting ? 'Deleting...' : 'Delete All Data'}
        </p>
        <p className="text-xs text-red-600">
          Permanently delete all your categories, goals, activities, and challenges
        </p>
      </button>

      <button
        onClick={handleDeleteAccount}
        disabled={deletingAccount}
        className="w-full text-left px-4 py-3 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <p className="text-sm font-medium text-red-900">
          {deletingAccount ? 'Deleting Account...' : 'Delete Account'}
        </p>
        <p className="text-xs text-red-600">
          Permanently delete your account and all associated data
        </p>
      </button>
    </>
  );
}
