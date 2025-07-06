import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

async function testNotifications() {
  console.log('Testing notification setup...');
  
  try {
    // Request permissions
    const { status } = await Notifications.requestPermissionsAsync();
    console.log('Notification permission status:', status);
    
    if (status === 'granted') {
      console.log('✅ Notification permissions granted');
      
      // Schedule a test notification
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Test Notification 📱",
          body: 'Notifications are working in Expo SDK 52!',
          sound: true,
        },
        trigger: { seconds: 2 },
      });
      
      console.log('✅ Test notification scheduled for 2 seconds');
      
    } else {
      console.log('❌ Notification permissions denied');
    }
  } catch (error) {
    console.error('❌ Notification test failed:', error);
  }
}

// Auto-run test
testNotifications();

export default testNotifications;