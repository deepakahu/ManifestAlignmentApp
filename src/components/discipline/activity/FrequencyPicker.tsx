/**
 * FrequencyPicker Component
 *
 * Allows user to select activity frequency:
 * - Daily: Every day
 * - Specific Days: Selected days of week (Sun-Sat)
 * - Custom: Specific dates only
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import type {
  FrequencyType,
  FrequencyConfig,
  SpecificDaysFrequencyConfig,
} from '@manifestation/shared';

interface FrequencyPickerProps {
  frequencyType: FrequencyType;
  frequencyConfig: FrequencyConfig;
  onChange: (type: FrequencyType, config: FrequencyConfig) => void;
  color?: string;
}

const FREQUENCY_OPTIONS = [
  {
    type: 'daily' as FrequencyType,
    icon: 'today' as keyof typeof MaterialIcons.glyphMap,
    label: 'Daily',
    description: 'Every day',
  },
  {
    type: 'specific_days' as FrequencyType,
    icon: 'date-range' as keyof typeof MaterialIcons.glyphMap,
    label: 'Specific Days',
    description: 'Select days of week',
  },
  {
    type: 'custom' as FrequencyType,
    icon: 'event' as keyof typeof MaterialIcons.glyphMap,
    label: 'Custom',
    description: 'Specific dates only',
  },
];

const DAYS_OF_WEEK = [
  { short: 'S', full: 'Sunday', value: 0 },
  { short: 'M', full: 'Monday', value: 1 },
  { short: 'T', full: 'Tuesday', value: 2 },
  { short: 'W', full: 'Wednesday', value: 3 },
  { short: 'T', full: 'Thursday', value: 4 },
  { short: 'F', full: 'Friday', value: 5 },
  { short: 'S', full: 'Saturday', value: 6 },
];

export function FrequencyPicker({
  frequencyType,
  frequencyConfig,
  onChange,
  color = '#6366f1',
}: FrequencyPickerProps) {
  const handleTypeChange = (type: FrequencyType) => {
    if (type === 'daily') {
      onChange(type, {});
    } else if (type === 'specific_days') {
      onChange(type, { days: [1, 2, 3, 4, 5] }); // Default: Weekdays
    } else {
      onChange(type, { dates: [] });
    }
  };

  const handleDayToggle = (day: number) => {
    if (frequencyType !== 'specific_days') return;

    const config = frequencyConfig as SpecificDaysFrequencyConfig;
    const days = config.days || [];
    const newDays = days.includes(day)
      ? days.filter((d) => d !== day)
      : [...days, day].sort();

    onChange(frequencyType, { days: newDays });
  };

  const selectedDays =
    frequencyType === 'specific_days'
      ? (frequencyConfig as SpecificDaysFrequencyConfig).days || []
      : [];

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Frequency</Text>

      {/* Frequency Type Selection */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.typeScroll}
      >
        {FREQUENCY_OPTIONS.map((option) => {
          const isSelected = frequencyType === option.type;
          return (
            <TouchableOpacity
              key={option.type}
              style={[
                styles.typeCard,
                isSelected && { ...styles.typeCardSelected, borderColor: color },
              ]}
              onPress={() => handleTypeChange(option.type)}
              activeOpacity={0.7}
            >
              <MaterialIcons
                name={option.icon}
                size={24}
                color={isSelected ? color : '#94a3b8'}
              />
              <Text
                style={[
                  styles.typeLabel,
                  isSelected && { ...styles.typeLabelSelected, color },
                ]}
              >
                {option.label}
              </Text>
              <Text style={styles.typeDescription}>{option.description}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Days of Week Picker (for specific_days) */}
      {frequencyType === 'specific_days' && (
        <View style={styles.daysContainer}>
          <Text style={styles.daysLabel}>Select Days</Text>
          <View style={styles.daysGrid}>
            {DAYS_OF_WEEK.map((day) => {
              const isSelected = selectedDays.includes(day.value);
              return (
                <TouchableOpacity
                  key={day.value}
                  style={[
                    styles.dayButton,
                    isSelected && {
                      ...styles.dayButtonSelected,
                      backgroundColor: color,
                    },
                  ]}
                  onPress={() => handleDayToggle(day.value)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.dayText,
                      isSelected && styles.dayTextSelected,
                    ]}
                  >
                    {day.short}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {selectedDays.length === 0 && (
            <Text style={styles.errorText}>Select at least one day</Text>
          )}
        </View>
      )}

      {/* Custom Dates Picker (for custom) */}
      {frequencyType === 'custom' && (
        <View style={styles.customContainer}>
          <Text style={styles.customText}>
            Custom dates can be added after creating the activity
          </Text>
        </View>
      )}
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
  typeScroll: {
    marginBottom: 16,
  },
  typeCard: {
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    marginRight: 12,
    minWidth: 100,
    alignItems: 'center',
  },
  typeCardSelected: {
    backgroundColor: '#f0f4ff',
    borderWidth: 2,
  },
  typeLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 4,
    marginBottom: 2,
  },
  typeLabelSelected: {
    fontWeight: '700',
  },
  typeDescription: {
    fontSize: 10,
    color: '#94a3b8',
    textAlign: 'center',
  },
  daysContainer: {
    marginTop: 8,
  },
  daysLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 8,
  },
  daysGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  dayButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  dayButtonSelected: {
    borderWidth: 0,
  },
  dayText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  dayTextSelected: {
    color: '#ffffff',
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: 8,
  },
  customContainer: {
    padding: 12,
    backgroundColor: '#fef3c7',
    borderRadius: 8,
    marginTop: 8,
  },
  customText: {
    fontSize: 12,
    color: '#92400e',
    textAlign: 'center',
  },
});
