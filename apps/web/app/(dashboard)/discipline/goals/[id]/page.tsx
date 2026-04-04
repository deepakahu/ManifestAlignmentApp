/**
 * Goal Detail Page (Web)
 *
 * Shows goal details with SMART framework
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import type { Goal, Category, DisciplineActivity } from '@manifestation/shared';
import { goalFromDB, categoryFromDB, activityFromDB, activityToDB } from '@manifestation/shared';
import { ActivityList } from '@/components/discipline/ActivityList';
import { ActivityForm, ActivityFormData } from '@/components/discipline/ActivityForm';

export default function GoalDetailPage() {
  const router = useRouter();
  const params = useParams();
  const goalId = params.id as string;

  const [goal, setGoal] = useState<Goal | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [activities, setActivities] = useState<DisciplineActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [editingActivity, setEditingActivity] = useState<DisciplineActivity | null>(null);
  const [showGoalEditForm, setShowGoalEditForm] = useState(false);
  const [goalFormData, setGoalFormData] = useState({
    title: '',
    description: '',
    specific: '',
    measurable: '',
    achievable: '',
    relevant: '',
    timeBound: '',
    targetDate: '',
    status: 'active',
  });

  useEffect(() => {
    loadData();
  }, [goalId]);

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      // Load goal
      const { data: goalData, error: goalError } = await supabase
        .from('goals')
        .select('*')
        .eq('id', goalId)
        .eq('user_id', user.id)
        .single();

      if (goalError) throw goalError;
      const loadedGoal = goalFromDB(goalData);
      setGoal(loadedGoal);

      // Load category if exists
      if (loadedGoal.categoryId) {
        const { data: categoryData, error: categoryError } = await supabase
          .from('categories')
          .select('*')
          .eq('id', loadedGoal.categoryId)
          .eq('user_id', user.id)
          .single();

        if (!categoryError && categoryData) {
          setCategory(categoryFromDB(categoryData));
        }
      }

      // Load activities for this goal
      const { data: activitiesData, error: activitiesError } = await supabase
        .from('discipline_activities')
        .select('*')
        .eq('goal_id', goalId)
        .eq('user_id', user.id)
        .order('order_index', { ascending: true });

      if (!activitiesError && activitiesData) {
        setActivities(activitiesData.map(activityFromDB));
      }
    } catch (error: any) {
      console.error('Failed to load goal:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditGoal = () => {
    if (!goal) return;
    setGoalFormData({
      title: goal.title,
      description: goal.description || '',
      specific: goal.specific || '',
      measurable: goal.measurable || '',
      achievable: goal.achievable || '',
      relevant: goal.relevant || '',
      timeBound: goal.timeBound || '',
      targetDate: goal.targetDate ? new Date(goal.targetDate).toISOString().split('T')[0] : '',
      status: goal.status,
    });
    setShowGoalEditForm(true);
  };

  const handleSaveGoal = async () => {
    if (!goalFormData.title.trim()) {
      alert('Please enter a goal title');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('goals')
        .update({
          title: goalFormData.title,
          description: goalFormData.description || null,
          specific: goalFormData.specific || null,
          measurable: goalFormData.measurable || null,
          achievable: goalFormData.achievable || null,
          relevant: goalFormData.relevant || null,
          time_bound: goalFormData.timeBound || null,
          target_date: goalFormData.targetDate || null,
          status: goalFormData.status,
        })
        .eq('id', goalId)
        .eq('user_id', user.id);

      if (error) throw error;

      setShowGoalEditForm(false);
      loadData();
    } catch (error: any) {
      console.error('Failed to update goal:', error);
      alert('Failed to update goal: ' + error.message);
    }
  };

  const handleAddActivity = () => {
    setEditingActivity(null);
    setShowActivityForm(true);
  };

  const handleEditActivity = (activity: DisciplineActivity) => {
    setEditingActivity(activity);
    setShowActivityForm(true);
  };

  const handleDeleteActivity = async (activity: DisciplineActivity) => {
    if (!confirm(`Are you sure you want to delete "${activity.title}"?`)) return;

    try {
      const { error } = await supabase
        .from('discipline_activities')
        .delete()
        .eq('id', activity.id);

      if (error) throw error;
      loadData();
    } catch (error: any) {
      alert('Failed to delete activity: ' + error.message);
    }
  };

  const handleToggleActive = async (activity: DisciplineActivity) => {
    try {
      const { error } = await supabase
        .from('discipline_activities')
        .update({ is_active: !activity.isActive })
        .eq('id', activity.id);

      if (error) throw error;
      loadData();
    } catch (error: any) {
      alert('Failed to update activity: ' + error.message);
    }
  };

  const handleActivitySubmit = async (data: ActivityFormData) => {
    if (!goal) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (editingActivity) {
        // Update existing activity
        const { error } = await supabase
          .from('discipline_activities')
          .update(activityToDB({
            ...editingActivity,
            ...data,
          }))
          .eq('id', editingActivity.id);

        if (error) throw error;
      } else {
        // Create new activity
        const newActivity: Partial<DisciplineActivity> = {
          goalId: goal.id,
          ...data,
          reminderChannels: {
            push: true,
            alarm: false,
            sms: false,
            email: false,
          },
          isActive: true,
          orderIndex: activities.length,
        };

        const { error } = await supabase
          .from('discipline_activities')
          .insert({
            ...activityToDB(newActivity as DisciplineActivity),
            user_id: user.id,
          });

        if (error) throw error;
      }

      setShowActivityForm(false);
      setEditingActivity(null);
      loadData();
    } catch (error: any) {
      alert('Failed to save activity: ' + error.message);
      throw error;
    }
  };

  if (loading || !goal) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
        </div>
      </div>
    );
  }

  const color = category?.color || '#6366f1';
  const smartFields = [
    { letter: 'S', title: 'Specific', value: goal.specific },
    { letter: 'M', title: 'Measurable', value: goal.measurable },
    { letter: 'A', title: 'Achievable', value: goal.achievable },
    { letter: 'R', title: 'Relevant', value: goal.relevant },
    { letter: 'T', title: 'Time-bound', value: goal.timeBound },
  ].filter(field => field.value);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div
        className="rounded-lg p-8 mb-8"
        style={{ backgroundColor: color + '10' }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span
              className="px-3 py-1 rounded-full text-white text-sm font-semibold"
              style={{ backgroundColor: color }}
            >
              {goal.status.charAt(0).toUpperCase() + goal.status.slice(1)}
            </span>
            {category && (
              <span
                className="px-3 py-1 rounded-full text-sm font-semibold"
                style={{ backgroundColor: color + '30', color }}
              >
                {category.name}
              </span>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleEditGoal}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit Goal
            </button>
            <button
              onClick={() => router.back()}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Back
            </button>
          </div>
        </div>

        <h1 className="text-4xl font-bold text-gray-900 mb-4">{goal.title}</h1>
        {goal.description && (
          <p className="text-gray-700 text-lg mb-6">{goal.description}</p>
        )}

        {/* Progress */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <span className="text-gray-700 font-medium">Progress</span>
            <div className="flex items-center gap-2">
              <span className="text-3xl font-bold text-gray-900">{goal.progressPercentage}%</span>
              {goal.useManualProgress && (
                <span className="text-xs text-gray-600 bg-white px-2 py-1 rounded">
                  ✏️ Manual
                </span>
              )}
            </div>
          </div>
          <div className="w-full h-4 bg-white bg-opacity-50 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${goal.progressPercentage}%`, backgroundColor: color }}
            />
          </div>
        </div>
      </div>

      {/* SMART Framework */}
      {smartFields.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
          <div className="flex items-center gap-2 mb-6">
            <span className="text-2xl">⭐</span>
            <h2 className="text-2xl font-semibold text-gray-900">SMART Framework</h2>
            <span className="text-gray-600">({smartFields.length}/5)</span>
          </div>

          <div className="space-y-6">
            {smartFields.map(field => (
              <div key={field.letter} className="flex gap-4">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xl flex-shrink-0"
                  style={{ backgroundColor: color }}
                >
                  {field.letter}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-2">{field.title}</h3>
                  <p className="text-gray-700 leading-relaxed">{field.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Target Date */}
      {goal.targetDate && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">📅</span>
            <h3 className="text-lg font-semibold text-gray-900">Target Date</h3>
          </div>
          <p className="text-gray-700 text-lg">
            {new Date(goal.targetDate).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
      )}

      {/* Activities */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <span className="text-xl">✅</span>
            <h3 className="text-lg font-semibold text-gray-900">Activities</h3>
            <span className="text-gray-600">({activities.length})</span>
          </div>
          <button
            onClick={handleAddActivity}
            className="px-4 py-2 text-white rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2"
            style={{ backgroundColor: color }}
          >
            <span>+</span>
            Add Activity
          </button>
        </div>

        <ActivityList
          activities={activities}
          goalColor={color}
          onEdit={handleEditActivity}
          onDelete={handleDeleteActivity}
          onToggleActive={handleToggleActive}
        />
      </div>

      {/* Goal Edit Modal */}
      {showGoalEditForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 sticky top-0 bg-white">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Edit Goal</h2>
                <button
                  onClick={() => setShowGoalEditForm(false)}
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

              {/* Status */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Status
                </label>
                <select
                  value={goalFormData.status}
                  onChange={(e) => setGoalFormData({ ...goalFormData, status: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="archived">Archived</option>
                </select>
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
                      <span className="font-bold" style={{ color }}>S</span>pecific - What exactly do you want to achieve?
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
                      <span className="font-bold" style={{ color }}>M</span>easurable - How will you measure success?
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
                      <span className="font-bold" style={{ color }}>A</span>chievable - Is it realistic?
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
                      <span className="font-bold" style={{ color }}>R</span>elevant - Why does it matter?
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
                      <span className="font-bold" style={{ color }}>T</span>ime-bound - When do you want to achieve this?
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
                onClick={() => setShowGoalEditForm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveGoal}
                className="flex-1 px-4 py-2 text-white rounded-lg hover:opacity-90 transition-opacity"
                style={{ backgroundColor: color }}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Activity Form Modal */}
      {showActivityForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200 sticky top-0 bg-white">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingActivity ? 'Edit Activity' : 'Create New Activity'}
                </h2>
                <button
                  onClick={() => {
                    setShowActivityForm(false);
                    setEditingActivity(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <ActivityForm
              activity={editingActivity || undefined}
              goalColor={color}
              onSubmit={handleActivitySubmit}
              onCancel={() => {
                setShowActivityForm(false);
                setEditingActivity(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
