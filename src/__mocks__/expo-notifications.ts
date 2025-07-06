// Mock for expo-notifications
const mockSetNotificationHandler = jest.fn();
const mockAddNotificationReceivedListener = jest.fn();
const mockAddNotificationResponseReceivedListener = jest.fn();
const mockSetNotificationChannelAsync = jest.fn().mockResolvedValue(undefined);
const mockGetPermissionsAsync = jest.fn().mockResolvedValue({ status: 'granted' });
const mockRequestPermissionsAsync = jest.fn().mockResolvedValue({ status: 'granted' });
const mockGetExpoPushTokenAsync = jest.fn().mockResolvedValue({ data: 'ExponentPushToken[test]' });
const mockScheduleNotificationAsync = jest.fn().mockResolvedValue('notification-id');
const mockCancelScheduledNotificationAsync = jest.fn().mockResolvedValue(undefined);
const mockCancelAllScheduledNotificationsAsync = jest.fn().mockResolvedValue(undefined);
const mockGetAllScheduledNotificationsAsync = jest.fn().mockResolvedValue([]);
const mockGetBadgeCountAsync = jest.fn().mockResolvedValue(0);
const mockSetBadgeCountAsync = jest.fn().mockResolvedValue(undefined);

export const setNotificationHandler = mockSetNotificationHandler;
export const addNotificationReceivedListener = mockAddNotificationReceivedListener;
export const addNotificationResponseReceivedListener = mockAddNotificationResponseReceivedListener;
export const setNotificationChannelAsync = mockSetNotificationChannelAsync;
export const getPermissionsAsync = mockGetPermissionsAsync;
export const requestPermissionsAsync = mockRequestPermissionsAsync;
export const getExpoPushTokenAsync = mockGetExpoPushTokenAsync;
export const scheduleNotificationAsync = mockScheduleNotificationAsync;
export const cancelScheduledNotificationAsync = mockCancelScheduledNotificationAsync;
export const cancelAllScheduledNotificationsAsync = mockCancelAllScheduledNotificationsAsync;
export const getAllScheduledNotificationsAsync = mockGetAllScheduledNotificationsAsync;
export const getBadgeCountAsync = mockGetBadgeCountAsync;
export const setBadgeCountAsync = mockSetBadgeCountAsync;

export const AndroidImportance = {
  HIGH: 'high',
  DEFAULT: 'default',
  LOW: 'low',
  MAX: 'max',
  MIN: 'min',
};

export const IosAuthorizationStatus = {
  NOT_DETERMINED: 0,
  DENIED: 1,
  AUTHORIZED: 2,
  PROVISIONAL: 3,
  EPHEMERAL: 4,
};