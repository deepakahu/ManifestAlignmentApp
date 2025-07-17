import {NotificationService} from './notifications/NotificationService';
import {StorageService} from './storage/StorageService';
import {Alarm} from '../types';

export class AlarmService {
  private static isInitialized = false;
  private static scheduledNotifications = new Map<string, string[]>();
  private static schedulingInProgress = new Set<string>();

  static initialize() {
    if (this.isInitialized) return;
    this.isInitialized = true;
    console.log('AlarmService initialized');
  }

  static async saveAlarm(alarm: Alarm): Promise<boolean> {
    try {
      await StorageService.saveAlarm(alarm);
      
      // Schedule notifications if alarm is enabled
      if (alarm.isEnabled) {
        // Update next trigger time first
        await this.updateAlarmNextTrigger(alarm.id);
        // Then schedule the notification
        await this.scheduleAlarmNotifications(alarm);
      }
      
      return true;
    } catch (error) {
      console.error('Error saving alarm:', error);
      return false;
    }
  }

  static async getAlarms(): Promise<Alarm[]> {
    try {
      return await StorageService.getAlarms();
    } catch (error) {
      console.error('Error getting alarms:', error);
      return [];
    }
  }

  static async deleteAlarm(alarmId: string): Promise<boolean> {
    try {
      await StorageService.deleteAlarm(alarmId);
      
      // Cancel all notifications for this alarm
      await this.cancelAlarmNotifications(alarmId);
      
      return true;
    } catch (error) {
      console.error('Error deleting alarm:', error);
      return false;
    }
  }

  static async toggleAlarm(alarmId: string, enabled: boolean): Promise<boolean> {
    try {
      const alarms = await this.getAlarms();
      const alarm = alarms.find(a => a.id === alarmId);
      
      if (!alarm) return false;
      
      alarm.isEnabled = enabled;
      await StorageService.updateAlarm(alarmId, {isEnabled: enabled});
      
      if (enabled) {
        // Update next trigger time first
        await this.updateAlarmNextTrigger(alarmId);
        // Then schedule the notification
        await this.scheduleAlarmNotifications(alarm);
      } else {
        await this.cancelAlarmNotifications(alarmId);
      }
      
      return true;
    } catch (error) {
      console.error('Error toggling alarm:', error);
      return false;
    }
  }

  static async scheduleAlarmNotifications(alarm: Alarm): Promise<void> {
    console.log('Scheduling notifications for alarm:', alarm.name);
    
    // Prevent duplicate scheduling for the same alarm
    if (this.schedulingInProgress.has(alarm.id)) {
      console.log('Scheduling already in progress for alarm:', alarm.name);
      return;
    }
    
    this.schedulingInProgress.add(alarm.id);
    
    try {
      // EMERGENCY CLEANUP: Cancel ALL notifications first, then specific alarm notifications
      console.log('Emergency cleanup: Canceling all notifications before scheduling new ones...');
      await NotificationService.cancelAllNotifications();
      this.scheduledNotifications.clear();
      
      // Double-check: Cancel specific alarm notifications
      await this.cancelAlarmNotifications(alarm.id);
      
      // Clear any existing scheduled notifications for this alarm
      this.scheduledNotifications.delete(alarm.id);
    
    // CRITICAL FIX: Schedule ONLY the next notification to prevent spam
    const today = new Date();
    const maxNotifications = 1; // Only schedule ONE notification at a time
    const notificationIds: string[] = [];
    let scheduledCount = 0;
    
    // Look ahead only 24 hours to find the next notification
    const endDate = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    
    for (let date = new Date(today); date <= endDate && scheduledCount < maxNotifications; date.setDate(date.getDate() + 1)) {
      const dayOfWeek = date.getDay();
      
      // Check if this day is active
      if (!alarm.activeDays[dayOfWeek]) continue;
      
      // Generate notification times for this day
      const notificationTimes = this.generateNotificationTimes(
        alarm.dayStartTime,
        alarm.dayEndTime,
        alarm.interval,
        new Date(date)
      );
      
      for (const notificationTime of notificationTimes) {
        if (scheduledCount >= maxNotifications) break;
        
        // Only schedule future notifications (with a 30-second buffer to avoid immediate scheduling)
        // Also ensure we set seconds to 0 for exact timing
        notificationTime.setSeconds(0, 0);
        const thirtySecondsFromNow = new Date(Date.now() + 30 * 1000);
        if (notificationTime > thirtySecondsFromNow) {
          try {
            const notificationId = await NotificationService.scheduleAlarmNotification(
              alarm.id,
              alarm.name,
              notificationTime,
              alarm.soundType || 'default'
            );
            notificationIds.push(notificationId);
            scheduledCount++;
            console.log(`[${scheduledCount}/${maxNotifications}] Scheduled notification for ${alarm.name} at ${notificationTime}`);
          } catch (error) {
            console.error('Error scheduling notification:', error);
          }
        }
      }
      
      if (scheduledCount >= maxNotifications) break;
    }
    
      // Store notification IDs for this alarm
      this.scheduledNotifications.set(alarm.id, notificationIds);
      console.log(`Scheduled ${notificationIds.length} notifications for alarm ${alarm.name}`);
      
      // Update alarm's next trigger time
      await this.updateAlarmNextTrigger(alarm.id);
    } finally {
      // Remove from scheduling progress
      this.schedulingInProgress.delete(alarm.id);
    }
  }

