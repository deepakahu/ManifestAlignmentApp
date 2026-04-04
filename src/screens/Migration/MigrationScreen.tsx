/**
 * Migration Screen
 * Shows when user has local data that can be migrated to cloud
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  DataMigrationService,
  LocalDataCounts,
  MigrationResult,
} from '../../services/migration/DataMigrationService';

interface MigrationScreenProps {
  onComplete: () => void;
  onSkip: () => void;
}

const MigrationScreen: React.FC<MigrationScreenProps> = ({ onComplete, onSkip }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isMigrating, setIsMigrating] = useState(false);
  const [localCounts, setLocalCounts] = useState<LocalDataCounts | null>(null);
  const [migrationResult, setMigrationResult] = useState<MigrationResult | null>(null);

  useEffect(() => {
    loadLocalDataCounts();
  }, []);

  const loadLocalDataCounts = async () => {
    setIsLoading(true);
    const counts = await DataMigrationService.getLocalDataCounts();
    setLocalCounts(counts);
    setIsLoading(false);
  };

  const handleMigrate = async () => {
    setIsMigrating(true);
    const result = await DataMigrationService.migrateToCloud();
    setMigrationResult(result);
    setIsMigrating(false);

    if (result.success) {
      Alert.alert(
        'Migration Complete',
        `Successfully migrated:\n- ${result.migratedCounts.moodEntries} mood entries\n- ${result.migratedCounts.manifestations} manifestations\n- ${result.migratedCounts.alarms} alarms`,
        [{ text: 'Continue', onPress: onComplete }]
      );
    } else if (result.errors.length > 0) {
      const errorMessages = result.errors.map(e => `${e.type}: ${e.error}`).join('\n');
      Alert.alert(
        'Migration Completed with Issues',
        `Some items may not have been migrated:\n${errorMessages}\n\nMigrated:\n- ${result.migratedCounts.moodEntries} mood entries\n- ${result.migratedCounts.manifestations} manifestations\n- ${result.migratedCounts.alarms} alarms`,
        [{ text: 'Continue', onPress: onComplete }]
      );
    }
  };

  const handleSkip = () => {
    Alert.alert(
      'Skip Migration?',
      'Your local data will remain on this device. You can migrate later from Settings.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Skip',
          style: 'destructive',
          onPress: async () => {
            await DataMigrationService.skipMigration();
            onSkip();
          },
        },
      ]
    );
  };

  const handleStartFresh = () => {
    Alert.alert(
      'Start Fresh?',
      'This will skip migration and clear all local data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Start Fresh',
          style: 'destructive',
          onPress: async () => {
            await DataMigrationService.skipMigration();
            await DataMigrationService.clearLocalData();
            onSkip();
          },
        },
      ]
    );
  };

  const getTotalItems = () => {
    if (!localCounts) return 0;
    return localCounts.moodEntries + localCounts.manifestations + localCounts.alarms;
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Checking local data...</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Ionicons name="cloud-upload" size={48} color="#6366f1" />
        </View>
        <Text style={styles.title}>Migrate Your Data</Text>
        <Text style={styles.subtitle}>
          We found local data on this device. Would you like to sync it to the cloud?
        </Text>
      </View>

      {/* Data Summary */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Found on this device:</Text>

        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Ionicons name="happy-outline" size={24} color="#10b981" />
            <Text style={styles.summaryCount}>{localCounts?.moodEntries ?? 0}</Text>
            <Text style={styles.summaryLabel}>Mood Entries</Text>
          </View>

          <View style={styles.summaryItem}>
            <Ionicons name="star-outline" size={24} color="#f59e0b" />
            <Text style={styles.summaryCount}>{localCounts?.manifestations ?? 0}</Text>
            <Text style={styles.summaryLabel}>Manifestations</Text>
          </View>

          <View style={styles.summaryItem}>
            <Ionicons name="alarm-outline" size={24} color="#6366f1" />
            <Text style={styles.summaryCount}>{localCounts?.alarms ?? 0}</Text>
            <Text style={styles.summaryLabel}>Alarms</Text>
          </View>
        </View>

        {localCounts?.hasUserData && (
          <View style={styles.profileNote}>
            <Ionicons name="person-outline" size={16} color="#64748b" />
            <Text style={styles.profileNoteText}>Profile settings will also be synced</Text>
          </View>
        )}
      </View>

      {/* Benefits */}
      <View style={styles.benefitsSection}>
        <Text style={styles.benefitsTitle}>Benefits of syncing:</Text>

        <View style={styles.benefitItem}>
          <Ionicons name="sync-outline" size={20} color="#10b981" />
          <Text style={styles.benefitText}>Access your data on any device</Text>
        </View>

        <View style={styles.benefitItem}>
          <Ionicons name="shield-checkmark-outline" size={20} color="#10b981" />
          <Text style={styles.benefitText}>Secure cloud backup</Text>
        </View>

        <View style={styles.benefitItem}>
          <Ionicons name="desktop-outline" size={20} color="#10b981" />
          <Text style={styles.benefitText}>View on web dashboard</Text>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={[styles.migrateButton, isMigrating && styles.buttonDisabled]}
          onPress={handleMigrate}
          disabled={isMigrating}
        >
          {isMigrating ? (
            <>
              <ActivityIndicator color="#fff" size="small" />
              <Text style={styles.migrateButtonText}>Migrating...</Text>
            </>
          ) : (
            <>
              <Ionicons name="cloud-upload-outline" size={20} color="#fff" />
              <Text style={styles.migrateButtonText}>
                Migrate {getTotalItems()} Items
              </Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.skipButton}
          onPress={handleSkip}
          disabled={isMigrating}
        >
          <Text style={styles.skipButtonText}>Maybe Later</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.freshButton}
          onPress={handleStartFresh}
          disabled={isMigrating}
        >
          <Text style={styles.freshButtonText}>Start Fresh (Clear Local Data)</Text>
        </TouchableOpacity>
      </View>

      {/* Note */}
      <View style={styles.noteContainer}>
        <Ionicons name="information-circle-outline" size={16} color="#94a3b8" />
        <Text style={styles.noteText}>
          Your local data will remain on this device even after migration. You can access Settings to clear it later.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#64748b',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#eef2ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
    gap: 8,
  },
  summaryCount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#64748b',
  },
  profileNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    gap: 8,
  },
  profileNoteText: {
    fontSize: 14,
    color: '#64748b',
  },
  benefitsSection: {
    marginBottom: 32,
  },
  benefitsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 16,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  benefitText: {
    fontSize: 15,
    color: '#475569',
  },
  actionsContainer: {
    gap: 12,
    marginBottom: 24,
  },
  migrateButton: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  migrateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  skipButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  skipButtonText: {
    color: '#64748b',
    fontSize: 16,
    fontWeight: '500',
  },
  freshButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  freshButtonText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '500',
  },
  noteContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#f1f5f9',
    padding: 12,
    borderRadius: 8,
  },
  noteText: {
    flex: 1,
    fontSize: 13,
    color: '#64748b',
    lineHeight: 18,
  },
});

export default MigrationScreen;
