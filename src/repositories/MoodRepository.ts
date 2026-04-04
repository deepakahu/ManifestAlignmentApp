/**
 * Mood Repository
 * Handles all mood entry data operations with offline-first sync
 */

import { StorageService } from '../services/storage/StorageService';
import { CloudStorageService } from '../services/storage/CloudStorageService';
import { SyncManager } from '../services/sync/SyncManager';
import { isSupabaseConfigured, isAuthenticated } from '../services/supabase/SupabaseClient';
import type { MoodEntry } from '../types';
import type {
  IMoodRepository,
  MoodEntryCreateInput,
  MoodEntryUpdateInput,
  SyncResult,
} from './types';

// Generate unique ID
const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

export class MoodRepository implements IMoodRepository {
  // ==========================================
  // READ OPERATIONS
  // ==========================================

  /**
   * Get all mood entries
   */
  async getAll(): Promise<MoodEntry[]> {
    // Always read from local (offline-first)
    return StorageService.getMoodEntries();
  }

  /**
   * Get mood entry by ID
   */
  async getById(id: string): Promise<MoodEntry | null> {
    const entries = await StorageService.getMoodEntries();
    return entries.find(e => e.id === id) || null;
  }

  /**
   * Get mood entries for a date range
   */
  async getByDateRange(startDate: Date, endDate: Date): Promise<MoodEntry[]> {
    const entries = await StorageService.getMoodEntries();
    return entries.filter(entry => {
      const timestamp = new Date(entry.timestamp);
      return timestamp >= startDate && timestamp <= endDate;
    });
  }

  /**
   * Get mood entries by alarm ID
   */
  async getByAlarmId(alarmId: string): Promise<MoodEntry[]> {
    const entries = await StorageService.getMoodEntries();
    return entries.filter(entry => entry.alarmId === alarmId);
  }

  /**
   * Get today's mood entries
   */
  async getToday(): Promise<MoodEntry[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return this.getByDateRange(today, tomorrow);
  }

  // ==========================================
  // WRITE OPERATIONS
  // ==========================================

  /**
   * Create a new mood entry
   */
  async create(data: MoodEntryCreateInput): Promise<MoodEntry> {
    const newEntry: MoodEntry = {
      id: generateId(),
      mood: data.mood,
      notes: data.notes || '',
      timestamp: data.timestamp || new Date(),
      tags: data.tags || [],
      alarmId: data.alarmId,
      alarmName: data.alarmName,
      manifestationRead: data.manifestationRead || false,
    };

    // Save to local storage
    await StorageService.saveMoodEntry(newEntry);

    // Queue for cloud sync if authenticated
    if (isSupabaseConfigured() && await isAuthenticated()) {
      await SyncManager.queueOperation('mood_entries', 'INSERT', newEntry.id, newEntry);
    }

    return newEntry;
  }

  /**
   * Update an existing mood entry
   */
  async update(id: string, data: MoodEntryUpdateInput): Promise<MoodEntry> {
    const existing = await this.getById(id);
    if (!existing) {
      throw new Error(`Mood entry not found: ${id}`);
    }

    const updated: MoodEntry = {
      ...existing,
      ...data,
      timestamp: data.timestamp || existing.timestamp,
    };

    // Update local storage
    await StorageService.updateMoodEntry(id, updated);

    // Queue for cloud sync if authenticated
    if (isSupabaseConfigured() && await isAuthenticated()) {
      await SyncManager.queueOperation('mood_entries', 'UPDATE', id, updated);
    }

    return updated;
  }

  /**
   * Delete a mood entry
   */
  async delete(id: string): Promise<void> {
    // Delete from local storage
    await StorageService.deleteMoodEntry(id);

    // Queue for cloud sync if authenticated
    if (isSupabaseConfigured() && await isAuthenticated()) {
      await SyncManager.queueOperation('mood_entries', 'DELETE', id, { id });
    }
  }

  // ==========================================
  // SYNC OPERATIONS
  // ==========================================

  /**
   * Sync mood entries with cloud
   */
  async sync(): Promise<SyncResult> {
    return SyncManager.triggerSync();
  }
}

// Export singleton instance
export const moodRepository = new MoodRepository();
export default moodRepository;
