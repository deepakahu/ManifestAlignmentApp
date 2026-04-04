/**
 * DisciplineHomeScreen
 *
 * Main screen for the Discipline Tracking system
 * Shows all categories with stats and allows navigation to category details
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
  ActionSheetIOS,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import type { Category } from '@manifestation/shared';
import { categoryRepository } from '../../repositories/CategoryRepository';
import { CategoryList } from '../../components/discipline/category/CategoryList';
import { CategoryForm, CategoryFormData } from '../../components/discipline/category/CategoryForm';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

type Props = NativeStackScreenProps<any, 'DisciplineHome'>;

export function DisciplineHomeScreen({ navigation }: Props) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  // Load categories
  const loadCategories = useCallback(async () => {
    try {
      const data = await categoryRepository.getAll();
      setCategories(data);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load categories');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  // Refresh handler
  const handleRefresh = () => {
    setRefreshing(true);
    loadCategories();
  };

  // Navigate to category details
  const handleCategoryPress = (category: Category) => {
    navigation.navigate('CategoryDetail', { categoryId: category.id });
  };

  // Show category options menu
  const handleCategoryLongPress = (category: Category) => {
    const options = category.isArchived
      ? ['Restore', 'Delete Permanently', 'Cancel']
      : ['Edit', 'Archive', 'Cancel'];

    const destructiveButtonIndex = category.isArchived ? 1 : 1;
    const cancelButtonIndex = options.length - 1;

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          destructiveButtonIndex,
          cancelButtonIndex,
        },
        (buttonIndex) => {
          if (category.isArchived) {
            if (buttonIndex === 0) handleRestore(category);
            if (buttonIndex === 1) handleDelete(category);
          } else {
            if (buttonIndex === 0) handleEdit(category);
            if (buttonIndex === 1) handleArchive(category);
          }
        }
      );
    } else {
      // Android: Use Alert as fallback
      Alert.alert(
        category.name,
        'Choose an action',
        category.isArchived
          ? [
              { text: 'Restore', onPress: () => handleRestore(category) },
              {
                text: 'Delete Permanently',
                onPress: () => handleDelete(category),
                style: 'destructive',
              },
              { text: 'Cancel', style: 'cancel' },
            ]
          : [
              { text: 'Edit', onPress: () => handleEdit(category) },
              {
                text: 'Archive',
                onPress: () => handleArchive(category),
                style: 'destructive',
              },
              { text: 'Cancel', style: 'cancel' },
            ]
      );
    }
  };

  // Create new category
  const handleCreate = async (data: CategoryFormData) => {
    try {
      await categoryRepository.create(data);
      setShowForm(false);
      loadCategories();
    } catch (error: any) {
      throw error; // Let form handle the error
    }
  };

  // Edit category
  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setShowForm(true);
  };

  const handleUpdate = async (data: CategoryFormData) => {
    if (!editingCategory) return;

    try {
      await categoryRepository.update(editingCategory.id, data);
      setShowForm(false);
      setEditingCategory(null);
      loadCategories();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update category');
    }
  };

  // Archive category
  const handleArchive = (category: Category) => {
    Alert.alert(
      'Archive Category',
      `Are you sure you want to archive "${category.name}"? You can restore it later.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Archive',
          style: 'destructive',
          onPress: async () => {
            try {
              await categoryRepository.archive(category.id);
              loadCategories();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to archive category');
            }
          },
        },
      ]
    );
  };

  // Restore category
  const handleRestore = async (category: Category) => {
    try {
      await categoryRepository.restore(category.id);
      loadCategories();
    } catch (error: any) {
      if (error.message === 'TIER_LIMIT_REACHED') {
        Alert.alert(
          'Category Limit Reached',
          'You have reached the maximum number of active categories for your plan. Upgrade to Pro for unlimited categories.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Error', error.message || 'Failed to restore category');
      }
    }
  };

  // Delete category permanently
  const handleDelete = (category: Category) => {
    Alert.alert(
      'Delete Category',
      `Are you sure you want to permanently delete "${category.name}"? This will also delete all goals and activities in this category. This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await categoryRepository.delete(category.id);
              loadCategories();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete category');
            }
          },
        },
      ]
    );
  };

  // Check if user can create more categories
  const handleAddPress = async () => {
    try {
      const canCreate = await categoryRepository.canCreateMore();
      if (!canCreate) {
        Alert.alert(
          'Category Limit Reached',
          'You have reached the maximum number of categories for your plan. Upgrade to Pro for unlimited categories.',
          [
            { text: 'Maybe Later', style: 'cancel' },
            { text: 'Upgrade to Pro', onPress: () => navigation.navigate('Subscription') },
          ]
        );
        return;
      }
      setEditingCategory(null);
      setShowForm(true);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to check category limit');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Discipline Tracker</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setShowArchived(!showArchived)}
          >
            <MaterialIcons
              name={showArchived ? 'visibility-off' : 'visibility'}
              size={24}
              color="#666"
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.addButton} onPress={handleAddPress}>
            <MaterialIcons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Category List */}
      <CategoryList
        categories={categories}
        loading={loading}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        onCategoryPress={handleCategoryPress}
        onCategoryLongPress={handleCategoryLongPress}
        showArchived={showArchived}
      />

      {/* Form Modal */}
      <Modal
        visible={showForm}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setShowForm(false);
          setEditingCategory(null);
        }}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {editingCategory ? 'Edit Category' : 'New Category'}
            </Text>
          </View>
          <CategoryForm
            initialData={editingCategory || undefined}
            onSubmit={editingCategory ? handleUpdate : handleCreate}
            onCancel={() => {
              setShowForm(false);
              setEditingCategory(null);
            }}
            submitLabel={editingCategory ? 'Update Category' : 'Create Category'}
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  headerButton: {
    padding: 8,
  },
  addButton: {
    backgroundColor: '#6366f1',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
  },
});
