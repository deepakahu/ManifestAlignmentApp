import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import ManifestationViewScreen from '../../screens/Manifestation/ManifestationViewScreen';
import { TestProviders } from '../../test-utils/TestProviders';

const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
};

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => mockNavigation,
  useRoute: () => ({ params: { manifestationId: 'test-id' } }),
}));

const mockRoute = {
  params: {
    manifestationId: 'test-id',
  },
};

describe('ManifestationViewScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(
      <TestProviders>
        <ManifestationViewScreen navigation={mockNavigation} route={mockRoute} />
      </TestProviders>
    );
  });

  it('displays manifestation not found message', async () => {
    render(
      <TestProviders>
        <ManifestationViewScreen navigation={mockNavigation} route={mockRoute} />
      </TestProviders>
    );
    
    await waitFor(() => {
      expect(screen.getByText('Manifestation not found')).toBeTruthy();
    });
  });

  it('displays go back button', () => {
    render(
      <TestProviders>
        <ManifestationViewScreen navigation={mockNavigation} route={mockRoute} />
      </TestProviders>
    );
    
    const backButton = screen.getByText('Go Back');
    expect(backButton).toBeTruthy();
  });

  it('handles back navigation', async () => {
    render(
      <TestProviders>
        <ManifestationViewScreen navigation={mockNavigation} route={mockRoute} />
      </TestProviders>
    );
    
    const backButton = screen.getByText('Go Back');
    fireEvent.press(backButton);
    
    await waitFor(() => {
      expect(mockNavigation.goBack).toHaveBeenCalled();
    });
  });
});