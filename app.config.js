import 'dotenv/config';

export default {
  expo: {
    name: "Manifestation Alarm",
    slug: "manifestation-alarm",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    newArchEnabled: false,
    scheme: "manifestationalarm",
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    ios: {
      supportsTablet: true,
      infoPlist: {
        UIBackgroundModes: ["audio", "background-fetch"],
        NSUserNotificationUsageDescription: "This app uses notifications to remind you to track your mood and practice manifestations."
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
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
      favicon: "./assets/favicon.png"
    },
    notifications: {
      icon: "./assets/icon.png",
      color: "#6366f1",
      sounds: [
        "./assets/sounds/Ambient Piano.mp3",
        "./assets/sounds/Singing Bowl.mp3",
        "./assets/sounds/Singing Bowl Hit.mp3",
        "./assets/sounds/Tibetan Bowl Low.mp3",
        "./assets/sounds/Calm Music.mp3",
        "./assets/sounds/Relaxing Guitar.mp3"
      ]
    },
    plugins: [
      [
        "expo-notifications",
        {
          icon: "./assets/icon.png",
          color: "#6366f1",
          sounds: [
            "./assets/sounds/Ambient Piano.mp3",
            "./assets/sounds/Singing Bowl.mp3",
            "./assets/sounds/Singing Bowl Hit.mp3",
            "./assets/sounds/Tibetan Bowl Low.mp3",
            "./assets/sounds/Calm Music.mp3",
            "./assets/sounds/Relaxing Guitar.mp3"
          ]
        }
      ]
    ],
    extra: {
      eas: {
        projectId: process.env.EXPO_PROJECT_ID || "b8c4a2d6-9f3e-4a7b-8c1d-5e2f3a9b7c4d"
      }
    }
  }
};