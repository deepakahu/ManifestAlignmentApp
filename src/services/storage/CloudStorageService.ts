/**
 * Cloud Storage Service
 * Handles all Supabase database operations
 */

import { supabase, getCurrentUserId, isSupabaseConfigured } from '../supabase/SupabaseClient';
import type {
  MoodEntry,
  ManifestationEntry,
  Alarm,
  User,
} from '../../types';

// Import transformers from shared package
import {
  moodEntryToDB,
  moodEntryFromDB,
  manifestationToDB,
  manifestationFromDB,
  alarmToDB,
  alarmFromDB,
  userFromDB,
  generateId,
} from '../../../packages/shared/src/utils';

import type {
  MoodEntryDB,
  ManifestationEntryDB,
  AlarmDB,
  ProfileDB,
  ManifestationReadHistoryDB,
} from '../../../packages/shared/src/types';

// ============================================
// CLOUD STORAGE SERVICE
// ============================================

export class CloudStorageService {
  // ==========================================
  // MOOD ENTRIES
  // ==========================================

  static async getMoodEntries(): Promise<MoodEntry[]> {
    if (!isSupabaseConfigured()) return [];

    const userId = await getCurrentUserId();
    if (!userId) return [];

    const { data, error } = await supabase
      .from('mood_entries')
      .select('*')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .order('timestamp', { ascending: false });

    if (error) {
      console.error('Error fetching mood entries:', error);
      return [];
    }

    return (data || []).map(moodEntryFromDB);
  }

  static async getMoodEntryById(id: string): Promise<MoodEntry | null> {
    if (!isSupabaseConfigured()) return null;

    const userId = await getCurrentUserId();
    if (!userId) return null;

    const { data, error } = await supabase
      .from('mood_entries')
      .select('*')
      .eq('user_id', userId)
      .or(`id.eq.${id},local_id.eq.${id}`)
      .is('deleted_at', null)
      .single();

    if (error || !data) return null;
    return moodEntryFromDB(data);
  }

  static async getMoodEntriesByDateRange(startDate: Date, endDate: Date): Promise<MoodEntry[]> {
    if (!isSupabaseConfigured()) return [];

    const userId = await getCurrentUserId();
    if (!userId) return [];

    const { data, error } = await supabase
      .from('mood_entries')
      .select('*')
      .eq('user_id', userId)
      .gte('timestamp', startDate.toISOString())
      .lte('timestamp', endDate.toISOString())
      .is('deleted_at', null)
      .order('timestamp', { ascending: false });

    if (error) {
      console.error('Error fetching mood entries by date range:', error);
      return [];
    }

    return (data || []).map(moodEntryFromDB);
  }

  static async createMoodEntry(entry: Omit<MoodEntry, 'id' | 'timestamp'> & { timestamp?: Date }): Promise<MoodEntry | null> {
    if (!isSupabaseConfigured()) return null;

    const userId = await getCurrentUserId();
    if (!userId) return null;

    const newEntry: MoodEntry = {
      ...entry,
      id: generateId(),
      timestamp: entry.timestamp || new Date(),
    };

    const dbEntry = moodEntryToDB(newEntry, userId);

    const { data, error } = await supabase
      .from('mood_entries')
      .insert(dbEntry)
      .select()
      .single();

    if (error) {
      console.error('Error creating mood entry:', error);
      return null;
    }

    return moodEntryFromDB(data);
  }

  static async updateMoodEntry(id: string, updates: Partial<MoodEntry>): Promise<MoodEntry | null> {
    if (!isSupabaseConfigured()) return null;

    const userId = await getCurrentUserId();
    if (!userId) return null;

    // Convert updates to DB format
    const dbUpdates: Partial<MoodEntryDB> = {};
    if (updates.mood !== undefined) dbUpdates.mood = updates.mood;
    if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
    if (updates.tags !== undefined) dbUpdates.tags = updates.tags;
    if (updates.alarmId !== undefined) dbUpdates.alarm_id = updates.alarmId;
    if (updates.alarmName !== undefined) dbUpdates.alarm_name = updates.alarmName;
    if (updates.manifestationRead !== undefined) dbUpdates.manifestation_read = updates.manifestationRead;

    const { data, error } = await supabase
      .from('mood_entries')
      .update(dbUpdates)
      .eq('user_id', userId)
      .or(`id.eq.${id},local_id.eq.${id}`)
      .select()
      .single();

    if (error) {
      console.error('Error updating mood entry:', error);
      return null;
    }

    return moodEntryFromDB(data);
  }

  static async deleteMoodEntry(id: string): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;

    const userId = await getCurrentUserId();
    if (!userId) return false;

