// Mock expo modules before importing
jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  addNotificationReceivedListener: jest.fn(),
  addNotificationResponseReceivedListener: jest.fn(),
  setNotificationChannelAsync: jest.fn().mockResolvedValue(undefined),
  getPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  requestPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  getExpoPushTokenAsync: jest.fn().mockResolvedValue({ data: 'ExponentPushToken[test]' }),
  scheduleNotificationAsync: jest.fn().mockResolvedValue('notification-id'),
  cancelScheduledNotificationAsync: jest.fn().mockResolvedValue(undefined),
  cancelAllScheduledNotificationsAsync: jest.fn().mockResolvedValue(undefined),
  getAllScheduledNotificationsAsync: jest.fn().mockResolvedValue([]),
  getBadgeCountAsync: jest.fn().mockResolvedValue(0),
  setBadgeCountAsync: jest.fn().mockResolvedValue(undefined),
  AndroidImportance: {
    HIGH: 'high',
  },
}));

jest.mock('expo-device', () => ({
  isDevice: true,
}));

jest.mock('expo-constants', () => ({
  default: {
    expoConfig: {
      extra: {
        eas: {
          projectId: 'test-project-id',
        },
      },
    },
  },
}));

jest.mock('expo-linking', () => ({
  openURL: jest.fn().mockResolvedValue(undefined),
}));

// Now import after mocks are set up
import { NotificationService } from '../../services/notifications/NotificationService';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import * as Linking from 'expo-linking';

// Get mocked functions
const mockNotifications = Notifications as jest.Mocked<typeof Notifications>;
const mockDevice = Device as jest.Mocked<typeof Device>;
const mockLinking = Linking as jest.Mocked<typeof Linking>;

