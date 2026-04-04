/**
 * Data Migration Service
 * Handles migrating local AsyncStorage data to Supabase cloud
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { StorageService } from '../storage/StorageService';
import { CloudStorageService } from '../storage/CloudStorageService';
import { getCurrentUserId, isAuthenticated } from '../supabase/SupabaseClient';
import type { MoodEntry, ManifestationEntry, Alarm, User } from '../../types';

const MIGRATION_KEY = 'data_migration_status';

export interface MigrationStatus {
  hasMigrated: boolean;
  migratedAt?: Date;
  localDataCounts?: LocalDataCounts;
}

export interface LocalDataCounts {
  moodEntries: number;
  manifestations: number;
  alarms: number;
  hasUserData: boolean;
}

export interface MigrationResult {
  success: boolean;
  migratedCounts: {
    moodEntries: number;
    manifestations: number;
    alarms: number;
    profile: boolean;
  };
  errors: MigrationError[];
  skippedDueToConflict: number;
}

export interface MigrationError {
  type: 'mood' | 'manifestation' | 'alarm' | 'profile';
  id?: string;
  error: string;
}

export class DataMigrationService {
  /**
   * Check if user has already migrated their data
   */
  static async getMigrationStatus(): Promise<MigrationStatus> {
    try {
      const status = await AsyncStorage.getItem(MIGRATION_KEY);
      if (status) {
        const parsed = JSON.parse(status);
        return {
          ...parsed,
          migratedAt: parsed.migratedAt ? new Date(parsed.migratedAt) : undefined,
        };
      }
      return { hasMigrated: false };
    } catch (error) {
      console.error('Error getting migration status:', error);
      return { hasMigrated: false };
    }
  }

  /**
   * Get counts of local data that would be migrated
   */
  static async getLocalDataCounts(): Promise<LocalDataCounts> {
    try {
      const [moodEntries, manifestations, alarms, userData] = await Promise.all([
        StorageService.getMoodEntries(),
        StorageService.getManifestationEntries(),
        StorageService.getAlarms(),
        StorageService.getUserData(),
      ]);

      return {
        moodEntries: moodEntries.length,
        manifestations: manifestations.length,
        alarms: alarms.length,
        hasUserData: userData !== null,
      };
    } catch (error) {
      console.error('Error getting local data counts:', error);
      return {
        moodEntries: 0,
        manifestations: 0,
        alarms: 0,
        hasUserData: false,
      };
    }
  }

  /**
   * Check if there's local data to migrate
   */
  static async hasLocalDataToMigrate(): Promise<boolean> {
    const counts = await this.getLocalDataCounts();
    return (
      counts.moodEntries > 0 ||
      counts.manifestations > 0 ||
      counts.alarms > 0 ||
      counts.hasUserData
    );
  }

  /**
   * Check if migration modal should be shown
   */
  static async shouldShowMigrationModal(): Promise<boolean> {
    const isAuth = await isAuthenticated();
    if (!isAuth) {
      return false;
    }

    const status = await this.getMigrationStatus();
    if (status.hasMigrated) {
      return false;
    }

    return this.hasLocalDataToMigrate();
  }

  /**
   * Migrate all local data to cloud
   */
  static async migrateToCloud(): Promise<MigrationResult> {
    const result: MigrationResult = {
      success: false,
      migratedCounts: {
        moodEntries: 0,
        manifestations: 0,
        alarms: 0,
        profile: false,
      },
      errors: [],
      skippedDueToConflict: 0,
    };

    try {
      const isAuth = await isAuthenticated();
      if (!isAuth) {
        result.errors.push({
          type: 'profile',
          error: 'User is not authenticated',
        });
        return result;
      }

      const userId = await getCurrentUserId();
      if (!userId) {
        result.errors.push({
          type: 'profile',
          error: 'Could not get user ID',
        });
        return result;
      }

      // Migrate profile/user data
      const profileResult = await this.migrateProfile();
      result.migratedCounts.profile = profileResult.success;
      if (!profileResult.success && profileResult.error) {
        result.errors.push({
          type: 'profile',
          error: profileResult.error,
        });
      }

      // Migrate mood entries
      const moodResult = await this.migrateMoodEntries();
      result.migratedCounts.moodEntries = moodResult.migrated;
      result.errors.push(...moodResult.errors);
      result.skippedDueToConflict += moodResult.skipped;

      // Migrate manifestations
      const manifestResult = await this.migrateManifestations();
      result.migratedCounts.manifestations = manifestResult.migrated;
      result.errors.push(...manifestResult.errors);
      result.skippedDueToConflict += manifestResult.skipped;

      // Migrate alarms
      const alarmResult = await this.migrateAlarms();
      result.migratedCounts.alarms = alarmResult.migrated;
      result.errors.push(...alarmResult.errors);
      result.skippedDueToConflict += alarmResult.skipped;

      // Mark as migrated
      await this.markAsMigrated({
        moodEntries: result.migratedCounts.moodEntries,
        manifestations: result.migratedCounts.manifestations,
        alarms: result.migratedCounts.alarms,
        hasUserData: result.migratedCounts.profile,
      });

      result.success = result.errors.length === 0;
      return result;
    } catch (error) {
      console.error('Migration error:', error);
      result.errors.push({
        type: 'profile',
        error: error instanceof Error ? error.message : 'Unknown migration error',
      });
      return result;
    }
  }

  /**
   * Migrate user profile data
   */
  private static async migrateProfile(): Promise<{ success: boolean; error?: string }> {
    try {
      const userData = await StorageService.getUserData();
      if (!userData) {
        return { success: true }; // No profile data to migrate
      }

      // Update cloud profile with local preferences
      await CloudStorageService.updateProfile({
        display_name: userData.name,
        timezone: userData.timezone || 'UTC',
        notifications_enabled: userData.settings?.notificationsEnabled ?? true,
        sound_enabled: userData.settings?.soundEnabled ?? true,
        theme: userData.settings?.theme || 'light',
        local_data_migrated: true,
      });

      return { success: true };
    } catch (error) {
      console.error('Error migrating profile:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Migrate mood entries
   */
  private static async migrateMoodEntries(): Promise<{
    migrated: number;
    skipped: number;
    errors: MigrationError[];
  }> {
    const result = { migrated: 0, skipped: 0, errors: [] as MigrationError[] };

    try {
      const localEntries = await StorageService.getMoodEntries();
      if (localEntries.length === 0) {
        return result;
      }

      // Get existing cloud entries to avoid duplicates
      const cloudEntries = await CloudStorageService.getAllMoodEntries();
      const cloudLocalIds = new Set(
        cloudEntries
          .filter(e => e.local_id)
          .map(e => e.local_id)
      );

      // Filter out entries that already exist in cloud
      const entriesToMigrate = localEntries.filter(
        entry => !cloudLocalIds.has(entry.id)
      );

      result.skipped = localEntries.length - entriesToMigrate.length;

      if (entriesToMigrate.length > 0) {
        await CloudStorageService.bulkCreateMoodEntries(entriesToMigrate);
        result.migrated = entriesToMigrate.length;
      }

      return result;
    } catch (error) {
      console.error('Error migrating mood entries:', error);
      result.errors.push({
        type: 'mood',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return result;
    }
  }

  /**
   * Migrate manifestation entries
   */
  private static async migrateManifestations(): Promise<{
    migrated: number;
    skipped: number;
    errors: MigrationError[];
  }> {
    const result = { migrated: 0, skipped: 0, errors: [] as MigrationError[] };

    try {
      const localEntries = await StorageService.getManifestationEntries();
      if (localEntries.length === 0) {
        return result;
      }

      // Get existing cloud entries to avoid duplicates
      const cloudEntries = await CloudStorageService.getAllManifestations();
      const cloudLocalIds = new Set(
        cloudEntries
          .filter(e => e.local_id)
          .map(e => e.local_id)
      );

      // Filter out entries that already exist in cloud
      const entriesToMigrate = localEntries.filter(
        entry => !cloudLocalIds.has(entry.id)
      );

      result.skipped = localEntries.length - entriesToMigrate.length;

      if (entriesToMigrate.length > 0) {
        await CloudStorageService.bulkCreateManifestations(entriesToMigrate);
        result.migrated = entriesToMigrate.length;
      }

      return result;
    } catch (error) {
      console.error('Error migrating manifestations:', error);
      result.errors.push({
        type: 'manifestation',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return result;
    }
  }

  /**
   * Migrate alarms
   */
  private static async migrateAlarms(): Promise<{
    migrated: number;
    skipped: number;
    errors: MigrationError[];
  }> {
    const result = { migrated: 0, skipped: 0, errors: [] as MigrationError[] };

    try {
      const localAlarms = await StorageService.getAlarms();
      if (localAlarms.length === 0) {
        return result;
      }

      // Get existing cloud alarms to avoid duplicates
      const cloudAlarms = await CloudStorageService.getAllAlarms();
      const cloudLocalIds = new Set(
        cloudAlarms
          .filter(a => a.local_id)
          .map(a => a.local_id)
      );

      // Filter out alarms that already exist in cloud
      const alarmsToMigrate = localAlarms.filter(
        alarm => !cloudLocalIds.has(alarm.id)
      );

      result.skipped = localAlarms.length - alarmsToMigrate.length;

      if (alarmsToMigrate.length > 0) {
        await CloudStorageService.bulkCreateAlarms(alarmsToMigrate);
        result.migrated = alarmsToMigrate.length;
      }

      return result;
    } catch (error) {
      console.error('Error migrating alarms:', error);
      result.errors.push({
        type: 'alarm',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return result;
    }
  }

  /**
   * Mark migration as complete
   */
  private static async markAsMigrated(counts: LocalDataCounts): Promise<void> {
    const status: MigrationStatus = {
      hasMigrated: true,
      migratedAt: new Date(),
      localDataCounts: counts,
    };
    await AsyncStorage.setItem(MIGRATION_KEY, JSON.stringify(status));
  }

  /**
   * Reset migration status (for testing or re-migration)
   */
  static async resetMigrationStatus(): Promise<void> {
    await AsyncStorage.removeItem(MIGRATION_KEY);
  }

  /**
   * Skip migration and mark as done without migrating
   */
  static async skipMigration(): Promise<void> {
    const status: MigrationStatus = {
      hasMigrated: true,
      migratedAt: new Date(),
      localDataCounts: {
        moodEntries: 0,
        manifestations: 0,
        alarms: 0,
        hasUserData: false,
      },
    };
    await AsyncStorage.setItem(MIGRATION_KEY, JSON.stringify(status));
  }

  /**
   * Clear all local data after successful migration
   */
  static async clearLocalData(): Promise<void> {
    await StorageService.clearAllData();
  }
}
