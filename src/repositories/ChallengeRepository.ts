/**
 * ChallengeRepository
 *
 * Repository pattern for Challenge CRUD operations
 * Handles challenges, participants, activities, and approval workflow
 */

import { supabase } from '../services/supabase/SupabaseClient';
import type {
  Challenge,
  ChallengeDB,
  ChallengeParticipant,
  ChallengeParticipantDB,
  ChallengeActivity,
  ChallengeActivityDB,
  ChallengeActivityLog,
  ChallengeActivityLogDB,
  ChallengeStatus,
  ChallengeUrgencyLevel,
  ChallengeStats,
  DisciplineActivity
} from '@manifestation/shared';
import {
  challengeToDB,
  challengeFromDB,
  challengeParticipantToDB,
  challengeParticipantFromDB,
  challengeActivityToDB,
  challengeActivityFromDB,
  challengeActivityLogToDB,
  challengeActivityLogFromDB
} from '@manifestation/shared';

export interface ChallengeWithStats extends Challenge {
  participantCount: number;
  activityCount: number;
  pendingApprovalCount: number;
  completionRate: number;
}

export interface ChallengeCreateData {
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  prizeAmount: number;
  prizeCurrency: string;
  isPublic: boolean;
  urgencyLevel?: ChallengeUrgencyLevel;
  failureConsequence?: string;
  selectedActivityIds: string[];
  participantEmails: string[];
  accountabilityPartnerEmail?: string;
}

export interface ApprovalItem {
  log: ChallengeActivityLog;
  activityLog: {
    id: string;
    activityId: string;
    logDate: string;
    value: any;
    status: string;
    notes?: string;
  };
  activity: DisciplineActivity;
  user: {
    id: string;
    email?: string;
  };
}

export class ChallengeRepository {
  private tableName = 'challenges';
  private participantsTable = 'challenge_participants';
  private activitiesTable = 'challenge_activities';
  private logsTable = 'challenge_activity_logs';

  /**
   * Get all challenges for the current user (creator or participant)
   */
  async getAll(): Promise<ChallengeWithStats[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Get challenges where user is a participant
    const { data: participantData, error: participantError } = await supabase
      .from(this.participantsTable)
      .select('challenge_id')
      .eq('user_id', user.id)
      .eq('status', 'accepted');

    if (participantError) throw participantError;

    const challengeIds = participantData.map(p => p.challenge_id);

    if (challengeIds.length === 0) {
      return [];
    }

    // Get challenges
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .in('id', challengeIds)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Get stats for each challenge
    const challengesWithStats = await Promise.all(
      data.map(async (challengeDB) => {
        const challenge = challengeFromDB(challengeDB);
        const stats = await this.getBasicStats(challenge.id);

        return {
          ...challenge,
          ...stats
        };
      })
    );

    return challengesWithStats;
  }

  /**
   * Get basic stats for challenge list view
   */
  private async getBasicStats(challengeId: string): Promise<{
    participantCount: number;
    activityCount: number;
    pendingApprovalCount: number;
    completionRate: number;
  }> {
    // Count participants
    const { count: participantCount } = await supabase
      .from(this.participantsTable)
      .select('*', { count: 'exact', head: true })
      .eq('challenge_id', challengeId)
      .eq('status', 'accepted');

    // Count activities
    const { count: activityCount } = await supabase
      .from(this.activitiesTable)
      .select('*', { count: 'exact', head: true })
      .eq('challenge_id', challengeId);

    // Count pending approvals
    const { count: pendingApprovalCount } = await supabase
      .from(this.logsTable)
      .select('*', { count: 'exact', head: true })
      .eq('challenge_id', challengeId)
      .eq('approval_status', 'pending');

    // Calculate completion rate (simplified for list view)
    const { count: approvedCount } = await supabase
      .from(this.logsTable)
      .select('*', { count: 'exact', head: true })
      .eq('challenge_id', challengeId)
      .eq('approval_status', 'approved');

    const { count: totalLogs } = await supabase
      .from(this.logsTable)
      .select('*', { count: 'exact', head: true })
      .eq('challenge_id', challengeId);

    const completionRate = totalLogs && totalLogs > 0
      ? Math.round(((approvedCount || 0) / totalLogs) * 100)
      : 0;

    return {
      participantCount: participantCount || 0,
      activityCount: activityCount || 0,
      pendingApprovalCount: pendingApprovalCount || 0,
      completionRate
    };
  }