describe('NotificationService', () => {
  const mockNavigationRef = {
    current: {
      navigate: jest.fn(),
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    console.error = jest.fn();
    console.warn = jest.fn();
    // console.log = jest.fn(); // Allow console.log for debugging
    
    // Reset Platform OS to android for consistent testing
    Platform.OS = 'android';
  });

  describe('initialize', () => {
    it('should initialize successfully on Android with device', async () => {
      Platform.OS = 'android';
      mockDevice.isDevice = true;
      
      await NotificationService.initialize(mockNavigationRef);
      
      expect(mockNotifications.setNotificationChannelAsync).toHaveBeenCalledWith(
        'mood-reminders',
        expect.objectContaining({
          name: 'Mood Reminders',
          importance: 'high',
        })
      );
      expect(mockNotifications.getPermissionsAsync).toHaveBeenCalled();
      expect(mockNotifications.getExpoPushTokenAsync).toHaveBeenCalled();
    });

    it('should initialize successfully on iOS with device', async () => {
      Platform.OS = 'ios';
      mockDevice.isDevice = true;
      
      await NotificationService.initialize();
      
      expect(mockNotifications.setNotificationChannelAsync).not.toHaveBeenCalled();
      expect(mockNotifications.getPermissionsAsync).toHaveBeenCalled();
    });

    it('should handle permission not granted', async () => {
      mockNotifications.getPermissionsAsync.mockResolvedValueOnce({ status: 'denied' });
      mockNotifications.requestPermissionsAsync.mockResolvedValueOnce({ status: 'denied' });
      
      await NotificationService.initialize();
      
      expect(console.warn).toHaveBeenCalledWith('Permission not granted for notifications');
    });

    it('should initialize successfully on device environment', async () => {
      // Test that the service initializes without the non-device warning
      // when running on a physical device (isDevice = true in our mock)
      await NotificationService.initialize();
      
      // Should not show the non-device warning since isDevice is true
      expect(console.warn).not.toHaveBeenCalledWith('Must use physical device for push notifications');
    });

    it('should handle push token errors', async () => {
      mockNotifications.getExpoPushTokenAsync.mockRejectedValueOnce(new Error('Token error'));
      
      await NotificationService.initialize();
      
      expect(console.warn).toHaveBeenCalledWith('Failed to get push token:', expect.any(Error));
    });

    it('should handle initialization errors', async () => {
      mockNotifications.getPermissionsAsync.mockRejectedValueOnce(new Error('Init error'));
      
      await NotificationService.initialize();
      
      expect(console.error).toHaveBeenCalledWith('Error initializing notifications:', expect.any(Error));
    });
  });

  describe('scheduleNotification', () => {
    it('should schedule notification with Date trigger', async () => {
      const date = new Date();
      const notificationId = await NotificationService.scheduleNotification(
        'Test Title',
        'Test Body',
        { test: 'data' },
        date
      );
      
      expect(notificationId).toBe('notification-id');
      expect(mockNotifications.scheduleNotificationAsync).toHaveBeenCalledWith({
        content: {
          title: 'Test Title',
          body: 'Test Body',
          data: { test: 'data' },
          sound: 'default',
        },
        trigger: { type: 'date', date },
      });
    });

    it('should schedule notification with number trigger', async () => {
      const seconds = 60;
      const notificationId = await NotificationService.scheduleNotification(
        'Test Title',
        'Test Body',
        { test: 'data' },
        seconds
      );
      
      expect(notificationId).toBe('notification-id');
      expect(mockNotifications.scheduleNotificationAsync).toHaveBeenCalledWith({
        content: {
          title: 'Test Title',
          body: 'Test Body',
          data: { test: 'data' },
          sound: 'default',
        },
        trigger: { type: 'timeInterval', seconds },
      });
    });

    it('should handle scheduling errors', async () => {
      mockNotifications.scheduleNotificationAsync.mockRejectedValueOnce(new Error('Schedule error'));
      
      await expect(NotificationService.scheduleNotification(
        'Test Title',
        'Test Body',
        { test: 'data' },
        new Date()
      )).rejects.toThrow('Schedule error');
    });
  });

  describe('cancelNotification', () => {
    it('should cancel notification successfully', async () => {
      await NotificationService.cancelNotification('test-id');
      
      expect(mockNotifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith('test-id');
    });

    it('should handle cancel errors', async () => {
      mockNotifications.cancelScheduledNotificationAsync.mockRejectedValueOnce(new Error('Cancel error'));
      
      await expect(NotificationService.cancelNotification('test-id')).rejects.toThrow('Cancel error');
    });
  });

  describe('cancelAllNotifications', () => {
    it('should cancel all notifications successfully', async () => {
      await NotificationService.cancelAllNotifications();
      
      expect(mockNotifications.cancelAllScheduledNotificationsAsync).toHaveBeenCalled();
    });

    it('should handle cancel all errors', async () => {
      mockNotifications.cancelAllScheduledNotificationsAsync.mockRejectedValueOnce(new Error('Cancel all error'));
      
      await expect(NotificationService.cancelAllNotifications()).rejects.toThrow('Cancel all error');
    });
  });

  describe('getAllScheduledNotifications', () => {
    it('should get all scheduled notifications successfully', async () => {
      const testNotifications = [{ id: 'test-1' }, { id: 'test-2' }];
      mockNotifications.getAllScheduledNotificationsAsync.mockResolvedValueOnce(testNotifications);
      
      const result = await NotificationService.getAllScheduledNotifications();
      
      expect(result).toEqual(testNotifications);
    });

    it('should handle get all errors', async () => {
      mockNotifications.getAllScheduledNotificationsAsync.mockRejectedValueOnce(new Error('Get all error'));
      
      const result = await NotificationService.getAllScheduledNotifications();
      
      expect(result).toEqual([]);
      expect(console.error).toHaveBeenCalledWith('Error getting scheduled notifications:', expect.any(Error));
    });
  });

  describe('scheduleAlarmNotification', () => {
    it('should schedule alarm notification successfully', async () => {
      const triggerDate = new Date();
      const notificationId = await NotificationService.scheduleAlarmNotification(
        'test-alarm-id',
        'Morning Check-in',
        triggerDate
      );
      
      expect(notificationId).toBe('notification-id');
      expect(mockNotifications.scheduleNotificationAsync).toHaveBeenCalledWith({
        content: {
          title: 'Mood Check-In',
          body: 'Time for your Morning Check-in mood check-in!',
          data: {
            type: 'mood_reminder',
            alarmId: 'test-alarm-id',
            alarmName: 'Morning Check-in',
          },
          sound: 'default',
        },
        trigger: { type: 'date', date: triggerDate },
      });
    });

    it('should handle alarm notification errors', async () => {
      mockNotifications.scheduleNotificationAsync.mockRejectedValueOnce(new Error('Alarm error'));
      
      await expect(NotificationService.scheduleAlarmNotification(
        'test-alarm-id',
        'Morning Check-in',
        new Date()
      )).rejects.toThrow('Alarm error');
    });
  });

  describe('getBadgeCountAsync', () => {
    it('should get badge count successfully', async () => {
      mockNotifications.getBadgeCountAsync.mockResolvedValueOnce(5);
      
      const count = await NotificationService.getBadgeCountAsync();
      
      expect(count).toBe(5);
    });

    it('should handle get badge count errors', async () => {
      mockNotifications.getBadgeCountAsync.mockRejectedValueOnce(new Error('Badge error'));
      
      const count = await NotificationService.getBadgeCountAsync();
      
      expect(count).toBe(0);
      expect(console.error).toHaveBeenCalledWith('Error getting badge count:', expect.any(Error));
    });
  });

  describe('setBadgeCountAsync', () => {
    it('should set badge count successfully', async () => {
      await NotificationService.setBadgeCountAsync(10);
      
      expect(mockNotifications.setBadgeCountAsync).toHaveBeenCalledWith(10);
    });

    it('should handle set badge count errors', async () => {
      mockNotifications.setBadgeCountAsync.mockRejectedValueOnce(new Error('Set badge error'));
      
      await NotificationService.setBadgeCountAsync(10);
      
      expect(console.error).toHaveBeenCalledWith('Error setting badge count:', expect.any(Error));
    });
  });

  describe('notification listeners', () => {
    it('should setup notification listeners', async () => {
      await NotificationService.initialize(mockNavigationRef);
      
      expect(mockNotifications.addNotificationReceivedListener).toHaveBeenCalled();
      expect(mockNotifications.addNotificationResponseReceivedListener).toHaveBeenCalled();
    });

    it('should handle notification received', async () => {
      let receivedListener: Function;
      mockNotifications.addNotificationReceivedListener.mockImplementation((callback) => {
        receivedListener = callback;
      });
      
      await NotificationService.initialize();
      
      const notification = { id: 'test-notification' };
      receivedListener!(notification);
      
      expect(console.log).toHaveBeenCalledWith('Notification received:', notification);
    });

    it('should handle notification response and navigate', async () => {
      let responseListener: Function;
      mockNotifications.addNotificationResponseReceivedListener.mockImplementation((callback) => {
        responseListener = callback;
      });
      
      await NotificationService.initialize(mockNavigationRef);
      
      const response = {
        actionIdentifier: 'default',
        notification: {
          request: {
            content: {
              data: {
                type: 'mood_reminder',
                alarmId: 'test-alarm',
                alarmName: 'Test Alarm',
              },
            },
          },
        },
      };
      
      responseListener!(response);
      
      // Wait for setTimeout
      await new Promise(resolve => setTimeout(resolve, 150));
      
      expect(mockNavigationRef.current.navigate).toHaveBeenCalledWith('MoodRecording', {
        alarmId: 'test-alarm',
        alarmName: 'Test Alarm',
        fromNotification: true,
        timestamp: expect.any(String),
      });
    });

    it('should handle navigation errors and fallback to deep link', async () => {
      let responseListener: Function;
      mockNotifications.addNotificationResponseReceivedListener.mockImplementation((callback) => {
        responseListener = callback;
      });
      
      const mockNavigationRefWithError = {
        current: {
          navigate: jest.fn().mockImplementation(() => {
            throw new Error('Navigation error');
          }),
        },
      };
      
      await NotificationService.initialize(mockNavigationRefWithError);
      
      const response = {
        actionIdentifier: 'default',
        notification: {
          request: {
            content: {
              data: {
                type: 'mood_reminder',
                alarmId: 'test-alarm',
                alarmName: 'Test Alarm',
              },
            },
          },
        },
      };
      
      responseListener!(response);
      
      // Wait for setTimeout
      await new Promise(resolve => setTimeout(resolve, 150));
      
      expect(console.error).toHaveBeenCalledWith('Navigation error:', expect.any(Error));
      expect(mockLinking.openURL).toHaveBeenCalledWith('manifestexpo://mood-recording/test-alarm?alarmName=Test%20Alarm');
    });

    it('should handle deep link errors', async () => {
      let responseListener: Function;
      mockNotifications.addNotificationResponseReceivedListener.mockImplementation((callback) => {
        responseListener = callback;
      });
      
      mockLinking.openURL.mockRejectedValueOnce(new Error('Deep link error'));
      
      const mockNavigationRefWithError = {
        current: {
          navigate: jest.fn().mockImplementation(() => {
            throw new Error('Navigation error');
          }),
        },
      };
      
      await NotificationService.initialize(mockNavigationRefWithError);
      
      const response = {
        actionIdentifier: 'default',
        notification: {
          request: {
            content: {
              data: {
                type: 'mood_reminder',
                alarmId: 'test-alarm',
                alarmName: 'Test Alarm',
              },
            },
          },
        },
      };
      
      responseListener!(response);
      
      // Wait for setTimeout
      await new Promise(resolve => setTimeout(resolve, 150));
      
      expect(console.error).toHaveBeenCalledWith('Deep link failed:', expect.any(Error));
    });
  });
});