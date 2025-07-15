import 'dotenv/config';

export default {
  expo: {
    name: "Manifestation Alarm",
    slug: "manifestation-alarm",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icons/icon.png",
    userInterfaceStyle: "light",
    newArchEnabled: false,
    scheme: "manifestationalarm",
    splash: {
      image: "./assets/images/splash/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    ios: {
      bundleIdentifier: 'com.manifestationalarm.app',
      supportsTablet: true,
      infoPlist: {
        UIBackgroundModes: ['audio', 'background-fetch'],
        NSUserNotificationUsageDescription:
          'This app uses notifications to remind you to track your mood and practice manifestations.',
      },
    },
    android: {
      package: "com.manifestationalarm.app",
      adaptiveIcon: {
        foregroundImage: "./assets/images/icons/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      permissions: [
        "android.permission.VIBRATE",
        "android.permission.WAKE_LOCK",
        "android.permission.RECEIVE_BOOT_COMPLETED"
      ],
      intentFilters: [
        {
          action: "VIEW",
          data: [
            {
              scheme: "manifestationalarm"
            }
          ],
          category: ["BROWSABLE", "DEFAULT"]
        }
      ]
    },
    web: {
      favicon: "./assets/images/icons/favicon.png"
    },
    notifications: {
      icon: "./assets/images/icons/icon.png",
      color: "#6366f1"
    },
    plugins: [
      [
        "expo-notifications",
        {
          icon: "./assets/images/icons/icon.png",
          color: "#6366f1"
        }
      ]
    ],
    extra: {
      eas: {
        projectId: "e9487115-fde1-4108-b8c4-7e17329fee7c"
      }
    }
  }
};