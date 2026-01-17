import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialIcons } from '@expo/vector-icons';

type RootStackParamList = {
  PhysiologyShift: {
    alarmId: string;
    alarmName: string;
    fromAlarm: boolean;
  };
  MoodRecording: {
    alarmId: string;
    alarmName: string;
    fromAlarm: boolean;
  };
};

type PhysiologyShiftRouteProp = RouteProp<RootStackParamList, 'PhysiologyShift'>;
type NavigationProp = StackNavigationProp<RootStackParamList>;

const { width, height } = Dimensions.get('window');

export const PhysiologyShiftScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<PhysiologyShiftRouteProp>();
  const { alarmId, alarmName, fromAlarm } = route.params;

  const [countdown, setCountdown] = useState(10);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          // Auto-transition to MoodRecording after countdown
          clearInterval(timer);
          navigation.replace('MoodRecording', {
            alarmId,
            alarmName,
            fromAlarm: true,
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [alarmId, alarmName, navigation]);

  // High-energy scale animation for countdown
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.3,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [scaleAnim]);

  // Pulsing animation for icon
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.4,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnim]);

  // Continuous rotation animation
  useEffect(() => {
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      })
    ).start();
  }, [rotateAnim]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      {/* Animated background gradient effect */}
      <View style={styles.backgroundGradient} />

      {/* Top Section - Icon with rotation */}
      <View style={styles.topSection}>
        <Animated.View style={{ transform: [{ rotate: spin }, { scale: pulseAnim }] }}>
          <MaterialIcons name="bolt" size={120} color="#10b981" />
        </Animated.View>
      </View>

      {/* Middle Section - Message */}
      <View style={styles.middleSection}>
        <Text style={styles.title}>ALIGN YOUR STATE!</Text>
        <Text style={styles.message}>
          Stand up, dance, or smile—{'\n'}
          FEEL the joy of your{'\n'}
          goal achieved.
        </Text>
      </View>

      {/* Bottom Section - Countdown */}
      <View style={styles.bottomSection}>
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <View style={styles.countdownContainer}>
            <Text style={styles.countdownText}>{countdown}</Text>
          </View>
        </Animated.View>
        <Text style={styles.countdownLabel}>
          {countdown > 1 ? 'seconds remaining' : 'second remaining'}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a1a',
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#0a0a1a',
    opacity: 0.95,
  },
  topSection: {
    flex: 2,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  middleSection: {
    flex: 2,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  title: {
    fontSize: 36,
    fontWeight: '900',
    color: '#10b981',
    textAlign: 'center',
    marginBottom: 20,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  message: {
    fontSize: 22,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 34,
  },
  bottomSection: {
    flex: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 60,
  },
  countdownContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 10,
  },
  countdownText: {
    fontSize: 72,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  countdownLabel: {
    fontSize: 16,
    color: '#B0B0B0',
    marginTop: 20,
    fontWeight: '500',
  },
});
