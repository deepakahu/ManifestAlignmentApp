import React, { useState, useEffect, useRef } from 'react';
import {View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Animated, PanResponder, Dimensions, Image} from 'react-native';
import {useApp} from '../../context/AppContext';
import {Ionicons} from '@expo/vector-icons';
import {AlarmService} from '../../services/AlarmService';
import {Alarm} from '../../types';
import { useFocusEffect } from '@react-navigation/native';

const { width } = Dimensions.get('window');

const HomeScreen = ({navigation}: any) => {
  const {state} = useApp();
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [currentManifestationIndex, setCurrentManifestationIndex] = useState(0);
  const translateX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadAlarms();
  }, []);

  // Refresh alarms when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadAlarms();
    }, [])
  );

  const loadAlarms = async () => {
    try {
      const allAlarms = await AlarmService.getAlarms();
      setAlarms(allAlarms);
    } catch (error) {
      console.error('Error loading alarms:', error);
    }
  };

  const getTodaysMoodEntries = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return state.moodEntries.filter(entry => {
      const entryDate = new Date(entry.timestamp);
      return entryDate >= today && entryDate < tomorrow;
    });
  };

  const getActiveAlarms = () => {
    return alarms.filter(alarm => alarm.isEnabled);
  };

  const getNextTriggerTime = (alarm: Alarm) => {
    if (!alarm.isEnabled) return null;
    
    // Use the alarm's nextTrigger if available, otherwise calculate
    if (alarm.nextTrigger) {
      return new Date(alarm.nextTrigger);
    }
    
    // Fallback calculation
    const now = new Date();
    const nextTrigger = new Date(now);
    const intervalHours = typeof alarm.interval === 'object' ? alarm.interval.hours : 0;
    const intervalMinutes = typeof alarm.interval === 'object' ? alarm.interval.minutes : 
                           (alarm.interval === 'test_mode' ? 1 : 0);
    nextTrigger.setHours(nextTrigger.getHours() + intervalHours);
    nextTrigger.setMinutes(nextTrigger.getMinutes() + intervalMinutes);
    
    return nextTrigger;
  };

  const formatNextTrigger = (alarm: Alarm) => {
    const nextTrigger = getNextTriggerTime(alarm);
    if (!nextTrigger) return { time: 'Disabled', relative: '' };
    
    const now = new Date();
    const diffMs = nextTrigger.getTime() - now.getTime();
    
    // Format the actual time
    const hours = nextTrigger.getHours();
    const minutes = nextTrigger.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const timeString = `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
    
    // Calculate relative time
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    let relativeTime = '';
    if (diffMs < 0) {
      relativeTime = 'Overdue';
    } else if (diffHours > 0) {
      relativeTime = `in ${diffHours}h ${diffMinutes}m`;
    } else if (diffMinutes > 0) {
      relativeTime = `in ${diffMinutes}m`;
    } else {
      relativeTime = 'Soon';
    }
    
    return { time: timeString, relative: relativeTime };
  };

  const handleCreateAlarm = () => {
    navigation.navigate('AlarmSetup');
  };

  const handleTrackMood = () => {
    navigation.navigate('MoodTracking');
  };

  const handleAlarmPress = (alarm: Alarm) => {
    navigation.navigate('AlarmSetup', {
      alarm: {
        ...alarm,
        createdAt: alarm.createdAt instanceof Date ? alarm.createdAt.getTime() : alarm.createdAt
      }
    });
  };

  const handleReadManifestations = () => {
    // Check if user has any manifestations
    if (state.manifestationEntries.length === 0) {
      Alert.alert(
        'No Manifestations Yet',
        'Create your first manifestation to start your mindfulness journey!',
        [
          {
            text: 'Create Now',
            onPress: () => navigation.navigate('ManifestationCreate')
          },
          {
            text: 'Later',
            style: 'cancel'
          }
        ]
      );
      return;
    }
    
    navigation.navigate('ManifestationReading', { 
      fromHome: true,
      timestamp: new Date().toISOString()
    });
  };

  const getActiveManifestations = () => {
    return state.manifestationEntries
      .filter(m => m.description && m.description.trim() && !m.isCompleted)
      .slice(0, 3); // Show max 3 manifestations
  };

  const handleSwipeLeft = () => {
    const manifestations = getActiveManifestations();
    if (manifestations.length === 0) return;
    
    const nextIndex = (currentManifestationIndex + 1) % manifestations.length;
    setCurrentManifestationIndex(nextIndex);
    
    Animated.sequence([
      Animated.timing(translateX, {
        toValue: -width,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(translateX, {
        toValue: 0,
        duration: 0,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleSwipeRight = () => {
    const manifestations = getActiveManifestations();
    if (manifestations.length === 0) return;
    
    const nextIndex = currentManifestationIndex === 0 ? manifestations.length - 1 : currentManifestationIndex - 1;
    setCurrentManifestationIndex(nextIndex);
    
    Animated.sequence([
      Animated.timing(translateX, {
        toValue: width,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(translateX, {
        toValue: 0,
        duration: 0,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (_, gestureState) => {
      return Math.abs(gestureState.dx) > 10;
    },
    onPanResponderMove: (_, gestureState) => {
      translateX.setValue(gestureState.dx);
    },
    onPanResponderRelease: (_, gestureState) => {
      if (Math.abs(gestureState.dx) > 50) {
        if (gestureState.dx > 0) {
          handleSwipeRight();
        } else {
          handleSwipeLeft();
        }
      } else {
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      }
    },
  });

  const getCategoryColor = (category: string) => {
    const colors = {
      'Personal': '#6366f1',
      'Career': '#059669',
      'Health': '#dc2626',
      'Relationships': '#ea580c',
      'Financial': '#7c3aed',
      'Spiritual': '#0891b2',
    };
    return colors[category as keyof typeof colors] || '#6366f1';
  };


  const todaysMoods = getTodaysMoodEntries();
  const activeAlarms = getActiveAlarms();

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Image 
            source={require('../../../assets/images/icons/manifestation-alarm-180.png')} 
            style={styles.logoImage}
          />
          <Text style={styles.headerTitle}>Manifestation Alarm</Text>
        </View>
        <TouchableOpacity 
          style={styles.settingsButton}
          onPress={() => navigation.navigate('Settings')}
        >
          <Ionicons name="settings" size={24} color="#6366f1" />
        </TouchableOpacity>
      </View>


      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{todaysMoods.length}</Text>
          <Text style={styles.statLabel}>Today's Moods</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{activeAlarms.length}</Text>
          <Text style={styles.statLabel}>Active Alarms</Text>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActionsContainer}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={styles.primaryButton}
            onPress={handleTrackMood}
          >
            <Ionicons name="happy" size={24} color="#fff" />
            <Text style={styles.primaryButtonText}>Track Mood Now</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.manifestationButton}
            onPress={handleReadManifestations}
          >
            <Ionicons name="sparkles" size={24} color="#7c3aed" />
            <Text style={styles.manifestationButtonText}>Read Your Manifestations</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Active Alarms Section */}
      <View style={styles.alarmsContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Active Alarms</Text>
          <TouchableOpacity 
            style={styles.viewAllButton}
            onPress={() => navigation.navigate('AlarmList')}
          >
            <Text style={styles.viewAllText}>View All</Text>
            <Ionicons name="chevron-forward" size={16} color="#6366f1" />
          </TouchableOpacity>
        </View>
        
        {activeAlarms.length === 0 ? (
          <View style={styles.emptyAlarmsCard}>
            <Ionicons name="alarm-outline" size={48} color="#9ca3af" />
            <Text style={styles.emptyAlarmsTitle}>No Active Alarms</Text>
            <Text style={styles.emptyAlarmsText}>
              Create your first mood tracking alarm to get started
            </Text>
            <TouchableOpacity 
              style={styles.createAlarmButton}
              onPress={handleCreateAlarm}
            >
              <Text style={styles.createAlarmButtonText}>Create Your First Alarm</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.alarmsList}>
            {activeAlarms.slice(0, 3).map((alarm) => (
              <TouchableOpacity
                key={alarm.id}
                style={styles.alarmCard}
                onPress={() => handleAlarmPress(alarm)}
              >
                <View style={styles.alarmInfo}>
                  <Text style={styles.alarmName}>{alarm.name}</Text>
                  <Text style={styles.alarmInterval}>
                    Every {typeof alarm.interval === 'object' ? `${alarm.interval.hours}h ${alarm.interval.minutes}m` : 'test mode'}
                  </Text>
                </View>
                <View style={styles.alarmTrigger}>
                  <Text style={styles.nextTriggerTime}>
                    {formatNextTrigger(alarm).time}
                  </Text>
                  <Text style={styles.nextTriggerLabel}>
                    {formatNextTrigger(alarm).relative}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
            
            {activeAlarms.length > 3 && (
              <TouchableOpacity 
                style={styles.moreAlarmsButton}
                onPress={() => navigation.navigate('AlarmList')}
              >
                <Text style={styles.moreAlarmsText}>
                  +{activeAlarms.length - 3} more alarms
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* Manifestation Preview */}
      {getActiveManifestations().length > 0 && (
        <View style={styles.manifestationPreviewContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Manifestations</Text>
            <TouchableOpacity
              style={styles.viewAllButton}
              onPress={handleReadManifestations}
            >
              <Text style={styles.viewAllText}>View All</Text>
              <Ionicons name="chevron-forward" size={16} color="#6366f1" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.manifestationCardContainer} {...panResponder.panHandlers}>
            <Animated.View
              style={[
                styles.manifestationCard,
                {
                  transform: [{ translateX }],
                },
              ]}
            >
              {getActiveManifestations().map((manifestation, index) => {
                if (index !== currentManifestationIndex) return null;
                
                return (
                  <View key={manifestation.id} style={styles.manifestationContent}>
                    <View style={styles.manifestationHeader}>
                      <View 
                        style={[
                          styles.categoryBadge, 
                          { backgroundColor: getCategoryColor(manifestation.category) }
                        ]}
                      >
                        <Text style={styles.categoryText}>{manifestation.category}</Text>
                      </View>
                      <Text style={styles.manifestationDate}>
                        {new Date(manifestation.createdAt).toLocaleDateString()}
                      </Text>
                    </View>
                    
                    <Text style={styles.manifestationTitle}>{manifestation.title}</Text>
                    <Text style={styles.manifestationDescription} numberOfLines={3}>
                      {manifestation.description}
                    </Text>
                    
                    {manifestation.affirmations && manifestation.affirmations.length > 0 && (
                      <View style={styles.affirmationContainer}>
                        <Text style={styles.affirmationLabel}>Affirmation:</Text>
                        <Text style={styles.affirmationText} numberOfLines={2}>
                          "{manifestation.affirmations[0]}"
                        </Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </Animated.View>
            
            {getActiveManifestations().length > 1 && (
              <View style={styles.swipeIndicators}>
                {getActiveManifestations().map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.swipeIndicator,
                      index === currentManifestationIndex && styles.swipeIndicatorActive,
                    ]}
                  />
                ))}
              </View>
            )}
            
            {getActiveManifestations().length > 1 && (
              <View style={styles.swipeHint}>
                <Text style={styles.swipeHintText}>Swipe to see more manifestations</Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Manifestation Alarm Info - Moved from Settings */}
      <View style={styles.manifestationAlarmContainer}>
        <TouchableOpacity 
          style={styles.manifestationAlarmButton}
          onPress={() => navigation.navigate('AlarmList')}
        >
          <View style={styles.manifestationAlarmIcon}>
            <Ionicons name="sparkles" size={24} color="#6366f1" />
          </View>
          <View style={styles.manifestationAlarmContent}>
            <Text style={styles.manifestationAlarmTitle}>Manifestation Alarms</Text>
            <Text style={styles.manifestationAlarmDescription}>
              Track your mood and align with your manifestations
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoImage: {
    width: 40,
    height: 40,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  settingsButton: {
    padding: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
  },
  statCard: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#6366f1',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    fontWeight: '500',
  },
  quickActionsContainer: {
    padding: 20,
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 16,
  },
  quickActions: {
    gap: 12,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366f1',
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 12,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  secondaryButtonText: {
    color: '#6366f1',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 12,
  },
  manifestationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#e0e7ff',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  manifestationButtonText: {
    color: '#7c3aed',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 12,
  },
  alarmsContainer: {
    padding: 20,
    paddingTop: 0,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllText: {
    color: '#6366f1',
    fontSize: 16,
    fontWeight: '500',
    marginRight: 4,
  },
  emptyAlarmsCard: {
    backgroundColor: '#fff',
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  emptyAlarmsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyAlarmsText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  createAlarmButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  createAlarmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  alarmsList: {
    gap: 12,
  },
  alarmCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  alarmInfo: {
    flex: 1,
  },
  alarmName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  alarmInterval: {
    fontSize: 14,
    color: '#64748b',
  },
  alarmTrigger: {
    alignItems: 'flex-end',
  },
  nextTriggerLabel: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 2,
  },
  nextTriggerTime: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6366f1',
  },
  moreAlarmsButton: {
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
  },
  moreAlarmsText: {
    color: '#6366f1',
    fontSize: 14,
    fontWeight: '500',
  },
  manifestationPreviewContainer: {
    padding: 20,
    paddingTop: 0,
  },
  manifestationCardContainer: {
    position: 'relative',
    minHeight: 200,
  },
  manifestationCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  manifestationContent: {
    padding: 20,
  },
  manifestationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  manifestationDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  manifestationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  manifestationDescription: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
    marginBottom: 12,
  },
  affirmationContainer: {
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#6366f1',
  },
  affirmationLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6366f1',
    marginBottom: 4,
  },
  affirmationText: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#374151',
  },
  swipeIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingTop: 12,
    gap: 8,
  },
  swipeIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e5e7eb',
  },
  swipeIndicatorActive: {
    backgroundColor: '#6366f1',
  },
  swipeHint: {
    alignItems: 'center',
    paddingTop: 8,
  },
  swipeHintText: {
    fontSize: 12,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  manifestationAlarmContainer: {
    margin: 20,
    marginTop: 20,
  },
  manifestationAlarmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  manifestationAlarmIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f9ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  manifestationAlarmContent: {
    flex: 1,
  },
  manifestationAlarmTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  manifestationAlarmDescription: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
});

export default HomeScreen;