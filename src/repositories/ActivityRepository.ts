/**
 * ActivityRepository
 *
 * Repository pattern for Discipline Activity CRUD operations
 * Implements offline-first architecture with cloud sync
 * Supports 4 tracking types: boolean, number, multiselect, text
 */

import { supabase } from '../services/supabase/SupabaseClient';
import type { DisciplineActivity, DisciplineActivityDB, ActivityLog, ActivityLogDB } from '@manifestation/shared';
import { activityToDB, activityFromDB, activityLogToDB, activityLogFromDB } from '@manifestation/shared';
import { isDueOn } from '../utils/dailyTrackerUtils';

export class ActivityRepository {
  private tableName = 'discipline_activities';
  private logsTableName = 'activity_logs';

  /**
   * Get all activities for the current user
   */
  async getAll(): Promise<DisciplineActivity[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('order_index', { ascending: true });

    if (error) throw error;
    return data.map(activityFromDB);
  }

  /**
   * Get activities by goal
   */
  async getByGoal(goalId: string): Promise<DisciplineActivity[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('user_id', user.id)
      .eq('goal_id', goalId)
      .eq('is_active', true)
      .order('order_index', { ascending: true });

    if (error) throw error;
    return data.map(activityFromDB);
  }

  /**
   * Get active activities only
   */
  async getActive(): Promise<DisciplineActivity[]> {
    return this.getAll(); // Already filters by is_active
  }

