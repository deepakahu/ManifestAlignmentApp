/**
 * Category Detail Page (Web)
 *
 * Shows a category with all its goals
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import type { Category, Goal } from '@manifestation/shared';
import { categoryFromDB, goalFromDB } from '@manifestation/shared';

export default function CategoryDetailPage() {
  const router = useRouter();
  const params = useParams();
  const categoryId = params.id as string;

  const [category, setCategory] = useState<Category | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [categoryId]);

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      // Load category
      const { data: categoryData, error: categoryError } = await supabase
        .from('categories')
        .select('*')
        .eq('id', categoryId)
        .eq('user_id', user.id)
        .single();

      if (categoryError) throw categoryError;
      setCategory(categoryFromDB(categoryData));

      // Load goals
      const { data: goalsData, error: goalsError } = await supabase
        .from('goals')
        .select('*')
        .eq('category_id', categoryId)
        .eq('user_id', user.id)
        .order('status', { ascending: true })
        .order('order_index', { ascending: true });

      if (goalsError) throw goalsError;
      setGoals(goalsData.map(goalFromDB));
    } catch (error: any) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGoalClick = (goalId: string) => {
    router.push(`/discipline/goals/${goalId}`);
  };

  if (loading || !category) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
        </div>
      </div>
    );
  }

  const activeGoals = goals.filter(g => g.status === 'active');
  const completedGoals = goals.filter(g => g.status === 'completed');

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div
        className="rounded-lg p-8 mb-8"
        style={{ backgroundColor: category.color + '15' }}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-3xl"
              style={{ backgroundColor: category.color }}
            >
              {category.icon || '📋'}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{category.name}</h1>
              {category.description && (
                <p className="text-gray-600 mt-1">{category.description}</p>
              )}
            </div>
          </div>
          <button
            onClick={() => router.push('/discipline/categories')}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Back to Categories
          </button>
        </div>

        {/* Stats */}
        <div className="flex gap-6">
          <div className="flex-1 bg-white bg-opacity-50 rounded-lg p-4">
            <div className="text-3xl font-bold text-gray-900">{activeGoals.length}</div>
            <div className="text-sm text-gray-600">Active Goals</div>
          </div>
          <div className="flex-1 bg-white bg-opacity-50 rounded-lg p-4">
            <div className="text-3xl font-bold text-gray-900">{completedGoals.length}</div>
            <div className="text-sm text-gray-600">Completed</div>
          </div>
          <div className="flex-1 bg-white bg-opacity-50 rounded-lg p-4">
            <div className="text-3xl font-bold text-gray-900">{goals.length}</div>
            <div className="text-sm text-gray-600">Total Goals</div>
          </div>
        </div>
      </div>

      {/* Active Goals */}
      {activeGoals.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Active Goals ({activeGoals.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeGoals.map(goal => (
              <div
                key={goal.id}
                onClick={() => handleGoalClick(goal.id)}
                className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{goal.title}</h3>
                {goal.description && (
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{goal.description}</p>
                )}

                {/* Progress */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Progress</span>
                    <span className="font-semibold">{goal.progressPercentage}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${goal.progressPercentage}%`, backgroundColor: category.color }}
                    />
                  </div>
                </div>

                {/* SMART indicator */}
                {[goal.specific, goal.measurable, goal.achievable, goal.relevant, goal.timeBound].filter(Boolean).length > 0 && (
                  <div className="flex items-center gap-1 text-xs text-amber-600">
                    <span>⭐</span>
                    <span>
                      SMART {[goal.specific, goal.measurable, goal.achievable, goal.relevant, goal.timeBound].filter(Boolean).length}/5
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Completed Goals */}
      {completedGoals.length > 0 && (
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Completed Goals ({completedGoals.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {completedGoals.map(goal => (
              <div
                key={goal.id}
                onClick={() => handleGoalClick(goal.id)}
                className="bg-white border border-green-200 rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer opacity-75"
              >
                <div className="flex items-start gap-2">
                  <span className="text-green-600 text-xl">✓</span>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{goal.title}</h3>
                    {goal.description && (
                      <p className="text-gray-600 text-sm line-clamp-2">{goal.description}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {goals.length === 0 && (
        <div className="text-center py-16">
          <div className="text-gray-400 text-6xl mb-4">🎯</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Goals Yet</h3>
          <p className="text-gray-600 mb-6">
            Create your first goal to start tracking your progress
          </p>
          <button
            onClick={() => alert('Goal creation coming soon!')}
            className="px-6 py-3 text-white rounded-lg hover:opacity-90 transition-opacity"
            style={{ backgroundColor: category.color }}
          >
            Create First Goal
          </button>
        </div>
      )}
    </div>
  );
}
