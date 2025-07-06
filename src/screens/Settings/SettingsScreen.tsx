import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {useNavigation} from '@react-navigation/native';
import {StorageService} from '../../services/storage/StorageService';
import {AlarmService} from '../../services/AlarmService';

const SettingsScreen = () => {
  const navigation = useNavigation();

  const handleExportData = async () => {
    try {
      const exportData = await StorageService.exportData();
      Alert.alert(
        'Export Data',
        'Data exported successfully. In a real app, this would allow you to save or share your data.',
        [{text: 'OK'}]
      );
      console.log('Exported data:', exportData);
    } catch (error) {
      Alert.alert('Error', 'Failed to export data');
    }
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear All Data',
      'Are you sure you want to clear all data? This action cannot be undone.',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await StorageService.clearAllData();
              await AlarmService.clearAllAlarms();
              Alert.alert('Success', 'All data cleared successfully');
              navigation.navigate('MainTabs' as never, {screen: 'Home'} as never);
            } catch (error) {
              Alert.alert('Error', 'Failed to clear data');
            }
          }
        }
      ]
    );
  };

  const handleRefreshAlarms = async () => {
    try {
      await AlarmService.refreshAllAlarms();
      Alert.alert('Success', 'All alarms refreshed and re-scheduled');
    } catch (error) {
      Alert.alert('Error', 'Failed to refresh alarms');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Management</Text>
          
          <TouchableOpacity style={styles.settingItem} onPress={handleExportData}>
            <View style={styles.settingIcon}>
              <Ionicons name="download" size={20} color="#6366f1" />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>Export Data</Text>
              <Text style={styles.settingDescription}>
                Export your mood entries and manifestations
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem} onPress={handleClearData}>
            <View style={styles.settingIcon}>
              <Ionicons name="trash" size={20} color="#ef4444" />
            </View>
            <View style={styles.settingContent}>
              <Text style={[styles.settingLabel, styles.destructiveText]}>Clear All Data</Text>
              <Text style={styles.settingDescription}>
                Remove all stored data and alarms
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Alarms</Text>
          
          <TouchableOpacity style={styles.settingItem} onPress={handleRefreshAlarms}>
            <View style={styles.settingIcon}>
              <Ionicons name="refresh" size={20} color="#6366f1" />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>Refresh Alarms</Text>
              <Text style={styles.settingDescription}>
                Re-schedule all active alarms
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.settingItem} 
            onPress={() => navigation.navigate('AlarmList' as never)}>
            <View style={styles.settingIcon}>
              <Ionicons name="list" size={20} color="#6366f1" />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>Manage Alarms</Text>
              <Text style={styles.settingDescription}>
                View and edit all your alarms
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
          </TouchableOpacity>
        </View>


        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingIcon}>
              <Ionicons name="information-circle" size={20} color="#6366f1" />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>Version</Text>
              <Text style={styles.settingDescription}>1.0.0</Text>
            </View>
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingIcon}>
              <Ionicons name="sparkles" size={20} color="#6366f1" />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>Manifestation Alignment App</Text>
              <Text style={styles.settingDescription}>
                Track your mood and align with your manifestations
              </Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 14,
    color: '#64748b',
  },
  destructiveText: {
    color: '#ef4444',
  },
});

export default SettingsScreen;