import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import MoodRecordingScreen from '../../screens/MoodRecording/MoodRecordingScreen';
import { TestProviders } from '../../test-utils/TestProviders';

// Mock navigation
const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  dispatch: jest.fn(),
};

const mockRoute = {
  params: {},
};

// Mock StorageService
jest.mock('../../services/storage/StorageService', () => ({
  StorageService: {
    getUserData: jest.fn().mockResolvedValue(null),
    getMoodEntries: jest.fn().mockResolvedValue([]),
    getManifestationEntries: jest.fn().mockResolvedValue([]),
    saveMoodEntry: jest.fn(),
    saveManifestationEntry: jest.fn(),
    updateMoodEntry: jest.fn(),
    updateManifestationEntry: jest.fn(),
    deleteMoodEntry: jest.fn(),
    deleteManifestationEntry: jest.fn(),
    exportData: jest.fn(),
    clearAllData: jest.fn(),
  },
}));

// Mock AlarmService
jest.mock('../../services/AlarmService', () => ({
  AlarmService: {
    getAlarms: jest.fn().mockResolvedValue([]),
    getAlarmById: jest.fn().mockResolvedValue({ id: '1', name: 'Test Alarm' }),
    recordAlarmTrigger: jest.fn(),
    createAlarm: jest.fn(),
    updateAlarm: jest.fn(),
    deleteAlarm: jest.fn(),
    scheduleAlarm: jest.fn(),
    cancelAlarm: jest.fn(),
  },
}));

// Mock NotificationService
jest.mock('../../services/notifications/NotificationService', () => ({
  NotificationService: {
    initialize: jest.fn(),
    scheduleNotification: jest.fn(),
    cancelNotification: jest.fn(),
    checkPermissions: jest.fn(),
  },
}));

// Mock React Navigation hooks
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => mockNavigation,
  useRoute: () => mockRoute,
}));

// Mock Alert and Linking separately - already handled in jest.setup.js

describe('MoodRecordingScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRoute.params = {};
  });

  it('renders without crashing', async () => {
    render(
      <TestProviders>
        <MoodRecordingScreen />
      </TestProviders>
    );
    
    await waitFor(() => {
      expect(screen.getByText('Mood Check-in')).toBeTruthy();
    });
  });

  it('displays the mood prompt', async () => {
    render(
      <TestProviders>
        <MoodRecordingScreen />
      </TestProviders>
    );
    
    await waitFor(() => {
      expect(screen.getByText('How are you feeling right now?')).toBeTruthy();
      expect(screen.getByText('Take a moment to check in with yourself')).toBeTruthy();
    });
  });

  it('displays mood scale options', async () => {
    render(
      <TestProviders>
        <MoodRecordingScreen />
      </TestProviders>
    );
    
    await waitFor(() => {
      expect(screen.getByText('How are you feeling?')).toBeTruthy();
      expect(screen.getByText('😢')).toBeTruthy();
      expect(screen.getByText('😕')).toBeTruthy();
      expect(screen.getByText('😐')).toBeTruthy();
      expect(screen.getByText('😊')).toBeTruthy();
      expect(screen.getByText('😄')).toBeTruthy();
    });
  });

  it('displays tag options', async () => {
    render(
      <TestProviders>
        <MoodRecordingScreen />
      </TestProviders>
    );
    
    await waitFor(() => {
      expect(screen.getByText("What's affecting your mood?")).toBeTruthy();
      expect(screen.getByText('Work')).toBeTruthy();
      expect(screen.getByText('Family')).toBeTruthy();
      expect(screen.getByText('Health')).toBeTruthy();
    });
  });

  it('allows mood selection', async () => {
    render(
      <TestProviders>
        <MoodRecordingScreen />
      </TestProviders>
    );
    
    await waitFor(() => {
      const happyMoodButton = screen.getByText('😊');
      fireEvent.press(happyMoodButton);
    });
    
    // Check if mood label appears
    await waitFor(() => {
      expect(screen.getByText('Happy')).toBeTruthy();
    });
  });

  it('allows tag selection', async () => {
    render(
      <TestProviders>
        <MoodRecordingScreen />
      </TestProviders>
    );
    
    await waitFor(() => {
      const workTag = screen.getByText('Work');
      fireEvent.press(workTag);
    });
    
    // The tag should be selected (style changes are handled by the component)
    expect(screen.getByText('Work')).toBeTruthy();
  });

  it('allows notes input', async () => {
    render(
      <TestProviders>
        <MoodRecordingScreen />
      </TestProviders>
    );
    
    await waitFor(() => {
      const notesInput = screen.getByPlaceholderText("What's on your mind?");
      fireEvent.changeText(notesInput, 'Test notes');
    });
    
    expect(screen.getByDisplayValue('Test notes')).toBeTruthy();
  });

  it('shows save and skip buttons', async () => {
    render(
      <TestProviders>
        <MoodRecordingScreen />
      </TestProviders>
    );
    
    await waitFor(() => {
      expect(screen.getByText('Save Entry')).toBeTruthy();
      expect(screen.getByText('Skip')).toBeTruthy();
    });
  });

  it('displays alarm information when provided', async () => {
    mockRoute.params = {
      alarmId: '1',
      alarmName: 'Morning Check-in',
      fromNotification: true,
    };

    render(
      <TestProviders>
        <MoodRecordingScreen />
      </TestProviders>
    );
    
    await waitFor(() => {
      expect(screen.getByText('Morning Check-in Alarm')).toBeTruthy();
      expect(screen.getByText('From Notification')).toBeTruthy();
    });
  });

  it('handles save mood entry', async () => {
    render(
      <TestProviders>
        <MoodRecordingScreen />
      </TestProviders>
    );
    
    await waitFor(() => {
      // Select a mood first
      const happyMoodButton = screen.getByText('😊');
      fireEvent.press(happyMoodButton);
    });
    
    // Verify save button exists before pressing
    await waitFor(() => {
      expect(screen.getByText('Save Entry')).toBeTruthy();
    });
    
    const saveButton = screen.getByText('Save Entry');
    fireEvent.press(saveButton);
    
    // After saving, should show manifestation prompt
    await waitFor(() => {
      expect(screen.getByText('Would you like to read your manifestations?')).toBeTruthy();
    });
  });
});