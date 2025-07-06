import { StorageService } from '../../services/storage/StorageService';
import { mockStorageData } from '../../test-utils/mockData';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => 
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

const createMockMoodEntry = () => ({
  id: 'test-mood-' + Math.random().toString(36).substr(2, 9),
  mood: 4,
  timestamp: new Date(),
  notes: 'Test mood entry',
  tags: ['happy', 'productive'],
});

const createMockManifestationEntry = () => ({
  id: 'test-manifestation-' + Math.random().toString(36).substr(2, 9),
  title: 'Test Manifestation',
  description: 'This is a test manifestation',
  category: 'Personal',
  createdAt: new Date(),
  isCompleted: false,
  readHistory: [],
});

const createMockAlarm = () => ({
  id: 'test-alarm-' + Math.random().toString(36).substr(2, 9),
  name: 'Test Alarm',
  isEnabled: true,
  interval: { hours: 2, minutes: 0 },
  dayStartTime: '09:00',
  dayEndTime: '21:00',
  activeDays: [true, true, true, true, true, true, true],
  createdAt: new Date(),
});

describe('StorageService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('User Data Management', () => {
    it('should get user data', async () => {
      const userData = await StorageService.getUserData();
      expect(userData).toBeNull();
    });

    it('should save user data', async () => {
      const user = {
        id: 'test-user',
        name: 'Test User',
        email: 'test@example.com',
        createdAt: new Date(),
        preferences: {
          notificationsEnabled: true,
          soundEnabled: true,
          theme: 'light' as const,
        },
      };

      await expect(StorageService.saveUserData(user)).resolves.not.toThrow();
    });
  });

  describe('Mood Entry Management', () => {
    it('should save mood entry successfully', async () => {
      const mockEntry = createMockMoodEntry();
      
      await expect(StorageService.saveMoodEntry(mockEntry)).resolves.not.toThrow();
    });

    it('should get mood entries', async () => {
      const entries = await StorageService.getMoodEntries();
      expect(Array.isArray(entries)).toBe(true);
    });

    it('should update mood entry', async () => {
      const updates = { notes: 'Updated notes' };
      
      await expect(StorageService.updateMoodEntry('test-id', updates)).resolves.not.toThrow();
    });

    it('should delete mood entry', async () => {
      await expect(StorageService.deleteMoodEntry('test-id')).resolves.not.toThrow();
    });
  });

  describe('Manifestation Entry Management', () => {
    it('should save manifestation entry successfully', async () => {
      const mockEntry = createMockManifestationEntry();
      
      await expect(StorageService.saveManifestationEntry(mockEntry)).resolves.not.toThrow();
    });

    it('should get manifestation entries', async () => {
      const entries = await StorageService.getManifestationEntries();
      expect(Array.isArray(entries)).toBe(true);
    });

    it('should update manifestation entry', async () => {
      const updates = { isCompleted: true };
      
      await expect(StorageService.updateManifestationEntry('test-id', updates)).resolves.not.toThrow();
    });

    it('should delete manifestation entry', async () => {
      await expect(StorageService.deleteManifestationEntry('test-id')).resolves.not.toThrow();
    });
  });

  describe('Alarm Management', () => {
    it('should save alarm successfully', async () => {
      const mockAlarm = createMockAlarm();
      
      await expect(StorageService.saveAlarm(mockAlarm)).resolves.not.toThrow();
    });

    it('should get alarms', async () => {
      const alarms = await StorageService.getAlarms();
      expect(Array.isArray(alarms)).toBe(true);
    });

    it('should update alarm', async () => {
      const updates = { isEnabled: false };
      
      await expect(StorageService.updateAlarm('test-id', updates)).resolves.not.toThrow();
    });

    it('should delete alarm', async () => {
      await expect(StorageService.deleteAlarm('test-id')).resolves.not.toThrow();
    });
  });

  describe('Utility Methods', () => {
    it('should export data', async () => {
      const exportData = await StorageService.exportData();
      expect(typeof exportData).toBe('string');
      expect(() => JSON.parse(exportData)).not.toThrow();
    });

    it('should clear all data', async () => {
      await expect(StorageService.clearAllData()).resolves.not.toThrow();
    });
  });
});