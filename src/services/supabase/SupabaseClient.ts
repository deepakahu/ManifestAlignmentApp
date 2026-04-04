/**
 * Supabase Client Configuration
 * Singleton client instance for both auth and database operations
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../../../packages/shared/src/constants';

// Type definition for our database (will be generated from Supabase later)
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          email: string | null;
          avatar_url: string | null;
          timezone: string;
          notifications_enabled: boolean;
          sound_enabled: boolean;
          theme: string;
          reminder_frequency: string | null;
          reminder_time: string | null;
          subscription_status: string;
          subscription_expiry: string | null;
          trial_start_date: string | null;
          trial_end_date: string | null;
          has_lifetime_access: boolean;
          local_data_migrated: boolean;
          local_migration_date: string | null;
          created_at: string;
          updated_at: string;
          last_seen_at: string | null;
        };
        Insert: Partial<Database['public']['Tables']['profiles']['Row']>;
        Update: Partial<Database['public']['Tables']['profiles']['Row']>;
      };
      mood_entries: {
        Row: {
          id: string;
          user_id: string;
          mood: number;
          notes: string;
          tags: string[];
          timestamp: string;
          alarm_id: string | null;
          alarm_name: string | null;
          manifestation_read: boolean;
          local_id: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: Partial<Database['public']['Tables']['mood_entries']['Row']> & { user_id: string; mood: number; timestamp: string };
        Update: Partial<Database['public']['Tables']['mood_entries']['Row']>;
      };
      manifestation_entries: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string;
          category: string;
          target_date: string | null;
          is_completed: boolean;
          completed_at: string | null;
          visualization_notes: string | null;
          affirmations: string[];
          local_id: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: Partial<Database['public']['Tables']['manifestation_entries']['Row']> & { user_id: string; title: string };
        Update: Partial<Database['public']['Tables']['manifestation_entries']['Row']>;
      };
      alarms: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          interval_hours: number;
          interval_minutes: number;
          is_test_mode: boolean;
          test_interval_minutes: number;
          day_start_time: string;
          day_end_time: string;
          active_days: boolean[];
          is_enabled: boolean;
          last_triggered_at: string | null;
          next_trigger_at: string | null;
          sound_type: string;
          local_id: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: Partial<Database['public']['Tables']['alarms']['Row']> & { user_id: string; name: string };
        Update: Partial<Database['public']['Tables']['alarms']['Row']>;
      };
      sync_queue: {
        Row: {
          id: string;
          user_id: string;
          table_name: string;
          record_id: string;
          operation: string;
          payload: unknown;
          local_timestamp: string;
          status: string;
          retry_count: number;
          last_error: string | null;
          processed_at: string | null;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['sync_queue']['Row']> & { user_id: string; table_name: string; record_id: string; operation: string; local_timestamp: string };
        Update: Partial<Database['public']['Tables']['sync_queue']['Row']>;
      };
    };
  };
};

// Environment variables - should be set in .env file
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

// Validate environment variables
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn(
    'Supabase credentials not found. Please add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to your .env file.'
  );
}

// Custom storage adapter for React Native using AsyncStorage
const ExpoSecureStoreAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      return await AsyncStorage.getItem(key);
    } catch (error) {
      console.error('Error getting item from AsyncStorage:', error);
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      console.error('Error setting item in AsyncStorage:', error);
    }
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing item from AsyncStorage:', error);
    }
  },
};

// Singleton instance
let supabaseInstance: SupabaseClient<Database> | null = null;

/**
 * Get the Supabase client instance (singleton pattern)
 */
export function getSupabaseClient(): SupabaseClient<Database> {
  if (!supabaseInstance) {
    supabaseInstance = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        storage: ExpoSecureStoreAdapter,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false, // Important for React Native
      },
      global: {
        headers: {
          'x-application-name': 'manifestation-alarm-mobile',
        },
      },
    });
  }
  return supabaseInstance;
}

/**
 * Shorthand export for the client
 */
export const supabase = getSupabaseClient();

/**
 * Check if Supabase is properly configured
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

/**
 * Get the current user ID if authenticated
 */
export async function getCurrentUserId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const { data: { session } } = await supabase.auth.getSession();
  return session !== null;
}

export default supabase;
