import { Alert, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { AlarmNotificationService } from '../services/notifications/AlarmNotificationService';
import { AlarmService } from '../services/AlarmService';

/**
 * Comprehensive alarm diagnostics to identify why alarms aren't ringing
 */
export class AlarmDiagnostics {

  /**
   * Run full diagnostics and display results
   */
  static async runDiagnostics(): Promise<void> {
    console.log('🔍 Running Alarm Diagnostics...');

    const results: string[] = [];
    const issues: string[] = [];

    // 1. Check device type
    results.push(`📱 Device: ${Device.isDevice ? 'Physical Device' : 'Emulator'}`);
    if (!Device.isDevice) {
      issues.push('❌ Running on emulator - notifications may not work reliably');
    }

    // 2. Check notification permissions
    const { status } = await Notifications.getPermissionsAsync();
    results.push(`🔔 Notification Permission: ${status}`);
    if (status !== 'granted') {
      issues.push('❌ CRITICAL: Notification permission not granted!');
    }

    // 3. Check alarm permissions (Android-specific)
    if (Platform.OS === 'android') {
      const permCheck = await AlarmNotificationService.checkAlarmPermissions();
      results.push(`⚡ Exact Alarm Permission: ${permCheck.exactAlarm !== false ? 'Likely Granted' : 'Unknown'}`);

      if (permCheck.issues.length > 0) {
        issues.push(...permCheck.issues.map(i => `⚠️ ${i}`));
      }

      // Check alarm channel
      const channels = await Notifications.getNotificationChannelsAsync();
      const alarmChannel = channels.find(c => c.id === 'alarm_channel');

      if (alarmChannel) {
        results.push(`📢 Alarm Channel: Configured`);
        results.push(`  - Importance: ${alarmChannel.importance}`);
        results.push(`  - Bypass DND: ${alarmChannel.bypassDnd}`);
        results.push(`  - Sound: ${alarmChannel.sound}`);

        if (alarmChannel.importance < 4) {
          issues.push(`❌ CRITICAL: Alarm channel importance too low (${alarmChannel.importance})!`);
        }
      } else {
        issues.push('❌ CRITICAL: Alarm notification channel NOT configured!');
      }
    }

    // 4. Check scheduled notifications
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const alarmNotifications = scheduled.filter(n => n.content.data?.type === 'alarm');

    results.push(`📅 Scheduled Alarms: ${alarmNotifications.length}`);

    if (alarmNotifications.length === 0) {
      issues.push('⚠️ No alarms currently scheduled!');
    } else {
      results.push('');
      results.push('Upcoming alarms:');
      alarmNotifications.slice(0, 5).forEach((n, i) => {
        const trigger = n.trigger as any;
        const triggerDate = trigger.type === 'date' ? new Date(trigger.value) : 'Unknown';
        results.push(`  ${i + 1}. ${triggerDate instanceof Date ? triggerDate.toLocaleString() : triggerDate}`);
      });
    }

    // 5. Check active alarms in storage
    const alarms = await AlarmService.getAlarms();
    const activeAlarms = alarms.filter(a => a.isEnabled);

    results.push('');
    results.push(`⏰ Active Alarms in Settings: ${activeAlarms.length}`);

    if (activeAlarms.length === 0) {
      issues.push('⚠️ No alarms enabled in app settings!');
    } else {
      activeAlarms.forEach((alarm, i) => {
        results.push(`  ${i + 1}. ${alarm.name}`);
        results.push(`     Next: ${alarm.nextTrigger ? new Date(alarm.nextTrigger).toLocaleString() : 'Not scheduled'}`);
      });
    }

    // 6. Test immediate notification
    results.push('');
    results.push('🧪 Testing immediate notification...');

    try {
      const testDate = new Date(Date.now() + 5000);
      const testId = await AlarmNotificationService.scheduleAlarmNotification(
        'diagnostic-test',
        '🧪 Diagnostic Test',
        'If you see this notification in 5 seconds, notifications are working!',
        testDate,
        'default',
        { test: true }
      );

      if (testId) {
        results.push('✅ Test notification scheduled for 5 seconds from now');
      } else {
        issues.push('❌ CRITICAL: Failed to schedule test notification!');
      }
    } catch (error) {
      issues.push(`❌ CRITICAL: Error scheduling test: ${error}`);
    }

    // 7. Display results
    const report = [
      '=== ALARM DIAGNOSTICS REPORT ===',
      '',
      ...results,
      '',
      issues.length > 0 ? '=== ISSUES FOUND ===' : '=== NO ISSUES FOUND ===',
      ...issues,
      '',
      issues.length > 0 ? 'See console for recommended fixes.' : '✅ All systems operational!',
    ].join('\n');

    console.log(report);

    Alert.alert(
      'Alarm Diagnostics',
      this.getSummary(issues),
      [
        { text: 'View Full Report', onPress: () => console.log(report) },
        { text: 'OK' },
      ]
    );

    // Log recommendations
    if (issues.length > 0) {
      console.log('\n📋 RECOMMENDED FIXES:');
      console.log('1. Ensure notification permission is granted');
      console.log('2. Check Android Settings > Apps > Your App > Notifications');
      console.log('3. Disable battery optimization for your app');
      console.log('4. Check that alarms have future trigger times');
      console.log('5. Try creating a simple test alarm');
    }
  }

  /**
   * Get summary of issues for alert
   */
  static getSummary(issues: string[]): string {
    if (issues.length === 0) {
      return '✅ All alarm systems are working correctly!\n\nA test notification has been scheduled for 5 seconds from now.';
    }

    const critical = issues.filter(i => i.includes('CRITICAL'));
    const warnings = issues.filter(i => i.includes('⚠️'));

    return `Found ${issues.length} issue(s):\n\n${critical.length} critical\n${warnings.length} warnings\n\nCheck console for details.`;
  }

  /**
   * Quick test: Schedule alarm in 10 seconds
   */
  static async quickTest(): Promise<void> {
    const testDate = new Date(Date.now() + 10000);

    Alert.alert(
      'Quick Alarm Test',
      `Scheduling test alarm for ${testDate.toLocaleTimeString()}`,
      [{ text: 'OK' }]
    );

    const id = await AlarmNotificationService.scheduleAlarmNotification(
      'quick-test',
      '⏰ Test Alarm',
      'Your test alarm is ringing!',
      testDate,
      'default'
    );

    console.log(`Quick test alarm scheduled: ${id}`);

    if (!id) {
      Alert.alert('Error', 'Failed to schedule test alarm. Check permissions.');
    }
  }

  /**
   * Fix common issues automatically
   */
  static async autoFix(): Promise<void> {
    console.log('🔧 Attempting auto-fix...');

    try {
      // Re-initialize alarm notification service
      await AlarmNotificationService.initialize();

      // Request permissions again
      await AlarmNotificationService.requestNotificationPermissions();

      // Recreate alarm channel
      await AlarmNotificationService.configureAlarmChannel();

      // Refresh all active alarms
      await AlarmService.refreshAllAlarms();

      Alert.alert(
        'Auto-Fix Complete',
        'Alarm system has been reinitialized. Test creating a new alarm.',
        [{ text: 'OK' }]
      );

      console.log('✅ Auto-fix completed');
    } catch (error) {
      console.error('Auto-fix failed:', error);
      Alert.alert('Auto-Fix Failed', `Error: ${error}`);
    }
  }
}
