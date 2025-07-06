import { MoodEntry, ManifestationEntry, Alarm } from '../types';

// Mock storage data
export const mockStorageData = {
  moodEntries: [
    {
      id: 'mood-1',
      mood: 5,
      timestamp: new Date('2023-01-01T09:00:00'),
      notes: 'Feeling great this morning!',
      tags: ['energetic', 'optimistic'],
    },
    {
      id: 'mood-2',
      mood: 3,
      timestamp: new Date('2023-01-01T15:00:00'),
      notes: 'Afternoon slump',
      tags: ['tired', 'neutral'],
    },
  ] as MoodEntry[],
  
  manifestationEntries: [
    {
      id: 'manifest-1',
      title: 'Career Advancement',
      description: 'I manifest a promotion and increased responsibilities in my career',
      category: 'Career',
      createdAt: new Date('2023-01-01T08:00:00'),
      isCompleted: false,
      readHistory: [],
    },
  ] as ManifestationEntry[],
  
  alarms: [
    {
      id: 'alarm-1',
      name: 'Morning Mood Check',
      isEnabled: true,
      interval: { hours: 8, minutes: 0 },
      dayStartTime: '06:00',
      dayEndTime: '10:00',
      activeDays: [true, true, true, true, true, true, true],
      createdAt: new Date('2023-01-01T08:00:00'),
    },
  ] as Alarm[],
};