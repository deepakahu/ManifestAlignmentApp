// Mock for expo-constants
export default {
  expoConfig: {
    extra: {
      eas: {
        projectId: 'test-project-id',
      },
    },
  },
  easConfig: {
    projectId: 'test-project-id',
  },
  appOwnership: 'standalone',
  debugMode: false,
  deviceName: 'Test Device',
  deviceYearClass: 2023,
  isDevice: true,
  platform: {
    ios: undefined,
    android: {
      versionCode: 4,
    },
  },
  sessionId: 'test-session-id',
  statusBarHeight: 24,
  systemFonts: ['System'],
  systemVersion: '13',
  linkingUri: 'manifestexpo://',
};