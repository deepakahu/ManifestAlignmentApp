import { StorageService } from '../services/storage/StorageService';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => 
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

describe('StorageService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

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

  it('should get mood entries', async () => {
    const entries = await StorageService.getMoodEntries();
    expect(Array.isArray(entries)).toBe(true);
  });

  it('should get manifestation entries', async () => {
    const entries = await StorageService.getManifestationEntries();
    expect(Array.isArray(entries)).toBe(true);
  });

  it('should get alarms', async () => {
    const alarms = await StorageService.getAlarms();
    expect(Array.isArray(alarms)).toBe(true);
  });
});