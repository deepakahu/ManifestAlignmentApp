/**
 * CategoryDetailScreen
 *
 * Shows a category with all its goals
 * Allows creating new goals and navigating to goal details
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
import type { Category, Goal } from '@manifestation/shared';
import { categoryRepository } from '../../repositories/CategoryRepository';
import { goalRepository } from '../../repositories/GoalRepository';
import { GoalList } from '../../components/discipline/goal/GoalList';
import { GoalForm, GoalFormData } from '../../components/discipline/goal/GoalForm';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

type Props = NativeStackScreenProps<any, 'CategoryDetail'>;

export function CategoryDetailScreen({ navigation, route }: Props) {
  const { categoryId } = route.params as { categoryId: string };
  const [category, setCategory] = useState<Category | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  // Load category and goals
  const loadData = useCallback(async () => {
    try {
      const [categoryData, goalsData] = await Promise.all([
        categoryRepository.getById(categoryId),
        goalRepository.getByCategory(categoryId),
      ]);

      if (!categoryData) {
        Alert.alert('Error', 'Category not found');
        navigation.goBack();
        return;
      }

      setCategory(categoryData);
      setGoals(goalsData);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [categoryId, navigation]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (category) {
      navigation.setOptions({
        title: category.name,
        headerStyle: {
          backgroundColor: category.color,
        },
        headerTintColor: '#fff',
      });
    }
  }, [category, navigation]);

  // Refresh handler
  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // Navigate to goal details
  const handleGoalPress = (goal: Goal) => {
    navigation.navigate('GoalDetail', { goalId: goal.id });
  };

  // Show goal options menu
  const handleGoalLongPress = (goal: Goal) => {
    const options = ['View', 'Edit', 'Complete', 'Archive', 'Cancel'];
    const destructiveButtonIndex = 3;
    const cancelButtonIndex = 4;

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          destructiveButtonIndex,
          cancelButtonIndex,
        },
        (buttonIndex) => {
          if (buttonIndex === 0) handleGoalPress(goal);
          if (buttonIndex === 1) handleEdit(goal);
          if (buttonIndex === 2) handleComplete(goal);
          if (buttonIndex === 3) handleArchive(goal);
        }
      );
    } else {
      Alert.alert(
        goal.title,
        'Choose an action',
        [
          { text: 'View', onPress: () => handleGoalPress(goal) },
          { text: 'Edit', onPress: () => handleEdit(goal) },
          { text: 'Complete', onPress: () => handleComplete(goal) },
          { text: 'Archive', onPress: () => handleArchive(goal), style: 'destructive' },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    }
  };

  // Create new goal
  const handleCreate = async (data: GoalFormData) => {
    try {
      await goalRepository.create({
        ...data,
        categoryId,
      });
      setShowForm(false);
      loadData();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create goal');
    }
  };

  // Edit goal
  const handleEdit = (goal: Goal) => {
    setEditingGoal(goal);
    setShowForm(true);
  };

  const handleUpdate = async (data: GoalFormData) => {
    if (!editingGoal) return;

    try {
      await goalRepository.update(editingGoal.id, data);
      setShowForm(false);
      setEditingGoal(null);
      loadData();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update goal');
    }
  };

  // Complete goal
  const handleComplete = (goal: Goal) => {
    Alert.alert(
      'Complete Goal',
      `Mark "${goal.title}" as completed?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          onPress: async () => {
            try {
              await goalRepository.complete(goal.id);
              loadData();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to complete goal');
            }
          },
        },
      ]
    );
  };

  // Archive goal
  const handleArchive = (goal: Goal) => {
    Alert.alert(
      'Archive Goal',
      `Are you sure you want to archive "${goal.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Archive',
          style: 'destructive',
          onPress: async () => {
            try {
              await goalRepository.archive(goal.id);
              loadData();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to archive goal');
            }
          },
        },
      ]
    );
  };

  if (!category) return null;

  const activeGoals = goals.filter(g => g.status === 'active');
  const completedGoals = goals.filter(g => g.status === 'completed');

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Header Stats */}
      <View style={[styles.statsContainer, { backgroundColor: category.color + '15' }]}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{activeGoals.length}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{completedGoals.length}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{goals.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: category.color }]}
          onPress={() => {
            setEditingGoal(null);
            setShowForm(true);
          }}
        >
          <MaterialIcons name="add" size={24} color="#fff" />
          <Text style={styles.addButtonText}>New Goal</Text>
        </TouchableOpacity>
      </View>

      {/* Goals List */}
      <GoalList
        goals={goals}
        loading={loading}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        onGoalPress={handleGoalPress}
        onGoalLongPress={handleGoalLongPress}
        categoryColor={category.color}
        groupByStatus={true}
      />

      {/* Form Modal */}
      <Modal
        visible={showForm}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setShowForm(false);
          setEditingGoal(null);
        }}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {editingGoal ? 'Edit Goal' : 'New Goal'}
            </Text>
          </View>
          <GoalForm
            initialData={editingGoal || undefined}
            categoryId={categoryId}
            categoryColor={category.color}
            onSubmit={editingGoal ? handleUpdate : handleCreate}
            onCancel={() => {
              setShowForm(false);
              setEditingGoal(null);
            }}
            submitLabel={editingGoal ? 'Update Goal' : 'Create Goal'}
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
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 16,
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  addButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  addButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
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
