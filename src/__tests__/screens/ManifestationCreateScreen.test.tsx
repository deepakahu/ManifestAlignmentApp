import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import ManifestationCreateScreen from '../../screens/Manifestation/ManifestationCreateScreen';
import { TestProviders } from '../../test-utils/TestProviders';

const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
};

describe('ManifestationCreateScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(
      <TestProviders>
        <ManifestationCreateScreen navigation={mockNavigation} />
      </TestProviders>
    );
  });

  it('displays create manifestation header', () => {
    render(
      <TestProviders>
        <ManifestationCreateScreen navigation={mockNavigation} />
      </TestProviders>
    );
    
    expect(screen.getByText('New Manifestation')).toBeTruthy();
  });

  it('displays title input', () => {
    render(
      <TestProviders>
        <ManifestationCreateScreen navigation={mockNavigation} />
      </TestProviders>
    );
    
    expect(screen.getByPlaceholderText('What do you want to manifest?')).toBeTruthy();
  });

  it('displays description input', () => {
    render(
      <TestProviders>
        <ManifestationCreateScreen navigation={mockNavigation} />
      </TestProviders>
    );
    
    expect(screen.getByPlaceholderText('Describe your manifestation in detail... What does it look like when it comes true?')).toBeTruthy();
  });

  it('displays category selection', () => {
    render(
      <TestProviders>
        <ManifestationCreateScreen navigation={mockNavigation} />
      </TestProviders>
    );
    
    expect(screen.getByText('Personal')).toBeTruthy();
    expect(screen.getByText('Career')).toBeTruthy();
    expect(screen.getByText('Health')).toBeTruthy();
    expect(screen.getByText('Relationships')).toBeTruthy();
  });

  it('displays save button', () => {
    render(
      <TestProviders>
        <ManifestationCreateScreen navigation={mockNavigation} />
      </TestProviders>
    );
    
    expect(screen.getByText('Save')).toBeTruthy();
  });
});