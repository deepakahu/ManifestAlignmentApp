/**
 * CategoryCard Component
 *
 * Displays a single category with icon, name, and stats
 * Supports press actions and long-press for options
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Pressable } from 'react-native';
import type { Category } from '@manifestation/shared';
import { MaterialIcons } from '@expo/vector-icons';

interface CategoryCardProps {
  category: Category;
  onPress?: (category: Category) => void;
  onLongPress?: (category: Category) => void;
  showStats?: boolean;
  goalCount?: number;
  activityCount?: number;
}

export function CategoryCard({
  category,
  onPress,
  onLongPress,
  showStats = true,
  goalCount = 0,
  activityCount = 0,
}: CategoryCardProps) {
  return (
    <Pressable
      onPress={() => onPress?.(category)}
      onLongPress={() => onLongPress?.(category)}
      style={({ pressed }) => [
        styles.container,
        { backgroundColor: category.color + '15' }, // 15 = ~8% opacity
        pressed && styles.pressed,
        category.isArchived && styles.archived,
      ]}
    >
      <View style={styles.content}>
        {/* Icon */}
        <View style={[styles.iconContainer, { backgroundColor: category.color }]}>
          {category.icon ? (
            <Text style={styles.iconEmoji}>{category.icon}</Text>
          ) : (
            <MaterialIcons name="label" size={24} color="#fff" />
          )}
        </View>

        {/* Name and Description */}
        <View style={styles.textContainer}>
          <Text style={styles.name} numberOfLines={1}>
            {category.name}
          </Text>
          {category.description && (
            <Text style={styles.description} numberOfLines={2}>
              {category.description}
            </Text>
          )}
          {showStats && (
            <View style={styles.statsContainer}>
              <View style={styles.stat}>
                <MaterialIcons name="flag" size={12} color="#666" />
                <Text style={styles.statText}>{goalCount} goals</Text>
              </View>
              <View style={styles.stat}>
                <MaterialIcons name="check-circle" size={12} color="#666" />
                <Text style={styles.statText}>{activityCount} activities</Text>
              </View>
            </View>
          )}
        </View>

        {/* Chevron */}
        <MaterialIcons name="chevron-right" size={24} color="#999" />
      </View>

      {category.isArchived && (
        <View style={styles.archivedBadge}>
          <Text style={styles.archivedText}>Archived</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  pressed: {
    opacity: 0.7,
  },
  archived: {
    opacity: 0.6,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconEmoji: {
    fontSize: 24,
  },
  textContainer: {
    flex: 1,
  },
  name: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: '#666',
  },
  archivedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#ffa500',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  archivedText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
  },
});