  static generateNotificationTimes(startTime: string, endTime: string, interval: {hours: number, minutes: number} | 'test_mode', date: Date, testInterval?: number): Date[] {
    const times: Date[] = [];
    
    // Parse start and end times
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const [endHours, endMinutes] = endTime.split(':').map(Number);
    
    // Create date objects for start and end times
    const startDate = new Date(date);
    startDate.setHours(startHours, startMinutes, 0, 0);
    
    const endDate = new Date(date);
    endDate.setHours(endHours, endMinutes, 0, 0);
    
    // Generate notification times at intervals
    let currentTime = new Date(startDate);
    
    if (interval === 'test_mode') {
      // Test mode - generate 5 notifications at specified intervals (in minutes)
      const intervalMinutes = testInterval || 5; // Default to 5 minutes if not specified
      for (let i = 0; i < 5; i++) {
        const testTime = new Date(currentTime);
        testTime.setMinutes(testTime.getMinutes() + (i * intervalMinutes));
        if (testTime <= endDate) {
          times.push(testTime);
        }
      }
    } else {
      // Regular interval mode
      while (currentTime < endDate) {
        times.push(new Date(currentTime));
        currentTime.setHours(currentTime.getHours() + interval.hours, currentTime.getMinutes() + interval.minutes);
      }
    }
    
    return times;
  }

  static async cancelAlarmNotifications(alarmId: string): Promise<void> {
    try {
      const notificationIds = this.scheduledNotifications.get(alarmId) || [];
      
      console.log(`Canceling ${notificationIds.length} notifications for alarm ${alarmId}`);
      
      // Cancel each notification individually
      for (const notificationId of notificationIds) {
        try {
          await NotificationService.cancelNotification(notificationId);
        } catch (error) {
          console.error(`Error canceling notification ${notificationId}:`, error);
        }
      }
      
      // Clear stored notification IDs
      this.scheduledNotifications.delete(alarmId);
      
      console.log(`Canceled notifications for alarm ${alarmId}`);
    } catch (error) {
      console.error('Error canceling alarm notifications:', error);
    }
  }