    // Soft delete
    const { error } = await supabase
      .from('mood_entries')
      .update({ deleted_at: new Date().toISOString() })
      .eq('user_id', userId)
      .or(`id.eq.${id},local_id.eq.${id}`);

    if (error) {
      console.error('Error deleting mood entry:', error);
      return false;
    }

    return true;
  }

  // ==========================================
  // MANIFESTATION ENTRIES
  // ==========================================

  static async getManifestationEntries(): Promise<ManifestationEntry[]> {
    if (!isSupabaseConfigured()) return [];

    const userId = await getCurrentUserId();
    if (!userId) return [];

    const { data, error } = await supabase
      .from('manifestation_entries')
      .select('*')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching manifestation entries:', error);
      return [];
    }

    // Fetch read history for each manifestation
    const manifestations = (data || []).map(manifestationFromDB);

    // Get read history
    const manifestationIds = data?.map(m => m.id) || [];
    if (manifestationIds.length > 0) {
      const { data: readHistory } = await supabase
        .from('manifestation_read_history')
        .select('*')
        .in('manifestation_id', manifestationIds)
        .order('read_at', { ascending: false });

      if (readHistory) {
        // Attach read history to manifestations
        manifestations.forEach(m => {
          const history = readHistory
            .filter(h => h.manifestation_id === m.id || h.manifestation_id === (data?.find(d => d.local_id === m.id)?.id))
            .map(h => ({
              readAt: new Date(h.read_at),
              moodEntryId: h.mood_entry_id || undefined,
              readDuration: h.read_duration_seconds || undefined,
            }));
          m.readHistory = history;
        });
      }
    }

    return manifestations;
  }

  static async getManifestationById(id: string): Promise<ManifestationEntry | null> {
    if (!isSupabaseConfigured()) return null;

    const userId = await getCurrentUserId();
    if (!userId) return null;

    const { data, error } = await supabase
      .from('manifestation_entries')
      .select('*')
      .eq('user_id', userId)
      .or(`id.eq.${id},local_id.eq.${id}`)
      .is('deleted_at', null)
      .single();

    if (error || !data) return null;

    const manifestation = manifestationFromDB(data);

    // Fetch read history
    const { data: readHistory } = await supabase
      .from('manifestation_read_history')
      .select('*')
      .eq('manifestation_id', data.id)
      .order('read_at', { ascending: false });

    if (readHistory) {
      manifestation.readHistory = readHistory.map(h => ({
        readAt: new Date(h.read_at),
        moodEntryId: h.mood_entry_id || undefined,
        readDuration: h.read_duration_seconds || undefined,
      }));
    }

    return manifestation;
  }

  static async createManifestationEntry(entry: Omit<ManifestationEntry, 'id' | 'createdAt' | 'isCompleted'>): Promise<ManifestationEntry | null> {
    if (!isSupabaseConfigured()) return null;

    const userId = await getCurrentUserId();
    if (!userId) return null;

    const newEntry: ManifestationEntry = {
      ...entry,
      id: generateId(),
      createdAt: new Date(),
      isCompleted: false,
    };

    const dbEntry = manifestationToDB(newEntry, userId);

    const { data, error } = await supabase
      .from('manifestation_entries')
      .insert(dbEntry)
      .select()
      .single();

    if (error) {
      console.error('Error creating manifestation entry:', error);
      return null;
    }

    return manifestationFromDB(data);
  }

  static async updateManifestationEntry(id: string, updates: Partial<ManifestationEntry>): Promise<ManifestationEntry | null> {
    if (!isSupabaseConfigured()) return null;

    const userId = await getCurrentUserId();
    if (!userId) return null;

    const dbUpdates: Partial<ManifestationEntryDB> = {};
    if (updates.title !== undefined) dbUpdates.title = updates.title;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.category !== undefined) dbUpdates.category = updates.category;
    if (updates.targetDate !== undefined) dbUpdates.target_date = updates.targetDate?.toISOString().split('T')[0] || null;
    if (updates.isCompleted !== undefined) {
      dbUpdates.is_completed = updates.isCompleted;
      if (updates.isCompleted) {
        dbUpdates.completed_at = new Date().toISOString();
      }
    }
    if (updates.visualizationNotes !== undefined) dbUpdates.visualization_notes = updates.visualizationNotes;
    if (updates.affirmations !== undefined) dbUpdates.affirmations = updates.affirmations;

    const { data, error } = await supabase
      .from('manifestation_entries')
      .update(dbUpdates)
      .eq('user_id', userId)
      .or(`id.eq.${id},local_id.eq.${id}`)
      .select()
      .single();

    if (error) {
      console.error('Error updating manifestation entry:', error);
      return null;
    }

    return manifestationFromDB(data);
  }

  static async deleteManifestationEntry(id: string): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;

    const userId = await getCurrentUserId();
    if (!userId) return false;

    const { error } = await supabase
      .from('manifestation_entries')
      .update({ deleted_at: new Date().toISOString() })
      .eq('user_id', userId)
      .or(`id.eq.${id},local_id.eq.${id}`);

    if (error) {
      console.error('Error deleting manifestation entry:', error);
      return false;
    }

    return true;
  }

  static async recordManifestationRead(
    manifestationId: string,
    moodEntryId?: string,
    durationSeconds?: number
  ): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;

    const userId = await getCurrentUserId();
    if (!userId) return false;

    // First, get the actual UUID of the manifestation
    const { data: manifestation } = await supabase
      .from('manifestation_entries')
      .select('id')
      .eq('user_id', userId)
      .or(`id.eq.${manifestationId},local_id.eq.${manifestationId}`)
      .single();

    if (!manifestation) return false;

    const { error } = await supabase
      .from('manifestation_read_history')
      .insert({
        manifestation_id: manifestation.id,
        user_id: userId,
        read_at: new Date().toISOString(),
        mood_entry_id: moodEntryId || null,
        read_duration_seconds: durationSeconds || null,
      });

    if (error) {
      console.error('Error recording manifestation read:', error);
      return false;
    }

    return true;
  }

  // ==========================================
  // ALARMS
  // ==========================================

  static async getAlarms(): Promise<Alarm[]> {
    if (!isSupabaseConfigured()) return [];

    const userId = await getCurrentUserId();
    if (!userId) return [];

    const { data, error } = await supabase
      .from('alarms')
      .select('*')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching alarms:', error);
      return [];
    }

    return (data || []).map(alarmFromDB);
  }

  static async getAlarmById(id: string): Promise<Alarm | null> {
    if (!isSupabaseConfigured()) return null;

    const userId = await getCurrentUserId();
    if (!userId) return null;

    const { data, error } = await supabase
      .from('alarms')
      .select('*')
      .eq('user_id', userId)
      .or(`id.eq.${id},local_id.eq.${id}`)
      .is('deleted_at', null)
      .single();

    if (error || !data) return null;
    return alarmFromDB(data);
  }

  static async getEnabledAlarms(): Promise<Alarm[]> {
    if (!isSupabaseConfigured()) return [];

    const userId = await getCurrentUserId();
    if (!userId) return [];

    const { data, error } = await supabase
      .from('alarms')
      .select('*')
      .eq('user_id', userId)
      .eq('is_enabled', true)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching enabled alarms:', error);
      return [];
    }

    return (data || []).map(alarmFromDB);
  }

  static async createAlarm(alarm: Omit<Alarm, 'id' | 'createdAt'>): Promise<Alarm | null> {
    if (!isSupabaseConfigured()) return null;

    const userId = await getCurrentUserId();
    if (!userId) return null;

    const newAlarm: Alarm = {
      ...alarm,
      id: generateId(),
      createdAt: new Date(),
    };

    const dbAlarm = alarmToDB(newAlarm, userId);

    const { data, error } = await supabase
      .from('alarms')
      .insert(dbAlarm)
      .select()
      .single();

    if (error) {
      console.error('Error creating alarm:', error);
      return null;
    }

    return alarmFromDB(data);
  }

  static async updateAlarm(id: string, updates: Partial<Alarm>): Promise<Alarm | null> {
    if (!isSupabaseConfigured()) return null;

    const userId = await getCurrentUserId();
    if (!userId) return null;

    const dbUpdates: Partial<AlarmDB> = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.interval !== undefined) {
      if (updates.interval === 'test_mode') {
        dbUpdates.is_test_mode = true;
        dbUpdates.interval_hours = 0;
        dbUpdates.interval_minutes = 0;
      } else {
        dbUpdates.is_test_mode = false;
        dbUpdates.interval_hours = updates.interval.hours;
        dbUpdates.interval_minutes = updates.interval.minutes;
      }
    }
    if (updates.testInterval !== undefined) dbUpdates.test_interval_minutes = updates.testInterval;
    if (updates.dayStartTime !== undefined) dbUpdates.day_start_time = updates.dayStartTime;
    if (updates.dayEndTime !== undefined) dbUpdates.day_end_time = updates.dayEndTime;
    if (updates.activeDays !== undefined) dbUpdates.active_days = updates.activeDays;
    if (updates.isEnabled !== undefined) dbUpdates.is_enabled = updates.isEnabled;
    if (updates.lastTriggered !== undefined) dbUpdates.last_triggered_at = updates.lastTriggered.toISOString();
    if (updates.nextTrigger !== undefined) dbUpdates.next_trigger_at = updates.nextTrigger.toISOString();
    if (updates.soundType !== undefined) dbUpdates.sound_type = updates.soundType;

    const { data, error } = await supabase
      .from('alarms')
      .update(dbUpdates)
      .eq('user_id', userId)
      .or(`id.eq.${id},local_id.eq.${id}`)
      .select()
      .single();

    if (error) {
      console.error('Error updating alarm:', error);
      return null;
    }

    return alarmFromDB(data);
  }

  static async deleteAlarm(id: string): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;

    const userId = await getCurrentUserId();
    if (!userId) return false;

    const { error } = await supabase
      .from('alarms')
      .update({ deleted_at: new Date().toISOString() })
      .eq('user_id', userId)
      .or(`id.eq.${id},local_id.eq.${id}`);

    if (error) {
      console.error('Error deleting alarm:', error);
      return false;
    }

    return true;
  }

  // ==========================================
  // USER PROFILE
  // ==========================================

  static async getProfile(): Promise<User | null> {
    if (!isSupabaseConfigured()) return null;

    const userId = await getCurrentUserId();
    if (!userId) return null;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !data) {
      console.error('Error fetching profile:', error);
      return null;
    }

    return userFromDB(data);
  }

  static async updateProfile(updates: Partial<User>): Promise<User | null> {
    if (!isSupabaseConfigured()) return null;

    const userId = await getCurrentUserId();
    if (!userId) return null;

    const dbUpdates: Partial<ProfileDB> = {};
    if (updates.name !== undefined) dbUpdates.display_name = updates.name;
    if (updates.email !== undefined) dbUpdates.email = updates.email;
    if (updates.preferences) {
      if (updates.preferences.notificationsEnabled !== undefined) {
        dbUpdates.notifications_enabled = updates.preferences.notificationsEnabled;
      }
      if (updates.preferences.soundEnabled !== undefined) {
        dbUpdates.sound_enabled = updates.preferences.soundEnabled;
      }
      if (updates.preferences.theme !== undefined) {
        dbUpdates.theme = updates.preferences.theme;
      }
      if (updates.preferences.reminderFrequency !== undefined) {
        dbUpdates.reminder_frequency = updates.preferences.reminderFrequency;
      }
      if (updates.preferences.reminderTime !== undefined) {
        dbUpdates.reminder_time = updates.preferences.reminderTime;
      }
    }

    dbUpdates.last_seen_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('profiles')
      .update(dbUpdates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating profile:', error);
      return null;
    }

    return userFromDB(data);
  }

  static async markMigrationComplete(): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;

    const userId = await getCurrentUserId();
    if (!userId) return false;

    const { error } = await supabase
      .from('profiles')
      .update({
        local_data_migrated: true,
        local_migration_date: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) {
      console.error('Error marking migration complete:', error);
      return false;
    }

    return true;
  }

  // ==========================================
  // BULK OPERATIONS (for migration/sync)
  // ==========================================

  static async bulkCreateMoodEntries(entries: MoodEntry[]): Promise<number> {
    if (!isSupabaseConfigured() || entries.length === 0) return 0;

    const userId = await getCurrentUserId();
    if (!userId) return 0;

    const dbEntries = entries.map(entry => moodEntryToDB(entry, userId));

    const { data, error } = await supabase
      .from('mood_entries')
      .upsert(dbEntries, { onConflict: 'local_id' })
      .select();

    if (error) {
      console.error('Error bulk creating mood entries:', error);
      return 0;
    }

    return data?.length || 0;
  }

  static async bulkCreateManifestations(entries: ManifestationEntry[]): Promise<number> {
    if (!isSupabaseConfigured() || entries.length === 0) return 0;

    const userId = await getCurrentUserId();
    if (!userId) return 0;

    const dbEntries = entries.map(entry => manifestationToDB(entry, userId));

    const { data, error } = await supabase
      .from('manifestation_entries')
      .upsert(dbEntries, { onConflict: 'local_id' })
      .select();

    if (error) {
      console.error('Error bulk creating manifestation entries:', error);
      return 0;
    }

    return data?.length || 0;
  }

  static async bulkCreateAlarms(alarms: Alarm[]): Promise<number> {
    if (!isSupabaseConfigured() || alarms.length === 0) return 0;

    const userId = await getCurrentUserId();
    if (!userId) return 0;

    const dbAlarms = alarms.map(alarm => alarmToDB(alarm, userId));

    const { data, error } = await supabase
      .from('alarms')
      .upsert(dbAlarms, { onConflict: 'local_id' })
      .select();

    if (error) {
      console.error('Error bulk creating alarms:', error);
      return 0;
    }

    return data?.length || 0;
  }
}

export default CloudStorageService;
