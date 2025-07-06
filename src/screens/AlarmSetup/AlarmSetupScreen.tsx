import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
  Modal,
  Platform,
} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import {Picker} from '@react-native-picker/picker';
import {Audio} from 'expo-av';
import {AlarmService} from '../../services/AlarmService';
import {Alarm} from '../../types';
import {useNavigation, useRoute, RouteProp} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {RootStackParamList} from '../../types';

type AlarmSetupScreenRouteProp = RouteProp<RootStackParamList, 'AlarmSetup'>;
type AlarmSetupScreenNavigationProp = StackNavigationProp<RootStackParamList, 'AlarmSetup'>;

const AlarmSetupScreen = () => {
  const navigation = useNavigation<AlarmSetupScreenNavigationProp>();
  const route = useRoute<AlarmSetupScreenRouteProp>();
  const editingAlarm = route.params?.alarm;
  const isEditing = !!editingAlarm;

  const [alarmName, setAlarmName] = useState(editingAlarm?.name || '');
  const [interval, setInterval] = useState<{hours: number, minutes: number}>(
    (typeof editingAlarm?.interval === 'object' ? editingAlarm.interval : {hours: 2, minutes: 0})
  );
  const [dayStartTime, setDayStartTime] = useState(
    editingAlarm?.dayStartTime || '09:00'
  );
  const [dayEndTime, setDayEndTime] = useState(
    editingAlarm?.dayEndTime || '21:00'
  );
  const [activeDays, setActiveDays] = useState(
    editingAlarm?.activeDays || [false, true, true, true, true, true, false]
  );
  const [isEnabled, setIsEnabled] = useState(editingAlarm?.isEnabled ?? true);
  const [soundType, setSoundType] = useState(editingAlarm?.soundType || 'default');
  
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [showIntervalPicker, setShowIntervalPicker] = useState(false);
  const [showSoundPicker, setShowSoundPicker] = useState(false);
  const [playingSound, setPlayingSound] = useState<string | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  const testIntervalOptions = [
    {label: '1 minute', value: {hours: 0, minutes: 1}},
    {label: '2 minutes', value: {hours: 0, minutes: 2}},
    {label: '3 minutes', value: {hours: 0, minutes: 3}},
    {label: '4 minutes', value: {hours: 0, minutes: 4}},
    {label: '5 minutes', value: {hours: 0, minutes: 5}},
  ];

  const allSoundOptions = [
    {label: 'Default', value: 'default', description: 'Standard system notification sound', preview: false, file: null},
    {label: 'Ambient Piano', value: 'ambient-piano', description: 'Peaceful piano melody', preview: true, file: require('../../../assets/sounds/Ambient Piano.mp3')},
    {label: 'Singing Bowl', value: 'singing-bowl', description: 'Peaceful Tibetan singing bowl tone', preview: true, file: require('../../../assets/sounds/Singing Bowl.mp3')},
    {label: 'Singing Bowl Hit', value: 'singing-bowl-hit', description: 'Single singing bowl strike', preview: true, file: require('../../../assets/sounds/Singing Bowl Hit.mp3')},
    {label: 'Tibetan Bowl Low', value: 'tibetan-bowl-low', description: 'Deep Tibetan bowl tone', preview: true, file: require('../../../assets/sounds/Tibetan Bowl Low.mp3')},
    {label: 'Calm Music', value: 'calm-music', description: 'Soothing background music', preview: true, file: require('../../../assets/sounds/Calm Music.mp3')},
    {label: 'Relaxing Guitar', value: 'relaxing-guitar', description: 'Gentle guitar melody', preview: true, file: require('../../../assets/sounds/Relaxing Guitar.mp3')},
  ];

  const soundOptions = allSoundOptions;

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const timeStringToDate = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    return date;
  };

  const dateToTimeString = (date: Date) => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const toggleDay = (dayIndex: number) => {
    const newActiveDays = [...activeDays];
    newActiveDays[dayIndex] = !newActiveDays[dayIndex];
    setActiveDays(newActiveDays);
  };

  const playPreviewSound = async (soundValue: string) => {
    try {
      // Stop any currently playing sound
      if (sound) {
        await sound.stopAsync();
        await sound.unloadAsync();
        setSound(null);
      }

      if (playingSound === soundValue) {
        // If already playing this sound, stop it
        setPlayingSound(null);
        return;
      }

      // For default sound, we can't preview system notifications
      if (soundValue === 'default') {
        Alert.alert('Preview', 'Default system notification sound will be used.');
        return;
      }

      setPlayingSound(soundValue);

      // Find the sound file for this value
      const soundOption = soundOptions.find(option => option.value === soundValue);
      if (!soundOption || !soundOption.file) {
        Alert.alert('Error', 'Sound file not found');
        setPlayingSound(null);
        return;
      }

      // Load and play the actual sound file
      const { sound: newSound } = await Audio.Sound.createAsync(soundOption.file);
      setSound(newSound);
      
      // Set audio mode for playback
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
      });

      await newSound.playAsync();
      
      // Auto-stop after the sound finishes or after 5 seconds max
      setTimeout(async () => {
        if (newSound) {
          await newSound.stopAsync();
          await newSound.unloadAsync();
        }
        setPlayingSound(null);
        setSound(null);
      }, 5000);
      
    } catch (error) {
      console.error('Error playing preview sound:', error);
      Alert.alert('Error', 'Could not play preview sound');
      setPlayingSound(null);
    }
  };

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  const validateAlarm = () => {
    if (!alarmName.trim()) {
      Alert.alert('Error', 'Please enter an alarm name');
      return false;
    }

    if (!activeDays.some(day => day)) {
      Alert.alert('Error', 'Please select at least one active day');
      return false;
    }


    const startTime = timeStringToDate(dayStartTime);
    const endTime = timeStringToDate(dayEndTime);
    
    if (startTime >= endTime) {
      Alert.alert('Error', 'End time must be after start time');
      return false;
    }

    const totalIntervalMinutes = (interval.hours * 60) + interval.minutes;
    const timeDiff = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
    
    if (totalIntervalMinutes > 0 && timeDiff < totalIntervalMinutes) {
      Alert.alert('Error', `Time window must be at least ${interval.hours}h ${interval.minutes}m`);
      return false;
    }

    return true;
  };

  const saveAlarm = async () => {
    if (!validateAlarm()) return;

    const alarmData: Alarm = {
      id: editingAlarm?.id || Date.now().toString(),
      name: alarmName.trim(),
      interval,
      dayStartTime,
      dayEndTime,
      activeDays,
      isEnabled,
      createdAt: editingAlarm?.createdAt || new Date(),
      lastTriggered: editingAlarm?.lastTriggered,
      nextTrigger: editingAlarm?.nextTrigger,
      soundType,
    };

    try {
      const success = await AlarmService.saveAlarm(alarmData);
      if (success) {
        Alert.alert(
          'Success',
          `Alarm "${alarmName}" ${isEditing ? 'updated' : 'created'} successfully!`,
          [{text: 'OK', onPress: () => navigation.goBack()}]
        );
      } else {
        Alert.alert('Error', 'Failed to save alarm. Please try again.');
      }
    } catch (error) {
      console.error('Error saving alarm:', error);
      Alert.alert('Error', 'Failed to save alarm. Please try again.');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.title}>
          {isEditing ? 'Edit Alarm' : 'Create New Alarm'}
        </Text>
      </View>

      <View style={styles.form}>
        {/* Alarm Name */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Alarm Name *</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Enter alarm name"
            value={alarmName}
            onChangeText={setAlarmName}
          />
        </View>


        {/* Interval Selection */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Reminder Interval</Text>
          <View style={styles.intervalInputs}>
            <View style={styles.intervalInput}>
              <Text style={styles.intervalLabel}>Hours</Text>
              <TextInput
                style={styles.intervalTextInput}
                value={interval.hours.toString()}
                onChangeText={(text) => {
                  const hours = parseInt(text) || 0;
                  setInterval(prev => ({...prev, hours: hours}));
                }}
                keyboardType="numeric"
                placeholder="0"
              />
            </View>
            <View style={styles.intervalInput}>
              <Text style={styles.intervalLabel}>Minutes</Text>
              <TextInput
                style={styles.intervalTextInput}
                value={interval.minutes.toString()}
                onChangeText={(text) => {
                  const minutes = parseInt(text) || 0;
                  setInterval(prev => ({...prev, minutes: minutes}));
                }}
                keyboardType="numeric"
                placeholder="0"
              />
            </View>
          </View>
        </View>

        {/* Day Start Time */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Day Start Time</Text>
          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() => setShowStartTimePicker(true)}>
            <Text style={styles.pickerButtonText}>
              {formatTime(dayStartTime)}
            </Text>
            <Ionicons name="time" size={24} color="#6b7280" />
          </TouchableOpacity>
        </View>

        {/* Day End Time */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Day End Time</Text>
          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() => setShowEndTimePicker(true)}>
            <Text style={styles.pickerButtonText}>
              {formatTime(dayEndTime)}
            </Text>
            <Ionicons name="time" size={24} color="#6b7280" />
          </TouchableOpacity>
        </View>

        {/* Active Days */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Active Days</Text>
          <View style={styles.daysContainer}>
            {dayNames.map((day, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.dayButton,
                  activeDays[index] && styles.dayButtonActive,
                ]}
                onPress={() => toggleDay(index)}>
                <Text
                  style={[
                    styles.dayButtonText,
                    activeDays[index] && styles.dayButtonTextActive,
                  ]}>
                  {day}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Sound Selection */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Notification Sound</Text>
          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() => setShowSoundPicker(true)}>
            <Text style={styles.pickerButtonText}>
              {soundOptions.find(s => s.value === soundType)?.label || 'Default'}
            </Text>
            <Ionicons name="musical-notes" size={24} color="#6b7280" />
          </TouchableOpacity>
          <Text style={styles.description}>
            {soundOptions.find(s => s.value === soundType)?.description || ''}
          </Text>
        </View>

        {/* Enable/Disable Toggle */}
        <View style={styles.inputGroup}>
          <View style={styles.toggleContainer}>
            <View style={styles.toggleInfo}>
              <Text style={styles.label}>Enable Alarm</Text>
              <Text style={styles.description}>
                Turn on to receive notifications
              </Text>
            </View>
            <Switch
              value={isEnabled}
              onValueChange={setIsEnabled}
              trackColor={{false: '#e5e7eb', true: '#c7d2fe'}}
              thumbColor={isEnabled ? '#6366f1' : '#9ca3af'}
            />
          </View>
        </View>

        {/* Preview */}
        <View style={styles.previewContainer}>
          <Text style={styles.previewTitle}>Preview</Text>
          <View style={styles.previewCard}>
            <View style={styles.previewRow}>
              <Ionicons name="alarm" size={20} color="#6366f1" />
              <Text style={styles.previewText}>
                {alarmName || 'Unnamed Alarm'}
              </Text>
            </View>
            <View style={styles.previewRow}>
              <Ionicons name="time" size={20} color="#6b7280" />
              <Text style={styles.previewText}>
                {`Every ${interval.hours}h ${interval.minutes}m, ${formatTime(dayStartTime)} - ${formatTime(dayEndTime)}`}
              </Text>
            </View>
            <View style={styles.previewRow}>
              <Ionicons name="calendar" size={20} color="#6b7280" />
              <Text style={styles.previewText}>
                {dayNames.filter((_, index) => activeDays[index]).join(', ') || 'No days selected'}
              </Text>
            </View>
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity style={styles.saveButton} onPress={saveAlarm}>
          <Ionicons name="save" size={20} color="#fff" />
          <Text style={styles.saveButtonText}>
            {isEditing ? 'Update Alarm' : 'Create Alarm'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Interval Picker Modal */}
      <Modal
        visible={showIntervalPicker}
        transparent={true}
        animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Interval</Text>
              <TouchableOpacity onPress={() => setShowIntervalPicker(false)}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            <Picker
              selectedValue={interval}
              onValueChange={(itemValue) => {
                setInterval(itemValue);
                setShowIntervalPicker(false);
              }}>
              {testIntervalOptions.map((option) => (
                <Picker.Item
                  key={option.value}
                  label={option.label}
                  value={option.value}
                />
              ))}
            </Picker>
          </View>
        </View>
      </Modal>

      {/* Sound Picker Modal */}
      <Modal
        visible={showSoundPicker}
        transparent={true}
        animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Notification Sound</Text>
              <TouchableOpacity onPress={() => setShowSoundPicker(false)}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.soundList}>
              {soundOptions.map((soundOption) => (
                <View key={soundOption.value} style={styles.soundOptionContainer}>
                  <TouchableOpacity
                    style={[
                      styles.soundOption,
                      soundType === soundOption.value && styles.soundOptionSelected
                    ]}
                    onPress={() => {
                      setSoundType(soundOption.value);
                      setShowSoundPicker(false);
                    }}>
                    <View style={styles.soundInfo}>
                      <Text style={[
                        styles.soundLabel,
                        soundType === soundOption.value && styles.soundLabelSelected
                      ]}>
                        {soundOption.label}
                      </Text>
                      <Text style={styles.soundDescription}>{soundOption.description}</Text>
                    </View>
                    <View style={styles.soundActions}>
                      {soundOption.preview && (
                        <TouchableOpacity
                          style={[
                            styles.previewButton,
                            playingSound === soundOption.value && styles.previewButtonPlaying
                          ]}
                          onPress={() => playPreviewSound(soundOption.value)}
                        >
                          <Ionicons 
                            name={playingSound === soundOption.value ? "stop" : "play"} 
                            size={16} 
                            color={playingSound === soundOption.value ? "#fff" : "#6366f1"} 
                          />
                        </TouchableOpacity>
                      )}
                      {soundType === soundOption.value && (
                        <Ionicons name="checkmark-circle" size={24} color="#6366f1" style={styles.checkIcon} />
                      )}
                    </View>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Start Time Picker */}
      {showStartTimePicker && (
        <DateTimePicker
          value={timeStringToDate(dayStartTime)}
          mode="time"
          is24Hour={false}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, selectedDate) => {
            setShowStartTimePicker(false);
            if (selectedDate) {
              setDayStartTime(dateToTimeString(selectedDate));
            }
          }}
        />
      )}

      {/* End Time Picker */}
      {showEndTimePicker && (
        <DateTimePicker
          value={timeStringToDate(dayEndTime)}
          mode="time"
          is24Hour={false}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, selectedDate) => {
            setShowEndTimePicker(false);
            if (selectedDate) {
              setDayEndTime(dateToTimeString(selectedDate));
            }
          }}
        />
      )}
    </ScrollView>
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
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  form: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    fontSize: 16,
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  pickerButtonText: {
    fontSize: 16,
    color: '#111827',
  },
  daysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  dayButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 8,
    alignItems: 'center',
  },
  dayButtonActive: {
    backgroundColor: '#6366f1',
  },
  dayButtonText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  dayButtonTextActive: {
    color: '#fff',
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  toggleInfo: {
    flex: 1,
  },
  description: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  previewContainer: {
    marginBottom: 24,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  previewCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  previewText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 8,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366f1',
    padding: 16,
    borderRadius: 12,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '50%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  intervalInputs: {
    flexDirection: 'row',
    gap: 12,
  },
  intervalInput: {
    flex: 1,
  },
  intervalLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
    marginBottom: 8,
  },
  intervalTextInput: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    fontSize: 16,
    textAlign: 'center',
  },
  soundList: {
    maxHeight: 300,
  },
  soundOptionContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  soundOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  soundOptionSelected: {
    backgroundColor: '#f0f9ff',
  },
  soundInfo: {
    flex: 1,
  },
  soundActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  previewButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e0e7ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewButtonPlaying: {
    backgroundColor: '#6366f1',
  },
  checkIcon: {
    marginLeft: 4,
  },
  soundLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 4,
  },
  soundLabelSelected: {
    color: '#6366f1',
    fontWeight: '600',
  },
  soundDescription: {
    fontSize: 14,
    color: '#6b7280',
  },
});

export default AlarmSetupScreen;