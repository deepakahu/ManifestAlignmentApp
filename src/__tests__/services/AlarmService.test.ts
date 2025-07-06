import { Alarm } from '../../types';

// Mock the dependencies using hoisted mocks
jest.mock('../../services/notifications/NotificationService', () => ({
  NotificationService: {
    scheduleAlarmNotification: jest.fn().mockResolvedValue('notification-id'),
    cancelNotification: jest.fn().mockResolvedValue(undefined),
    cancelAllNotifications: jest.fn().mockResolvedValue(undefined),
    getAllScheduledNotifications: jest.fn().mockResolvedValue([]),
  },
}));

jest.mock('../../services/storage/StorageService', () => ({
  StorageService: {
    saveAlarm: jest.fn().mockResolvedValue(undefined),
    getAlarms: jest.fn().mockResolvedValue([]),
    deleteAlarm: jest.fn().mockResolvedValue(undefined),
    updateAlarm: jest.fn().mockResolvedValue(undefined),
    clearAllData: jest.fn().mockResolvedValue(undefined),
  },
}));

// Import AlarmService AFTER mocks are set up
import { AlarmService } from '../../services/AlarmService';
import { NotificationService } from '../../services/notifications/NotificationService';
import { StorageService } from '../../services/storage/StorageService';

// Get the mocked instances
const mockNotificationService = NotificationService as jest.Mocked<typeof NotificationService>;
const mockStorageService = StorageService as jest.Mocked<typeof StorageService>;

// Mock console methods to avoid error output during tests
console.error = jest.fn();
console.warn = jest.fn();
// Don't mock console.log for debugging
// console.log = jest.fn();

