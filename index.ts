import { registerRootComponent } from 'expo';
import { Platform } from 'react-native';
import notifee, { EventType } from '@notifee/react-native';

import App from './App';

// Register @notifee background event handler for Android alarms
// This ensures alarms trigger even when app is in background
if (Platform.OS === 'android') {
  notifee.onBackgroundEvent(async ({ type, detail }) => {
    console.log('@notifee background event received:', type, detail);
    
    const { notification } = detail;
    const data = notification?.data;
    
    if (data?.type === 'alarm') {
      console.log('Alarm triggered in background:', {
        alarmId: data.alarmId,
        alarmName: data.alarmName,
      });
      
      // The alarm notification will automatically show up
      // Navigation to AlarmRinging screen will be handled by foreground event listener
      // in AlarmNotificationService
    }
    
    // Cancel the notification if user dismissed it
    if (type === EventType.ACTION_PRESS && detail.pressAction?.id === 'dismiss') {
      if (notification?.id) {
        await notifee.cancelNotification(notification.id);
      }
    }
  });
}

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
