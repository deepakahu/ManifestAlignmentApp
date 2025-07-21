import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import * as Linking from 'expo-linking';
import {Platform} from 'react-native';

// Configure notification handler for both iOS and Android
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true, // Enable badge for iOS
    shouldShowBanner: true,
    shouldShowList: true,
    priority: Platform.OS === 'android' ? Notifications.AndroidNotificationPriority.MAX : undefined,
  }),
});

export class NotificationService {
  private static navigationRef: any = null;

  static async initialize(navigationRef?: any): Promise<void> {
    this.navigationRef = navigationRef;
    
    try {
      await this.setupNotificationCategories();
      await this.registerForPushNotificationsAsync();
      this.setupNotificationListeners();
    } catch (error) {
      console.error('Error initializing notifications:', error);
    }
  }
  
  private static async setupNotificationCategories(): Promise<void> {
    // Setup iOS notification categories for better handling
    if (Platform.OS === 'ios') {
      await Notifications.setNotificationCategoryAsync('mood-reminder', [
        {
          identifier: 'open-app',
          buttonTitle: 'Track Mood',
          options: {
            opensAppToForeground: true,
          },
        },
        {
          identifier: 'dismiss',
          buttonTitle: 'Dismiss',
          options: {
            opensAppToForeground: false,
          },
        },
      ]);
    }
  }

  private static async registerForPushNotificationsAsync(): Promise<void> {
    let token;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('mood-reminders', {
        name: 'Mood Reminders',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
        sound: 'default', // Use system default sound
        enableVibrate: true,
        bypassDnd: false,
        showBadge: true,
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        // Request all notification permissions for iOS and Android
        const { status } = await Notifications.requestPermissionsAsync({
          ios: {
            allowAlert: true,
            allowBadge: true,
            allowSound: true,
            allowAnnouncements: true,
            allowCriticalAlerts: false,
          },
          android: {},
        });
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.warn('Permission not granted for notifications');
        return;
      }
      
      try {
        const projectId = Constants.expoConfig?.extra?.eas?.projectId || 
                         Constants.easConfig?.projectId;
        
        token = await Notifications.getExpoPushTokenAsync({
          projectId,
        });
        
        console.log('Push token:', token);
      } catch (error) {
        console.warn('Failed to get push token:', error);
      }
    } else {
      console.warn('Must use physical device for push notifications');
    }
  }

  private static setupNotificationListeners(): void {
    // Listen for notification received while app is in foreground
    Notifications.addNotificationReceivedListener((notification) => {
      console.log('Notification received:', notification);
    });

    // Listen for notification response (when user taps notification)
    Notifications.addNotificationResponseReceivedListener((response) => {
      const { actionIdentifier, notification } = response;
      const { data } = notification.request.content;
      
      console.log('Notification tapped:', { actionIdentifier, data });
      
      if (data?.type === 'mood_reminder' && this.navigationRef?.current) {
        // Add small delay to ensure navigation is ready
        setTimeout(() => {
          try {
            // Navigate to AlarmRinging screen instead of directly to MoodRecording
            this.navigationRef.current.navigate('AlarmRinging', {
              alarmId: data.alarmId,
              alarmName: data.alarmName,
              fromNotification: true,
            });
            console.log('Navigated to AlarmRinging with:', {
              alarmId: data.alarmId,
              alarmName: data.alarmName,
            });
          } catch (error) {
            console.error('Navigation error:', error);
            // Fallback to deep link
            this.handleDeepLink(data);
          }
        }, 100);
      }
    });
  }

  private static handleDeepLink(data: any): void {
    const url = `manifestexpo://alarm-ringing/${data.alarmId}?alarmName=${encodeURIComponent(data.alarmName || '')}`;
    
    Linking.openURL(url).catch((error: any) => {
      console.error('Deep link failed:', error);
    });
  }

