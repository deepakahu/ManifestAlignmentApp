import React from 'react';
import { AppProvider } from '../context/AppContext';

interface TestProvidersProps {
  children: React.ReactNode;
}

export const TestProviders: React.FC<TestProvidersProps> = ({ children }) => {
  return (
    <AppProvider>
      {children}
    </AppProvider>
  );
};

export default TestProviders;