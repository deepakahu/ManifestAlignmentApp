import { AlarmService } from '../services/AlarmService';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

export class AlarmDebugger {
  static async runDiagnostics(): Promise<string[]> {
    const issues: string[] = [];
    
    try {
      // 1. Check if device is physical
      if (!Device.isDevice) {
        issues.push('⚠️ Running on emulator - alarms may not work properly');
      }
      
      // 2. Check notification permissions
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') {
        issues.push('❌ Notification permissions not granted');
      } else {
        issues.push('✅ Notification permissions granted');
      }
      
      // 3. Check alarm channel on Android
      if (Platform.OS === 'android') {
        const channels = await Notifications.getNotificationChannelsAsync();
        const alarmChannel = channels.find(c => c.id === 'alarm_channel');
        
        if (!alarmChannel) {
          issues.push('❌ Alarm notification channel not found');
        } else {
          issues.push('✅ Alarm channel exists');
          if (alarmChannel.importance < Notifications.AndroidImportance.HIGH) {
            issues.push('⚠️ Alarm channel importance is too low');
          }
          if (!alarmChannel.bypassDnd) {
            issues.push('⚠️ Alarm channel does not bypass Do Not Disturb');
          }
        }
      }
      
      // 4. Check scheduled notifications
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      issues.push(`📅 Total scheduled notifications: ${scheduled.length}`);
      
      // 5. Check active alarms
      const alarms = await AlarmService.getActiveAlarms();
      issues.push(`⏰ Active alarms: ${alarms.length}`);
      
      // 6. List next triggers for each alarm
      for (const alarm of alarms) {
        const nextTrigger = AlarmService.formatNextTrigger(alarm);
        issues.push(`  - ${alarm.name}: ${nextTrigger}`);
      }
      
      // 7. Check if AlarmNotificationService is initialized
      const AlarmNotificationService = require('../services/notifications/AlarmNotificationService').AlarmNotificationService;
      if (!AlarmNotificationService.isInitialized) {
        issues.push('❌ AlarmNotificationService not initialized');
      } else {
        issues.push('✅ AlarmNotificationService initialized');
      }
      
    } catch (error) {
      issues.push(`❌ Error during diagnostics: ${error.message}`);
    }
    
    return issues;
  }
  
  static async testAlarmImmediately(): Promise<void> {
    console.log('🧪 Testing alarm in 10 seconds...');
    
    try {
      // Create a test alarm
      const testAlarm = {
        id: 'test-alarm-' + Date.now(),
        name: 'Test Alarm',
        isEnabled: true,
        dayStartTime: new Date().toTimeString().slice(0, 5),
        dayEndTime: '23:59',
        interval: { hours: 0, minutes: 1 },
        activeDays: [true, true, true, true, true, true, true],
        soundType: 'default',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      // Schedule notification for 10 seconds from now
      const triggerDate = new Date(Date.now() + 10000);
      
      const AlarmNotificationService = require('../services/notifications/AlarmNotificationService').AlarmNotificationService;
      const notificationId = await AlarmNotificationService.scheduleAlarmNotification(
        testAlarm.id,
        '🧪 Test Alarm',
        'This is a test notification',
        triggerDate,
        'default',
        { test: true }
      );
      
      console.log(`✅ Test alarm scheduled for ${triggerDate.toLocaleTimeString()}`);
      console.log(`Notification ID: ${notificationId}`);
      
      // Verify it was scheduled
      const allNotifications = await Notifications.getAllScheduledNotificationsAsync();
      const testNotification = allNotifications.find(n => n.identifier === notificationId);
      
      if (testNotification) {
        console.log('✅ Test notification confirmed in system');
      } else {
        console.error('❌ Test notification not found in system!');
      }
      
    } catch (error) {
      console.error('❌ Test alarm failed:', error);
    }
  }
  
  static formatDiagnosticReport(issues: string[]): string {
    return `
🔍 ALARM DIAGNOSTICS REPORT
${new Date().toLocaleString()}

${issues.join('\n')}

📱 Platform: ${Platform.OS} ${Platform.Version}
📦 Device: ${Device.modelName || 'Unknown'}
    `.trim();
  }
}