import AsyncStorage from '@react-native-async-storage/async-storage';

export interface TrialData {
  installDate: Date;
  trialStartDate: Date;
  trialEndDate: Date;
  isTrialActive: boolean;
  daysRemaining: number;
  trialUsagePatterns: {
    manifestationsCreated: number;
    moodEntriesRecorded: number;
    alarmsCreated: number;
    readingSessionsCompleted: number;
    trendsViewed: number;
    customSoundsUsed: number;
  };
  remindersSent: {
    day7: boolean;
    day15: boolean;
    day23: boolean;
    day28: boolean;
    day30: boolean;
  };
  hasSeenTrialEndedScreen: boolean;
}

class TrialService {
  private static instance: TrialService;
  private storageKey = '@trial_data';
  private readonly TRIAL_DURATION_DAYS = 30;

  static getInstance(): TrialService {
    if (!TrialService.instance) {
      TrialService.instance = new TrialService();
    }
    return TrialService.instance;
  }

  async initializeTrial(): Promise<TrialData> {
    try {
      const stored = await AsyncStorage.getItem(this.storageKey);
      
      if (stored) {
        // Existing user - load and update trial data
        const trialData = this.parseStoredTrialData(stored);
        const updatedData = this.calculateTrialStatus(trialData);
        await this.saveTrialData(updatedData);
        return updatedData;
      } else {
        // New user - create trial
        const now = new Date();
        const trialEndDate = new Date(now);
        trialEndDate.setDate(now.getDate() + this.TRIAL_DURATION_DAYS);

        const newTrialData: TrialData = {
          installDate: now,
          trialStartDate: now,
          trialEndDate,
          isTrialActive: true,
          daysRemaining: this.TRIAL_DURATION_DAYS,
          trialUsagePatterns: {
            manifestationsCreated: 0,
            moodEntriesRecorded: 0,
            alarmsCreated: 0,
            readingSessionsCompleted: 0,
            trendsViewed: 0,
            customSoundsUsed: 0,
          },
          remindersSent: {
            day7: false,
            day15: false,
            day23: false,
            day28: false,
            day30: false,
          },
          hasSeenTrialEndedScreen: false,
        };

        await this.saveTrialData(newTrialData);
        console.log('[Trial] New trial started for 30 days');
        return newTrialData;
      }
    } catch (error) {
      console.error('Error initializing trial:', error);
      // Fallback to expired trial if error
      return this.createExpiredTrialData();
    }
  }

  async getTrialData(): Promise<TrialData> {
    try {
      const stored = await AsyncStorage.getItem(this.storageKey);
      if (!stored) {
        return await this.initializeTrial();
      }

      const trialData = this.parseStoredTrialData(stored);
      return this.calculateTrialStatus(trialData);
    } catch (error) {
      console.error('Error getting trial data:', error);
      return this.createExpiredTrialData();
    }
  }

  async trackUsage(action: keyof TrialData['trialUsagePatterns']): Promise<void> {
    try {
      const trialData = await this.getTrialData();
      trialData.trialUsagePatterns[action]++;
      await this.saveTrialData(trialData);
      
      console.log(`[Trial] Tracked usage: ${action} (${trialData.trialUsagePatterns[action]})`);
    } catch (error) {
      console.error('Error tracking trial usage:', error);
    }
  }

  async markReminderSent(reminderDay: keyof TrialData['remindersSent']): Promise<void> {
    try {
      const trialData = await this.getTrialData();
      trialData.remindersSent[reminderDay] = true;
      await this.saveTrialData(trialData);
      
      console.log(`[Trial] Marked reminder sent: ${reminderDay}`);
    } catch (error) {
      console.error('Error marking reminder sent:', error);
    }
  }

  async markTrialEndedScreenSeen(): Promise<void> {
    try {
      const trialData = await this.getTrialData();
      trialData.hasSeenTrialEndedScreen = true;
      await this.saveTrialData(trialData);
    } catch (error) {
      console.error('Error marking trial ended screen seen:', error);
    }
  }

