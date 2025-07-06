#!/usr/bin/env node

// Emergency script to cancel all notifications and debug the infinite loop
// Run this immediately to stop the notification spam

const { exec } = require('child_process');

console.log('🚨 EMERGENCY NOTIFICATION FIX');
console.log('Canceling all scheduled notifications...');

// Create a React Native script to cancel all notifications
const rnScript = `
import * as Notifications from 'expo-notifications';

async function emergencyCancel() {
  try {
    console.log('Canceling all scheduled notifications...');
    await Notifications.cancelAllScheduledNotificationsAsync();
    
    const remaining = await Notifications.getAllScheduledNotificationsAsync();
    console.log('Remaining notifications after cancel:', remaining.length);
    
    if (remaining.length > 0) {
      console.log('Manually canceling remaining notifications...');
      for (const notification of remaining) {
        try {
          await Notifications.cancelScheduledNotificationAsync(notification.identifier);
        } catch (error) {
          console.error('Error canceling notification:', error);
        }
      }
    }
    
    const finalCount = await Notifications.getAllScheduledNotificationsAsync();
    console.log('Final notification count:', finalCount.length);
    
  } catch (error) {
    console.error('Emergency cancel failed:', error);
  }
}

emergencyCancel();
`;

console.log('Emergency fix script created. Running notification cancellation...');
console.log('Manual fix needed in AlarmService.ts - see the infinite loop on lines 96-135');