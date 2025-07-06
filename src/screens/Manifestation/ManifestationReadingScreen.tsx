import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  PanResponder,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ManifestationEntry, ManifestationReadEntry } from '../../types';

const { width, height } = Dimensions.get('window');
const SWIPE_THRESHOLD = 50;

const ManifestationReadingScreen = () => {
  const { state, updateManifestationEntry } = useApp();
  const navigation = useNavigation();
  const route = useRoute();
  
  const params = route.params as any;
  const moodEntryId = params?.moodEntryId as string | undefined;
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [readStartTime, setReadStartTime] = useState<Date>(new Date());
  const [cardStartTime, setCardStartTime] = useState<Date>(new Date());
  const translateX = useRef(new Animated.Value(0)).current;

  // Filter out manifestations without descriptions and not completed
  const manifestations = state.manifestationEntries.filter(
    m => m.description && m.description.trim() && !m.isCompleted
  );

  useEffect(() => {
    setCardStartTime(new Date());
    
  }, [currentIndex]);

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

  const getCategoryGradient = (category: string) => {
    const gradients = {
      'Personal': ['#6366f1', '#8b5cf6'],
      'Career': ['#059669', '#10b981'],
      'Health': ['#dc2626', '#ef4444'],
      'Relationships': ['#ea580c', '#f97316'],
      'Financial': ['#7c3aed', '#a855f7'],
      'Spiritual': ['#0891b2', '#06b6d4'],
    };
    return gradients[category as keyof typeof gradients] || ['#6b7280', '#9ca3af'];
  };

  const recordReadingTime = async (manifestationId: string, duration: number) => {
    try {
      const manifestation = manifestations.find(m => m.id === manifestationId);
      if (!manifestation) return;

      const readEntry: ManifestationReadEntry = {
        readAt: new Date(),
        moodEntryId,
        readDuration: duration,
      };

      const updatedHistory = [...(manifestation.readHistory || []), readEntry];
      
      await updateManifestationEntry(manifestationId, {
        readHistory: updatedHistory,
      });

      console.log(`Recorded reading: ${manifestation.title} for ${duration}s`);
    } catch (error) {
      console.error('Error recording reading time:', error);
    }
  };

  const handleNextCard = () => {
    if (currentIndex < manifestations.length - 1) {
      // Record time spent on current card
      const currentManifestation = manifestations[currentIndex];
      const timeSpent = Math.round((new Date().getTime() - cardStartTime.getTime()) / 1000);
      recordReadingTime(currentManifestation.id, timeSpent);
      
      setCurrentIndex(currentIndex + 1);
      
      // Reset animation
      Animated.timing(translateX, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  };

  const handlePrevCard = () => {
    if (currentIndex > 0) {
      // Record time spent on current card
      const currentManifestation = manifestations[currentIndex];
      const timeSpent = Math.round((new Date().getTime() - cardStartTime.getTime()) / 1000);
      recordReadingTime(currentManifestation.id, timeSpent);
      
      setCurrentIndex(currentIndex - 1);
      
      // Reset animation
      Animated.timing(translateX, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  };

  const handleDone = async () => {
    // Record time spent on current card
    if (manifestations.length > 0) {
      const currentManifestation = manifestations[currentIndex];
      const timeSpent = Math.round((new Date().getTime() - cardStartTime.getTime()) / 1000);
      await recordReadingTime(currentManifestation.id, timeSpent);
    }

    const totalTime = Math.round((new Date().getTime() - readStartTime.getTime()) / 1000);
    console.log(`Total reading session: ${totalTime}s`);
    
    navigation.navigate('MainTabs' as never, { screen: 'Home' } as never);
  };

  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (_, gestureState) => {
      return Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
    },
    onPanResponderMove: (_, gestureState) => {
      translateX.setValue(gestureState.dx);
    },
    onPanResponderRelease: (_, gestureState) => {
      const { dx } = gestureState;
      
      if (dx > SWIPE_THRESHOLD && currentIndex > 0) {
        // Swipe right - go to previous
        Animated.timing(translateX, {
          toValue: width,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          handlePrevCard();
        });
      } else if (dx < -SWIPE_THRESHOLD && currentIndex < manifestations.length - 1) {
        // Swipe left - go to next
        Animated.timing(translateX, {
          toValue: -width,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          handleNextCard();
        });
      } else {
        // Snap back to center
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      }
    },
  });

  if (manifestations.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="sparkles-outline" size={64} color="#9ca3af" />
        <Text style={styles.emptyTitle}>No Manifestations to Read</Text>
        <Text style={styles.emptyText}>
          Create some manifestations first to unlock this beautiful reading experience.
        </Text>
        <TouchableOpacity style={styles.emptyButton} onPress={handleDone}>
          <Text style={styles.emptyButtonText}>Got it</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentManifestation = manifestations[currentIndex];
  const [primaryColor, secondaryColor] = getCategoryGradient(currentManifestation.category);


  return (
    <View style={[styles.container, { backgroundColor: primaryColor }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.doneButton} onPress={handleDone}>
          <Ionicons name="close" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manifestation Reading</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${((currentIndex + 1) / manifestations.length) * 100}%` }
            ]} 
          />
        </View>
        <Text style={styles.progressText}>
          {currentIndex + 1} of {manifestations.length}
        </Text>
      </View>

      {/* Card Container */}
      <View style={styles.cardContainer}>
        <Animated.View
          style={[
            styles.card,
            {
              transform: [{ translateX }],
              backgroundColor: '#fff',
            }
          ]}
          {...panResponder.panHandlers}
        >
          {/* Category Badge */}
          <View style={[styles.categoryBadge, { backgroundColor: primaryColor }]}>
            <Text style={styles.categoryText}>{currentManifestation.category}</Text>
          </View>

          {/* Title */}
          <Text style={styles.cardTitle}>{currentManifestation.title}</Text>

          {/* Description */}
          <Text style={styles.cardDescription}>{currentManifestation.description}</Text>

          {/* Decorative Elements */}
          <View style={styles.decorativeContainer}>
            <Ionicons name="sparkles" size={20} color={primaryColor} />
            <Text style={[styles.manifestText, { color: primaryColor }]}>
              I am manifesting this into reality
            </Text>
            <Ionicons name="sparkles" size={20} color={primaryColor} />
          </View>
        </Animated.View>
      </View>

      {/* Navigation Controls */}
      <View style={styles.navigationContainer}>
        <TouchableOpacity
          style={[
            styles.navButton,
            currentIndex === 0 && styles.navButtonDisabled
          ]}
          onPress={handlePrevCard}
          disabled={currentIndex === 0}
        >
          <Ionicons 
            name="chevron-back" 
            size={24} 
            color={currentIndex === 0 ? "#ffffff80" : "#fff"} 
          />
        </TouchableOpacity>

        <View style={styles.swipeIndicator}>
          <Ionicons name="swap-horizontal" size={24} color="#ffffff80" />
          <Text style={styles.swipeText}>Swipe to navigate</Text>
        </View>

        <TouchableOpacity
          style={[
            styles.navButton,
            currentIndex === manifestations.length - 1 && styles.navButtonDisabled
          ]}
          onPress={handleNextCard}
          disabled={currentIndex === manifestations.length - 1}
        >
          <Ionicons 
            name="chevron-forward" 
            size={24} 
            color={currentIndex === manifestations.length - 1 ? "#ffffff80" : "#fff"} 
          />
        </TouchableOpacity>
      </View>

      {/* Bottom Action */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity style={styles.doneBottomButton} onPress={handleDone}>
          <Text style={styles.doneBottomButtonText}>Done Reading</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  doneButton: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  headerSpacer: {
    width: 32,
  },
  progressContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#ffffff30',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 2,
  },
  progressText: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    opacity: 0.8,
  },
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 32,
    minHeight: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  categoryBadge: {
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 24,
  },
  categoryText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  cardTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 36,
  },
  cardDescription: {
    fontSize: 18,
    lineHeight: 28,
    color: '#475569',
    textAlign: 'center',
    marginBottom: 32,
  },
  decorativeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 'auto',
  },
  manifestText: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    marginHorizontal: 12,
    fontStyle: 'italic',
  },
  navigationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 20,
  },
  navButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ffffff20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navButtonDisabled: {
    backgroundColor: '#ffffff10',
  },
  swipeIndicator: {
    alignItems: 'center',
  },
  swipeText: {
    color: '#ffffff80',
    fontSize: 12,
    marginTop: 4,
  },
  bottomContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 20,
  },
  doneBottomButton: {
    backgroundColor: '#ffffff20',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ffffff30',
  },
  doneBottomButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginTop: 24,
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  emptyButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ManifestationReadingScreen;