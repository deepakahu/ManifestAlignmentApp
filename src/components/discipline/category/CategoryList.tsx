/**
 * CategoryList Component
 *
 * Displays a list of categories with stats
 * Supports pull-to-refresh and empty states
 */

import React from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, ActivityIndicator } from 'react-native';
import type { Category } from '@manifestation/shared';
import { CategoryCard } from './CategoryCard';
import { MaterialIcons } from '@expo/vector-icons';

interface CategoryListProps {
  categories: Category[];
  loading?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  onCategoryPress?: (category: Category) => void;
  onCategoryLongPress?: (category: Category) => void;
  showArchived?: boolean;
  emptyMessage?: string;
  goalCounts?: Record<string, number>; // Map of categoryId -> goal count
  activityCounts?: Record<string, number>; // Map of categoryId -> activity count
}

export function CategoryList({
  categories,
  loading = false,
  refreshing = false,
  onRefresh,
  onCategoryPress,
  onCategoryLongPress,
  showArchived = false,
  emptyMessage = 'No categories yet. Create your first category to get started!',
  goalCounts = {},
  activityCounts = {},
}: CategoryListProps) {
  // Filter categories based on showArchived prop
  const filteredCategories = showArchived
    ? categories
    : categories.filter(c => !c.isArchived);

  // Loading state
  if (loading && categories.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Loading categories...</Text>
      </View>
    );
  }

  // Empty state
  if (filteredCategories.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <MaterialIcons name="label-outline" size={64} color="#ccc" />
        <Text style={styles.emptyTitle}>No Categories</Text>
        <Text style={styles.emptyMessage}>{emptyMessage}</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={filteredCategories}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <CategoryCard
          category={item}
          onPress={onCategoryPress}
          onLongPress={onCategoryLongPress}
          goalCount={goalCounts[item.id] || 0}
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
});
