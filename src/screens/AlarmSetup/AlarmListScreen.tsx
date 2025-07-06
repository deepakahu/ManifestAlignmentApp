import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  RefreshControl,
} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {AlarmService} from '../../services/AlarmService';
import {Alarm} from '../../types';
import {useNavigation, useFocusEffect} from '@react-navigation/native';

const AlarmListScreen = () => {
  const navigation = useNavigation();
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadAlarms = useCallback(async () => {
    try {
      const loadedAlarms = await AlarmService.getAlarms();
      setAlarms(loadedAlarms);
    } catch (error) {
      console.error('Error loading alarms:', error);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadAlarms();
    setRefreshing(false);
  }, [loadAlarms]);

  useFocusEffect(
    useCallback(() => {
      loadAlarms();
    }, [loadAlarms])
  );

  const toggleAlarm = async (alarmId: string, enabled: boolean) => {
    try {
      const success = await AlarmService.toggleAlarm(alarmId, enabled);
      if (success) {
        await loadAlarms();
      } else {
        Alert.alert('Error', 'Failed to update alarm');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update alarm');
    }
  };

  const deleteAlarm = (alarm: Alarm) => {
    Alert.alert(
      'Delete Alarm',
      `Are you sure you want to delete "${alarm.name}"?`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const success = await AlarmService.deleteAlarm(alarm.id);
              if (success) {
                await loadAlarms();
              } else {
                Alert.alert('Error', 'Failed to delete alarm');
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to delete alarm');
            }
          },
        },
      ]
    );
  };

  const editAlarm = (alarm: Alarm) => {
    navigation.navigate('AlarmSetup', {
      alarm: {
        ...alarm,
        createdAt: alarm.createdAt instanceof Date ? alarm.createdAt.getTime() : alarm.createdAt
      }
    });
  };

  const formatActiveDays = (activeDays: boolean[]) => {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const activeDayNames = dayNames.filter((_, index) => activeDays[index]);
    
    if (activeDayNames.length === 7) return 'Every day';
    if (activeDayNames.length === 5 && !activeDays[0] && !activeDays[6]) return 'Weekdays';
    if (activeDayNames.length === 2 && activeDays[0] && activeDays[6]) return 'Weekends';
    
    return activeDayNames.join(', ');
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const renderAlarmCard = (alarm: Alarm) => (
    <View key={alarm.id} style={styles.alarmCard}>
      <View style={styles.alarmHeader}>
        <View style={styles.alarmInfo}>
          <Text style={styles.alarmName}>{alarm.name}</Text>
          <Text style={styles.alarmDetails}>
            Every {typeof alarm.interval === 'object' ? `${alarm.interval.hours}h ${alarm.interval.minutes}m` : `${alarm.interval} hours`} • {formatTime(alarm.dayStartTime)} - {formatTime(alarm.dayEndTime)}
          </Text>
          <Text style={styles.alarmDays}>
            {formatActiveDays(alarm.activeDays)}
          </Text>
          {alarm.nextTrigger && (
            <Text style={styles.nextTrigger}>
              Next: {AlarmService.formatNextTrigger(alarm)}
            </Text>
          )}
        </View>
        <Switch
          value={alarm.isEnabled}
          onValueChange={(enabled) => toggleAlarm(alarm.id, enabled)}
          trackColor={{false: '#e5e7eb', true: '#c7d2fe'}}
          thumbColor={alarm.isEnabled ? '#6366f1' : '#9ca3af'}
        />
      </View>
      
      <View style={styles.alarmActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => editAlarm(alarm)}>
          <Ionicons name="pencil" size={18} color="#6366f1" />
          <Text style={styles.actionButtonText}>Edit</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => deleteAlarm(alarm)}>
          <Ionicons name="trash" size={18} color="#ef4444" />
          <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.title}>Mood Alarms</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('AlarmSetup')}>
          <Ionicons name="add" size={24} color="#6366f1" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }>
        {alarms.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="alarm" size={64} color="#9ca3af" />
            <Text style={styles.emptyTitle}>No Alarms Set</Text>
            <Text style={styles.emptyDescription}>
              Create your first mood tracking alarm to get started with regular check-ins.
            </Text>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => navigation.navigate('AlarmSetup')}>
              <Ionicons name="add" size={20} color="#fff" />
              <Text style={styles.createButtonText}>Create First Alarm</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.alarmsList}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                {alarms.length} Alarm{alarms.length > 1 ? 's' : ''}
              </Text>
            </View>
            {alarms.map(renderAlarmCard)}
          </View>
        )}

        <View style={styles.tipsSection}>
          <Text style={styles.tipsTitle}>Tips</Text>
          <View style={styles.tipCard}>
            <Ionicons name="bulb" size={20} color="#fbbf24" />
            <Text style={styles.tipText}>
              Set alarms during your most active hours for better mood tracking consistency.
            </Text>
          </View>
          <View style={styles.tipCard}>
            <Ionicons name="time" size={20} color="#fbbf24" />
            <Text style={styles.tipText}>
              Allow at least your interval duration between start and end times.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    flex: 1,
    textAlign: 'center',
  },
  addButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    paddingTop: 100,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6366f1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  alarmsList: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  alarmCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  alarmHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  alarmInfo: {
    flex: 1,
  },
  alarmName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  alarmDetails: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
  },
  alarmDays: {
    fontSize: 14,
    color: '#6366f1',
    marginBottom: 4,
  },
  nextTrigger: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '500',
  },
  alarmActions: {
    flexDirection: 'row',
    gap: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#f3f4f6',
  },
  actionButtonText: {
    fontSize: 14,
    color: '#6366f1',
    marginLeft: 4,
    fontWeight: '500',
  },
  deleteButton: {
    backgroundColor: '#fef2f2',
  },
  deleteButtonText: {
    color: '#ef4444',
  },
  tipsSection: {
    padding: 20,
    paddingTop: 0,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  tipText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
});

export default AlarmListScreen;