  static async scheduleNotification(
    title: string,
    body: string,
    data: any,
    trigger: Date | number
  ): Promise<string> {
    try {
      const content: any = {
        title,
        body,
        data,
        sound: 'default',
      };
      
      // Add platform-specific content
      if (Platform.OS === 'ios') {
        content.badge = 1;
      } else if (Platform.OS === 'android') {
        content.priority = Notifications.AndroidNotificationPriority.HIGH;
      }
      
      const triggerConfig: any = trigger instanceof Date ? { date: trigger } : { seconds: trigger };
      
      // Add Android channel if needed
      if (Platform.OS === 'android' && trigger instanceof Date) {
        triggerConfig.channelId = 'mood-reminders';
      }
      
      const notificationId = await Notifications.scheduleNotificationAsync({
        content,
        trigger: triggerConfig,
      });
      
      return notificationId;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      throw error;
    }
  }

  static async cancelNotification(notificationId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (error) {
      console.error('Error canceling notification:', error);
      throw error;
    }
  }

  static async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error canceling all notifications:', error);
      throw error;
    }
  }

  static async getAllScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error getting scheduled notifications:', error);
      return [];
    }
  }

  static async scheduleAlarmNotification(
    alarmId: string,
    alarmName: string,
    triggerDate: Date,
    soundType: string = 'default'
  ): Promise<string> {
    const title = 'Mood Check-In';
    const body = `Time for your ${alarmName} mood check-in!`;
    const data = {
      type: 'mood_reminder',
      alarmId,
      alarmName,
    };

    // Map custom sound types to actual sound files or system sounds
    const getSoundForType = (type: string) => {
      // For custom sounds, we use the filenames as defined in app.json
      switch (type) {
        case 'ambient-piano':
          return Platform.OS === 'ios' ? 'Ambient Piano.mp3' : 'ambient_piano';
        case 'singing-bowl':
          return Platform.OS === 'ios' ? 'Singing Bowl.mp3' : 'singing_bowl';
        case 'singing-bowl-hit':
          return Platform.OS === 'ios' ? 'Singing Bowl Hit.mp3' : 'singing_bowl_hit';
        case 'tibetan-bowl-low':
          return Platform.OS === 'ios' ? 'Tibetan Bowl Low.mp3' : 'tibetan_bowl_low';
        case 'calm-music':
          return Platform.OS === 'ios' ? 'Calm Music.mp3' : 'calm_music';
        case 'relaxing-guitar':
          return Platform.OS === 'ios' ? 'Relaxing Guitar.mp3' : 'relaxing_guitar';
        default:
          return 'default';
      }
    };

    try {
      // Ensure the trigger date has seconds set to 0 for precise timing
      const preciseTriggerDate = new Date(triggerDate);
      preciseTriggerDate.setSeconds(0, 0);
      
      const customSound = getSoundForType(soundType);
      
      const notificationContent: any = {
        title,
        body,
        data,
        sound: customSound, // Use custom sound or 'default'
      };
      
      // Add platform-specific properties
      if (Platform.OS === 'android') {
        notificationContent.priority = Notifications.AndroidNotificationPriority.MAX;
        notificationContent.vibrate = [0, 250, 250, 250];
      } else if (Platform.OS === 'ios') {
        notificationContent.badge = 1;
        notificationContent.categoryIdentifier = 'mood-reminder';
        // For iOS, ensure sound is properly configured
        if (customSound !== 'default') {
          notificationContent.sound = customSound;
        }
      }
      
      const trigger: any = { date: preciseTriggerDate };
      
      // Add Android-specific channel
      if (Platform.OS === 'android') {
        trigger.channelId = 'mood-reminders';
      }
      
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: notificationContent,
        trigger,
      });
      
      return notificationId;
    } catch (error) {
      console.error('Error scheduling alarm notification:', error);
      throw error;
    }
  }

  static async getBadgeCountAsync(): Promise<number> {
    try {
      return await Notifications.getBadgeCountAsync();
    } catch (error) {
      console.error('Error getting badge count:', error);
      return 0;
    }
  }

  static async setBadgeCountAsync(count: number): Promise<void> {
    try {
      await Notifications.setBadgeCountAsync(count);
    } catch (error) {
      console.error('Error setting badge count:', error);
    }
  }
}