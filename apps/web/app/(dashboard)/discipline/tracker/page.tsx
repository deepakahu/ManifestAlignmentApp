'use client';

/**
 * Daily Tracker Page (Web)
 *
 * Main page for daily activity tracking
 * Shows hierarchical view of all activities due on selected date
 * Supports quick logging with challenge-awareness
 */

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { DisciplineActivity, ActivityLog, Goal, Category } from '@manifestation/shared';
import { activityFromDB, activityToDB } from '@manifestation/shared';
import { QuickLogModal } from '@/components/discipline/tracker/QuickLogModal';
import { sendActivityLoggedNotification } from '@/lib/mailgun';

// Utility functions (copied from mobile - could be shared)
function isDueOn(activity: DisciplineActivity, date: Date): boolean {
  if (!activity.isActive) return false;

  if (activity.frequencyType === 'daily') return true;

  if (activity.frequencyType === 'specific_days') {
    const dayOfWeek = date.getDay();
    const config = activity.frequencyConfig as { days?: number[] };
    return config.days?.includes(dayOfWeek) || false;
  }

  if (activity.frequencyType === 'custom') {
    const dateStr = date.toISOString().split('T')[0];
    const config = activity.frequencyConfig as { dates?: string[] };
    return config.dates?.includes(dateStr) || false;
  }

  return false;
}

