import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Vibration,
  Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Audio } from 'expo-av';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { AlarmService } from '../../services/AlarmService';

type RootStackParamList = {
  AlarmRinging: {
    alarmId: string;
    alarmName: string;
    soundType?: string;
    fromNotification?: boolean;
  };
  MoodRecording: {
    alarmId: string;
    alarmName: string;
    fromAlarm: boolean;
  };
  ManifestationReading: {
    fromAlarm: boolean;
  };
  PhysiologyShift: {
    alarmId: string;
    alarmName: string;
    fromAlarm: boolean;
  };
};

type AlarmRingingRouteProp = RouteProp<RootStackParamList, 'AlarmRinging'>;
type NavigationProp = StackNavigationProp<RootStackParamList>;

const { width } = Dimensions.get('window');

export const AlarmRingingScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<AlarmRingingRouteProp>();
  const { alarmId, alarmName, soundType, fromNotification } = route.params;

  const [currentTime, setCurrentTime] = useState(new Date());
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const sound = useRef<Audio.Sound | null>(null);

  // Keep screen awake while alarm is ringing
  useEffect(() => {
    activateKeepAwakeAsync('alarm-ringing');

    return () => {
      deactivateKeepAwake('alarm-ringing');
    };
  }, []);

  // Update time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Pulse animation for alarm bell
  useEffect(() => {
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    );
    pulseAnimation.start();

    return () => pulseAnimation.stop();
  }, [pulseAnim]);

  // Slide animation for dismiss button
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(slideAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [slideAnim]);

  // Vibration pattern
  useEffect(() => {
    const vibrationPattern = [0, 500, 250, 500, 250, 500];
    const vibrationInterval = setInterval(() => {
      Vibration.vibrate(vibrationPattern);
    }, 3000);

    return () => {
      clearInterval(vibrationInterval);
      Vibration.cancel();
    };
  }, []);

  // Play alarm sound
  useEffect(() => {
    playAlarmSound();

    return () => {
      stopAlarmSound();
    };
  }, []);

  // Record that the alarm was triggered
  useEffect(() => {
    if (alarmId) {
      AlarmService.recordAlarmTrigger(alarmId);
    }
  }, [alarmId]);

  const playAlarmSound = async () => {
    try {
      // Set audio mode for playback
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: false,
      });

      // Map sound types to files
      const soundFiles: Record<string, any> = {
        'default': require('../../../assets/sounds/default-alarm.mp3'),
        'ambient-piano': require('../../../assets/sounds/ambient_piano.mp3'),
        'singing-bowl': require('../../../assets/sounds/singing_bowl.mp3'),
        'singing-bowl-hit': require('../../../assets/sounds/singing_bowl_hit.mp3'),
        'tibetan-bowl-low': require('../../../assets/sounds/tibetan_bowl_low.mp3'),
        'calm-music': require('../../../assets/sounds/calm_music.mp3'),
        'relaxing-guitar': require('../../../assets/sounds/relaxing_guitar.mp3'),
      };

      const soundFile = soundFiles[soundType || 'default'] || soundFiles['default'];

      // Load and play the sound
      const { sound: loadedSound } = await Audio.Sound.createAsync(
        soundFile,
        { shouldPlay: true, isLooping: true, volume: 1.0 }
      );

      sound.current = loadedSound;
      console.log('✅ Alarm sound playing:', soundType || 'default');
    } catch (error) {
      console.error('Error playing alarm sound:', error);
    }
  };

  const stopAlarmSound = async () => {
    if (sound.current) {
      await sound.current.stopAsync();
      await sound.current.unloadAsync();
      sound.current = null;
    }
  };

  const handleSnooze = async (minutes: 15 | 30) => {
    await stopAlarmSound();
    Vibration.cancel();

    // Snooze the alarm for specified minutes
    const snoozeTime = new Date(Date.now() + minutes * 60 * 1000);
    await AlarmService.snoozeAlarm(alarmId, snoozeTime);

    navigation.goBack();
  };

  const handleDismiss = async () => {
    await stopAlarmSound();
    Vibration.cancel();
    navigation.goBack();
  };

  const handleRecordMood = async () => {
    await stopAlarmSound();
    Vibration.cancel();
    navigation.replace('MoodRecording', {
      alarmId,
      alarmName,
      fromAlarm: true,
    });
  };

  const handleManifestNow = async () => {
    await stopAlarmSound();
    Vibration.cancel();
    navigation.replace('PhysiologyShift', {
      alarmId,
      alarmName,
      fromAlarm: true,
    });
  };

  const handleReadManifestations = async () => {
    await stopAlarmSound();
    Vibration.cancel();
    navigation.replace('ManifestationReading', {
      fromAlarm: true,
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <View style={styles.container}>
      {/* Background gradient effect */}
      <View style={styles.backgroundGradient} />

      {/* Alarm Icon and Time */}
      <View style={styles.topSection}>
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <MaterialIcons name="alarm" size={80} color="#FFFFFF" />
        </Animated.View>
        
        <Text style={styles.time}>{formatTime(currentTime)}</Text>
        <Text style={styles.date}>{formatDate(currentTime)}</Text>
        <Text style={styles.alarmName}>{alarmName}</Text>
      </View>

      {/* Middle Section - Message */}
      <View style={styles.middleSection}>
        <Text style={styles.message}>Time for your wellness check-in!</Text>
        <Text style={styles.subMessage}>
          Record your mood or read your manifestations
        </Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionSection}>
        <TouchableOpacity
          style={[styles.actionButton, styles.manifestNowButton]}
          onPress={handleManifestNow}
          activeOpacity={0.8}
        >
          <MaterialIcons name="bolt" size={32} color="#FFFFFF" />
          <Text style={styles.actionButtonText}>Manifest Now</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.moodButton]}
          onPress={handleRecordMood}
          activeOpacity={0.8}
        >
          <MaterialIcons name="mood" size={32} color="#FFFFFF" />
          <Text style={styles.actionButtonText}>Record Mood</Text>
        </TouchableOpacity>

        {/* Snooze Options */}
        <View style={styles.snoozeContainer}>
          <TouchableOpacity
            style={[styles.snoozeButton, styles.snooze15]}
            onPress={() => handleSnooze(15)}
            activeOpacity={0.8}
          >
            <MaterialIcons name="snooze" size={20} color="#FFFFFF" />
            <Text style={styles.snoozeButtonText}>15 min</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.snoozeButton, styles.snooze30]}
            onPress={() => handleSnooze(30)}
            activeOpacity={0.8}
          >
            <MaterialIcons name="snooze" size={20} color="#FFFFFF" />
            <Text style={styles.snoozeButtonText}>30 min</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Dismiss Button */}
      <View style={styles.dismissSection}>
        <Animated.View
          style={{
            transform: [
              {
                translateX: slideAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-10, 10],
                }),
              },
            ],
          }}
        >
          <TouchableOpacity
            style={styles.dismissButton}
            onPress={handleDismiss}
            activeOpacity={0.8}
          >
            <MaterialIcons name="close" size={24} color="#666" />
            <Text style={styles.dismissText}>Dismiss</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#1a1a2e',
    opacity: 0.9,
  },
  topSection: {
    flex: 2,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
  },
  time: {
    fontSize: 48,
    fontWeight: '300',
    color: '#FFFFFF',
    marginTop: 20,
  },
  date: {
    fontSize: 18,
    color: '#B0B0B0',
    marginTop: 5,
  },
  alarmName: {
    fontSize: 24,
    fontWeight: '600',
    color: '#6366f1',
    marginTop: 15,
  },
  middleSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  message: {
    fontSize: 22,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  subMessage: {
    fontSize: 16,
    color: '#B0B0B0',
    textAlign: 'center',
    marginTop: 10,
  },
  actionSection: {
    flex: 2,
    paddingHorizontal: 30,
    justifyContent: 'center',
    gap: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 30,
    borderRadius: 15,
    gap: 15,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  moodButton: {
    backgroundColor: '#FF6B6B',
  },
  manifestNowButton: {
    backgroundColor: '#10b981',
  },
  manifestationButton: {
    backgroundColor: '#6366f1',
  },
  actionButtonText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  snoozeContainer: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
  },
  snoozeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
  },
  snooze15: {
    backgroundColor: '#f59e0b',
  },
  snooze30: {
    backgroundColor: '#8b5cf6',
  },
  snoozeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  dismissSection: {
    paddingBottom: 40,
    paddingHorizontal: 30,
  },
  dismissButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    backgroundColor: '#2a2a3e',
    gap: 10,
  },
  dismissText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
});