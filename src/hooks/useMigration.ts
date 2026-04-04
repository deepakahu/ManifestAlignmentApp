/**
 * Migration Hook
 * Manages migration state and checks if migration modal should be shown
 */

import { useState, useEffect, useCallback } from 'react';
import { DataMigrationService, MigrationStatus, LocalDataCounts } from '../services/migration/DataMigrationService';
import { useAuth } from './useAuth';

interface UseMigrationReturn {
  shouldShowMigration: boolean;
  isCheckingMigration: boolean;
  migrationStatus: MigrationStatus | null;
  localDataCounts: LocalDataCounts | null;
  completeMigration: () => void;
  skipMigration: () => void;
  refreshMigrationStatus: () => Promise<void>;
}

export function useMigration(): UseMigrationReturn {
  const { isAuthenticated } = useAuth();
  const [isCheckingMigration, setIsCheckingMigration] = useState(true);
  const [shouldShowMigration, setShouldShowMigration] = useState(false);
  const [migrationStatus, setMigrationStatus] = useState<MigrationStatus | null>(null);
  const [localDataCounts, setLocalDataCounts] = useState<LocalDataCounts | null>(null);

  const checkMigrationStatus = useCallback(async () => {
    if (!isAuthenticated) {
      setShouldShowMigration(false);
      setIsCheckingMigration(false);
      return;
    }

    setIsCheckingMigration(true);

    try {
      const [shouldShow, status, counts] = await Promise.all([
        DataMigrationService.shouldShowMigrationModal(),
        DataMigrationService.getMigrationStatus(),
        DataMigrationService.getLocalDataCounts(),
      ]);

      setShouldShowMigration(shouldShow);
      setMigrationStatus(status);
      setLocalDataCounts(counts);
    } catch (error) {
      console.error('Error checking migration status:', error);
      setShouldShowMigration(false);
    } finally {
      setIsCheckingMigration(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    checkMigrationStatus();
  }, [checkMigrationStatus]);

  const completeMigration = useCallback(() => {
    setShouldShowMigration(false);
    checkMigrationStatus();
  }, [checkMigrationStatus]);

  const skipMigration = useCallback(() => {
    setShouldShowMigration(false);
  }, []);

  const refreshMigrationStatus = useCallback(async () => {
    await checkMigrationStatus();
  }, [checkMigrationStatus]);

  return {
    shouldShowMigration,
    isCheckingMigration,
    migrationStatus,
    localDataCounts,
    completeMigration,
    skipMigration,
    refreshMigrationStatus,
  };
}
