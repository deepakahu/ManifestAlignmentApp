import { useState, useEffect, useCallback } from 'react';
import { usePremium } from '../context/PremiumContext';
import TrialService, { TrialData } from '../services/TrialService';

export const useTrialReminders = () => {
  const { premiumState, updateTrialData } = usePremium();
  const [currentReminder, setCurrentReminder] = useState<{
    reminderType: keyof TrialData['remindersSent'];
    daysRemaining: number;
  } | null>(null);
  const [showReminder, setShowReminder] = useState(false);

  const checkForReminders = useCallback(async () => {
    try {
      if (premiumState.isPremium || !premiumState.trialData) {
        return;
      }

      await updateTrialData();
      const trialData = await TrialService.getTrialData();
      const reminderCheck = TrialService.shouldShowReminder(trialData);

      if (reminderCheck.show && reminderCheck.reminderType) {
        setCurrentReminder({
          reminderType: reminderCheck.reminderType,
          daysRemaining: trialData.daysRemaining,
        });
        setShowReminder(true);
      }
    } catch (error) {
      console.error('Error checking for trial reminders:', error);
    }
  }, [premiumState.isPremium, premiumState.trialData, updateTrialData]);

  const handleReminderClose = useCallback(() => {
    setShowReminder(false);
    setCurrentReminder(null);
  }, []);

  // Check for reminders on app focus/launch
  useEffect(() => {
    checkForReminders();
  }, [checkForReminders]);

  // Periodic check for reminders (every 30 minutes when app is active)
  useEffect(() => {
    const interval = setInterval(() => {
      checkForReminders();
    }, 30 * 60 * 1000); // 30 minutes

    return () => clearInterval(interval);
  }, [checkForReminders]);

  return {
    showReminder,
    currentReminder,
    handleReminderClose,
    checkForReminders,
  };
};