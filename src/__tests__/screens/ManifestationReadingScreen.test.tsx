import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import ManifestationReadingScreen from '../../screens/Manifestation/ManifestationReadingScreen';
import { TestProviders } from '../../test-utils/TestProviders';

const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
};

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => mockNavigation,
  useRoute: () => ({ params: {} }),
}));

describe('ManifestationReadingScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(
      <TestProviders>
        <ManifestationReadingScreen navigation={mockNavigation} />
      </TestProviders>
    );
  });

  it('displays empty state when no manifestations', () => {
    render(
      <TestProviders>
        <ManifestationReadingScreen navigation={mockNavigation} />
      </TestProviders>
    );
    
    expect(screen.getByText('No Manifestations to Read')).toBeTruthy();
  });

  it('displays empty state message', () => {
    render(
      <TestProviders>
        <ManifestationReadingScreen navigation={mockNavigation} />
      </TestProviders>
    );
    
    expect(screen.getByText('Create some manifestations first to unlock this beautiful reading experience.')).toBeTruthy();
  });

  it('displays got it button in empty state', () => {
    render(
      <TestProviders>
        <ManifestationReadingScreen navigation={mockNavigation} />
      </TestProviders>
    );
    
    const gotItButton = screen.getByText('Got it');
    fireEvent.press(gotItButton);
    
    expect(mockNavigation.navigate).toHaveBeenCalled();
  });
});