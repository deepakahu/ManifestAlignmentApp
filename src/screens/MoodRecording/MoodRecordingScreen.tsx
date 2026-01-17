import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Linking,
} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {AlarmService} from '../../services/AlarmService';
import {useApp} from '../../context/AppContext';
import {useNavigation, useRoute} from '@react-navigation/native';

const MoodRecordingScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const {saveMoodEntry} = useApp();
  
  // Extract parameters from route
  const params = route.params as any;
  const alarmId = params?.alarmId as string | undefined;
  const alarmNameFromParams = params?.alarmName as string | undefined;
  const fromNotification = params?.fromNotification as boolean | undefined;
  const fromAlarm = params?.fromAlarm as boolean | undefined;
  const timestamp = params?.timestamp as string | undefined;
  
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [alarmName, setAlarmName] = useState<string>(alarmNameFromParams || '');
  const [showManifestationPrompt, setShowManifestationPrompt] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const moodOptions = [
    { value: 1, emoji: '😢', label: 'Very Sad' },
    { value: 2, emoji: '😕', label: 'Sad' },
    { value: 3, emoji: '😐', label: 'Neutral' },
    { value: 4, emoji: '😊', label: 'Happy' },
    { value: 5, emoji: '😄', label: 'Very Happy' },
  ];

  const tagOptions = [
    'Work', 'Family', 'Health', 'Social', 'Personal', 'Exercise',
    'Sleep', 'Stress', 'Grateful', 'Anxious', 'Excited', 'Peaceful'
  ];

  useEffect(() => {
    // Record that the alarm was triggered and get alarm name
    if (alarmId) {
      AlarmService.recordAlarmTrigger(alarmId);
      // Only load alarm name if not already provided from notification
      if (!alarmNameFromParams) {
        loadAlarmName();
      }
    }
    
    // Log notification tap if came from notification
    if (fromNotification) {
      console.log('Mood recording opened from notification:', {
        alarmId,
        alarmName: alarmNameFromParams,
        timestamp,
      });
    }
  }, [alarmId, alarmNameFromParams, fromNotification]);

  const loadAlarmName = async () => {
    if (alarmId && !alarmNameFromParams) {
      try {
        const alarm = await AlarmService.getAlarmById(alarmId);
        setAlarmName(alarm?.name || 'Unknown Alarm');
      } catch (error) {
        console.error('Failed to load alarm name:', error);
        setAlarmName('Mood Check-in');
      }
    }
  };

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const saveMood = async () => {
    if (selectedMood === null) {
      Alert.alert('Please select a mood', 'Choose how you are feeling right now.');
      return;
    }

    setIsLoading(true);
    
    try {
      await saveMoodEntry({
        mood: selectedMood,
        notes,
        tags: selectedTags,
        alarmId,
        alarmName,
      });

      console.log('Mood entry saved successfully:', {
        mood: selectedMood,
        alarmId,
        alarmName,
        fromNotification,
        fromAlarm,
      });

      // If coming from FTBA alarm flow, automatically navigate to manifestation reading
      if (fromAlarm) {
        console.log('FTBA flow detected: auto-navigating to manifestation reading');
        navigation.navigate('ManifestationReading' as never, {
          moodEntryId: generateId(),
          fromAlarm: true
        } as never);
        return;
      }

      // Show YouTube link for low mood (< 4)
      if (selectedMood < 4) {
        Alert.alert(
          'Mood Recorded',
          'Here\'s some motivational content that might help!',
          [
            {
              text: 'Watch Video',
              onPress: () => {
                Linking.openURL('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
                setTimeout(() => setShowManifestationPrompt(true), 1000);
              },
            },
            {
              text: 'Skip Video',
              onPress: () => setShowManifestationPrompt(true),
            },
          ]
        );
      } else {
        setShowManifestationPrompt(true);
      }
    } catch (error) {
      console.error('Error saving mood entry:', error);
      Alert.alert('Error', 'Failed to save your mood entry. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleManifestationChoice = async (readManifestation: boolean) => {
    try {
      if (readManifestation) {
        console.log('User chose to read manifestations, opening reading mode');
        navigation.navigate('ManifestationReading' as never, { moodEntryId: generateId() } as never);
      } else {
        console.log('User chose not to read manifestation, going to home');
        navigation.navigate('MainTabs', {screen: 'Home'});
      }
    } catch (error) {
      console.error('Error handling manifestation choice:', error);
      navigation.navigate('MainTabs', {screen: 'Home'});
    }
  };

  const generateId = (): string => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  };

  const skipEntry = () => {
    Alert.alert(
      'Skip Entry',
      'Are you sure you want to skip this mood check-in?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Skip',
          onPress: () => navigation.navigate('MainTabs', {screen: 'Home'}),
        },
      ]
    );
  };

  if (showManifestationPrompt) {
    return (
      <View style={styles.container}>
        <View style={styles.manifestationPrompt}>
          <Ionicons name="sparkles" size={48} color="#6366f1" />
          <Text style={styles.manifestationTitle}>
            Would you like to read your manifestations?
          </Text>
          <Text style={styles.manifestationSubtitle}>
            Take a moment to connect with your goals and reinforce your intentions
          </Text>
          <View style={styles.manifestationButtons}>
            <TouchableOpacity
              style={styles.manifestationNoButton}
              onPress={() => handleManifestationChoice(false)}>
              <Text style={styles.manifestationNoButtonText}>No, Thanks</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.manifestationYesButton}
              onPress={() => handleManifestationChoice(true)}>
              <Text style={styles.manifestationYesButtonText}>Yes, Let's Go!</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => navigation.navigate('MainTabs', {screen: 'Home'})}>
          <Ionicons name="close" size={24} color="#111827" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Mood Check-in</Text>
          {fromNotification && (
            <View style={styles.notificationBadge}>
              <Ionicons name="notifications" size={12} color="#6366f1" />
              <Text style={styles.notificationText}>From Notification</Text>
            </View>
          )}
          {alarmId && alarmName && (
            <Text style={styles.subtitle}>{alarmName} Alarm</Text>
          )}
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.promptSection}>
          <Ionicons name="happy" size={32} color="#6366f1" />
          <Text style={styles.promptText}>
            How are you feeling right now?
          </Text>
          <Text style={styles.promptSubtext}>
            Take a moment to check in with yourself
          </Text>
        </View>

        <View style={styles.moodSelector}>
          <Text style={styles.sectionTitle}>How are you feeling?</Text>
          <View style={styles.moodScale}>
            {moodOptions.map((mood) => (
              <TouchableOpacity
                key={mood.value}
                style={[
                  styles.moodButton,
                  selectedMood === mood.value && styles.selectedMoodButton,
                ]}
                onPress={() => setSelectedMood(mood.value)}>
                <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                <Text style={[
                  styles.moodNumber,
                  selectedMood === mood.value && styles.selectedMoodNumber,
                ]}>
                  {mood.value}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {selectedMood && (
            <Text style={styles.moodLabel}>
              {moodOptions.find(m => m.value === selectedMood)?.label}
            </Text>
          )}
        </View>

        <View style={styles.tagsSection}>
          <Text style={styles.sectionTitle}>What's affecting your mood?</Text>
          <View style={styles.tagsContainer}>
            {tagOptions.map((tag) => (
              <TouchableOpacity
                key={tag}
                style={[
                  styles.tagButton,
                  selectedTags.includes(tag) && styles.selectedTagButton,
                ]}
                onPress={() => toggleTag(tag)}>
                <Text
                  style={[
                    styles.tagButtonText,
                    selectedTags.includes(tag) && styles.selectedTagButtonText,
                  ]}>
                  {tag}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.notesSection}>
          <Text style={styles.sectionTitle}>Notes (Optional)</Text>
          <TextInput
            style={styles.notesInput}
            placeholder="What's on your mind?"
            multiline
            numberOfLines={3}
            value={notes}
            onChangeText={setNotes}
          />
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.skipButton} onPress={skipEntry}>
            <Text style={styles.skipButtonText}>Skip</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.saveButton, (!selectedMood || isLoading) && styles.disabledSaveButton]} 
            onPress={saveMood}
            disabled={!selectedMood || isLoading}>
            {isLoading ? (
              <Text style={styles.saveButtonText}>Saving...</Text>
            ) : (
              <>
                <Ionicons name="save" size={20} color={selectedMood ? "#fff" : "#9ca3af"} />
                <Text style={[styles.saveButtonText, !selectedMood && styles.disabledSaveButtonText]}>
                  Save Entry
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
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
  closeButton: {
    marginRight: 16,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  notificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e0e7ff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  notificationText: {
    fontSize: 10,
    color: '#6366f1',
    marginLeft: 4,
    fontWeight: '600',
  },
  content: {
    padding: 20,
  },
  promptSection: {
    alignItems: 'center',
    paddingVertical: 32,
    marginBottom: 24,
  },
  promptText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
    textAlign: 'center',
  },
  promptSubtext: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 8,
    textAlign: 'center',
  },
  moodSelector: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  moodScale: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  moodButton: {
    width: 60,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  selectedMoodButton: {
    backgroundColor: '#6366f1',
    borderWidth: 2,
    borderColor: '#4f46e5',
  },
  moodEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  moodNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  selectedMoodNumber: {
    color: '#fff',
  },
  moodLabel: {
    fontSize: 16,
    color: '#6366f1',
    textAlign: 'center',
    fontWeight: '600',
  },
  tagsSection: {
    marginBottom: 32,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#e5e7eb',
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  selectedTagButton: {
    backgroundColor: '#6366f1',
  },
  tagButtonText: {
    fontSize: 14,
    color: '#6b7280',
  },
  selectedTagButtonText: {
    color: '#fff',
  },
  notesSection: {
    marginBottom: 32,
  },
  notesInput: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    fontSize: 16,
    minHeight: 80,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 20,
  },
  skipButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  skipButtonText: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '600',
  },
  saveButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366f1',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  disabledSaveButton: {
    backgroundColor: '#e5e7eb',
  },
  disabledSaveButtonText: {
    color: '#9ca3af',
  },
  manifestationPrompt: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#f9fafb',
  },
  manifestationTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
    marginTop: 24,
    marginBottom: 12,
  },
  manifestationSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 32,
  },
  manifestationButtons: {
    flexDirection: 'row',
    gap: 16,
    width: '100%',
    maxWidth: 300,
  },
  manifestationNoButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  manifestationNoButtonText: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '600',
  },
  manifestationYesButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: '#6366f1',
    alignItems: 'center',
  },
  manifestationYesButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
});

export default MoodRecordingScreen;