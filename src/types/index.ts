export interface MoodEntry {
  id: string;
  mood: number; // 1-5 scale for new design
  notes: string;
  timestamp: Date;
  tags: string[];
  alarmId?: string; // Track which alarm triggered this entry
  alarmName?: string; // Display name of the alarm
  manifestationRead?: boolean; // Whether user read manifestation after mood entry
}

export interface ManifestationEntry {
  id: string;
  title: string;
  description: string;
  category: string;
  targetDate?: Date;
  isCompleted: boolean;
  createdAt: Date;
  completedAt?: Date;
  visualizationNotes?: string;
  affirmations?: string[];
  readHistory?: ManifestationReadEntry[];
}

export interface ManifestationReadEntry {
  readAt: Date;
  moodEntryId?: string;
  readDuration?: number; // in seconds
}

export interface User {
  id: string;
  name: string;
  email?: string;
  createdAt: Date;
  preferences: {
    notificationsEnabled: boolean;
    soundEnabled: boolean;
    theme: 'light' | 'dark';
    reminderFrequency?: 'daily' | 'weekly' | 'custom';
    reminderTime?: string;
  };
}

export interface Alarm {
  id: string;
  name: string;
  interval: {
    hours: number;
    minutes: number;
  } | 'test_mode'; // Flexible intervals or test mode
  dayStartTime: string; // HH:MM format
  dayEndTime: string; // HH:MM format
  activeDays: boolean[]; // [Sun, Mon, Tue, Wed, Thu, Fri, Sat]
  isEnabled: boolean;
  createdAt: Date;
  lastTriggered?: Date;
  nextTrigger?: Date;
  testInterval?: number; // For test mode: 1-5 minutes
  soundType?: 'default' | 'ambient-piano' | 'singing-bowl' | 'singing-bowl-hit' | 'tibetan-bowl-low' | 'calm-music' | 'relaxing-guitar';
}

export interface AppState {
  user: User | null;
  moodEntries: MoodEntry[];
  manifestationEntries: ManifestationEntry[];
  alarms: Alarm[];
  isLoading: boolean;
}

export type RootStackParamList = {
  MainTabs: undefined;
  AlarmSetup: { alarm?: Alarm };
  AlarmList: undefined;
  AlarmRinging: { alarmId: string; alarmName: string; fromNotification?: boolean };
  PhysiologyShift: { alarmId: string; alarmName: string; fromAlarm: boolean };
  MoodRecording: { alarmId?: string; alarmName?: string; fromAlarm?: boolean };
  Settings: undefined;
  Subscription: undefined;
  ManifestationCreate: { manifestation?: ManifestationEntry };
  ManifestationView: { manifestation: ManifestationEntry };
  ManifestationReading: { moodEntryId?: string; fromAlarm?: boolean };
};

export type MainTabParamList = {
  Home: undefined;
  MoodTracking: undefined;
  Manifestation: undefined;
  Profile: undefined;
};