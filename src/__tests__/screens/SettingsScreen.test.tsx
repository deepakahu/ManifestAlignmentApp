import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import SettingsScreen from '../../screens/Settings/SettingsScreen';
import { StorageService } from '../../services/storage/StorageService';
import { AlarmService } from '../../services/AlarmService';
import { TestProviders } from '../../test-utils/TestProviders';

jest.mock('../../services/storage/StorageService');
jest.mock('../../services/AlarmService');

const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
};

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => mockNavigation,
}));

// Mock Alert as a global mock
global.Alert = {
  alert: jest.fn(),
};

describe('SettingsScreen', () => {
  const mockStorageService = StorageService as jest.Mocked<typeof StorageService>;
  const mockAlarmService = AlarmService as jest.Mocked<typeof AlarmService>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<TestProviders><SettingsScreen /></TestProviders>);
  });

  it('displays settings header', () => {
    render(<TestProviders><SettingsScreen /></TestProviders>);
    
    expect(screen.getByText('Settings')).toBeTruthy();
  });

  it('displays data management section', () => {
    render(<TestProviders><SettingsScreen /></TestProviders>);
    
    expect(screen.getByText('Data Management')).toBeTruthy();
    expect(screen.getByText('Export Data')).toBeTruthy();
    expect(screen.getByText('Clear All Data')).toBeTruthy();
  });

  it('displays alarms section', () => {
    render(<TestProviders><SettingsScreen /></TestProviders>);
    
    expect(screen.getByText('Alarms')).toBeTruthy();
    expect(screen.getByText('Refresh Alarms')).toBeTruthy();
    expect(screen.getByText('Manage Alarms')).toBeTruthy();
  });

  it('displays about section', () => {
    render(<TestProviders><SettingsScreen /></TestProviders>);
    
    expect(screen.getByText('About')).toBeTruthy();
    expect(screen.getByText('Version')).toBeTruthy();
    expect(screen.getByText('1.0.0')).toBeTruthy();
    expect(screen.getByText('Manifestation Alarm')).toBeTruthy();
  });

  it('displays export data button', () => {
    render(<TestProviders><SettingsScreen /></TestProviders>);
    
    expect(screen.getByText('Export Data')).toBeTruthy();
  });

  it('displays refresh alarms button', () => {
    render(<TestProviders><SettingsScreen /></TestProviders>);
    
    expect(screen.getByText('Refresh Alarms')).toBeTruthy();
  });
});