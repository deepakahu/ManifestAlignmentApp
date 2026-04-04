/**
 * StatusSelector
 *
 * Visual badge selector for activity log status
 * Options: Good (✓), Neutral (=), Bad (✗), Skipped (⊘)
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface StatusSelectorProps {
  value: 'good' | 'neutral' | 'bad' | 'skipped';
  onChange: (status: 'good' | 'neutral' | 'bad' | 'skipped') => void;
}

interface StatusOption {
  value: 'good' | 'neutral' | 'bad' | 'skipped';
  label: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  color: string;
  backgroundColor: string;
  borderColor: string;
}

const STATUS_OPTIONS: StatusOption[] = [
  {
    value: 'good',
    label: 'Good',
    icon: 'check-circle',
    color: '#22c55e',
    backgroundColor: '#f0fdf4',
    borderColor: '#22c55e',
  },
  {
    value: 'neutral',
    label: 'Neutral',
    icon: 'remove-circle',
    color: '#3b82f6',
    backgroundColor: '#eff6ff',
    borderColor: '#3b82f6',
  },
  {
    value: 'bad',
    label: 'Bad',
    icon: 'cancel',
    color: '#ef4444',
    backgroundColor: '#fef2f2',
    borderColor: '#ef4444',
  },
  {
    value: 'skipped',
    label: 'Skipped',
    icon: 'block',
    color: '#94a3b8',
    backgroundColor: '#f8fafc',
    borderColor: '#cbd5e1',
  },
];

export function StatusSelector({ value, onChange }: StatusSelectorProps) {
  return (
    <View style={styles.container}>
      {STATUS_OPTIONS.map((option) => {
        const isSelected = value === option.value;

        return (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.badge,
              { borderColor: isSelected ? option.borderColor : '#e2e8f0' },
              isSelected && { backgroundColor: option.backgroundColor },
            ]}
            onPress={() => onChange(option.value)}
            activeOpacity={0.7}
          >
            <MaterialIcons
              name={option.icon}
              size={24}
              color={isSelected ? option.color : '#cbd5e1'}
            />
            <Text
              style={[
                styles.badgeText,
                { color: isSelected ? option.color : '#94a3b8' },
                isSelected && styles.badgeTextSelected,
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badge: {
    flex: 1,
    minWidth: '45%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 2,
    backgroundColor: '#fff',
  },
  badgeText: {
    fontSize: 14,
    fontWeight: '500',
  },
  badgeTextSelected: {
    fontWeight: '600',
  },
});
