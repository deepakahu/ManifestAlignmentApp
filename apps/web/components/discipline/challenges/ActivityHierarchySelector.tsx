'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

interface ActivityHierarchySelectorProps {
  selectedActivityIds: string[];
  onSelectionChange: (activityIds: string[]) => void;
}

interface Activity {
  id: string;
  title: string;
  description?: string;
  trackingType: string;
  frequencyType: string;
  frequencyConfig?: any;
  goalId: string;
}

interface Goal {
  id: string;
  title: string;
  categoryId: string | null;
}

interface Category {
  id: string;
  name: string;
  icon?: string;
}

interface Hierarchy {
  category: Category;
  goals: Array<{
    goal: Goal;
    activities: Activity[];
  }>;
}

export function ActivityHierarchySelector({
  selectedActivityIds,
  onSelectionChange,
}: ActivityHierarchySelectorProps) {
  const [hierarchy, setHierarchy] = useState<Hierarchy[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActivities();
  }, []);

  const loadActivities = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load all active activities with their goals and categories
      const { data: activitiesData, error: activitiesError } = await supabase
        .from('discipline_activities')
        .select(`
          id,
          title,
          description,
          tracking_type,
          frequency_type,
          frequency_config,
          goal_id,
          goals!inner(
            id,
            title,
            category_id,
            categories(
              id,
              name,
              icon
            )
          )
        `)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('title');

      if (activitiesError) throw activitiesError;

      // Build hierarchy
      const hierarchyMap = new Map<string, Hierarchy>();

      activitiesData?.forEach((activityData: any) => {
        const activity: Activity = {
          id: activityData.id,
          title: activityData.title,
          description: activityData.description,
          trackingType: activityData.tracking_type,
          frequencyType: activityData.frequency_type,
          frequencyConfig: activityData.frequency_config,
          goalId: activityData.goal_id,
        };

        const goal: Goal = {
          id: activityData.goals.id,
          title: activityData.goals.title,
          categoryId: activityData.goals.category_id,
        };

        const categoryId = activityData.goals.category_id || 'uncategorized';
        const category: Category = activityData.goals.categories
          ? {
              id: activityData.goals.categories.id,
              name: activityData.goals.categories.name,
              icon: activityData.goals.categories.icon,
            }
          : {
              id: 'uncategorized',
              name: 'Uncategorized',
              icon: '📋',
            };

        if (!hierarchyMap.has(categoryId)) {
          hierarchyMap.set(categoryId, {
            category,
            goals: [],
          });
        }

        const hierarchyItem = hierarchyMap.get(categoryId)!;

        // Find or create goal entry
        let goalEntry = hierarchyItem.goals.find(g => g.goal.id === goal.id);
        if (!goalEntry) {
          goalEntry = { goal, activities: [] };
          hierarchyItem.goals.push(goalEntry);
        }

        goalEntry.activities.push(activity);
      });

      const hierarchyArray = Array.from(hierarchyMap.values());
      setHierarchy(hierarchyArray);

      // Expand all categories by default
      setExpandedCategories(new Set(hierarchyArray.map(h => h.category.id)));
    } catch (error) {
      console.error('Failed to load activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const expandAll = () => {
    setExpandedCategories(new Set(hierarchy.map(h => h.category.id)));
  };

  const collapseAll = () => {
    setExpandedCategories(new Set());
  };

  const toggleActivity = (activityId: string) => {
    const newSelection = selectedActivityIds.includes(activityId)
      ? selectedActivityIds.filter(id => id !== activityId)
      : [...selectedActivityIds, activityId];
    onSelectionChange(newSelection);
  };

  const getFrequencyLabel = (activity: Activity): string => {
    if (activity.frequencyType === 'daily') return 'Daily';
    if (activity.frequencyType === 'specific_days') {
      const days = activity.frequencyConfig?.days?.length || 0;
      return `${days} days/week`;
    }
    if (activity.frequencyType === 'custom') return 'Custom schedule';
    return 'Unknown';
  };

  const getTrackingTypeLabel = (trackingType: string): string => {
    switch (trackingType) {
      case 'boolean': return 'Yes/No';
      case 'number': return 'Number';
      case 'multiselect': return 'Multi-select';
      case 'text': return 'Text';
      default: return trackingType;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (hierarchy.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500">
        No activities found. Create some activities first to add them to challenges.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with controls */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-slate-600">
          <span className="font-medium text-indigo-600">{selectedActivityIds.length}</span> {selectedActivityIds.length === 1 ? 'activity' : 'activities'} selected
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={expandAll}
            className="text-xs px-3 py-1 text-slate-600 hover:bg-slate-100 rounded transition-colors"
          >
            Expand All
          </button>
          <button
            type="button"
            onClick={collapseAll}
            className="text-xs px-3 py-1 text-slate-600 hover:bg-slate-100 rounded transition-colors"
          >
            Collapse All
          </button>
        </div>
      </div>

      {/* Hierarchical activity list */}
      <div className="space-y-3">
        {hierarchy.map(({ category, goals }) => {
          const isExpanded = expandedCategories.has(category.id);
          const totalActivities = goals.reduce((sum, g) => sum + g.activities.length, 0);

          return (
            <div key={category.id} className="border border-slate-200 rounded-lg overflow-hidden">
              {/* Category Header */}
              <button
                type="button"
                onClick={() => toggleCategory(category.id)}
                className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{category.icon}</span>
                  <span className="font-medium text-slate-900">{category.name}</span>
                  <span className="text-xs text-slate-500">
                    ({totalActivities} {totalActivities === 1 ? 'activity' : 'activities'})
                  </span>
                </div>
                <svg
                  className={`w-5 h-5 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Category Content */}
              {isExpanded && (
                <div className="p-4 space-y-4">
                  {goals.map(({ goal, activities }) => (
                    <div key={goal.id} className="space-y-2">
                      {/* Goal Header */}
                      <h4 className="text-sm font-medium text-slate-700 flex items-center gap-2">
                        <svg className="w-4 h-4 text-indigo-500" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" />
                        </svg>
                        {goal.title}
                      </h4>

                      {/* Activities */}
                      <div className="space-y-1 ml-6">
                        {activities.map(activity => {
                          const isSelected = selectedActivityIds.includes(activity.id);

                          return (
                            <label
                              key={activity.id}
                              className="flex items-start gap-3 p-2 rounded hover:bg-slate-50 cursor-pointer transition-colors"
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleActivity(activity.id)}
                                className="mt-0.5 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-sm font-medium text-slate-900">
                                    {activity.title}
                                  </span>
                                  <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                                    {getTrackingTypeLabel(activity.trackingType)}
                                  </span>
                                  <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded">
                                    {getFrequencyLabel(activity)}
                                  </span>
                                </div>
                                {activity.description && (
                                  <p className="text-xs text-slate-500 mt-0.5">
                                    {activity.description}
                                  </p>
                                )}
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
