/**
 * Manifestation Repository
 * Handles all manifestation entry data operations with offline-first sync
 */

import { StorageService } from '../services/storage/StorageService';
import { CloudStorageService } from '../services/storage/CloudStorageService';
import { SyncManager } from '../services/sync/SyncManager';
import { isSupabaseConfigured, isAuthenticated } from '../services/supabase/SupabaseClient';
import type { ManifestationEntry, ManifestationReadEntry } from '../types';
import type {
  IManifestationRepository,
  ManifestationCreateInput,
  ManifestationUpdateInput,
  SyncResult,
} from './types';

// Generate unique ID
const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

export class ManifestationRepository implements IManifestationRepository {
  // ==========================================
  // READ OPERATIONS
  // ==========================================

  /**
   * Get all manifestation entries
   */
  async getAll(): Promise<ManifestationEntry[]> {
    return StorageService.getManifestationEntries();
  }

  /**
   * Get manifestation entry by ID
   */
  async getById(id: string): Promise<ManifestationEntry | null> {
    const entries = await StorageService.getManifestationEntries();
    return entries.find(e => e.id === id) || null;
  }

  /**
   * Get manifestations by category
   */
  async getByCategory(category: string): Promise<ManifestationEntry[]> {
    const entries = await StorageService.getManifestationEntries();
    return entries.filter(e => e.category === category);
  }

  /**
   * Get completed manifestations
   */
  async getCompleted(): Promise<ManifestationEntry[]> {
    const entries = await StorageService.getManifestationEntries();
    return entries.filter(e => e.isCompleted);
  }

  /**
   * Get active (not completed) manifestations
   */
  async getActive(): Promise<ManifestationEntry[]> {
    const entries = await StorageService.getManifestationEntries();
    return entries.filter(e => !e.isCompleted);
  }

  // ==========================================
  // WRITE OPERATIONS
  // ==========================================

  /**
   * Create a new manifestation entry
   */
  async create(data: ManifestationCreateInput): Promise<ManifestationEntry> {
    const newEntry: ManifestationEntry = {
      id: generateId(),
      title: data.title,
      description: data.description || '',
      category: data.category,
      targetDate: data.targetDate,
      isCompleted: data.isCompleted || false,
      createdAt: new Date(),
      visualizationNotes: data.visualizationNotes,
      affirmations: data.affirmations || [],
      readHistory: [],
    };

    // Save to local storage
    await StorageService.saveManifestationEntry(newEntry);

    // Queue for cloud sync if authenticated
    if (isSupabaseConfigured() && await isAuthenticated()) {
      await SyncManager.queueOperation('manifestation_entries', 'INSERT', newEntry.id, newEntry);
    }

    return newEntry;
  }

  /**
   * Update an existing manifestation entry
   */
  async update(id: string, data: ManifestationUpdateInput): Promise<ManifestationEntry> {
    const existing = await this.getById(id);
    if (!existing) {
      throw new Error(`Manifestation entry not found: ${id}`);
    }

    const updated: ManifestationEntry = {
      ...existing,
      ...data,
    };

    // If marking as completed, set completedAt
    if (data.isCompleted === true && !existing.isCompleted) {
      updated.completedAt = new Date();
    }

    // Update local storage
    await StorageService.updateManifestationEntry(id, updated);

    // Queue for cloud sync if authenticated
    if (isSupabaseConfigured() && await isAuthenticated()) {
      await SyncManager.queueOperation('manifestation_entries', 'UPDATE', id, updated);
    }

    return updated;
  }

  /**
   * Delete a manifestation entry
   */
  async delete(id: string): Promise<void> {
    // Delete from local storage
    await StorageService.deleteManifestationEntry(id);

    // Queue for cloud sync if authenticated
    if (isSupabaseConfigured() && await isAuthenticated()) {
      await SyncManager.queueOperation('manifestation_entries', 'DELETE', id, { id });
    }
  }

  /**
   * Record a read event for a manifestation
   */
  async recordRead(
    manifestationId: string,
    moodEntryId?: string,
    durationSeconds?: number
  ): Promise<void> {
    const manifestation = await this.getById(manifestationId);
    if (!manifestation) {
      throw new Error(`Manifestation not found: ${manifestationId}`);
    }

    // Add read event to local history
    const readEvent: ManifestationReadEntry = {
      readAt: new Date(),
      moodEntryId,
      readDuration: durationSeconds,
    };

    const updatedHistory = [...(manifestation.readHistory || []), readEvent];

    // Update local storage
    await StorageService.updateManifestationEntry(manifestationId, {
      ...manifestation,
      readHistory: updatedHistory,
    });

    // Record in cloud if authenticated
    if (isSupabaseConfigured() && await isAuthenticated()) {
      await CloudStorageService.recordManifestationRead(
        manifestationId,
        moodEntryId,
        durationSeconds
      );
    }
  }

  // ==========================================
  // SYNC OPERATIONS
  // ==========================================

  /**
   * Sync manifestation entries with cloud
   */
  async sync(): Promise<SyncResult> {
    return SyncManager.triggerSync();
  }
}

// Export singleton instance
export const manifestationRepository = new ManifestationRepository();
export default manifestationRepository;
