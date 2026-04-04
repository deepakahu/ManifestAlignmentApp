/**
 * Repository Types and Interfaces
 * Defines the contract for data access layer
 */

import type {
  MoodEntry,
  ManifestationEntry,
  Alarm,
  User,
} from '../types';

// ============================================
// BASE REPOSITORY INTERFACE
// ============================================

export interface BaseRepository<T, CreateInput, UpdateInput> {
  /** Get all items */
  getAll(): Promise<T[]>;

  /** Get item by ID */
  getById(id: string): Promise<T | null>;

  /** Create new item */
  create(data: CreateInput): Promise<T>;

  /** Update existing item */
  update(id: string, data: UpdateInput): Promise<T>;

  /** Delete item (soft delete) */
  delete(id: string): Promise<void>;

  /** Sync local data with cloud */
  sync(): Promise<SyncResult>;
}

// ============================================
// SYNC TYPES
// ============================================

export type SyncOperation = 'INSERT' | 'UPDATE' | 'DELETE';
export type SyncStatus = 'pending' | 'syncing' | 'synced' | 'error';

export interface SyncQueueItem {
  id: string;
  tableName: string;
  recordId: string;
  operation: SyncOperation;
  payload: unknown;
  localTimestamp: Date;
  status: SyncStatus;
  retryCount: number;
  lastError?: string;
}

export interface SyncResult {
  success: boolean;
  synced: number;
  failed: number;
  errors: string[];
}

export interface SyncState {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncAt: Date | null;
  pendingChanges: number;
}

// ============================================
// ENTITY-SPECIFIC TYPES
// ============================================

// Mood Entry
export type MoodEntryCreateInput = Omit<MoodEntry, 'id' | 'timestamp'> & {
  timestamp?: Date;
};
export type MoodEntryUpdateInput = Partial<Omit<MoodEntry, 'id'>>;

// Manifestation Entry
export type ManifestationCreateInput = Omit<ManifestationEntry, 'id' | 'createdAt' | 'isCompleted'> & {
  isCompleted?: boolean;
};
export type ManifestationUpdateInput = Partial<Omit<ManifestationEntry, 'id' | 'createdAt'>>;

// Alarm
export type AlarmCreateInput = Omit<Alarm, 'id' | 'createdAt'>;
export type AlarmUpdateInput = Partial<Omit<Alarm, 'id' | 'createdAt'>>;

// User/Profile
export type ProfileUpdateInput = Partial<Omit<User, 'id' | 'createdAt'>>;

// ============================================
// REPOSITORY INTERFACES
// ============================================

export interface IMoodRepository extends BaseRepository<MoodEntry, MoodEntryCreateInput, MoodEntryUpdateInput> {
  /** Get moods for a date range */
  getByDateRange(startDate: Date, endDate: Date): Promise<MoodEntry[]>;

  /** Get moods by alarm ID */
  getByAlarmId(alarmId: string): Promise<MoodEntry[]>;

  /** Get today's moods */
  getToday(): Promise<MoodEntry[]>;
}

export interface IManifestationRepository extends BaseRepository<ManifestationEntry, ManifestationCreateInput, ManifestationUpdateInput> {
  /** Get manifestations by category */
  getByCategory(category: string): Promise<ManifestationEntry[]>;

  /** Get completed manifestations */
  getCompleted(): Promise<ManifestationEntry[]>;

  /** Get active (not completed) manifestations */
  getActive(): Promise<ManifestationEntry[]>;

  /** Record a read event */
  recordRead(manifestationId: string, moodEntryId?: string, durationSeconds?: number): Promise<void>;
}

export interface IAlarmRepository extends BaseRepository<Alarm, AlarmCreateInput, AlarmUpdateInput> {
  /** Get enabled alarms */
  getEnabled(): Promise<Alarm[]>;

  /** Toggle alarm enabled state */
  toggle(id: string): Promise<Alarm>;

  /** Update next trigger time */
  updateNextTrigger(id: string, nextTrigger: Date): Promise<void>;

  /** Record alarm trigger */
  recordTrigger(id: string): Promise<void>;
}

export interface IProfileRepository {
  /** Get current user profile */
  get(): Promise<User | null>;

  /** Update profile */
  update(data: ProfileUpdateInput): Promise<User>;

  /** Sync profile with cloud */
  sync(): Promise<SyncResult>;
}
