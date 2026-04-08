/**
 * ActivityHierarchySelector Component
 *
 * Modal for selecting activities in hierarchical Category > Goal > Activity structure
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { DisciplineActivity } from '@manifestation/shared';

interface ActivityHierarchySelectorProps {
  visible: boolean;
  activities: DisciplineActivity[];
  selectedIds: string[];
  onClose: () => void;
  onConfirm: (activityIds: string[]) => void;
}

interface ActivityNode {
  activity: DisciplineActivity;
  checked: boolean;
}

interface GoalNode {
  goalId: string;
  goalTitle: string;
  activities: ActivityNode[];
  expanded: boolean;
}

interface CategoryNode {
  categoryId: string;
  categoryTitle: string;
  goals: GoalNode[];
  expanded: boolean;
}

export function ActivityHierarchySelector({
  visible,
  activities,
  selectedIds,
  onClose,
  onConfirm,
}: ActivityHierarchySelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedActivityIds, setSelectedActivityIds] = useState<string[]>(selectedIds);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [expandedGoals, setExpandedGoals] = useState<Set<string>>(new Set());

  /**
   * Build hierarchical structure from flat activities list
   */
  const hierarchy = useMemo(() => {
    const categoryMap = new Map<string, CategoryNode>();

    // Filter by search query
    const filteredActivities = activities.filter((activity) => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        activity.title.toLowerCase().includes(query) ||
        activity.goal?.title.toLowerCase().includes(query) ||
        activity.goal?.category?.name.toLowerCase().includes(query)
      );
    });

    // Build hierarchy
    for (const activity of filteredActivities) {
      const categoryId = activity.goal?.category?.id || 'uncategorized';
      const categoryTitle = activity.goal?.category?.name || 'Uncategorized';
      const goalId = activity.goalId || 'no-goal';
      const goalTitle = activity.goal?.title || 'No Goal';

      // Get or create category
      if (!categoryMap.has(categoryId)) {
        categoryMap.set(categoryId, {
          categoryId,
          categoryTitle,
          goals: [],
          expanded: expandedCategories.has(categoryId),
        });
      }

      const category = categoryMap.get(categoryId)!;

      // Get or create goal
      let goal = category.goals.find((g) => g.goalId === goalId);
      if (!goal) {
        goal = {
          goalId,
          goalTitle,
          activities: [],
          expanded: expandedGoals.has(goalId),
        };
        category.goals.push(goal);
      }

      // Add activity
      goal.activities.push({
        activity,
        checked: selectedActivityIds.includes(activity.id),
      });
    }

    return Array.from(categoryMap.values());
  }, [activities, searchQuery, selectedActivityIds, expandedCategories, expandedGoals]);

  /**
   * Toggle category expansion
   */
  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  /**
   * Toggle goal expansion
   */
  const toggleGoal = (goalId: string) => {
    setExpandedGoals((prev) => {
      const next = new Set(prev);
      if (next.has(goalId)) {
        next.delete(goalId);
      } else {
        next.add(goalId);
      }
      return next;
    });
  };

  /**
   * Toggle activity selection
   */
  const toggleActivity = (activityId: string) => {
    setSelectedActivityIds((prev) => {
      if (prev.includes(activityId)) {
        return prev.filter((id) => id !== activityId);
      } else {
        return [...prev, activityId];
      }
    });
  };

  /**
   * Expand all categories and goals
   */
  const expandAll = () => {
    const allCategoryIds = new Set(hierarchy.map((c) => c.categoryId));
    const allGoalIds = new Set(
      hierarchy.flatMap((c) => c.goals.map((g) => g.goalId))
    );
    setExpandedCategories(allCategoryIds);
    setExpandedGoals(allGoalIds);
  };

  /**
   * Collapse all categories and goals
   */
  const collapseAll = () => {
    setExpandedCategories(new Set());
    setExpandedGoals(new Set());
  };

  /**
   * Handle confirm
   */
  const handleConfirm = () => {
    onConfirm(selectedActivityIds);
    onClose();
  };

  /**
   * Handle cancel
   */
  const handleCancel = () => {
    setSelectedActivityIds(selectedIds); // Reset to original
    onClose();
  };

  /**
   * Reset when modal opens
   */
  React.useEffect(() => {
    if (visible) {
      setSelectedActivityIds(selectedIds);
      setSearchQuery('');
    }
  }, [visible, selectedIds]);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleCancel} hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}>
            <Text style={styles.cancelButton}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Select Activities</Text>
          <TouchableOpacity onPress={handleConfirm} hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}>
            <Text style={styles.doneButton}>Done</Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#94a3b8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search activities, goals, categories..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#94a3b8"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </View>

        {/* Expand/Collapse All */}
        <View style={styles.controlsBar}>
          <Text style={styles.selectedCount}>
            {selectedActivityIds.length} selected
          </Text>
          <View style={styles.expandControls}>
            <TouchableOpacity onPress={expandAll} style={styles.expandButton}>
              <Ionicons name="chevron-down-outline" size={16} color="#6366f1" />
              <Text style={styles.expandButtonText}>Expand All</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={collapseAll} style={styles.expandButton}>
              <Ionicons name="chevron-up-outline" size={16} color="#6366f1" />
              <Text style={styles.expandButtonText}>Collapse All</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Hierarchical List */}
        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          {hierarchy.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={48} color="#cbd5e1" />
              <Text style={styles.emptyText}>
                {searchQuery ? 'No activities found' : 'No activities available'}
              </Text>
            </View>
          ) : (
            hierarchy.map((category) => (
              <CategorySection
                key={category.categoryId}
                category={category}
                onToggleCategory={toggleCategory}
                onToggleGoal={toggleGoal}
                onToggleActivity={toggleActivity}
              />
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

/**
 * Category Section Component
 */
interface CategorySectionProps {
  category: CategoryNode;
  onToggleCategory: (categoryId: string) => void;
  onToggleGoal: (goalId: string) => void;
  onToggleActivity: (activityId: string) => void;
}

function CategorySection({
  category,
  onToggleCategory,
  onToggleGoal,
  onToggleActivity,
}: CategorySectionProps) {
  const activityCount = category.goals.reduce(
    (sum, goal) => sum + goal.activities.length,
    0
  );

  const selectedCount = category.goals.reduce(
    (sum, goal) => sum + goal.activities.filter((a) => a.checked).length,
    0
  );

  return (
    <View style={styles.categorySection}>
      {/* Category Header */}
      <TouchableOpacity
        style={styles.categoryHeader}
        onPress={() => onToggleCategory(category.categoryId)}
        activeOpacity={0.7}
      >
        <View style={styles.categoryHeaderLeft}>
          <Ionicons
            name={category.expanded ? 'chevron-down' : 'chevron-forward'}
            size={20}
            color="#1e293b"
          />
          <Ionicons name="folder" size={20} color="#6366f1" />
          <Text style={styles.categoryTitle}>{category.categoryTitle}</Text>
        </View>
        <Text style={styles.categoryCount}>
          {selectedCount}/{activityCount}
        </Text>
      </TouchableOpacity>

      {/* Goals (when expanded) */}
      {category.expanded && (
        <View style={styles.goalsContainer}>
          {category.goals.map((goal) => (
            <GoalSection
              key={goal.goalId}
              goal={goal}
              onToggleGoal={onToggleGoal}
              onToggleActivity={onToggleActivity}
            />
          ))}
        </View>
      )}
    </View>
  );
}

/**
 * Goal Section Component
 */
interface GoalSectionProps {
  goal: GoalNode;
  onToggleGoal: (goalId: string) => void;
  onToggleActivity: (activityId: string) => void;
}

function GoalSection({ goal, onToggleGoal, onToggleActivity }: GoalSectionProps) {
  const selectedCount = goal.activities.filter((a) => a.checked).length;

  return (
    <View style={styles.goalSection}>
      {/* Goal Header */}
      <TouchableOpacity
        style={styles.goalHeader}
        onPress={() => onToggleGoal(goal.goalId)}
        activeOpacity={0.7}
      >
        <View style={styles.goalHeaderLeft}>
          <Ionicons
            name={goal.expanded ? 'chevron-down' : 'chevron-forward'}
            size={18}
            color="#475569"
          />
          <Ionicons name="flag" size={18} color="#8b5cf6" />
          <Text style={styles.goalTitle}>{goal.goalTitle}</Text>
        </View>
        <Text style={styles.goalCount}>
          {selectedCount}/{goal.activities.length}
        </Text>
      </TouchableOpacity>

      {/* Activities (when expanded) */}
      {goal.expanded && (
        <View style={styles.activitiesContainer}>
          {goal.activities.map((node) => (
            <ActivityItem
              key={node.activity.id}
              activity={node.activity}
              checked={node.checked}
              onToggle={onToggleActivity}
            />
          ))}
        </View>
      )}
    </View>
  );
}

/**
 * Activity Item Component
 */
interface ActivityItemProps {
  activity: DisciplineActivity;
  checked: boolean;
  onToggle: (activityId: string) => void;
}

function ActivityItem({ activity, checked, onToggle }: ActivityItemProps) {
  const getFrequencyText = () => {
    if (!activity.trackingFrequency) return '';
    const { type, value } = activity.trackingFrequency;
    if (type === 'daily') return 'Daily';
    if (type === 'weekly') return `${value}x/week`;
    if (type === 'custom') return `Every ${value} days`;
    return '';
  };

  const getTrackingTypeIcon = () => {
    switch (activity.trackingType) {
      case 'boolean':
        return 'checkmark-circle-outline';
      case 'number':
        return 'calculator-outline';
      case 'duration':
        return 'time-outline';
      case 'text':
        return 'text-outline';
      default:
        return 'ellipse-outline';
    }
  };

  return (
    <TouchableOpacity
      style={styles.activityItem}
      onPress={() => onToggle(activity.id)}
      activeOpacity={0.7}
    >
      <View style={styles.activityItemLeft}>
        {/* Checkbox */}
        <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
          {checked && <Ionicons name="checkmark" size={16} color="#fff" />}
        </View>

        {/* Activity Info */}
        <View style={styles.activityInfo}>
          <Text style={styles.activityTitle} numberOfLines={1}>
            {activity.title}
          </Text>
          <View style={styles.activityMeta}>
            <Ionicons name={getTrackingTypeIcon()} size={12} color="#64748b" />
            <Text style={styles.activityMetaText}>
              {activity.trackingType}
            </Text>
            {activity.trackingFrequency && (
              <>
                <Text style={styles.activityMetaSeparator}>•</Text>
                <Text style={styles.activityMetaText}>{getFrequencyText()}</Text>
              </>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  cancelButton: {
    fontSize: 16,
    color: '#64748b',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  doneButton: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6366f1',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1e293b',
    padding: 0,
  },
  controlsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  selectedCount: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6366f1',
  },
  expandControls: {
    flexDirection: 'row',
    gap: 12,
  },
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  expandButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6366f1',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 12,
  },
  categorySection: {
    marginBottom: 12,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  categoryHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  categoryTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
    flex: 1,
  },
  categoryCount: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748b',
  },
  goalsContainer: {
    marginTop: 8,
    marginLeft: 16,
  },
  goalSection: {
    marginBottom: 8,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  goalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  goalTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    flex: 1,
  },
  goalCount: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748b',
  },
  activitiesContainer: {
    marginTop: 6,
    marginLeft: 16,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 6,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  activityItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  activityInfo: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1e293b',
    marginBottom: 2,
  },
  activityMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  activityMetaText: {
    fontSize: 11,
    color: '#64748b',
  },
  activityMetaSeparator: {
    fontSize: 11,
    color: '#cbd5e1',
  },
});