describe('AlarmService', () => {
  const mockAlarm: Alarm = {
    id: 'test-alarm',
    name: 'Test Alarm',
    isEnabled: true,
    interval: { hours: 2, minutes: 0 },
    dayStartTime: '09:00',
    dayEndTime: '17:00',
    activeDays: [true, true, true, true, true, false, false],
    createdAt: new Date('2023-01-01'),
  };

  const mockTestAlarm: Alarm = {
    ...mockAlarm,
    id: 'test-alarm-2',
    name: 'Test Mode Alarm',
    interval: 'test_mode',
    testInterval: 1,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initialize', () => {
    it('should initialize only once', () => {
      AlarmService.initialize();
      AlarmService.initialize();
      // Should not throw error and should work correctly
    });
  });

  describe('saveAlarm', () => {
    it('should save alarm successfully when disabled', async () => {
      const disabledAlarm = { ...mockAlarm, isEnabled: false };
      mockStorageService.saveAlarm.mockResolvedValueOnce(undefined);
      const result = await AlarmService.saveAlarm(disabledAlarm);
      
      // Check if mock was called
      expect(mockStorageService.saveAlarm).toHaveBeenCalledWith(disabledAlarm);
      
      // Check if console.error was called (which would indicate an error occurred)
      expect(console.error).not.toHaveBeenCalled();
      
      expect(result).toBe(true);
    });

    it('should handle save errors', async () => {
      mockStorageService.saveAlarm.mockRejectedValueOnce(new Error('Save error'));
      const result = await AlarmService.saveAlarm(mockAlarm);
      expect(result).toBe(false);
    });
  });

  describe('getAlarms', () => {
    it('should get alarms successfully', async () => {
      const mockAlarms = [mockAlarm];
      mockStorageService.getAlarms.mockResolvedValueOnce(mockAlarms);
      
      const result = await AlarmService.getAlarms();
      expect(result).toEqual(mockAlarms);
      expect(mockStorageService.getAlarms).toHaveBeenCalled();
    });

    it('should handle get errors', async () => {
      mockStorageService.getAlarms.mockRejectedValueOnce(new Error('Get error'));
      
      const result = await AlarmService.getAlarms();
      expect(result).toEqual([]);
    });
  });

  describe('deleteAlarm', () => {
    it('should handle delete errors', async () => {
      mockStorageService.deleteAlarm.mockRejectedValueOnce(new Error('Delete error'));
      
      const result = await AlarmService.deleteAlarm('test-alarm');
      expect(result).toBe(false);
    });
  });

  describe('toggleAlarm', () => {
    it('should return false when alarm not found', async () => {
      mockStorageService.getAlarms.mockResolvedValueOnce([]);
      
      const result = await AlarmService.toggleAlarm('non-existent', true);
      expect(result).toBe(false);
    });

    it('should handle toggle errors', async () => {
      mockStorageService.getAlarms.mockRejectedValueOnce(new Error('Toggle error'));
      
      const result = await AlarmService.toggleAlarm('test-alarm', true);
      expect(result).toBe(false);
    });
  });

  describe('generateNotificationTimes', () => {
    it('should generate times for regular interval', () => {
      const date = new Date('2023-01-01T00:00:00');
      const times = AlarmService.generateNotificationTimes(
        '09:00',
        '17:00',
        { hours: 2, minutes: 0 },
        date
      );
      
      expect(times.length).toBeGreaterThan(0);
      expect(times[0].getHours()).toBe(9);
      expect(times[0].getMinutes()).toBe(0);
    });

    it('should generate times for test mode', () => {
      const date = new Date();
      const times = AlarmService.generateNotificationTimes(
        '09:00',
        '17:00',
        'test_mode',
        date,
        2
      );
      
      expect(times.length).toBe(5);
    });

    it('should handle test mode without testInterval', () => {
      const date = new Date();
      const times = AlarmService.generateNotificationTimes(
        '09:00',
        '17:00',
        'test_mode',
        date
      );
      
      expect(times.length).toBe(5);
    });

    it('should handle intervals with minutes', () => {
      const date = new Date('2023-01-01T00:00:00');
      const times = AlarmService.generateNotificationTimes(
        '09:00',
        '11:00',
        { hours: 0, minutes: 30 },
        date
      );
      
      expect(times.length).toBeGreaterThan(0);
      expect(times[1].getMinutes()).toBe(30);
    });
  });

  describe('getActiveAlarms', () => {
    it('should return only enabled alarms', async () => {
      const alarms = [
        { ...mockAlarm, isEnabled: true },
        { ...mockAlarm, id: 'alarm-2', isEnabled: false },
      ];
      mockStorageService.getAlarms.mockResolvedValueOnce(alarms);
      
      const result = await AlarmService.getActiveAlarms();
      expect(result).toHaveLength(1);
      expect(result[0].isEnabled).toBe(true);
    });
  });

  describe('getAlarmById', () => {
    it('should return alarm by id', async () => {
      mockStorageService.getAlarms.mockResolvedValueOnce([mockAlarm]);
      
      const result = await AlarmService.getAlarmById('test-alarm');
      expect(result).toEqual(mockAlarm);
    });

    it('should return undefined when alarm not found', async () => {
      mockStorageService.getAlarms.mockResolvedValueOnce([]);
      
      const result = await AlarmService.getAlarmById('non-existent');
      expect(result).toBeUndefined();
    });
  });

  describe('formatNextTrigger', () => {
    it('should format next trigger correctly', () => {
      const futureTime = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours from now
      const alarmWithTrigger = { ...mockAlarm, nextTrigger: futureTime };
      
      const result = AlarmService.formatNextTrigger(alarmWithTrigger);
      expect(result).toContain('2h');
    });

    it('should handle no next trigger', () => {
      const alarmWithoutTrigger = { ...mockAlarm, nextTrigger: undefined };
      
      const result = AlarmService.formatNextTrigger(alarmWithoutTrigger);
      expect(result).toBe('Not scheduled');
    });

    it('should handle overdue triggers', () => {
      const pastTime = new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago
      const alarmWithPastTrigger = { ...mockAlarm, nextTrigger: pastTime };
      
      const result = AlarmService.formatNextTrigger(alarmWithPastTrigger);
      expect(result).toBe('Overdue');
    });

    it('should format days correctly', () => {
      const futureTime = new Date(Date.now() + 30 * 60 * 60 * 1000); // 30 hours from now
      const alarmWithTrigger = { ...mockAlarm, nextTrigger: futureTime };
      
      const result = AlarmService.formatNextTrigger(alarmWithTrigger);
      expect(result).toContain('day');
    });

    it('should format minutes correctly', () => {
      const futureTime = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes from now
      const alarmWithTrigger = { ...mockAlarm, nextTrigger: futureTime };
      
      const result = AlarmService.formatNextTrigger(alarmWithTrigger);
      expect(result).toContain('30m');
    });
  });

  describe('basic functionality', () => {
    it('should handle error cases gracefully', async () => {
      // Test that error-prone methods don't throw
      await expect(AlarmService.recordAlarmTrigger('test-alarm')).resolves.not.toThrow();
      await expect(AlarmService.refreshAllAlarms()).resolves.not.toThrow(); // Should succeed with proper mocks
      await expect(AlarmService.cancelAlarmNotifications('test-alarm')).resolves.not.toThrow();
    });
  });
});