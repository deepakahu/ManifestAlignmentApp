import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { AppProvider } from './src/context/AppContext';
import AppNavigator from './src/navigation/AppNavigator';
import { AlarmPermissionGuard } from './src/components/AlarmPermissionGuard';
import { SubscriptionService } from './src/services/SubscriptionService';
import { RevenueCatService } from './src/services/RevenueCatService';

export default function App() {
  useEffect(() => {
    // Initialize services on app launch
    const initializeServices = async () => {
      // Initialize subscription service (manages local subscription state)
      await SubscriptionService.initialize();

      // Initialize RevenueCat (handles actual payments)
      await RevenueCatService.initialize();
    };

    initializeServices();
  }, []);

  return (
    <AlarmPermissionGuard>
      <AppProvider>
        <AppNavigator />
        <StatusBar style="auto" />
      </AppProvider>
    </AlarmPermissionGuard>
  );
}