  /**
   * Get a single challenge by ID with full details
   */
  async getById(id: string): Promise<Challenge | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }

    return challengeFromDB(data);
  }

  /**
   * Create a new challenge
   */
  async create(createData: ChallengeCreateData): Promise<Challenge> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Create challenge
    const challengeData: Omit<Challenge, 'id' | 'createdAt' | 'updatedAt'> = {
      userId: user.id,
      title: createData.title,
      description: createData.description,
      startDate: createData.startDate,
      endDate: createData.endDate,
      status: 'draft',
      prizeAmount: createData.prizeAmount,
      prizeCurrency: createData.prizeCurrency,
      isPublic: createData.isPublic,
      urgencyLevel: createData.urgencyLevel || 'medium',
      failureConsequence: createData.failureConsequence as any
    };

    const challengeDB = challengeToDB(challengeData as Challenge);

    const { data: newChallenge, error: challengeError } = await supabase
      .from(this.tableName)
      .insert(challengeDB)
      .select()
      .single();

    if (challengeError) throw challengeError;

    const challenge = challengeFromDB(newChallenge);

    // Add creator as participant
    await supabase.from(this.participantsTable).insert({
      challenge_id: challenge.id,
      user_id: user.id,
      role: 'creator',
      status: 'accepted',
      joined_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    // Add selected activities
    if (createData.selectedActivityIds && createData.selectedActivityIds.length > 0) {
      const activityInserts = createData.selectedActivityIds.map(activityId => ({
        challenge_id: challenge.id,
        activity_id: activityId,
        is_required: true,
        created_at: new Date().toISOString()
      }));

      await supabase.from(this.activitiesTable).insert(activityInserts);
    }

    // Add participants (emails stored for future invitation system)
    // For now, we'll just store them in the challenge

    // Add accountability partner
    // For now, we'll store email for future invitation system

    return challenge;
  }

  /**
   * Update a challenge
   */
  async update(id: string, updates: Partial<Challenge>): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Check if user can edit
    const canEditResult = await this.canEdit(id);
    if (!canEditResult.canEdit) {
      throw new Error(canEditResult.message);
    }

    const updateData = challengeToDB(updates as Challenge);
    delete (updateData as any).id;
    delete (updateData as any).user_id;
    delete (updateData as any).created_at;
    updateData.updated_at = new Date().toISOString();

    const { error } = await supabase
      .from(this.tableName)
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;
  }

  /**
   * Delete a draft challenge
   */
  async delete(id: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const challenge = await this.getById(id);
    if (!challenge) throw new Error('Challenge not found');

    if (challenge.status !== 'draft') {
      throw new Error('Only draft challenges can be deleted');
    }

    if (challenge.userId !== user.id) {
      throw new Error('Only the creator can delete this challenge');
    }

    // Delete related records first
    await supabase.from(this.activitiesTable).delete().eq('challenge_id', id);
    await supabase.from(this.participantsTable).delete().eq('challenge_id', id);
    await supabase.from(this.logsTable).delete().eq('challenge_id', id);

    // Delete challenge
    const { error } = await supabase
      .from(this.tableName)
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;
  }

  /**
   * Activate a draft challenge
   */
  async activate(id: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const challenge = await this.getById(id);
    if (!challenge) throw new Error('Challenge not found');

    if (challenge.status !== 'draft') {
      throw new Error('Only draft challenges can be activated');
    }

    if (challenge.userId !== user.id) {
      throw new Error('Only the creator can activate this challenge');
    }

    // Validate challenge can be activated
    const canActivate = await this.canActivate(id);
    if (!canActivate.canActivate) {
      throw new Error(canActivate.message);
    }

    // Update status
    const { error } = await supabase
      .from(this.tableName)
      .update({
        status: 'active',
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) throw error;
  }

  /**
   * Cancel an active challenge
   */
  async cancel(id: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const challenge = await this.getById(id);
    if (!challenge) throw new Error('Challenge not found');

    if (challenge.userId !== user.id) {
      throw new Error('Only the creator can cancel this challenge');
    }

    if (challenge.status !== 'active') {
      throw new Error('Only active challenges can be cancelled');
    }

    const { error } = await supabase
      .from(this.tableName)
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) throw error;
  }

  /**
   * Get participants for a challenge
   */
  async getParticipants(challengeId: string): Promise<ChallengeParticipant[]> {
    const { data, error } = await supabase
      .from(this.participantsTable)
      .select('*')
      .eq('challenge_id', challengeId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data.map(challengeParticipantFromDB);
  }

  /**
   * Get activities in a challenge
   */
  async getChallengeActivities(challengeId: string): Promise<DisciplineActivity[]> {
    const { data, error } = await supabase
      .from(this.activitiesTable)
      .select(`
        activity_id,
        discipline_activities (*)
      `)
      .eq('challenge_id', challengeId);

    if (error) throw error;

    // Extract and map activities
    return data
      .filter(item => item.discipline_activities)
      .map(item => {
        const activityData = Array.isArray(item.discipline_activities)
          ? item.discipline_activities[0]
          : item.discipline_activities;

        // Convert from DB format (snake_case) to app format (camelCase)
        return {
          id: activityData.id,
          userId: activityData.user_id,
          goalId: activityData.goal_id,
          title: activityData.title,
          description: activityData.description,
          trackingType: activityData.tracking_type,
          targetConfig: activityData.target_config,
          frequencyType: activityData.frequency_type,
          frequencyConfig: activityData.frequency_config,
          streakConfig: activityData.streak_config,
          reminderConfig: activityData.reminder_config,
          isActive: activityData.is_active,
          orderIndex: activityData.order_index,
          currentStreak: activityData.current_streak || 0,
          longestStreak: activityData.longest_streak || 0,
          streakFreezeAvailable: activityData.streak_freeze_available || false,
          lastFreezeUsedAt: activityData.last_freeze_used_at
            ? new Date(activityData.last_freeze_used_at)
            : undefined,
          createdAt: new Date(activityData.created_at),
          updatedAt: new Date(activityData.updated_at)
        } as DisciplineActivity;
      });
  }

  /**
   * Get comprehensive stats for a challenge
   */
  async getStats(challengeId: string): Promise<ChallengeStats> {
    const challenge = await this.getById(challengeId);
    if (!challenge) throw new Error('Challenge not found');

    const now = new Date();
    const start = new Date(challenge.startDate);
    const end = new Date(challenge.endDate);

    // Calculate days
    const daysTotal = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const daysRemaining = Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

    // Count activities
    const { count: totalActivities } = await supabase
      .from(this.activitiesTable)
      .select('*', { count: 'exact', head: true })
      .eq('challenge_id', challengeId);

    // Count logs by status
    const { count: pendingApprovals } = await supabase
      .from(this.logsTable)
      .select('*', { count: 'exact', head: true })
      .eq('challenge_id', challengeId)
      .eq('approval_status', 'pending');

    const { count: approvedActivities } = await supabase
      .from(this.logsTable)
      .select('*', { count: 'exact', head: true })
      .eq('challenge_id', challengeId)
      .eq('approval_status', 'approved');

    const { count: rejectedActivities } = await supabase
      .from(this.logsTable)
      .select('*', { count: 'exact', head: true })
      .eq('challenge_id', challengeId)
      .eq('approval_status', 'rejected');

    const completedActivities = approvedActivities || 0;
    const completionRate = totalActivities && totalActivities > 0
      ? Math.round((completedActivities / (totalActivities * daysTotal)) * 100)
      : 0;

    return {
      totalActivities: totalActivities || 0,
      completedActivities,
      pendingApprovals: pendingApprovals || 0,
      approvedActivities: approvedActivities || 0,
      rejectedActivities: rejectedActivities || 0,
      completionRate: Math.min(100, completionRate),
      daysRemaining,
      daysTotal
    };
  }

  /**
   * Get pending approvals for a challenge
   */
  async getPendingApprovals(challengeId: string): Promise<ApprovalItem[]> {
    const { data, error } = await supabase
      .from(this.logsTable)
      .select(`
        *,
        activity_logs (*),
        discipline_activities (*)
      `)
      .eq('challenge_id', challengeId)
      .eq('approval_status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Map to ApprovalItem format
    return data.map(item => {
      const activityLog = Array.isArray(item.activity_logs) ? item.activity_logs[0] : item.activity_logs;
      const activity = Array.isArray(item.discipline_activities) ? item.discipline_activities[0] : item.discipline_activities;

      return {
        log: challengeActivityLogFromDB(item),
        activityLog: {
          id: activityLog.id,
          activityId: activityLog.activity_id,
          logDate: activityLog.log_date,
          value: activityLog.value,
          status: activityLog.status,
          notes: activityLog.notes
        },
        activity: {
          id: activity.id,
          userId: activity.user_id,
          goalId: activity.goal_id,
          title: activity.title,
          description: activity.description,
          trackingType: activity.tracking_type,
          targetConfig: activity.target_config,
          frequencyType: activity.frequency_type,
          frequencyConfig: activity.frequency_config,
          streakConfig: activity.streak_config,
          reminderConfig: activity.reminder_config,
          isActive: activity.is_active,
          orderIndex: activity.order_index,
          currentStreak: activity.current_streak || 0,
          longestStreak: activity.longest_streak || 0,
          streakFreezeAvailable: activity.streak_freeze_available || false,
          lastFreezeUsedAt: activity.last_freeze_used_at ? new Date(activity.last_freeze_used_at) : undefined,
          createdAt: new Date(activity.created_at),
          updatedAt: new Date(activity.updated_at)
        } as DisciplineActivity,
        user: {
          id: activityLog.user_id,
          email: undefined // TODO: fetch from profiles table if needed
        }
      };
    });
  }

  /**
   * Approve an activity log
   */
  async approveLog(logId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from(this.logsTable)
      .update({
        approval_status: 'approved',
        approved_by: user.id,
        approved_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', logId);

    if (error) throw error;
  }

  /**
   * Reject an activity log with reason
   */
  async rejectLog(logId: string, reason: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from(this.logsTable)
      .update({
        approval_status: 'rejected',
        approved_by: user.id,
        rejection_reason: reason,
        updated_at: new Date().toISOString()
      })
      .eq('id', logId);

    if (error) throw error;
  }

  /**
   * Check if challenge can be edited based on urgency and status
   */
  async canEdit(challengeId: string): Promise<{ canEdit: boolean; message: string }> {
    const challenge = await this.getById(challengeId);
    if (!challenge) {
      return { canEdit: false, message: 'Challenge not found' };
    }

    if (challenge.status === 'completed' || challenge.status === 'cancelled') {
      return { canEdit: false, message: 'Cannot edit completed or cancelled challenges' };
    }

    const now = new Date();
    const startDate = new Date(challenge.startDate);
    const oneDayBeforeStart = new Date(startDate);
    oneDayBeforeStart.setDate(oneDayBeforeStart.getDate() - 1);

    if (challenge.urgencyLevel === 'critical') {
      return { canEdit: false, message: 'Critical challenges cannot be edited after creation' };
    }

    if (challenge.urgencyLevel === 'high' && now >= startDate) {
      return { canEdit: false, message: 'Cannot edit after start date (high urgency)' };
    }

    if (challenge.urgencyLevel === 'medium' && now >= oneDayBeforeStart) {
      return { canEdit: false, message: 'Cannot edit within 1 day of start (medium urgency)' };
    }

    return { canEdit: true, message: '' };
  }

  /**
   * Check if challenge can be activated
   */
  async canActivate(challengeId: string): Promise<{ canActivate: boolean; message: string }> {
    const challenge = await this.getById(challengeId);
    if (!challenge) {
      return { canActivate: false, message: 'Challenge not found' };
    }

    // Check if has activities
    const { count: activityCount } = await supabase
      .from(this.activitiesTable)
      .select('*', { count: 'exact', head: true })
      .eq('challenge_id', challengeId);

    if (!activityCount || activityCount === 0) {
      return { canActivate: false, message: 'Challenge must have at least one activity' };
    }

    // Check if end date is in future
    const now = new Date();
    const endDate = new Date(challenge.endDate);
    if (endDate < now) {
      return { canActivate: false, message: 'End date must be in the future' };
    }

    return { canActivate: true, message: '' };
  }
}

export const challengeRepository = new ChallengeRepository();
