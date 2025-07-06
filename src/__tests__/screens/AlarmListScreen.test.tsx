import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import AlarmListScreen from '../../screens/AlarmSetup/AlarmListScreen';
import { TestProviders } from '../../test-utils/TestProviders';

const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
};

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useFocusEffect: jest.fn(),
  useNavigation: () => mockNavigation,
  useRoute: () => ({ name: 'AlarmList', params: {} }),
}));

describe('AlarmListScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(
      <TestProviders>
        <AlarmListScreen navigation={mockNavigation} />
      </TestProviders>
    );
  });

  it('displays alarm list header', () => {
    render(
      <TestProviders>
        <AlarmListScreen navigation={mockNavigation} />
      </TestProviders>
    );
    
    expect(screen.getByText('Mood Alarms')).toBeTruthy();
  });

  it('displays create alarm button', () => {
    render(
      <TestProviders>
        <AlarmListScreen navigation={mockNavigation} />
      </TestProviders>
    );
    
    expect(screen.getByText('Create First Alarm')).toBeTruthy();
  });

  it('navigates to alarm setup when create button is pressed', async () => {
    render(
      <TestProviders>
        <AlarmListScreen navigation={mockNavigation} />
      </TestProviders>
    );
    
    const createButton = screen.getByText('Create First Alarm');
    fireEvent.press(createButton);
    
    await waitFor(() => {
      expect(mockNavigation.navigate).toHaveBeenCalledWith('AlarmSetup');
    });
  });

  it('displays empty state when no alarms exist', async () => {
    render(
      <TestProviders>
        <AlarmListScreen navigation={mockNavigation} />
      </TestProviders>
    );
    
    await waitFor(() => {
      expect(screen.getByText('No Alarms Set')).toBeTruthy();
    });
  });
});