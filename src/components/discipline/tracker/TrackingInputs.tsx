/**
 * TrackingInputs
 *
 * Tracking type-specific input components
 * Handles: Boolean, Number, MultiSelect, Text
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface TrackingInputsProps {
  trackingType: 'boolean' | 'number' | 'multiselect' | 'text';
  targetConfig: any;
  value: any;
  onChange: (value: any) => void;
}

export function TrackingInputs({
  trackingType,
  targetConfig,
  value,
  onChange,
}: TrackingInputsProps) {
  switch (trackingType) {
    case 'boolean':
      return <BooleanInput value={value} onChange={onChange} targetConfig={targetConfig} />;
    case 'number':
      return <NumberInput value={value} onChange={onChange} targetConfig={targetConfig} />;
    case 'multiselect':
      return <MultiSelectInput value={value} onChange={onChange} targetConfig={targetConfig} />;
    case 'text':
      return <TextInput_ value={value} onChange={onChange} targetConfig={targetConfig} />;
    default:
      return null;
  }
}

// Boolean Input Component
function BooleanInput({
  value,
  onChange,
  targetConfig,
}: {
  value: boolean;
  onChange: (value: boolean) => void;
  targetConfig: any;
}) {
  const config = targetConfig as { label?: string };
  const label = config.label || 'Mark as completed';

  return (
    <View style={styles.booleanContainer}>
      <TouchableOpacity
        style={[styles.booleanButton, value && styles.booleanButtonActive]}
        onPress={() => onChange(!value)}
        activeOpacity={0.7}
      >
        <View style={[styles.checkbox, value && styles.checkboxChecked]}>
          {value && <MaterialIcons name="check" size={32} color="#fff" />}
        </View>
        <Text style={[styles.booleanLabel, value && styles.booleanLabelActive]}>
          {label}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// Number Input Component
function NumberInput({
  value,
  onChange,
  targetConfig,
}: {
  value: string;
  onChange: (value: string) => void;
  targetConfig: any;
}) {
  const config = targetConfig as {
    target?: number;
    min?: number;
    max?: number;
    unit?: string;
    label?: string;
  };

  const displayValue = value || '';
  const numValue = parseFloat(displayValue);
  const isValid = !isNaN(numValue);

  return (
    <View style={styles.numberContainer}>
      <Text style={styles.numberLabel}>
        {config.label || 'Enter value'}
      </Text>

      {config.target && (
        <Text style={styles.targetText}>Target: {config.target} {config.unit || ''}</Text>
      )}

      <View style={styles.numberInputWrapper}>
        <TextInput
          style={styles.numberInput}
          value={displayValue}
          onChangeText={onChange}
          keyboardType="decimal-pad"
          placeholder="0"
          placeholderTextColor="#999"
        />
        {config.unit && (
          <Text style={styles.unitText}>{config.unit}</Text>
        )}
      </View>

      {/* Range indicators */}
      {(config.min !== undefined || config.max !== undefined) && (
        <Text style={styles.rangeText}>
          {config.min !== undefined && config.max !== undefined
            ? `Range: ${config.min} - ${config.max}`
            : config.min !== undefined
            ? `Minimum: ${config.min}`
            : `Maximum: ${config.max}`}
        </Text>
      )}

      {/* Value comparison */}
      {isValid && config.target && (
        <Text
          style={[
            styles.comparisonText,
            numValue >= config.target ? styles.comparisonGood : styles.comparisonBad,
          ]}
        >
          {numValue >= config.target
            ? `✓ Reached target (+${numValue - config.target})`
            : `${config.target - numValue} away from target`}
        </Text>
      )}
    </View>
  );
}

