import { NotificationService } from '../services/notifications/NotificationService';

export const testNotifications = async () => {
  // Temporarily disabled for Expo Go (SDK 53) - notifications won't display
  console.log('Notification testing disabled in Expo Go environment');
  console.log('Notifications will work once we create a development build');
  return true;
  
  try {
    console.log('Testing notification system...');
    
    // Test immediate notification (5 seconds from now)
    const testDate = new Date();
    testDate.setSeconds(testDate.getSeconds() + 5);
    
    const notificationId = await NotificationService.scheduleAlarmNotification(
      'test-alarm-001',
      'Test Alarm',
      testDate
    );
    
    console.log('Test notification scheduled with ID:', notificationId);
    
    // Check scheduled notifications
    const scheduled = await NotificationService.getAllScheduledNotifications();
    console.log('Scheduled notifications:', scheduled.length);
    
    return true;
  } catch (error) {
    console.error('Notification test failed:', error);
    return false;
  }
};

export const testNotificationFlow = async () => {
  // Temporarily disabled for Expo Go (SDK 53) - notifications won't display
  console.log('Notification flow testing disabled in Expo Go environment');
  console.log('Notifications will work once we create a development build');
  return true;
  
  try {
    console.log('Testing complete notification flow...');
    
    // Test notification that opens mood recording
    const testDate = new Date();
    testDate.setSeconds(testDate.getSeconds() + 10);
    
    const notificationId = await NotificationService.scheduleAlarmNotification(
      'flow-test-alarm',
      'Flow Test Alarm',
      testDate
    );
    
    console.log('Flow test notification scheduled with ID:', notificationId);
    console.log('Notification should appear in 10 seconds and open mood recording when tapped');
    
    return true;
  } catch (error) {
    console.error('Notification flow test failed:', error);
    return false;
  }
};

export const testDeepLink = async () => {
  try {
    const { Linking } = require('expo-linking');
    const testUrl = 'manifestexpo://mood-recording/test-alarm-deeplink?alarmName=Deep%20Link%20Test';
    
    console.log('Testing deep link:', testUrl);
    await Linking.openURL(testUrl);
    
    return true;
  } catch (error) {
    console.error('Deep link test failed:', error);
    return false;
  }
};