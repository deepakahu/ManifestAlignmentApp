import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import MoodTrackingScreen from '../../screens/MoodTracking/MoodTrackingScreen';
import { TestProviders } from '../../test-utils/TestProviders';

const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
};

describe('MoodTrackingScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(
      <TestProviders>
        <MoodTrackingScreen navigation={mockNavigation} />
      </TestProviders>
    );
  });

  it('displays mood tracking header', () => {
    render(
      <TestProviders>
        <MoodTrackingScreen navigation={mockNavigation} />
      </TestProviders>
    );
    
    expect(screen.getByText('Mood Tracking')).toBeTruthy();
  });

  it('displays record mood button', async () => {
    render(
      <TestProviders>
        <MoodTrackingScreen navigation={mockNavigation} />
      </TestProviders>
    );
    
    await waitFor(() => {
      expect(screen.getByText('Record Mood Now')).toBeTruthy();
    });
  });
});