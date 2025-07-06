import AsyncStorage from '@react-native-async-storage/async-storage';
import {MoodEntry, ManifestationEntry, User, Alarm} from '../../types';

const STORAGE_KEYS = {
  USER_DATA: 'user_data',
  MOOD_ENTRIES: 'mood_entries',
  MANIFESTATION_ENTRIES: 'manifestation_entries',
  ALARMS: 'alarms',
};

export class StorageService {
  // User Data
  static async getUserData(): Promise<User | null> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error loading user data:', error);
      return null;
    }
  }

  static async saveUserData(userData: User): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
    } catch (error) {
      console.error('Error saving user data:', error);
      throw error;
    }
  }

  // Mood Entries
  static async getMoodEntries(): Promise<MoodEntry[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.MOOD_ENTRIES);
      const entries = data ? JSON.parse(data) : [];
      return entries.map((entry: any) => ({
        ...entry,
        timestamp: new Date(entry.timestamp),
      }));
    } catch (error) {
      console.error('Error loading mood entries:', error);
      return [];
    }
  }

  static async saveMoodEntry(entry: MoodEntry): Promise<void> {
    try {
      const entries = await this.getMoodEntries();
      const updatedEntries = [...entries, entry];
      await AsyncStorage.setItem(STORAGE_KEYS.MOOD_ENTRIES, JSON.stringify(updatedEntries));
    } catch (error) {
      console.error('Error saving mood entry:', error);
      throw error;
    }
  }

  static async updateMoodEntry(id: string, updates: Partial<MoodEntry>): Promise<void> {
    try {
      const entries = await this.getMoodEntries();
      const updatedEntries = entries.map(entry =>
        entry.id === id ? {...entry, ...updates} : entry
      );
      await AsyncStorage.setItem(STORAGE_KEYS.MOOD_ENTRIES, JSON.stringify(updatedEntries));
    } catch (error) {
      console.error('Error updating mood entry:', error);
      throw error;
    }
  }

  static async deleteMoodEntry(id: string): Promise<void> {
    try {
      const entries = await this.getMoodEntries();
      const filteredEntries = entries.filter(entry => entry.id !== id);
      await AsyncStorage.setItem(STORAGE_KEYS.MOOD_ENTRIES, JSON.stringify(filteredEntries));
    } catch (error) {
      console.error('Error deleting mood entry:', error);
      throw error;
    }
  }

  static async saveMoodEntries(entries: MoodEntry[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.MOOD_ENTRIES, JSON.stringify(entries));
    } catch (error) {
      console.error('Error saving mood entries:', error);
      throw error;
    }
  }

  // Manifestation Entries
  static async getManifestationEntries(): Promise<ManifestationEntry[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.MANIFESTATION_ENTRIES);
      const entries = data ? JSON.parse(data) : [];
      return entries.map((entry: any) => ({
        ...entry,
        createdAt: new Date(entry.createdAt),
        completedAt: entry.completedAt ? new Date(entry.completedAt) : undefined,
        targetDate: entry.targetDate ? new Date(entry.targetDate) : undefined,
      }));
    } catch (error) {
      console.error('Error loading manifestation entries:', error);
      return [];
    }
  }

  static async saveManifestationEntry(entry: ManifestationEntry): Promise<void> {
    try {
      const entries = await this.getManifestationEntries();
      const updatedEntries = [...entries, entry];
      await AsyncStorage.setItem(STORAGE_KEYS.MANIFESTATION_ENTRIES, JSON.stringify(updatedEntries));
    } catch (error) {
      console.error('Error saving manifestation entry:', error);
      throw error;
    }
  }

  static async updateManifestationEntry(id: string, updates: Partial<ManifestationEntry>): Promise<void> {
    try {
      const entries = await this.getManifestationEntries();
      const updatedEntries = entries.map(entry =>
        entry.id === id ? {...entry, ...updates} : entry
      );
      await AsyncStorage.setItem(STORAGE_KEYS.MANIFESTATION_ENTRIES, JSON.stringify(updatedEntries));
    } catch (error) {
      console.error('Error updating manifestation entry:', error);
      throw error;
    }
  }

  static async deleteManifestationEntry(id: string): Promise<void> {
    try {
      const entries = await this.getManifestationEntries();
      const filteredEntries = entries.filter(entry => entry.id !== id);
      await AsyncStorage.setItem(STORAGE_KEYS.MANIFESTATION_ENTRIES, JSON.stringify(filteredEntries));
    } catch (error) {
      console.error('Error deleting manifestation entry:', error);
      throw error;
    }
  }

  // Alarms
  static async getAlarms(): Promise<Alarm[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.ALARMS);
      const alarms = data ? JSON.parse(data) : [];
      return alarms.map((alarm: any) => ({
        ...alarm,
        createdAt: new Date(alarm.createdAt),
        lastTriggered: alarm.lastTriggered ? new Date(alarm.lastTriggered) : undefined,
        nextTrigger: alarm.nextTrigger ? new Date(alarm.nextTrigger) : undefined,
      }));
    } catch (error) {
      console.error('Error loading alarms:', error);
      return [];
    }
  }

  static async saveAlarm(alarm: Alarm): Promise<void> {
    try {
      const alarms = await this.getAlarms();
      const existingIndex = alarms.findIndex(a => a.id === alarm.id);
      
      let updatedAlarms;
      if (existingIndex >= 0) {
        // Update existing alarm
        updatedAlarms = alarms.map(a => a.id === alarm.id ? alarm : a);
      } else {
        // Add new alarm
        updatedAlarms = [...alarms, alarm];
      }
      
      await AsyncStorage.setItem(STORAGE_KEYS.ALARMS, JSON.stringify(updatedAlarms));
    } catch (error) {
      console.error('Error saving alarm:', error);
      throw error;
    }
  }

  static async updateAlarm(id: string, updates: Partial<Alarm>): Promise<void> {
    try {
      const alarms = await this.getAlarms();
      const updatedAlarms = alarms.map(alarm =>
        alarm.id === id ? {...alarm, ...updates} : alarm
      );
      await AsyncStorage.setItem(STORAGE_KEYS.ALARMS, JSON.stringify(updatedAlarms));
    } catch (error) {
      console.error('Error updating alarm:', error);
      throw error;
    }
  }

  static async deleteAlarm(id: string): Promise<void> {
    try {
      const alarms = await this.getAlarms();
      const filteredAlarms = alarms.filter(alarm => alarm.id !== id);
      await AsyncStorage.setItem(STORAGE_KEYS.ALARMS, JSON.stringify(filteredAlarms));
    } catch (error) {
      console.error('Error deleting alarm:', error);
      throw error;
    }
  }

  // Utility methods
  static async exportData(): Promise<string> {
    try {
      const [userData, moodEntries, manifestationEntries, alarms] = await Promise.all([
        this.getUserData(),
        this.getMoodEntries(),
        this.getManifestationEntries(),
        this.getAlarms(),
      ]);

      const exportData = {
        userData,
        moodEntries,
        manifestationEntries,
        alarms,
        exportDate: new Date().toISOString(),
      };

      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('Error exporting data:', error);
      throw error;
    }
  }

  static async clearAllData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.USER_DATA,
        STORAGE_KEYS.MOOD_ENTRIES,
        STORAGE_KEYS.MANIFESTATION_ENTRIES,
        STORAGE_KEYS.ALARMS,
      ]);
    } catch (error) {
      console.error('Error clearing all data:', error);
      throw error;
    }
  }
}