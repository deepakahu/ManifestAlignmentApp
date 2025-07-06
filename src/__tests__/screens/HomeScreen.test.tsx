import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import HomeScreen from '../../screens/Home/HomeScreen';
import { TestProviders } from '../../test-utils/TestProviders';

// Mock StorageService
jest.mock('../../services/storage/StorageService', () => ({
  StorageService: {
    getUserData: jest.fn().mockResolvedValue(null),
    getMoodEntries: jest.fn().mockResolvedValue([
      {
        id: '1',
        mood: 4,
        timestamp: new Date(),
        tags: ['happy'],
        notes: 'Great day!',
      },
    ]),
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
    createAlarm: jest.fn(),
    updateAlarm: jest.fn(),
    deleteAlarm: jest.fn(),
    scheduleAlarm: jest.fn(),
    cancelAlarm: jest.fn(),
  },
}));

// Mock notification test utilities
jest.mock('../../utils/notificationTest', () => ({
  testNotifications: jest.fn(),
  testNotificationFlow: jest.fn(),
  testDeepLink: jest.fn(),
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

// Mock navigation
const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  dispatch: jest.fn(),
};

describe('HomeScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', async () => {
    render(
      <TestProviders>
        <HomeScreen navigation={mockNavigation} />
      </TestProviders>
    );
    
    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeTruthy();
    });
  });

  it('displays the correct stats', async () => {
    render(
      <TestProviders>
        <HomeScreen navigation={mockNavigation} />
      </TestProviders>
    );
    
    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeTruthy();
    });
    
    // Should show 1 mood entry for today (from mock)
    expect(screen.getByText('1')).toBeTruthy();
    expect(screen.getByText("Today's Moods")).toBeTruthy();
    
    // Should show 0 active alarms
    expect(screen.getByText('0')).toBeTruthy();
    expect(screen.getAllByText('Active Alarms')).toHaveLength(2);
  });

  it('shows quick action buttons', async () => {
    render(
      <TestProviders>
        <HomeScreen navigation={mockNavigation} />
      </TestProviders>
    );
    
    await waitFor(() => {
      expect(screen.getByText('Track Mood Now')).toBeTruthy();
      expect(screen.getByText('Create Your First Alarm')).toBeTruthy();
    });
  });

  it('displays empty alarms state', async () => {
    render(
      <TestProviders>
        <HomeScreen navigation={mockNavigation} />
      </TestProviders>
    );
    
    await waitFor(() => {
      expect(screen.getByText('No Active Alarms')).toBeTruthy();
      expect(screen.getByText('Create your first mood tracking alarm to get started')).toBeTruthy();
    });
  });

  it('navigates to mood tracking when track mood button is pressed', async () => {
    render(
      <TestProviders>
        <HomeScreen navigation={mockNavigation} />
      </TestProviders>
    );
    
    await waitFor(() => {
      const trackMoodButton = screen.getByText('Track Mood Now');
      fireEvent.press(trackMoodButton);
    });
    
    expect(mockNavigation.navigate).toHaveBeenCalledWith('MoodTracking');
  });

  it('navigates to alarm setup when create alarm button is pressed', async () => {
    render(
      <TestProviders>
        <HomeScreen navigation={mockNavigation} />
      </TestProviders>
    );
    
    await waitFor(() => {
      const createAlarmButton = screen.getByText('Create Your First Alarm');
      fireEvent.press(createAlarmButton);
    });
    
    expect(mockNavigation.navigate).toHaveBeenCalledWith('AlarmSetup');
  });

  it('renders all main sections', async () => {
    render(
      <TestProviders>
        <HomeScreen navigation={mockNavigation} />
      </TestProviders>
    );
    
    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeTruthy();
      expect(screen.getByText('Quick Actions')).toBeTruthy();
      expect(screen.getAllByText('Active Alarms')).toHaveLength(2);
    });
  });
});