  static async updateAlarmNextTrigger(alarmId: string): Promise<void> {
    try {
      const alarms = await this.getAlarms();
      const alarm = alarms.find(a => a.id === alarmId);
      
      if (!alarm || !alarm.isEnabled) return;
      
      // Calculate next trigger time
      const now = new Date();
      let nextTrigger: Date | null = null;
      
      // Check today first, then next 7 days
      for (let i = 0; i < 7; i++) {
        const checkDate = new Date(now);
        checkDate.setDate(checkDate.getDate() + i);
        const dayOfWeek = checkDate.getDay();
        
        if (alarm.activeDays[dayOfWeek]) {
          const notificationTimes = this.generateNotificationTimes(
            alarm.dayStartTime,
            alarm.dayEndTime,
            alarm.interval,
            checkDate
          );
          
          // Filter for times that are at least 1 minute in the future
          const oneMinuteFromNow = new Date(now.getTime() + 60 * 1000);
          const futureTimes = notificationTimes.filter(time => time > oneMinuteFromNow);
          if (futureTimes.length > 0) {
            nextTrigger = futureTimes[0];
            break;
          }
        }
      }
      
      // Update alarm with next trigger time
      await StorageService.updateAlarm(alarmId, {nextTrigger: nextTrigger || undefined});
      console.log(`Updated next trigger for alarm ${alarm.name}: ${nextTrigger ? nextTrigger.toLocaleString() : 'None'}`);
      
    } catch (error) {
      console.error('Error updating alarm next trigger:', error);
    }
  }

  static async recordAlarmTrigger(alarmId: string): Promise<void> {
    try {
      const now = new Date();
      await StorageService.updateAlarm(alarmId, {lastTriggered: now});
      
      // Update next trigger time
      await this.updateAlarmNextTrigger(alarmId);
      
      // CRITICAL: Schedule the next notification immediately after triggering
      const alarm = await this.getAlarmById(alarmId);
      if (alarm && alarm.isEnabled) {
        console.log(`Scheduling next notification for alarm: ${alarm.name}`);
        await this.scheduleAlarmNotifications(alarm);
      }
      
    } catch (error) {
      console.error('Error recording alarm trigger:', error);
    }
  }

  // Utility methods
  static async getActiveAlarms(): Promise<Alarm[]> {
    const alarms = await this.getAlarms();
    return alarms.filter(alarm => alarm.isEnabled);
  }

  static async getAlarmById(alarmId: string): Promise<Alarm | undefined> {
    const alarms = await this.getAlarms();
    return alarms.find(alarm => alarm.id === alarmId);
  }

