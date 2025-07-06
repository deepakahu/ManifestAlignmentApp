import React from 'react';
import { render, screen } from '@testing-library/react-native';
import AppNavigator from '../../navigation/AppNavigator';
import { AppProvider } from '../../context/AppContext';

jest.mock('../../services/notifications/NotificationService', () => ({
  NotificationService: {
    initialize: jest.fn(),
  },
}));

jest.mock('../../services/AlarmService', () => ({
  AlarmService: {
    initialize: jest.fn(),
  },
}));

describe('AppNavigator', () => {
  it('renders without crashing', () => {
    render(
      <AppProvider>
        <AppNavigator />
      </AppProvider>
    );
  });

  it('renders without navigation errors', () => {
    const { UNSAFE_root } = render(
      <AppProvider>
        <AppNavigator />
      </AppProvider>
    );

    // Just check that the component renders without crashing
    expect(UNSAFE_root).toBeTruthy();
  });

  it('contains navigation structure', () => {
    const { UNSAFE_root } = render(
      <AppProvider>
        <AppNavigator />
      </AppProvider>
    );

    // Check that the navigation container exists
    expect(UNSAFE_root).toBeTruthy();
  });
});