  /**
   * Get a single activity by ID
   */
  async getById(id: string): Promise<DisciplineActivity | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }

    return activityFromDB(data);
  }

  /**
   * Create a new activity
   */
  async create(activity: Omit<DisciplineActivity, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'currentStreak' | 'longestStreak' | 'streakFreezeAvailable' | 'lastFreezeUsedAt'>): Promise<DisciplineActivity> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Get current max order_index for this goal
    const { data: maxData } = await supabase
      .from(this.tableName)
      .select('order_index')
      .eq('user_id', user.id)
      .eq('goal_id', activity.goalId)
      .order('order_index', { ascending: false })
      .limit(1)
      .single();

    const nextOrderIndex = maxData ? maxData.order_index + 1 : 0;

    const activityData = activityToDB({
      ...activity,
      userId: user.id,
      orderIndex: nextOrderIndex,
      isActive: true,
      currentStreak: 0,
      longestStreak: 0,
      streakFreezeAvailable: true,
    } as DisciplineActivity);

    const { data, error } = await supabase
      .from(this.tableName)
      .insert(activityData)
      .select()
      .single();

    if (error) throw error;
    return activityFromDB(data);
  }

  /**
   * Update an existing activity
   */
  async update(id: string, updates: Partial<DisciplineActivity>): Promise<DisciplineActivity> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const updateData = activityToDB(updates);

    const { data, error } = await supabase
      .from(this.tableName)
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;
    return activityFromDB(data);
  }

  /**
   * Deactivate an activity (soft delete)
   */
  async deactivate(id: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from(this.tableName)
      .update({ is_active: false })
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;
  }

  /**
   * Reactivate an activity
   */
  async reactivate(id: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from(this.tableName)
      .update({ is_active: true })
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;
  }

  /**
   * Delete an activity permanently
   * Note: This will cascade delete all logs for this activity
   */
  async delete(id: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from(this.tableName)
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;
  }

  /**
   * Reorder activities within a goal
   */
  async reorder(activityIds: string[]): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Update each activity's order_index
    for (let i = 0; i < activityIds.length; i++) {
      const { error } = await supabase
        .from(this.tableName)
        .update({ order_index: i })
        .eq('id', activityIds[i])
        .eq('user_id', user.id);

      if (error) throw error;
    }
  }

  // ============================================
  // ACTIVITY LOG OPERATIONS
  // ============================================

  /**
   * Get logs for an activity
   */
  async getLogs(activityId: string, limit?: number): Promise<ActivityLog[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    let query = supabase
      .from(this.logsTableName)
      .select('*')
      .eq('user_id', user.id)
      .eq('activity_id', activityId)
      .order('log_date', { ascending: false });

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data.map(activityLogFromDB);
  }

  /**
   * Get log for a specific date
   */
  async getLogByDate(activityId: string, date: Date): Promise<ActivityLog | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const dateStr = date.toISOString().split('T')[0];

    const { data, error } = await supabase
      .from(this.logsTableName)
      .select('*')
      .eq('user_id', user.id)
      .eq('activity_id', activityId)
      .eq('log_date', dateStr)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }

    return activityLogFromDB(data);
  }

  /**
   * Get all logs for a specific date (across all activities)
   */
  async getLogsByDate(date: Date): Promise<ActivityLog[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const dateStr = date.toISOString().split('T')[0];

    const { data, error } = await supabase
      .from(this.logsTableName)
      .select('*')
      .eq('user_id', user.id)
      .eq('log_date', dateStr);

    if (error) throw error;
    return data.map(activityLogFromDB);
  }

  /**
   * Create or update a log entry
   */
  async logActivity(log: Omit<ActivityLog, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'loggedAt'>): Promise<ActivityLog> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const dateStr = log.logDate.toISOString().split('T')[0];

    // Check if log exists for this date
    const existing = await this.getLogByDate(log.activityId, log.logDate);

    if (existing) {
      // Update existing log
      const updateData = activityLogToDB({
        ...log,
        userId: user.id,
        loggedAt: new Date(),
      } as ActivityLog);

      const { data, error } = await supabase
        .from(this.logsTableName)
        .update(updateData)
        .eq('id', existing.id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return activityLogFromDB(data);
    } else {
      // Create new log
      const logData = activityLogToDB({
        ...log,
        userId: user.id,
        loggedAt: new Date(),
      } as ActivityLog);

      const { data, error } = await supabase
        .from(this.logsTableName)
        .insert(logData)
        .select()
        .single();

      if (error) throw error;
      return activityLogFromDB(data);
    }
  }

  /**
   * Delete a log entry
   */
  async deleteLog(logId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from(this.logsTableName)
      .delete()
      .eq('id', logId)
      .eq('user_id', user.id);

    if (error) throw error;
  }

  /**
   * Get activity streak
   */
  async getStreak(activityId: string): Promise<number> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Call the database function
    const { data, error } = await supabase.rpc('get_activity_streak', {
      activity_uuid: activityId,
      user_uuid: user.id,
    });

    if (error) throw error;
    return data as number;
  }

  /**
   * Get weekly statistics for an activity
   */
  async getWeeklyStats(activityId: string, weekOffset: number = 0): Promise<any> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Call the database function
    const { data, error } = await supabase.rpc('get_weekly_stats', {
      user_uuid: user.id,
      week_offset: weekOffset,
    });

    if (error) throw error;
    return data;
  }

  /**
   * Check if activity should be logged today based on frequency
   */
  isDueToday(activity: DisciplineActivity, date: Date = new Date()): boolean {
    const dayOfWeek = date.getDay();

    switch (activity.frequencyType) {
      case 'daily':
        return true;

      case 'specific_days':
        const config = activity.frequencyConfig as { days: number[] };
        return config.days?.includes(dayOfWeek) || false;

      case 'custom':
        const customConfig = activity.frequencyConfig as { dates: string[] };
        const dateStr = date.toISOString().split('T')[0];
        return customConfig.dates?.includes(dateStr) || false;

      default:
        return false;
    }
  }

  /**
   * Get all activities due on a specific date
   * Filters active activities based on frequency configuration
   *
   * @param date - The date to check (defaults to today)
   * @returns Activities that should be tracked on the given date
   */
  async getActivitiesDueOn(date: Date = new Date()): Promise<DisciplineActivity[]> {
    const allActivities = await this.getAll();
    return allActivities.filter(activity => isDueOn(activity, date));
  }
}

// Export singleton instance
export const activityRepository = new ActivityRepository();
