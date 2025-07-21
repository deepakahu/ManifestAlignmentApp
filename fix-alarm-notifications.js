// Comprehensive fix for alarm notifications not ringing
// Run this in your app to diagnose and fix the issue

import * as Notifications from 'expo-notifications';
import { Platform, Alert } from 'react-native';
import { AlarmService } from './src/services/AlarmService';
import { NotificationService } from './src/services/notifications/NotificationService';

export async function fixAlarmNotifications() {
  console.log('🔧 Starting Alarm Notification Fix...\n');
  
  const issues = [];
  const fixes = [];
  
  try {
    // 1. Check notification permissions
    console.log('1️⃣ Checking notification permissions...');
    const { status } = await Notifications.getPermissionsAsync();
    console.log(`   Current status: ${status}`);
    
    if (status !== 'granted') {
      issues.push('Notifications not permitted');
      const { status: newStatus } = await Notifications.requestPermissionsAsync();
      if (newStatus === 'granted') {
        fixes.push('Requested and granted notification permissions');
      } else {
        issues.push('User denied notification permissions - alarms will not work');
      }
    }
    
    // 2. Check notification handler configuration
    console.log('\n2️⃣ Verifying notification handler...');
    // Re-configure to ensure it's set properly
    Notifications.setNotificationHandler({
      handleNotification: async () => {
        console.log('🔔 Notification handler triggered!');
        return {
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
          priority: Platform.OS === 'android' ? 
            Notifications.AndroidNotificationPriority.MAX : undefined,
        };
      },
    });
    fixes.push('Re-configured notification handler');
    
    // 3. Android-specific: Check notification channel
    if (Platform.OS === 'android') {
      console.log('\n3️⃣ Checking Android notification channel...');
      
      // Delete and recreate channel to ensure proper configuration
      await Notifications.deleteNotificationChannelAsync('mood-reminders');
      
      await Notifications.setNotificationChannelAsync('mood-reminders', {
        name: 'Mood Reminders',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
        sound: 'default', // Ensure sound is enabled
        enableVibrate: true,
        bypassDnd: false, // Changed from true to respect DND
        showBadge: true,
        enableLights: true,
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      });
      
      fixes.push('Recreated Android notification channel with sound enabled');
    }
    
    // 4. Check scheduled notifications
    console.log('\n4️⃣ Checking scheduled notifications...');
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    console.log(`   Found ${scheduled.length} scheduled notifications`);
    
    if (scheduled.length === 0) {
      issues.push('No notifications are scheduled');
    } else {
      // Check if any are overdue
      const now = Date.now();
      const overdue = scheduled.filter(n => {
        if (n.trigger && n.trigger.date) {
          return new Date(n.trigger.date).getTime() < now;
        }
        return false;
      });
      
      if (overdue.length > 0) {
        issues.push(`${overdue.length} notifications are overdue and may not trigger`);
        // Cancel overdue notifications
        for (const notification of overdue) {
          await Notifications.cancelScheduledNotificationAsync(notification.identifier);
        }
        fixes.push('Cancelled overdue notifications');
      }
    }
    
    // 5. iOS-specific checks
    if (Platform.OS === 'ios') {
      console.log('\n5️⃣ iOS-specific checks...');
      
      // Check if app is in silent mode or DND
      const settings = await Notifications.getPermissionsAsync();
      if (settings.ios) {
        console.log('   iOS notification settings:', settings.ios);
        if (!settings.ios.allowsSound) {
          issues.push('iOS: Sound notifications are disabled');
        }
        if (!settings.ios.allowsAlert) {
          issues.push('iOS: Alert notifications are disabled');
        }
      }
    }
    
    // 6. Test immediate notification
    console.log('\n6️⃣ Testing immediate notification...');
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🔔 Test Notification',
          body: 'If you see and hear this, notifications are working!',
          sound: 'default',
          priority: Platform.OS === 'android' ? 
            Notifications.AndroidNotificationPriority.MAX : undefined,
        },
        trigger: { seconds: 2 },
      });
      console.log('   ✅ Test notification scheduled for 2 seconds from now');
    } catch (error) {
      issues.push(`Failed to schedule test notification: ${error.message}`);
    }
    
    // 7. Refresh all alarms
    console.log('\n7️⃣ Refreshing all alarms...');
    await AlarmService.refreshAllAlarms();
    fixes.push('Refreshed all alarm schedules');
    
    // 8. Check device settings
    console.log('\n8️⃣ Device setting recommendations:');
    const recommendations = [
      '• Check phone is not in Silent/Vibrate mode',
      '• Check Do Not Disturb is disabled',
      '• Check app notification settings in device Settings',
      '• Ensure notification sounds are enabled for the app',
      '• Check battery optimization is not killing the app',
      '• For Android: Check that app has "Alarms & Reminders" permission',
    ];
    
    // Summary
    console.log('\n📊 SUMMARY:');
    console.log(`Issues found: ${issues.length}`);
    issues.forEach(issue => console.log(`   ❌ ${issue}`));
    
    console.log(`\nFixes applied: ${fixes.length}`);
    fixes.forEach(fix => console.log(`   ✅ ${fix}`));
    
    console.log('\n💡 Recommendations:');
    recommendations.forEach(rec => console.log(rec));
    
    // Return results
    return {
      success: issues.length === 0,
      issues,
      fixes,
      recommendations,
      scheduledCount: scheduled.length,
    };
    
  } catch (error) {
    console.error('❌ Fix process failed:', error);
    return {
      success: false,
      issues: [`Fix process error: ${error.message}`],
      fixes,
      recommendations: [],
      error,
    };
  }
}

// Function to manually trigger a test alarm
export async function testAlarmNow() {
  console.log('🔔 Triggering test alarm in 5 seconds...');
  
  try {
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: '⏰ Alarm Test',
        body: 'This is a test alarm notification!',
        sound: 'default',
        data: { type: 'test' },
        priority: Platform.OS === 'android' ? 
          Notifications.AndroidNotificationPriority.MAX : undefined,
      },
      trigger: Platform.OS === 'android' 
        ? { seconds: 5, channelId: 'mood-reminders' }
        : { seconds: 5 },
    });
    
    console.log(`✅ Test alarm scheduled with ID: ${notificationId}`);
    return notificationId;
  } catch (error) {
    console.error('❌ Failed to schedule test alarm:', error);
    throw error;
  }
}