  static formatNextTrigger(alarm: Alarm): string {
    if (!alarm.nextTrigger) return 'Not scheduled';
    
    const now = new Date();
    const trigger = new Date(alarm.nextTrigger);
    const diff = trigger.getTime() - now.getTime();
    
    if (diff <= 0) return 'Overdue';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `In ${days} day${days > 1 ? 's' : ''}`;
    } else if (hours > 0) {
      return `In ${hours}h ${minutes}m`;
    } else {
      return `In ${minutes}m`;
    }
  }

  static async refreshAllAlarms(): Promise<void> {
    console.log('🚨 EMERGENCY: Refreshing all alarms with safety limits...');
    
    // EMERGENCY: Force cancel ALL notifications multiple times to ensure cleanup
    console.log('Force canceling all notifications (attempt 1)...');
    await NotificationService.cancelAllNotifications();
    
    console.log('Force canceling all notifications (attempt 2)...');
    await NotificationService.cancelAllNotifications();
    
    this.scheduledNotifications.clear();
    this.schedulingInProgress.clear();
    
    const alarms = await this.getActiveAlarms();
    console.log(`Found ${alarms.length} active alarms`);
    
    // Re-schedule all active alarms with safety limits
    for (const alarm of alarms) {
      console.log(`Refreshing alarm: ${alarm.name}`);
      await this.scheduleAlarmNotifications(alarm);
    }
    
    // Verify final notification count
    const finalNotifications = await NotificationService.getAllScheduledNotifications();
    console.log(`✅ Refresh complete. Total notifications: ${finalNotifications.length}`);
    
    if (finalNotifications.length > 50) {
      console.error('🚨 WARNING: Too many notifications scheduled! Canceling all...');
      await NotificationService.cancelAllNotifications();
      this.scheduledNotifications.clear();
    }
  }

  static async clearAllAlarms(): Promise<boolean> {
    try {
      const alarms = await this.getAlarms();
      
      // Cancel all notifications
      for (const alarm of alarms) {
        await this.cancelAlarmNotifications(alarm.id);
      }
      
      // Clear all alarms from storage
      await StorageService.clearAllData();
      
      return true;
    } catch (error) {
      console.error('Error clearing all alarms:', error);
      return false;
    }
  }

  // EMERGENCY method to immediately cancel all notifications
  static async emergencyCancelAllNotifications(): Promise<void> {
    console.log('🚨 EMERGENCY NOTIFICATION CANCEL INITIATED');
    
    try {
      // Cancel using NotificationService
      console.log('Canceling via NotificationService...');
      await NotificationService.cancelAllNotifications();
      
      // Clear internal tracking
      console.log('Clearing internal tracking...');
      this.scheduledNotifications.clear();
      this.schedulingInProgress.clear();
      
      // Verify cancellation
      const remaining = await NotificationService.getAllScheduledNotifications();
      console.log(`Remaining notifications after emergency cancel: ${remaining.length}`);
      
      if (remaining.length > 0) {
        console.log('Force canceling remaining notifications individually...');
        for (const notification of remaining) {
          try {
            await NotificationService.cancelNotification(notification.identifier);
          } catch (error) {
            console.error('Error force canceling notification:', error);
          }
        }
      }
      
      const finalCheck = await NotificationService.getAllScheduledNotifications();
      console.log(`✅ Emergency cancel complete. Final count: ${finalCheck.length}`);
      
    } catch (error) {
      console.error('Emergency cancel failed:', error);
    }
  }

  // Debug method to check scheduled notifications
  static async debugScheduledNotifications(): Promise<void> {
    console.log('=== Debug Scheduled Notifications ===');
    
    // Check our internal tracking
    console.log('Internally tracked notifications:');
    for (const [alarmId, notificationIds] of this.scheduledNotifications) {
      console.log(`Alarm ${alarmId}: ${notificationIds.length} notifications`);
    }
    
    // Check actual scheduled notifications
    const actualNotifications = await NotificationService.getAllScheduledNotifications();
    console.log(`Actual scheduled notifications: ${actualNotifications.length}`);
    
    // Group by alarm ID
    const groupedByAlarm = actualNotifications.reduce((acc, notification) => {
      const alarmId = notification.content.data?.alarmId;
      if (alarmId) {
        if (!acc[alarmId]) acc[alarmId] = [];
        acc[alarmId].push(notification);
      }
      return acc;
    }, {} as Record<string, any[]>);
    
    console.log('Actual notifications grouped by alarm:');
    for (const [alarmId, notifications] of Object.entries(groupedByAlarm)) {
      console.log(`Alarm ${alarmId}: ${notifications.length} notifications`);
      // Show the first notification trigger time
      if (notifications.length > 0 && notifications[0].trigger) {
        const triggerTime = new Date(notifications[0].trigger.value);
        console.log(`  Next trigger: ${triggerTime.toLocaleString()}`);
      }
    }
    
    console.log('=== End Debug ===');
  }
  
  // Test notification immediately (for debugging)
  static async testNotificationNow(alarmId: string): Promise<void> {
    console.log('Testing notification immediately...');
    
    const alarm = await this.getAlarmById(alarmId);
    if (!alarm) {
      console.error('Alarm not found');
      return;
    }
    
    try {
      // Schedule a notification 5 seconds from now
      const testTime = new Date(Date.now() + 5 * 1000);
      const notificationId = await NotificationService.scheduleAlarmNotification(
        alarm.id,
        alarm.name,
        testTime,
        alarm.soundType || 'default'
      );
      
      console.log(`Test notification scheduled for ${testTime.toLocaleString()}`);
      console.log(`Notification ID: ${notificationId}`);
      
      // Check if it was actually scheduled
      const allNotifications = await NotificationService.getAllScheduledNotifications();
      const testNotification = allNotifications.find(n => n.identifier === notificationId);
      
      if (testNotification) {
        console.log('✅ Test notification confirmed in system');
        console.log('Trigger time:', new Date(testNotification.trigger.value).toLocaleString());
      } else {
        console.error('❌ Test notification not found in system!');
      }
    } catch (error) {
      console.error('Error scheduling test notification:', error);
    }
  }
}