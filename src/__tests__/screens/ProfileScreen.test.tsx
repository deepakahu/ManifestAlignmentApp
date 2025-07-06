import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import ProfileScreen from '../../screens/Profile/ProfileScreen';
import { TestProviders } from '../../test-utils/TestProviders';

describe('ProfileScreen', () => {
  const mockNavigation = {
    navigate: jest.fn(),
  };

  beforeEach(() => {
    mockNavigation.navigate.mockClear();
  });

  it('renders without crashing', () => {
    render(
      <TestProviders>
        <ProfileScreen navigation={mockNavigation} />
      </TestProviders>
    );
  });

  it('displays profile header', () => {
    render(
      <TestProviders>
        <ProfileScreen navigation={mockNavigation} />
      </TestProviders>
    );
    
    expect(screen.getByText('Profile')).toBeTruthy();
  });

  it('displays menu items', () => {
    render(
      <TestProviders>
        <ProfileScreen navigation={mockNavigation} />
      </TestProviders>
    );
    
    expect(screen.getByText('Mood Alarms')).toBeTruthy();
    expect(screen.getByText('Settings')).toBeTruthy();
  });

  it('navigates to AlarmList when Mood Alarms is pressed', () => {
    render(
      <TestProviders>
        <ProfileScreen navigation={mockNavigation} />
      </TestProviders>
    );
    
    const moodAlarmsButton = screen.getByText('Mood Alarms');
    fireEvent.press(moodAlarmsButton);
    
    expect(mockNavigation.navigate).toHaveBeenCalledWith('AlarmList');
  });

  it('navigates to Settings when Settings is pressed', () => {
    render(
      <TestProviders>
        <ProfileScreen navigation={mockNavigation} />
      </TestProviders>
    );
    
    const settingsButton = screen.getByText('Settings');
    fireEvent.press(settingsButton);
    
    expect(mockNavigation.navigate).toHaveBeenCalledWith('Settings');
  });
});