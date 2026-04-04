import React, {useRef, useEffect} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {Ionicons} from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import {Platform, View, ActivityIndicator, StyleSheet} from 'react-native';
import {AlarmService} from '../services/AlarmService';
import {useAuth} from '../hooks/useAuth';
import {useMigration} from '../hooks/useMigration';
import {isSupabaseConfigured} from '../services/supabase/SupabaseClient';

// Import  AlarmNotificationService (available on mobile platforms)
let AlarmNotificationService: any = null;
try {
  if (Platform.OS !== 'web') {
    AlarmNotificationService = require('../services/notifications/AlarmNotificationService').AlarmNotificationService;
  }
} catch (error) {
  console.warn('AlarmNotificationService not available in this environment:', error);
}

// Auth screens
import {LoginScreen, SignupScreen, ForgotPasswordScreen} from '../screens/Auth';

// Migration screen
import {MigrationScreen} from '../screens/Migration';

// App screens
import HomeScreen from '../screens/Home/HomeScreen';
import MoodTrackingScreen from '../screens/MoodTracking/MoodTrackingScreen';
import ManifestationScreen from '../screens/Manifestation/ManifestationScreen';
import ManifestationCreateScreen from '../screens/Manifestation/ManifestationCreateScreen';
import ManifestationViewScreen from '../screens/Manifestation/ManifestationViewScreen';
import ManifestationReadingScreen from '../screens/Manifestation/ManifestationReadingScreen';
import ProfileScreen from '../screens/Profile/ProfileScreen';
import SettingsScreen from '../screens/Settings/SettingsScreen';
import SubscriptionScreen from '../screens/Settings/SubscriptionScreen';
import AlarmSetupScreen from '../screens/AlarmSetup/AlarmSetupScreen';
import AlarmListScreen from '../screens/AlarmSetup/AlarmListScreen';
import MoodRecordingScreen from '../screens/MoodRecording/MoodRecordingScreen';
import {AlarmRingingScreen} from '../screens/AlarmRinging/AlarmRingingScreen';
import {PhysiologyShiftScreen} from '../screens/FTBA/PhysiologyShiftScreen';

import {RootStackParamList, MainTabParamList} from '../types';

const Tab = createBottomTabNavigator<MainTabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({route}) => ({
        tabBarIcon: ({focused, color, size}) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'MoodTracking') {
            iconName = focused ? 'happy' : 'happy-outline';
          } else if (route.name === 'Manifestation') {
            iconName = focused ? 'sparkles' : 'sparkles-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          } else {
            iconName = 'home';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#6366f1',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen 
        name="MoodTracking" 
        component={MoodTrackingScreen} 
        options={{tabBarLabel: 'Mood'}}
      />
      <Tab.Screen 
        name="Manifestation" 
        component={ManifestationScreen}
        options={{tabBarLabel: 'Manifest'}}
      />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

/**
 * Loading screen shown while checking auth state
 */
const LoadingScreen = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color="#6366f1" />
  </View>
);

/**
 * Main App Navigator with conditional auth flow
 */
const AppNavigator = () => {
  const navigationRef = useRef(null);
  const { isAuthenticated, isLoading } = useAuth();
  const {
    shouldShowMigration,
    isCheckingMigration,
    completeMigration,
    skipMigration
  } = useMigration();

  // Check if Supabase is configured - if not, skip auth and go straight to app
  const supabaseConfigured = isSupabaseConfigured();

  const linking = {
    prefixes: [Linking.createURL('/'), 'manifestexpo://'],
    config: {
      screens: {
        // Auth screens
        Login: 'login',
        Signup: 'signup',
        ForgotPassword: 'forgot-password',
        // Main app screens
        MainTabs: 'main',
        MoodRecording: 'mood-recording/:alarmId?',
        Settings: 'settings',
        Subscription: 'subscription',
        AlarmList: 'alarms',
        AlarmSetup: 'alarm-setup',
        AlarmRinging: 'alarm-ringing/:alarmId',
        PhysiologyShift: 'physiology-shift/:alarmId',
        ManifestationCreate: 'manifestation-create',
        ManifestationView: 'manifestation-view',
        ManifestationReading: 'manifestation-reading',
      },
    },
  };

  useEffect(() => {
    // Initialize services with navigation reference
    const initializeServices = async () => {
      if (AlarmNotificationService) {
        // Initialize ONLY the required AlarmNotificationService
        AlarmNotificationService.initialize(navigationRef);
      }
      await AlarmService.initialize();
    };

    initializeServices();
  }, []);

  // Show loading screen while checking auth state (only if Supabase is configured)
  if (supabaseConfigured && (isLoading || isCheckingMigration)) {
    return (
      <NavigationContainer>
        <LoadingScreen />
      </NavigationContainer>
    );
  }

  // Determine if we should show auth screens
  // Skip auth if Supabase is not configured (local-only mode)
  const shouldShowAuth = supabaseConfigured && !isAuthenticated;

  // Show migration screen if user has local data to migrate
  if (shouldShowMigration && !shouldShowAuth) {
    return (
      <NavigationContainer>
        <MigrationScreen onComplete={completeMigration} onSkip={skipMigration} />
      </NavigationContainer>
    );
  }

  return (
    <NavigationContainer ref={navigationRef} linking={linking}>
      <Stack.Navigator screenOptions={{headerShown: false}}>
        {shouldShowAuth ? (
          // Auth Stack - shown when user is not authenticated
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Signup" component={SignupScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          </>
        ) : (
          // Main App Stack - shown when user is authenticated (or Supabase not configured)
          <>
            <Stack.Screen name="MainTabs" component={TabNavigator} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen name="Subscription" component={SubscriptionScreen} />
            <Stack.Screen name="AlarmList" component={AlarmListScreen} />
            <Stack.Screen name="AlarmSetup" component={AlarmSetupScreen} />
            <Stack.Screen name="AlarmRinging" component={AlarmRingingScreen} />
            <Stack.Screen name="PhysiologyShift" component={PhysiologyShiftScreen} />
            <Stack.Screen name="MoodRecording" component={MoodRecordingScreen} />
            <Stack.Screen name="ManifestationCreate" component={ManifestationCreateScreen} />
            <Stack.Screen name="ManifestationView" component={ManifestationViewScreen} />
            <Stack.Screen name="ManifestationReading" component={ManifestationReadingScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
});

export default AppNavigator;