  getDaysElapsed(trialData: TrialData): number {
    const now = new Date();
    const elapsed = Math.floor(
      (now.getTime() - trialData.trialStartDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    return Math.max(0, elapsed);
  }

  shouldShowReminder(trialData: TrialData): { show: boolean; reminderType: keyof TrialData['remindersSent'] | null } {
    const daysElapsed = this.getDaysElapsed(trialData);
    
    if (daysElapsed >= 28 && !trialData.remindersSent.day28 && trialData.daysRemaining <= 2) {
      return { show: true, reminderType: 'day28' };
    }
    if (daysElapsed >= 23 && !trialData.remindersSent.day23 && trialData.daysRemaining <= 7) {
      return { show: true, reminderType: 'day23' };
    }
    if (daysElapsed >= 15 && !trialData.remindersSent.day15 && trialData.daysRemaining <= 15) {
      return { show: true, reminderType: 'day15' };
    }
    if (daysElapsed >= 7 && !trialData.remindersSent.day7 && trialData.daysRemaining <= 23) {
      return { show: true, reminderType: 'day7' };
    }
    
    return { show: false, reminderType: null };
  }

  getTrialReminderMessage(reminderType: keyof TrialData['remindersSent'], daysRemaining: number): {
    title: string;
    message: string;
    psychology: string;
  } {
    const messages = {
      day7: {
        title: 'Amazing Progress! 🌟',
        message: `You're building incredible manifestation habits! ${daysRemaining} days left in your trial.`,
        psychology: 'Your energy is shifting, your mindset is expanding. Keep building this momentum.',
      },
      day15: {
        title: 'Halfway Through Your Transformation! ⚡',
        message: `Loving your progress! ${daysRemaining} days left to cement these life-changing habits.`,
        psychology: 'You\'re proving to yourself that abundance is your natural state. This is just the beginning.',
      },
      day23: {
        title: 'Your Manifestation Power is Peaking! 🚀',
        message: `Only ${daysRemaining} days left to lock in your manifestation success...`,
        psychology: 'Successful people act decisively when they recognize value. Your future self is counting on this decision.',
      },
      day28: {
        title: 'Final Call for Your Million-Dollar Future! 💎',
        message: `Just ${daysRemaining} days left - don't lose the momentum you've built!`,
        psychology: 'The universe is testing your commitment right now. Will you choose abundance or limitation?',
      },
      day30: {
        title: 'Your Trial Journey Ends Today 🎯',
        message: 'You\'ve experienced unlimited manifestation power. Time to decide your path forward.',
        psychology: 'This moment defines whether you\'re ready for abundant thinking or returning to limited beliefs.',
      },
    };

    return messages[reminderType];
  }

  async endTrial(): Promise<void> {
    try {
      const trialData = await this.getTrialData();
      trialData.isTrialActive = false;
      trialData.daysRemaining = 0;
      await this.saveTrialData(trialData);
      
      console.log('[Trial] Trial ended - transitioning to freemium');
    } catch (error) {
      console.error('Error ending trial:', error);
    }
  }

  getUsageInsights(trialData: TrialData): {
    totalActions: number;
    mostUsedFeature: string;
    engagementLevel: 'low' | 'medium' | 'high';
    conversionLikelihood: number;
  } {
    const patterns = trialData.trialUsagePatterns;
    const totalActions = Object.values(patterns).reduce((sum, count) => sum + count, 0);
    
    // Find most used feature
    const entries = Object.entries(patterns);
    const mostUsed = entries.reduce((max, [key, value]) => value > max.value ? { key, value } : max, { key: '', value: 0 });
    
    // Calculate engagement level
    let engagementLevel: 'low' | 'medium' | 'high' = 'low';
    if (totalActions >= 20) engagementLevel = 'high';
    else if (totalActions >= 8) engagementLevel = 'medium';
    
    // Calculate conversion likelihood (0-100)
    let conversionLikelihood = 0;
    conversionLikelihood += Math.min(patterns.manifestationsCreated * 8, 40); // Max 40 points
    conversionLikelihood += Math.min(patterns.moodEntriesRecorded * 3, 30); // Max 30 points
    conversionLikelihood += Math.min(patterns.readingSessionsCompleted * 10, 20); // Max 20 points
    conversionLikelihood += Math.min(patterns.trendsViewed * 5, 10); // Max 10 points
    
    return {
      totalActions,
      mostUsedFeature: mostUsed.key,
      engagementLevel,
      conversionLikelihood: Math.min(conversionLikelihood, 100),
    };
  }

  private parseStoredTrialData(stored: string): TrialData {
    const parsed = JSON.parse(stored);
    return {
      ...parsed,
      installDate: new Date(parsed.installDate),
      trialStartDate: new Date(parsed.trialStartDate),
      trialEndDate: new Date(parsed.trialEndDate),
    };
  }

  private calculateTrialStatus(trialData: TrialData): TrialData {
    const now = new Date();
    const timeRemaining = trialData.trialEndDate.getTime() - now.getTime();
    const daysRemaining = Math.max(0, Math.ceil(timeRemaining / (1000 * 60 * 60 * 24)));
    
    return {
      ...trialData,
      daysRemaining,
      isTrialActive: daysRemaining > 0,
    };
  }

  private async saveTrialData(trialData: TrialData): Promise<void> {
    try {
      await AsyncStorage.setItem(this.storageKey, JSON.stringify(trialData));
    } catch (error) {
      console.error('Error saving trial data:', error);
    }
  }

  private createExpiredTrialData(): TrialData {
    const now = new Date();
    return {
      installDate: now,
      trialStartDate: now,
      trialEndDate: now,
      isTrialActive: false,
      daysRemaining: 0,
      trialUsagePatterns: {
        manifestationsCreated: 0,
        moodEntriesRecorded: 0,
        alarmsCreated: 0,
        readingSessionsCompleted: 0,
        trendsViewed: 0,
        customSoundsUsed: 0,
      },
      remindersSent: {
        day7: true,
        day15: true,
        day23: true,
        day28: true,
        day30: true,
      },
      hasSeenTrialEndedScreen: false,
    };
  }
}

export default TrialService.getInstance();