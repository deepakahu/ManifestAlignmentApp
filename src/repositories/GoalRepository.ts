/**
 * GoalRepository
 *
 * Repository pattern for Goal CRUD operations
 * Implements offline-first architecture with cloud sync
 * Supports SMART framework and manual/auto progress tracking
 */

import { supabase } from '../services/supabase/SupabaseClient';
import type { Goal, GoalDB } from '@manifestation/shared';
import { goalToDB, goalFromDB } from '@manifestation/shared';

export class GoalRepository {
  private tableName = 'goals';

  /**
   * Get all goals for the current user
   */
  async getAll(): Promise<Goal[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('user_id', user.id)
      .order('status', { ascending: true }) // Active first
      .order('order_index', { ascending: true });

    if (error) throw error;
    return data.map(goalFromDB);
  }

  /**
   * Get goals by category
   */
  async getByCategory(categoryId: string): Promise<Goal[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('user_id', user.id)
      .eq('category_id', categoryId)
      .order('status', { ascending: true })
      .order('order_index', { ascending: true });

    if (error) throw error;
    return data.map(goalFromDB);
  }

  /**
   * Get active goals only
   */
  async getActive(): Promise<Goal[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('order_index', { ascending: true });

    if (error) throw error;
    return data.map(goalFromDB);
  }

  /**
   * Get a single goal by ID
   */
  async getById(id: string): Promise<Goal | null> {
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

    return goalFromDB(data);
  }

  /**
   * Create a new goal
   */
  async create(goal: Omit<Goal, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'completedAt'>): Promise<Goal> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Get current max order_index for this category
    let nextOrderIndex = 0;
    if (goal.categoryId) {
      const { data: maxData } = await supabase
        .from(this.tableName)
        .select('order_index')
        .eq('user_id', user.id)
        .eq('category_id', goal.categoryId)
        .order('order_index', { ascending: false })
        .limit(1)
        .single();

      nextOrderIndex = maxData ? maxData.order_index + 1 : 0;
    }

    const goalData = goalToDB({
      ...goal,
      userId: user.id,
      orderIndex: nextOrderIndex,
      status: 'active',
      progressPercentage: 0,
    } as Goal);

    const { data, error } = await supabase
      .from(this.tableName)
      .insert(goalData)
      .select()
      .single();

    if (error) throw error;
    return goalFromDB(data);
  }

  /**
   * Update an existing goal
   */
  async update(id: string, updates: Partial<Goal>): Promise<Goal> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const updateData = goalToDB(updates);

    const { data, error } = await supabase
      .from(this.tableName)
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;
    return goalFromDB(data);
  }

  /**
   * Update goal progress (manual override)
   */
  async updateProgress(id: string, progress: number, useManual: boolean = true): Promise<Goal> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from(this.tableName)
      .update({
        manual_progress_override: progress,
        use_manual_progress: useManual,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;
    return goalFromDB(data);
  }

  /**
   * Mark goal as completed
   */
  async complete(id: string): Promise<Goal> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from(this.tableName)
      .update({
        status: 'completed',
        progress_percentage: 100,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;
    return goalFromDB(data);
  }

  /**
   * Archive a goal
   */
  async archive(id: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from(this.tableName)
      .update({ status: 'archived' })
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;
  }

  /**
   * Restore an archived goal
   */
  async restore(id: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from(this.tableName)
      .update({ status: 'active' })
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;
  }

  /**
   * Delete a goal permanently
   * Note: This will cascade delete all activities linked to this goal
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
   * Reorder goals within a category
   */
  async reorder(goalIds: string[]): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Update each goal's order_index
    const updates = goalIds.map((id, index) => ({
      id,
      order_index: index,
    }));

    for (const update of updates) {
      const { error } = await supabase
        .from(this.tableName)
        .update({ order_index: update.order_index })
        .eq('id', update.id)
        .eq('user_id', user.id);

      if (error) throw error;
    }
  }

  /**
   * Calculate goal progress from activities
   * Only applies if useManualProgress is false
   */
  async calculateProgress(goalId: string): Promise<number> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Call the database function
    const { data, error } = await supabase.rpc('calculate_goal_progress', {
      goal_uuid: goalId,
    });

    if (error) throw error;
    return data as number;
  }

  /**
   * Get goal statistics
   */
  async getStats(): Promise<{
    total: number;
    active: number;
    completed: number;
    averageProgress: number;
  }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from(this.tableName)
      .select('status, progress_percentage')
      .eq('user_id', user.id);

    if (error) throw error;

    const stats = {
      total: data.length,
      active: data.filter(g => g.status === 'active').length,
      completed: data.filter(g => g.status === 'completed').length,
      averageProgress: data.length > 0
        ? Math.round(data.reduce((sum, g) => sum + g.progress_percentage, 0) / data.length)
        : 0,
    };

    return stats;
  }
}

// Export singleton instance
export const goalRepository = new GoalRepository();
