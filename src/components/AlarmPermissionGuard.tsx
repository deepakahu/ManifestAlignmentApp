import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { AlarmNotificationService } from '../services/notifications/AlarmNotificationService';
import { AndroidAlarmPermissions } from '../utils/AndroidAlarmPermissions';

interface PermissionStatus {
  id: string;
  title: string;
  description: string;
  isGranted: boolean;
  isRequired: boolean;
  settingsPath: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

interface AlarmPermissionGuardProps {
  children: React.ReactNode;
}

export const AlarmPermissionGuard: React.FC<AlarmPermissionGuardProps> = ({ children }) => {
  const [showSetup, setShowSetup] = useState(false);
  const [permissions, setPermissions] = useState<PermissionStatus[]>([]);
  const [isChecking, setIsChecking] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    setIsChecking(true);

    const permissionList: PermissionStatus[] = [];

    // 1. Check Notification Permission
    const { status: notificationStatus } = await Notifications.getPermissionsAsync();
    permissionList.push({
      id: 'notifications',
      title: 'Notifications',
      description: 'Required to show alarm notifications',
      isGranted: notificationStatus === 'granted',
      isRequired: true,
      settingsPath: 'App Settings → Notifications',
      icon: 'notifications',
      color: '#6366f1',
    });

    // 2. Check Alarm Channel (Android)
    if (Platform.OS === 'android') {
      const channels = await Notifications.getNotificationChannelsAsync();
      const alarmChannel = channels.find(c => c.id === 'alarm_channel');
      const channelConfigured = alarmChannel && alarmChannel.importance >= 4;

      permissionList.push({
        id: 'alarm_channel',
        title: 'Alarm Notification Channel',
        description: 'High-priority channel for alarm notifications',
        isGranted: channelConfigured || false,
        isRequired: true,
        settingsPath: 'App Settings → Notifications → Alarm Notifications',
        icon: 'megaphone',
        color: '#f59e0b',
      });

      // 3. Exact Alarm Permission (Android 12+)
      if (AndroidAlarmPermissions.requiresExactAlarmPermission()) {
        const canScheduleExactAlarms = await AndroidAlarmPermissions.canScheduleExactAlarms();
        permissionList.push({
          id: 'exact_alarm',
          title: 'Alarms & Reminders',
          description: 'Required for alarms to fire at exact times (Android 12+)',
          isGranted: canScheduleExactAlarms,
          isRequired: true,
          settingsPath: 'App Settings → Alarms & reminders → Allow',
          icon: 'alarm',
          color: '#ef4444',
        });
      }
    }

    // 4. Battery Optimization (Android only)
    if (Platform.OS === 'android') {
      permissionList.push({
        id: 'battery',
        title: 'Battery Optimization',
        description: 'Disable to prevent Android from killing alarm notifications',
        isGranted: false, // Always recommend checking
        isRequired: true,
        settingsPath: 'App Settings → Battery → Unrestricted',
        icon: 'battery-charging',
        color: '#10b981',
      });
    }

    // 5. Device check
    const isRealDevice = Device.isDevice;
    permissionList.push({
      id: 'device',
      title: 'Physical Device',
      description: 'Alarms work best on real devices (not emulators)',
      isGranted: isRealDevice,
      isRequired: false,
      settingsPath: 'N/A',
      icon: 'phone-portrait',
      color: '#8b5cf6',
    });

    setPermissions(permissionList);

    // Show setup if any required permission is not granted
    const needsSetup = permissionList.some(p => p.isRequired && !p.isGranted);
    setShowSetup(needsSetup);
    setIsChecking(false);
  };

  const handleOpenSettings = async () => {
    try {
      await Linking.openSettings();
    } catch (error) {
      Alert.alert('Error', 'Could not open settings. Please open Settings app manually.');
    }
  };

  const handleRequestNotifications = async () => {
    const granted = await AlarmNotificationService.requestNotificationPermissions();
    if (granted) {
      await checkPermissions(); // Recheck after granting
    }
  };

