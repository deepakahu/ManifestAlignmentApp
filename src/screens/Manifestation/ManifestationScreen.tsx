import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { useNavigation } from '@react-navigation/native';
import { ManifestationEntry } from '../../types';

const { width } = Dimensions.get('window');

const ManifestationScreen = () => {
  const { state } = useApp();
  const navigation = useNavigation();

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
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };

  const truncateText = (text: string, maxLength: number = 120) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
  };

  const handleCreateNew = () => {
    navigation.navigate('ManifestationCreate' as never);
  };

  const handleCardPress = (manifestation: ManifestationEntry) => {
    navigation.navigate('ManifestationView' as never, { manifestation } as never);
  };

  const renderManifestationCard = (manifestation: ManifestationEntry) => (
    <TouchableOpacity
      key={manifestation.id}
      style={styles.card}
      onPress={() => handleCardPress(manifestation)}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleContainer}>
          <Text style={styles.cardTitle}>{manifestation.title}</Text>
          <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(manifestation.category) }]}>
            <Text style={styles.categoryText}>{manifestation.category}</Text>
          </View>
        </View>
        <View style={styles.cardActions}>
          <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
        </View>
      </View>
      
      <Text style={styles.cardDescription}>
        {truncateText(manifestation.description)}
      </Text>
      
      <View style={styles.cardFooter}>
        <Text style={styles.cardDate}>
          Created {formatDate(new Date(manifestation.createdAt))}
        </Text>
        {manifestation.isCompleted && (
          <View style={styles.completedBadge}>
            <Ionicons name="checkmark-circle" size={16} color="#059669" />
            <Text style={styles.completedText}>Manifested</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyEmoji}>✨</Text>
      <Text style={styles.emptyTitle}>Start Manifesting</Text>
      <Text style={styles.emptyText}>
        Create your first manifestation to begin turning your dreams into reality.
      </Text>
      <TouchableOpacity style={styles.emptyButton} onPress={handleCreateNew}>
        <Ionicons name="add" size={20} color="#fff" />
        <Text style={styles.emptyButtonText}>Create Manifestation</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Manifestations</Text>
        <Text style={styles.subtitle}>
          {state.manifestationEntries.length > 0 
            ? `${state.manifestationEntries.length} manifestation${state.manifestationEntries.length === 1 ? '' : 's'}`
            : 'Turn your dreams into reality'
          }
        </Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {state.manifestationEntries.length === 0 ? (
          renderEmptyState()
        ) : (
          <View style={styles.cardsContainer}>
            {state.manifestationEntries
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .map(renderManifestationCard)
            }
          </View>
        )}
      </ScrollView>

      {state.manifestationEntries.length > 0 && (
        <TouchableOpacity 
          style={styles.fab} 
          onPress={handleCreateNew}
        >
          <Ionicons 
            name="add" 
            size={28} 
            color="#fff" 
          />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
  },
  content: {
    flex: 1,
  },
  cardsContainer: {
    padding: 20,
    paddingBottom: 100, // Space for FAB
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardTitleContainer: {
    flex: 1,
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  cardActions: {
    padding: 4,
  },
  cardDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: '#64748b',
    marginBottom: 16,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  completedText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
    marginLeft: 4,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    minHeight: 400,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    maxWidth: 280,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6366f1',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});

export default ManifestationScreen;