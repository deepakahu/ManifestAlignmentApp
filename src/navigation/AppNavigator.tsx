import React, {useRef, useEffect} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {Ionicons} from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import {Platform} from 'react-native';
import {AlarmService} from '../services/AlarmService';

// Import  AlarmNotificationService (available on mobile platforms)
let AlarmNotificationService: any = null;
try {
  if (Platform.OS !== 'web') {
    AlarmNotificationService = require('../services/notifications/AlarmNotificationService').AlarmNotificationService;
  }
} catch (error) {
  console.warn('AlarmNotificationService not available in this environment:', error);
}



import HomeScreen from '../screens/Home/HomeScreen';
import MoodTrackingScreen from '../screens/MoodTracking/MoodTrackingScreen';
import ManifestationScreen from '../screens/Manifestation/ManifestationScreen';
import ManifestationCreateScreen from '../screens/Manifestation/ManifestationCreateScreen';
import ManifestationViewScreen from '../screens/Manifestation/ManifestationViewScreen';
import ManifestationReadingScreen from '../screens/Manifestation/ManifestationReadingScreen';
import ProfileScreen from '../screens/Profile/ProfileScreen';
import SettingsScreen from '../screens/Settings/SettingsScreen';
import AlarmSetupScreen from '../screens/AlarmSetup/AlarmSetupScreen';
import AlarmListScreen from '../screens/AlarmSetup/AlarmListScreen';
import MoodRecordingScreen from '../screens/MoodRecording/MoodRecordingScreen';
import {AlarmRingingScreen} from '../screens/AlarmRinging/AlarmRingingScreen';

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

const AppNavigator = () => {
  const navigationRef = useRef(null);

  const linking = {
    prefixes: [Linking.createURL('/'), 'manifestexpo://'],
    config: {
      screens: {
        MainTabs: {
          screens: {
            Home: 'home',
            MoodTracking: 'mood',
            Manifestation: 'manifest',
            Profile: 'profile',
          },
        },
        MoodRecording: 'mood-recording/:alarmId?',
        Settings: 'settings',
        AlarmList: 'alarms',
        AlarmSetup: 'alarm-setup',
        AlarmRinging: 'alarm-ringing/:alarmId',
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

  return (
    <NavigationContainer ref={navigationRef} linking={linking}>
      <Stack.Navigator screenOptions={{headerShown: false}}>
        <Stack.Screen name="MainTabs" component={TabNavigator} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="AlarmList" component={AlarmListScreen} />
        <Stack.Screen name="AlarmSetup" component={AlarmSetupScreen} />
        <Stack.Screen name="AlarmRinging" component={AlarmRingingScreen} />
        <Stack.Screen name="MoodRecording" component={MoodRecordingScreen} />
        <Stack.Screen name="ManifestationCreate" component={ManifestationCreateScreen} />
        <Stack.Screen name="ManifestationView" component={ManifestationViewScreen} />
        <Stack.Screen name="ManifestationReading" component={ManifestationReadingScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;