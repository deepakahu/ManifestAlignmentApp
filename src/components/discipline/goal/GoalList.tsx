/**
 * GoalList Component
 *
 * Displays a list of goals grouped by status
 */

import React from 'react';
import { View, Text, StyleSheet, SectionList, RefreshControl, ActivityIndicator } from 'react-native';
import type { Goal } from '@manifestation/shared';
import { GoalCard } from './GoalCard';
import { MaterialIcons } from '@expo/vector-icons';

interface GoalListProps {
  goals: Goal[];
  loading?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  onGoalPress?: (goal: Goal) => void;
  onGoalLongPress?: (goal: Goal) => void;
  categoryColor?: string;
  showCategory?: boolean;
  categoryNames?: Record<string, string>; // Map of categoryId -> name
  activityCounts?: Record<string, number>; // Map of goalId -> activity count
  groupByStatus?: boolean;
  emptyMessage?: string;
}

export function GoalList({
  goals,
  loading = false,
  refreshing = false,
  onRefresh,
  onGoalPress,
  onGoalLongPress,
  categoryColor,
  showCategory = false,
  categoryNames = {},
  activityCounts = {},
  groupByStatus = true,
  emptyMessage = 'No goals yet. Create your first goal to get started!',
}: GoalListProps) {
  // Loading state
  if (loading && goals.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Loading goals...</Text>
      </View>
    );
  }

  // Empty state
  if (goals.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <MaterialIcons name="flag-outline" size={64} color="#ccc" />
        <Text style={styles.emptyTitle}>No Goals</Text>
        <Text style={styles.emptyMessage}>{emptyMessage}</Text>
      </View>
    );
  }

  // Group goals by status if enabled
  if (groupByStatus) {
    const sections = [
      {
        title: 'Active',
        data: goals.filter(g => g.status === 'active'),
        icon: 'flag' as const,
        color: '#6366f1',
      },
      {
        title: 'Completed',
        data: goals.filter(g => g.status === 'completed'),
        icon: 'check-circle' as const,
        color: '#10b981',
      },
      {
        title: 'Paused',
        data: goals.filter(g => g.status === 'paused'),
        icon: 'pause-circle-filled' as const,
        color: '#f59e0b',
      },
      {
        title: 'Archived',
        data: goals.filter(g => g.status === 'archived'),
        icon: 'archive' as const,
        color: '#999',
      },
    ].filter(section => section.data.length > 0);

    return (
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <GoalCard
            goal={item}
            categoryColor={categoryColor}
            onPress={onGoalPress}
            onLongPress={onGoalLongPress}
            showCategory={showCategory}
            categoryName={item.categoryId ? categoryNames[item.categoryId] : undefined}
            activityCount={activityCounts[item.id] || 0}
          />
        )}
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
            <MaterialIcons name={section.icon} size={18} color={section.color} />
            <Text style={[styles.sectionTitle, { color: section.color }]}>
              {section.title}
            </Text>
            <Text style={styles.sectionCount}>
              ({section.data.length})
            </Text>
          </View>
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          onRefresh ? (
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          ) : undefined
        }
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled={false}
      />
    );
  }

  // Simple list without grouping
  return (
    <SectionList
      sections={[{ title: 'All Goals', data: goals }]}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <GoalCard
          goal={item}
          categoryColor={categoryColor}
          onPress={onGoalPress}
          onLongPress={onGoalLongPress}
          showCategory={showCategory}
          categoryName={item.categoryId ? categoryNames[item.categoryId] : undefined}
          activityCount={activityCounts[item.id] || 0}
        />
      )}
      contentContainerStyle={styles.listContent}
      refreshControl={
        onRefresh ? (
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        ) : undefined
      }
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  listContent: {
    padding: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  emptyTitle: {
    marginTop: 16,
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  emptyMessage: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 4,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  sectionCount: {
    fontSize: 14,
    color: '#999',
  },
});
