import 'dotenv/config';

export default {
  expo: {
    name: "Manifestation Alarm",
    slug: "manifestation-alarm",
    owner: "maximus-consult",
    version: "1.0.22",
    orientation: "portrait",
    icon: "./assets/images/icons/icon.png",
    userInterfaceStyle: "light",
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
      versionCode: 23,
      adaptiveIcon: {
        foregroundImage: "./assets/images/icons/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      permissions: [
        "android.permission.VIBRATE",
        "android.permission.WAKE_LOCK",
        "android.permission.RECEIVE_BOOT_COMPLETED",
        "android.permission.SCHEDULE_EXACT_ALARM",
        "android.permission.USE_EXACT_ALARM",
        "android.permission.POST_NOTIFICATIONS",
        "android.permission.USE_FULL_SCREEN_INTENT"
      ],
      config: {
        usesCleartextTraffic: false
      },
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
    plugins: [
      "./plugins/withExactAlarmPermission.js",
      "./plugins/withAndroid16KBSupport.js",
      "./plugins/withAlarmWindowFlags.js",
      "expo-font",
      "@react-native-community/datetimepicker",
      [
        "expo-build-properties",
        {
          android: {
            compileSdkVersion: 35,
            targetSdkVersion: 35,
            buildToolsVersion: "35.0.0",
            ndkVersion: "28.0.12433566",
            useLegacyPackaging: false,
            allowNativeHeapPointerTagging: false,
            extraProguardRules: "-android-api-level 35"
          }
        }
      ],
      [
        "expo-notifications",
        {
          icon: "./assets/images/icons/icon.png",
          color: "#6366f1",
          sounds: [
           "./assets/sounds/ambient_piano.mp3",
          "./assets/sounds/singing_bowl.mp3",
          "./assets/sounds/singing_bowl_hit.mp3",
          "./assets/sounds/tibetan_bowl_low.mp3",
          "./assets/sounds/calm_music.mp3",
          "./assets/sounds/relaxing_guitar.mp3"
          ]
        }
      ]
    ],
    extra: {
      eas: {
        projectId: "e9487115-fde1-4108-b8c4-7e17329fee7c"
      },
      revenueCatAndroidApiKey: process.env.REVENUECAT_ANDROID_API_KEY,
      revenueCatIosApiKey: process.env.REVENUECAT_IOS_API_KEY
    }
  }
};