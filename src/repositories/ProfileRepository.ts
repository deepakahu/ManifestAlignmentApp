/**
 * Profile Repository
 * Handles user profile data operations with offline-first sync
 */

import { StorageService } from '../services/storage/StorageService';
import { CloudStorageService } from '../services/storage/CloudStorageService';
import { SyncManager } from '../services/sync/SyncManager';
import { isSupabaseConfigured, isAuthenticated } from '../services/supabase/SupabaseClient';
import type { User } from '../types';
import type { IProfileRepository, ProfileUpdateInput, SyncResult } from './types';

export class ProfileRepository implements IProfileRepository {
  // ==========================================
  // READ OPERATIONS
  // ==========================================

  /**
   * Get current user profile
   */
  async get(): Promise<User | null> {
    // First try local storage
    const localUser = await StorageService.getUserData();

    // If authenticated, also fetch from cloud and merge
    if (isSupabaseConfigured() && await isAuthenticated()) {
      const cloudUser = await CloudStorageService.getProfile();

      if (cloudUser) {
        // Merge cloud profile with local (cloud takes precedence for most fields)
        const merged: User = {
          ...localUser,
          ...cloudUser,
          // Keep local preferences if they exist and cloud doesn't have them
          preferences: {
            ...localUser?.preferences,
            ...cloudUser.preferences,
          },
        };

        // Update local storage with merged data
        await StorageService.saveUserData(merged);
        return merged;
      }
    }

    return localUser;
  }

  // ==========================================
  // WRITE OPERATIONS
  // ==========================================

  /**
   * Update user profile
   */
  async update(data: ProfileUpdateInput): Promise<User> {
    const existing = await StorageService.getUserData();

    const updated: User = {
      id: existing?.id || 'local_user',
      name: data.name ?? existing?.name ?? 'User',
      email: data.email ?? existing?.email,
      createdAt: existing?.createdAt || new Date(),
      preferences: {
        notificationsEnabled: data.preferences?.notificationsEnabled ?? existing?.preferences?.notificationsEnabled ?? true,
        soundEnabled: data.preferences?.soundEnabled ?? existing?.preferences?.soundEnabled ?? true,
        theme: data.preferences?.theme ?? existing?.preferences?.theme ?? 'light',
        reminderFrequency: data.preferences?.reminderFrequency ?? existing?.preferences?.reminderFrequency,
        reminderTime: data.preferences?.reminderTime ?? existing?.preferences?.reminderTime,
      },
    };

    // Save to local storage
    await StorageService.saveUserData(updated);

    // Queue for cloud sync if authenticated
    if (isSupabaseConfigured() && await isAuthenticated()) {
      await SyncManager.queueOperation('profiles', 'UPDATE', updated.id, updated);
    }

    return updated;
  }

  /**
   * Update notification preferences
   */
  async updateNotificationPreferences(enabled: boolean): Promise<User> {
    const existing = await this.get();
    return this.update({
      preferences: {
        ...existing?.preferences,
        notificationsEnabled: enabled,
      },
    });
  }

  /**
   * Update sound preferences
   */
  async updateSoundPreferences(enabled: boolean): Promise<User> {
    const existing = await this.get();
    return this.update({
      preferences: {
        ...existing?.preferences,
        soundEnabled: enabled,
      },
    });
  }

  /**
   * Update theme preference
   */
  async updateTheme(theme: 'light' | 'dark'): Promise<User> {
    const existing = await this.get();
    return this.update({
      preferences: {
        ...existing?.preferences,
        theme,
      },
    });
  }

  // ==========================================
  // SYNC OPERATIONS
  // ==========================================

  /**
   * Sync profile with cloud
   */
  async sync(): Promise<SyncResult> {
    return SyncManager.triggerSync();
  }

  /**
   * Force fetch from cloud and update local
   */
  async refresh(): Promise<User | null> {
    if (!isSupabaseConfigured() || !await isAuthenticated()) {
      return this.get();
    }

    const cloudProfile = await CloudStorageService.getProfile();
    if (cloudProfile) {
      await StorageService.saveUserData(cloudProfile);
      return cloudProfile;
    }

    return this.get();
  }
}

// Export singleton instance
export const profileRepository = new ProfileRepository();
export default profileRepository;
