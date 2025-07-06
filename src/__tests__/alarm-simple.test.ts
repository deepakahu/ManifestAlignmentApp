import { AlarmService } from '../services/AlarmService';

// Mock the dependencies
jest.mock('../services/notifications/NotificationService', () => ({
  NotificationService: {
    scheduleAlarmNotification: jest.fn().mockResolvedValue('notification-id'),
    cancelNotification: jest.fn().mockResolvedValue(undefined),
    cancelAllNotifications: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('../services/storage/StorageService', () => ({
  StorageService: {
    saveAlarm: jest.fn().mockResolvedValue(undefined),
    getAlarms: jest.fn().mockResolvedValue([]),
    deleteAlarm: jest.fn().mockResolvedValue(undefined),
    updateAlarm: jest.fn().mockResolvedValue(undefined),
    clearAllData: jest.fn().mockResolvedValue(undefined),
  },
}));

describe('AlarmService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should save alarm successfully', async () => {
    const mockAlarm = {
      id: 'test-alarm',
      name: 'Test Alarm',
      isEnabled: true,
      interval: { hours: 2, minutes: 0 },
      dayStartTime: '09:00',
      dayEndTime: '17:00',
      activeDays: [true, true, true, true, true, true, true],
      createdAt: new Date(),
    };

    const result = await AlarmService.saveAlarm(mockAlarm);
    expect(result).toBe(true);
  });

  it('should get alarms', async () => {
    const alarms = await AlarmService.getAlarms();
    expect(Array.isArray(alarms)).toBe(true);
  });

  it('should delete alarm', async () => {
    const result = await AlarmService.deleteAlarm('test-id');
    expect(result).toBe(true);
  });

  it('should toggle alarm', async () => {
    const result = await AlarmService.toggleAlarm('test-id', true);
    expect(result).toBe(false); // Returns false when alarm not found
  });
});