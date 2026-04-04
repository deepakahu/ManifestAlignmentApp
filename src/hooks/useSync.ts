/**
 * Sync Hook
 * Provides sync state and operations to components
 */

import { useState, useEffect, useCallback } from 'react';
import { SyncManager } from '../services/sync/SyncManager';
import type { SyncState, SyncResult } from '../repositories/types';

interface UseSyncReturn {
  /** Current sync state */
  syncState: SyncState;
  /** Whether a sync is in progress */
  isSyncing: boolean;
  /** Whether device is online */
  isOnline: boolean;
  /** Number of pending changes to sync */
  pendingChanges: number;
  /** Last sync timestamp */
  lastSyncAt: Date | null;
  /** Trigger a manual sync */
  sync: () => Promise<SyncResult>;
  /** Perform a full sync (for migration) */
  fullSync: () => Promise<SyncResult>;
}

const defaultSyncState: SyncState = {
  isOnline: true,
  isSyncing: false,
  lastSyncAt: null,
  pendingChanges: 0,
};

/**
 * Hook for accessing sync state and operations
 */
export function useSync(): UseSyncReturn {
  const [syncState, setSyncState] = useState<SyncState>(defaultSyncState);

  // Subscribe to sync state changes
  useEffect(() => {
    // Get initial state
    SyncManager.getSyncState().then(setSyncState);

    // Subscribe to changes
    const unsubscribe = SyncManager.subscribe(state => {
      setSyncState(state);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const sync = useCallback(async (): Promise<SyncResult> => {
    return SyncManager.triggerSync();
  }, []);

  const fullSync = useCallback(async (): Promise<SyncResult> => {
    return SyncManager.fullSync();
  }, []);

  return {
    syncState,
    isSyncing: syncState.isSyncing,
    isOnline: syncState.isOnline,
    pendingChanges: syncState.pendingChanges,
    lastSyncAt: syncState.lastSyncAt,
    sync,
    fullSync,
  };
}

export default useSync;
