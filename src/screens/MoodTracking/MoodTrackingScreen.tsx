import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  TextInput,
  Dimensions,
} from 'react-native';
import { useApp } from '../../context/AppContext';
import { MoodEntry } from '../../types';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';

const { width } = Dimensions.get('window');

const MoodTrackingScreen = () => {
  const { state, saveMoodEntry } = useApp();
  const [showMoodModal, setShowMoodModal] = useState(false);
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [moodNotes, setMoodNotes] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [trendsFilter, setTrendsFilter] = useState<'week' | 'month' | 'all'>('week');
  const [showTrendsModal, setShowTrendsModal] = useState(false);
  const [showTrendsGraph, setShowTrendsGraph] = useState(false);

  const moodEmojis = ['😢', '😕', '😐', '😊', '😄'];
  const moodLabels = ['Very Sad', 'Sad', 'Neutral', 'Happy', 'Very Happy'];
  const moodColors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#16a34a'];

  const commonTags = ['work', 'family', 'health', 'social', 'exercise', 'sleep', 'weather', 'achievement'];

  const handleRecordMood = () => {
    setShowMoodModal(true);
    setSelectedMood(null);
    setMoodNotes('');
    setSelectedTags([]);
  };

  const handleSaveMood = async () => {
    if (selectedMood === null) {
      Alert.alert('Select Mood', 'Please select a mood level before saving.');
      return;
    }

    try {
      await saveMoodEntry({
        mood: selectedMood,
        notes: moodNotes,
        tags: selectedTags,
      });
      
      
      setShowMoodModal(false);
      Alert.alert('Success', 'Your mood has been recorded!');
    } catch (error) {
      Alert.alert('Error', 'Failed to save mood entry. Please try again.');
    }
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getRecentMoods = () => {
    const allMoods = state.moodEntries
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    return allMoods.slice(0, 10);
  };

  const getAverageMood = () => {
    const recentMoods = getRecentMoods();
    if (recentMoods.length === 0) return 0;
    const sum = recentMoods.reduce((acc, entry) => acc + entry.mood, 0);
    return (sum / recentMoods.length).toFixed(1);
  };

  const getFilteredMoodEntries = () => {
    const now = new Date();
    const filterDate = new Date(now);
    
    switch (trendsFilter) {
      case 'week':
        filterDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        filterDate.setMonth(now.getMonth() - 1);
        break;
      case 'all':
        return state.moodEntries;
    }
    
    return state.moodEntries.filter(entry => 
      new Date(entry.timestamp) >= filterDate
    );
  };

  const getMoodChartData = () => {
    const filteredEntries = getFilteredMoodEntries();
    
    if (filteredEntries.length === 0) {
      return {
        labels: ['No Data'],
        datasets: [{
          data: [0],
          color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
          strokeWidth: 2
        }]
      };
    }
    
    // Sort by timestamp
    const sortedEntries = [...filteredEntries].sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    
    // Group by day and calculate average mood per day
    const dailyMoods = new Map<string, number[]>();
    
    sortedEntries.forEach(entry => {
      const date = new Date(entry.timestamp).toLocaleDateString();
      if (!dailyMoods.has(date)) {
        dailyMoods.set(date, []);
      }
      dailyMoods.get(date)!.push(entry.mood);
    });
    
    const labels: string[] = [];
    const data: number[] = [];
    
    dailyMoods.forEach((moods, date) => {
      const avgMood = moods.reduce((sum, mood) => sum + mood, 0) / moods.length;
      labels.push(new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
      data.push(Number(avgMood.toFixed(1)));
    });
    
    // Limit to last 14 points for readability
    const maxPoints = 14;
    if (labels.length > maxPoints) {
      const sliceStart = labels.length - maxPoints;
      return {
        labels: labels.slice(sliceStart),
        datasets: [{
          data: data.slice(sliceStart),
          color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
          strokeWidth: 2
        }]
      };
    }
    
    return {
      labels,
      datasets: [{
        data,
        color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
        strokeWidth: 2
      }]
    };
  };

  const getMoodTrend = () => {
    if (state.moodEntries.length < 2) return 'stable';
    
    // Sort entries by timestamp (newest first)
    const sortedEntries = [...state.moodEntries].sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    
    const recent = sortedEntries.slice(0, 5); // Last 5 entries
    const older = sortedEntries.slice(5, 10); // Previous 5 entries
    
    if (recent.length === 0 || older.length === 0) return 'stable';
    
    const recentAvg = recent.reduce((acc, entry) => acc + entry.mood, 0) / recent.length;
    const olderAvg = older.reduce((acc, entry) => acc + entry.mood, 0) / older.length;
    
    if (recentAvg > olderAvg + 0.3) return 'improving';
    if (recentAvg < olderAvg - 0.3) return 'declining';
    return 'stable';
  };

  const renderWelcomeMessage = () => (
    <View style={styles.welcomeContainer}>
      <Text style={styles.welcomeEmoji}>🌟</Text>
      <Text style={styles.welcomeTitle}>Welcome to Mood Tracking!</Text>
      <Text style={styles.welcomeText}>
        Start tracking your daily mood patterns to gain insights into your emotional well-being.
      </Text>
      <Text style={styles.welcomeSubtext}>
        Tap "Record Mood Now" to log your first mood entry.
      </Text>
    </View>
  );

  const renderMoodStats = () => (
    <View style={styles.statsContainer}>
      <View style={styles.statCard}>
        <Text style={styles.statNumber}>{state.moodEntries.length}</Text>
        <Text style={styles.statLabel}>Total Entries</Text>
      </View>
      <View style={styles.statCard}>
        <Text style={styles.statNumber}>{getAverageMood()}</Text>
        <Text style={styles.statLabel}>Average Mood</Text>
      </View>
      <View style={styles.statCard}>
        <Text style={styles.statNumber}>
          {getMoodTrend() === 'improving' ? '📈' : getMoodTrend() === 'declining' ? '📉' : '➡️'}
        </Text>
        <Text style={styles.statLabel}>Trend</Text>
      </View>
    </View>
  );

  const renderTrendsToggleButton = () => {
    if (state.moodEntries.length < 2) return null;
    
    return (
      <TouchableOpacity
        style={styles.trendsToggleButton}
        onPress={() => setShowTrendsGraph(!showTrendsGraph)}
        activeOpacity={0.7}
      >
        <Ionicons 
          name={showTrendsGraph ? "chevron-up" : "trending-up"} 
          size={20} 
          color="#6366f1" 
        />
        <Text style={styles.trendsToggleText}>
          {showTrendsGraph ? 'Hide Trends' : 'Show Trends'}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderTrendsSection = () => {
    if (state.moodEntries.length < 2 || !showTrendsGraph) return null;
    
    return (
      <View style={styles.trendsContainer}>
        <View style={styles.trendsHeader}>
          <Text style={styles.trendsTitle}>Mood Trends</Text>
          <TouchableOpacity
            style={styles.viewFullTrendsButton}
            onPress={() => {
              console.log('Trends button pressed'); // Debug log
              setShowTrendsModal(true);
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.viewFullTrendsText}>View Details</Text>
            <Ionicons name="chevron-forward" size={16} color="#6366f1" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.miniChart}>
          <LineChart
            data={getMoodChartData()}
            width={width - 60}
            height={120}
            yAxisInterval={1}
            chartConfig={{
              backgroundColor: '#ffffff',
              backgroundGradientFrom: '#ffffff',
              backgroundGradientTo: '#ffffff',
              decimalPlaces: 1,
              color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(100, 116, 139, ${opacity})`,
              style: {
                borderRadius: 16,
              },
              propsForDots: {
                r: '4',
                strokeWidth: '2',
                stroke: '#6366f1'
              }
            }}
            bezier
            style={{
              marginVertical: 8,
              borderRadius: 16,
            }}
            withInnerLines={false}
            withOuterLines={false}
            withVerticalLabels={false}
            withHorizontalLabels={false}
          />
        </View>
      </View>
    );
  };

  const renderTrendsModal = () => (
    <Modal
      visible={showTrendsModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowTrendsModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.trendsModalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Mood Trends</Text>
            <TouchableOpacity onPress={() => setShowTrendsModal(false)}>
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          <View style={styles.filterContainer}>
            <Text style={styles.filterTitle}>Time Range:</Text>
            <View style={styles.filterButtons}>
              {(['week', 'month', 'all'] as const).map((filter) => (
                <TouchableOpacity
                  key={filter}
                  style={[
                    styles.filterButton,
                    trendsFilter === filter && styles.filterButtonActive
                  ]}
                  onPress={() => setTrendsFilter(filter)}
                >
                  <Text style={[
                    styles.filterButtonText,
                    trendsFilter === filter && styles.filterButtonTextActive
                  ]}>
                    {filter === 'week' ? 'Past Week' : 
                     filter === 'month' ? 'Past Month' : 'All Time'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <ScrollView style={styles.trendsModalScroll}>
            {getFilteredMoodEntries().length > 0 ? (
              <View style={styles.fullChart}>
                <LineChart
                  data={getMoodChartData()}
                  width={width - 80}
                  height={220}
                  yAxisInterval={1}
                  chartConfig={{
                    backgroundColor: '#ffffff',
                    backgroundGradientFrom: '#ffffff',
                    backgroundGradientTo: '#ffffff',
                    decimalPlaces: 1,
                    color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
                    labelColor: (opacity = 1) => `rgba(100, 116, 139, ${opacity})`,
                    style: {
                      borderRadius: 16,
                    },
                    propsForDots: {
                      r: '4',
                      strokeWidth: '2',
                      stroke: '#6366f1'
                    }
                  }}
                  bezier
                  style={{
                    marginVertical: 8,
                    borderRadius: 16,
                  }}
                />
                
                <View style={styles.chartStats}>
                  <View style={styles.chartStat}>
                    <Text style={styles.chartStatLabel}>Average</Text>
                    <Text style={styles.chartStatValue}>
                      {getFilteredMoodEntries().length > 0 ? 
                        (getFilteredMoodEntries().reduce((sum, entry) => sum + entry.mood, 0) / getFilteredMoodEntries().length).toFixed(1) : 
                        '0.0'
                      }
                    </Text>
                  </View>
                  <View style={styles.chartStat}>
                    <Text style={styles.chartStatLabel}>Entries</Text>
                    <Text style={styles.chartStatValue}>{getFilteredMoodEntries().length}</Text>
                  </View>
                  <View style={styles.chartStat}>
                    <Text style={styles.chartStatLabel}>Trend</Text>
                    <Text style={styles.chartStatValue}>
                      {getMoodTrend() === 'improving' ? '📈' : getMoodTrend() === 'declining' ? '📉' : '➡️'}
                    </Text>
                  </View>
                </View>
              </View>
            ) : (
              <View style={styles.noDataContainer}>
                <Text style={styles.noDataText}>No mood data available for the selected time range.</Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const renderMoodHistory = () => {
    const recentMoods = getRecentMoods();
    
    return (
      <View style={styles.historyContainer}>
        <View style={styles.historyHeader}>
          <Text style={styles.historyTitle}>Recent Mood Entries</Text>
        </View>
        {recentMoods.map((entry, index) => (
          <View key={entry.id} style={styles.historyItem}>
            <View style={styles.historyMood}>
              <Text style={styles.historyEmoji}>{moodEmojis[entry.mood - 1]}</Text>
              <Text style={styles.historyMoodText}>{moodLabels[entry.mood - 1]}</Text>
            </View>
            <View style={styles.historyDetails}>
              <Text style={styles.historyDate}>{formatDate(new Date(entry.timestamp))}</Text>
              {entry.notes && (
                <Text style={styles.historyNotes} numberOfLines={2}>{entry.notes}</Text>
              )}
              {entry.tags.length > 0 && (
                <View style={styles.historyTags}>
                  {entry.tags.slice(0, 3).map((tag, tagIndex) => (
                    <Text key={tagIndex} style={styles.historyTag}>{tag}</Text>
                  ))}
                  {entry.tags.length > 3 && (
                    <Text style={styles.historyTag}>+{entry.tags.length - 3}</Text>
                  )}
                </View>
              )}
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderMoodModal = () => (
    <Modal
      visible={showMoodModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowMoodModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>How are you feeling?</Text>
            <TouchableOpacity onPress={() => setShowMoodModal(false)}>
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          <View style={styles.moodSelector}>
            {moodEmojis.map((emoji, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.moodButton,
                  selectedMood === index + 1 && {
                    backgroundColor: moodColors[index],
                    transform: [{ scale: 1.1 }],
                  }
                ]}
                onPress={() => setSelectedMood(index + 1)}
              >
                <Text style={styles.moodEmoji}>{emoji}</Text>
                <Text style={[
                  styles.moodLabel,
                  selectedMood === index + 1 && { color: '#fff', fontWeight: 'bold' }
                ]}>
                  {moodLabels[index]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.notesContainer}>
            <Text style={styles.notesTitle}>Notes (optional)</Text>
            <TextInput
              style={styles.notesInput}
              multiline
              placeholder="What influenced your mood today?"
              value={moodNotes}
              onChangeText={setMoodNotes}
              maxLength={500}
            />
          </View>

          <View style={styles.tagsContainer}>
            <Text style={styles.tagsTitle}>Tags (optional)</Text>
            <View style={styles.tagsGrid}>
              {commonTags.map((tag) => (
                <TouchableOpacity
                  key={tag}
                  style={[
                    styles.tagButton,
                    selectedTags.includes(tag) && styles.tagButtonSelected
                  ]}
                  onPress={() => toggleTag(tag)}
                >
                  <Text style={[
                    styles.tagText,
                    selectedTags.includes(tag) && styles.tagTextSelected
                  ]}>
                    {tag}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowMoodModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.saveButton,
                selectedMood === null && styles.saveButtonDisabled
              ]}
              onPress={handleSaveMood}
              disabled={selectedMood === null}
            >
              <Text style={styles.saveButtonText}>Save Mood</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Mood Tracking</Text>
          <Text style={styles.subtitle}>Monitor your emotional well-being</Text>
        </View>

        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={styles.recordButton}
            onPress={handleRecordMood}
          >
            <Ionicons name="add-circle" size={24} color="#fff" />
            <Text style={styles.recordButtonText}>Record Mood Now</Text>
          </TouchableOpacity>
        </View>

        {state.moodEntries.length === 0 ? (
          renderWelcomeMessage()
        ) : (
          <>
            {renderMoodStats()}
            {renderTrendsToggleButton()}
            {renderTrendsSection()}
            {renderMoodHistory()}
          </>
        )}
      </ScrollView>

      {renderMoodModal()}
      {renderTrendsModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
  },
  welcomeContainer: {
    alignItems: 'center',
    padding: 40,
    margin: 20,
    backgroundColor: '#fff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  welcomeEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 12,
    textAlign: 'center',
  },
  welcomeText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 12,
  },
  welcomeSubtext: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    paddingBottom: 10,
  },
  statCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 80,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6366f1',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
  },
  historyContainer: {
    margin: 20,
    marginTop: 10,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  historyItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  historyMood: {
    alignItems: 'center',
    marginRight: 16,
    minWidth: 80,
  },
  historyEmoji: {
    fontSize: 32,
    marginBottom: 4,
  },
  historyMoodText: {
    fontSize: 10,
    color: '#64748b',
    textAlign: 'center',
  },
  historyDetails: {
    flex: 1,
  },
  historyDate: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  historyNotes: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 4,
  },
  historyTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  historyTag: {
    fontSize: 10,
    color: '#6366f1',
    backgroundColor: '#e0e7ff',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 4,
    marginBottom: 2,
  },
  actionContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  recordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366f1',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  recordButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    width: width - 40,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  moodSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  moodButton: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    flex: 1,
    marginHorizontal: 2,
  },
  moodEmoji: {
    fontSize: 28,
    marginBottom: 4,
  },
  moodLabel: {
    fontSize: 10,
    color: '#64748b',
    textAlign: 'center',
  },
  notesContainer: {
    marginBottom: 20,
  },
  notesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  notesInput: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    minHeight: 80,
    textAlignVertical: 'top',
    fontSize: 14,
    color: '#374151',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  tagsContainer: {
    marginBottom: 24,
  },
  tagsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  tagsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tagButton: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  tagButtonSelected: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  tagText: {
    fontSize: 12,
    color: '#64748b',
  },
  tagTextSelected: {
    color: '#fff',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginRight: 8,
  },
  cancelButtonText: {
    color: '#64748b',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#6366f1',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginLeft: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#cbd5e1',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  trendsContainer: {
    margin: 20,
    marginTop: 10,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  trendsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  trendsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  viewFullTrendsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    minHeight: 44,
    minWidth: 44,
    justifyContent: 'center',
  },
  viewFullTrendsText: {
    color: '#6366f1',
    fontSize: 14,
    fontWeight: '500',
    marginRight: 4,
  },
  trendsToggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 20,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  trendsToggleText: {
    color: '#6366f1',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  miniChart: {
    alignItems: 'center',
  },
  trendsModalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    width: width - 40,
    maxHeight: '85%',
  },
  filterContainer: {
    marginBottom: 20,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
  },
  filterButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  filterButtonActive: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  trendsModalScroll: {
    flex: 1,
  },
  fullChart: {
    alignItems: 'center',
  },
  chartStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  chartStat: {
    alignItems: 'center',
  },
  chartStatLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  chartStatValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  noDataContainer: {
    alignItems: 'center',
    padding: 40,
  },
  noDataText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
  },
});

export default MoodTrackingScreen;