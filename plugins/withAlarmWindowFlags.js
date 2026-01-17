const { withAndroidManifest, AndroidConfig } = require('@expo/config-plugins');

/**
 * Config plugin to add alarm-specific Android window flags and permissions
 * This enables:
 * - Full-screen intent notifications (bypass lock screen)
 * - Screen wake on alarm
 * - Show over lock screen
 * - Disable keyguard when alarm rings
 */
const withAlarmWindowFlags = (config) => {
  // Add required permissions
  config = withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults;
    const { manifest } = androidManifest;

    // Ensure manifest has proper structure
    if (!manifest['application']) {
      manifest['application'] = [{}];
    }

    const application = manifest['application'][0];

    // Add USE_FULL_SCREEN_INTENT permission (Android 11+)
    if (!manifest['uses-permission']) {
      manifest['uses-permission'] = [];
    }

    const permissions = [
      'android.permission.USE_FULL_SCREEN_INTENT',
      'android.permission.WAKE_LOCK',
      'android.permission.SYSTEM_ALERT_WINDOW',
      'android.permission.DISABLE_KEYGUARD',
    ];

    permissions.forEach((permission) => {
      const hasPermission = manifest['uses-permission'].some(
        (p) => p.$?.['android:name'] === permission
      );

      if (!hasPermission) {
        manifest['uses-permission'].push({
          $: {
            'android:name': permission,
          },
        });
        console.log(`✅ Added permission: ${permission}`);
      }
    });

    // Add activity metadata for showing over lock screen
    if (!application['activity']) {
      application['activity'] = [];
    }

    // Find the main activity
    const mainActivity = application['activity'].find(
      (activity) =>
        activity.$?.['android:name'] === '.MainActivity'
    );

    if (mainActivity) {
      // Add flags to show over lock screen and turn on screen
      if (!mainActivity.$) {
        mainActivity.$ = {};
      }

      // These flags allow the activity to show over lock screen
      mainActivity.$['android:showWhenLocked'] = 'true';
      mainActivity.$['android:turnScreenOn'] = 'true';

      console.log('✅ Added showWhenLocked and turnScreenOn flags to MainActivity');
    }

    return config;
  });

  return config;
};

module.exports = withAlarmWindowFlags;
