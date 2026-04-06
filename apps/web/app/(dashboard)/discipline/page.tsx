/**
 * Discipline Overview Page
 *
 * Main discipline tracking dashboard showing all categories with stats
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import type { Category } from '@manifestation/shared';
import { categoryFromDB } from '@manifestation/shared';
import { CategoryGrid } from '@/components/discipline/category/CategoryGrid';

export default function DisciplinePage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showArchived, setShowArchived] = useState(false);
  const [goalCounts, setGoalCounts] = useState<Record<string, number>>({});
  const [activityCounts, setActivityCounts] = useState<Record<string, number>>({});

  // Load categories
  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      // Load categories
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id)
        .order('is_archived', { ascending: true })
        .order('order_index', { ascending: true });

      if (error) throw error;
      const cats = data.map(categoryFromDB);
      setCategories(cats);

      // Load goals count per category
      const { data: goalsData } = await supabase
        .from('goals')
        .select('id, category_id')
        .eq('user_id', user.id);

      const goalCountsMap: Record<string, number> = {};
      (goalsData || []).forEach((goal) => {
        const catId = goal.category_id;
        if (catId) {
          goalCountsMap[catId] = (goalCountsMap[catId] || 0) + 1;
        }
      });
      setGoalCounts(goalCountsMap);

      // Load activities count per category (via goals)
      const { data: activitiesData } = await supabase
        .from('discipline_activities')
        .select('goal_id')
        .eq('user_id', user.id)
        .eq('is_active', true);

      // Map goal_id to category_id
      const goalToCategoryMap = new Map<string, string>();
      (goalsData || []).forEach((goal) => {
        if (goal.category_id) {
          goalToCategoryMap.set(goal.id, goal.category_id);
        }
      });

      const activityCountsMap: Record<string, number> = {};
      (activitiesData || []).forEach((activity) => {
        const catId = goalToCategoryMap.get(activity.goal_id);
        if (catId) {
          activityCountsMap[catId] = (activityCountsMap[catId] || 0) + 1;
        }
      });
      setActivityCounts(activityCountsMap);

    } catch (error: any) {
      console.error('Failed to load categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryClick = (category: Category) => {
    router.push(`/discipline/categories/${category.id}`);
  };

  const handleManageCategories = () => {
    router.push('/discipline/categories');
  };

  const filteredCategories = showArchived
    ? categories
    : categories.filter(c => !c.isArchived);

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Discipline Tracker</h1>
          <p className="mt-1 text-sm md:text-base text-gray-600">
            Track your daily habits and achieve your goals
          </p>
        </div>
        <div className="flex flex-wrap gap-2 md:gap-3">
          <button
            onClick={() => router.push('/discipline/tracker')}
            className="px-3 md:px-4 py-2 text-sm md:text-base text-indigo-700 bg-indigo-50 border border-indigo-300 rounded-lg hover:bg-indigo-100 transition-colors font-medium flex items-center gap-2"
          >
            <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="hidden sm:inline">Today</span>
            <span className="sm:hidden">📅</span>
          </button>
          <button
            onClick={() => setShowArchived(!showArchived)}
            className="px-3 md:px-4 py-2 text-sm md:text-base text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap"
          >
            {showArchived ? 'Hide' : 'Show'} <span className="hidden sm:inline">Archived</span>
          </button>
          <button
            onClick={handleManageCategories}
            className="px-3 md:px-4 py-2 text-sm md:text-base text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors whitespace-nowrap"
          >
            <span className="hidden sm:inline">Manage </span>Categories
          </button>
        </div>
      </div>

      {/* Categories Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-gray-400 text-6xl mb-4">📋</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No Categories Yet
          </h3>
          <p className="text-gray-600 mb-6">
            Create your first category to start tracking your discipline activities
          </p>
          <button
            onClick={handleManageCategories}
            className="px-6 py-3 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Create First Category
          </button>
        </div>
      ) : (
        <CategoryGrid
          categories={filteredCategories}
          onCategoryClick={handleCategoryClick}
          goalCounts={goalCounts}
          activityCounts={activityCounts}
        />
      )}
    </div>
  );
}