  const handleConfigureChannel = async () => {
    try {
      await AlarmNotificationService.configureAlarmChannel();
      Alert.alert(
        'Channel Configured',
        'Alarm notification channel has been set up. Please verify in Settings that importance is set to "Urgent" or "High".',
        [
          { text: 'OK', onPress: () => checkPermissions() },
          { text: 'Open Settings', onPress: handleOpenSettings },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to configure alarm channel');
    }
  };

  const handleSkipSetup = () => {
    Alert.alert(
      'Skip Setup?',
      'Alarms may not work properly without correct permissions. You can access setup later from Settings → Alarm Diagnostics.',
      [
        { text: 'Go Back', style: 'cancel' },
        { text: 'Skip Anyway', style: 'destructive', onPress: () => setShowSetup(false) },
      ]
    );
  };

  const handleCompleteSetup = async () => {
    await checkPermissions();
    const stillHasIssues = permissions.some(p => p.isRequired && !p.isGranted);

    if (stillHasIssues) {
      Alert.alert(
        'Setup Incomplete',
        'Some required permissions are still missing. Alarms may not work properly. Continue anyway?',
        [
          { text: 'Continue Setup', style: 'cancel' },
          { text: 'Continue Anyway', onPress: () => setShowSetup(false) },
        ]
      );
    } else {
      setShowSetup(false);
      Alert.alert('Setup Complete!', 'Your alarm system is ready to use.');
    }
  };

  const renderPermissionItem = (permission: PermissionStatus, index: number) => {
    const isCurrentStep = index === currentStep;

    return (
      <View
        key={permission.id}
        style={[
          styles.permissionItem,
          permission.isGranted && styles.permissionGranted,
          isCurrentStep && styles.permissionCurrent,
        ]}
      >
        <View style={[styles.permissionIcon, { backgroundColor: permission.color + '20' }]}>
          <Ionicons
            name={permission.isGranted ? 'checkmark-circle' : permission.icon}
            size={32}
            color={permission.isGranted ? '#10b981' : permission.color}
          />
        </View>

        <View style={styles.permissionContent}>
          <View style={styles.permissionHeader}>
            <Text style={styles.permissionTitle}>{permission.title}</Text>
            {permission.isRequired && !permission.isGranted && (
              <View style={styles.requiredBadge}>
                <Text style={styles.requiredText}>Required</Text>
              </View>
            )}
          </View>

          <Text style={styles.permissionDescription}>{permission.description}</Text>

          {!permission.isGranted && permission.settingsPath !== 'N/A' && (
            <Text style={styles.permissionPath}>📍 {permission.settingsPath}</Text>
          )}

          {permission.isGranted && (
            <View style={styles.grantedBadge}>
              <Ionicons name="checkmark" size={16} color="#10b981" />
              <Text style={styles.grantedText}>Configured</Text>
            </View>
          )}
        </View>

        {!permission.isGranted && permission.isRequired && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={async () => {
              if (permission.id === 'notifications') {
                handleRequestNotifications();
              } else if (permission.id === 'alarm_channel') {
                handleConfigureChannel();
              } else if (permission.id === 'exact_alarm') {
                await AndroidAlarmPermissions.openExactAlarmSettings();
                // Wait a bit and recheck
                setTimeout(() => checkPermissions(), 1000);
              } else if (permission.id === 'battery') {
                await AndroidAlarmPermissions.openBatteryOptimizationSettings();
                setTimeout(() => checkPermissions(), 1000);
              } else {
                handleOpenSettings();
              }
            }}
          >
            <Text style={styles.actionButtonText}>
              {permission.id === 'notifications' ? 'Grant' : 'Open Settings'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (isChecking) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Checking alarm permissions...</Text>
      </View>
    );
  }

  return (
    <>
      {children}

      <Modal
        visible={showSetup}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={handleSkipSetup}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>⏰ Alarm Setup Required</Text>
            <Text style={styles.modalSubtitle}>
              Configure these settings so your alarms work reliably
            </Text>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.permissionList}>
              {permissions.map((permission, index) => renderPermissionItem(permission, index))}
            </View>

            <View style={styles.infoBox}>
              <Ionicons name="information-circle" size={24} color="#6366f1" />
              <Text style={styles.infoText}>
                These permissions ensure alarms fire even when the app is closed or your phone is locked.
              </Text>
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.skipButton} onPress={handleSkipSetup}>
              <Text style={styles.skipButtonText}>Skip for Now</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.completeButton} onPress={handleCompleteSetup}>
              <Text style={styles.completeButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    fontSize: 16,
    color: '#64748b',
    marginTop: 12,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  modalHeader: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 24,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#64748b',
  },
  modalContent: {
    flex: 1,
  },
  permissionList: {
    padding: 16,
  },
  permissionItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  permissionGranted: {
    borderColor: '#10b981',
    backgroundColor: '#f0fdf4',
  },
  permissionCurrent: {
    borderColor: '#6366f1',
  },
  permissionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  permissionContent: {
    flex: 1,
  },
  permissionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  permissionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    flex: 1,
  },
  requiredBadge: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  requiredText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ef4444',
  },
  permissionDescription: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 8,
    lineHeight: 20,
  },
  permissionPath: {
    fontSize: 12,
    color: '#6366f1',
    marginTop: 4,
  },
  grantedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  grantedText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10b981',
    marginLeft: 4,
  },
  actionButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    justifyContent: 'center',
    alignSelf: 'flex-start',
    marginLeft: 12,
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#eff6ff',
    padding: 16,
    borderRadius: 12,
    margin: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#6366f1',
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#1e40af',
    marginLeft: 12,
    lineHeight: 20,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  skipButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    marginRight: 8,
    alignItems: 'center',
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
  },
  completeButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#6366f1',
    marginLeft: 8,
    alignItems: 'center',
  },
  completeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
