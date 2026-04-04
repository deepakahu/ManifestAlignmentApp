/**
 * TrackingTypeSelector Component
 *
 * Allows user to select tracking type for an activity:
 * - Boolean: Yes/No completion
 * - Number: Quantity with unit (e.g., "4 rounds", "20 minutes")
 * - Multi-select: Multiple options with min/max validation
 * - Text: Free-form notes with max length
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import type { TrackingType } from '@manifestation/shared';

interface TrackingTypeOption {
  type: TrackingType;
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  description: string;
}

const TRACKING_TYPES: TrackingTypeOption[] = [
  {
    type: 'boolean',
    icon: 'check-circle',
    label: 'Yes/No',
    description: 'Simple completion tracking',
  },
  {
    type: 'number',
    icon: 'looks-one',
    label: 'Number',
    description: 'Track quantity (e.g., 4 rounds, 20 minutes)',
  },
  {
    type: 'multiselect',
    icon: 'list',
    label: 'Multi-select',
    description: 'Choose from multiple options',
  },
  {
    type: 'text',
    icon: 'notes',
    label: 'Text',
    description: 'Free-form notes',
  },
];

interface TrackingTypeSelectorProps {
  value: TrackingType;
  onChange: (type: TrackingType) => void;
  color?: string;
}

export function TrackingTypeSelector({
  value,
  onChange,
  color = '#6366f1',
}: TrackingTypeSelectorProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Tracking Type</Text>
      <View style={styles.grid}>
        {TRACKING_TYPES.map((option) => {
          const isSelected = value === option.type;
          return (
            <TouchableOpacity
              key={option.type}
              style={[
                styles.card,
                isSelected && { ...styles.cardSelected, borderColor: color },
              ]}
              onPress={() => onChange(option.type)}
              activeOpacity={0.7}
            >
              <MaterialIcons
                name={option.icon}
                size={32}
                color={isSelected ? color : '#94a3b8'}
              />
              <Text
                style={[
                  styles.cardLabel,
                  isSelected && { ...styles.cardLabelSelected, color },
                ]}
              >
                {option.label}
              </Text>
              <Text style={styles.cardDescription}>{option.description}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  card: {
    width: '48%',
    padding: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    minHeight: 120,
  },
  cardSelected: {
    backgroundColor: '#f0f4ff',
    borderWidth: 2,
  },
  cardLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 8,
    marginBottom: 4,
  },
  cardLabelSelected: {
    fontWeight: '700',
  },
  cardDescription: {
    fontSize: 11,
    color: '#94a3b8',
    textAlign: 'center',
  },
});
