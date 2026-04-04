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
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [goalFormData, setGoalFormData] = useState({
    title: '',
    description: '',
    specific: '',
    measurable: '',
    achievable: '',
    relevant: '',
    timeBound: '',
    targetDate: '',
  });

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

  const handleCreateGoal = async () => {
    if (!goalFormData.title.trim()) {
      alert('Please enter a goal title');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('goals')
        .insert({
          user_id: user.id,
          category_id: categoryId,
          title: goalFormData.title,
          description: goalFormData.description || null,
          specific: goalFormData.specific || null,
          measurable: goalFormData.measurable || null,
          achievable: goalFormData.achievable || null,
          relevant: goalFormData.relevant || null,
          time_bound: goalFormData.timeBound || null,
          target_date: goalFormData.targetDate || null,
          status: 'active',
          progress_percentage: 0,
          use_manual_progress: false,
          order_index: 0,
        });

      if (error) throw error;

      // Reset form and close modal
      setGoalFormData({
        title: '',
        description: '',
        specific: '',
        measurable: '',
        achievable: '',
        relevant: '',
        timeBound: '',
        targetDate: '',
      });
      setShowGoalForm(false);

      // Reload data
      loadData();
    } catch (error: any) {
      console.error('Failed to create goal:', error);
      alert('Failed to create goal: ' + error.message);
    }
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
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold text-gray-900">
              Active Goals ({activeGoals.length})
            </h2>
            <button
              onClick={() => setShowGoalForm(true)}
              className="px-4 py-2 text-white rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2"
              style={{ backgroundColor: category.color }}
            >
              <span>+</span>
              Add Goal
            </button>
          </div>
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
            onClick={() => setShowGoalForm(true)}
            className="px-6 py-3 text-white rounded-lg hover:opacity-90 transition-opacity"
            style={{ backgroundColor: category.color }}
          >
            Create First Goal
          </button>
        </div>
      )}

      {/* Goal Creation Modal */}
      {showGoalForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 sticky top-0 bg-white">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Create New Goal</h2>
                <button
                  onClick={() => setShowGoalForm(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Goal Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={goalFormData.title}
                  onChange={(e) => setGoalFormData({ ...goalFormData, title: e.target.value })}
                  placeholder="e.g., Complete morning meditation practice"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  maxLength={100}
                />
                <p className="text-xs text-gray-500 mt-1">{goalFormData.title.length}/100</p>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={goalFormData.description}
                  onChange={(e) => setGoalFormData({ ...goalFormData, description: e.target.value })}
                  placeholder="Add details about your goal..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  rows={3}
                  maxLength={500}
                />
              </div>

              {/* SMART Framework */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <span>⭐</span>
                  SMART Framework (Optional)
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <span className="font-bold" style={{ color: category.color }}>S</span>pecific - What exactly do you want to achieve?
                    </label>
                    <input
                      type="text"
                      value={goalFormData.specific}
                      onChange={(e) => setGoalFormData({ ...goalFormData, specific: e.target.value })}
                      placeholder="Be specific about your goal..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <span className="font-bold" style={{ color: category.color }}>M</span>easurable - How will you measure success?
                    </label>
                    <input
                      type="text"
                      value={goalFormData.measurable}
                      onChange={(e) => setGoalFormData({ ...goalFormData, measurable: e.target.value })}
                      placeholder="Define how you'll track progress..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <span className="font-bold" style={{ color: category.color }}>A</span>chievable - Is it realistic?
                    </label>
                    <input
                      type="text"
                      value={goalFormData.achievable}
                      onChange={(e) => setGoalFormData({ ...goalFormData, achievable: e.target.value })}
                      placeholder="What resources do you need..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <span className="font-bold" style={{ color: category.color }}>R</span>elevant - Why does it matter?
                    </label>
                    <input
                      type="text"
                      value={goalFormData.relevant}
                      onChange={(e) => setGoalFormData({ ...goalFormData, relevant: e.target.value })}
                      placeholder="How does this align with your values..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <span className="font-bold" style={{ color: category.color }}>T</span>ime-bound - When do you want to achieve this?
                    </label>
                    <input
                      type="text"
                      value={goalFormData.timeBound}
                      onChange={(e) => setGoalFormData({ ...goalFormData, timeBound: e.target.value })}
                      placeholder="Set a deadline..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Target Date
                    </label>
                    <input
                      type="date"
                      value={goalFormData.targetDate}
                      onChange={(e) => setGoalFormData({ ...goalFormData, targetDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 bg-gray-50 flex gap-3">
              <button
                onClick={() => setShowGoalForm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateGoal}
                className="flex-1 px-4 py-2 text-white rounded-lg hover:opacity-90 transition-opacity"
                style={{ backgroundColor: category.color }}
              >
                Create Goal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
