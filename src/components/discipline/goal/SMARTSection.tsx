/**
 * SMARTSection Component
 *
 * Displays and edits one field of the SMART framework
 * S - Specific, M - Measurable, A - Achievable, R - Relevant, T - Time-bound
 */

import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface SMARTSectionProps {
  letter: 'S' | 'M' | 'A' | 'R' | 'T';
  value: string | undefined;
  onChangeValue: (value: string) => void;
  color?: string;
}

const SMART_INFO = {
  S: {
    title: 'Specific',
    description: 'What exactly do you want to accomplish?',
    placeholder: 'Be clear and precise about what you want to achieve...',
    icon: 'my-location',
  },
  M: {
    title: 'Measurable',
    description: 'How will you know when you have reached this goal?',
    placeholder: 'Define specific metrics or criteria for success...',
    icon: 'show-chart',
  },
  A: {
    title: 'Achievable',
    description: 'Is this realistic? What resources do you need?',
    placeholder: 'Describe why this goal is attainable and what you need...',
    icon: 'check-circle',
  },
  R: {
    title: 'Relevant',
    description: 'Why is this important? How does it align with your values?',
    placeholder: 'Explain why this goal matters to you...',
    icon: 'stars',
  },
  T: {
    title: 'Time-bound',
    description: 'When do you want to achieve this by?',
    placeholder: 'Set a deadline or timeframe for your goal...',
    icon: 'event',
  },
};

export function SMARTSection({
  letter,
  value,
  onChangeValue,
  color = '#6366f1',
}: SMARTSectionProps) {
  const [isExpanded, setIsExpanded] = useState(!!value);
  const info = SMART_INFO[letter];
  const isFilled = !!value && value.trim().length > 0;

  return (
    <View style={styles.container}>
      {/* Header */}
      <TouchableOpacity
        style={styles.header}
        onPress={() => setIsExpanded(!isExpanded)}
        activeOpacity={0.7}
      >
        <View style={styles.headerLeft}>
          <View style={[styles.letterCircle, { backgroundColor: color }]}>
            <Text style={styles.letterText}>{letter}</Text>
          </View>
          <View style={styles.headerText}>
            <Text style={styles.title}>{info.title}</Text>
            <Text style={styles.description} numberOfLines={1}>
              {info.description}
            </Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          {isFilled && !isExpanded && (
            <MaterialIcons name="check" size={20} color="#10b981" />
          )}
          <MaterialIcons
            name={isExpanded ? 'expand-less' : 'expand-more'}
            size={24}
            color="#999"
          />
        </View>
      </TouchableOpacity>

      {/* Expanded Content */}
      {isExpanded && (
        <View style={styles.content}>
          <View style={styles.helpContainer}>
            <MaterialIcons name={info.icon} size={16} color={color} />
            <Text style={styles.helpText}>{info.description}</Text>
          </View>
          <TextInput
            style={[styles.input, { borderColor: color }]}
            value={value || ''}
            onChangeText={onChangeValue}
            placeholder={info.placeholder}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            maxLength={500}
          />
          <Text style={styles.charCount}>
            {value?.length || 0}/500
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 12,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  letterCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  letterText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  description: {
    fontSize: 13,
    color: '#666',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 8,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  helpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: '#f5f5f5',
    borderRadius: 6,
  },
  helpText: {
    flex: 1,
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    borderWidth: 1.5,
    minHeight: 100,
  },
  charCount: {
    fontSize: 11,
    color: '#999',
    textAlign: 'right',
    marginTop: 4,
  },
});
