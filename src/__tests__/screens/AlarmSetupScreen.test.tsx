import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import AlarmSetupScreen from '../../screens/AlarmSetup/AlarmSetupScreen';
import { TestProviders } from '../../test-utils/TestProviders';

const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
};

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => mockNavigation,
  useRoute: () => ({ params: {} }),
}));

// Mock Alert globally
global.Alert = {
  alert: jest.fn(),
};

describe('AlarmSetupScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(
      <TestProviders>
        <AlarmSetupScreen navigation={mockNavigation} />
      </TestProviders>
    );
  });

  it('displays alarm setup header', () => {
    render(
      <TestProviders>
        <AlarmSetupScreen navigation={mockNavigation} />
      </TestProviders>
    );
    
    expect(screen.getByText('Create Alarm')).toBeTruthy();
  });

  it('displays alarm name input', () => {
    render(
      <TestProviders>
        <AlarmSetupScreen navigation={mockNavigation} />
      </TestProviders>
    );
    
    expect(screen.getByPlaceholderText('Enter alarm name')).toBeTruthy();
  });

  it('displays day selection', () => {
    render(
      <TestProviders>
        <AlarmSetupScreen navigation={mockNavigation} />
      </TestProviders>
    );
    
    expect(screen.getByText('Active Days')).toBeTruthy();
    expect(screen.getByText('Sun')).toBeTruthy();
    expect(screen.getByText('Mon')).toBeTruthy();
  });

  it('displays time selection', () => {
    render(
      <TestProviders>
        <AlarmSetupScreen navigation={mockNavigation} />
      </TestProviders>
    );
    
    expect(screen.getByText('Day Start Time')).toBeTruthy();
    expect(screen.getByText('Day End Time')).toBeTruthy();
  });

  it('displays interval settings', () => {
    render(
      <TestProviders>
        <AlarmSetupScreen navigation={mockNavigation} />
      </TestProviders>
    );
    
    expect(screen.getByText('Reminder Interval')).toBeTruthy();
  });

  it('displays alarm name input', () => {
    render(
      <TestProviders>
        <AlarmSetupScreen navigation={mockNavigation} />
      </TestProviders>
    );
    
    expect(screen.getByPlaceholderText('Enter alarm name')).toBeTruthy();
  });
});