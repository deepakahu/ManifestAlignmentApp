const { withAndroidManifest, AndroidConfig } = require('@expo/config-plugins');

/**
 * Config plugin to ensure SCHEDULE_EXACT_ALARM permission is properly added
 * and to add native code for checking permission status
 */
module.exports = function withExactAlarmPermission(config) {
  return withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults;
    const mainApplication = androidManifest.manifest;

    // Ensure permissions array exists
    if (!mainApplication['uses-permission']) {
      mainApplication['uses-permission'] = [];
    }

    // Add SCHEDULE_EXACT_ALARM if not present
    const hasScheduleExactAlarm = mainApplication['uses-permission'].some(
      (perm) => perm.$?.['android:name'] === 'android.permission.SCHEDULE_EXACT_ALARM'
    );

    if (!hasScheduleExactAlarm) {
      mainApplication['uses-permission'].push({
        $: {
          'android:name': 'android.permission.SCHEDULE_EXACT_ALARM',
        },
      });
    }

    // Add USE_EXACT_ALARM if not present (for Android 13+)
    const hasUseExactAlarm = mainApplication['uses-permission'].some(
      (perm) => perm.$?.['android:name'] === 'android.permission.USE_EXACT_ALARM'
    );

    if (!hasUseExactAlarm) {
      mainApplication['uses-permission'].push({
        $: {
          'android:name': 'android.permission.USE_EXACT_ALARM',
        },
      });
    }

    return config;
  });
};
