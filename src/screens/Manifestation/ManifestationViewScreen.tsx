import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ManifestationEntry } from '../../types';

const ManifestationViewScreen = () => {
  const { updateManifestationEntry, deleteManifestationEntry } = useApp();
  const navigation = useNavigation();
  const route = useRoute();
  
  const params = route.params as any;
  const manifestation = params?.manifestation as ManifestationEntry;
  
  const [isLoading, setIsLoading] = useState(false);

  if (!manifestation) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Manifestation not found</Text>
        <TouchableOpacity
          style={styles.errorBackButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const getCategoryColor = (category: string) => {
    const colors = {
      'Personal': '#6366f1',
      'Career': '#059669',
      'Health': '#dc2626',
      'Relationships': '#ea580c',
      'Financial': '#7c3aed',
      'Spiritual': '#0891b2',
    };
    return colors[category as keyof typeof colors] || '#6b7280';
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const handleEdit = () => {
    navigation.navigate('ManifestationCreate' as never, { 
      manifestation: {
        ...manifestation,
        createdAt: manifestation.createdAt.toISOString(),
        completedAt: manifestation.completedAt?.toISOString(),
      }
    } as never);
  };

  const handleToggleComplete = async () => {
    setIsLoading(true);
    try {
      await updateManifestationEntry(manifestation.id, {
        isCompleted: !manifestation.isCompleted,
        completedAt: !manifestation.isCompleted ? new Date() : undefined,
      });
      
      const message = !manifestation.isCompleted 
        ? 'Congratulations! Your manifestation is now marked as complete! 🎉'
        : 'Manifestation marked as incomplete.';
      
      Alert.alert('Success', message, [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      console.error('Error updating manifestation:', error);
      Alert.alert('Error', 'Failed to update manifestation status.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Manifestation',
      'Are you sure you want to delete this manifestation? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            try {
              await deleteManifestationEntry(manifestation.id);
              navigation.goBack();
            } catch (error) {
              console.error('Error deleting manifestation:', error);
              Alert.alert('Error', 'Failed to delete manifestation.');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleMoreOptions = () => {
    Alert.alert(
      'Options',
      'What would you like to do?',
      [
        { text: 'Edit', onPress: handleEdit },
        { 
          text: manifestation.isCompleted ? 'Mark Incomplete' : 'Mark Complete',
          onPress: handleToggleComplete 
        },
        { text: 'Delete', style: 'destructive', onPress: handleDelete },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#64748b" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Manifestation</Text>
        </View>
        <TouchableOpacity
          style={styles.moreButton}
          onPress={handleMoreOptions}
          disabled={isLoading}
        >
          <Ionicons name="ellipsis-horizontal" size={24} color="#64748b" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.titleContainer}>
              <Text style={styles.title}>{manifestation.title}</Text>
              <View style={[
                styles.categoryBadge,
                { backgroundColor: getCategoryColor(manifestation.category) }
              ]}>
                <Text style={styles.categoryText}>{manifestation.category}</Text>
              </View>
            </View>
            
            {manifestation.isCompleted && (
              <View style={styles.completedBadge}>
                <Ionicons name="checkmark-circle" size={20} color="#059669" />
                <Text style={styles.completedText}>Manifested!</Text>
              </View>
            )}
          </View>

          {manifestation.description ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.description}>{manifestation.description}</Text>
            </View>
          ) : (
            <View style={styles.emptyDescription}>
              <Text style={styles.emptyDescriptionText}>
                No description added yet. Tap Edit to add one.
              </Text>
            </View>
          )}

          <View style={styles.metaSection}>
            <View style={styles.metaRow}>
              <Ionicons name="calendar" size={16} color="#9ca3af" />
              <Text style={styles.metaText}>
                Created {formatDate(new Date(manifestation.createdAt))}
              </Text>
            </View>
            
            {manifestation.isCompleted && manifestation.completedAt && (
              <View style={styles.metaRow}>
                <Ionicons name="trophy" size={16} color="#059669" />
                <Text style={styles.metaText}>
                  Manifested {formatDate(new Date(manifestation.completedAt))}
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.actionSection}>
          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.editButton,
              isLoading && styles.actionButtonDisabled
            ]}
            onPress={handleEdit}
            disabled={isLoading}
          >
            <Ionicons name="create" size={20} color="#6366f1" />
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionButton,
              manifestation.isCompleted ? styles.incompleteButton : styles.completeButton,
              isLoading && styles.actionButtonDisabled
            ]}
            onPress={handleToggleComplete}
            disabled={isLoading}
          >
            <Ionicons 
              name={manifestation.isCompleted ? "close-circle" : "checkmark-circle"} 
              size={20} 
              color={manifestation.isCompleted ? "#64748b" : "#fff"} 
            />
            <Text style={[
              styles.actionButtonText,
              manifestation.isCompleted ? styles.incompleteButtonText : styles.completeButtonText
            ]}>
              {manifestation.isCompleted ? 'Mark Incomplete' : 'Mark Complete'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backButton: {
    padding: 4,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  moreButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  card: {
    backgroundColor: '#fff',
    margin: 20,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardHeader: {
    marginBottom: 20,
  },
  titleContainer: {
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 12,
    lineHeight: 32,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dcfce7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  completedText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
    marginLeft: 6,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: '#64748b',
  },
  emptyDescription: {
    backgroundColor: '#f8fafc',
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
  },
  emptyDescriptionText: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  metaSection: {
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 16,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  metaText: {
    fontSize: 14,
    color: '#9ca3af',
    marginLeft: 8,
  },
  actionSection: {
    padding: 20,
    paddingTop: 0,
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  editButton: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6366f1',
    marginLeft: 8,
  },
  completeButton: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  incompleteButton: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  completeButtonText: {
    color: '#fff',
  },
  incompleteButtonText: {
    color: '#64748b',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8fafc',
  },
  errorText: {
    fontSize: 18,
    color: '#ef4444',
    marginBottom: 20,
  },
  errorBackButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ManifestationViewScreen;