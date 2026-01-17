import { Platform, Linking } from 'react-native';
import * as IntentLauncher from 'expo-intent-launcher';

/**
 * Android Alarm Permission Utilities
 * Handles SCHEDULE_EXACT_ALARM permission for Android 12+ (API 31+)
 */
export class AndroidAlarmPermissions {
  /**
   * Check if the device requires exact alarm permission
   * (Android 12+ / API 31+)
   */
  static requiresExactAlarmPermission(): boolean {
    if (Platform.OS !== 'android') {
      return false;
    }

    // Android 12 (API 31) and above require this permission
    const apiLevel = Platform.Version as number;
    return apiLevel >= 31;
  }

  /**
   * Check if SCHEDULE_EXACT_ALARM permission is granted
   * Note: There's no direct way to check this from React Native
   * We can only check if API level requires it
   */
  static async canScheduleExactAlarms(): Promise<boolean> {
    if (!this.requiresExactAlarmPermission()) {
      return true; // Permission not required on older Android versions
    }

    // On Android 12+, we can't directly check this permission from JS
    // The best we can do is try to schedule an alarm and handle errors
    // For now, we'll return false if permission is required
    // User will need to manually grant it
    return false;
  }

  /**
   * Open the exact alarm permission settings page
   * This opens the "Alarms & reminders" settings for the app
   */
  static async openExactAlarmSettings(): Promise<void> {
    if (Platform.OS !== 'android') {
      return;
    }

    try {
      if (this.requiresExactAlarmPermission()) {
        // Use expo-intent-launcher to open the exact alarm settings
        // The action string for Android's ACTION_REQUEST_SCHEDULE_EXACT_ALARM
        await IntentLauncher.startActivityAsync(
          'android.settings.REQUEST_SCHEDULE_EXACT_ALARM',
          {
            data: `package:${this.getPackageName()}`,
          }
        );
      } else {
        // Fallback to general app settings for older Android versions
        await Linking.openSettings();
      }
    } catch (error) {
      console.error('Failed to open exact alarm settings:', error);
      // Fallback to general app settings
      await Linking.openSettings();
    }
  }

  /**
   * Open battery optimization settings
   * Helps prevent the app from being killed in the background
   */
  static async openBatteryOptimizationSettings(): Promise<void> {
    if (Platform.OS !== 'android') {
      return;
    }

    try {
      await IntentLauncher.startActivityAsync(
        IntentLauncher.ActivityAction.IGNORE_BATTERY_OPTIMIZATION_SETTINGS
      );
    } catch (error) {
      console.error('Failed to open battery settings:', error);
      await Linking.openSettings();
    }
  }

  /**
   * Get the app's package name
   */
  private static getPackageName(): string {
    // This should match the package name in app.config.js
    return 'com.manifestationalarm.app';
  }
}
