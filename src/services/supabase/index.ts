/**
 * Supabase Services Index
 */

export {
  supabase,
  getSupabaseClient,
  isSupabaseConfigured,
  getCurrentUserId,
  isAuthenticated,
} from './SupabaseClient';

export type { Database } from './SupabaseClient';
