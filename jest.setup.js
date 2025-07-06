import 'react-native-gesture-handler/jestSetup';

// Mock React Native modules
jest.mock('react-native-vector-icons/Ionicons', () => 'Ionicons');
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
  AntDesign: 'AntDesign',
  MaterialIcons: 'MaterialIcons',
  FontAwesome: 'FontAwesome',
  Feather: 'Feather',
}));
jest.mock('@react-native-async-storage/async-storage', () => 
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock Expo modules
jest.mock('expo-notifications', () => ({
  requestPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  getPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  scheduleNotificationAsync: jest.fn().mockResolvedValue('flow-test-notification-123'),
  cancelNotificationAsync: jest.fn().mockResolvedValue(undefined),
  cancelScheduledNotificationAsync: jest.fn().mockResolvedValue(undefined),
  cancelAllScheduledNotificationsAsync: jest.fn().mockResolvedValue(undefined),
  getAllScheduledNotificationsAsync: jest.fn().mockResolvedValue([]),
  getBadgeCountAsync: jest.fn().mockResolvedValue(0),
  setBadgeCountAsync: jest.fn().mockResolvedValue(undefined),
  setNotificationHandler: jest.fn(),
  setNotificationChannelAsync: jest.fn().mockResolvedValue(undefined),
  addNotificationReceivedListener: jest.fn().mockReturnValue({ remove: jest.fn() }),
  addNotificationResponseReceivedListener: jest.fn().mockReturnValue({ remove: jest.fn() }),
  removeNotificationSubscription: jest.fn(),
  AndroidImportance: {
    HIGH: 'high',
  },
}));

jest.mock('expo-linking', () => ({
  createURL: jest.fn(),
  getInitialURL: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
}));

// Mock React Native Alert and Linking
global.mockAlert = jest.fn();
global.mockLinking = {
  openURL: jest.fn(),
};

jest.mock('react-native/Libraries/Alert/Alert', () => ({
  alert: global.mockAlert,
}));

jest.mock('react-native/Libraries/Linking/Linking', () => global.mockLinking);

jest.mock('expo-constants', () => ({
  default: {
    expoConfig: {
      projectId: 'test-project-id',
    },
  },
}));

jest.mock('expo-device', () => ({
  isDevice: true,
  brand: 'Test',
  manufacturer: 'Test',
  modelName: 'Test Device',
  deviceName: 'Test Device',
  osName: 'Android',
  osVersion: '10',
  platformApiLevel: 29,
}));

// Mock React Navigation
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
    dispatch: jest.fn(),
  }),
  useRoute: () => ({
    params: {},
  }),
  NavigationContainer: ({ children }) => children,
}));

jest.mock('@react-navigation/bottom-tabs', () => ({
  createBottomTabNavigator: () => ({
    Navigator: ({ children }) => children,
    Screen: ({ children }) => children,
  }),
}));

jest.mock('@react-navigation/native-stack', () => ({
  createNativeStackNavigator: () => ({
    Navigator: ({ children }) => children,
    Screen: ({ children }) => children,
  }),
}));

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock global.__DEV__
global.__DEV__ = true;

// Mock fetch
global.fetch = jest.fn();

// Mock Date for consistent tests  
const RealDate = Date;
global.Date = class extends RealDate {
  constructor(...args) {
    if (args.length === 0) {
      super('2023-01-01T00:00:00.000Z');
    } else {
      super(...args);
    }
  }
  
  static now() {
    return new RealDate('2023-01-01T00:00:00.000Z').getTime();
  }
};