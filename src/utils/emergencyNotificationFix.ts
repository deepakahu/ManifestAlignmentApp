// Emergency script to fix infinite notification loop
// Call this from anywhere in the app to immediately stop notification spam

import { AlarmService } from '../services/AlarmService';
import { NotificationService } from '../services/notifications/NotificationService';

export const emergencyNotificationFix = async (): Promise<void> => {
  console.log('🚨 EMERGENCY NOTIFICATION FIX STARTED');
  
  try {
    // Step 1: Cancel all notifications immediately
    console.log('Step 1: Emergency canceling all notifications...');
    await AlarmService.emergencyCancelAllNotifications();
    
    // Step 2: Wait a moment
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Step 3: Verify cancellation
    console.log('Step 2: Verifying cancellation...');
    const remaining = await NotificationService.getAllScheduledNotifications();
    console.log(`Remaining notifications: ${remaining.length}`);
    
    if (remaining.length === 0) {
      console.log('✅ SUCCESS: All notifications cancelled');
    } else {
      console.log('⚠️  WARNING: Some notifications remain, force canceling...');
      await NotificationService.cancelAllNotifications();
    }
    
    // Step 4: Debug current state
    await AlarmService.debugScheduledNotifications();
    
    console.log('✅ EMERGENCY FIX COMPLETE');
    console.log('You can now safely re-enable alarms with the fixed logic');
    
  } catch (error) {
    console.error('❌ EMERGENCY FIX FAILED:', error);
  }
};

// Auto-run disabled for Expo Go environment
// emergencyNotificationFix();