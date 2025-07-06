import AsyncStorage from '@react-native-async-storage/async-storage';

export interface UpgradePromptEvent {
  id: string;
  trigger: string;
  timestamp: Date;
  action: 'shown' | 'dismissed' | 'upgraded';
  screen: string;
  sessionId: string;
}

export interface UpgradeAnalytics {
  totalPrompts: number;
  totalUpgrades: number;
  conversionRate: number;
  triggers: Record<string, {
    shown: number;
    dismissed: number;
    upgraded: number;
    conversionRate: number;
  }>;
  lastPromptTime: Date | null;
  promptFrequency: number; // prompts per day
}

class UpgradeAnalyticsService {
  private static instance: UpgradeAnalyticsService;
  private sessionId: string;
  private storageKey = '@upgrade_analytics';

  constructor() {
    this.sessionId = Date.now().toString();
  }

  static getInstance(): UpgradeAnalyticsService {
    if (!UpgradeAnalyticsService.instance) {
      UpgradeAnalyticsService.instance = new UpgradeAnalyticsService();
    }
    return UpgradeAnalyticsService.instance;
  }

  async trackPromptShown(trigger: string, screen: string): Promise<void> {
    try {
      const event: UpgradePromptEvent = {
        id: `${Date.now()}_${Math.random()}`,
        trigger,
        timestamp: new Date(),
        action: 'shown',
        screen,
        sessionId: this.sessionId,
      };

      await this.saveEvent(event);
      console.log(`[Analytics] Upgrade prompt shown: ${trigger} on ${screen}`);
    } catch (error) {
      console.error('Error tracking prompt shown:', error);
    }
  }

  async trackPromptDismissed(trigger: string, screen: string): Promise<void> {
    try {
      const event: UpgradePromptEvent = {
        id: `${Date.now()}_${Math.random()}`,
        trigger,
        timestamp: new Date(),
        action: 'dismissed',
        screen,
        sessionId: this.sessionId,
      };

      await this.saveEvent(event);
      console.log(`[Analytics] Upgrade prompt dismissed: ${trigger} on ${screen}`);
    } catch (error) {
      console.error('Error tracking prompt dismissed:', error);
    }
  }

  async trackUpgrade(trigger: string, screen: string): Promise<void> {
    try {
      const event: UpgradePromptEvent = {
        id: `${Date.now()}_${Math.random()}`,
        trigger,
        timestamp: new Date(),
        action: 'upgraded',
        screen,
        sessionId: this.sessionId,
      };

      await this.saveEvent(event);
      console.log(`[Analytics] Upgrade completed: ${trigger} from ${screen}`);
    } catch (error) {
      console.error('Error tracking upgrade:', error);
    }
  }

  async getAnalytics(): Promise<UpgradeAnalytics> {
    try {
      const events = await this.getEvents();
      
      const analytics: UpgradeAnalytics = {
        totalPrompts: 0,
        totalUpgrades: 0,
        conversionRate: 0,
        triggers: {},
        lastPromptTime: null,
        promptFrequency: 0,
      };

      const triggerStats: Record<string, { shown: number; dismissed: number; upgraded: number }> = {};

      events.forEach(event => {
        if (!triggerStats[event.trigger]) {
          triggerStats[event.trigger] = { shown: 0, dismissed: 0, upgraded: 0 };
        }

        triggerStats[event.trigger][event.action]++;

        if (event.action === 'shown') {
          analytics.totalPrompts++;
          if (!analytics.lastPromptTime || event.timestamp > analytics.lastPromptTime) {
            analytics.lastPromptTime = event.timestamp;
          }
        }

        if (event.action === 'upgraded') {
          analytics.totalUpgrades++;
        }
      });

      // Calculate conversion rates
      analytics.conversionRate = analytics.totalPrompts > 0 
        ? (analytics.totalUpgrades / analytics.totalPrompts) * 100 
        : 0;

      Object.keys(triggerStats).forEach(trigger => {
        const stats = triggerStats[trigger];
        analytics.triggers[trigger] = {
          ...stats,
          conversionRate: stats.shown > 0 ? (stats.upgraded / stats.shown) * 100 : 0,
        };
      });

      // Calculate prompt frequency (prompts per day)
      if (events.length > 0) {
        const oldestEvent = events.reduce((oldest, current) => 
          current.timestamp < oldest.timestamp ? current : oldest
        );
        const daysDiff = Math.max(1, 
          (new Date().getTime() - oldestEvent.timestamp.getTime()) / (1000 * 60 * 60 * 24)
        );
        analytics.promptFrequency = analytics.totalPrompts / daysDiff;
      }

      return analytics;
    } catch (error) {
      console.error('Error getting analytics:', error);
      return {
        totalPrompts: 0,
        totalUpgrades: 0,
        conversionRate: 0,
        triggers: {},
        lastPromptTime: null,
        promptFrequency: 0,
      };
    }
  }

  async shouldShowPrompt(trigger: string): Promise<boolean> {
    try {
      const analytics = await this.getAnalytics();
      
      // Don't show more than 3 prompts per day
      if (analytics.promptFrequency > 3) {
        return false;
      }

      // Don't show same trigger more than once per session
      const events = await this.getEvents();
      const sessionEvents = events.filter(e => 
        e.sessionId === this.sessionId && 
        e.trigger === trigger && 
        e.action === 'shown'
      );
      
      if (sessionEvents.length > 0) {
        return false;
      }

      // Don't show prompts too frequently (minimum 1 hour between prompts)
      if (analytics.lastPromptTime) {
        const hoursSinceLastPrompt = 
          (new Date().getTime() - analytics.lastPromptTime.getTime()) / (1000 * 60 * 60);
        if (hoursSinceLastPrompt < 1) {
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('Error checking if should show prompt:', error);
      return true; // Default to showing prompt if error
    }
  }

  private async saveEvent(event: UpgradePromptEvent): Promise<void> {
    try {
      const events = await this.getEvents();
      events.push(event);
      
      // Keep only last 1000 events to prevent storage bloat
      const limitedEvents = events.slice(-1000);
      
      await AsyncStorage.setItem(this.storageKey, JSON.stringify(limitedEvents));
    } catch (error) {
      console.error('Error saving analytics event:', error);
    }
  }

  private async getEvents(): Promise<UpgradePromptEvent[]> {
    try {
      const stored = await AsyncStorage.getItem(this.storageKey);
      if (!stored) return [];

      const events = JSON.parse(stored);
      return events.map((event: any) => ({
        ...event,
        timestamp: new Date(event.timestamp),
      }));
    } catch (error) {
      console.error('Error getting analytics events:', error);
      return [];
    }
  }

  async clearAnalytics(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.storageKey);
    } catch (error) {
      console.error('Error clearing analytics:', error);
    }
  }
}

export default UpgradeAnalyticsService.getInstance();