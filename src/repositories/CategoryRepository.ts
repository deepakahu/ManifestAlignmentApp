/**
 * CategoryRepository
 *
 * Repository pattern for Category CRUD operations
 * Implements offline-first architecture with cloud sync
 */

import { supabase } from '../services/supabase/SupabaseClient';
import type { Category, CategoryDB } from '@manifestation/shared';
import { categoryToDB, categoryFromDB } from '@manifestation/shared';

export class CategoryRepository {
  private tableName = 'categories';

  /**
   * Get all categories for the current user
   * Sorted by order_index, non-archived first
   */
  async getAll(): Promise<Category[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('user_id', user.id)
      .order('is_archived', { ascending: true })
      .order('order_index', { ascending: true });

    if (error) throw error;
    return data.map(categoryFromDB);
  }

  /**
   * Get active (non-archived) categories only
   */
  async getActive(): Promise<Category[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('user_id', user.id)
      .eq('is_archived', false)
      .order('order_index', { ascending: true });

    if (error) throw error;
    return data.map(categoryFromDB);
  }

  /**
   * Get a single category by ID
   */
  async getById(id: string): Promise<Category | null> {
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

    return categoryFromDB(data);
  }

  /**
   * Create a new category
   * Will fail if user has reached their tier limit (enforced by DB trigger)
   */
  async create(category: Omit<Category, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<Category> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Get current max order_index
    const { data: maxData } = await supabase
      .from(this.tableName)
      .select('order_index')
      .eq('user_id', user.id)
      .order('order_index', { ascending: false })
      .limit(1)
      .single();

    const nextOrderIndex = maxData ? maxData.order_index + 1 : 0;

    const categoryData = categoryToDB({
      ...category,
      userId: user.id,
      orderIndex: nextOrderIndex,
      isArchived: false,
    } as Category);

    const { data, error } = await supabase
      .from(this.tableName)
      .insert(categoryData)
      .select()
      .single();

    if (error) {
      // Check if it's the tier limit error
      if (error.message?.includes('Category limit reached')) {
        throw new Error('TIER_LIMIT_REACHED');
      }
      throw error;
    }

    return categoryFromDB(data);
  }

  /**
   * Update an existing category
   */
  async update(id: string, updates: Partial<Category>): Promise<Category> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const updateData = categoryToDB(updates);

    const { data, error } = await supabase
      .from(this.tableName)
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;
    return categoryFromDB(data);
  }

  /**
   * Archive a category (soft delete)
   */
  async archive(id: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from(this.tableName)
      .update({ is_archived: true })
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;
  }

  /**
   * Restore an archived category
   * Will fail if user has reached their tier limit
   */
  async restore(id: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from(this.tableName)
      .update({ is_archived: false })
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      if (error.message?.includes('Category limit reached')) {
        throw new Error('TIER_LIMIT_REACHED');
      }
      throw error;
    }
  }

  /**
   * Delete a category permanently
   * Note: This will cascade delete all goals and activities in this category
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
   * Reorder categories
   * Updates order_index for multiple categories
   */
  async reorder(categoryIds: string[]): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Update each category's order_index
    const updates = categoryIds.map((id, index) => ({
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
   * Check if user can create more categories based on their subscription tier
   */
  async canCreateMore(): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Call the database function to check tier limits
    const { data, error } = await supabase.rpc('can_create_category', {
      user_uuid: user.id,
    });

    if (error) throw error;
    return data as boolean;
  }

  /**
   * Get count of active categories
   */
  async getActiveCount(): Promise<number> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { count, error } = await supabase
      .from(this.tableName)
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_archived', false);

    if (error) throw error;
    return count ?? 0;
  }
}

// Export singleton instance
export const categoryRepository = new CategoryRepository();