function formatDateForDisplay(date: Date): string {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const isSameDay = (d1: Date, d2: Date) =>
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();

  if (isSameDay(date, today)) return 'Today';
  if (isSameDay(date, yesterday)) return 'Yesterday';
  if (isSameDay(date, tomorrow)) return 'Tomorrow';

  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function isToday(date: Date): boolean {
  const today = new Date();
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

function getPreviousDate(date: Date): Date {
  const newDate = new Date(date);
  newDate.setDate(newDate.getDate() - 1);
  return newDate;
}

function getNextDate(date: Date): Date {
  const newDate = new Date(date);
  newDate.setDate(newDate.getDate() + 1);
  return newDate;
}

interface HierarchyItem {
  category: Category;
  isExpanded: boolean;
  goals: Array<{
    goal: Goal;
    activities: Array<{
      activity: DisciplineActivity;
      log: ActivityLog | null;
      challengeNames?: string[];
    }>;
  }>;
}

export default function DailyTrackerPage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [hierarchy, setHierarchy] = useState<HierarchyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [showLogModal, setShowLogModal] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<DisciplineActivity | null>(null);
  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);
  const [stats, setStats] = useState({ logged: 0, total: 0, percentage: 0 });

  // Load data when date changes
  useEffect(() => {
    loadData();
  }, [selectedDate]);

  const loadData = async () => {
    try {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Step 1: Get all active activities
      const { data: activitiesData, error: activitiesError } = await supabase
        .from('discipline_activities')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: true });

      if (activitiesError) throw activitiesError;

      const allActivities = (activitiesData || []).map(activityFromDB);

      // Filter activities due on selected date
      const activitiesDueToday = allActivities.filter((activity) =>
        isDueOn(activity, selectedDate)
      );

      // Step 2: Load logs for selected date
      const dateStr = selectedDate.toISOString().split('T')[0];
      const { data: logsData, error: logsError } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('user_id', user.id)
        .eq('log_date', dateStr);

      if (logsError) throw logsError;

      const logs: ActivityLog[] = (logsData || []).map((log) => ({
        id: log.id,
        userId: log.user_id,
        activityId: log.activity_id,
        logDate: new Date(log.log_date),
        value: log.value,
        status: log.status,
        notes: log.notes,
        createdAt: new Date(log.created_at),
        loggedAt: new Date(log.created_at),
        updatedAt: new Date(log.updated_at || log.created_at),
      }));

      // Step 3: Get unique goal IDs and load goals
      const goalIds = [...new Set(activitiesDueToday.map((a) => a.goalId))];
      const { data: goalsData, error: goalsError } = await supabase
        .from('goals')
        .select('*')
        .in('id', goalIds);

      if (goalsError) throw goalsError;

      const goals: Goal[] = (goalsData || []).map((goal) => ({
        id: goal.id,
        userId: goal.user_id,
        categoryId: goal.category_id,
        title: goal.title,
        description: goal.description,
        targetDate: goal.target_date ? new Date(goal.target_date) : undefined,
        isSmartGoal: goal.is_smart_goal,
        smartCriteria: goal.smart_criteria,
        status: goal.status,
        progressPercentage: goal.progress_percentage || 0,
        useManualProgress: goal.use_manual_progress || false,
        orderIndex: goal.order_index,
        createdAt: new Date(goal.created_at),
        updatedAt: new Date(goal.updated_at),
      }));

      // Step 4: Get unique category IDs and load categories
      const categoryIds = [...new Set(goals.map((g) => g.categoryId).filter(Boolean))];
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .in('id', categoryIds);

      if (categoriesError) throw categoriesError;

      const categories: Category[] = (categoriesData || []).map((cat) => ({
        id: cat.id,
        userId: cat.user_id,
        name: cat.name,
        description: cat.description,
        color: cat.color,
        icon: cat.icon,
        isArchived: cat.is_archived || false,
        orderIndex: cat.order_index,
        createdAt: new Date(cat.created_at),
        updatedAt: new Date(cat.updated_at),
      }));

      // Step 5: Load challenge information for activities
      const activityIds = activitiesDueToday.map(a => a.id);
      const { data: challengeActivitiesData } = await supabase
        .from('challenge_activities')
        .select('activity_id, challenge_id, challenges(title, status)')
        .in('activity_id', activityIds);

      // Create a map of activity ID to active challenge names (supports multiple challenges)
      const activityChallengeMap = new Map<string, string[]>();
      (challengeActivitiesData || []).forEach((ca: any) => {
        if (ca.challenges && ca.challenges.status === 'active') {
          const existingChallenges = activityChallengeMap.get(ca.activity_id) || [];
          activityChallengeMap.set(ca.activity_id, [...existingChallenges, ca.challenges.title]);
        }
      });

      // Step 6: Build hierarchy
      const hierarchyData = buildHierarchy(categories, goals, activitiesDueToday, logs, activityChallengeMap);
      setHierarchy(hierarchyData);

      // Initialize all categories as expanded by default
      const allCategoryIds = hierarchyData.map(h => h.category.id);
      setExpandedCategories(new Set(allCategoryIds));

      // Calculate stats
      const totalActivities = activitiesDueToday.length;
      const loggedActivities = activitiesDueToday.filter((activity) =>
        logs.some((log) => log.activityId === activity.id)
      ).length;
      const percentage = totalActivities > 0 ? Math.round((loggedActivities / totalActivities) * 100) : 0;

      setStats({
        logged: loggedActivities,
        total: totalActivities,
        percentage,
      });

      setLoading(false);
    } catch (error) {
      console.error('Failed to load data:', error);
      setLoading(false);
    }
  };

  const buildHierarchy = (
    categories: Category[],
    goals: Goal[],
    activities: DisciplineActivity[],
    logs: ActivityLog[],
    activityChallengeMap: Map<string, string[]>
  ): HierarchyItem[] => {
    const categoryMap = new Map(categories.map((c) => [c.id, c]));
    const goalMap = new Map(goals.map((g) => [g.id, g]));
    const logMap = new Map(logs.map((l) => [l.activityId, l]));

    const hierarchy: HierarchyItem[] = [];

    categories.forEach((category) => {
      const categoryGoals = goals.filter((g) => g.categoryId === category.id);

      const goalsWithActivities = categoryGoals.map((goal) => {
        const goalActivities = activities.filter((a) => a.goalId === goal.id);

        return {
          goal,
          activities: goalActivities.map((activity) => ({
            activity,
            log: logMap.get(activity.id) || null,
            challengeNames: activityChallengeMap.get(activity.id),
          })),
        };
      });

      // Only include categories with activities
      const hasActivities = goalsWithActivities.some((g) => g.activities.length > 0);
      if (hasActivities) {
        hierarchy.push({
          category,
          isExpanded: expandedCategories.has(category.id),
          goals: goalsWithActivities.filter((g) => g.activities.length > 0),
        });
      }
    });

    // Handle uncategorized goals
    const uncategorizedGoals = goals.filter((g) => !g.categoryId);
    if (uncategorizedGoals.length > 0) {
      const goalsWithActivities = uncategorizedGoals.map((goal) => {
        const goalActivities = activities.filter((a) => a.goalId === goal.id);

        return {
          goal,
          activities: goalActivities.map((activity) => ({
            activity,
            log: logMap.get(activity.id) || null,
            challengeNames: activityChallengeMap.get(activity.id),
          })),
        };
      });

      const hasActivities = goalsWithActivities.some((g) => g.activities.length > 0);
      if (hasActivities) {
        hierarchy.push({
          category: {
            id: 'uncategorized',
            userId: '',
            name: 'Uncategorized',
            description: undefined,
            isArchived: false,
            color: '#94a3b8',
            icon: 'folder-outline',
            orderIndex: 999,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          isExpanded: expandedCategories.has('uncategorized'),
          goals: goalsWithActivities.filter((g) => g.activities.length > 0),
        });
      }
    }

    return hierarchy.sort((a, b) => a.category.orderIndex - b.category.orderIndex);
  };

  const handlePrevious = () => {
    setSelectedDate(getPreviousDate(selectedDate));
  };

  const handleNext = () => {
    setSelectedDate(getNextDate(selectedDate));
  };

  const handleToday = () => {
    setSelectedDate(new Date());
  };

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) => {
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
    const allIds = hierarchy.map((h) => h.category.id);
    setExpandedCategories(new Set(allIds));
  };

  const collapseAll = () => {
    setExpandedCategories(new Set());
  };

  const handleLogActivity = (activity: DisciplineActivity, log: ActivityLog | null) => {
    console.log('handleLogActivity called', { activity, log });
    setSelectedActivity(activity);
    setSelectedLog(log);
    setShowLogModal(true);
    console.log('Modal should be open now');
  };

  const handleLogSubmit = async (log: Partial<ActivityLog>) => {
    try {
      if (!selectedActivity) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const dateStr = selectedDate.toISOString().split('T')[0];

      // Check if log already exists
      const { data: existingLogs } = await supabase
        .from('activity_logs')
        .select('id')
        .eq('user_id', user.id)
        .eq('activity_id', selectedActivity.id)
        .eq('log_date', dateStr)
        .limit(1);

      const logData = {
        user_id: user.id,
        activity_id: selectedActivity.id,
        log_date: dateStr,
        value: log.value,
        status: log.status || 'good',
        notes: log.notes || null,
      };

      console.log('Saving log:', logData);

      let error;
      let activityLogId: string;

      if (existingLogs && existingLogs.length > 0) {
        // Update existing log
        console.log('Updating existing log:', existingLogs[0].id);
        activityLogId = existingLogs[0].id;
        const result = await supabase
          .from('activity_logs')
          .update(logData)
          .eq('id', existingLogs[0].id)
          .select('id')
          .single();
        error = result.error;
        console.log('Update result:', { error, data: result.data });
      } else {
        // Insert new log
        console.log('Inserting new log');
        const result = await supabase
          .from('activity_logs')
          .insert(logData)
          .select('id')
          .single();
        error = result.error;
        activityLogId = result.data?.id;
        console.log('Insert result:', { error, data: result.data });
      }

      if (error) {
        console.error('Database error:', error);
        throw error;
      }

      // CRITICAL FIX: Create challenge_activity_logs entries for active challenges
      if (activityLogId) {
        try {
          const { data: challengeActivities } = await supabase
            .from('challenge_activities')
            .select('challenge_id, challenges!inner(id, status)')
            .eq('activity_id', selectedActivity.id)
            .eq('challenges.status', 'active');

          if (challengeActivities && challengeActivities.length > 0) {
            // Create challenge_activity_logs entries for each active challenge
            const challengeLogInserts = challengeActivities.map((ca: any) => ({
              challenge_id: ca.challenge_id,
              activity_log_id: activityLogId,
              approval_status: 'pending',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }));

            const { error: challengeLogError } = await supabase
              .from('challenge_activity_logs')
              .upsert(challengeLogInserts, {
                onConflict: 'challenge_id,activity_log_id'
              });

            if (challengeLogError) {
              console.error('Failed to create challenge activity logs:', challengeLogError);
              // Non-critical - continue with activity logging success
            } else {
              console.log(`Created ${challengeLogInserts.length} challenge_activity_logs entries`);
            }
          }
        } catch (challengeLogError) {
          console.error('Error creating challenge activity logs:', challengeLogError);
          // Don't throw - this shouldn't block activity logging
        }
      }

      // Check if this activity is part of any active challenges with accountability partners
      try {
        const { data: challengeActivities } = await supabase
          .from('challenge_activities')
          .select('challenge_id, challenges!inner(id, title, status)')
          .eq('activity_id', selectedActivity.id);

        if (challengeActivities && challengeActivities.length > 0) {
          // Filter for active challenges
          const activeChallenges = challengeActivities.filter(
            (ca: any) => ca.challenges?.status === 'active'
          );

          // For each active challenge, check for accountability partner
          for (const challengeActivity of activeChallenges) {
            const challengeId = challengeActivity.challenge_id;

            // Get accountability partner for this challenge
            const { data: accountabilityPartner } = await supabase
              .from('challenge_participants')
              .select('user_id, users!inner(email, full_name)')
              .eq('challenge_id', challengeId)
              .eq('role', 'accountability_partner')
              .eq('status', 'accepted')
              .single();

            if (accountabilityPartner && (accountabilityPartner as any).users?.email) {
              const partner = (accountabilityPartner as any).users;

              // Get current user's name
              const { data: currentUserData } = await supabase
                .from('users')
                .select('full_name, email')
                .eq('id', user.id)
                .single();

              const userName = currentUserData?.full_name || currentUserData?.email?.split('@')[0] || 'A user';
              const partnerName = partner.full_name || partner.email.split('@')[0];

              // Send notification email (don't await - run in background)
              sendActivityLoggedNotification(
                partner.email,
                partnerName,
                userName,
                (challengeActivity as any).challenges.title,
                selectedActivity.title,
                challengeId
              ).catch(err => {
                console.error('Failed to send accountability notification:', err);
                // Don't throw - email failure shouldn't block logging
              });
            }
          }
        }
      } catch (emailError) {
        console.error('Error checking challenges for email notifications:', emailError);
        // Don't throw - email failure shouldn't block logging
      }

      // Close modal and refresh
      setShowLogModal(false);
      setSelectedActivity(null);
      setSelectedLog(null);
      await loadData();
    } catch (error: any) {
      console.error('Failed to save log:', error);
      throw new Error(error.message || 'Failed to save log');
    }
  };

  const handleCloseLogModal = () => {
    setShowLogModal(false);
    setSelectedActivity(null);
    setSelectedLog(null);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          {/* Date Navigation */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <button
                onClick={handlePrevious}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <button
                onClick={handleToday}
                className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="font-semibold text-slate-900">{formatDateForDisplay(selectedDate)}</span>
                {!isToday(selectedDate) && (
                  <span className="ml-2 px-2 py-0.5 bg-indigo-600 text-white text-xs font-semibold rounded">
                    Go to Today
                  </span>
                )}
              </button>

              <button
                onClick={handleNext}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={collapseAll}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                title="Collapse All"
              >
                <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              </button>
              <button
                onClick={expandAll}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                title="Expand All"
              >
                <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white border border-slate-200 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-indigo-600">
                {stats.logged}/{stats.total}
              </div>
              <div className="text-xs text-slate-600 mt-1">Activities Logged</div>
            </div>
            <div className="bg-white border border-slate-200 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-indigo-600">{stats.percentage}%</div>
              <div className="text-xs text-slate-600 mt-1">Completion</div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <p className="mt-4 text-sm text-slate-600">Loading activities...</p>
          </div>
        ) : hierarchy.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-slate-900">No activities due today</h3>
            <p className="mt-2 text-sm text-slate-600">
              Activities scheduled for this date will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {hierarchy.map((item) => (
              <div key={item.category.id} className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                {/* Category Header */}
                <button
                  onClick={() => toggleCategory(item.category.id)}
                  className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-semibold"
                      style={{ backgroundColor: item.category.color }}
                    >
                      {item.category.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold text-slate-900">{item.category.name}</h3>
                      <p className="text-xs text-slate-500">
                        {item.goals.reduce((sum, g) => sum + g.activities.length, 0)} activities
                      </p>
                    </div>
                  </div>
                  <svg
                    className={`w-5 h-5 text-slate-400 transition-transform ${
                      expandedCategories.has(item.category.id) ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Category Content */}
                {expandedCategories.has(item.category.id) && (
                  <div className="border-t border-slate-200">
                    {item.goals.map((goalItem) => (
                      <div key={goalItem.goal.id} className="p-4 border-b border-slate-100 last:border-b-0">
                        {/* Goal Header */}
                        <div className="mb-3">
                          <h4 className="font-medium text-slate-900">{goalItem.goal.title}</h4>
                          {goalItem.goal.description && (
                            <p className="text-sm text-slate-600 mt-1">{goalItem.goal.description}</p>
                          )}
                        </div>

                        {/* Activities */}
                        <div className="space-y-2">
                          {goalItem.activities.map(({ activity, log, challengeNames }) => (
                            <div
                              key={activity.id}
                              className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                            >
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <h5 className="font-medium text-slate-900">{activity.title}</h5>
                                  {challengeNames && challengeNames.length > 0 && (
                                    <div className="relative group">
                                      <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full cursor-help">
                                        <svg
                                          className="w-3.5 h-3.5"
                                          fill="currentColor"
                                          viewBox="0 0 24 24"
                                        >
                                          <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
                                        </svg>
                                        {challengeNames.length > 1 && (
                                          <span className="text-xs font-medium">{challengeNames.length}</span>
                                        )}
                                      </div>
                                      {/* Tooltip */}
                                      <div className="hidden group-hover:block absolute left-0 top-full mt-1 z-20 bg-slate-900 text-white px-3 py-2 rounded shadow-lg whitespace-nowrap">
                                        <div className="text-xs font-semibold mb-1">
                                          {challengeNames.length === 1 ? 'Challenge:' : 'Challenges:'}
                                        </div>
                                        {challengeNames.map((name, idx) => (
                                          <div key={idx} className="text-xs">
                                            {challengeNames.length > 1 && `${idx + 1}. `}{name}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  <span className="text-xs px-2 py-0.5 bg-slate-200 text-slate-700 rounded">
                                    {activity.trackingType}
                                  </span>
                                  {log && (
                                    <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded font-medium">
                                      Logged ✓
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-slate-600 mt-1">
                                  {activity.frequencyType === 'daily' && 'Daily'}
                                  {activity.frequencyType === 'specific_days' &&
                                    `${(activity.frequencyConfig as any).days?.length || 0} days/week`}
                                  {activity.frequencyType === 'custom' && 'Custom schedule'}
                                </p>
                              </div>

                              <button
                                onClick={() => handleLogActivity(activity, log)}
                                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                                  log
                                    ? 'bg-green-600 text-white hover:bg-green-700'
                                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                                }`}
                              >
                                {log ? 'Update' : 'Log Now'}
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* QuickLogModal */}
      <QuickLogModal
        isOpen={showLogModal}
        activity={selectedActivity}
        existingLog={selectedLog}
        onClose={handleCloseLogModal}
        onSubmit={handleLogSubmit}
      />
    </div>
  );
}
