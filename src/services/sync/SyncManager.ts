/**
 * Sync Manager
 * Coordinates offline-first data synchronization between local and cloud storage
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { isSupabaseConfigured, isAuthenticated } from '../supabase/SupabaseClient';
import { CloudStorageService } from '../storage/CloudStorageService';
import { StorageService } from '../storage/StorageService';
import type { MoodEntry, ManifestationEntry, Alarm, User } from '../../types';
import type { SyncResult, SyncState, SyncQueueItem, SyncOperation } from '../../repositories/types';

// ============================================
// CONSTANTS
// ============================================

const SYNC_KEYS = {
  QUEUE: '@manifestation_sync_queue',
  LAST_SYNC: '@manifestation_last_sync',
  SYNC_STATE: '@manifestation_sync_state',
};

const SYNC_CONFIG = {
  MAX_RETRY_COUNT: 3,
  RETRY_DELAY_MS: 5000,
  BACKGROUND_SYNC_INTERVAL_MS: 5 * 60 * 1000, // 5 minutes
  BATCH_SIZE: 50,
};

// ============================================
// SYNC MANAGER
// ============================================

export class SyncManager {
  private static isInitialized = false;
  private static isSyncing = false;
  private static syncInterval: NodeJS.Timeout | null = null;
  private static listeners: Set<(state: SyncState) => void> = new Set();

  // ==========================================
  // INITIALIZATION
  // ==========================================

  /**
   * Initialize the sync manager
   */
  static async initialize(): Promise<void> {
    if (this.isInitialized) return;

    // Set up network state listener
    NetInfo.addEventListener(state => {
      if (state.isConnected && state.isInternetReachable) {
        // Network came back online, trigger sync
        this.triggerSync();
      }
    });

    // Start background sync
    this.startBackgroundSync();

    this.isInitialized = true;
    console.log('SyncManager initialized');
  }

  /**
   * Start background sync interval
   */
  private static startBackgroundSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(() => {
      this.triggerSync();
    }, SYNC_CONFIG.BACKGROUND_SYNC_INTERVAL_MS);
  }

  /**
   * Stop background sync
   */
  static stopBackgroundSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  // ==========================================
  // SYNC QUEUE MANAGEMENT
  // ==========================================

  /**
   * Get the current sync queue
   */
  static async getQueue(): Promise<SyncQueueItem[]> {
    try {
      const queueJson = await AsyncStorage.getItem(SYNC_KEYS.QUEUE);
      return queueJson ? JSON.parse(queueJson) : [];
    } catch (error) {
      console.error('Error getting sync queue:', error);
      return [];
    }
  }

  /**
   * Add an operation to the sync queue
   */
  static async queueOperation(
    tableName: string,
    operation: SyncOperation,
    recordId: string,
    payload: unknown
  ): Promise<void> {
    try {
      const queue = await this.getQueue();

      // Check for existing operation on same record
      const existingIndex = queue.findIndex(
        item => item.tableName === tableName && item.recordId === recordId
      );

      const newItem: SyncQueueItem = {
        id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        tableName,
        recordId,
        operation,
        payload,
        localTimestamp: new Date(),
        status: 'pending',
        retryCount: 0,
      };

      if (existingIndex >= 0) {
        // Update existing operation
        const existing = queue[existingIndex];

        // Handle operation merging
        if (existing.operation === 'INSERT' && operation === 'UPDATE') {
          // Keep as INSERT with updated payload
          queue[existingIndex] = { ...newItem, operation: 'INSERT' };
        } else if (existing.operation === 'INSERT' && operation === 'DELETE') {
          // Remove from queue entirely (never synced, now deleted)
          queue.splice(existingIndex, 1);
        } else if (existing.operation === 'UPDATE' && operation === 'DELETE') {
          // Replace with DELETE
          queue[existingIndex] = newItem;
        } else {
          // Replace with new operation
          queue[existingIndex] = newItem;
        }
      } else {
        queue.push(newItem);
      }

      await AsyncStorage.setItem(SYNC_KEYS.QUEUE, JSON.stringify(queue));
      this.notifyListeners();

      // Trigger sync if online
      const netInfo = await NetInfo.fetch();
      if (netInfo.isConnected && netInfo.isInternetReachable) {
        this.triggerSync();
      }
    } catch (error) {
      console.error('Error queuing operation:', error);
    }
  }

  /**
   * Remove processed items from queue
   */
  private static async removeFromQueue(ids: string[]): Promise<void> {
    try {
      const queue = await this.getQueue();
      const newQueue = queue.filter(item => !ids.includes(item.id));
      await AsyncStorage.setItem(SYNC_KEYS.QUEUE, JSON.stringify(newQueue));
    } catch (error) {
      console.error('Error removing from queue:', error);
    }
  }

  /**
   * Update queue item status
   */
  private static async updateQueueItemStatus(
    id: string,
    status: SyncQueueItem['status'],
    error?: string
  ): Promise<void> {
    try {
      const queue = await this.getQueue();
      const index = queue.findIndex(item => item.id === id);

      if (index >= 0) {
        queue[index].status = status;
        if (error) {
          queue[index].lastError = error;
          queue[index].retryCount++;
        }
        await AsyncStorage.setItem(SYNC_KEYS.QUEUE, JSON.stringify(queue));
      }
    } catch (error) {
      console.error('Error updating queue item status:', error);
    }
  }

  // ==========================================
  // SYNC OPERATIONS
  // ==========================================

  /**
   * Trigger a sync operation
   */
  static async triggerSync(): Promise<SyncResult> {
    if (this.isSyncing) {
      return { success: false, synced: 0, failed: 0, errors: ['Sync already in progress'] };
    }

    // Check if we can sync
    if (!isSupabaseConfigured()) {
      return { success: false, synced: 0, failed: 0, errors: ['Supabase not configured'] };
    }

    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return { success: false, synced: 0, failed: 0, errors: ['Not authenticated'] };
    }

    const netInfo = await NetInfo.fetch();
    if (!netInfo.isConnected || !netInfo.isInternetReachable) {
      return { success: false, synced: 0, failed: 0, errors: ['No internet connection'] };
    }

    this.isSyncing = true;
    this.notifyListeners();

    try {
      const result = await this.performSync();
      await this.setLastSyncTime();
      return result;
    } catch (error) {
      console.error('Sync error:', error);
      return {
        success: false,
        synced: 0,
        failed: 0,
        errors: [error instanceof Error ? error.message : 'Unknown sync error'],
      };
    } finally {
      this.isSyncing = false;
      this.notifyListeners();
    }
  }

  /**
   * Perform the actual sync operation
   */
  private static async performSync(): Promise<SyncResult> {
    let synced = 0;
    let failed = 0;
    const errors: string[] = [];

    // 1. Process the sync queue (push local changes)
    const queue = await this.getQueue();
    const pendingItems = queue.filter(
      item => item.status === 'pending' && item.retryCount < SYNC_CONFIG.MAX_RETRY_COUNT
    );

    const processedIds: string[] = [];

    for (const item of pendingItems) {
      try {
        await this.updateQueueItemStatus(item.id, 'syncing');

        const success = await this.processQueueItem(item);

        if (success) {
          processedIds.push(item.id);
          synced++;
        } else {
          await this.updateQueueItemStatus(item.id, 'error', 'Operation failed');
          failed++;
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        await this.updateQueueItemStatus(item.id, 'error', errorMsg);
        errors.push(`${item.tableName}/${item.operation}: ${errorMsg}`);
        failed++;
      }
    }

    // Remove successfully processed items
    if (processedIds.length > 0) {
      await this.removeFromQueue(processedIds);
    }

    // 2. Pull latest data from cloud
    await this.pullFromCloud();

    return {
      success: failed === 0,
      synced,
      failed,
      errors,
    };
  }

  /**
   * Process a single queue item
   */
  private static async processQueueItem(item: SyncQueueItem): Promise<boolean> {
    const { tableName, operation, recordId, payload } = item;

    switch (tableName) {
      case 'mood_entries':
        return this.processMoodOperation(operation, recordId, payload as MoodEntry);

      case 'manifestation_entries':
        return this.processManifestationOperation(operation, recordId, payload as ManifestationEntry);

      case 'alarms':
        return this.processAlarmOperation(operation, recordId, payload as Alarm);

      case 'profiles':
        return this.processProfileOperation(operation, payload as User);

      default:
        console.warn(`Unknown table: ${tableName}`);
        return false;
    }
  }

  private static async processMoodOperation(
    operation: SyncOperation,
    recordId: string,
    payload: MoodEntry
  ): Promise<boolean> {
    switch (operation) {
      case 'INSERT':
        const created = await CloudStorageService.createMoodEntry(payload);
        return created !== null;

      case 'UPDATE':
        const updated = await CloudStorageService.updateMoodEntry(recordId, payload);
        return updated !== null;

      case 'DELETE':
        return CloudStorageService.deleteMoodEntry(recordId);

      default:
        return false;
    }
  }

  private static async processManifestationOperation(
    operation: SyncOperation,
    recordId: string,
    payload: ManifestationEntry
  ): Promise<boolean> {
    switch (operation) {
      case 'INSERT':
        const created = await CloudStorageService.createManifestationEntry(payload);
        return created !== null;

      case 'UPDATE':
        const updated = await CloudStorageService.updateManifestationEntry(recordId, payload);
        return updated !== null;

      case 'DELETE':
        return CloudStorageService.deleteManifestationEntry(recordId);

      default:
        return false;
    }
  }

  private static async processAlarmOperation(
    operation: SyncOperation,
    recordId: string,
    payload: Alarm
  ): Promise<boolean> {
    switch (operation) {
      case 'INSERT':
        const created = await CloudStorageService.createAlarm(payload);
        return created !== null;

      case 'UPDATE':
        const updated = await CloudStorageService.updateAlarm(recordId, payload);
        return updated !== null;

      case 'DELETE':
        return CloudStorageService.deleteAlarm(recordId);

      default:
        return false;
    }
  }

  private static async processProfileOperation(
    operation: SyncOperation,
    payload: User
  ): Promise<boolean> {
    if (operation === 'UPDATE') {
      const updated = await CloudStorageService.updateProfile(payload);
      return updated !== null;
    }
    return false;
  }

  /**
   * Pull latest data from cloud and merge with local
   */
  private static async pullFromCloud(): Promise<void> {
    try {
      // Fetch all data from cloud
      const [cloudMoods, cloudManifestations, cloudAlarms, cloudProfile] = await Promise.all([
        CloudStorageService.getMoodEntries(),
        CloudStorageService.getManifestationEntries(),
        CloudStorageService.getAlarms(),
        CloudStorageService.getProfile(),
      ]);

      // Get local data
      const [localMoods, localManifestations, localAlarms] = await Promise.all([
        StorageService.getMoodEntries(),
        StorageService.getManifestationEntries(),
        StorageService.getAlarms(),
      ]);

      // Merge cloud data into local (cloud takes precedence for synced items)
      // This is a simple strategy - cloud data overwrites local for items that exist in cloud

      // Merge mood entries
      const mergedMoods = this.mergeEntries(localMoods, cloudMoods, 'id');
      await StorageService.saveMoodEntries(mergedMoods);

      // Merge manifestations
      const mergedManifestations = this.mergeEntries(localManifestations, cloudManifestations, 'id');
      await StorageService.saveManifestationEntries(mergedManifestations);

      // Merge alarms
      const mergedAlarms = this.mergeEntries(localAlarms, cloudAlarms, 'id');
      await StorageService.saveAlarms(mergedAlarms);

      // Update profile if we got one from cloud
      if (cloudProfile) {
        await StorageService.saveUserData(cloudProfile);
      }

      console.log('Pull from cloud completed');
    } catch (error) {
      console.error('Error pulling from cloud:', error);
    }
  }

  /**
   * Merge local and cloud entries
   * Cloud entries take precedence for items that exist in both
   */
  private static mergeEntries<T extends { id: string }>(
    local: T[],
    cloud: T[],
    idField: keyof T
  ): T[] {
    const cloudMap = new Map(cloud.map(item => [item[idField], item]));
    const merged: T[] = [...cloud];

    // Add local items that don't exist in cloud
    for (const localItem of local) {
      if (!cloudMap.has(localItem[idField])) {
        merged.push(localItem);
      }
    }

    return merged;
  }

  // ==========================================
  // STATE MANAGEMENT
  // ==========================================

  /**
   * Get the current sync state
   */
  static async getSyncState(): Promise<SyncState> {
    const queue = await this.getQueue();
    const lastSyncAt = await this.getLastSyncTime();
    const netInfo = await NetInfo.fetch();

    return {
      isOnline: netInfo.isConnected ?? false,
      isSyncing: this.isSyncing,
      lastSyncAt,
      pendingChanges: queue.filter(item => item.status === 'pending').length,
    };
  }

  /**
   * Get last sync time
   */
  static async getLastSyncTime(): Promise<Date | null> {
    try {
      const timestamp = await AsyncStorage.getItem(SYNC_KEYS.LAST_SYNC);
      return timestamp ? new Date(timestamp) : null;
    } catch {
      return null;
    }
  }

  /**
   * Set last sync time
   */
  private static async setLastSyncTime(): Promise<void> {
    try {
      await AsyncStorage.setItem(SYNC_KEYS.LAST_SYNC, new Date().toISOString());
    } catch (error) {
      console.error('Error setting last sync time:', error);
    }
  }

  // ==========================================
  // LISTENERS
  // ==========================================

  /**
   * Subscribe to sync state changes
   */
  static subscribe(listener: (state: SyncState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Notify all listeners of state change
   */
  private static async notifyListeners(): Promise<void> {
    const state = await this.getSyncState();
    this.listeners.forEach(listener => listener(state));
  }

  // ==========================================
  // FULL SYNC (for migration or reset)
  // ==========================================

  /**
   * Perform a full sync - push all local data to cloud
   */
  static async fullSync(): Promise<SyncResult> {
    if (!isSupabaseConfigured()) {
      return { success: false, synced: 0, failed: 0, errors: ['Supabase not configured'] };
    }

    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return { success: false, synced: 0, failed: 0, errors: ['Not authenticated'] };
    }

    try {
      // Get all local data
      const [moods, manifestations, alarms] = await Promise.all([
        StorageService.getMoodEntries(),
        StorageService.getManifestationEntries(),
        StorageService.getAlarms(),
      ]);

      // Bulk upload to cloud
      const [moodCount, manifestationCount, alarmCount] = await Promise.all([
        CloudStorageService.bulkCreateMoodEntries(moods),
        CloudStorageService.bulkCreateManifestations(manifestations),
        CloudStorageService.bulkCreateAlarms(alarms),
      ]);

      const synced = moodCount + manifestationCount + alarmCount;

      // Mark migration complete
      await CloudStorageService.markMigrationComplete();

      // Clear sync queue since we just synced everything
      await AsyncStorage.setItem(SYNC_KEYS.QUEUE, JSON.stringify([]));

      await this.setLastSyncTime();

      return {
        success: true,
        synced,
        failed: 0,
        errors: [],
      };
    } catch (error) {
      return {
        success: false,
        synced: 0,
        failed: 0,
        errors: [error instanceof Error ? error.message : 'Full sync failed'],
      };
    }
  }
}

export default SyncManager;
