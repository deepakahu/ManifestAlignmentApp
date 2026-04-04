/**
 * CategoryForm Component
 *
 * Form for creating or editing a category
 * Includes name, description, icon picker, and color picker
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import type { Category } from '@manifestation/shared';
import { CategorySchema } from '@manifestation/shared';
import { MaterialIcons } from '@expo/vector-icons';

interface CategoryFormProps {
  initialData?: Partial<Category>;
  onSubmit: (data: CategoryFormData) => void | Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
}

export interface CategoryFormData {
  name: string;
  description?: string;
  icon?: string;
  color: string;
}

// Predefined icons (emojis)
const ICON_OPTIONS = [
  '🙏', '💪', '💼', '💰', '❤️', '🧘', '📚', '🎯',
  '🏃', '🍎', '💡', '🎨', '🎵', '🌟', '🔥', '✨',
];

// Predefined colors
const COLOR_OPTIONS = [
  '#6366f1', // Indigo
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#ef4444', // Red
  '#f59e0b', // Amber
  '#10b981', // Green
  '#06b6d4', // Cyan
  '#3b82f6', // Blue
];

export function CategoryForm({
  initialData,
  onSubmit,
  onCancel,
  submitLabel = 'Save Category',
}: CategoryFormProps) {
  const [name, setName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [selectedIcon, setSelectedIcon] = useState(initialData?.icon || ICON_OPTIONS[0]);
  const [selectedColor, setSelectedColor] = useState(initialData?.color || COLOR_OPTIONS[0]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    // Validate with Zod schema
    const result = CategorySchema.safeParse({
      name,
      description: description || undefined,
      icon: selectedIcon,
      color: selectedColor,
    });

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim() || undefined,
        icon: selectedIcon,
        color: selectedColor,
      });
    } catch (error: any) {
      if (error.message === 'TIER_LIMIT_REACHED') {
        Alert.alert(
          'Category Limit Reached',
          'You have reached the maximum number of categories for your plan. Upgrade to Pro for unlimited categories.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Error', error.message || 'Failed to save category');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Name Input */}
      <View style={styles.section}>
        <Text style={styles.label}>Category Name *</Text>
        <TextInput
          style={[styles.input, errors.name && styles.inputError]}
          value={name}
          onChangeText={(text) => {
            setName(text);
            setErrors({ ...errors, name: '' });
          }}
          placeholder="e.g., Spiritual Growth"
          maxLength={50}
          autoFocus
        />
        {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
      </View>

      {/* Description Input */}
      <View style={styles.section}>
        <Text style={styles.label}>Description (Optional)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder="What does this category represent?"
          multiline
          numberOfLines={3}
          maxLength={200}
        />
        <Text style={styles.charCount}>{description.length}/200</Text>
      </View>

      {/* Icon Picker */}
      <View style={styles.section}>
        <Text style={styles.label}>Icon</Text>
        <View style={styles.iconGrid}>
          {ICON_OPTIONS.map((icon) => (
            <TouchableOpacity
              key={icon}
              style={[
                styles.iconOption,
                selectedIcon === icon && styles.iconOptionSelected,
              ]}
              onPress={() => setSelectedIcon(icon)}
            >
              <Text style={styles.iconText}>{icon}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Color Picker */}
      <View style={styles.section}>
        <Text style={styles.label}>Color</Text>
        <View style={styles.colorGrid}>
          {COLOR_OPTIONS.map((color) => (
            <TouchableOpacity
              key={color}
              style={[
                styles.colorOption,
                { backgroundColor: color },
                selectedColor === color && styles.colorOptionSelected,
              ]}
              onPress={() => setSelectedColor(color)}
            >
              {selectedColor === color && (
                <MaterialIcons name="check" size={20} color="#fff" />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Preview */}
      <View style={styles.section}>
        <Text style={styles.label}>Preview</Text>
        <View style={[styles.preview, { backgroundColor: selectedColor + '15' }]}>
          <View style={[styles.previewIcon, { backgroundColor: selectedColor }]}>
            <Text style={styles.previewIconText}>{selectedIcon}</Text>
          </View>
          <View style={styles.previewText}>
            <Text style={styles.previewName}>{name || 'Category Name'}</Text>
            <Text style={styles.previewDesc}>{description || 'Category description'}</Text>
          </View>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.button, styles.cancelButton]}
          onPress={onCancel}
          disabled={isSubmitting}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.button,
            styles.submitButton,
            { backgroundColor: selectedColor },
            isSubmitting && styles.buttonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={isSubmitting || !name.trim()}
        >
          <Text style={styles.submitButtonText}>
            {isSubmitting ? 'Saving...' : submitLabel}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 4,
  },
  charCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 4,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  iconOption: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  iconOptionSelected: {
    borderColor: '#6366f1',
    backgroundColor: '#fff',
  },
  iconText: {
    fontSize: 24,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorOption: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'transparent',
  },
  colorOptionSelected: {
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  preview: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
  },
  previewIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  previewIconText: {
    fontSize: 24,
  },
  previewText: {
    flex: 1,
  },
  previewName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  previewDesc: {
    fontSize: 14,
    color: '#666',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    paddingBottom: 32,
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
  },
  submitButton: {
    backgroundColor: '#6366f1',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