// MultiSelect Input Component
function MultiSelectInput({
  value,
  onChange,
  targetConfig,
}: {
  value: string[];
  onChange: (value: string[]) => void;
  targetConfig: any;
}) {
  const config = targetConfig as {
    options: string[];
    minSelect?: number;
    maxSelect?: number;
  };

  const selectedValues = Array.isArray(value) ? value : [];

  const toggleOption = (option: string) => {
    if (selectedValues.includes(option)) {
      // Deselect - check minSelect
      if (config.minSelect && selectedValues.length <= config.minSelect) {
        return; // Can't deselect below minimum
      }
      onChange(selectedValues.filter((v) => v !== option));
    } else {
      // Select - check maxSelect
      if (config.maxSelect && selectedValues.length >= config.maxSelect) {
        return; // Can't select above maximum
      }
      onChange([...selectedValues, option]);
    }
  };

  return (
    <View style={styles.multiSelectContainer}>
      <Text style={styles.multiSelectLabel}>Select options:</Text>

      {(config.minSelect || config.maxSelect) && (
        <Text style={styles.multiSelectHint}>
          {config.minSelect && config.maxSelect
            ? `Select ${config.minSelect}-${config.maxSelect} options`
            : config.minSelect
            ? `Select at least ${config.minSelect}`
            : `Select up to ${config.maxSelect}`}
        </Text>
      )}

      <View style={styles.optionsGrid}>
        {config.options?.map((option) => {
          const isSelected = selectedValues.includes(option);
          const canDeselect = !config.minSelect || selectedValues.length > config.minSelect;
          const canSelect = !config.maxSelect || selectedValues.length < config.maxSelect;
          const isDisabled = isSelected ? !canDeselect : !canSelect;

          return (
            <TouchableOpacity
              key={option}
              style={[
                styles.optionChip,
                isSelected && styles.optionChipSelected,
                isDisabled && styles.optionChipDisabled,
              ]}
              onPress={() => toggleOption(option)}
              disabled={isDisabled}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.optionChipText,
                  isSelected && styles.optionChipTextSelected,
                ]}
              >
                {option}
              </Text>
              {isSelected && (
                <MaterialIcons name="check" size={16} color="#fff" style={styles.optionCheckIcon} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.selectedCount}>
        {selectedValues.length} selected
      </Text>
    </View>
  );
}

// Text Input Component
function TextInput_({
  value,
  onChange,
  targetConfig,
}: {
  value: string;
  onChange: (value: string) => void;
  targetConfig: any;
}) {
  const config = targetConfig as {
    placeholder?: string;
    required?: boolean;
    maxLength?: number;
  };

  const displayValue = value || '';
  const characterCount = displayValue.length;

  return (
    <View style={styles.textContainer}>
      <Text style={styles.textLabel}>
        {config.required ? 'Enter text (required)' : 'Enter text'}
      </Text>

      <TextInput
        style={styles.textInput}
        value={displayValue}
        onChangeText={onChange}
        placeholder={config.placeholder || 'Type here...'}
        placeholderTextColor="#999"
        multiline
        numberOfLines={6}
        textAlignVertical="top"
        maxLength={config.maxLength}
      />

      <View style={styles.textFooter}>
        <Text style={styles.characterCount}>
          {characterCount} {config.maxLength ? `/ ${config.maxLength}` : ''} characters
        </Text>
        {config.required && displayValue.trim() === '' && (
          <Text style={styles.requiredIndicator}>* Required</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Boolean Styles
  booleanContainer: {
    paddingVertical: 12,
  },
  booleanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  booleanButtonActive: {
    backgroundColor: '#f0f0ff',
    borderColor: '#6366f1',
  },
  checkbox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#cbd5e1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  checkboxChecked: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  booleanLabel: {
    fontSize: 18,
    fontWeight: '500',
    color: '#666',
  },
  booleanLabelActive: {
    color: '#000',
    fontWeight: '600',
  },

  // Number Styles
  numberContainer: {
    paddingVertical: 12,
  },
  numberLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  targetText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  numberInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    paddingHorizontal: 20,
  },
  numberInput: {
    flex: 1,
    fontSize: 36,
    fontWeight: '600',
    color: '#000',
    paddingVertical: 16,
    textAlign: 'center',
  },
  unitText: {
    fontSize: 20,
    fontWeight: '500',
    color: '#666',
    marginLeft: 8,
  },
  rangeText: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  comparisonText: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 12,
    textAlign: 'center',
  },
  comparisonGood: {
    color: '#22c55e',
  },
  comparisonBad: {
    color: '#ef4444',
  },

  // MultiSelect Styles
  multiSelectContainer: {
    paddingVertical: 12,
  },
  multiSelectLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  multiSelectHint: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#f8fafc',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  optionChipSelected: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  optionChipDisabled: {
    opacity: 0.5,
  },
  optionChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  optionChipTextSelected: {
    color: '#fff',
  },
  optionCheckIcon: {
    marginLeft: 4,
  },
  selectedCount: {
    fontSize: 12,
    color: '#666',
    marginTop: 12,
    textAlign: 'center',
  },

  // Text Styles
  textContainer: {
    paddingVertical: 12,
  },
  textLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  textInput: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    padding: 16,
    fontSize: 16,
    color: '#000',
    minHeight: 150,
  },
  textFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  characterCount: {
    fontSize: 12,
    color: '#666',
  },
  requiredIndicator: {
    fontSize: 12,
    color: '#ef4444',
    fontWeight: '500',
  },
});
