import { useState, useEffect, useCallback } from 'react';
import { usePremium } from '../context/PremiumContext';
import UpgradeAnalytics from '../services/UpgradeAnalytics';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface StrategicPrompt {
  trigger: string;
  shouldShow: boolean;
}

const USAGE_TRACKING_KEY = '@app_usage_tracking';

interface UsageTracking {
  firstLaunch: Date;
  totalSessions: number;
  lastSession: Date;
  moodRecordings: number;
  manifestationsCreated: number;
  alarmsCreated: number;
}

export const useStrategicUpgradePrompts = () => {
  const { premiumState } = usePremium();
  const [usageData, setUsageData] = useState<UsageTracking | null>(null);

  // Initialize usage tracking
  const initializeUsageTracking = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(USAGE_TRACKING_KEY);
      let usage: UsageTracking;

      if (stored) {
        const parsed = JSON.parse(stored);
        usage = {
          ...parsed,
          firstLaunch: new Date(parsed.firstLaunch),
          lastSession: new Date(parsed.lastSession),
          totalSessions: parsed.totalSessions + 1,
        };
      } else {
        usage = {
          firstLaunch: new Date(),
          totalSessions: 1,
          lastSession: new Date(),
          moodRecordings: 0,
          manifestationsCreated: 0,
          alarmsCreated: 0,
        };
      }

      usage.lastSession = new Date();
      await AsyncStorage.setItem(USAGE_TRACKING_KEY, JSON.stringify(usage));
      setUsageData(usage);
    } catch (error) {
      console.error('Error initializing usage tracking:', error);
    }
  }, []);

  // Track user actions
  const trackAction = useCallback(async (action: 'mood_recorded' | 'manifestation_created' | 'alarm_created') => {
    if (!usageData) return;

    try {
      const updated = { ...usageData };
      
      switch (action) {
        case 'mood_recorded':
          updated.moodRecordings++;
          break;
        case 'manifestation_created':
          updated.manifestationsCreated++;
          break;
        case 'alarm_created':
          updated.alarmsCreated++;
          break;
      }

      await AsyncStorage.setItem(USAGE_TRACKING_KEY, JSON.stringify(updated));
      setUsageData(updated);
    } catch (error) {
      console.error('Error tracking action:', error);
    }
  }, [usageData]);

  // Check if user has been using app for 3+ days
  const shouldShowThreeDayPrompt = useCallback(async (): Promise<boolean> => {
    if (!usageData || premiumState.isPremium) return false;

    const daysSinceFirstLaunch = Math.floor(
      (new Date().getTime() - usageData.firstLaunch.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceFirstLaunch >= 3 && usageData.totalSessions >= 5) {
      return await UpgradeAnalytics.shouldShowPrompt('three_day_usage');
    }

    return false;
  }, [usageData, premiumState.isPremium]);

  // Random psychology splash prompts (10% chance on app launch after 2+ sessions)
  const shouldShowRandomPrompt = useCallback(async (): Promise<boolean> => {
    if (!usageData || premiumState.isPremium) return false;

    if (usageData.totalSessions >= 2 && Math.random() < 0.1) {
      return await UpgradeAnalytics.shouldShowPrompt('random_psychology_splash');
    }

    return false;
  }, [usageData, premiumState.isPremium]);

  // Check for commitment-based prompts (after consistent usage)
  const shouldShowCommitmentPrompt = useCallback(async (): Promise<boolean> => {
    if (!usageData || premiumState.isPremium) return false;

    // Show if user has been consistently active
    const isConsistent = usageData.moodRecordings >= 5 || 
                        usageData.manifestationsCreated >= 2 || 
                        usageData.alarmsCreated >= 1;

    if (isConsistent && usageData.totalSessions >= 3) {
      return await UpgradeAnalytics.shouldShowPrompt('three_day_usage');
    }

    return false;
  }, [usageData, premiumState.isPremium]);

  // Get current strategic prompts to show
  const getStrategicPrompts = useCallback(async (): Promise<StrategicPrompt[]> => {
    if (premiumState.isPremium) return [];

    const prompts: StrategicPrompt[] = [];

    // Check various strategic prompt conditions
    if (await shouldShowThreeDayPrompt()) {
      prompts.push({ trigger: 'three_day_usage', shouldShow: true });
    }

    if (await shouldShowRandomPrompt()) {
      prompts.push({ trigger: 'random_psychology_splash', shouldShow: true });
    }

    if (await shouldShowCommitmentPrompt()) {
      prompts.push({ trigger: 'three_day_usage', shouldShow: true });
    }

    return prompts;
  }, [shouldShowThreeDayPrompt, shouldShowRandomPrompt, shouldShowCommitmentPrompt, premiumState.isPremium]);

  // Initialize on hook mount
  useEffect(() => {
    initializeUsageTracking();
  }, [initializeUsageTracking]);

  return {
    usageData,
    trackAction,
    getStrategicPrompts,
    shouldShowThreeDayPrompt,
    shouldShowRandomPrompt,
    shouldShowCommitmentPrompt,
  };
};