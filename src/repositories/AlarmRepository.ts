/**
 * Alarm Repository
 * Handles all alarm data operations with offline-first sync
 */

import { StorageService } from '../services/storage/StorageService';
import { SyncManager } from '../services/sync/SyncManager';
import { isSupabaseConfigured, isAuthenticated } from '../services/supabase/SupabaseClient';
import type { Alarm } from '../types';
import type {
  IAlarmRepository,
  AlarmCreateInput,
  AlarmUpdateInput,
  SyncResult,
} from './types';

// Generate unique ID
const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

export class AlarmRepository implements IAlarmRepository {
  // ==========================================
  // READ OPERATIONS
  // ==========================================

  /**
   * Get all alarms
   */
  async getAll(): Promise<Alarm[]> {
    return StorageService.getAlarms();
  }

  /**
   * Get alarm by ID
   */
  async getById(id: string): Promise<Alarm | null> {
    const alarms = await StorageService.getAlarms();
    return alarms.find(a => a.id === id) || null;
  }

  /**
   * Get enabled alarms
   */
  async getEnabled(): Promise<Alarm[]> {
    const alarms = await StorageService.getAlarms();
    return alarms.filter(a => a.isEnabled);
  }

  // ==========================================
  // WRITE OPERATIONS
  // ==========================================

  /**
   * Create a new alarm
   */
  async create(data: AlarmCreateInput): Promise<Alarm> {
    const newAlarm: Alarm = {
      id: generateId(),
      name: data.name,
      interval: data.interval,
      dayStartTime: data.dayStartTime,
      dayEndTime: data.dayEndTime,
      activeDays: data.activeDays,
      isEnabled: data.isEnabled ?? true,
      createdAt: new Date(),
      testInterval: data.testInterval,
      soundType: data.soundType,
    };

    // Save to local storage
    await StorageService.saveAlarm(newAlarm);

    // Queue for cloud sync if authenticated
    if (isSupabaseConfigured() && await isAuthenticated()) {
      await SyncManager.queueOperation('alarms', 'INSERT', newAlarm.id, newAlarm);
    }

    return newAlarm;
  }

  /**
   * Update an existing alarm
   */
  async update(id: string, data: AlarmUpdateInput): Promise<Alarm> {
    const existing = await this.getById(id);
    if (!existing) {
      throw new Error(`Alarm not found: ${id}`);
    }

    const updated: Alarm = {
      ...existing,
      ...data,
    };

    // Update local storage
    await StorageService.updateAlarm(id, updated);

    // Queue for cloud sync if authenticated
    if (isSupabaseConfigured() && await isAuthenticated()) {
      await SyncManager.queueOperation('alarms', 'UPDATE', id, updated);
    }

    return updated;
  }

  /**
   * Delete an alarm
   */
  async delete(id: string): Promise<void> {
    // Delete from local storage
    await StorageService.deleteAlarm(id);

    // Queue for cloud sync if authenticated
    if (isSupabaseConfigured() && await isAuthenticated()) {
      await SyncManager.queueOperation('alarms', 'DELETE', id, { id });
    }
  }

  /**
   * Toggle alarm enabled state
   */
  async toggle(id: string): Promise<Alarm> {
    const alarm = await this.getById(id);
    if (!alarm) {
      throw new Error(`Alarm not found: ${id}`);
    }

    return this.update(id, { isEnabled: !alarm.isEnabled });
  }

  /**
   * Update next trigger time
   */
  async updateNextTrigger(id: string, nextTrigger: Date): Promise<void> {
    const alarm = await this.getById(id);
    if (!alarm) {
      throw new Error(`Alarm not found: ${id}`);
    }

    await this.update(id, { nextTrigger });
  }

  /**
   * Record alarm trigger
   */
  async recordTrigger(id: string): Promise<void> {
    const alarm = await this.getById(id);
    if (!alarm) {
      throw new Error(`Alarm not found: ${id}`);
    }

    await this.update(id, { lastTriggered: new Date() });
  }

  // ==========================================
  // SYNC OPERATIONS
  // ==========================================

  /**
   * Sync alarms with cloud
   */
  async sync(): Promise<SyncResult> {
    return SyncManager.triggerSync();
  }
}

// Export singleton instance
export const alarmRepository = new AlarmRepository();
export default alarmRepository;
