/**
 * Daily Tracker Utilities
 *
 * Helper functions for filtering activities by date and building hierarchical structure
 * Includes challenge-awareness for future Challenge System integration
 */

import type {
  DisciplineActivity,
  Category,
  Goal,
  ActivityLog,
} from '@manifestation/shared';

/**
 * Check if an activity is due on a specific date based on its frequency configuration
 */
export function isDueOn(activity: DisciplineActivity, date: Date): boolean {
  if (!activity.isActive) return false;

  // Daily activities are always due
  if (activity.frequencyType === 'daily') return true;

  // Specific days: check if the date's day-of-week matches
  if (activity.frequencyType === 'specific_days') {
    const dayOfWeek = date.getDay(); // 0=Sunday, 6=Saturday
    const config = activity.frequencyConfig as { days?: number[] };
    return config.days?.includes(dayOfWeek) || false;
  }

  // Custom dates: check if the date matches any custom dates
  if (activity.frequencyType === 'custom') {
    const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
    const config = activity.frequencyConfig as { dates?: string[] };
    return config.dates?.includes(dateStr) || false;
  }

  return false;
}

/**
 * Interface for daily tracker hierarchy with challenge context
 */
export interface DailyTrackerHierarchy {
  category: Category;
  isExpanded: boolean; // Track collapse state
  goals: Array<{
    goal: Goal;
    activities: Array<{
      activity: DisciplineActivity;
      log: ActivityLog | null;
      // Challenge context (future-ready)
      challengeCount?: number; // Number of challenges this activity is part of
      challengeStatuses?: Array<{
        challengeId: string;
        challengeName: string;
        challengeShortname: string;
        status: 'pending' | 'approved' | 'rejected' | 'not_submitted';
      }>;
    }>;
  }>;
}

/**
 * Build hierarchical structure for daily tracker
 * Groups activities by Category → Goal with logs attached
 *
 * @param categories - All categories
 * @param goals - All goals
 * @param activities - Activities due on the selected date
 * @param logs - Activity logs for the selected date
 * @param expandedCategories - Set of category IDs that should be expanded
 * @returns Hierarchical structure ready for display
 */
export function buildDailyHierarchy(
  categories: Category[],
  goals: Goal[],
  activities: DisciplineActivity[],
  logs: ActivityLog[],
  expandedCategories: Set<string> = new Set()
): DailyTrackerHierarchy[] {
  // Create lookup maps for efficiency
  const logsByActivityId = new Map<string, ActivityLog>();
  logs.forEach(log => logsByActivityId.set(log.activityId, log));

  const goalsByCategory = new Map<string | null, Goal[]>();
  goals.forEach(goal => {
    const categoryId = goal.categoryId || null;
    if (!goalsByCategory.has(categoryId)) {
      goalsByCategory.set(categoryId, []);
    }
    goalsByCategory.get(categoryId)!.push(goal);
  });

  const activitiesByGoal = new Map<string, DisciplineActivity[]>();
  activities.forEach(activity => {
    if (!activitiesByGoal.has(activity.goalId)) {
      activitiesByGoal.set(activity.goalId, []);
    }
    activitiesByGoal.get(activity.goalId)!.push(activity);
  });

  // Build hierarchy
  const hierarchy: DailyTrackerHierarchy[] = [];

  // Process each category
  categories.forEach(category => {
    const categoryGoals = goalsByCategory.get(category.id) || [];

    // Only include categories that have goals with activities due today
    const goalsWithActivities = categoryGoals
      .map(goal => {
        const goalActivities = activitiesByGoal.get(goal.id) || [];

        // Sort activities by order_index
        const sortedActivities = goalActivities.sort(
          (a, b) => a.orderIndex - b.orderIndex
        );

        return {
          goal,
          activities: sortedActivities.map(activity => ({
            activity,
            log: logsByActivityId.get(activity.id) || null,
            // Challenge data will be populated when Challenge System is implemented
            challengeCount: 0,
            challengeStatuses: [],
          })),
        };
      })
      .filter(item => item.activities.length > 0);

    if (goalsWithActivities.length > 0) {
      hierarchy.push({
        category,
        isExpanded: expandedCategories.has(category.id) || expandedCategories.size === 0,
        goals: goalsWithActivities,
      });
    }
  });

  // Handle uncategorized goals
  const uncategorizedGoals = goalsByCategory.get(null) || [];
  const uncategorizedGoalsWithActivities = uncategorizedGoals
    .map(goal => {
      const goalActivities = activitiesByGoal.get(goal.id) || [];
      const sortedActivities = goalActivities.sort(
        (a, b) => a.orderIndex - b.orderIndex
      );

      return {
        goal,
        activities: sortedActivities.map(activity => ({
          activity,
          log: logsByActivityId.get(activity.id) || null,
          challengeCount: 0,
          challengeStatuses: [],
        })),
      };
    })
    .filter(item => item.activities.length > 0);

  if (uncategorizedGoalsWithActivities.length > 0) {
    // Create virtual "Uncategorized" category
    const uncategorizedCategory: Category = {
      id: 'uncategorized',
      userId: '', // Will be set when used
      name: 'Uncategorized',
      description: 'Activities without a category',
      color: '#94a3b8',
      icon: '📋',
      orderIndex: 9999,
      isArchived: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    hierarchy.push({
      category: uncategorizedCategory,
      isExpanded: expandedCategories.has('uncategorized') || expandedCategories.size === 0,
      goals: uncategorizedGoalsWithActivities,
    });
  }

  // Sort hierarchy by category order_index
  return hierarchy.sort((a, b) => a.category.orderIndex - b.category.orderIndex);
}

/**
 * Calculate completion statistics for a given date
 */
export interface CompletionStats {
  total: number;
  logged: number;
  percentage: number;
  challengeTotal?: number; // Future: challenges due today
  challengeApproved?: number; // Future: approved challenge tasks
}

export function calculateCompletionStats(
  activities: DisciplineActivity[],
  logs: ActivityLog[]
): CompletionStats {
  const total = activities.length;
  const logged = logs.filter(log =>
    log.status !== 'skipped' && activities.some(a => a.id === log.activityId)
  ).length;

  return {
    total,
    logged,
    percentage: total > 0 ? Math.round((logged / total) * 100) : 0,
    // Challenge stats will be populated when Challenge System is implemented
    challengeTotal: 0,
    challengeApproved: 0,
  };
}

/**
 * Format date for display
 */
export function formatDateForDisplay(date: Date): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const compareDate = new Date(date);
  compareDate.setHours(0, 0, 0, 0);

  if (compareDate.getTime() === today.getTime()) {
    return 'Today';
  }

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (compareDate.getTime() === yesterday.getTime()) {
    return 'Yesterday';
  }

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (compareDate.getTime() === tomorrow.getTime()) {
    return 'Tomorrow';
  }

  // Format as "Mon, Jan 15"
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  };
  return date.toLocaleDateString('en-US', options);
}

/**
 * Get date for prev/next navigation
 */
export function getPreviousDate(date: Date): Date {
  const prev = new Date(date);
  prev.setDate(prev.getDate() - 1);
  return prev;
}

export function getNextDate(date: Date): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + 1);
  return next;
}

/**
 * Check if a date is today
 */
export function isToday(date: Date): boolean {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}
